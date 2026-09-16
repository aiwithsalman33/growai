const express = require('express');
const aiUsage = require('../controllers/aiUsageController');
const { verifyJwt } = require('../middleware/auth');

const router = express.Router();
router.use(verifyJwt);

router.get('/', aiUsage.summary);
router.get('/by-account', aiUsage.byAccount);

module.exports = router;
