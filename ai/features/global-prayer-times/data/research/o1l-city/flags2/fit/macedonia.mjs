// F3: Macedonia. bfi.mk's one-day Skopje row against vaktija.eu's month.
// Which surface is the anomaly: timezone field, DST, or city point?
import fs from 'node:fs';
import * as adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const HOME = process.env.HOME;
const BFI = JSON.parse(fs.readFileSync(`${HOME}/athan-gitree/census/o1l-city/balkan-cities/data/mk_bfi_2026-11-11.json`, 'utf8')).rows['2026-11-11'];
const VAK = JSON.parse(fs.readFileSync(`${HOME}/athan-gitree/census/o1l-city/balkan-cities/data/eu_vaktijaeu_2026.json`, 'utf8'));
const hm = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };

const SKOPJE = [42.0, 21.4333];
const TZ = 'Europe/Skopje';
const tzf = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const localMin = d => { const p = Object.fromEntries(tzf.formatToParts(d).map(x => [x.type, x.value])); return (+p.hour % 24) * 60 + +p.minute + +p.second / 60; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

function times(lat, lon, dateStr, fajrA, ishaA, madhab = adhan.Madhab.Shafi) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const p = new adhan.CalculationParameters('Other', fajrA, ishaA);
  p.madhab = madhab; p.rounding = adhan.Rounding.None;
  const pt = new adhan.PrayerTimes(new adhan.Coordinates(lat, lon), new Date(Date.UTC(y, m - 1, d, 12)), p);
  return { fajr: localMin(pt.fajr), sunrise: localMin(pt.sunrise), dhuhr: localMin(pt.dhuhr), asr: localMin(pt.asr), maghrib: localMin(pt.maghrib), isha: localMin(pt.isha) };
}

console.log('=== the two rows, 2026-11-11 ===');
console.log('bfi.mk  ', BFI);
console.log('vaktija ', VAK.skopje['2026-11-11']);
console.log('\ndelta bfi - vaktija:');
for (const c of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) console.log(`  ${c.padEnd(8)} ${(hm(BFI[c]) - hm(VAK.skopje['2026-11-11'][c])) > 0 ? '+' : ''}${hm(BFI[c]) - hm(VAK.skopje['2026-11-11'][c])} min`);

// ---- 1. vaktija.eu's month against the engine at Skopje, 18/16 Shafi ----
console.log('\n=== vaktija.eu Skopje, November 2026, 18/16 Shafi, engine at 42.0/21.4333 ===');
const res = {};
for (const date of Object.keys(VAK.skopje).sort()) {
  const t = times(SKOPJE[0], SKOPJE[1], date, 18, 16);
  for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    (res[c] ||= []).push(hm(VAK.skopje[date][c]) - Math.round(t[c]));
  }
}
let tot = 0, w1 = 0;
for (const c of Object.keys(res)) {
  const a = res[c];
  tot += a.length; w1 += a.filter(x => Math.abs(x) <= 1).length;
  console.log(`  ${c.padEnd(8)} mean ${mean(a).toFixed(2).padStart(6)} min ${Math.min(...a)} max ${Math.max(...a)} within1 ${a.filter(x => Math.abs(x) <= 1).length}/${a.length}`);
}
console.log(`  all six within 1: ${w1}/${tot}`);

// ---- 2. what does bfi.mk's row require? scan the angles at Skopje ----
console.log('\n=== bfi.mk row: which fajr/isha angle reproduces it at Skopje? ===');
const t18 = times(SKOPJE[0], SKOPJE[1], '2026-11-11', 18, 16);
console.log('engine 18/16 at Skopje:', Object.fromEntries(Object.entries(t18).map(([k, v]) => [k, `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(Math.round(v % 60)).padStart(2, '0')}`])));
function solveAngle(target, kind) {
  let lo = 3, hi = 25;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const t = kind === 'fajr' ? times(SKOPJE[0], SKOPJE[1], '2026-11-11', mid, 16).fajr : times(SKOPJE[0], SKOPJE[1], '2026-11-11', 18, mid).isha;
    // larger fajr angle -> earlier fajr; larger isha angle -> later isha
    if (kind === 'fajr') { if (t > target) lo = mid; else hi = mid; }
    else { if (t < target) lo = mid; else hi = mid; }
  }
  return (lo + hi) / 2;
}
console.log(`  fajr angle that prints 05:28 at Skopje: ${solveAngle(hm(BFI.fajr), 'fajr').toFixed(2)} deg`);
console.log(`  isha angle that prints 17:35 at Skopje: ${solveAngle(hm(BFI.isha), 'isha').toFixed(2)} deg`);

// ---- 3. the point hypothesis: solve the longitude offset from the solar columns ----
console.log('\n=== point test: longitude offset implied by each solar column ===');
for (const c of ['dhuhr', 'asr', 'maghrib']) {
  const d = hm(BFI[c]) - t18[c];
  console.log(`  ${c.padEnd(8)} bfi - engine(18/16 at Skopje) = ${d.toFixed(1)} min  -> ${(d / 4).toFixed(2)} deg west`);
}
// solve the point that makes 18/16 fit dhuhr/asr/maghrib exactly
console.log('\n=== interval family: bfi fajr as sunrise-c, isha as maghrib+c ===');
const sr = t18.sunrise;
console.log(`  engine sunrise at Skopje ${(sr / 60).toFixed(2)}h; bfi fajr is ${(sr - hm(BFI.fajr)).toFixed(1)} min before it`);
console.log(`  engine maghrib at Skopje ${(t18.maghrib / 60).toFixed(2)}h; bfi isha is ${(hm(BFI.isha) - t18.maghrib).toFixed(1)} min after it`);

// ---- 4. is the bfi row consistent with a LATER date (a widget date defect)? ----
console.log('\n=== date-shift test: bfi row against the engine on other dates (18/16 Skopje) ===');
for (const date of ['2026-11-01', '2026-11-11', '2026-11-21', '2026-12-01', '2026-12-11', '2026-10-11']) {
  const t = times(SKOPJE[0], SKOPJE[1], date, 18, 16);
  const d = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(c => `${c[0]}${(hm(BFI[c]) - Math.round(t[c])).toFixed(0)}`).join(' ');
  console.log(`  ${date}: ${d}`);
}

// ---- 5. DST test: a one-hour uniform shift ----
console.log('\n=== DST test: bfi minus vaktija, spread ===');
const deltas = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(c => hm(BFI[c]) - hm(VAK.skopje['2026-11-11'][c]));
console.log(`  deltas ${deltas.join(', ')}  spread ${Math.max(...deltas) - Math.min(...deltas)} min (a DST defect is a uniform 60; a tz field a uniform whole hour)`);
