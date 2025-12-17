const request = require('supertest');
const app = require('../src/app');
const db = require('../models');
const { createTestUser, authHeader, createTarget } = require('./utils/testUtils');

describe('Target Routes', () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createTestUser();
    token = authHeader(user);
  });

  test('POST /api/targets creates a new target', async () => {
    const response = await request(app)
      .post('/api/targets')
      .set('Authorization', token)
      .send({
        url: 'https://app.example.com',
        name: 'App Target',
        description: 'Main application',
        tags: ['prod', 'app'],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      message: 'Target created successfully',
      target: {
        url: 'https://app.example.com',
        name: 'App Target',
        userId: user.id,
      },
    });
  });

  test('GET /api/targets returns targets with scan metadata', async () => {
    await createTarget(user, { name: 'Website', url: 'https://site.com' });

    const response = await request(app)
      .get('/api/targets')
      .set('Authorization', token)
      .expect(200);

    expect(Array.isArray(response.body.targets)).toBe(true);
    expect(response.body.targets[0]).toHaveProperty('scanCount');
    expect(response.body.targets[0]).toHaveProperty('lastScan');
  });

  test('GET /api/targets/:id retrieves a single target', async () => {
    const target = await createTarget(user, { name: 'API', url: 'https://api.com' });

    const response = await request(app)
      .get(`/api/targets/${target.id}`)
      .set('Authorization', token)
      .expect(200);

    expect(response.body).toMatchObject({
      target: {
        id: target.id,
        name: 'API',
      },
    });
  });

  test('PUT /api/targets/:id updates a target', async () => {
    const target = await createTarget(user, { name: 'Legacy', url: 'https://legacy.com' });

    const response = await request(app)
      .put(`/api/targets/${target.id}`)
      .set('Authorization', token)
      .send({ name: 'Legacy Updated', description: 'Updated target' })
      .expect(200);

    expect(response.body).toMatchObject({
      message: 'Target updated successfully',
      target: {
        name: 'Legacy Updated',
        description: 'Updated target',
      },
    });
  });

  test('DELETE /api/targets/:id removes the target', async () => {
    const target = await createTarget(user, { name: 'Temp', url: 'https://temp.com' });

    await request(app)
      .delete(`/api/targets/${target.id}`)
      .set('Authorization', token)
      .expect(200);

    const found = await db.Target.findByPk(target.id);
    expect(found).toBeNull();
  });
});
