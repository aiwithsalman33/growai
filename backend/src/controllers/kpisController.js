const prisma = require('../config/db');
const gbpService = require('../services/gbpService');
const { accessibleAccountIds } = require('../middleware/ownership');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

function rangeFor(period) {
  const days = PERIOD_DAYS[period] || 7;
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  // The comparison window immediately precedes the current one.
  const prevStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end, prevStart, days };
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

/**
 * Aggregates Google insights with locally-held review and post counts.
 * `gbpAccountId=all` rolls every account the caller can see into one summary,
 * which is what the agency dashboard shows.
 */
const summary = asyncHandler(async (req, res) => {
  const { gbpAccountId = 'all', period = '7d' } = req.query;
  const { start, end, prevStart } = rangeFor(period);

  const allowed = await accessibleAccountIds(req.user);
  let accountIds;

  if (gbpAccountId === 'all') {
    accountIds = allowed;
    if (!accountIds) {
      const all = await prisma.gbpAccount.findMany({ select: { id: true } });
      accountIds = all.map((a) => a.id);
    }
  } else {
    if (allowed && !allowed.includes(gbpAccountId)) {
      throw new ApiError(403, 'You do not have access to this GBP account');
    }
    accountIds = [gbpAccountId];
  }

  const accounts = await prisma.gbpAccount.findMany({
    where: { id: { in: accountIds } },
  });

  const totals = {
    views: 0,
    searches: 0,
    calls: 0,
    directionRequests: 0,
    websiteClicks: 0,
  };

  for (const account of accounts) {
    if (!account.connected) continue;
    try {
      const metrics = await gbpService.fetchInsights(account, {
        startDate: start,
        endDate: end,
      });
      for (const key of Object.keys(totals)) totals[key] += metrics[key] || 0;
    } catch {
      // A single unreachable location should not blank the whole dashboard.
    }
  }

  const [reviews, previousReviews, postCount] = await Promise.all([
    prisma.gbpReview.findMany({
      where: { gbpAccountId: { in: accountIds }, createdAt: { gte: start } },
      select: { rating: true },
    }),
    prisma.gbpReview.count({
      where: {
        gbpAccountId: { in: accountIds },
        createdAt: { gte: prevStart, lt: start },
      },
    }),
    prisma.gbpPost.count({
      where: { gbpAccountId: { in: accountIds }, createdAt: { gte: start } },
    }),
  ]);

  const avgRating = reviews.length
    ? Number(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
      )
    : 0;

  res.json({
    kpis: {
      gbpAccountId,
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
      ...totals,
      avgRating,
      reviewCount: reviews.length,
      postCount,
      reviewTrend: percentChange(reviews.length, previousReviews),
      // Insight trends need a second Google call per account; the API returns
      // zero rather than a fabricated number until that is wired up.
      viewsTrend: 0,
      callsTrend: 0,
      directionsTrend: 0,
      clicksTrend: 0,
    },
  });
});

/** Per-client rows for the agency comparison table. */
const comparison = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const { start } = rangeFor(period);

  const allowed = await accessibleAccountIds(req.user);
  const accounts = await prisma.gbpAccount.findMany({
    where: allowed ? { id: { in: allowed } } : {},
  });

  const rows = await Promise.all(
    accounts.map(async (account) => {
      const [reviews, posts] = await Promise.all([
        prisma.gbpReview.findMany({
          where: { gbpAccountId: account.id, createdAt: { gte: start } },
          select: { rating: true, replyText: true },
        }),
        prisma.gbpPost.count({
          where: { gbpAccountId: account.id, createdAt: { gte: start } },
        }),
      ]);

      const replied = reviews.filter((r) => r.replyText).length;

      return {
        gbpAccountId: account.id,
        label: account.clientLabel || account.locationName,
        connected: account.connected,
        reviewCount: reviews.length,
        avgRating: reviews.length
          ? Number(
              (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
            )
          : 0,
        replyRate: reviews.length
          ? Number(((replied / reviews.length) * 100).toFixed(1))
          : 0,
        postCount: posts,
        healthScore: account.healthScore ?? null,
      };
    })
  );

  res.json({ clients: rows });
});

/**
 * Daily (or weekly) points for the dashboard trend chart. Replaces the
 * hardcoded MOCK_TIMESERIES the chart used to import.
 *
 * Review and post counts come from our own tables, so they are always real.
 * Google-sourced engagement metrics need a connected account; without
 * credentials they stay at zero rather than being invented.
 */
const timeseries = asyncHandler(async (req, res) => {
  const { gbpAccountId = 'all', period = '7d' } = req.query;
  const { start, end, days } = rangeFor(period);

  const allowed = await accessibleAccountIds(req.user);
  let accountIds;

  if (gbpAccountId === 'all') {
    accountIds = allowed;
    if (!accountIds) {
      const all = await prisma.gbpAccount.findMany({ select: { id: true } });
      accountIds = all.map((a) => a.id);
    }
  } else {
    if (allowed && !allowed.includes(gbpAccountId)) {
      throw new ApiError(403, 'You do not have access to this GBP account');
    }
    accountIds = [gbpAccountId];
  }

  // 7 days stays daily; longer ranges bucket into weeks so the axis stays legible.
  const bucketDays = days <= 7 ? 1 : 7;
  const bucketCount = Math.ceil(days / bucketDays);

  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const from = new Date(start.getTime() + i * bucketDays * 86400000);
    const to = new Date(Math.min(from.getTime() + bucketDays * 86400000, end.getTime()));
    return {
      from,
      to,
      date:
        bucketDays === 1
          ? from.toLocaleDateString('en-US', { weekday: 'short' })
          : `Wk ${i + 1}`,
      views: 0,
      searches: 0,
      calls: 0,
      directions: 0,
      clicks: 0,
      reviews: 0,
      posts: 0,
    };
  });

  const [reviews, posts] = await Promise.all([
    prisma.gbpReview.findMany({
      where: { gbpAccountId: { in: accountIds }, createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
    prisma.gbpPost.findMany({
      where: { gbpAccountId: { in: accountIds }, createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    }),
  ]);

  const bucketFor = (date) => {
    const index = Math.floor((new Date(date) - start) / (bucketDays * 86400000));
    return buckets[Math.max(0, Math.min(index, buckets.length - 1))];
  };

  for (const review of reviews) bucketFor(review.createdAt).reviews += 1;
  for (const post of posts) bucketFor(post.createdAt).posts += 1;

  // Google engagement metrics, spread across the buckets we already built.
  const accounts = await prisma.gbpAccount.findMany({
    where: { id: { in: accountIds }, connected: true },
  });

  for (const account of accounts) {
    for (const bucket of buckets) {
      try {
        const metrics = await gbpService.fetchInsights(account, {
          startDate: bucket.from,
          endDate: bucket.to,
        });
        bucket.views += metrics.views || 0;
        bucket.searches += metrics.searches || 0;
        bucket.calls += metrics.calls || 0;
        bucket.directions += metrics.directionRequests || 0;
        bucket.clicks += metrics.websiteClicks || 0;
      } catch {
        // One unreachable location should not blank the chart.
      }
    }
  }

  res.json({
    series: buckets.map(({ from, to, ...point }) => point),
    // The UI uses this to explain an all-zero engagement chart instead of
    // silently showing flat lines.
    engagementAvailable: accounts.length > 0 && gbpService.isConfigured(),
  });
});

module.exports = { summary, comparison, timeseries };
