const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { requireAuth } = require('../middleware/auth');

// CREATE - Start new scan
router.post('/', requireAuth, scanController.startScan.bind(scanController));

// READ - Get daily scan usage (must be before :id routes)
router.get('/usage', requireAuth, scanController.getDailyScanUsage.bind(scanController));

// READ - Get all scans
router.get('/', requireAuth, scanController.getAllScans.bind(scanController));

// READ - Get statistics (place before param routes to avoid conflicts)
router.get('/stats/summary', requireAuth, scanController.getStats.bind(scanController));

// READ - Get scan status (for polling)
router.get('/:id/status', requireAuth, scanController.getScanStatus.bind(scanController));

// READ - Get scan by ID
router.get('/:id', requireAuth, scanController.getScanById.bind(scanController));

// UPDATE - Update scan notes
router.patch('/:id/notes', requireAuth, scanController.updateNotes.bind(scanController));

// DELETE - Delete scan
router.delete('/:id', requireAuth, scanController.deleteScan.bind(scanController));

module.exports = router;