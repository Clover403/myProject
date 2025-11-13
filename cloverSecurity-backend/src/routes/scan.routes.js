const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');

// CREATE - Start new scan
router.post('/', scanController.startScan);

// READ - Get all scans
router.get('/', scanController.getAllScans);

// READ - Get scan by ID
router.get('/:id', scanController.getScanById);

// READ - Get scan status (for polling)
router.get('/:id/status', scanController.getScanStatus);

// READ - Get statistics
router.get('/stats/summary', scanController.getStats);

// UPDATE - Update scan notes
router.patch('/:id/notes', scanController.updateNotes);

// DELETE - Delete scan
router.delete('/:id', scanController.deleteScan);

module.exports = router;