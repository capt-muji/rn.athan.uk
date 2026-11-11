import fs from 'node:fs';
import { loadRows, compute, PRAYERS } from './fitlib.mjs';

const TZ = 'Europe/Sarajevo';
const coords = JSON.parse(fs.readFileSync('data/ba_coords.json', 'utf8'));
const elev = fs.existsSync('data/ba_elev.json') ? JSON.parse(fs.readFileSync('data/ba_elev.json', 'utf8')) : {};
const index = JSON.parse(fs.readFileSync('data/ba_cities_index.json', 'utf8'));
const rowsOut = [];
for (const id of Object.keys(index).map(Number)) {
  const meta = index[id]; const c = coords[id];
  if (!c) continue;
  const data = loadRows(`data/${meta.file}`);
  const rows = compute(data, { lat: c.lat, lon: c.lon, tz: TZ, fajr: 18, isha: 16, madhab: 'shafi' });
  const stat = {};
  for (const p of PRAYERS) {
    const r = rows.map(x => x.want[p] - x.got[p]);
    const mean = r.reduce((a, b) => a + b, 0) / r.length;
    const sd = Math.sqrt(r.reduce((a, b) => a + (b - mean) ** 2, 0) / r.length);
    stat[p] = { mean: +mean.toFixed(2), sd: +sd.toFixed(2), min: +Math.min(...r).toFixed(1), max: +Math.max(...r).toFixed(1) };
  }
  const t = elev[id] ?? null;
  rowsOut.push({ id, place: meta.place, lat: c.lat, lon: c.lon, elevationM: t?.cityElevationM ?? null,
    horizonE: t?.horizonEastDeg ?? null, horizonW: t?.horizonWestDeg ?? null, ...stat });
}
const cols = ['place', 'elevationM', 'horizonE', 'horizonW', 'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
function line(r) { return [r.place, r.elevationM, r.horizonE, r.horizonW, ...['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(p => `${r[p].mean}/${r[p].sd}`)].join('\t'); }
const tsv = [cols.join('\t'), ...rowsOut.map(line)].join('\n');
fs.writeFileSync('data/ba_residuals.tsv', tsv);
fs.writeFileSync('data/ba_residuals.json', JSON.stringify(rowsOut, null, 1));

function regress(xs, ys) {
  const n = xs.length; const mx = xs.reduce((a, b) => a + b, 0) / n; const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  const b = sxy / sxx; const a = my - b * mx; const r2 = (sxy * sxy) / (sxx * syy);
  return { slope: b, intercept: a, r2 };
}
const ok = rowsOut.filter(r => r.horizonE != null);
console.log('n', ok.length);
console.log('sunrise mean vs horizonE :', JSON.stringify(regress(ok.map(r => r.horizonE), ok.map(r => r.sunrise.mean))));
console.log('sunrise mean vs elevation:', JSON.stringify(regress(ok.map(r => r.elevationM), ok.map(r => r.sunrise.mean))));
console.log('maghrib mean vs horizonW :', JSON.stringify(regress(ok.map(r => r.horizonW), ok.map(r => r.maghrib.mean))));
console.log('maghrib mean vs elevation:', JSON.stringify(regress(ok.map(r => r.elevationM), ok.map(r => r.maghrib.mean))));
console.log('dhuhr mean vs lon/lat    :', JSON.stringify(regress(ok.map(r => r.lon), ok.map(r => r.dhuhr.mean))));
console.log(tsv);
