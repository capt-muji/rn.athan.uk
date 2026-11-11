// Claim 2: Muhammadiyah KHGT decade line, scored from the raw API captures.
// Rule under test: 18/18, ceil, +1 minute; fajr 7.8 min after Kemenag every year.
import fs from 'node:fs';
import path from 'node:path';
import { params, times, hm, MODES, median } from './lib.mjs';

const CAP = '$HOME/athan-gitree/census/o1k-wide/deep3/captures';
const ID = '$HOME/athan-gitree/census/o1k-wide/indonesia/data';

const CITIES = {
  jakarta: { lat: -6.2088, lng: 106.8456, tz: 'Asia/Jakarta' },
  jayapura: { lat: -2.5916, lng: 140.669, tz: 'Asia/Jayapura' },
  surabaya: { lat: -7.2575, lng: 112.7521, tz: 'Asia/Jakarta' },
};
const YEARS = [2025, 2027, 2029, 2031, 2033, 2035];
const MONTHS = ['01', '07'];
// the required re-score set: three years at two cities
const FOCUS = { years: [2025, 2031, 2035], cities: ['jakarta', 'jayapura'] };

const out = { source: 'deep3/captures/khgt-{city}-{year}-{01,07}.json (raw API payloads)', rule: '18/18', perCityYear: {}, feasibleMargin: {} };

function loadRaw(city, year, month) {
  const f = path.join(CAP, `khgt-${city}-${year}-${month}.json`);
  if (!fs.existsSync(f)) return null;
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!d.success || !d.data || !Array.isArray(d.data.schedules)) return null;
  return d.data.schedules.map(s => ({
    iso: s.date,
    printed: { fajr: hm(s.subuh), sunrise: hm(s.terbit), dhuhr: hm(s.dzuhur), asr: hm(s.ashar), maghrib: hm(s.maghrib), isha: hm(s.isya) },
    raw: s,
  }));
}

// feasible margin interval for ceil(c + m) == printed on every row: (printed-1-c, printed-c]
function marginInterval(rows, key, p) {
  let lower = -Infinity, upper = Infinity;
  let n = 0;
  for (const r of rows) {
    const printed = r.printed[key]; if (printed == null) continue;
    const c = times(CITIES[r.city].lat, CITIES[r.city].lng, r.iso, p, CITIES[r.city].tz)[key];
    if (c == null) continue;
    n++;
    lower = Math.max(lower, printed - 1 - c);
    upper = Math.min(upper, printed - c);
  }
  return { n, lower, upper, feasible: lower < upper, width: upper - lower, mid: (lower + upper) / 2 };
}

function scoreRows(rows, key, p, mode, margin) {
  let n = 0, exact = 0, w1 = 0, worst = 0, sum = 0, sumAbs = 0;
  for (const r of rows) {
    const printed = r.printed[key]; if (printed == null) continue;
    const c = times(CITIES[r.city].lat, CITIES[r.city].lng, r.iso, p, CITIES[r.city].tz)[key];
    if (c == null) continue;
    const v = MODES[mode](c + margin);
    const d = v - printed;
    n++; if (d === 0) exact++; if (Math.abs(d) <= 1) w1++;
    worst = Math.max(worst, Math.abs(d)); sum += d; sumAbs += Math.abs(d);
  }
  return { n, exact, w1, worst, mean: n ? sum / n : 0, mae: n ? sumAbs / n : 0 };
}

const p18 = params({ fajr: 18, isha: 18, madhab: 'shafi' });

// collect all raw rows
const all = {}; // city -> year -> rows[]
for (const city of Object.keys(CITIES)) {
  all[city] = {};
  for (const y of YEARS) {
    const rows = [];
    for (const m of MONTHS) {
      const rs = loadRaw(city, y, m);
      if (rs) for (const r of rs) { r.city = city; r.year = y; r.month = m; rows.push(r); }
    }
    if (rows.length) all[city][y] = rows.sort((a, b) => a.iso.localeCompare(b.iso));
  }
}

out.captureShape = Object.fromEntries(Object.entries(all).map(([c, ys]) => [c, Object.fromEntries(Object.entries(ys).map(([y, rows]) => [y, { rows: rows.length, first: rows[0].iso, last: rows[rows.length - 1].iso, elevation: rows[0].raw.meta.elevation }]))]));

// per city-year scoring with the claimed rule and the feasible margin
for (const city of Object.keys(all)) {
  out.perCityYear[city] = {};
  for (const [y, rows] of Object.entries(all[city])) {
    const fajr = scoreRows(rows, 'fajr', p18, 'ceil', 1);
    const isha = scoreRows(rows, 'isha', p18, 'ceil', 1);
    const fMi = marginInterval(rows, 'fajr', p18);
    const iMi = marginInterval(rows, 'isha', p18);
    const bestF = scoreRows(rows, 'fajr', p18, 'ceil', fMi.mid);
    const bestI = scoreRows(rows, 'isha', p18, 'ceil', iMi.mid);
    // other columns: which madhab and margins reproduce them
    const asrShafi = scoreRows(rows, 'asr', p18, 'nearest', 0);
    const asrHanafi = scoreRows(rows, 'asr', params({ fajr: 18, isha: 18, madhab: 'hanafi' }), 'nearest', 0);
    const dhuhr = scoreRows(rows, 'dhuhr', p18, 'nearest', 0);
    const maghrib = scoreRows(rows, 'maghrib', p18, 'nearest', 0);
    const sunrise = scoreRows(rows, 'sunrise', p18, 'nearest', 0);
    out.perCityYear[city][y] = {
      n: rows.length,
      fajrClaimed: fajr, ishaClaimed: isha,
      fajrBest: bestF, ishaBest: bestI,
      fajrMarginInterval: fMi, ishaMarginInterval: iMi,
      asr: { shafi: asrShafi, hanafi: asrHanafi },
      dhuhr, maghrib, sunrise,
    };
  }
}

// one constant margin across the whole decade? intersect the intervals
function intersect(key) {
  let lower = -Infinity, upper = Infinity, n = 0;
  for (const city of Object.keys(out.perCityYear)) for (const [y, v] of Object.entries(out.perCityYear[city])) {
    const mi = key === 'fajr' ? v.fajrMarginInterval : v.ishaMarginInterval;
    lower = Math.max(lower, mi.lower); upper = Math.min(upper, mi.upper); n += mi.n;
  }
  return { n, lower, upper, feasible: lower < upper, width: upper - lower, mid: (lower + upper) / 2 };
}
out.feasibleMargin.fajrDecade = intersect('fajr');
out.feasibleMargin.ishaDecade = intersect('isha');
out.feasibleMargin.focusSet = {};
for (const city of FOCUS.cities) {
  let lower = -Infinity, upper = Infinity, n = 0;
  for (const y of FOCUS.years) {
    const v = out.perCityYear[city][y];
    if (!v) continue;
    lower = Math.max(lower, v.fajrMarginInterval.lower); upper = Math.min(upper, v.fajrMarginInterval.upper); n += v.fajrMarginInterval.n;
  }
  out.feasibleMargin.focusSet[city] = { n, lower, upper, feasible: lower < upper, width: upper - lower, mid: (lower + upper) / 2 };
}

// --- fajr gap to Kemenag, per year, from the raw tables ---
// Kemenag SIHAT 2026 rows (same city, publisher's own coordinates), and KHGT 2026 raw payloads.
function loadSihat(name) {
  const f = path.join(ID, `sihat-2026-${name}.json`);
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { meta: { lat: d.lat, lng: d.lng }, rows: d.rows };
}
function loadKhgtDump(name) {
  const f = path.join(ID, `khgt-2026-${name}.json`);
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { meta: { lat: d.lat, lng: d.lng }, rows: d.rows };
}
const pairs = [['jakarta-pusat', 'jakarta'], ['jayapura', 'jayapura'], ['surabaya', 'surabaya'], ['makassar', 'makassar'], ['medan', 'medan']];
out.kemenagGap = {};
for (const [sihatName, khgtKey] of pairs) {
  let sihat, khgt2026;
  try { sihat = loadSihat(sihatName); khgt2026 = loadKhgtDump(sihatName); } catch { continue; }
  const gaps = [];
  for (const [iso, r] of Object.entries(khgt2026.rows)) {
    const k = hm(r.fajr), s = sihat.rows[iso] ? hm(sihat.rows[iso].fajr) : null;
    if (k != null && s != null) gaps.push(k - s);
  }
  // per decade year: compare KHGT (raw payloads, same city) against the 2026 Kemenag row on same MM-DD
  const byYear = {};
  for (const y of YEARS) {
    const rows = all[khgtKey] ? all[khgtKey][y] : null;
    if (!rows) continue;
    const g = [];
    for (const r of rows) {
      const mmdd = r.iso.slice(5);
      const srow = sihat.rows[`2026-${mmdd}`];
      if (!srow) continue;
      const s = hm(srow.fajr);
      if (s != null) g.push(r.printed.fajr - s);
    }
    byYear[y] = { n: g.length, mean: g.reduce((a, b) => a + b, 0) / (g.length || 1), median: median(g), min: Math.min(...g), max: Math.max(...g) };
  }
  out.kemenagGap[khgtKey] = {
    sihatCoords: sihat.meta, khgt2026Coords: khgt2026.meta,
    khgt2026Gap: { n: gaps.length, mean: gaps.reduce((a, b) => a + b, 0) / gaps.length, median: median(gaps), min: Math.min(...gaps), max: Math.max(...gaps) },
    byYearAgainstKemenag2026: byYear,
  };
}

// geometry-only gap: 18 deg vs Kemenag's 20 deg at one coordinate, same date, no table noise
{
  const p20 = params({ fajr: 20, isha: 18, madhab: 'shafi' });
  const g = [];
  for (const iso of ['2026-01-15', '2026-04-15', '2026-07-15', '2026-10-15']) {
    const a = times(-6.2088, 106.8456, iso, p18, 'Asia/Jakarta').fajr, b = times(-6.2088, 106.8456, iso, p20, 'Asia/Jakarta').fajr;
    g.push({ iso, gap: a - b });
  }
  out.geometryGap18v20 = g;
}

fs.writeFileSync(new URL('./khgt.json', import.meta.url), JSON.stringify(out, null, 1));
// compact console summary
const s = {};
for (const [city, ys] of Object.entries(out.perCityYear)) {
  s[city] = {};
  for (const [y, v] of Object.entries(ys)) s[city][y] = { n: v.n, fajr: v.fajrClaimed, isha: v.ishaClaimed, fajrMi: [v.fajrMarginInterval.lower.toFixed(3), v.fajrMarginInterval.upper.toFixed(3)], ishaMi: [v.ishaMarginInterval.lower.toFixed(3), v.ishaMarginInterval.upper.toFixed(3)], asr: v.asr.shafi.worst <= v.asr.hanafi.worst ? 'shafi' : 'hanafi' };
}
console.log(JSON.stringify({ s, decade: out.feasibleMargin, focus: out.feasibleMargin.focusSet, gap: out.kemenagGap, geom: out.geometryGap18v20 }, null, 1));
