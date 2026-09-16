const express = require('express');
const auth = require('../controllers/authController');
const { verifyJwt } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Each portal gets its own signup/login pair so the server can reject a login
// aimed at the wrong portal — the same isolation App.tsx enforces client-side.
const userRouter = express.Router();
userRouter.post('/signup', authLimiter, auth.signup('single'));
userRouter.post('/login', authLimiter, auth.login('single'));

const agencyRouter = express.Router();
agencyRouter.post('/signup', authLimiter, auth.signup('agency'));
agencyRouter.post('/login', authLimiter, auth.login('agency'));

// No signup route: super admins are provisioned, never self-registered.
const adminRouter = express.Router();
adminRouter.post('/login', authLimiter, auth.login('super_admin'));

// Shared session endpoints.
const router = express.Router();
router.use('/user', userRouter);
router.use('/agency', agencyRouter);
router.use('/admin', adminRouter);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', verifyJwt, auth.me);
router.patch('/me', verifyJwt, auth.updateProfile);

module.exports = router;
