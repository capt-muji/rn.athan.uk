// R11 Part 3, step 4. Before reading the Kiruna latitude gap as a substitution, rule out
// the cheaper explanation: that IFiS uses a sunrise depression other than 0.833 degrees.
// Invert the printed Shuruk and Magrib at each city's TRUE latitude to recover the angle
// IFiS actually uses, on the days where the angle is well determined.
import { readFileSync } from 'node:fs';
import { angleAtTime, asrFactorAtTime, timeAtAngle, midDay, toH } from '../countries/solar-harness.mjs';

const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL('../countries/' + f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2); };

const CITIES = {
  Malmo: { f: 'se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  Stockholm: { f: 'se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  Kiruna: { f: 'se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
};

console.log('=== angles implied by the printed columns, inverted at each city TRUE latitude ===');
console.log('city       column   n     p25     median   p75   (degrees below the horizon)');
for (const [name, c] of Object.entries(CITIES)) {
  const rows = load(c.f);
  const g = { fajr: [], shuruk: [], magrib: [], isha: [] };
  const asrF = [], dOff = [];
  for (const r of rows) {
    // Only trust days where the event is well determined: exclude any day where an
    // 18-degree Fajr or a 16-degree Isha has no solution, which is where the rule fires.
    const f18 = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, 18, -1);
    const i16 = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, 16, 1);
    const sr = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, 0.833, -1);
    if (sr !== null) {
      g.shuruk.push(angleAtTime(2026, r.m, r.d, c.lat, c.lng, r.tz, toH(r.shuruk)));
      g.magrib.push(angleAtTime(2026, r.m, r.d, c.lat, c.lng, r.tz, toH(r.magrib)));
      asrF.push(asrFactorAtTime(2026, r.m, r.d, c.lat, c.lng, r.tz, toH(r.asr)));
    }
    if (f18 !== null) g.fajr.push(angleAtTime(2026, r.m, r.d, c.lat, c.lng, r.tz, toH(r.fajr)));
    if (i16 !== null) g.isha.push(angleAtTime(2026, r.m, r.d, c.lat, c.lng, r.tz, toH(r.isha)));
    dOff.push((toH(r.dhohr) - midDay(2026, r.m, r.d, c.lng, r.tz)) * 60);
  }
  for (const k of ['fajr', 'shuruk', 'magrib', 'isha']) {
    console.log(`${name.padEnd(10)} ${k.padEnd(8)} ${String(g[k].length).padStart(3)}  ${String(q(g[k], 0.25)).padStart(6)}  ${String(q(g[k], 0.5)).padStart(6)}  ${String(q(g[k], 0.75)).padStart(6)}`);
  }
  console.log(`${name.padEnd(10)} asrFactor median ${q(asrF, 0.5)}, dhuhr offset median ${q(dOff, 0.5)} min`);
}

// Now the decisive test. At Kiruna the Shuruk column in DEEP WINTER, where the sun does rise,
// should invert to the same sunrise angle as Stockholm's if the latitude is not substituted.
console.log('\n=== Kiruna Shuruk column inverted at the true latitude, per month ===');
console.log('month  n   medianImpliedAngle   trueSunriseAngleUsedElsewhere 0.83');
{
  const c = CITIES.Kiruna, rows = load(c.f);
  for (let m = 1; m <= 12; m++) {
    const a = [];
    for (const r of rows.filter(x => x.m === m)) {
      const sr = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, 0.833, -1);
      if (sr !== null) a.push(angleAtTime(2026, r.m, r.d, c.lat, c.lng, r.tz, toH(r.shuruk)));
    }
    console.log(`${MN[m].padEnd(6)} ${String(a.length).padStart(2)}  ${a.length ? q(a, 0.5) : 'na'}`);
  }
}
