import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext";
import { chatAPI, userAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  Send,
  ArrowLeft,
  User,
  MessageCircle,
  Check,
  CheckCheck,
  Search,
  MoreVertical
} from "lucide-react";

function Chat() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const participantIdFromUrl = searchParams.get('with');
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const { socket, connected, joinConversation, leaveConversation, markAsRead, setTyping } = useSocket();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Theme styles
  const bgPrimary = isDark ? "bg-[#0f1117]" : "bg-gray-50";
  const bgSecondary = isDark ? "bg-[#151822]" : "bg-white";
  const bgTertiary = isDark ? "bg-[#1a1d24]" : "bg-gray-100";
  const borderColor = isDark ? "border-[#1f2330]" : "border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle participant from URL (for creating new conversation)
  useEffect(() => {
    if (participantIdFromUrl && !conversationId) {
      createOrFetchConversation(parseInt(participantIdFromUrl));
    }
  }, [participantIdFromUrl]);

  // Handle conversation selection
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === parseInt(conversationId));
      if (conv) {
        setActiveConversation(conv);
        fetchMessages(conversationId);
        joinConversation(conversationId);
      }
    }
    
    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId, conversations]);

  // Listen for new messages
  useEffect(() => {
    if (socket && connected) {
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleTypingIndicator);
      socket.on('messages_read', handleMessagesRead);
      
      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleTypingIndicator);
        socket.off('messages_read', handleMessagesRead);
      };
    }
  }, [socket, connected, activeConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const createOrFetchConversation = async (participantId) => {
    try {
      const response = await chatAPI.getOrCreateConversation(participantId);
      const conv = response.data.conversation;
      
      // Add to conversations if not exists
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id);
        if (!exists) {
          return [conv, ...prev];
        }
        return prev;
      });
      
      // Navigate to the conversation
      navigate(`/chat/${conv.id}`, { replace: true });
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const response = await chatAPI.getMessages(convId, { limit: 100 });
      setMessages(response.data.messages || []);
      markAsRead(convId);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const handleNewMessage = (message) => {
    if (activeConversation && message.conversationId === activeConversation.id) {
      setMessages(prev => [...prev, message]);
      markAsRead(activeConversation.id);
    }
    // Update conversation list
    fetchConversations();
  };

  const handleTypingIndicator = ({ userId, userName, isTyping }) => {
    if (userId !== user.id) {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping ? userName : null
      }));
    }
  };

  const handleMessagesRead = ({ conversationId: convId }) => {
    if (activeConversation && convId === activeConversation.id) {
      setMessages(prev => prev.map(m => ({
        ...m,
        isRead: true
      })));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    try {
      setSendingMessage(true);
      const response = await chatAPI.sendMessage(activeConversation.id, newMessage.trim());
      setMessages(prev => [...prev, response.data.message]);
      setNewMessage("");
      setTyping(activeConversation.id, false);
      fetchConversations(); // Refresh to update last message
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Typing indicator
    if (activeConversation) {
      setTyping(activeConversation.id, true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(activeConversation.id, false);
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getOtherParticipant = (conv) => {
    if (!conv || !user) return null;
    return conv.participant1?.id === user.id ? conv.participant2 : conv.participant1;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const typingUsersList = Object.values(typingUsers).filter(Boolean);

  return (
    <Layout>
      <div className={`min-h-screen ${bgPrimary}`}>
        <div className="h-[calc(100vh-64px)] flex">
          {/* Conversations List */}
          <div className={`w-80 ${bgSecondary} border-r ${borderColor} flex flex-col`}>
            {/* Header */}
            <div className={`p-4 border-b ${borderColor}`}>
              <h2 className={`text-xl font-bold ${textPrimary} mb-4`}>Messages</h2>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg ${bgTertiary} border ${borderColor} ${textPrimary} placeholder:${textSecondary} focus:outline-none focus:ring-2 focus:ring-green-700/50`}
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className={`p-4 text-center ${textSecondary}`}>
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isActive = activeConversation?.id === conv.id;
                  
                  return (
                    <button
                      key={conv.id}
                      onClick={() => navigate(`/chat/${conv.id}`)}
                      className={`w-full p-4 flex items-start gap-3 hover:${bgTertiary} transition ${isActive ? bgTertiary : ''} border-b ${borderColor}`}
                    >
                      {other?.picture ? (
                        <img src={other.picture} alt={other.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? "bg-[#2a2e38]" : "bg-gray-200"}`}>
                          <User className="w-6 h-6 text-green-700" />
                        </div>
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${textPrimary} truncate`}>{other?.name || "Unknown"}</span>
                          {conv.lastMessage && (
                            <span className={`text-xs ${textSecondary}`}>
                              {formatTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm ${textSecondary} truncate flex-1`}>
                            {conv.lastMessage?.content || "No messages yet"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-green-700 text-[#0f1117] text-xs font-bold px-2 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className={`p-4 ${bgSecondary} border-b ${borderColor} flex items-center gap-4`}>
                  <button
                    onClick={() => navigate('/chat')}
                    className={`lg:hidden p-2 rounded-lg hover:${bgTertiary} ${textSecondary}`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {(() => {
                    const other = getOtherParticipant(activeConversation);
                    return (
                      <>
                        {other?.picture ? (
                          <img src={other.picture} alt={other.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-[#2a2e38]" : "bg-gray-200"}`}>
                            <User className="w-5 h-5 text-green-700" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className={`font-semibold ${textPrimary}`}>{other?.name || "Unknown"}</h3>
                          <p className={`text-sm ${textSecondary}`}>
                            {other?.role === 'ethack' ? 'Ethical Hacker' : 'User'}
                            {typingUsersList.length > 0 && (
                              <span className="text-green-700 ml-2">typing...</span>
                            )}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${bgPrimary}`}>
                  {messages.map((message, index) => {
                    const isMe = message.senderId === user?.id;
                    const showDate = index === 0 || 
                      formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);

                    return (
                      <React.Fragment key={message.id}>
                        {showDate && (
                          <div className="flex justify-center">
                            <span className={`text-xs ${textSecondary} ${bgTertiary} px-3 py-1 rounded-full`}>
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isMe ? 'bg-green-700 text-[#ffffff]' : bgSecondary + ' ' + textPrimary} rounded-2xl px-4 py-2 ${isMe ? '' : 'border ' + borderColor}`}>
                            <p className="break-words">{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-white/70' : textSecondary}`}>
                              <span className="text-xs">{formatTime(message.createdAt)}</span>
                              {isMe && (
                                message.isRead ? 
                                  <CheckCheck className="w-4 h-4" /> : 
                                  <Check className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className={`p-4 ${bgSecondary} border-t ${borderColor}`}>
                  <div className="flex items-center gap-3">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder="Type a message..."
                      className={`flex-1 px-4 py-3 rounded-xl ${bgTertiary} border ${borderColor} ${textPrimary} placeholder:${textSecondary} focus:outline-none focus:ring-2 focus:ring-green-700/50`}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-3 bg-green-700 text-[#ffffff] rounded-xl hover:bg-[#34b379] transition disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className={`flex-1 flex items-center justify-center ${bgPrimary}`}>
                <div className="text-center">
                  <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${textSecondary} opacity-50`} />
                  <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>Select a conversation</h3>
                  <p className={textSecondary}>Choose a conversation from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Chat;
