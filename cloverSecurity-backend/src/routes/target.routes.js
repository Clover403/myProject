const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');

// CREATE - Add new target
router.post('/', targetController.createTarget);

// READ - Get all targets
router.get('/', targetController.getAllTargets);

// READ - Get target by ID
router.get('/:id', targetController.getTargetById);

// UPDATE - Update target
router.put('/:id', targetController.updateTarget);

// DELETE - Delete target
router.delete('/:id', targetController.deleteTarget);

module.exports = router;