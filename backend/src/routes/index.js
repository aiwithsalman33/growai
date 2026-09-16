const express = require('express');
const admin = require('../controllers/adminController');
const { verifyJwt } = require('../middleware/auth');
const gbpService = require('../services/gbpService');

const router = express.Router();

/**
 * Probed by the Docker healthcheck and by nginx. Reports what the process can
 * actually reach, so a degraded container is visible rather than silently "up".
 */
router.get('/health', async (req, res) => {
  const prisma = require('../config/db');
  let database = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'unreachable';
  }

  const status = database === 'ok' ? 200 : 503;
  res.status(status).json({
    status: status === 200 ? 'ok' : 'degraded',
    database,
    google: gbpService.isConfigured() ? 'configured' : 'not_configured',
    uptime: Math.round(process.uptime()),
  });
});

// Public: the marketing pricing page loads before anyone signs in.
router.get('/plans', admin.publicPlans);

router.use('/auth', require('./auth'));
router.use('/gbp', require('./gbp'));
router.use('/posts', require('./posts'));
router.use('/reviews', require('./reviews'));
router.use('/photos', require('./photos'));
router.use('/kpis', require('./kpis'));
router.use('/agency', require('./agency'));
router.use('/admin', require('./admin'));

// Changing your own subscription is a tenant action, not an admin one.
router.post('/billing/plan', verifyJwt, admin.changeOwnPlan);

module.exports = router;
