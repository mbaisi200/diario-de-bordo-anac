import { query } from '../lib/db.js';
import { setCors } from '../lib/auth.js';

export default async function handler(req, res) {
  if (!setCors(res)) return;

  try {
    // Ensure tables exist
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

    // Ensure RAB table exists
    await query(`
      CREATE TABLE IF NOT EXISTS aircraft_rab (
        marcas VARCHAR(10) NOT NULL PRIMARY KEY,
        nr_cert_matricula INTEGER,
        nr_serie TEXT,
        cd_tipo TEXT,
        ds_modelo TEXT,
        nm_fabricante TEXT,
        cd_cls TEXT,
        nr_pmd NUMERIC(10,0),
        cd_tipo_icao TEXT,
        nr_tripulacao_min INTEGER,
        nr_passageiros_max INTEGER,
        nr_assentos INTEGER,
        nr_ano_fabricacao INTEGER,
        dt_validade_cva TEXT,
        dt_validade_ca TEXT,
        dt_canc TEXT,
        ds_motivo_canc TEXT,
        cd_interdicao TEXT,
        ds_gravame TEXT,
        dt_matricula TEXT,
        tp_motor TEXT,
        qt_motor INTEGER,
        tp_pouso TEXT,
        tp_ca TEXT,
        cd_proposito_cave TEXT,
        cf_operacional TEXT,
        ds_categoria_homologacao TEXT,
        tp_operacao TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const q = (req.query.q || '').toString().trim().toUpperCase();

    if (!q || q.length < 2) {
      return res.json({ data: [] });
    }

    const results = [];
    const seen = new Set();

    // 1. Buscar na tabela aircraft_rab (dados ANAC/RAB)
    try {
      const rabResults = await query(
        `SELECT marcas, ds_modelo, nm_fabricante, nr_serie, cd_cls, nr_ano_fabricacao,
                cd_tipo_icao, nr_assentos, nr_pmd, tp_motor, qt_motor
         FROM aircraft_rab
         WHERE marcas ILIKE $1
         ORDER BY marcas ASC
         LIMIT 15`,
        [`%${q}%`]
      );

      for (const r of rabResults) {
        const reg = r.marcas?.toUpperCase();
        if (reg && !seen.has(reg)) {
          seen.add(reg);
          results.push({
            registration: reg,
            aircraftType: r.ds_modelo || '',
            model: r.ds_modelo || '',
            manufacturer: r.nm_fabricante || '',
            serialNumber: r.nr_serie || '',
            category: r.cd_cls || '',
            year: r.nr_ano_fabricacao || null,
            icaoType: r.cd_tipo_icao || '',
            seats: r.nr_assentos || null,
            maxTakeoffWeight: r.nr_pmd || null,
            engineType: r.tp_motor || '',
            engineCount: r.qt_motor || null,
            source: 'rab',
          });
        }
      }
    } catch (err) {
      console.warn('RAB table not available:', err.message);
    }

    // 2. Buscar de aeronaves cadastradas pelo admin
    try {
      const aircraftResults = await query(
        `SELECT DISTINCT registration, type as aircraft_type, model, manufacturer
         FROM aircrafts
         WHERE registration ILIKE $1 AND active = TRUE
         ORDER BY registration ASC
         LIMIT 15`,
        [`%${q}%`]
      );

      for (const r of aircraftResults) {
        const reg = r.registration?.toUpperCase();
        if (reg && !seen.has(reg)) {
          seen.add(reg);
          results.push({
            registration: reg,
            aircraftType: r.aircraft_type || r.type || '',
            model: r.model || '',
            manufacturer: r.manufacturer || '',
            source: 'admin',
          });
        }
      }
    } catch {
      // Tabela aircrafts pode não ter sido criada ainda
    }

    // 3. Buscar de voos anteriores do usuário
    try {
      const flightResults = await query(
        `SELECT DISTINCT registration, aircraft_type
         FROM flights
         WHERE registration ILIKE $1
         ORDER BY registration ASC
         LIMIT 15`,
        [`%${q}%`]
      );

      for (const r of flightResults) {
        const reg = r.registration?.toUpperCase();
        if (reg && !seen.has(reg)) {
          seen.add(reg);
          results.push({
            registration: reg,
            aircraftType: r.aircraft_type || '',
            model: '',
            manufacturer: '',
            source: 'flights',
          });
        }
      }
    } catch {
      // Tabela flights pode não ter sido criada ainda
    }

    return res.json({ data: results.slice(0, 20) });
  } catch (error) {
    console.error('Search registrations error:', error);
    return res.status(500).json({ error: 'Erro ao buscar matrículas', data: [] });
  }
}
