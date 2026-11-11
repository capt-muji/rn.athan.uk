// Masjidal sample fit v2: solve geometry from the table's own solar columns, measure the
// recipe (fajr angle, isha angle or interval, asr school), then score that recipe with
// adhan 4.4.6 at zero margins and at the measured per-column margins.
//
// Usage: node fit2.js <id> <tz>   (reads captures/masjidal_<id>_<year>.json, 2024..2026)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { solarDay, hourAngle } from './solar.js';

const require = createRequire(import.meta.url);
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js');

const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const SIN_HORIZON = Math.sin(-0.833 * RAD);
const rad = (d) => d * RAD, deg = (r) => r * DEG;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] * 0.5 + s[Math.ceil((s.length - 1) / 2)] * 0.5 : null; };
const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);

const toMin = (s) => {
  if (!s) return null;
  const t = String(s).trim().toUpperCase().replace(/\s+/g, '');
  let m = /^(\d{1,2}):(\d{2})(AM|PM)$/.exec(t);
  if (m) { let h = Number(m[1]) % 12; if (m[3] === 'PM') h += 12; return h * 60 + Number(m[2]); }
  m = /^(\d{1,2}):(\d{2})(:\d{2})?$/.exec(t);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return null;
};

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

function load(id, year, tz) {
  const j = JSON.parse(readFileSync(`captures/masjidal_${id}_${year}.json`, 'utf8'));
  const rows = (j.data && j.data.salah) || [];
  const days = [];
  for (const r of rows) {
    const dt = new Date(r.date.replace(/^[A-Za-z]+,\s*/, '') + ' 12:00:00Z');
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    const fajr = toMin(r.fajr), sr = toMin(r.sunrise), dhuhr = toMin(r.zuhr), asr = toMin(r.asr), mg = toMin(r.maghrib);
    let isha = toMin(r.isha);
    if ([fajr, sr, dhuhr, asr, mg, isha].some((v) => v === null)) continue;
    if (isha < mg) isha += 1440;
    const { dec, eotMin } = solarDay(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
    days.push({ key, month: dt.getUTCMonth() + 1, dec, eotMin, fajr, sr, dhuhr, asr, mg, isha, tzMin: tzOffsetMin(tz, key) });
  }
  return { days, raw: rows.length };
}

function fitSolarGeo(days) {
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
  for (let k = 0; k <= 8; k++) for (let lat = -66; lat <= 66; lat += 0.25) {
    const s = score(lat, k);
    if (!best || s.resid < best.s.resid) best = { lat, k, s };
  }
  for (let lat = best.lat - 0.3; lat <= best.lat + 0.3 + 1e-9; lat += 0.01) {
    const s = score(lat, best.k);
    if (s.resid < best.s.resid) { best.lat = lat; best.s = s; }
  }
  return { lat: +best.lat.toFixed(3), lon: +best.s.lon.toFixed(3), k: best.k, resid: +best.s.resid.toFixed(3) };
}

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

function measureAngle(lat, days, gapFn) {
  const series = [];
  for (const d of days) {
    const gap = gapFn(d);
    const a = impliedAngle(lat, d.dec, gap);
    if (a !== null) series.push({ month: d.month, alpha: a, gap });
  }
  if (series.length < 150) return { kind: 'unmeasurable', n: series.length };
  const alphas = series.map((x) => x.alpha).sort((a, b) => a - b);
  const gaps = series.map((x) => x.gap).sort((a, b) => a - b);
  const iqrGap = gaps[Math.floor(gaps.length * 0.75)] - gaps[Math.floor(gaps.length * 0.25)];
  const dark = lat >= 0 ? [11, 12, 1, 2] : [5, 6, 7, 8];
  const darkAlphas = series.filter((x) => dark.includes(x.month)).map((x) => x.alpha).sort((a, b) => a - b);
  const darkIqr = darkAlphas[Math.floor(darkAlphas.length * 0.75)] - darkAlphas[Math.floor(darkAlphas.length * 0.25)];
  const kind = darkIqr > 0.6 && iqrGap <= 0.75 ? 'interval' : 'angle';
  return { kind, n: series.length, angle: +median(alphas).toFixed(2), darkIqr: +darkIqr.toFixed(2), iqrGap: +iqrGap.toFixed(2), gapMedian: +median(gaps).toFixed(1) };
}

function fmtMin(date, tz) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const [h, mi, s] = fmt.format(date).split(':').map(Number);
  let v = h * 60 + mi + (s >= 30 ? 1 : 0);
  if (v >= 1440) v -= 1440;
  return v;
}

// Score the measured recipe with adhan at the given margins.
function scoreRecipe(days, lat, lon, tz, fajrAngle, ishaAngle, ishaInterval, hanafi, margins) {
  const coords = new adhan.Coordinates(lat, lon);
  const p = new adhan.CalculationParameters('ISNA', fajrAngle, ishaInterval === null ? ishaAngle : 18);
  if (ishaInterval !== null) p.methodAdjustments = { ...p.methodAdjustments, isha: ishaInterval - Math.round(0) };
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  if (hanafi) p.madhab = adhan.Madhab.Hanafi;
  const cols = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const per = Object.fromEntries(cols.map((c) => [c, { n: 0, w1: 0, exact: 0, worst: 0, diffs: [] }]));
  let joint = 0;
  for (const d of days) {
    const [Y, M, D] = d.key.split('-').map(Number);
    const pt = new adhan.PrayerTimes(coords, new Date(Date.UTC(Y, M - 1, D, 12)), p);
    let calc = { fajr: fmtMin(pt.fajr, tz), sunrise: fmtMin(pt.sunrise, tz), dhuhr: fmtMin(pt.dhuhr, tz), asr: fmtMin(pt.asr, tz), maghrib: fmtMin(pt.maghrib, tz), isha: fmtMin(pt.isha, tz) };
    if (ishaInterval !== null) {
      // interval recipes are counted from the printed maghrib, not from adhan's sunset
      calc = { ...calc, isha: ((calc.maghrib + ishaInterval) % 1440 + 1440) % 1440 };
    }
    const got = { fajr: d.fajr, sunrise: d.sr, dhuhr: d.dhuhr, asr: d.asr, maghrib: d.mg, isha: d.isha % 1440 };
    let all = true;
    for (const c of cols) {
      let diff = got[c] - calc[c] - (margins[c] || 0);
      if (diff > 720) diff -= 1440;
      if (diff < -720) diff += 1440;
      const pc = per[c];
      pc.n++; pc.diffs.push(diff);
      if (diff === 0) pc.exact++; else all = false;
      if (Math.abs(diff) <= 1) pc.w1++;
      if (Math.abs(diff) > Math.abs(pc.worst)) pc.worst = diff;
    }
    if (all) joint++;
  }
  const out = { days: days.length, joint };
  for (const c of cols) {
    const pc = per[c];
    out[c] = { exactPct: +((100 * pc.exact) / pc.n).toFixed(1), w1Pct: +((100 * pc.w1) / pc.n).toFixed(1), worst: pc.worst, medDiff: +median(pc.diffs).toFixed(1) };
  }
  return out;
}

function marginsOf(days, lat, lon, tz, fajrAngle, ishaAngle, ishaInterval, hanafi) {
  const s = scoreRecipe(days, lat, lon, tz, fajrAngle, ishaAngle, ishaInterval, hanafi, {});
  return Object.fromEntries(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((c) => [c, Math.round(s[c].medDiff)]));
}

const id = process.argv[2], tz = process.argv[3];
mkdirSync('out', { recursive: true });
const years = [2026, 2025, 2024];
const result = { id, tz, years: {} };
let ref = null;
for (const y of years) {
  let loaded;
  try { loaded = load(id, y, tz); } catch { continue; }
  if (!loaded.days.length) { result.years[y] = { rows: 0 }; continue; }
  const g = fitSolarGeo(loaded.days);
  const fajr = measureAngle(g.lat, loaded.days, (d) => d.sr - d.fajr);
  const isha = measureAngle(g.lat, loaded.days, (d) => d.isha - (d.mg - g.k));
  const gap = median(loaded.days.map((d) => d.isha - d.mg));
  const hanafi = (() => {
    const coords = new adhan.Coordinates(g.lat, g.lon);
    let s1 = 0, s2 = 0;
    for (const d of loaded.days) {
      const [Y, M, D] = d.key.split('-').map(Number);
      const p1 = new adhan.CalculationParameters('ISNA', 15, 15);
      const p2 = new adhan.CalculationParameters('ISNA', 15, 15); p2.madhab = adhan.Madhab.Hanafi;
      const dt = new Date(Date.UTC(Y, M - 1, D, 12));
      s1 += Math.abs(d.asr - fmtMin(new adhan.PrayerTimes(coords, dt, p1).asr, tz));
      s2 += Math.abs(d.asr - fmtMin(new adhan.PrayerTimes(coords, dt, p2).asr, tz));
    }
    return s2 < s1 * 0.5;
  })();
  const ishaInterval = isha.kind === 'interval' ? Math.round(gap) : null;
  const margins = marginsOf(loaded.days, g.lat, g.lon, tz, fajr.angle, isha.angle, ishaInterval, hanafi);
  const zero = scoreRecipe(loaded.days, g.lat, g.lon, tz, fajr.angle, isha.angle, ishaInterval, hanafi, {});
  const withMargins = scoreRecipe(loaded.days, g.lat, g.lon, tz, fajr.angle, isha.angle, ishaInterval, hanafi, margins);
  const janF = loaded.days.filter((d) => d.month === 1).map((d) => d.fajr);
  const julF = loaded.days.filter((d) => d.month === 7).map((d) => d.fajr);
  result.years[y] = {
    rows: loaded.raw, parsed: loaded.days.length, geo: g,
    fajr: { kind: fajr.kind, angle: fajr.angle }, isha: { kind: isha.kind, angle: isha.angle, interval: ishaInterval, gap: +gap.toFixed(1) },
    asr: hanafi ? 'Hanafi' : 'Shafi', margins, zero, withMargins,
    amplitudeFajrJanJul: janF.length && julF.length ? +(median(julF) - median(janF)).toFixed(0) : null,
  };
  if (!ref) ref = { lat: g.lat, lon: g.lon };
}
writeFileSync(`out/f2_${id}.json`, JSON.stringify(result, null, 1));
const ys = years.filter((y) => result.years[y].parsed);
const p = result.years[ys[0]];
const fspread = Math.max(...ys.map((y) => result.years[y].fajr.angle)) - Math.min(...ys.map((y) => result.years[y].fajr.angle));
const ispread = Math.max(...ys.map((y) => result.years[y].isha.angle)) - Math.min(...ys.map((y) => result.years[y].isha.angle));
const line = [
  id, tz, ys.join('/'),
  `${p.geo.lat},${p.geo.lon}`, `rms${p.geo.resid}`,
  `${p.fajr.kind} ${ys.map((y) => result.years[y].fajr.angle).join('/')}`,
  `${p.isha.kind} ${ys.map((y) => result.years[y].isha.angle).join('/')}${p.isha.interval !== null ? ` int${p.isha.interval}` : ''}`,
  p.asr,
  `margins ${['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((c) => c[0] + p.margins[c]).join(' ')}`,
  `zero w1 ${['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((c) => p.zero[c].w1Pct).join('/')}`,
  `marg w1 ${['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((c) => p.withMargins[c].w1Pct).join('/')}`,
  `worst ${Math.max(...['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((c) => Math.abs(p.withMargins[c].worst)))}`,
  `amp ${p.amplitudeFajrJanJul}`,
  `spread f${fspread.toFixed(2)} i${ispread.toFixed(2)}`,
].join('\t');
console.log(line);
