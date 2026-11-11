// F4: which rule does the hub's own annual carry, and what is the monthly's ladder?
import fs from 'node:fs';
import * as adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';
const HOME = process.env.HOME;
const ann = JSON.parse(fs.readFileSync(`${HOME}/athan-gitree/census/o1l-city/flags2/data/porto-annual-nov.json`, 'utf8')).annual_porto_nov;
const TZ = 'Europe/Lisbon';
const tzf = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const localMin = d => { const p = Object.fromEntries(tzf.formatToParts(d).map(x => [x.type, x.value])); return (+p.hour % 24) * 60 + +p.minute + +p.second / 60; };
const hm = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const LAT = 41.1579, LON = -8.6291;
function row(date, fajrA, ishaA, madhab) {
  const [y, m, d] = date.split('-').map(Number);
  const p = new adhan.CalculationParameters('Other', fajrA, ishaA);
  p.madhab = madhab; p.rounding = adhan.Rounding.None;
  const pt = new adhan.PrayerTimes(new adhan.Coordinates(LAT, LON), new Date(Date.UTC(y, m - 1, d, 12)), p);
  return { fajr: localMin(pt.fajr), sunrise: localMin(pt.sunrise), dhuhr: localMin(pt.dhuhr), asr: localMin(pt.asr), maghrib: localMin(pt.maghrib), isha: localMin(pt.isha) };
}
const dates = Object.keys(ann).sort();
for (const [fa, ia, mad, label] of [[18, 17, adhan.Madhab.Shafi, '18/17 Shafi'], [18, 17, adhan.Madhab.Hanafi, '18/17 Hanafi'], [18, 18, adhan.Madhab.Shafi, '18/18 Shafi']]) {
  const out = {};
  for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib']) out[c] = dates.map(d => hm(ann[d][c]) - Math.round(row(d, fa, ia, mad)[c]));
  const i80 = dates.map(d => hm(ann[d].isha80) - Math.round(row(d, fa, ia, mad).maghrib));
  console.log(`${label}: ` + Object.entries(out).map(([c, a]) => `${c} ${mean(a).toFixed(2)} (${Math.min(...a)}..${Math.max(...a)})`).join('  ') + `  | isha80-maghrib ${mean(i80).toFixed(1)} (${Math.min(...i80)}..${Math.max(...i80)})`);
}
// isha as an interval off the annual's own maghrib
const gap = dates.map(d => hm(ann[d].isha80) - hm(ann[d].maghrib));
console.log(`annual isha80 - own maghrib: mean ${mean(gap).toFixed(2)} min ${Math.min(...gap)} max ${Math.max(...gap)}`);
// asr as a fraction of the afternoon
const fr = dates.map(d => (hm(ann[d].asr) - hm(ann[d].dhuhr)) / (hm(ann[d].maghrib) - hm(ann[d].dhuhr)));
console.log(`annual asr fraction of the afternoon: mean ${mean(fr).toFixed(3)} ${Math.min(...fr).toFixed(3)}..${Math.max(...fr).toFixed(3)}`);
