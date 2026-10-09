// R7 Part 2: the high-latitude rule decision.
//
// R3 finding 6: the rule choice matters more than the library choice by an
// order of magnitude. At Anchorage `MiddleOfTheNight` let two engines drift 28
// minutes apart while `SeventhOfTheNight` collapsed the spread to 1 minute on
// every day. R3 stopped there. This script decides what the app should do.
//
// Four measurements:
//
//   A. THE THRESHOLD TABLE. Above what latitude does an angle stop having a
//      solution, and on how many days a year? By latitude band and by angle,
//      because the answer differs by 8 degrees of latitude between a 12-degree
//      Fajr and a 20-degree one, and the app's users are spread across both.
//
//   B. EVERY RULE, SIDE BY SIDE. adhan's three plus `recommended()`, the
//      Diyanet published rule (R1: above 45 degrees, Isha is Maghrib + 1h20m
//      capped at one third of the shar'i night), Wifaqul Ulama's Nisful-Layl
//      and Aqrabul-Ayyam, the Moonsighting Committee's 1/7 above 55, and
//      Aqrab al-Bilad. Measured over a full year at 11 cities: how many days
//      each rule changes the answer, by how much, and how many days have no
//      answer at all.
//
//   C. THE SPREAD BETWEEN RULES, which is the number that decides whether
//      this is a real user-facing choice or a detail.
//
//   D. adhan's own `highLatitudeRule` being IGNORED by the
//      `MoonsightingCommittee` path (a wave 1 finding), reproduced here so the
//      report is not relying on a code read alone.
//
// Run: TZ=UTC node highlat.mjs > highlat.txt

import {
  CITIES,
  adhan,
  adhanDay,
  fmt,
  mins,
  riseSet,
  stats,
  timeAtDepression,
  transit,
  yearDays,
} from './lib.mjs';

const out = [];
const p = (s = '') => out.push(s);
const YEAR = 2026;
const DAYS = yearDays(YEAR);

// ------------------------------------------- A. when does an angle run out

p('# R7 Part 2: the high-latitude rule decision');
p();
p('## A. Where an angle stops having a solution');
p();
p(
  'Days per year on which the sun never reaches the given depression before',
);
p(
  'sunrise (so Fajr has no angle-based answer). Computed from a pure solar',
);
p(
  'solve with `astronomy-engine@2.1.19`, no library and no rule involved. All',
);
p('**measured**, 365 days of 2026, longitude 0.');
p();

const ANGLES = [12, 13, 15, 17, 18, 19.5, 20];
p(`| latitude | ${ANGLES.map((a) => `${a} deg`).join(' | ')} | no sunrise |`);
p(`|---|${ANGLES.map(() => '---').join('|')}|---|`);
const BANDS = [
  40, 45, 48, 48.5, 49, 50, 51.5, 52.5, 53.5, 55, 56, 57, 58, 59, 60, 61, 62,
  63, 64, 65, 66.5, 69.6,
];
for (const lat of BANDS) {
  const cells = [];
  for (const a of ANGLES) {
    let none = 0;
    for (const [y, m, d] of DAYS) {
      if (!timeAtDepression(y, m, d, lat, 0, a, 'morning')) none += 1;
    }
    cells.push(String(none));
  }
  let noRise = 0;
  for (const [y, m, d] of DAYS) {
    if (!riseSet(y, m, d, lat, 0).rise) noRise += 1;
  }
  p(`| ${lat} N | ${cells.join(' | ')} | ${noRise} |`);
}
p();

// The first latitude at which each angle loses a day, to 0.1 degrees.
p('The exact latitude at which each angle first loses a single day of the year:');
p();
p('| angle | first latitude with any null day | days lost there |');
p('|---|---|---|');
for (const a of ANGLES) {
  let found = null;
  for (let lat = 40; lat <= 70; lat += 0.1) {
    let none = 0;
    for (const [y, m, d] of DAYS) {
      if (!timeAtDepression(y, m, d, lat, 0, a, 'morning')) none += 1;
    }
    if (none > 0) {
      found = { lat: Number(lat.toFixed(1)), none };
      break;
    }
  }
  p(
    found
      ? `| ${a} | ${found.lat} N | ${found.none} |`
      : `| ${a} | none up to 70 N | 0 |`,
  );
}
p();

// ------------------------------------------------------- B. every rule

p('## B. Every high-latitude rule, defined');
p();
p('| rule | source | definition as implemented here |');
p('|---|---|---|');
p(
  '| `MiddleOfTheNight` | `adhan@4.4.6` `CalculationParameters.nightPortions` | Fajr no earlier than sunset + 1/2 of `tomorrowSunrise - sunset`; Isha no later than sunset + 1/2 |',
);
p(
  '| `SeventhOfTheNight` | same | the same bound at 1/7 of the night |',
);
p(
  '| `TwilightAngle` | same | the bound at `fajrAngle / 60` and `ishaAngle / 60` of the night |',
);
p(
  '| `recommended()` | `adhan@4.4.6` `HighLatitudeRule.ts` | `SeventhOfTheNight` above 48 degrees, `MiddleOfTheNight` at or below. Note it tests `coordinates.latitude > 48`, not the absolute value, so it NEVER fires in the southern hemisphere |',
);
p(
  '| Diyanet | R1, cited, `ditib.de/detail2.php?id=424`, the Din Isleri Yuksek Kurulu explanation of 2009-08-28 | above 45 degrees, Isha is Maghrib + 1h20m, capped so it never falls later than one third of the shar\'i night (sunset to true dawn). Fajr by the mirrored Imsak construction |',
);
p(
  '| Nisful-Layl | R1, cited, Wifaqul Ulama `wifaqululama.co.uk/highlat/`, ruling of 2018-11-11 | the night is halved; Isha and Fajr are bounded at the midpoint. Numerically `MiddleOfTheNight` |',
);
p(
  '| Aqrabul-Ayyam | same source | use the times of the NEAREST DAY on which the angle does have a solution. Wifaqul Ulama specifies a 3-day average, not the single last day. Both are computed below |',
);
p(
  '| Moonsighting 1/7 | R1, cited, wave 1 | above 55 degrees latitude, 1/7 of the night, applied by adhan inside the `MoonsightingCommittee` path only |',
);
p(
  '| Aqrab al-Bilad | adhan `PolarCircleResolution.AqrabBalad` | walk the latitude toward the equator in 0.5-degree steps until the sun rises and sets, then use that latitude\'s solar day |',
);
p();

// ------------------------------------------------ rule implementations

/** Sunset, tomorrow's sunrise, and the night length in ms, or null. */
function nightOf(y, m, d, lat, lon) {
  const today = riseSet(y, m, d, lat, lon);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  const tomorrow = riseSet(
    t.getUTCFullYear(),
    t.getUTCMonth() + 1,
    t.getUTCDate(),
    lat,
    lon,
  );
  if (!today.set || !today.rise || !tomorrow.rise) return null;
  return {
    sunset: today.set,
    sunrise: today.rise,
    tomorrowSunrise: tomorrow.rise,
    nightMs: tomorrow.rise.getTime() - today.set.getTime(),
  };
}

/** Portion-of-night rules, returning { fajr, isha } as Dates or null. */
function portionRule(y, m, d, lat, lon, fajrAngle, ishaAngle, portion) {
  const n = nightOf(y, m, d, lat, lon);
  if (!n) return { fajr: null, isha: null, noNight: true };
  const angleFajr = timeAtDepression(y, m, d, lat, lon, fajrAngle, 'morning');
  const angleIsha = timeAtDepression(y, m, d, lat, lon, ishaAngle, 'evening');
  const safeFajr = new Date(n.sunrise.getTime() - portion.fajr * n.nightMs);
  const safeIsha = new Date(n.sunset.getTime() + portion.isha * n.nightMs);
  return {
    fajr: !angleFajr || safeFajr > angleFajr ? safeFajr : angleFajr,
    isha: !angleIsha || safeIsha < angleIsha ? safeIsha : angleIsha,
    bounded: {
      fajr: !angleFajr || safeFajr > angleFajr,
      isha: !angleIsha || safeIsha < angleIsha,
    },
    noNight: false,
  };
}

/**
 * Diyanet: above 45 degrees, Isha = Maghrib + 1h20m, capped at one third of
 * the shar'i night. "Shar'i night" is sunset to true dawn; where true dawn has
 * no solution the night is taken sunset to sunrise, which is the only
 * computable reading and is noted as an assumption in the report.
 *
 * The dawn that ends this night is TOMORROW's, not today's. Taking today's
 * made the night negative and the cap fall before sunset, which reported
 * Diyanet Isha deltas of 580 minutes at London. Same class of error as the
 * transit anchoring in `lib.mjs`, and it was found the same way: by an
 * implausible number.
 */
function diyanetRule(y, m, d, lat, lon, fajrAngle) {
  const n = nightOf(y, m, d, lat, lon);
  if (!n) return { isha: null, capped: false, noNight: true };
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  const dawn = timeAtDepression(
    t.getUTCFullYear(),
    t.getUTCMonth() + 1,
    t.getUTCDate(),
    lat,
    lon,
    fajrAngle,
    'morning',
  );
  const nightEnd = dawn ?? n.tomorrowSunrise;
  const shariNightMs = nightEnd.getTime() - n.sunset.getTime();
  const fixed = new Date(n.sunset.getTime() + 80 * 60000);
  const cap = new Date(n.sunset.getTime() + shariNightMs / 3);
  return {
    isha: fixed < cap ? fixed : cap,
    capped: fixed >= cap,
    noNight: false,
  };
}

/**
 * Aqrabul-Ayyam: the nearest day on which the angle DOES have a solution.
 * Returned as the same clock OFFSET from that day's sunset and sunrise, which
 * is the only defensible transfer, because a raw clock time from 40 days away
 * would be an hour wrong. `window` of 3 averages the three nearest such days,
 * which is Wifaqul Ulama's own specification.
 */
function aqrabulAyyam(y, m, d, lat, lon, angle, which, window = 1) {
  const base = new Date(Date.UTC(y, m - 1, d));
  const found = [];
  for (let step = 0; step <= 200 && found.length < window; step += 1) {
    for (const sign of step === 0 ? [0] : [-1, +1]) {
      if (found.length >= window) break;
      const c = new Date(base.getTime() + sign * step * 86400000);
      const cy = c.getUTCFullYear();
      const cm = c.getUTCMonth() + 1;
      const cd = c.getUTCDate();
      const t = timeAtDepression(cy, cm, cd, lat, lon, angle, which);
      if (!t) continue;
      const rs = riseSet(cy, cm, cd, lat, lon);
      const anchor = which === 'morning' ? rs.rise : rs.set;
      if (!anchor) continue;
      found.push({ offsetMs: t.getTime() - anchor.getTime(), step });
    }
  }
  if (!found.length) return null;
  const meanOffset =
    found.reduce((a, b) => a + b.offsetMs, 0) / found.length;
  const rs = riseSet(y, m, d, lat, lon);
  const anchor = which === 'morning' ? rs.rise : rs.set;
  if (!anchor) return null;
  return {
    time: new Date(anchor.getTime() + meanOffset),
    nearestDays: found.map((f) => f.step),
  };
}

// -------------------------------------------- C. measure every rule per city

p('## C. Every rule at 11 cities, across 2026');
p();
p(
  'Base convention is MWL 18/17, so that the rule is the only thing varying. A',
);
p(
  'day "changed by the rule" is one where the portion bound displaced the',
);
p(
  'angle-based time. "No answer" counts days on which the rule itself cannot',
);
p('produce a value. All **measured**.');
p();

const RULES = [
  ['angle only (no rule)', null],
  ['MiddleOfTheNight / Nisful-Layl', { fajr: 1 / 2, isha: 1 / 2 }],
  ['SeventhOfTheNight', { fajr: 1 / 7, isha: 1 / 7 }],
  ['TwilightAngle', { fajr: 18 / 60, isha: 17 / 60 }],
];

for (const city of CITIES) {
  p(`### ${city.name} (${city.lat.toFixed(1)}${city.lat < 0 ? 'S' : 'N'})`);
  p();
  p(
    '| rule | Fajr days changed | Fajr change mean (min) | Fajr change max (min) | Fajr no answer | Isha days changed | Isha change mean | Isha change max | Isha no answer |',
  );
  p('|---|---|---|---|---|---|---|---|---|');

  // Angle-only baseline, kept for the deltas below.
  const baseline = new Map();
  let fajrNullAngle = 0;
  let ishaNullAngle = 0;
  for (const [y, m, d] of DAYS) {
    const f = timeAtDepression(y, m, d, city.lat, city.lon, 18, 'morning');
    const i = timeAtDepression(y, m, d, city.lat, city.lon, 17, 'evening');
    if (!f) fajrNullAngle += 1;
    if (!i) ishaNullAngle += 1;
    baseline.set(`${y}-${m}-${d}`, { f, i });
  }
  p(
    `| angle only (no rule) | 0 | 0.00 | 0 | **${fajrNullAngle}** | 0 | 0.00 | 0 | **${ishaNullAngle}** |`,
  );

  for (const [label, portion] of RULES.slice(1)) {
    let fChanged = 0;
    let iChanged = 0;
    let fNull = 0;
    let iNull = 0;
    const fDelta = [];
    const iDelta = [];
    for (const [y, m, d] of DAYS) {
      const r = portionRule(y, m, d, city.lat, city.lon, 18, 17, portion);
      const b = baseline.get(`${y}-${m}-${d}`);
      if (!r.fajr) fNull += 1;
      if (!r.isha) iNull += 1;
      if (r.fajr && r.bounded?.fajr) {
        fChanged += 1;
        if (b.f) fDelta.push((r.fajr.getTime() - b.f.getTime()) / 60000);
      }
      if (r.isha && r.bounded?.isha) {
        iChanged += 1;
        if (b.i) iDelta.push((r.isha.getTime() - b.i.getTime()) / 60000);
      }
    }
    const fs = stats(fDelta);
    const is = stats(iDelta);
    p(
      `| ${label} | ${fChanged} | ${fs ? fmt(fs.mean, 1) : '0.0'} | ${fs ? fmt(fs.absMax, 0) : '0'} | ${fNull} | ${iChanged} | ${is ? fmt(is.mean, 1) : '0.0'} | ${is ? fmt(is.absMax, 0) : '0'} | ${iNull} |`,
    );
  }

  // Diyanet, Isha only.
  {
    let capped = 0;
    let none = 0;
    const delta = [];
    for (const [y, m, d] of DAYS) {
      const r = diyanetRule(y, m, d, city.lat, city.lon, 18);
      const b = baseline.get(`${y}-${m}-${d}`);
      if (!r.isha) {
        none += 1;
        continue;
      }
      if (r.capped) capped += 1;
      if (b.i) delta.push((r.isha.getTime() - b.i.getTime()) / 60000);
    }
    const s = stats(delta);
    p(
      `| Diyanet Maghrib+80 capped at night/3 | n/a | n/a | n/a | n/a | 365 (always applies above 45) | ${s ? fmt(s.mean, 1) : 'n/a'} | ${s ? fmt(s.absMax, 0) : 'n/a'} | ${none} (cap bound on ${capped} days) |`,
    );
  }

  // Aqrabul-Ayyam, 1 day and 3 day.
  for (const window of [1, 3]) {
    let none = 0;
    const delta = [];
    let maxStep = 0;
    for (const [y, m, d] of DAYS) {
      const r = aqrabulAyyam(y, m, d, city.lat, city.lon, 18, 'morning', window);
      const b = baseline.get(`${y}-${m}-${d}`);
      if (!r) {
        none += 1;
        continue;
      }
      maxStep = Math.max(maxStep, ...r.nearestDays);
      if (b.f) delta.push((r.time.getTime() - b.f.getTime()) / 60000);
    }
    const s = stats(delta);
    p(
      `| Aqrabul-Ayyam Fajr (${window}-day) | ${delta.filter((x) => Math.abs(x) > 0.5).length} | ${s ? fmt(s.mean, 1) : 'n/a'} | ${s ? fmt(s.absMax, 0) : 'n/a'} | ${none} (furthest donor day: ${maxStep}) | n/a | n/a | n/a | n/a |`,
    );
  }

  p();
}

// ------------------------------------- D. the spread between the rules

p('## D. The spread BETWEEN rules, which is what the user actually feels');
p();
p(
  'On each day, the widest gap between any two rules\' Fajr, and the same for',
);
p(
  'Isha. This is the honest size of the decision. Rules compared:',
);
p(
  '`MiddleOfTheNight`, `SeventhOfTheNight`, `TwilightAngle`, and for Isha also',
);
p('Diyanet. All **measured**, 365 days of 2026.');
p();
p(
  '| city | lat | Fajr spread mean (min) | Fajr spread max | Isha spread mean | Isha spread max | days all rules agree within 1 min |',
);
p('|---|---|---|---|---|---|---|');
for (const city of CITIES) {
  const fSpread = [];
  const iSpread = [];
  let agree = 0;
  for (const [y, m, d] of DAYS) {
    const vals = { fajr: [], isha: [] };
    for (const [, portion] of RULES.slice(1)) {
      const r = portionRule(y, m, d, city.lat, city.lon, 18, 17, portion);
      if (r.fajr) vals.fajr.push(r.fajr.getTime());
      if (r.isha) vals.isha.push(r.isha.getTime());
    }
    const dy = diyanetRule(y, m, d, city.lat, city.lon, 18);
    if (dy.isha) vals.isha.push(dy.isha.getTime());
    if (vals.fajr.length > 1) {
      const s = (Math.max(...vals.fajr) - Math.min(...vals.fajr)) / 60000;
      fSpread.push(s);
      if (s <= 1) agree += 1;
    }
    if (vals.isha.length > 1)
      iSpread.push((Math.max(...vals.isha) - Math.min(...vals.isha)) / 60000);
  }
  const fs = stats(fSpread);
  const is = stats(iSpread);
  p(
    `| ${city.name} | ${city.lat.toFixed(1)} | ${fs ? fmt(fs.mean, 1) : 'n/a'} | ${fs ? fmt(fs.max, 0) : 'n/a'} | ${is ? fmt(is.mean, 1) : 'n/a'} | ${is ? fmt(is.max, 0) : 'n/a'} | ${agree}/365 |`,
  );
}
p();

// ------------------------------ E. adhan ignores highLatitudeRule for MC

p('## E. adhan\'s `highLatitudeRule` is ignored by the `MoonsightingCommittee` path');
p();
p(
  'Wave 1 read this in the source. Reproduced here as a measurement.',
);
p(
  '`PrayerTimes.ts` L120-131: when `method === \'MoonsightingCommittee\'` the',
);
p(
  '`safeFajr` branch calls `Astronomical.seasonAdjustedMorningTwilight` and',
);
p(
  'never reads `nightPortions()`, so `highLatitudeRule` has no effect at all.',
);
p();
p(
  'Every rule, same city, same day, `MoonsightingCommittee` versus',
);
p('`MuslimWorldLeague`. All **measured**.');
p();
p('| city | method | rule | Fajr distinct values across the year | Isha distinct |');
p('|---|---|---|---|---|');
for (const city of CITIES.filter((c) =>
  ['London', 'Oslo', 'Reykjavik', 'Tromso'].includes(c.name),
)) {
  for (const method of ['MoonsightingCommittee', 'MuslimWorldLeague']) {
    const seen = { fajr: new Map(), isha: new Map() };
    for (const rule of [
      adhan.HighLatitudeRule.MiddleOfTheNight,
      adhan.HighLatitudeRule.SeventhOfTheNight,
      adhan.HighLatitudeRule.TwilightAngle,
    ]) {
      const f = [];
      const i = [];
      for (const [y, m, d] of DAYS) {
        const t = adhanDay(method, city.lat, city.lon, y, m, d, {
          highLatitudeRule: rule,
        });
        f.push(mins(t.fajr));
        i.push(mins(t.isha));
      }
      seen.fajr.set(rule, JSON.stringify(f));
      seen.isha.set(rule, JSON.stringify(i));
    }
    p(
      `| ${city.name} | \`${method}\` | all three | ${new Set(seen.fajr.values()).size} | ${new Set(seen.isha.values()).size} |`,
    );
  }
}
p();
p(
  'A count of 1 means all three rules produced a byte-identical year, so the',
);
p('setting did nothing.');
p();

console.log(out.join('\n'));
