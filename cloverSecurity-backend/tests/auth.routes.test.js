const request = require('supertest');
const app = require('../src/app');
const db = require('../models');
const { createTestUser, authHeader } = require('./utils/testUtils');

describe('Auth Routes', () => {
  test('GET /api/auth/me returns user info with valid token', async () => {
    const user = await createTestUser();

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', authHeader(user))
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  });

  test('GET /api/auth/me fails without token', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401);
  });

  test('POST /api/auth/verify-token validates the token', async () => {
    const user = await createTestUser();

    const response = await request(app)
      .post('/api/auth/verify-token')
      .set('Authorization', authHeader(user))
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  });

  test('POST /api/auth/logout responds successfully', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Logged out successfully',
    });
  });
});
