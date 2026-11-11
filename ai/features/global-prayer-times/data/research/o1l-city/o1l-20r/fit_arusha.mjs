import fs from 'node:fs';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';

const { Coordinates, PrayerTimes, CalculationParameters, Madhab, Rounding, HighLatitudeRule } = adhan;
const LAT = -3.38, LON = 36.67;
const OFFSET = 180; // Africa/Dar_es_Salaam = UTC+3, no DST

const years = [2025, 2026, 2027];
const data = {};
for (const y of years) data[y] = JSON.parse(fs.readFileSync(`captures/salaahtimes-arusha-${y}-full.json`, 'utf8')).days;

const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const utcMin = (d) => d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;

function params(fa, ia) {
  const p = new CalculationParameters('custom', fa, ia);
  p.madhab = Madhab.Shafi;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  p.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return p;
}
function calc(dateStr, p) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const pt = new PrayerTimes(new Coordinates(LAT, LON), new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)), p);
  return { fajr: utcMin(pt.fajr) + OFFSET, sunrise: utcMin(pt.sunrise) + OFFSET, dhuhr: utcMin(pt.dhuhr) + OFFSET, asr: utcMin(pt.asr) + OFFSET, maghrib: utcMin(pt.maghrib) + OFFSET, isha: utcMin(pt.isha) + OFFSET };
}

const rows2026 = data[2026];
// 1-D fit for fajr angle
let bestF = { a: 18, abs: 1e9, w1: 0 };
for (let a = 15; a <= 20.5; a += 0.01) {
  const p = params(a, 18);
  let abs = 0, w1 = 0;
  for (const day of rows2026) {
    const d0 = Math.abs(Math.round(calc(day.date, p).fajr) - toMin(day.times.fajr));
    abs += d0; if (d0 <= 1) w1++;
  }
  if (abs < bestF.abs) bestF = { a, abs, w1 };
}
console.log(`fajr angle ${bestF.a.toFixed(2)}  meanAbs ${(bestF.abs / rows2026.length).toFixed(2)}  within1 ${bestF.w1}/${rows2026.length}`);

let bestI = { a: 18, abs: 1e9, w1: 0 };
for (let a = 14; a <= 19.5; a += 0.01) {
  const p = params(18, a);
  let abs = 0, w1 = 0;
  for (const day of rows2026) {
    const d0 = Math.abs(Math.round(calc(day.date, p).isha) - toMin(day.times.esha));
    abs += d0; if (d0 <= 1) w1++;
  }
  if (abs < bestI.abs) bestI = { a, abs, w1 };
}
console.log(`isha angle ${bestI.a.toFixed(2)}  meanAbs ${(bestI.abs / rows2026.length).toFixed(2)}  within1 ${bestI.w1}/${rows2026.length}`);

// dhuhr / maghrib / asr / sunrise offsets
const p = params(bestF.a, bestI.a);
const off = { sunrise: [], dhuhr: [], asr: [], maghrib: [] };
for (const day of rows2026) {
  const c = calc(day.date, p);
  off.sunrise.push(toMin(day.times.sunrise) - c.sunrise);
  off.dhuhr.push(toMin(day.times.zuhr) - c.dhuhr);
  off.asr.push(toMin(day.times.asrShafi) - c.asr);
  off.maghrib.push(toMin(day.times.maghrib) - c.maghrib);
}
for (const k of Object.keys(off)) {
  const v = off[k].map(x => Math.round(x));
  const hist = {};
  for (const x of v) hist[x] = (hist[x] || 0) + 1;
  const med = v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)];
  console.log(`${k}: median ${med}  hist ${JSON.stringify(hist)}`);
}

// full validation across 3 years with chosen model
const M = { fajr: bestF.a, isha: bestI.a, dhuhr: 5, maghrib: 3, asr: 0, sunrise: 0 };
for (const y of years) {
  const pp = params(M.fajr, M.isha);
  let n = 0, all6 = 0, w1 = 0; const col = {};
  for (const day of data[y]) {
    const c = calc(day.date, pp);
    const pr = { fajr: toMin(day.times.fajr), sunrise: toMin(day.times.sunrise), dhuhr: toMin(day.times.zuhr), asr: toMin(day.times.asrShafi), maghrib: toMin(day.times.maghrib), isha: toMin(day.times.esha) };
    const mo = { fajr: c.fajr, sunrise: c.sunrise + M.sunrise, dhuhr: c.dhuhr + M.dhuhr, asr: c.asr + M.asr, maghrib: c.maghrib + M.maghrib, isha: c.isha };
    n++; let ok = 0;
    for (const k of Object.keys(pr)) {
      const a = Math.abs(Math.round(mo[k]) - pr[k]);
      col[k] = col[k] || [0, 0]; col[k][0] += a; if (a <= 1) col[k][1]++;
      if (a <= 1) ok++;
    }
    if (ok === 6) w1++;
  }
  console.log(`${y}: ${n} rows, all-6-within-1 ${w1} (${(100 * w1 / n).toFixed(1)}%)`);
  if (y === 2026) for (const k of Object.keys(col)) console.log(`   ${k.padEnd(8)} meanAbs ${(col[k][0] / n).toFixed(2)} within1 ${col[k][1]}/${n}`);
}
