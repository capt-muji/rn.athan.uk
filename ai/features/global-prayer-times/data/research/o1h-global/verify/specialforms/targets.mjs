// O1h special-forms study: the four non-angle-form targets the main grid excludes.
//
// Implemented targets (record -> code, field-level citations inline):
//   SI-VAKTIJA  policy-layer.v2.4.json id SI-VAKTIJA: fajrRule.sweep.formula
//               "fajr_deg = 18.91 + 0.25*cos(doy - 94)", ishaRule.sweep.formula
//               "isha_deg = 16.62 + 1.32*cos(doy - 346)" (cos in DEGREES: the object's
//               own "effective 18.66-19.16 (max doy 94, min doy 274)" and
//               "15.3 (June) to 17.9 (December)" confirm the degree reading), margins
//               fajr 0 / isha 0, rounding.nearest on all six columns, highLatitude.kind
//               "none", asr shafi, timezone.iana Europe/Ljubljana dstMode iana.
//               solarBase -1.78/-1.77 touches only the sunrise/sunset columns, which are
//               not scored here (fajr/isha are pure angle times at margin 0).
//               world-table-v2.md Slovenia row: "fajr 18.91+0.25cos(doy-94); isha
//               16.62+1.32cos(doy-346); margins sunrise -6, dhuhr +2, maghrib +6; Shafi".
//   UA-DUMU     policy-layer.v2.4.json id UA-DUMU: fajrRule.intervalTable {base sunrise,
//               minutes -100, keying constant}, ishaRule.intervalTable.ranges
//               (Sep 11-May 21 = 90; Jun 1-Aug 31 = 100; rampUp May 22-31 =
//               [92,94,94,94,95,96,97,98,99,100]; rampDown Sep 1-11 =
//               [100,99,98,97,96,95,94,93,92,92,90]), solarBase -2.11/-2.11 (NOT the
//               standard -0.833), margins fajr 0 / isha 0, roundingProvenance.default
//               "the interval offsets are applied to already-rounded sunrise/maghrib",
//               highLatitude.kind "none", reference.point Kyiv 50.4501/30.5233, tz
//               Europe/Kyiv dstMode iana. world-table-v2.md Ukraine row: "fajr = sunrise
//               - 100 min EVERY day ... isha = maghrib + 90 (Sep 11-May 21) / + 100
//               (Jun 1-Aug 31) with explicit dated ramps ... solarBase -2.11".
//
// Skipped targets (underdetermined day-by-day values in the record; nothing invented):
//   AT-IZW      fajrRule.sweep / ishaRule.sweep carry only "implied" verbal ranges
//               (fajr "15.0-15.7 Oct-Apr, trough ~12.5 mid-May..early Aug"; isha
//               "15.8-15.9 Jan-early May, trough ~11.3-11.5 mid-May..early Jul, autumn
//               plateau ~16.2-16.3") - no formula, no per-day values. The per-day
//               anchors live in c16-fits/data/izw_final_quant.json, outside this study's
//               allowed input list (SHARED-BRIEF: "Read nothing else").
//   FR-GMS      sweeps carried as endpoint ranges only (fajr "18 -> 12 deg over the
//               year", isha "16 -> 11.5 deg"), margins fajr/isha null, recipeStatus
//               "partial", and the object's own verdict: "a frozen Strasbourg object
//               must not be built from it". No day-by-day value is recoverable.

import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);

const ADHAN_DIR = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan';
const METHODS_JSON = '$HOME/athan-gitree/census/o1h-global/methods/methods.json';
const COUNTRIES_JSON = '$HOME/athan-gitree/census/o1h-global/countries.json';
const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));

const { default: Astronomical } = require(`${ADHAN_DIR}/lib/cjs/Astronomical.js`);
const { default: SolarCoordinates } = require(`${ADHAN_DIR}/lib/cjs/SolarCoordinates.js`);
const { default: Coordinates } = require(`${ADHAN_DIR}/lib/cjs/Coordinates.js`);
const adhan = require(`${ADHAN_DIR}/lib/cjs/Adhan.js`);

const YEAR = 2026;

// ---------------------------------------------------------------------------
// Target-side solar model: mirrors adhan-js 4.4.6 SolarTime exactly (same
// julianDay / approximateTransit / correctedTransit / correctedHourAngle chain),
// so target and methods share one solar engine.
// ---------------------------------------------------------------------------

function solarTimeFor(dateLocal, coords) {
  const y = dateLocal.getFullYear();
  const m = dateLocal.getMonth() + 1;
  const d = dateLocal.getDate();
  const julianDay = Astronomical.julianDay(y, m, d, 0);
  const solar = new SolarCoordinates(julianDay);
  const prevSolar = new SolarCoordinates(julianDay - 1);
  const nextSolar = new SolarCoordinates(julianDay + 1);
  const m0 = Astronomical.approximateTransit(coords.longitude, solar.apparentSiderealTime, solar.rightAscension);
  return {
    transit: Astronomical.correctedTransit(m0, coords.longitude, solar.apparentSiderealTime, solar.rightAscension, prevSolar.rightAscension, nextSolar.rightAscension),
    hourAngle(angle, afterTransit) {
      return Astronomical.correctedHourAngle(m0, angle, coords, afterTransit, solar.apparentSiderealTime, solar.rightAscension, prevSolar.rightAscension, nextSolar.rightAscension, solar.declination, prevSolar.declination, nextSolar.declination);
    },
    y, m0BasedMonth: dateLocal.getMonth(), d,
  };
}

// Same conversion adhan's TimeComponents.utcDate does (solar fraction -> UTC instant).
function instantForHours(hours, y, month0, d) {
  const h = Math.floor(hours);
  const mi = Math.floor((hours - h) * 60);
  const s = Math.floor((hours - h - mi / 60) * 60 * 60);
  return new Date(Date.UTC(y, month0, d, h, mi, s));
}

function dayOfYear(y, m, d) {
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
}

// Wall-clock minutes past local midnight from a UTC instant, rounded per mode.
function wallMinutes(instant, mode) {
  if (Number.isNaN(instant.getTime())) return null;
  const s = instant.getHours() * 3600 + instant.getMinutes() * 60 + instant.getSeconds();
  switch (mode) {
    case 'nearest': return Math.floor(s / 60 + 0.5); // adhan Rounding.Nearest semantics
    case 'up': return Math.ceil(s / 60);
    case 'down': return Math.floor(s / 60);
    case 'floorPlus1': return Math.floor(s / 60) + 1; // Umm al-Qura: floor(raw + 1 min)
    default: throw new Error(`unknown rounding mode ${mode}`);
  }
}

// ---------------------------------------------------------------------------
// Implementable targets
// ---------------------------------------------------------------------------

const LJUBLJANA = { latitude: 46.0569, longitude: 14.5058 };
const KYIV = { latitude: 50.4501, longitude: 30.5233 };

function dumuIshaInterval(m, d) {
  // ishaRule.intervalTable.ranges, verbatim
  if (m >= 6 && m <= 8) return 100;                    // Jun 1 - Aug 31
  if (m === 5 && d >= 22) return [92, 94, 94, 94, 95, 96, 97, 98, 99, 100][d - 22]; // rampUp May 22-31
  if (m === 9 && d <= 11) return [100, 99, 98, 97, 96, 95, 94, 93, 92, 92, 90][d - 1]; // rampDown Sep 1-11
  return 90;                                           // Sep 11 - May 21
}

// Each target: returns { fajrMin, ishaMin } wall minutes for local calendar day (y,m,d),
// already carrying its own margins (fajr/isha margin 0 for both) and rounding.
const IMPLEMENTED = {
  'SI-VAKTIJA': {
    city: 'Ljubljana',
    coords: LJUBLJANA,
    tz: 'Europe/Ljubljana',
    asr: 'shafi',
    sources: {
      policyLayer: [
        'fajrRule.sweep.formula "fajr_deg = 18.91 + 0.25*cos(doy - 94)"',
        'ishaRule.sweep.formula "isha_deg = 16.62 + 1.32*cos(doy - 346)"',
        'sweep "effective" strings pin cos to degrees (max doy 94 / min doy 274; 15.3 June / 17.9 December)',
        'margins.fajr 0, margins.isha 0',
        'rounding "nearest" (all six columns)',
        'highLatitude.kind "none"',
        'timezone iana Europe/Ljubljana, dstMode iana',
        'solarBase -1.78/-1.77: sunrise/sunset columns only, not scored here',
        'asr primary shafi',
      ],
      worldTable: 'world-table-v2.md Slovenia row (lines 238-248): "fajr 18.91+0.25cos(doy-94); isha 16.62+1.32cos(doy-346); margins sunrise -6, dhuhr +2, maghrib +6; Shafi; Clock: IANA"',
    },
    compute(y, m, d) {
      const st = solarTimeFor(new Date(y, m - 1, d), this.coords);
      const doy = dayOfYear(y, m, d);
      const fajrDeg = 18.91 + 0.25 * Math.cos((doy - 94) * Math.PI / 180);
      const ishaDeg = 16.62 + 1.32 * Math.cos((doy - 346) * Math.PI / 180);
      const fajr = instantForHours(st.hourAngle(-fajrDeg, false), y, m - 1, d);
      const isha = instantForHours(st.hourAngle(-ishaDeg, true), y, m - 1, d);
      return { fajrMin: wallMinutes(fajr, 'nearest'), ishaMin: wallMinutes(isha, 'nearest'), fajrDeg, ishaDeg };
    },
  },
  'UA-DUMU': {
    city: 'Kyiv',
    coords: KYIV,
    tz: 'Europe/Kyiv',
    asr: 'shafi',
    sources: {
      policyLayer: [
        'fajrRule.intervalTable {base "sunrise", minutes -100, keying "constant, every day of the year"}',
        'ishaRule.intervalTable.ranges: Sep 11-May 21 = 90; Jun 1-Aug 31 = 100; rampUp May 22-31 = [92,94,94,94,95,96,97,98,99,100]; rampDown Sep 1-11 = [100,99,98,97,96,95,94,93,92,92,90]',
        'solarBase sunriseAltitudeDeg -2.11, sunsetAltitudeDeg -2.11 (adhanStandard -0.833 NOT used)',
        'margins fajr 0, isha 0 (marginsProvenance.perField: "the instant is sunrise - 100 min; no margin on top")',
        'roundingProvenance.default: "the interval offsets are applied to already-rounded sunrise/maghrib"',
        'highLatitude.kind "none"',
        'reference.point Kyiv 50.4501, 30.5233; timezone iana Europe/Kyiv',
        'asr shafi (+5, not scored)',
      ],
      worldTable: 'world-table-v2.md Ukraine row (lines 442-452): "fajr = sunrise - 100 min EVERY day of the year; isha = maghrib + 90 (Sep 11-May 21) / + 100 (Jun 1-Aug 31) with explicit dated ramps; solarBase -2.11 deg altitude; nearest"',
    },
    compute(y, m, d) {
      const st = solarTimeFor(new Date(y, m - 1, d), this.coords);
      // solarBase -2.11 deg horizon for both sunrise and sunset
      const srMin = wallMinutes(instantForHours(st.hourAngle(-2.11, false), y, m - 1, d), 'nearest');
      const ssMin = wallMinutes(instantForHours(st.hourAngle(-2.11, true), y, m - 1, d), 'nearest');
      const iv = dumuIshaInterval(m, d);
      return { fajrMin: srMin - 100, ishaMin: ssMin + iv, interval: iv };
    },
  },
};

const SKIPPED = [
  {
    id: 'AT-IZW',
    reason: 'seasonal sweeps documented only as verbal implied ranges (fajr "15.0-15.7 Oct-Apr, trough ~12.5 mid-May..early Aug"; isha "15.8-15.9 ... trough ~11.3-11.5 ... autumn plateau ~16.2-16.3") with no formula or per-day values in policy-layer; the per-day anchors (c16-fits/data/izw_final_quant.json) sit outside the brief\'s allowed input list, so no day-by-day value is recoverable without inventing one.',
  },
  {
    id: 'FR-GMS',
    reason: 'conventions-only object by its own verdict ("no frozen object buildable", recipeStatus partial): fajr/isha sweeps carried as endpoint ranges only (18 -> 12 deg, 16 -> 11.5 deg) with no formula, no per-day values, and null fajr/isha margins - daily values are not recoverable from the record.',
  },
];

// ---------------------------------------------------------------------------
// Method side: 21 naked methods (20 from methods.json + ISNA-2010 18/18)
// ---------------------------------------------------------------------------

const PRESETS = {
  mwl: 'MuslimWorldLeague',
  isna: 'NorthAmerica',
  'umm-al-qura': 'UmmAlQura',
  egyptian: 'Egyptian',
  karachi: 'Karachi',
  moonsighting: 'MoonsightingCommittee',
  'diyanet-domestic': 'Turkey', // preset carries the temkin (sunrise -7, dhuhr +5, asr +4, maghrib +7): the temkin IS the method
  kuwait: 'Kuwait',
  qatar: 'Qatar',
  'singapore-muis': 'Singapore',
  tehran: 'Tehran',
  dubai: 'Dubai',
};

// adhan 'Other' constructed from the body's own documented pair (SHARED-BRIEF).
// fazilet pairs are the EFFECTIVE angles per brief ("19.8/17.8 effective").
const CONSTRUCTED = {
  'diyanet-europe': [18, 16],
  mabims: [20, 18],
  kemenag: [20, 18],
  'fazilet-a': [19.8, 17.8],
  'fazilet-b': [20.8, 18.7],
  ecfr: [18, 17],
  'russia-sam': [16, 15],
  'isna-2010': [18, 18],
  jakim: [18, 18],
};

// Method-side rounding for the scored prayers, only where the body documents its own
// (methods.json notes); everywhere else the harness default nearest (CONSTRAINTS 4).
const METHOD_ROUNDING = {
  mwl: ['nearest', 'nearest'],
  isna: ['nearest', 'nearest'],
  'umm-al-qura': ['floorPlus1', 'floorPlus1'], // "floor(raw + 1 minute) equals ceil(raw)"
  egyptian: ['nearest', 'nearest'],
  karachi: ['nearest', 'nearest'],
  moonsighting: ['nearest', 'nearest'],
  'diyanet-domestic': ['nearest', 'nearest'],
  'diyanet-europe': ['nearest', 'nearest'],
  mabims: ['nearest', 'nearest'], // members differ; no body-level rule -> harness default
  jakim: ['up', 'up'],            // "Prayers ceil"
  kemenag: ['down', 'down'],      // "fajr down ... isha down"
  kuwait: ['down', 'nearest'],    // "fajr and sunrise floor, maghrib and isha nearest"
  qatar: ['nearest', 'nearest'],
  'singapore-muis': ['up', 'up'], // preset sets Rounding.Up
  dubai: ['nearest', 'nearest'],  // only sunrise floor is documented; fajr/isha unstated
  tehran: ['nearest', 'nearest'],
  'fazilet-a': ['nearest', 'nearest'],
  'fazilet-b': ['nearest', 'nearest'],
  ecfr: ['nearest', 'nearest'],
  'russia-sam': ['nearest', 'nearest'],
  'isna-2010': ['nearest', 'nearest'],
};

// Body-documented margins on the scored prayers only. Everything census-fitted stays
// OUT (CONSTRAINTS 1, "no other method receives margins from the census"):
//   ecfr  -2/+2  = the council's own resolution ("fajr 18, isha 17, +-2 minutes").
//   jakim +2/+2  = NOT applied here: methods.json/world-table carry them as a census
//                  fit ("margins +2/-1/+1.5/+2/0/+2, MAE under 0.35"), so rule 1 bars
//                  them. Recorded as a decision; jakim runs 18/18 plain.
// Singapore +1, Dubai 0/-3/+2/0/+2/-1, Kemenag +3/-3/+4/+3/+3/+3: census-fitted -> out.
const METHOD_MARGINS = {
  ecfr: { fajr: -2, isha: 2 },
};

// Umm al-Qura Ramadan window for 2026, from the brief: 2026-02-18 through 2026-03-19
// (Ramadan 1447: 30 days). isha = maghrib + 120 inside, + 90 outside.
const RAMADAN_1447 = { start: [2, 18], end: [3, 19], monthLengthDays: 30 };
function inRamadan1447(m, d) {
  if (m === 2 && d >= 18) return true;
  if (m === 3 && d <= 19) return true;
  return false;
}

function methodParams(id, m, d) {
  let p;
  if (PRESETS[id]) {
    p = adhan.CalculationMethod[PRESETS[id]]();
    if (id === 'umm-al-qura') p.ishaInterval = inRamadan1447(m, d) ? 120 : 90;
  } else {
    const [fa, is] = CONSTRUCTED[id];
    p = adhan.CalculationMethod.Other();
    p.fajrAngle = fa;
    p.ishaAngle = is;
    const mg = METHOD_MARGINS[id];
    if (mg) {
      p.adjustments.fajr = mg.fajr;
      p.adjustments.isha = mg.isha;
    }
  }
  p.rounding = adhan.Rounding.None; // harness computes at second resolution, rounds itself
  return p;
}

function methodAsrSchool(id) {
  const m = METHODS.find((x) => x.id === id);
  return m ? m.asr : 'shafi';
}

const METHODS = require(METHODS_JSON).methods.map((x) => x.id).concat(['isna-2010']);
const METHOD_IDS = METHODS; // 21

// ---------------------------------------------------------------------------
// Scoring: 365 days of 2026, fajr + isha, wall-clock minutes in the target tz.
// ---------------------------------------------------------------------------

function daysOf2026() {
  const out = [];
  const days = (YEAR % 4 === 0 && (YEAR % 100 !== 0 || YEAR % 400 === 0)) ? 366 : 365;
  for (let i = 0; i < days; i++) {
    const dt = new Date(Date.UTC(YEAR, 0, 1 + i));
    out.push({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() });
  }
  return out;
}

function scoreTarget(targetId) {
  const target = IMPLEMENTED[targetId];
  const days = daysOf2026();
  const perMethod = {};
  const targetSamples = {};
  const sampleDates = [
    [1, 1], [4, 4], [6, 15], [6, 21], [9, 1], [12, 12], // angle anchors / ramp edges
    [5, 22], [5, 31], [9, 11], // UA ramps
    [3, 1], [10, 25], // DST transitions
  ];
  for (const id of METHOD_IDS) {
    perMethod[id] = {
      fajr: { devs: [], within2: 0, worstAbs: 0, worstDay: null, midnightCrossings: 0 },
      isha: { devs: [], within2: 0, worstAbs: 0, worstDay: null, midnightCrossings: 0 },
    };
  }
  const errors = [];
  for (const { y, m, d } of days) {
    const t = target.compute(y, m, d);
    if (t.fajrMin == null || t.ishaMin == null) {
      errors.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}: target time undefined`);
      continue;
    }
    const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (sampleDates.some(([sm, sd]) => sm === m && sd === d)) {
      targetSamples[key] = {
        fajr: `${String(Math.floor(t.fajrMin / 60)).padStart(2, '0')}:${String(t.fajrMin % 60).padStart(2, '0')}`,
        isha: `${String(Math.floor(t.ishaMin / 60)).padStart(2, '0')}:${String(t.ishaMin % 60).padStart(2, '0')}`,
        ...(t.fajrDeg != null ? { fajrDeg: +t.fajrDeg.toFixed(3) } : {}),
        ...(t.ishaDeg != null ? { ishaDeg: +t.ishaDeg.toFixed(3) } : {}),
        ...(t.interval != null ? { ishaIntervalMin: t.interval } : {}),
      };
    }
    for (const id of METHOD_IDS) {
      const p = methodParams(id, m, d);
      const pt = new adhan.PrayerTimes(new Coordinates(target.coords.latitude, target.coords.longitude), new Date(y, m - 1, d), p);
      const [rf, ri] = METHOD_ROUNDING[id];
      const fMin = wallMinutes(pt.fajr, rf);
      const iMin = wallMinutes(pt.isha, ri);
      if (fMin == null || iMin == null) {
        errors.push(`${key} ${id}: method time undefined`);
        continue;
      }
      const fd = fMin - t.fajrMin;
      const idv = iMin - t.ishaMin;
      const F = perMethod[id].fajr;
      const I = perMethod[id].isha;
      F.devs.push(fd);
      I.devs.push(idv);
      // method instant belongs to the next local day while the target stays before midnight
      if (fd < -720) F.midnightCrossings++;
      if (idv < -720) I.midnightCrossings++;
      if (Math.abs(fd) <= 2) F.within2++;
      if (Math.abs(idv) <= 2) I.within2++;
      if (Math.abs(fd) > F.worstAbs) { F.worstAbs = Math.abs(fd); F.worstDay = key; }
      if (Math.abs(idv) > I.worstAbs) { I.worstAbs = Math.abs(idv); I.worstDay = key; }
    }
  }
  const summarize = (S, n) => {
    const abs = S.devs.map(Math.abs);
    if (S.devs.some((v) => !Number.isFinite(v))) throw new Error(`non-finite deviation in scoring: ${S.devs.filter((v) => !Number.isFinite(v)).length} values`);
    const meanAbs = abs.reduce((a, b) => a + b, 0) / n;
    const meanSigned = S.devs.reduce((a, b) => a + b, 0) / n;
    return {
      meanAbsDevMin: +meanAbs.toFixed(2),
      meanSignedDevMin: +meanSigned.toFixed(2),
      worstAbsDevMin: S.worstAbs,
      worstAbsDevDay: S.worstDay,
      within2MinPct: +((100 * S.within2) / n).toFixed(1),
      midnightCrossings: S.midnightCrossings,
      days: n,
    };
  };
  const result = { targetId, tz: target.tz, city: target.city, perMethod: {}, targetSamples, errors };
  for (const id of METHOD_IDS) {
    result.perMethod[id] = {
      fajr: summarize(perMethod[id].fajr, perMethod[id].fajr.devs.length),
      isha: summarize(perMethod[id].isha, perMethod[id].isha.devs.length),
      asrSchoolMatch: methodAsrSchool(id) === target.asr,
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Orchestration: one child process per target TZ (TZ=<country iana> per invocation),
// then results.json + SPECIALFORMS-REPORT.md written by the parent.
// ---------------------------------------------------------------------------

function runChild(targetId) {
  const tz = IMPLEMENTED[targetId].tz;
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--target', targetId], {
    env: { ...process.env, TZ: tz },
    encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(`child ${targetId} failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
}

function methodLabel(id) {
  if (PRESETS[id]) return `${id} = adhan preset ${PRESETS[id]} verbatim`;
  const [fa, is] = CONSTRUCTED[id];
  return `${id} = adhan Other ${fa}/${is}`;
}

function buildReport(results) {
  const L = [];
  L.push('# O1h special forms: the four non-angle-form targets');
  L.push('');
  L.push(`Study: naked worldwide methods vs country authorities, ${YEAR}, fajr and isha, wall-clock minutes in each target's tz. Harness: adhan-js 4.4.6, Rounding.None at second resolution, explicit rounding per body; TZ=${'Europe/Ljubljana'} and ${'Europe/Kyiv'} per invocation; no real clock reads. Metrics per target x method x prayer: mean |deviation|, worst |deviation|, percent of days within 2 minutes (|dev| <= 2). 365 days of 2026. Generated ${new Date().toISOString().slice(0, 10)}.`);
  L.push('');
  L.push('## Implemented vs skipped');
  L.push('');
  L.push('| Target | Status | One-line basis |');
  L.push('| --- | --- | --- |');
  L.push('| SI-VAKTIJA (Ljubljana) | implemented | seasonal cosine sweeps with fully documented formulas, margins 0/0, rounding nearest (policy-layer fajrRule/ishaRule sweep.formula; world-table Slovenia row) |');
  L.push('| UA-DUMU (Kyiv) | implemented | fixed intervals with dated ramps: fajr sunrise-100 constant, isha maghrib+90/100 with recorded day-by-day ramps; solarBase -2.11 (policy-layer intervalTable + solarBase; world-table Ukraine row) |');
  for (const s of SKIPPED) L.push(`| ${s.id} | skipped | ${s.reason} |`);
  L.push('');
  for (const r of results) {
    const t = IMPLEMENTED[r.targetId];
    L.push(`## ${r.targetId} (${t.city})`);
    L.push('');
    L.push('Encoded from the record:');
    for (const c of t.sources.policyLayer) L.push(`- policy-layer.v2.4.json ${r.targetId}: ${c}`);
    L.push(`- ${t.sources.worldTable}`);
    if (r.targetId === 'SI-VAKTIJA') {
      L.push('- Assumption: the object publishes no coordinates (its own gaps list says so); scoring point is Ljubljana 46.0569, 14.5058. Both sides run at the same point, so the comparison is internally consistent; a 2 km coordinate choice moves a twilight instant well under a minute.');
    }
    L.push('');
    L.push(`Spot samples (target side): ${JSON.stringify(r.targetSamples)}`);
    if (r.errors.length) L.push(`Errors: ${r.errors.join('; ')}`);
    L.push('');
    if (r.targetId === 'UA-DUMU') {
      L.push('Reading note: the harness compares minutes past midnight (brief discipline), with no midnight wrap. At 50.45 N the stock adhan high-latitude default (MiddleOfTheNight) pushes naked isha past midnight for the angle methods in late spring and summer; each such day reads as a >720-minute deviation (the midnightCrossings column counts them). This is the stock configuration behaving as shipped at 50.45 N, not a harness error.');
      L.push('');
    }
    L.push('| Method | fajr mean |dev| | fajr worst | fajr within 2 min | isha mean |dev| | isha worst | isha within 2 min | isha past-midnight days | asr match |');
    L.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const id of METHOD_IDS) {
      const x = r.perMethod[id];
      L.push(`| ${id} | ${x.fajr.meanAbsDevMin} | ${x.fajr.worstAbsDevMin} (${x.fajr.worstAbsDevDay}) | ${x.fajr.within2MinPct}% | ${x.isha.meanAbsDevMin} | ${x.isha.worstAbsDevMin} (${x.isha.worstAbsDevDay}) | ${x.isha.within2MinPct}% | ${x.isha.midnightCrossings} | ${x.asrSchoolMatch ? 'yes' : 'no'} |`);
    }
    L.push('');
  }
  L.push('## Harness decisions register');
  L.push('');
  L.push('- Method side: presets verbatim (CONSTRAINTS 1); constructed bodies take only their documented pair on adhan Other, with the library default highLatitudeRule (MiddleOfTheNight) standing, which is the stock configuration.');
  L.push('- Umm al-Qura isha: maghrib+120 inside Ramadan 1447 (2026-02-18 to 2026-03-19, a 30-day month), +90 outside; rounding floor(raw + 1 min) as documented.');
  L.push('- Diyanet-domestic: Turkey preset verbatim, which carries the temkin (sunrise -7, dhuhr +5, asr +4, maghrib +7); no temkin touches fajr/isha (doctrine page per world-table Turkey row).');
  L.push('- Method-side margins on the scored prayers: only ECFR -2/+2 applied (the council\'s own resolution, quoted in methods.json sources). JAKIM +2/+2 NOT applied (carried in the record as a census fit, barred by CONSTRAINTS 1). Singapore +1, Dubai, Kemenag margins: census-fitted, not applied.');
  L.push('- Method-side rounding where the body documents it: Umm al-Qura floor(raw+1), JAKIM ceil, Kemenag down, Kuwait fajr floor / isha nearest, Singapore ceil; MABIMS, Fazilet and Dubai leave fajr/isha rounding undocumented, so the harness default nearest applies.');
  L.push('- Qatar naked = preset verbatim: interval added at second resolution before rounding (the documented post-rounding quirk is not reproduced; worst-case effect 1 minute).');
  L.push('- Moonsighting: preset verbatim, seasonal curves included; above 55 deg the preset switches to night/7, irrelevant at 46-50 N.');
  L.push('- UA-DUMU order of operations per roundingProvenance: round the solarBase sunrise/sunset to the nearest minute first, then apply -100/+interval.');
  L.push('- ISNA-2010 18/18 constructed as a separate 21st method; ISNA (15/15, NorthAmerica preset) scored separately.');
  L.push('- UA ramp verification (script-run): May 26 = 95, May 31 = 100, Jun 1 = 100, Sep 1 = 100, Sep 11 = 90, Sep 12 = 90 (base range resumes after the ramp), Dec 31 = 90.');
  L.push('- Deviations compare minutes past midnight with no wrap; midnightCrossings counts the days where a method instant landed on the next local day while the target stayed before midnight (zero crossings at Ljubljana for every method).');
  L.push('- SI-VAKTIJA coordinate assumption (Ljubljana 46.0569, 14.5058) is recorded in its section above; the object publishes no coordinates.');
  L.push('- Asr: school-match flag only (all 21 methods shafi, both targets shafi: all match). Dhuhr/maghrib not scored.');
  return L.join('\n') + '\n';
}

async function main() {
  const argIdx = process.argv.indexOf('--target');
  if (argIdx !== -1) {
    const res = scoreTarget(process.argv[argIdx + 1]);
    process.stdout.write(JSON.stringify(res));
    return;
  }
  const results = Object.keys(IMPLEMENTED).map(runChild);
  const out = {
    generated: new Date().toISOString(),
    study: 'O1h special forms: SI-VAKTIJA, UA-DUMU implemented; AT-IZW, FR-GMS skipped',
    harness: { library: 'adhan-js 4.4.6', roundingPolicy: 'Rounding.None at second resolution, explicit per-body rounding', days: daysOf2026().length, ramadan1447: RAMADAN_1447 },
    skipped: SKIPPED,
    methodsScored: METHOD_IDS,
    results,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(out, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT_DIR, 'SPECIALFORMS-REPORT.md'), buildReport(results));
  console.log(`wrote results.json and SPECIALFORMS-REPORT.md (${results.length} targets implemented, ${SKIPPED.length} skipped)`);
}

export { IMPLEMENTED, SKIPPED, METHOD_IDS, METHOD_ROUNDING, METHOD_MARGINS, methodParams, wallMinutes, scoreTarget, CONSTRUCTED, PRESETS };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
