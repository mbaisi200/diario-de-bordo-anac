import { Router } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');

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

// Busca de matrículas de aeronaves (registradas + histórico de voos)
router.get('/registrations', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toUpperCase();

    if (!q || q.length < 2) {
      return res.json({ data: [] });
    }

    // Buscar de aeronaves cadastradas pelo admin
    let aircraftResults: any[] = [];
    try {
      aircraftResults = await (await import('../lib/db.js')).query(
        `SELECT DISTINCT registration, type as aircraft_type, model, manufacturer
         FROM aircrafts
         WHERE registration ILIKE $1 AND active = TRUE
         ORDER BY registration ASC
         LIMIT 15`,
        [`%${q}%`]
      );
    } catch {
      // Tabela aircrafts pode não existir ainda
    }

    // Buscar de voos anteriores
    let flightResults: any[] = [];
    try {
      flightResults = await (await import('../lib/db.js')).query(
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
    const seen = new Set<string>();
    const results: any[] = [];

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
});

export default router;