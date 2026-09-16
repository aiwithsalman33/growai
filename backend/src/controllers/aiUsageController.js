const prisma = require('../config/db');
const { accessibleAccountIds } = require('../middleware/ownership');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Real AI spend for the signed-in user. The settings panel used to render a
 * hardcoded sample array; these are the rows written by `recordUsage` on every
 * generation.
 */
const summary = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 200);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // Super admins look at the whole platform; everyone else at their own spend.
  const scope = req.user.role === 'super_admin' ? {} : { userId: req.user.id };

  const [logs, monthAgg, allTimeAgg, user] = await Promise.all([
    prisma.aiUsageLog.findMany({
      where: scope,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.aiUsageLog.aggregate({
      where: { ...scope, createdAt: { gte: monthStart } },
      _count: { _all: true },
      _sum: { totalTokens: true, costUsd: true },
    }),
    prisma.aiUsageLog.aggregate({
      where: scope,
      _count: { _all: true },
      _sum: { totalTokens: true, costUsd: true },
    }),
    prisma.user.findUnique({
      where: { id: req.user.id },
      include: { plan: true },
    }),
  ]);

  const quota = user?.plan?.aiReplyQuota ?? null;
  const usedThisMonth = monthAgg._count._all;

  res.json({
    usage: {
      logs,
      monthStart: monthStart.toISOString(),
      repliesThisMonth: usedThisMonth,
      tokensThisMonth: monthAgg._sum.totalTokens || 0,
      costThisMonth: Number((monthAgg._sum.costUsd || 0).toFixed(4)),
      repliesAllTime: allTimeAgg._count._all,
      tokensAllTime: allTimeAgg._sum.totalTokens || 0,
      costAllTime: Number((allTimeAgg._sum.costUsd || 0).toFixed(4)),
      // null means the plan carries no cap, not "unknown".
      quota,
      quotaRemaining: quota === null ? null : Math.max(0, quota - usedThisMonth),
      planName: user?.plan?.name || null,
    },
  });
});

/** Per-account breakdown, for the agency view. */
const byAccount = asyncHandler(async (req, res) => {
  const allowed = await accessibleAccountIds(req.user);

  const grouped = await prisma.aiUsageLog.groupBy({
    by: ['gbpAccountId'],
    where: allowed ? { gbpAccountId: { in: allowed } } : {},
    _count: { _all: true },
    _sum: { totalTokens: true, costUsd: true },
  });

  const accounts = await prisma.gbpAccount.findMany({
    where: { id: { in: grouped.map((g) => g.gbpAccountId).filter(Boolean) } },
    select: { id: true, locationName: true, clientLabel: true },
  });
  const nameById = Object.fromEntries(
    accounts.map((a) => [a.id, a.clientLabel || a.locationName])
  );

  res.json({
    accounts: grouped.map((row) => ({
      gbpAccountId: row.gbpAccountId,
      label: nameById[row.gbpAccountId] || 'Unassigned',
      replies: row._count._all,
      totalTokens: row._sum.totalTokens || 0,
      costUsd: Number((row._sum.costUsd || 0).toFixed(4)),
    })),
  });
});

module.exports = { summary, byAccount };
