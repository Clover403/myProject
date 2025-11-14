const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');
const aiRateLimit = require('../middleware/aiRateLimit');

router.use(requireAuth);

// Metadata for frontend configuration
router.get('/meta', aiController.getMeta);

// Generate explanation for vulnerability
router.post('/explain/:vulnerabilityId', aiRateLimit, aiController.explainVulnerability);

// Get security advice for scan
router.get('/advice/:scanId', aiRateLimit, aiController.getSecurityAdvice);

// Chat with AI (custom query)
router.post('/chat', aiRateLimit, aiController.chatWithAI);

module.exports = router;