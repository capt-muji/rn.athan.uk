// R12: the JAKIM resolution. `measure-jakim-model.mjs` showed the published Fajr sits
// 9 to 10 minutes AFTER a 20-degree computation and 0.4 to 1.9 minutes after a bare
// 18-degree one, so neither "20 degrees" nor "18 degrees plus 10" describes the Fajr row.
//
// This script tests the hypothesis that resolves it: JAKIM's cited 20 degrees is the angle
// of its IMSAK row, its Fajr row is 18 degrees plus the documented 2-minute ihtiyati, and
// the decreed 10 minutes is the gap BETWEEN the two rows, not an offset applied to Fajr.
//
// It also sweeps every zone JAKIM publishes for the Imsak-to-Fajr gap, because
// `measure-jakim-model.mjs` found PLS01 publishes no distinct Imsak at all.
//
// Reuses R5's validated solar harness unchanged. No new astronomy.
import { timeAtAngle, toH, angleAtTime } from '../countries/solar-harness.mjs';

const MONTHS = {
  Jan: 1, Feb: 2, Mar: 3, Mac: 3, Apr: 4, May: 5, Mei: 5, Jun: 6, Jul: 7,
  Aug: 8, Ogos: 8, Sep: 9, Oct: 10, Okt: 10, Nov: 11, Dec: 12, Dis: 12,
};

const ZONES = [
  { zone: 'JHR02', place: 'Johor Bahru', lat: 1.4655, lng: 103.7578, tz: 8 },
  { zone: 'MLK01', place: 'Melaka', lat: 2.1896, lng: 102.2501, tz: 8 },
  { zone: 'WLY01', place: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, tz: 8 },
  { zone: 'PNG01', place: 'Penang', lat: 5.4141, lng: 100.3288, tz: 8 },
  { zone: 'KTN01', place: 'Kota Bharu', lat: 6.1254, lng: 102.2381, tz: 8 },
  { zone: 'PLS01', place: 'Perlis', lat: 6.4414, lng: 100.1986, tz: 8 },
];

async function loadZone(zone, period = 'year') {
  const res = await fetch(`https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=${period}&zone=${zone}`);
  if (!res.ok) throw new Error(`${zone}: HTTP ${res.status}`);
  const body = await res.json();
  if (!body.prayerTime) return null;
  return body.prayerTime.map((r) => {
    const [dd, mon, yyyy] = r.date.split('-');
    if (!MONTHS[mon]) throw new Error(`${zone}: unrecognised month "${mon}"`);
    return { y: +yyyy, m: MONTHS[mon], d: +dd, imsak: r.imsak.slice(0, 5), fajr: r.fajr.slice(0, 5) };
  });
}

const stat = (a) => {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y);
  const mean = a.reduce((t, v) => t + v, 0) / a.length;
  return { n: s.length, min: +s[0].toFixed(2), max: +s[s.length - 1].toFixed(2), mean: +mean.toFixed(2), sd: +Math.sqrt(a.reduce((t, v) => t + (v - mean) ** 2, 0) / a.length).toFixed(2) };
};

console.log('=== R12: is JAKIM\'s cited 20 degrees the angle of its IMSAK row? ===\n');

for (const z of ZONES) {
  const rows = await loadZone(z.zone);
  const imsakAngle = [], fajrAngle = [], imsakVs20 = [], fajrVs18 = [], gap = [];
  for (const r of rows) {
    const { y, m, d } = r;
    const i20 = timeAtAngle(y, m, d, z.lat, z.lng, z.tz, 20, -1);
    const f18 = timeAtAngle(y, m, d, z.lat, z.lng, z.tz, 18, -1);
    if (i20 === null || f18 === null) continue;
    imsakAngle.push(angleAtTime(y, m, d, z.lat, z.lng, z.tz, toH(r.imsak)));
    fajrAngle.push(angleAtTime(y, m, d, z.lat, z.lng, z.tz, toH(r.fajr)));
    imsakVs20.push((toH(r.imsak) - i20) * 60);
    fajrVs18.push((toH(r.fajr) - f18) * 60);
    gap.push(Math.round((toH(r.fajr) - toH(r.imsak)) * 60));
  }
  console.log(`--- ${z.zone} ${z.place}, ${z.lat} N ---`);
  console.log(`  published Imsak implied angle      ${JSON.stringify(stat(imsakAngle))}`);
  console.log(`  published Fajr implied angle       ${JSON.stringify(stat(fajrAngle))}`);
  console.log(`  Imsak minus 20-deg computation, min ${JSON.stringify(stat(imsakVs20))}`);
  console.log(`  Fajr minus 18-deg computation, min  ${JSON.stringify(stat(fajrVs18))}`);
  console.log(`  Fajr minus Imsak, min               ${JSON.stringify(stat(gap))}\n`);
}

// Every zone JAKIM publishes, for the Imsak-to-Fajr gap. PLS01 measured 0, which no
// earlier report records, so the question is how many zones publish no distinct Imsak.
console.log('=== the Imsak-to-Fajr gap across every JAKIM zone ===');
const states = ['JHR', 'KDH', 'KTN', 'MLK', 'NGS', 'PHG', 'PLS', 'PNG', 'PRK', 'SBH', 'SGR', 'SWK', 'TRG', 'WLY'];
const codes = [];
for (const s of states) for (let i = 1; i <= 9; i++) codes.push(`${s}0${i}`);
const byGap = new Map();
let ok = 0;
for (const code of codes) {
  let rows;
  try { rows = await loadZone(code, 'week'); } catch { continue; }
  if (!rows || !rows.length) continue;
  ok++;
  const gaps = [...new Set(rows.map((r) => Math.round((toH(r.fajr) - toH(r.imsak)) * 60)))];
  const key = gaps.join(',');
  if (!byGap.has(key)) byGap.set(key, []);
  byGap.get(key).push(code);
}
console.log(`zones that answered: ${ok} of ${codes.length} codes probed`);
for (const [gapMin, zones] of [...byGap.entries()].sort()) {
  console.log(`  gap ${gapMin} min: ${zones.length} zones  ${zones.join(' ')}`);
}
