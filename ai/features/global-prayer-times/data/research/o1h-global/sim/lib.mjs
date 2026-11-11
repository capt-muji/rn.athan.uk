import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ADHAN = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';

const adhan = require(ADHAN);
const SolarTime = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/SolarTime.js').default;
const CP = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/CalculationParameters.js').default;
const CM = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/CalculationMethod.js').default;
const Madhab = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Madhab.js').Madhab;
const Rounding = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Rounding.js').Rounding;
const HLA = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/HighLatitudeRule.js').default;

const { Coordinates, PrayerTimes } = adhan;

export const MIN = 60 * 1000;

// Ramadan 1447 per Umm al-Qura's own calendar: 30 days, 2026-02-18 through 2026-03-19.
export const RAMADAN_2026 = new Set();
for (let d = 18; d <= 28; d += 1) RAMADAN_2026.add(`2026-02-${String(d).padStart(2, '0')}`);
for (let d = 1; d <= 19; d += 1) RAMADAN_2026.add(`2026-03-${String(d).padStart(2, '0')}`);

// Islamic months are 30 and 29 alternately; month 12 gains a day in a leap year,
// which falls after Ramadan. The 30-year cycle's leaps are these 11 years.
const HIJRI_LEAPS = new Set([2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]);

function ramadanStartJD(hijriYear) {
  const cycle = Math.floor((hijriYear - 1) / 30);
  const inCycle = ((hijriYear - 1) % 30) + 1;
  let days = cycle * 10631;
  for (let y = 1; y < inCycle; y += 1) days += 355 + (HIJRI_LEAPS.has(y) ? 1 : 0);
  days += 236; // months 1-8 before Ramadan: 30+29+30+29+30+29+30+29
  return 1948440 + days - 1;
}

function gregorianFromJD(jd) {
  const a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return [100 * b + d - 4800 + Math.floor(m / 10), m + 3 - 12 * Math.floor(m / 10), e - Math.floor((153 * m + 2) / 5) + 1];
}

// The arithmetic calendar runs five days behind Umm al-Qura's own for 1447, so the epoch is
// shifted onto the one date the record fixes and every later year inherits that anchor.
const UMM_AL_QURA_ANCHOR_JD = (() => {
  const [y, m, d] = [2026, 2, 18];
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
})();
const HIJRI_EPOCH_SHIFT = ramadanStartJD(1447) - UMM_AL_QURA_ANCHOR_JD;

export function ramadanSet(years) {
  const set = new Set(RAMADAN_2026);
  for (const year of years) {
    if (year === 2026) continue;
    const approx = 1447 + Math.floor((year - 2026) * 365.2425 / 354.367);
    for (let h = approx - 1; h <= approx + 2; h += 1) {
      const start = ramadanStartJD(h) - HIJRI_EPOCH_SHIFT;
      const [sy, sm, sd] = gregorianFromJD(start);
      if (sy !== year) continue;
      for (let i = 0; i < 30; i += 1) {
        const [ry, rm, rd] = gregorianFromJD(start + i);
        set.add(`${ry}-${String(rm).padStart(2, '0')}-${String(rd).padStart(2, '0')}`);
      }
    }
  }
  return set;
}

export function isoDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function hourToDate(h, y, m, d) {
  if (h === null || h === undefined || Number.isNaN(h)) return null;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.floor((h - (hh + mm / 60)) * 3600);
  return new Date(Date.UTC(y, m, d, hh, mm, ss));
}

// Wall-clock minutes for an instant, read at a fixed offset or through the process TZ.
export function wallMinutes(date, clock) {
  if (date === null) return null;
  const secs = clock.mode === 'fixed'
    ? date.getTime() / 1000 + clock.fixedOffsetMinutes * 60
    : date.getTime() / 1000 + (() => {
      const probe = new Date(date.getTime());
      return -probe.getTimezoneOffset() * 60;
    })();
  return secs / 60;
}

export function roundMinute(minutes, mode) {
  if (minutes === null || Number.isNaN(minutes)) return null;
  const secs = minutes * 60;
  let r;
  if (mode === 'up') r = Math.ceil(secs / 60) * 60;
  else if (mode === 'down') r = Math.floor(secs / 60) * 60;
  else if (mode === 'none') r = secs;
  else r = Math.floor((secs + 30) / 60) * 60;
  return r / 60;
}

export function wrapDelta(method, target) {
  let d = (method - target) % 1440;
  if (d > 720) d -= 1440;
  if (d < -720) d += 1440;
  return d;
}

export function clockOf(spec) {
  if (spec.clock && spec.clock.mode === 'fixed') return spec.clock;
  return { mode: 'iana', fixedOffsetMinutes: null };
}

// ---------------------------------------------------------------- methods

function presetParams(name) {
  const fn = CM[name];
  if (!fn) throw new Error(`no adhan preset ${name}`);
  return fn();
}

function otherParams(fajr, isha, interval = 0, maghribAngle = 0) {
  return new CP('Other', fajr, isha, interval, maghribAngle);
}

function finish(params, asr) {
  params.madhab = asr === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return params;
}

export const METHODS = [
  { id: 'mwl', label: 'Muslim World League', fajr: 18, isha: 17, asr: 'shafi', build: () => presetParams('MuslimWorldLeague'), carrier: 'preset MuslimWorldLeague' },
  { id: 'isna15', label: 'ISNA / FCNA (15/15, 2017 onward)', fajr: 15, isha: 15, asr: 'shafi', build: () => presetParams('NorthAmerica'), carrier: 'preset NorthAmerica' },
  { id: 'isna2010', label: 'ISNA-2010 (18/18 claim to ICOP)', fajr: 18, isha: 18, asr: 'shafi', build: () => otherParams(18, 18), carrier: 'constructed Other' },
  { id: 'ummalqura', label: 'Umm al-Qura (18.5, isha +90 / +120 Ramadan)', fajr: 18.5, isha: null, asr: 'shafi', build: () => presetParams('UmmAlQura'), carrier: 'preset UmmAlQura + Ramadan switch', ramadanPlusMinutes: 30 },
  { id: 'egyptian', label: 'Egyptian General Authority (19.5/17.5)', fajr: 19.5, isha: 17.5, asr: 'shafi', build: () => presetParams('Egyptian'), carrier: 'preset Egyptian' },
  { id: 'karachi', label: 'University of Islamic Sciences, Karachi (18/18, Hanafi asr)', fajr: 18, isha: 18, asr: 'hanafi', build: () => presetParams('Karachi'), carrier: 'preset Karachi' },
  { id: 'moonsighting', label: 'Moonsighting Committee Worldwide', fajr: 18, isha: 18, asr: 'shafi', build: () => presetParams('MoonsightingCommittee'), carrier: 'preset MoonsightingCommittee' },
  { id: 'diyanet-tr', label: 'Diyanet domestic (18/17, temkin)', fajr: 18, isha: 17, asr: 'shafi', build: () => presetParams('Turkey'), carrier: 'preset Turkey' },
  { id: 'diyanet-eu', label: 'Diyanet European unified (18/16)', fajr: 18, isha: 16, asr: 'shafi', build: () => otherParams(18, 16), carrier: 'constructed Other' },
  { id: 'mabims', label: 'MABIMS (20/18) [= Kemenag instance]', fajr: 20, isha: 18, asr: 'shafi', build: () => otherParams(20, 18), carrier: 'constructed Other' },
  { id: 'jakim', label: 'JAKIM e-Solat (18/18)', fajr: 18, isha: 18, asr: 'shafi', build: () => otherParams(18, 18), carrier: 'constructed Other' },
  { id: 'kuwait', label: 'Kuwait Awqaf (18/17.5)', fajr: 18, isha: 17.5, asr: 'shafi', build: () => presetParams('Kuwait'), carrier: 'preset Kuwait' },
  { id: 'qatar', label: 'Qatar MOI (18, isha +90)', fajr: 18, isha: null, asr: 'shafi', build: () => presetParams('Qatar'), carrier: 'preset Qatar' },
  { id: 'singapore', label: 'MUIS Singapore (20/18, ceil)', fajr: 20, isha: 18, asr: 'shafi', build: () => presetParams('Singapore'), carrier: 'preset Singapore' },
  { id: 'dubai', label: 'Dubai / UAE AWQAF (18.2/18.2)', fajr: 18.2, isha: 18.2, asr: 'shafi', build: () => presetParams('Dubai'), carrier: 'preset Dubai' },
  { id: 'tehran', label: 'Tehran Geophysics (17.7 / 14 software default)', fajr: 17.7, isha: 14, asr: 'shafi', build: () => presetParams('Tehran'), carrier: 'preset Tehran' },
  { id: 'fazilet-a', label: 'Fazilet Profile A (19.8/17.8 effective)', fajr: 19.8, isha: 17.8, asr: 'shafi', build: () => otherParams(19.8, 17.8), carrier: 'constructed Other' },
  { id: 'fazilet-b', label: 'Fazilet Profile B (20.8/18.7 effective)', fajr: 20.8, isha: 18.7, asr: 'shafi', build: () => otherParams(20.8, 18.7), carrier: 'constructed Other' },
  { id: 'ecfr', label: 'ECFR (18/17, Fiqh Academy resolution)', fajr: 18, isha: 17, asr: 'shafi', build: () => otherParams(18, 17), carrier: 'constructed Other' },
  { id: 'russia', label: 'Spiritual Administration of Russia (16/15)', fajr: 16, isha: 15, asr: 'shafi', build: () => otherParams(16, 15), carrier: 'constructed Other' },
];

export const KEMENAG_ALIAS = 'mabims';

export function methodDay(method, lat, lon, date, isRamadan) {
  const params = finish(method.build(), method.asr);
  const pt = new PrayerTimes(new Coordinates(lat, lon), date, params);
  let fajr = pt.fajr.getTime();
  let isha = pt.isha.getTime();
  if (method.ramadanPlusMinutes && isRamadan) isha += method.ramadanPlusMinutes * MIN;
  const clock = { mode: 'iana', fixedOffsetMinutes: null };
  return { fajr: wallMinutes(new Date(fajr), clock), isha: wallMinutes(new Date(isha), clock) };
}

// ---------------------------------------------------------------- targets

function baseGeometry(date, lat, lon) {
  const coords = new Coordinates(lat, lon);
  const st = new SolarTime(date, coords);
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const tomorrow = new Date(date.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const stTomorrow = new SolarTime(tomorrow, coords);
  const sunrise = hourToDate(st.sunrise, y, m, d);
  const sunset = hourToDate(st.sunset, y, m, d);
  const tomorrowSunrise = hourToDate(stTomorrow.sunrise, tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  const nightSeconds = (sunrise && sunset && tomorrowSunrise)
    ? (tomorrowSunrise.getTime() - sunset.getTime()) / 1000
    : null;
  const angle = (deg, afterTransit) => hourToDate(st.hourAngle(-1 * deg, afterTransit), y, m, d);
  return { st, y, m, d, sunrise, sunset, nightSeconds, angle };
}

function addMinutes(date, minutes) {
  if (date === null) return null;
  return new Date(date.getTime() + minutes * MIN);
}

function bound(angleTime, nightTime, pickLater) {
  if (angleTime === null) return nightTime;
  if (nightTime === null) return angleTime;
  if (pickLater) return nightTime > angleTime ? nightTime : angleTime;
  return nightTime < angleTime ? nightTime : angleTime;
}

// The object's own high-latitude rule, applied to the raw angle instants.
function applyHla(g, spec, iso, lat, lon) {
  const hl = spec.hla || { kind: 'none' };
  const night = g.nightSeconds;
  const portion = (p) => (night === null ? null : new Date(g.sunrise.getTime() - p * night * 1000));

  if (hl.kind === 'none' || hl.kind === 'displaySuppress') {
    return { fajr: g.fajrAngle, isha: g.ishaAngle };
  }
  if (hl.kind === 'middleOfTheNight') {
    return {
      fajr: bound(g.fajrAngle, portion(0.5), true),
      isha: bound(g.ishaAngle, night === null ? null : new Date(g.sunset.getTime() + 0.5 * night * 1000), false),
    };
  }
  if (hl.kind === 'seventhOfTheNight') {
    return {
      fajr: bound(g.fajrAngle, portion(1 / 7), true),
      isha: bound(g.ishaAngle, night === null ? null : new Date(g.sunset.getTime() + (1 / 7) * night * 1000), false),
    };
  }
  if (hl.kind === 'twilightAngleClamp') {
    const f = spec.fajr.angle / 60;
    const i = spec.isha.angle / 60;
    return {
      fajr: bound(g.fajrAngle, portion(f), true),
      isha: bound(g.ishaAngle, night === null ? null : new Date(g.sunset.getTime() + i * night * 1000), false),
    };
  }
  if (hl.kind === 'nightPortionSplit') {
    const p = hl.params || {};
    if (p.minAbsLat !== undefined && Math.abs(lat) < p.minAbsLat) {
      return { fajr: g.fajrAngle, isha: g.ishaAngle };
    }
    if (p.windowFrom && (iso.slice(5) < p.windowFrom || iso.slice(5) > p.windowTo)) {
      return { fajr: g.fajrAngle, isha: g.ishaAngle };
    }
    const fPortion = p.fajrPortion;
    const iPortion = p.ishaPortion;
    const f = fPortion === null || fPortion === undefined ? g.fajrAngle : bound(g.fajrAngle, portion(fPortion), p.fajrPickLater !== false);
    const i = (iPortion === null || iPortion === undefined || night === null)
      ? g.ishaAngle
      : bound(g.ishaAngle, new Date(g.sunset.getTime() + iPortion * night * 1000), false);
    return { fajr: f, isha: i };
  }
  if (hl.kind === 'frozenLatitude45') {
    if (g.fajrAngle && g.ishaAngle) return { fajr: g.fajrAngle, isha: g.ishaAngle };
    const g45 = baseGeometry(g.dateObj, 45, lon);
    return {
      fajr: g.fajrAngle || g45.angle(spec.fajr.angle, false),
      isha: g.ishaAngle || g45.angle(spec.isha.angle, true),
    };
  }
  throw new Error(`unhandled high-latitude kind ${hl.kind}`);
}

export function targetDay(spec, date, isRamadan) {
  const g = baseGeometry(date, spec.lat, spec.lon);
  g.dateObj = date;
  g.fajrAngle = spec.fajr.angle === null || spec.fajr.angle === undefined ? null : g.angle(spec.fajr.angle, false);
  g.ishaAngle = spec.isha.angle === null || spec.isha.angle === undefined ? null : g.angle(spec.isha.angle, true);
  const iso = isoDate(g.y, g.m, g.d);
  const clock = clockOf(spec);
  const wall = (inst) => (inst === null ? null : wallMinutes(inst, clock));
  const shown = (inst, margin, mode) => {
    const w = wall(inst);
    return w === null ? null : roundMinute(w + (margin || 0), mode || 'nearest');
  };

  const hl = applyHla(g, spec, iso, spec.lat, spec.lon);
  const ishaKind = spec.isha.kind;

  const fajr = hl.fajr === null ? null : roundMinute(wall(hl.fajr) + (spec.margins.fajr || 0), spec.rounding.fajr || 'nearest');

  let isha;
  if (ishaKind === 'interval' || ishaKind === 'ramadanInterval') {
    const interval = ishaKind === 'ramadanInterval' && isRamadan
      ? spec.isha.ramadanInterval
      : spec.isha.intervalMinutes;
    isha = shown(addMinutes(g.sunset, interval), spec.margins.isha, spec.rounding.isha);
  } else if (ishaKind === 'intervalAfterRounding') {
    isha = shown(g.sunset, spec.margins.maghrib, spec.rounding.maghrib || 'nearest') + spec.isha.intervalMinutes;
  } else if (ishaKind === 'twilightRatio') {
    const fajrShown = shown(hl.fajr, spec.margins.fajr, spec.rounding.fajr || 'nearest');
    const sunriseShown = shown(g.sunrise, spec.margins.sunrise, spec.rounding.sunrise || 'nearest');
    // The record writes the span as (fajr - sunrise); only its magnitude is meaningful,
    // because the isha has to land after maghrib.
    const spanMinutes = sunriseShown - fajrShown;
    const extra = Math.round(spec.isha.ratio * spanMinutes + spec.isha.constantMinutes);
    isha = shown(g.sunset, spec.margins.maghrib, spec.rounding.maghrib || 'nearest') + extra;
  } else if (ishaKind === 'notPublished') {
    isha = null;
  } else {
    isha = hl.isha === null ? null : roundMinute(wall(hl.isha) + (spec.margins.isha || 0), spec.rounding.isha || 'nearest');
  }

  return { fajr, isha };
}

export function truthDay(spec, iso) {
  const row = spec.truth[iso];
  if (!row) return null;
  const parse = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  return { fajr: parse(row.fajr), isha: parse(row.isha) };
}

export function stats(values) {
  if (values.length === 0) return { n: 0, mean: null, worst: null, within2: null };
  let sum = 0;
  let worst = 0;
  let within = 0;
  for (const v of values) {
    sum += v;
    if (v > worst) worst = v;
    if (v <= 2.0000001) within += 1;
  }
  return { n: values.length, mean: sum / values.length, worst, within2: (100 * within) / values.length };
}
