const express = require('express');
const posts = require('../controllers/postsController');
const { verifyJwt } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { resolveGbpAccount, resolveOwnedRecord } = require('../middleware/ownership');
const { uploadSingle } = require('../services/uploadService');

const router = express.Router();
router.use(verifyJwt, requireRole('single', 'agency'));

const ownsPost = resolveOwnedRecord('gbpPost', 'id', 'record');

router.get('/', posts.list);
router.post('/', resolveGbpAccount('body', 'gbpAccountId'), posts.create);

router.post('/image', uploadSingle('posts', 'file'), posts.uploadImage);

router.patch('/:id', ownsPost, posts.update);
router.delete('/:id', ownsPost, posts.remove);
router.post('/:id/publish', ownsPost, posts.publish);
router.post('/:id/reschedule', ownsPost, posts.reschedule);
router.post('/:id/duplicate', ownsPost, posts.duplicate);

module.exports = router;
