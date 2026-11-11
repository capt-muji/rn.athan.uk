// Implied fajr/isha depression from a short span at solved coordinates.
// Usage: node angles_short.mjs <rows.json> <lat> <lon> <k>
import { readFileSync } from 'node:fs';
import { solarDay } from './solar.js';

const [, , path, latS, lonS, kS] = process.argv;
const lat = Number(latS), lon = Number(lonS), k = Number(kS || 0);
const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const rows = JSON.parse(readFileSync(path, 'utf8'));
const toMin = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(s); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const SIN_H = Math.sin(-0.833 * RAD);

function angleFor(dec, gapMin) {
  const cosHsr = (SIN_H - Math.sin(lat * RAD) * Math.sin(dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
  if (cosHsr < -1 || cosHsr > 1) return null;
  const h = DEG * Math.acos(cosHsr) + gapMin / 4;
  if (h > 180) return null;
  return -DEG * Math.asin(Math.sin(lat * RAD) * Math.sin(dec * RAD) + Math.cos(lat * RAD) * Math.cos(dec * RAD) * Math.cos(h * RAD));
}

const fajr = [], isha = [], ishaGap = [];
for (const [key, r] of Object.entries(rows)) {
  const [Y, M, D] = key.split('-').map(Number);
  const { dec } = solarDay(Y, M, D);
  const f = toMin(r.fajr), sr = toMin(r.sunrise), mg = toMin(r.maghrib), i = toMin(r.isha);
  const a1 = angleFor(dec, sr - f);
  if (a1 !== null) fajr.push(a1);
  const a2 = angleFor(dec, i - (mg - k));
  if (a2 !== null) isha.push(a2);
  ishaGap.push(i - mg);
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] * 0.5 + s[Math.ceil((s.length - 1) / 2)] * 0.5 : null; };
const rng = (a) => a.length ? `${Math.min(...a).toFixed(2)}..${Math.max(...a).toFixed(2)}` : '-';
console.log(path, `fajr ${fajr.length ? med(fajr).toFixed(2) : '-'} (${rng(fajr)})`, `isha ${isha.length ? med(isha).toFixed(2) : '-'} (${rng(isha)})`, `isha-maghrib ${med(ishaGap).toFixed(0)} min`);
