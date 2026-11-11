// O1h slice C (Asia): independent recompute grid.
// 21 methods x 13 scoreable targets x fajr/isha x 365 days of 2026.
// Usage:
//   TZ=<iana> node grid.mjs compute <TARGETID>            -> parts/<TARGETID>.json
//   TZ=<iana> node grid.mjs compute MY-JAKIM <ZONECODE>   -> parts/MY-JAKIM__<ZONE>.json
//   node grid.mjs merge                                   -> results.json
// Runs naked method side vs target recipes exactly as carried (see META.interpretations).

import * as adhan from 'adhan';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PARTS = join(HERE, 'parts');
mkdirSync(PARTS, { recursive: true });

const YEAR = 2026;
const RAMADAN_START = '2026-02-18';
const RAMADAN_END = '2026-03-19';

// ---------- rounding helpers (all take wall-clock minutes as a real number) ----------
const RND = {
  nearest: (m) => Math.floor(m + 0.5),
  up: (m) => Math.ceil(m),
  down: (m) => Math.floor(m),
};

function wallMinutes(date, tz, fmt) {
  const p = fmt.formatToParts(date);
  let h = 0, m = 0, s = 0, day = 0, month = 0;
  for (const x of p) {
    if (x.type === 'hour') h = +x.value;
    else if (x.type === 'minute') m = +x.value;
    else if (x.type === 'second') s = +x.value;
    else if (x.type === 'day') day = +x.value;
    else if (x.type === 'month') month = +x.value;
  }
  // day-of-year of the wall date, for midnight-crossing-normalised comparisons
  const doy = Math.round((Date.UTC(2026, month - 1, day) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  return { min: h * 60 + m + s / 60, day, month, hour: h, doy };
}

// signed deviation in minutes between two wall-clock readings, normalised across
// midnight (an isha landing at 00:xx on the next wall date is +NN after 23:xx, not -23h)
function devMinutes(m, t) {
  return (m.doy - t.doy) * 1440 + (m.min - t.min);
}

function isRamadanDay(y, m, d) {
  const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return key >= RAMADAN_START && key <= RAMADAN_END;
}

// ---------- method side (naked) ----------
// rounding: null = use library default (nearest) applied manually; string = manual mode.
// adjustments: minutes the METHOD itself carries (Diyanet temkin via preset methodAdjustments,
// JAKIM ihtiyati, Umm al-Qura +1) - applied by the library to the raw instant before we round.
const METHODS = [
  { id: 'mwl', asr: 'shafi', mk: () => adhan.CalculationMethod.MuslimWorldLeague(), round: 'nearest' },
  { id: 'isna', asr: 'shafi', mk: () => adhan.CalculationMethod.NorthAmerica(), round: 'nearest' },
  {
    id: 'umm-al-qura', asr: 'shafi',
    mk: (date) => {
      const p = adhan.CalculationMethod.UmmAlQura();
      p.ishaInterval = isRamadanDay(date.getFullYear(), date.getMonth() + 1, date.getDate()) ? 120 : 90;
      p.adjustments.fajr = 1; p.adjustments.sunrise = 0; p.adjustments.dhuhr = 1;
      p.adjustments.asr = 1; p.adjustments.maghrib = 1; p.adjustments.isha = 1;
      return p;
    },
    // body form floor(raw + 1): the +1 travels in adjustments, so the manual step is plain floor
    round: 'down',
  },
  { id: 'egyptian', asr: 'shafi', mk: () => adhan.CalculationMethod.Egyptian(), round: 'nearest' },
  { id: 'karachi', asr: 'shafi', mk: () => adhan.CalculationMethod.Karachi(), round: 'nearest' },
  { id: 'moonsighting', asr: 'shafi', mk: () => adhan.CalculationMethod.MoonsightingCommittee(), round: 'nearest' },
  { id: 'diyanet-domestic', asr: 'shafi', mk: () => adhan.CalculationMethod.Turkey(), round: 'nearest' },
  { id: 'diyanet-europe', asr: 'shafi', mk: () => new adhan.CalculationParameters('Other', 18, 16), round: 'nearest' },
  { id: 'mabims', asr: 'shafi', mk: () => new adhan.CalculationParameters('Other', 20, 18), round: 'nearest' },
  {
    id: 'jakim', asr: 'shafi',
    mk: () => {
      const p = new adhan.CalculationParameters('Other', 18, 18);
      p.adjustments.fajr = 2; p.adjustments.sunrise = -1; p.adjustments.dhuhr = 1.5;
      p.adjustments.asr = 2; p.adjustments.maghrib = 0; p.adjustments.isha = 2;
      return p;
    },
    round: 'up',
  },
  { id: 'kemenag', asr: 'shafi', mk: () => new adhan.CalculationParameters('Other', 20, 18), round: 'nearest' },
  {
    id: 'kuwait', asr: 'shafi', mk: () => adhan.CalculationMethod.Kuwait(),
    round: null, perPrayer: { fajr: 'down', isha: 'nearest' },
  },
  { id: 'qatar', asr: 'shafi', mk: () => adhan.CalculationMethod.Qatar(), round: 'nearest' },
  { id: 'singapore-muis', asr: 'shafi', mk: () => adhan.CalculationMethod.Singapore(), round: 'up' },
  { id: 'dubai', asr: 'shafi', mk: () => adhan.CalculationMethod.Dubai(), round: 'nearest' },
  { id: 'tehran', asr: 'shafi', mk: () => new adhan.CalculationParameters('Other', 17.7, 14), round: 'nearest' },
  { id: 'fazilet-a', asr: 'shafi', mk: () => new adhan.CalculationParameters('Other', 19.8, 17.8), round: 'nearest' },
  { id: 'fazilet-b', asr: 'shafi', mk: () => new adhan.CalculationParameters('Other', 20.8, 18.7), round: 'nearest' },
  { id: 'ecfr', asr: 'shafi', mk: () => new adhan.CalculationParameters('Other', 18, 17), round: 'nearest' },
  { id: 'russia-sam', asr: 'shafi', mk: () => new adhan.CalculationParameters('Other', 16, 15), round: 'nearest' },
  { id: 'isna-2010', asr: 'shafi', mk: () => new adhan.CalculationParameters('Other', 18, 18), round: 'nearest' },
];

// ---------- target side (the reference recipes, exactly as carried) ----------
// round: null -> harness nearest default (CONSTRAINTS 4). margin null -> 0.
// isha kinds: 'angle' (library computes it), 'sunsetInterval' (+N from raw sunset),
// 'twilightRatio' (KG formula from displayed values).
const TARGETS = {
  'KZ-MUFTIYAT': {
    lat: 51.1605, lon: 71.4704, tz: 'Asia/Almaty', asr: 'hanafi',
    fajrAngle: 15, ishaAngle: 15,
    fajrMargin: 0, ishaMargin: 0,
    roundFajr: 'nearest', roundIsha: 'nearest',
    ishaKind: 'angle',
    highLatRule: adhan.HighLatitudeRule.TwilightAngle,
    marginsSetB: { sunrise: -5, dhuhr: 5, asr: 5, maghrib: 5 },
  },
  'KG-MUFTIYAT': {
    lat: 42.8746, lon: 74.5698, tz: 'Asia/Bishkek', asr: 'hanafi',
    fajrAngle: 18, ishaAngle: 18,
    fajrMargin: 0,
    roundFajr: 'down',
    ishaKind: 'twilightRatio',
    ratio: 0.7778, ratioConst: 3.5, maghribMargin: 7,
  },
  'UZ-ISLOM': {
    lat: 41.300872, lon: 69.241813, tz: 'Asia/Tashkent', asr: 'hanafi',
    fajrAngle: 15.5, ishaAngle: 15.5,
    fajrMargin: 0, ishaMargin: 0,
    roundFajr: null, roundIsha: null,
    ishaKind: 'angle',
  },
  'BD-IFB': {
    lat: 23.8103, lon: 90.4125, tz: 'Asia/Dhaka', asr: 'hanafi',
    fajrAngle: 19.25, ishaAngle: 18.65,
    fajrMargin: 8, ishaMargin: -1,
    roundFajr: 'nearest', roundIsha: 'nearest',
    ishaKind: 'angle',
  },
  'LK-ACJU': {
    lat: 6.9271, lon: 79.8612, tz: 'Asia/Colombo', asr: 'shafi',
    fajrAngle: 19.75, ishaAngle: 18.2,
    fajrMargin: 0, ishaMargin: 0,
    roundFajr: null, roundIsha: null,
    ishaKind: 'angle',
  },
  'MV-MUIS': {
    lat: 4.1755, lon: 73.5093, tz: 'Indian/Maldives', asr: 'shafi',
    fajrAngle: 20, ishaAngle: 18,
    fajrMargin: 5, ishaMargin: 4,
    roundFajr: null, roundIsha: null,
    ishaKind: 'angle',
  },
  'TH-CICOT': {
    lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok', asr: 'shafi',
    fajrAngle: 19.8, ishaAngle: 18.1,
    fajrMargin: 0, ishaMargin: 0,
    roundFajr: null, roundIsha: null,
    ishaKind: 'angle',
  },
  'SG-MUIS': {
    lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore', asr: 'shafi',
    fajrAngle: 20, ishaAngle: 18,
    fajrMargin: 1, ishaMargin: 1,
    roundFajr: 'up', roundIsha: 'up',
    ishaKind: 'angle',
  },
  'HK-MASJIDAL': {
    lat: 22.2988, lon: 114.1722, tz: 'Asia/Hong_Kong', asr: 'shafi',
    fajrAngle: 18.4,
    fajrMargin: 0,
    roundFajr: 'down',
    ishaKind: 'sunsetInterval', intervalMinutes: 83, roundIsha: 'nearest',
  },
  'ID-KEMENAG': {
    lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta', asr: 'shafi',
    fajrAngle: 20, ishaAngle: 18,
    fajrMargin: 0, ishaMargin: 0,
    roundFajr: null, roundIsha: null,
    ishaKind: 'angle',
  },
  'PK-DEFACTO': {
    lat: 24.86, lon: 67.01, tz: 'Asia/Karachi', asr: 'hanafi',
    fajrAngle: 18, ishaAngle: 18,
    fajrMargin: 0, ishaMargin: 0,
    roundFajr: null, roundIsha: null,
    ishaKind: 'angle',
  },
  'IN-DEFACTO': {
    lat: 28.61, lon: 77.21, tz: 'Asia/Kolkata', asr: 'hanafi',
    fajrAngle: 18, ishaAngle: 18,
    fajrMargin: 0, ishaMargin: 0,
    roundFajr: null, roundIsha: null,
    ishaKind: 'angle',
  },
};

// MY-JAKIM: policy-layer zone table; only zones carrying a reference point are scored,
// each at its own point with its own overrides; country cell pools the daily deviations.
const MY_ZONES = [
  { code: 'WLY01', lat: 3.139, lon: 101.6869, ishaAngle: 18 },
  { code: 'KTN01', lat: 6.1254, lon: 102.2381, ishaAngle: 17 },
  { code: 'PLS01', lat: 6.4414, lon: 100.1986, ishaAngle: 18 },
];
const MY_BASE = {
  tz: 'Asia/Kuala_Lumpur', asr: 'shafi',
  fajrAngle: 18, fajrMargin: 2, roundFajr: 'up',
  ishaMargin: 2, roundIsha: 'up', ishaKind: 'angle',
};

function targetParams(t, ishaAngle) {
  const p = new adhan.CalculationParameters('Other', t.fajrAngle, ishaAngle !== undefined ? ishaAngle : (t.ishaAngle || 0));
  p.madhab = t.asr === 'hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  if (t.highLatRule) p.highLatitudeRule = t.highLatRule;
  if (t.marginsSetB) {
    p.adjustments.sunrise = t.marginsSetB.sunrise;
    p.adjustments.dhuhr = t.marginsSetB.dhuhr;
    p.adjustments.asr = t.marginsSetB.asr;
    p.adjustments.maghrib = t.marginsSetB.maghrib;
  }
  p.rounding = adhan.Rounding.None;
  return p;
}

function computeDays(t, lat, lon, ishaAngle, targetName) {
  const coords = new adhan.Coordinates(lat, lon);
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: t.tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const days = [];
  for (let d = new Date(Date.UTC(YEAR, 0, 1)); d.getUTCFullYear() === YEAR; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))) {
    const local = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const p = new adhan.PrayerTimes(coords, local, targetParams(t, ishaAngle));
    const fajrRaw = wallMinutes(p.fajr, t.tz, fmt);
    const sunriseRaw = wallMinutes(p.sunrise, t.tz, fmt);
    const sunsetRaw = wallMinutes(p.sunset, t.tz, fmt);
    const ishaRaw = wallMinutes(p.isha, t.tz, fmt);
    const localDoy = Math.round((Date.UTC(2026, local.getMonth(), local.getDate()) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
    for (const [name, w] of [['fajr', fajrRaw], ['isha', ishaRaw]]) {
      if (w.doy !== localDoy) throw new Error(`${targetName}: target ${name} crosses midnight on ${local.toDateString()}`);
    }
    days.push({ local, fajrRaw, sunriseRaw, sunsetRaw, ishaRaw });
  }
  return days;
}

function applyRecipe(t, days) {
  const out = { fajr: [], isha: [] };
  const rf = RND[t.roundFajr === null ? 'nearest' : t.roundFajr];
  for (const { fajrRaw, sunriseRaw, sunsetRaw, ishaRaw, local } of days) {
    out.fajr.push(rf(fajrRaw.min + (t.fajrMargin || 0)));
    let isha;
    if (t.ishaKind === 'angle') {
      const ri = RND[t.roundIsha === null ? 'nearest' : t.roundIsha];
      isha = ri(ishaRaw.min + (t.ishaMargin || 0));
    } else if (t.ishaKind === 'sunsetInterval') {
      isha = RND[t.roundIsha](sunsetRaw.min + t.intervalMinutes);
    } else if (t.ishaKind === 'twilightRatio') {
      // Only the magnitude reading (sunrise - fajr, positive minutes) is consistent with the
      // recorded fit (MAE 0.487, 359/365 within-1): the literal text reading gives isha BEFORE
      // maghrib all year, which no published table does. Flagged in META.interpretations.
      const fajrDisp = Math.floor(fajrRaw.min);
      const sunriseDisp = RND.nearest(sunriseRaw.min);
      const maghribDisp = RND.nearest(sunsetRaw.min + t.maghribMargin);
      isha = maghribDisp + RND.nearest(t.ratio * (sunriseDisp - fajrDisp) + t.ratioConst);
    }
    out.isha.push(isha);
  }
  return out;
}

function methodMinutes(mdef, coords, days, tz, fmt) {
  const out = { fajr: [], isha: [] };
  for (const { local } of days) {
    const params = mdef.mk(local);
    params.rounding = adhan.Rounding.None;
    const p = new adhan.PrayerTimes(coords, local, params);
    let f = wallMinutes(p.fajr, tz, fmt);
    let i = wallMinutes(p.isha, tz, fmt);
    if (Number.isNaN(f.min) || Number.isNaN(i.min)) throw new Error(`NaN method time ${mdef.id} ${local.toISOString()}`);
    const rf = mdef.round === null ? RND[mdef.perPrayer.fajr] : RND[mdef.round];
    const ri = mdef.round === null ? RND[mdef.perPrayer.isha] : RND[mdef.round];
    out.fajr.push({ min: rf(f.min), doy: f.doy });
    out.isha.push({ min: ri(i.min), doy: i.doy });
  }
  return out;
}

function stats(devsByPrayer) {
  const prayers = {};
  for (const prayer of ['fajr', 'isha']) {
    const arr = devsByPrayer[prayer];
    const n = arr.length;
    let sumAbs = 0, sumSigned = 0, worst = 0, within2 = 0;
    for (const dev of arr) {
      const abs = Math.abs(dev);
      sumAbs += abs; sumSigned += dev;
      if (abs > worst) worst = abs;
      if (abs <= 2) within2++;
    }
    prayers[prayer] = {
      meanAbs: +(sumAbs / n).toFixed(3),
      worstAbs: +worst.toFixed(3),
      within2Pct: +((within2 / n) * 100).toFixed(2),
      meanSigned: +(sumSigned / n).toFixed(3),
      nDays: n,
    };
  }
  return prayers;
}

async function main() {
  const mode = process.argv[2];
  if (mode === 'merge') return merge();
  if (mode !== 'compute') throw new Error('usage: compute <TARGET> [ZONE] | merge');
  const targetId = process.argv[3];
  const zone = process.argv[4];

  const fmtCache = new Map();
  const getFmt = (tz) => {
    if (!fmtCache.has(tz)) {
      fmtCache.set(tz, new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }));
    }
    return fmtCache.get(tz);
  };

  if (targetId === 'MY-JAKIM') {
    const z = MY_ZONES.find((x) => x.code === zone);
    if (!z) throw new Error('zone required: ' + MY_ZONES.map((x) => x.code).join(','));
    const t = { ...MY_BASE };
    const days = computeDays(t, z.lat, z.lon, z.ishaAngle, `MY-JAKIM/${z.code}`);
    const tgt = applyRecipe(t, days);
    const coords = new adhan.Coordinates(z.lat, z.lon);
    const fmt = getFmt(t.tz);
    const cells = {};
    const devs = {};
    for (const mdef of METHODS) {
      const mins = methodMinutes(mdef, coords, days, t.tz, fmt);
      const d = {
        fajr: mins.fajr.map((v, k) => devMinutes(v, { min: tgt.fajr[k], doy: k + 1 })),
        isha: mins.isha.map((v, k) => devMinutes(v, { min: tgt.isha[k], doy: k + 1 })),
      };
      cells[mdef.id] = stats(d);
      cells[mdef.id].asrSchoolMatch = mdef.asr === t.asr;
      devs[mdef.id] = d;
    }
    writeFileSync(join(PARTS, `MY-JAKIM__${z.code}.json`), JSON.stringify({ target: 'MY-JAKIM', zone: z, cells, dailyDeviations: devs }, null, 1));
    console.log(`wrote MY-JAKIM__${z.code}.json (${days.length} days)`);
    return;
  }

  const t = TARGETS[targetId];
  if (!t) throw new Error('unknown target ' + targetId);
  const days = computeDays(t, t.lat, t.lon, undefined, targetId);
  const tgt = applyRecipe(t, days);
  const coords = new adhan.Coordinates(t.lat, t.lon);
  const fmt = getFmt(t.tz);
  const cells = {};
  const devs = {};
  for (const mdef of METHODS) {
    const mins = methodMinutes(mdef, coords, days, t.tz, fmt);
    const d = {
      fajr: mins.fajr.map((v, k) => devMinutes(v, { min: tgt.fajr[k], doy: k + 1 })),
      isha: mins.isha.map((v, k) => devMinutes(v, { min: tgt.isha[k], doy: k + 1 })),
    };
    cells[mdef.id] = stats(d);
    cells[mdef.id].asrSchoolMatch = mdef.asr === t.asr;
    devs[mdef.id] = d;
  }
  const payload = { target: targetId, recipe: { ...t, highLatRule: t.highLatRule || null, marginsSetB: t.marginsSetB || null }, targetMinutes: tgt, cells, dailyDeviations: devs };
  writeFileSync(join(PARTS, `${targetId}.json`), JSON.stringify(payload, null, 1));
  console.log(`wrote ${targetId}.json (${days.length} days)`);
}

const SKIPS = {
  'TJ-SHURO': 'Window-class source (world-table Tajikistan): the Shuroi Ulamo monthly table publishes WINDOWS not instants (fajr 05:31-07:00, isha crossing midnight), so no instant rule kind can express it; additionally unfitted - countries.json/policy-layer carry null angles, null coordinates, null asr and no rounding/margins. Dispatch says skip with reason; not invented.',
  'PH-NCMF': 'No parameters published (world-table Philippines: NCMF official Ramadhan calendar is 29 per-city JPEGs, "Recipe: none published"; Ramadan-only authority surface). countries.json/policy-layer carry null angles and null coordinates. Nothing to fit against; not invented.',
};

function merge() {
  const scoreable = Object.keys(TARGETS).concat(['MY-JAKIM']);
  const results = { meta: META(), skips: [], cells: {} };
  for (const [tid, reason] of Object.entries(SKIPS)) {
    results.skips.push({ target: tid, scope: 'country', reason });
    results.cells[tid] = {};
    for (const mdef of METHODS) {
      results.cells[tid][mdef.id] = {
        skipped: true, reason,
        fajr: null, isha: null, asrSchoolMatch: null,
      };
    }
  }

  for (const tid of scoreable) {
    if (tid === 'MY-JAKIM') {
      const zoneDevs = {};
      const perZone = {};
      for (const z of MY_ZONES) {
        const zp = JSON.parse(readFileSync(join(PARTS, `MY-JAKIM__${z.code}.json`), 'utf8'));
        zoneDevs[z.code] = zp.dailyDeviations;
        perZone[z.code] = zp.cells;
      }
      results.cells[tid] = poolZoneDevs(zoneDevs, perZone);
      results.targets_meta = results.targets_meta || {};
      results.targets_meta[tid] = {
        aggregation: 'country cell = stats over the pooled daily deviations of the 3 policy-layer zones with reference points (WLY01, KTN01 isha 17deg, PLS01); SGR01 and the unnamed 5th swept zone carry no point and are excluded',
        perZoneCells: perZone,
      };
      continue;
    }
    const path = join(PARTS, `${tid}.json`);
    if (!existsSync(path)) throw new Error(`missing part ${path} - compute all targets first`);
    const part = JSON.parse(readFileSync(path, 'utf8'));
    results.cells[tid] = part.cells;
  }
  writeFileSync(join(HERE, 'results.json'), JSON.stringify(results, null, 1));
  console.log('wrote results.json');
}

function poolZoneDevs(zoneDevs, perZone) {
  const pooled = {};
  for (const mdef of METHODS) {
    const id = mdef.id;
    pooled[id] = {};
    for (const prayer of ['fajr', 'isha']) {
      let n = 0, sumAbs = 0, sumSigned = 0, worst = 0, within2 = 0;
      for (const zc of Object.keys(zoneDevs)) {
        for (const dev of zoneDevs[zc][id][prayer]) {
          const abs = Math.abs(dev);
          n++; sumAbs += abs; sumSigned += dev;
          if (abs > worst) worst = abs;
          if (abs <= 2) within2++;
        }
      }
      pooled[id][prayer] = {
        meanAbs: +(sumAbs / n).toFixed(3),
        worstAbs: +worst.toFixed(3),
        within2Pct: +((within2 / n) * 100).toFixed(2),
        meanSigned: +(sumSigned / n).toFixed(3),
        nDays: n,
      };
    }
    pooled[id].asrSchoolMatch = perZone[MY_ZONES[0].code][id].asrSchoolMatch;
    pooled[id].note = 'pooled over zones ' + Object.keys(zoneDevs).join(',');
  }
  return pooled;
}

function META() {
  return {
    slice: 'C (Asia)',
    year: 2026,
    days: 365,
    library: 'adhan-js 4.4.6',
    node: process.version,
    ramadanWindow: `${RAMADAN_START}..${RAMADAN_END}`,
    ramadanMonthLengthDays: 30,
    interpretations: INTERPRETATIONS,
  };
}

const INTERPRETATIONS = [
  'Method side naked: the 11 library presets (MWL, NorthAmerica, UmmAlQura, Egyptian, Karachi, MoonsightingCommittee, Turkey, Kuwait, Qatar, Singapore, Dubai) run verbatim; rounding is applied manually at second resolution (params.rounding=None) so every method is rounded by the same code path.',
  'Umm al-Qura runs the methods.json body form: fajr 18.5 +1 floor(raw+1); isha interval 90 (120 inside Ramadan) +1 floor(raw+1). Brief window 2026-02-18..2026-03-19 = 30 days. The +1 travels as a library adjustment; the manual step is floor.',
  'Singapore runs preset angles 20/18 with ceiling and NO +1 margins: the census +1s are target-side (constraint 1). Library dhuhr +1 kept but not scored.',
  'Constructed Other methods per the brief pair list, nearest rounding, zero margins, library-default high-latitude rule (middle-of-the-night): mabims 20/18, kemenag=mabims, diyanet-europe 18/16, ecfr 18/17 (the resolution +-2 margins NOT applied - brief constructs from the pair only; sensitivity noted in the report), russia-sam 16/15, fazilet-a 19.8/17.8 effective, fazilet-b 20.8/18.7 effective, isna-2010 18/18.',
  'Tehran (unlisted in both brief lists) = methods.json pair 17.7/14 via Other, nearest; the library Tehran preset differs only in the maghrib angle, which is unscored.',
  'JAKIM (unlisted in both brief lists) = methods.json body form: 18/18 with its own +2 ihtiyati on fajr/isha and ceiling rounding - the ihtiyati is JAKIM stock practice (same principle as the Diyanet temkin).',
  'Kuwait body rounding per methods.json notes (body-measured): fajr floor, isha nearest.',
  'MoonsightingCommittee runs the library transcription incl. season curves, shafaq general, later-of/earlier-of combine, seventh-of-night only from 55 degrees.',
  'Targets: angles/margins/rounding/high-latitude/asr exactly as carried by countries.json + policy-layer.v2.4.json. Null rounding -> harness nearest (constraint 4); null margins -> 0. Up = mathematical ceiling (an instant landing exactly on a minute stays).',
  'KZ target high-latitude = policy-layer twilightAngleClamp 0.25/0.25 == adhan TwilightAngle nightPortions (angle/60) with angles 15/15; margins set B (Astana 51.16 >= 48).',
  'KG target isha twilightRatio from DISPLAYED values, ratio 0.7778 as carried. SIGN RULING: the world-table text writes round(7/9 x (fajr - sunrise) + 3.5); taken literally that puts isha BEFORE maghrib all year (fajr is always before sunrise), which no published table does and which contradicts the recorded fit (MAE 0.487, Bishkek 359/365 within-1). The fit can only reproduce published isha with the magnitude reading, so the grid runs isha = maghrib_disp + round(0.7778 x (sunrise_disp - fajr_disp) + 3.5), i.e. r x the dawn duration before sunrise. maghrib_disp = nearest(sunset + 7); fajr_disp = floor(raw 18); sunrise_disp = nearest (rounding null -> harness nearest).',
  'HK target isha = nearest(sunset + 83) per world-table special form (countries.json carries kind interval with no minute value; the world table documents sunset+83, angle refuted).',
  'MY-JAKIM has no single national point (zone table, countries.json lat/lon null, brief fallback names only JAMIAT-KZN and EU-DIYANET-UNIFIED). Scored from the policy-layer zones that carry reference points: WLY01 (KL/Putrajaya), KTN01 (isha 17 per zone override), PLS01; country cell = pooled daily deviations across the three zones; per-zone cells included for the diff.',
  'UZ-ISLOM display margins (+5/Ishroq +20/Shom +4) are not documented for fajr/isha; the object carries 0/0 and that is what runs.',
  'LK-ACJU storey-band display corrections (-1/-2 fajr, +1/+2 maghrib/isha, band boundaries unstated) are not carried by the object; the object margins 0/0 run.',
  'Asr: school-match flag only (all 21 methods shafi; targets KZ KG UZ BD PK IN hanafi, the rest shafi).',
  'Midnight normalisation: signed deviations compare instants, not minute-of-day. Where a naked method pushes isha past midnight (the library middle-of-the-night rule at KZ in summer does exactly that), the wall date difference contributes +-1440 so a next-day 00:xx isha reads as +NN minutes after a 23:xx target, never as -23 hours. Target-side instants are asserted same-day in this slice (assert in computeDays).',
];

main().catch((e) => { console.error(e); process.exit(1); });
