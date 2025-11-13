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
  explainVulnerability: (vulnerabilityId) =>
    api.post(`/ai/explain/${vulnerabilityId}`),
  getSecurityAdvice: (scanId) => api.get(`/ai/advice/${scanId}`),
  chatWithAI: (data) => api.post("/ai/chat", data),
};

export default api;