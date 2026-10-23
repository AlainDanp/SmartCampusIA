const { Pool } = require('pg');

// Sur RDS PostgreSQL 15+, SSL est imposé : PGSSL=true dans le .env AWS.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://smartcampus:smartcampus@localhost:5432/smartcampus',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
});

const query = (text, params) => pool.query(text, params);

// Exécute fn dans une transaction (BEGIN / COMMIT / ROLLBACK)
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, transaction };
