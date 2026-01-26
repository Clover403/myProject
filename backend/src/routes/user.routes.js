const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/ethical-hackers', userController.getAllEthicalHackers);
router.get('/ethical-hackers/:id', userController.getEthicalHackerProfile);

// Admin only routes
router.get('/', requireAuth, requireAdmin, userController.getAllUsers);
router.get('/:id', requireAuth, requireAdmin, userController.getUserById);
router.patch('/:id/role', requireAuth, requireAdmin, userController.updateUserRole);
router.post('/ethack', requireAuth, requireAdmin, userController.createEthackUser);
router.delete('/:id', requireAuth, requireAdmin, userController.deleteUser);
router.patch('/:id/toggle-status', requireAuth, requireAdmin, userController.toggleUserStatus);

module.exports = router;
