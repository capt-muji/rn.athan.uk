// Indonesian archipelago grid: six cities in three civil zones, 2026, 21 methods,
// scored against Kemenag's published parameter pair and against its printed minutes.
import { writeFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const JOBS = join(HERE, 'jobs');
const CITIES = [
  { key: 'jakarta', name: 'Jakarta', region: 'Java (west)', tz: 'Asia/Jakarta', offset: 7, lat: -6.2088, lon: 106.8456, kLat: -6.18120002746582, kLon: 106.83512115478516 },
  { key: 'medan', name: 'Medan', region: 'Sumatra (north)', tz: 'Asia/Jakarta', offset: 7, lat: 3.5952, lon: 98.6722, kLat: 3.6290409564971924, kLon: 98.66719818115234 },
  { key: 'pontianak', name: 'Pontianak', region: 'Kalimantan (west)', tz: 'Asia/Pontianak', offset: 7, lat: -0.0263, lon: 109.3425, kLat: -0.025780638679862022, kLon: 109.33169555664062 },
  { key: 'surabaya', name: 'Surabaya', region: 'Java (east)', tz: 'Asia/Jakarta', offset: 7, lat: -7.2575, lon: 112.7521, kLat: -7.274322986602783, kLon: 112.72358703613281 },
  { key: 'makassar', name: 'Makassar', region: 'Sulawesi (south)', tz: 'Asia/Makassar', offset: 8, lat: -5.1477, lon: 119.4327, kLat: -5.135610103607178, kLon: 119.46389770507812 },
  { key: 'jayapura', name: 'Jayapura', region: 'Papua', tz: 'Asia/Jayapura', offset: 9, lat: -2.5337, lon: 140.7181, kLat: -2.6645259857177734, kLon: 140.80014038085938 },
];

const survey = JSON.parse(readFileSync(join(HERE, 'kemenag-basis-survey.json'), 'utf8'));
const byCityKey = { jakarta: 'KOTA JAKARTA PUSAT', medan: 'KOTA MEDAN', pontianak: 'KOTA PONTIANAK', surabaya: 'KOTA SURABAYA', makassar: 'KOTA MAKASSAR', jayapura: 'KOTA JAYAPURA' };

rmSync(JOBS, { recursive: true, force: true });
mkdirSync(JOBS, { recursive: true });

const cities = [];
for (const city of CITIES) {
  const basis = survey.find((r) => r.name === byCityKey[city.key]);
  const job = { ...city, kemenagIshaAngle: basis ? basis.isha : null, kemenagFajrAngle: basis ? basis.fajr : null };
  const jobPath = join(JOBS, `${city.key}.json`);
  const outPath = join(HERE, `scores-${city.key}.json`);
  writeFileSync(jobPath, JSON.stringify(job));
  const res = spawnSync(process.execPath, [join(HERE, 'run-city.mjs'), jobPath, outPath], {
    env: { ...process.env, TZ: city.tz },
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    console.error(`FAILED ${city.key}`, res.stderr);
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(outPath, 'utf8'));
  cities.push(parsed);
  console.log(`done ${city.key}`);
}
rmSync(JOBS, { recursive: true, force: true });

const METHOD_ORDER = Object.keys(cities[0].cells);

function across(citiesList, pick) {
  const vals = citiesList.map(pick).filter((v) => v !== null && v !== undefined);
  return {
    mean: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
    max: +Math.max(...vals).toFixed(1),
  };
}

const table = METHOD_ORDER.map((id) => {
  const perCity = cities.map((c) => ({ city: c.key, ...c.cells[id] }));
  const obj = {
    id,
    label: cities[0].cells[id].label,
    asrMatch: cities[0].cells[id].asrMatch,
    fajrMeanAcrossCities: across(cities, (c) => c.cells[id].vsParam.fajr.mean),
    ishaMeanAcrossCities: across(cities, (c) => c.cells[id].vsParam.isha.mean),
    fajrWorstCity: Math.max(...cities.map((c) => c.cells[id].vsParam.fajr.mean)),
    ishaWorstCity: Math.max(...cities.map((c) => c.cells[id].vsParam.isha.mean)),
    fajrWithin2WorstCity: Math.min(...cities.map((c) => c.cells[id].vsParam.fajr.within2)),
    ishaWithin2WorstCity: Math.min(...cities.map((c) => c.cells[id].vsParam.isha.within2)),
    printed: {
      fajrWorstCity: Math.max(...cities.map((c) => c.cells[id].vsPrinted.fajr.mean)),
      ishaWorstCity: Math.max(...cities.map((c) => c.cells[id].vsPrinted.isha.mean)),
      fajrWithin2WorstCity: Math.min(...cities.map((c) => c.cells[id].vsPrinted.fajr.within2)),
      ishaWithin2WorstCity: Math.min(...cities.map((c) => c.cells[id].vsPrinted.isha.within2)),
    },
    combinedWorstCity: Math.max(...cities.map((c) => Math.max(c.cells[id].vsParam.fajr.mean, c.cells[id].vsParam.isha.mean))),
    perCity,
  };
  obj.verdict = obj.fajrWorstCity <= 2 && obj.ishaWorstCity <= 2 ? 'uniform' : 'varies';
  return obj;
});

table.sort((a, b) => a.combinedWorstCity - b.combinedWorstCity);
table.forEach((r, i) => { r.rank = i + 1; });

// Fajr cost of the 18/18 family against the 20 degree reference, per city and on average.
const eighteen = table.filter((r) => ['isna2010', 'jakim', 'karachi', 'moonsighting', 'mwl', 'ecfr', 'diyanet-tr', 'diyanet-eu'].includes(r.id));
const familyCost = eighteen.map((r) => ({
  id: r.id,
  label: r.label,
  fajrMeanAcrossCities: r.fajrMeanAcrossCities.mean,
  fajrWorstCity: r.fajrWorstCity,
  ishaMeanAcrossCities: r.ishaMeanAcrossCities.mean,
}));

const payload = {
  schema: 'o1h-indonesia-grid/1',
  generated: '2026-11-10',
  year: 2026,
  sources: {
    target: 'Kemenag public API https://bimasislam.kemenag.go.id/api/v1/public/prayer-times',
    methodCatalogue: 'methods/methods.json (20) + ISNA-2010 18/18',
  },
  references: {
    publishedParameters: { fajrAngle: 20, ishaAngle: 18, rounding: 'nearest', margins: 0 },
    printedRecipe: { fajrAngle: 20, ishaAngle: 18, rounding: 'nearest', marginMinutes: 2, note: 'each prayer shifted 2 minutes later' },
  },
  basisSurvey: {
    citiesSurveyed: survey.length,
    uniformBasis: survey.filter((r) => r.fajr !== null && r.fajr < 20).length,
    upliftedBasis: survey.filter((r) => r.fajr !== null && r.fajr >= 20).map((r) => r.name),
    fajrImpliedMean: +(survey.filter((r) => r.fajr !== null && r.fajr < 20).reduce((a, r) => a + r.fajr, 0) / survey.filter((r) => r.fajr !== null && r.fajr < 20).length).toFixed(3),
    ishaImpliedMean: +(survey.filter((r) => r.isha !== null && r.fajr < 20).reduce((a, r) => a + r.isha, 0) / survey.filter((r) => r.isha !== null && r.fajr < 20).length).toFixed(3),
  },
  cities: cities.map((c) => ({ key: c.key, name: c.name, region: c.region, tz: c.tz, lat: c.lat, lon: c.lon, days: c.days, kemenagIshaAngle: c.kemenagIshaAngle, printedRecipeReplay: c.printedRecipeReplay })),
  table,
  familyCost,
};
writeFileSync(join(HERE, 'results.json'), JSON.stringify(payload, null, 1));

console.log('\nrank method        fajr(mean/maxCity) isha(mean/maxCity)  worstCity  printedWorst verdict');
for (const r of table) {
  console.log(`${String(r.rank).padStart(4)} ${r.id.padEnd(13)} ${String(r.fajrMeanAcrossCities.mean).padStart(6)} /${String(r.fajrWorstCity).padStart(5)}   ${String(r.ishaMeanAcrossCities.mean).padStart(6)} /${String(r.ishaWorstCity).padStart(5)}   ${String(r.combinedWorstCity).padStart(6)}    ${String(Math.max(r.printed.fajrWorstCity, r.printed.ishaWorstCity)).padStart(5)} ${r.verdict}`);
}
console.log('\nprinted-replay exact rates:', JSON.stringify(cities.map((c) => ({ city: c.key, f: c.printedRecipeReplay.exactFajr, i: c.printedRecipeReplay.exactIsha }))));
