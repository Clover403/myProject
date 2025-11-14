const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { requireAuth } = require('../middleware/auth');

// CREATE - Start new scan
router.post('/', requireAuth, scanController.startScan);

// READ - Get all scans
router.get('/', requireAuth, scanController.getAllScans);

// READ - Get statistics (place before param routes to avoid conflicts)
router.get('/stats/summary', requireAuth, scanController.getStats);

// READ - Get scan status (for polling)
router.get('/:id/status', requireAuth, scanController.getScanStatus);

// READ - Get scan by ID
router.get('/:id', requireAuth, scanController.getScanById);

// UPDATE - Update scan notes
router.patch('/:id/notes', requireAuth, scanController.updateNotes);

// DELETE - Delete scan
router.delete('/:id', requireAuth, scanController.deleteScan);

module.exports = router;