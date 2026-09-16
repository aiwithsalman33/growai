const Joi = require('joi');
const prisma = require('../config/db');
const { mask } = require('../services/cryptoService');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const configSchema = Joi.object({
  persona: Joi.string().trim().max(4000),
  autoReplyEnabled: Joi.boolean(),
  autoReplyMinRating: Joi.number().integer().min(1).max(5),
  signature: Joi.string().trim().max(200).allow('', null),
  llmProvider: Joi.string().valid('anthropic', 'openai', 'google_gemini'),
  modelName: Joi.string().trim().max(120).allow('', null),
  apiKey: Joi.string().trim().max(200).allow('', null),
});

const DEFAULT_PERSONA =
  'You are the owner of this business. You are warm, concise and specific.';

/** Never returns a key — only the masked form the settings UI displays. */
const getAiConfig = asyncHandler(async (req, res) => {
  const config = await prisma.aiReplyConfig.findUnique({
    where: { gbpAccountId: req.gbpAccount.id },
  });

  res.json({
    config: config || {
      gbpAccountId: req.gbpAccount.id,
      persona: DEFAULT_PERSONA,
      autoReplyEnabled: false,
      autoReplyMinRating: 4,
      llmProvider: 'anthropic',
    },
  });
});

const updateAiConfig = asyncHandler(async (req, res) => {
  const { value, error } = configSchema.validate(req.body, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Validation failed', error.details.map((d) => d.message));
  }

  const { apiKey, ...fields } = value;
  // Only the mask is persisted; a bring-your-own key belongs in the operator's
  // environment, not in a column this API can read back.
  if (apiKey) fields.apiKeyMasked = mask(apiKey);

  const config = await prisma.aiReplyConfig.upsert({
    where: { gbpAccountId: req.gbpAccount.id },
    create: {
      gbpAccountId: req.gbpAccount.id,
      userId: req.user.id,
      persona: fields.persona || DEFAULT_PERSONA,
      ...fields,
    },
    update: fields,
  });

  res.json({ config });
});

module.exports = { getAiConfig, updateAiConfig };
