// Whole-axis district fit. Sharded: SHARD=n TOTAL=k over the enumerated list.
// Test A: the one recipe swept at every district with a gazetteer point.
// Test B: same-state difference-space residual, winter and summer.
import fs from 'node:fs';
import path from 'node:path';
import { loadAdhan, parseHHMM, bestMargin, evalFixed } from '../../germany-cities/fit/lib.mjs';

const OUT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const SHARD = Number(process.env.SHARD ?? 0), TOTAL = Number(process.env.TOTAL ?? 1);
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const isWinter = (k) => { const m = Number(k.slice(5, 7)); return m <= 3 || m >= 10; };
const wrap = (d) => { d %= 1440; if (d > 720) d -= 1440; if (d < -720) d += 1440; return d; };
const FAJRS = [17.0, 17.5, 18.0, 18.25, 18.5];
const ISHAS = [15.0, 15.5, 15.75, 16.0, 16.25, 16.5, 17.0];

const adhan = await loadAdhan();
const sun = JSON.parse(fs.readFileSync(`${OUT}/data/igmg-sun.json`, 'utf8'));
const all = JSON.parse(fs.readFileSync(`${OUT}/data/parse-all.json`, 'utf8'));
const norm = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss')
  .toLowerCase().replace(/[^a-z0-9]/g, '');
const point = {};
for (const v of Object.values(sun)) {
  if (!v.sun) continue;
  const k = norm(v.name);
  if (!(k in point)) point[k] = v.sun;
}

const secOf = (dt) => dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
function build(lat, lon, keys) {
  const coords = new adhan.Coordinates(lat, lon);
  const n = keys.length;
  const col = { sunrise: new Float64Array(n), dhuhr: new Float64Array(n), asr1: new Float64Array(n),
                asr2: new Float64Array(n), maghrib: new Float64Array(n) };
  const fajr = {}, isha = {};
  for (const a of FAJRS) fajr[a] = new Float64Array(n).fill(NaN);
  for (const a of ISHAS) isha[a] = new Float64Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const [y, m, d] = keys[i].split('-').map(Number);
    const st = new adhan.SolarTime(new Date(y, m - 1, d), coords);
    const inst = (h) => new adhan.TimeComponents(h).utcDate(y, m - 1, d);
    col.sunrise[i] = secOf(inst(st.sunrise));
    col.dhuhr[i] = secOf(inst(st.transit));
    col.asr1[i] = secOf(inst(st.afternoon(1)));
    col.asr2[i] = secOf(inst(st.afternoon(2)));
    col.maghrib[i] = secOf(inst(st.sunset));
    for (const a of FAJRS) { const t = inst(st.hourAngle(-a, false)); if (!isNaN(t.getTime())) fajr[a][i] = secOf(t); }
    for (const a of ISHAS) { const t = inst(st.hourAngle(-a, true)); if (!isNaN(t.getTime())) isha[a][i] = secOf(t); }
  }
  return { col, fajr, isha };
}

const mine = all.filter((s, i) => s.rows && i % TOTAL === SHARD);
const rows = [];
for (const s of mine) {
  const pt = point[norm(s.name)];
  if (!pt) continue;
  const table = JSON.parse(fs.readFileSync(`${OUT}/data/district-${s.id}-2026.json`, 'utf8'));
  const keys = Object.keys(table).sort();
  const B = build(pt.lat, pt.lon, keys);
  const chart = (c) => Int32Array.from(keys, (k) => parseHHMM(table[k][c]));
  const solar = {
    sunrise: bestMargin(B.col.sunrise, chart('sunrise')),
    dhuhr: bestMargin(B.col.dhuhr, chart('dhuhr')),
    asrShafi: bestMargin(B.col.asr1, chart('asr')),
    asrHanafi: bestMargin(B.col.asr2, chart('asr')),
    maghrib: bestMargin(B.col.maghrib, chart('maghrib')),
  };
  const wIdx = keys.map((k, i) => (isWinter(k) ? i : -1)).filter((i) => i >= 0);
  const pick = (arr) => Float64Array.from(wIdx, (i) => arr[i]);
  const wf = pick(chart('fajr')), wi = pick(chart('isha'));
  const fajrAngle = {}, ishaAngle = {};
  for (const a of FAJRS) if (wIdx.every((i) => !isNaN(B.fajr[a][i]))) fajrAngle[a] = evalFixed(pick(B.fajr[a]), wf, 0, 'nearest');
  for (const a of ISHAS) if (wIdx.every((i) => !isNaN(B.isha[a][i]))) ishaAngle[a] = evalFixed(pick(B.isha[a]), wi, 0, 'nearest');
  rows.push({ id: s.id, name: s.name, state: s.state, lat: pt.lat, lon: pt.lon, solar, fajrAngle, ishaAngle });
}
fs.writeFileSync(`${OUT}/fit/sweep-${SHARD}.json`, JSON.stringify(rows, null, 1));
console.log(`shard ${SHARD}: ${rows.length} districts scored`);
