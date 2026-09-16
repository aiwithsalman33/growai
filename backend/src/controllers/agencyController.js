const Joi = require('joi');
const prisma = require('../config/db');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Validation failed', error.details.map((d) => d.message));
  }
  return value;
}

// ---------------------------------------------------------------------------
// Clients — an agency's client list is its GBP accounts, enriched for the table
// ---------------------------------------------------------------------------

const listClients = asyncHandler(async (req, res) => {
  const ownerUserId = req.user.role === 'super_admin' ? undefined : req.user.id;

  const accounts = await prisma.gbpAccount.findMany({
    where: ownerUserId ? { ownerUserId } : {},
    include: {
      _count: { select: { posts: true, reviews: true, photos: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const clients = accounts.map(({ accessTokenEnc, refreshTokenEnc, ...account }) => ({
    ...account,
    postCount: account._count.posts,
    reviewCount: account._count.reviews,
    photoCount: account._count.photos,
  }));

  res.json({ clients });
});

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

const listTeam = asyncHandler(async (req, res) => {
  const members = await prisma.agencyTeamMember.findMany({
    where: { agencyId: req.user.id },
    orderBy: { invitedAt: 'asc' },
  });
  res.json({ members });
});

const inviteMember = asyncHandler(async (req, res) => {
  const data = validate(
    Joi.object({
      name: Joi.string().trim().min(2).max(120).required(),
      email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
      role: Joi.string().valid('admin', 'manager', 'contributor').required(),
      assignedClientIds: Joi.array().items(Joi.string().uuid()).default([]),
    }),
    req.body
  );

  const existing = await prisma.agencyTeamMember.findFirst({
    where: { agencyId: req.user.id, email: data.email },
  });
  if (existing) throw new ApiError(409, 'That email is already on your team');

  const member = await prisma.agencyTeamMember.create({
    data: { ...data, agencyId: req.user.id, status: 'pending' },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'team.invited',
      targetType: 'AgencyTeamMember',
      targetId: member.id,
    },
  });

  res.status(201).json({ member });
});

const updateMember = asyncHandler(async (req, res) => {
  const data = validate(
    Joi.object({
      name: Joi.string().trim().min(2).max(120),
      role: Joi.string().valid('admin', 'manager', 'contributor'),
      status: Joi.string().valid('active', 'pending'),
      assignedClientIds: Joi.array().items(Joi.string().uuid()),
    }),
    req.body
  );

  // Scope the update to this agency so an id from another tenant can't be hit.
  const { count } = await prisma.agencyTeamMember.updateMany({
    where: { id: req.params.id, agencyId: req.user.id },
    data,
  });
  if (!count) throw new ApiError(404, 'Team member not found');

  const member = await prisma.agencyTeamMember.findUnique({
    where: { id: req.params.id },
  });
  res.json({ member });
});

const removeMember = asyncHandler(async (req, res) => {
  const { count } = await prisma.agencyTeamMember.deleteMany({
    where: { id: req.params.id, agencyId: req.user.id },
  });
  if (!count) throw new ApiError(404, 'Team member not found');
  res.json({ success: true });
});

module.exports = { listClients, listTeam, inviteMember, updateMember, removeMember };
