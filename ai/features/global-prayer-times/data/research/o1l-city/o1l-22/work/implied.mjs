import fs from 'node:fs';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';
const { Coordinates, PrayerTimes, CalculationParameters, Madhab, Rounding, HighLatitudeRule } = adhan;

const S = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const slug = process.argv[3];
const surf = S[slug];
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const dates = Object.keys(surf.days).sort().filter((d) => !d.endsWith('02-29'));
const { lat, lon, tz } = surf;
const offCache = new Map();
const offsetFor = (ds) => {
  if (offCache.has(ds)) return offCache.get(ds);
  const [y, mo, d] = ds.split('-').map(Number);
  const probe = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(probe);
  const g = (t) => Number(parts.find((x) => x.type === t).value);
  const local = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'));
  const v = Math.round((local - probe.getTime()) / 60000);
  offCache.set(ds, v);
  return v;
};
const mk = (fa, ia, hl) => {
  const p = new CalculationParameters('custom', fa, ia);
  p.madhab = Madhab.Shafi;
  p.rounding = Rounding.None;
  if (hl) p.highLatitudeRule = hl;
  return p;
};
const at = (ds, p, col) => {
  const [y, mo, d] = ds.split('-').map(Number);
  const pt = new PrayerTimes(new Coordinates(lat, lon), new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)), p);
  const x = pt[col];
  return x.getUTCHours() * 60 + x.getUTCMinutes() + x.getUTCSeconds() / 60 + offsetFor(ds);
};
// implied angle: the angle whose adhan time equals the printed minute (no high-lat rule, angle only)
const implied = (ds, col, target) => {
  let best = null;
  for (let a = 1; a <= 25; a += 0.05) {
    const v = col === 'fajr' ? at(ds, mk(a, 17, undefined), 'fajr') : at(ds, mk(18, a, undefined), 'isha');
    if (!isFinite(v)) continue;
    const err = Math.abs(v - target);
    if (best === null || err < best.err) best = { a, err };
  }
  return best && best.err <= 1.5 ? best.a : null;
};
const rows = dates.map((d) => ({ d, isha: toMin(surf.days[d].isha), fajr: toMin(surf.days[d].fajr) }));
const byMonth = {};
for (const r of rows) {
  const m = r.d.slice(0, 7);
  byMonth[m] = byMonth[m] || { f: [], i: [], iv: [] };
  const fi = implied(r.d, 'fajr', r.fajr);
  const ii = implied(r.d, 'isha', r.isha);
  if (fi !== null) byMonth[m].f.push(fi);
  if (ii !== null) byMonth[m].i.push(ii);
  byMonth[m].iv.push(toMin(surf.days[r.d].isha) - toMin(surf.days[r.d].maghrib));
}
const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : '  -  ');
for (const [m, v] of Object.entries(byMonth)) {
  const iv = v.iv;
  console.log(m, 'fajr-angle', avg(v.f), `(${v.f.length})`, 'isha-angle', avg(v.i), `(${v.i.length})`, 'isha-maghrib', Math.min(...iv), '-', Math.max(...iv));
}
