import { query } from '../lib/db.js';
import { setCors } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!setCors(res)) return;

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS aircrafts (
        id UUID PRIMARY KEY,
        tenant_id UUID,
        registration VARCHAR(10) NOT NULL,
        type VARCHAR(255) NOT NULL,
        model VARCHAR(255),
        manufacturer VARCHAR(255),
        category VARCHAR(50),
        year INTEGER,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const q = (req.query.q || '').toString().trim().toUpperCase();

    if (!q || q.length < 2) {
      return res.json({ data: [] });
    }

    // Buscar de aeronaves cadastradas pelo admin
    const aircraftResults = await query(
      `SELECT DISTINCT registration, type as aircraft_type, model, manufacturer
       FROM aircrafts
       WHERE registration ILIKE $1 AND active = TRUE
       ORDER BY registration ASC
       LIMIT 15`,
      [`%${q}%`]
    );

    // Buscar de voos anteriores do usuário
    let flightResults = [];
    try {
      flightResults = await query(
        `SELECT DISTINCT registration, aircraft_type
         FROM flights
         WHERE registration ILIKE $1
         ORDER BY registration ASC
         LIMIT 15`,
        [`%${q}%`]
      );
    } catch {
      // Tabela flights pode não ter sido criada ainda
    }

    // Combinar resultados, removendo duplicatas
    const seen = new Set();
    const results = [];

    for (const r of [...aircraftResults, ...flightResults]) {
      const reg = r.registration?.toUpperCase();
      if (reg && !seen.has(reg)) {
        seen.add(reg);
        results.push({
          registration: reg,
          aircraftType: r.aircraft_type || r.type || '',
          model: r.model || '',
          manufacturer: r.manufacturer || '',
        });
      }
    }

    return res.json({ data: results.slice(0, 20) });
  } catch (error) {
    console.error('Search registrations error:', error);
    return res.status(500).json({ error: 'Erro ao buscar matrículas', data: [] });
  }
}
