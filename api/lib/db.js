import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function query(queryText, params = []) {
  try {
    const result = await sql(queryText, params || []);
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}
