import fs from 'fs';
import { times, mins, diff, CITIES } from './fitlib.mjs';

const raw = JSON.parse(fs.readFileSync('data/jsorg-raw.json', 'utf8'));
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function days(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const report = {};
for (const [city, months] of Object.entries(raw)) {
  const [lat, lon, elev] = CITIES[city] || [];
  if (lat == null) continue;
  const rec = { n: 0, perCol: {}, lines: {} };
  const rows = [];
  for (const [ym, daysArr] of Object.entries(months)) {
    const [y, m] = ym.split('-').map(Number);
    const dim = days(y, m);
    for (const d of daysArr) {
      if (d.day > dim) continue;
      const iso = `${ym}-${String(d.day).padStart(2, '0')}`;
      const t = times(iso, lat, lon, { fajr: 20, isha: 18 });
      rows.push({ iso, printed: d, raw: t });
    }
  }
  rec.n = rows.length;
  for (const c of COLS) {
    const ds = rows.map(r => diff(r.printed[c], r.raw[c]));
    ds.sort((a, b) => a - b);
    const med = ds[Math.floor(ds.length / 2)];
    const within1 = ds.filter(v => Math.abs(v - med) <= 1).length;
    rec.perCol[c] = {
      median: +med.toFixed(2),
      min: +ds[0].toFixed(2),
      max: +ds[ds.length - 1].toFixed(2),
      within1: +(100 * within1 / ds.length).toFixed(1),
    };
  }
  report[city] = rec;
}

fs.writeFileSync('data/jsorg-margins.json', JSON.stringify(report, null, 1));
for (const [c, r] of Object.entries(report)) {
  const p = r.perCol;
  console.log(c.padEnd(15), String(r.n).padStart(3),
    COLS.map(k => `${k.slice(0, 3)} ${p[k].median.toFixed(1)}[${p[k].min.toFixed(0)}..${p[k].max.toFixed(0)}] ${p[k].within1}%`).join(' '));
}
