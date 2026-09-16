const express = require('express');
const photos = require('../controllers/photosController');
const { verifyJwt } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { resolveGbpAccount, resolveOwnedRecord } = require('../middleware/ownership');
const { uploadSingle } = require('../services/uploadService');

const router = express.Router();
router.use(verifyJwt, requireRole('single', 'agency'));

router.get('/', photos.list);

// multer runs first so the multipart text fields are parsed into req.body —
// the ownership check reads gbpAccountId from there.
router.post(
  '/',
  uploadSingle('photos', 'file'),
  resolveGbpAccount('body', 'gbpAccountId'),
  photos.upload
);

router.delete('/:id', resolveOwnedRecord('gbpPhoto', 'id', 'record'), photos.remove);

module.exports = router;
