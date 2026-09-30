// R11 Part 3, step 6. The Kiruna summer plateau bottoms out at a printed night of exactly
// 300 minutes (Shuruk 03:16, Magrib 22:16 at the solstice, a 19:00 day). That is a round
// number and a candidate rule in its own right: IFiS may cap the DAY LENGTH, or equivalently
// floor the night, rather than substitute a latitude.
//
// This script tests, on the IFiS Kiruna year: (a) the exact minimum printed night, (b) whether
// the printed Shuruk and Magrib are symmetric about solar midnight when the cap binds,
// (c) whether a night floor reproduces the whole polar stretch, and (d) what fraction of the
// PRINTED night the printed Fajr and Isha sit at.
import { readFileSync } from 'node:fs';
import { timeAtAngle, midDay, toH, hm } from '../countries/solar-harness.mjs';

const C = { lat: 67.8558, lng: 20.2253 };
const SR_ANG = 1.65;
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const load = (f) => {
  const rows = [];
  for (const line of readFileSync(new URL('../countries/' + f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const med = a => { if (!a.length) return NaN; const s = a.map(Math.abs).sort((x, y) => x - y); return +s[Math.floor(s.length / 2)].toFixed(1); };
const mx = a => { if (!a.length) return NaN; const s = a.map(Math.abs).sort((x, y) => x - y); return +s[s.length - 1].toFixed(1); };

const CITIES = {
  Malmo: { f: 'se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  Stockholm: { f: 'se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  Kiruna: { f: 'se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
};

console.log('=== printed day and night length extremes, per city ===');
console.log('city        minNight(min)  onDates            maxDay(min)   minDay   maxNight');
for (const [name, c] of Object.entries(CITIES)) {
  const rows = load(c.f);
  const nights = rows.map(r => ({ r, day: (toH(r.magrib) - toH(r.shuruk)) * 60 }));
  for (const n of nights) n.night = 1440 - n.day;
  const minN = Math.min(...nights.map(n => n.night));
  const dates = nights.filter(n => Math.abs(n.night - minN) < 0.6).map(n => `${MN[n.r.m]}${n.r.d}`);
  console.log(`${name.padEnd(11)} ${minN.toFixed(0).padStart(6)}        ${dates.slice(0, 4).join(',').padEnd(18)} ${Math.max(...nights.map(n => n.day)).toFixed(0).padStart(6)}      ${Math.min(...nights.map(n => n.day)).toFixed(0).padStart(5)}   ${Math.max(...nights.map(n => n.night)).toFixed(0)}`);
}

// Hypothesis: the printed Shuruk and Magrib are the true ones, EXCEPT that the night is
// floored at N minutes and then centred on solar midnight. Test at Kiruna.
console.log('\n=== Kiruna: night-floor hypothesis, printed Shuruk and Magrib against the floor ===');
console.log('floor(min)  shurukMedian  shurukMax  magribMedian  magribMax  daysFloorBinds');
{
  const rows = load(C.f = 'se-kiruna-2026.tsv');
  for (const floor of [240, 270, 285, 300, 315, 330, 360]) {
    const es = [], em = [];
    let binds = 0;
    for (const r of rows) {
      const noon = midDay(2026, r.m, r.d, C.lng, r.tz);
      const sr = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, r.tz, SR_ANG, -1);
      const ss = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, r.tz, SR_ANG, 1);
      // true night, in minutes, using the day between this morning's sunrise and this evening's sunset
      const trueNight = sr !== null && ss !== null ? 1440 - (ss - sr) * 60 : (sr === null ? 0 : null);
      if (trueNight === null) continue;
      if (trueNight >= floor) continue;
      binds++;
      // solar midnight is noon + 12h, wrapped; centre the floored night on it
      const mid = noon + 12 - 24; // e.g. noon 12.67 -> midnight 0.67 of the same calendar day
      const capSr = mid + floor / 120;
      const capSs = mid - floor / 120 + 24;
      es.push((toH(r.shuruk) - capSr) * 60);
      em.push((toH(r.magrib) - capSs) * 60);
    }
    console.log(`${String(floor).padStart(6)}      ${String(med(es)).padStart(6)}       ${String(mx(es)).padStart(6)}     ${String(med(em)).padStart(6)}      ${String(mx(em)).padStart(6)}     ${binds}`);
  }
}

// Hypothesis: a single substituted latitude applied ONLY on the days the true event has no
// solution, the true value being printed on every other day. This is Aqrab al-Bilad with a
// threshold, and it is what adhan's PolarCircleResolution.AqrabBalad does by stepping.
console.log('\n=== Kiruna: latitude substituted ONLY on days with no true solution ===');
console.log(' lat    shuruk med/max   magrib med/max   fajr med/max   isha med/max   nSub');
{
  const rows = load('se-kiruna-2026.tsv');
  for (const L of [63.0, 63.5, 64.0, 64.5, 65.0, 65.5, 66.0, 66.57]) {
    const e = { shuruk: [], magrib: [], fajr: [], isha: [] };
    let nSub = 0;
    for (const r of rows) {
      const cols = [
        ['shuruk', SR_ANG, -1], ['magrib', SR_ANG, 1], ['fajr', 18, -1], ['isha', 16, 1],
      ];
      for (const [col, ang, dir] of cols) {
        const tTrue = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, r.tz, ang, dir);
        const t = tTrue !== null ? tTrue : timeAtAngle(2026, r.m, r.d, L, C.lng, r.tz, ang, dir);
        if (t === null) continue;
        if (tTrue === null && col === 'shuruk') nSub++;
        e[col].push((toH(r[col]) - t) * 60);
      }
    }
    console.log(`${L.toFixed(2)}  ${['shuruk', 'magrib', 'fajr', 'isha'].map(k => `${String(med(e[k])).padStart(5)}/${String(mx(e[k])).padEnd(6)}`).join('  ')}  ${nSub}`);
  }
}

// What fraction of the PRINTED night do the printed Fajr and Isha sit at, all year?
console.log('\n=== Kiruna: printed Fajr and Isha as a fraction of the PRINTED night, per month ===');
console.log('month  fajrFrac(median)  ishaFrac(median)  printedNight(min, median)');
{
  const rows = load('se-kiruna-2026.tsv');
  for (let m = 1; m <= 12; m++) {
    const ff = [], iff = [], nn = [];
    for (const r of rows.filter(x => x.m === m)) {
      const night = 1440 - (toH(r.magrib) - toH(r.shuruk)) * 60;
      const gF = (toH(r.shuruk) - toH(r.fajr)) * 60;
      const gI = (toH(r.isha) - toH(r.magrib)) * 60;
      ff.push(gF / night); iff.push(gI / night); nn.push(night);
    }
    const q = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
    console.log(`${MN[m].padEnd(6)} ${q(ff).toFixed(4).padStart(12)}      ${q(iff).toFixed(4).padStart(12)}      ${q(nn).toFixed(0).padStart(6)}`);
  }
}
