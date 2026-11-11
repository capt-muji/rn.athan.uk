// Job 3: Iceland. Fits 14.2/14.0 with the twilight-angle high-latitude portion
// (angle/60 of the night) across 2025, 2026 and 2027 at Reykjavik and Akureyri.
import fs from 'node:fs';
import path from 'node:path';
import { init, solarDay, rnd, score, round2, line, parseHHMM, fmtMin } from './lib.mjs';

const ROOT = path.resolve(process.env.HOME, 'athan-gitree/census/o1k-wide/deep3');
const TZ = 'Atlantic/Reykjavik';
const W = path.join(process.env.HOME, 'athan-gitree/census/o1k-wide');
const CITIES = {
  reykjavik: { lat: 64.1466, lng: -21.9426, label: 'Reykjavik' },
  akureyri: { lat: 65.6835, lng: -18.1002, label: 'Akureyri' },
};
await init();

function loadYear(city, year) {
  const json = {
    2025: path.join(W, `europe/data/is-${city}-2025.json`),
    2027: path.join(W, `nordics2/data/is-felagmuslima-${city}-2027.json`),
  }[year];
  if (json && fs.existsSync(json)) return JSON.parse(fs.readFileSync(json, 'utf8'));
  const jsonl = path.join(ROOT, `captures/is-felagmuslima-${CITIES[city].label}-${year}.jsonl`);
  if (!fs.existsSync(jsonl)) return null;
  const out = {};
  for (const ln of fs.readFileSync(jsonl, 'utf8').split('\n')) {
    if (!ln.trim()) continue;
    const o = JSON.parse(ln);
    for (const [iso, v] of Object.entries(o)) out[iso] = v.timings ?? v;
  }
  return Object.keys(out).length > 300 ? out : null;
}

const series = [];
for (const city of Object.keys(CITIES)) {
  for (const y of [2025, 2026, 2027]) {
    const raw = loadYear(city, y);
    if (!raw) { console.log('missing', city, y); continue; }
    const rows = {};
    for (const [iso, r] of Object.entries(raw)) {
      rows[iso] = {
        fajr: parseHHMM(r.fajr ?? r.Fajr), sunrise: parseHHMM(r.sunrise ?? r.Sunrise),
        dhuhr: parseHHMM(r.dhuhr ?? r.Dhuhr), asr: parseHHMM(r.asr ?? r.Asr),
        maghrib: parseHHMM(r.maghrib ?? r.magrib ?? r.Maghrib), isha: parseHHMM(r.isha ?? r.Isha),
      };
    }
    series.push({ city, year: y, rows, n: Object.keys(rows).length });
    console.log('loaded', city, y, Object.keys(rows).length);
  }
}
if (!series.length) throw new Error('no series');

// Model: raw angle crossing, then the high-latitude portion clamp.
function model(city, iso, fajrAngle, ishaAngle) {
  const { lat, lng } = CITIES[city];
  const d = solarDay(lat, lng, iso, TZ);
  const next = solarDay(lat, lng, new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + 1)).toISOString().slice(0, 10), TZ);
  const prev = solarDay(lat, lng, new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) - 1)).toISOString().slice(0, 10), TZ);
  const mod = (v, n) => ((v % n) + n) % n;
  const nightBefore = mod(d.sunrise - prev.sunset, 86400);
  const nightAfter = mod(next.sunrise - d.sunset, 86400);
  const fajrSafe = d.sunrise - (fajrAngle / 60) * nightBefore;
  const ishaSafe = d.sunset + (ishaAngle / 60) * nightAfter;
  const fajrRaw = d.fajr(fajrAngle);
  const ishaRaw = d.isha(ishaAngle);
  const fajr = fajrRaw === null ? fajrSafe : Math.max(fajrRaw, fajrSafe);
  const isha = ishaRaw === null ? ishaSafe : Math.min(ishaRaw, ishaSafe);
  return { fajr, isha, fajrRaw, ishaRaw, fajrClamped: fajrRaw === null || fajrSafe > fajrRaw,
    ishaClamped: ishaRaw === null || ishaSafe < ishaRaw, nightBefore, nightAfter,
    sunrise: d.sunrise, sunset: d.sunset, transit: d.transit, asr1: d.asr(1) };
}

// Grid fit of one angle across all series, with the clamp in the model.
function fitAngle(kind, aMin, aMax) {
  let best = null;
  for (let a10 = aMin * 10; a10 <= aMax * 10; a10++) {
    const angle = a10 / 10;
    for (const mode of ['floor', 'ceil', 'nearest']) {
      for (let k = -15; k <= 15; k++) {
        const margin = k / 10;
        let exact = 0, within1 = 0, n = 0, worst = 0;
        for (const s of series) {
          for (const [iso, r] of Object.entries(s.rows)) {
            const m = model(s.city, iso, kind === 'fajr' ? angle : 14.2, kind === 'fajr' ? 14.0 : angle);
            const v = rnd(kind === 'fajr' ? m.fajr : m.isha, mode, margin);
            const diff = Math.abs(((v - r[kind] + 720) % 1440 + 1440) % 1440 - 720);
            n++;
            if (diff === 0) exact++;
            if (diff <= 1) within1++;
            if (diff > worst) worst = diff;
          }
        }
        const cand = { angle, mode, margin, exact, within1, worst, n };
        if (!best || cand.exact > best.exact
          || (cand.exact === best.exact && cand.within1 > best.within1)
          || (cand.exact === best.exact && cand.within1 === best.within1 && cand.worst < best.worst)) best = cand;
      }
    }
  }
  return best;
}
const fajrFit = fitAngle('fajr', 13.5, 15.0);
const ishaFit = fitAngle('isha', 13.5, 15.0);
console.log('fajr fit', JSON.stringify(fajrFit));
console.log('isha fit', JSON.stringify(ishaFit));

// Canonical: the held pair, nearest rounding, no margin.
const RULE = { fajrAngle: 14.2, ishaAngle: 14.0, fajrMode: 'floor', fajrMargin: 0.5, ishaMode: 'ceil', ishaMargin: -0.4 };
const perYear = {};
for (const s of series) {
  const isos = Object.keys(s.rows).sort();
  const sec = (kind) => isos.map((iso) => { const m = model(s.city, iso, RULE.fajrAngle, RULE.ishaAngle); return kind === 'fajr' ? m.fajr : m.isha; });
  const printed = (k) => isos.map((iso) => s.rows[iso][k]);
  perYear[`${s.city}-${s.year}`] = {
    n: isos.length,
    fajr: score(isos, printed('fajr'), (d) => sec('fajr')[d], RULE.fajrMode, RULE.fajrMargin, true),
    isha: score(isos, printed('isha'), (d) => sec('isha')[d], RULE.ishaMode, RULE.ishaMargin, true),
    fajrPlain: score(isos, printed('fajr'), (d) => sec('fajr')[d], 'floor', 0, true),
    ishaPlain: score(isos, printed('isha'), (d) => sec('isha')[d], 'floor', 0, true),
    fajrNearest: score(isos, printed('fajr'), (d) => sec('fajr')[d], 'nearest', 0, true),
    ishaNearest: score(isos, printed('isha'), (d) => sec('isha')[d], 'nearest', 0, true),
    dhuhr: score(isos, printed('dhuhr'), (d) => { const m = model(s.city, isos[d], RULE.fajrAngle, RULE.ishaAngle); return m.transit; }, 'floor', 0),
    magicClamp: isos.filter((iso) => model(s.city, iso, RULE.fajrAngle, RULE.ishaAngle).fajrClamped).length,
    ishaClamp: isos.filter((iso) => model(s.city, iso, RULE.fajrAngle, RULE.ishaAngle).ishaClamped).length,
  };
  const p = perYear[`${s.city}-${s.year}`];
  console.log(s.city, s.year, line('fajr', p.fajr), '|', line('isha', p.isha), '| clampF', p.magicClamp, 'clampI', p.ishaClamp);
}

// Window edges: first and last day the high-latitude substitution fires.
const windows = {};
for (const s of series) {
  const isos = Object.keys(s.rows).sort();
  const clamped = isos.filter((iso) => model(s.city, iso, RULE.fajrAngle, RULE.ishaAngle).fajrClamped);
  windows[`${s.city}-${s.year}`] = { n: clamped.length, first: clamped[0], last: clamped.at(-1),
    monthDays: clamped.map((d) => d.slice(5)) };
  console.log('fajr clamp window', s.city, s.year, clamped.length, clamped[0], '..', clamped.at(-1));
}

// Asr: printed minus Shafi, by month, and the degenerate days.
const asrStats = {};
for (const s of series) {
  const by = {};
  let negative = 0, minSep = 1e9, minIso = null;
  for (const [iso, r] of Object.entries(s.rows)) {
    const m = model(s.city, iso, RULE.fajrAngle, RULE.ishaAngle);
    const shafi = rnd(m.asr1, 'floor');
    const diff = r.asr - shafi;
    const sep = r.asr - r.dhuhr;
    if (sep <= 0) negative++;
    if (sep < minSep) { minSep = sep; minIso = iso; }
    (by[iso.slice(0, 7)] ||= []).push(diff);
  }
  asrStats[`${s.city}-${s.year}`] = {
    negativeDays: negative, minSeparation: minSep, minSeparationDay: minIso,
    monthMeanDelta: Object.fromEntries(Object.keys(by).sort().map((k) => [k, round2(by[k].reduce((a, b) => a + b, 0) / by[k].length)])),
  };
  console.log('asr', s.city, s.year, 'asr<=dhuhr', negative, 'min sep', minSep, minIso,
    JSON.stringify(asrStats[`${s.city}-${s.year}`].monthMeanDelta));
}

// December isha: is it the pure angle, or maghrib + 90?
const december = {};
for (const s of series) {
  const isos = Object.keys(s.rows).filter((d) => d.slice(5, 7) === '12').sort();
  const gaps = isos.map((iso) => { const r = s.rows[iso]; return ((r.isha - r.maghrib) % 1440 + 1440) % 1440; });
  const m = model(s.city, isos[0], RULE.fajrAngle, RULE.ishaAngle);
  december[`${s.city}-${s.year}`] = { min: Math.min(...gaps), max: Math.max(...gaps),
    mean: round2(gaps.reduce((a, b) => a + b, 0) / gaps.length), ninetyDays: gaps.filter((g) => g === 90).length };
  console.log('december isha-maghrib', s.city, s.year, JSON.stringify(december[`${s.city}-${s.year}`]));
}

// Two-year identity: same calendar day, same printed minute?
const copyCheck = {};
for (const city of Object.keys(CITIES)) {
  const a = series.find((s) => s.city === city && s.year === 2025);
  const b = series.find((s) => s.city === city && s.year === 2027);
  if (!a || !b) continue;
  let same = 0, diff1 = 0, diffMore = 0, n = 0;
  for (const iso of Object.keys(a.rows)) {
    const md = iso.slice(5);
    const other = Object.keys(b.rows).find((k) => k.slice(5) === md);
    if (!other) continue;
    n++;
    const d = Math.abs(a.rows[iso].fajr - b.rows[other].fajr);
    if (d === 0) same++; else if (d === 1) diff1++; else diffMore++;
  }
  copyCheck[city] = { n, same, diff1, diffMore };
  console.log('2025 vs 2027 same calendar day fajr', city, JSON.stringify(copyCheck[city]));
}

fs.writeFileSync(path.join(ROOT, 'is-deep.json'), JSON.stringify({
  job: 'Iceland felagmuslima, three years, two cities',
  source: 'felagmuslima.is/api/prayer-times (city, date)',
  geometry: CITIES, tz: TZ,
  rule: { ...RULE, highLatitude: 'twilight angle: fajr = max(angle, sunrise - a/60*night), isha = min(angle, sunset + a/60*night)' },
  gridFit: { fajr: fajrFit, isha: ishaFit },
  series: series.map((s) => ({ city: s.city, year: s.year, rows: s.n })),
  perYear, clampWindows: windows, asr: asrStats, decemberIsha: december, yearCopy: copyCheck,
}, null, 1));
console.log('wrote is-deep.json');
