const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');
const { requireAuth } = require('../middleware/auth');

// CREATE - Add new target
router.post('/', requireAuth, targetController.createTarget);

// READ - Get all targets
router.get('/', requireAuth, targetController.getAllTargets);

// READ - Get target by ID
router.get('/:id', requireAuth, targetController.getTargetById);

// UPDATE - Update target
router.put('/:id', requireAuth, targetController.updateTarget);

// DELETE - Delete target
router.delete('/:id', requireAuth, targetController.deleteTarget);

module.exports = router;