import { Router } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', '..', 'data');

let airportsCache = null;
let aircraftTypesCache = null;

function getAirports() {
  if (!airportsCache) {
    airportsCache = JSON.parse(readFileSync(path.join(dataDir, 'airports-br.json'), 'utf-8'));
  }
  return airportsCache;
}

function getAircraftTypes() {
  if (!aircraftTypesCache) {
    aircraftTypesCache = JSON.parse(readFileSync(path.join(dataDir, 'aircraft-types.json'), 'utf-8'));
  }
  return aircraftTypesCache;
}

const router = Router();

router.get('/airports', (req, res) => {
  const q = (req.query.q || '').toString().trim().toUpperCase();
  const airports = getAirports();

  if (!q) {
    return res.json({ data: airports });
  }

  const results = airports
    .filter((a) => {
      const icao = a.icao.toUpperCase();
      const name = a.name.toUpperCase();
      const city = a.city.toUpperCase();
      const region = a.region.toUpperCase();
      return icao.startsWith(q) || name.includes(q) || city.includes(q) || region.includes(q);
    })
    .slice(0, 20);

  return res.json({ data: results });
});

router.get('/aircraft-types', (req, res) => {
  const q = (req.query.q || '').toString().trim().toUpperCase();
  const types = getAircraftTypes();

  if (!q) {
    return res.json({ data: types });
  }

  const results = types
    .filter((t) => {
      const model = (t.model || '').toUpperCase();
      const manufacturer = (t.manufacturer || '').toUpperCase();
      const icao = (t.icao || '').toUpperCase();
      return model.includes(q) || manufacturer.includes(q) || icao.startsWith(q);
    })
    .slice(0, 20);

  return res.json({ data: results });
});

// Busca de matrículas de aeronaves (RAB/ANAC + registradas + histórico de voos)
router.get('/registrations', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toUpperCase();

    if (!q || q.length < 2) {
      return res.json({ data: [] });
    }

    const seen = new Set<string>();
    const results: any[] = [];
    const db = (await import('../lib/db.js')).sql;

    // 1. Buscar na tabela aircraft_rab (dados ANAC/RAB)
    try {
      const rabResults = await db(
        `SELECT marcas, ds_modelo, nm_fabricante, nr_serie, cd_cls, nr_ano_fabricacao,
                cd_tipo_icao, nr_assentos, nr_pmd, tp_motor, qt_motor
         FROM aircraft_rab
         WHERE marcas ILIKE $1
         ORDER BY marcas ASC
         LIMIT 15`,
        [`%${q}%`]
      );

      for (const r of rabResults) {
        const reg = (r.marcas || '').toUpperCase();
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
    } catch (err: any) {
      console.warn('RAB table not available:', err.message);
    }

    // 2. Buscar de aeronaves cadastradas pelo admin
    try {
      const aircraftResults = await db(
        `SELECT DISTINCT registration, type as aircraft_type, model, manufacturer
         FROM aircrafts
         WHERE registration ILIKE $1 AND active = TRUE
         ORDER BY registration ASC
         LIMIT 15`,
        [`%${q}%`]
      );

      for (const r of aircraftResults) {
        const reg = (r.registration || '').toUpperCase();
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
      // Tabela aircrafts pode não existir ainda
    }

    // 3. Buscar de voos anteriores
    try {
      const flightResults = await db(
        `SELECT DISTINCT registration, aircraft_type
         FROM flights
         WHERE registration ILIKE $1
         ORDER BY registration ASC
         LIMIT 15`,
        [`%${q}%`]
      );

      for (const r of flightResults) {
        const reg = (r.registration || '').toUpperCase();
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
});

export default router;