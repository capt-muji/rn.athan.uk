// Pulls Kemenag's own public prayer-time records for the six study cities, 2026.
// The endpoint is the ministry's public API (no key, no session); one day per request.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, 'kemenag');
const API = 'https://bimasislam.kemenag.go.id/api/v1/public';

export const CITIES = [
  { key: 'jakarta', cityId: 'cb2d6586-c0d9-48af-a8c2-fc3b886c7460', zone: 'Asia/Jakarta' },
  { key: 'medan', cityId: '0e851335-9fdb-40a8-9429-a2a7938ca4df', zone: 'Asia/Jakarta' },
  { key: 'pontianak', cityId: '8dec396b-cfa5-4f43-ad5e-363b87db0260', zone: 'Asia/Pontianak' },
  { key: 'surabaya', cityId: '08099d8a-c291-4922-a848-0460a62a8018', zone: 'Asia/Makassar' },
  { key: 'makassar', cityId: '5fff1150-d39a-411f-b39d-af4314ce5355', zone: 'Asia/Makassar' },
  { key: 'jayapura', cityId: '555d572d-e33e-4bd4-b751-7da741969d30', zone: 'Asia/Jayapura' },
];

function dates2026() {
  const out = [];
  const d = new Date(Date.UTC(2026, 0, 1));
  while (d.getUTCFullYear() === 2026) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
    } catch {}
    await new Promise((res) => setTimeout(res, 250 * (i + 1)));
  }
  throw new Error(`failed ${url}`);
}

mkdirSync(DATA, { recursive: true });

const meta = await get(`${API}/cities`);
writeFileSync(join(DATA, 'cities.json'), JSON.stringify(meta, null, 1));

const dates = dates2026();
for (const city of CITIES) {
  const outPath = join(DATA, `${city.key}.json`);
  if (existsSync(outPath)) {
    const have = JSON.parse(readFileSync(outPath, 'utf8'));
    if (Object.keys(have.rows).length === dates.length) {
      console.log(`skip ${city.key}`);
      continue;
    }
  }
  const rows = {};
  let cursor = 0;
  async function worker() {
    while (cursor < dates.length) {
      const i = cursor;
      cursor += 1;
      const d = dates[i];
      const j = await get(`${API}/prayer-times?city_id=${city.cityId}&date=${d}`);
      if (j && j.data) rows[d] = j.data;
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));
  writeFileSync(outPath, JSON.stringify({ city: city.key, cityId: city.cityId, rows }, null, 0));
  console.log(`fetched ${city.key} ${Object.keys(rows).length}/${dates.length}`);
}
