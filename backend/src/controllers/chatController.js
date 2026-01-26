const { Conversation, Message, User } = require('../../models');
const { Op } = require('sequelize');

// Get or create conversation between two users
const getOrCreateConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.id;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    if (participantId === userId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if participant exists
    const participant = await User.findByPk(participantId);
    if (!participant) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { participant1Id: userId, participant2Id: participantId },
          { participant1Id: participantId, participant2Id: userId }
        ]
      },
      include: [
        { model: User, as: 'participant1', attributes: ['id', 'name', 'email', 'picture', 'role'] },
        { model: User, as: 'participant2', attributes: ['id', 'name', 'email', 'picture', 'role'] }
      ]
    });

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        participant1Id: userId,
        participant2Id: participantId
      });

      conversation = await Conversation.findByPk(conversation.id, {
        include: [
          { model: User, as: 'participant1', attributes: ['id', 'name', 'email', 'picture', 'role'] },
          { model: User, as: 'participant2', attributes: ['id', 'name', 'email', 'picture', 'role'] }
        ]
      });
    }

    res.json({ success: true, conversation });
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({ error: 'Failed to get or create conversation' });
  }
};

// Get all conversations for current user
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      include: [
        { model: User, as: 'participant1', attributes: ['id', 'name', 'email', 'picture', 'role'] },
        { model: User, as: 'participant2', attributes: ['id', 'name', 'email', 'picture', 'role'] }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.count({
          where: {
            conversationId: conv.id,
            senderId: { [Op.ne]: userId },
            isRead: false
          }
        });

        // Get last message
        const lastMessage = await Message.findOne({
          where: { conversationId: conv.id },
          order: [['createdAt', 'DESC']],
          include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }]
        });

        return {
          ...conv.toJSON(),
          unreadCount,
          lastMessage
        };
      })
    );

    res.json({ success: true, conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// Get messages for a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const offset = (page - 1) * limit;

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { conversationId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'picture'] }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    // Mark messages as read
    await Message.update(
      { isRead: true },
      {
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      messages,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.participant1Id !== senderId && conversation.participant2Id !== senderId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      senderId,
      content: content.trim()
    });

    // Update conversation's lastMessageAt
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Fetch message with sender info
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'picture'] }
      ]
    });

    res.status(201).json({ success: true, message: messageWithSender });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get total unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all conversations user is part of
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      attributes: ['id']
    });

    const conversationIds = conversations.map(c => c.id);

    const unreadCount = await Message.count({
      where: {
        conversationId: { [Op.in]: conversationIds },
        senderId: { [Op.ne]: userId },
        isRead: false
      }
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Mark conversation as read
const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of conversation
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Message.update(
      { isRead: true },
      {
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
          isRead: false
        }
      }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
  markConversationAsRead
};
