const { GoogleGenerativeAI } = require('@google/generative-ai');

const CANONICAL_MODELS = {
  'gemini-flash-latest': 'models/gemini-flash-latest',
  'gemini-flash-lite-latest': 'models/gemini-flash-lite-latest',
  'gemini-pro-latest': 'models/gemini-pro-latest',
  'gemini-2.5-flash': 'models/gemini-2.5-flash',
  'gemini-2.5-pro': 'models/gemini-2.5-pro',
  'gemini-2.0-flash': 'models/gemini-2.0-flash',
  'gemini-2.0-flash-lite': 'models/gemini-2.0-flash-lite',
  'gemini-2.0-pro-exp': 'models/gemini-2.0-pro-exp',
};

const LEGACY_ALIASES = {
  'gemini-flash': 'gemini-flash-latest',
  'gemini-1.5-flash': 'gemini-flash-latest',
  'gemini-1.5-flash-latest': 'gemini-flash-latest',
  'gemini-1.0-flash': 'gemini-flash-latest',
  'gemini-1.5-pro': 'gemini-pro-latest',
  'gemini-1.5-pro-latest': 'gemini-pro-latest',
  'gemini-1.0-pro': 'gemini-pro-latest',
  'gemini-1.0-pro-latest': 'gemini-pro-latest',
  'gemini-pro': 'gemini-pro-latest',
  'gemini-pro-vision': 'gemini-pro-latest',
  'gemini-1.5': 'gemini-pro-latest',
  'gemini-1.5-ultra': 'gemini-pro-latest',
  'gemini-ultra': 'gemini-pro-latest',
  'gemini-1.5-lite': 'gemini-flash-latest',
  'gemini-1.5-lite-latest': 'gemini-flash-lite-latest',
  'gemini-2.5-flash-latest': 'gemini-2.5-flash',
  'gemini-2.5-pro-latest': 'gemini-2.5-pro',
  'gemini-2.0-flash-latest': 'gemini-2.0-flash',
  'gemini-2.0-flash-lite-latest': 'gemini-2.0-flash-lite',
};

const MODEL_ALIASES = {};

Object.entries(CANONICAL_MODELS).forEach(([key, canonical]) => {
  const lower = key.toLowerCase();
  [key, lower].forEach((k) => {
    MODEL_ALIASES[k] = canonical;
    MODEL_ALIASES[`models/${k}`] = canonical;
  });
});

Object.entries(LEGACY_ALIASES).forEach(([legacy, target]) => {
  const canonical = CANONICAL_MODELS[target] || CANONICAL_MODELS[target.toLowerCase()];
  if (!canonical) {
    return;
  }
  const lowerLegacy = legacy.toLowerCase();
  [legacy, lowerLegacy].forEach((alias) => {
    MODEL_ALIASES[alias] = canonical;
    MODEL_ALIASES[`models/${alias}`] = canonical;
  });
});

const GEMINI_FALLBACK_MODEL = CANONICAL_MODELS['gemini-flash-latest'];

function normalizeModelId(value) {
  if (!value) {
    return GEMINI_FALLBACK_MODEL;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return GEMINI_FALLBACK_MODEL;
  }

  const candidates = new Set();
  candidates.add(trimmed);

  if (trimmed.startsWith('models/')) {
    const without = trimmed.slice('models/'.length);
    candidates.add(without);
    candidates.add(without.toLowerCase());
  } else {
    candidates.add(`models/${trimmed}`);
    candidates.add(trimmed.toLowerCase());
    candidates.add(`models/${trimmed.toLowerCase()}`);
  }

  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    if (MODEL_ALIASES[candidate]) {
      return MODEL_ALIASES[candidate];
    }
    if (MODEL_ALIASES[lower]) {
      return MODEL_ALIASES[lower];
    }
  }

  const canonicalCandidate = trimmed.startsWith('models/') ? trimmed : `models/${trimmed}`;
  return canonicalCandidate.toLowerCase();
}

class GeminiProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  this.defaultModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    this._client = null;
  }

  isEnabled() {
    return Boolean(this.apiKey);
  }

  getSupportedModels() {
    return Object.keys(CANONICAL_MODELS);
  }

  resolveModel(preferredModel) {
    const pick = preferredModel && preferredModel.trim()
      ? preferredModel.trim()
      : this.defaultModel;

    return normalizeModelId(pick);
  }

  get client() {
    if (!this.isEnabled()) {
      throw new Error('Gemini provider is not configured');
    }

    if (!this._client) {
      this._client = new GoogleGenerativeAI(this.apiKey);
    }

    return this._client;
  }

  async chat({ messages, systemPrompt, temperature, maxTokens, model }) {
    if (!this.isEnabled()) {
      throw new Error('Gemini provider is not configured');
    }

    const finalModel = this.resolveModel(model);
    const genModel = this.client.getGenerativeModel({ model: finalModel });

    const generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    const transcript = messages
      .map((msg) => {
        const speaker = msg.role === 'assistant' ? 'Assistant' : 'User';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n\n');

    const promptSegments = [];

    if (systemPrompt) {
      promptSegments.push(systemPrompt);
    }

    if (transcript) {
      promptSegments.push('Conversation so far:\n' + transcript);
    }

    promptSegments.push('Assistant:');

    const prompt = promptSegments.join('\n\n');

    try {
      const result = await genModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig,
      });

      const response = await result.response;
      const text = response.text() || '';
      const usage = response.usageMetadata || {};

      return {
        content: text.trim(),
        model: finalModel,
        usage: {
          promptTokenCount: usage.promptTokenCount || 0,
          candidatesTokenCount: usage.candidatesTokenCount || 0,
          totalTokenCount: usage.totalTokenCount || 0,
        },
      };
    } catch (error) {
      const message = error.response?.error?.message || error.message;
      console.error('Gemini chat error:', message);
      const err = new Error(message || 'Failed to generate response with Gemini');
      err.statusCode = error.response?.status;
      err.aiProvider = 'gemini';
      err.aiModel = finalModel;

      if (!err.statusCode && typeof message === 'string') {
        if (message.includes('401')) {
          err.statusCode = 401;
        } else if (message.includes('403')) {
          err.statusCode = 403;
        } else if (message.includes('404')) {
          err.statusCode = 502;
        } else if (message.toLowerCase().includes('quota')) {
          err.statusCode = 429;
        }
      }

      if (!err.statusCode) {
        err.statusCode = 502;
      }
      throw err;
    }
  }
}

module.exports = new GeminiProvider();