import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOME = process.env.HOME;
const COUNTRIES = '$HOME/athan-gitree/census/o1h-global/countries.json';
const POLICY = '$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/census/policy-layer.v2.4.json';
const TRUTH_2027 = `${HOME}/athan-gitree/census/o1g-decade/data/2027.json`;
const TRUTH_REST = `${HOME}/athan-gitree/census/o1g-decade/truth/truth-2028-2038.json`;
const METHODS_JSON = `${HOME}/athan-gitree/census/o1h-global/methods/methods.json`;

const OUT = join(HERE, 'out');
const JOBS = join(HERE, 'jobs');

const countries = JSON.parse(readFileSync(COUNTRIES, 'utf8'));
const policy = JSON.parse(readFileSync(POLICY, 'utf8'));
const methodsCatalog = JSON.parse(readFileSync(METHODS_JSON, 'utf8'));
const policyById = new Map(policy.objects.map((o) => [o.id, o]));

const EXCLUDED_FORMS = {
  'SI-VAKTIJA': 'seasonalSweep. A per-day hand-tuned angle curve with clamps and no angle pair behind it, so approximating it into angles would invent the target',
  'UA-DUMU': 'intervalTable. Fajr is sunrise minus 100 minutes every day and isha is maghrib plus a dated interval ramp of 90 to 100 minutes, so no angle exists to score',
  'AT-IZW': 'seasonalSweep. A per-day sweep from about 15.6 degrees in winter to about 11.3 at the solstice, which a frozen pair cannot express',
  'FR-GMS': 'seasonalSweep. Fajr sweeps 18 to 12 degrees and isha 16 to 11.5 over the year, and no frozen adhan parameter set encodes it',
};

const NO_REFERENCE_POINT = new Set([
  'EU-DIYANET-UNIFIED', 'JAMIAT-KZN', 'FAZILET-WORLD', 'FAZILET-OTTOMAN', 'NO-RABITA', 'NO-MAWAQEET',
  'EE-EIC', 'SE-MOSQUE', 'FI-PORTAL', 'BR-IIB', 'DJ-COMMUNITY', 'KE-JAMIA', 'PH-NCMF', 'AU-UMA',
  'NZ-FIANZ', 'FJ-FML', 'TJ-SHURO', 'TT-MASJIDBOX', 'RU-CDUM',
]);

// One row per country carries the national Muslim population; the rest of a country's rows
// are extra authorities on the same population and would otherwise be counted twice.
const POPULATION_MILLIONS = {
  'EG-ESA': 87.5, 'MA-HABOUS': 36.4, 'LK-ACJU': 2.1, 'TH-CICOT': 3.6, 'KW-AJIRI': 2.2,
  'ME-IZMR': 0.12, 'YE-AWQAF-SANAA': 26.8, 'JERUSALEM-AWQAF': 4.3, 'AE-AWQAF': 6.3,
  'BA-RIJASET': 2.0, 'BE-EMB': 0.88, 'TN-INM': 10.2, 'KZ-MUFTIYAT': 13.2, 'KG-MUFTIYAT': 5.5,
  'MV-MUIS': 0.37, 'SG-MUIS': 0.92, 'MY-JAKIM': 20.1, 'TR-DIYANET-DOMESTIC': 81.2,
  'GB-LONDON-INTERVAL-TABLE': 4.0, 'IS-FELAG': 0.001, 'GR-ATHENS': 0.31, 'GR-KOMOTINI': 0.31,
  'BG-SOFIA': 0.86, 'OM-MARA': 2.4, 'CZ-CENTRUM': 0.03, 'CL-CIS': 0.004, 'SA-KACST': 31.5,
  'IQ-DIWAN': 39.0, 'HK-MASJIDAL': 0.3, 'BD-IFB': 150.8, 'LY-MUAZZIN': 6.6, 'JO-AWQAF': 10.2,
  'IR-NATIONAL': 85.7, 'SD-MINISTRY': 38.6, 'IT-UCOII': 3.0, 'RU-DUMRT': 15.0, 'CY-KKTC': 0.28,
  'PT-HSALAH-HUB': 0.04, 'ES-CCIM': 2.5, 'UZ-ISLOM': 29.9, 'XK-BIK': 1.7, 'NE-BUTIN': 21.1,
  'RU-DUMRF-MOSCOW': 15.0, 'QA-MOI': 1.6, 'ID-KEMENAG': 249.8, 'PK-DEFACTO': 233.0,
  'IN-DEFACTO': 200.0, 'NG-SPA': 96.0, 'GB-WIFAQUL-ULAMA': 4.0,
};
const POPULATION_DUPLICATE = new Set(['GR-KOMOTINI', 'RU-DUMRF-MOSCOW', 'GB-WIFAQUL-ULAMA']);

function clockOf(obj) {
  if (!obj) return { mode: 'iana', fixedOffsetMinutes: null };
  const clock = obj.timezone.clock;
  if (clock.dstMode === 'fixed') return { mode: 'fixed', fixedOffsetMinutes: clock.fixedOffsetMinutes };
  return { mode: 'iana', fixedOffsetMinutes: null };
}

function hlaOf(obj) {
  if (!obj) return { kind: 'none' };
  const kind = obj.highLatitude.kind;
  const p = obj.highLatitude.parameters || {};
  if (kind === 'nightPortionSplit') {
    if (obj.id === 'GB-WIFAQUL-ULAMA') return { kind, params: { fajrPortion: 0.5, ishaPortion: 1 / 7 } };
    if (obj.id === 'CL-CIS') return { kind, params: { minAbsLat: 45, fajrPortion: 0.3063, ishaPortion: 0.2779 } };
    if (obj.id === 'RU-DUMRF-MOSCOW') {
      return { kind, params: { fajrPortion: 0.2955, ishaPortion: null, windowFrom: '04-23', windowTo: '08-21' } };
    }
    return { kind, params: {} };
  }
  if (kind === 'frozenLatitude45') return { kind };
  return { kind };
}

function recipeFromPolicy(obj) {
  const f = obj.fajrRule;
  const i = obj.ishaRule;
  const marg = obj.margins || {};
  const rnd = obj.rounding || {};
  const recipe = {
    fajr: { angle: f.angle },
    isha: { kind: i.kind, angle: i.angle, intervalMinutes: null, ramadanInterval: null },
    margins: {
      fajr: marg.fajr || 0,
      isha: marg.isha || 0,
      sunrise: marg.sunrise || 0,
      maghrib: marg.maghrib || 0,
    },
    rounding: {
      fajr: rnd.fajr || 'nearest',
      isha: rnd.isha || 'nearest',
      sunrise: rnd.sunrise || 'nearest',
      maghrib: rnd.maghrib || 'nearest',
    },
    hla: hlaOf(obj),
  };
  if (i.kind === 'interval') recipe.isha.intervalMinutes = i.interval;
  if (i.kind === 'intervalAfterRounding') recipe.isha.intervalMinutes = i.intervalMinutes;
  if (i.kind === 'ramadanInterval') {
    recipe.isha.intervalMinutes = i.interval;
    recipe.isha.ramadanInterval = i.ramadanInterval;
  }
  if (i.kind === 'twilightRatio') {
    recipe.isha.ratio = i.twilightRatio.ratio;
    recipe.isha.constantMinutes = i.twilightRatio.constantMinutes;
  }
  return recipe;
}

function recipeFromCountryRow(row) {
  return {
    fajr: { angle: row.fajr.angle },
    isha: { kind: 'angle', angle: row.isha.angle, intervalMinutes: null, ramadanInterval: null },
    margins: { fajr: 0, isha: 0, sunrise: 0, maghrib: 0 },
    rounding: { fajr: 'nearest', isha: 'nearest', sunrise: 'nearest', maghrib: 'nearest' },
    hla: { kind: 'none' },
  };
}

function dates2026() {
  const out = [];
  const d = new Date(2026, 0, 1);
  while (d.getFullYear() === 2026) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const TRUTH = { ...JSON.parse(readFileSync(TRUTH_2027, 'utf8')), ...JSON.parse(readFileSync(TRUTH_REST, 'utf8')) };
const TRUTH_DATES = Object.keys(TRUTH).sort();

function buildJobs() {
  const jobs = [];
  for (const row of countries) {
    if (EXCLUDED_FORMS[row.id] || NO_REFERENCE_POINT.has(row.id)) continue;
    const obj = policyById.get(row.id);

    if (row.id === 'GB-LONDON-INTERVAL-TABLE') {
      jobs.push({
        id: row.id,
        country: 'United Kingdom (London)',
        grade: row.grade,
        kind: 'truth',
        lat: row.lat,
        lon: row.lon,
        tz: row.tz,
        asrCountry: row.asr,
        truth: TRUTH,
        dates: TRUTH_DATES,
      });
      continue;
    }

    if (row.id === 'CI-COSIM') continue; // no fitted rule in the record

    let lat = row.lat;
    let lon = row.lon;
    if (row.id === 'MY-JAKIM') {
      const zone = obj.reference.zoneTable.zones.find((z) => z.code === 'WLY01');
      lat = zone.point.lat;
      lon = zone.point.lon;
    }

    const spec = obj ? recipeFromPolicy(obj) : recipeFromCountryRow(row);
    jobs.push({
      id: row.id,
      country: row.country,
      grade: row.grade,
      kind: 'recipe',
      lat,
      lon,
      tz: row.tz,
      asrCountry: row.asr,
      clock: clockOf(obj),
      recipe: spec,
      dates: dates2026(),
    });
  }
  return jobs;
}

const jobs = buildJobs();

rmSync(OUT, { recursive: true, force: true });
rmSync(JOBS, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(JOBS, { recursive: true });

const results = [];
for (const job of jobs) {
  const jobPath = join(JOBS, `${job.id}.json`);
  const outPath = join(OUT, `${job.id}.json`);
  writeFileSync(jobPath, JSON.stringify(job));
  const res = spawnSync(process.execPath, [join(HERE, 'run-country.mjs'), jobPath, outPath], {
    env: { ...process.env, TZ: job.tz },
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    console.error(`FAILED ${job.id}`, res.stderr);
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(outPath, 'utf8'));
  parsed.country = job.country;
  parsed.grade = job.grade;
  parsed.tz = job.tz;
  parsed.population = POPULATION_MILLIONS[job.id] ?? null;
  parsed.populationDuplicate = POPULATION_DUPLICATE.has(job.id);
  results.push(parsed);
  writeScores(results, jobs);
  console.log(`done ${job.id} (${results.length}/${jobs.length})`);
}

function methodIds() {
  return results.length ? Object.keys(results[0].cells) : [];
}

function writeScores(rows, allJobs) {
  writeFileSync(join(HERE, 'scores.json'), JSON.stringify({
    schema: 'o1h-global-sim/1',
    generated: '2026-11-10',
    year: 2026,
    londonYears: '2027-2038',
    methods: methodsCatalog.methods.map((m) => m.id),
    targets: allJobs.map((j) => ({
      id: j.id,
      country: j.country,
      grade: j.grade,
      tz: j.tz,
      lat: j.lat,
      lon: j.lon,
      population: POPULATION_MILLIONS[j.id] ?? null,
      populationDuplicate: POPULATION_DUPLICATE.has(j.id),
    })),
    excluded: EXCLUDED_FORMS,
    noReferencePoint: [...NO_REFERENCE_POINT],
    cells: rows,
  }, null, 1));
}

writeScores(results, jobs);
rmSync(JOBS, { recursive: true, force: true });

// ------------------------------------------------------------------ aggregates

const MIDS = methodIds();
const scored = results;
const METHODS_CATALOG = methodsCatalog.methods;

function methodLabel(id) {
  const m = METHODS_CATALOG.find((x) => x.id === id);
  return m ? `${m.body} [${m.id}]` : id;
}

function weightOf(row) {
  if (row.population === null) return 0;
  if (row.populationDuplicate) return 0;
  return row.population;
}

function weightedMean(rows, pick) {
  let num = 0;
  let den = 0;
  for (const r of rows) {
    const w = weightOf(r);
    const v = pick(r);
    if (w === 0 || v === null || v === undefined) continue;
    num += w * v;
    den += w;
  }
  return den === 0 ? null : num / den;
}

function plainMean(rows, pick) {
  const vals = rows.map(pick).filter((v) => v !== null && v !== undefined);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const WITHOUT_PK_IN = scored.filter((r) => r.id !== 'PK-DEFACTO' && r.id !== 'IN-DEFACTO');
const AUTHORITY_GRADES = new Set(['A', 'provisional']);
const AUTHORITIES = scored.filter((r) => AUTHORITY_GRADES.has(r.grade));

const combinedOf = (row, id) => {
  const c = row.cells[id];
  if (c.fajr.mean === null && c.isha.mean === null) return null;
  if (c.isha.mean === null) return c.fajr.mean;
  if (c.fajr.mean === null) return c.isha.mean;
  return (c.fajr.mean + c.isha.mean) / 2;
};

const table = MIDS.map((id) => {
  const within = scored.filter((r) => r.cells[id].fajr.mean !== null && r.cells[id].isha.mean !== null
    && r.cells[id].fajr.mean <= 2 && r.cells[id].isha.mean <= 2);
  return {
    id,
    label: methodLabel(id),
    weighted: weightedMean(scored, (r) => combinedOf(r, id)),
    weightedNoPkIn: weightedMean(WITHOUT_PK_IN, (r) => combinedOf(r, id)),
    weightedAuthorities: weightedMean(AUTHORITIES, (r) => combinedOf(r, id)),
    unweighted: plainMean(scored, (r) => combinedOf(r, id)),
    constituency: within.length,
    constituencyIds: within.map((r) => r.id),
    asrMatches: scored.filter((r) => r.cells[id].asrMatch).length,
  };
});

for (const key of ['weighted', 'weightedNoPkIn', 'weightedAuthorities', 'unweighted']) {
  [...table].sort((a, b) => a[key] - b[key]).forEach((row, i) => { row[`rank_${key}`] = i + 1; });
}
[...table].sort((a, b) => a.weighted - b.weighted).forEach((row, i) => { row.finalRank = i + 1; });

const indonesia = scored.find((r) => r.id === 'ID-KEMENAG');

const payload = {
  schema: 'o1h-global-sim-aggregates/1',
  scoredTargets: scored.length,
  populationCovered: scored.reduce((a, r) => a + weightOf(r), 0),
  authorityTargets: AUTHORITIES.length,
  table,
  indonesia: MIDS.map((id) => ({
    id,
    fajr: indonesia.cells[id].fajr,
    isha: indonesia.cells[id].isha,
    combined: combinedOf(indonesia, id),
  })),
};
writeFileSync(join(HERE, 'aggregates.json'), JSON.stringify(payload, null, 1));

console.log('scored targets', scored.length, 'population covered', payload.populationCovered.toFixed(1), 'm');
for (const t of [...table].sort((a, b) => a.weighted - b.weighted)) {
  console.log(`${String(t.finalRank).padStart(2)} ${t.id.padEnd(13)} w=${t.weighted.toFixed(2)} wNoPkIn=${t.weightedNoPkIn.toFixed(2)} auth=${t.weightedAuthorities.toFixed(2)} unw=${t.unweighted.toFixed(2)} within2=${t.constituency}`);
}
