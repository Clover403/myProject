import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  // Google OAuth
  getGoogleLoginUrl: () => `${API_BASE_URL}/auth/google`,
  
  // Token verification
  verifyToken: (token) =>  
    api.post("/auth/verify-token", {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  // Get current user
  getCurrentUser: () => api.get("/auth/me"),
  
  // Logout
  logout: () => api.post("/auth/logout"),
};

// Scan API
export const scanAPI = {
  // CREATE
  startScan: (data) => api.post("/scans", data),

  // READ
  getAllScans: (params) => api.get("/scans", { params }),
  getScanById: (id) => api.get(`/scans/${id}`),
  getScanStatus: (id) => api.get(`/scans/${id}/status`),
  getStats: () => api.get("/scans/stats/summary"),
  getScanUsage: () => api.get("/scans/usage"),

  // UPDATE
  updateNotes: (id, notes) => api.patch(`/scans/${id}/notes`, { notes }),

  // DELETE
  deleteScan: (id) => api.delete(`/scans/${id}`),
};

// Target API
export const targetAPI = {
  // CREATE
  createTarget: (data) => api.post("/targets", data),

  // READ
  getAllTargets: () => api.get("/targets"),
  getTargetById: (id) => api.get(`/targets/${id}`),

  // UPDATE
  updateTarget: (id, data) => api.put(`/targets/${id}`, data),

  // DELETE
  deleteTarget: (id) => api.delete(`/targets/${id}`),
};

// AI API
export const aiAPI = {
  explainVulnerability: (vulnerabilityId, settings) =>
    api.post(`/ai/explain/${vulnerabilityId}`, {
      settings,
    }),
  getSecurityAdvice: (scanId, settings) =>
    api.get(`/ai/advice/${scanId}`, {
      params: settings,
    }),
  chat: (payload, config = {}) => api.post('/ai/chat', payload, config),
  getMeta: () => api.get('/ai/meta'),
  getUsage: () => api.get('/ai/usage'),
};

// Product API
export const productAPI = {
  // Public routes
  getAllProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductsByEthack: (ethackId) => api.get(`/products/ethack/${ethackId}`),
  
  // Protected routes (ethack or admin)
  getMyProducts: () => api.get('/products/my/products'),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Admin only
  adminGetAllProducts: (params) => api.get('/products/admin/all', { params }),
};

// User API (Admin)
export const userAPI = {
  // Public routes
  getAllEthicalHackers: (params) => api.get('/users/ethical-hackers', { params }),
  getEthicalHackerProfile: (id) => api.get(`/users/ethical-hackers/${id}`),
  
  // Admin only routes
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUserRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  createEthackUser: (data) => api.post('/users/ethack', data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

// Order API
export const orderAPI = {
  // Create order
  createOrder: (data) => api.post('/orders', data),
  
  // Get orders
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getSellerOrders: (params) => api.get('/orders/seller-orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getOrderStats: () => api.get('/orders/stats'),
  
  // Order actions (seller)
  acceptOrder: (id) => api.post(`/orders/${id}/accept`),
  rejectOrder: (id, reason) => api.post(`/orders/${id}/reject`, { reason }),
  submitOrder: (id, data) => api.post(`/orders/${id}/submit`, data),
  
  // Order actions (buyer)
  initiatePayment: (id) => api.post(`/orders/${id}/pay`),
  checkPaymentStatus: (id) => api.get(`/orders/${id}/payment-status`),
  simulatePayment: (id) => api.post(`/orders/${id}/simulate-payment`),
  requestRevision: (id, notes) => api.post(`/orders/${id}/revision`, { notes }),
  completeOrder: (id, data) => api.post(`/orders/${id}/complete`, data),
  cancelOrder: (id) => api.delete(`/orders/${id}`),
};

// Chat API
export const chatAPI = {
  // Conversations
  getOrCreateConversation: (participantId) => api.post('/chat/conversations', { participantId }),
  getConversations: () => api.get('/chat/conversations'),
  
  // Messages
  getMessages: (conversationId, params) => api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, content) => api.post('/chat/messages', { conversationId, content }),
  markAsRead: (conversationId) => api.post(`/chat/conversations/${conversationId}/read`),
  
  // Notifications
  getUnreadCount: () => api.get('/chat/unread-count'),
};

export default api;