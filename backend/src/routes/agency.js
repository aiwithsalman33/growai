const express = require('express');
const agency = require('../controllers/agencyController');
const { verifyJwt } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const router = express.Router();
router.use(verifyJwt, requireRole('agency'));

router.get('/clients', agency.listClients);

router.get('/team', agency.listTeam);
router.post('/team', agency.inviteMember);
router.patch('/team/:id', agency.updateMember);
router.delete('/team/:id', agency.removeMember);

module.exports = router;
