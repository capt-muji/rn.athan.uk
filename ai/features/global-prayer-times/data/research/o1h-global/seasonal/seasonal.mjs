import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  METHODS, methodDay, targetDay, truthDay, ramadanSet, wrapDelta, roundMinute, wallMinutes,
} from '../sim/lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const HOME = process.env.HOME;
const ROOT = '$HOME/athan-gitree/census/o1h-global';
const COUNTRIES = join(ROOT, 'countries.json');
const POLICY = '$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/census/policy-layer.v2.4.json';
const TRUTH_2027 = `${HOME}/athan-gitree/census/o1g-decade/data/2027.json`;
const TRUTH_REST = `${HOME}/athan-gitree/census/o1g-decade/truth/truth-2028-2038.json`;

const require = createRequire(import.meta.url);
const SolarTime = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/SolarTime.js').default;
const { Coordinates } = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js');

// The seasonal study scores the same seven leaders the sim leaderboard carries, with the
// carriers the sim built: preset verbatim where adhan ships one, constructed Other otherwise.
const SCOPE = ['mwl', 'egyptian', 'karachi', 'moonsighting', 'mabims', 'ummalqura', 'diyanet-eu'];

const SPECIAL_FORM = {
  'SI-VAKTIJA': 'seasonalSweep target',
  'UA-DUMU': 'intervalTable target',
  'AT-IZW': 'seasonalSweep target',
  'FR-GMS': 'seasonalSweep target',
  'CI-COSIM': 'fitted angles are null in the record, so no target day exists',
};

function hlaOf(obj) {
  const kind = obj.highLatitude.kind;
  const p = obj.highLatitude.parameters || {};
  if (kind !== 'nightPortionSplit') return { kind };
  if (obj.id === 'GB-WIFAQUL-ULAMA') return { kind, params: { fajrPortion: 0.5, ishaPortion: 1 / 7 } };
  if (obj.id === 'CL-CIS') return { kind, params: { minAbsLat: 45, fajrPortion: 0.3063, ishaPortion: 0.2779 } };
  if (obj.id === 'RU-DUMRF-MOSCOW') {
    return { kind, params: { fajrPortion: 0.2955, ishaPortion: null, windowFrom: '04-23', windowTo: '08-21' } };
  }
  return { kind, params: {} };
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
    rounding: {
      fajr: rnd.fajr || 'nearest', isha: rnd.isha || 'nearest',
      sunrise: rnd.sunrise || 'nearest', maghrib: rnd.maghrib || 'nearest',
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

function datesOfYear(year) {
  const out = [];
  const d = new Date(Date.UTC(year, 0, 1));
  while (d.getUTCFullYear() === year) {
    out.push(`${year}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// ------------------------------------------------------------------ child

function runTarget(job) {
  const seen = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const canonical = new Intl.DateTimeFormat('en-GB', { timeZone: job.tz }).resolvedOptions().timeZone;
  if (seen !== canonical) throw new Error(`TZ mismatch ${job.id}: ${seen} vs ${job.tz}`);

  const ramadan = ramadanSet([2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038]);
  const scoped = METHODS.filter((m) => SCOPE.includes(m.id));
  const devs = {};
  for (const m of scoped) {
    devs[m.id] = {
      fajr: { annual: [], jan: [], jul: [] },
      isha: { annual: [], jan: [], jul: [] },
      bound: { fajr: 0, isha: 0 },
      boundJul: { fajr: 0, isha: 0 },
      undefinedAngle: { fajr: { annual: 0, jul: 0 }, isha: { annual: 0, jul: 0 } },
      clamp: { fajr: { annual: [], jul: [] }, isha: { annual: [], jul: [] } },
    };
  }
  const targetDays = { fajr: 0, isha: 0 };
  const targetMissingJul = { fajr: 0, isha: 0 };

  for (const iso of job.dates) {
    const [y, mo, d] = iso.split('-').map(Number);
    const date = new Date(y, mo - 1, d);
    const isRamadan = ramadan.has(iso);
    // Both sides are read on the country's IANA zone, not on the printed clock the policy
    // object carries, because the brief compares wall-clock minutes in the country's tz.
    const target = job.kind === 'truth'
      ? truthDay(job, iso)
      : targetDay({ ...job.recipe, lat: job.lat, lon: job.lon }, date, isRamadan);
    if (target?.fajr != null) targetDays.fajr += 1;
    if (target?.isha != null) targetDays.isha += 1;
    if (!target) continue;
    if (mo === 7) {
      if (target.fajr == null) targetMissingJul.fajr += 1;
      if (target.isha == null) targetMissingJul.isha += 1;
    }

    const bucket = mo === 1 ? 'jan' : (mo === 7 ? 'jul' : null);
    const solar = new SolarTime(date, new Coordinates(job.lat, job.lon));
    // SolarTime.hourAngle returns the UTC hour of the instant, so midnight UTC plus that
    // offset is the unguarded angle time the library's own high-latitude rules may replace.
    const rawOf = (angle, afterTransit) => {
      if (angle == null) return null;
      const h = solar.hourAngle(-angle, afterTransit);
      if (h === null || Number.isNaN(h)) return null;
      return new Date(Date.UTC(y, mo - 1, d) + h * 3600 * 1000);
    };

    for (const m of scoped) {
      const got = methodDay(m, job.lat, job.lon, date, isRamadan);
      for (const prayer of ['fajr', 'isha']) {
        if (target[prayer] == null || got[prayer] == null) continue;
        const dev = Math.abs(wrapDelta(got[prayer], target[prayer]));
        devs[m.id][prayer].annual.push(dev);
        if (bucket) devs[m.id][prayer][bucket].push(dev);
      }
      for (const prayer of ['fajr', 'isha']) {
        if (target[prayer] == null) continue;
        const angle = prayer === 'fajr' ? m.fajr : m.isha;
        if (angle == null) continue;
        const raw = rawOf(angle, prayer === 'isha');
        const rawMinute = raw === null ? null
          : roundMinute(wallMinutes(raw, { mode: 'iana' }), 'nearest');
        if (rawMinute === null || got[prayer] === null) {
          devs[m.id].bound[prayer] += 1;
          if (bucket === 'jul') devs[m.id].boundJul[prayer] += 1;
          if (rawMinute === null) {
            devs[m.id].undefinedAngle[prayer].annual += 1;
            if (bucket === 'jul') devs[m.id].undefinedAngle[prayer].jul += 1;
          }
          continue;
        }
        const step = got[prayer] - rawMinute;
        if (Math.abs(step) >= 1) {
          devs[m.id].bound[prayer] += 1;
          if (bucket === 'jul') devs[m.id].boundJul[prayer] += 1;
          devs[m.id].clamp[prayer].annual.push(Math.abs(step));
          if (bucket === 'jul') devs[m.id].clamp[prayer].jul.push(Math.abs(step));
        }
      }
    }
  }

  const mean = (xs) => (xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length);
  const cells = [];
  for (const m of scoped) {
    for (const prayer of ['fajr', 'isha']) {
      const b = devs[m.id][prayer];
      const jan = mean(b.jan);
      const jul = mean(b.jul);
      cells.push({
        id: job.id,
        country: job.country,
        lat: job.lat,
        tz: job.tz,
        method: m.id,
        prayer,
        year: job.year,
        annualMean: mean(b.annual),
        janMean: jan,
        julMean: jul,
        spread: jan === null || jul === null ? null : jul - jan,
        annualN: b.annual.length,
        janN: b.jan.length,
        julN: b.jul.length,
        boundDays: devs[m.id].bound[prayer],
        undefinedAngleDays: devs[m.id].undefinedAngle[prayer].annual,
        undefinedAngleJul: devs[m.id].undefinedAngle[prayer].jul,
        clampDaysJul: devs[m.id].clamp[prayer].jul.length,
        clampMeanJul: mean(devs[m.id].clamp[prayer].jul),
        clampDaysAnnual: devs[m.id].clamp[prayer].annual.length,
        boundDaysJul: devs[m.id].boundJul[prayer],
      });
    }
  }
  return { id: job.id, kind: job.kind, targetDays, targetMissingJul, cells };
}

// ------------------------------------------------------------------ parent

function targets() {
  const countries = JSON.parse(readFileSync(COUNTRIES, 'utf8'));
  const policy = JSON.parse(readFileSync(POLICY, 'utf8'));
  const byId = new Map(policy.objects.map((o) => [o.id, o]));
  const out = [];
  const skipped = [];
  const truth = { ...JSON.parse(readFileSync(TRUTH_2027, 'utf8')), ...JSON.parse(readFileSync(TRUTH_REST, 'utf8')) };
  const truthDates = Object.keys(truth).sort();

  for (const row of countries) {
    if (SPECIAL_FORM[row.id]) { skipped.push({ id: row.id, reason: SPECIAL_FORM[row.id] }); continue; }
    if (row.lat == null || row.lon == null) { skipped.push({ id: row.id, reason: 'no reference coordinates' }); continue; }
    if (row.id === 'GB-LONDON-INTERVAL-TABLE') {
      out.push({
        id: row.id, kind: 'truth', country: row.country, tz: row.tz,
        lat: row.lat, lon: row.lon, year: '2027-2038', dates: truthDates, truth,
      });
      continue;
    }
    const obj = byId.get(row.id);
    const recipe = obj ? recipeFromPolicy(obj) : {
      fajr: { angle: row.fajr.angle },
      isha: { kind: 'angle', angle: row.isha.angle, intervalMinutes: null, ramadanInterval: null },
      margins: { fajr: 0, isha: 0, sunrise: 0, maghrib: 0 },
      rounding: { fajr: 'nearest', isha: 'nearest', sunrise: 'nearest', maghrib: 'nearest' },
      hla: { kind: 'none' },
    };
    const label = row.id === 'GB-WIFAQUL-ULAMA' ? 'United Kingdom (Wifaqul Ulama)' : row.country;
    out.push({
      id: row.id, kind: 'recipe', country: label, tz: row.tz,
      lat: row.lat, lon: row.lon, year: 2026,
      dates: datesOfYear(2026), recipe,
    });
  }
  return { out, skipped };
}

function simAnnual(id) {
  try {
    const d = JSON.parse(readFileSync(join(ROOT, 'sim', 'out', `${id}.json`), 'utf8'));
    return d.cells;
  } catch { return null; }
}

if (process.argv[2] === '--target') {
  const job = JSON.parse(readFileSync(process.argv[3], 'utf8'));
  process.stdout.write(JSON.stringify(runTarget(job)));
} else {
  const { out, skipped } = targets();
  mkdirSync(join(HERE, 'work'), { recursive: true });
  const results = [];
  for (const job of out) {
    const jobPath = join(HERE, 'work', `${job.id}.json`);
    const outPath = join(HERE, 'work', `${job.id}.out.json`);
    writeFileSync(jobPath, JSON.stringify(job));
    if (!existsSync(outPath)) {
      const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--target', jobPath], {
        env: { ...process.env, TZ: job.tz },
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
      if (child.status !== 0) {
        console.error(`FAILED ${job.id}\n${child.stderr}`);
        process.exit(1);
      }
      writeFileSync(outPath, child.stdout);
    }
    results.push(JSON.parse(readFileSync(outPath, 'utf8')));
    console.log(`done ${job.id} (${results.length}/${out.length})`);
  }

  const cells = results.flatMap((r) => r.cells);
  const consistency = [];
  for (const r of results) {
    const sim = simAnnual(r.id);
    if (!sim) continue;
    for (const m of SCOPE) {
      for (const prayer of ['fajr', 'isha']) {
        const mine = cells.find((c) => c.id === r.id && c.method === m && c.prayer === prayer);
        const theirs = sim[m]?.[prayer]?.mean ?? null;
        if (mine?.annualMean == null || theirs == null) continue;
        consistency.push({ id: r.id, method: m, prayer, mine: mine.annualMean, sim: theirs, diff: mine.annualMean - theirs });
      }
    }
  }
  const worstDiff = consistency.reduce((a, c) => Math.max(a, Math.abs(c.diff)), 0);

  const live = cells.filter((c) => c.spread !== null && c.annualN > 0);

  const methodTable = (rows, label) => SCOPE.map((m) => {
    const mine = rows.filter((c) => c.method === m);
    const worst = mine.reduce((a, c) => (a === null || Math.abs(c.spread) > Math.abs(a.spread) ? c : a), null);
    const spreads = mine.map((c) => Math.abs(c.spread));
    const sorted = [...spreads].sort((a, b) => a - b);
    return {
      method: m,
      band: label,
      worstSpread: worst ? Math.abs(worst.spread) : null,
      worstCell: worst ? { id: worst.id, country: worst.country, lat: worst.lat, prayer: worst.prayer, janMean: worst.janMean, julMean: worst.julMean, spread: worst.spread, annualMean: worst.annualMean } : null,
      meanAbsSpread: spreads.length ? spreads.reduce((a, b) => a + b, 0) / spreads.length : null,
      medianAbsSpread: sorted.length ? sorted[Math.floor(sorted.length / 2)] : null,
      cellsOver4: spreads.filter((s) => s > 4).length,
      cellsScored: spreads.length,
    };
  }).sort((a, b) => b.worstSpread - a.worstSpread);

  const methodRows = methodTable(live, 'all latitudes');
  const methodRowsBelow50 = methodTable(live.filter((c) => Math.abs(c.lat) <= 50), 'at or below 50 degrees');

  const hidden = live
    .filter((c) => c.annualMean !== null && c.annualMean <= 2 && Math.max(c.janMean, c.julMean) > 4)
    .map((c) => ({
      id: c.id, country: c.country, method: c.method, prayer: c.prayer, year: c.year,
      annualMean: c.annualMean, janMean: c.janMean, julMean: c.julMean,
      seasonMax: Math.max(c.janMean, c.julMean),
    }))
    .sort((a, b) => b.seasonMax - a.seasonMax);

  const highLat = cells.filter((c) => Math.abs(c.lat) > 50);
  const highLatSummary = SCOPE.map((m) => {
    const mine = highLat.filter((c) => c.method === m);
    const undefJul = mine.reduce((a, c) => a + c.undefinedAngleJul, 0);
    const boundJul = mine.reduce((a, c) => a + c.boundDaysJul, 0);
    const clamped = mine.filter((c) => c.clampDaysJul > 0);
    const clampMeans = clamped.map((c) => c.clampMeanJul);
    const worstClamp = clamped.reduce((a, c) => (a === null || c.clampMeanJul > a.clampMeanJul ? c : a), null);
    return {
      method: m,
      cells: mine.length,
      undefinedAngleDaysJul: undefJul,
      substitutedDaysJul: boundJul,
      cellsClampedJul: clamped.length,
      meanClampJul: clampMeans.length ? clampMeans.reduce((a, b) => a + b, 0) / clampMeans.length : 0,
      worstClampJul: worstClamp ? { id: worstClamp.id, prayer: worstClamp.prayer, minutes: worstClamp.clampMeanJul } : null,
      annualClampDays: mine.reduce((a, c) => a + c.clampDaysAnnual, 0),
    };
  }).sort((a, b) => b.undefinedAngleDaysJul - a.undefinedAngleDaysJul || b.meanClampJul - a.meanClampJul);

  const payload = {
    schema: 'o1h-global-seasonal/1',
    generated: '2026-11-10',
    scope: {
      methods: SCOPE,
      carriers: 'verbatim from sim/lib.mjs METHODS; preset where adhan ships one, constructed Other otherwise',
      year: 'January/July 2026 means against each target recipe; London against published minutes for 2027',
      metric: 'mean |deviation| in wall-clock minutes; spread = July mean minus January mean',
    },
    skipped,
    targets: results.map((r) => ({ id: r.id, kind: r.kind, targetDays: r.targetDays, targetMissingJul: r.targetMissingJul })),
    consistency: {
      compared: consistency.length,
      maxAbsDiffMinutes: worstDiff,
      note: 'annualMean here vs sim/out annual mean, same carriers and same target recipes',
    },
    methods: methodRows,
    methodsBelow50: methodRowsBelow50,
    hidden,
    highLatitude: highLat,
    highLatitudeSummary: highLatSummary,
    cells,
  };
  writeFileSync(join(HERE, 'results.json'), JSON.stringify(payload, null, 1));
  rmSync(join(HERE, 'work'), { recursive: true, force: true });
  console.log(`targets ${results.length} cells ${cells.length} consistency max diff ${worstDiff}`);
  for (const r of methodRows) {
    console.log(`${r.method.padEnd(14)} worst=${r.worstSpread.toFixed(2)} mean=${r.meanAbsSpread.toFixed(2)} over4=${r.cellsOver4}/${r.cellsScored} at ${r.worstCell?.country}/${r.worstCell?.prayer}`);
  }
  console.log(`hidden ${hidden.length}`);
}
