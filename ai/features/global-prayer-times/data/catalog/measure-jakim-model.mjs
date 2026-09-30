// R12: break the JAKIM tie. Is JAKIM best modelled as Fajr 20 degrees, or as Fajr 18
// degrees plus a decreed +10-minute offset?
//
// The two models are distinguishable by measurement because a fixed ANGLE converts to a
// different number of MINUTES at different latitudes and seasons, while a decreed OFFSET
// does not. JAKIM's own zones span 1.47 N (Johor Bahru) to 6.44 N (Perlis), and JAKIM
// publishes a whole year, so the discriminator is whether the published-minus-computed
// residual is FLAT (offset) or VARYING (angle).
//
// Reuses R5's validated solar harness unchanged. No new astronomy.
// Run `node ../countries/validate-harness.mjs` first; it must exit 0.
import { readFileSync } from 'node:fs';
import { timeAtAngle, asrTime, midDay, toH, angleAtTime } from '../countries/solar-harness.mjs';

// JAKIM zone anchors, from R6's `data/corrections/sites.mjs`, which is where the
// correction-table measurement took them. Anchor choice shifts a measured ANGLE but not
// the SHAPE of a residual, which is what this script tests.
const ZONES = [
  { zone: 'JHR02', place: 'Johor Bahru', lat: 1.4655, lng: 103.7578, tz: 8 },
  { zone: 'MLK01', place: 'Melaka', lat: 2.1896, lng: 102.2501, tz: 8 },
  { zone: 'WLY01', place: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, tz: 8 },
  { zone: 'PNG01', place: 'Penang', lat: 5.4141, lng: 100.3288, tz: 8 },
  { zone: 'KTN01', place: 'Kota Bharu', lat: 6.1254, lng: 102.2381, tz: 8 },
  { zone: 'PLS01', place: 'Perlis', lat: 6.4414, lng: 100.1986, tz: 8 },
];

// JAKIM's own feed emits MALAY month abbreviations (`Mac`, `Mei`, `Ogos`, `Okt`, `Dis`)
// for 5 of 12 months and English for the rest. Reading it as English silently drops 153
// rows of 365, which is the trap this map exists to close.
const MONTHS = {
  Jan: 1, Feb: 2, Mar: 3, Mac: 3, Apr: 4, May: 5, Mei: 5, Jun: 6, Jul: 7,
  Aug: 8, Ogos: 8, Sep: 9, Oct: 10, Okt: 10, Nov: 11, Dec: 12, Dis: 12,
};

async function loadZone(zone) {
  const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=year&zone=${zone}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${zone}: HTTP ${res.status}`);
  const body = await res.json();
  return body.prayerTime.map((r) => {
    const [dd, mon, yyyy] = r.date.split('-');
    if (!MONTHS[mon]) throw new Error(`${zone}: unrecognised month "${mon}" in "${r.date}"`);
    return { y: +yyyy, m: MONTHS[mon], d: +dd, imsak: r.imsak.slice(0, 5), fajr: r.fajr.slice(0, 5), syuruk: r.syuruk.slice(0, 5), dhuha: r.dhuha.slice(0, 5), dhuhr: r.dhuhr.slice(0, 5), asr: r.asr.slice(0, 5), maghrib: r.maghrib.slice(0, 5), isha: r.isha.slice(0, 5) };
  });
}

const stat = (a) => {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y);
  const mean = a.reduce((t, v) => t + v, 0) / a.length;
  return {
    n: s.length,
    min: +s[0].toFixed(2),
    max: +s[s.length - 1].toFixed(2),
    spread: +(s[s.length - 1] - s[0]).toFixed(2),
    mean: +mean.toFixed(2),
    sd: +Math.sqrt(a.reduce((t, v) => t + (v - mean) ** 2, 0) / a.length).toFixed(2),
  };
};

console.log('=== R12: JAKIM, 20 degrees against 18 degrees plus a decreed 10 minutes ===\n');

const all = [];
for (const z of ZONES) {
  const rows = await loadZone(z.zone);

  // Part 1: what is the published Fajr's implied angle, and what is the published
  // Imsak-to-Fajr gap? Both across the whole year.
  const fajrAngles = [], imsakGaps = [], dhuhaGaps = [], syurukGaps = [];
  // Part 2: the two candidate models, published minus computed, in minutes.
  const res20 = [], res18plus10 = [], res18 = [];
  // Part 3: the coordinate-invariant discriminator. How many minutes does the 20-degree
  // Fajr sit before the 18-degree Fajr on each day of the year? If a decreed 10 minutes
  // reproduces a 20-degree angle, this quantity must itself be a stable 10.
  const gap20to18 = [];

  for (const r of rows) {
    const { y, m, d } = r;
    const f20 = timeAtAngle(y, m, d, z.lat, z.lng, z.tz, 20, -1);
    const f18 = timeAtAngle(y, m, d, z.lat, z.lng, z.tz, 18, -1);
    if (f20 === null || f18 === null) continue;
    const pubF = toH(r.fajr);
    fajrAngles.push(angleAtTime(y, m, d, z.lat, z.lng, z.tz, pubF));
    imsakGaps.push(Math.round((pubF - toH(r.imsak)) * 60));
    syurukGaps.push(Math.round((toH(r.syuruk) - timeAtAngle(y, m, d, z.lat, z.lng, z.tz, 0.833, -1)) * 60));
    dhuhaGaps.push(Math.round((toH(r.dhuha) - toH(r.syuruk)) * 60));
    res20.push((pubF - f20) * 60);
    res18.push((pubF - f18) * 60);
    res18plus10.push((pubF - (f18 + 10 / 60)) * 60);
    gap20to18.push((f18 - f20) * 60);
  }

  const row = {
    zone: z.zone, place: z.place, lat: z.lat, days: res20.length,
    publishedFajrAngle: stat(fajrAngles),
    imsakToFajrMin: stat(imsakGaps),
    syurukMinusTrueSunriseMin: stat(syurukGaps),
    dhuhaMinusSyurukMin: stat(dhuhaGaps),
    residualVs20deg: stat(res20),
    residualVs18deg: stat(res18),
    residualVs18degPlus10: stat(res18plus10),
    minutesBetween20and18deg: stat(gap20to18),
  };
  all.push(row);

  console.log(`--- ${z.zone} ${z.place}, ${z.lat} N, ${row.days} days ---`);
  console.log(`  published Fajr implied angle          ${JSON.stringify(row.publishedFajrAngle)}`);
  console.log(`  published Imsak to Fajr, min          ${JSON.stringify(row.imsakToFajrMin)}`);
  console.log(`  Syuruk minus true sunrise, min        ${JSON.stringify(row.syurukMinusTrueSunriseMin)}`);
  console.log(`  Duha minus Syuruk, min                ${JSON.stringify(row.dhuhaMinusSyurukMin)}`);
  console.log(`  MODEL A, published minus 20 deg       ${JSON.stringify(row.residualVs20deg)}`);
  console.log(`  MODEL B, published minus (18 deg +10) ${JSON.stringify(row.residualVs18degPlus10)}`);
  console.log(`  (published minus bare 18 deg)         ${JSON.stringify(row.residualVs18deg)}`);
  console.log(`  20 deg sits this many min before 18   ${JSON.stringify(row.minutesBetween20and18deg)}\n`);
}

// The verdict. Which model has the smaller residual spread, and is the 20-to-18 gap
// stable enough across Malaysia for the two models to be confusable at all?
console.log('=== verdict ===');
const worseA = Math.max(...all.map((r) => Math.abs(r.residualVs20deg.mean)));
const worseB = Math.max(...all.map((r) => Math.abs(r.residualVs18degPlus10.mean)));
const spreadA = Math.max(...all.map((r) => r.residualVs20deg.spread));
const spreadB = Math.max(...all.map((r) => r.residualVs18degPlus10.spread));
console.log(`MODEL A (20 deg):        worst |mean| residual across zones ${worseA.toFixed(2)} min, worst spread ${spreadA.toFixed(2)} min`);
console.log(`MODEL B (18 deg + 10):   worst |mean| residual across zones ${worseB.toFixed(2)} min, worst spread ${spreadB.toFixed(2)} min`);
const gapRange = all.map((r) => r.minutesBetween20and18deg);
console.log(`the 20-to-18 degree gap ranges ${Math.min(...gapRange.map((g) => g.min)).toFixed(1)} to ${Math.max(...gapRange.map((g) => g.max)).toFixed(1)} minutes across all zones and days`);
console.log(`\n${JSON.stringify(all, null, 2)}`);
