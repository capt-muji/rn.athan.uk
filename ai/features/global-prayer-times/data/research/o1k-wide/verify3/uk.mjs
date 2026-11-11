// Claim 5: English towns are interval tables (LUPT construction), not angle tables.
// Independent F/I arrays from the raw captures and an angle-vs-interval model test.
import fs from 'node:fs';
import path from 'node:path';
import { params, times, hm, MODES, median } from './lib.mjs';

const DATA = '$HOME/athan-gitree/census/o1k-wide/uktowns2/data';
const out = { towns: {}, scan: {}, notes: {} };

const TOWNS = {
  nottingham: { file: 'nottingham-ic-2026.json', lat: 52.9548, lng: -1.1581, span: '2026, 365 keys (fit12 used 273, May-Jul excluded)' },
  coventry: { file: 'coventry-zeenatul-islam-2026.json', lat: 52.4068, lng: -1.5197, span: '2026' },
  luton: { file: 'luton-central-mosque-2026-11.json', lat: 51.8787, lng: -0.42, span: '2026-11' },
};
const TZ = 'Europe/London';

function load(file, pm12 = false) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
  const pm = (x) => { const v = hm(x); return v != null && pm12 && v < 720 ? v + 720 : v; };
  return Object.entries(d).filter(([iso]) => /^\d{4}-\d{2}-\d{2}$/.test(iso)).map(([iso, r]) => ({
    iso,
    printed: {
      fajr: hm(r.fajr), sunrise: hm(r.sunrise), dhuhr: pm(r.dhuhr),
      asr: pm(r.asr1 ?? r.asr), maghrib: pm(r.magrib ?? r.maghrib), isha: pm(r.isha),
    },
  })).sort((a, b) => a.iso.localeCompare(b.iso));
}

// interval model: fajr = printed sunrise - F0 (one free constant)
// angle model: fajr = computed(angle) + c (angle free, c fitted)
function modelTest(rows, key, anchorKey) {
  const pts = rows.filter(r => r.printed[key] != null && r.printed[anchorKey] != null);
  if (pts.length < 10) return null;
  const offsets = pts.map(r => key === 'isha' ? r.printed[key] - r.printed[anchorKey] : r.printed[anchorKey] - r.printed[key]);
  const F0 = median(offsets);
  let intSS = 0;
  for (const o of offsets) intSS += (o - F0) ** 2;
  const intRms = Math.sqrt(intSS / offsets.length);

  let best = null;
  for (let a = 8; a <= 20.0001; a += 0.05) {
    const p = params({ fajr: a, isha: 18, madhab: 'shafi' });
    const res = pts.map(r => r.printed[key] - times(pts === rows ? 0 : 0, 0, r.iso, p, TZ)[key]);
    // the line above is wrong on purpose-free: compute properly below
  }
  // proper loop
  best = null;
  for (let a = 8; a <= 20.0001; a += 0.05) {
    const p = params({ fajr: a, isha: 18, madhab: 'shafi' });
    const residuals = pts.map(r => r.printed[key] - times(0.0, 0.0, r.iso, p, TZ)[key]);
    // recompute with the town's coordinates in the caller; placeholder replaced below
  }
  return { n: pts.length, F0, intRms, offsets };
}

// proper implementation with coordinates
function modelTest2(rows, key, anchorKey, lat, lng) {
  const pts = rows.filter(r => r.printed[key] != null && r.printed[anchorKey] != null);
  if (pts.length < 10) return null;
  const offsets = pts.map(r => key === 'isha' ? r.printed[key] - r.printed[anchorKey] : r.printed[anchorKey] - r.printed[key]);
  const F0 = median(offsets);
  const intRms = Math.sqrt(offsets.reduce((s, o) => s + (o - F0) ** 2, 0) / offsets.length);

  let best = null;
  for (let a = 8; a <= 20.0001; a += 0.05) {
    const p = params({ fajr: key === 'fajr' ? a : 18, isha: key === 'isha' ? a : 18, madhab: 'shafi' });
    const diffs = pts.map(r => {
      const c = times(lat, lng, r.iso, p, TZ)[key];
      return c == null ? null : r.printed[key] - c;
    }).filter(x => x != null);
    const c0 = median(diffs);
    const rms = Math.sqrt(diffs.reduce((s, d) => s + (d - c0) ** 2, 0) / diffs.length);
    const cand = { angle: Number(a.toFixed(2)), offset: c0, rms };
    if (!best || cand.rms < best.rms) best = cand;
  }
  return { n: pts.length, F0, intRms, angle: best.angle, angleOffset: best.offset, angleRms: best.rms, winner: best.rms < intRms ? 'angle' : 'interval' };
}

// named angle candidates, integer minute offset fitted
function named(rows, lat, lng) {
  const cands = [
    ['Karachi 18/18', 18, 18], ['ISNA 15/15', 15, 15], ['MWL 18/17', 18, 17], ['Wifaqul 18/15', 18, 15],
  ];
  const res = {};
  for (const [name, fa, is] of cands) {
    const p = params({ fajr: fa, isha: is, madhab: 'hanafi' });
    let best = null;
    for (const mode of ['floor', 'ceil', 'nearest']) for (let m = -15; m <= 15; m++) {
      let n = 0, ex = 0, w1 = 0, worst = 0;
      for (const r of rows) {
        const c = times(lat, lng, r.iso, p, TZ).fajr;
        if (c == null || r.printed.fajr == null) continue;
        const d = MODES[mode](c + m) - r.printed.fajr;
        n++; if (d === 0) ex++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d));
      }
      const cand = { mode, margin: m, n, exact: ex, w1, worst };
      if (!best || cand.exact > best.exact || (cand.exact === best.exact && cand.worst < best.worst)) best = cand;
    }
    res[name] = best;
  }
  return res;
}

// per-month F structure: distinct values and the biggest day-to-day step
function arrayShape(rows, key, anchorKey) {
  const byMonth = {};
  for (const r of rows) {
    if (r.printed[key] == null || r.printed[anchorKey] == null) continue;
    const mm = r.iso.slice(0, 7);
    (byMonth[mm] ||= []).push({ iso: r.iso, v: key === 'isha' ? r.printed[key] - r.printed[anchorKey] : r.printed[anchorKey] - r.printed[key] });
  }
  const shape = {};
  for (const [mm, arr] of Object.entries(byMonth)) {
    const vals = arr.map(x => x.v);
    let maxStep = 0;
    for (let i = 1; i < vals.length; i++) maxStep = Math.max(maxStep, Math.abs(vals[i] - vals[i - 1]));
    shape[mm] = { n: vals.length, min: Math.min(...vals), max: Math.max(...vals), distinct: [...new Set(vals)].sort((a, b) => a - b), maxStep };
  }
  return shape;
}

for (const [tag, t] of Object.entries(TOWNS)) {
  const rows = load(t.file);
  const fajrTest = modelTest2(rows, 'fajr', 'sunrise', t.lat, t.lng);
  const ishaTest = modelTest2(rows, 'isha', 'maghrib', t.lat, t.lng);
  // Nottingham: also run the 273-row variant excluding May-Jul, as fit12 did
  let fajrTestNoSummer = null, ishaTestNoSummer = null;
  if (tag === 'nottingham') {
    const cut = rows.filter(r => !/^2026-(05|06|07)/.test(r.iso));
    fajrTestNoSummer = modelTest2(cut, 'fajr', 'sunrise', t.lat, t.lng);
    ishaTestNoSummer = modelTest2(cut, 'isha', 'maghrib', t.lat, t.lng);
  }
  out.towns[tag] = {
    file: t.file, span: t.span, rows: rows.length,
    fajr: fajrTest, isha: ishaTest,
    fajrNoSummer: fajrTestNoSummer, ishaNoSummer: ishaTestNoSummer,
    fajrArray: arrayShape(rows, 'fajr', 'sunrise'),
    ishaArray: arrayShape(rows, 'isha', 'maghrib'),
    namedFajr: named(rows, t.lat, t.lng),
  };
}

// scan every town file with a printed sunrise, for the model-class counts
{
  const files = fs.readdirSync(DATA).filter(f => f.endsWith('.json') && !f.startsWith('_') && !f.startsWith('lupt') && !f.startsWith('elm'));
  const coords = JSON.parse(fs.readFileSync('$HOME/athan-gitree/census/o1k-wide/fit12/uk-mosaic.json', 'utf8')).towns;
  const coordMap = Object.fromEntries(coords.map(c => {
    const base = path.basename(c.file).replace('.json', '');
    return [base, { lat: c.lat, lng: c.lng, tag: c.tag }];
  }));
  // extra towns not in fit12's 18 (full-year feeds fit4 held)
  const extra = {
    'reading-amic-2026': { lat: 51.4543, lng: -0.9781 },
    'coventry-zeenatul-islam-2026': { lat: 52.4068, lng: -1.5197 },
    'oldham-ocmic-2026': { lat: 53.5409, lng: -2.1114 },
    'oldham-westwood-2026': { lat: 53.5409, lng: -2.1114 },
    'oxford-coms-2026': { lat: 51.752, lng: -1.2577 },
    'rochdale-golden-2026': { lat: 53.6097, lng: -2.1561 },
    'bolton-zakariyya-2026': { lat: 53.5769, lng: -2.4282 },
  };
  const rowsOut = [];
  for (const f of files.sort()) {
    const base = f.replace('.json', '');
    const c = coordMap[base] || extra[base];
    if (!c) continue;
    let rows;
    try { rows = load(f); } catch { continue; }
    if (!rows.length || rows[0].printed.sunrise == null) continue;
    const m = modelTest2(rows, 'fajr', 'sunrise', c.lat, c.lng);
    if (!m) continue;
    rowsOut.push({ file: base, rows: rows.length, winner: m.winner, intRms: Number(m.intRms.toFixed(2)), angle: m.angle, angleRms: Number(m.angleRms.toFixed(2)) });
  }
  out.scan = rowsOut;
  out.notes.modelCounts = {
    interval: rowsOut.filter(r => r.winner === 'interval').length,
    angle: rowsOut.filter(r => r.winner === 'angle').length,
    total: rowsOut.length,
  };
}

// LUPT reference: its own F/I array on the same month-days as the November towns
{
  const elm = load('elm-london-2026.json', true);
  const lupt = load('lupt-2027-11.json', true);
  out.luptReference = {
    elmF: arrayShape(elm, 'fajr', 'sunrise')['2026-11'],
    elmI: arrayShape(elm, 'isha', 'maghrib')['2026-11'],
    luptF: arrayShape(lupt, 'fajr', 'sunrise')['2027-11'],
    luptI: arrayShape(lupt, 'isha', 'maghrib')['2027-11'],
  };
  // same-MM-DD deltas for Luton/Coventry against ELM (the LUPT-adopted London table)
  const elmMap = new Map(elm.map(r => [r.iso.slice(5), r]));
  for (const [tag, t] of Object.entries(TOWNS)) {
    const rows = load(t.file);
    const d = [];
    for (const r of rows) {
      const e = elmMap.get(r.iso.slice(5)); if (!e) continue;
      d.push({ iso: r.iso, fajr: r.printed.fajr - e.printed.fajr, isha: r.printed.isha - e.printed.isha });
    }
    if (d.length) out.towns[tag].vsElm = {
      n: d.length,
      fajr: { mean: d.reduce((s, x) => s + x.fajr, 0) / d.length, min: Math.min(...d.map(x => x.fajr)), max: Math.max(...d.map(x => x.fajr)) },
      isha: { mean: d.reduce((s, x) => s + x.isha, 0) / d.length, min: Math.min(...d.map(x => x.isha)), max: Math.max(...d.map(x => x.isha)) },
    };
  }
}

fs.writeFileSync(new URL('./uk.json', import.meta.url), JSON.stringify(out, null, 1));
const compact = { towns: {}, scan: out.scan, counts: out.notes.modelCounts, lupt: out.luptReference };
for (const [k, v] of Object.entries(out.towns)) compact.towns[k] = { rows: v.rows, fajr: v.fajr, isha: v.isha, fajrNoSummer: v.fajrNoSummer, ishaNoSummer: v.ishaNoSummer, namedFajr: v.namedFajr, vsElm: v.vsElm, fajrArray: v.fajrArray, ishaArray: v.ishaArray };
console.log(JSON.stringify(compact, null, 1));
