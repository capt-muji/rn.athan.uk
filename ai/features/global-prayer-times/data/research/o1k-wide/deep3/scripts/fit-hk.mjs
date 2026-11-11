// Job 2: Hong Kong. Does the fitted masjidal recipe (fajr 18.4 truncating,
// dhuhr +5, asr Shafi +1, maghrib +3, isha sunset+83) reproduce the Trustees'
// printed sheet at Kowloon, and do the two surfaces agree on the rule?
import fs from 'node:fs';
import path from 'node:path';
import { init, solarDay, rnd, score, round2, line, parseHHMM, fmtMin } from './lib.mjs';

const ROOT = path.resolve(process.env.HOME, 'athan-gitree/census/o1k-wide/deep3');
const SRC = path.join(process.env.HOME, 'athan-gitree/census/o1k-wide/china/data/hongkong_iuhk-masjid-full-year.json');
const LAT = 22.3193, LNG = 114.1694, TZ = 'Asia/Hong_Kong';

await init();
const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const days = Object.keys(raw).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();

// Page 1 of the same printing (astronomical sheet), transcribed from the
// iuhk_p1_top.jpg and iuhk_p1_jan_rows.jpg crops. Columns:
// fajr, dhuhr, asrShafi, asrHanafi, maghrib, isha, sunrise, noon, sunset.
const PAGE1 = {
  '2000-01-01': ['05:42', '12:42', '15:35', '16:17', '17:59', '19:27', '07:02', '12:27', '17:51'],
  '2000-01-06': ['05:44', '12:44', '15:37', '16:20', '18:04', '19:30', '07:02', '12:29', '17:56'],
  '2000-01-12': ['05:45', '12:47', '15:42', '16:24', '18:07', '19:34', '07:04', '12:32', '17:59'],
  '2000-01-18': ['05:46', '12:49', '15:46', '16:28', '18:11', '19:38', '07:04', '12:34', '18:03'],
  '2000-01-24': ['05:46', '12:50', '15:49', '16:32', '18:15', '19:41', '07:04', '12:35', '18:07'],
  '2000-02-01': ['05:45', '12:52', '15:53', '16:38', '18:21', '19:45', '07:01', '12:37', '18:13'],
  '2000-02-06': ['05:44', '12:53', '15:56', '16:41', '18:23', '19:47', '07:00', '12:38', '18:15'],
  '2000-02-12': ['05:40', '12:53', '15:58', '16:44', '18:26', '19:49', '06:56', '12:38', '18:19'],
  '2000-02-18': ['05:35', '12:52', '16:00', '16:49', '18:28', '19:52', '06:53', '12:37', '18:22'],
  '2000-02-24': ['05:31', '12:52', '16:01', '16:49', '18:30', '19:53', '06:48', '12:37', '18:25'],
  '2000-03-01': ['05:27', '12:51', '16:02', '16:51', '18:32', '19:55', '06:44', '12:36', '18:27'],
  '2000-03-06': ['05:23', '12:50', '16:02', '16:52', '18:35', '19:57', '06:40', '12:35', '18:30'],
  '2000-03-12': ['05:18', '12:48', '16:02', '16:54', '18:37', '19:59', '06:35', '12:33', '18:32'],
  '2000-03-18': ['05:12', '12:47', '16:02', '16:55', '18:39', '20:02', '06:29', '12:32', '18:34'],
  '2000-03-24': ['05:06', '12:45', '16:01', '16:55', '18:41', '20:04', '06:24', '12:30', '18:36'],
  '2000-04-01': ['04:58', '12:43', '15:59', '16:56', '18:44', '20:07', '06:16', '12:28', '18:39'],
  '2000-04-06': ['04:53', '12:41', '15:57', '16:56', '18:46', '20:09', '06:11', '12:26', '18:41'],
  '2000-04-12': ['04:46', '12:39', '15:55', '16:56', '18:48', '20:13', '06:06', '12:24', '18:43'],
  '2000-04-18': ['04:40', '12:38', '15:55', '16:56', '18:50', '20:16', '06:01', '12:23', '18:45'],
  '2000-04-24': ['04:34', '12:37', '15:51', '16:56', '18:53', '20:19', '05:56', '12:22', '18:47'],
  '2000-05-01': ['04:27', '12:35', '15:49', '16:57', '18:55', '20:23', '05:52', '12:20', '18:49'],
  '2000-05-06': ['04:24', '12:35', '15:47', '16:57', '18:58', '20:26', '05:48', '12:20', '18:52'],
  '2000-05-12': ['04:19', '12:35', '15:45', '16:57', '19:01', '20:31', '05:44', '12:20', '18:55'],
  '2000-05-18': ['04:15', '12:35', '15:44', '16:58', '19:04', '20:35', '05:41', '12:20', '18:58'],
  '2000-05-24': ['04:11', '12:35', '15:43', '17:00', '19:06', '20:39', '05:40', '12:20', '19:00'],
};
const P1_KEYS = ['fajr', 'dhuhr', 'asrShafi', 'asrHanafi', 'maghrib', 'isha', 'sunrise', 'noon', 'sunset'];

const sd = (iso) => solarDay(LAT, LNG, iso, TZ);
const m = (r, k) => raw[r][k === 'maghrib' ? 'magrib' : k];

// ---- Part A: the recipe against page 2 (the masjid/jama'ah sheet) ----
const RECIPE = { fajrAngle: 18.4, fajrMode: 'trunc', dhuhrMargin: 5, asrMargin: 1, maghribMargin: 3, ishaAfterSunset: 83 };
const p2 = {
  fajr: days.map((d) => parseHHMM(m(d, 'fajr'))),
  dhuhr: days.map((d) => parseHHMM(m(d, 'dhuhr'))),
  asr: days.map((d) => parseHHMM(m(d, 'asr'))),
  maghrib: days.map((d) => parseHHMM(m(d, 'magrib'))),
  isha: days.map((d) => parseHHMM(m(d, 'isha'))),
  sunrise: days.map((d) => parseHHMM(m(d, 'sunrise'))),
  noon: days.map((d) => parseHHMM(m(d, 'noon'))),
  sunset: days.map((d) => parseHHMM(m(d, 'sunset'))),
};
const secs = days.map((d) => sd(d));

const recipe = {
  fajr: score(days, p2.fajr, (d) => secs[d].fajr(RECIPE.fajrAngle), 'floor', 0),
  dhuhr: score(days, p2.dhuhr, (d) => secs[d].transit, 'floor', RECIPE.dhuhrMargin),
  asr: score(days, p2.asr, (d) => secs[d].asr(1), 'floor', RECIPE.asrMargin),
  maghrib: score(days, p2.maghrib, (d) => secs[d].sunset, 'floor', RECIPE.maghribMargin),
  isha: score(days, p2.isha, (d) => secs[d].sunset, 'floor', RECIPE.ishaAfterSunset),
};
console.log('--- recipe vs page 2 (60 sampled days of 2000) ---');
for (const k of Object.keys(recipe)) console.log(line(k, recipe[k]));

// ---- Part B: what interval does the print actually use? ----
const stat = (arr) => {
  const s = arr.slice().sort((a, b) => a - b);
  return { n: arr.length, min: s[0], max: s.at(-1), median: s[Math.floor(s.length / 2)],
    mean: round2(arr.reduce((a, b) => a + b, 0) / arr.length) };
};
const implied = {
  fajrBeforeSunrise: stat(days.map((d, i) => p2.sunrise[i] - p2.fajr[i])),
  maghribAfterSunset: stat(days.map((d, i) => p2.maghrib[i] - p2.sunset[i])),
  ishaAfterMaghrib: stat(days.map((d, i) => p2.isha[i] - p2.maghrib[i])),
  ishaAfterSunset: stat(days.map((d, i) => p2.isha[i] - p2.sunset[i])),
  dhuhrAfterTransit: stat(days.map((d, i) => p2.dhuhr[i] - Math.floor(secs[i].transit / 60))),
  asrAfterShafi: stat(days.map((d, i) => p2.asr[i] - Math.floor(secs[i].asr(1) / 60))),
  noonAfterTransit: stat(days.map((d, i) => p2.noon[i] - Math.floor(secs[i].transit / 60))),
  sunriseAfterGeometric: stat(days.map((d, i) => p2.sunrise[i] - Math.floor(secs[i].sunrise / 60))),
};
console.log('\n--- page 2 printed intervals (minutes) ---');
for (const k of Object.keys(implied)) console.log(k.padEnd(22), JSON.stringify(implied[k]));

// Implied fajr angle per day, from the print's own fajr (solve the crossing).
function impliedAngle(iso, printedSec, kind) {
  let lo = 5, hi = 25;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const got = kind === 'fajr' ? sd(iso).fajr(mid) : sd(iso).isha(mid);
    if (got === null) return null;
    // larger angle -> earlier fajr / later isha
    if (kind === 'fajr') { if (got > printedSec) lo = mid; else hi = mid; }
    else { if (got < printedSec) lo = mid; else hi = mid; }
  }
  return round2((lo + hi) / 2);
}
const angles = {
  fajr: days.map((d, i) => impliedAngle(d, p2.fajr[i] * 60 + 30, 'fajr')),
  isha: days.map((d, i) => impliedAngle(d, p2.isha[i] * 60, 'isha')),
};
const angleStats = (v) => {
  const s = v.filter((x) => x !== null);
  return { n: s.length, min: Math.min(...s), max: Math.max(...s), mean: round2(s.reduce((a, b) => a + b, 0) / s.length) };
};
console.log('\npage 2 implied angles: fajr', JSON.stringify(angleStats(angles.fajr)), ' isha', JSON.stringify(angleStats(angles.isha)));

// ---- Part C: page 1, the astronomical sheet, 25 transcribed days ----
const p1Days = Object.keys(PAGE1).sort();
const p1 = {};
for (const k of P1_KEYS) p1[k] = p1Days.map((d) => parseHHMM(PAGE1[d][P1_KEYS.indexOf(k)]));
const p1secs = p1Days.map((d) => sd(d));
const p1recipe = {
  fajr: score(p1Days, p1.fajr, (d) => p1secs[d].fajr(RECIPE.fajrAngle), 'floor', 0),
  dhuhr: score(p1Days, p1.dhuhr, (d) => p1secs[d].transit, 'floor', RECIPE.dhuhrMargin),
  asrShafi: score(p1Days, p1.asrShafi, (d) => p1secs[d].asr(1), 'floor', RECIPE.asrMargin),
  asrHanafi: score(p1Days, p1.asrHanafi, (d) => p1secs[d].asr(2), 'floor', RECIPE.asrMargin),
  maghrib: score(p1Days, p1.maghrib, (d) => p1secs[d].sunset, 'floor', RECIPE.maghribMargin),
  isha: score(p1Days, p1.isha, (d) => p1secs[d].sunset, 'floor', RECIPE.ishaAfterSunset),
  sunrise: score(p1Days, p1.sunrise, (d) => p1secs[d].sunrise, 'nearest', 0),
  noon: score(p1Days, p1.noon, (d) => p1secs[d].transit, 'nearest', 0),
  sunset: score(p1Days, p1.sunset, (d) => p1secs[d].sunset, 'nearest', 0),
};
console.log('\n--- recipe vs page 1 (25 transcribed days, Jan-May 2000) ---');
for (const k of Object.keys(p1recipe)) console.log(line(k, p1recipe[k]));

const p1Implied = {
  fajrBeforeSunrise: stat(p1Days.map((d, i) => p1.sunrise[i] - p1.fajr[i])),
  maghribAfterSunset: stat(p1Days.map((d, i) => p1.maghrib[i] - p1.sunset[i])),
  ishaAfterMaghrib: stat(p1Days.map((d, i) => p1.isha[i] - p1.maghrib[i])),
  asrShafiAfterNoon: stat(p1Days.map((d, i) => p1.asrShafi[i] - p1.noon[i])),
  asrHanafiAfterNoon: stat(p1Days.map((d, i) => p1.asrHanafi[i] - p1.noon[i])),
  dhuhrAfterNoon: stat(p1Days.map((d, i) => p1.dhuhr[i] - p1.noon[i])),
};
console.log('\n--- page 1 printed intervals (minutes) ---');
for (const k of Object.keys(p1Implied)) console.log(k.padEnd(22), JSON.stringify(p1Implied[k]));

const p1Angles = {
  fajr: p1Days.map((d, i) => impliedAngle(d, p1.fajr[i] * 60 + 30, 'fajr')),
  isha: p1Days.map((d, i) => impliedAngle(d, p1.isha[i] * 60, 'isha')),
};
console.log('page 1 implied angles: fajr', JSON.stringify(angleStats(p1Angles.fajr)), ' isha', JSON.stringify(angleStats(p1Angles.isha)));

// Best-fit angle for a printed series (integer minutes, both rounding modes).
function fitAngleGrid(isoList, printed, kind, secsFn) {
  let best = null;
  for (let a10 = 100; a10 <= 260; a10++) {
    const angle = a10 / 10;
    for (const mode of ['floor', 'ceil', 'nearest']) {
      for (let k = -3; k <= 3; k++) {
        const s = score(isoList, printed, (d) => secsFn(d, angle), mode, k);
        if (!best || s.exact > best.exact
          || (s.exact === best.exact && s.within1 > best.within1)
          || (s.exact === best.exact && s.within1 === best.within1 && s.worst < best.worst)) best = { angle, mode, margin: k, ...s };
      }
    }
  }
  return best;
}
const p1FajrFit = fitAngleGrid(p1Days, p1.fajr, 'fajr', (d, a) => p1secs[d].fajr(a));
const p1IshaFit = fitAngleGrid(p1Days, p1.isha, 'isha', (d, a) => p1secs[d].isha(a));
let p2AsrHanafi = null;
for (const mode of ['floor', 'ceil', 'nearest']) {
  for (let off = -4; off <= 8; off++) {
    const sc = score(days, p2.asr, (d) => secs[d].asr(2), mode, off);
    if (!p2AsrHanafi || sc.exact > p2AsrHanafi.exact || (sc.exact === p2AsrHanafi.exact && sc.within1 > p2AsrHanafi.within1)) p2AsrHanafi = { mode, offset: off, ...sc };
  }
}
// Does page 2's asr equal page 1's Hanafi column on the overlapping five days?
const overlap = p1Days.filter((d) => d in raw && raw[d]);
const asrMatch = overlap.map((d) => ({ iso: d, page1Hanafi: PAGE1[d][3], page2: raw[d].asr }));
const p2fajrInterval = days.map((d, i) => ({ iso: d, printed: p2.sunrise[i] - p2.fajr[i], model: round2((secs[i].sunrise - secs[i].fajr(RECIPE.fajrAngle)) / 60) }));
console.log('\npage 1 best-fit fajr angle', JSON.stringify(p1FajrFit));
console.log('page 1 best-fit isha angle', JSON.stringify(p1IshaFit));
console.log('page 2 asr vs Hanafi best', JSON.stringify(p2AsrHanafi));
console.log('page 1 Hanafi vs page 2 asr', JSON.stringify(asrMatch));
const mi = p2fajrInterval.map((r) => r.model);
console.log('18.4deg fajr interval at HK: model', Math.min(...mi), '-', Math.max(...mi), ' printed', 80, '-', 81);
// page 1 asr margins
for (const [k, fn] of [['asrShafi', 1], ['asrHanafi', 2]]) {
  let best = null;
  for (const mode of ['floor', 'ceil', 'nearest']) {
    for (let off = -6; off <= 12; off++) {
      const s = score(p1Days, p1[k], (d) => p1secs[d].asr(fn), mode, off);
      if (!best || s.exact > best.exact || (s.exact === best.exact && s.within1 > best.within1)) best = { mode, offset: off, ...s };
    }
  }
  console.log('page 1', k, 'best', JSON.stringify(best));
}

// Per-day implied angles, so the seasonal shape is visible.
const perDay = p1Days.map((d, i) => ({ iso: d, fajr: p1Angles.fajr[i], isha: p1Angles.isha[i] }));
console.log('\npage 1 implied angle by day:');
for (const r of perDay) console.log(' ', r.iso, String(r.fajr).padStart(6), String(r.isha).padStart(6));

fs.writeFileSync(path.join(ROOT, 'hk-deep.json'), JSON.stringify({
  job: 'Hong Kong Trustees sheet vs the fitted masjidal rule',
  sources: {
    page2: 'china/data/hongkong_iuhk-masjid-full-year.json (norislam reprint of the Trustees printed sheet, page 2)',
    page1: 'china/captures/iuhk_p1_top.jpg + iuhk_p1_jan_rows.jpg, transcribed here (25 days, Jan-May 2000)',
  },
  geometry: { lat: LAT, lng: LNG, tz: TZ },
  recipe: RECIPE,
  page2: { days: days.length, scores: recipe, printedIntervals: implied, impliedAngles: { fajr: angleStats(angles.fajr), isha: angleStats(angles.isha) } },
  fits: { page1FajrAngle: p1FajrFit, page1IshaAngle: p1IshaFit, page2AsrHanafi: p2AsrHanafi },
  crossCheck: { page1HanafiVsPage2Asr: asrMatch, fajrIntervalModel: { min: Math.min(...mi), max: Math.max(...mi), printed: [80, 81] } },
  page1: { days: p1Days.length, transcribed: PAGE1, columns: P1_KEYS, scores: p1recipe, printedIntervals: p1Implied,
    impliedAngles: { fajr: angleStats(p1Angles.fajr), isha: angleStats(p1Angles.isha) }, perDay },
}, null, 1));
console.log('\nwrote hk-deep.json');
