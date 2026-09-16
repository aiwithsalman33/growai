const Joi = require('joi');
const prisma = require('../config/db');
const gbpService = require('../services/gbpService');
const uploadService = require('../services/uploadService');
const { accessibleAccountIds } = require('../middleware/ownership');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const postSchema = Joi.object({
  gbpAccountId: Joi.string().uuid().required(),
  type: Joi.string().valid('STANDARD', 'EVENT', 'OFFER', 'PRODUCT').required(),
  caption: Joi.string().trim().min(1).max(1500).required(),
  imageUrl: Joi.string().trim().max(1000).allow('', null),
  ctaLabel: Joi.string().trim().max(60).allow('', null),
  ctaLink: Joi.string().trim().max(1000).allow('', null),
  eventTitle: Joi.string().trim().max(200).allow('', null),
  eventStart: Joi.date().allow(null),
  eventEnd: Joi.date().allow(null),
  couponCode: Joi.string().trim().max(80).allow('', null),
  terms: Joi.string().trim().max(2000).allow('', null),
  status: Joi.string().valid('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED'),
  scheduledAt: Joi.date().allow(null),
});

const updateSchema = postSchema.fork(
  Object.keys(postSchema.describe().keys),
  (field) => field.optional()
);

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Validation failed', error.details.map((d) => d.message));
  }
  return value;
}

/** A post marked SCHEDULED is meaningless without a future timestamp. */
function assertScheduleIsCoherent(data) {
  if (data.status === 'SCHEDULED' && !data.scheduledAt) {
    throw new ApiError(400, 'A scheduled post needs a scheduledAt timestamp');
  }
}

const list = asyncHandler(async (req, res) => {
  const { gbpAccountId, status } = req.query;
  const allowed = await accessibleAccountIds(req.user);

  const where = {};
  if (gbpAccountId) where.gbpAccountId = gbpAccountId;
  if (status) where.status = status;
  if (allowed) where.gbpAccountId = gbpAccountId || { in: allowed };

  // A caller asking for one account must actually own it.
  if (allowed && gbpAccountId && !allowed.includes(gbpAccountId)) {
    throw new ApiError(403, 'You do not have access to this GBP account');
  }

  const posts = await prisma.gbpPost.findMany({
    where,
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
  });
  res.json({ posts });
});

const create = asyncHandler(async (req, res) => {
  const data = validate(postSchema, req.body);
  assertScheduleIsCoherent(data);

  const post = await prisma.gbpPost.create({
    data: { ...data, status: data.status || 'DRAFT' },
  });

  // Publishing now is explicit; anything scheduled is left to the poller.
  if (post.status === 'PUBLISHED') {
    await publishNow(post, req.gbpAccount);
  }

  res.status(201).json({ post });
});

async function publishNow(post, account) {
  await gbpService.publishPost(account, post);
  return prisma.gbpPost.update({
    where: { id: post.id },
    data: { status: 'PUBLISHED', publishedAt: new Date(), lastError: null },
  });
}

const update = asyncHandler(async (req, res) => {
  const data = validate(updateSchema, req.body);
  assertScheduleIsCoherent({ ...req.record, ...data });

  const post = await prisma.gbpPost.update({
    where: { id: req.record.id },
    // Editing a failed post is a fresh attempt, so the retry budget resets.
    data: { ...data, ...(data.status === 'SCHEDULED' ? { retryCount: 0 } : {}) },
  });
  res.json({ post });
});

const publish = asyncHandler(async (req, res) => {
  const post = await publishNow(req.record, req.gbpAccount);
  res.json({ post });
});

const reschedule = asyncHandler(async (req, res) => {
  const { scheduledAt } = validate(
    Joi.object({ scheduledAt: Joi.date().required() }),
    req.body
  );

  const post = await prisma.gbpPost.update({
    where: { id: req.record.id },
    data: { scheduledAt, status: 'SCHEDULED', retryCount: 0, lastError: null },
  });
  res.json({ post });
});

const duplicate = asyncHandler(async (req, res) => {
  const { id, createdAt, publishedAt, retryCount, lastError, ...rest } = req.record;
  const { gbpAccount, ...fields } = rest;

  const post = await prisma.gbpPost.create({
    data: {
      ...fields,
      caption: `${fields.caption} (copy)`.slice(0, 1500),
      status: 'DRAFT',
      scheduledAt: null,
      viewsCount: 0,
      clicksCount: 0,
    },
  });
  res.status(201).json({ post });
});

const remove = asyncHandler(async (req, res) => {
  // Drop the local image too, or the volume grows without bound.
  if (req.record.imageUrl) uploadService.removeByUrl(req.record.imageUrl);
  await prisma.gbpPost.delete({ where: { id: req.record.id } });
  res.json({ success: true });
});

/** Multipart image upload for the post composer. */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  res.status(201).json({ url: uploadService.publicUrl(req.file) });
});

module.exports = {
  list,
  create,
  update,
  publish,
  reschedule,
  duplicate,
  remove,
  uploadImage,
};
