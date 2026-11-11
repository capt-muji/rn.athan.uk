// Score an explicit recipe against a full-year table. Usage: node score_recipe.js <data.json> <tz> '<spec json>'
// spec: {fajrAngle, ishaAngle, ishaInterval?, madhab:'shafi'|'hanafi', adj:{...}, asrFloor:'HH:MM'?}
const fs = require('fs');
const adhan = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const { Coordinates, CalculationParameters, PrayerTimes, Madhab, Rounding } = adhan;

const [file, tz, specJson] = process.argv.slice(2);
const spec = JSON.parse(specJson);
const { meta, rows } = JSON.parse(fs.readFileSync(file, 'utf8'));
const dates = Object.keys(rows).sort();
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const lm = d => { const p = fmt.formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {}); let h = +p.hour; if (h === 24) h = 0; return h * 60 + +p.minute + +p.second / 60; };
const pm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const coords = new Coordinates(meta.lat, meta.lon, 0);

const p = new CalculationParameters('custom', spec.fajrAngle, spec.ishaAngle);
if (spec.ishaInterval) { p.ishaInterval = spec.ishaInterval; p.ishaAngle = 0; }
p.madhab = spec.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
p.rounding = Rounding.None;
p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
p.adjustments = Object.assign({ fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, spec.adj || {});

const floorMin = spec.asrFloor ? pm(spec.asrFloor) : null;
const res = {};
for (const col of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
  let exact = 0, w1 = 0, sum = 0, worst = 0, clamped = 0;
  for (const d of dates) {
    const [y, m, dd] = d.split('-').map(Number);
    const pt = new PrayerTimes(coords, new Date(Date.UTC(y, m - 1, dd, 12)), p);
    let model = lm(pt[col]);
    if (col === 'asr' && floorMin != null && model < floorMin) { model = floorMin; clamped++; }
    const diff = pm(rows[d][col]) - model;
    sum += Math.abs(diff);
    if (Math.abs(diff) < 0.5) exact++;
    if (Math.abs(diff) < 1.5) w1++;
    worst = Math.max(worst, Math.abs(diff));
  }
  res[col] = { exact, w1, mae: +(sum / dates.length).toFixed(2), worst: +worst.toFixed(1) };
  if (clamped) res[col].clamped = clamped;
}
console.log(JSON.stringify({ name: meta.name, days: dates.length, spec, res }, null, 1));
