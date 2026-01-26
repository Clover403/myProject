const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Message, Conversation, User } = require('../../models');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} - ${socket.user.name}`);

    // Join user's personal room
    socket.join(`user_${socket.user.id}`);

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.user.id} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.user.id} left conversation ${conversationId}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;
        const senderId = socket.user.id;

        // Verify user is part of conversation
        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (conversation.participant1Id !== senderId && conversation.participant2Id !== senderId) {
          socket.emit('error', { message: 'Access denied' });
          return;
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

        // Emit to conversation room
        io.to(`conversation_${conversationId}`).emit('new_message', messageWithSender);

        // Get the other participant
        const otherParticipantId = conversation.participant1Id === senderId 
          ? conversation.participant2Id 
          : conversation.participant1Id;

        // Emit notification to other user
        io.to(`user_${otherParticipantId}`).emit('message_notification', {
          conversationId,
          message: messageWithSender,
          senderName: socket.user.name
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async (conversationId) => {
      try {
        const userId = socket.user.id;

        await Message.update(
          { isRead: true },
          {
            where: {
              conversationId,
              senderId: { [require('sequelize').Op.ne]: userId },
              isRead: false
            }
          }
        );

        // Notify sender that messages were read
        const conversation = await Conversation.findByPk(conversationId);
        const otherParticipantId = conversation.participant1Id === userId 
          ? conversation.participant2Id 
          : conversation.participant1Id;

        io.to(`user_${otherParticipantId}`).emit('messages_read', { conversationId });

      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
};

// Function to emit order notifications
const emitOrderNotification = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('order_notification', notification);
  }
};

// Function to emit order status update
const emitOrderUpdate = (userId, order) => {
  if (io) {
    io.to(`user_${userId}`).emit('order_update', order);
  }
};

const getIO = () => io;

module.exports = {
  initializeSocket,
  emitOrderNotification,
  emitOrderUpdate,
  getIO
};
