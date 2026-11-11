// O1l-A1 algorithm-vs-timetable scoring, adhan 4.4.6, TZ pinned, dates from literal strings.
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');
const ONLY = process.argv[2] || 'all';

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function hmsToDate(y, m, d) { return new Date(y, m - 1, d, 0, 0, 0); }
function secOfDay(dt) { return dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds(); }
function tableSec(s) { const [h, m] = s.split(':').map(Number); return (h * 60 + m) * 60; }
function midTableSec(s) { const [h, m] = s.split(':').map(Number); return ((h * 60 + m) * 60 + 30); }

function score(rows, field, calc, label) {
  let n = 0, rSum = 0, worst = 0, worstDate = '', sums = {}, counts = { winter: 0, summer: 0 };
  const resids = [];
  const ex = { nearest: 0, ceil: 0, floor: 0 };
  for (const [date, row] of Object.entries(rows)) {
    if (!(field in row)) continue;
    const [y, m, d] = date.split('-').map(Number);
    const t = tableSec(row[field]);
    const c = calc(y, m, d);
    const r = t - c; // table minus computed, seconds
    n++; rSum += r; resids.push(r);
    if (Math.abs(r) > Math.abs(worst)) { worst = r; worstDate = date; }
    const month = m;
    const key = (month <= 2 || month === 12) ? 'winter' : (month >= 6 && month <= 8) ? 'summer' : 'mid';
    sums[key] = (sums[key] || 0) + r; counts[key]++;
    const tm = t / 60;
    ex.nearest += (Math.round(c / 60) === Math.round(tm)) ? 1 : 0;
    ex.ceil += (Math.ceil(c / 60) === Math.round(tm)) ? 1 : 0;
    ex.floor += (Math.floor(c / 60) === Math.round(tm)) ? 1 : 0;
  }
  const mean = rSum / n;
  const within1 = resids.filter(r => Math.abs(r) <= 60).length;
  const out = {
    label, field, n,
    mean_min: +(mean / 60).toFixed(2),
    within1: `${within1}/${n}`,
    worst_min: +(worst / 60).toFixed(2), worstDate,
    exact_nearest: `${ex.nearest}/${n}`,
    exact_ceil: `${ex.ceil}/${n}`,
    exact_floor: `${ex.floor}/${n}`,
  };
  for (const k of ['winter', 'summer', 'mid']) if (counts[k]) out['mean_' + k] = +(sums[k] / counts[k] / 60).toFixed(2);
  return out;
}

function paramsFor(lat, lon, fajrAngle, ishaAngle, madhab, adjustments) {
  const p = adhan.CalculationMethod.MuslimWorldLeague();
  p.fajrAngle = fajrAngle;
  if (ishaAngle != null) { p.ishaAngle = ishaAngle; p.ishaInterval = 0; }
  p.madhab = madhab;
  p.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle;
  p.rounding = adhan.Rounding.None;
  if (adjustments) p.adjustments = adjustments;
  return { p, coords: new adhan.Coordinates(lat, lon) };
}

// ---- 1. Montenegro: IZCG-declared 19.5/17.5 Shafi, Podgorica anchor ----
const me = readJSON(process.env.HOME + '/athan-gitree/census/o1k-wide/balkans2/data/me_grp-1_vaktijame_2026.json');
if (ONLY === 'all' || ONLY === 'me') {
  const { p, coords } = paramsFor(42.4410, 19.2630, 19.5, 17.5, adhan.Madhab.Shafi);
  const fields = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
  const out = [];
  for (const [tf, cf] of Object.entries(fields)) {
    out.push(score(me, tf, (y, m, d) => secOfDay(new adhan.PrayerTimes(coords, hmsToDate(y, m, d), p)[cf]), 'ME declared 19.5/17.5 Shafi @Podgorica'));
  }
  console.log('== MONTENEGRO =='); console.log(JSON.stringify(out, null, 1));
}

// ---- 2. Bahrain: council statement, two-site rule ----
const bh = readJSON(process.env.HOME + '/athan-gitree/census/o1k-wide/gulf2/data/bh-bahrain-calendar-1448.json');
if (ONLY === 'all' || ONLY === 'bh') {
  const salman = { lat: 26.22, lon: 50.44 }, dilmunia = { lat: 26.27, lon: 50.68 };
  const out = [];
  // dhuhr: transit +1 (declared), at Salman
  {
    const { p, coords } = paramsFor(salman.lat, salman.lon, 18.5, 18.0, adhan.Madhab.Shafi, { fajr: 0, sunrise: 0, dhuhr: 1, asr: 0, maghrib: 0, isha: 0 });
    out.push(score(bh, 'dhuhr', (y, m, d) => secOfDay(new adhan.PrayerTimes(coords, hmsToDate(y, m, d), p).dhuhr), 'BH declared dhuhr transit+1 @Salman'));
  }
  // isha: declared true 18 deg, at Salman
  {
    const { p, coords } = paramsFor(salman.lat, salman.lon, 18.5, 18.0, adhan.Madhab.Shafi);
    out.push(score(bh, 'isha', (y, m, d) => secOfDay(new adhan.PrayerTimes(coords, hmsToDate(y, m, d), p).isha), 'BH declared isha 18deg @Salman'));
  }
  // maghrib: declared geometry (sunset), at Salman
  {
    const { p, coords } = paramsFor(salman.lat, salman.lon, 18.5, 18.0, adhan.Madhab.Shafi);
    out.push(score(bh, 'magrib', (y, m, d) => secOfDay(new adhan.PrayerTimes(coords, hmsToDate(y, m, d), p).maghrib), 'BH declared maghrib sunset @Salman'));
  }
  // sunrise: site declared (Dilmunia), angle default horizon
  {
    const { p, coords } = paramsFor(dilmunia.lat, dilmunia.lon, 18.5, 18.0, adhan.Madhab.Shafi);
    out.push(score(bh, 'sunrise', (y, m, d) => secOfDay(new adhan.PrayerTimes(coords, hmsToDate(y, m, d), p).sunrise), 'BH sunrise @Dilmunia (site declared, no margin stated)'));
  }
  console.log('== BAHRAIN =='); console.log(JSON.stringify(out, null, 1));
}

// ---- 3. Direction probes ----
if (ONLY === 'all' || ONLY === 'probe') {
function pairProbe(name, lat, lon, tzLabel, y, m, d, degA, degB) {
  const lines = [];
  for (const deg of [degA, degB]) {
    const { p, coords } = paramsFor(lat, lon, deg, deg, adhan.Madhab.Shafi);
    const pt = new adhan.PrayerTimes(coords, hmsToDate(y, m, d), p);
    const f = secOfDay(pt.fajr) / 60, i = secOfDay(pt.isha) / 60;
    lines.push(`${deg}deg ${y}-${m}-${d}: fajr ${(f / 60).toFixed(2)}h isha ${(i / 60).toFixed(2)}h`);
  }
  console.log(`== ${name} (${tzLabel}) ==\n` + lines.join('\n'));
}
pairProbe('TORONTO 13-vs-15', 43.6532, -79.3832, 'America/Toronto', 2026, 6, 1, 13, 15);
pairProbe('TORONTO 13-vs-15 winter', 43.6532, -79.3832, 'America/Toronto', 2026, 12, 1, 13, 15);
pairProbe('BERLIN isha 17-vs-16 winter', 52.5200, 13.4050, 'Europe/Berlin', 2026, 1, 15, 17, 16);
pairProbe('BERLIN isha 17-vs-16 summer', 52.5200, 13.4050, 'Europe/Berlin', 2026, 6, 21, 17, 16);
pairProbe('STOCKHOLM isha 17-vs-16 winter', 59.3293, 18.0686, 'Europe/Stockholm', 2026, 1, 15, 17, 16);
}
