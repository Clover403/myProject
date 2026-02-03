import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

export { SocketContext };

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (isAuthenticated && token) {
      // Create socket connection
      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        // Socket connected
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        // Socket disconnected
        setConnected(false);
      });

      // Listen for message notifications
      newSocket.on('message_notification', (data) => {
        // New message notification
        setUnreadMessages(prev => prev + 1);
        setNotifications(prev => [...prev, {
          type: 'message',
          ...data,
          timestamp: new Date()
        }]);
      });

      // Listen for order notifications
      newSocket.on('order_notification', (data) => {
        // Order notification
        setNotifications(prev => [...prev, {
          type: 'order',
          ...data,
          timestamp: new Date()
        }]);
      });

      // Listen for order updates
      newSocket.on('order_update', (order) => {
        // Order update
        setNotifications(prev => [...prev, {
          type: 'order_update',
          order,
          timestamp: new Date()
        }]);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, token]);

  // Join a conversation room
  const joinConversation = (conversationId) => {
    if (socket && connected) {
      socket.emit('join_conversation', conversationId);
    }
  };

  // Leave a conversation room
  const leaveConversation = (conversationId) => {
    if (socket && connected) {
      socket.emit('leave_conversation', conversationId);
    }
  };

  // Send message via socket
  const sendMessage = (conversationId, content) => {
    if (socket && connected) {
      socket.emit('send_message', { conversationId, content });
    }
  };

  // Mark messages as read
  const markAsRead = (conversationId) => {
    if (socket && connected) {
      socket.emit('mark_read', conversationId);
    }
  };

  // Typing indicator
  const setTyping = (conversationId, isTyping) => {
    if (socket && connected) {
      socket.emit('typing', { conversationId, isTyping });
    }
  };

  // Clear unread count
  const clearUnreadCount = () => {
    setUnreadMessages(0);
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Remove specific notification
  const removeNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const value = {
    socket,
    connected,
    unreadMessages,
    setUnreadMessages,
    notifications,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    setTyping,
    clearUnreadCount,
    clearNotifications,
    removeNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
