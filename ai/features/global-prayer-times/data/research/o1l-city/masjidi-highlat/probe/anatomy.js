'use strict';
// Daily anatomy of one high-lat table: is the clamp a night fraction, an interval floor,
// or an angle cap? Prints the quantities that discriminate.
const fs = require('fs');
const { sunAlt, jdFromUTC } = require('./solar');
const SRC = process.env.HOME + '/athan-gitree/census/o1l-city/masjidi/data/tables';

const id = process.argv[2] || '394';
const LAT = Number(process.argv[3] || 59.86);
const LON = Number(process.argv[4] || 9.99);
const OFF = Number(process.argv[5] || 60);
const AF = Number(process.argv[6] || 16.4);
const AI = Number(process.argv[7] || 14.8);

function mins(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }

// solve for the clock minute where altitude == target on the morning/evening branch
function solveAlt(lat, lon, y, mo, d, target, off, morning) {
  let lo, hi;
  if (morning) { lo = 0; hi = 720; } else { lo = 720; hi = 1439; }
  const f = m => sunAlt(jdFromUTC(y, mo, d, (m - off) / 60), lat, lon) - target;
  let flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

const d = JSON.parse(fs.readFileSync(`${SRC}/table_${id}.json`, 'utf8'));
const keys = Object.keys(d.days).sort();
console.log(`table ${id} lat ${LAT} fajrAngle ${AF} ishaAngle ${AI}`);
console.log('date        decl  midAlt  angF   pubF  dF   N    fInt  fInt/N   angI   pubI  dI   iInt  iInt/N');
for (const k of keys) {
  const [y, mo, dd] = k.split('-').map(Number);
  const r = d.days[k];
  const f = mins(r.fajr), sr = mins(r.sunrise), m = mins(r.maghrib), i = mins(r.isha);
  // declination proxy: altitude at solar midnight
  const noon = (sr + m) / 2;
  const midAlt = sunAlt(jdFromUTC(y, mo, dd, ((noon + 720) % 1440 - OFF) / 60), LAT, LON);
  const decl = midAlt + 90 - LAT;
  const angF = solveAlt(LAT, LON, y, mo, dd, -AF, OFF, true);
  const angI = solveAlt(LAT, LON, y, mo, dd, -AI, OFF, false);
  const N = 1440 - (m - sr);
  if (dd % 5 !== 0 && dd !== 1) continue;
  const fm = v => v == null ? '  --  ' : v.toFixed(1).padStart(6);
  console.log(`${k} ${decl.toFixed(1).padStart(5)} ${midAlt.toFixed(1).padStart(6)} ${fm(angF)} ${String(f).padStart(5)} ${angF == null ? '  --' : (f - angF).toFixed(1).padStart(5)} ${String(N).padStart(4)} ${String(sr - f).padStart(5)} ${((sr - f) / N).toFixed(3).padStart(7)} ${fm(angI)} ${String(i).padStart(5)} ${angI == null ? '  --' : (i - angI).toFixed(1).padStart(5)} ${String(i - m).padStart(5)} ${((i - m) / N).toFixed(3).padStart(7)}`);
}
