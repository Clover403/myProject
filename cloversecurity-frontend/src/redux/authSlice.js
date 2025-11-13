import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Async thunks
export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/verify-token`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.user;
    } catch (error) {
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

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get user');
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('authToken') || null,
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('authToken')
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem('authToken', action.payload);
        state.isAuthenticated = true;
      } else {
        localStorage.removeItem('authToken');
        state.isAuthenticated = false;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('authToken');
    }
  },
  extraReducers: (builder) => {
    // Verify Token
    builder
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('authToken');
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });
  }
});

export const { setUser, setToken, clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
