// CDUM confirmation: 20 city pages, one year, 18/17 Hanafi on the derived positions,
// plus the Салехард/Surgut label check.
const fs = require('fs');
const path = require('path');
const { scoreCity, TZ } = require('./scorelib');
const L = require(path.join(process.env.HOME, 'athan-gitree/census/c23-russia/fit/lib'));

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/cdum_2026.json'), 'utf8'));
const prior = JSON.parse(fs.readFileSync(path.join(process.env.HOME,
  'athan-gitree/census/c23-russia/fit/verification_cdum.json'), 'utf8'));
const pos = {};
for (const c of prior.cities) if (c.lat) pos[c.city] = { lat: c.lat, lon: c.lon };

const p = L.params({ fajrAngle: 18, ishaAngle: 17 });
p.rounding = 'none';

const out = [];
for (const [city, rec] of Object.entries(data)) {
  if (!rec.rows || Object.keys(rec.rows).length === 0) {
    out.push({ city, rows: 0, note: 'image-only page, no text table' });
    continue;
  }
  const z = TZ[city] || 'Europe/Moscow';
  const ref = pos[city];
  if (!ref) { out.push({ city, rows: Object.keys(rec.rows).length, note: 'no derived position' }); continue; }
  const s = scoreCity(rec.rows, ref.lat, ref.lon, z, p);
  out.push({ city, rows: Object.keys(rec.rows).length, tz: z, lat: +ref.lat.toFixed(3), lon: +ref.lon.toFixed(3),
    days: s.used, cols: s.cols });
}
fs.writeFileSync(path.join(__dirname, 'data/cdum_confirm.json'), JSON.stringify(out, null, 1));
console.log('city              rows  days  fajr  sunrise dhuhr  asr   maghrib isha   (within 1 min %)');
for (const o of out) {
  if (!o.cols) { console.log(o.city.padEnd(18), String(o.rows).padStart(4), ' ', o.note); continue; }
  const w = (c) => String(o.cols[c].w1).padStart(5);
  console.log(o.city.padEnd(18), String(o.rows).padStart(4), String(o.days).padStart(5),
    w('fajr'), w('sunrise'), w('dhuhr'), w('asr'), w('maghrib'), w('isha'));
}
