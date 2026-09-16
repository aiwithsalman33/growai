const express = require('express');
const kpis = require('../controllers/kpisController');
const { verifyJwt } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const router = express.Router();
router.use(verifyJwt, requireRole('single', 'agency'));

router.get('/summary', kpis.summary);
router.get('/comparison', kpis.comparison);

module.exports = router;
