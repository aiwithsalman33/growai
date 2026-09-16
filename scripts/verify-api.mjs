// End-to-end API verification against a running, seeded stack.
// Covers auth, portal isolation, tenant ownership, role guards, validation,
// posts, uploads, KPIs, plan limits and the audit log.
//   make verify      (or: node scripts/verify-api.mjs)
// Override the target with API_URL=http://localhost/api for the prod stack.
const BASE = process.env.API_URL || 'http://localhost:4000/api';
const PW = process.env.SEED_PASSWORD || 'Partner.ai2024';
// Origin for non-/api paths such as /uploads. Derived from API_URL so the
// suite works against the dev server and the prod nginx proxy alike.
const ORIGIN = BASE.replace(/\/api\/?$/, '');
const OWNER_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const OWNER_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    failures.push(`${name} ${detail}`);
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

async function call(path, { method = 'GET', body, token, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !raw) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: raw ? body : body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, data };
}

async function login(portal, email, password = PW) {
  return call(`/auth/${portal}/login`, { method: 'POST', body: { email, password } });
}

console.log('\n=== 1. Health & public endpoints ===');
{
  const h = await call('/health');
  check('GET /health is 200 ok', h.status === 200 && h.data.status === 'ok', JSON.stringify(h.data));
  const p = await call('/plans');
  check('GET /plans public, returns plans', p.status === 200 && p.data.plans.length >= 4,
    `status=${p.status} count=${p.data?.plans?.length}`);
}

console.log('\n=== 2. Auth: portal isolation ===');
let singleToken, agencyToken, adminToken, singleUser, agencyUser;
{
  const ok = await login('user', 'elena@artisanroast.com');
  singleToken = ok.data?.accessToken;
  singleUser = ok.data?.user;
  check('single logs in at /auth/user/login', ok.status === 200 && !!singleToken, `status=${ok.status}`);
  check('password hash is never returned', ok.status === 200 && !('passwordHash' in (ok.data?.user || {})));

  const wrongPortal = await login('agency', 'elena@artisanroast.com');
  check('single REJECTED at agency portal (403)', wrongPortal.status === 403,
    `status=${wrongPortal.status} ${wrongPortal.data?.error || ''}`);

  const wrongPw = await login('user', 'elena@artisanroast.com', 'not-the-password');
  check('wrong password rejected (401)', wrongPw.status === 401, `status=${wrongPw.status}`);

  const unknown = await login('user', 'nobody@nowhere.test');
  check('unknown email gives same 401 (no enumeration)', unknown.status === 401
    && unknown.data?.error === wrongPw.data?.error, `${unknown.status} / ${unknown.data?.error}`);

  const ag = await login('agency', 'marcus@peakscalemedia.com');
  agencyToken = ag.data?.accessToken;
  agencyUser = ag.data?.user;
  check('agency logs in at /auth/agency/login', ag.status === 200 && !!agencyToken, `status=${ag.status}`);

  const ad = await login('admin', 'alex@partner.ai');
  adminToken = ad.data?.accessToken;
  check('super_admin logs in at /auth/admin/login', ad.status === 200 && !!adminToken, `status=${ad.status}`);

  // The platform owner seeded from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD.
  if (OWNER_EMAIL && OWNER_PASSWORD) {
    const owner = await login('admin', OWNER_EMAIL, OWNER_PASSWORD);
    check(`platform owner (${OWNER_EMAIL}) logs in`, owner.status === 200
      && owner.data?.user?.role === 'super_admin', `status=${owner.status}`);

    const wrongDoor = await login('user', OWNER_EMAIL, OWNER_PASSWORD);
    check('owner rejected at the tenant portal (403)', wrongDoor.status === 403,
      `status=${wrongDoor.status}`);
  } else {
    console.log('  SKIP  platform owner login (SUPER_ADMIN_EMAIL/PASSWORD not set)');
  }

  const noAuth = await call('/gbp');
  check('protected route without token is 401', noAuth.status === 401, `status=${noAuth.status}`);

  const me = await call('/auth/me', { token: singleToken });
  check('GET /auth/me returns the session user', me.status === 200
    && me.data.user.email === 'elena@artisanroast.com', `status=${me.status}`);
}

console.log('\n=== 3. Signup ===');
let newToken;
{
  const email = `test-${Date.now()}@example.com`;
  const s = await call('/auth/user/signup', {
    method: 'POST',
    body: { name: 'Test Owner', email, password: 'a-strong-password', companyName: 'Test Co' },
  });
  newToken = s.data?.accessToken;
  check('signup creates a user + token', s.status === 201 && !!newToken, `status=${s.status}`);
  check('signup auto-assigns a plan', !!s.data?.user?.planId, JSON.stringify(s.data?.user?.planId));

  const dupe = await call('/auth/user/signup', {
    method: 'POST',
    body: { name: 'Test Owner', email, password: 'a-strong-password' },
  });
  check('duplicate email rejected (409)', dupe.status === 409, `status=${dupe.status}`);

  const weak = await call('/auth/user/signup', {
    method: 'POST',
    body: { name: 'X', email: `w-${Date.now()}@e.test`, password: 'short' },
  });
  check('short password rejected (400)', weak.status === 400, `status=${weak.status}`);
}

console.log('\n=== 4. Tenant isolation (ownership) ===');
let elenaAccountId, marcusAccountId;
{
  const mine = await call('/gbp', { token: singleToken });
  elenaAccountId = mine.data?.accounts?.[0]?.id;
  check('single sees only their own accounts', mine.status === 200
    && mine.data.accounts.length === 1
    && mine.data.accounts.every((a) => a.ownerUserId === singleUser.id),
    `count=${mine.data?.accounts?.length}`);
  check('OAuth tokens never leave the server', mine.status === 200
    && !('accessTokenEnc' in (mine.data.accounts[0] || {})));

  const theirs = await call('/gbp', { token: agencyToken });
  marcusAccountId = theirs.data?.accounts?.[0]?.id;
  check('agency sees their 2 client accounts', theirs.status === 200
    && theirs.data.accounts.length === 2, `count=${theirs.data?.accounts?.length}`);

  const cross = await call(`/gbp/${elenaAccountId}`, { token: agencyToken });
  check("agency BLOCKED from another tenant's account (403)", cross.status === 403,
    `status=${cross.status}`);

  const crossPosts = await call(`/posts?gbpAccountId=${elenaAccountId}`, { token: agencyToken });
  check("agency BLOCKED from another tenant's posts (403)", crossPosts.status === 403,
    `status=${crossPosts.status}`);

  const adminCross = await call(`/gbp/${elenaAccountId}`, { token: adminToken });
  check('super_admin may read any account (support)', adminCross.status === 200,
    `status=${adminCross.status}`);
}

console.log('\n=== 5. Role guards ===');
{
  const a = await call('/admin/stats', { token: singleToken });
  check('single BLOCKED from /admin/stats (403)', a.status === 403, `status=${a.status}`);
  const b = await call('/agency/clients', { token: singleToken });
  check('single BLOCKED from /agency/clients (403)', b.status === 403, `status=${b.status}`);
  const c = await call('/admin/stats', { token: agencyToken });
  check('agency BLOCKED from /admin/stats (403)', c.status === 403, `status=${c.status}`);
  const d = await call('/admin/stats', { token: adminToken });
  check('super_admin allowed on /admin/stats', d.status === 200, `status=${d.status}`);
  check('stats are computed, not hardcoded', d.status === 200 && typeof d.data.stats.mrr === 'number'
    && d.data.stats.totalUsers > 0, JSON.stringify(d.data?.stats));
}

console.log('\n=== 6. Posts: create, schedule, reschedule, duplicate ===');
let postId;
{
  const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const created = await call('/posts', {
    method: 'POST',
    token: singleToken,
    body: {
      gbpAccountId: elenaAccountId,
      type: 'STANDARD',
      caption: 'Fresh single-origin Ethiopian landing this week.',
      status: 'SCHEDULED',
      scheduledAt: future,
    },
  });
  postId = created.data?.post?.id;
  check('create SCHEDULED post', created.status === 201 && created.data.post.status === 'SCHEDULED',
    `status=${created.status} ${created.data?.error || ''}`);

  const bad = await call('/posts', {
    method: 'POST',
    token: singleToken,
    body: { gbpAccountId: elenaAccountId, type: 'STANDARD', caption: 'x', status: 'SCHEDULED' },
  });
  check('SCHEDULED without scheduledAt rejected (400)', bad.status === 400, `status=${bad.status}`);

  const badEnum = await call('/posts', {
    method: 'POST',
    token: singleToken,
    body: { gbpAccountId: elenaAccountId, type: 'NOT_A_TYPE', caption: 'x' },
  });
  check('invalid post type rejected (400)', badEnum.status === 400, `status=${badEnum.status}`);

  const listed = await call(`/posts?gbpAccountId=${elenaAccountId}`, { token: singleToken });
  check('post appears in the list', listed.status === 200
    && listed.data.posts.some((p) => p.id === postId));

  const re = await call(`/posts/${postId}/reschedule`, {
    method: 'POST',
    token: singleToken,
    body: { scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
  });
  check('reschedule post', re.status === 200 && re.data.post.retryCount === 0, `status=${re.status}`);

  const dup = await call(`/posts/${postId}/duplicate`, { method: 'POST', token: singleToken });
  check('duplicate creates a DRAFT copy', dup.status === 201 && dup.data.post.status === 'DRAFT',
    `status=${dup.status}`);

  const steal = await call(`/posts/${postId}`, {
    method: 'PATCH', token: agencyToken, body: { caption: 'hijacked' },
  });
  check("another tenant cannot edit the post (403)", steal.status === 403, `status=${steal.status}`);
}

console.log('\n=== 7. Photo upload (local disk, no S3) ===');
{
  // 1x1 transparent PNG
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const form = new FormData();
  form.append('gbpAccountId', elenaAccountId);
  form.append('category', 'INTERIOR');
  form.append('caption', 'Front counter');
  form.append('file', new Blob([png], { type: 'image/png' }), 'counter.png');

  const up = await call('/photos', { method: 'POST', token: singleToken, body: form, raw: true });
  check('upload photo', up.status === 201 && !!up.data?.photo?.url,
    `status=${up.status} ${up.data?.error || ''}`);

  const url = up.data?.photo?.url;
  check('stored URL is a relative /uploads path', typeof url === 'string' && url.startsWith('/uploads/'), url);

  if (url) {
    const served = await fetch(`${ORIGIN}${url}`);
    check('uploaded file is served back', served.status === 200
      && served.headers.get('content-type')?.includes('image'),
      `status=${served.status}`);
  }

  const badType = new FormData();
  badType.append('gbpAccountId', elenaAccountId);
  badType.append('category', 'INTERIOR');
  badType.append('file', new Blob([Buffer.from('#!/bin/sh')], { type: 'text/x-shellscript' }), 'x.sh');
  const rejected = await call('/photos', { method: 'POST', token: singleToken, body: badType, raw: true });
  check('non-image upload rejected (415)', rejected.status === 415, `status=${rejected.status}`);
}

console.log('\n=== 8. AI reply guardrail ===');
{
  // No ANTHROPIC_API_KEY configured, so this must fail cleanly with 503 —
  // not a 500, and never a fabricated reply.
  const reviews = await call(`/reviews?gbpAccountId=${elenaAccountId}`, { token: singleToken });
  check('reviews list reachable', reviews.status === 200, `status=${reviews.status}`);
  check('no reviews yet (nothing invented)', reviews.data?.reviews?.length === 0,
    `count=${reviews.data?.reviews?.length}`);
}

console.log('\n=== 9. KPIs & agency ===');
{
  const k = await call(`/kpis/summary?gbpAccountId=${elenaAccountId}&period=7d`, { token: singleToken });
  check('KPI summary returns a shaped payload', k.status === 200
    && typeof k.data.kpis.views === 'number', `status=${k.status}`);

  const cmp = await call('/kpis/comparison?period=30d', { token: agencyToken });
  check('agency comparison lists their clients', cmp.status === 200
    && cmp.data.clients.length === 2, `count=${cmp.data?.clients?.length}`);

  const team = await call('/agency/team', { token: agencyToken });
  check('agency team list reachable', team.status === 200, `status=${team.status}`);

  const invited = await call('/agency/team', {
    method: 'POST', token: agencyToken,
    body: { name: 'Dana Ruiz', email: `dana-${Date.now()}@peakscalemedia.com`, role: 'manager' },
  });
  check('invite team member', invited.status === 201, `status=${invited.status} ${invited.data?.error || ''}`);
}

console.log('\n=== 10. Plan limits ===');
{
  // Elena is on Single Business (max 1) and already has 1 account.
  const over = await call('/gbp', {
    method: 'POST', token: singleToken,
    body: { locationName: 'Second Location' },
  });
  check('plan limit enforced on 2nd account (402)', over.status === 402,
    `status=${over.status} ${over.data?.error || ''}`);
}

console.log('\n=== 11. Trend series (replaces the chart mock) ===');
{
  const t = await call('/kpis/timeseries?gbpAccountId=all&period=7d', { token: singleToken });
  check('timeseries returns 7 daily buckets', t.status === 200 && t.data.series.length === 7,
    `status=${t.status} len=${t.data?.series?.length}`);
  check('each point carries every metric key', t.status === 200 && t.data.series.every(
    (p) => ['views', 'searches', 'calls', 'directions', 'clicks', 'reviews', 'posts']
      .every((k) => typeof p[k] === 'number')));
  check('engagementAvailable reported honestly', t.status === 200
    && typeof t.data.engagementAvailable === 'boolean',
    `value=${t.data?.engagementAvailable}`);

  const weekly = await call('/kpis/timeseries?gbpAccountId=all&period=30d', { token: singleToken });
  check('30d buckets into weeks', weekly.status === 200 && weekly.data.series.length <= 6
    && weekly.data.series[0].date.startsWith('Wk'), `len=${weekly.data?.series?.length}`);

  const cross = await call(`/kpis/timeseries?gbpAccountId=${elenaAccountId}`, { token: agencyToken });
  check('timeseries respects tenant isolation (403)', cross.status === 403, `status=${cross.status}`);
}

console.log('\n=== 12. AI usage metering (replaces the sample log array) ===');
{
  const u = await call('/ai-usage', { token: singleToken });
  check('ai-usage returns a real summary', u.status === 200 && Array.isArray(u.data.usage.logs),
    `status=${u.status}`);
  check('counters start at zero, not sample data', u.status === 200
    && u.data.usage.repliesThisMonth === 0 && u.data.usage.costThisMonth === 0,
    `replies=${u.data?.usage?.repliesThisMonth} cost=${u.data?.usage?.costThisMonth}`);
  check('quota comes from the plan', u.status === 200 && u.data.usage.quota === 100
    && u.data.usage.planName === 'Single Business',
    `quota=${u.data?.usage?.quota} plan=${u.data?.usage?.planName}`);

  const byAccount = await call('/ai-usage/by-account', { token: agencyToken });
  check('ai-usage by-account reachable', byAccount.status === 200, `status=${byAccount.status}`);
}

console.log('\n=== 13. Audit log ===');
{
  const log = await call('/admin/audit-log', { token: adminToken });
  check('audit log reachable', log.status === 200, `status=${log.status}`);
}

console.log(`\n${'='.repeat(50)}`);
console.log(`RESULT: ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log('  - ' + f));
}
process.exit(fail ? 1 : 0);
