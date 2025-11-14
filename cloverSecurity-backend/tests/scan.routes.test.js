jest.mock('../src/services/zapService', () => ({
  performFullScan: jest.fn(),
}));

jest.mock('../src/services/virusTotalService', () => ({
  scanUrl: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const db = require('../models');
const { createTestUser, authHeader, createTarget } = require('./utils/testUtils');
const zapService = require('../src/services/zapService');
const virusTotalService = require('../src/services/virusTotalService');

const waitForAsyncJobs = () => new Promise((resolve) => setTimeout(resolve, 0));

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const waitForScanToFinish = async (scanId, attempts = 20) => {
  for (let i = 0; i < attempts; i += 1) {
    await waitForAsyncJobs();
    const scan = await db.Scan.findByPk(scanId);
    if (scan && scan.status !== 'pending' && scan.status !== 'scanning') {
      return scan;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return db.Scan.findByPk(scanId);
};

describe('Scan Routes', () => {
  let user;
  let token;
  let target;

  beforeEach(async () => {
    user = await createTestUser();
    token = authHeader(user);
    target = await createTarget(user, { url: 'https://scan.me', name: 'Scan Target' });
    zapService.performFullScan.mockReset();
    virusTotalService.scanUrl.mockReset();
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
    virusTotalService.scanUrl.mockResolvedValue({
      verdict: 'harmless',
      maliciousCount: 0,
      suspiciousCount: 0,
      harmlessCount: 68,
      undetectedCount: 4,
      stats: {
        harmless: 68,
        malicious: 0,
        suspicious: 0,
        undetected: 4,
      },
      lastAnalysisDate: new Date().toISOString(),
      permalink: 'https://www.virustotal.com/gui/url/sample',
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
    await waitForScanToFinish(response.body.scan.id);

    const updatedScan = await db.Scan.findByPk(response.body.scan.id, {
      include: ['vulnerabilities'],
    });

    expect(updatedScan.status).toBe('completed');
    expect(updatedScan.totalVulnerabilities).toBe(1);
    expect(updatedScan.vulnerabilities.length).toBe(1);
    expect(updatedScan.progress).toBe(100);
    expect(updatedScan.virustotalVerdict).toBe('harmless');
    expect(updatedScan.virustotalStats).toEqual(
      expect.objectContaining({ malicious: 0, suspicious: 0 })
    );
  });

  test('scan progress moves through lifecycle milestones', async () => {
    const zapDeferred = createDeferred();
    const virusDeferred = createDeferred();

    const zapResult = {
      success: true,
      vulnerabilities: [],
      totalVulnerabilities: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };

    zapService.performFullScan.mockImplementation(() => zapDeferred.promise);
    virusTotalService.scanUrl.mockImplementation(() => virusDeferred.promise);

    const startResponse = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id })
      .expect(201);

    await waitForAsyncJobs();
    let scanRecord = await db.Scan.findByPk(startResponse.body.scan.id);
    expect(scanRecord.status).toBe('scanning');
    expect(scanRecord.progress).toBe(10);

    zapDeferred.resolve(zapResult);
    await waitForAsyncJobs();
    scanRecord = await db.Scan.findByPk(startResponse.body.scan.id);
    expect(scanRecord.progress).toBe(55);

    virusDeferred.resolve({
      verdict: 'harmless',
      maliciousCount: 0,
      suspiciousCount: 0,
      harmlessCount: 68,
      undetectedCount: 4,
      stats: {
        harmless: 68,
        malicious: 0,
        suspicious: 0,
        undetected: 4,
      },
      lastAnalysisDate: new Date().toISOString(),
      permalink: 'https://virustotal.example/report',
    });

    scanRecord = await waitForScanToFinish(startResponse.body.scan.id);
    expect(scanRecord.status).toBe('completed');
    expect(scanRecord.progress).toBe(100);
  });

  test('marks scan as failed when ZAP scan throws', async () => {
    zapService.performFullScan.mockRejectedValue(new Error('ZAP unavailable'));

    const response = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id })
      .expect(201);

    const scanRecord = await waitForScanToFinish(response.body.scan.id);
    expect(scanRecord.status).toBe('failed');
    expect(scanRecord.progress).toBe(100);
    expect(scanRecord.errorMessage).toContain('ZAP unavailable');
  });

  test('handles VirusTotal errors gracefully', async () => {
    virusTotalService.scanUrl.mockResolvedValue({ error: 'quota exceeded' });

    const response = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id })
      .expect(201);

    const completedScan = await waitForScanToFinish(response.body.scan.id);
    expect(completedScan.status).toBe('completed');
    expect(completedScan.progress).toBe(100);
    expect(completedScan.virustotalVerdict).toBe('error');
    expect(completedScan.virustotalStats).toEqual({ error: 'quota exceeded' });
    expect(completedScan.virustotalMaliciousCount).toBeNull();
  });

  test('GET /api/scans returns scans with target data', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id });

    await waitForScanToFinish(res.body.scan.id);

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
      progress: 100,
    });
  });

  test('GET /api/scans/:id returns scan details with vulnerabilities', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id });

    await waitForScanToFinish(res.body.scan.id);

    const response = await request(app)
      .get(`/api/scans/${res.body.scan.id}`)
      .set('Authorization', token)
      .expect(200);

    expect(response.body.scan).toHaveProperty('vulnerabilities');
    expect(response.body.scan.vulnerabilities.length).toBe(1);
    expect(response.body.scan.vulnerabilities[0]).toHaveProperty('aiExplanation');
    expect(response.body.scan.progress).toBe(100);
  });

  test('GET /api/scans/:id/status returns scan status', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id });

    await waitForScanToFinish(res.body.scan.id);

    const response = await request(app)
      .get(`/api/scans/${res.body.scan.id}/status`)
      .set('Authorization', token)
      .expect(200);

    expect(response.body).toMatchObject({
      scan: {
        id: res.body.scan.id,
        status: 'completed',
        progress: 100,
      },
    });
  });

  test('GET /api/scans/stats/summary aggregates scan metrics', async () => {
    const res = await request(app)
      .post('/api/scans')
      .set('Authorization', token)
      .send({ url: target.url, scanType: 'quick', targetId: target.id });

    await waitForScanToFinish(res.body.scan.id);

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

    await waitForScanToFinish(res.body.scan.id);

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

    await waitForScanToFinish(res.body.scan.id);

    await request(app)
      .delete(`/api/scans/${res.body.scan.id}`)
      .set('Authorization', token)
      .expect(200);

    const foundScan = await db.Scan.findByPk(res.body.scan.id);
    expect(foundScan).toBeNull();
  });

  test('requires authentication to start a scan', async () => {
    await request(app)
      .post('/api/scans')
      .send({ url: target.url, scanType: 'quick', targetId: target.id })
      .expect(401);
  });
});
