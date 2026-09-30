// R4 trust test: does an API's output match a local `adhan` computation with the same stated method?
// Fetches one gzipped year per (city, method) from AlAdhan `/calendar`, computes the same year locally
// with adhan 4.4.6, and prints the per-field delta distribution in minutes.
// Run from /tmp/athan-r4-trust where `adhan` is installed. Nothing is installed into the app repo.
// usage: node trust-compare.mjs > ../result.txt

import * as adhan from 'adhan';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';

const CACHE = '/tmp/athan-r4-trust/cache';
if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });

const CITIES = {
  London:      { lat: 51.5072, lon: -0.1276,  tz: 'Europe/London' },
  Jakarta:     { lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' },
  Makkah:      { lat: 21.4225, lon: 39.8262,  tz: 'Asia/Riyadh' },
  KualaLumpur: { lat: 3.1390,  lon: 101.6869, tz: 'Asia/Kuala_Lumpur' },
  Istanbul:    { lat: 41.0082, lon: 28.9784,  tz: 'Europe/Istanbul' },
  Singapore:   { lat: 1.3521,  lon: 103.8198, tz: 'Asia/Singapore' },
  Oslo:        { lat: 59.9139, lon: 10.7522,  tz: 'Europe/Oslo' },
  NewYork:     { lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
  Karachi:     { lat: 24.8607, lon: 67.0011,  tz: 'Asia/Karachi' },
};

// AlAdhan method id -> a local adhan CalculationParameters with the SAME stated angles.
// `custom` entries use adhan's Other() preset and set the published angles by hand, because
// adhan ships no named preset for them. The angles are the ones AlAdhan's own /methods lists.
function localParams(methodId) {
  const P = adhan.CalculationMethod;
  switch (methodId) {
    case 1:  return P.Karachi();               // 18 / 18
    case 2:  return P.NorthAmerica();          // ISNA 15 / 15
    case 3:  return P.MuslimWorldLeague();     // 18 / 17
    case 4:  return P.UmmAlQura();             // 18.5 / 90 min
    case 5:  return P.Egyptian();              // 19.5 / 17.5
    case 7:  return P.Tehran();                // 17.7 / 14
    case 11: return P.Singapore();             // 20 / 18
    case 13: return P.Turkey();                // 18 / 17 + Turkey adjustments
    case 15: return P.MoonsightingCommittee(); // seasonal
    case 16: return P.Dubai();                 // 18.2 / 18.2
    case 17: { const p = P.Other(); p.fajrAngle = 20; p.ishaAngle = 18; return p; } // JAKIM
    case 20: { const p = P.Other(); p.fajrAngle = 20; p.ishaAngle = 18; return p; } // Kemenag
    default: throw new Error('no local mapping for method ' + methodId);
  }
}

const COMBOS = [
  ['London',      3,  'MWL'],
  ['London',      2,  'ISNA'],
  ['London',      15, 'Moonsighting'],
  ['London',      5,  'Egyptian'],
  ['London',      13, 'Turkey'],
  ['Jakarta',     20, 'Kemenag'],
  ['Jakarta',     3,  'MWL'],
  ['Makkah',      4,  'UmmAlQura'],
  ['KualaLumpur', 17, 'JAKIM'],
  ['Istanbul',    13, 'Turkey'],
  ['Singapore',   11, 'MUIS'],
  ['Oslo',        3,  'MWL'],
  ['Oslo',        15, 'Moonsighting'],
  ['NewYork',     2,  'ISNA'],
  ['Karachi',     1,  'Karachi'],
];

const YEAR = 2026;
function apiYear(city, methodId) {
  const c = CITIES[city];
  const key = `${CACHE}/aladhan_${city}_${methodId}_${YEAR}.json`;
  // The cache is filled by `fetch-years.sh`, which uses curl. Node's fetch could not reach the host
  // from this machine (UND_ERR_CONNECT_TIMEOUT), so the download and the comparison are separate steps.
  if (!existsSync(key)) throw new Error(`no cached year for ${city} m${methodId}; run fetch-years.sh first`);
  return JSON.parse(readFileSync(key, 'utf8'));
}

// "06:23 (GMT)" -> minutes since local midnight. Null for anything that is not a clock time.
function toMin(s) {
  const m = /^(\d{2}):(\d{2})/.exec(String(s).trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// Local wall-clock minutes of a Date in a named zone.
const fmtCache = new Map();
function zoneMinutes(date, tz) {
  if (!fmtCache.has(tz)) {
    fmtCache.set(tz, new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }));
  }
  const p = fmtCache.get(tz).formatToParts(date);
  const g = (t) => Number(p.find((x) => x.type === t).value);
  // round to the nearest minute, which is what both AlAdhan and adhan's own formatter do
  return g('hour') * 60 + g('minute') + (g('second') >= 30 ? 1 : 0);
}

const FIELDS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function localYear(city, methodId) {
  const c = CITIES[city];
  const coords = new adhan.Coordinates(c.lat, c.lon);
  const out = [];
  const d = new Date(Date.UTC(YEAR, 0, 1, 12));
  while (d.getUTCFullYear() === YEAR) {
    const params = localParams(methodId);
    const t = new adhan.PrayerTimes(coords, new Date(d), params);
    const row = {};
    for (const f of FIELDS) {
      const v = t[f.toLowerCase()];
      row[f] = v instanceof Date && !Number.isNaN(v.getTime()) ? zoneMinutes(v, c.tz) : null;
    }
    row.date = d.toISOString().slice(0, 10);
    out.push(row);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function summarise(deltas) {
  const ok = deltas.filter((x) => x !== null);
  if (!ok.length) return { n: 0 };
  const counts = new Map();
  for (const v of ok) counts.set(v, (counts.get(v) || 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => a[0] - b[0]);
  const abs = ok.map(Math.abs);
  return {
    n: ok.length,
    nullDays: deltas.length - ok.length,
    min: Math.min(...ok),
    max: Math.max(...ok),
    within1: abs.filter((v) => v <= 1).length,
    exact: abs.filter((v) => v === 0).length,
    hist: sorted.map(([v, n]) => `${v >= 0 ? '+' : ''}${v}:${n}`).join(' '),
  };
}

const results = [];
for (const [city, methodId, label] of COMBOS) {
  const api = apiYear(city, methodId);
  if (api.code !== 200) { console.log(`SKIP ${city} ${label}: API code ${api.code}`); continue; }
  const apiRows = [];
  for (let mo = 1; mo <= 12; mo++) for (const day of api.data[String(mo)]) apiRows.push(day);
  const loc = localYear(city, methodId);
  if (apiRows.length !== loc.length) console.log(`WARN length ${apiRows.length} vs ${loc.length}`);
  const perField = {};
  for (const f of FIELDS) {
    const deltas = apiRows.map((r, i) => {
      const a = toMin(r.timings[f]);
      const b = loc[i][f];
      if (a === null || b === null) return null;
      let d = b - a;                       // local minus API
      if (d > 720) d -= 1440;
      if (d < -720) d += 1440;
      return d;
    });
    perField[f] = summarise(deltas);
  }
  results.push({ city, methodId, label, perField });
  console.log(`\n=== ${city} / AlAdhan method ${methodId} (${label}) vs local adhan 4.4.6 ===`);
  for (const f of FIELDS) {
    const s = perField[f];
    if (!s.n) { console.log(`  ${f.padEnd(8)} no comparable days (nulls ${s.nullDays ?? '?'})`); continue; }
    console.log(`  ${f.padEnd(8)} n=${s.n} exact=${s.exact} within1=${s.within1} range=${s.min}..${s.max} nulls=${s.nullDays}`);
    if (s.max - s.min > 2 || s.within1 < s.n) console.log(`           hist ${s.hist}`);
  }
}
writeFileSync('/tmp/athan-r4-trust/trust-result.json', JSON.stringify(results, null, 1));
console.log('\nwrote /tmp/athan-r4-trust/trust-result.json');
