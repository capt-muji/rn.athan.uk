// R11 Part 1, the new-source sweep. R9's measure-mawaqit-country.mjs pattern extended to the
// countries R9 did not reach and this report needs: Finland, Iceland, Denmark, Scotland,
// northern Russia, the Canadian prairies and Alaska. Same keyless Mawaqit search, same
// invertRow, same jamaah sanity gate that drops congregation schedules typed into the
// calculation fields.
//
// Today is close to equinox, so a single day separates a 12-degree convention from an
// 18-degree one and rules a Hanafi Asr in or out. It does NOT identify a high-latitude rule,
// because no rule binds at equinox. That is stated on the report row.
import { invertRow } from '../countries/solar-harness.mjs';

const TARGETS = {
  FI: { tz: 3, cities: [['Helsinki', 60.1699, 24.9384], ['Turku', 60.4518, 22.2666], ['Tampere', 61.4978, 23.7610], ['Oulu', 65.0121, 25.4651]] },
  IS: { tz: 0, cities: [['Reykjavik', 64.1466, -21.9426]] },
  DK: { tz: 2, cities: [['Copenhagen', 55.6761, 12.5683], ['Aarhus', 56.1629, 10.2039], ['Odense', 55.4038, 10.4024]] },
  GB_SCT: { tz: 1, cities: [['Glasgow', 55.8642, -4.2518], ['Edinburgh', 55.9533, -3.1883], ['Aberdeen', 57.1497, -2.0943], ['Dundee', 56.4620, -2.9707]] },
  RU_N: { tz: 3, cities: [['Saint Petersburg', 59.9311, 30.3609], ['Murmansk', 68.9585, 33.0827], ['Arkhangelsk', 64.5401, 40.5433], ['Syktyvkar', 61.6688, 50.8364]] },
  CA_PRAIRIE: { tz: -6, cities: [['Edmonton', 53.5461, -113.4938], ['Calgary', 51.0447, -114.0719], ['Saskatoon', 52.1332, -106.6700], ['Winnipeg', 49.8951, -97.1384]] },
  CA_OTHER: { tz: -7, cities: [['Vancouver', 49.2827, -123.1207]] },
  US_AK: { tz: -8, cities: [['Anchorage', 61.2181, -149.9003], ['Fairbanks', 64.8378, -147.7164]] },
  SE_N: { tz: 2, cities: [['Umea', 63.8258, 20.2630], ['Lulea', 65.5848, 22.1567], ['Kiruna', 67.8558, 20.2253]] },
  NO_N: { tz: 2, cities: [['Tromso', 69.6492, 18.9553], ['Trondheim', 63.4305, 10.3951], ['Bodo', 67.2804, 14.4049]] },
};

const [Y, M, D] = process.argv.slice(2).length >= 3 ? process.argv.slice(2) : ['2026', '9', '30'];
const summary = {};
for (const [key, c] of Object.entries(TARGETS)) {
  const rows = [];
  let dropped = 0, empty = 0;
  for (const [city, lat, lng] of c.cities) {
    let list;
    try {
      const res = await fetch(`https://mawaqit.net/api/2.0/mosque/search?lat=${lat}&lon=${lng}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) { console.log(`${key} ${city}: HTTP ${res.status}`); continue; }
      list = await res.json();
    } catch (e) { console.log(`${key} ${city}: ${e.message}`); continue; }
    if (!Array.isArray(list) || !list.length) { empty++; continue; }
    for (const m of list) {
      const t = m.times;
      if (!Array.isArray(t) || t.length < 6 || t.some(x => !/^\d{1,2}:\d{2}$/.test(x))) continue;
      if (Math.abs(m.latitude - lat) > 2 || Math.abs(m.longitude - lng) > 3) continue;
      const inv = invertRow({ y: +Y, m: +M, d: +D, lat: m.latitude, lng: m.longitude, tz: c.tz, fajr: t[0], sunrise: t[1], dhuhr: t[2], asr: t[3], maghrib: t[4], isha: t[5] });
      const sane = inv.dhuhrOffsetMin >= -6 && inv.dhuhrOffsetMin <= 12
        && inv.maghribMinusSunsetMin >= -3 && inv.maghribMinusSunsetMin <= 15
        && inv.fajrAngle > 5 && inv.fajrAngle < 25 && inv.ishaAngle > 5 && inv.ishaAngle < 25;
      if (!sane) { dropped++; continue; }
      rows.push({ city, name: m.name, lat: m.latitude, ...inv });
    }
  }
  const stat = k => {
    const a = rows.map(r => r[k]).filter(x => typeof x === 'number').sort((x, y) => x - y);
    if (!a.length) return null;
    return { n: a.length, min: a[0], q1: a[Math.floor(0.25 * a.length)], median: a[Math.floor(0.5 * a.length)], q3: a[Math.floor(0.75 * a.length)], max: a[a.length - 1] };
  };
  summary[key] = { kept: rows.length, dropped, citiesWithNoMosque: empty, fajr: stat('fajrAngle'), isha: stat('ishaAngle'), asr: stat('asrFactor'), dhuhr: stat('dhuhrOffsetMin'), maghrib: stat('maghribMinusSunsetMin'), hanafi: rows.filter(r => r.asrFactor > 1.5).length, rows: rows.map(r => ({ city: r.city, name: (r.name || '').slice(0, 44), lat: +r.lat.toFixed(3), fajr: r.fajrAngle, isha: r.ishaAngle, asr: r.asrFactor, mgrb: r.maghribMinusSunsetMin })) };
  console.log(`\n=== ${key}: ${rows.length} mosques kept, ${dropped} dropped by the jamaah gate, ${empty} cities returned nothing ===`);
  for (const r of summary[key].rows) console.log(`  fajr ${String(r.fajr).padStart(6)}  isha ${String(r.isha).padStart(6)}  asr ${String(r.asr).padStart(5)}  mgrb+${String(r.mgrb).padStart(3)}  ${String(r.lat).padStart(7)}N  ${r.city.padEnd(17)} ${r.name}`);
  if (rows.length) {
    console.log(`  fajr   ${JSON.stringify(summary[key].fajr)}`);
    console.log(`  isha   ${JSON.stringify(summary[key].isha)}`);
    console.log(`  asr    ${JSON.stringify(summary[key].asr)}  Hanafi ${summary[key].hanafi} of ${rows.length}`);
    console.log(`  mgrb   ${JSON.stringify(summary[key].maghrib)}`);
  }
}
const { writeFileSync } = await import('node:fs');
writeFileSync(new URL('./highlat-mosques-summary.json', import.meta.url), JSON.stringify({ date: `${Y}-${M}-${D}`, summary }, null, 2));
