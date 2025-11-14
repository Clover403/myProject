const jwt = require('jsonwebtoken');
const db = require('../../models');

async function createTestUser(overrides = {}) {
  return db.User.create({
    email: overrides.email || `user${Date.now()}@example.com`,
    name: overrides.name || 'Test User',
    googleId: overrides.googleId || null,
    picture: overrides.picture || null,
    locale: overrides.locale || 'en',
    lastLogin: overrides.lastLogin || new Date(),
    ...overrides,
  });
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function authHeader(user) {
  return `Bearer ${generateToken(user)}`;
}

async function createTarget(user, overrides = {}) {
  return db.Target.create({
    url: overrides.url || 'https://example.com',
    name: overrides.name || 'Example Target',
    description: overrides.description || 'Test target',
    tags: overrides.tags || ['test'],
    userId: user.id,
    ...overrides,
  });
}

async function createScan(user, overrides = {}) {
  return db.Scan.create({
    url: overrides.url || 'https://example.com',
    scanType: overrides.scanType || 'quick',
    status: overrides.status || 'completed',
    userId: user.id,
    totalVulnerabilities: overrides.totalVulnerabilities || 0,
    criticalCount: overrides.criticalCount || 0,
    highCount: overrides.highCount || 0,
    mediumCount: overrides.mediumCount || 0,
    lowCount: overrides.lowCount || 0,
    ...overrides,
  });
}

module.exports = {
  createTestUser,
  authHeader,
  createTarget,
  createScan,
};
