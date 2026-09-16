const prisma = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');
const gbpService = require('./gbpService');

// Post scheduling is a Postgres poll, not a queue. There is no Redis and no
// BullMQ in this stack: every ~30s we ask for rows that are due, publish them,
// and write the outcome back onto the row. Retries are counted in
// `GbpPost.retryCount` rather than by a queue's retry machinery.

let timer = null;
let ticking = false; // one tick at a time — a slow publish must not overlap itself

async function claimDuePosts(limit = 25) {
  return prisma.gbpPost.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: new Date() },
      retryCount: { lt: env.schedulerMaxRetries },
    },
    include: { gbpAccount: true },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  });
}

async function publishOne(post) {
  const account = post.gbpAccount;

  if (!account || !account.connected) {
    throw new Error('GBP account is not connected');
  }

  await gbpService.publishPost(account, post);

  await prisma.gbpPost.update({
    where: { id: post.id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      lastError: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: 'system:scheduler',
      action: 'post.published',
      targetType: 'GbpPost',
      targetId: post.id,
      metadata: { gbpAccountId: post.gbpAccountId },
    },
  });

  logger.info({ postId: post.id }, 'Scheduled post published');
}

async function recordFailure(post, error) {
  const retryCount = post.retryCount + 1;
  const exhausted = retryCount >= env.schedulerMaxRetries;

  await prisma.gbpPost.update({
    where: { id: post.id },
    data: {
      retryCount,
      lastError: String(error.message || error).slice(0, 1000),
      // Stay SCHEDULED while retries remain so the next tick picks it up again.
      status: exhausted ? 'FAILED' : 'SCHEDULED',
    },
  });

  logger.warn(
    { postId: post.id, retryCount, exhausted, err: error.message },
    'Scheduled post failed to publish'
  );
}

async function tick() {
  if (ticking) return { skipped: true };
  ticking = true;

  let published = 0;
  let failed = 0;

  try {
    const due = await claimDuePosts();
    for (const post of due) {
      try {
        await publishOne(post);
        published += 1;
      } catch (err) {
        failed += 1;
        await recordFailure(post, err);
      }
    }
    if (due.length) {
      logger.info({ due: due.length, published, failed }, 'Scheduler tick complete');
    }
  } catch (err) {
    // A database blip must not kill the interval.
    logger.error({ err: err.message }, 'Scheduler tick failed');
  } finally {
    ticking = false;
  }

  return { published, failed };
}

function start() {
  if (timer) return timer;
  logger.info(
    { intervalMs: env.schedulerIntervalMs },
    'Starting post scheduler (Postgres polling)'
  );
  timer = setInterval(tick, env.schedulerIntervalMs);
  if (timer.unref) timer.unref(); // don't hold the process open during tests
  return timer;
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { start, stop, tick };
