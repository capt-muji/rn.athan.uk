// UK pass 2: classify every town surface on my own measurements (F range, named-angle score).
import fs from 'node:fs';
import path from 'node:path';
import { params, times, hm, MODES } from './lib.mjs';

const DATA = '$HOME/athan-gitree/census/o1k-wide/uktowns2/data';
const TZ = 'Europe/London';
const mosaic = JSON.parse(fs.readFileSync('$HOME/athan-gitree/census/o1k-wide/fit12/uk-mosaic.json', 'utf8')).towns;
const coords = Object.fromEntries(mosaic.map(c => [path.basename(c.file).replace('.json', ''), { lat: c.lat, lng: c.lng, town: c.town }]));
Object.assign(coords, {
  'coventry-zeenatul-islam-2026': { lat: 52.4068, lng: -1.5197, town: 'Coventry' },
  'reading-amic-2026': { lat: 51.4543, lng: -0.9781, town: 'Reading' },
  'oldham-ocmic-2026': { lat: 53.5409, lng: -2.1114, town: 'Oldham OCMIC' },
  'oldham-westwood-2026': { lat: 53.5409, lng: -2.1114, town: 'Oldham Westwood' },
  'oxford-coms-2026': { lat: 51.752, lng: -1.2577, town: 'Oxford' },
  'rochdale-golden-2026': { lat: 53.6097, lng: -2.1561, town: 'Rochdale' },
  'bolton-zakariyya-2026': { lat: 53.5769, lng: -2.4282, town: 'Bolton' },
});

function load(file, pm12 = false) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
  const pm = (x) => { const v = hm(x); return v != null && pm12 && v < 720 ? v + 720 : v; };
  return Object.entries(d).filter(([iso]) => /^\d{4}-\d{2}-\d{2}$/.test(iso)).map(([iso, r]) => ({
    iso,
    fajr: hm(r.fajr), sunrise: hm(r.sunrise), maghrib: pm(r.magrib ?? r.maghrib), isha: pm(r.isha),
  })).sort((a, b) => a.iso.localeCompare(b.iso));
}

function namedScore(rows, lat, lng, fa, is) {
  const p = params({ fajr: fa, isha: is, madhab: 'hanafi' });
  let best = null;
  for (const mode of ['floor', 'ceil', 'nearest']) for (let m = -15; m <= 15; m++) {
    let n = 0, ex = 0, w1 = 0, worst = 0;
    for (const r of rows) {
      const t = times(lat, lng, r.iso, p, TZ);
      for (const key of ['fajr', 'isha']) {
        if (r[key] == null || t[key] == null) continue;
        // score each column separately below
      }
    }
    // fajr only here
    for (const r of rows) {
      const c = times(lat, lng, r.iso, p, TZ).fajr;
      if (c == null || r.fajr == null) continue;
      const d = MODES[mode](c + m) - r.fajr;
      n++; if (d === 0) ex++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d));
    }
    const cand = { mode, margin: m, n, exact: ex, w1, worst };
    if (!best || cand.w1 > best.w1 || (cand.w1 === best.w1 && cand.exact > best.exact) || (cand.w1 === best.w1 && cand.exact === best.exact && cand.worst < best.worst)) best = cand;
  }
  return best;
}

const result = [];
for (const [base, c] of Object.entries(coords)) {
  const file = base + '.json';
  if (!fs.existsSync(path.join(DATA, file))) continue;
  let rows;
  try { rows = load(file); } catch { continue; }
  if (!rows.length || rows[0].sunrise == null) { result.push({ town: c.town, file: base, skipped: 'no printed sunrise' }); continue; }
  const F = rows.filter(r => r.fajr != null && r.sunrise != null).map(r => r.sunrise - r.fajr);
  const I = rows.filter(r => r.isha != null && r.maghrib != null).map(r => r.isha - r.maghrib);
  const s18 = namedScore(rows, c.lat, c.lng, 18, 18);
  const s15 = namedScore(rows, c.lat, c.lng, 15, 15);
  const angle18 = s18.w1 / s18.n;
  const cls = angle18 >= 0.8 ? 'angle-18' : (Math.max(...F) - Math.min(...F) <= 45 ? 'table-interval' : 'table-seasonal');
  result.push({
    town: c.town, file: base, rows: rows.length,
    Fmin: Math.min(...F), Fmax: Math.max(...F), Frange: Math.max(...F) - Math.min(...F),
    Imin: Math.min(...I), Imax: Math.max(...I), Irange: Math.max(...I) - Math.min(...I),
    s18: { exact: s18.exact, w1: s18.w1, n: s18.n, worst: s18.worst, margin: s18.margin, mode: s18.mode },
    s15w1: s15.w1, class: cls,
  });
}
const counts = result.filter(r => !r.skipped).reduce((a, r) => { a[r.class] = (a[r.class] || 0) + 1; return a; }, {});
fs.writeFileSync(new URL('./uk2.json', import.meta.url), JSON.stringify({ counts, result }, null, 1));
for (const r of result) console.log(r.skipped ? `${r.town}\tSKIP ${r.skipped}` : `${r.town}\t${r.rows}\tF ${r.Fmin}-${r.Fmax} (${r.Frange})\tI ${r.Imin}-${r.Imax}\t18/18 w1 ${r.s18.w1}/${r.s18.n} exact ${r.s18.exact} worst ${r.s18.worst}\t15/15 w1 ${r.s15w1}\t${r.class}`);
console.log('COUNTS', JSON.stringify(counts));
