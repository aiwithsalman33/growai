const Anthropic = require('@anthropic-ai/sdk');
const env = require('../config/env');
const logger = require('../config/logger');

let client = null;

function getClient() {
  if (!env.anthropicApiKey || env.anthropicApiKey.startsWith('your_')) {
    const err = new Error(
      'ANTHROPIC_API_KEY is not configured — cannot generate AI replies.'
    );
    err.status = 503;
    throw err;
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return client;
}

const DEFAULT_PERSONA =
  'You are the owner of this business. You are warm, concise and specific.';

function buildSystemPrompt({ persona, businessName, signature }) {
  return [
    persona || DEFAULT_PERSONA,
    '',
    `You are writing a public reply to a Google Business Profile review for "${businessName}".`,
    '',
    'Rules:',
    '- Reply in 2-4 sentences. Public review replies are short.',
    '- Address the reviewer by first name when one is given.',
    '- Thank positive reviewers specifically; acknowledge the actual issue raised in a negative review and offer to make it right offline.',
    '- Never invent facts, discounts, policies, or events that the review does not mention.',
    '- Never dispute or argue with the reviewer.',
    '- Do not use emoji or hashtags.',
    '- Output only the reply text. No preamble, no quotes, no subject line.',
    signature ? `- End with this exact signature on its own line: ${signature}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildUserPrompt(review, customTone) {
  return [
    `Reviewer: ${review.reviewerName || 'Anonymous'}`,
    `Rating: ${review.rating} out of 5`,
    `Review: ${review.text || '(no text, rating only)'}`,
    customTone ? `\nAdditional tone instruction: ${customTone}` : null,
    '\nWrite the reply.',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Generates a draft reply. Never sends it — publishing is a separate, explicit
 * call so a human stays in the loop unless auto-reply is switched on.
 */
async function generateReply({ review, config = {}, businessName, customTone }) {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: config.modelName || env.anthropicModel,
    max_tokens: 1024, // a public review reply is a few sentences
    output_config: { effort: 'low' },
    system: buildSystemPrompt({
      persona: config.persona,
      businessName: businessName || 'our business',
      signature: config.signature,
    }),
    messages: [{ role: 'user', content: buildUserPrompt(review, customTone) }],
  });

  if (response.stop_reason === 'refusal') {
    logger.warn(
      { category: response.stop_details?.category },
      'Anthropic declined to generate a review reply'
    );
    const err = new Error('The AI declined to generate a reply for this review.');
    err.status = 422;
    throw err;
  }

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  if (!text) {
    const err = new Error('The AI returned an empty reply.');
    err.status = 502;
    throw err;
  }

  return text;
}

/**
 * True when this review qualifies for an unattended reply. Both conditions are
 * required — a config with auto-reply on still holds back low ratings, which
 * are the ones a human should see first.
 */
function shouldAutoReply(review, config) {
  if (!config || !config.autoReplyEnabled) return false;
  if (review.replyText) return false;
  const minRating = config.autoReplyMinRating ?? 4;
  return review.rating >= minRating;
}

module.exports = { generateReply, shouldAutoReply };
