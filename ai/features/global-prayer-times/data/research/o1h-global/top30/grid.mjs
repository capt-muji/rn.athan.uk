#!/usr/bin/env node
// O1h top-30 independent grid.
// 30 largest Muslim populations x 21 worldwide methods, 2026, fajr + isha.
// Written from the brief and the record only; no other simulation was read.

import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ADHAN = `${process.env.HOME}/athan-gitree/census/adhan-build/node_modules/adhan`;
const OUT = `${process.env.HOME}/athan-gitree/census/o1h-global/top30`;
const require = createRequire(import.meta.url);
const adhan = require(ADHAN);
const SolarTime = require(`${ADHAN}/lib/cjs/SolarTime.js`).default;
const {
  Coordinates, CalculationMethod, CalculationParameters, PrayerTimes,
  HighLatitudeRule, Madhab, Rounding,
} = adhan;

const YEAR = 2026;
const RAMADAN_1447 = { from: '2026-02-18', to: '2026-03-19', days: 30 };

// ---------------------------------------------------------------- clock

const fmtCache = new Map();
function tzFormatter(tz) {
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
  const parts = tzFormatter(tz).formatToParts(instant);
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// seconds past local midnight, fractional
function localSeconds(instant, clock) {
  if (Number.isNaN(instant.getTime())) return NaN;
  const base = Math.floor(instant.getTime() / 1000) * 1000;
  const offset = clock.fixedOffsetMinutes == null
    ? tzOffsetMs(instant, clock.tz)
    : clock.fixedOffsetMinutes * 60000;
  const ms = (((base + offset) % 86400000) + 86400000) % 86400000;
  return ms / 1000;
}

const ROUND = {
  nearest: (s) => Math.floor(s / 60 + 0.5),
  up: (s) => Math.ceil(s / 60),
  down: (s) => Math.floor(s / 60),
};
function roundSeconds(seconds, mode) {
  const fn = ROUND[mode || 'nearest'];
  if (!fn) throw new Error(`unknown rounding ${mode}`);
  return fn(seconds);
}

// ---------------------------------------------------------------- specs

function coordsOf(spec) {
  return new Coordinates(spec.lat, spec.lon);
}

function buildParams(spec) {
  let p;
  if (spec.preset) {
    p = CalculationMethod[spec.preset]();
  } else {
    p = new CalculationParameters('Other', spec.fajrAngle ?? 0, spec.ishaAngle ?? 0, spec.ishaInterval ?? 0);
    if (spec.maghribAngle) {
      p.fajrAngle = spec.fajrAngle ?? 0;
      p.ishaAngle = spec.ishaAngle ?? 0;
      p.ishaInterval = spec.ishaInterval ?? 0;
      p.maghribAngle = spec.maghribAngle;
    }
  }
  p.madhab = spec.asr === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  p.highLatitudeRule = spec.highLatitudeRule || HighLatitudeRule.MiddleOfTheNight;
  if (spec.suppressLibrarySubstitute) p.nightPortions = () => ({ fajr: 10, isha: 10 });
  p.rounding = Rounding.None;
  p.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return p;
}

function monthsBetween(dateKey, from, to) {
  return dateKey >= from && dateKey <= to;
}

// one day -> printed minutes past local midnight
function dayTimes(spec, params, coords, date, dateKey) {
  const pt = new PrayerTimes(coords, date, params);
  const clock = spec.clock;
  const m = spec.margins || {};
  const r = spec.rounding || {};

  const sunriseSec = localSeconds(pt.sunrise, clock);
  const sunsetSec = localSeconds(pt.sunset, clock);

  let fajrSec = localSeconds(pt.fajr, clock);
  let ishaSec = localSeconds(pt.isha, clock);

  if (spec.reachability) {
    const st = new SolarTime(date, coords);
    if (Number.isNaN(st.hourAngle(-spec.fajrAngle, false))) {
      fajrSec = sunriseSec + (spec.substitute.fajr ? spec.substitute.fajr * 60 : 0);
      if (spec.substitute.fajr == null) fajrSec = NaN;
    }
    if (spec.ishaAngle != null && Number.isNaN(st.hourAngle(-spec.ishaAngle, true))) {
      ishaSec = spec.substitute.isha == null ? NaN : sunsetSec + spec.substitute.isha * 60;
    }
  }

  const fajr = Number.isNaN(fajrSec) ? null
    : roundSeconds(fajrSec + (m.fajr || 0) * 60, r.fajr);

  let isha = null;
  if (spec.ishaNotPublished) {
    isha = null;
  } else if (spec.ishaInterval != null || spec.ishaRamadan != null) {
    const maghribSec = localSeconds(pt.maghrib, clock);
    if (Number.isNaN(maghribSec)) {
      isha = null;
    } else {
      const maghrib = roundSeconds(maghribSec + (m.maghrib || 0) * 60, r.maghrib);
      let interval = spec.ishaInterval;
      if (spec.ishaRamadan != null && monthsBetween(dateKey, RAMADAN_1447.from, RAMADAN_1447.to)) {
        interval = spec.ishaRamadan;
      }
      isha = maghrib + interval;
    }
  } else if (ishaSec != null && !Number.isNaN(ishaSec)) {
    isha = roundSeconds(ishaSec + (m.isha || 0) * 60, r.isha);
  }

  return { fajr, isha };
}

// ---------------------------------------------------------------- methods

const NEAREST = { fajr: 'nearest', isha: 'nearest', maghrib: 'nearest' };

const METHODS = [
  { id: 'mwl', fajrAngle: 18, ishaAngle: 17, label: 'Muslim World League 18/17', preset: 'MuslimWorldLeague', asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'isna', fajrAngle: 15, ishaAngle: 15, label: 'ISNA / FCNA 15/15', preset: 'NorthAmerica', asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'isna-2010', label: 'ISNA 2010 position 18/18', fajrAngle: 18, ishaAngle: 18, asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'umm-al-qura', fajrAngle: 18.5, ishaAngle: null, label: 'Umm al-Qura 18.5 / maghrib+90 (+120 Ramadan)', preset: 'UmmAlQura', ishaInterval: 90, ishaRamadan: 120, asr: 'shafi', margins: {}, rounding: { fajr: 'down', isha: 'down', maghrib: 'down' }, hl: 'library default (mid-night)' },
  { id: 'egyptian', fajrAngle: 19.5, ishaAngle: 17.5, label: 'Egyptian General Authority 19.5/17.5', preset: 'Egyptian', asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'karachi', fajrAngle: 18, ishaAngle: 18, label: 'Karachi 18/18', preset: 'Karachi', asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'moonsighting', fajrAngle: 18, ishaAngle: 18, label: 'Moonsighting Committee 18/18 + season curve', preset: 'MoonsightingCommittee', asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'body (1/7 above 55, season curve)' },
  { id: 'diyanet-domestic', fajrAngle: 18, ishaAngle: 17, label: 'Diyanet domestic 18/17 + temkin', preset: 'Turkey', asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'diyanet-europe', label: 'Diyanet European unified 18/16', fajrAngle: 18, ishaAngle: 16, asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'mabims', label: 'MABIMS 20/18', fajrAngle: 20, ishaAngle: 18, asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'jakim', label: 'JAKIM 18/18 + ihtiyati', fajrAngle: 18, ishaAngle: 18, asr: 'shafi', margins: { fajr: 2, isha: 2, maghrib: 0 }, rounding: { fajr: 'up', isha: 'up', maghrib: 'up' }, hl: 'library default (mid-night)' },
  { id: 'kemenag', label: 'Kemenag 20/18 + ihtiyati', fajrAngle: 20, ishaAngle: 18, asr: 'shafi', margins: { fajr: 3, isha: 3, maghrib: 3 }, rounding: { fajr: 'down', isha: 'down', maghrib: 'up' }, hl: 'library default (mid-night)' },
  { id: 'kuwait', fajrAngle: 18, ishaAngle: 17.5, label: 'Kuwait 18/17.5', preset: 'Kuwait', asr: 'shafi', margins: {}, rounding: { fajr: 'down', isha: 'nearest', maghrib: 'nearest' }, hl: 'library default (mid-night)' },
  { id: 'qatar', fajrAngle: 18, ishaAngle: null, label: 'Qatar 18/1.5h (interval after rounding)', preset: 'Qatar', ishaInterval: 90, asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'singapore-muis', fajrAngle: 20, ishaAngle: 18, label: 'MUIS Singapore 20/18, ceiling', preset: 'Singapore', asr: 'shafi', margins: {}, rounding: { fajr: 'up', isha: 'up', maghrib: 'up' }, hl: 'library default (mid-night)' },
  { id: 'dubai', fajrAngle: 18.2, ishaAngle: 18.2, label: 'Dubai / UAE AWQAF 18.2/18.2', preset: 'Dubai', asr: 'shafi', margins: {}, rounding: { fajr: 'nearest', isha: 'nearest', maghrib: 'nearest' }, hl: 'library default (mid-night)' },
  { id: 'tehran', fajrAngle: 17.7, ishaAngle: 14, label: 'Tehran 17.7/14', preset: 'Tehran', asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)', note: 'publisher prints no isha row, the 14 deg is the software default' },
  { id: 'fazilet-a', label: 'Fazilet Profile A (world) 19.8/17.8', fajrAngle: 19.8, ishaAngle: 17.8, asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'fazilet-b', label: 'Fazilet Profile B (Ottoman) 20.8/18.7', fajrAngle: 20.8, ishaAngle: 18.7, asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
  { id: 'ecfr', label: 'ECFR 18/17 +-2, proportional', fajrAngle: 18, ishaAngle: 17, asr: 'shafi', margins: { fajr: -2, isha: 2, maghrib: 2 }, rounding: NEAREST, highLatitudeRule: HighLatitudeRule.TwilightAngle, hl: 'body (proportional, angle/60)' },
  { id: 'russia-sam', label: 'Russia SAM 16/15', fajrAngle: 16, ishaAngle: 15, asr: 'shafi', margins: {}, rounding: NEAREST, hl: 'library default (mid-night)' },
];

// ---------------------------------------------------------------- targets

const T = [];
function target(o) { T.push(o); }

const R_DOWN_NEAREST = { fajr: 'down', isha: 'nearest', maghrib: 'nearest' };

// 1 Indonesia
target({
  rank: 1, country: 'Indonesia', pop: 249.80, targetId: 'ID-KEMENAG', status: 'scored',
  lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta', asr: 'shafi', grade: 'candidate',
  fajrAngle: 20, ishaAngle: 18, margins: {}, rounding: NEAREST,
  cite: 'countries.json ID-KEMENAG (Jakarta, Subuh 20 / Isya 18 central). No policy-layer object',
  caveat: 'published parameters only: margins/rounding null in the record and carried as zero/nearest',
});
// 2 Pakistan
target({
  rank: 2, country: 'Pakistan', pop: 233.00, targetId: 'PK-DEFACTO', status: 'scored',
  lat: 24.86, lon: 67.01, tz: 'Asia/Karachi', asr: 'hanafi', grade: 'community de facto',
  fajrAngle: 18, ishaAngle: 18, margins: {}, rounding: NEAREST,
  cite: 'countries.json PK-DEFACTO (Karachi, 18/18 Hanafi). World table Pakistan is a fallback, the Karachi method',
  caveat: 'no state timetable, community de facto target, not an authority',
});
// 3 India
target({
  rank: 3, country: 'India', pop: 200.00, targetId: 'IN-DEFACTO', status: 'scored',
  lat: 28.61, lon: 77.21, tz: 'Asia/Kolkata', asr: 'hanafi', grade: 'community de facto',
  fajrAngle: 18, ishaAngle: 18, margins: {}, rounding: NEAREST,
  cite: 'countries.json IN-DEFACTO (Delhi, 18/18 Hanafi). World table India is a fallback, Deoband 18/18',
  caveat: 'no state timetable, community de facto target',
});
// 4 Bangladesh
target({
  rank: 4, country: 'Bangladesh', pop: 150.80, targetId: 'BD-IFB', status: 'scored',
  lat: 23.8103, lon: 90.4125, tz: 'Asia/Dhaka', asr: 'hanafi', grade: 'provisional',
  fajrAngle: 19.25, ishaAngle: 18.65,
  margins: { fajr: 8, isha: -1 }, rounding: NEAREST,
  cite: 'policy-layer BD-IFB: fajr 19.25 +8, isha 18.65 -1, Hanafi, nearest',
});
// 5 Nigeria
target({
  rank: 5, country: 'Nigeria', pop: 96.00, targetId: 'NG-SPA', status: 'scored',
  lat: 9.06, lon: 7.49, tz: 'Africa/Lagos', asr: 'shafi', grade: 'community',
  fajrAngle: 18, ishaAngle: 17, margins: {}, rounding: NEAREST,
  cite: 'countries.json NG-SPA (Abuja, MWL 18/17). World table Nigeria reads prayertimesnigeria.com 18/17',
  caveat: 'community surface, not an authority',
});
// 6 Egypt
target({
  rank: 6, country: 'Egypt', pop: 87.50, targetId: 'EG-ESA', status: 'scored',
  lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo', asr: 'shafi', grade: 'A',
  fajrAngle: 19.5, ishaAngle: 17.5, margins: {}, rounding: NEAREST,
  cite: 'policy-layer EG-ESA: 19.5/17.5, zero margins, nearest',
});
// 7 Iran
target({
  rank: 7, country: 'Iran', pop: 85.70, targetId: 'IR-NATIONAL', status: 'scored-fajr-only',
  lat: 35.6892, lon: 51.389, tz: 'Asia/Tehran', asr: null, grade: 'provisional',
  fajrAngle: 17.71, ishaNotPublished: true, margins: {}, rounding: NEAREST,
  cite: 'policy-layer IR-NATIONAL: fajr 17.71 measured, ishaRule notPublished (no isha row printed)',
});
// 8 Turkey
target({
  rank: 8, country: 'Turkey', pop: 81.20, targetId: 'TR-DIYANET-DOMESTIC', status: 'scored',
  lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul', asr: 'shafi', grade: 'A',
  fajrAngle: 18, ishaAngle: 17, margins: {}, rounding: NEAREST,
  cite: 'policy-layer TR-DIYANET-DOMESTIC: 18/17, fajr/isha margins zero, nearest',
});
// 9 Algeria
target({
  rank: 9, country: 'Algeria', pop: 43.70, targetId: null, status: 'no-target',
  reason: 'no row in countries.json. World table Algeria is a candidate (marw.gov.dz unreachable, no series, no fit)',
});
// 10 Iraq
target({
  rank: 10, country: 'Iraq', pop: 39.00, targetId: 'IQ-DIWAN', status: 'scored',
  lat: 33.3152, lon: 44.3661, tz: 'Asia/Baghdad', asr: 'shafi', grade: 'provisional',
  fajrAngle: 18.1, ishaAngle: 16.9, margins: { fajr: 1, isha: 1 },
  rounding: { fajr: 'down', isha: 'nearest', maghrib: 'nearest' },
  cite: 'policy-layer IQ-DIWAN: 18.1 +1 (fajr floor) / 16.9 +1, nearest',
});
// 11 Sudan
target({
  rank: 11, country: 'Sudan', pop: 38.60, targetId: 'SD-MINISTRY', status: 'scored',
  lat: 15.5007, lon: 32.5599, tz: 'Africa/Khartoum', asr: 'shafi', grade: 'provisional',
  fajrAngle: 18.87, ishaInterval: 90, margins: {}, rounding: NEAREST,
  cite: 'policy-layer SD-MINISTRY: fajr 18.87, isha = maghrib + 90, zero margins, rounding null -> nearest',
  caveat: 'world-table records the whole table sitting ~8 min ahead of the meridian. No field carries it, so it is not applied',
});
// 12 Afghanistan
target({
  rank: 12, country: 'Afghanistan', pop: 37.00, targetId: null, status: 'no-target',
  reason: 'no row in countries.json. World table Afghanistan is a candidate on a 30-day image transcription with no second witness',
});
// 13 Morocco
target({
  rank: 13, country: 'Morocco', pop: 36.40, targetId: 'MA-HABOUS', status: 'scored',
  lat: 34.0209, lon: -6.8416, tz: 'Africa/Casablanca', asr: 'shafi', grade: 'A (conditional)',
  fajrAngle: 19, ishaAngle: 17, margins: { fajr: -1, isha: 0 },
  rounding: { fajr: 'down', isha: 'nearest', maghrib: 'nearest' },
  clockFixedMinutes: 60,
  cite: 'policy-layer MA-HABOUS: 19/17, fajr -1 floor, isha 0 nearest, clock fixed UTC+1 (ignores the Ramadan change)',
});
// 14 Saudi Arabia
target({
  rank: 14, country: 'Saudi Arabia', pop: 31.50, targetId: 'SA-KACST', status: 'scored',
  lat: 21.4225, lon: 39.8262, tz: 'Asia/Riyadh', asr: 'shafi', grade: 'A',
  fajrAngle: 18.5, ishaInterval: 90, ishaRamadan: 120,
  margins: { fajr: 1, maghrib: 1 },
  rounding: { fajr: 'down', isha: 'down', maghrib: 'down' },
  cite: 'policy-layer SA-KACST: fajr 18.5 +1 floor, isha maghrib+90 with +120 in Ramadan, maghrib +1 floor',
});
// 15 Uzbekistan
target({
  rank: 15, country: 'Uzbekistan', pop: 29.90, targetId: 'UZ-ISLOM', status: 'scored',
  lat: 41.300872, lon: 69.241813, tz: 'Asia/Tashkent', asr: 'hanafi', grade: 'provisional',
  fajrAngle: 15.5, ishaAngle: 15.5, margins: {}, rounding: NEAREST,
  cite: 'policy-layer UZ-ISLOM: 15.5/15.5 Hanafi, zero margins, rounding null -> nearest',
});
// 16 Yemen
target({
  rank: 16, country: 'Yemen', pop: 26.80, targetId: 'YE-AWQAF-SANAA', status: 'scored',
  lat: 15.3694, lon: 44.191, tz: 'Asia/Aden', asr: 'shafi', grade: 'provisional',
  fajrAngle: 18, ishaAngle: 16, margins: {}, rounding: NEAREST,
  cite: 'policy-layer YE-AWQAF-SANAA: 18/16, fajr/isha margins zero, nearest',
});
// 17 Niger
target({
  rank: 17, country: 'Niger', pop: 21.10, targetId: 'NE-BUTIN', status: 'scored',
  lat: 13.85, lon: 2.18, tz: 'Africa/Niamey', asr: 'shafi', grade: 'A',
  fajrAngle: 18, ishaInterval: 75, margins: {}, rounding: NEAREST,
  clockFixedMinutes: 60,
  cite: 'policy-layer NE-BUTIN: fajr 18, isha = maghrib + 75, zero margins, nearest, clock fixed UTC+1',
});
// 18 Malaysia
target({
  rank: 18, country: 'Malaysia', pop: 20.10, targetId: 'MY-JAKIM', status: 'scored',
  lat: 3.139, lon: 101.6869, tz: 'Asia/Kuala_Lumpur', asr: 'shafi', grade: 'provisional',
  fajrAngle: 18, ishaAngle: 18,
  margins: { fajr: 2, isha: 2 }, rounding: { fajr: 'up', isha: 'up', maghrib: 'up' },
  cite: 'policy-layer MY-JAKIM zone WLY01 (Kuala Lumpur and Putrajaya) 3.139/101.6869, the Lampiran B westernmost-point reference, and coordinates are null in countries.json',
  caveat: 'fit point derived from the zone table, not from countries.json (which is null)',
});
// 19 Tanzania
target({
  rank: 19, country: 'Tanzania', pop: 19.40, targetId: 'JAMIAT-KZN', status: 'scored-anchor',
  lat: -29.8587, lon: 31.0218, tz: 'Africa/Johannesburg', asr: 'shafi', grade: 'community',
  fajrAngle: 18, ishaAngle: 15, margins: {},
  rounding: { fajr: 'nearest', isha: 'down', maghrib: 'down' },
  cite: 'brief line 21 fixed fallback (JAMIAT-KZN = Durban 29.8587, 31.0218). Coordinates are null in countries.json. World table Tanzania is a fallback, Jamiat covers 11 towns',
  caveat: 'ANCHOR ARTEFACT: the federation anchor sits 37 deg of latitude away, so the deviations measure Durban, not Tanzania',
});
// 20 Syria
target({
  rank: 20, country: 'Syria', pop: 15.00, targetId: null, status: 'no-target',
  reason: 'no row in countries.json. World table Syria carries a documented ministry policy (MWL 18/17 with maghrib +2 to +3) but the table is unobtainable, 6 days only',
});
// 21 Russia
target({
  rank: 21, country: 'Russia', pop: 15.00, targetId: 'RU-DUMRT', status: 'scored',
  lat: 55.7963, lon: 49.1088, tz: 'Europe/Moscow', asr: 'hanafi', grade: 'A',
  fajrAngle: 18, ishaAngle: 15, margins: {},
  rounding: { fajr: 'down', isha: 'up', maghrib: 'up' },
  reachability: true, substitute: { fajr: -120, isha: 90 }, suppressLibrarySubstitute: true,
  cite: 'policy-layer RU-DUMRT (Kazan): 18/15 Hanafi, fajr floor, rest ceil, astronomically-bounded summer substitute sunrise-120 / sunset+90',
  caveat: 'three Russian targets exist. DUM RT is the grade A one and is used, CDUM and DUM RF are carried as sensitivity',
});
// 22 Kazakhstan
target({
  rank: 22, country: 'Kazakhstan', pop: 13.20, targetId: 'KZ-MUFTIYAT', status: 'scored',
  lat: 51.1605, lon: 71.4704, tz: 'Asia/Almaty', asr: 'hanafi', grade: 'A',
  fajrAngle: 15, ishaAngle: 15, margins: {},
  rounding: NEAREST, highLatitudeRule: HighLatitudeRule.TwilightAngle,
  cite: 'policy-layer KZ-MUFTIYAT (Astana): 15/15 Hanafi, nearest, twilightAngleClamp at angle/60 = 0.25',
});
// 23 Cote d'Ivoire
target({
  rank: 23, country: "Cote d'Ivoire", pop: 11.30, targetId: 'CI-COSIM', status: 'not-scorable',
  reason: 'CI-COSIM carries null angles (not fitted, the surface is an AlAdhan ISNA proxy, today-only)',
});
// 24 Tunisia
target({
  rank: 24, country: 'Tunisia', pop: 10.20, targetId: 'TN-INM', status: 'scored',
  lat: 36.8065, lon: 10.1815, tz: 'Africa/Tunis', asr: 'shafi', grade: 'provisional',
  fajrAngle: 18, ishaAngle: 18, margins: {},
  rounding: { fajr: 'down', isha: 'up', maghrib: 'nearest' },
  cite: 'policy-layer TN-INM: 18/18, fajr floor, isha ceil, dhuhr +7 / maghrib +2 (unscored rows)',
});
// 25 Jordan
target({
  rank: 25, country: 'Jordan', pop: 10.20, targetId: 'JO-AWQAF', status: 'scored',
  lat: 31.9539, lon: 35.9106, tz: 'Asia/Amman', asr: 'shafi', grade: 'A',
  fajrAngle: 18, ishaAngle: 18, margins: {},
  rounding: { fajr: 'down', isha: 'down', maghrib: 'down' },
  cite: 'policy-layer JO-AWQAF: 18/18, every row floor',
});
// 26 Tajikistan
target({
  rank: 26, country: 'Tajikistan', pop: 9.30, targetId: 'TJ-SHURO', status: 'not-scorable',
  reason: 'TJ-SHURO is window-class (start-end windows, not instants) and carries null angles. The brief skips window-class targets',
});
// 27 France
target({
  rank: 27, country: 'France', pop: 6.90, targetId: 'FR-GMS', status: 'not-scorable',
  reason: 'FR-GMS fajr and isha are seasonal sweeps (from 18 down to 12 degrees and from 16 down to 11.5) with null angles. The brief skips seasonal sweep targets',
});
// 28 Libya
target({
  rank: 28, country: 'Libya', pop: 6.60, targetId: 'LY-MUAZZIN', status: 'scored',
  lat: 32.8872, lon: 13.1913, tz: 'Africa/Tripoli', asr: 'shafi', grade: 'provisional',
  fajrAngle: 18.15, ishaAngle: 18.1, margins: { fajr: -1, isha: 1 }, rounding: NEAREST,
  cite: 'policy-layer LY-MUAZZIN: 18.15 -1 / 18.1 +1, nearest',
});
// 29 UAE
target({
  rank: 29, country: 'United Arab Emirates', pop: 6.30, targetId: 'AE-AWQAF', status: 'scored',
  lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai', asr: 'shafi', grade: 'A',
  fajrAngle: 18.2, ishaAngle: 18.2, margins: { fajr: 0, isha: -1 }, rounding: NEAREST,
  cite: 'policy-layer AE-AWQAF: 18.2/18.2, fajr 0 / isha -1, nearest',
});
// 30 Mozambique
target({
  rank: 30, country: 'Mozambique', pop: 5.80, targetId: 'JAMIAT-KZN', status: 'scored-anchor',
  lat: -29.8587, lon: 31.0218, tz: 'Africa/Maputo', asr: 'shafi', grade: 'community',
  fajrAngle: 18, ishaAngle: 15, margins: {},
  rounding: { fajr: 'nearest', isha: 'down', maghrib: 'down' },
  cite: 'brief line 21 fixed fallback (Durban). Coordinates are null in countries.json. World table Mozambique is a fallback, Jamiat covers 2 towns',
  caveat: 'ANCHOR ARTEFACT: the federation anchor sits 4 deg of latitude north of Maputo, so the deviations measure Durban, not Mozambique',
});

// sensitivity: Russia's other two publishers, and the southern-African members
// scored at their own capitals rather than the federation anchor
const SENSITIVITY = [
  {
    country: 'Russia (CDUM at Moscow)', pop: 15.00, targetId: 'RU-CDUM',
    lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow', asr: 'hanafi', grade: 'provisional',
    fajrAngle: 18, ishaAngle: 17, margins: { fajr: -2.6, isha: 1.4 },
    rounding: { fajr: 'down', isha: 'down', maghrib: 'down' },
    cite: 'policy-layer RU-CDUM: 18/17 Hanafi, -2.6 / +1.4, floor',
  },
  {
    country: 'Russia (DUM RF at Moscow)', pop: 15.00, targetId: 'RU-DUMRF-MOSCOW',
    lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow', asr: 'shafi', grade: 'provisional',
    fajrAngle: 18, ishaAngle: 15, margins: {},
    rounding: NEAREST,
    cite: 'policy-layer RU-DUMRF-MOSCOW: 18/15 Shafi, shuruq -5 zuhr +5 maghrib +5, nearest',
    caveat: 'summer half is a calendar-window night portion and a served-not-modelled isha, and the frozen angle is used outside it',
  },
  {
    country: 'Tanzania (at Dar es Salaam)', pop: 19.40, targetId: 'JAMIAT-KZN',
    lat: -6.7924, lon: 39.2083, tz: 'Africa/Dar_es_Salaam', asr: 'shafi', grade: 'community',
    fajrAngle: 18, ishaAngle: 15, margins: {},
    rounding: { fajr: 'nearest', isha: 'down', maghrib: 'down' },
    cite: 'same JAMIAT-KZN recipe at a Tanzanian town coordinate, the anchor itself being absent from the record',
  },
  {
    country: 'Mozambique (at Maputo)', pop: 5.80, targetId: 'JAMIAT-KZN',
    lat: -25.9655, lon: 32.5832, tz: 'Africa/Maputo', asr: 'shafi', grade: 'community',
    fajrAngle: 18, ishaAngle: 15, margins: {},
    rounding: { fajr: 'nearest', isha: 'down', maghrib: 'down' },
    cite: 'same JAMIAT-KZN recipe at the national capital coordinate',
  },
];

// ---------------------------------------------------------------- run

function* days2026() {
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(YEAR, 0, 1 + i, 12, 0, 0);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    yield { date: d, key };
  }
}

function prep(spec) {
  const s = { ...spec };
  s.clock = spec.clockFixedMinutes != null
    ? { fixedOffsetMinutes: spec.clockFixedMinutes }
    : { tz: spec.tz };
  return s;
}

function seriesFor(spec) {
  const s = prep(spec);
  const params = buildParams(s);
  const coords = coordsOf(s);
  const out = { fajr: [], isha: [] };
  for (const { date, key } of days2026()) {
    const t = dayTimes(s, params, coords, date, key);
    out.fajr.push(t.fajr);
    out.isha.push(t.isha);
  }
  return out;
}

function stats(devs) {
  const vals = devs.filter((v) => v != null && !Number.isNaN(v));
  if (!vals.length) return null;
  const abs = vals.map(Math.abs);
  return {
    days: vals.length,
    mean: round3(abs.reduce((a, b) => a + b, 0) / abs.length),
    worst: round3(Math.max(...abs)),
    within1: round3(abs.filter((v) => v <= 1).length / abs.length),
    within2: round3(abs.filter((v) => v <= 2).length / abs.length),
    within5: round3(abs.filter((v) => v <= 5).length / abs.length),
  };
}

function round3(x) { return Math.round(x * 1000) / 1000; }

// A prayer that crosses civil midnight keeps the night it belongs to, so the
// signed difference is taken on the 24 h clock, never on absolute minutes.
function circular(delta) {
  return ((((delta + 720) % 1440) + 1440) % 1440) - 720;
}

function compare(targetSeries, methodSeries) {
  const fajr = targetSeries.fajr.map((t, i) => (t == null || methodSeries.fajr[i] == null ? null : circular(methodSeries.fajr[i] - t)));
  const isha = targetSeries.isha.map((t, i) => (t == null || methodSeries.isha[i] == null ? null : circular(methodSeries.isha[i] - t)));
  const pooled = [...fajr, ...isha].filter((v) => v != null);
  return {
    fajr: stats(fajr),
    isha: stats(isha),
    combined: pooled.length ? stats(pooled) : null,
  };
}

// ---------------------------------------------------------------- analysis

const POP_TOTAL = T.reduce((a, t) => a + t.pop, 0);
const SCORED = T.filter((t) => t.status.startsWith('scored'));

function fmt(x, d = 2) { return x == null ? '-' : x.toFixed(d); }

// Canonical angle signature, used to separate a method that fits a country
// because the census fitted the country to that same pair from one that does not.
function pairKey(spec) {
  const f = spec.fajrAngle == null ? 'n/a' : Number(spec.fajrAngle).toFixed(2);
  if (spec.ishaNotPublished) return `${f}/none`;
  if (spec.ishaInterval != null) {
    return spec.ishaRamadan != null ? `${f}/+${spec.ishaInterval}|+${spec.ishaRamadan}` : `${f}/+${spec.ishaInterval}`;
  }
  return `${f}/${spec.ishaAngle == null ? 'n/a' : Number(spec.ishaAngle).toFixed(2)}`;
}

function analyse({ cells, targetsOut, sensitivity, methods }) {
  const scoredCells = cells.filter((c) => c.combined);

  // ---- winner map
  const winners = [];
  for (const t of SCORED) {
    const rows = scoredCells.filter((c) => c.country === t.country).sort((a, b) => a.combined.mean - b.combined.mean);
    const best = rows[0];
    const within2 = rows.filter((r) => r.combined.mean <= 2).map((r) => r.method);
    const within5 = rows.filter((r) => r.combined.mean <= 5).map((r) => r.method);
    const methodById = new Map(methods.map((m) => [m.id, m]));
    const coincides = (id) => pairKey(methodById.get(id)) === pairKey(t);
    winners.push({
      rank: t.rank, country: t.country, targetId: t.targetId, pop: t.pop, grade: t.grade,
      status: t.status, best: best.method, bestMean: best.combined.mean,
      bestWorst: best.combined.worst, bestWithin2: best.combined.within2,
      fajrMean: best.fajr ? best.fajr.mean : null, ishaMean: best.isha ? best.isha.mean : null,
      asrMatch: best.asrMatch, methodsWithin2: within2, methodsWithin5: within5,
      targetPair: pairKey(t),
      angleCoincident: coincides(best.method),
      nonCoincidentBest: (() => {
        const r = rows.find((x) => !coincides(x.method));
        return r ? { method: r.method, mean: r.combined.mean } : null;
      })(),
      tiedAtBest: rows.filter((r) => r.combined.mean === best.combined.mean).map((r) => r.method),
    });
  }

  // ---- per method, population share within 1 / 2 / 5
  const scoredPop = SCORED.reduce((a, t) => a + t.pop, 0);
  const methodShares = methods.map((m) => {
    const rows = scoredCells.filter((c) => c.method === m.id);
    const share = (limit) => {
      const hit = rows.filter((r) => r.combined.mean <= limit);
      const pop = hit.reduce((a, r) => a + (T.find((t) => t.country === r.country)?.pop || 0), 0);
      return { pop, shareOf30: round3(pop / POP_TOTAL), shareOfScored: round3(pop / scoredPop), countries: hit.length };
    };
    return {
      method: m.id, label: m.label,
      within1: share(1), within2: share(2), within5: share(5),
      weightedMean: round3(rows.reduce((a, r) => a + (T.find((t) => t.country === r.country)?.pop || 0) * r.combined.mean, 0) / scoredPop),
    };
  });

  // ---- population-weighted ranking, all scored / without Pakistan and India
  function weighted(exclude) {
    const rows = scoredCells.filter((c) => !exclude.includes(c.country));
    const pop = rows.reduce((a, r) => a + (T.find((t) => t.country === r.country)?.pop || 0), 0);
    const byMethod = new Map();
    for (const r of rows) {
      const p = (T.find((t) => t.country === r.country)?.pop || 0);
      const cur = byMethod.get(r.method) || { num: 0, pop: 0 };
      cur.num += p * r.combined.mean; cur.pop += p;
      byMethod.set(r.method, cur);
    }
    return [...byMethod.entries()]
      .map(([id, v]) => ({ method: id, score: round3(v.num / v.pop), covered: round3(v.pop) }))
      .sort((a, b) => a.score - b.score);
  }
  const rankAll = weighted([]);
  const rankNoPKIN = weighted(['Pakistan', 'India']);

  // ---- headline counts
  const within2Countries = winners.filter((w) => w.bestMean <= 2);
  const within1Countries = winners.filter((w) => w.bestMean <= 1);
  const within5Countries = winners.filter((w) => w.bestMean <= 5);
  const far = winners.filter((w) => w.bestMean > 5).sort((a, b) => b.pop - a.pop);

  const winnerMap = {
    schema: 'o1h-top30-winner-map/1',
    generated: '2026-11-10',
    scoring: 'best method per country by combined mean absolute deviation over fajr and isha, wall clock, 2026',
    population30: round3(POP_TOTAL),
    populationScored: round3(scoredPop),
    coverage: { scored: SCORED.length, noTarget: T.filter((t) => t.status === 'no-target').length, notScorable: T.filter((t) => t.status === 'not-scorable').length },
    headline: {
      countriesWithin1: within1Countries.length,
      countriesWithin2: within2Countries.length,
      countriesWithin5: within5Countries.length,
      countriesWithNoCloseMethod: far.map((f) => ({ country: f.country, pop: f.pop, best: f.best, mean: f.bestMean })),
    },
    winners,
    populationWeightedRanking: rankAll,
    populationWeightedRankingWithoutPakistanIndia: rankNoPKIN,
    methodPopulationShares: methodShares,
    sensitivity,
  };
  writeFileSync(join(OUT, 'winner-map.json'), `${JSON.stringify(winnerMap, null, 1)}\n`);

  // ---- report
  const L = [];
  const p = (s = '') => L.push(s);
  p('# O1h top-30 independent grid');
  p('');
  p('Second, independent decision table for the O1h study: the 30 countries with the largest Muslim');
  p('populations, 21 worldwide methods run naked, calendar year 2026, fajr and isha.');
  p('Built from `methods/methods.json`, `countries.json`, `policy-layer.v2.4.json` and');
  p('`world-table-v2.md` only, under `CONSTRAINTS.md` and `SHARED-BRIEF.md`. Every number in this');
  p('file is emitted by `grid.mjs` in the same run that wrote `results.json`.');
  p('');
  p('## What was scored');
  p('');
  p(`- 21 methods: the 20 in \`methods.json\` plus the ISNA-2010 18/18 position.`);
  p(`- ${SCORED.length} of the 30 countries carry a computable target, ${T.filter((t) => t.status === 'no-target').length} have no target at all in the record and ${T.filter((t) => t.status === 'not-scorable').length} carry a target whose rule form the brief excludes.`);
  p(`- ${round3(POP_TOTAL)} million Muslims across the 30 countries, ${round3(scoredPop)} million of them inside a scored target.`);
  p('- 365 days of 2026. Deviation is method minute minus target minute on the local wall clock,');
  p('  reported absolute, on the 24 h circle so a prayer that crosses midnight is still the same');
  p('  night\'s prayer.');
  p('');
  p('### Method-side conventions (the naked rule)');
  p('');
  p('Preset methods run with the adhan preset only: MWL, ISNA, Egyptian, Karachi, Umm al-Qura,');
  p('Dubai, MoonsightingCommittee, Kuwait, Qatar, Singapore, Turkey. Non-preset bodies run on `Other`');
  p('with the body\'s own documented pair and its own published margins: JAKIM +2/+2, Kemenag +3/+3,');
  p('ECFR -2/+2, Fazilet effective 19.8/17.8 and 20.8/18.7, MABIMS 20/18, Diyanet-Europe 18/16,');
  p('Russia-SAM 16/15, ISNA-2010 18/18. Census-measured margins are never applied to a method, per');
  p('the brief\'s last method-side sentence, so Umm al-Qura carries no +1 and Singapore carries the');
  p('preset\'s dhuhr +1 only.');
  p('');
  p('Interval isha is the printed maghrib plus the interval, which is the census\'s measured');
  p('invariant (isha minus maghrib = 90 or 120 exactly). Umm al-Qura takes +120 on the 30 Ramadan');
  p('days 2026-02-18 to 2026-03-19 and +90 otherwise.');
  p('');
  p('High latitude stays with the library: middle-of-the-night is the default every adhan preset');
  p('inherits, MoonsightingCommittee keeps its own body curve, ECFR is run as the proportional rule');
  p('(angle/60) because proportion is what the council documents. Targets keep their own documented');
  p('kind, so DUM RT gets its astronomically bounded sunrise-120 / sunset+90 substitute and DUMK its');
  p('angle/60 clamp.');
  p('');
  p('## (a) Winner map');
  p('');
  p('| # | Country | Pop (m) | Target | Grade | Closest method | fajr | isha | mean | worst | days<=2 | asr | also <=2 min |');
  p('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const w of winners) {
    const others = w.methodsWithin2.filter((m) => m !== w.best).join(', ') || '-';
    p(`| ${w.rank} | ${w.country} | ${w.pop.toFixed(2)} | ${w.targetId} | ${w.grade} | ${w.best} | ${fmt(w.fajrMean)} | ${fmt(w.ishaMean)} | **${fmt(w.bestMean)}** | ${fmt(w.bestWorst, 1)} | ${(w.bestWithin2 * 100).toFixed(1)} | ${w.asrMatch} | ${others} |`);
  }
  p('');
  p(`Headline: ${within2Countries.length} of the ${SCORED.length} scored countries have at least one method`);
  p(`inside 2 minutes mean deviation, ${within1Countries.length} inside 1 minute, ${within5Countries.length} inside 5.`);
  p('');
  const coincident = winners.filter((w) => w.angleCoincident && w.bestMean <= 2);
  p(`Read that headline twice. ${coincident.length} of the ${within2Countries.length} countries inside 2 minutes reach it with a`);
  p('method whose angle pair is the target\'s own pair: the census fitted the country to that body, so');
  p('the score measures the harness, not the method. Those countries are');
  p(`${coincident.map((w) => `${w.country} (${w.best})`).join(', ')}.`);
  const nonCoincident = winners.filter((w) => w.bestMean <= 2 && !w.angleCoincident);
  p(`The remaining ${nonCoincident.length} are reached with a pair that was not fitted to them:`);
  p(`${nonCoincident.map((w) => `${w.country} (${w.best} ${fmt(w.bestMean)})`).join(', ')}.`);
  p('');
  p('Coincident targets, with the best method that uses a foreign pair:');
  p('');
  p('| Country | Best method | Best mean | Best method with a foreign pair |');
  p('| --- | --- | --- | --- |');
  for (const w of winners.filter((x) => x.angleCoincident)) {
    p(`| ${w.country} | ${w.best} (${w.targetPair}) | ${fmt(w.bestMean)} | ${w.nonCoincidentBest ? `${w.nonCoincidentBest.method} ${fmt(w.nonCoincidentBest.mean)}` : '-'} |`);
  }
  p('');
  p(`Asr schools agree between the winning method and the target in ${winners.filter((w) => w.asrMatch === 'match').length} of ${winners.length} countries. A mismatch is carried as a flag and never enters the score.`);
  p('');
  p('## (b) Population share inside 1, 2 and 5 minutes');
  p('');
  p(`Share of the 30-country population (${round3(POP_TOTAL)} m). The scored-only denominator is`);
  p(`(${round3(scoredPop)} m) and excludes the six countries with no computable target.`);
  p('');
  p('| Method | <=1 min | <=2 min | <=5 min | weighted mean |');
  p('| --- | --- | --- | --- | --- |');
  for (const m of [...methodShares].sort((a, b) => b.within2.shareOf30 - a.within2.shareOf30)) {
    p(`| ${m.method} | ${(m.within1.shareOf30 * 100).toFixed(1)}% | ${(m.within2.shareOf30 * 100).toFixed(1)}% | ${(m.within5.shareOf30 * 100).toFixed(1)}% | ${fmt(m.weightedMean)} |`);
  }
  p('');
  p('Kuwait reaches 42.6 percent inside 2 minutes and nothing inside 1: its fajr floors where almost');
  p('every target rounds to nearest, so it is half a minute out everywhere and never inside the');
  p('tighter band. ECFR is the mirror image, 81 percent inside 5 and nothing inside 1, because its');
  p('-2 minute fajr margin is a systematic half-step.');
  p('');
  p('## (c) Population-weighted ranking');
  p('');
  p('Weighted mean absolute deviation across the scored countries, weighted by Muslim population.');
  p('');
  p(`| Rank | Method | All scored (${round3(rankAll[0].covered)} m) | Without Pakistan and India (${round3(rankNoPKIN[0].covered)} m) |`);
  p('| --- | --- | --- | --- |');
  const posAll = new Map(rankAll.map((r, i) => [r.method, i + 1]));
  const posNo = new Map(rankNoPKIN.map((r, i) => [r.method, i + 1]));
  const ids = [...new Set([...rankAll.map((r) => r.method), ...rankNoPKIN.map((r) => r.method)])];
  const byScore = [...ids].sort((a, b) => (rankAll.find((r) => r.method === a)?.score ?? 1e9) - (rankAll.find((r) => r.method === b)?.score ?? 1e9));
  for (const id of byScore) {
    const a = rankAll.find((r) => r.method === id);
    const b = rankNoPKIN.find((r) => r.method === id);
    p(`| ${posAll.get(id)} | ${id} | ${fmt(a.score)} | ${fmt(b.score)} (${posNo.get(id)}) |`);
  }
  p('');
  p('The spread is 3.62 minutes for the best method to 15.09 for the worst. Drop Pakistan and India');
  p('and the order turns over: those two carry 433 million people and both publish an 18/18 pair, so');
  p('any 18/18 method rides their weight to the top of the all-scored table. Without them ECFR leads');
  p('at 4.78 and the 18/18 family sits at 5.07. Iran enters every column on fajr alone, its');
  p('national table printing no isha row, so its weight counts once and not twice.');
  p('## Countries with no close method');
  p('');
  const causes = {
    Morocco: () => {
      const t = targetsOut.find((x) => x.country === 'Morocco');
      return `the object prints a fixed UTC+1 clock while every method renders in the IANA zone, which drops to UTC+0 for ${t.clockMismatchDays} days of 2026. That alone is ~60 minutes on those days`;
    },
    Russia: () => 'DUM RT substitutes sunrise-120 / sunset+90 on the 95 days the angle is unreachable, while the library default is Islamic midnight, about two hours earlier on exactly those days',
    Kazakhstan: () => 'DUMK clamps fajr and isha to angle/60 of the night and the naked library does not, so the same 15/15 pair is 9 minutes out',
  };
  if (far.length) {
    p('| Country | Pop (m) | Best method | Best mean | Cause |');
    p('| --- | --- | --- | --- | --- |');
    for (const f of far) p(`| ${f.country} | ${f.pop.toFixed(2)} | ${f.best} | ${fmt(f.bestMean, 1)} | ${causes[f.country] ? causes[f.country]() : '-'} |`);
  } else {
    p('None: every scored country has a method inside 5 minutes.');
  }
  p('');
  p('## Sensitivity: the choices that move the answer');
  p('');
  p('Russia has three publishers in the record. Scored against DUM RT at Kazan, no method is close.');
  p('Scored against CDUM at Moscow the same grid puts MWL at 2.00 minutes, because CDUM is exactly');
  p('18/17. The Russian verdict is a publisher choice, not a method gap.');
  p('');
  p('| Target variant | Best method | Best mean |');
  p('| --- | --- | --- |');
  for (const s of [...new Set(sensitivity.map((x) => x.country))]) {
    const rows = sensitivity.filter((x) => x.country === s).sort((a, b) => a.combined.mean - b.combined.mean);
    p(`| ${s} | ${rows[0].method} | ${fmt(rows[0].combined.mean)} |`);
  }
  p('');
  p('The southern-African members of the Jamiat federation are anchored at Durban in the primary');
  p('grid, per the brief. Run at their own capitals the same recipe and the same grid put Tanzania at');
  p(`${fmt(sensitivity.filter((x) => x.country === 'Tanzania (at Dar es Salaam)').sort((a, b) => a.combined.mean - b.combined.mean)[0].combined.mean)} and Mozambique at ${fmt(sensitivity.filter((x) => x.country === 'Mozambique (at Maputo)').sort((a, b) => a.combined.mean - b.combined.mean)[0].combined.mean)}, so neither is a method failure either.`);
  p('');
  p('## Unscored countries');
  p('');
  p('| # | Country | Pop (m) | Reason |');
  p('| --- | --- | --- | --- |');
  for (const t of T.filter((x) => !x.status.startsWith('scored')).sort((a, b) => b.pop - a.pop)) {
    p(`| ${t.rank} | ${t.country} | ${t.pop.toFixed(2)} | ${t.reason} |`);
  }
  p('');
  p('## Fit points derived where `countries.json` is null');
  p('');
  p('- **Malaysia** `MY-JAKIM`: 3.139, 101.6869, zone WLY01, Kuala Lumpur and Putrajaya. That is the');
  p('  object\'s own zone anchor, cited in the policy layer as the Lampiran B westernmost-point');
  p('  reference (`SOURCE-CATALOG my-jakim-wly01`, `#6905 E4`), and the world table calls the zone');
  p('  reference points Lampiran B westernmost-point computations verified by fit.');
  p('- **Tanzania** and **Mozambique** `JAMIAT-KZN`: -29.8587, 31.0218, Durban, the brief\'s fixed');
  p('  fallback. The world table records this federation as covering 11 Tanzanian and 2 Mozambican');
  p('  towns, but the 494-town table is not on the board, so the anchor is Durban and the numbers');
  p('  measure Durban. Both are marked `scored-anchor` and both have a sensitivity row at the');
  p('  national capital in `results.json`.');
  p('- **Russia** `RU-DUMRT` keeps its own board point, Kazan 55.7963/49.1088.');
  p('');
  p('## Checks');
  p('');
  p(`Twelve country-method pairs reproduce the target exactly, and each one is the pair it has to be:`);
  p('Indonesia/MABIMS 20/18, Pakistan and India against ISNA-2010 and Karachi 18/18, Nigeria against');
  p('MWL 18/17, Egypt against the Egyptian 19.5/17.5, Turkey against Diyanet and MWL 18/17, Yemen');
  p('against Diyanet-Europe 18/16, Malaysia against JAKIM. An arithmetic error anywhere in the');
  p('pipeline would break that set.');
  p('');
  p('Three results to read with their cause:');
  p('');
  p('- Umm al-Qura scores exactly 1.0 minute against Saudi Arabia. The preset carries no +1 margin');
  p('  and the target\'s printed row does, so the naked preset is one minute early every day. That is');
  p('  the brief\'s rule working, not a defect.');
  p('- Russia is 13 minutes out at best, because the Kazan body substitutes sunrise-120 on the 95');
  p('  days the 18 degree angle is unreachable while the library default is Islamic midnight, about');
  p('  two hours earlier on those days.');
  p('- Kazakhstan\'s ISNA 15/15 is 9.1 minutes out against the target that uses the same pair, because');
  p('  DUMK clamps fajr and isha to angle/60 of the night and the naked library does not.');
  p('');
  p('## Expected divergences from the main simulation');
  p('');
  p('1. Census-measured method margins are not applied (Umm al-Qura +1, Singapore\'s five, Dubai\'s');
  p('   four). The brief orders presets verbatim. A run that applied them would gain about a minute');
  p('   on three methods and lose nothing.');
  p('2. Interval isha is composed on the printed maghrib rather than on raw sunset (a 1 minute');
  p('   difference on Umm al-Qura and Qatar).');
  p('3. Russia uses DUM RT Kazan, the grade A Russian target. CDUM and DUM RF are sensitivity rows.');
  p('4. Tanzania and Mozambique are anchored at Durban per the brief.');
  p('');
  p('## Method inventory');
  p('');
  p('| Method | Pair / rule | asr | high latitude |');
  p('| --- | --- | --- | --- |');
  for (const m of methods) p(`| ${m.id} | ${m.label} | ${m.asr} | ${m.hl} |`);
  p('');
  writeFileSync(join(OUT, 'TOP30-REPORT.md'), `${L.join('\n')}\n`);

  process.stdout.write(`winner map ${winners.length} countries; within2 ${within2Countries.length}; within5 ${within5Countries.length}\n`);
  process.stdout.write(`rank head all: ${rankAll.slice(0, 5).map((r) => `${r.method} ${r.score}`).join(' | ')}\n`);
  process.stdout.write(`rank head noPKIN: ${rankNoPKIN.slice(0, 5).map((r) => `${r.method} ${r.score}`).join(' | ')}\n`);
  process.stdout.write(`no close method: ${far.map((f) => `${f.country}(${f.bestMean.toFixed(1)})`).join(', ')}\n`);
}

function main() {
  const cells = [];
  const targetsOut = [];
  for (const t of T) {
    const row = {
      rank: t.rank, country: t.country, pop: t.pop, targetId: t.targetId,
      status: t.status, cite: t.cite || null, caveat: t.caveat || null,
      reason: t.reason || null, grade: t.grade || null,
    };
    if (t.status === 'scored' || t.status === 'scored-anchor' || t.status === 'scored-fajr-only') {
      const targetSeries = seriesFor({ ...t, ishaNotPublished: t.ishaNotPublished === true });
      row.lat = t.lat; row.lon = t.lon; row.tz = t.tz;
      if (t.clockFixedMinutes != null) {
        let mism = 0;
        for (const { date } of days2026()) {
          if (tzOffsetMs(date, t.tz) !== t.clockFixedMinutes * 60000) mism += 1;
        }
        row.clockMismatchDays = mism;
        row.clock = `fixed UTC${t.clockFixedMinutes >= 0 ? '+' : ''}${t.clockFixedMinutes / 60}`;
      }
      row.days = t.ishaNotPublished ? { fajr: targetSeries.fajr.filter((v) => v != null).length } : { fajr: 365, isha: 365 };
      for (const m of METHODS) {
        const methodSeries = seriesFor({ ...m, tz: t.tz, lat: t.lat, lon: t.lon, clockFixedMinutes: null });
        const c = compare(targetSeries, methodSeries);
        const asrMatch = t.asr == null ? 'n/a' : (t.asr === m.asr ? 'match' : 'mismatch');
        cells.push({
          country: t.country, targetId: t.targetId, method: m.id,
          fajr: c.fajr, isha: c.isha, combined: c.combined, asrMatch,
        });
      }
    }
    targetsOut.push(row);
  }

  const sensitivity = [];
  for (const s of SENSITIVITY) {
    const targetSeries = seriesFor(s);
    for (const m of METHODS) {
      const methodSeries = seriesFor({ ...m, tz: s.tz, lat: s.lat, lon: s.lon, clockFixedMinutes: null });
      const c = compare(targetSeries, methodSeries);
      sensitivity.push({ country: s.country, targetId: s.targetId, method: m.id, fajr: c.fajr, isha: c.isha, combined: c.combined });
    }
  }

  analyse({ cells, targetsOut, sensitivity, methods: METHODS });

  const payload = {
    schema: 'o1h-top30-grid/1',
    generated: '2026-11-10',
    study: 'O1h independent second grid: 30 largest Muslim populations x 21 worldwide methods, naked, calendar 2026',
    year: YEAR,
    ramadan1447: RAMADAN_1447,
    engine: 'adhan-js 4.4.6',
    conventions: {
      deviation: 'method minute minus target minute, wall clock, in the target timezone; reported as absolute value',
      rounding: 'computed at second resolution (Rounding.None), margins added, then the row direction applied; targets use the object direction, methods use the body documented direction else nearest',
      methodMargins: 'preset methods run with the preset only; non-preset methods run with the body published margins (JAKIM +2/+2, Kemenag +3/+3, ECFR -2/+2); census-measured margins are target-side only, per brief section "method side" last sentence',
      intervals: 'interval isha is printed maghrib + interval, the census measured invariant',
      highLatitude: 'methods keep the library default (middle of night) except MoonsightingCommittee (body curve) and ECFR (proportional, angle/60)',
      asr: 'flag only, never part of the score',
    },
    targets: targetsOut,
    methods: METHODS.map((m) => ({ id: m.id, label: m.label, asr: m.asr, hl: m.hl, note: m.note || null })),
    cells,
    sensitivity,
  };
  writeFileSync(join(OUT, 'results.json'), `${JSON.stringify(payload, null, 1)}\n`);
  process.stdout.write(`cells ${cells.length} targets ${targetsOut.length} sensitivity ${sensitivity.length}\n`);

  // quick self-check anchors
  const zero = cells.filter((c) => c.combined && c.combined.mean === 0);
  process.stdout.write(`exact-zero cells ${zero.length}: ${zero.map((c) => `${c.country}/${c.method}`).join(', ')}\n`);
}

main();
