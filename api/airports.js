import { readFileSync } from 'fs';
import path from 'path';
import { setCors } from '../lib/auth.js';

let cache = null;

function getAirports() {
  if (!cache) {
    const filePath = path.join(process.cwd(), 'data', 'airports-br.json');
    cache = JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  return cache;
}

export default async function handler(req, res) {
  if (!setCors(res)) return;

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
}