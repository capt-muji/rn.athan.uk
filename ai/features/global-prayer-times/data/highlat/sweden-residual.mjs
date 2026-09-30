// R11 Part 3, the residual. After the 300-minute symmetric floor, Kiruna still carries an
// 11-minute median on Shuruk while Umea carries 2.8. This locates the residual in time and
// tests the one explanation that scales with latitude: the sunrise depression angle. At
// 68 N in April the sun moves almost horizontally, so a tenth of a degree is many minutes.
import { readFileSync } from 'node:fs';
import { timeAtAngle, midDay, toH } from '../countries/solar-harness.mjs';

const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CITIES = [
  { name: 'Malmo', f: '../countries/se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  { name: 'Stockholm', f: '../countries/se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  { name: 'Umea', f: './se-umea.tsv', lat: 63.8258, lng: 20.2630 },
  { name: 'Lulea', f: './se-lulea.tsv', lat: 65.5848, lng: 22.1567 },
  { name: 'Gallivare', f: './se-gallivare.tsv', lat: 67.1333, lng: 20.6667 },
  { name: 'Pajala', f: './se-pajala.tsv', lat: 67.2117, lng: 23.3700 },
  { name: 'Kiruna', f: '../countries/se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
];
const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL(f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const med = a => { if (!a.length) return NaN; const s = a.map(Math.abs).sort((x, y) => x - y); return +s[Math.floor(s.length / 2)].toFixed(1); };
const mx = a => { if (!a.length) return NaN; const s = a.map(Math.abs).sort((x, y) => x - y); return +s[s.length - 1].toFixed(1); };

// Best sunrise angle per city, on the unfloored days only.
console.log('=== best-fitting sunrise depression per city, unfloored days only ===');
console.log('city        bestAngle  medianErr  maxErr  unflooredDays');
for (const c of CITIES) {
  const rows = load(c.f);
  let ba = null, bm = 1e9, bmx = null, n = 0;
  for (let A = 0.7; A <= 3.5; A += 0.01) {
    const e = [];
    for (const r of rows) {
      const noon = midDay(2026, r.m, r.d, c.lng, r.tz);
      const sr = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, A, -1);
      if (sr === null) continue;
      const half = (noon - sr) * 60;
      if (half > 570 || half < 150) continue;   // the floor would bind, skip
      e.push((toH(r.shuruk) - sr) * 60);
    }
    if (e.length < 30) continue;
    const m = med(e);
    if (m < bm) { bm = m; ba = A; bmx = mx(e); n = e.length; }
  }
  console.log(`${c.name.padEnd(11)} ${ba.toFixed(2)}       ${String(bm).padStart(5)}      ${String(bmx).padStart(5)}   ${n}`);
}

// Where the residual sits, per month, at the city's own best angle.
console.log('\n=== Shuruk residual per month at the per-city best angle, median abs minutes ===');
console.log('city        Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec');
const ANG = { Malmo: 1.67, Stockholm: 1.55, Umea: 1.55, Lulea: 1.55, Gallivare: 1.55, Pajala: 1.55, Kiruna: 1.55 };
for (const c of CITIES) {
  const rows = load(c.f);
  const out = [];
  for (let m = 1; m <= 12; m++) {
    const e = [];
    for (const r of rows.filter(x => x.m === m)) {
      const noon = midDay(2026, r.m, r.d, c.lng, r.tz);
      const sr = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, ANG[c.name], -1);
      const half = sr === null ? (m >= 4 && m <= 8 ? 720 : 0) : (noon - sr) * 60;
      const clamped = Math.min(570, Math.max(150, half));
      e.push((toH(r.shuruk) - (noon - clamped / 60)) * 60);
    }
    out.push(String(med(e)).padStart(4));
  }
  console.log(`${c.name.padEnd(11)} ${out.join(' ')}`);
}

// Is Kiruna's own latitude what IFiS used? Solve the latitude on the unfloored days only.
console.log('\n=== latitude implied by the Shuruk column, UNFLOORED days only, angle 1.55 ===');
console.log('city        impliedLat  trueLat   gap    medianErrAtImplied');
for (const c of CITIES) {
  const rows = load(c.f);
  let bl = null, bm = 1e9;
  for (let L = c.lat - 4; L <= c.lat + 2; L += 0.02) {
    const e = [];
    for (const r of rows) {
      const noon = midDay(2026, r.m, r.d, c.lng, r.tz);
      const srTrue = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, 1.55, -1);
      if (srTrue === null) continue;
      const half = (noon - srTrue) * 60;
      if (half > 570 || half < 150) continue;
      const sr = timeAtAngle(2026, r.m, r.d, L, c.lng, r.tz, 1.55, -1);
      if (sr === null) continue;
      e.push((toH(r.shuruk) - sr) * 60);
    }
    if (e.length < 30) continue;
    const m = med(e);
    if (m < bm) { bm = m; bl = L; }
  }
  console.log(`${c.name.padEnd(11)} ${bl === null ? '   na' : bl.toFixed(2)}       ${c.lat.toFixed(2)}   ${bl === null ? ' na' : (bl - c.lat).toFixed(2).padStart(6)}   ${bm.toFixed(1)}`);
}
