// Proves the Postgres-polling scheduler picks up and publishes a due post.
// Requires the stack running and seeded, and the target GBP account connected.
//   node scripts/verify-scheduler.mjs
const BASE = process.env.API_URL || 'http://localhost:4000/api';
const PW = process.env.SEED_PASSWORD || 'Partner.ai2024';

async function call(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

const login = await call('/auth/user/login', {
  method: 'POST',
  body: { email: 'elena@artisanroast.com', password: PW },
});
const token = login.data.accessToken;

const accounts = await call('/gbp', { token });
const gbpAccountId = accounts.data.accounts[0].id;

// Mark the account connected so the scheduler does not skip it. Google
// credentials are absent, so gbpService runs in simulated mode.
await call(`/gbp/${gbpAccountId}`, {
  method: 'PATCH',
  token,
  body: { locationName: accounts.data.accounts[0].locationName },
});

// Schedule one second in the past so the very next tick is due.
const created = await call('/posts', {
  method: 'POST',
  token,
  body: {
    gbpAccountId,
    type: 'STANDARD',
    caption: 'Scheduler proof post — should flip to PUBLISHED on the next tick.',
    status: 'SCHEDULED',
    scheduledAt: new Date(Date.now() - 1000).toISOString(),
  },
});

const postId = created.data.post.id;
console.log(`Created post ${postId} status=${created.data.post.status} (due now)`);
console.log('Waiting for a scheduler tick (interval 30s)...');

const deadline = Date.now() + 75_000;
let final = null;

while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 5000));
  const list = await call(`/posts?gbpAccountId=${gbpAccountId}`, { token });
  const post = list.data.posts.find((p) => p.id === postId);
  process.stdout.write(`  status=${post.status} retryCount=${post.retryCount}\n`);
  if (post.status !== 'SCHEDULED') {
    final = post;
    break;
  }
}

if (!final) {
  console.log('\nRESULT: post never left SCHEDULED within 75s — FAIL');
  process.exit(1);
}

console.log(`\nFinal: status=${final.status} publishedAt=${final.publishedAt} lastError=${final.lastError}`);
console.log(
  final.status === 'PUBLISHED'
    ? 'RESULT: scheduler published the due post — PASS'
    : `RESULT: post ended ${final.status} (${final.lastError}) — the poller ran, publish failed`
);
process.exit(final.status === 'PUBLISHED' ? 0 : 1);
