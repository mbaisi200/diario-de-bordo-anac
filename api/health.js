import { query } from './lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const result = await query('SELECT NOW() as now');
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database_time: result[0]?.now,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
}
