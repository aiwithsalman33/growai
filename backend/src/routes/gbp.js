const express = require('express');
const gbp = require('../controllers/gbpController');
const settings = require('../controllers/settingsController');
const { verifyJwt } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { resolveGbpAccount } = require('../middleware/ownership');

const router = express.Router();

// Google redirects the browser here with no Authorization header — the signed
// `state` parameter carries identity instead, so this one route stays public.
router.get('/oauth/callback', gbp.oauthCallback);

router.use(verifyJwt, requireRole('single', 'agency'));

router.get('/', gbp.list);
router.post('/', gbp.create);

router.get('/:id', resolveGbpAccount('params', 'id'), gbp.getOne);
router.patch('/:id', resolveGbpAccount('params', 'id'), gbp.update);
router.delete('/:id', resolveGbpAccount('params', 'id'), gbp.remove);

router.post('/:id/oauth/start', resolveGbpAccount('params', 'id'), gbp.oauthStart);
router.post('/:id/disconnect', resolveGbpAccount('params', 'id'), gbp.disconnect);
router.get('/:id/locations', resolveGbpAccount('params', 'id'), gbp.listGoogleLocations);

// AI reply configuration is per GBP account.
router.get('/:id/ai-config', resolveGbpAccount('params', 'id'), settings.getAiConfig);
router.put('/:id/ai-config', resolveGbpAccount('params', 'id'), settings.updateAiConfig);

module.exports = router;
