// Claim 3: Tunisia one frozen recipe 2020-2026. Re-score from the dated rows; verify the 2024/2025
// normalized files against the raw archive NDJSON.
import fs from 'node:fs';
import path from 'node:path';
import { params, times, hm, MODES } from './lib.mjs';

const NA2 = '$HOME/athan-gitree/census/o1k-wide/northafrica2';
const D2 = '$HOME/athan-gitree/census/o1k-wide/deep2';
const LAT = 36.8, LNG = 10.183, TZ = 'Africa/Tunis';
const YEARS = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
const out = { source: 'deep2/data + northafrica2/data tn-inm-tunis-YYYY.json', rawCheck: {}, recipe: {}, perYear: {} };

function loadYear(y) {
  const candidates = [
    path.join(NA2, 'data', `tn-inm-tunis-${y}.json`),
    path.join(D2, 'data', `tn-inm-tunis-${y}.json`),
  ];
  for (const f of candidates) {
    if (!fs.existsSync(f)) continue;
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    const rows = [];
    for (const [iso, r] of Object.entries(d)) {
      if (iso.startsWith('_')) continue;
      rows.push({ iso, printed: { fajr: hm(r.fajr), dhuhr: hm(r.dhuhr), asr: hm(r.asr), maghrib: hm(r.magrib), isha: hm(r.isha) }, raw: r });
    }
    return { file: f, rows: rows.sort((a, b) => a.iso.localeCompare(b.iso)) };
  }
  return null;
}

// raw NDJSON -> rows
function loadRawNdjson(y) {
  const f = path.join(NA2, 'captures', `tn-horaire-tunis-${y}.ndjson`);
  if (!fs.existsSync(f)) return null;
  const rows = fs.readFileSync(f, 'utf8').trim().split('\n').map(l => JSON.parse(l).data);
  const m = new Map(rows.map(r => [r.date.slice(0, 10), r]));
  return m;
}

const data = {};
for (const y of YEARS) {
  const got = loadYear(y);
  if (!got) { out.perYear[y] = { error: 'missing' }; continue; }
  data[y] = got.rows;
  out.perYear[y] = { rows: got.rows.length, file: got.file, first: got.rows[0].iso, last: got.rows[got.rows.length - 1].iso };
}

// raw check: every printed cell in the normalized file vs the archive NDJSON
for (const y of ['2024', '2025']) {
  const raw = loadRawNdjson(y);
  if (!raw || !data[y]) { out.rawCheck[y] = { error: 'missing' }; continue; }
  let n = 0, cellN = 0, cellDiff = 0;
  const diffs = [];
  for (const r of data[y]) {
    const rr = raw.get(r.iso);
    if (!rr) continue;
    n++;
    const pairs = [['fajr', 'sobh', 'fajr'], ['dhuhr', 'dhohr', 'dhuhr'], ['asr', 'aser', 'asr'], ['maghrib', 'magreb', 'magrib'], ['isha', 'isha', 'isha']];
    for (const [k, rk, fk] of pairs) {
      cellN++;
      const a = r.raw[fk], b = rr[rk];
      if (a !== b) { cellDiff++; diffs.push({ iso: r.iso, col: k, file: a, raw: b }); }
    }
  }
  out.rawCheck[y] = { rows: n, cells: cellN, mismatches: cellDiff, sample: diffs.slice(0, 5), rawDays: raw.size };
}

// --- frozen recipe as claimed: 18.1/18.1 round, dhuhr +7 round, maghrib +2 ceil, asr Shafi 0 floor
const p = params({ fajr: 18.1, isha: 18.1, madhab: 'shafi' });
const R = { fajr: ['round', 0], isha: ['round', 0], dhuhr: ['round', 7], asr: ['nearest', 0], maghrib: ['ceil', 2] };
function scoreYear(rows) {
  const res = {};
  let jointW1 = 0, jointN = 0;
  for (const [key, [mode, margin]] of Object.entries(R)) {
    let n = 0, exact = 0, w1 = 0, worst = 0, sumAbs = 0;
    for (const r of rows) {
      const printed = r.printed[key]; if (printed == null) continue;
      const t = times(LAT, LNG, r.iso, p, TZ);
      const c = key === 'maghrib' ? t.sunset : t[key];
      if (c == null) continue;
      const v = MODES[mode](c + margin);
      const d = v - printed;
      n++; if (d === 0) exact++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d)); sumAbs += Math.abs(d);
    }
    res[key] = { n, exact, w1, worst, mae: n ? sumAbs / n : 0 };
  }
  for (const r of rows) {
    let ok = true;
    for (const [key, [mode, margin]] of Object.entries(R)) {
      if (r.printed[key] == null) { ok = false; break; }
      const t = times(LAT, LNG, r.iso, p, TZ);
      const c = key === 'maghrib' ? t.sunset : t[key];
      if (Math.abs(MODES[mode](c + margin) - r.printed[key]) > 1) { ok = false; break; }
    }
    if (ok) jointW1++;
    jointN++;
  }
  res.joint = { n: jointN, allFiveWithin1: jointW1, pct: jointN ? (100 * jointW1 / jointN) : 0 };
  return res;
}
for (const y of YEARS) if (data[y]) out.perYear[y].frozen = scoreYear(data[y]);

// overall across seven years
{
  const all = YEARS.flatMap(y => data[y] || []);
  out.recipe = { params: R, overall: scoreYear(all) };
}

// --- free fit per year: is the optimum the same constant? ---
const ANG = [];
for (let a = 17.5; a <= 18.7001; a += 0.01) ANG.push(Number(a.toFixed(2)));
if (process.env.FREE === '1') for (const y of YEARS) {
  if (!data[y]) continue;
  const rows = data[y];
  // precompute computed times per angle
  const comp = new Map();
  for (const a of ANG) {
    const pp = params({ fajr: a, isha: a, madhab: 'shafi' });
    const m = new Map();
    for (const r of rows) m.set(r.iso, times(LAT, LNG, r.iso, pp, TZ));
    comp.set(a, m);
  }
  const bestAngle = (key) => {
    let best = null;
    for (const a of ANG) {
      const m = comp.get(a);
      for (const mode of ['round', 'floor', 'ceil']) for (const margin of [0, 0.5, 1, -0.5]) {
        let ex = 0, w1 = 0, worst = 0;
        for (const r of rows) {
          const c = m.get(r.iso)[key];
          if (r.printed[key] == null || c == null) continue;
          const d = MODES[mode](c + margin) - r.printed[key];
          if (d === 0) ex++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d));
        }
        const cand = { a, mode, margin, ex, w1, worst };
        if (!best || cand.ex > best.ex || (cand.ex === best.ex && cand.worst < best.worst)) best = cand;
      }
    }
    return best;
  };
  const bestMargin = (key, isSunset) => {
    let best = null;
    const fixed = params({ fajr: 18.1, isha: 18.1, madhab: 'shafi' });
    const m = new Map();
    for (const r of rows) m.set(r.iso, times(LAT, LNG, r.iso, fixed, TZ));
    for (const mode of ['round', 'floor', 'ceil']) for (let margin = -2; margin <= 10.0001; margin += 0.5) {
      let ex = 0, w1 = 0, worst = 0;
      for (const r of rows) {
        const c = isSunset ? m.get(r.iso).sunset : m.get(r.iso)[key];
        if (r.printed[key] == null || c == null) continue;
        const d = MODES[mode](c + margin) - r.printed[key];
        if (d === 0) ex++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d));
      }
      const cand = { mode, margin, ex, w1, worst };
      if (!best || cand.ex > best.ex || (cand.ex === best.ex && cand.worst < best.worst)) best = cand;
    }
    return best;
  };
  out.perYear[y].free = {
    fajr: bestAngle('fajr'),
    isha: bestAngle('isha'),
    dhuhr: bestMargin('dhuhr', false),
    asr: bestMargin('asr', false),
    maghrib: bestMargin('maghrib', true),
  };
  console.error('fit', y, JSON.stringify(out.perYear[y].free));
}

// printed-row overlap 2024 vs 2025 (recomputation evidence)
{
  let same = 0, n = 0;
  const m25 = new Map(data['2025'].map(r => [r.iso.slice(5), r]));
  for (const r of data['2024']) {
    const o = m25.get(r.iso.slice(5)); if (!o) continue;
    n++;
    if (JSON.stringify(r.printed) === JSON.stringify(o.printed)) same++;
  }
  out.rowOverlap2024v2025 = { matchedMonthDays: n, stringIdentical: same };
}

fs.writeFileSync(new URL('./tn.json', import.meta.url), JSON.stringify(out, null, 1));
const summary = { rawCheck: out.rawCheck, overlap: out.rowOverlap2024v2025, perYear: {}, recipe: out.recipe.overall };
for (const y of YEARS) if (out.perYear[y].frozen) summary.perYear[y] = { rows: out.perYear[y].rows, frozen: out.perYear[y].frozen, free: out.perYear[y].free };
console.log(JSON.stringify(summary, null, 1));
