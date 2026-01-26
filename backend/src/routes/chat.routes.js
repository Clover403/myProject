const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Get or create conversation
router.post('/conversations', chatController.getOrCreateConversation);

// Get all conversations
router.get('/conversations', chatController.getConversations);

// Get unread message count
router.get('/unread-count', chatController.getUnreadCount);

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', chatController.getMessages);

// Send a message
router.post('/messages', chatController.sendMessage);

// Mark conversation as read
router.post('/conversations/:conversationId/read', chatController.markConversationAsRead);

module.exports = router;
