const { google } = require('googleapis');
const env = require('../config/env');
const logger = require('../config/logger');
const { encrypt, decrypt } = require('./cryptoService');

// Google Business Profile is split across several APIs. Account and location
// metadata live on the discovery-backed v1 APIs; posts and reviews are still
// only on the v4 endpoint, which has no discovery document — those go out as
// authenticated raw requests through the same OAuth client.
const V4_BASE = 'https://mybusiness.googleapis.com/v4';

const SCOPES = ['https://www.googleapis.com/auth/business.manage'];

/**
 * True when real Google credentials are configured. When false the service
 * returns deterministic sample data so the rest of the stack (scheduling,
 * AI replies, the UI) can be exercised end-to-end before OAuth is set up.
 */
function isConfigured() {
  return Boolean(
    env.googleClientId &&
      env.googleClientSecret &&
      !env.googleClientId.startsWith('your_')
  );
}

function oauthClient() {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );
}

/** `state` round-trips the user id so the callback knows who is connecting. */
function getAuthUrl(state) {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force a refresh token even on re-connect
    scope: SCOPES,
    state,
  });
}

async function exchangeCode(code) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  return {
    accessTokenEnc: encrypt(tokens.access_token),
    refreshTokenEnc: encrypt(tokens.refresh_token),
    tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
}

/**
 * Builds an OAuth client for a stored account, refreshing the access token when
 * it has expired. Returns the client plus any new tokens to persist.
 */
async function clientForAccount(account) {
  const client = oauthClient();
  client.setCredentials({
    access_token: account.accessTokenEnc ? decrypt(account.accessTokenEnc) : null,
    refresh_token: account.refreshTokenEnc
      ? decrypt(account.refreshTokenEnc)
      : null,
    expiry_date: account.tokenExpiresAt
      ? new Date(account.tokenExpiresAt).getTime()
      : null,
  });

  let refreshed = null;
  const expired =
    !account.tokenExpiresAt || new Date(account.tokenExpiresAt) <= new Date();

  if (expired && account.refreshTokenEnc) {
    const { credentials } = await client.refreshAccessToken();
    refreshed = {
      accessTokenEnc: encrypt(credentials.access_token),
      tokenExpiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : null,
    };
  }

  return { client, refreshed };
}

async function v4(account, method, urlPath, body) {
  const { client } = await clientForAccount(account);
  const res = await client.request({
    url: `${V4_BASE}/${urlPath}`,
    method,
    data: body,
  });
  return res.data;
}

function locationPath(account) {
  return `accounts/${account.googleAccountId}/locations/${account.googleLocationId}`;
}

// ---------------------------------------------------------------------------
// Accounts & locations
// ---------------------------------------------------------------------------

async function listAccounts(account) {
  const { client } = await clientForAccount(account);
  const api = google.mybusinessaccountmanagement({ version: 'v1', auth: client });
  const { data } = await api.accounts.list();
  return data.accounts || [];
}

async function listLocations(account) {
  const { client } = await clientForAccount(account);
  const api = google.mybusinessbusinessinformation({ version: 'v1', auth: client });
  const { data } = await api.accounts.locations.list({
    parent: `accounts/${account.googleAccountId}`,
    readMask: 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories',
  });
  return data.locations || [];
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

function toLocalPost(post) {
  const body = {
    languageCode: 'en-US',
    summary: post.caption,
    topicType: post.type === 'STANDARD' ? 'STANDARD' : post.type,
  };

  if (post.imageUrl && /^https?:\/\//.test(post.imageUrl)) {
    body.media = [{ mediaFormat: 'PHOTO', sourceUrl: post.imageUrl }];
  }
  if (post.ctaLabel && post.ctaLink) {
    body.callToAction = { actionType: post.ctaLabel, url: post.ctaLink };
  }
  if (post.type === 'EVENT' || post.type === 'OFFER') {
    body.event = {
      title: post.eventTitle || post.caption.slice(0, 58),
      schedule: {
        startDate: toGoogleDate(post.eventStart),
        endDate: toGoogleDate(post.eventEnd),
      },
    };
  }
  if (post.type === 'OFFER') {
    body.offer = { couponCode: post.couponCode, termsConditions: post.terms };
  }
  return body;
}

function toGoogleDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

async function publishPost(account, post) {
  if (!isConfigured()) {
    logger.warn(
      { postId: post.id },
      'Google credentials not configured — simulating post publish'
    );
    return { name: `${locationPath(account)}/localPosts/simulated-${post.id}` };
  }
  return v4(account, 'POST', `${locationPath(account)}/localPosts`, toLocalPost(post));
}

async function deletePost(account, googlePostName) {
  if (!isConfigured()) return { simulated: true };
  return v4(account, 'DELETE', googlePostName);
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

const STAR_TO_NUMBER = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function normalizeReview(raw) {
  return {
    googleReviewId: raw.reviewId || raw.name,
    reviewerName: raw.reviewer?.displayName || 'Anonymous',
    reviewerPhoto: raw.reviewer?.profilePhotoUrl || null,
    rating: STAR_TO_NUMBER[raw.starRating] || 0,
    text: raw.comment || '',
    createdAt: raw.createTime ? new Date(raw.createTime) : new Date(),
    replyText: raw.reviewReply?.comment || null,
    repliedAt: raw.reviewReply?.updateTime
      ? new Date(raw.reviewReply.updateTime)
      : null,
  };
}

async function listReviews(account) {
  if (!isConfigured()) return [];
  const data = await v4(account, 'GET', `${locationPath(account)}/reviews`);
  return (data.reviews || []).map(normalizeReview);
}

async function replyToReview(account, googleReviewId, comment) {
  if (!isConfigured()) {
    logger.warn({ googleReviewId }, 'Google credentials not configured — simulating review reply');
    return { simulated: true, comment };
  }
  return v4(
    account,
    'PUT',
    `${locationPath(account)}/reviews/${googleReviewId}/reply`,
    { comment }
  );
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

async function listPhotos(account) {
  if (!isConfigured()) return [];
  const data = await v4(account, 'GET', `${locationPath(account)}/media`);
  return data.mediaItems || [];
}

async function uploadPhoto(account, { sourceUrl, category }) {
  if (!isConfigured()) return { simulated: true, sourceUrl };
  return v4(account, 'POST', `${locationPath(account)}/media`, {
    mediaFormat: 'PHOTO',
    locationAssociation: { category },
    sourceUrl,
  });
}

async function deletePhoto(account, googleMediaName) {
  if (!isConfigured()) return { simulated: true };
  return v4(account, 'DELETE', googleMediaName);
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

/**
 * Performance metrics come from the Business Profile Performance API. Without
 * credentials this returns zeroed counters so KPI endpoints stay shaped
 * correctly rather than erroring.
 */
async function fetchInsights(account, { startDate, endDate }) {
  if (!isConfigured()) {
    return { views: 0, searches: 0, calls: 0, directionRequests: 0, websiteClicks: 0 };
  }
  const { client } = await clientForAccount(account);
  const api = google.businessprofileperformance({ version: 'v1', auth: client });
  const { data } = await api.locations.fetchMultiDailyMetricsTimeSeries({
    location: `locations/${account.googleLocationId}`,
    dailyMetrics: [
      'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
      'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
      'CALL_CLICKS',
      'BUSINESS_DIRECTION_REQUESTS',
      'WEBSITE_CLICKS',
    ],
    'dailyRange.startDate.year': startDate.getFullYear(),
    'dailyRange.startDate.month': startDate.getMonth() + 1,
    'dailyRange.startDate.day': startDate.getDate(),
    'dailyRange.endDate.year': endDate.getFullYear(),
    'dailyRange.endDate.month': endDate.getMonth() + 1,
    'dailyRange.endDate.day': endDate.getDate(),
  });
  return summarizeMetrics(data);
}

function sumSeries(series) {
  return (series?.timeSeries?.datedValues || []).reduce(
    (total, point) => total + Number(point.value || 0),
    0
  );
}

function summarizeMetrics(data) {
  const byMetric = Object.fromEntries(
    (data.multiDailyMetricTimeSeries || [])
      .flatMap((entry) => entry.dailyMetricTimeSeries || [])
      .map((series) => [series.dailyMetric, sumSeries(series)])
  );

  const searches =
    (byMetric.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH || 0) +
    (byMetric.BUSINESS_IMPRESSIONS_MOBILE_SEARCH || 0);

  return {
    views: searches,
    searches,
    calls: byMetric.CALL_CLICKS || 0,
    directionRequests: byMetric.BUSINESS_DIRECTION_REQUESTS || 0,
    websiteClicks: byMetric.WEBSITE_CLICKS || 0,
  };
}

module.exports = {
  isConfigured,
  getAuthUrl,
  exchangeCode,
  clientForAccount,
  listAccounts,
  listLocations,
  publishPost,
  deletePost,
  listReviews,
  replyToReview,
  listPhotos,
  uploadPhoto,
  deletePhoto,
  fetchInsights,
};
