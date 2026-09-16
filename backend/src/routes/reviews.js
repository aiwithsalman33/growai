const express = require('express');
const reviews = require('../controllers/reviewsController');
const { verifyJwt } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { resolveGbpAccount, resolveOwnedRecord } = require('../middleware/ownership');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
router.use(verifyJwt, requireRole('single', 'agency'));

const ownsReview = resolveOwnedRecord('gbpReview', 'id', 'record');

router.get('/', reviews.list);
router.post('/sync', resolveGbpAccount('body', 'gbpAccountId'), reviews.sync);

// Generating a draft costs an API call — rate limited per user, not per IP.
router.post('/:id/ai-reply', ownsReview, aiLimiter, reviews.generateAiReply);
router.post('/:id/reply', ownsReview, reviews.reply);

module.exports = router;
