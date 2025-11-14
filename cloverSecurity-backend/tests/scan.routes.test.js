jest.mock('../src/services/zapService', () => ({
  performFullScan: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const db = require('../models');
const { createTestUser, authHeader, createTarget } = require('./utils/testUtils');
const zapService = require('../src/services/zapService');

const waitForAsyncJobs = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Scan Routes', () => {
  let user;
  let token;
  let target;

  beforeEach(async () => {
    user = await createTestUser();
    token = authHeader(user);
    target = await createTarget(user, { url: 'https://scan.me', name: 'Scan Target' });
    zapService.performFullScan.mockReset();
    zapService.performFullScan.mockResolvedValue({
      success: true,
      vulnerabilities: [
        {
          vulnType: 'Cross-Site Scripting',
          severity: 'high',
          confidence: 'High',
          location: 'https://scan.me/profile',
        },
      ],
      totalVulnerabilities: 1,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 0,
      lowCount: 0,
    });
  });

  test('POST /api/scans starts a scan and stores results', async () => {
    const response = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({
        url: target.url,
        scanType: 'quick',
        targetId: target.id,
      })
      .expect(201);

    expect(response.body.scan).toMatchObject({
      url: target.url,
      status: 'pending',
      scanType: 'quick',
    });

    // Allow async worker to complete
    await waitForAsyncJobs();
    await waitForAsyncJobs();

    const updatedScan = await db.Scan.findByPk(response.body.scan.id, {
      include: ['vulnerabilities'],
    });

    expect(updatedScan.status).toBe('completed');
    expect(updatedScan.totalVulnerabilities).toBe(1);
    expect(updatedScan.vulnerabilities.length).toBe(1);
  });

  test('GET /api/scans returns scans with target data', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id });

    await waitForAsyncJobs();
    await waitForAsyncJobs();

    const response = await request(app)
      .get('/api/scans')
      .set('Authorization', token)
      .expect(200);

    expect(response.body.scans.length).toBe(1);
    expect(response.body.scans[0]).toMatchObject({
      targetUrl: target.url,
      targetName: target.name,
      totalVulnerabilities: 1,
      severityLevel: 'high',
    });
  });

  test('GET /api/scans/:id returns scan details with vulnerabilities', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id });

    await waitForAsyncJobs();
    await waitForAsyncJobs();

    const response = await request(app)
      .get(`/api/scans/${res.body.scan.id}`)
      .set('Authorization', token)
      .expect(200);

    expect(response.body.scan).toHaveProperty('vulnerabilities');
    expect(response.body.scan.vulnerabilities.length).toBe(1);
    expect(response.body.scan.vulnerabilities[0]).toHaveProperty('aiExplanation');
  });

  test('GET /api/scans/:id/status returns scan status', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id });

    await waitForAsyncJobs();
    await waitForAsyncJobs();

    const response = await request(app)
      .get(`/api/scans/${res.body.scan.id}/status`)
      .set('Authorization', token)
      .expect(200);

    expect(response.body).toMatchObject({
      scan: {
        id: res.body.scan.id,
        status: 'completed',
      },
    });
  });

  test('GET /api/scans/stats/summary aggregates scan metrics', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id });

    await waitForAsyncJobs();
    await waitForAsyncJobs();

    const response = await request(app)
      .get('/api/scans/stats/summary')
      .set('Authorization', token)
      .expect(200);

    expect(response.body.stats).toMatchObject({
      totalScans: 1,
      completedScans: 1,
      activeScans: 0,
      vulnerabilitiesFound: 1,
      highVulnerabilities: 1,
    });
  });

  test('PATCH /api/scans/:id/notes updates scan notes', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id });

    await waitForAsyncJobs();
    await waitForAsyncJobs();

    const response = await request(app)
      .patch(`/api/scans/${res.body.scan.id}/notes`)
      .set('Authorization', token)
      .send({ notes: 'Important findings' })
      .expect(200);

    expect(response.body.scan.notes).toBe('Important findings');
  });

  test('DELETE /api/scans/:id removes the scan', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id });

    await waitForAsyncJobs();
    await waitForAsyncJobs();

    await request(app)
      .delete(`/api/scans/${res.body.scan.id}`)
      .set('Authorization', token)
      .expect(200);

    const foundScan = await db.Scan.findByPk(res.body.scan.id);
    expect(foundScan).toBeNull();
  });
});
