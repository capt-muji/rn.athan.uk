// Recover mosque coordinates from a table's angle-free columns (sunrise + solar noon),
// then fit twilight angles at the recovered point. adhan 4.4.6, TZ pinned.
process.env.TZ = 'Asia/Kolkata';
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = adhan;

const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const pad = n => String(n).padStart(2, '0');
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const toMin = s => { const t = s.length > 5 ? s.slice(11, 16) : s; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
function diff(a, b) { let d = a - b; if (d > 720) d -= 1440; if (d < -720) d += 1440; return d; }
const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
function median(a) { const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

function params(fajr, isha, school, adj) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajr; p.ishaAngle = isha;
  p.madhab = school === 1 ? Madhab.Hanafi : Madhab.Shafi;
  p.rounding = Rounding.None;
  p.adjustments = Object.assign({ fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, adj || {});
  return p;
}

function compute(lat, lon, year, fajr, isha, school, adj) {
  const c = new Coordinates(lat, lon);
  const p = params(fajr, isha, school, adj);
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

function main() {
  const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const days = JSON.parse(fs.readFileSync(cfg.rows, 'utf8'));
  const keys = Object.keys(days).filter(k => k.startsWith(String(cfg.year))).sort();
  const year = cfg.year;

  // 1. coordinates from sunrise (angle-free) + solar noon, coarse pass then refine
  const solveAt = (l0, l1, o0, o1, step) => {
    let best = null;
    for (let lat = l0; lat <= l1 + 1e-9; lat += step) {
      for (let lon = o0; lon <= o1 + 1e-9; lon += step) {
        const comp = compute(lat, lon, year, 18, 18, 0);
        let s = 0, n = 0;
        for (const k of keys) {
          if (!comp[k]) continue;
          s += Math.abs(diff(toMin(days[k].sunrise), toMin(comp[k].sunrise))) +
               Math.abs(diff(toMin(days[k].dhuhr), toMin(comp[k].dhuhr)));
          n += 2;
        }
        const mae = s / n;
        if (!best || mae < best.mae) best = { lat: Number(lat.toFixed(3)), lon: Number(lon.toFixed(3)), mae };
      }
    }
    return best;
  };
  const coarse = solveAt(cfg.latRange[0], cfg.latRange[1], cfg.lonRange[0], cfg.lonRange[1], cfg.coarseStep || 0.1);
  const best = solveAt(coarse.lat - 0.1, coarse.lat + 0.1, coarse.lon - 0.1, coarse.lon + 0.1, 0.01);
  console.log('COORDS', JSON.stringify(best));
  const { lat, lon } = best;

  // 2. angle sweeps, scored after removing each column's own median offset
  const sweep = (col, lo, hi) => {
    const out = [];
    for (let a = lo; a <= hi + 1e-9; a += 0.05) {
      const comp = compute(lat, lon, year, col === 'fajr' ? a : 18, col === 'isha' ? a : 18, 0);
      const ds = keys.map(k => diff(toMin(days[k][col]), toMin(comp[k][col])));
      const med = median(ds);
      out.push({ a: Number(a.toFixed(2)), med, maeCentred: Number(mean(ds.map(d => Math.abs(d - med))).toFixed(2)) });
    }
    out.sort((x, y) => x.maeCentred - y.maeCentred);
    return out.slice(0, 4);
  };
  console.log('FAJR', JSON.stringify(sweep('fajr', 12, 21)));
  console.log('ISHA', JSON.stringify(sweep('isha', 12, 21)));

  const school = {};
  for (const s of [0, 1]) {
    const comp = compute(lat, lon, year, 18, 18, s);
    const ds = keys.map(k => diff(toMin(days[k].asr), toMin(comp[k].asr)));
    school[s] = { med: median(ds), maeCentred: Number(mean(ds.map(d => Math.abs(d - median(ds)))).toFixed(2)) };
  }
  console.log('ASR', JSON.stringify(school));

  const r = cfg.recipe;
  const comp = compute(lat, lon, year, r.fajr, r.isha, r.school, r.adj);
  const per = {};
  for (const col of COLS) {
    const ds = keys.map(k => diff(toMin(days[k][col]), toMin(comp[k][col])));
    per[col] = {
      exactPct: Number((100 * ds.filter(d => d === 0).length / ds.length).toFixed(1)),
      within1Pct: Number((100 * ds.filter(d => Math.abs(d) <= 1).length / ds.length).toFixed(1)),
      mae: Number(mean(ds.map(Math.abs)).toFixed(2)),
      worst: ds.reduce((w, d) => (Math.abs(d) > Math.abs(w) ? d : w), 0),
      med: median(ds),
    };
  }
  console.log('PER COLUMN', JSON.stringify(per));
  const allExact = keys.filter(k => COLS.every(c => diff(toMin(days[k][c]), toMin(comp[k][c])) === 0)).length;
  console.log('ALL-EXACT', allExact, '/', keys.length);
}

main();
