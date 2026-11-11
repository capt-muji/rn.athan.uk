import fs from 'node:fs';
import adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';

const { Coordinates, PrayerTimes, CalculationParameters, Madhab, Rounding, HighLatitudeRule } = adhan;
const P = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const offsetFor = (tz, dateStr) => {
  // derive UTC offset from the IANA zone for this date without reading the clock
  const [y, mo, d] = dateStr.split('-').map(Number);
  const probe = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(probe);
  const g = (t) => Number(parts.find(x => x.type === t).value);
  const local = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'));
  return Math.round((local - probe.getTime()) / 60000);
};

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
  const pt = new PrayerTimes(new Coordinates(P.lat, P.lon), new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)), p);
  const off = offsetFor(P.tz, dateStr);
  const f = (x) => x.getUTCHours() * 60 + x.getUTCMinutes() + x.getUTCSeconds() / 60 + off;
  return { fajr: f(pt.fajr), sunrise: f(pt.sunrise), dhuhr: f(pt.dhuhr), asr: f(pt.asr), maghrib: f(pt.maghrib), isha: f(pt.isha) };
}

const dates = Object.keys(P.rows).sort();
const fit1d = (col, lo, hi) => {
  let best = { a: 18, abs: 1e9, w1: 0 };
  for (let a = lo; a <= hi; a += 0.01) {
    const p = params(col === 'fajr' ? a : 18, col === 'isha' ? a : 17);
    let abs = 0, w1 = 0;
    for (const d of dates) {
      const e = Math.abs(Math.round(calc(d, p)[col]) - P.rows[d][col]);
      abs += e; if (e <= 1) w1++;
    }
    if (abs < best.abs) best = { a, abs, w1 };
  }
  return best;
};
const fajr = fit1d('fajr', 13, 21);
const isha = fit1d('isha', 12, 20);
const p = params(fajr.a, isha.a);
const off = { sunrise: [], dhuhr: [], asr: [], maghrib: [] };
for (const d of dates) {
  const c = calc(d, p);
  off.sunrise.push(P.rows[d].sunrise - c.sunrise);
  off.dhuhr.push(P.rows[d].dhuhr - c.dhuhr);
  off.asr.push(P.rows[d].asr - c.asr);
  off.maghrib.push(P.rows[d].maghrib - c.maghrib);
}
const stat = (arr) => {
  const v = arr.map(Math.round);
  const hist = {}; for (const x of v) hist[x] = (hist[x] || 0) + 1;
  const med = v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)];
  return `median ${med} hist ${JSON.stringify(hist)}`;
};
console.log(`fajr ${fajr.a.toFixed(2)} meanAbs ${(fajr.abs / dates.length).toFixed(2)} within1 ${fajr.w1}/${dates.length}`);
console.log(`isha ${isha.a.toFixed(2)} meanAbs ${(isha.abs / dates.length).toFixed(2)} within1 ${isha.w1}/${dates.length}`);
for (const k of Object.keys(off)) console.log(`${k}: ${stat(off[k])}`);
// chosen model
const M = { sunrise: 0, dhuhr: Math.round(off.dhuhr.map(x => x).sort((a, b) => a - b)[Math.floor(off.dhuhr.length / 2)]), asr: 0, maghrib: Math.round(off.maghrib.sort((a, b) => a - b)[Math.floor(off.maghrib.length / 2)]) };
let all = 0; const col = {};
for (const d of dates) {
  const c = calc(d, p);
  const m = { fajr: c.fajr, sunrise: c.sunrise + M.sunrise, dhuhr: c.dhuhr + M.dhuhr, asr: c.asr + M.asr, maghrib: c.maghrib + M.maghrib, isha: c.isha };
  let ok = 0;
  for (const k of COLS) {
    const e = Math.abs(Math.round(m[k]) - P.rows[d][k]);
    col[k] = col[k] || [0, 0]; col[k][0] += e; if (e <= 1) col[k][1]++;
    if (e <= 1) ok++;
  }
  if (ok === 6) all++;
}
console.log(`MODEL fajr ${fajr.a.toFixed(2)} isha ${isha.a.toFixed(2)} dhuhr+${M.dhuhr} maghrib+${M.maghrib} sunrise+0 asr+0`);
console.log(`all-6-within-1 ${all}/${dates.length} (${(100 * all / dates.length).toFixed(1)}%)`);
for (const k of COLS) console.log(`  ${k.padEnd(8)} meanAbs ${(col[k][0] / dates.length).toFixed(2)} within1 ${col[k][1]}/${dates.length}`);
