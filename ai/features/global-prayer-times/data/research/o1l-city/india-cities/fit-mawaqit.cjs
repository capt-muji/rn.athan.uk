// Fit a mawaqit-style calendar (minute resolution) against adhan 4.4.6.
// TZ pinned before require so no host clock or zone leaks in.
process.env.TZ = 'Asia/Kolkata';
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = adhan;

const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const pad = n => String(n).padStart(2, '0');
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

function toRows(calendar, year) {
  const rows = {};
  calendar.forEach((month, mi) => {
    for (const [dayStr, vals] of Object.entries(month)) {
      const d = Number(dayStr);
      if (d > daysInMonth(year, mi + 1)) continue;
      const row = {};
      COLS.forEach((c, i) => { row[c] = vals[i]; });
      rows[`${year}-${pad(mi + 1)}-${pad(d)}`] = row;
    }
  });
  return rows;
}

function paramsFor(fajrAngle, ishaAngle, school, adj) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = school === 1 ? Madhab.Hanafi : Madhab.Shafi;
  p.rounding = Rounding.None;
  p.adjustments = Object.assign({ fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, adj || {});
  return p;
}

function compute(lat, lon, year, fajrAngle, ishaAngle, school, adj) {
  const c = new Coordinates(lat, lon);
  const p = paramsFor(fajrAngle, ishaAngle, school, adj);
  const out = {};
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= daysInMonth(year, m); d++) {
      const pt = new PrayerTimes(c, new Date(Date.UTC(year, m - 1, d, 12)), p);
      const row = {};
      for (const col of COLS) row[col] = `${pad(pt[col].getHours())}:${pad(pt[col].getMinutes())}`;
      out[`${year}-${pad(m)}-${pad(d)}`] = row;
    }
  }
  return out;
}

const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
function diff(a, b) { let d = toMin(a) - toMin(b); if (d > 720) d -= 1440; if (d < -720) d += 1440; return d; }
function median(a) { const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);

function residuals(rows, comp, col) {
  return Object.keys(rows).filter(k => comp[k]).map(k => diff(rows[k][col], comp[k][col]));
}

function score(rows, comp, col, shift = 0) {
  const ds = residuals(rows, comp, col).map(d => d - shift);
  const abs = ds.map(Math.abs);
  return {
    n: ds.length,
    exactPct: 100 * ds.filter(d => d === 0).length / (ds.length || 1),
    within1Pct: 100 * ds.filter(d => Math.abs(d) <= 1).length / (ds.length || 1),
    mae: mean(abs),
    worst: ds.reduce((w, d) => (Math.abs(d) > Math.abs(w) ? d : w), 0),
    med: median(ds),
  };
}

// sweep one angle, scoring the shape after removing the column's own median
function sweepAngle(rows, lat, lon, year, col, lo, hi, step, school, otherAngle) {
  const out = [];
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const comp = compute(lat, lon, year, col === 'fajr' ? a : otherAngle, col === 'isha' ? a : otherAngle, school);
    const ds = residuals(rows, comp, col);
    const med = median(ds);
    out.push({ a: Number(a.toFixed(2)), med, maeCentred: mean(ds.map(d => Math.abs(d - med))) });
  }
  out.sort((x, y) => x.maeCentred - y.maeCentred);
  return out.slice(0, 4);
}

function main() {
  const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const cal = JSON.parse(fs.readFileSync(cfg.calendar, 'utf8')).calendar;
  const { lat, lon, year } = cfg;
  const rows = toRows(cal, year);

  const yearProbe = {};
  for (const y of cfg.years) {
    const comp = compute(lat, lon, y, 18, 18, 0);
    yearProbe[y] = { sunrise: score(toRows(cal, y), comp, 'sunrise'), dhuhrMed: score(toRows(cal, y), comp, 'dhuhr').med };
  }
  console.log('YEAR PROBE', JSON.stringify(yearProbe));

  console.log('FAJR SWEEP', JSON.stringify(sweepAngle(rows, lat, lon, year, 'fajr', 14, 20, 0.05, 0, 18)));
  console.log('ISHA SWEEP', JSON.stringify(sweepAngle(rows, lat, lon, year, 'isha', 14, 20, 0.05, 0, 18)));

  const schoolScore = {};
  for (const s of [0, 1]) {
    const comp = compute(lat, lon, year, 18, 18, s);
    schoolScore[s] = score(rows, comp, 'asr');
  }
  console.log('ASR SCHOOL', JSON.stringify(schoolScore));

  const r = cfg.recipe;
  const comp = compute(lat, lon, year, r.fajr, r.isha, r.school, r.adj);
  const per = {};
  for (const col of COLS) per[col] = score(rows, comp, col);
  console.log('PER COLUMN', JSON.stringify(per));
  const allExact = Object.keys(rows).filter(k => COLS.every(c => diff(rows[k][c], comp[k][c]) === 0)).length;
  console.log('ALL-EXACT DAYS', allExact, '/', Object.keys(rows).length);
  if (cfg.outRows) fs.writeFileSync(cfg.outRows, JSON.stringify(rows));
  if (cfg.outComp) fs.writeFileSync(cfg.outComp, JSON.stringify(comp));
}

main();
