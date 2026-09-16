const express = require('express');
const admin = require('../controllers/adminController');
const { verifyJwt } = require('../middleware/auth');
const { requireExactRole } = require('../middleware/roleGuard');

// Every route here is super-admin only — `requireExactRole` rather than
// `requireRole`, which would give other roles an implicit pass.
const router = express.Router();
router.use(verifyJwt, requireExactRole('super_admin'));

router.get('/stats', admin.stats);
router.get('/audit-log', admin.auditLog);

router.get('/users', admin.listUsers);
router.get('/users/all', admin.listAllUsers);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);
router.post('/users/:id/impersonate', admin.impersonate);

router.get('/agencies', admin.listAgencies);

router.get('/pricing', admin.listPlans);
router.post('/pricing', admin.createPlan);
router.patch('/pricing/:id', admin.updatePlan);
router.delete('/pricing/:id', admin.deletePlan);

router.post('/seed', admin.reseed);

router.get('/settings', admin.getSettings);
router.patch('/settings', admin.updateSettings);

module.exports = router;
