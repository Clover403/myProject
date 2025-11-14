const axios = require('axios');

class OpenAIProvider {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  isEnabled() {
    return Boolean(this.apiKey);
  }

  getSupportedModels() {
    return [
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4.1-mini',
      'gpt-4.1',
      'gpt-3.5-turbo'
    ];
  }

  resolveModel(preferredModel) {
    const supported = this.getSupportedModels();
    if (preferredModel && supported.includes(preferredModel)) {
      return preferredModel;
    }
    if (preferredModel && preferredModel.trim()) {
      return preferredModel.trim();
    }
    return this.defaultModel;
  }

  async chat({ messages, systemPrompt, temperature, maxTokens, model }) {
    if (!this.isEnabled()) {
      throw new Error('OpenAI provider is not configured');
    }

    const finalModel = this.resolveModel(model);

    const payloadMessages = [];

    if (systemPrompt) {
      payloadMessages.push({ role: 'system', content: systemPrompt });
    }

    messages.forEach((msg) => {
      payloadMessages.push({ role: msg.role, content: msg.content });
    });

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: finalModel,
          temperature,
          max_tokens: maxTokens,
          messages: payloadMessages,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const choice = data.choices?.[0] ?? {};
      const content = choice.message?.content?.trim() || '';

      return {
        content,
        model: finalModel,
        usage: data.usage || {},
      };
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      console.error('OpenAI chat error:', message);
      const err = new Error(message || 'Failed to generate response with OpenAI');
      err.statusCode = error.response?.status;
      err.aiProvider = 'openai';
      err.aiModel = finalModel;
      throw err;
    }
  }
}

module.exports = new OpenAIProvider();
