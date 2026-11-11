// Maldives fit: one recipe across the three banked Malé years, scored per year,
// plus the year-difference test the mission requires before any span is claimed.
const fs = require('fs');
const path = require('path');
const adhan = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));

const ROOT = path.join(__dirname, '..');
const TZ = 'Indian/Maldives';

const SITES = {
  male: { lat: 4.1755, lng: 73.5093 },
  thuraakunu: { lat: 7.1, lng: 72.8667 },
  hoadedhdhoo: { lat: 0.45, lng: 72.8333 },
};

const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function minutes(date) {
  const s = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
  const [h, m, sec] = s.split(':').map(Number);
  return h * 60 + m + sec / 60;
}

function load(tag, year) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `mv-${tag}-${year}.json`), 'utf8'));
}

function rawYear(coords, days, fajrAngle, ishaAngle) {
  const params = adhan.CalculationMethod.Other();
  params.fajrAngle = fajrAngle;
  params.ishaAngle = ishaAngle;
  params.madhab = adhan.Madhab.Shafi;
  params.rounding = adhan.Rounding.None;
  const out = {};
  for (const day of days) {
    const [y, m, d] = day.split('-').map(Number);
    const t = new adhan.PrayerTimes(new adhan.Coordinates(coords.lat, coords.lng), new Date(Date.UTC(y, m - 1, d, 12)), params);
    out[day] = { fajr: minutes(t.fajr), sunrise: minutes(t.sunrise), dhuhr: minutes(t.dhuhr), asr: minutes(t.asr), maghrib: minutes(t.maghrib), isha: minutes(t.isha) };
  }
  return out;
}

function score(table, raw, margin) {
  const stat = {};
  COLS.forEach((c) => { stat[c] = { n: 0, e: 0, w1: 0, worst: 0 }; });
  for (const day of Object.keys(table)) {
    for (const c of COLS) {
      const [th, tm] = table[day][c].split(':').map(Number);
      const diff = Math.abs(Math.round(raw[day][c] + margin[c]) - (th * 60 + tm));
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

const RECIPE = { fajr: 5, sunrise: -2, dhuhr: 4, asr: 1, maghrib: 2, isha: 4 };
const lines = [];
const cache = {};

for (const [tag, coords] of Object.entries(SITES)) {
  for (const year of [2027, 2031, 2036]) {
    const table = load(tag, year);
    const raw = rawYear(coords, Object.keys(table).sort(), 20, 18);
    cache[`${tag}-${year}`] = raw;
    const r = score(table, raw, RECIPE);
    const per = COLS.map((c) => `${c} ${(100 * r.stat[c].e / r.stat[c].n).toFixed(0)}/${(100 * r.stat[c].w1 / r.stat[c].n).toFixed(0)}`).join(' ');
    lines.push(`${tag} ${year} n=${r.stat.fajr.n} | exact ${r.exact.toFixed(1)} pc within-1 ${r.within1.toFixed(1)} pc worst ${r.worst} | ${per}`);
  }
}

// Margin sweep on the fit surface: does the record's fixed integer set maximise exactness?
const male = load('male', 2031);
const maleRaw = cache['male-2031'];
let best = null;
for (let df = 3; df <= 7; df += 1) {
  for (let ds = -4; ds <= 0; ds += 1) {
    for (let dd = 2; dd <= 6; dd += 1) {
      for (let da = -1; da <= 3; da += 1) {
        for (let dm = 0; dm <= 4; dm += 1) {
          for (let di = 2; di <= 6; di += 1) {
            const m = { fajr: df, sunrise: ds, dhuhr: dd, asr: da, maghrib: dm, isha: di };
            const r = score(male, maleRaw, m);
            if (!best || r.exact > best.r.exact) best = { m, r };
          }
        }
      }
    }
  }
}
lines.push(`sweep male 2031 best: ${JSON.stringify(best.m)} exact ${best.r.exact.toFixed(1)} within-1 ${best.r.within1.toFixed(1)} worst ${best.r.worst}`);

// Year-difference test on month-day keys: identical rows would mean one frozen table.
const byMD = (t) => Object.fromEntries(Object.entries(t).map(([d, v]) => [d.slice(5), v]));
for (const tag of Object.keys(SITES)) {
  const a = byMD(load(tag, 2027)), b = byMD(load(tag, 2031)), c = byMD(load(tag, 2036));
  const cmp = (x, y) => Object.keys(x).filter((k) => k in y);
  const diff = (x, y) => cmp(x, y).filter((k) => JSON.stringify(x[k]) !== JSON.stringify(y[k])).length;
  lines.push(`${tag} year-diff (month-day aligned): 2027 vs 2031 ${diff(a, b)}/${cmp(a, b).length} differ; 2027 vs 2036 ${diff(a, c)}/${cmp(a, c).length} differ`);
}

// Seasonal amplitude: January vs July fajr, the owner's second dimension.
for (const tag of Object.keys(SITES)) {
  const t = load(tag, 2027);
  const jan = Object.keys(t).filter((d) => d.slice(5, 7) === '01').map((d) => t[d].fajr).sort();
  const jul = Object.keys(t).filter((d) => d.slice(5, 7) === '07').map((d) => t[d].fajr).sort();
  lines.push(`${tag} 2027 fajr Jan ${jan[0]}..${jan[jan.length - 1]} Jul ${jul[0]}..${jul[jul.length - 1]}`);
}

console.log(lines.join('\n'));
