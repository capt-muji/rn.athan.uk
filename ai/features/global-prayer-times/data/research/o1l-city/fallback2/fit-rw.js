// Fit an RMC monthly timetable on adhan 4.4.6. TZ pinned per surface, dates from literal capture strings.
const path = require('path');
const fs = require('fs');
const { CalculationParameters, Coordinates, PrayerTimes, Rounding, HighLatitudeRule, Madhab } = require(path.join(
  process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'
));

const TZ = process.env.FIT_TZ || 'Africa/Kigali';
process.env.TZ = TZ;

const pad = (n) => String(n).padStart(2, '0');
const toMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
const wallMin = (d) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

function loadRows(files) {
  const rows = [];
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const [day, vals] of Object.entries(j.rows)) {
      rows.push({
        day,
        lat: j.lat,
        lon: j.lon,
        printed: Object.fromEntries(j.columns.map((c, i) => [c, toMin(vals[i])])),
      });
    }
  }
  return rows;
}

function params(lat, fajrAngle, ishaAngle, madhab) {
  const p = new CalculationParameters('custom', fajrAngle, ishaAngle);
  p.madhab = madhab;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  p.rounding = Rounding.None;
  p.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return p;
}

function rawTimes(lat, lon, day, p) {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  const pt = new PrayerTimes(new Coordinates(lat, lon), date, p);
  return {
    fajr: wallMin(pt.fajr),
    sunrise: wallMin(pt.sunrise),
    dhuhr: wallMin(pt.dhuhr),
    asr: wallMin(pt.asr),
    maghrib: wallMin(pt.maghrib),
    isha: wallMin(pt.isha),
  };
}

function median(a) {
  const s = [...a].sort((x, y) => x - y);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

const COLUMNS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function score(rows, p) {
  const out = {};
  for (const c of COLUMNS) out[c] = { res: [], printed: [], raw: [] };
  for (const r of rows) {
    const raw = rawTimes(r.lat, r.lon, r.day, p);
    for (const c of COLUMNS) {
      out[c].res.push(r.printed[c] - raw[c]);
      out[c].printed.push(r.printed[c]);
      out[c].raw.push(raw[c]);
    }
  }
  const res = {};
  for (const c of COLUMNS) {
    const margin = median(out[c].res);
    let exact = 0,
      w1 = 0,
      err = 0;
    out[c].res.forEach((d, i) => {
      const v = Math.round(out[c].raw[i] + margin);
      const e = Math.abs(v - out[c].printed[i]);
      if (e === 0) exact++;
      if (e <= 1) w1++;
      err += e;
    });
    const dev = out[c].res.map((d) => d - margin);
    res[c] = { margin: +margin.toFixed(2), exact, within1: w1, n: rows.length, mae: +(err / rows.length).toFixed(2), iqr: +(iqr(dev)).toFixed(2) };
  }
  return res;
}

function iqr(a) {
  const s = [...a].sort((x, y) => x - y);
  const q = (p) => s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))];
  return q(0.75) - q(0.25);
}

module.exports = { loadRows, score, params, rawTimes, median, COLUMNS, wallMin, toMin };

if (require.main === module) {
  const [specPath] = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const rows = loadRows(spec.files);
  const madhab = spec.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  let best = null;
  for (let f = spec.fajrFrom; f <= spec.fajrTo + 1e-9; f += spec.step) {
    for (let i = spec.ishaFrom; i <= spec.ishaTo + 1e-9; i += spec.step) {
      const p = params(rows[0].lat, f, i, madhab);
      const s = score(rows, p);
      const total = s.fajr.within1 + s.isha.within1;
      if (!best || total > best.total) best = { total, fajrAngle: +f.toFixed(2), ishaAngle: +i.toFixed(2), s };
    }
  }
  const p = params(rows[0].lat, best.fajrAngle, best.ishaAngle, madhab);
  console.log(JSON.stringify({ tz: TZ, n: rows.length, best: { fajrAngle: best.fajrAngle, ishaAngle: best.ishaAngle }, columns: best.s }, null, 1));
}
