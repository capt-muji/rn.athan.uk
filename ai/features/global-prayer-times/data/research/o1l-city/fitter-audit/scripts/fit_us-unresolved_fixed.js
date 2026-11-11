// O1l us-states fit engine.
// Fit lat/lon/maghrib-caution from the capture's own solar columns, measure the
// implied fajr/isha depression angles, test plain adhan ISNA 15/15 at round-to-minute,
// classify asr school, detect DST blocks, and emit per-year scores.
//
// Usage: node fit_masjidal.js <id> <tz>
//   reads captures/masjidal_<id>_<year>.json for year in 2026 2025 2024

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { solarDay, hourAngle, asrAltitude } from './solar.js';
const require = createRequire(import.meta.url);
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js');

const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const SIN_HORIZON = Math.sin(-0.833 * Math.PI / 180);
const rad = (d) => d * RAD, deg = (r) => r * DEG;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] * 0.5 + s[Math.ceil((s.length - 1) / 2)] * 0.5 : null; };
const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

const toMin = (s) => {
  if (!s) return null;
  const t = String(s).trim().toUpperCase().replace(/\s+/g, '');
  let m = /^(\d{1,2}):(\d{2})(AM|PM)$/.exec(t);
  if (m) { let h = Number(m[1]) % 12; if (m[3] === 'PM') h += 12; return h * 60 + Number(m[2]); }
  m = /^(\d{1,2}):(\d{2})(:\d{2})?$/.exec(t);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return null;
};

function loadMasjidal(id, year, tz) {
  const j = JSON.parse(readFileSync(`captures/masjidal_${id}_${year}.json`, 'utf8'));
  const rows = (j.data && j.data.salah) || [];
  const iq = (j.data && j.data.iqamah) || [];
  const days = [];
  for (const r of rows) {
    const dt = new Date(r.date.replace(/^[A-Za-z]+,\s*/, '') + ' 12:00:00Z');
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    const fajr = toMin(r.fajr), sr = toMin(r.sunrise), dhuhr = toMin(r.zuhr), asr = toMin(r.asr), mg = toMin(r.maghrib); let isha = toMin(r.isha);
    if ([fajr, sr, dhuhr, asr, mg, isha].some((v) => v === null)) continue;
    if (isha < mg) isha += 1440;
    const { dec, eotMin } = solarDay(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
    days.push({ key, month: dt.getUTCMonth() + 1, dec, eotMin, fajr, sr, dhuhr, asr, mg, isha, tzMin: tzOffsetMin(tz, key) });
  }
  return { days, iqRows: iq.length, raw: rows.length };
}

// Load a canonical rows file ({YYYY-MM-DD: {fajr, sunrise, dhuhr, asr, maghrib, isha}}).
function loadRows(path, tz) {
  const rows = JSON.parse(readFileSync(path, 'utf8'));
  const days = [];
  for (const [key, r] of Object.entries(rows)) {
    const [Y, M, D] = key.split('-').map(Number);
    const fajr = toMin(r.fajr), sr = toMin(r.sunrise), dhuhr = toMin(r.dhuhr), asr = toMin(r.asr), mg = toMin(r.maghrib); let isha = toMin(r.isha);
    if ([fajr, sr, dhuhr, asr, mg, isha].some((v) => v === null)) continue;
    if (isha < mg) isha += 1440;
    const { dec, eotMin } = solarDay(Y, M, D);
    days.push({ key, month: M, dec, eotMin, fajr, sr, dhuhr, asr, mg, isha, tzMin: tzOffsetMin(tz, key) });
  }
  return { days, iqRows: 0, raw: days.length };
}

const tzCache = new Map();
function tzOffsetMin(tz, key) {
  const k = tz + '|' + key;
  if (tzCache.has(k)) return tzCache.get(k);
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(key + 'T12:00:00Z')).map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  const off = Math.round((asUTC - new Date(key + 'T12:00:00Z').getTime()) / 60000);
  tzCache.set(k, off);
  return off;
}

// Joint fit: latitude + longitude + maghrib caution k from sunrise & maghrib curves.
function fitSolarGeo(days) {
  // noon_clock = 720 + tzMin - eotMin - lon*4; invert for lon from the (sr+mg-k)/2 midline.
  const lonOf = (d, kk) => (720 + d.tzMin - d.eotMin - (d.sr + d.mg - kk) / 2) / 4;
  const score = (lat, k) => {
    const lon = median(days.map((d) => lonOf(d, k)));
    const res = [];
    for (const d of days) {
      const n = 720 + d.tzMin - d.eotMin - lon * 4;
      const hs = hourAngle(-0.833, lat, d.dec);
      if (hs === null) continue;
      res.push(d.sr - (n - 4 * hs), d.mg - (n + 4 * hs + k));
    }
    const med = median(res);
    return { lon, resid: rms(res.map((x) => x - med)) };
  };
  let best = null;
  for (let k = 0; k <= 8; k++) {
    for (let lat = 18; lat <= 66; lat += 0.25) {
      const s = score(lat, k);
      if (!best || s.resid < best.s.resid) best = { lat, k, s };
    }
  }
  const b = best;
  for (let lat = b.lat - 0.3; lat <= b.lat + 0.3 + 1e-9; lat += 0.01) {
    const s = score(lat, b.k);
    if (s.resid < b.s.resid) { b.lat = lat; b.s = s; }
  }
  return { lat: +b.lat.toFixed(3), lon: +b.s.lon.toFixed(3), k: b.k, resid: +b.s.resid.toFixed(3) };
}

// Implied depression angle for one day's gap between column and horizon crossing.
function impliedAngle(lat, dec, gapMin) {
  const sinLat = Math.sin(rad(lat)), cosLat = Math.cos(rad(lat));
  const sdec = Math.sin(rad(dec)), cdec = Math.cos(rad(dec));
  const cosHsr = (SIN_HORIZON - sinLat * sdec) / (cosLat * cdec);
  if (cosHsr < -1 || cosHsr > 1) return null;
  const h = deg(Math.acos(cosHsr)) + gapMin / 4;
  if (h > 180) return null;
  const alpha = -deg(Math.asin(sinLat * sdec + cosLat * cdec * Math.cos(rad(h))));
  const sensitivity = 4 * Math.cos(rad(alpha)) / (cosLat * cdec * Math.sin(rad(h)));
  return sensitivity >= 1 ? alpha : null;
}

function gapAtAngle(lat, dec, alpha) {
  const sinLat = Math.sin(rad(lat)), cosLat = Math.cos(rad(lat));
  const sdec = Math.sin(rad(dec)), cdec = Math.cos(rad(dec));
  const cosHsr = (SIN_HORIZON - sinLat * sdec) / (cosLat * cdec);
  const cosH = (Math.sin(rad(-alpha)) - sinLat * sdec) / (cosLat * cdec);
  if (cosH < -1 || cosH > 1 || cosHsr < -1 || cosHsr > 1) return null;
  return 4 * (deg(Math.acos(cosH)) - deg(Math.acos(cosHsr)));
}

function measureAngle(lat, days, gapFn) {
  const series = [];
  for (const d of days) {
    const gap = gapFn(d);
    if (gap === null || gap === undefined) continue;
    const a = impliedAngle(lat, d.dec, gap);
    if (a !== null) series.push({ month: d.month, alpha: a, gap });
  }
  if (series.length < 150) return { kind: 'unmeasurable', n: series.length };
  const dark = lat >= 0 ? [11, 12, 1, 2] : [5, 6, 7, 8];
  const light = lat >= 0 ? [5, 6, 7] : [11, 12, 1];
  const alphas = series.map((x) => x.alpha).sort((a, b) => a - b);
  const gaps = series.map((x) => x.gap).sort((a, b) => a - b);
  const darkAlphas = series.filter((x) => dark.includes(x.month)).map((x) => x.alpha).sort((a, b) => a - b);
  const summer = median(series.filter((x) => light.includes(x.month)).map((x) => x.alpha));
  const angle = median(alphas);
  const winter = median(darkAlphas);
  const darkIqr = darkAlphas[Math.floor(darkAlphas.length * 0.75)] - darkAlphas[Math.floor(darkAlphas.length * 0.25)];
  const iqrGap = gaps[Math.floor(gaps.length * 0.75)] - gaps[Math.floor(gaps.length * 0.25)];
  const residuals = [];
  for (const x of series) {
    const pred = gapAtAngle(lat, x.dec, angle);
    if (pred !== null) residuals.push(x.gap - pred);
  }
  const residRms = residuals.length ? rms(residuals.map((x) => x - median(residuals))) : null;
  const darkResid = [];
  for (const x of series) {
    if (!dark.includes(x.month)) continue;
    const pred = gapAtAngle(lat, x.dec, angle);
    if (pred !== null) darkResid.push(x.gap - pred);
  }
  const darkRms = darkResid.length ? rms(darkResid.map((x) => x - median(darkResid))) : null;
  let kind = 'angle';
  if (darkIqr > 0.6 && iqrGap <= 0.75) kind = 'interval';
  return {
    kind, n: series.length, angle: +angle.toFixed(2), winter: +winter.toFixed(2), summer: +summer.toFixed(2),
    darkIqr: +darkIqr.toFixed(2), iqrGap: +iqrGap.toFixed(2),
    gapMedian: +median(gaps).toFixed(1), residRms: residRms === null ? null : +residRms.toFixed(2),
    darkRms: darkRms === null ? null : +darkRms.toFixed(2),
  };
}

// adhan 15/15 (or MWL 18/17) round-to-minute test at fitted coordinates.
function isnaTest(days, lat, lon, tz, maghribK, paramsName, params) {
  const coords = new adhan.Coordinates(lat, lon);
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const cols = { fajr: 15, isha: 15 };
  const perCol = {};
  const out = { days: 0, exact: 0, within1: 0, worst: {}, worstCol: null, exactCount: {}, asrHanafiBetter: null };
  for (const name of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) { perCol[name] = { n: 0, exact: 0, w1: 0, worst: 0 }; out.worst[name] = 0; }
  for (const d of days) {
    const [Y, M, D] = d.key.split('-').map(Number);
    const p = params;
    p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
    const pt = new adhan.PrayerTimes(coords, new Date(Date.UTC(Y, M - 1, D, 12)), p);
    // adhan needs local-date semantics; use the date parts via the tz-shifted UTC day
    const calc = {
      fajr: fmtMin(pt.fajr, tz, d.key), sunrise: fmtMin(pt.sunrise, tz, d.key),
      dhuhr: fmtMin(pt.dhuhr, tz, d.key), asr: fmtMin(pt.asr, tz, d.key),
      maghrib: fmtMin(pt.maghrib, tz, d.key), isha: fmtMin(pt.isha, tz, d.key),
    };
    out.days++;
    let allExact = true;
    for (const name of Object.keys(calc)) {
      let got = d[name];
      if (name === 'sunrise') { got = d.sr; }
      if (name === 'maghrib') { got = d.mg - maghribK; } // against solved sunset, the caution removed
      const c = calc[name];
      if (c === null) continue;
      let diff = got - c;
      if (name === 'isha' && diff < -720) diff += 1440;
      const pc = perCol[name];
      pc.n++;
      if (diff === 0) { pc.exact++; out.exactCount[name] = (out.exactCount[name] || 0) + 1; } else allExact = false;
      if (Math.abs(diff) <= 1) pc.w1++;
      if (Math.abs(diff) > Math.abs(pc.worst)) pc.worst = diff;
    }
    if (allExact) out.exact++;
  }
  for (const name of Object.keys(perCol)) {
    const pc = perCol[name];
    out[name] = pc.n ? { exact: pc.exact, exactPct: +((100 * pc.exact) / pc.n).toFixed(1), within1Pct: +((100 * pc.w1) / pc.n).toFixed(1), worst: pc.worst } : null;
  }
  delete out.exactCount;
  return out;
}

function fmtMin(date, tz, key) {
  // Format an adhan UTC instant into tz clock minutes for the calendar day of key.
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const [h, mi, s] = fmt.format(date).split(':').map(Number);
  let v = h * 60 + mi + (s >= 30 ? 1 : 0);
  // round-to-minute then wrap
  if (v >= 1440) v -= 1440;
  return v;
}

// asr school: compare adhan Shafi vs Hanafi against printed asr.
function asrSchool(days, lat, lon, tz) {
  const coords = new adhan.Coordinates(lat, lon);
  let s1 = 0, s2 = 0, n = 0;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  for (const d of days) {
    const [Y, M, D] = d.key.split('-').map(Number);
    const p = new adhan.CalculationParameters('ISNA', 15, 15);
    p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
    const sh = new adhan.PrayerTimes(coords, new Date(Date.UTC(Y, M - 1, D, 12)), p);
    const p2 = new adhan.CalculationParameters('ISNA', 15, 15);
    p2.madhab = adhan.Madhab.Hanafi;
    p2.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
    const ha = new adhan.PrayerTimes(coords, new Date(Date.UTC(Y, M - 1, D, 12)), p2);
    const a1 = fmtMin(sh.asr, tz, d.key), a2 = fmtMin(ha.asr, tz, d.key);
    s1 += Math.abs(d.asr - a1); s2 += Math.abs(d.asr - a2); n++;
  }
  return { shafiMae: +(s1 / n).toFixed(2), hanafiMae: +(s2 / n).toFixed(2), school: s2 < s1 * 0.5 ? 'Hanafi' : 'Shafi' };
}

// DST block detection from sunrise offsets.
function dstRuns(days, lat, lon, tz) {
  const coords = new adhan.Coordinates(lat, lon);
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
  const offs = [];
  for (const d of days) {
    const [Y, M, D] = d.key.split('-').map(Number);
    const p = new adhan.CalculationParameters('ISNA', 15, 15);
    p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
    const pt = new adhan.PrayerTimes(coords, new Date(Date.UTC(Y, M - 1, D, 12)), p);
    const sr = fmtMin(pt.sunrise, tz, d.key);
    offs.push({ key: d.key, off: d.sr - sr });
  }
  const runs = [];
  for (const o of offs) {
    const bucket = Math.round(o.off / 30) * 30;
    const last = runs[runs.length - 1];
    if (last && last.bucket === bucket) last.to = o.key;
    else runs.push({ from: o.key, to: o.key, bucket });
  }
  return runs.filter((r) => r.bucket !== 0 && r.from !== r.to);
}

const rawArg = process.argv[2] || '';
const ROWS = rawArg.startsWith('--rows=') ? rawArg.slice(7) : null;
const [id, tz] = ROWS ? [rawArg, process.argv[3]] : [rawArg, process.argv[3]];
mkdirSync('out', { recursive: true });
const years = [2026, 2025, 2024, 2023];
const result = { id, tz, years: {} };
let first = true;
let geo = null;
for (const y of years) {
  let loaded;
  try {
    loaded = ROWS ? loadRows(ROWS, tz) : loadMasjidal(id, y, tz);
  } catch (e) { console.error('LOADFAIL', y, e && e.message); continue; }
  if (!loaded.days.length) { result.years[y] = { rows: 0 }; continue; }
  if (ROWS) {
    const rowsYear = Number(loaded.days[0].key.slice(0, 4));
    if (rowsYear !== y) {
      const slice = loaded.days.filter((d) => Number(d.key.slice(0, 4)) === y);
      if (!slice.length) continue;
      loaded = { ...loaded, days: slice, raw: slice.length };
    }
  }
  const g = process.env.GEO ? (() => { const [la, lo] = process.env.GEO.split(',').map(Number); return { lat: la, lon: lo, k: Number(process.env.GEOK || 0), resid: 0 }; })() : fitSolarGeo(loaded.days);
  const fajr = measureAngle(g.lat, loaded.days, (d) => d.sr - d.fajr);
  const ishaSunset = measureAngle(g.lat, loaded.days, (d) => d.isha - (d.mg - g.k));
  const ishaGap = { med: +median(loaded.days.map((d) => d.isha - d.mg)).toFixed(1) };
  const mkParams = (paramsName, fajrAngle, ishaAngle) => new adhan.CalculationParameters(paramsName, fajrAngle, ishaAngle);
  const isna = isnaTest(loaded.days, g.lat, g.lon, tz, g.k, 'ISNA', mkParams('ISNA', 15, 15));
  const mwl = isnaTest(loaded.days, g.lat, g.lon, tz, g.k, 'MWL', mkParams('MWL', 18, 17));
  const asr = asrSchool(loaded.days, g.lat, g.lon, tz);
  const dst = dstRuns(loaded.days, g.lat, g.lon, tz);
  const janF = loaded.days.filter((d) => d.month === 1).map((d) => d.fajr);
  const julF = loaded.days.filter((d) => d.month === 7).map((d) => d.fajr);
  result.years[y] = {
    rows: loaded.raw, parsed: loaded.days.length, iqRows: loaded.iqRows,
    geo: g, fajrAngle: fajr, ishaAngleVsSunset: ishaSunset, ishaGapToMaghrib: ishaGap,
    isna, mwl, asr, dst, amplitudeFajrJanJul: janF.length && julF.length ? +(median(julF) - median(janF)).toFixed(0) : null,
    fajrJan: janF.length ? +median(janF).toFixed(0) : null, fajrJul: julF.length ? +median(julF).toFixed(0) : null,
  };
}
writeFileSync(`out/fit_${ROWS ? ROWS.replace(/[/.]/g, '_').replace(/^_data_/, '') : id}.json`, JSON.stringify(result, null, 1));
const y26 = result.years[2026] || {}, y25 = result.years[2025] || {}, y24 = result.years[2024] || {};
const pickFamily = (y) => {
  if (!y || !y.isna || !y.mwl) return null;
  const isnaScore = Math.abs(y.isna.fajr.worst) + Math.abs(y.isna.isha.worst) + (y.asr && y.asr.school === 'Hanafi' ? 80 : 0);
  const mwlScore = Math.abs(y.mwl.fajr.worst) + Math.abs(y.mwl.isha.worst) + (y.asr && y.asr.school === 'Hanafi' ? 80 : 0);
  return mwlScore < isnaScore ? 'mwl' : 'isna';
};
const fam26 = pickFamily(y26);
const fam = (y, f) => (y && y[f] ? y[f] : null);
const line = [
  id, tz,
  y26.geo ? `${y26.geo.lat},${y26.geo.lon},k${y26.geo.k},rms${y26.geo.resid}` : '',
  y26.fajrAngle ? `fajr ${y26.fajrAngle.kind} ${y26.fajrAngle.angle} (win ${y26.fajrAngle.winter})` : '',
  y26.ishaAngleVsSunset && y26.ishaAngleVsSunset.kind ? `isha ${y26.ishaAngleVsSunset.kind} ${y26.ishaAngleVsSunset.angle} (win ${y26.ishaAngleVsSunset.winter}, gap ${y26.ishaGapToMaghrib.med})` : '',
  y26.asr ? `asr ${y26.asr.school} (S ${y26.asr.shafiMae} H ${y26.asr.hanafiMae})` : '',
  ...(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((c) => {
    const t = fam(y26, fam26);
    return t && t[c] ? `${c}=${t[c].exactPct}/${t[c].worst}` : '';
  })),
  fam26 ? `fam26=${fam26}` : '',
  y25[fam26] ? `e25=${y25[fam26].exact}/${y25.isna.days}` : '',
  y24[fam26] ? `e24=${y24[fam26].exact}/${y24.isna.days}` : '',
  y26.dst && y26.dst.length ? `DST ${JSON.stringify(y26.dst)}` : 'DST none',
  y26.amplitudeFajrJanJul !== null ? `amp ${y26.fajrJan}->${y26.fajrJul}` : '',
].join('\t');
console.log(line);
