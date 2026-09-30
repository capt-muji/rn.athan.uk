// R7 Part 1: the four adhan presets with no test fixture.
//
// R3 finding 16: adhan's entire CI correctness evidence is 462 fixture days,
// and `MuslimWorldLeague`, `Egyptian`, `Karachi` and `NorthAmerica` have no
// fixture at all. R3 called sourcing those four authorities' published values
// "the highest-value next research task". This script is that task.
//
// Three separate measurements, because the four presets fail in three
// different ways:
//
//   A. INVERT each authority's OWN published timetable back to the solar
//      depression it must have used (authority/*.json, fetched by
//      authority_fetch.mjs), and compare with adhan's shipped constant.
//
//   B. For each preset, compute what adhan's constant and the best-sourced
//      authority value produce, as a minute delta, across a full year at a
//      spread of cities. An angle difference is only interesting if it is
//      worth minutes.
//
//   C. The Canada case specifically. FCNA publishes 13/13 for Canada
//      (cited, fiqhcouncil.org, the body's own page). adhan's `NorthAmerica`
//      is 15/15 with no country split and no library ships 13/13, so every
//      Canadian user of every app is served the USA figure.
//
// Run: TZ=UTC node presets.mjs > presets.txt

import { readFileSync } from 'node:fs';
import {
  adhanDay,
  depressionAt,
  fmt,
  mins,
  riseSet,
  stats,
  timeAtDepression,
  yearDays,
} from './lib.mjs';

const out = [];
const p = (s = '') => out.push(s);
const DIR = new URL('./authority/', import.meta.url).pathname;

// ------------------------------------------------------------------- helpers

/** "5:21 ص" or "7:59 م" (Arabic am/pm) to minutes after local midnight. */
function arabicClock(s) {
  const m = /^(\d{1,2}):(\d{1,2})\s*(\u0635|\u0645)$/.exec(s.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const pm = m[3] === '\u0645';
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return h * 60 + min;
}

/** "04:56 AM" to minutes after local midnight. */
function ampmClock(s) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (/pm/i.test(m[3]) && h !== 12) h += 12;
  if (/am/i.test(m[3]) && h === 12) h = 0;
  return h * 60 + min;
}

/** Local-clock minutes on a given date in a given IANA zone to a UTC Date. */
function localToUtc(y, m, d, localMinutes, tz) {
  // Start from the naive UTC instant and correct by the zone's offset there.
  const guess = Date.UTC(y, m - 1, d, 0, 0) + localMinutes * 60000;
  const off = zoneOffsetMinutes(new Date(guess), tz);
  const fixed = guess - off * 60000;
  const off2 = zoneOffsetMinutes(new Date(fixed), tz);
  return new Date(guess - off2 * 60000);
}

function zoneOffsetMinutes(date, tz) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - date.getTime()) / 60000;
}

// ---------------------------------------------- A. invert the two timetables

p('# R7 Part 1: the four untested adhan presets');
p();
p('adhan constants read from `src/CalculationMethod.ts` of `adhan@4.4.6`');
p('(`opensrc path npm:adhan@4.4.6`):');
p();
p('| preset | fajrAngle | ishaAngle | ishaInterval | methodAdjustments |');
p('|---|---|---|---|---|');
p('| `MuslimWorldLeague` | 18 | 17 | 0 | `dhuhr: 1` |');
p('| `Egyptian` | 19.5 | 17.5 | 0 | `dhuhr: 1` |');
p('| `Karachi` | 18 | 18 | 0 | `dhuhr: 1` |');
p('| `NorthAmerica` | 15 | 15 | 0 | `dhuhr: 1` |');
p();

// ------------------------------------------------------------------- Egypt

p('## Egypt: the authority publishes, so the preset is checkable');
p();
const esa = JSON.parse(readFileSync(`${DIR}esa_cities.json`, 'utf8'));

// Coordinates for the Egyptian cities whose position is unambiguous. Only
// cities whose location is known to about 0.01 degrees are used, because a
// coordinate error of 0.1 degrees of longitude is 24 seconds of clock time.
const EG = {
  '\u0627\u0644\u0642\u0627\u0647\u0631\u0629': ['Cairo', 30.0444, 31.2357],
  '\u0627\u0644\u0623\u0633\u0643\u0646\u062f\u0631\u064a\u0629': [
    'Alexandria', 31.2001, 29.9187,
  ],
  '\u0637\u0646\u0637\u0627': ['Tanta', 30.7865, 31.0004],
  '\u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629': [
    'Mansoura', 31.0409, 31.3785,
  ],
  '\u0627\u0644\u0632\u0642\u0627\u0632\u064a\u0642': [
    'Zagazig', 30.5877, 31.502,
  ],
  '\u0623\u0633\u064a\u0648\u0637': ['Asyut', 27.18, 31.1837],
  '\u0633\u0648\u0647\u0627\u062c': ['Sohag', 26.5591, 31.6957],
  '\u0628\u0646\u0649 \u0633\u0648\u064a\u0641': ['BeniSuef', 29.0661, 31.0994],
  '\u0627\u0644\u0645\u0646\u064a\u0627': ['Minya', 28.1099, 30.7503],
  '\u0642\u0646\u0627': ['Qena', 26.1551, 32.716],
  '\u0623\u0633\u0648\u0627\u0646': ['Aswan', 24.0889, 32.8998],
  '\u0645\u0637\u0631\u0648\u062d': ['MarsaMatruh', 31.3543, 27.2373],
  '\u0627\u0644\u063a\u0631\u062f\u0642\u0629': ['Hurghada', 27.2579, 33.8116],
  '\u0627\u0644\u0625\u0633\u0645\u0627\u0639\u064a\u0644\u064a\u0629': [
    'Ismailia', 30.5965, 32.2715,
  ],
  '\u062f\u0645\u064a\u0627\u0637': ['Damietta', 31.4165, 31.8133],
  '\u0634\u0631\u0645 \u0627\u0644\u0634\u064a\u062e': [
    'SharmElSheikh', 27.9158, 34.33,
  ],
  '\u0627\u0644\u0641\u064a\u0648\u0645': ['Faiyum', 29.3084, 30.8428],
  '\u0628\u0648\u0631\u0633\u0639\u064a\u062f': ['PortSaid', 31.2653, 32.3019],
  '\u0627\u0644\u0633\u0648\u064a\u0633': ['Suez', 29.9668, 32.5498],
  '\u0627\u0644\u0639\u0631\u064a\u0634': ['ElArish', 31.1313, 33.798],
  '\u0627\u0644\u0623\u0642\u0635\u0631': ['Luxor', 25.6872, 32.6396],
  '\u062f\u0645\u0646\u0647\u0648\u0631': ['Damanhur', 31.0341, 30.4682],
};

const egRows = [];
for (const r of esa.rows) {
  const meta = EG[r[0]];
  if (!meta) continue;
  const [name, lat, lon] = meta;
  const [y, m, d] = r[1].split('-').map(Number);
  const cols = {
    fajr: arabicClock(r[3]),
    sunrise: arabicClock(r[4]),
    dhuhr: arabicClock(r[5]),
    asr: arabicClock(r[6]),
    maghrib: arabicClock(r[7]),
    isha: arabicClock(r[8]),
  };
  // Egypt is UTC+2 on this date (DST ended 2026-10-30, after the fetch date).
  const tz = 'Africa/Cairo';
  const fajrUtc = localToUtc(y, m, d, cols.fajr, tz);
  const ishaUtc = localToUtc(y, m, d, cols.isha, tz);
  const srUtc = localToUtc(y, m, d, cols.sunrise, tz);
  const msUtc = localToUtc(y, m, d, cols.maghrib, tz);
  egRows.push({
    name,
    lat,
    lon,
    y,
    m,
    d,
    fajrDeg: depressionAt(fajrUtc, lat, lon),
    ishaDeg: depressionAt(ishaUtc, lat, lon),
    sunriseDeg: depressionAt(srUtc, lat, lon),
    maghribDeg: depressionAt(msUtc, lat, lon),
    cols,
    tz,
  });
}

p(`Source: \`${esa.source}\`, fetched ${esa.fetchedUtc}, ${esa.rows.length} cities.`);
p(
  `Angles recovered by inverting the authority's OWN published clock times with`,
);
p('`astronomy-engine@2.1.19`. All **measured**.');
p();
p('| city | lat | published Fajr | implied Fajr deg | published Isha | implied Isha deg |');
p('|---|---|---|---|---|---|');
for (const r of egRows.sort((a, b) => b.lat - a.lat)) {
  p(
    `| ${r.name} | ${r.lat.toFixed(2)} | ${String(Math.floor(r.cols.fajr / 60)).padStart(2, '0')}:${String(r.cols.fajr % 60).padStart(2, '0')} | ${fmt(r.fajrDeg)} | ${String(Math.floor(r.cols.isha / 60)).padStart(2, '0')}:${String(r.cols.isha % 60).padStart(2, '0')} | ${fmt(r.ishaDeg)} |`,
  );
}
const egFajr = stats(egRows.map((r) => r.fajrDeg));
const egIsha = stats(egRows.map((r) => r.ishaDeg));
p();
p(
  `Fajr across ${egFajr.n} cities: mean ${fmt(egFajr.mean)}, range ${fmt(egFajr.min)} to ${fmt(egFajr.max)}.`,
);
p(
  `Isha across ${egIsha.n} cities: mean ${fmt(egIsha.mean)}, range ${fmt(egIsha.min)} to ${fmt(egIsha.max)}.`,
);
p(`adhan ships 19.5 / 17.5. Deltas: Fajr ${fmt(egFajr.mean - 19.5)} deg, Isha ${fmt(egIsha.mean - 17.5)} deg.`);
p();

// -------------------------------------------------------------------- MWL

p('## MWL: what its own portal actually serves');
p();
const mwl = JSON.parse(readFileSync(`${DIR}mwl_portal.json`, 'utf8'));
p(`Source: \`${mwl.source}\`, ${mwl.method}, fetched ${mwl.fetchedUtc}.`);
p(mwl.note);
p();
p('| city | lat | Fajr | implied Fajr deg | Isha | implied Isha deg | Isha minus Maghrib (min) |');
p('|---|---|---|---|---|---|---|');
const mwlRows = [];
for (const [name, c] of Object.entries(mwl.cities)) {
  const list = c.body?.data?.prayerTimeInfoList;
  if (!list) continue;
  const t = Object.fromEntries(list.map((x) => [x.salatEn, ampmClock(x.time)]));
  const dateStr = c.body.data.gregorianDateEn;
  const dm = /^(\d{1,2}) (\w+) (\d{4})$/.exec(dateStr);
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const y = Number(dm[3]);
  const m = MONTHS.indexOf(dm[2]) + 1;
  const d = Number(dm[1]);
  const fajrDeg = depressionAt(
    localToUtc(y, m, d, t.Fajr, c.tz),
    c.lat,
    c.lon,
  );
  const ishaDeg = depressionAt(
    localToUtc(y, m, d, t.Isha, c.tz),
    c.lat,
    c.lon,
  );
  const gap = t.Isha - t.Maghrib;
  mwlRows.push({ name, lat: c.lat, lon: c.lon, t, fajrDeg, ishaDeg, gap, y, m, d, tz: c.tz });
  const hm = (v) =>
    `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
  p(
    `| ${name} | ${c.lat.toFixed(2)} | ${hm(t.Fajr)} | ${fmt(fajrDeg)} | ${hm(t.Isha)} | ${fmt(ishaDeg)} | ${gap} |`,
  );
}
const mf = stats(mwlRows.map((r) => r.fajrDeg));
const mi = stats(mwlRows.map((r) => r.ishaDeg));
const mg = stats(mwlRows.map((r) => r.gap));
p();
p(
  `Fajr across ${mf.n} cities: mean ${fmt(mf.mean)}, range ${fmt(mf.min)} to ${fmt(mf.max)}.`,
);
p(
  `Isha across ${mi.n} cities: mean ${fmt(mi.mean)}, range ${fmt(mi.min)} to ${fmt(mi.max)}.`,
);
p(
  `Isha minus Maghrib: mean ${fmt(mg.mean, 1)} min, range ${mg.min} to ${mg.max}.`,
);
p('adhan ships 18 / 17 for `MuslimWorldLeague`.');
p();

// -------------------------------------- B. what the angle gap costs in minutes

p('## What each disputed angle is worth in minutes, across a full year');
p();
p(
  'For each preset: hold everything else identical and swap only the angle. The',
);
p(
  'delta is |adhan preset| minus |authority value|, in minutes, over all 365 days',
);
p('of 2026. All **measured**.');
p();

const CITIES = [
  ['Cairo', 30.0444, 31.2357],
  ['Alexandria', 31.2001, 29.9187],
  ['Aswan', 24.0889, 32.8998],
  ['Khartoum', 15.5007, 32.5599],
  ['Makkah', 21.4225, 39.8262],
  ['Karachi', 24.8607, 67.0011],
  ['Lahore', 31.5204, 74.3587],
  ['Dhaka', 23.8103, 90.4125],
  ['Delhi', 28.6139, 77.209],
  ['NewYork', 40.7128, -74.006],
  ['Chicago', 41.8781, -87.6298],
  ['Houston', 29.7604, -95.3698],
  ['Toronto', 43.6532, -79.3832],
  ['Montreal', 45.5017, -73.5673],
  ['Calgary', 51.0447, -114.0719],
  ['Edmonton', 53.5461, -113.4938],
  ['Vancouver', 49.2827, -123.1207],
  ['London', 51.5074, -0.1278],
  ['Berlin', 52.52, 13.405],
];

function angleDeltaYear(lat, lon, aAngle, bAngle, which) {
  const deltas = [];
  let aNull = 0;
  let bNull = 0;
  for (const [y, m, d] of yearDays(2026)) {
    const ta = timeAtDepression(y, m, d, lat, lon, aAngle, which === 'fajr' ? 'morning' : 'evening');
    const tb = timeAtDepression(y, m, d, lat, lon, bAngle, which === 'fajr' ? 'morning' : 'evening');
    if (!ta) aNull += 1;
    if (!tb) bNull += 1;
    if (!ta || !tb) continue;
    deltas.push(Math.round((ta.getTime() - tb.getTime()) / 60000));
  }
  return { s: stats(deltas), aNull, bNull };
}

/** One table row, tolerating a series where every day was null. */
function row(label, lat, r) {
  const s = r.s;
  const body = s
    ? `${fmt(s.mean)} | ${s.min} | ${s.max}`
    : 'no overlapping day | n/a | n/a';
  return `| ${label} | ${lat.toFixed(2)} | ${body} | ${r.aNull} | ${r.bNull} |`;
}

function angleTable(title, rows) {
  p(`### ${title}`);
  p();
  p('| city | lat | mean (min) | min | max | days adhan has no solution | days authority has no solution |');
  p('|---|---|---|---|---|---|---|');
  for (const r of rows) p(r);
  p();
}

// Egypt: adhan 19.5/17.5 against the measured 19.59/17.43.
{
  const rows = [];
  for (const [n, lat, lon] of CITIES.slice(0, 5)) {
    rows.push(row(`${n} Fajr`, lat, angleDeltaYear(lat, lon, 19.5, egFajr.mean, 'fajr')));
    rows.push(row(`${n} Isha`, lat, angleDeltaYear(lat, lon, 17.5, egIsha.mean, 'isha')));
  }
  angleTable(
    `Egypt: adhan 19.5 / 17.5 minus the authority's measured ${fmt(egFajr.mean)} / ${fmt(egIsha.mean)}`,
    rows,
  );
}

// North America: 15/15 against FCNA's 13/13 for Canada.
{
  const rows = [];
  const CA = CITIES.filter((c) =>
    ['Toronto', 'Montreal', 'Calgary', 'Edmonton', 'Vancouver'].includes(c[0]),
  );
  for (const [n, lat, lon] of CA) {
    rows.push(row(`${n} Fajr`, lat, angleDeltaYear(lat, lon, 15, 13, 'fajr')));
    rows.push(row(`${n} Isha`, lat, angleDeltaYear(lat, lon, 15, 13, 'isha')));
  }
  angleTable(
    'Canada: adhan `NorthAmerica` 15/15 minus FCNA\'s own 13/13 for Canada',
    rows,
  );
}

// MWL: 18/17 against whatever its own portal implies.
{
  const rows = [];
  for (const [n, lat, lon] of [
    ['Cairo', 30.0444, 31.2357],
    ['London', 51.5074, -0.1278],
    ['Karachi', 24.8607, 67.0011],
    ['Jakarta', -6.2088, 106.8456],
  ]) {
    rows.push(row(`${n} Fajr`, lat, angleDeltaYear(lat, lon, 18, mf.mean, 'fajr')));
  }
  angleTable(
    `MWL: adhan 18 minus the mean angle its own portal implies (${fmt(mf.mean)})`,
    rows,
  );
}

// --------------------------------------- C. adhan against MWL's own portal

p('## adhan `MuslimWorldLeague` against the MWL portal, time by time');
p();
p(
  'Both on the same date and coordinates. Delta is adhan minus the portal, in',
);
p('minutes. All **measured**.');
p();
p('| city | lat | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |');
p('|---|---|---|---|---|---|---|---|');
const mwlAdhanDeltas = { fajr: [], sunrise: [], dhuhr: [], asr: [], maghrib: [], isha: [] };
for (const r of mwlRows) {
  const t = adhanDay('MuslimWorldLeague', r.lat, r.lon, r.y, r.m, r.d);
  const cells = [];
  for (const [k, label] of [
    ['fajr', 'Fajr'],
    ['sunrise', 'Sunrise'],
    ['dhuhr', 'Dhuhr'],
    ['asr', 'Asr'],
    ['maghrib', 'Maghrib'],
    ['isha', 'Isha'],
  ]) {
    const got = mins(t[k]);
    const want = r.t[label] === undefined ? null : mins(localToUtc(r.y, r.m, r.d, r.t[label], r.tz));
    if (got === null || want === null) {
      cells.push('n/a');
      continue;
    }
    const delta = got - want;
    mwlAdhanDeltas[k].push(delta);
    cells.push(delta > 0 ? `+${delta}` : String(delta));
  }
  p(`| ${r.name} | ${r.lat.toFixed(2)} | ${cells.join(' | ')} |`);
}
p();
p('| prayer | n | mean | min | max | within 1 min |');
p('|---|---|---|---|---|---|');
for (const k of Object.keys(mwlAdhanDeltas)) {
  const s = stats(mwlAdhanDeltas[k]);
  const within = mwlAdhanDeltas[k].filter((x) => Math.abs(x) <= 1).length;
  p(
    `| ${k} | ${s.n} | ${fmt(s.mean, 1)} | ${s.min} | ${s.max} | ${within}/${s.n} |`,
  );
}
p();

// ------------------------------------ adhan Egyptian against the ESA's table

p('## adhan `Egyptian` against the ESA\'s own table, city by city');
p();
p('Delta is adhan minus the authority, in minutes. All **measured**.');
p();
p('| city | lat | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |');
p('|---|---|---|---|---|---|---|---|');
const egAdhanDeltas = { fajr: [], sunrise: [], dhuhr: [], asr: [], maghrib: [], isha: [] };
for (const r of egRows.sort((a, b) => b.lat - a.lat)) {
  const t = adhanDay('Egyptian', r.lat, r.lon, r.y, r.m, r.d);
  const cells = [];
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const got = mins(t[k]);
    const want = mins(localToUtc(r.y, r.m, r.d, r.cols[k], r.tz));
    const delta = got - want;
    egAdhanDeltas[k].push(delta);
    cells.push(delta > 0 ? `+${delta}` : String(delta));
  }
  p(`| ${r.name} | ${r.lat.toFixed(2)} | ${cells.join(' | ')} |`);
}
p();
p('| prayer | n | mean | min | max | exact | within 1 min |');
p('|---|---|---|---|---|---|---|');
for (const k of Object.keys(egAdhanDeltas)) {
  const s = stats(egAdhanDeltas[k]);
  const exact = egAdhanDeltas[k].filter((x) => x === 0).length;
  const within = egAdhanDeltas[k].filter((x) => Math.abs(x) <= 1).length;
  p(
    `| ${k} | ${s.n} | ${fmt(s.mean, 1)} | ${s.min} | ${s.max} | ${exact}/${s.n} | ${within}/${s.n} |`,
  );
}
p();

// Zero the dhuhr preset and re-run, to separate the preset from the astronomy.
p('Same comparison with adhan\'s `methodAdjustments.dhuhr = 1` removed:');
p();
const egZero = { dhuhr: [] };
for (const r of egRows) {
  const t = adhanDay('Egyptian', r.lat, r.lon, r.y, r.m, r.d, {
    zeroAdjustments: true,
  });
  egZero.dhuhr.push(mins(t.dhuhr) - mins(localToUtc(r.y, r.m, r.d, r.cols.dhuhr, r.tz)));
}
const ez = stats(egZero.dhuhr);
p(
  `| dhuhr, adjustment zeroed | ${ez.n} | ${fmt(ez.mean, 1)} | ${ez.min} | ${ez.max} | ${egZero.dhuhr.filter((x) => x === 0).length}/${ez.n} exact |`,
);
p();

// ------------------------------------------- Karachi: nothing to check against

p('## Karachi: there is no authority to check against');
p();
p(
  'R1 searched for a University of Islamic Sciences, Karachi publication and found',
);
p(
  'none. The 18/18 pair traces to `praytimes.org` and Arabeyes ITL, and ITL\'s own',
);
p(
  'documentation states "no contacts have been made to obtain the correct (or',
);
p('up-to-date) numbers as published by such organizations" (cited, R1).');
p();
p(
  'What can be measured is how far 18/18 sits from the other defensible values in',
);
p('the region, so the size of the unverifiability is at least known:');
p();
p('| city | lat | 18 vs 19.5 Fajr (min) | 18 vs 15 Fajr (min) | 18 vs 17 Isha (min) |');
p('|---|---|---|---|---|');
for (const [n, lat, lon] of [
  ['Karachi', 24.8607, 67.0011],
  ['Lahore', 31.5204, 74.3587],
  ['Delhi', 28.6139, 77.209],
  ['Dhaka', 23.8103, 90.4125],
]) {
  const cell = (s) =>
    s ? `${fmt(s.mean, 1)} [${s.min},${s.max}]` : 'no overlapping day';
  const a = angleDeltaYear(lat, lon, 18, 19.5, 'fajr').s;
  const b = angleDeltaYear(lat, lon, 18, 15, 'fajr').s;
  const c = angleDeltaYear(lat, lon, 18, 17, 'isha').s;
  p(`| ${n} | ${lat.toFixed(2)} | ${cell(a)} | ${cell(b)} | ${cell(c)} |`);
}
p();

console.log(out.join('\n'));
