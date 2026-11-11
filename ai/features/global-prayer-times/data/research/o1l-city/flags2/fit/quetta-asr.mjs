// F2: Quetta asr column. Fit the printed asr alone against the shadow families.
// Source: o1l-21r/data/quetta-transcribed.js (8 columns, both asr columns) and
// o1l-21r/data/pk-quetta-chart-2026.json (dated, Hanafi asr).
import fs from 'node:fs';
import * as adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';
import SolarTime from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/SolarTime.js';

const HOME = process.env.HOME;
const SRC = `${HOME}/athan-gitree/census/o1l-city/o1l-21r/data/quetta-transcribed.js`;
const LAT = 30.1841, LON = 66.9966, TZ = 'Asia/Karachi';

const chart = (await import(`file://${SRC}`)).default ?? (await import(`file://${SRC}`));

function hm(s) { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; }
// the chart prints 12-hour clock strings: zawal, dhuhr, both asr, maghrib, isha are PM
const pm = v => (v < 720 ? v + 720 : v);
function fmt(x) { const r = Math.round(x); return `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`; }

// local minutes from a UTC Date, TZ pinned
const tzf = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
function localMin(d) {
  const p = Object.fromEntries(tzf.formatToParts(d).map(x => [x.type, x.value]));
  return (+p.hour % 24) * 60 + +p.minute + +p.second / 60;
}

// UTC decimal hours from a SolarTime output (transit/afternoon are UTC hours)
const coords = new adhan.Coordinates(LAT, LON);

// adhan reference times at shadow factor n
function asrAt(dateUTC, n) {
  const st = new SolarTime(dateUTC, coords);
  const utcHours = st.afternoon(n);
  const base = Date.UTC(dateUTC.getUTCFullYear(), dateUTC.getUTCMonth(), dateUTC.getUTCDate());
  return localMin(new Date(base + utcHours * 3600000));
}
function transitAt(dateUTC) {
  const st = new SolarTime(dateUTC, coords);
  return localMin(new Date(Date.UTC(dateUTC.getUTCFullYear(), dateUTC.getUTCMonth(), dateUTC.getUTCDate()) + st.transit * 3600000));
}

const days = [];
for (let m = 1; m <= 12; m++) {
  const mm = String(m).padStart(2, '0');
  for (const dStr of Object.keys(chart[mm])) {
    const d = Number(dStr);
    const row = chart[mm][dStr];
    const date = `2026-${mm}-${String(d).padStart(2, '0')}`;
    days.push({
      date, m, d,
      fajr: hm(row[0]), sunrise: hm(row[1]), zawal: pm(hm(row[2])), dhuhr: pm(hm(row[3])),
      asr1: pm(hm(row[4])), asr2: pm(hm(row[5])), maghrib: pm(hm(row[6])), isha: pm(hm(row[7])),
      utc: new Date(Date.UTC(2026, m - 1, d, 12)),
    });
  }
}
console.log(`chart rows: ${days.length}`);

// printed anomalies named in the transcription note (keep as printed, mask from scoring)
const MASK = new Set(['2026-04-23', '2026-09-16', '2026-09-25', '2026-07-31']);

// ---------- 1. residual of each printed asr column against shadow 1 / 2 ----------
const out = [];
for (const r of days) {
  const t = transitAt(r.utc);
  const a1 = asrAt(r.utc, 1), a2 = asrAt(r.utc, 2);
  out.push({
    ...r, transit: t, eng1: a1, eng2: a2,
    res1: r.asr1 - a1, res2: r.asr2 - a2,
    frac1: (r.asr1 - t) / (r.maghrib - t), frac2: (r.asr2 - t) / (r.maghrib - t),
    gap: r.asr2 - r.asr1, engGap: a2 - a1,
  });
}

function stats(arr) {
  const v = arr.slice().sort((a, b) => a - b);
  const n = v.length, mean = v.reduce((a, b) => a + b, 0) / n;
  return { n, mean: +mean.toFixed(2), min: v[0], max: v[n - 1], p50: v[Math.floor(n / 2)] };
}

console.log('\n--- monthly mean residual, printed minus engine (min) ---');
console.log('month | asr1(Shafi) | asr2(Hanafi) | gap printed | gap engine | frac1 | frac2');
const monthly = {};
for (let m = 1; m <= 12; m++) {
  const rs = out.filter(r => r.m === m && !MASK.has(r.date));
  const s1 = stats(rs.map(r => r.res1)), s2 = stats(rs.map(r => r.res2));
  monthly[m] = { s1, s2 };
  console.log(`${String(m).padStart(2, '0')} | ${String(s1.mean).padStart(6)} | ${String(s2.mean).padStart(6)} | ${stats(rs.map(r => r.gap)).mean.toFixed(2)} | ${stats(rs.map(r => r.engGap)).mean.toFixed(2)} | ${stats(rs.map(r => r.frac1)).mean.toFixed(3)} | ${stats(rs.map(r => r.frac2)).mean.toFixed(3)}`);
}

// ---------- 2. solve the effective shadow factor per day ----------
// bisect n in [0.5, 3.5] so that asrAt(n) == printed minute
function solveN(row, printed) {
  let lo = 0.2, hi = 4.0;
  const f = n => asrAt(row.utc, n) - printed; // increasing in n
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
for (const r of out) {
  if (MASK.has(r.date)) { r.n1 = NaN; r.n2 = NaN; continue; }
  r.n1 = solveN(r, r.asr1);
  r.n2 = solveN(r, r.asr2);
}
console.log('\n--- effective shadow factor n (solved to the printed minute) ---');
console.log('month | n1 mean (sd) | n2 mean (sd) | n2-n1 mean');
for (let m = 1; m <= 12; m++) {
  const rs = out.filter(r => r.m === m && !MASK.has(r.date));
  const n1 = rs.map(r => r.n1), n2 = rs.map(r => r.n2);
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const sd = a => { const mu = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - mu) ** 2, 0) / a.length); };
  console.log(`${String(m).padStart(2, '0')} | ${mean(n1).toFixed(3)} (${sd(n1).toFixed(3)}) | ${mean(n2).toFixed(3)} (${sd(n2).toFixed(3)}) | ${(mean(n2) - mean(n1)).toFixed(3)}`);
}

// ---------- 3. family test: which cot-space rule reproduces the printed column ----------
// For each day: altitude h of the printed asr, from the printed hour angle H and the solar declination.
// declination recovered from the engine's own transit-symmetric relation: use SolarTime internals via
// a numeric inversion: sin(h) = sin(lat)sin(dec) + cos(lat)cos(dec)cos(H). Solve dec by bisection.
function declOf(row) {
  // declination that the engine used: recover from transit + the noon altitude is unavailable,
  // so read it from the SolarTime object (set in constructor).
  const st = new SolarTime(row.utc, coords);
  return st.declination ?? null;
}
const RAD = Math.PI / 180;
function altOf(H_deg, dec) {
  const s = Math.sin(LAT * RAD) * Math.sin(dec * RAD) + Math.cos(LAT * RAD) * Math.cos(dec * RAD) * Math.cos(H_deg * RAD);
  return Math.asin(Math.max(-1, Math.min(1, s))) / RAD;
}
// declination fallback (NOAA low precision) if the class does not expose it
function decNOAA(row) {
  const start = Date.UTC(2026, 0, 1);
  const n = Math.floor((row.utc - start) / 86400000) + 1;
  const g = 2 * Math.PI * (n - 1) / 365;
  return (0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)) / RAD;
}
const hasDecl = declOf(out[0]) != null;
console.log(`\ndeclination source: ${hasDecl ? 'SolarTime.declination' : 'NOAA fallback'}`);

const rows2 = out.filter(r => !MASK.has(r.date)).map(r => {
  const dec = hasDecl ? declOf(r) : decNOAA(r);
  const H2 = (r.asr2 - r.transit) / 4; // degrees, 4 min per degree
  const H1 = (r.asr1 - r.transit) / 4;
  const h2 = altOf(H2, dec), h1 = altOf(H1, dec);
  const cot2 = 1 / Math.tan(h2 * RAD), cot1 = 1 / Math.tan(h1 * RAD);
  const cotNoon = Math.abs(1 / Math.tan((90 - Math.abs(LAT - dec)) * RAD));
  return { ...r, dec, cot1, cot2, cotNoon, dCot2: cot2 - 2 - cotNoon, dCot1: cot1 - 1 - cotNoon };
});

console.log('\n--- cot-space residual (printed cot(h) minus [n + cot(noon)]), monthly mean ---');
console.log('month | dCot1 | dCot2 | cotNoon | dec');
for (let m = 1; m <= 12; m++) {
  const rs = rows2.filter(r => r.m === m);
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  console.log(`${String(m).padStart(2, '0')} | ${mean(rs.map(r => r.dCot1)).toFixed(4)} | ${mean(rs.map(r => r.dCot2)).toFixed(4)} | ${mean(rs.map(r => r.cotNoon)).toFixed(3)} | ${mean(rs.map(r => r.dec)).toFixed(1)}`);
}

// ---------- 4. named family scores ----------
// Family A: cot(h) = n + cot(a_noon)                       [standard]
// Family B: cot(h) = n                                   [noon shadow omitted]
// Family C: cot(h) = n * cot(a_noon)                     [scaled noon shadow]
// Family D: asr = transit + k * (sunset - transit)        [fixed afternoon fraction]
// Family E: cot(h) = n + c*cot(a_noon), c fitted
const k = (r) => 1 / Math.tan((90 - Math.abs(LAT - r.dec)) * RAD);
function timeAtCot(row, cotVal) {
  // invert: altitude h from cot, then H, then local minutes
  const h = Math.atan(1 / cotVal) / RAD;
  const c = (Math.sin(h * RAD) - Math.sin(LAT * RAD) * Math.sin(row.dec * RAD)) / (Math.cos(LAT * RAD) * Math.cos(row.dec * RAD));
  const H = Math.acos(Math.max(-1, Math.min(1, c))) / RAD;
  return row.transit + H * 4;
}
function scoreFamily(fn, target = 'asr2') {
  let exact = 0, w1 = 0, worst = 0, sum = 0, n = 0;
  for (const r of rows2) {
    const t = fn(r);
    const d = r[target] - Math.round(t);
    sum += d; n++;
    if (d === 0) exact++;
    if (Math.abs(d) <= 1) w1++;
    worst = Math.max(worst, Math.abs(d));
  }
  return { exact: `${exact}/${n}`, within1: `${w1}/${n}`, mean: +(sum / n).toFixed(2), worst };
}
const families = {
  'A cot=n+cot(noon)': r => timeAtCot(r, 2 + k(r)),
  'B cot=n (no noon)': r => timeAtCot(r, 2),
  'C cot=n*cot(noon)': r => timeAtCot(r, 2 * k(r)),
  'D frac 0.70': r => r.transit + 0.70 * (r.maghrib - r.transit),
  'D frac 0.663': r => r.transit + 0.663 * (r.maghrib - r.transit),
};
console.log('\n--- family scores against the printed Hanafi asr (2026, 361 unmasked rows) ---');
for (const [name, fn] of Object.entries(families)) console.log(name.padEnd(22), JSON.stringify(scoreFamily(fn)));

// fitted c in family E
let best = { c: 1, w1: -1 };
for (let c = 0.5; c <= 1.6; c += 0.005) {
  const s = scoreFamily(r => timeAtCot(r, 2 + c * k(r)));
  const w = parseInt(s.within1);
  if (w > best.w1) best = { c: +c.toFixed(3), w1: w, s };
}
console.log('E cot=n+c*cot(noon), best c', best.c, JSON.stringify(best.s));

// fitted k for family D
best = { k: 0, w1: -1 };
for (let kk = 0.5; kk <= 0.9; kk += 0.001) {
  const s = scoreFamily(r => r.transit + kk * (r.maghrib - r.transit));
  const w = parseInt(s.within1);
  if (w > best.w1) best = { k: +kk.toFixed(3), w1: w, s };
}
console.log('D asr=transit+k*(sunset-transit), best k', best.k, JSON.stringify(best.s));

// ---------- 5. daily residual print, to expose a staircase vs a smooth curve ----------
console.log('\n--- daily residual, printed Hanafi asr minus engine (min), every 5th day ---');
const line = rows2.filter((_, i) => i % 5 === 0).map(r => `${r.date.slice(5)} ${String(r.res2).padStart(3)}`).join(' | ');
console.log(line);

fs.writeFileSync(`${HOME}/athan-gitree/census/o1l-city/flags2/data/quetta-asr-rows.json`,
  JSON.stringify(rows2.map(r => ({ date: r.date, asr1: r.asr1, asr2: r.asr2, eng1: +r.eng1.toFixed(2), eng2: +r.eng2.toFixed(2), res1: r.res1, res2: r.res2, n1: +r.n1.toFixed(3), n2: +r.n2.toFixed(3), frac2: +r.frac2.toFixed(4), cotNoon: +r.cotNoon.toFixed(4), dec: +r.dec.toFixed(3) })), null, 0));
