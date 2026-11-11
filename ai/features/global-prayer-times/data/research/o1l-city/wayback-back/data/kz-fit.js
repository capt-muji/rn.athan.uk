// KZ fit: one recipe across every harvested Astana year, scored per year.
// Recipe (deep1's, unchanged): ISNA 15/15, TwilightAngle high lats, Hanafi asr,
// margins sunrise -5 / dhuhr+asr+maghrib +5 (Astana is above the 48 N rule),
// fajr and isha uncorrected, minute rounding.
const fs = require('fs');
const path = require('path');
const adhan = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));

const ROOT = path.join(__dirname, '..');
const TZ = 'Asia/Almaty';
const LAT = 51.133333, LNG = 71.433333;

const params = adhan.CalculationMethod.Other();
params.fajrAngle = 15;
params.ishaAngle = 15;
params.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle;
params.madhab = adhan.Madhab.Hanafi;
params.rounding = adhan.Rounding.None;

const MARGIN = { fajr: 0, sunrise: -5, dhuhr: 5, asr: 5, maghrib: 5, isha: 0 };
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function fmt(date) {
  const s = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
  const [h, m, sec] = s.split(':').map(Number);
  return h * 60 + m + sec / 60;
}

function roundMin(x) { return Math.round(x); }

const YEARS = [2026, 2027, 2029, 2033, 2035, 2040, 2050, 2075];
const lines = [];

for (const year of YEARS) {
  const table = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `kz-astana-${year}.json`), 'utf8'));
  const stat = {};
  COLS.forEach((c) => { stat[c] = { n: 0, e: 0, w1: 0, worst: 0 }; });
  let clampDays = 0;
  for (const day of Object.keys(table).sort()) {
    const [y, m, d] = day.split('-').map(Number);
    const coords = new adhan.Coordinates(LAT, LNG);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const t = new adhan.PrayerTimes(coords, date, params);
    const raw = {
      fajr: fmt(t.fajr), sunrise: fmt(t.sunrise), dhuhr: fmt(t.dhuhr),
      asr: fmt(t.asr), maghrib: fmt(t.maghrib), isha: fmt(t.isha),
    };
    if (fmt(t.sunrise) - fmt(t.fajr) > 12 * 60) clampDays += 0;
    for (const c of COLS) {
      const [th, tm] = table[day][c].split(':').map(Number);
      const printed = th * 60 + tm;
      const model = roundMin(raw[c] + MARGIN[c]);
      const diff = Math.abs(model - printed);
      const s = stat[c];
      s.n += 1;
      if (diff === 0) s.e += 1;
      if (diff <= 1) s.w1 += 1;
      if (diff > s.worst) s.worst = diff;
    }
  }
  const tot = COLS.reduce((a, c) => a + stat[c].n, 0);
  const e = COLS.reduce((a, c) => a + stat[c].e, 0);
  const w1 = COLS.reduce((a, c) => a + stat[c].w1, 0);
  const per = COLS.map((c) => `${c} ${(100 * stat[c].e / stat[c].n).toFixed(1)}/${(100 * stat[c].w1 / stat[c].n).toFixed(1)}`).join(' ');
  lines.push(`${year} n=${stat.fajr.n} | exact ${(100 * e / tot).toFixed(1)} pc, within-1 ${(100 * w1 / tot).toFixed(1)} pc, worst ${Math.max(...COLS.map((c) => stat[c].worst))} | ${per}`);
}

console.log(lines.join('\n'));
