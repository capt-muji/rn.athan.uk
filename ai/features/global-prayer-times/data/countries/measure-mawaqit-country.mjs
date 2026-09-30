// R9: measure what mosques in a given country actually print, through Mawaqit's
// keyless public mosque search:
//   GET https://mawaqit.net/api/2.0/mosque/search?lat=<lat>&lon=<lon>
// which returns the nearest mosques with each one's OWN coordinates and its OWN
// times for today as [fajr, shuruq, dhuhr, asr, maghrib, isha].
//
// This is tier B evidence, not tier A: it is what mosques print, not what a national
// authority decreed. Where a country HAS no national authority, which is most of the
// list below, tier B is the strongest evidence that exists.
//
// Usage: node measure-mawaqit-country.mjs <YYYY> <MM> <DD> <countryKey>
import { invertRow } from './solar-harness.mjs';

const COUNTRIES = {
  NG: { tz: 1, cities: [['Lagos', 6.5244, 3.3792], ['Kano', 12.0022, 8.5920], ['Abuja', 9.0765, 7.3986], ['Ibadan', 7.3775, 3.9470]] },
  SN: { tz: 0, cities: [['Dakar', 14.7167, -17.4677], ['Touba', 14.8500, -15.8833]] },
  CI: { tz: 0, cities: [['Abidjan', 5.3600, -4.0083]] },
  ML: { tz: 0, cities: [['Bamako', 12.6392, -8.0029]] },
  NE: { tz: 1, cities: [['Niamey', 13.5117, 2.1251]] },
  TD: { tz: 1, cities: [['Ndjamena', 12.1348, 15.0557]] },
  DZ: { tz: 1, cities: [['Alger', 36.7538, 3.0588], ['Oran', 35.6969, -0.6331]] },
  TN: { tz: 1, cities: [['Tunis', 36.8065, 10.1815]] },
  LY: { tz: 2, cities: [['Tripoli', 32.8872, 13.1913]] },
  SD: { tz: 2, cities: [['Khartoum', 15.5007, 32.5599]] },
  SO: { tz: 3, cities: [['Mogadishu', 2.0469, 45.3182]] },
  KE: { tz: 3, cities: [['Nairobi', -1.2921, 36.8219], ['Mombasa', -4.0435, 39.6682]] },
  TZ: { tz: 3, cities: [['Dar es Salaam', -6.7924, 39.2083]] },
  ET: { tz: 3, cities: [['Addis Ababa', 9.0300, 38.7400]] },
  GH: { tz: 0, cities: [['Accra', 5.6037, -0.1870]] },
  ZA: { tz: 2, cities: [['Cape Town', -33.9249, 18.4241], ['Johannesburg', -26.2041, 28.0473], ['Durban', -29.8587, 31.0218]] },
  NL: { tz: 2, cities: [['Amsterdam', 52.3676, 4.9041], ['Rotterdam', 51.9244, 4.4777]] },
  BE: { tz: 2, cities: [['Brussels', 50.8503, 4.3517]] },
  ES: { tz: 2, cities: [['Madrid', 40.4168, -3.7038], ['Barcelona', 41.3874, 2.1686]] },
  IT: { tz: 2, cities: [['Rome', 41.9028, 12.4964], ['Milan', 45.4642, 9.1900]] },
  SE: { tz: 2, cities: [['Stockholm', 59.3293, 18.0686], ['Malmo', 55.6050, 13.0038]] },
  NO: { tz: 2, cities: [['Oslo', 59.9139, 10.7522]] },
  MK: { tz: 2, cities: [['Skopje', 41.9981, 21.4254]] },
  AU: { tz: 10, cities: [['Sydney', -33.8688, 151.2093], ['Melbourne', -37.8136, 144.9631]] },
  NZ: { tz: 13, cities: [['Auckland', -36.8485, 174.7633]] },
  BR: { tz: -3, cities: [['Sao Paulo', -23.5505, -46.6333]] },
  MX: { tz: -6, cities: [['Mexico City', 19.4326, -99.1332]] },
  AR: { tz: -3, cities: [['Buenos Aires', -34.6037, -58.3816]] },
  JP: { tz: 9, cities: [['Tokyo', 35.6762, 139.6503]] },
  KR: { tz: 9, cities: [['Seoul', 37.5665, 126.9780]] },
  TH: { tz: 7, cities: [['Bangkok', 13.7563, 100.5018]] },
  PH: { tz: 8, cities: [['Manila', 14.5995, 120.9842]] },
  CN: { tz: 8, cities: [['Urumqi', 43.8256, 87.6168], ['Beijing', 39.9042, 116.4074]] },
  TT: { tz: -4, cities: [['Port of Spain', 10.6596, -61.5089]] },
  GY: { tz: -4, cities: [['Georgetown', 6.8013, -58.1551]] },
  SR: { tz: -3, cities: [['Paramaribo', 5.8520, -55.2038]] },
  FJ: { tz: 12, cities: [['Suva', -18.1248, 178.4501]] },
};

const [Y, M, D, KEY] = process.argv.slice(2);
const c = COUNTRIES[KEY];
if (!c) { console.error(`unknown country key. known: ${Object.keys(COUNTRIES).join(' ')}`); process.exit(1); }

const rows = [];
let dropped = 0;
for (const [city, lat, lng] of c.cities) {
  const res = await fetch(`https://mawaqit.net/api/2.0/mosque/search?lat=${lat}&lon=${lng}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) { console.log(`${city}: HTTP ${res.status}`); continue; }
  const list = await res.json();
  for (const m of list) {
    const t = m.times;
    if (!Array.isArray(t) || t.length < 6 || t.some(x => !/^\d{1,2}:\d{2}$/.test(x))) continue;
    // Reject a mosque more than ~2 degrees away: the search widens across borders.
    if (Math.abs(m.latitude - lat) > 2 || Math.abs(m.longitude - lng) > 2) continue;
    const inv = invertRow({ y: +Y, m: +M, d: +D, lat: m.latitude, lng: m.longitude, tz: c.tz,
      fajr: t[0], sunrise: t[1], dhuhr: t[2], asr: t[3], maghrib: t[4], isha: t[5] });
    // SANITY GATE, and it is load-bearing. Mawaqit lets a mosque type its CONGREGATION
    // times into the same fields, and several do. Dhuhr and Maghrib are solar anchors
    // that no convention moves by more than a few minutes, so a row whose Dhuhr is
    // more than 12 minutes off true noon, or whose Maghrib is more than 15 minutes
    // after sunset, is a jamaah schedule and not a computed timetable. Those rows say
    // nothing about the country's convention and are dropped rather than averaged in.
    const sane = inv.dhuhrOffsetMin >= -6 && inv.dhuhrOffsetMin <= 12
      && inv.maghribMinusSunsetMin >= -3 && inv.maghribMinusSunsetMin <= 15
      && inv.fajrAngle > 5 && inv.fajrAngle < 25 && inv.ishaAngle > 5 && inv.ishaAngle < 25;
    if (!sane) { dropped++; continue; }
    rows.push({ city, name: m.name, ...inv });
  }
}

console.log(`${KEY}: ${rows.length} mosques kept, ${dropped} dropped by the jamaah sanity gate`);
for (const r of rows)
  console.log(String(r.fajrAngle).padStart(6), String(r.ishaAngle).padStart(6),
    'asr', String(r.asrFactor).padStart(5), 'dhuhr', String(r.dhuhrOffsetMin).padStart(5),
    'mgrb+', String(r.maghribMinusSunsetMin).padStart(3), '|', r.city.padEnd(14), (r.name || '').slice(0, 40));

const stat = key => {
  const a = rows.map(r => r[key]).filter(x => typeof x === 'number').sort((x, y) => x - y);
  if (!a.length) return null;
  return { n: a.length, min: a[0], q1: a[Math.floor(0.25 * a.length)], median: a[Math.floor(0.5 * a.length)],
    q3: a[Math.floor(0.75 * a.length)], max: a[a.length - 1] };
};
if (rows.length) {
  console.log('\nsummary');
  for (const k of ['fajrAngle', 'ishaAngle', 'asrFactor', 'dhuhrOffsetMin', 'maghribMinusSunsetMin'])
    console.log('  ', k.padEnd(22), JSON.stringify(stat(k)));
  const hanafi = rows.filter(r => r.asrFactor > 1.5).length;
  console.log(`   mosques printing a Hanafi (two-shadow) Asr: ${hanafi} of ${rows.length}`);
}
