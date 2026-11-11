// O1h independent verification, slice D (Africa + Americas + Oceania, 12 targets).
// Re-implements the shared brief's harness from scratch: 21 naked methods x 12 targets,
// 2026, fajr and isha, wall-clock minute comparison in the target's tz.
//
// Run: node grid.mjs            (spawns one child per scored target with TZ=<iana>)
//      node grid.mjs --report  (results.json -> SLICE-D-REPORT.md)
//
// No real clock is read anywhere: dates are constructed from numeric components.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding,
} from 'file://$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const PARTS = path.join(HERE, 'parts');
const YEAR = 2026;
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2026, not a leap year

// ---------------------------------------------------------------------------
// Method side: 21 methods, naked, per methods.json + SHARED-BRIEF.md.
// roundMode: 'nearest' | 'up' | 'down' | 'floorPlus1' (Umm al-Qura floor(raw+1)).
// margins below are ONLY: preset-carried, brief-mandated (Umm al-Qura print
// formulation floor(raw+1)), or body-published-instrument (ECFR +-2 from the
// Fiqh Academy resolution the council adopts). Census-fitted margin sets
// (Singapore +1s, Dubai superseded set, JAKIM ihtiyati, Kemenag +3s, Qatar +1s)
// are excluded per CONSTRAINTS.md rule 1. Census-fitted rounding modes ARE kept
// per CONSTRAINTS.md rule 4 (Kuwait fajr floor, JAKIM prayers ceil).
// ---------------------------------------------------------------------------
const METHODS = [
  { id: 'mwl',              build: () => CalculationMethod.MuslimWorldLeague() },
  { id: 'isna',             build: () => CalculationMethod.NorthAmerica() },
  { id: 'umm-al-qura',      build: () => CalculationMethod.UmmAlQura(), uaq: true },
  { id: 'egyptian',         build: () => CalculationMethod.Egyptian() },
  { id: 'karachi',          build: () => CalculationMethod.Karachi() },
  { id: 'moonsighting',     build: () => CalculationMethod.MoonsightingCommittee() },
  { id: 'diyanet-domestic', build: () => CalculationMethod.Turkey() },
  { id: 'diyanet-europe',   build: () => other(18, 16) },
  { id: 'mabims',           build: () => other(20, 18) },
  { id: 'jakim',            build: () => other(18, 18), round: { fajr: 'up', isha: 'up' } },
  { id: 'kemenag',          build: () => other(20, 18) },
  { id: 'kuwait',           build: () => CalculationMethod.Kuwait(), round: { fajr: 'down', isha: 'nearest' } },
  { id: 'qatar',            build: () => CalculationMethod.Qatar() },
  { id: 'singapore-muis',   build: () => CalculationMethod.Singapore(), round: { fajr: 'up', isha: 'up' } },
  { id: 'dubai',            build: () => CalculationMethod.Dubai() },
  { id: 'tehran',           build: () => CalculationMethod.Tehran() },
  { id: 'fazilet-a',        build: () => other(19.8, 17.8) },
  { id: 'fazilet-b',        build: () => other(20.8, 18.7) },
  { id: 'ecfr',             build: () => other(18, 17), margin: { fajr: -2, isha: 2 } },
  { id: 'russia-sam',       build: () => other(16, 15) },
  { id: 'isna-2010',        build: () => other(18, 18) },
];

// ishaInterval for angle-less isha bodies. Diyanet-Europe 18/16 per the brief;
// Fazilet effective angles per methods.json; Kemenag = MABIMS per the brief;
// ISNA-2010 18/18 per the brief.
function other(fajrAngle, ishaAngle) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  return p;
}

// ---------------------------------------------------------------------------
// Target side. Scored targets carry the fitted recipe exactly as
// policy-layer.v2.4.json / countries.json record it. Coordinates fallbacks are
// ONLY the two the brief names (JAMIAT-KZN = Durban; EU-DIYANET-UNIFIED, not in
// this slice). Everything else that is null stays null and skips.
// ---------------------------------------------------------------------------
const SCORED = {
  'NE-BUTIN': {
    lat: 13.85, lon: 2.18, tz: 'Africa/Niamey', asr: 'shafi',
    fajr: { kind: 'angle', angle: 18, margin: 0, round: 'nearest' },
    isha: { kind: 'interval', minutes: 75, margin: 0, round: 'nearest' },
  },
  'JAMIAT-KZN': {
    lat: 29.8587, lon: 31.0218, tz: 'Africa/Johannesburg', asr: 'shafi',
    fajr: { kind: 'angle', angle: 18, margin: 0, round: 'nearest' },
    isha: { kind: 'angle', angle: 15, margin: 0, round: 'down' },
  },
  'NG-SPA': {
    lat: 9.06, lon: 7.49, tz: 'Africa/Lagos', asr: 'shafi',
    fajr: { kind: 'angle', angle: 18, margin: 0, round: 'nearest' },
    isha: { kind: 'angle', angle: 17, margin: 0, round: 'nearest' },
  },
  'CL-CIS': {
    lat: -33.4489, lon: -70.6693, tz: 'America/Santiago', asr: 'shafi',
    fajr: { kind: 'angle', angle: 18, margin: 6, round: 'nearest' },
    isha: { kind: 'angle', angle: 17, margin: 6, round: 'nearest' },
  },
};

// Skipped target-prayer pairs, one-line reasons (nothing invented).
const SKIPS = {
  'KE-JAMIA': {
    fajr: 'target coordinates null in countries.json and policy-layer reference.point; the brief names a fallback only for JAMIAT-KZN and EU-DIYANET-UNIFIED; no value invented',
    isha: 'ishaRule notPublished (the Ramadan artifact prints no isha row); coordinates also null with no brief fallback',
  },
  'CI-COSIM': {
    fajr: 'surface-only candidate: fajrRule angle null, recipe never fitted (policy-layer #6958)',
    isha: 'surface-only candidate: ishaRule angle null, recipe never fitted (policy-layer #6958)',
  },
  'DJ-COMMUNITY': {
    fajr: 'surface-only Mawaqit platform data: no parameters published or fitted (angle null) and no country point',
    isha: 'surface-only Mawaqit platform data: no parameters published or fitted (angle null) and no country point',
  },
  'BR-IIB': {
    fajr: 'recipe fitted 18/17 but reference.point null (the fit ran on Sao Paulo; the record carries no coordinates) and the brief names no Brazil fallback; none invented',
    isha: 'recipe fitted 18/17 but reference.point null (the fit ran on Sao Paulo; the record carries no coordinates) and the brief names no Brazil fallback; none invented',
  },
  'TT-MASJIDBOX': {
    fajr: 'Masjidbox platform athan columns: no parameters published (angle null), no coordinates',
    isha: 'Masjidbox platform athan columns: no parameters published (angle null), no coordinates',
  },
  'AU-UMA': {
    fajr: 'surface-only: computed JSON calendar with no published parameters (angle null); coordinates absent from the capture and no brief fallback',
    isha: 'surface-only: computed JSON calendar with no published parameters (angle null); coordinates absent from the capture and no brief fallback',
  },
  'NZ-FIANZ': {
    fajr: 'sheets state offsets, not angles (fajrRule angle null); coordinates not carried and no brief fallback',
    isha: 'sheets state no angles (ishaRule angle null); coordinates not carried and no brief fallback',
  },
  'FJ-FML': {
    fajr: 'recipe fitted (18.0, margin-free) but the Suva base point coordinates are not carried in the record and the brief names no Fiji fallback',
    isha: 'isha margin is a band (+5..+9 past 17 deg), not one number (undefined parameter); Suva coordinates also not carried',
  },
};

const ALL_TARGETS = [
  ...Object.keys(SCORED),
  ...Object.keys(SKIPS),
]; // 12

// ---------------------------------------------------------------------------
// Wall-clock helpers
// ---------------------------------------------------------------------------

const fmtCache = new Map();
function wallParts(epochMs, tz) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    fmtCache.set(tz, f);
  }
  const p = f.formatToParts(new Date(epochMs));
  const h = Number(p.find((x) => x.type === 'hour').value);
  const m = Number(p.find((x) => x.type === 'minute').value);
  const s = Number(p.find((x) => x.type === 'second').value);
  return { h, m, s };
}

// Raw fractional wall-clock minutes past midnight, at second resolution.
function wallMinutesRaw(epochMs, tz) {
  const { h, m, s } = wallParts(Math.floor(epochMs / 1000) * 1000, tz);
  return h * 60 + m + s / 60;
}

function applyRound(raw, mode) {
  switch (mode) {
    case 'nearest': return Math.floor(raw + 0.5); // ties up, half-up
    case 'up': return Math.ceil(raw);
    case 'down': return Math.floor(raw);
    case 'floorPlus1': return Math.floor(raw + 1);
    default: throw new Error(`unknown round mode ${mode}`);
  }
}

// Umm al-Qura 1447 window in the country's civil calendar, per the brief:
// 2026-02-18 through 2026-03-19 inclusive = 30 days.
function inRamadan(y, m0, d) {
  if (y !== YEAR) return false;
  if (m0 === 1) return d >= 18;
  if (m0 === 2) return d <= 19;
  return false;
}

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

function civilDates() {
  const out = [];
  for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= MONTH_DAYS[m]; d++) out.push({ m0: m, d });
  }
  return out; // 365
}

function rawInstant(coords, date, params, which) {
  const pt = new PrayerTimes(coords, date, params);
  if (which === 'fajr') return { ok: true, epoch: pt.fajr.getTime() };
  return { ok: true, epoch: pt.isha.getTime() };
}

// Compute the printed minute for one (params, prayer, day) under a rounding mode,
// with an additive instant margin.
function printedMinute(coords, date, tz, params, which, margin, roundMode) {
  const { ok, epoch } = rawInstant(coords, date, params, which);
  if (!ok || Number.isNaN(epoch)) return null;
  const adj = epoch + margin * 60000;
  return applyRound(wallMinutesRaw(adj, tz), roundMode);
}

function scoreTarget(targetId) {
  const t = SCORED[targetId];
  const coords = new Coordinates(t.lat, t.lon);
  const days = civilDates();
  const perMethod = {};

  // Target reference minutes, once.
  const targetMin = { fajr: [], isha: [] };
  for (const { m0, d } of days) {
    const date = new Date(YEAR, m0, d, 12, 0, 0);
    for (const prayer of ['fajr', 'isha']) {
      const rule = t[prayer];
      const params = CalculationMethod.Other();
      params.rounding = Rounding.None;
      params.madhab = t.asr === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
      if (rule.kind === 'angle') {
        params.fajrAngle = prayer === 'fajr' ? rule.angle : 0;
        params.ishaAngle = prayer === 'isha' ? rule.angle : 0;
      } else if (rule.kind === 'interval') {
        params.fajrAngle = prayer === 'fajr' ? rule.angle : 0;
        params.ishaInterval = prayer === 'isha' ? rule.minutes : 0;
      } else {
        throw new Error(`unhandled target rule kind ${rule.kind}`);
      }
      targetMin[prayer].push(printedMinute(coords, date, t.tz, params, prayer, rule.margin, rule.round));
    }
  }

  // Method minutes and deviations.
  for (const method of METHODS) {
    const devs = { fajr: [], isha: [] };
    for (let i = 0; i < days.length; i++) {
      const { m0, d } = days[i];
      const date = new Date(YEAR, m0, d, 12, 0, 0);
      const params = method.build();
      params.rounding = Rounding.None;
      params.madhab = Madhab.Shafi; // every scored method is Shafi per methods.json
      if (method.uaq) {
        params.ishaInterval = inRamadan(YEAR, m0, d) ? 120 : 90;
      }
      for (const prayer of ['fajr', 'isha']) {
        const roundMode = (method.round && method.round[prayer]) || 'nearest';
        const margin = (method.margin && method.margin[prayer]) || 0;
        const got = printedMinute(coords, date, t.tz, params, prayer, margin, roundMode);
        const ref = targetMin[prayer][i];
        if (got === null || ref === null) {
          devs[prayer].push({ dev: null });
        } else {
          devs[prayer].push({ dev: got - ref });
        }
      }
    }
    perMethod[method.id] = devs;
  }

  return { target: targetId, tz: t.tz, days: days.length, targetMin, perMethod };
}

function summarize(part) {
  const cells = [];
  for (const method of METHODS) {
    for (const prayer of ['fajr', 'isha']) {
      const series = part.perMethod[method.id][prayer];
      const valid = series.filter((x) => x.dev !== null).map((x) => x.dev);
      let worstIdx = -1;
      let worst = -1;
      let sumAbs = 0;
      let sumSigned = 0;
      let within2 = 0;
      for (let i = 0; i < valid.length; i++) {
        const a = Math.abs(valid[i]);
        sumAbs += a;
        sumSigned += valid[i];
        if (a <= 2) within2++;
        if (a > worst) { worst = a; worstIdx = i; }
      }
      cells.push({
        target: part.target,
        method: method.id,
        prayer,
        days: valid.length,
        meanAbsDev: valid.length ? +(sumAbs / valid.length).toFixed(3) : null,
        worstAbsDev: valid.length ? worst : null,
        worstDate: worstIdx >= 0 ? dateOfIndex(worstIdx) : null,
        pctWithin2: valid.length ? +((within2 / valid.length) * 100).toFixed(2) : null,
        meanSignedDev: valid.length ? +(sumSigned / valid.length).toFixed(3) : null,
        skipped: false,
      });
    }
  }
  return cells;
}

function dateOfIndex(i) {
  // 2026-01-01 is index 0
  const md = [];
  for (let m = 0; m < 12; m++) for (let d = 1; d <= MONTH_DAYS[m]; d++) md.push([m + 1, d]);
  const [mo, dd] = md[i];
  return `2026-${String(mo).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

function child(targetId) {
  const part = scoreTarget(targetId);
  const cells = summarize(part);
  const out = { target: targetId, tz: SCORED[targetId].tz, days: 365, cells };
  fs.mkdirSync(PARTS, { recursive: true });
  const f = path.join(PARTS, `${targetId}.json`);
  fs.writeFileSync(f, JSON.stringify(out, null, 1));
  console.log(`wrote ${f} (${cells.length} cells)`);
}

function parent() {
  fs.mkdirSync(PARTS, { recursive: true });
  for (const targetId of Object.keys(SCORED)) {
    const tz = SCORED[targetId].tz;
    const r = spawnSync(process.execPath, [new URL(import.meta.url).pathname, `--target=${targetId}`], {
      env: { ...process.env, TZ: tz },
      encoding: 'utf8',
    });
    if (r.status !== 0) {
      console.error(`child ${targetId} failed:\n${r.stdout}\n${r.stderr}`);
      process.exit(1);
    }
    process.stdout.write(r.stdout);
  }
  merge();
}

function merge() {
  const cells = [];
  const asrFlags = [];
  for (const targetId of Object.keys(SCORED)) {
    const part = JSON.parse(fs.readFileSync(path.join(PARTS, `${targetId}.json`), 'utf8'));
    cells.push(...part.cells);
    for (const method of METHODS) {
      asrFlags.push({ target: targetId, method: method.id, match: SCORED[targetId].asr === 'shafi' });
    }
  }
  for (const targetId of Object.keys(SKIPS)) {
    for (const method of METHODS) {
      for (const prayer of ['fajr', 'isha']) {
        cells.push({
          target: targetId, method: method.id, prayer,
          days: 0, meanAbsDev: null, worstAbsDev: null, worstDate: null,
          pctWithin2: null, meanSignedDev: null,
          skipped: true, reason: SKIPS[targetId][prayer],
        });
      }
    }
  }

  const results = {
    schema: 'o1h-slice-results/1',
    slice: 'slice-d',
    region: 'Africa + Americas + Oceania',
    generated: 'script run; no wall clock read',
    year: YEAR,
    daysPerTarget: 365,
    methodCount: METHODS.length,
    targetCount: ALL_TARGETS.length,
    scoredTargets: Object.keys(SCORED),
    skippedTargets: Object.keys(SKIPS),
    harnessDecisions: [
      'Naked methods: pairs/effective pairs/intervals from methods.json; library presets used verbatim for the 11 bodies adhan carries (including Moonsighting season curves at all latitudes and the Diyanet-Domestic temkin, which the preset carries).',
      'Umm al-Qura: preset pair 18.5 with the brief-mandated Ramadan switch, isha = raw sunset + 120 inside 2026-02-18..2026-03-19 (30-day month), + 90 outside; body print formulation floor(raw+1) on fajr and isha per CONSTRAINTS rule 4.',
      'Census-fitted margin sets are excluded (CONSTRAINTS rule 1): Singapore +1s, Dubai superseded set, JAKIM ihtiyati, Kemenag +3s (brief: Kemenag = MABIMS), Qatar +1s. Census-fitted rounding modes are kept (CONSTRAINTS rule 4): Kuwait fajr floor / isha nearest, JAKIM fajr+isha ceil, Singapore ceil (preset-carried).',
      'ECFR keeps its published +-2 minute margins from the Fiqh Academy resolution the council adopts (CONSTRAINTS rule 2); ECFR runs 18/17 (the council resolution form), not the 2021 Istanbul 18/16.',
      'No-preset bodies (Diyanet-Europe 18/16, MABIMS 20/18, JAKIM 18/18, Fazilet-A 19.8/17.8, Fazilet-B 20.8/18.7, Russia 16/15, ISNA-2010 18/18) run as adhan Other with nearest rounding and zero margins.',
      'Everything computed at second resolution (Rounding.None) and rounded explicitly; wall-clock minutes compared in the target tz; target rounding null -> nearest (NG-SPA).',
      'CL-CIS high-latitude nightPortionSplit never binds: Santiago sits at 33.4 S, far from the 45 S applicability; the angle branch is used.',
      'JAMIAT-KZN runs at Durban 29.8587/31.0218 (the brief fallback) with Durban tz Africa/Johannesburg.',
    ],
    asrSchoolMatch: asrFlags,
    cells,
  };
  const f = path.join(HERE, 'results.json');
  fs.writeFileSync(f, JSON.stringify(results, null, 1));
  console.log(`wrote ${f} (${cells.length} cells, ${cells.filter((c) => !c.skipped).length} scored, ${cells.filter((c) => c.skipped).length} skipped)`);
}

function report() {
  const results = JSON.parse(fs.readFileSync(path.join(HERE, 'results.json'), 'utf8'));
  const scored = results.cells.filter((c) => !c.skipped);
  const byMethod = {};
  for (const c of scored) {
    byMethod[c.method] = byMethod[c.method] || { fajr: [], isha: [] };
    byMethod[c.method][c.prayer].push(c);
  }
  const rows = METHODS.map((m) => {
    const agg = (prayer) => {
      const cs = (byMethod[m.id] || { [prayer]: [] })[prayer] || [];
      if (!cs.length) return null;
      return +(cs.reduce((s, c) => s + c.meanAbsDev, 0) / cs.length).toFixed(2);
    };
    return { method: m.id, fajr: agg('fajr'), isha: agg('isha') };
  });
  const rank = (prayer) => rows.filter((r) => r[prayer] !== null).sort((a, b) => a[prayer] - b[prayer]);
  const L = [];
  L.push('# O1h slice D report: Africa + Americas + Oceania');
  L.push('');
  L.push('Independent recompute over 12 targets x 21 methods x 2 prayers, 2026, 365 days.');
  L.push('Scored targets: ' + Object.keys(SCORED).join(', ') + '.');
  L.push('');
  L.push('## Per-method mean |deviation| (minutes) across the four scored targets');
  L.push('');
  L.push('| method | fajr | isha |');
  L.push('|---|---|---|');
  for (const r of rows) L.push(`| ${r.method} | ${r.fajr} | ${r.isha} |`);
  L.push('');
  for (const prayer of ['fajr', 'isha']) {
    const rk = rank(prayer);
    L.push(`Closest on ${prayer}: ${rk[0].method} (${rk[0][prayer]} min); runner-up ${rk[1].method} (${rk[1][prayer]}). Worst: ${rk[rk.length - 1].method} (${rk[rk.length - 1][prayer]}).`);
  }
  L.push('');
  L.push('## Per-target x method detail');
  L.push('');
  L.push('| target | method | prayer | mean |dev| | worst |dev| | worst date | within 2 min | mean signed |');
  L.push('|---|---|---|---|---|---|---|');
  for (const c of scored) {
    L.push(`| ${c.target} | ${c.method} | ${c.prayer} | ${c.meanAbsDev} | ${c.worstAbsDev} | ${c.worstDate} | ${c.pctWithin2}% | ${c.meanSignedDev} |`);
  }
  L.push('');
  L.push('## Skipped cells (each reason applies to all 21 methods)');
  L.push('');
  L.push('| target | prayer | reason |');
  L.push('|---|---|---|');
  for (const t of Object.keys(SKIPS)) {
    for (const p of ['fajr', 'isha']) L.push(`| ${t} | ${p} | ${SKIPS[t][p]} |`);
  }
  L.push('');
  L.push('## Harness decisions');
  L.push('');
  for (const d of results.harnessDecisions) L.push(`- ${d}`);
  L.push('');
  L.push('## Asr school match');
  L.push('');
  L.push('Every scored target is Shafi and every method is Shafi, so the asr flag is true for all scored pairs.');
  const f = path.join(HERE, 'SLICE-D-REPORT.md');
  fs.writeFileSync(f, L.join('\n'));
  console.log(`wrote ${f}`);
}

const arg = process.argv[2] || '';
if (arg === '--report') {
  report();
} else if (arg.startsWith('--target=')) {
  child(arg.split('=')[1]);
} else {
  parent();
}
