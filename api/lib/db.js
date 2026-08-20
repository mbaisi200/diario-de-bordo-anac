import pg from 'pg';

const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export async function query(queryText, params = []) {
  try {
    const client = await getPool().connect();
    try {
      const result = await client.query(queryText, params);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}
