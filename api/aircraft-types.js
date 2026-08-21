import { readFileSync } from 'fs';
import path from 'path';
import { setCors } from '../lib/auth.js';

let cache = null;

function getAircraftTypes() {
  if (!cache) {
    const filePath = path.join(process.cwd(), 'data', 'aircraft-types.json');
    cache = JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  return cache;
}

export default async function handler(req, res) {
  if (!setCors(res)) return;

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
}