const Joi = require('joi');
const prisma = require('../config/db');
const gbpService = require('../services/gbpService');
const uploadService = require('../services/uploadService');
const { accessibleAccountIds } = require('../middleware/ownership');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const CATEGORIES = [
  'LOGO',
  'COVER',
  'INTERIOR',
  'EXTERIOR',
  'PRODUCT',
  'TEAM',
  'IDENTITY',
  'AT_WORK',
];

const list = asyncHandler(async (req, res) => {
  const { gbpAccountId, category } = req.query;
  const allowed = await accessibleAccountIds(req.user);

  const where = {};
  if (gbpAccountId) where.gbpAccountId = gbpAccountId;
  if (allowed) where.gbpAccountId = gbpAccountId || { in: allowed };
  if (allowed && gbpAccountId && !allowed.includes(gbpAccountId)) {
    throw new ApiError(403, 'You do not have access to this GBP account');
  }
  if (category) where.category = category;

  const photos = await prisma.gbpPhoto.findMany({
    where,
    orderBy: { uploadedAt: 'desc' },
  });
  res.json({ photos });
});

/**
 * Multipart upload. The file lands on the `uploads_data` volume and the row
 * stores a relative `/uploads/...` URL — there is no object storage here.
 */
const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const { value, error } = Joi.object({
    gbpAccountId: Joi.string().uuid().required(),
    category: Joi.string().valid(...CATEGORIES).required(),
    caption: Joi.string().trim().max(400).allow('', null),
  }).validate(req.body, { abortEarly: false });

  if (error) {
    uploadService.removeByUrl(uploadService.publicUrl(req.file));
    throw new ApiError(400, 'Validation failed', error.details.map((d) => d.message));
  }

  const url = uploadService.publicUrl(req.file);

  const photo = await prisma.gbpPhoto.create({
    data: {
      gbpAccountId: value.gbpAccountId,
      category: value.category,
      caption: value.caption || null,
      url,
    },
  });

  // Push to Google only when the location is connected; the local copy is the
  // record either way.
  if (req.gbpAccount?.connected) {
    try {
      await gbpService.uploadPhoto(req.gbpAccount, {
        sourceUrl: url,
        category: value.category,
      });
    } catch {
      // A Google-side failure should not lose the uploaded file.
    }
  }

  res.status(201).json({ photo });
});

const remove = asyncHandler(async (req, res) => {
  uploadService.removeByUrl(req.record.url);
  await prisma.gbpPhoto.delete({ where: { id: req.record.id } });
  res.json({ success: true });
});

module.exports = { list, upload, remove, CATEGORIES };
