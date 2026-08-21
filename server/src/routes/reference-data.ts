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

export default router;