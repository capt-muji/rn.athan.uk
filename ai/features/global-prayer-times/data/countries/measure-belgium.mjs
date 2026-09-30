// R9: measure the Executief van de Moslims van Belgie's own 2026 annual table.
//
// This is the only national-authority table found in this report that STATES its
// own high-latitude rule in writing, in three languages, on the same page as the
// times. Its French text reads:
//
//   "La decision du Conseil des Theologiens concernant les prieres du maghreb et
//    d'al-'icha, pendant la periode ou l'observation de signes distinctifs
//    permettant de determiner celles-ci est perturbee, impossible ou difficilement
//    realisable (a partir de la latitude 45, et du debut mai a la fin juillet), se
//    base sur l'approximation la plus proche de ces signes.
//    Pendant cette periode le regroupement avance 'jam'ou taqdim' de ces prieres du
//    maghreb et d'al-'icha est permis."
//
// The Arabic on the same page names the mechanism precisely: التقدير النسبي لخط
// عرض 45, the RELATIVE ESTIMATE AT LATITUDE 45. That is a named, checkable rule, and
// this script checks it: compute at latitude 45 with Brussels's own longitude, and
// see whether the published summer Fajr and Isha fall out.
import { readFileSync } from 'node:fs';
import { invertRow, timeAtAngle, toH, hm } from './solar-harness.mjs';

// Brussels, the table's own anchor ("Bruxelles, Antwerpen et Charleroi").
const LAT = 50.8503, LNG = 4.3517;
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;

const rows = [];
for (const line of readFileSync(new URL('./be-emb-2026.tsv', import.meta.url), 'utf8').split('\n')) {
  const c = line.split('\t');
  if (c.length !== 8) continue;
  rows.push({ m: +c[0], d: +c[1], fajr: c[2], sunrise: c[3], dhuhr: c[4], asr: c[5], maghrib: c[6], isha: c[7] });
}
console.log(`${rows.length} days of the EMB's own 2026 table, anchored on Brussels`);

const stat = a => {
  const s = [...a].sort((x, y) => x - y);
  return { n: s.length, min: s[0], q1: s[Math.floor(0.25 * s.length)], median: s[Math.floor(0.5 * s.length)],
    q3: s[Math.floor(0.75 * s.length)], max: s[s.length - 1] };
};

// 1. Outside the declared May-to-July window, the table should be a plain angle.
const winter = rows.filter(r => r.m < 5 || r.m > 7);
const acc = { fajrAngle: [], sunriseAngle: [], dhuhrOffsetMin: [], asrFactor: [],
  maghribMinusSunsetMin: [], ishaAngle: [], ishaAfterMaghribMin: [] };
for (const r of winter) {
  const inv = invertRow({ y: 2026, m: r.m, d: r.d, lat: LAT, lng: LNG, tz: tzOf(r.m, r.d), ...r });
  for (const k of Object.keys(acc)) if (inv[k] !== undefined) acc[k].push(inv[k]);
}
console.log('\nAugust to April, outside the declared window');
for (const [k, a] of Object.entries(acc)) if (a.length) console.log('  ', k.padEnd(24), JSON.stringify(stat(a)));

// 2. Count the days where an 18-degree Fajr genuinely has no solution at Brussels.
let noSol = 0, first = null, last = null;
for (const r of rows) {
  const f = timeAtAngle(2026, r.m, r.d, LAT, LNG, tzOf(r.m, r.d), 18, -1);
  if (f === null) { noSol++; first ??= `${r.m}-${r.d}`; last = `${r.m}-${r.d}`; }
}
console.log(`\ndays where an 18-degree Fajr has no solution at Brussels (${LAT} N): ${noSol}` +
  (first ? `, ${first} to ${last}` : ''));
console.log(`the EMB prints a Fajr on all ${rows.length} parsed days regardless.`);

// 3. Test the EMB's OWN stated rule: the relative estimate at latitude 45.
const summer = rows.filter(r => r.m >= 5 && r.m <= 7);
const errLat45 = { fajr: [], isha: [] }, errSeventh = { fajr: [], isha: [] };
for (const r of summer) {
  const tz = tzOf(r.m, r.d);
  const f45 = timeAtAngle(2026, r.m, r.d, 45, LNG, tz, 18, -1);
  const i45 = timeAtAngle(2026, r.m, r.d, 45, LNG, tz, 17, 1);
  if (f45 !== null) errLat45.fajr.push((toH(r.fajr) - f45) * 60);
  if (i45 !== null) errLat45.isha.push((toH(r.isha) - i45) * 60);
  const sr = timeAtAngle(2026, r.m, r.d, LAT, LNG, tz, 0.833, -1);
  const ss = timeAtAngle(2026, r.m, r.d, LAT, LNG, tz, 0.833, 1);
  if (sr !== null && ss !== null) {
    const night = 24 - (ss - sr);
    errSeventh.fajr.push((toH(r.fajr) - (sr - night / 7)) * 60);
    errSeventh.isha.push((toH(r.isha) - (ss + night / 7)) * 60);
  }
}
const absStat = a => {
  const s = a.map(Math.abs).sort((x, y) => x - y);
  return { n: s.length, medianAbsMin: +s[Math.floor(s.length / 2)].toFixed(1), maxAbsMin: +s[s.length - 1].toFixed(1) };
};
console.log('\nMay to July, the declared window: published against each candidate rule');
console.log('   latitude-45 relative estimate, Fajr 18 ', JSON.stringify(absStat(errLat45.fajr)));
console.log('   latitude-45 relative estimate, Isha 17 ', JSON.stringify(absStat(errLat45.isha)));
console.log('   one-seventh of the night, Fajr         ', JSON.stringify(absStat(errSeventh.fajr)));
console.log('   one-seventh of the night, Isha         ', JSON.stringify(absStat(errSeventh.isha)));

// 4. The consequence the EMB itself flags: does the printed Isha run past midnight?
const pastMidnight = summer.filter(r => /^0?0:/.test(r.isha) || /^0?1:/.test(r.isha));
console.log(`\ndays in the window where the printed 'Icha falls after midnight: ${pastMidnight.length}`);
if (pastMidnight.length)
  console.log(`   for example ${pastMidnight[0].m}-${pastMidnight[0].d}: Maghrib ${pastMidnight[0].maghrib}, 'Icha ${pastMidnight[0].isha}`);
