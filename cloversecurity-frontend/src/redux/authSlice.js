import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Async thunks
export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (token, { rejectWithValue }) => {
    try {
      console.log('🔍 Verifying token with backend...');
      const response = await axios.post(
        `${API_BASE_URL}/auth/verify-token`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ Token verified, user:', response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('❌ Token verification failed:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Token verification failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Logout failed');
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('authToken') || null,
  loading: false,
  error: null,
  isAuthenticated: false // MULAI dari false, biar verify token dulu
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      console.log('📝 Setting user:', action.payload);
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    setToken: (state, action) => {
      console.log('🔑 Setting token:', action.payload ? 'Yes' : 'No');
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem('authToken', action.payload);
        // Jangan set isAuthenticated = true di sini, tunggu verifyToken
      } else {
        localStorage.removeItem('authToken');
        state.isAuthenticated = false;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      console.log('🧹 Clearing auth state');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('authToken');
    }
  },
  extraReducers: (builder) => {
    // Verify Token
    builder
      .addCase(verifyToken.pending, (state) => {
        console.log('⏳ Verifying token...');
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        console.log('✅ Token verified successfully');
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        console.log('❌ Token verification rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('authToken');
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        console.log('👋 Logged out successfully');
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem('authToken');
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Tetap clear auth meskipun logout API gagal
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('authToken');
      });
  }
});

export const { setUser, setToken, clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;