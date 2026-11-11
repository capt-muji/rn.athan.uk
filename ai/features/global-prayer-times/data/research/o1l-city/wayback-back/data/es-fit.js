// Spain 2024 fit: the six transcribed CCIM Madrid posters against the record's recipe.
// The point is Madrid's own (40.4168/-3.7038): a free coordinate search is degenerate
// here because the winter and summer rows trade latitude against angle, so the city
// point is fixed and the recipe is what gets tested.
const fs = require('fs');
const path = require('path');
const adhan = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));

const ROOT = path.join(__dirname, '..');
const TZ = 'Europe/Madrid';
const LAT = 40.4168, LNG = -3.7038;
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

function minutes(date) {
  const [h, m, sec] = FMT.format(date).split(':').map(Number);
  return h * 60 + m + sec / 60;
}

function rawAt(fajrAngle, ishaAngle, days) {
  const p = adhan.CalculationMethod.Other();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = adhan.Madhab.Shafi;
  p.rounding = adhan.Rounding.None;
  const out = {};
  for (const day of days) {
    const [y, m, d] = day.split('-').map(Number);
    const t = new adhan.PrayerTimes(new adhan.Coordinates(LAT, LNG), new Date(Date.UTC(y, m - 1, d, 12)), p);
    out[day] = { fajr: minutes(t.fajr), sunrise: minutes(t.sunrise), dhuhr: minutes(t.dhuhr), asr: minutes(t.asr), maghrib: minutes(t.maghrib), isha: minutes(t.isha) };
  }
  return out;
}

const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'es-2024-transcribed.json'), 'utf8'));
const table = {};
for (const [ym, rows] of Object.entries(src)) {
  rows.forEach((r, i) => {
    table[`${ym}-${String(i + 1).padStart(2, '0')}`] = Object.fromEntries(COLS.map((c, j) => [c, r[j]]));
  });
}
const days = Object.keys(table).sort();

function printed(day, col) {
  const [h, m] = table[day][col].split(':').map(Number);
  return h * 60 + m;
}

const RECIPE = { fajr: 0, sunrise: -2, dhuhr: 1, asr: 1, maghrib: 2, isha: 1 };

function score(raw, margin, subset) {
  const stat = {};
  COLS.forEach((c) => { stat[c] = { n: 0, e: 0, w1: 0, worst: 0 }; });
  for (const day of subset) {
    for (const c of COLS) {
      const diff = Math.abs(Math.round(raw[day][c] + margin[c]) - printed(day, c));
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
  return { stat, exact: 100 * e / tot, within1: 100 * w1 / tot, worst: Math.max(...COLS.map((c) => stat[c].worst)) };
}

let best = null;
for (const fa of [17.5, 17.75, 18, 18.25, 18.5]) {
  for (const ia of [16.5, 17, 17.25, 17.5]) {
    const raw = rawAt(fa, ia, days);
    const r = score(raw, RECIPE, days);
    if (!best || r.exact > best.r.exact) best = { fa, ia, r, raw };
  }
}

const { fa, ia, r, raw } = best;
console.log(`rows ${days.length} ${days[0]} .. ${days[days.length - 1]}`);
console.log(`best angles fajr ${fa} isha ${ia} with the record's margins -> exact ${r.exact.toFixed(1)} pc, within-1 ${r.within1.toFixed(1)} pc, worst ${r.worst}`);
console.log(`per column ${COLS.map((c) => `${c} ${(100 * r.stat[c].e / r.stat[c].n).toFixed(0)}/${(100 * r.stat[c].w1 / r.stat[c].n).toFixed(0)}`).join(' ')}`);
for (const ym of Object.keys(src)) {
  const subset = days.filter((d) => d.startsWith(ym));
  const s = score(raw, RECIPE, subset);
  console.log(`${ym} n=${subset.length} exact ${s.exact.toFixed(1)} within-1 ${s.within1.toFixed(1)} worst ${s.worst}`);
}
