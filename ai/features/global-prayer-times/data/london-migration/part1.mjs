// R13 Part 1: what a London user would lose under every candidate computed source.
// Reference: the app's CURRENT source, the London Prayer Times 2026 year.

import fs from 'node:fs';
import {
  adhan,
  readLpt,
  toMin,
  datesOf,
  computeDay,
  LONDON_GENERIC,
  LONDON_HIZBUL,
  FIELDS,
  summarise,
  histogram,
} from './lib.mjs';

const lpt = readLpt();
const dates = datesOf(2026).filter((d) => lpt[d]);

const round = (x, rule) => {
  if (x === null) return null;
  if (rule === 'nearest') return Math.round(x);
  if (rule === 'up') return Math.ceil(x);
  if (rule === 'down') return Math.floor(x);
  throw new Error(rule);
};

/** Each candidate: a name, coordinates, a params builder, and per-field post-offsets in minutes. */
const paramsBase = (method) => {
  const p = adhan.CalculationMethod[method]();
  p.rounding = adhan.Rounding.None;
  return p;
};

const candidates = [];

// 1. adhan MoonsightingCommittee, as shipped, both madhabs, both plausible London points.
for (const [coordName, coords] of [
  ['51.5072,-0.1276', LONDON_GENERIC],
  ['51.5,-0.165', LONDON_HIZBUL],
]) {
  for (const madhab of ['Shafi', 'Hanafi']) {
    const p = paramsBase('MoonsightingCommittee');
    p.madhab = adhan.Madhab[madhab];
    candidates.push({
      id: `MoonsightingCommittee/${madhab}/${coordName}`,
      family: 'MoonsightingCommittee',
      coords,
      params: p,
      offsets: {},
    });
  }
}

// 2. adhan MuslimWorldLeague, every high-latitude rule, Shafi Asr (what the app displays).
for (const hlr of ['MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle']) {
  const p = paramsBase('MuslimWorldLeague');
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule[hlr];
  candidates.push({
    id: `MuslimWorldLeague/Shafi/${hlr}`,
    family: 'MuslimWorldLeague',
    coords: LONDON_GENERIC,
    params: p,
    offsets: {},
  });
}

// 3. Wifaqul Ulama, R1's measured parameters.
//    Fajr 18; Isha 15 (London is 51.5, at and above 48 degrees); Zuhr = Istiwa + 4;
//    Maghrib = astronomical sunset + 5; both Asr factors published.
for (const hlr of ['MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle']) {
  for (const madhab of ['Shafi', 'Hanafi']) {
    const p = new adhan.CalculationParameters('Other', 18, 15);
    p.rounding = adhan.Rounding.None;
    p.madhab = adhan.Madhab[madhab];
    p.highLatitudeRule = adhan.HighLatitudeRule[hlr];
    candidates.push({
      id: `WifaqulUlama/${madhab}/${hlr}`,
      family: 'WifaqulUlama',
      coords: LONDON_GENERIC,
      params: p,
      offsets: { dhuhr: 4, magrib: 5 },
    });
  }
}

/** Compute the candidate's whole-minute times for every date, under one rounding rule. */
const evaluate = (cand, rule) => {
  const perField = {};
  for (const f of FIELDS) perField[f] = [];
  const noSolution = {};
  for (const f of FIELDS) noSolution[f] = 0;

  for (const d of dates) {
    const raw = computeDay(d, cand.coords, cand.params);
    for (const f of FIELDS) {
      const published = toMin(lpt[d][f]);
      if (published === null) continue;
      const off = cand.offsets[f] ?? 0;
      const val = raw[f] === null ? null : raw[f] + off;
      if (val === null) {
        noSolution[f] += 1;
        continue;
      }
      perField[f].push(round(val, rule) - published);
    }
  }
  const out = { id: cand.id, rule, fields: {}, noSolution };
  for (const f of FIELDS) out.fields[f] = summarise(perField[f]);
  out.raw = perField;
  return out;
};

const results = [];
for (const c of candidates) {
  for (const rule of ['nearest', 'down', 'up']) results.push(evaluate(c, rule));
}

// Pick, per candidate, the rounding rule that maximises total exact matches.
const bestByCandidate = new Map();
for (const r of results) {
  const score = FIELDS.reduce((a, f) => a + (r.fields[f]?.exact ?? 0), 0);
  const prev = bestByCandidate.get(r.id);
  if (!prev || score > prev.score) bestByCandidate.set(r.id, { score, r });
}

const lines = [];
const say = (s = '') => lines.push(s);

say('R13 PART 1: London published timetable versus computed candidates');
say(`Reference: ai/features/moonsighting/data/london/lpt-2026.json, ${dates.length} days, 6 fields`);
say('Delta sign: candidate minus published, whole minutes.');
say('');

say('== 1. Rounding rule fit (total exact matches across all six fields, out of ' + dates.length * 6 + ') ==');
for (const c of candidates) {
  const row = ['nearest', 'down', 'up'].map((rule) => {
    const r = results.find((x) => x.id === c.id && x.rule === rule);
    return `${rule}=${FIELDS.reduce((a, f) => a + (r.fields[f]?.exact ?? 0), 0)}`;
  });
  say(`${c.id.padEnd(48)} ${row.join('  ')}`);
}
say('');

say('== 2. Per-field result, each candidate under its own best rounding rule ==');
for (const [id, { r }] of bestByCandidate) {
  say(`-- ${id}  [rounding: ${r.rule}]`);
  say(
    ['field'.padEnd(8), 'n'.padStart(4), 'exact'.padStart(11), '<=1min'.padStart(11), '<=2min'.padStart(11), 'min'.padStart(5), 'max'.padStart(5), 'worst'.padStart(6), 'mean'.padStart(7), 'sd'.padStart(6), 'nosol'.padStart(6)].join(' ')
  );
  for (const f of FIELDS) {
    const s = r.fields[f];
    if (!s) {
      say(`${f.padEnd(8)}  no published values`);
      continue;
    }
    say(
      [
        f.padEnd(8),
        String(s.n).padStart(4),
        `${s.exact} (${s.pctExact.toFixed(1)}%)`.padStart(11),
        `${s.w1} (${s.pct1.toFixed(1)}%)`.padStart(11),
        `${s.w2} (${s.pct2.toFixed(1)}%)`.padStart(11),
        String(s.min).padStart(5),
        String(s.max).padStart(5),
        String(s.worstAbs).padStart(6),
        s.mean.toFixed(2).padStart(7),
        s.sd.toFixed(2).padStart(6),
        String(r.noSolution[f]).padStart(6),
      ].join(' ')
    );
  }
  say('');
}

say('== 3. Delta histograms for Fajr and Isha, best rounding per candidate ==');
for (const [id, { r }] of bestByCandidate) {
  for (const f of ['fajr', 'isha']) {
    const h = histogram(r.raw[f]);
    say(`${id} [${r.rule}] ${f}: ${h.map(([k, v]) => `${k >= 0 ? '+' : ''}${k}:${v}`).join(' ')}`);
  }
}
say('');

// Asr sanity: which published column each madhab actually reproduces.
say('== 4. Asr: which published column each shadow factor reproduces ==');
for (const madhab of ['Shafi', 'Hanafi']) {
  const p = paramsBase('MoonsightingCommittee');
  p.madhab = adhan.Madhab[madhab];
  for (const col of ['asr', 'asr_2']) {
    const deltas = [];
    for (const d of dates) {
      const raw = computeDay(d, LONDON_GENERIC, p);
      const published = toMin(lpt[d][col]);
      if (published === null || raw.asr === null) continue;
      deltas.push(Math.round(raw.asr) - published);
    }
    const s = summarise(deltas);
    say(
      `adhan Asr madhab=${madhab.padEnd(6)} vs published ${col.padEnd(6)}: exact ${s.exact}/${s.n} (${s.pctExact.toFixed(1)}%), <=1min ${s.pct1.toFixed(1)}%, range ${s.min} to ${s.max}, mean ${s.mean.toFixed(2)}`
    );
  }
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part1.txt', out + '\n');
console.log(out);
