const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');
const aiRateLimit = require('../middleware/aiRateLimit');

router.use(requireAuth);

// Get AI usage info (daily token usage)
router.get('/usage', aiController.getAIUsage.bind(aiController));

// Metadata for frontend configuration
router.get('/meta', aiController.getMeta.bind(aiController));

// Generate explanation for vulnerability
router.post('/explain/:vulnerabilityId', aiRateLimit, aiController.explainVulnerability.bind(aiController));

// Get security advice for scan
router.get('/advice/:scanId', aiRateLimit, aiController.getSecurityAdvice.bind(aiController));

// Chat with AI (custom query)
router.post('/chat', aiRateLimit, aiController.chatWithAI.bind(aiController));

module.exports = router;