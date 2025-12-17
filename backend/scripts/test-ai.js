require('dotenv').config();

const aiService = require('../src/services/aiService');

(async () => {
  try {
    const result = await aiService.chat({
      messages: [
        { role: 'user', content: 'Summarise cross-site scripting in one sentence.' }
      ],
    });
    console.log('AI result', result);
  } catch (error) {
    console.error('AI error', error);
  }
})();
