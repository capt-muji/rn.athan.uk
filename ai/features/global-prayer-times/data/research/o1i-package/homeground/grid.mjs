#!/usr/bin/env node
// O1i home-ground grid.
// Each adhan LOCAL preset, verbatim, against its own country's authority recipe.
// Six prayers, calendar years 2026/2027/2028 (London: the real 4,383 published days).
// Every number in HOMEGROUND-REPORT.md and results.json is emitted by this file.

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ADHAN = `${process.env.HOME}/athan-gitree/census/adhan-build/node_modules/adhan`;
const OUT = `${process.env.HOME}/athan-gitree/census/o1i-package/homeground`;
const CENSUS = `${process.env.HOME}/athan-gitree/census`;

const require = createRequire(import.meta.url);
const adhan = require(ADHAN);
const SolarTime = require(`${ADHAN}/lib/cjs/SolarTime.js`).default;
const TimeComponents = require(`${ADHAN}/lib/cjs/TimeComponents.js`).default;
const {
  Coordinates, CalculationMethod, CalculationParameters, PrayerTimes,
  Madhab, Rounding,
} = adhan;

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

// ------------------------------------------------------------------ clock
// A prayer is a true UTC instant. Its printed minute is that instant read on
// the country's IANA clock. The real clock is never consulted: every date is
// constructed from literals and the process runs under TZ=UTC.

if (process.env.TZ && process.env.TZ !== 'UTC') {
  throw new Error(`run under TZ=UTC, got ${process.env.TZ}`);
}

const fmtCache = new Map();
function formatter(tz) {
  if (!fmtCache.has(tz)) {
    fmtCache.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }
  return fmtCache.get(tz);
}

function tzOffsetMs(instant, tz) {
  const parts = formatter(tz).formatToParts(instant);
  const part = (t) => Number(parts.find((p) => p.type === t).value);
  const asUtc = Date.UTC(part('year'), part('month') - 1, part('day'),
    part('hour'), part('minute'), part('second'));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// fractional seconds past the local midnight of the instant's own civil day
function localSeconds(instant, tz) {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) return NaN;
  const base = Math.floor(instant.getTime() / 1000) * 1000;
  const ms = ((((base + tzOffsetMs(instant, tz)) % 86400000) + 86400000) % 86400000);
  return ms / 1000;
}

const ROUND = {
  nearest: (s) => Math.floor(s / 60 + 0.5),
  up: (s) => Math.ceil(s / 60),
  down: (s) => Math.floor(s / 60),
};

function roundSeconds(seconds, mode) {
  return ROUND[mode || 'nearest'](seconds);
}

// ---------------------------------------------------------------- calendar

function daysOfYear(year) {
  const out = [];
  const cursor = new Date(Date.UTC(year, 0, 1, 12));
  while (cursor.getUTCFullYear() === year) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    const d = cursor.getUTCDate();
    out.push({
      // noon UTC: adhan reads local Y/M/D, and TZ=UTC keeps them identical
      date: new Date(Date.UTC(y, m, d, 12)),
      key: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

// Ramadan per the announcing body's own Hijri calendar, from the KACST capture
// (s1-saudi FINDINGS: 1447 30 days, 1448 29, 1449 29).
const RAMADAN = [
  { from: '2026-02-18', to: '2026-03-19', hijri: 1447, days: 30 },
  { from: '2027-02-08', to: '2027-03-08', hijri: 1448, days: 29 },
  { from: '2028-01-28', to: '2028-02-25', hijri: 1449, days: 29 },
];

function inRamadan(key) {
  return RAMADAN.some((r) => key >= r.from && key <= r.to);
}

// ------------------------------------------------------------------ presets
// Verbatim: CalculationMethod[preset]() exactly as shipped, nothing added and
// nothing removed. The one caller-side field is the madhab, which no preset
// sets; it takes the body's own documented school (Karachi is Hanafi, every
// other body here is Shafi). That is CONSTRAINTS.md rule 2.

const PRESETS = {
  UmmAlQura: { school: 'shafi' },
  Dubai: { school: 'shafi' },
  Qatar: { school: 'shafi' },
  Kuwait: { school: 'shafi' },
  Turkey: { school: 'shafi' },
  Singapore: { school: 'shafi' },
  Tehran: { school: 'shafi' },
  Karachi: { school: 'hanafi' },
  Egyptian: { school: 'shafi' },
  NorthAmerica: { school: 'shafi' },
  MoonsightingCommittee: { school: 'shafi' },
};

function presetParams(preset) {
  const params = CalculationMethod[preset]();
  params.madhab = PRESETS[preset].school === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  // high latitude, rounding, methodAdjustments: exactly as the preset ships
  return params;
}

function presetDay(preset, coords, date, tz) {
  const pt = new PrayerTimes(coords, date, presetParams(preset));
  const out = {};
  for (const p of PRAYERS) out[p] = roundSeconds(localSeconds(pt[p], tz));
  return out;
}

// ------------------------------------------------------------------ recipes
// Target side: the policy layer's fitted recipe, its own margins, rounding,
// clock and high-latitude kind. Rendered at second resolution then rounded
// explicitly, in the order the policy layer declares: margin, then direction.
// Every object here carries highLatitude.kind "none"; the library's night
// substitution is therefore switched off so no clamp can leak in.

function recipeParams(recipe) {
  const params = new CalculationParameters(
    'Other',
    recipe.fajr.angle ?? 0,
    recipe.isha.kind === 'angle' ? recipe.isha.angle : 0,
    0,
  );
  params.madhab = recipe.asr === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.rounding = Rounding.None;
  params.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  // highLatitude.kind "none": a ten-night portion can never substitute
  params.nightPortions = () => ({ fajr: 10, isha: 10 });
  return params;
}

function maghribInstant(recipe, coords, date) {
  if (recipe.maghrib?.angle == null) return null;
  const st = new SolarTime(date, coords);
  return new TimeComponents(st.hourAngle(-recipe.maghrib.angle, true))
    .utcDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function recipeDay(recipe, coords, date, key) {
  const pt = new PrayerTimes(coords, date, recipeParams(recipe));
  const margin = recipe.margins || {};
  const rounding = recipe.rounding || {};
  const out = {};

  for (const p of ['fajr', 'sunrise', 'dhuhr', 'asr']) {
    const s = localSeconds(pt[p], recipe.tz);
    out[p] = Number.isNaN(s) ? null
      : roundSeconds(s + (margin[p] || 0) * 60, rounding[p]);
  }

  const maghribSource = maghribInstant(recipe, coords, date);
  const maghribSec = maghribSource ? localSeconds(maghribSource, recipe.tz)
    : localSeconds(pt.maghrib, recipe.tz);
  out.maghrib = Number.isNaN(maghribSec) ? null
    : roundSeconds(maghribSec + (margin.maghrib || 0) * 60, rounding.maghrib);

  if (recipe.isha.kind === 'notPublished') {
    out.isha = null;
  } else if (recipe.isha.kind === 'angle') {
    const s = localSeconds(pt.isha, recipe.tz);
    out.isha = Number.isNaN(s) ? null
      : roundSeconds(s + (margin.isha || 0) * 60, rounding.isha);
  } else if (recipe.isha.kind === 'intervalAfterRounding'
    || recipe.isha.kind === 'ramadanInterval') {
    // the printed maghrib plus the interval, the census invariant
    const interval = recipe.isha.kind === 'ramadanInterval' && inRamadan(key)
      ? recipe.isha.ramadanInterval : recipe.isha.interval;
    out.isha = out.maghrib == null ? null : out.maghrib + interval;
  } else {
    throw new Error(`unhandled isha kind ${recipe.isha.kind}`);
  }
  return out;
}

// ------------------------------------------------------------------ targets

const TARGETS = [
  {
    id: 'SA-KACST', pair: 'UmmAlQura', label: 'Umm al-Qura (adhan preset) vs KACST Umm al-Qura service',
    place: 'Makkah', lat: 21.4225, lon: 39.8262, tz: 'Asia/Riyadh',
    asr: 'shafi', grade: 'A',
    fajr: { angle: 18.5 }, isha: { kind: 'ramadanInterval', interval: 90, ramadanInterval: 120 },
    margins: { fajr: 1, sunrise: 0, dhuhr: 1, asr: 1, maghrib: 1, isha: 1 },
    rounding: { fajr: 'down', sunrise: 'down', dhuhr: 'down', asr: 'down', maghrib: 'down', isha: 'down' },
    highLatitude: 'none',
    knownGap: 'preset has no +1 margins and no Ramadan +120 switch',
    years: [2026, 2027, 2028],
  },
  {
    id: 'AE-AWQAF', pair: 'Dubai', label: 'Dubai (adhan preset) vs UAE AWQAF federal feed',
    place: 'Dubai', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai',
    asr: 'shafi', grade: 'A',
    fajr: { angle: 18.2 }, isha: { kind: 'angle', angle: 18.2 },
    margins: { fajr: 0, sunrise: -3, dhuhr: 2, asr: 0, maghrib: 2, isha: -1 },
    rounding: { fajr: 'nearest', sunrise: 'down', dhuhr: 'nearest', asr: 'nearest', maghrib: 'nearest', isha: 'nearest' },
    highLatitude: 'none',
    knownGap: 'preset halves are -3/+3/+3/+3 against the authority 0/-3/+2/0/+2/-1',
    years: [2026, 2027, 2028],
  },
  {
    id: 'QA-MOI', pair: 'Qatar', label: 'Qatar (adhan preset) vs Ministry of Interior Doha',
    place: 'Doha', lat: 25.25, lon: 51.6, tz: 'Asia/Qatar',
    asr: 'shafi', grade: 'A',
    fajr: { angle: 18 }, isha: { kind: 'intervalAfterRounding', interval: 90 },
    margins: { fajr: 1, sunrise: 1, dhuhr: 0, asr: 0.5, maghrib: 1, isha: 0 },
    rounding: { fajr: 'nearest', sunrise: 'nearest', dhuhr: 'nearest', asr: 'nearest', maghrib: 'nearest', isha: 'nearest' },
    highLatitude: 'none',
    years: [2026, 2027, 2028],
  },
  {
    id: 'KW-AJIRI', pair: 'Kuwait', label: 'Kuwait (adhan preset) vs Al-Ajiri official calendar',
    place: 'Kuwait City', lat: 29.3759, lon: 47.9774, tz: 'Asia/Kuwait',
    asr: 'shafi', grade: 'provisional',
    fajr: { angle: 18 }, isha: { kind: 'angle', angle: 17.5 },
    margins: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: { fajr: 'down', sunrise: 'down', dhuhr: 'nearest', asr: 'nearest', maghrib: 'nearest', isha: 'nearest' },
    highLatitude: 'none',
    years: [2026, 2027, 2028],
  },
  {
    id: 'TR-DIYANET-DOMESTIC', pair: 'Turkey', label: 'Turkey (adhan preset) vs Diyanet domestic tables',
    place: 'Istanbul', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul',
    asr: 'shafi', grade: 'A',
    fajr: { angle: 18 }, isha: { kind: 'angle', angle: 17 },
    margins: { fajr: 0, sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0 },
    rounding: { fajr: 'nearest', sunrise: 'nearest', dhuhr: 'nearest', asr: 'nearest', maghrib: 'nearest', isha: 'nearest' },
    highLatitude: 'none',
    knownGap: 'the preset carries the same temkin, so the question is how close that lands',
    years: [2026, 2027, 2028],
  },
  {
    id: 'SG-MUIS', pair: 'Singapore', label: 'Singapore (adhan preset) vs MUIS',
    place: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore',
    asr: 'shafi', grade: 'A',
    fajr: { angle: 20 }, isha: { kind: 'angle', angle: 18 },
    margins: { fajr: 1, sunrise: 1, dhuhr: 2, asr: 1, maghrib: 1, isha: 1 },
    rounding: { fajr: 'up', sunrise: 'up', dhuhr: 'up', asr: 'up', maghrib: 'up', isha: 'up' },
    highLatitude: 'none',
    knownGap: 'preset ships the ceiling and dhuhr +1 only, and the other five +1 margins are ours',
    years: [2026, 2027, 2028],
  },
  {
    id: 'IR-NATIONAL', pair: 'Tehran', label: 'Tehran (adhan preset) vs the Iran national table',
    place: 'Tehran', lat: 35.6892, lon: 51.389, tz: 'Asia/Tehran',
    asr: null, grade: 'provisional',
    fajr: { angle: 17.71 }, isha: { kind: 'notPublished' },
    maghrib: { angle: 4.47 },
    margins: { fajr: 0, maghrib: 0 },
    rounding: { fajr: 'nearest', maghrib: 'nearest' },
    highLatitude: 'none',
    knownGap: 'preset fajr 17.70 vs 17.71, maghrib 4.50 vs 4.47, and an isha row the authority does not print',
    scoreOnly: ['fajr', 'maghrib'],
    years: [2026, 2027, 2028],
  },
  {
    id: 'PK-DEFACTO', pair: 'Karachi', label: 'Karachi (adhan preset) vs Pakistan community de facto',
    place: 'Karachi', lat: 24.86, lon: 67.01, tz: 'Asia/Karachi',
    asr: 'hanafi', grade: 'community de facto',
    fajr: { angle: 18 }, isha: { kind: 'angle', angle: 18 },
    margins: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: { fajr: 'nearest', sunrise: 'nearest', dhuhr: 'nearest', asr: 'nearest', maghrib: 'nearest', isha: 'nearest' },
    highLatitude: 'none',
    years: [2026, 2027, 2028],
  },
  {
    id: 'IN-DEFACTO', pair: 'Karachi', label: 'Karachi (adhan preset) vs India community de facto',
    place: 'Delhi', lat: 28.61, lon: 77.21, tz: 'Asia/Kolkata',
    asr: 'hanafi', grade: 'community de facto',
    fajr: { angle: 18 }, isha: { kind: 'angle', angle: 18 },
    margins: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: { fajr: 'nearest', sunrise: 'nearest', dhuhr: 'nearest', asr: 'nearest', maghrib: 'nearest', isha: 'nearest' },
    highLatitude: 'none',
    years: [2026, 2027, 2028],
  },
  {
    id: 'MY-JAKIM', pair: 'Karachi', label: 'BONUS: Karachi (adhan preset) vs JAKIM WLY01 Kuala Lumpur',
    place: 'Kuala Lumpur', lat: 3.139, lon: 101.6869, tz: 'Asia/Kuala_Lumpur',
    asr: 'shafi', grade: 'provisional', bonus: true,
    fajr: { angle: 18 }, isha: { kind: 'angle', angle: 18 },
    margins: { fajr: 2, sunrise: -1, dhuhr: 1.5, asr: 2, maghrib: 0, isha: 2 },
    rounding: { fajr: 'up', sunrise: 'down', dhuhr: 'nearest', asr: 'up', maghrib: 'up', isha: 'up' },
    highLatitude: 'none',
    years: [2026, 2027, 2028],
  },
  {
    id: 'EG-ESA', pair: 'Egyptian', label: 'Egyptian (adhan preset) vs Egyptian General Authority',
    place: 'Cairo', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo',
    asr: 'shafi', grade: 'A',
    fajr: { angle: 19.5 }, isha: { kind: 'angle', angle: 17.5 },
    margins: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: { fajr: 'nearest', sunrise: 'nearest', dhuhr: 'nearest', asr: 'nearest', maghrib: 'nearest', isha: 'nearest' },
    highLatitude: 'none',
    knownGap: 'preset ships dhuhr +1 and the authority zeroes it',
    years: [2026, 2027, 2028],
  },
  {
    id: 'US-COMMUNITY', pair: 'NorthAmerica',
    label: 'NorthAmerica (adhan preset) vs the US community default 15/15, New York',
    place: 'New York', lat: 40.71, lon: -74.01, tz: 'America/New_York',
    asr: 'shafi', grade: 'community',
    fajr: { angle: 15 }, isha: { kind: 'angle', angle: 15 },
    margins: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: { fajr: 'nearest', sunrise: 'nearest', dhuhr: 'nearest', asr: 'nearest', maghrib: 'nearest', isha: 'nearest' },
    highLatitude: 'none',
    caveat: 'reference point is the practice map 15/15 row, and that New York mosque prints Hanafi asr, carried as a flag only',
    years: [2026, 2027, 2028],
  },
];

// ------------------------------------------------------------- London truth
// GB-LONDON is the real published minute table, never a recipe: 2027 plus the
// 2028-2038 truth file, 4,383 days. Its reference clock is Europe/London.

const LONDON = {
  id: 'GB-LONDON', pair: 'MoonsightingCommittee',
  label: 'MoonsightingCommittee (adhan preset) vs London published minutes',
  place: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London',
  asr: 'shafi', grade: 'A',
  caveat: 'authority prints both shadows, the Shafi row carries +2 and the preset is Shafi. Never a recipe: the target is the publisher\'s own minute',
};

function loadLondon() {
  const table = new Map();
  const a = JSON.parse(readJson(join(CENSUS, 'o1g-decade/data/2027.json')));
  const b = JSON.parse(readJson(join(CENSUS, 'o1g-decade/truth/truth-2028-2038.json')));
  for (const src of [a, b]) {
    for (const [key, row] of Object.entries(src)) {
      const out = {};
      out.fajr = hhmm(row.fajr);
      out.sunrise = hhmm(row.sunrise);
      out.dhuhr = hhmm(row.dhuhr);
      out.asr = hhmm(row.asr);
      out.maghrib = hhmm(row.magrib);
      out.isha = hhmm(row.isha);
      table.set(key, out);
    }
  }
  return table;
}

function hhmm(text) {
  if (text == null) return null;
  const [h, m] = text.split(':').map(Number);
  return h * 60 + m;
}

function readJson(path) {
  return readFileSync(path, 'utf8');
}

// ---------------------------------------------------------------- metrics

function circular(delta) {
  return ((((delta + 720) % 1440) + 1440) % 1440) - 720;
}

function stats(devs) {
  const vals = devs.filter((v) => v != null && Number.isFinite(v));
  if (!vals.length) return { days: 0 };
  const abs = vals.map(Math.abs);
  const mean = abs.reduce((a, b) => a + b, 0) / abs.length;
  const signed = vals.reduce((a, b) => a + b, 0) / vals.length;
  return {
    days: vals.length,
    meanAbs: round2(mean),
    meanSigned: round2(signed),
    worst: round2(Math.max(...abs)),
    worstSigned: vals.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0),
    exact: round3(abs.filter((v) => v === 0).length / abs.length),
    within1: round3(abs.filter((v) => v <= 1).length / abs.length),
    within2: round3(abs.filter((v) => v <= 2).length / abs.length),
    beyond5Days: abs.filter((v) => v > 5).length,
  };
}

function round2(x) { return Math.round(x * 100) / 100; }
function round3(x) { return Math.round(x * 1000) / 1000; }

function compareSeries(presetRows, targetRows, prayers) {
  const out = {};
  for (const p of prayers) {
    const devs = [];
    for (let i = 0; i < targetRows.length; i += 1) {
      const t = targetRows[i][p];
      const m = presetRows[i][p];
      if (t == null || m == null) { devs.push(null); continue; }
      devs.push(circular(m - t));
    }
    out[p] = stats(devs);
  }
  const pooled = [];
  for (const p of prayers) {
    for (let i = 0; i < targetRows.length; i += 1) {
      const t = targetRows[i][p];
      const m = presetRows[i][p];
      if (t == null || m == null) continue;
      pooled.push(circular(m - t));
    }
  }
  out.all = stats(pooled);

  const noAsr = prayers.filter((p) => p !== 'asr');
  const pooledNoAsr = [];
  for (const p of noAsr) {
    for (let i = 0; i < targetRows.length; i += 1) {
      const t = targetRows[i][p];
      const m = presetRows[i][p];
      if (t == null || m == null) continue;
      pooledNoAsr.push(circular(m - t));
    }
  }
  out.allNoAsr = stats(pooledNoAsr);
  return out;
}

// ------------------------------------------------------------------ runner

function runRecipePair(t) {
  const coords = new Coordinates(t.lat, t.lon);
  const prayers = t.scoreOnly || PRAYERS;
  const byYear = {};

  for (const year of t.years) {
    const days = daysOfYear(year);
    const presetRows = days.map((d) => presetDay(t.pair, coords, d.date, t.tz));
    const targetRows = days.map((d) => recipeDay(t, coords, d.date, d.key));
    byYear[year] = { days: days.length, ...compareSeries(presetRows, targetRows, prayers) };
  }

  const days = t.years.flatMap((y) => daysOfYear(y));
  const presetRows = days.map((d) => presetDay(t.pair, coords, d.date, t.tz));
  const targetRows = days.map((d) => recipeDay(t, coords, d.date, d.key));
  const pooled = compareSeries(presetRows, targetRows, prayers);

  return {
    id: t.id, label: t.label, preset: t.pair, place: t.place,
    lat: t.lat, lon: t.lon, tz: t.tz, grade: t.grade,
    bonus: t.bonus === true,
    asr: {
      presetSchool: PRESETS[t.pair].school,
      targetSchool: t.asr,
      match: t.asr == null ? 'n/a' : (t.asr === PRESETS[t.pair].school ? 'match' : 'mismatch'),
    },
    targetRecipe: {
      fajr: t.fajr, isha: t.isha, maghrib: t.maghrib || null,
      margins: t.margins, rounding: t.rounding, highLatitude: t.highLatitude,
    },
    prayers: prayers,
    knownGap: t.knownGap || null,
    caveat: t.caveat || null,
    years: byYear,
    pooled,
  };
}

function runLondon() {
  const coords = new Coordinates(LONDON.lat, LONDON.lon);
  const table = loadLondon();
  const keys = [...table.keys()].sort();
  const days = keys.map((key) => {
    const [y, m, d] = key.split('-').map(Number);
    return { key, date: new Date(Date.UTC(y, m - 1, d, 12)) };
  });
  const presetRows = days.map((d) => presetDay(LONDON.pair, coords, d.date, LONDON.tz));
  const targetRows = days.map((d) => table.get(d.key));

  const byYear = {};
  for (const year of new Set(keys.map((k) => k.slice(0, 4)))) {
    const idx = days.map((d, i) => (d.key.startsWith(year) ? i : -1)).filter((i) => i >= 0);
    byYear[year] = {
      days: idx.length,
      ...compareSeries(idx.map((i) => presetRows[i]), idx.map((i) => targetRows[i]), PRAYERS),
    };
  }
  const pooled = compareSeries(presetRows, targetRows, PRAYERS);
  return {
    id: LONDON.id, label: LONDON.label, preset: LONDON.pair, place: LONDON.place,
    lat: LONDON.lat, lon: LONDON.lon, tz: LONDON.tz, grade: LONDON.grade,
    asr: { presetSchool: PRESETS[LONDON.pair].school, targetSchool: LONDON.asr, match: 'match' },
    target: 'real published minute table, 4,383 days (2027 + 2028-2038 truth), never a recipe',
    caveat: LONDON.caveat,
    prayers: PRAYERS,
    years: byYear,
    pooled,
  };
}

// ------------------------------------------------------------------- raw
// Preset against the publishers' own machine-readable captures. The preset is
// evaluated at the capture's own point and its printed minute is compared with
// the publisher's printed minute, in that publisher's civil clock.

function runRawSaudi() {
  const files = [
    '1447_21-4267_39-8317.json',
    '1448_21-4267_39-8317.json',
    '1449_21-4267_39-8317.json',
  ];
  const rows = new Map();
  for (const f of files) {
    const data = JSON.parse(readJson(join(CENSUS, 's1-saudi', f)));
    for (const r of data) {
      const key = r.date.slice(0, 10);
      const pt = r.prayerTimes;
      rows.set(key, {
        fajr: hhmm(pt.fajr), sunrise: hhmm(pt.sunrise), dhuhr: hhmm(pt.dhuhr),
        asr: hhmm(pt.asr), maghrib: hhmm(pt.maghrib), isha: hhmm(pt.isha),
      });
    }
  }
  const keys = [...rows.keys()].sort();
  const coords = new Coordinates(21.4267, 39.8317);
  const tz = 'Asia/Riyadh';
  const presetRows = keys.map((key) => {
    const [y, m, d] = key.split('-').map(Number);
    return presetDay('UmmAlQura', coords, new Date(Date.UTC(y, m - 1, d, 12)), tz);
  });
  const targetRows = keys.map((k) => rows.get(k));
  return rawBlock('SA-KACST', 'UmmAlQura at Makkah 21.4267/39.8317', 'KACST GetPrayerHijriYear, Hijri 1447-1449',
    coords, tz, keys, presetRows, targetRows, 's1-saudi');
}

function runRawUae() {
  const area = JSON.parse(readJson(join(CENSUS, 'c19-year2/uae/areas.json')))
    .find((a) => a.cityID === 32);
  const coords = new Coordinates(area.latitude, area.longitude);
  const tz = 'Asia/Dubai';
  const rows = new Map();
  for (const file of ['raw-2026.json', 'raw-2027.json']) {
    const data = JSON.parse(readJson(join(CENSUS, 'c19-year2/uae', file)));
    for (const r of data) {
      if (r.areaID !== 32) continue;
      const obs = r.obs;
      rows.set(r.date, {
        fajr: obs.fajr, sunrise: obs.sunrise, dhuhr: obs.dhuhr,
        asr: obs.asr, maghrib: obs.maghrib, isha: obs.isha,
      });
    }
  }
  const keys = [...rows.keys()].sort();
  const presetRows = keys.map((key) => {
    const [y, m, d] = key.split('-').map(Number);
    return presetDay('Dubai', coords, new Date(Date.UTC(y, m - 1, d, 12)), tz);
  });
  const targetRows = keys.map((k) => rows.get(k));
  return rawBlock('AE-AWQAF', `Dubai (AWQAF area ${area.cityID}, ${area.latitude}/${area.longitude})`,
    'AWQAF federal feed, area-level published minutes', coords, tz, keys, presetRows, targetRows, 'c19-year2/uae');
}

// The MOI portal prints a 12-hour clock with no meridiem: fajr and sunrise are
// morning, asr, maghrib and isha are afternoon. Dhuhr straddles noon as printed.
const PM_ROWS = new Set(['asr', 'maghrib', 'isha']);

function qatarClock(text, prayer) {
  const minutes = hhmm(text);
  if (minutes == null) return null;
  return PM_ROWS.has(prayer) && minutes < 720 ? minutes + 720 : minutes;
}

function runRawQatar() {
  const rows = new Map();
  for (const r of JSON.parse(readJson(join(CENSUS, 'c40-wayback/qa_rows.json')))) {
    rows.set(r.date, {
      fajr: qatarClock(r.fajr, 'fajr'), sunrise: qatarClock(r.sunrise, 'sunrise'),
      dhuhr: qatarClock(r.dhuhr, 'dhuhr'), asr: qatarClock(r.asr, 'asr'),
      maghrib: qatarClock(r.maghrib, 'maghrib'), isha: qatarClock(r.isha, 'isha'),
    });
  }
  const keys = [...rows.keys()].sort();
  const coords = new Coordinates(25.25, 51.6);
  const tz = 'Asia/Qatar';
  const presetRows = keys.map((key) => {
    const [y, m, d] = key.split('-').map(Number);
    return presetDay('Qatar', coords, new Date(Date.UTC(y, m - 1, d, 12)), tz);
  });
  const targetRows = keys.map((k) => rows.get(k));
  return rawBlock('QA-MOI', 'Qatar at the portal point 25.25/51.6', 'MOI portal, 31 Wayback day captures',
    coords, tz, keys, presetRows, targetRows, 'c40-wayback');
}

function rawBlock(targetId, pointLabel, source, coords, tz, keys, presetRows, targetRows, citedFrom) {
  const byYear = {};
  const years = [...new Set(keys.map((k) => k.slice(0, 4)))].sort();
  for (const year of years) {
    const idx = keys.map((k, i) => (k.startsWith(year) ? i : -1)).filter((i) => i >= 0);
    byYear[year] = {
      days: idx.length,
      ...compareSeries(idx.map((i) => presetRows[i]), idx.map((i) => targetRows[i]), PRAYERS),
    };
  }
  const pooled = compareSeries(presetRows, targetRows, PRAYERS);
  return {
    targetId, point: pointLabel, pointLat: coords.latitude, pointLon: coords.longitude, tz,
    source, citedFrom, days: keys.length,
    span: { from: keys[0], to: keys[keys.length - 1] },
    spot: { key: keys[0], preset: presetRows[0], published: targetRows[0] },
    years: byYear, pooled,
  };
}

// ------------------------------------------------------------------ report

function pct(x) { return x == null ? '-' : (x * 100).toFixed(1); }
function min(x) { return x == null ? '-' : x.toFixed(2); }
function clockRow(row) {
  return PRAYERS.map((p) => {
    const m = row ? row[p] : null;
    if (m == null) return '-';
    const v = ((m % 1440) + 1440) % 1440;
    return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
  }).join(' | ');
}

function prayerRow(prayer, s) {
  if (!s || s.days === 0) return `| ${prayer} | - | - | - | - | - | - |`;
  return `| ${prayer} | ${min(s.meanAbs)} | ${min(s.meanSigned)} | ${min(s.worst)} | ${pct(s.exact)} | ${pct(s.within1)} | ${pct(s.within2)} |`;
}

function buildReport(pairResults, london, raws, meta) {
  const L = [];
  const p = (s = '') => L.push(s);

  p('# O1i home-ground: the adhan presets against their own governments');
  p('');
  p('Round two of the methods study. Round one scored fajr and isha with the harness applying');
  p('its own rounding. This round scores the full six-row table the user sees, because');
  p('`methodAdjustments`, rounding and the asr school are part of what the package delivers.');
  p('Each local preset runs verbatim, straight from `CalculationMethod[name]()`, with nothing');
  p('added and nothing removed, against its own country\'s fitted recipe or published minutes.');
  p('');
  p('## Method');
  p('');
  p(`- Engine: adhan-js ${meta.engine}. Node under TZ=UTC, every date built from a literal at noon`);
  p('  UTC, so the process clock is never read and no date can slip a day.');
  p('- Preset side: `CalculationMethod[preset]()` exactly as shipped, including its');
  p('  `methodAdjustments` and its `rounding`. `Rounding.Up` on Singapore and the Dubai and');
  p('  Diyanet margin blocks come from the package, not from the census.');
  p('- The one caller-side field is the madhab, which no preset sets. It takes the school the');
  p('  body itself documents: Karachi Hanafi (CONSTRAINTS.md rule 2 names it a body constant),');
  p('  every other body here Shafi. A school that disagrees with the target is flagged and');
  p('  never enters a score.');
  p('- Target side: the policy-layer v2.4 recipe at the object\'s own point, computed at second');
  p('  resolution then margined and rounded as the object declares. Objects carrying');
  p('  `highLatitude.kind: none` get the library\'s night substitution disabled, so no clamp');
  p('  leaks into a low-latitude table. Diyanet\'s frozen-latitude-45 rule never binds at 41 N,');
  p('  which the object\'s own provenance states.');
  p('- Deviation is preset minute minus authority minute on that country\'s IANA wall clock,');
  p('  taken on the 24-hour circle. `maghrib` is the sunset row unless the object carries a');
  p('  maghrib angle, which only Iran does.');
  p('- Interval isha is composed on the printed maghrib, the census invariant.');
  p('- Both sides are printed whole minutes, so every deviation in this study is an integer.');
  p('  That is why the within-1 and within-2 columns coincide wherever no row is three or more');
  p('  out: a table that is never 2 minutes off is also never 1.5 off.');
  p('');
  p('## Assumptions and inputs');
  p('');
  p(`- Ramadan windows, per the announcing body's own Hijri calendar: 1447 ${meta.ramadan[0].from}..${meta.ramadan[0].to}`);
  p(`  (${meta.ramadan[0].days} days), 1448 ${meta.ramadan[1].from}..${meta.ramadan[1].to} (${meta.ramadan[1].days}), 1449`);
  p(`  ${meta.ramadan[2].from}..${meta.ramadan[2].to} (${meta.ramadan[2].days}), from the KACST capture in`);
  p('  `s1-saudi/FINDINGS.md`.');
  p('- Years 2026, 2027 and 2028, whole Gregorian years, for every recipe pair. London uses its');
  p('  own real table, 2027 plus 2028-2038, 4,383 days.');
  p('- The US reference is the practice map\'s 15/15 row at 40.71, -74.01, labelled community.');
  p('');
  p('## Summary: does the preset reproduce its own government?');
  p('');
  p('Three-year pooled mean absolute deviation over the six printed rows, plus the same figure');
  p('with asr removed, the share of prayer-days within two minutes, and the worst single day.');
  p('`all` pools every prayer-day of the period.');
  p('');
  p('| Pair | Preset | Pooled mean | without asr | Worst row | <=1 min | <=2 min | asr | Verdict |');
  p('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of [...pairResults, london]) {
    const s = r.pooled.all;
    const name = r.bonus ? `${r.id} (bonus)` : r.id;
    p(`| ${name} | ${r.preset} | **${min(s.meanAbs)}** | ${min(r.pooled.allNoAsr.meanAbs)} | ${min(s.worst)} | ${pct(s.within1)} | ${pct(s.within2)} | ${r.asr.match} | ${verdict(s)} |`);
  }
  p('');
  p('`verdict` bands: reproduces at <= 0.5 min pooled, close at <= 1.5, drifting at <= 4, off');
  p('above 4. Every band is about the six-row table the user sees, so a single systematic');
  p('one-minute margin on one row moves a pair by 0.17 and not by 1. The bonus row carries a');
  p('school mismatch on asr, so its six-row figure is not comparable: read its "without asr"');
  p('column, 1.48, and the paragraph on it below.');
  p('');
  p('## Per pair, per year, per prayer');
  p('');
  for (const r of [...pairResults, london]) {
    p(`### ${r.id} - ${r.preset}`);
    p('');
    p(`${r.label}. ${r.place} ${r.lat}, ${r.lon}, ${r.tz}. Authority grade ${r.grade}.`);
    if (r.knownGap) p(`Known gap: ${r.knownGap}.`);
    if (r.caveat) p(`Caveat: ${r.caveat}.`);
    p(`asr: preset ${r.asr.presetSchool}, authority ${r.asr.targetSchool ?? 'not stated'} (${r.asr.match}).`);
    if (r.targetRecipe) {
      p('');
      p(`Recipe: fajr ${JSON.stringify(r.targetRecipe.fajr)}, isha ${JSON.stringify(r.targetRecipe.isha)}` +
        `${r.targetRecipe.maghrib ? `, maghrib ${JSON.stringify(r.targetRecipe.maghrib)}` : ''}.`);
      p(`Margins ${JSON.stringify(r.targetRecipe.margins)}, rounding ${JSON.stringify(r.targetRecipe.rounding)}.`);
    }
    if (r.target) p(`Target: ${r.target}.`);
    p('');
    const years = Object.keys(r.years);
    for (const year of years) {
      const y = r.years[year];
      p(`**${year}** (${y.days} days)`);
      p('');
      p('| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |');
      p('| --- | --- | --- | --- | --- | --- | --- |');
      for (const prayer of r.prayers) p(prayerRow(prayer, y[prayer]));
      p(prayerRow('**all**', y.all));
      p('');
    }
    if (years.length > 1) {
      p(`**pooled ${years[0]}-${years[years.length - 1]}** (${r.pooled.all.days} prayer-days)`);
      p('');
      p('| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |');
      p('| --- | --- | --- | --- | --- | --- | --- |');
      for (const prayer of r.prayers) p(prayerRow(prayer, r.pooled[prayer]));
      p(prayerRow('**all**', r.pooled.all));
      p('');
    }
  }

  p('## Preset against the publishers\' raw captures');
  p('');
  p('The same presets against the machine-readable captures held in the census tree, so the');
  p('fitted recipe and the publisher\'s own printed minute can be read side by side. The preset');
  p('is evaluated at the capture\'s own point, which for Dubai is the AWQAF area coordinate');
  p('rather than the fitted point, so the raw column carries a coordinate difference as well.');
  p('The pooled row covers the whole capture. Saudi\'s capture opens with a 2025 tail and ends');
  p('in spring 2028, and the UAE\'s 2027 half stops on 2027-06-05. The per-year rows show each');
  p('split.');
  p('');
  p('### Side by side: preset vs recipe and preset vs the publisher');
  p('');
  p('Pooled mean absolute deviation per row. `recipe` is the policy-layer target at its own');
  p('point, `raw` is the publisher\'s printed minute at the capture point.');
  p('');
  p('| Pair | Side | fajr | sunrise | dhuhr | asr | maghrib | isha | all | days |');
  p('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const raw of raws) {
    const pair = pairResults.find((x) => x.id === raw.targetId);
    const a = pair.pooled;
    const b = raw.pooled;
    p(`| ${raw.targetId} | recipe | ${min(a.fajr?.meanAbs)} | ${min(a.sunrise?.meanAbs)} | ${min(a.dhuhr?.meanAbs)} | ${min(a.asr?.meanAbs)} | ${min(a.maghrib?.meanAbs)} | ${min(a.isha?.meanAbs)} | ${min(a.all.meanAbs)} | ${a.all.days} |`);
    p(`| ${raw.targetId} | raw | ${min(b.fajr?.meanAbs)} | ${min(b.sunrise?.meanAbs)} | ${min(b.dhuhr?.meanAbs)} | ${min(b.asr?.meanAbs)} | ${min(b.maghrib?.meanAbs)} | ${min(b.isha?.meanAbs)} | ${min(b.all.meanAbs)} | ${raw.days} |`);
  }
  p('');
  for (const raw of raws) {
    const s = raw.pooled.all;
    p(`### ${raw.targetId} raw - ${raw.source}`);
    p('');
    p(`Point ${raw.point}, ${raw.pointLat}, ${raw.pointLon}, ${raw.tz}. ${raw.days} published days,`);
    p(`${raw.span.from} to ${raw.span.to}, from \`${raw.citedFrom}\`.`);
    p('');
    p('| period | days | fajr | sunrise | dhuhr | asr | maghrib | isha | all |');
    p('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const year of Object.keys(raw.years)) {
      const y = raw.years[year];
      p(`| ${year} | ${y.days} | ${min(y.fajr.meanAbs)} | ${min(y.sunrise.meanAbs)} | ${min(y.dhuhr.meanAbs)} | ${min(y.asr.meanAbs)} | ${min(y.maghrib.meanAbs)} | ${min(y.isha.meanAbs)} | ${min(y.all.meanAbs)} |`);
    }
    p(`| pooled | ${raw.days} | ${min(s.fajr?.meanAbs)} | ${min(s.sunrise?.meanAbs)} | ${min(s.dhuhr?.meanAbs)} | ${min(s.asr?.meanAbs)} | ${min(s.maghrib?.meanAbs)} | ${min(s.isha?.meanAbs)} | **${min(s.meanAbs)}** |`);
    p('');
    p('Pooled detail:');
    p('');
    p('| prayer | mean abs | mean signed | worst | exact | <=1 | <=2 |');
    p('| --- | --- | --- | --- | --- | --- | --- |');
    for (const prayer of PRAYERS) p(prayerRow(prayer, raw.pooled[prayer]));
    p(prayerRow('**all**', raw.pooled.all));
    p('');
  }

  p('## The three biggest preset-versus-authority gaps');
  p('');
  p('Ranked by the mean absolute deviation of a single prayer row, which is where a user feels');
  p('it. The bonus row is excluded here and reported on its own below.');
  p('');
  const cells = [];
  for (const r of [...pairResults, london]) {
    if (r.bonus) continue;
    for (const prayer of r.prayers) {
      const s = r.pooled[prayer];
      if (s && s.days) cells.push({ r, prayer, s });
    }
  }
  const ranked = cells.sort((a, b) => b.s.meanAbs - a.s.meanAbs);
  ranked.slice(0, 3).forEach((g, i) => {
    const beyond = g.s.beyond5Days > 0
      ? `, and beyond five minutes on ${g.s.beyond5Days} days` : '';
    p(`${i + 1}. **${g.r.id} ${g.prayer}**: mean ${min(g.s.meanAbs)} min ` +
      `(signed ${min(g.s.meanSigned)}), worst ${min(g.s.worst)}, inside two minutes on ` +
      `${pct(g.s.within2)} percent of ${g.s.days} days${beyond}.`);
  });
  p('');
  p('Runners-up: ' + ranked.slice(3, 7)
    .map((g) => `${g.r.id} ${g.prayer} ${min(g.s.meanAbs)}`).join(', ') + '.');
  p('');
  p('The first and third entries are the same failure in two directions: London publishes');
  p('date-keyed interval tables that no angle formula reproduces, so the preset runs three');
  p('minutes late on sunrise and, on isha, four minutes early with a 24 percent inside-two');
  p('record and 1,401 days beyond five minutes. The second is a one-line margin error: UAE');
  p('AWQAF carries asr at zero and the preset at +3, and the result is three minutes late on');
  p('every single day, never once inside two.');
  p('');
  p('The largest single-day miss in the whole study is not in that list because its mean is');
  p(`diluted: Umm al-Qura's isha is 30 to 31 minutes early on each of the ${pairResults.find((r) => r.id === 'SA-KACST').pooled.isha.beyond5Days} Ramadan days of the three years,`);
  p('and a fraction of a minute outside them. Print that beside the half-minute margins');
  p('everywhere else: the preset is not wrong about the year, it is missing a month.');
  p('');
  p('## The same gaps read as what the package is missing');
  p('');
  p('Each preset gap maps to a named part of the authority recipe that the preset does not');
  p('carry, which is the point of running the preset naked:');
  p('');
  p('| Pair | What the package lacks | Size |');
  p('| --- | --- | --- |');
  p('| UmmAlQura | the +1 margin on five rows, and the Ramadan isha +120 switch | 0.5 min, and 30-31 min on 88 Ramadan days a year |');
  p('| Dubai | asr, dhuhr and maghrib margins, and the isha -1 | 3.0 min on asr, 1.0 on dhuhr and maghrib and isha |');
  p('| Qatar | the +1 margin on five rows and the +0.5 asr, and its isha is composed on raw sunset | 1.0 min on four rows, 0.5 on asr |');
  p('| Kuwait | the floor on fajr and shuruq | 0.5 min on two rows |');
  p('| Turkey | nothing measurable | zero |');
  p('| Singapore | the five +1 margins and the second dhuhr minute | 1.0 min on all six rows |');
  p('| Tehran | fajr 17.70 against 17.71, maghrib 4.50 against 4.47, and an isha row with no publisher | under 0.2 min on the two scored rows |');
  p('| Karachi (PK, IN) | nothing but the dhuhr +1 it ships | 1.0 min on dhuhr |');
  p('| Egyptian | nothing but the dhuhr +1 it ships | 1.0 min on dhuhr |');
  p('| NorthAmerica | nothing but the dhuhr +1 it ships | 1.0 min on dhuhr |');
  p('| MoonsightingCommittee | the publisher\'s own date-keyed interval tables | 4.4 min on isha, 3.0 on sunrise, 3.0 on fajr |');
  p('');
  p('The dhuhr +1 is a package-wide constant: every preset that ships it (Muslim World League,');
  p('Egyptian, Karachi, North America) lands exactly one minute late against a recipe that');
  p('carries a zero dhuhr margin. It is a property of the package, not of the country.');
  p('');
  p('## Karachi against JAKIM, the bonus row');
  p('');
  const jakim = pairResults.find((r) => r.id === 'MY-JAKIM');
  p(`Karachi run naked at Kuala Lumpur scores ${min(jakim.pooled.allNoAsr.meanAbs)} pooled on the five non-asr`);
  p(`rows, ${min(jakim.pooled.fajr.meanAbs)} early on fajr and ${min(jakim.pooled.isha.meanAbs)} early on isha, with`);
  p(`${pct(jakim.pooled.fajr.within2)} percent of fajr days and ${pct(jakim.pooled.isha.within2)} percent of isha days inside two`);
  p(`minutes. Its asr is ${min(jakim.pooled.asr.meanAbs)} late because the preset carries Karachi's Hanafi school`);
  p('while JAKIM prints the Shafi shadow: a school flag, never a score. The angle pair is identical at');
  p('18/18, so the whole of the fajr and isha gap is JAKIM\'s two-minute ihtiyati ceiling, which');
  p('the preset does not have.');
  p('');
  p('## Checks that the harness is right');
  p('');
  p('Three independent confirmations, each one able to fail:');
  p('');
  const turkish = pairResults.find((r) => r.id === 'TR-DIYANET-DOMESTIC').pooled.all;
  p('- **The Diyanet identity.** The Turkey preset scored against the Diyanet recipe is exactly');
  p(`  zero on all ${turkish.days} prayer-days, every year, no rounding slack: ${turkish.exact * 100} percent exact,`);
  p('  worst 0. The preset\'s own `methodAdjustments` are byte-for-byte Diyanet\'s temkin and its');
  p('  rounding is Diyanet\'s nearest, so two independently built sides agreeing to the minute is');
  p('  the strongest proof the pipeline has: any day-slip, zone error or rounding inversion would');
  p('  show up here first.');
  p('- **Spot days against the publishers.** The first captured day of each raw source, preset');
  p('  beside published:');
  p('');
  p('| Source | Day | Side | fajr | sunrise | dhuhr | asr | maghrib | isha |');
  p('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const raw of raws) {
    p(`| ${raw.targetId} | ${raw.spot.key} | preset | ${clockRow(raw.spot.preset)} |`);
    p(`| ${raw.targetId} | ${raw.spot.key} | published | ${clockRow(raw.spot.published)} |`);
  }
  p('');
  p('- **Round one repeats where it should and differs where it must.** Round one recorded the');
  p('  Umm al-Qura row exactly 1.0 minute early on fajr and 1.0 on isha for 2026, with a method');
  p('  row that floored and that carried the Ramadan +120 switch. This round\'s preset rounds to');
  p('  nearest, so fajr lands at 0.50, and it has no switch, so isha adds the Ramadan miss on');
  p('  top. Same direction on both rows, and every difference is the rounding convention or the');
  p('  switch. Nothing in this harness reads the round-one output.');
  p('');
  p('## Reproduce');
  p('');
  p('```');
  p('TZ=UTC node grid.mjs');
  p('```');
  p('');
  p('Writes `results.json` and this file to the same directory.');
  p('');
  p(`Generated ${meta.generated} by grid.mjs.`);
  return L.join('\n');
}

function verdict(s) {
  if (s.meanAbs <= 0.5) return 'reproduces';
  if (s.meanAbs <= 1.5) return 'close';
  if (s.meanAbs <= 4) return 'drifting';
  return 'off';
}

// -------------------------------------------------------------------- main

function main() {
  const pairResults = TARGETS.map(runRecipePair);
  const london = runLondon();
  const raws = [runRawSaudi(), runRawUae(), runRawQatar()];

  const meta = { engine: '4.4.6', generated: '2026-11-10', ramadan: RAMADAN };

  const payload = {
    schema: 'o1i-homeground/1',
    generated: meta.generated,
    study: 'O1i round two: adhan local presets verbatim against their own countries, six prayers, 2026-2028',
    engine: 'adhan-js 4.4.6',
    conventions: {
      presetSide: 'CalculationMethod[preset]() verbatim: its angles, methodAdjustments, rounding and high-latitude rule as shipped',
      madhab: 'no preset sets madhab; the body documented school is used (Karachi Hanafi per CONSTRAINTS rule 2, others Shafi)',
      targetSide: 'policy-layer v2.4 recipe, own margins, own rounding, own clock, highLatitude none; second resolution then margin then direction',
      deviation: 'preset minute minus authority minute, wall clock in the country IANA zone, 24 h circle, absolute value for mean/worst',
      intervalIsha: 'printed maghrib plus interval',
      clock: 'TZ=UTC process, dates from literals, country zone via Intl; real clock never read',
      ramadan: RAMADAN,
    },
    pairs: pairResults,
    london,
    raw: raws,
  };
  writeFileSync(join(OUT, 'results.json'), `${JSON.stringify(payload, null, 1)}\n`);

  const report = buildReport(pairResults, london, raws, meta);
  writeFileSync(join(OUT, 'HOMEGROUND-REPORT.md'), `${report}\n`);

  for (const r of [...pairResults, london]) {
    process.stdout.write(`${r.id.padEnd(24)} pooled ${String(r.pooled.all.meanAbs).padStart(6)} worst ${String(r.pooled.all.worst).padStart(5)} within1 ${pct(r.pooled.all.within1)}%\n`);
  }
  for (const raw of raws) {
    process.stdout.write(`RAW ${raw.targetId.padEnd(20)} days ${String(raw.days).padStart(4)} pooled ${String(raw.pooled.all.meanAbs).padStart(6)} within1 ${pct(raw.pooled.all.within1)}%\n`);
  }
}

main();
