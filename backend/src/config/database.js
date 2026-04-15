// backend/src/config/database.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs/promises');
const path = require('path');

const databaseURL = process.env.DATABASE_URL || process.env.DB_URL;
const useSSL = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

const poolConfig = databaseURL
  ? {
      connectionString: databaseURL,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.PGPORT, 10) || 5432,
      database: process.env.DB_NAME || process.env.PGDATABASE,
      user: process.env.DB_USER || process.env.PGUSER,
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
});

// Parameterized query helper — prevents SQL injection
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] ${duration}ms — ${text.substring(0, 60)}...`);
    }
    return result;
  } catch (err) {
    console.error('[DB Error]', err.message, '\nQuery:', text);
    throw err;
  }
};

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();

    // Ensure required schema exists for local/dev environments.
    const initSQLPath = path.join(__dirname, 'init.sql');
    const initSQL = await fs.readFile(initSQLPath, 'utf8');
    await pool.query(initSQL);
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Database schema initialized');
    }
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message || err);
    process.exit(1);
  }
};

module.exports = { query, connectDB, pool };
