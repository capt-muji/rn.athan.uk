// O1h slice-A (MENA) independent recompute. 17 targets x 21 methods x 365 days of 2026, fajr + isha.
// Run one country per invocation under that country's own TZ, per the shared brief:
//   TZ=<iana> node grid.mjs run <countryId> <partialsDir>
//   node grid.mjs merge <partialsDir> <outDir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const HOME = os.homedir();
const adhan = require(`${HOME}/athan-gitree/census/adhan-build/node_modules/adhan`);
const O1H = `${HOME}/athan-gitree/census/o1h-global`;
const POLICY = '$HOME/repos/rn.athan.uk/ai/features/global-prayer-times/data/census/policy-layer.v2.4.json';

const methodsCatalog = JSON.parse(fs.readFileSync(`${O1H}/methods/methods.json`, 'utf8'));
const countries = JSON.parse(fs.readFileSync(`${O1H}/countries.json`, 'utf8'));
const policy = JSON.parse(fs.readFileSync(POLICY, 'utf8'));
const countryById = Object.fromEntries(countries.map((c) => [c.id, c]));
const policyById = Object.fromEntries(policy.objects.map((o) => [o.id, o]));

const SLICE = [
  'TR-DIYANET-DOMESTIC', 'CY-KKTC', 'JERUSALEM-AWQAF', 'JO-AWQAF', 'QA-MOI',
  'SA-KACST', 'AE-AWQAF', 'OM-MARA', 'YE-AWQAF-SANAA', 'IQ-DIWAN', 'IR-NATIONAL',
  'EG-ESA', 'LY-MUAZZIN', 'TN-INM', 'MA-HABOUS', 'KW-AJIRI', 'SD-MINISTRY',
];

const { Coordinates, CalculationMethod, CalculationParameters, Madhab, Rounding, PrayerTimes } = adhan;

// Ramadan window fixed by the shared brief for 2026 (Ramadan 1447): 30 days.
const RAMADAN = { start: '2026-02-18', end: '2026-03-19', days: 30 };

// Method side, naked: library presets verbatim where adhan carries them; Other() with the
// body's own documented pair where it does not (brief: pairs only, no census margins).
const OTHER = (f, i) => () => {
  const p = CalculationMethod.Other();
  p.fajrAngle = f;
  p.ishaAngle = i;
  return p;
};
const METHOD_DEFS = [
  { id: 'mwl', make: () => CalculationMethod.MuslimWorldLeague(), rounding: 'nearest', src: 'preset MuslimWorldLeague' },
  { id: 'isna', make: () => CalculationMethod.NorthAmerica(), rounding: 'nearest', src: 'preset NorthAmerica' },
  { id: 'umm-al-qura', make: () => CalculationMethod.UmmAlQura(), rounding: 'nearest', src: 'preset UmmAlQura; isha interval 90, 120 inside the brief Ramadan window', ramadanIsha: true },
  { id: 'egyptian', make: () => CalculationMethod.Egyptian(), rounding: 'nearest', src: 'preset Egyptian' },
  { id: 'karachi', make: () => CalculationMethod.Karachi(), rounding: 'nearest', src: 'preset Karachi' },
  { id: 'moonsighting', make: () => CalculationMethod.MoonsightingCommittee(), rounding: 'nearest', src: 'preset MoonsightingCommittee (season curves + shafaq general, library verbatim)' },
  { id: 'diyanet-domestic', make: () => CalculationMethod.Turkey(), rounding: 'nearest', src: 'preset Turkey (temkin rides in the preset)' },
  { id: 'diyanet-europe', make: OTHER(18, 16), rounding: 'nearest', src: 'Other 18/16' },
  { id: 'mabims', make: OTHER(20, 18), rounding: 'nearest', src: 'Other 20/18' },
  { id: 'jakim', make: OTHER(18, 18), rounding: 'nearest', src: 'Other 18/18 (fitted fajr 18; census margins/rounding withheld per constraint 1)' },
  { id: 'kemenag', make: OTHER(20, 18), rounding: 'nearest', src: 'Other 20/18 (= MABIMS per brief)' },
  { id: 'kuwait', make: () => CalculationMethod.Kuwait(), rounding: 'nearest', src: 'preset Kuwait' },
  { id: 'qatar', make: () => CalculationMethod.Qatar(), rounding: 'nearest', src: 'preset Qatar (isha = raw sunset + 90, no Ramadan switch)' },
  { id: 'singapore-muis', make: () => CalculationMethod.Singapore(), rounding: 'up', src: 'preset Singapore; Rounding.Up verbatim (only preset that changes rounding)' },
  { id: 'dubai', make: () => CalculationMethod.Dubai(), rounding: 'nearest', src: 'preset Dubai (library adjustments verbatim)' },
  { id: 'tehran', make: () => CalculationMethod.Tehran(), rounding: 'nearest', src: 'preset Tehran 17.7/14, maghrib 4.5' },
  { id: 'fazilet-a', make: OTHER(19.8, 17.8), rounding: 'nearest', src: 'Other 19.8/17.8 effective' },
  { id: 'fazilet-b', make: OTHER(20.8, 18.7), rounding: 'nearest', src: 'Other 20.8/18.7 effective' },
  { id: 'ecfr', make: OTHER(18, 17), rounding: 'nearest', src: 'Other 18/17 (body pair only; the +/-2 body margins are not in the brief construction spec)' },
  { id: 'russia-sam', make: OTHER(16, 15), rounding: 'nearest', src: 'Other 16/15' },
  { id: 'isna-2010', make: OTHER(18, 18), rounding: 'nearest', src: 'Other 18/18 (ISNA pre-2015 18/18 as told to ICOP 2010)' },
];
const METHOD_IDS = METHOD_DEFS.map((m) => m.id);

// Target side: angle, interval, printedMaghribInterval (interval keyed to the PRINTED maghrib,
// as the census zero-violation evidence requires), notPublished -> skip.
function targetSpec(o) {
  const m = o.margins || {};
  const rd = o.rounding || {};
  const clock = o.timezone.clock;
  const clockSpec = (clock && clock.dstMode === 'fixed' && clock.fixedOffsetMinutes != null)
    ? { mode: 'fixed', offsetMinutes: clock.fixedOffsetMinutes, tz: `Etc/GMT${clock.fixedOffsetMinutes < 0 ? '+' : '-'}${Math.abs(clock.fixedOffsetMinutes / 60)}` }
    : { mode: 'iana', tz: o.timezone.iana };
  const spec = {
    id: o.id, lat: o.reference.point.lat, lon: o.reference.point.lon,
    place: o.reference.point.place, clock: clockSpec,
    asr: o.asr ? o.asr.primary : null,
    highLatKind: o.highLatitude ? o.highLatitude.kind : 'none',
    fajr: { kind: 'angle', angle: o.fajrRule.angle, margin: m.fajr ?? 0, rounding: rd.fajr ?? 'nearest', defined: true },
    isha: null, ishaSkipReason: null,
  };
  const k = o.ishaRule.kind;
  if (k === 'angle') {
    spec.isha = { kind: 'angle', angle: o.ishaRule.angle, margin: m.isha ?? 0, rounding: rd.isha ?? 'nearest', defined: true };
  } else if (k === 'interval') {
    spec.isha = { kind: 'interval', interval: o.ishaRule.interval, margin: m.isha ?? 0, rounding: rd.isha ?? 'nearest', defined: true };
  } else if (k === 'ramadanInterval') {
    spec.isha = {
      kind: 'printedMaghribInterval', interval: o.ishaRule.interval,
      ramadanInterval: o.ishaRule.ramadanInterval, ramadanKeying: o.ishaRule.hijriKeying || null,
      maghribMargin: m.maghrib ?? 0, maghribRounding: rd.maghrib ?? 'nearest', defined: true,
    };
  } else if (k === 'intervalAfterRounding') {
    spec.isha = {
      kind: 'printedMaghribInterval', interval: o.ishaRule.intervalMinutes ?? o.ishaRule.interval,
      ramadanInterval: null, maghribMargin: m.maghrib ?? 0,
      maghribRounding: rd.maghrib ?? 'nearest', defined: true,
    };
  } else if (k === 'notPublished') {
    spec.ishaSkipReason = 'ishaRule.kind=notPublished: the authority prints no isha row';
  } else {
    spec.ishaSkipReason = `unsupported ishaRule.kind=${k}`;
  }
  return spec;
}

const roundMin = (minutes, mode) => {
  if (mode === 'down') return Math.floor(minutes);
  if (mode === 'up') return Math.ceil(minutes);
  return Math.round(minutes); // nearest (half-up, == adhan seconds>=30) and null/silent -> nearest
};

function makeFormatter(clock) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: clock.tz, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });
  const probe = fmt.format(new Date(Date.UTC(2026, 0, 1, 0, 30, 0)));
  const [ph, pm] = probe.split(':').map(Number);
  const expect = (30 + clock.offsetMinutes) % 1440;
  const got = (ph * 60 + pm + 1440) % 1440;
  if (clock.mode === 'fixed' && got !== expect) {
    throw new Error(`fixed clock ${clock.tz} probe failed: ${probe}`);
  }
  return (instant) => {
    const [h, mi] = fmt.format(instant).split(':').map(Number);
    return h * 60 + mi + instant.getUTCSeconds() / 60;
  };
}

function* days2026() {
  for (let m = 1; m <= 12; m++) {
    const dim = new Date(2026, m, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      yield { key: `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, local: new Date(2026, m - 1, d, 12) };
    }
  }
}

function computeCountry(countryId) {
  const spec = targetSpec(policyById[countryId]);
  const cc = countryById[countryId];
  if (Math.abs(cc.lat - spec.lat) > 1e-9 || Math.abs(cc.lon - spec.lon) > 1e-9) {
    throw new Error(`${countryId}: countries.json and policy-layer coordinates disagree`);
  }
  if (process.env.TZ !== spec.clock.tz) {
    throw new Error(`${countryId}: run with TZ=${spec.clock.tz}`);
  }
  const coords = new Coordinates(spec.lat, spec.lon);
  const wall = makeFormatter(spec.clock);
  const targetParams = new CalculationParameters('CensusTarget', spec.fajr.angle, spec.isha ? spec.isha.angle : 0, 0, 0);
  targetParams.rounding = Rounding.None;
  targetParams.madhab = spec.asr === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const cells = {};
  for (const mdef of METHOD_DEFS) cells[mdef.id] = { fajr: [], isha: [] };
  let targetFajrSample = null;
  let targetIshaSample = null;

  for (const { key, local } of days2026()) {
    const inRamadan = key >= RAMADAN.start && key <= RAMADAN.end;
    const tp = new PrayerTimes(coords, local, targetParams);

    const fajrRaw = wall(tp.fajr);
    const fajrTarget = roundMin(fajrRaw + spec.fajr.margin, spec.fajr.rounding);
    let ishaTarget = null;
    if (spec.isha) {
      if (spec.isha.kind === 'angle') {
        ishaTarget = roundMin(wall(tp.isha) + spec.isha.margin, spec.isha.rounding);
      } else if (spec.isha.kind === 'interval') {
        ishaTarget = roundMin(wall(tp.sunset) + spec.isha.interval + spec.isha.margin, spec.isha.rounding);
      } else if (spec.isha.kind === 'printedMaghribInterval') {
        const printedMaghrib = roundMin(wall(tp.sunset) + spec.isha.maghribMargin, spec.isha.maghribRounding);
        const interval = spec.isha.ramadanInterval != null && inRamadan ? spec.isha.ramadanInterval : spec.isha.interval;
        ishaTarget = printedMaghrib + interval;
      }
    }
    targetFajrSample ??= { key, target: fajrTarget, raw: fajrRaw.toFixed(4) };
    if (ishaTarget != null) targetIshaSample ??= { key, target: ishaTarget };

    for (const mdef of METHOD_DEFS) {
      const p = mdef.make();
      p.rounding = Rounding.None;
      if (mdef.ramadanIsha && inRamadan) p.ishaInterval = 120;
      const pt = new PrayerTimes(coords, local, p);
      const mf = roundMin(wall(pt.fajr), mdef.rounding);
      const mi = roundMin(wall(pt.isha), mdef.rounding);
      cells[mdef.id].fajr.push(mf - fajrTarget);
      if (ishaTarget != null) cells[mdef.id].isha.push(mi - ishaTarget);
    }
  }
  return { spec, cells, targetFajrSample, targetIshaSample };
}

function metrics(devs) {
  if (!devs.length) return null;
  let sum = 0, worst = -1, within2 = 0, signedSum = 0;
  for (const d of devs) {
    const a = Math.abs(d);
    sum += a;
    signedSum += d;
    if (a > worst) worst = a;
    if (a <= 2) within2++;
  }
  const n = devs.length;
  return {
    mean: +(sum / n).toFixed(4),
    worst,
    within2: +((within2 * 100) / n).toFixed(2),
    n,
    signedMean: +(signedSum / n).toFixed(4),
  };
}

function cmdRun(countryId, partialsDir) {
  const { spec, cells, targetFajrSample, targetIshaSample } = computeCountry(countryId);
  const out = {
    country: countryId,
    lat: spec.lat, lon: spec.lon, place: spec.place,
    clock: spec.clock, asr: spec.asr, highLatKind: spec.highLatKind,
    recipes: { fajr: spec.fajr, isha: spec.isha, ishaSkipReason: spec.ishaSkipReason },
    targetFajrSample, targetIshaSample,
    cells: {},
  };
  for (const mid of METHOD_IDS) {
    out.cells[mid] = { fajr: metrics(cells[mid].fajr), isha: metrics(cells[mid].isha) };
  }
  fs.mkdirSync(partialsDir, { recursive: true });
  const file = path.join(partialsDir, `${countryId}.json`);
  fs.writeFileSync(file, JSON.stringify(out));
  console.log(`wrote ${file}`);
}

function cmdMerge(partialsDir, outDir) {
  const countryCells = {};
  for (const cid of SLICE) {
    const file = path.join(partialsDir, `${cid}.json`);
    countryCells[cid] = JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const skips = [];
  const countriesOut = [];
  for (const cid of SLICE) {
    const p = countryCells[cid];
    if (p.recipes.ishaSkipReason) {
      skips.push({ country: cid, prayer: 'isha', reason: p.recipes.ishaSkipReason, affected: 'all 21 methods' });
    }
    const cells = {};
    for (const mid of METHOD_IDS) cells[mid] = { fajr: p.cells[mid].fajr, isha: p.cells[mid].isha };
    countriesOut.push({
      id: cid, lat: p.lat, lon: p.lon, place: p.place, clock: p.clock, asrSchool: p.asr,
      recipes: p.recipes,
      asrFlag: p.asr == null ? 'no-data' : 'match', // every scored method publishes Shafi asr
      cells,
    });
  }

  const perMethod = {};
  for (const mid of METHOD_IDS) {
    const agg = { fajr: [], isha: [] };
    for (const cid of SLICE) {
      const c = countryCells[cid].cells[mid];
      if (c.fajr) agg.fajr.push({ country: cid, mean: c.fajr.mean, worst: c.fajr.worst, within2: c.fajr.within2 });
      if (c.isha) agg.isha.push({ country: cid, mean: c.isha.mean, worst: c.isha.worst, within2: c.isha.within2 });
    }
    const avg = (arr, f) => arr.length ? +(arr.reduce((s, x) => s + x[f], 0) / arr.length).toFixed(4) : null;
    perMethod[mid] = {
      fajr: { sliceMean: avg(agg.fajr, 'mean'), closest: agg.fajr.slice().sort((a, b) => a.mean - b.mean)[0] ?? null, worstCountry: agg.fajr.slice().sort((a, b) => b.mean - a.mean)[0] ?? null },
      isha: { sliceMean: avg(agg.isha, 'mean'), closest: agg.isha.slice().sort((a, b) => a.mean - b.mean)[0] ?? null, worstCountry: agg.isha.slice().sort((a, b) => b.mean - a.mean)[0] ?? null },
    };
  }

  const anchors = {
    'diyanet-domestic x TR-DIYANET-DOMESTIC': countryCells['TR-DIYANET-DOMESTIC'].cells['diyanet-domestic'],
    'egyptian x EG-ESA': countryCells['EG-ESA'].cells['egyptian'],
    'dubai x AE-AWQAF': countryCells['AE-AWQAF'].cells['dubai'],
    'umm-al-qura x SA-KACST': countryCells['SA-KACST'].cells['umm-al-qura'],
    'qatar x QA-MOI': countryCells['QA-MOI'].cells['qatar'],
    'kuwait x KW-AJIRI': countryCells['KW-AJIRI'].cells['kuwait'],
  };

  const results = {
    slice: 'slice-a (MENA)',
    generated: new Date().toISOString(),
    brief: 'O1h SHARED-BRIEF.md + CONSTRAINTS.md',
    inputs: {
      methods: 'methods/methods.json (20) + ISNA-2010 18/18',
      targets: 'countries.json x policy-layer.v2.4.json',
      adhan: 'adhan-js 4.4.6',
    },
    year: 2026, dayCount: 365,
    ramadan: { window: `${RAMADAN.start}..${RAMADAN.end}`, days: RAMADAN.days, appliedTo: ['umm-al-qura method isha interval', 'SA-KACST target isha interval'] },
    decisions: DECISIONS,
    methodSide: METHOD_DEFS.map((m) => ({ id: m.id, rounding: m.rounding, src: m.src })),
    countries: countriesOut,
    perMethod,
    anchors,
    skips,
  };
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, 'results.json');
  fs.writeFileSync(file, JSON.stringify(results, null, 1));
  console.log(`wrote ${file}`);
  for (const [k, v] of Object.entries(anchors)) {
    console.log(`anchor ${k}: fajr mean ${v.fajr && v.fajr.mean} worst ${v.fajr && v.fajr.worst} | isha mean ${v.isha && v.isha.mean} worst ${v.isha && v.isha.worst}`);
  }
  for (const mid of METHOD_IDS) {
    console.log(`${mid}: fajr ${perMethod[mid].fajr.sliceMean} isha ${perMethod[mid].isha.sliceMean}`);
  }
}

const DECISIONS = [
  'Comparison clock is the target authority print clock: fixed UTC+3 for JERUSALEM-AWQAF and fixed UTC+1 for MA-HABOUS, IANA civil elsewhere; both target and method times are read on that same clock.',
  'Method rounding is nearest minute everywhere except singapore-muis, whose preset carries Rounding.Up verbatim; no census-fitted method rounding or margins are applied (constraint 1), so umm-al-qura/kuwait/qatar/dubai/jakim/kemenag naked forms round nearest.',
  'ECFR is scored as the bare 18/17 pair: the brief construction spec for non-preset bodies carries pairs only, so the MWL-Fiqh-Academy +/-2 body margins are not applied.',
  'JAKIM naked = 18/18 (its fitted fajr), Kemenag = 20/18 = MABIMS pair, per the brief; their census margins/roundings are target-side property and never ride the method.',
  'SA-KACST isha interval is keyed to the PRINTED maghrib (floor(raw+1)), because the census measured isha-minus-maghrib exact on every Ramadan day with zero violations; plain floor(raw+interval+1) would violate it.',
  'QA-MOI isha = printed maghrib (nearest(raw+1)) + 90, per ishaRule kind intervalAfterRounding; SD-MINISTRY isha = nearest(raw sunset + 90), its 90-minute interval is carried in the policy layer.',
  'IR-NATIONAL isha skipped: notPublished. Its fajr rounding is silent, so harness nearest applies.',
  'CY-KKTC emulation records a 3-term seasonal harmonic (amplitudes only, no phases) and a per-edition constant; no values exist to implement them, so the fitted base recipe (17.5/-1, 17.3/0, nearest) is scored and the refinement is recorded, not invented.',
  'TR-DIYANET-DOMESTIC highLatitude kind frozenLatitude45 never binds at 41.008N (policy provenance), so domestic Istanbul is the plain 18/17+temkin recipe; temkin never touches fajr/isha.',
  'Ramadan window 2026-02-18..2026-03-19 (30 days) drives both the umm-al-qura method switch and the SA-KACST target switch.',
];

const [, , cmd, a, b] = process.argv;
if (cmd === 'run') cmdRun(a, b);
else if (cmd === 'merge') cmdMerge(a, b);
else {
  console.error('usage: TZ=<iana> node grid.mjs run <countryId> <partialsDir> | node grid.mjs merge <partialsDir> <outDir>');
  process.exit(2);
}
