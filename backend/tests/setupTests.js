process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret';
process.env.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.AI_RATE_MAX_REQUESTS = process.env.AI_RATE_MAX_REQUESTS || '1000';
process.env.AI_RATE_WINDOW_MS = process.env.AI_RATE_WINDOW_MS || '60000';

const { Client } = require('pg');
const path = require('path');
const configPath = path.resolve(__dirname, '..', 'config', 'config.json');
const env = process.env.NODE_ENV || 'development';
// eslint-disable-next-line global-require, import/no-dynamic-require
const config = require(configPath)[env];

let db;

const ensureTestDatabase = async () => {
  if (!config || config.dialect !== 'postgres') {
    return;
  }

  const adminDatabase = config.adminDatabase || 'postgres';
  const client = new Client({
    host: config.host || '127.0.0.1',
    port: config.port || 5432,
    user: config.username,
    password: config.password,
    database: adminDatabase,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.database]);
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${config.database}"`);
    }
  } finally {
    await client.end();
  }
};

beforeAll(async () => {
  await ensureTestDatabase();
  // Delay requiring models until database definitely exists
  // eslint-disable-next-line global-require
  db = require('../models');
});

beforeEach(async () => {
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});
