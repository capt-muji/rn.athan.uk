// R9: measure what French mosques actually print, rather than citing the
// 12-versus-18 dispute. Mawaqit's public mosque search is keyless and returns
// each mosque's OWN times for today alongside its own coordinates:
//   GET https://mawaqit.net/api/2.0/mosque/search?lat=<lat>&lon=<lon>
// The `times` array is [fajr, shuruq, dhuhr, asr, maghrib, isha].
//
// Each mosque's row is inverted at that mosque's own coordinates, so the recovered
// Fajr and Isha depression angles are the mosque's, not an assumed city centre's.
import { invertRow } from './solar-harness.mjs';

const CITIES = [
  { city: 'Paris', lat: 48.8566, lng: 2.3522 },
  { city: 'Marseille', lat: 43.2965, lng: 5.3698 },
  { city: 'Lyon', lat: 45.7640, lng: 4.8357 },
  { city: 'Lille', lat: 50.6292, lng: 3.0573 },
  { city: 'Toulouse', lat: 43.6047, lng: 1.4442 },
  { city: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
];

const TZ = 2; // CEST on the fetch date; France is on summer time until late October.
const [Y, M, D] = process.argv.slice(2, 5).map(Number);

// Bucket a measured Fajr angle onto the two published French positions.
const bucket = a =>
  a < 13.2 ? '12 deg (Musulmans de France)'
  : a < 15.9 ? '13 to 15 deg'
  : a < 17.2 ? '16 to 17 deg'
  : a < 19.0 ? '18 deg (Grande Mosquee de Paris)'
  : 'deeper than 19 deg';

const tally = {}, rows = [];
for (const c of CITIES) {
  const res = await fetch(`https://mawaqit.net/api/2.0/mosque/search?lat=${c.lat}&lon=${c.lng}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const list = await res.json();
  for (const m of list) {
    if (m.countryCode && m.countryCode !== 'FR') continue;
    const t = m.times;
    if (!Array.isArray(t) || t.length < 6 || t.some(x => !/^\d{1,2}:\d{2}$/.test(x))) continue;
    const inv = invertRow({
      y: Y, m: M, d: D, lat: m.latitude, lng: m.longitude, tz: TZ,
      fajr: t[0], sunrise: t[1], dhuhr: t[2], asr: t[3], maghrib: t[4], isha: t[5],
    });
    const b = bucket(inv.fajrAngle);
    tally[b] = (tally[b] || 0) + 1;
    rows.push({ city: c.city, name: m.name, ...inv, bucket: b });
  }
}

console.log(`mosques measured: ${rows.length}`);
for (const r of rows) {
  console.log(
    String(r.fajrAngle).padStart(6), String(r.ishaAngle).padStart(6),
    'asr', String(r.asrFactor).padStart(5),
    'dhuhr', String(r.dhuhrOffsetMin).padStart(5),
    'mgrb+', String(r.maghribMinusSunsetMin).padStart(3),
    '|', r.city.padEnd(11), r.name.slice(0, 44));
}

console.log('\nFajr angle distribution');
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
  console.log(String(v).padStart(4), `${(100 * v / rows.length).toFixed(1)}%`.padStart(7), k);
}

const stat = (key) => {
  const a = rows.map(r => r[key]).filter(x => typeof x === 'number').sort((x, y) => x - y);
  return { min: a[0], q1: a[Math.floor(0.25 * a.length)], median: a[Math.floor(0.5 * a.length)],
    q3: a[Math.floor(0.75 * a.length)], max: a[a.length - 1] };
};
console.log('\nfajrAngle  ', JSON.stringify(stat('fajrAngle')));
console.log('ishaAngle  ', JSON.stringify(stat('ishaAngle')));
console.log('asrFactor  ', JSON.stringify(stat('asrFactor')));
console.log('maghrib+min', JSON.stringify(stat('maghribMinusSunsetMin')));
