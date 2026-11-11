// Fit adhan 4.4.6 to a mawaqit full-year table. Per-column search, no clock reads.
const fs = require('fs');
const adhan = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const { Coordinates, CalculationParameters, PrayerTimes, Madhab, Rounding } = adhan;

const file = process.argv[2];
const tz = process.argv[3];
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const { meta, rows } = data;
const dates = Object.keys(rows).sort();

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});
function localMinutes(d) {
  const p = fmt.formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
  let h = +p.hour; if (h === 24) h = 0;
  return h * 60 + (+p.minute) + (+p.second) / 60;
}
function printedMin(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }

const coords = new Coordinates(meta.lat, meta.lon, 0);
function params(fajrAngle, ishaAngle, ishaInterval, madhab) {
  const p = new CalculationParameters('custom', fajrAngle, ishaAngle);
  if (ishaInterval != null) { p.ishaInterval = ishaInterval; p.ishaAngle = 0; }
  p.madhab = madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  return p;
}
function timesFor(dayIso, p) {
  const [y, m, d] = dayIso.split('-').map(Number);
  const pt = new PrayerTimes(coords, new Date(Date.UTC(y, m - 1, d, 12)), p);
  return {
    fajr: localMinutes(pt.fajr), sunrise: localMinutes(pt.sunrise), dhuhr: localMinutes(pt.dhuhr),
    asr: localMinutes(pt.asr), maghrib: localMinutes(pt.maghrib), isha: localMinutes(pt.isha),
  };
}

function score(column, model) {
  let exact = 0, w1 = 0, sum = 0, worst = 0;
  const residuals = [];
  for (const d of dates) {
    const diff = printedMin(rows[d][column]) - model[d];
    const r = Math.round(diff);
    residuals.push(diff);
    sum += Math.abs(diff);
    if (Math.abs(diff) < 0.5) exact++;
    if (Math.abs(diff) < 1.5) w1++;
    worst = Math.max(worst, Math.abs(diff));
  }
  return { exact, w1, mae: sum / dates.length, worst, residuals };
}

// Fajr / isha angle search
function fitAngle(column, grid, offsetRange) {
  let best = null;
  for (const a of grid) {
    const p = params(column === 'fajr' ? a : 18, column === 'isha' ? a : 17, null, Madhab.Shafi);
    const model = {};
    for (const d of dates) model[d] = timesFor(d, p)[column];
    const base = score(column, model);
    const med = base.residuals.slice().sort((x, y) => x - y)[Math.floor(base.residuals.length / 2)];
    const shifted = {};
    for (const d of dates) shifted[d] = model[d] + Math.round(med);
    const s = score(column, shifted);
    const cand = { angle: a, offset: Math.round(med), ...s };
    if (!best || cand.mae < best.mae) best = cand;
  }
  return best;
}

const grid = [];
for (let a = 10; a <= 22.001; a += 0.05) grid.push(+a.toFixed(2));

const out = { file, tz, meta: { name: meta.name, lat: meta.lat, lon: meta.lon, country: meta.countryCode }, days: dates.length };

for (const col of ['fajr', 'isha']) {
  const b = fitAngle(col, grid, 0);
  out[col] = { angle: b.angle, offset: b.offset, exact: b.exact, within1: b.w1, mae: +b.mae.toFixed(2), worst: +b.worst.toFixed(2) };
}

// asr: shadow 1 (Shafi) and 2 (Hanafi)
for (const [name, madhab] of [['shafi', Madhab.Shafi], ['hanafi', Madhab.Hanafi]]) {
  const p = params(18, 17, null, madhab);
  const model = {}; for (const d of dates) model[d] = timesFor(d, p).asr;
  const base = score('asr', model);
  const med = base.residuals.slice().sort((x, y) => x - y)[Math.floor(base.residuals.length / 2)];
  const shifted = {}; for (const d of dates) shifted[d] = model[d] + Math.round(med);
  const s = score('asr', shifted);
  out['asr_' + name] = { offset: Math.round(med), exact: s.exact, within1: s.w1, mae: +s.mae.toFixed(2), worst: +s.worst.toFixed(2) };
}

// dhuhr / maghrib / sunrise: pure solar offsets
const p = params(18, 17, null, Madhab.Shafi);
const solar = {}; for (const d of dates) solar[d] = timesFor(d, p);
for (const col of ['dhuhr', 'maghrib', 'sunrise']) {
  const model = {}; for (const d of dates) model[d] = solar[d][col];
  const base = score(col, model);
  const med = base.residuals.slice().sort((x, y) => x - y)[Math.floor(base.residuals.length / 2)];
  const shifted = {}; for (const d of dates) shifted[d] = model[d] + Math.round(med);
  const s = score(col, shifted);
  out[col] = { offset: Math.round(med), exact: s.exact, within1: s.w1, mae: +s.mae.toFixed(2), worst: +s.worst.toFixed(2) };
}

// seasonal amplitude: Jan vs Jul fajr span of the PRINTED table
const jan = dates.filter(d => d.startsWith('2026-01')).map(d => printedMin(rows[d].fajr));
const jul = dates.filter(d => d.startsWith('2026-07')).map(d => printedMin(rows[d].fajr));
out.amplitude_fajr_janJul = { jan: [Math.min(...jan), Math.max(...jan)], jul: [Math.min(...jul), Math.max(...jul)] };

console.log(JSON.stringify(out, null, 1));
