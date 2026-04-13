// backend/src/config/database.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs/promises');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { query, connectDB, pool };
