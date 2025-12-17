jest.mock('../src/services/aiService', () => ({
  explainVulnerability: jest.fn(),
  getSecurityAdvice: jest.fn(),
  chat: jest.fn(),
  getMeta: jest.fn(() => ({ providers: ['mock'], defaultProvider: 'mock' })),
}));

const request = require('supertest');
const app = require('../src/app');
const db = require('../models');
const { createTestUser, authHeader, createTarget, createScan } = require('./utils/testUtils');
const aiService = require('../src/services/aiService');

describe('AI Routes', () => {
  let user;
  let token;
  let scan;
  let vulnerability;

  beforeEach(async () => {
    user = await createTestUser();
    token = authHeader(user);
    const target = await createTarget(user);
    scan = await createScan(user, { targetId: target.id });
    vulnerability = await db.Vulnerability.create({
      scanId: scan.id,
      vulnType: 'SQL Injection',
      severity: 'critical',
      description: 'Unsanitized parameter',
    });

    aiService.explainVulnerability.mockReset();
    aiService.getSecurityAdvice.mockReset();
    aiService.chat.mockReset();
  });

  test('GET /api/ai/meta returns provider metadata', async () => {
    const response = await request(app)
      .get('/api/ai/meta')
      .set('Authorization', token)
      .expect(200);

    expect(response.body).toEqual({ providers: ['mock'], defaultProvider: 'mock' });
  });

  test('POST /api/ai/explain/:id creates AI explanation', async () => {
    aiService.explainVulnerability.mockResolvedValue({
      explanation: 'Simple explanation',
      impact: 'High impact',
      remediation: 'Fix it',
      additionalResources: ['https://example.com'],
      raw: 'Raw response',
      usage: {
        provider: 'mock',
        model: 'mock-model',
        tokens: { total: 42 },
      },
    });

    const response = await request(app)
      .post(`/api/ai/explain/${vulnerability.id}`)
      .set('Authorization', token)
      .send({})
      .expect(201);

    expect(aiService.explainVulnerability).toHaveBeenCalled();
    expect(response.body).toMatchObject({
      message: 'Explanation generated successfully',
      cached: false,
    });

    const explanation = await db.AIExplanation.findOne({ where: { vulnerabilityId: vulnerability.id } });
    expect(explanation).not.toBeNull();
    expect(explanation.explanation).toContain('Simple explanation');
  });

  test('GET /api/ai/advice/:scanId returns security advice', async () => {
    aiService.getSecurityAdvice.mockResolvedValue({
      message: { content: 'Prioritize patching critical issues.' },
      usage: { provider: 'mock', tokens: { total: 10 } },
    });

    const response = await request(app)
      .get(`/api/ai/advice/${scan.id}`)
      .set('Authorization', token)
      .expect(200);

    expect(aiService.getSecurityAdvice).toHaveBeenCalled();
    expect(response.body).toMatchObject({
      advice: 'Prioritize patching critical issues.',
      scanId: String(scan.id),
    });
  });

  test('POST /api/ai/chat returns chat response', async () => {
    aiService.chat.mockResolvedValue({
      message: { role: 'assistant', content: 'Mock response' },
      usage: { provider: 'mock', tokens: { total: 5 } },
      context: null,
    });

    const response = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', token)
      .send({
        messages: [{ role: 'user', content: 'How to fix XSS?' }],
      })
      .expect(200);

    expect(aiService.chat).toHaveBeenCalled();
    expect(response.body).toMatchObject({
      message: { content: 'Mock response' },
    });
  });
});
