// Diagnostic: KMF fajr residual structure. Implied margin per day at a
// candidate angle, grouped by month; plus implied-angle scan.
// Run: TZ=Asia/Seoul node kr-fajr-diag.js
import * as fs from 'node:fs';
import { loadAdhan, params, parseHHMM, p2m, fmtMin } from './lib.mjs';

const HOME = process.env.HOME;
const raw = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/koreajapan/data/kmf-seoul-2026-2027.json', 'utf8'));
const adhan = await loadAdhan();
const isos = Object.keys(raw).sort();
const rows = isos.map(iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return { iso, y, m, d, fajr: parseHHMM(raw[iso].fajr), sunrise: parseHHMM(raw[iso].sunrise), dhuhr: parseHHMM(raw[iso].dhuhr), asr: parseHHMM(raw[iso].asr), magrib: parseHHMM(raw[iso].magrib), isha: parseHHMM(raw[iso].isha) };
});
const c = new adhan.Coordinates(37.5665, 126.9780);

function fajrSec(angle) {
  return rows.map(r => {
    const p = params(adhan, angle, angle);
    const t = new adhan.PrayerTimes(c, new Date(r.y, r.m - 1, r.d), p);
    return t.fajr.getHours() * 3600 + t.fajr.getMinutes() * 60 + t.fajr.getSeconds();
  });
}

// Implied exact offset (printed minutes - computed seconds/60) per day.
function residuals(angle) {
  const sec = fajrSec(angle);
  return rows.map((r, i) => ({ iso: r.iso, m: r.m, res: r.fajr - sec[i] / 60 }));
}

for (const angle of [18, 18.5, 19.5, 15]) {
  const res = residuals(angle);
  const byMonth = {};
  for (const r of res) {
    byMonth[r.m] = byMonth[r.m] || [];
    byMonth[r.m].push(r.res);
  }
  console.log('angle', angle, 'monthly residual range (printed - computed, minutes):');
  for (const m of Object.keys(byMonth).map(Number).sort((a, b) => a - b)) {
    const v = byMonth[m];
    console.log('  M' + String(m).padStart(2) + '  min ' + Math.min(...v).toFixed(1).padStart(6) + '  max ' + Math.max(...v).toFixed(1).padStart(6));
  }
}

// Is the printed fajr a fixed offset from printed sunrise? from computed sunrise?
const fromSunrise = rows.map(r => r.sunrise - r.fajr);
const hist = {};
fromSunrise.forEach(v => hist[v] = (hist[v] || 0) + 1);
console.log('printed (sunrise - fajr) histogram:', JSON.stringify(hist));

// Computed sunrise (floor) vs printed sunrise exact-days count already known;
// compute implied fajr angle per day from printed fajr via bisection on angle.
function fajrMinAt(angle, r) {
  const p = params(adhan, angle, angle);
  const t = new adhan.PrayerTimes(c, new Date(r.y, r.m - 1, r.d), p);
  return p2m(t.fajr, 'floor');
}
function impliedAngle(r) {
  let lo = 5, hi = 60;
  if (fajrMinAt(lo, r) < r.fajr) return null; // printed earlier than any angle
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (fajrMinAt(mid, r) >= r.fajr) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
const im = rows.map(r => ({ iso: r.iso, m: r.m, a: impliedAngle(r) })).filter(x => x.a !== null);
const byMonth = {};
im.forEach(x => { (byMonth[x.m] = byMonth[x.m] || []).push(x.a); });
console.log('implied fajr angle (floor rounding), monthly mean/range:');
for (const m of Object.keys(byMonth).map(Number).sort((a, b) => a - b)) {
  const v = byMonth[m];
  const mean = v.reduce((s, x) => s + x, 0) / v.length;
  console.log('  M' + String(m).padStart(2) + '  mean ' + mean.toFixed(2) + '  min ' + Math.min(...v).toFixed(2) + '  max ' + Math.max(...v).toFixed(2));
}
