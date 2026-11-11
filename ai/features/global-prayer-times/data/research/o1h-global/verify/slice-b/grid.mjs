// O1h verify slice-b: Europe + Russia, independent recompute.
// 21 methods x 16 scored targets (7 skipped with reasons), 2026 (London 2027-2038 real minutes).
// Engine: adhan-js 4.4.6, Rounding.None, explicit rounding, TZ=<country iana> per invocation.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOME = process.env.HOME;
const ADHAN_DIR = `${HOME}/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs`;
const OUT_DIR = `${HOME}/athan-gitree/census/o1h-global/verify/slice-b`;
const LONDON_2027 = `${HOME}/athan-gitree/census/o1g-decade/data/2027.json`;
const LONDON_TRUTH = `${HOME}/athan-gitree/census/o1g-decade/truth/truth-2028-2038.json`;

const adhanBundle = (await import(`${ADHAN_DIR}/Adhan.js`)).default;
const SolarTime = (await import(`${ADHAN_DIR}/SolarTime.js`)).default.default;
const TimeComponents = (await import(`${ADHAN_DIR}/TimeComponents.js`)).default.default;
const { Rounding } = (await import(`${ADHAN_DIR}/Rounding.js`)).default;

const { Coordinates, CalculationMethod, PrayerTimes } = adhanBundle;

// ---------- calendar / time helpers ----------

const pad2 = (n) => String(n).padStart(2, '0');
const civilKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const nextCivilDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
const prevCivilDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);

function* civilDays(startKey, endKey) {
  const [y, m, d] = startKey.split('-').map(Number);
  let cur = new Date(y, m - 1, d);
  while (civilKey(cur) <= endKey) {
    yield new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
    cur = nextCivilDay(cur);
  }
}

const MIN = 60;
function instant(num, d) {
  return new TimeComponents(num).utcDate(d.getFullYear(), d.getMonth(), d.getDate());
}
const epochMin = (ms, mode) => {
  const s = ms / 1000;
  if (mode === 'up') return Math.ceil(s / 60);
  if (mode === 'down') return Math.floor(s / 60);
  return Math.round(s / 60);
};

const fmtCache = new Map();
function wallMinute(epochMinutes, tz) {
  let fmt = fmtCache.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour12: false, hourCycle: 'h23', hour: '2-digit', minute: '2-digit',
    });
    fmtCache.set(tz, fmt);
  }
  const parts = fmt.format(new Date(epochMinutes * 60000));
  const [h, m] = parts.split(':').map(Number);
  return h * 60 + m;
}

function solarTime(civilDate, lat, lon) {
  return new SolarTime(civilDate, new Coordinates(lat, lon));
}

// ---------- methods (21, naked) ----------

function preset(name) { return CalculationMethod[name](); }
function otherPair(fajr, isha) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajr;
  p.ishaAngle = isha;
  return p;
}

// order follows methods.json; isna-2010 is the brief's added row.
export const METHODS = [
  { id: 'mwl',              build: () => preset('MuslimWorldLeague'), rounding: 'nearest' },
  { id: 'isna',             build: () => preset('NorthAmerica'),      rounding: 'nearest' },
  { id: 'umm-al-qura',      build: (d) => {
      const p = preset('UmmAlQura');
      const k = civilKey(d);
      if (k >= '2026-02-18' && k <= '2026-03-19') p.ishaInterval = 120;
      return p;
    }, rounding: 'nearest' },
  { id: 'egyptian',         build: () => preset('Egyptian'),          rounding: 'nearest' },
  { id: 'karachi',          build: () => preset('Karachi'),           rounding: 'nearest' },
  { id: 'moonsighting',     build: () => preset('MoonsightingCommittee'), rounding: 'nearest' },
  { id: 'diyanet-domestic', build: () => preset('Turkey'),            rounding: 'nearest' },
  { id: 'diyanet-europe',   build: () => otherPair(18, 16),           rounding: 'nearest' },
  { id: 'mabims',           build: () => otherPair(20, 18),           rounding: 'nearest' },
  { id: 'jakim',            build: () => otherPair(18, 18),           rounding: 'nearest' },
  { id: 'kemenag',          build: () => otherPair(20, 18),           rounding: 'nearest' },
  { id: 'kuwait',           build: () => preset('Kuwait'),            rounding: 'nearest' },
  { id: 'qatar',            build: () => preset('Qatar'),             rounding: 'nearest' },
  { id: 'singapore-muis',   build: () => preset('Singapore'),         rounding: 'up' },
  { id: 'dubai',            build: () => preset('Dubai'),             rounding: 'nearest' },
  { id: 'tehran',           build: () => preset('Tehran'),            rounding: 'nearest' },
  { id: 'fazilet-a',        build: () => otherPair(19.8, 17.8),       rounding: 'nearest' },
  { id: 'fazilet-b',        build: () => otherPair(20.8, 18.7),       rounding: 'nearest' },
  { id: 'ecfr',             build: () => otherPair(18, 17),           rounding: 'nearest' },
  { id: 'russia-sam',       build: () => otherPair(16, 15),           rounding: 'nearest' },
  { id: 'isna-2010',        build: () => otherPair(18, 18),           rounding: 'nearest' },
];

function methodRaw(mid, date, lat, lon) {
  const def = METHODS.find((m) => m.id === mid);
  const params = def.build(date);
  params.rounding = Rounding.None;
  const pt = new PrayerTimes(new Coordinates(lat, lon), date, params);
  return { fajr: pt.fajr.getTime() / 1000, isha: pt.isha.getTime() / 1000 };
}

// ---------- targets ----------

function angleTargetPt(date, lat, lon, fajrAngle, ishaAngle) {
  const params = otherPair(fajrAngle, ishaAngle);
  params.rounding = Rounding.None;
  const pt = new PrayerTimes(new Coordinates(lat, lon), date, params);
  return { fajr: pt.fajr.getTime(), isha: pt.isha.getTime() };
}

// Per-day target values: { fajr: {ms, skip?}, isha: {ms, skip?} } or null for data-driven targets.
const TARGETS = {
  'GB-WIFAQUL-ULAMA': {
    lat: 53.7485, lon: -2.4825, tz: 'Europe/London', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: 'shafi',
    day: (d) => {
      // 18/15 with split night portions (fajr half-night, isha 1/7) via nightPortions override.
      const params = otherPair(18, 15);
      params.nightPortions = () => ({ fajr: 1 / 2, isha: 1 / 7 });
      params.rounding = Rounding.None;
      const pt = new PrayerTimes(new Coordinates(53.7485, -2.4825), d, params);
      return { fajr: { ms: pt.fajr.getTime() }, isha: { ms: pt.isha.getTime() } };
    },
  },
  'GB-LONDON-INTERVAL-TABLE': {
    lat: 51.5074, lon: -0.1278, tz: 'Europe/London',
    years: Array.from({ length: 12 }, (_, i) => String(2027 + i)),
    published: true, asrSchool: 'shafi',
  },
  'IS-FELAG': {
    lat: 64.1466, lon: -21.9426, tz: 'Atlantic/Reykjavik', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: null,
    day: (d) => {
      // Raw fitted angles; polar days where the angle does not exist are skipped (displaySuppress).
      const st = solarTime(d, 64.1466, -21.9426);
      const f = st.hourAngle(-14.2, false);
      const i = st.hourAngle(-14, true);
      const out = { fajr: {}, isha: {} };
      out.fajr = isNaN(f) ? { skip: 'polar day: sun never reaches 14.2 deg depression' } : { ms: instant(f, d).getTime() };
      out.isha = isNaN(i) ? { skip: 'polar day: sun never reaches 14 deg depression' } : { ms: instant(i, d).getTime() };
      return out;
    },
  },
  'BA-RIJASET': {
    lat: 43.8563, lon: 18.4131, tz: 'Europe/Sarajevo', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: 'shafi',
    day: (d) => {
      const r = angleTargetPt(d, 43.8563, 18.4131, 18, 16);
      return { fajr: { ms: r.fajr }, isha: { ms: r.isha } };
    },
  },
  'ME-IZMR': {
    lat: 42.4304, lon: 19.2594, tz: 'Europe/Podgorica', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: 'shafi',
    day: (d) => {
      const r = angleTargetPt(d, 42.4304, 19.2594, 19.4, 17.8);
      return { fajr: { ms: r.fajr }, isha: { ms: r.isha } };
    },
  },
  'XK-BIK': {
    lat: 42.6629, lon: 21.1655, tz: 'Europe/Belgrade', years: ['2026'],
    fajrMargin: 21, ishaMargin: 10, rounding: 'nearest', asrSchool: 'shafi',
    day: (d) => {
      const r = angleTargetPt(d, 42.6629, 21.1655, 18.9, 17);
      return { fajr: { ms: r.fajr }, isha: { ms: r.isha } };
    },
  },
  'BG-SOFIA': {
    lat: 42.6977, lon: 23.3219, tz: 'Europe/Sofia', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: 'shafi',
    day: (d) => {
      const r = angleTargetPt(d, 42.6977, 23.3219, 18.25, 17.25);
      return { fajr: { ms: r.fajr }, isha: { ms: r.isha } };
    },
  },
  'GR-ATHENS': {
    lat: 37.9838, lon: 23.7275, tz: 'Europe/Athens', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: 'shafi',
    day: (d) => {
      const r = angleTargetPt(d, 37.9838, 23.7275, 18, 17);
      return { fajr: { ms: r.fajr }, isha: { ms: r.isha } };
    },
  },
  'GR-KOMOTINI': {
    lat: 41.1194, lon: 25.4036, tz: 'Europe/Athens', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: 'shafi',
    day: (d) => {
      const r = angleTargetPt(d, 41.1194, 25.4036, 18, 17);
      return { fajr: { ms: r.fajr }, isha: { ms: r.isha } };
    },
  },
  'CZ-CENTRUM': {
    lat: 50.08, lon: 14.42, tz: 'Europe/Prague', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: 'shafi',
    day: (d) => {
      const r = angleTargetPt(d, 50.08, 14.42, 12, 12);
      return { fajr: { ms: r.fajr }, isha: { ms: r.isha } };
    },
  },
  'PT-HSALAH-HUB': {
    lat: 38.7223, lon: -9.1393, tz: 'Europe/Lisbon', years: ['2026'],
    fajrMargin: 1, ishaMargin: 1, rounding: 'down', asrSchool: 'shafi',
    day: (d) => {
      const r = angleTargetPt(d, 38.7223, -9.1393, 18, 12.5);
      return { fajr: { ms: r.fajr }, isha: { ms: r.isha } };
    },
  },
  'ES-CCIM': {
    lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid', years: ['2026'],
    fajrMargin: 1, ishaMargin: 1, rounding: 'down', asrSchool: 'shafi',
    day: (d) => {
      const r = angleTargetPt(d, 40.4168, -3.7038, 18.25, 17);
      return { fajr: { ms: r.fajr }, isha: { ms: r.isha } };
    },
  },
  'IT-UCOII': {
    lat: 41.9028, lon: 12.4964, tz: 'Europe/Rome', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: null,
    day: (d) => {
      const r = angleTargetPt(d, 41.9028, 12.4964, 18, 17);
      return { fajr: { ms: r.fajr }, isha: { ms: r.isha } };
    },
  },
  'EU-DIYANET-UNIFIED': {
    // Dispatch pins the point: Frankfurt 50.1109, 8.6821; civil zone Europe/Berlin.
    lat: 50.1109, lon: 8.6821, tz: 'Europe/Berlin', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: 'shafi',
    day: (d) => {
      // frozenLatitude45: fajr/isha angles rendered at latitude 45 with the city's own longitude;
      // the 80-minute plateau caps isha at city maghrib + 80.
      const st45 = solarTime(d, 45, 8.6821);
      const f45 = st45.hourAngle(-18, false);
      const i45 = st45.hourAngle(-16, true);
      const maghribCity = instant(solarTime(d, 50.1109, 8.6821).sunset, d).getTime();
      const out = { fajr: {}, isha: {} };
      out.fajr = isNaN(f45) ? { skip: 'frozen-45 render NaN' } : { ms: instant(f45, d).getTime() };
      if (isNaN(i45)) out.isha = { skip: 'frozen-45 render NaN' };
      else out.isha = { ms: Math.min(instant(i45, d).getTime(), maghribCity + 80 * MIN * 1000) };
      return out;
    },
  },
  'RU-DUMRT': {
    lat: 55.7963, lon: 49.1088, tz: 'Europe/Moscow', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, roundingFajr: 'down', roundingIsha: 'up', asrSchool: 'hanafi',
    day: (d) => {
      // 18/15; on days the sun never reaches 18 deg: fajr = sunrise-120, isha = sunset+90 on the
      // same astronomical window entered one day earlier (policy-layer substitutes).
      const st = solarTime(d, 55.7963, 49.1088);
      const f18 = st.hourAngle(-18, false);
      const sunrise = instant(st.sunrise, d).getTime();
      const sunset = instant(st.sunset, d).getTime();
      const f18prev = solarTime(prevCivilDay(d), 55.7963, 49.1088).hourAngle(-18, false);
      const out = { fajr: {}, isha: {} };
      out.fajr = isNaN(f18)
        ? { ms: sunrise - 120 * MIN * 1000 }
        : { ms: instant(f18, d).getTime() };
      if (isNaN(f18prev)) out.isha = { ms: sunset + 90 * MIN * 1000 };
      else {
        const i15 = st.hourAngle(-15, true);
        out.isha = isNaN(i15)
          ? { skip: '15 deg unreachable outside substitute window' }
          : { ms: instant(i15, d).getTime() };
      }
      return out;
    },
  },
  'RU-DUMRF-MOSCOW': {
    lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow', years: ['2026'],
    fajrMargin: 0, ishaMargin: 0, rounding: 'nearest', asrSchool: 'shafi',
    day: (d) => {
      // Fajr: calendar window 04-23..08-21, fajr = min(18 deg render, sunrise - 0.2955 N)
      // with N from published maghrib (+5) to published shuruq (-5) closing it.
      // Isha: 15 deg outside 04-23..08-17; the summer window is served-not-modelled -> skip.
      const k = civilKey(d);
      const st = solarTime(d, 55.7558, 37.6173);
      const sunriseRaw = instant(st.sunrise, d).getTime();
      const sunsetRaw = instant(st.sunset, d).getTime();
      const tm = nextCivilDay(d);
      const shuruqTomorrow = instant(solarTime(tm, 55.7558, 37.6173).sunrise, tm).getTime();
      const shuruqPub = epochMin(shuruqTomorrow, 'nearest') - 5;
      const maghribPub = epochMin(sunsetRaw, 'nearest') + 5;
      const nightMinutes = shuruqPub - maghribPub;
      const inWindow = k >= '2026-04-23' && k <= '2026-08-21';
      const out = { fajr: {}, isha: {} };
      const f18 = st.hourAngle(-18, false);
      const portion = sunriseRaw - 0.2955 * nightMinutes * MIN * 1000;
      if (inWindow) {
        out.fajr = isNaN(f18) ? { ms: portion } : { ms: Math.min(instant(f18, d).getTime(), portion) };
      } else {
        out.fajr = isNaN(f18) ? { skip: '18 deg unreachable outside calendar window' } : { ms: instant(f18, d).getTime() };
      }
      if (k >= '2026-04-23' && k <= '2026-08-17') {
        out.isha = { skip: 'summer isha served-not-modelled (published values, no rule)' };
      } else {
        const i15 = st.hourAngle(-15, true);
        out.isha = isNaN(i15) ? { skip: '15 deg unreachable outside served window' } : { ms: instant(i15, d).getTime() };
      }
      return out;
    },
  },
};

const SKIPPED_TARGETS = [
  { id: 'BE-EMB', reason: 'frozenLatitude45 summer window: windowDates null on the record; target rule undecidable per day (world-table defect: window boundaries unmeasured, 25 in-window days print isha after midnight).' },
  { id: 'NO-RABITA', reason: 'reference coordinates not on record (policy point null; capture carries no coordinates).' },
  { id: 'NO-MAWAQEET', reason: 'reference coordinates not on record (policy point null; captures carry no coordinates).' },
  { id: 'EE-EIC', reason: 'reference coordinates not on record (policy point null; capture carries no coordinates).' },
  { id: 'SE-MOSQUE', reason: 'reference coordinates not on record (policy point null; capture carries no coordinates).' },
  { id: 'FI-PORTAL', reason: 'reference coordinates not on record (policy point null; capture carries no coordinates).' },
  { id: 'RU-CDUM', reason: 'reference coordinates not on record (21-city table, fit solved per-city positions, none carried; tz set spans multiple zones).' },
];

// ---------- London published minutes ----------

function loadLondonPublished() {
  const a = JSON.parse(fs.readFileSync(LONDON_2027, 'utf8'));
  const b = JSON.parse(fs.readFileSync(LONDON_TRUTH, 'utf8'));
  const toMin = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const map = new Map();
  for (const [k, row] of Object.entries(a)) map.set(k, { fajr: toMin(row.fajr), isha: toMin(row.isha) });
  for (const [k, row] of Object.entries(b)) map.set(k, { fajr: toMin(row.fajr), isha: toMin(row.isha) });
  return map;
}

// ---------- scoring ----------

function newCell() {
  return {
    fajr: { sum: 0, worst: 0, within2: 0, days: 0, skips: new Map() },
    isha: { sum: 0, worst: 0, within2: 0, days: 0, skips: new Map() },
  };
}

function runTarget(id) {
  const t = TARGETS[id];
  if (!t) throw new Error(`unknown target ${id}`);
  if (!process.env.TZ) throw new Error('TZ env must be set per the brief');

  const published = t.published ? loadLondonPublished() : null;
  if (t.published) {
    let expected = 0;
    for (const y of t.years) {
      const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      expected += leap ? 366 : 365;
    }
    if (published.size !== expected) throw new Error(`London data ${published.size} days, expected ${expected}`);
    const first = '2027-01-01', last = '2038-12-31';
    let count = 0;
    for (const k of civilDays(first, last)) { if (!published.has(civilKey(k))) throw new Error(`missing London day ${civilKey(k)}`); count++; }
    if (count !== expected) throw new Error(`civil span ${count} != ${expected}`);
  }

  const cells = new Map();
  for (const m of METHODS) cells.set(m.id, newCell());

  for (const year of t.years) {
    const startKey = `${year}-01-01`, endKey = `${year}-12-31`;
    for (const d of civilDays(startKey, endKey)) {
      const k = civilKey(d);
      const tv = t.published
        ? { fajr: { min: published.get(k).fajr }, isha: { min: published.get(k).isha } }
        : (() => {
            const r = t.day(d);
            const rf = t.roundingFajr || t.rounding;
            const ri = t.roundingIsha || t.rounding;
            return {
              fajr: r.fajr.skip ? { skip: r.fajr.skip } : { min: wallMinute(epochMin(r.fajr.ms + t.fajrMargin * MIN * 1000, rf), t.tz) },
              isha: r.isha.skip ? { skip: r.isha.skip } : { min: wallMinute(epochMin(r.isha.ms + t.ishaMargin * MIN * 1000, ri), t.tz) },
            };
          })();
      for (const m of METHODS) {
        const raw = methodRaw(m.id, d, t.lat, t.lon);
        const cell = cells.get(m.id);
        for (const prayer of ['fajr', 'isha']) {
          const side = tv[prayer];
          const agg = cell[prayer];
          if (side.skip) {
            agg.skips.set(side.skip, (agg.skips.get(side.skip) || 0) + 1);
            continue;
          }
          const mm = wallMinute(epochMin(raw[prayer] * 1000, m.rounding), t.tz);
          let dev = Math.abs(mm - side.min);
          if (dev > 720) dev = 1440 - dev;
          agg.sum += dev;
          agg.days += 1;
          if (dev > agg.worst) agg.worst = dev;
          if (dev <= 2) agg.within2 += 1;
        }
      }
    }
  }

  const out = {
    id,
    lat: t.lat, lon: t.lon, tz: t.tz,
    years: t.years,
    publishedTarget: !!t.published,
    asrSchoolTarget: t.asrSchool,
    asrSchoolMethod: 'shafi',
    methods: {},
  };
  for (const m of METHODS) {
    const c = cells.get(m.id);
    out.methods[m.id] = {};
    for (const prayer of ['fajr', 'isha']) {
      const a = c[prayer];
      out.methods[m.id][prayer] = {
        mean: a.days ? +(a.sum / a.days).toFixed(4) : null,
        worst: a.days ? a.worst : null,
        within2Pct: a.days ? +((100 * a.within2) / a.days).toFixed(2) : null,
        scoredDays: a.days,
        skips: Object.fromEntries([...a.skips.entries()].map(([r, n]) => [r, n])),
      };
    }
  }
  return out;
}

// ---------- driver ----------

function aggregate() {
  const partsDir = path.join(OUT_DIR, 'parts');
  const scored = {};
  for (const id of Object.keys(TARGETS)) {
    scored[id] = JSON.parse(fs.readFileSync(path.join(partsDir, `${id}.json`), 'utf8'));
  }
  const results = {
    schema: 'o1h-verify-slice-b/1',
    generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    engine: 'adhan-js 4.4.6, Rounding.None + explicit rounding, TZ per invocation',
    methods: METHODS.map((m) => m.id),
    decisions: [
      'Method side naked: adhan presets verbatim (including their own methodAdjustments and the Singapore preset Rounding.Up); bodies without presets constructed as Other from the documented pair only.',
      'Diyanet-Domestic keeps the preset temkin (sunrise -7, dhuhr +5, asr +4, maghrib +7); no other method receives margins (brief rule; ECFR gets its naked 18/17 pair, no +-2).',
      'Umm al-Qura: isha interval 120 only on 2026-02-18..2026-03-19 (30-day Ramadan per the brief), 90 otherwise; on London 2027-2038 the 90-only library preset stands because no approved input pins Ramadan windows for those years.',
      'Rounding: Rounding.None in-engine, then explicit - nearest (half-up) for methods except singapore-muis (up, the preset rounding); targets use their policy rounding, null -> nearest.',
      'Wall-clock minutes compared in the target tz; all slice zones carry whole-minute offsets so epoch-minute rounding equals wall-minute rounding.',
      'GB-LONDON-INTERVAL-TABLE scored against the real published minutes (2027.json + truth-2028-2038.json), 4383 days verified contiguous.',
      'GB-WIFAQUL-ULAMA target: adhan Custom 18/15 with nightPortions overridden to fajr 1/2, isha 1/7 (the policy recipe verbatim).',
      'IS-FELAG target: raw fitted angles 14.2/14; polar days where the sun never reaches the angle are skipped (target displaySuppress; never invent a value).',
      'EU-DIYANET-UNIFIED target: fajr/isha rendered at frozen latitude 45 with Frankfurt longitude (Europe/Berlin); isha capped at city maghrib + 80 min (the recorded plateau).',
      'RU-DUMRT target: 18/15, fajr floor / isha ceil; astronomical 18-deg window: fajr = sunrise-120, isha = sunset+90 from one day earlier (policy substitutes).',
      'RU-DUMRF-MOSCOW target: fajr window 04-23..08-21 = min(18 deg, sunrise - 0.2955 x night), night from published maghrib(+5) to published shuruq(-5); isha 15 deg outside 04-23..08-17, summer window skipped as served-not-modelled.',
      'Null target margins read as no margin (0); null target rounding read as nearest.',
      'Deviation is circular wall-clock distance over 1440 minutes: fallback isha renders that cross midnight (e.g. adhan half-night at 51.5N midsummer) compare against same-day published isha by their true time gap.',
      'RU-DUMRT: this engine places the astronomical 18-deg window at Kazan on 2026-05-06..2026-08-07 (94 days); the record names 6 May-8 Aug 2026, 95 days - one boundary day of difference, substitute arithmetic unchanged.',
      'IS-FELAG scored on every day the fitted angle exists (241 fajr / 243 isha days); the census stable window is 182 days and its dates are not on record, so scored days may exceed the fitted window - logged, not trimmed.',
    ],
    skippedTargets: SKIPPED_TARGETS,
    targets: scored,
    sliceSummary: buildSliceSummary(scored),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(results, null, 1) + '\n');
  return results;
}

function buildSliceSummary(scored) {
  const summary = {};
  for (const m of METHODS) {
    const row = { fajr: [], isha: [] };
    for (const id of Object.keys(scored)) {
      for (const prayer of ['fajr', 'isha']) {
        const c = scored[id].methods[m.id][prayer];
        if (c.mean !== null) row[prayer].push({ target: id, mean: c.mean, days: c.scoredDays });
      }
    }
    for (const prayer of ['fajr', 'isha']) {
      const items = row[prayer];
      const totalDays = items.reduce((s, x) => s + x.days, 0);
      const weighted = items.reduce((s, x) => s + x.mean * x.days, 0) / (totalDays || 1);
      summary[m.id] = summary[m.id] || {};
      summary[m.id][prayer] = {
        meanAcrossSlice: +weighted.toFixed(4),
        totalDays,
        targetsScored: items.length,
        worstCell: items.slice().sort((a, b) => b.mean - a.mean)[0] || null,
      };
    }
  }
  return summary;
}

function writeReport(results) {
  const s = results.sliceSummary;
  const L = [];
  L.push('# O1h verify slice-b report (Europe + Russia)');
  L.push('');
  L.push('Independent recompute: 21 methods x 16 scored targets, 2026 (GB-LONDON-INTERVAL-TABLE against real published minutes 2027-2038, 4383 days). Engine: adhan-js 4.4.6, Rounding.None then explicit rounding, TZ per invocation. 7 of 23 dispatched targets skipped with reasons (below).');
  L.push('');
  L.push('## Per-method mean |deviation| (minutes), day-weighted across the slice');
  L.push('');
  L.push('| method | fajr mean | isha mean | targets scored |');
  L.push('|---|---|---|---|');
  const ranked = METHODS.map((m) => m.id).sort((a, b) => s[a].fajr.meanAcrossSlice + s[a].isha.meanAcrossSlice - (s[b].fajr.meanAcrossSlice + s[b].isha.meanAcrossSlice));
  for (const id of ranked) {
    L.push(`| ${id} | ${s[id].fajr.meanAcrossSlice} | ${s[id].isha.meanAcrossSlice} | ${s[id].fajr.targetsScored} |`);
  }
  L.push('');
  L.push('## Per-target method ranking (fajr mean |dev| minutes)');
  L.push('');
  for (const id of Object.keys(results.targets)) {
    const t = results.targets[id];
    const rows = METHODS.map((m) => m.id).map((mid) => ({ mid, f: t.methods[mid].fajr, i: t.methods[mid].isha }))
      .sort((a, b) => a.f.mean - b.f.mean);
    L.push(`### ${id} (${t.lat}, ${t.lon}, ${t.tz}, ${t.years.join('/')}, asr ${t.asrSchoolTarget ?? 'uncharacterised'})`);
    L.push('');
    L.push('| method | fajr mean | fajr worst | fajr within2% | isha mean | isha worst | isha within2% |');
    L.push('|---|---|---|---|---|---|---|');
    for (const r of rows) {
      L.push(`| ${r.mid} | ${r.f.mean} | ${r.f.worst} | ${r.f.within2Pct} | ${r.i.mean} | ${r.i.worst} | ${r.i.within2Pct} |`);
    }
    const skipLines = new Set();
    for (const mid of Object.keys(t.methods)) {
      for (const prayer of ['fajr', 'isha']) {
        for (const [reason, n] of Object.entries(t.methods[mid][prayer].skips)) skipLines.add(`${prayer}: ${reason} (${n} days, all methods)`);
      }
    }
    for (const line of skipLines) L.push(`- skip: ${line}`);
    L.push('');
  }
  L.push('## Skipped targets');
  L.push('');
  for (const sk of results.skippedTargets) L.push(`- ${sk.id}: ${sk.reason}`);
  L.push('');
  L.push('## Decisions (full list in results.json)');
  L.push('');
  for (const d of results.decisions) L.push(`- ${d}`);
  L.push('');
  fs.writeFileSync(path.join(OUT_DIR, 'SLICE-B-REPORT.md'), L.join('\n') + '\n');
}

const mode = process.argv[2] || '--all';
fs.mkdirSync(path.join(OUT_DIR, 'parts'), { recursive: true });

if (mode === '--target') {
  const id = process.argv[3];
  const t0 = Date.now();
  const r = runTarget(id);
  fs.writeFileSync(path.join(OUT_DIR, 'parts', `${id}.json`), JSON.stringify(r, null, 1) + '\n');
  console.error(`${id} done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} else if (mode === '--all') {
  const t0 = Date.now();
  for (const id of Object.keys(TARGETS)) {
    const tz = TARGETS[id].tz;
    const res = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--target', id], {
      env: { ...process.env, TZ: tz },
      encoding: 'utf8',
    });
    if (res.status !== 0) {
      console.error(`${id} FAILED (TZ=${tz}):\n${res.stderr}`);
      process.exit(1);
    }
    process.stdout.write(res.stderr);
  }
  const results = aggregate();
  writeReport(results);
  console.error(`all targets done in ${((Date.now() - t0) / 1000).toFixed(1)}s; results.json + SLICE-B-REPORT.md written`);
}
