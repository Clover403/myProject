import { createSlice, createAsyncThunk, nanoid } from '@reduxjs/toolkit';
import { aiAPI } from '../services/api';

const SETTINGS_STORAGE_KEY = 'cloversecurity-ai-settings.v1';

const defaultSettings = {
  provider: null,
  model: null,
  temperature: 0.25,
  maxTokens: 1024,
};

function loadStoredSettings() {
  if (typeof window === 'undefined') {
    return { ...defaultSettings };
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...defaultSettings };
    }

    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch (error) {
    console.warn('Failed to parse AI settings from storage:', error);
    return { ...defaultSettings };
  }
}

function persistSettings(settings) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to persist AI settings:', error);
  }
}

const initialState = {
  meta: {
    status: 'idle',
    error: null,
    providers: [],
    defaults: null,
  },
  settings: loadStoredSettings(),
  conversations: {},
};

function ensureConversation(state, conversationId) {
  if (!state.conversations[conversationId]) {
    state.conversations[conversationId] = {
      id: conversationId,
      title: null,
      messages: [],
      status: 'idle',
      error: null,
      context: null,
      lastUpdated: null,
      lastUsage: null,
      errorDetails: null,
      errorMeta: null,
    };
  }

  return state.conversations[conversationId];
}

export const fetchAiMeta = createAsyncThunk('chat/fetchMeta', async () => {
  const { data } = await aiAPI.getMeta();
  return data;
});

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, overrideContext }, { getState, signal, rejectWithValue }) => {
    const state = getState();
    const conversation = state.chat.conversations[conversationId];

    if (!conversation) {
      throw new Error('Conversation not initialized');
    }

    const messages = conversation.messages
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10)
      .map((msg) => ({ role: msg.role, content: msg.content }));

    const payload = {
      messages,
      context: overrideContext ?? conversation.context,
      settings: state.chat.settings,
    };

    try {
      const { data } = await aiAPI.chat(payload, { signal });
      return { conversationId, response: data };
    } catch (error) {
      const serverMessage = error.response?.data?.error;
      const details = error.response?.data?.details;
      const meta = error.response?.data?.meta;
      return rejectWithValue({
        conversationId,
        message: serverMessage || error.message || 'Failed to contact AI assistant',
        details,
        status: error.response?.status,
        meta,
      });
    }
  },
  {
    condition: ({ conversationId }, { getState }) => {
      const state = getState();
      const conversation = state.chat.conversations[conversationId];
      return !conversation || conversation.status !== 'loading';
    },
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    initializeConversation: (state, action) => {
      const { conversationId, title, context } = action.payload;
      const conversation = ensureConversation(state, conversationId);
      if (title) {
        conversation.title = title;
      }
      if (context) {
        conversation.context = context;
      }
    },
    setConversationContext: (state, action) => {
      const { conversationId, context } = action.payload;
      const conversation = ensureConversation(state, conversationId);
      conversation.context = context;
    },
    addMessage: {
      reducer: (state, action) => {
        const { conversationId, message } = action.payload;
        if (!message?.content) {
          return;
        }
        const conversation = ensureConversation(state, conversationId);
        conversation.messages.push(message);
        conversation.lastUpdated = message.createdAt;
        conversation.error = null;
        conversation.errorDetails = null;
        conversation.errorMeta = null;
      },
      prepare: ({ conversationId, role, content, usage, createdAt }) => {
        const trimmed = (content || '').toString().trim();
        return {
          payload: {
            conversationId,
            message: {
              id: nanoid(),
              role,
              content: trimmed,
              usage: usage || null,
              createdAt: createdAt || new Date().toISOString(),
            },
          },
        };
      },
    },
    resetConversation: (state, action) => {
      const { conversationId, preserveContext = true } = action.payload;
      const conversation = ensureConversation(state, conversationId);
      const context = preserveContext ? conversation.context : null;
      const title = conversation.title;
      state.conversations[conversationId] = {
        id: conversationId,
        title,
        messages: [],
        status: 'idle',
        error: null,
        context,
        lastUpdated: null,
        lastUsage: null,
        errorDetails: null,
        errorMeta: null,
      };
    },
    setSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
      persistSettings(state.settings);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAiMeta.pending, (state) => {
        state.meta.status = 'loading';
        state.meta.error = null;
      })
      .addCase(fetchAiMeta.fulfilled, (state, action) => {
        state.meta.status = 'succeeded';
        state.meta.providers = action.payload.providers;
        state.meta.defaults = action.payload.defaults;

        if (!state.settings.provider && action.payload.defaults?.provider) {
          state.settings.provider = action.payload.defaults.provider;
        }
        if (!state.settings.model && action.payload.defaults?.model) {
          state.settings.model = action.payload.defaults.model;
        }
        if (!state.settings.temperature && action.payload.defaults?.temperature !== undefined) {
          state.settings.temperature = action.payload.defaults.temperature;
        }
        if (!state.settings.maxTokens && action.payload.defaults?.maxTokens) {
          state.settings.maxTokens = action.payload.defaults.maxTokens;
        }
        persistSettings(state.settings);
      })
      .addCase(fetchAiMeta.rejected, (state, action) => {
        state.meta.status = 'failed';
        state.meta.error = action.error?.message || 'Failed to load AI metadata';
      })
      .addCase(sendChatMessage.pending, (state, action) => {
        const { conversationId } = action.meta.arg;
        const conversation = ensureConversation(state, conversationId);
        conversation.status = 'loading';
        conversation.error = null;
        conversation.errorDetails = null;
        conversation.errorMeta = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        const { conversationId, response } = action.payload;
        const conversation = ensureConversation(state, conversationId);

        conversation.status = 'idle';
        conversation.lastUpdated = response.message?.createdAt || new Date().toISOString();
        conversation.lastUsage = response.usage || null;
        conversation.error = null;
        conversation.errorDetails = null;
        conversation.errorMeta = null;

        if (response.message?.content) {
          conversation.messages.push({
            id: response.message.id || nanoid(),
            role: 'assistant',
            content: response.message.content,
            createdAt: response.message.createdAt || new Date().toISOString(),
            usage: response.usage || null,
          });
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        const { conversationId } = action.meta.arg;
        const conversation = ensureConversation(state, conversationId);
        conversation.status = 'failed';
        conversation.error = action.payload?.message || action.error?.message || 'Failed to contact AI assistant';
        if (action.payload?.details) {
          conversation.lastUsage = action.payload.details.usage || null;
        }
        conversation.errorDetails = action.payload?.details || null;
        conversation.errorMeta = action.payload?.meta || null;
      });
  },
});

export const {
  initializeConversation,
  setConversationContext,
  addMessage,
  resetConversation,
  setSettings,
} = chatSlice.actions;

export default chatSlice.reducer;
