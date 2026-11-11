// Generic city fit: adhan 4.4.6, Rounding.None, TZ pinned, dates from the capture's own strings.
// Angle recovery is per-day bisection (implied angle), then one recipe over the whole span.
// Usage: node fit.js <rows.json> <lat> <lon> <tz> <shafi|hanafi> [label]
const fs = require('fs');
const { Coordinates, CalculationParameters, PrayerTimes, Madhab, Rounding } =
  require(`${process.env.HOME}/athan-gitree/census/adhan-build/node_modules/adhan`);

const [, , file, latA, lonA, tz, asrA = 'shafi', label = file] = process.argv;
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const dates = Object.keys(rows).sort();
const lat = +latA, lon = +lonA;
const cols = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const coords = new Coordinates(lat, lon);
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };

function params(fajr, isha) {
  const p = new CalculationParameters('x');
  p.fajrAngle = fajr; p.ishaAngle = isha;
  p.madhab = asrA === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  p.rounding = Rounding.None;
  p.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return p;
}
const mins = (d) => {
  const [h, m, s] = d.toLocaleString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    .split(':').map(Number);
  return h * 60 + m + s / 60;
};
const day = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); };

function time(column, k, fajrAngle, ishaAngle) {
  const pt = new PrayerTimes(coords, day(k), params(fajrAngle, ishaAngle));
  return mins(pt[column]);
}
// implied angle: the depression that reproduces the printed time on that day
function implied(column, k, target) {
  let lo = 10, hi = 26;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    const t = time(column, k, column === 'fajr' ? mid : 18, column === 'isha' ? mid : 17);
    if (column === 'fajr' ? t > target : t < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

const impliedAngles = { fajr: [], isha: [] };
for (const k of dates) {
  impliedAngles.fajr.push(implied('fajr', k, toMin(rows[k].fajr)));
  impliedAngles.isha.push(implied('isha', k, toMin(rows[k].isha)));
}
const F = +med(impliedAngles.fajr).toFixed(2);
const I = +med(impliedAngles.isha).toFixed(2);

console.log(`\n### ${label} | ${dates.length} days ${dates[0]}..${dates[dates.length - 1]} | ${lat},${lon} ${tz} ${asrA} | adhan 4.4.6 Rounding.None`);
for (const c of ['fajr', 'isha']) {
  const a = impliedAngles[c];
  const q = [0, 1, 2, 3].map((i) => med(a.filter((_, idx) => Math.floor(idx / (dates.length / 4)) === i)).toFixed(2));
  console.log(`implied ${c} angle: median ${med(a).toFixed(2)} min ${Math.min(...a).toFixed(2)} max ${Math.max(...a).toFixed(2)} spread ${(Math.max(...a) - Math.min(...a)).toFixed(2)}  quarters ${q.join('|')}`);
}
console.log(`chosen angles fajr ${F} isha ${I}`);
for (const c of cols) {
  const res = dates.map((k) => {
    const printed = c === 'dhuhr' && rows[k].zuhr ? toMin(rows[k].zuhr) : toMin(rows[k][c]);
    return printed - time(c, k, F, I);
  });
  const m = med(res);
  const dev = res.map((v) => v - m);
  const within = dev.filter((v) => Math.abs(v) <= 1).length;
  const exact = dev.filter((v) => Math.abs(v) <= 0.5).length;
  const q = [0, 1, 2, 3].map((i) => med(res.filter((_, idx) => Math.floor(idx / (dates.length / 4)) === i)).toFixed(1));
  console.log(`${c.padEnd(8)} margin ${m.toFixed(2).padStart(6)}  MAE ${(dev.reduce((a, v) => a + Math.abs(v), 0) / dev.length).toFixed(2).padStart(5)}  within1 ${String(within).padStart(3)}/${dates.length}  exact ${String(exact).padStart(3)}  worst ${Math.max(...dev.map(Math.abs)).toFixed(1).padStart(5)}  quarters ${q.join('|')}`);
}
const jan = dates.filter((k) => k.slice(5, 7) === '01').map((k) => toMin(rows[k].fajr));
const jul = dates.filter((k) => k.slice(5, 7) === '07').map((k) => toMin(rows[k].fajr));
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`seasonal amplitude fajr Jan ${(avg(jan) / 60).toFixed(2)} Jul ${(avg(jul) / 60).toFixed(2)} span ${Math.abs(avg(jul) - avg(jan)).toFixed(0)} min`);
if (rows[dates[0]].imsak) {
  const d = dates.map((k) => toMin(rows[k].imsak) - toMin(rows[k].fajr));
  console.log(`imsak - fajr: median ${med(d).toFixed(0)} min, min ${Math.min(...d).toFixed(0)}, max ${Math.max(...d).toFixed(0)}`);
}
