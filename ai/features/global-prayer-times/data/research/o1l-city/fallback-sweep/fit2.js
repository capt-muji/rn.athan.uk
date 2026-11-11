// Fit a dated table against adhan 4.4.6 at the surface's own point.
// fajr and isha angles are scanned independently (each column depends only on its own
// angle); sunrise/dhuhr/asr/maghrib carry a margin. Rounding: nearest, then floor, scored.
// Usage: node fit2.js spec.json
const fs = require('fs');
const A = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function hm(s) { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim()); return m ? +m[1] * 60 + +m[2] : null; }
function mins(d) { return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; }
function wrap(d, c) {
  if (c === 'isha' && d < -720) return d + 1440;
  if (c === 'fajr' && d > 720) return d - 1440;
  return d;
}
function score(resid, rule) {
  let exact = 0, w1 = 0, sum = 0, worst = 0;
  for (const raw of resid) {
    const r = rule === 'floor' ? Math.floor(raw + 1e-9) : Math.round(raw);
    if (r === 0) exact++;
    if (Math.abs(r) <= 1) w1++;
    sum += Math.abs(r);
    if (Math.abs(r) > worst) worst = Math.abs(r);
  }
  return { exact, within1: w1, mae: +(sum / resid.length).toFixed(2), worst };
}
function median(a) { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }

const specs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = [];
for (const spec of specs) {
  process.env.TZ = spec.tz;
  const rows = JSON.parse(fs.readFileSync(spec.file, 'utf8'));
  const dates = Object.keys(rows).sort();
  const base = new A.CalculationParameters('custom', 18, 17);
  base.madhab = spec.madhab === 'hanafi' ? A.Madhab.Hanafi : A.Madhab.Shafi;
  base.highLatitudeRule = A.HighLatitudeRule.MiddleOfTheNight;
  base.rounding = A.Rounding.None;
  const solar = {};
  for (const k of dates) {
    const [y, m, d] = k.split('-').map(Number);
    const pt = new A.PrayerTimes(new A.Coordinates(spec.lat, spec.lon), new Date(y, m - 1, d, 12, 0, 0, 0), base);
    solar[k] = {};
    for (const c of COLS) solar[k][c] = mins(pt[c]);
  }
  const res = { label: spec.label, n: dates.length, angles: {}, cols: {} };
  // angle scan for fajr and isha: choose the angle whose residual IQR is tightest,
  // tie-broken by the best exact count after the median margin.
  for (const c of ['fajr', 'isha']) {
    let best = null;
    for (let a = 12.0; a <= 20.001; a += 0.05) {
      const p = new A.CalculationParameters('custom', c === 'fajr' ? a : 18, c === 'isha' ? a : 17);
      p.madhab = base.madhab; p.highLatitudeRule = base.highLatitudeRule; p.rounding = A.Rounding.None;
      const r = [];
      for (const k of dates) {
        const [y, m, d] = k.split('-').map(Number);
        const pt = new A.PrayerTimes(new A.Coordinates(spec.lat, spec.lon), new Date(y, m - 1, d, 12, 0, 0, 0), p);
        const pv = hm(rows[k][c]);
        if (pv === null) continue;
        r.push(wrap(pv - mins(pt[c]), c));
      }
      const marg = median(r);
      const adj = r.map(x => x - marg);
      const s = adj.slice().sort((x, y) => x - y);
      const iqr = s[Math.floor(.75 * s.length)] - s[Math.floor(.25 * s.length)];
      const sc = score(adj, 'nearest');
      const key = [-(+iqr.toFixed(2)), sc.exact];
      if (!best || key[0] > best.key[0] || (key[0] === best.key[0] && key[1] > best.key[1])) {
        best = { key, angle: +a.toFixed(2), margin: +marg.toFixed(2), iqr: +iqr.toFixed(2), nearest: sc, floor: score(adj, 'floor') };
      }
    }
    res.angles[c] = best;
  }
  for (const c of ['sunrise', 'dhuhr', 'asr', 'maghrib']) {
    const r = [];
    for (const k of dates) { const pv = hm(rows[k][c]); if (pv !== null) r.push(wrap(pv - solar[k][c], c)); }
    const marg = median(r);
    const adj = r.map(x => x - marg);
    const s = adj.slice().sort((x, y) => x - y);
    const iqr = s[Math.floor(.75 * s.length)] - s[Math.floor(.25 * s.length)];
    res.cols[c] = {
      margin: +marg.toFixed(2),
      iqr: +iqr.toFixed(2),
      nearest: score(adj, 'nearest'),
      floor: score(adj, 'floor'),
    };
  }
  out.push(res);
}
console.log(JSON.stringify(out, null, 1));
