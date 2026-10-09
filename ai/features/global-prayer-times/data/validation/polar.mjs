// R7 Part 3: the polar policy.
//
// R3 measured that adhan returns `Invalid Date` on 69 to 116 days a year at
// Tromso, called that correct behaviour, and said the UI must have an answer.
// This script measures what each `PolarCircleResolution` actually does, with
// one question in front: Dhuhr and Asr are ALWAYS calculable, so a resolution
// that moves them is doing something questionable.
//
// Measurements:
//
//   A. Per-resolution null counts and displacement, whole year, four polar
//      and near-polar cities, plus the amount each resolution moves Dhuhr and
//      Asr, which it has no reason to touch.
//
//   B. How far `AqrabBalad` walks the latitude and how far `AqrabYaum` walks
//      the date, because the size of the substitution is the honest measure of
//      how much fiction each introduces.
//
//   C. Monotonicity. A prayer card must not show Fajr after Sunrise or Isha
//      before Maghrib. Counted per resolution, because a resolution that
//      produces a value but an incoherent ordering is worse than a null.
//
// Run: TZ=UTC node polar.mjs > polar.txt

import {
  adhan,
  adhanDay,
  fmt,
  mins,
  riseSet,
  stats,
  yearDays,
} from './lib.mjs';

const out = [];
const p = (s = '') => out.push(s);
const YEAR = 2026;
const DAYS = yearDays(YEAR);

const POLAR = [
  { name: 'Tromso', lat: 69.6492, lon: 18.9553 },
  { name: 'Reykjavik', lat: 64.1466, lon: -21.9426 },
  { name: 'Murmansk', lat: 68.9585, lon: 33.0827 },
  { name: 'Longyearbyen', lat: 78.2232, lon: 15.6469 },
  { name: 'Utqiagvik', lat: 71.2906, lon: -156.7887 },
  { name: 'Anchorage', lat: 61.2181, lon: -149.9003 },
];

const RESOLUTIONS = [
  adhan.PolarCircleResolution.Unresolved,
  adhan.PolarCircleResolution.AqrabBalad,
  adhan.PolarCircleResolution.AqrabYaum,
];

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

p('# R7 Part 3: the polar policy');
p();
p('## A. What each `PolarCircleResolution` produces across a whole year');
p();
p(
  'Method `MuslimWorldLeague`, `highLatitudeRule` at its default',
);
p(
  '`MiddleOfTheNight`, `adhan@4.4.6`. Null count is days on which the value is',
);
p(
  '`Invalid Date`. Displacement is the resolution\'s value minus the',
);
p(
  '`Unresolved` value on days where BOTH are defined, so it isolates what the',
);
p('resolution changes about a day it did not need to touch. All **measured**.');
p();

for (const city of POLAR) {
  p(`### ${city.name} (${city.lat.toFixed(2)}N)`);
  p();

  // Baseline for displacement.
  const base = new Map();
  for (const [y, m, d] of DAYS) {
    const t = adhanDay('MuslimWorldLeague', city.lat, city.lon, y, m, d, {
      polarCircleResolution: adhan.PolarCircleResolution.Unresolved,
    });
    base.set(
      `${y}-${m}-${d}`,
      Object.fromEntries(PRAYERS.map((k) => [k, mins(t[k])])),
    );
  }

  p('| resolution | ' + PRAYERS.map((k) => `${k} nulls`).join(' | ') + ' |');
  p('|---|' + PRAYERS.map(() => '---').join('|') + '|');
  const displacement = {};
  for (const res of RESOLUTIONS) {
    const nulls = Object.fromEntries(PRAYERS.map((k) => [k, 0]));
    displacement[res] = Object.fromEntries(PRAYERS.map((k) => [k, []]));
    for (const [y, m, d] of DAYS) {
      const t = adhanDay('MuslimWorldLeague', city.lat, city.lon, y, m, d, {
        polarCircleResolution: res,
      });
      const b = base.get(`${y}-${m}-${d}`);
      for (const k of PRAYERS) {
        const v = mins(t[k]);
        if (v === null) nulls[k] += 1;
        else if (b[k] !== null) displacement[res][k].push(v - b[k]);
      }
    }
    p(`| \`${res}\` | ${PRAYERS.map((k) => nulls[k]).join(' | ')} |`);
  }
  p();
  p(
    '| resolution | quantity | days it moved a value that was already defined | mean move (min) | max move (min) |',
  );
  p('|---|---|---|---|---|');
  for (const res of RESOLUTIONS.slice(1)) {
    for (const k of PRAYERS) {
      const arr = displacement[res][k];
      const moved = arr.filter((x) => x !== 0);
      const s = stats(moved);
      p(
        `| \`${res}\` | ${k} | ${moved.length}/${arr.length} | ${s ? fmt(s.mean, 1) : '0.0'} | ${s ? fmt(s.absMax, 0) : '0'} |`,
      );
    }
  }
  p();
}

// -------------------------------- B. how far the substitution actually goes

p('## B. How far each resolution reaches for its substitute');
p();
p(
  '`AqrabBalad` walks latitude toward the equator in 0.5-degree steps until the',
);
p(
  'sun both rises and sets (`PolarCircleResolution.ts`, `LATITUDE_VARIATION_STEP`',
);
p(
  '= 0.5, `UNSAFE_LATITUDE` = 65). `AqrabYaum` walks the date outward from the',
);
p(
  'requested day, up to `Math.ceil(365 / 2)` days. This table measures how far',
);
p('each actually had to go. All **measured**.');
p();
p(
  '| city | days needing a resolution | AqrabBalad max latitude walked (deg) | AqrabYaum max days walked |',
);
p('|---|---|---|---|');
for (const city of POLAR) {
  let needed = 0;
  let maxLat = 0;
  let maxDays = 0;
  for (const [y, m, d] of DAYS) {
    const rs = riseSet(y, m, d, city.lat, city.lon);
    if (rs.rise && rs.set) continue;
    needed += 1;
    // AqrabBalad: replicate the resolver's own walk.
    let lat = Math.abs(city.lat) - 0.5;
    while (lat >= 65) {
      const test = riseSet(y, m, d, Math.sign(city.lat) * lat, city.lon);
      const t = new Date(Date.UTC(y, m - 1, d + 1));
      const next = riseSet(
        t.getUTCFullYear(),
        t.getUTCMonth() + 1,
        t.getUTCDate(),
        Math.sign(city.lat) * lat,
        city.lon,
      );
      if (test.rise && test.set && next.rise) break;
      lat -= 0.5;
    }
    maxLat = Math.max(maxLat, Math.abs(city.lat) - lat);
    // AqrabYaum: walk the date.
    for (let step = 1; step <= 183; step += 1) {
      const a = new Date(Date.UTC(y, m - 1, d + step));
      const b = new Date(Date.UTC(y, m - 1, d - step));
      const ra = riseSet(
        a.getUTCFullYear(),
        a.getUTCMonth() + 1,
        a.getUTCDate(),
        city.lat,
        city.lon,
      );
      const rb = riseSet(
        b.getUTCFullYear(),
        b.getUTCMonth() + 1,
        b.getUTCDate(),
        city.lat,
        city.lon,
      );
      if ((ra.rise && ra.set) || (rb.rise && rb.set)) {
        maxDays = Math.max(maxDays, step);
        break;
      }
    }
  }
  p(
    `| ${city.name} | ${needed} | ${needed ? fmt(maxLat, 1) : 'n/a'} | ${needed ? maxDays : 'n/a'} |`,
  );
}
p();

// ---------------------------------------------- C. does the card stay coherent

p('## C. Does the prayer card stay in order');
p();
p(
  'A card must read Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha in time order. A',
);
p(
  'resolution that returns a value but breaks the order is worse than a null,',
);
p(
  'because nothing downstream can detect it. Counted over 365 days, on days',
);
p('where all six values exist. All **measured**.');
p();
p(
  '| city | resolution | days with all six defined | days out of order | worst inversion (min) |',
);
p('|---|---|---|---|---|');
for (const city of POLAR) {
  for (const res of RESOLUTIONS) {
    let complete = 0;
    let broken = 0;
    let worst = 0;
    for (const [y, m, d] of DAYS) {
      const t = adhanDay('MuslimWorldLeague', city.lat, city.lon, y, m, d, {
        polarCircleResolution: res,
      });
      const v = PRAYERS.map((k) => mins(t[k]));
      if (v.some((x) => x === null)) continue;
      complete += 1;
      let bad = 0;
      for (let i = 1; i < v.length; i += 1) {
        if (v[i] < v[i - 1]) bad = Math.max(bad, v[i - 1] - v[i]);
      }
      if (bad > 0) {
        broken += 1;
        worst = Math.max(worst, bad);
      }
    }
    p(
      `| ${city.name} | \`${res}\` | ${complete} | ${broken} | ${worst || 0} |`,
    );
  }
}
p();

// ------------------------------------------ D. the two solstices, verbatim

p('## D. The two solstices at Tromso, verbatim');
p();
for (const [label, y, m, d] of [
  ['2026-06-21, midnight sun', 2026, 6, 21],
  ['2026-12-21, polar night', 2026, 12, 21],
]) {
  p(`### ${label}`);
  p();
  p('| resolution | ' + PRAYERS.join(' | ') + ' |');
  p('|---|' + PRAYERS.map(() => '---').join('|') + '|');
  for (const res of RESOLUTIONS) {
    const t = adhanDay('MuslimWorldLeague', 69.6492, 18.9553, y, m, d, {
      polarCircleResolution: res,
    });
    const cells = PRAYERS.map((k) => {
      const v = t[k];
      return v && !Number.isNaN(v.getTime())
        ? v.toISOString().slice(11, 16)
        : 'Invalid Date';
    });
    p(`| \`${res}\` | ${cells.join(' | ')} |`);
  }
  p();
}

console.log(out.join('\n'));
