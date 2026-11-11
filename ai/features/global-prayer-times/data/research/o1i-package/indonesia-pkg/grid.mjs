// O1i Indonesia package grid. Every one of adhan's 13 CalculationMethod presets is run
// VERBATIM: the preset object as CalculationMethod ships it, PrayerTimes constructed with it,
// nothing added, nothing reset. Its own methodAdjustments, rounding and defaults are the method.
//
// Two reference columns, both with the method at the city's own point:
//   basis   - Kemenag's recipe with no ihtiyati: 20/18 + solar, nearest minute, zero margins.
//   printed - Kemenag's published minutes, which carry the ministry's ihtiyati.
// The ihtiyati itself is measured per prayer and reported, never folded into a method.
//
// One child process per city with TZ set, asserted against the city's zone.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const B = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan';
const K = '$HOME/athan-gitree/census/o1h-global/indonesia/kemenag';

const CITIES = [
  { key: 'jakarta', name: 'Jakarta', island: 'Java (west)', tz: 'Asia/Jakarta', lat: -6.2088, lon: 106.8456, kLat: -6.18120002746582, kLon: 106.83512115478516 },
  { key: 'medan', name: 'Medan', island: 'Sumatra (north)', tz: 'Asia/Jakarta', lat: 3.5952, lon: 98.6722, kLat: 3.6290409564971924, kLon: 98.66719818115234 },
  { key: 'pontianak', name: 'Pontianak', island: 'Kalimantan (west)', tz: 'Asia/Pontianak', lat: -0.0263, lon: 109.3425, kLat: -0.025780638679862022, kLon: 109.33169555664062 },
  { key: 'surabaya', name: 'Surabaya', island: 'Java (east)', tz: 'Asia/Jakarta', lat: -7.2575, lon: 112.7521, kLat: -7.274322986602783, kLon: 112.72358703613281 },
  { key: 'makassar', name: 'Makassar', island: 'Sulawesi (south)', tz: 'Asia/Makassar', lat: -5.1477, lon: 119.4327, kLat: -5.135610103607178, kLon: 119.46389770507812 },
  { key: 'jayapura', name: 'Jayapura', island: 'Papua', tz: 'Asia/Jayapura', lat: -2.5337, lon: 140.7181, kLat: -2.6645259857177734, kLon: 140.80014038085938 },
];

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

// ------------------------------------------------------------------ child: one city

if (process.argv[2] === '--city') {
  const city = CITIES.find((c) => c.key === process.argv[3]);
  const require = createRequire(import.meta.url);
  const CP = require(`${B}/lib/cjs/CalculationParameters.js`).default;
  const CM = require(`${B}/lib/cjs/CalculationMethod.js`).default;
  const Madhab = require(`${B}/lib/cjs/Madhab.js`).Madhab;
  const SolarTime = require(`${B}/lib/cjs/SolarTime.js`).default;
  const { Coordinates, PrayerTimes } = require(`${B}/lib/cjs/Adhan.js`);

  const seen = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (seen !== city.tz) {
    console.error(`TZ mismatch ${city.key}: process ${seen}, city ${city.tz}`);
    process.exit(2);
  }

  // Wall-clock minutes for an instant, read through the process zone.
  const wallMin = (d) => (d.getTime() / 60000 + -d.getTimezoneOffset()) % 1440;

  // Kemenag's recipe with no ihtiyati, at the point given.
  const basisAt = (lat, lon, date) => {
    const p = new CP('Other', 20, 18);
    p.madhab = Madhab.Shafi;
    const pt = new PrayerTimes(new Coordinates(lat, lon), date, p);
    return Object.fromEntries(PRAYERS.map((x) => [x, wallMin(pt[x])]));
  };

  // The preset exactly as shipped, at the point given.
  const methodAt = (name, lat, lon, date) => {
    const pt = new PrayerTimes(new Coordinates(lat, lon), date, CM[name]());
    return Object.fromEntries(PRAYERS.map((x) => [x, wallMin(pt[x])]));
  };

  const parse = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const wrap = (d) => {
    let x = d % 1440;
    if (x > 720) x -= 1440;
    if (x < -720) x += 1440;
    return x;
  };

  const rows = JSON.parse(readFileSync(join(K, `${city.key}.json`), 'utf8')).rows;
  const dates = Object.keys(rows).sort();
  if (dates.length !== 365) {
    console.error(`${city.key}: ${dates.length} Kemenag rows, expected 365`);
    process.exit(3);
  }

  const names = Object.keys(CM);
  const acc = {};
  for (const n of names) {
    acc[n] = Object.fromEntries(PRAYERS.map((p) => [p, { basis: [], printed: [], printedK: [], coord: [] }]));
  }
  const ihtiyati = Object.fromEntries(PRAYERS.map((p) => [p, []]));
  const basisDrift = Object.fromEntries(PRAYERS.map((p) => [p, []]));
  let hlSlackMinutes = Infinity;

  for (const iso of dates) {
    const [y, mo, d] = iso.split('-').map(Number);
    const date = new Date(Date.UTC(y, mo - 1, d, 12));
    const bD = basisAt(city.lat, city.lon, date);
    const bK = basisAt(city.kLat, city.kLon, date);
    const printed = Object.fromEntries(PRAYERS.map((p) => [p, parse(rows[iso][p])]));

    for (const p of PRAYERS) {
      ihtiyati[p].push(Math.round(wrap(printed[p] - bK[p]) * 10) / 10);
      basisDrift[p].push(wrap(bD[p] - bK[p]));
    }

    // The package's default high-latitude rule is middle of the night. At 20 and 18 degrees
    // over the archipelago it must never bind; measure the slack so that claim is tested.
    const st = new SolarTime(date, new Coordinates(city.lat, city.lon));
    const tomorrow = new Date(Date.UTC(y, mo - 1, d + 1, 12));
    const stTomorrow = new SolarTime(tomorrow, new Coordinates(city.lat, city.lon));
    const nightHours = stTomorrow.sunrise + 24 - st.sunset;
    const slackFajr = (st.hourAngle(-20, false) - (st.sunrise - nightHours / 2)) * 60;
    const slackIsha = ((st.sunset + nightHours / 2) - st.hourAngle(-18, true)) * 60;
    hlSlackMinutes = Math.min(hlSlackMinutes, slackFajr, slackIsha);

    for (const n of names) {
      let mD;
      let mK;
      try {
        mD = methodAt(n, city.lat, city.lon, date);
        mK = methodAt(n, city.kLat, city.kLon, date);
      } catch (e) {
        console.error(`method ${n} threw at ${iso}: ${e}`);
        process.exit(4);
      }
      for (const p of PRAYERS) {
        if (!Number.isFinite(mD[p]) || !Number.isFinite(mK[p])) continue;
        acc[n][p].basis.push(wrap(mD[p] - bD[p]));
        acc[n][p].printed.push(wrap(mD[p] - printed[p]));
        acc[n][p].printedK.push(wrap(mK[p] - printed[p]));
        acc[n][p].coord.push(wrap(mD[p] - mK[p]));
      }
    }
  }

  const stats = (v) => {
    if (v.length === 0) return { n: 0, bias: null, mae: null, worst: null, within2: null };
    let s = 0;
    let a = 0;
    let worst = 0;
    let within = 0;
    for (const x of v) {
      s += x;
      a += Math.abs(x);
      if (Math.abs(x) > worst) worst = Math.abs(x);
      if (Math.abs(x) <= 2.0000001) within += 1;
    }
    return {
      n: v.length,
      bias: +(s / v.length).toFixed(3),
      mae: +(a / v.length).toFixed(3),
      worst: +worst.toFixed(1),
      within2: +((100 * within) / v.length).toFixed(1),
    };
  };
  const dist = (v) => {
    const sorted = v.slice().sort((x, y) => x - y);
    const mean = sorted.reduce((x, y) => x + y, 0) / sorted.length;
    const counts = new Map();
    for (const x of sorted) counts.set(x, (counts.get(x) || 0) + 1);
    const mode = [...counts.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0])[0][0];
    return { mean: +mean.toFixed(2), min: sorted[0], max: sorted[sorted.length - 1], mode };
  };

  const methods = {};
  for (const n of names) {
    const p = CM[n]();
    methods[n] = {
      shipped: {
        fajrAngle: p.fajrAngle,
        ishaAngle: p.ishaAngle,
        ishaInterval: p.ishaInterval,
        maghribAngle: p.maghribAngle,
        rounding: p.rounding,
        madhab: p.madhab,
        highLatitudeRule: p.highLatitudeRule,
        methodAdjustments: p.methodAdjustments,
      },
      prayers: Object.fromEntries(PRAYERS.map((x) => [x, {
        basis: stats(acc[n][x].basis),
        printed: stats(acc[n][x].printed),
        printedK: stats(acc[n][x].printedK),
        coord: stats(acc[n][x].coord),
      }])),
    };
  }

  process.stdout.write(JSON.stringify({
    key: city.key,
    name: city.name,
    island: city.island,
    tz: city.tz,
    lat: city.lat,
    lon: city.lon,
    kLat: city.kLat,
    kLon: city.kLon,
    days: dates.length,
    offsetMinutesChecked: [...new Set(dates.filter((_, i) => i % 45 === 0).map((iso) => {
      const [y, mo, d] = iso.split('-').map(Number);
      return -new Date(Date.UTC(y, mo - 1, d, 12)).getTimezoneOffset();
    }))],
    ihtiyati: Object.fromEntries(PRAYERS.map((p) => [p, dist(ihtiyati[p])])),
    basisDrift: Object.fromEntries(PRAYERS.map((p) => [p, stats(basisDrift[p])])),
    highLatitudeSlackMinutes: +hlSlackMinutes.toFixed(1),
    methods,
  }));
  process.exit(0);
}

// ------------------------------------------------------------------ parent: grid

const probe = {
  endpoint: 'https://bimasislam.kemenag.go.id/api/v1/public/prayer-times?city_id=<id>&date=<YYYY-MM-DD>',
  yearServed: 2026,
  tried: [
    { what: '2026-01-01', result: 'data' },
    { what: '2026-12-31', result: 'data' },
    { what: '2025-01-01', result: 'error: prayer times not found for the given city and date' },
    { what: '2025-06-15', result: 'error: prayer times not found for the given city and date' },
    { what: '2025-12-31', result: 'error: prayer times not found for the given city and date' },
    { what: '2024-06-15', result: 'error: prayer times not found for the given city and date' },
    { what: '2027-01-01', result: 'error: prayer times not found for the given city and date' },
    { what: 'second city, 2025-08-17', result: 'error: prayer times not found for the given city and date' },
    { what: 'date + &month=6&year=2025', result: 'rejected: date query parameter is required (YYYY-MM-DD)' },
    { what: '?month=6&year=2025 without date', result: 'rejected: date query parameter is required (YYYY-MM-DD)' },
    { what: 'prayer-times/monthly', result: '404' },
    { what: 'imsakiyah?month=&year=', result: 'same date-keyed handler, rejects without date' },
    { what: 'public site /jadwal-sholat?year=2025', result: 'page hard-initialises initialYear=2026; no year in the data request' },
  ],
  conclusion: 'The public API serves calendar 2026 only, one date per request. 2024 and 2025 are not obtainable from it, and the public page exposes no other year. Scored on 2026 alone.',
};

const cities = [];
for (const city of CITIES) {
  const res = spawnSync(process.execPath, [join(HERE, 'grid.mjs'), '--city', city.key], {
    env: { ...process.env, TZ: city.tz },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) {
    console.error(`FAILED ${city.key}\n${res.stderr}`);
    process.exit(1);
  }
  cities.push(JSON.parse(res.stdout));
  console.log(`done ${city.key}`);
}

const names = Object.keys(cities[0].methods);
const shortName = {
  MuslimWorldLeague: 'MWL 18/17',
  Egyptian: 'Egyptian 19.5/17.5',
  Karachi: 'Karachi 18/18',
  UmmAlQura: 'Umm al-Qura 18.5, +90',
  Dubai: 'Dubai 18.2/18.2',
  MoonsightingCommittee: 'Moonsighting 18/18',
  NorthAmerica: 'ISNA 15/15',
  Kuwait: 'Kuwait 18/17.5',
  Qatar: 'Qatar 18, +90',
  Singapore: 'Singapore 20/18',
  Tehran: 'Tehran 17.7/14',
  Turkey: 'Turkey 18/17',
  Other: 'Other 0/0',
};

const worstCity = (list, pick) => {
  let best = null;
  for (const c of list) {
    const x = pick(c);
    if (x === null) continue;
    if (best === null || x > best.value) best = { value: x, city: c.key };
  }
  return best;
};
const meanOf = (list, pick) => {
  const vals = list.map(pick).filter((v) => v !== null && v !== undefined);
  return vals.length === 0 ? null : +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3);
};

const methods = names.map((n) => {
  const perPrayer = {};
  for (const p of PRAYERS) {
    perPrayer[p] = {
      basis: {
        meanAcrossCities: meanOf(cities, (c) => c.methods[n].prayers[p].basis.mae),
        worstCity: worstCity(cities, (c) => c.methods[n].prayers[p].basis.mae),
        worstDay: worstCity(cities, (c) => c.methods[n].prayers[p].basis.worst).value,
        within2AtWorstCity: Math.min(...cities.map((c) => c.methods[n].prayers[p].basis.within2)),
        biasMeanAcrossCities: meanOf(cities, (c) => c.methods[n].prayers[p].basis.bias),
      },
      printed: {
        meanAcrossCities: meanOf(cities, (c) => c.methods[n].prayers[p].printed.mae),
        worstCity: worstCity(cities, (c) => c.methods[n].prayers[p].printed.mae),
        worstDay: worstCity(cities, (c) => c.methods[n].prayers[p].printed.worst).value,
        within2AtWorstCity: Math.min(...cities.map((c) => c.methods[n].prayers[p].printed.within2)),
        biasMeanAcrossCities: meanOf(cities, (c) => c.methods[n].prayers[p].printed.bias),
      },
      printedK: {
        meanAcrossCities: meanOf(cities, (c) => c.methods[n].prayers[p].printedK.mae),
        worstCity: worstCity(cities, (c) => c.methods[n].prayers[p].printedK.mae),
      },
      methodAtCityVsKemenagPoint: {
        worstCityMae: worstCity(cities, (c) => c.methods[n].prayers[p].coord.mae),
      },
    };
  }
  const worstPrayerBasis = PRAYERS.reduce((w, p) => (perPrayer[p].basis.worstCity.value > perPrayer[w].basis.worstCity.value ? p : w), PRAYERS[0]);
  const worstPrayerPrinted = PRAYERS.reduce((w, p) => (perPrayer[p].printed.worstCity.value > perPrayer[w].printed.worstCity.value ? p : w), PRAYERS[0]);
  const headlineBasis = Math.max(perPrayer.fajr.basis.worstCity.value, perPrayer.isha.basis.worstCity.value);
  const headlinePrinted = Math.max(perPrayer.fajr.printed.worstCity.value, perPrayer.isha.printed.worstCity.value);
  return {
    id: n,
    label: shortName[n],
    shipped: cities[0].methods[n].shipped,
    prayers: perPrayer,
    combinedBasis: { worstPrayer: worstPrayerBasis, worstCityMae: perPrayer[worstPrayerBasis].basis.worstCity.value, city: perPrayer[worstPrayerBasis].basis.worstCity.city },
    combinedPrinted: { worstPrayer: worstPrayerPrinted, worstCityMae: perPrayer[worstPrayerPrinted].printed.worstCity.value, city: perPrayer[worstPrayerPrinted].printed.worstCity.city },
    headlineBasis,
    headlinePrinted,
  };
});

methods.sort((a, b) => a.combinedBasis.worstCityMae - b.combinedBasis.worstCityMae);
methods.forEach((m, i) => { m.rank = i + 1; });
[...methods]
  .sort((a, b) => a.combinedPrinted.worstCityMae - b.combinedPrinted.worstCityMae)
  .forEach((m, i) => { m.printedRank = i + 1; });

const payload = {
  schema: 'o1i-indonesia-package-grid/1',
  generated: '2026-11-10',
  study: 'All 13 adhan CalculationMethod presets, verbatim, against Kemenag 2026 at six cities and six prayers.',
  package: { name: 'adhan', version: '4.4.6', path: B },
  year: 2026,
  references: {
    basis: { fajrAngle: 20, ishaAngle: 18, rounding: 'nearest', margins: 0, note: 'Kemenag parameter pair with no ihtiyati, solar times for the other four prayers, both sides at the city point.' },
    printed: { note: 'Kemenag published minutes, which carry the ministry ihtiyati measured per prayer at each city.' },
  },
  methodPoint: 'The method runs at the study city coordinates; the printed column compares against Kemenag minutes computed at Kemenag\'s own city point. Coordinate drift is measured and reported.',
  multiYear: probe,
  cities: cities.map((c) => {
    const cells = {};
    for (const n of names) {
      cells[n] = {};
      for (const p of PRAYERS) {
        const s = c.methods[n].prayers[p];
        cells[n][p] = {
          basisMae: s.basis.mae,
          basisBias: s.basis.bias,
          printedMae: s.printed.mae,
          printedBias: s.printed.bias,
          within2Basis: s.basis.within2,
          within2Printed: s.printed.within2,
        };
      }
    }
    let worstCoord = 0;
    for (const n of names) {
      for (const p of PRAYERS) worstCoord = Math.max(worstCoord, c.methods[n].prayers[p].coord.mae);
    }
    return {
      key: c.key, name: c.name, island: c.island, tz: c.tz, lat: c.lat, lon: c.lon, kLat: c.kLat, kLon: c.kLon,
      days: c.days,
      utcOffsetsMinutes: c.offsetMinutesChecked,
      ihtiyati: c.ihtiyati,
      basisDrift: c.basisDrift,
      highLatitudeSlackMinutes: c.highLatitudeSlackMinutes,
      coordinateDrift: {
        worstMethodWorstPrayerMae: worstCoord,
        worstBasisPrayerMae: Math.max(...PRAYERS.map((p) => c.basisDrift[p].mae)),
      },
      methods: cells,
    };
  }),
  methods,
};

writeFileSync(join(HERE, 'results.json'), JSON.stringify(payload, null, 1));

const fmt = (v) => (v === null ? '  -  ' : String(v).padStart(5));
console.log('\nbasis column (no ihtiyati), mean |dev| per prayer, worst city\n');
console.log('rank method                     fajr  sunrise dhuhr   asr  maghrib isha   worst');
for (const m of methods) {
  const row = PRAYERS.map((p) => fmt(m.prayers[p].basis.worstCity.value));
  console.log(`${String(m.rank).padStart(4)} ${m.label.padEnd(24)} ${row.join(' ')}   ${fmt(m.combinedBasis.worstCityMae)} ${m.combinedBasis.worstPrayer}@${m.combinedBasis.city}`);
}
console.log('\nprinted column (with ihtiyati), mean |dev| per prayer, worst city\n');
console.log('rank method                     fajr  sunrise dhuhr   asr  maghrib isha   worst');
for (const m of [...methods].sort((a, b) => a.printedRank - b.printedRank)) {
  const row = PRAYERS.map((p) => fmt(m.prayers[p].printed.worstCity.value));
  console.log(`${String(m.printedRank).padStart(4)} ${m.label.padEnd(24)} ${row.join(' ')}   ${fmt(m.combinedPrinted.worstCityMae)} ${m.combinedPrinted.worstPrayer}@${m.combinedPrinted.city}`);
}
console.log('\nregression vs O1h-5 (method at Kemenag point vs printed): Jakarta');
const jk = cities.find((c) => c.key === 'jakarta');
for (const n of ['Singapore', 'MuslimWorldLeague', 'Karachi', 'MoonsightingCommittee', 'Dubai']) {
  const s = jk.methods[n].prayers;
  console.log(`${n.padEnd(22)} fajr ${s.fajr.printedK.mae} isha ${s.isha.printedK.mae}`);
}
console.log('\nihtiyati per prayer (printed minus basis), Jakarta:');
console.log(JSON.stringify(cities[0].ihtiyati));
console.log('high-latitude slack (minutes), min over days per city:', JSON.stringify(cities.map((c) => [c.key, c.highLatitudeSlackMinutes])));
