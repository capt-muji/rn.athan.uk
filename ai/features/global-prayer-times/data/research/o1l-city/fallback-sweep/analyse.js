// Column forensics: distinct values, and the residual against adhan solar anchors.
// Usage: node analyse.js spec.json
const fs = require('fs');
const A = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function hm(s) { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim()); return m ? +m[1] * 60 + +m[2] : null; }
function mins(d) { return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; }
function stats(a) {
  const s = a.slice().sort((x, y) => x - y);
  const q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const mean = a.reduce((x, y) => x + y, 0) / a.length;
  return { min: +s[0].toFixed(2), q25: +q(.25).toFixed(2), med: +q(.5).toFixed(2), q75: +q(.75).toFixed(2), max: +s[s.length - 1].toFixed(2), mean: +mean.toFixed(2) };
}

const specs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = [];
for (const spec of specs) {
  process.env.TZ = spec.tz;
  const rows = JSON.parse(fs.readFileSync(spec.file, 'utf8'));
  const dates = Object.keys(rows).sort();
  const p = new A.CalculationParameters('custom', 18, 17);
  p.madhab = A.Madhab.Shafi; p.highLatitudeRule = A.HighLatitudeRule.MiddleOfTheNight; p.rounding = A.Rounding.None;
  const rec = { label: spec.label, n: dates.length, cols: {} };
  const raw = {};
  for (const c of COLS) raw[c] = [];
  for (const k of dates) {
    const [y, m, d] = k.split('-').map(Number);
    const pt = new A.PrayerTimes(new A.Coordinates(spec.lat, spec.lon), new Date(y, m - 1, d, 12, 0, 0, 0), p);
    for (const c of COLS) {
      const pv = hm(rows[k][c]);
      if (pv === null) continue;
      raw[c].push({ k, printed: pv, solar: mins(pt[c]) });
    }
  }
  for (const c of COLS) {
    const vals = raw[c];
    const distinct = new Set(vals.map(v => v.printed)).size;
    const resid = vals.map(v => {
      let d = v.printed - v.solar;
      if (d < -720) d += 1440; if (d > 720) d -= 1440;
      return d;
    });
    rec.cols[c] = { distinct, resid: stats(resid) };
  }
  out.push(rec);
}
console.log(JSON.stringify(out, null, 1));
