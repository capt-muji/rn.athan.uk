// Fit mawaqit/conf-style dated rows against adhan 4.4.6 at the surface's own point.
// Usage: node fit.js spec.json
// spec: [{label, file, tz, lat, lon, madhab?, fajr?, isha?, year}]
const fs = require('fs');
const path = require('path');
const ADHAN = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan';
const {
  CalculationMethod, CalculationParameters, Coordinates, HighLatitudeRule,
  Madhab, Prayer, PrayerTimes, Rounding,
} = require(ADHAN);

const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function baseParams(fajr, isha, madhab) {
  const p = new CalculationParameters('custom', fajr, isha);
  p.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  p.rounding = Rounding.None;
  p.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return p;
}

function toMin(s) { return s.getHours() * 60 + s.getMinutes() + s.getSeconds() / 60; }

function computeDay(lat, lon, params, y, m, d) {
  // local civil noon, TZ pinned by the process env
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  const pt = new PrayerTimes(new Coordinates(lat, lon), date, params);
  return {
    fajr: toMin(pt.fajr), sunrise: toMin(pt.sunrise), dhuhr: toMin(pt.dhuhr),
    asr: toMin(pt.asr), maghrib: toMin(pt.maghrib), isha: toMin(pt.isha),
  };
}

function parseHM(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function scoreSurface(spec) {
  process.env.TZ = spec.tz;
  const rows = JSON.parse(fs.readFileSync(spec.file, 'utf8'));
  const dates = Object.keys(rows).sort();
  const printed = {};
  for (const k of dates) {
    const r = rows[k];
    const o = {};
    let ok = true;
    for (const c of COLS) { const v = parseHM(r[c]); if (v === null) { ok = false; break; } o[c] = v; }
    if (ok) printed[k] = o;
  }
  const usable = Object.keys(printed);

  let best = null;
  for (let fa = 15.0; fa <= 20.01; fa += 0.1) {
    for (let ia = 15.0; ia <= 19.01; ia += 0.1) {
      const params = baseParams(+fa.toFixed(1), +ia.toFixed(1), spec.madhab);
      const res = {};
      for (const c of COLS) res[c] = [];
      for (const k of usable) {
        const [y, m, d] = k.split('-').map(Number);
        const comp = computeDay(spec.lat, spec.lon, params, y, m, d);
        for (const c of COLS) {
          let diff = printed[k][c] - comp[c];
          if (c === 'isha' && diff < -720) diff += 1440;
          if (c === 'fajr' && diff > 720) diff -= 1440;
          res[c].push(diff);
        }
      }
      // per-column median margin, then score with it
      const marg = {};
      let totalWithin1 = 0;
      for (const c of COLS) {
        const s = res[c].slice().sort((a, b) => a - b);
        marg[c] = +s[Math.floor(s.length / 2)].toFixed(2);
      }
      const per = {};
      for (const c of COLS) {
        let exact = 0, w1 = 0, sum = 0, worst = 0;
        for (const raw of res[c]) {
          const r = Math.round(raw - marg[c]);
          if (r === 0) exact++;
          if (Math.abs(r) <= 1) w1++;
          sum += Math.abs(r);
          if (Math.abs(r) > worst) worst = Math.abs(r);
        }
        per[c] = { exact, within1: w1, mae: +(sum / res[c].length).toFixed(2), worst, margin: marg[c] };
        totalWithin1 += w1;
      }
      const key = totalWithin1;
      if (!best || key > best.key) best = { key, fajr: +fa.toFixed(1), isha: +ia.toFixed(1), per, n: usable.length };
    }
  }
  return { spec, n: usable.length, first: usable[0], last: usable[usable.length - 1], best };
}

const specs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = [];
for (const s of specs) {
  try { out.push(scoreSurface(s)); }
  catch (e) { out.push({ spec: s, error: String(e) }); }
}
console.log(JSON.stringify(out, null, 1));
