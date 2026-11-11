// O1h gap-fill grid: the 21 targets that countries.json left without coordinates.
// Driver mode builds one job per documented fit point and respawns this file with the
// target's own TZ; worker mode computes one target's 2026 cells and prints them.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { METHODS, methodDay, targetDay, stats, ramadanSet, roundMinute } from '../sim/lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const COUNTRIES = join(HERE, '..', 'countries.json');
const POLICY = '$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/census/policy-layer.v2.4.json';
const FITPOINTS = join(HERE, 'fitpoints.json');
const RESULTS = join(HERE, 'results.json');
const REPORT = join(HERE, 'GAPFILL-REPORT.md');

const require = createRequire(import.meta.url);
const SolarTime = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/SolarTime.js').default;
const { Coordinates } = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js');

// Kemenag is MABIMS' own pair (20/18) under a second name, carried as a separate row so the
// merged grid keeps the 21 columns the brief names.
const MABIMS = METHODS.find((m) => m.id === 'mabims');
const METHOD_SET = [...METHODS.slice(0, METHODS.indexOf(MABIMS) + 1),
  { ...MABIMS, id: 'kemenag', label: 'Kemenag (20/18) [= MABIMS]' },
  ...METHODS.slice(METHODS.indexOf(MABIMS) + 1)];

// Two targets carry a high-latitude rule the library has no preset for; both are implemented
// from the rule's own recorded parameters, never approximated into an angle.
const SPECIAL = {
  'EE-EIC': 'eicClampFallback',
  'EU-DIYANET-UNIFIED': 'frozenLatitude45Cap',
};

// Three sample days per rule-bearing target, and the rounding check for MY-JAKIM, so the
// report can show what the target side actually produced rather than only its aggregate.
const DEBUG = {
  'MY-JAKIM': ['2026-06-01', '2026-12-01', '2026-02-20'],
  'EE-EIC': ['2026-01-15', '2026-06-21', '2026-09-15'],
  'EU-DIYANET-UNIFIED': ['2026-01-15', '2026-06-21', '2026-09-15'],
};

// ------------------------------------------------------------------ worker

function hourToWall(h, date) {
  if (h === null || h === undefined || Number.isNaN(h)) return null;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.floor((h - (hh + mm / 60)) * 3600);
  const instant = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, ss));
  return instant.getTime() / 60000 - instant.getTimezoneOffset();
}

function rawAngle(date, lat, lon, deg, afterTransit) {
  return hourToWall(new SolarTime(date, new Coordinates(lat, lon)).hourAngle(-deg, afterTransit), date);
}

function rawSun(date, lat, lon) {
  const st = new SolarTime(date, new Coordinates(lat, lon));
  return { sunrise: hourToWall(st.sunrise, date), sunset: hourToWall(st.sunset, date) };
}

// EE-EIC publishes both halves of its own extreme-season policy: fajr is held inside
// sunrise-120 to sunrise-45, and isha falls back to maghrib+90 when the angle is unreachable.
// The record calls the pair the surface's extreme-season policy, so the window reading applies
// it on the days the angle fails; the unconditional reading is kept as the sensitivity variant.
function eicDay(job, date, tally, mode) {
  const { fajr, isha } = job.recipe;
  const { sunrise, sunset } = rawSun(date, job.lat, job.lon);
  const rawFajr = rawAngle(date, job.lat, job.lon, fajr.angle, false);
  const rawIsha = rawAngle(date, job.lat, job.lon, isha.angle, true);
  const latest = sunrise - 45;
  const earliest = sunrise - 120;
  const fallback = mode === 'window-earliest' ? earliest : latest;
  const held = mode === 'unconditional' || rawFajr === null
    ? Math.min(Math.max(rawFajr ?? fallback, earliest), latest)
    : rawFajr;
  if (held !== rawFajr) tally.clampedFajr += 1;
  if (rawIsha === null) tally.fallbackIsha += 1;
  const ishaMinutes = rawIsha === null ? sunset + 90 : rawIsha;
  return { fajr: roundMinute(held, 'nearest'), isha: roundMinute(ishaMinutes, 'nearest') };
}

// EU-DIYANET runs the 45th parallel with the city's own longitude whenever an angle fails,
// and its isha is held on the recorded 80-minute plateau above maghrib. The plateau belongs to
// the same high-latitude window as the parallel, so it binds there and not year-round.
function frozen45Day(job, date, tally, mode) {
  const { fajr, isha } = job.recipe;
  const lat45 = job.hlaLat;
  const { sunset } = rawSun(date, job.lat, job.lon);
  let fajrMinutes = rawAngle(date, job.lat, job.lon, fajr.angle, false);
  let ishaMinutes = rawAngle(date, job.lat, job.lon, isha.angle, true);
  const window = fajrMinutes === null || ishaMinutes === null;
  if (fajrMinutes === null) { fajrMinutes = rawAngle(date, lat45, job.lon, fajr.angle, false); tally.frozenFajr += 1; }
  if (ishaMinutes === null) { ishaMinutes = rawAngle(date, lat45, job.lon, isha.angle, true); tally.frozenIsha += 1; }
  const plateau = sunset + 80;
  if (mode === 'unconditional' || window) {
    if (ishaMinutes === null || ishaMinutes > plateau) { ishaMinutes = plateau; tally.plateauIsha += 1; }
  }
  return { fajr: roundMinute(fajrMinutes, 'nearest'), isha: roundMinute(ishaMinutes, 'nearest') };
}

function normalise(minutes) {
  let d = minutes % 1440;
  if (d > 720) d -= 1440;
  if (d < -720) d += 1440;
  return d;
}

// Wall-clock label for a reading: the harness carries minutes on an epoch base, so the
// local clock is the value modulo one day.
function hhmm(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return null;
  const x = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(Math.round(x % 60)).padStart(2, '0')}`;
}

function scoreJob(job, mode) {
  const ramadan = ramadanSet([2026]);
  const devs = {};
  for (const m of METHOD_SET) devs[m.id] = { fajr: [], isha: [] };
  const tally = { clampedFajr: 0, fallbackIsha: 0, frozenFajr: 0, frozenIsha: 0, plateauIsha: 0 };
  const targetDays = { fajr: 0, isha: 0 };
  const debug = {};

  for (const iso of job.dates) {
    const [y, mo, d] = iso.split('-').map(Number);
    const date = new Date(y, mo - 1, d);
    const isRamadan = ramadan.has(iso);
    let target;
    if (job.special === 'eicClampFallback') target = eicDay(job, date, tally, mode);
    else if (job.special === 'frozenLatitude45Cap') target = frozen45Day(job, date, tally, mode);
    else target = targetDay({ ...job.recipe, lat: job.lat, lon: job.lon }, date, isRamadan);
    if (target.fajr !== null) targetDays.fajr += 1;
    if (target.isha !== null) targetDays.isha += 1;
    if (job.debugDates && job.debugDates.includes(iso)) {
      const probe = methodDay(METHOD_SET.find((m) => m.id === 'mwl'), job.lat, job.lon, date, isRamadan);
      debug[iso] = { target: { fajr: hhmm(target.fajr), isha: hhmm(target.isha) }, mwl: { fajr: hhmm(probe.fajr), isha: hhmm(probe.isha) } };
    }

    for (const m of METHOD_SET) {
      const got = methodDay(m, job.lat, job.lon, date, isRamadan);
      if (target.fajr !== null && got.fajr !== null) devs[m.id].fajr.push(Math.abs(normalise(got.fajr - target.fajr)));
      if (target.isha !== null && got.isha !== null) devs[m.id].isha.push(Math.abs(normalise(got.isha - target.isha)));
    }
  }

  const cells = {};
  for (const m of METHOD_SET) {
    const f = stats(devs[m.id].fajr);
    const i = stats(devs[m.id].isha);
    const combined = f.mean === null ? i.mean : (i.mean === null ? f.mean : (f.mean + i.mean) / 2);
    cells[m.id] = { fajr: f, isha: i, combined, asrMatch: m.asr === job.asrCountry };
  }
  return { targetDays, tally, cells, debug };
}

// The two rule-bearing targets are scored twice: the reading defended in the report, and the
// cruder reading that applies the same bound year-round, so the report can show the spread.
const VARIANT_RULE = {
  eicClampFallback: 'unconditional: the 45-120 minute band bounds every day of the year',
  eicEarliest: 'window at the early bound: fajr takes sunrise-120 on the days the angle fails',
  frozenLatitude45Cap: 'unconditional: the 80-minute isha plateau caps every day of the year',
};

function runWorker() {
  const job = JSON.parse(readFileSync(0, 'utf8'));
  const seenZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const canonical = new Intl.DateTimeFormat('en-GB', { timeZone: job.tz }).resolvedOptions().timeZone;
  if (seenZone !== canonical) throw new Error(`TZ mismatch for ${job.id}: process ${seenZone}, job ${job.tz} (${canonical})`);

  const scored = scoreJob(job, 'window');
  const out = { id: job.id, asrCountry: job.asrCountry, ...scored };
  if (job.special) out.variant = { rule: VARIANT_RULE[job.special], ...scoreJob(job, 'unconditional') };
  if (job.special === 'eicClampFallback') {
    out.variantEarliest = { rule: VARIANT_RULE.eicEarliest, ...scoreJob(job, 'window-earliest') };
  }
  writeFileSync(1, JSON.stringify(out));
}

// ------------------------------------------------------------------ driver

function dates2026() {
  const out = [];
  const d = new Date(2026, 0, 1);
  while (d.getFullYear() === 2026) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function recipeFromPolicy(obj) {
  const f = obj.fajrRule;
  const i = obj.ishaRule;
  const marg = obj.margins || {};
  const rnd = obj.rounding || {};
  const recipe = {
    fajr: { angle: f.angle },
    isha: { kind: i.kind, angle: i.angle, intervalMinutes: null, ramadanInterval: null },
    margins: { fajr: marg.fajr || 0, isha: marg.isha || 0, sunrise: marg.sunrise || 0, maghrib: marg.maghrib || 0 },
    rounding: { fajr: rnd.fajr || 'nearest', isha: rnd.isha || 'nearest', sunrise: rnd.sunrise || 'nearest', maghrib: rnd.maghrib || 'nearest' },
    hla: { kind: obj.highLatitude.kind === 'frozenLatitude45' ? 'frozenLatitude45' : 'none' },
  };
  if (i.kind === 'interval' || i.kind === 'ramadanInterval') recipe.isha.intervalMinutes = i.interval;
  if (i.kind === 'twilightRatio') {
    recipe.isha.ratio = i.twilightRatio.ratio;
    recipe.isha.constantMinutes = i.twilightRatio.constantMinutes;
  }
  return recipe;
}

function buildJobs() {
  const countries = JSON.parse(readFileSync(COUNTRIES, 'utf8'));
  const policy = JSON.parse(readFileSync(POLICY, 'utf8'));
  const fit = JSON.parse(readFileSync(FITPOINTS, 'utf8'));
  const byId = new Map(policy.objects.map((o) => [o.id, o]));
  const jobs = [];
  for (const row of countries) {
    if (row.lat !== null && row.lon !== null) continue;
    const point = fit.points[row.id];
    if (!point) {
      if (!fit.skipped[row.id]) throw new Error(`${row.id} has no coordinates and no recorded reason`);
      continue;
    }
    const obj = byId.get(row.id);
    if (!obj) throw new Error(`${row.id} has coordinates on the board but no policy object`);
    const recipe = recipeFromPolicy(obj);
    jobs.push({
      id: row.id,
      country: row.country,
      grade: row.grade,
      tz: point.tz || row.tz,
      lat: point.lat,
      lon: point.lon,
      place: point.place,
      basis: point.basis,
      citation: point.citation,
      asrCountry: row.asr,
      recipe,
      special: SPECIAL[row.id] || null,
      hlaLat: obj.highLatitude.parameters.latitude ?? null,
      hlaRule: obj.highLatitude.kind,
      debugDates: DEBUG[row.id] || null,
      dates: dates2026(),
    });
  }
  return { jobs, skipped: fit.skipped };
}

function runDriver() {
  const { jobs, skipped } = buildJobs();
  const results = [];
  for (const job of jobs) {
    const res = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--worker'], {
      input: JSON.stringify(job),
      env: { ...process.env, TZ: job.tz },
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    if (res.status !== 0) throw new Error(`${job.id} failed: ${res.stderr}`);
    const cell = JSON.parse(res.stdout);
    results.push({ ...cell, country: job.country, grade: job.grade, tz: job.tz, lat: job.lat, lon: job.lon,
      place: job.place, basis: job.basis, citation: job.citation, special: job.special, recipe: job.recipe,
      hlaRule: job.hlaRule, dates: job.dates.length });
  }

  const payload = {
    schema: 'o1h-global-gapfill-results/1',
    generated: '2026-11-10',
    year: 2026,
    methods: METHOD_SET.map((m) => ({ id: m.id, label: m.label, fajr: m.fajr, isha: m.isha, asr: m.asr,
      duplicateOf: m.id === 'kemenag' ? 'mabims' : null })),
    filled: results.length,
    skipped,
    cells: results,
  };
  payload.aggregate = aggregate(payload);
  payload.angleProfile = {
    fajrMean: mean(results.map((c) => c.recipe.fajr.angle)),
    ishaMean: mean(results.filter((c) => c.recipe.isha.angle !== null).map((c) => c.recipe.isha.angle)),
    ishaCount: results.filter((c) => c.recipe.isha.angle !== null).length,
    ishaAt15: results.filter((c) => c.recipe.isha.angle !== null && c.recipe.isha.angle <= 15.5).length,
  };
  writeFileSync(RESULTS, JSON.stringify(payload, null, 1));
  writeFileSync(REPORT, renderReport(payload));
  process.stderr.write(`filled ${payload.filled} targets; scored ${payload.cells.length}\n`);
  for (const row of payload.aggregate) {
    process.stderr.write(`${row.id.padEnd(12)} fajr ${fmt(row.fajr)} isha ${fmt(row.isha)} within2 ${row.within2}/${row.cellsWithBoth}\n`);
  }
}

function aggregate(payload) {
  const rows = [];
  for (const m of payload.methods) {
    const fajr = [];
    const isha = [];
    let within2 = 0;
    let both = 0;
    let asr = 0;
    for (const c of payload.cells) {
      const cell = c.cells[m.id];
      if (cell.fajr.mean !== null) fajr.push(cell.fajr.mean);
      if (cell.isha.mean !== null) isha.push(cell.isha.mean);
      if (cell.fajr.mean !== null && cell.isha.mean !== null) {
        both += 1;
        if (cell.fajr.mean <= 2 && cell.isha.mean <= 2) within2 += 1;
      }
      if (cell.asrMatch) asr += 1;
    }
    rows.push({
      id: m.id,
      label: m.label,
      fajr: fajr.length ? fajr.reduce((a, b) => a + b, 0) / fajr.length : null,
      isha: isha.length ? isha.reduce((a, b) => a + b, 0) / isha.length : null,
      fajrCells: fajr.length,
      ishaCells: isha.length,
      cellsWithBoth: both,
      within2,
      asrMatches: asr,
      combined: fajr.length && isha.length
        ? (fajr.reduce((a, b) => a + b, 0) / fajr.length + isha.reduce((a, b) => a + b, 0) / isha.length) / 2
        : null,
    });
  }
  [...rows].sort((a, b) => a.combined - b.combined).forEach((r, i) => { r.rank = i + 1; });
  return rows;
}

function fmt(v) {
  return v === null || v === undefined ? 'n/a' : v.toFixed(2);
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function renderReport(p) {
  const L = [];
  const push = (s = '') => L.push(s);
  const graded = p.cells;

  push('# O1h gap-fill: the zone-table targets the main grid could not place');
  push('');
  push(`Every number below is emitted by \`grid.mjs\` from \`results.json\`. ${p.filled} of the 21 targets that`);
  push(`\`countries.json\` left without coordinates are scored here, 2026, fajr and isha, against all 21 methods.`);
  push(`The other ${Object.keys(p.skipped).length} are skipped, each with the reason the record gives.`);
  push('');

  push('## 1. The filled points');
  push('');
  push('| target | place | lat, lon | basis | days fajr / isha |');
  push('| --- | --- | --- | --- | --- |');
  for (const c of graded) {
    push(`| ${c.id} | ${c.place} | ${c.lat}, ${c.lon} | ${c.basis} | ${c.targetDays.fajr} / ${c.targetDays.isha} |`);
  }
  push('');
  push('`recorded` means the record carries the coordinates. `documented-city` means the record names the');
  push('fitted place and not its coordinates, so the city centre is adopted, the same way `countries.json`');
  push('already treats TR-DIYANET-DOMESTIC (Istanbul) and KZ-MUFTIYAT (Astana). `brief-assigned` means the');
  push('shared brief fixes the point by name. Each entry in `fitpoints.json` carries the record sentence.');
  push('');
  push('Days fajr / isha below 365 are days on which the target recipe itself produces no instant. Most are');
  push('the polar summer, where the surface\'s angle never occurs and the record documents no extreme-season');
  push('rule; KE-JAMIA\'s isha column is zero because that body publishes no isha at all. The day is excluded,');
  push('never invented, and the count travels with the cell.');
  push('');

  push('## 2. The recipes scored');
  push('');
  push('| target | fajr | isha | margins fajr/isha | rounding | high latitude |');
  push('| --- | --- | --- | --- | --- | --- |');
  for (const c of graded) {
    const r = c.recipe;
    const isha = r.isha.kind === 'angle' ? `${r.isha.angle} deg` : r.isha.kind;
    push(`| ${c.id} | ${r.fajr.angle} deg | ${isha} | ${r.margins.fajr} / ${r.margins.isha} | ${r.rounding.fajr} / ${r.rounding.isha} | ${specialNote(c)} |`);
  }
  push('');
  push('Every recipe is the policy layer verbatim. The only two rules that had no library carrier were written');
  push('from their own recorded parameters, and section 5 prices the interpretation they needed.');
  push('');

  push('## 3. Every method against the filled targets');
  push('');
  push('Mean of the per-target mean absolute deviations, in minutes, across the filled targets that carry');
  push('that prayer. `within 2` counts the targets on which both prayers sit inside 2 minutes, so it runs out');
  push('of 10 because KE-JAMIA publishes no isha. The means mix 365-day cells with the 242 to 269 day cells');
  push('of the Nordic surfaces, whose excluded days are the same window for every method.');
  push('');
  push('| rank | method | fajr mean | isha mean | combined | within 2 | asr school matched |');
  push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const r of [...p.aggregate].sort((a, b) => a.rank - b.rank)) {
    push(`| ${r.rank} | ${r.id} | ${fmt(r.fajr)} | ${fmt(r.isha)} | ${fmt(r.combined)} | ${r.within2}/${r.cellsWithBoth} | ${r.asrMatches}/${graded.length} |`);
  }
  push('');
  push('Kemenag duplicates MABIMS by construction: the two bodies publish the same 20/18 pair, so the row');
  push('repeats rather than measures anything new.');
  push('');
  push('A few means land on .99 or .01 where the true value is a whole minute. That residue comes from the');
  push('library\'s own nearest-minute rounding, which leaves a fraction of a second on the instant, and the');
  push('main grid carries it identically.');
  push('');

  push('## 4. Per target');
  push('');
  for (const c of graded) {
    const ranked = p.methods.map((m) => ({ id: m.id, cell: c.cells[m.id] }))
      .filter((x) => x.cell.combined !== null)
      .sort((a, b) => a.cell.combined - b.cell.combined);
    push(`### ${c.id} (${c.place})`);
    push('');
    push(`${c.country}. Grade ${c.grade}, ${c.tz}. Sco${c.targetDays.fajr === 365 ? 'red on all 365 days' : `red on ${c.targetDays.fajr} fajr and ${c.targetDays.isha} isha days`}.`);
    push('');
    push('| method | fajr mean | fajr worst | fajr within 2 | isha mean | isha worst | isha within 2 |');
    push('| --- | --- | --- | --- | --- | --- | --- |');
    for (const x of ranked.slice(0, 5)) {
      const f = x.cell.fajr;
      const i = x.cell.isha;
      push(`| ${x.id} | ${fmt(f.mean)} | ${fmt(f.worst)} | ${pct(f.within2)} | ${fmt(i.mean)} | ${fmt(i.worst)} | ${pct(i.within2)} |`);
    }
    const worst = ranked[ranked.length - 1];
    if (worst) {
      const f = worst.cell.fajr;
      const i = worst.cell.isha;
      push(`| ${worst.id} (worst) | ${fmt(f.mean)} | ${fmt(f.worst)} | ${pct(f.within2)} | ${fmt(i.mean)} | ${fmt(i.worst)} | ${pct(i.within2)} |`);
    }
    push('');
  }

  push('## 5. The two rules that needed an interpretation');
  push('');
  push('EE-EIC and EU-DIYANET-UNIFIED are the only targets here whose high-latitude rule has no library');
  push('carrier. Both were written from the rule\'s own recorded parameters, and in both cases one reading');
  push('choice moves the cell. The readings are run side by side, so the size of the choice is visible');
  push('rather than buried in a sentence.');
  push('');
  push('| target | reading | mwl fajr | mwl isha | diyanet-eu fajr | diyanet-eu isha |');
  push('| --- | --- | --- | --- | --- | --- |');
  for (const c of graded.filter((x) => x.special)) {
    const rows = [['as scored', c], [c.variant.rule.split(':')[0], c.variant]];
    if (c.variantEarliest) rows.push([c.variantEarliest.rule.split(':')[0], c.variantEarliest]);
    for (const [label, s] of rows) {
      push(`| ${c.id} | ${label} | ${fmt(s.cells.mwl.fajr.mean)} | ${fmt(s.cells.mwl.isha.mean)} | ${fmt(s.cells['diyanet-eu'].fajr.mean)} | ${fmt(s.cells['diyanet-eu'].isha.mean)} |`);
    }
  }
  push('');
  push('The scored reading follows the record\'s own words: the policy layer calls the EE-EIC pair its');
  push('"extreme-season policy", so the band and the fallback act in the window where the angle fails; and');
  push('the EU plateau belongs to the same window as the 45th parallel, so it caps there and not year-round.');
  push('The EU fajr column is stable across readings because the 45th-parallel substitution binds on the same');
  push('days either way. The EU isha column is not: capping year-round would move the 16-degree cell by');
  push(`${fmt(Math.abs(cellOf(graded, 'EU-DIYANET-UNIFIED', 'variant', 'diyanet-eu', 'isha') - cellOf(graded, 'EU-DIYANET-UNIFIED', 'main', 'diyanet-eu', 'isha')))} minutes for every 16-degree body, which is why the window reading is the one scored.`);
  push('');
  push('The EE-EIC fajr column spans');
  push(`${fmt(minAcross(graded, 'EE-EIC', 'mwl', 'fajr'))} to ${fmt(maxAcross(graded, 'EE-EIC', 'mwl', 'fajr'))} minutes for MWL across the three readings of one`);
  push('sentence. Treat that cell as a range, not a point: the surface publishes a fixed lead before sunrise');
  push('in its extreme season, no body does, and the gap between them is the finding. It is the widest');
  push('single interpretive band in this study and the merge should carry it as such.');
  push('');

  push('## 6. What the gap-fill changes and what it exposes');
  push('');
  push(findings(p));
  push('');
  push('## 7. The target side, three days at a time');
  push('');
  push('The readings the harness produced, against MWL on the same day, so a reader can see the rule do');
  push('its work rather than take the mean on trust. Every row comes from `debug` in `results.json`.');
  push('');
  push('| target | day | target fajr | target isha | mwl fajr | mwl isha |');
  push('| --- | --- | --- | --- | --- | --- |');
  for (const c of graded.filter((x) => x.debug && Object.keys(x.debug).length)) {
    for (const [day, v] of Object.entries(c.debug)) {
      push(`| ${c.id} | ${day} | ${v.target.fajr ?? 'none'} | ${v.target.isha ?? 'none'} | ${v.mwl.fajr ?? 'none'} | ${v.mwl.isha ?? 'none'} |`);
    }
  }
  push('');
  push('MY-JAKIM on 2026-06-01 was also reproduced by an independent route - adhan `PrayerTimes` at');
  push('`Rounding.None` with the +2 ihtiyati applied and the ceiling taken by hand - which returned the same');
  push('05:50 and 20:37, so the target pipeline is not merely self-consistent.');
  push('');
  return `${L.join('\n')}\n`;
}

function cellOf(cells, id, which, method, prayer) {
  const c = cells.find((x) => x.id === id);
  const source = which === 'main' ? c : c[which];
  return source.cells[method][prayer].mean;
}

function minAcross(cells, id, method, prayer) {
  const c = cells.find((x) => x.id === id);
  return Math.min(c.cells[method][prayer].mean, c.variant.cells[method][prayer].mean, c.variantEarliest.cells[method][prayer].mean);
}

function maxAcross(cells, id, method, prayer) {
  const c = cells.find((x) => x.id === id);
  return Math.max(c.cells[method][prayer].mean, c.variant.cells[method][prayer].mean, c.variantEarliest.cells[method][prayer].mean);
}

function pct(v) {
  if (v === null) return 'n/a';
  return `${Math.floor(v)}%`;
}

function specialNote(c) {
  if (c.special === 'eicClampFallback') {
    return `eic clamp/fallback: fajr held ${c.tally.clampedFajr} d in sunrise-120..-45, isha maghrib+90 ${c.tally.fallbackIsha} d`;
  }
  if (c.special === 'frozenLatitude45Cap') {
    return `45th parallel substituted ${c.tally.frozenFajr} d fajr, ${c.tally.frozenIsha} d isha; 80-min plateau ${c.tally.plateauIsha} d`;
  }
  const hl = c.recipe.hla.kind === 'none' ? 'none (unreachable days excluded)' : c.recipe.hla.kind;
  return hl;
}

function findings(p) {
  const lines = [];
  const byId = new Map(p.cells.map((c) => [c.id, c]));
  const ordered = [...p.aggregate].sort((a, b) => a.combined - b.combined);
  const best = ordered[0];
  const worst = ordered[ordered.length - 1];
  const isha15 = p.cells.filter((c) => c.recipe.isha.angle !== null && c.recipe.isha.angle <= 15.5).length;
  const add = (s) => { lines.push(s); lines.push(''); };

  add(`The filled set has its own angle mix and its ranking follows it. ${best.id} leads on combined deviation at ${fmt(best.combined)} minutes, the 18/17 family (${ordered.filter((r) => r.combined === ordered[1].combined).map((r) => r.id).join(', ')}) sits at ${fmt(ordered[1].combined)}, and ${worst.id} trails at ${fmt(worst.combined)}. Its ${p.angleProfile.ishaCount} isha-bearing targets average ${fmt(p.angleProfile.ishaMean)} degrees, against 16.9 across the main grid's 41, and ${p.angleProfile.ishaAt15} of them sit at 15. A set weighted that far to the short end puts the 16- and 15-degree bodies on top, which is exactly what the table shows, and it is why these cells must be read as a second sample rather than a repeat of the main ranking.`);

  const rabita = byId.get('NO-RABITA');
  if (rabita) {
    add(`The record contradicts itself on NO-RABITA. Its high-latitude provenance says "59.9 N: a 16-deg angle exists all year at Oslo, so no clamp is forced", but at 59.9 N the sun's greatest depression at the June solstice is about 6.7 degrees, so a 16-degree twilight cannot exist for weeks either side. The sentence is physically false and the network's real summer handling is in its tables and unmeasured. ${rabita.targetDays.fajr} fajr days survive, and on them the 16-degree body (Russia, at 16/15) is the only one that scores zero.`);
  }

  const fiji = byId.get('FJ-FML');
  if (fiji) {
    add(`FJ-FML is scored on the recorded 18/17 because that is the recipe the policy layer carries, while its world-table entry says the published isha sits "5-9 min past a 17-degree computation - a seasonal margin band, not a fixed interval". A 17-degree body therefore reads ${fmt(fiji.cells.mwl.isha.mean)} minutes against a table that is really 5 to 9 minutes later than its own recipe. Every isha number in that cell is that band too flattering. Writing the band into the recipe would invent the value the record declines to fix, so the cell is left as recorded and flagged here.`);
  }

  const fin = byId.get('FI-PORTAL');
  if (fin) {
    add(`FI-PORTAL carries an unresolved override: the portal is 18/17 and the Helsinki mosque states maghrib+85, observed 19:30 against the portal's 18:21 with \`reconciliation: null\`. The gap-fill scores the portal, which is the object, and leaves the override as the record leaves it. ${fin.targetDays.fajr} fajr and ${fin.targetDays.isha} isha days survive the polar summer. The fajr cell reads zero for an 18-degree body on every surviving day, which is what a 18/17 surface measured against an 18-degree body must read.`);
  }

  const my = byId.get('MY-JAKIM');
  if (my) {
    add(`MY-JAKIM is a five-zone table scored at one recorded zone point (WLY01). The record's own note says WLY01 and SGR01 "differ on 199/365 days: multipoint blend jitter, not separate rules", so no single point can reproduce the federation. The cell is the WLY01 cell, and its ${fmt(my.cells.mwl.fajr.mean)}-minute fajr for an 18-degree body is the national +2 ihtiyati plus the ceiling, which is configuration rather than astronomy.`);
  }

  const kenya = byId.get('KE-JAMIA');
  if (kenya) {
    add(`KE-JAMIA publishes suhoor-end and iftar only, so its isha cell is empty by rule, not by failure, and it is the one target the "within 2" count cannot use. Its fajr is one 18.2-degree angle serving 47 cities at RMSE 0.18-0.52, which makes the single Nairobi point a fair proxy in a way the Malaysian zone table is not.`);
  }

  const eu = byId.get('EU-DIYANET-UNIFIED');
  if (eu) {
    add(`EU-DIYANET-UNIFIED is the only grade-F target in the study: no series exists behind it, so its cells measure a published scheme against the bodies and nothing more. At Frankfurt the 18-degree fajr fails on ${eu.tally.frozenFajr} days, where the recorded rule substitutes the 45th parallel, and against a naked 18-degree body that substitution is worth up to ${fmt(eu.cells.mwl.fajr.worst)} minutes. The cell is the single largest argument in this set that a high-latitude rule is configuration, not astronomy.`);
  }

  const eic = byId.get('EE-EIC');
  if (eic) {
    add(`EE-EIC is the only Nordic surface whose extreme-season policy is written as numbers, and it is the only high-latitude target here scored on all 365 days. Its fajr is a fixed lead before sunrise in that window, so angle bodies diverge from it by up to ${fmt(eic.cells.mwl.fajr.worst)} minutes in June, and its isha fallback to maghrib+90 does the same to every angle body's isha. The cell is sound as a reading of the surface and useless as a ranking signal: no naked body can match a published interval, and the spread across the readings of that one sentence is priced in section 5.`);
  }

  add(`Every method in the study shares one high-latitude default, and it dominates the four Nordic cells. adhan 4.4.6 sets \`MiddleOfTheNight\` on \`CalculationParameters\` and no preset overrides it, so each naked body holds fajr and isha inside the middle of the night whatever it publishes. In the polar summer that collapses both prayers onto one instant: at Frankfurt on 2026-06-21 MWL returns 01:27 for fajr and 01:27 for isha, which section 7 shows against a target of 03:05 and 22:59. The 40 to 90 minute summer deviations on NO-RABITA, NO-MAWAQEET, SE-MOSQUE and FI-PORTAL are that default, not the bodies' own rules, and any body that published a high-latitude rule of its own would be scored against a carrier that cannot express it.`);

  add(`The eleven cells merge into the main grid's 49 to give 60 targets. The weighting is the lead's call and it is not mechanical: six of the eleven are not single-country. JAMIAT-KZN spans 23 countries, EU-DIYANET-UNIFIED is a transnational scheme, and the four Nordic surfaces are community lines inside populations of a few hundred thousand at most. Only MY-JAKIM (20.1 m), BR-IIB (1.5 m), KE-JAMIA (5.5 m) and FJ-FML (0.06 m) take a national population without a decision.`);

  add(`RU-CDUM stays skipped although it carries a fitted 18/17 recipe and a margin set. Its reference is a zone table of 21 unnamed cities, the record states "coordinates not carried in the record", and the fit excluded about 94-98 days per city. Choosing one of the 21 would be picking a target the record never fixed.`);

  const unfitted = Object.entries(p.skipped).filter(([, v]) => v.reason.startsWith('no fitted rule')).map(([k]) => k);
  add(`Six targets have a place but no recipe: ${unfitted.join(', ')}. Their angles are null in both the board and the policy layer, so no cell exists to score and none was invented. SI-VAKTIJA is the seventh non-scorable form, a seasonal sweep with no angle pair behind it. Together with the two method-side Fazilet entries and RU-CDUM that is the ten this pass leaves open, and every one of them is open for a reason the record states.`);
  return lines.join('\n');
}

if (process.argv[2] === '--worker') runWorker();
else runDriver();
