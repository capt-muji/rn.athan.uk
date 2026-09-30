// R3 polar behaviour and performance.
//
// Part A: what each library returns at Tromso (69.65N) in midnight sun and in
// polar night. The exact JS value matters: a Date, a NaN Date, a null, a string
// sentinel and a thrown error each need different app code.
//
// Part B: time to compute one day and a full year, and the library's own bundled
// size. The floor device is a OnePlus 3T (Snapdragon 820, Android 9), so the
// numbers below are a Mac upper bound, scaled in the report.
//
// Run:  TZ=UTC node polar.mjs > polar.txt

import { createRequire } from 'node:module';
import { statSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const adhan = await import('adhan');
const { PrayTime } = require('praytime');
const PrayTimesLib = require('praytimes');
const PrayTimesCtor = PrayTimesLib.PrayTimes ?? PrayTimesLib;
const PraytimeCore = require('@praytime/core');

const TROMSO = { lat: 69.6492, lon: 18.9553, tz: 'Europe/Oslo' };
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const out = [];

function describe(v) {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'string') return `"${v}"`;
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? 'Invalid Date' : v.toISOString().slice(11, 16);
  }
  if (typeof v === 'number') {
    return Number.isNaN(v) ? 'NaN' : String(v);
  }
  return String(v);
}

// ------------------------------------------------- Part A: polar behaviour

out.push('## Part A: what each library returns at Tromso 69.6492N');
out.push('');
out.push('Times are UTC HH:MM. `Invalid Date` is a `Date` whose `getTime()` is NaN,');
out.push('which is what `new Date(NaN)` prints and what `isNaN()` detects. Rows are');
out.push('the midnight-sun solstice, the polar-night solstice, and the two equinoxes');
out.push('as a control where the sun does rise and set.');
out.push('');

const POLAR_DATES = [
  ['2026-06-21', 'midnight sun'],
  ['2026-12-21', 'polar night'],
  ['2026-03-20', 'equinox control'],
  ['2026-09-22', 'equinox control'],
];

const CASES = [
  {
    id: 'adhan@4.4.6 Unresolved (default)',
    fn: (y, m, d) => {
      const p = adhan.CalculationMethod.MuslimWorldLeague();
      p.polarCircleResolution = adhan.PolarCircleResolution.Unresolved;
      const pt = new adhan.PrayerTimes(
        new adhan.Coordinates(TROMSO.lat, TROMSO.lon),
        new Date(Date.UTC(y, m - 1, d)),
        p,
      );
      return Object.fromEntries(PRAYERS.map((k) => [k, pt[k]]));
    },
  },
  {
    id: 'adhan@4.4.6 AqrabBalad',
    fn: (y, m, d) => {
      const p = adhan.CalculationMethod.MuslimWorldLeague();
      p.polarCircleResolution = adhan.PolarCircleResolution.AqrabBalad;
      const pt = new adhan.PrayerTimes(
        new adhan.Coordinates(TROMSO.lat, TROMSO.lon),
        new Date(Date.UTC(y, m - 1, d)),
        p,
      );
      return Object.fromEntries(PRAYERS.map((k) => [k, pt[k]]));
    },
  },
  {
    id: 'adhan@4.4.6 AqrabYaum',
    fn: (y, m, d) => {
      const p = adhan.CalculationMethod.MuslimWorldLeague();
      p.polarCircleResolution = adhan.PolarCircleResolution.AqrabYaum;
      const pt = new adhan.PrayerTimes(
        new adhan.Coordinates(TROMSO.lat, TROMSO.lon),
        new Date(Date.UTC(y, m - 1, d)),
        p,
      );
      return Object.fromEntries(PRAYERS.map((k) => [k, pt[k]]));
    },
  },
  {
    id: 'praytime@3.2.0 highLats=NightMiddle (default)',
    fn: (y, m, d) => {
      const q = new PrayTime('MWL');
      q.location([TROMSO.lat, TROMSO.lon]).utcOffset(0).format('24h');
      q.adjust({ highLats: 'NightMiddle' });
      return q.times([y, m, d]);
    },
  },
  {
    id: 'praytime@3.2.0 highLats=OneSeventh',
    fn: (y, m, d) => {
      const q = new PrayTime('MWL');
      q.location([TROMSO.lat, TROMSO.lon]).utcOffset(0).format('24h');
      q.adjust({ highLats: 'OneSeventh' });
      return q.times([y, m, d]);
    },
  },
  {
    id: 'praytime@3.2.0 highLats=None',
    fn: (y, m, d) => {
      const q = new PrayTime('MWL');
      q.location([TROMSO.lat, TROMSO.lon]).utcOffset(0).format('24h');
      q.adjust({ highLats: 'None' });
      return q.times([y, m, d]);
    },
  },
  // `praytimes@0.0.5` keeps `setting` and `offset` on the PROTOTYPE
  // (praytimes.js L126-131 and L137) and `adjust`/`tune` mutate them in place
  // (L241-245), so one instance's configuration leaks into every other instance
  // and into every instance constructed later. These two rows therefore must
  // restore the default explicitly, or the second row silently poisons the
  // first. That is a defect, recorded in the report, not a harness workaround.
  {
    id: 'praytimes@0.0.5 highLats=NightMiddle (default)',
    fn: (y, m, d) => {
      const p = new PrayTimesCtor('MWL');
      p.adjust({ highLats: 'NightMiddle' });
      return p.getTimes(new Date(y, m - 1, d), [TROMSO.lat, TROMSO.lon], 0, 0, '24h');
    },
  },
  {
    id: 'praytimes@0.0.5 highLats=None',
    fn: (y, m, d) => {
      const p = new PrayTimesCtor('MWL');
      p.adjust({ highLats: 'None' });
      return p.getTimes(new Date(y, m - 1, d), [TROMSO.lat, TROMSO.lon], 0, 0, '24h');
    },
  },
  {
    id: '@praytime/core@1.0.2 MIDDLE_OF_THE_NIGHT',
    fn: (y, m, d) => {
      const pt = new PraytimeCore.PrayerTimes('MWL', 'STANDARD');
      const t = pt.getTimes(
        new Date(Date.UTC(y, m - 1, d, 12)),
        TROMSO.lat,
        TROMSO.lon,
        null,
        'MIDDLE_OF_THE_NIGHT',
        null,
        '24h',
        'UTC',
      );
      return {
        fajr: t.Fajr,
        sunrise: t.Sunrise,
        dhuhr: t.Dhuhr,
        asr: t.Asr,
        maghrib: t.Maghrib,
        isha: t.Isha,
      };
    },
  },
  {
    id: '@praytime/core@1.0.2 NONE',
    fn: (y, m, d) => {
      const pt = new PraytimeCore.PrayerTimes('MWL', 'STANDARD');
      const t = pt.getTimes(
        new Date(Date.UTC(y, m - 1, d, 12)),
        TROMSO.lat,
        TROMSO.lon,
        null,
        'NONE',
        null,
        '24h',
        'UTC',
      );
      return {
        fajr: t.Fajr,
        sunrise: t.Sunrise,
        dhuhr: t.Dhuhr,
        asr: t.Asr,
        maghrib: t.Maghrib,
        isha: t.Isha,
      };
    },
  },
];

for (const [iso, label] of POLAR_DATES) {
  const [y, m, d] = iso.split('-').map(Number);
  out.push(`### ${iso} (${label})`);
  out.push(`| configuration | ${PRAYERS.join(' | ')} |`);
  out.push(`|---|${PRAYERS.map(() => '---').join('|')}|`);
  for (const c of CASES) {
    let cells;
    try {
      const r = c.fn(y, m, d);
      cells = PRAYERS.map((k) => describe(r[k]));
    } catch (e) {
      cells = PRAYERS.map(() => `THROWS ${e.constructor.name}`);
    }
    out.push(`| \`${c.id}\` | ${cells.join(' | ')} |`);
  }
  out.push('');
}

// How many days a year each configuration fails to produce a value.
out.push('### Days in 2026 with no usable value, Tromso');
out.push(`| configuration | ${PRAYERS.join(' | ')} |`);
out.push(`|---|${PRAYERS.map(() => '---').join('|')}|`);

function unusable(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return !/^\d{1,2}:\d{2}/.test(v);
  if (v instanceof Date) return Number.isNaN(v.getTime());
  if (typeof v === 'number') return !Number.isFinite(v);
  return true;
}

for (const c of CASES) {
  const bad = Object.fromEntries(PRAYERS.map((k) => [k, 0]));
  let threw = 0;
  for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 86400000) {
    const dt = new Date(t);
    try {
      const r = c.fn(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
      for (const k of PRAYERS) if (unusable(r[k])) bad[k]++;
    } catch {
      threw++;
      for (const k of PRAYERS) bad[k]++;
    }
  }
  const suffix = threw ? ` (threw on ${threw} days)` : '';
  out.push(
    `| \`${c.id}\`${suffix} | ${PRAYERS.map((k) => bad[k]).join(' | ')} |`,
  );
}

// ------------------------------------------------------ Part B: performance

out.push('');
out.push('## Part B: performance');
out.push('');
out.push(`Host: node ${process.version}, ${process.platform} ${process.arch}.`);
out.push('Each figure is the best of 5 runs, to shed GC noise. "one day" is a single');
out.push('six-prayer computation at London including object construction, which is what');
out.push('an app actually does. "full year" is 365 consecutive days.');
out.push('');

const LONDON = { lat: 51.5074, lon: -0.1278 };

const PERF = [
  {
    id: 'adhan@4.4.6',
    one: () => {
      const p = adhan.CalculationMethod.MuslimWorldLeague();
      const pt = new adhan.PrayerTimes(
        new adhan.Coordinates(LONDON.lat, LONDON.lon),
        new Date(Date.UTC(2026, 5, 21)),
        p,
      );
      return pt.fajr.getTime();
    },
  },
  {
    id: 'praytime@3.2.0',
    one: () => {
      const q = new PrayTime('MWL');
      q.location([LONDON.lat, LONDON.lon]).utcOffset(0).format('x');
      return q.times([2026, 6, 21]).fajr;
    },
  },
  {
    id: 'praytimes@0.0.5',
    one: () =>
      new PrayTimesCtor('MWL').getTimes(
        new Date(2026, 5, 21),
        [LONDON.lat, LONDON.lon],
        0,
        0,
        'Float',
      ).fajr,
  },
  {
    id: '@praytime/core@1.0.2',
    one: () =>
      new PraytimeCore.PrayerTimes('MWL', 'STANDARD').getTimes(
        new Date(Date.UTC(2026, 5, 21, 12)),
        LONDON.lat,
        LONDON.lon,
        null,
        'MIDDLE_OF_THE_NIGHT',
        null,
        'Float',
        'UTC',
      ).Fajr,
  },
];

function bestOf(fn, runs, iters) {
  let best = Infinity;
  for (let r = 0; r < runs; r++) {
    // warm up so the comparison is of steady-state JIT, not first-call parse
    for (let i = 0; i < Math.min(iters, 200); i++) fn();
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < iters; i++) fn();
    const dt = Number(process.hrtime.bigint() - t0) / 1e6;
    if (dt < best) best = dt;
  }
  return best / iters;
}

function dirSize(dir) {
  let total = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) total += dirSize(p);
    else total += statSync(p).size;
  }
  return total;
}

// The file an RN bundler actually pulls in, resolved through `require`.
function entrySize(pkg) {
  try {
    return statSync(require.resolve(pkg)).size;
  } catch {
    return null;
  }
}

out.push('| library | one day (ms) | full year (ms) | days per second | entry file (KB) | installed (KB) |');
out.push('|---|---|---|---|---|---|');

for (const p of PERF) {
  const perCall = bestOf(p.one, 5, 2000);
  const pkgName = p.id.split('@').slice(0, -1).join('@') || p.id;
  const entry = entrySize(pkgName);
  let installed = null;
  try {
    installed = dirSize(dirname(require.resolve(pkgName)).replace(/(node_modules\/(@[^/]+\/)?[^/]+).*/, '$1'));
  } catch {
    installed = null;
  }
  out.push(
    `| \`${p.id}\` | ${perCall.toFixed(4)} | ${(perCall * 365).toFixed(1)} | ${Math.round(1000 / perCall)} | ${entry ? (entry / 1024).toFixed(1) : 'n/a'} | ${installed ? (installed / 1024).toFixed(0) : 'n/a'} |`,
  );
}

console.log(out.join('\n'));
