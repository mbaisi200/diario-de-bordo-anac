import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(databaseUrl);

export { sql };

export async function query(queryText, params = []) {
  try {
    const result = await sql(queryText, params || []);
    return result;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}
