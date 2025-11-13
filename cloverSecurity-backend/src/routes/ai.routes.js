const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Generate explanation for vulnerability
router.post('/explain/:vulnerabilityId', aiController.explainVulnerability);

// Get security advice for scan
router.get('/advice/:scanId', aiController.getSecurityAdvice);

// Chat with AI (custom query)
router.post('/chat', aiController.chatWithAI);

module.exports = router;