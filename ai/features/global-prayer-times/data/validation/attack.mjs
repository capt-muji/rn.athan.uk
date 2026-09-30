// R7 Part 5: the strongest honest case AGAINST `adhan@4.4.6`.
//
// Five charges, each tested rather than asserted:
//
//   1. The Asr `// TODO source shadow angle calculation` comment in
//      `SolarTime.ts` L100. Is the function actually wrong, or is the comment
//      an unresolved citation on correct code? Tested against the closed-form
//      shadow-ratio definition solved independently with `astronomy-engine`.
//
//   2. `highLatitudeRule` silently ignored on the `MoonsightingCommittee`
//      path. Already measured in `highlat.mjs` section E; here the SIZE of
//      what the user loses is measured: how far the MC Fajr sits from what
//      each rule would have given.
//
//   3. `HighLatitudeRule.recommended()` tests `coordinates.latitude > 48`,
//      not `Math.abs(...)`, so it never fires in the southern hemisphere.
//      Measured at Ushuaia.
//
//   4. The three-year maintenance gap. A registry fact, not measurable here,
//      but its consequence is: does the 2026 code differ from the 2022 code
//      in a way that matters? Checked by running `adhan@4.4.3` (the last 2022
//      release) against `adhan@4.4.6` over the full grid.
//
//   5. `praytime@3.2.0` is half the bundle and iterates the Asr declination
//      where adhan uses the noon value. Measured: which one is closer to the
//      exact shadow-ratio solve?
//
// Run: TZ=UTC node attack.mjs > attack.txt

import { createRequire } from 'node:module';
import {
  CITIES,
  Astronomy,
  adhan,
  adhanDay,
  fmt,
  mins,
  stats,
  transit,
  yearDays,
} from './lib.mjs';

const require = createRequire(import.meta.url);
const out = [];
const p = (s = '') => out.push(s);
const DAYS = yearDays(2026);

const GRID = [
  ['Makkah', 21.4225, 39.8262],
  ['Cairo', 30.0444, 31.2357],
  ['Karachi', 24.8607, 67.0011],
  ['Jakarta', -6.2088, 106.8456],
  ['NewYork', 40.7128, -74.006],
  ['London', 51.5074, -0.1278],
  ['Oslo', 59.9139, 10.7522],
  ['Reykjavik', 64.1466, -21.9426],
  ['Tromso', 69.6492, 18.9553],
];

p('# R7 Part 5: the case against `adhan@4.4.6`');
p();

// ------------------------------------------- charge 1: the Asr TODO comment

p('## Charge 1: `SolarTime.afternoon` carries `// TODO source shadow angle calculation`');
p();
p('The shipped code (`src/SolarTime.ts` L99-105, `adhan@4.4.6`):');
p();
p('```ts');
p('afternoon(shadowLength: number) {');
p('  // TODO source shadow angle calculation');
p('  const tangent = Math.abs(this.observer.latitude - this.solar.declination);');
p('  const inverse = shadowLength + Math.tan(degreesToRadians(tangent));');
p('  const angle = radiansToDegrees(Math.atan(1.0 / inverse));');
p('  return this.hourAngle(angle, true);');
p('}');
p('```');
p();
p(
  'Two things are wrong with it on inspection, and both are measurable. It uses',
);
p(
  'the NOON declination for an event hours later, and it approximates the noon',
);
p(
  'zenith distance as `|latitude - declination|`, which ignores the equation of',
);
p('time and the observer\'s longitude within the timezone.');
p();
p(
  'The exact definition: Asr begins when the sun\'s altitude `A` satisfies',
);
p(
  '`cot(A) = f + cot(a)` where `a` is the sun\'s altitude at TRUE NOON and `f` is',
);
p(
  'the shadow factor. Solved here independently with `astronomy-engine`, taking',
);
p(
  'the altitude at the actual transit instant and iterating the declination to',
);
p('the Asr time. Delta is adhan minus the exact solve, in minutes.');
p();

function exactAsr(y, m, d, lat, lon, factor) {
  const obs = new Astronomy.Observer(lat, lon, 0);
  const noon = transit(y, m, d, lat, lon);
  if (!noon) return null;
  const eqNoon = Astronomy.Equator(Astronomy.Body.Sun, noon, obs, true, true);
  const horNoon = Astronomy.Horizon(noon, obs, eqNoon.ra, eqNoon.dec);
  const aNoon = horNoon.altitude;
  if (aNoon <= 0) return null;
  const cotA = factor + 1 / Math.tan((aNoon * Math.PI) / 180);
  const target = (Math.atan(1 / cotA) * 180) / Math.PI;
  if (target <= 0) return null;
  const ev = Astronomy.SearchAltitude(
    Astronomy.Body.Sun,
    obs,
    -1,
    Astronomy.MakeTime(noon),
    0.5,
    target,
  );
  return ev ? ev.date : null;
}

const require2 = require;
const { PrayTime } = require2('praytime');

function praytimeAsr(y, m, d, lat, lon, madhab) {
  const q = new PrayTime('MWL');
  q.location([lat, lon]).utcOffset(0).format('x');
  q.adjust({ asr: madhab, dhuhr: '0 min', maghrib: '0 min' });
  q.round('nearest');
  const t = q.times([y, m, d]);
  return Number.isFinite(t.asr) ? Math.round(t.asr / 60000) : null;
}

for (const madhab of ['Standard', 'Hanafi']) {
  const factor = madhab === 'Standard' ? 1 : 2;
  p(`### ${madhab} Asr (shadow factor ${factor})`);
  p();
  p(
    '| city | lat | n | adhan exact days | adhan mean (min) | adhan worst | `praytime` exact | `praytime` mean | `praytime` worst |',
  );
  p('|---|---|---|---|---|---|---|---|---|');
  for (const [name, lat, lon] of GRID) {
    const adhanD = [];
    const ptD = [];
    for (const [y, m, d] of DAYS) {
      const want = exactAsr(y, m, d, lat, lon, factor);
      if (!want) continue;
      const wantMin = Math.round(want.getTime() / 60000);
      const t = adhanDay('MuslimWorldLeague', lat, lon, y, m, d, {
        zeroAdjustments: true,
        madhab: madhab === 'Standard' ? adhan.Madhab.Shafi : adhan.Madhab.Hanafi,
      });
      const got = mins(t.asr);
      if (got !== null) adhanD.push(got - wantMin);
      const pt = praytimeAsr(y, m, d, lat, lon, madhab);
      if (pt !== null) ptD.push(pt - wantMin);
    }
    const a = stats(adhanD);
    const b = stats(ptD);
    p(
      `| ${name} | ${lat.toFixed(1)} | ${a ? a.n : 0} | ${adhanD.filter((x) => x === 0).length} | ${a ? fmt(a.mean, 1) : 'n/a'} | ${a ? a.absMax : 'n/a'} | ${ptD.filter((x) => x === 0).length} | ${b ? fmt(b.mean, 1) : 'n/a'} | ${b ? b.absMax : 'n/a'} |`,
    );
  }
  p();
}

// ------------------------- charge 2: the MoonsightingCommittee rule bypass

p('## Charge 2: what the `MoonsightingCommittee` rule bypass costs the user');
p();
p(
  '`highlat.mjs` section E showed the setting does nothing on that path. This',
);
p(
  'measures the SIZE: how far the MC Fajr sits from what each rule would have',
);
p('given at the same place on the same day. Delta is MC minus MWL-under-rule.');
p();
p('| city | lat | rule | days differing | mean (min) | worst (min) |');
p('|---|---|---|---|---|---|');
for (const city of CITIES.filter((c) =>
  ['London', 'Oslo', 'Reykjavik', 'Tromso'].includes(c.name),
)) {
  for (const rule of [
    adhan.HighLatitudeRule.MiddleOfTheNight,
    adhan.HighLatitudeRule.SeventhOfTheNight,
    adhan.HighLatitudeRule.TwilightAngle,
  ]) {
    const deltas = [];
    for (const [y, m, d] of DAYS) {
      const mc = mins(
        adhanDay('MoonsightingCommittee', city.lat, city.lon, y, m, d, {
          zeroAdjustments: true,
          highLatitudeRule: rule,
        }).fajr,
      );
      const mwl = mins(
        adhanDay('MuslimWorldLeague', city.lat, city.lon, y, m, d, {
          zeroAdjustments: true,
          highLatitudeRule: rule,
        }).fajr,
      );
      if (mc === null || mwl === null) continue;
      deltas.push(mc - mwl);
    }
    const s = stats(deltas);
    p(
      `| ${city.name} | ${city.lat.toFixed(1)} | \`${rule}\` | ${deltas.filter((x) => x !== 0).length}/${deltas.length} | ${s ? fmt(s.mean, 1) : 'n/a'} | ${s ? s.absMax : 'n/a'} |`,
    );
  }
}
p();

// ----------------------------- charge 3: recommended() and the south

p('## Charge 3: `HighLatitudeRule.recommended()` never fires below the equator');
p();
p('`src/HighLatitudeRule.ts`, verbatim:');
p();
p('```ts');
p('recommended(coordinates: Coordinates) {');
p('  if (coordinates.latitude > 48) {');
p('    return HighLatitudeRule.SeventhOfTheNight;');
p('  } else {');
p('    return HighLatitudeRule.MiddleOfTheNight;');
p('  }');
p('}');
p('```');
p();
p(
  'The comparison is on the signed latitude, so Ushuaia at 54.8S gets',
);
p(
  '`MiddleOfTheNight` while Manchester at 53.5N gets `SeventhOfTheNight`. Both',
);
p('are the same distance from the equator. Measured consequence:');
p();
p('| city | lat | `recommended()` returns | Fajr days it differs from the mirrored choice | mean (min) | worst (min) |');
p('|---|---|---|---|---|---|');
for (const city of CITIES.filter((c) =>
  ['Manchester', 'Copenhagen', 'Ushuaia'].includes(c.name),
)) {
  const coords = new adhan.Coordinates(city.lat, city.lon);
  const got = adhan.HighLatitudeRule.recommended(coords);
  const mirrored = adhan.HighLatitudeRule.recommended(
    new adhan.Coordinates(Math.abs(city.lat), city.lon),
  );
  const deltas = [];
  for (const [y, m, d] of DAYS) {
    const a = mins(
      adhanDay('MuslimWorldLeague', city.lat, city.lon, y, m, d, {
        highLatitudeRule: got,
      }).fajr,
    );
    const b = mins(
      adhanDay('MuslimWorldLeague', city.lat, city.lon, y, m, d, {
        highLatitudeRule: mirrored,
      }).fajr,
    );
    if (a === null || b === null) continue;
    deltas.push(a - b);
  }
  const s = stats(deltas);
  p(
    `| ${city.name} | ${city.lat.toFixed(1)} | \`${got}\` | ${deltas.filter((x) => x !== 0).length}/${deltas.length} | ${s ? fmt(s.mean, 1) : 'n/a'} | ${s ? s.absMax : 'n/a'} |`,
  );
}
p();

// ------------------------------ charge 4: did the 2026 releases change output

p('## Charge 4: did four years of silence leave a stale library');
p();
p(
  'Registry facts (`npm view adhan time`, fetched 2026-09-30): 4.4.3 published',
);
p(
  '2022-05-14, then nothing until 4.4.4 on 2026-06-13, 4.4.5 on 2026-08-30 and',
);
p(
  '4.4.6 on 2026-08-31. A three-year, eleven-month gap. The question that',
);
p(
  'matters is whether the resumed maintenance changed any OUTPUT, because a gap',
);
p('after which nothing needed fixing is a different story from a gap that hid a bug.');
p();
let v443 = null;
try {
  v443 = await import('adhan-443');
} catch {
  v443 = null;
}
if (!v443) {
  p(
    'Not measured here: `adhan@4.4.3` was not installed in the scratch tree, so',
  );
  p(
    'the output comparison between the pre-gap and post-gap releases is an open',
  );
  p(
    'item. What IS measurable from the published artefacts is the changelog and',
  );
  p('the commits, which are read in the report rather than run.');
} else {
  p(
    'Every preset, every prayer, 365 days, 9 cities, `adhan@4.4.3` (2022-05-14)',
  );
  p('against `adhan@4.4.6` (2026-08-31). All **measured**.');
  p();
  p('| city | comparisons | days differing on any prayer | worst (min) |');
  p('|---|---|---|---|');
  let grand = 0;
  let grandDiff = 0;
  for (const [name, lat, lon] of GRID) {
    let n = 0;
    let diff = 0;
    let worst = 0;
    for (const preset of ['MuslimWorldLeague', 'Egyptian', 'Karachi', 'NorthAmerica', 'MoonsightingCommittee', 'UmmAlQura', 'Turkey']) {
      for (const [y, m, d] of DAYS) {
        const a = adhanDay(preset, lat, lon, y, m, d);
        const params = v443.CalculationMethod[preset]();
        const b = new v443.PrayerTimes(
          new v443.Coordinates(lat, lon),
          new Date(Date.UTC(y, m - 1, d)),
          params,
        );
        for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
          const av = mins(a[k]);
          const bv =
            b[k] && !Number.isNaN(b[k].getTime())
              ? Math.round(b[k].getTime() / 60000)
              : null;
          if (av === null && bv === null) continue;
          n += 1;
          if (av === null || bv === null || av !== bv) {
            diff += 1;
            if (av !== null && bv !== null)
              worst = Math.max(worst, Math.abs(av - bv));
          }
        }
      }
    }
    grand += n;
    grandDiff += diff;
    p(`| ${name} | ${n} | ${diff} | ${worst} |`);
  }
  p();
  p(
    `**${grandDiff} of ${grand} comparisons differ between the last pre-gap release and the current one.**`,
  );
}
p();

// ------------------------------- charge 5: praytime as the replacement

p('## Charge 5: is `praytime@3.2.0` actually the better engine');
p();
p(
  'The Asr tables in Charge 1 answer the physics half. The remaining question is',
);
p(
  'what switching costs. Measured here: the whole-card delta between the two',
);
p(
  'libraries with every preset, rounding rule and high-latitude rule matched, so',
);
p('nothing but the engine differs.');
p();
p('| city | lat | fajr | sunrise | dhuhr | asr | maghrib | isha |');
p('|---|---|---|---|---|---|---|---|');
for (const [name, lat, lon] of GRID) {
  const cells = [];
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const deltas = [];
    for (const [y, m, d] of DAYS) {
      const t = adhanDay('MuslimWorldLeague', lat, lon, y, m, d, {
        zeroAdjustments: true,
        highLatitudeRule: adhan.HighLatitudeRule.SeventhOfTheNight,
      });
      const a = mins(t[k]);
      const q = new PrayTime('MWL');
      q.location([lat, lon]).utcOffset(0).format('x');
      q.adjust({ dhuhr: '0 min', maghrib: '0 min', highLats: 'OneSeventh' });
      q.round('nearest');
      const raw = q.times([y, m, d]);
      const key = k === 'maghrib' ? 'sunset' : k;
      const b = Number.isFinite(raw[key]) ? Math.round(raw[key] / 60000) : null;
      if (a === null || b === null) continue;
      deltas.push(a - b);
    }
    const s = stats(deltas);
    cells.push(
      s ? `${deltas.filter((x) => x === 0).length}/${s.n} eq, max ${s.absMax}` : 'n/a',
    );
  }
  p(`| ${name} | ${lat.toFixed(1)} | ${cells.join(' | ')} |`);
}
p();

console.log(out.join('\n'));
