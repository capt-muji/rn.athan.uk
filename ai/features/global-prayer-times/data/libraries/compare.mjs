// R3 library comparison harness.
//
// Runs every library that actually computes prayer times over 20 cities x 365 days
// of 2026 x the methods the libraries share, and counts the minute deltas between
// each library and `adhan` as the reference column.
//
// Run from a scratch directory that has the packages installed:
//   TZ=UTC node compare.mjs > deltas.txt
//
// Every library is normalised to "UTC epoch minutes of the instant", so a delta is
// a real clock difference and not a formatting artefact. Each adapter reports its
// own rounding so the reader can tell a rounding disagreement from an astronomy one.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CITIES = JSON.parse(
  readFileSync(new URL('./cities.json', import.meta.url), 'utf8'),
);
const YEAR = 2026;
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

// ---------------------------------------------------------------- helpers

const MIN = 60000;

// The calendar days of YEAR, as [y, m, d] triples. Libraries disagree about what a
// `Date` means, so the day is passed as components and each adapter builds its own.
function daysOfYear(year) {
  const out = [];
  for (let m = 1; m <= 12; m++) {
    const last = new Date(Date.UTC(year, m, 0)).getUTCDate();
    for (let d = 1; d <= last; d++) out.push([year, m, d]);
  }
  return out;
}

// Epoch minutes, or null when the library said the event does not exist.
function toMinutes(v) {
  if (v === null || v === undefined) return null;
  const t = v instanceof Date ? v.getTime() : v;
  if (typeof t !== 'number' || !Number.isFinite(t)) return null;
  return Math.round(t / MIN);
}

// The UTC offset in minutes that `tz` had at 12:00 local on the given day.
// Needed by libraries that take a numeric offset instead of an IANA zone.
const offsetCache = new Map();
function utcOffsetMinutes(tz, y, m, d) {
  const key = `${tz}|${y}-${m}-${d}`;
  const hit = offsetCache.get(key);
  if (hit !== undefined) return hit;
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'longOffset',
  });
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12));
  const part = fmt
    .formatToParts(noonUtc)
    .find((p) => p.type === 'timeZoneName').value;
  const mt = /GMT([+-])(\d{2}):(\d{2})/.exec(part);
  const off = mt
    ? (mt[1] === '-' ? -1 : 1) * (Number(mt[2]) * 60 + Number(mt[3]))
    : 0;
  offsetCache.set(key, off);
  return off;
}

// ---------------------------------------------------------------- adapters
//
// Each adapter is { id, rounding, methods: { <shared method name>: fn } } where fn
// is (city, [y,m,d]) => { fajr, sunrise, dhuhr, asr, maghrib, isha } in epoch minutes.

const adhan = await import('adhan');

function adhanAdapter(methodFactory, madhab) {
  return (city, [y, m, d]) => {
    const coords = new adhan.Coordinates(city.lat, city.lon);
    const params = methodFactory();
    params.madhab = madhab === 'hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
    // TZ=UTC is required: adhan reads the calendar date from the Date's local
    // getters (PrayerTimes.ts L52-56).
    const pt = new adhan.PrayerTimes(coords, new Date(Date.UTC(y, m - 1, d)), params);
    return {
      fajr: toMinutes(pt.fajr),
      sunrise: toMinutes(pt.sunrise),
      dhuhr: toMinutes(pt.dhuhr),
      asr: toMinutes(pt.asr),
      maghrib: toMinutes(pt.maghrib),
      isha: toMinutes(pt.isha),
    };
  };
}

const { PrayTime } = require('praytime');

function praytimeAdapter(methodName, asr, highLats) {
  return (city, [y, m, d]) => {
    const pt = new PrayTime(methodName);
    pt.location([city.lat, city.lon]);
    pt.adjust({ asr: asr === 'hanafi' ? 'Hanafi' : 'Standard', highLats });
    pt.utcOffset(utcOffsetMinutes(city.tz, y, m, d));
    pt.format('x');
    pt.round('nearest');
    const t = pt.times([y, m, d]);
    return {
      fajr: toMinutes(t.fajr),
      sunrise: toMinutes(t.sunrise),
      dhuhr: toMinutes(t.dhuhr),
      asr: toMinutes(t.asr),
      maghrib: toMinutes(t.maghrib),
      isha: toMinutes(t.isha),
    };
  };
}

const PrayTimesLib = require('praytimes');
const PrayTimesCtor = PrayTimesLib.PrayTimes ?? PrayTimesLib;

function praytimesAdapter(methodName, asr, highLats) {
  return (city, [y, m, d]) => {
    const p = new PrayTimesCtor(methodName);
    p.adjust({ asr: asr === 'hanafi' ? 'Hanafi' : 'Standard', highLats });
    const off = utcOffsetMinutes(city.tz, y, m, d) / 60;
    // Float output is local fractional hours relative to `off`.
    const t = p.getTimes(new Date(y, m - 1, d), [city.lat, city.lon], off, 0, 'Float');
    const base = Date.UTC(y, m - 1, d) - off * 60 * MIN;
    const at = (h) =>
      Number.isFinite(h) ? Math.round((base + h * 60 * MIN) / MIN) : null;
    return {
      fajr: at(t.fajr),
      sunrise: at(t.sunrise),
      dhuhr: at(t.dhuhr),
      asr: at(t.asr),
      maghrib: at(t.maghrib),
      isha: at(t.isha),
    };
  };
}

const PraytimeCore = require('@praytime/core');

function praytimeCoreAdapter(methodCode, school, latAdj) {
  return (city, [y, m, d]) => {
    const pt = new PraytimeCore.PrayerTimes(methodCode, school);
    const t = pt.getTimes(
      new Date(Date.UTC(y, m - 1, d, 12)),
      city.lat,
      city.lon,
      null,
      latAdj,
      null,
      'Float',
      city.tz,
    );
    const off = utcOffsetMinutes(city.tz, y, m, d);
    const base = Date.UTC(y, m - 1, d) - off * MIN;
    const at = (h) =>
      Number.isFinite(h) ? Math.round((base + h * 60 * MIN) / MIN) : null;
    return {
      fajr: at(t.Fajr),
      sunrise: at(t.Sunrise),
      dhuhr: at(t.Dhuhr),
      asr: at(t.Asr),
      maghrib: at(t.Maghrib),
      isha: at(t.Isha),
    };
  };
}

// ---------------------------------------------------------------- registry
//
// `methods` keys are the shared method names. A library only appears in a
// comparison for a method it actually ships.

const LIBS = [
  {
    id: 'adhan@4.4.6',
    rounding: 'nearest minute (Rounding.Nearest)',
    methods: {
      MWL: adhanAdapter(() => adhan.CalculationMethod.MuslimWorldLeague(), 'shafi'),
      ISNA: adhanAdapter(() => adhan.CalculationMethod.NorthAmerica(), 'shafi'),
      Egypt: adhanAdapter(() => adhan.CalculationMethod.Egyptian(), 'shafi'),
      Karachi: adhanAdapter(() => adhan.CalculationMethod.Karachi(), 'shafi'),
      UmmAlQura: adhanAdapter(() => adhan.CalculationMethod.UmmAlQura(), 'shafi'),
      Singapore: adhanAdapter(() => adhan.CalculationMethod.Singapore(), 'shafi'),
      Tehran: adhanAdapter(() => adhan.CalculationMethod.Tehran(), 'shafi'),
      Kuwait: adhanAdapter(() => adhan.CalculationMethod.Kuwait(), 'shafi'),
      Qatar: adhanAdapter(() => adhan.CalculationMethod.Qatar(), 'shafi'),
      Turkey: adhanAdapter(() => adhan.CalculationMethod.Turkey(), 'shafi'),
      Dubai: adhanAdapter(() => adhan.CalculationMethod.Dubai(), 'shafi'),
      MWLHanafi: adhanAdapter(() => adhan.CalculationMethod.MuslimWorldLeague(), 'hanafi'),
    },
  },
  {
    id: 'praytime@3.2.0',
    rounding: 'nearest minute (round("nearest"), Math.round on ms/60000)',
    methods: {
      MWL: praytimeAdapter('MWL', 'shafi', 'NightMiddle'),
      ISNA: praytimeAdapter('ISNA', 'shafi', 'NightMiddle'),
      Egypt: praytimeAdapter('Egypt', 'shafi', 'NightMiddle'),
      Karachi: praytimeAdapter('Karachi', 'shafi', 'NightMiddle'),
      UmmAlQura: praytimeAdapter('Makkah', 'shafi', 'NightMiddle'),
      Singapore: praytimeAdapter('Singapore', 'shafi', 'NightMiddle'),
      Tehran: praytimeAdapter('Tehran', 'shafi', 'NightMiddle'),
      MWLHanafi: praytimeAdapter('MWL', 'hanafi', 'NightMiddle'),
    },
  },
  {
    id: 'praytimes@0.0.5',
    rounding: 'none (Float output); harness rounds nearest',
    methods: {
      MWL: praytimesAdapter('MWL', 'shafi', 'NightMiddle'),
      ISNA: praytimesAdapter('ISNA', 'shafi', 'NightMiddle'),
      Egypt: praytimesAdapter('Egypt', 'shafi', 'NightMiddle'),
      Karachi: praytimesAdapter('Karachi', 'shafi', 'NightMiddle'),
      UmmAlQura: praytimesAdapter('Makkah', 'shafi', 'NightMiddle'),
      Tehran: praytimesAdapter('Tehran', 'shafi', 'NightMiddle'),
      MWLHanafi: praytimesAdapter('MWL', 'hanafi', 'NightMiddle'),
    },
  },
  {
    id: '@praytime/core@1.0.2',
    rounding: 'none (Float output); harness rounds nearest',
    methods: {
      MWL: praytimeCoreAdapter('MWL', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      ISNA: praytimeCoreAdapter('ISNA', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      Egypt: praytimeCoreAdapter('EGYPT', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      Karachi: praytimeCoreAdapter('KARACHI', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      UmmAlQura: praytimeCoreAdapter('MAKKAH', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      Singapore: praytimeCoreAdapter('SINGAPORE', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      Tehran: praytimeCoreAdapter('TEHRAN', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      Kuwait: praytimeCoreAdapter('KUWAIT', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      Qatar: praytimeCoreAdapter('QATAR', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      Turkey: praytimeCoreAdapter('TURKEY', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      Dubai: praytimeCoreAdapter('DUBAI', 'STANDARD', 'MIDDLE_OF_THE_NIGHT'),
      MWLHanafi: praytimeCoreAdapter('MWL', 'HANAFI', 'MIDDLE_OF_THE_NIGHT'),
    },
  },
];

// ---------------------------------------------------------------- run

const DAYS = daysOfYear(YEAR);
const REF = LIBS[0];

// counts[libId][method][city][prayer] = {eq, one, two, min, max, nullRef, nullLib, bothNull}
const counts = {};
const extremes = [];

function bucket() {
  return {
    eq: 0,
    one: 0,
    two: 0,
    min: Infinity,
    max: -Infinity,
    nullRefOnly: 0,
    nullLibOnly: 0,
    bothNull: 0,
  };
}

for (const lib of LIBS.slice(1)) {
  counts[lib.id] = {};
  for (const method of Object.keys(lib.methods)) {
    if (!REF.methods[method]) continue;
    counts[lib.id][method] = {};
    for (const city of CITIES) {
      const b = {};
      for (const p of PRAYERS) b[p] = bucket();
      counts[lib.id][method][city.name] = b;
      for (const day of DAYS) {
        let a, c;
        try {
          a = REF.methods[method](city, day);
        } catch {
          a = null;
        }
        try {
          c = lib.methods[method](city, day);
        } catch {
          c = null;
        }
        for (const p of PRAYERS) {
          const av = a ? a[p] : null;
          const cv = c ? c[p] : null;
          const slot = b[p];
          if (av === null && cv === null) {
            slot.bothNull++;
            continue;
          }
          if (av === null) {
            slot.nullRefOnly++;
            continue;
          }
          if (cv === null) {
            slot.nullLibOnly++;
            continue;
          }
          const delta = cv - av;
          if (delta === 0) slot.eq++;
          else if (Math.abs(delta) === 1) slot.one++;
          else {
            slot.two++;
            if (Math.abs(delta) >= 2) {
              extremes.push({
                lib: lib.id,
                method,
                city: city.name,
                prayer: p,
                day: day.join('-'),
                delta,
              });
            }
          }
          if (delta < slot.min) slot.min = delta;
          if (delta > slot.max) slot.max = delta;
        }
      }
    }
  }
}

// ---------------------------------------------------------------- output

const out = [];
out.push(`# R3 library delta tables. Reference column: ${REF.id}. Year ${YEAR}.`);
out.push(`# Cells: days equal / |d|=1 / |d|>=2 [min,max]. n=${DAYS.length} days per cell.`);
out.push('');
out.push('## Rounding as configured');
for (const l of LIBS) out.push(`- \`${l.id}\`: ${l.rounding}`);
out.push('');

for (const libId of Object.keys(counts)) {
  out.push(`## ${libId} minus ${REF.id}`);
  for (const method of Object.keys(counts[libId])) {
    out.push('');
    out.push(`### method ${method}`);
    out.push(`| city | ${PRAYERS.join(' | ')} |`);
    out.push(`|---|${PRAYERS.map(() => '---').join('|')}|`);
    for (const city of CITIES) {
      const b = counts[libId][method][city.name];
      const cells = PRAYERS.map((p) => {
        const s = b[p];
        let cell = `${s.eq}/${s.one}/${s.two}`;
        if (s.two > 0) cell += ` [${s.min},${s.max}]`;
        const nulls = [];
        if (s.bothNull) nulls.push(`bothNull ${s.bothNull}`);
        if (s.nullRefOnly) nulls.push(`refNull ${s.nullRefOnly}`);
        if (s.nullLibOnly) nulls.push(`libNull ${s.nullLibOnly}`);
        if (nulls.length) cell += ` (${nulls.join(', ')})`;
        return cell;
      });
      out.push(`| ${city.name} | ${cells.join(' | ')} |`);
    }
  }
  out.push('');
}

// Worst disagreements, for the source investigation.
extremes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
out.push('## Largest 40 disagreements of 2 minutes or more');
out.push('| lib | method | city | prayer | day | delta |');
out.push('|---|---|---|---|---|---|');
for (const e of extremes.slice(0, 40)) {
  out.push(
    `| ${e.lib} | ${e.method} | ${e.city} | ${e.prayer} | ${e.day} | ${e.delta > 0 ? '+' : ''}${e.delta} |`,
  );
}
out.push('');
out.push(`Total cells with |delta| >= 2: ${extremes.length}`);

console.log(out.join('\n'));
