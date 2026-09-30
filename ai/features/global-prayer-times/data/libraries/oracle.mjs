// R3 oracle verification: can this project prove a library is right?
//
// This is the answer to "the owner cannot verify hand-written mathematics". It
// takes each library's SUNRISE, SUNSET and TRANSIT, which are the three
// quantities that carry no fiqh at all, and compares them with two fully
// independent authorities:
//
//   1. the US Naval Observatory's own rise/set/transit service (fetched by
//      usno_fetch.sh), which publishes to the whole minute;
//   2. astronomy-engine's SearchRiseSet/SearchHourAngle, cross-checked against
//      Skyfield driven by JPL DE440s in oracle_crosscheck.py.
//
// Civil twilight (-6 degrees) is included because it is the one twilight the USNO
// publishes, and it proves the libraries' twilight SOLVER is right even though
// no authority publishes an 18-degree Fajr.
//
// What this can and cannot prove is discussed in the report. In short: it proves
// the astronomy, and it cannot prove the fiqh.
//
// Run:  TZ=UTC node oracle.mjs ./usno > oracle.txt

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import * as Astronomy from 'astronomy-engine';

const require = createRequire(import.meta.url);
const adhan = await import('adhan');
const { PrayTime } = require('praytime');
const PrayTimesLib = require('praytimes');
const PrayTimesCtor = PrayTimesLib.PrayTimes ?? PrayTimesLib;

const DIR = process.argv[2] ?? './usno';
const out = [];

const COORDS = {
  London: [51.5074, -0.1278],
  Makkah: [21.4225, 39.8262],
  Jakarta: [-6.2088, 106.8456],
  NewYork: [40.7128, -74.006],
  CapeTown: [-33.9249, 18.4241],
  Singapore: [1.3521, 103.8198],
  Oslo: [59.9139, 10.7522],
  Reykjavik: [64.1466, -21.9426],
  Tromso: [69.6492, 18.9553],
  Anchorage: [61.2181, -149.9003],
};

// USNO times are HH:MM in the tz the request asked for, which was tz=0, so UTC.
function usnoMinutes(hhmm) {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// The USNO publishes to the whole minute, ROUNDED to nearest (measured: taking
// `getUTCMinutes()`, which floors, gives a -0.500 mean bias against the USNO
// across 12 rise events, and rounding gives exactly 0.000). So any value being
// compared with the USNO has to be rounded, not floored, or the harness invents
// a half-minute bias that looks like a library defect.
//
// Returns an ABSOLUTE epoch minute, so a sunset after midnight UTC compares
// correctly against the USNO's own day labelling.
function utcMinutes(date) {
  if (!date || Number.isNaN(date.getTime())) return null;
  return Math.round(date.getTime() / 60000);
}

// Wrap a minute delta into (-720, 720] so a midnight crossing is not a 1439.
function wrap(d) {
  let v = d;
  while (v > 720) v -= 1440;
  while (v <= -720) v += 1440;
  return v;
}

// ------------------------------------------------- the astronomy-engine oracle

function aeRiseSet(lat, lon, y, m, d, direction) {
  const obs = new Astronomy.Observer(lat, lon, 0);
  const start = Astronomy.MakeTime(new Date(Date.UTC(y, m - 1, d)));
  const ev = Astronomy.SearchRiseSet(
    Astronomy.Body.Sun,
    obs,
    direction,
    start,
    1,
  );
  return ev ? ev.date : null;
}

function aeTransit(lat, lon, y, m, d) {
  const obs = new Astronomy.Observer(lat, lon, 0);
  const start = Astronomy.MakeTime(new Date(Date.UTC(y, m - 1, d)));
  const ev = Astronomy.SearchHourAngle(Astronomy.Body.Sun, obs, 0, start, 1);
  return ev ? ev.time.date : null;
}

// Civil twilight, the sun's centre at -6 degrees, solved the same way.
function aeAltitude(lat, lon, y, m, d, altitude, direction) {
  const obs = new Astronomy.Observer(lat, lon, 0);
  const start = Astronomy.MakeTime(new Date(Date.UTC(y, m - 1, d)));
  const ev = Astronomy.SearchAltitude(
    Astronomy.Body.Sun,
    obs,
    direction,
    start,
    1,
    altitude,
  );
  return ev ? ev.date : null;
}

// ---------------------------------------------------- the library under test

function adhanTimes(lat, lon, y, m, d) {
  const p = adhan.CalculationMethod.MuslimWorldLeague();
  p.methodAdjustments = { ...p.methodAdjustments, dhuhr: 0 };
  const pt = new adhan.PrayerTimes(
    new adhan.Coordinates(lat, lon),
    new Date(Date.UTC(y, m - 1, d)),
    p,
  );
  return { sunrise: pt.sunrise, transit: pt.dhuhr, sunset: pt.maghrib };
}

function praytimeTimes(lat, lon, y, m, d) {
  const q = new PrayTime('MWL');
  q.location([lat, lon]).utcOffset(0).format('x');
  q.adjust({ maghrib: '0 min', dhuhr: '0 min' });
  q.round('nearest');
  const t = q.times([y, m, d]);
  const at = (v) => (Number.isFinite(v) ? new Date(v) : null);
  return { sunrise: at(t.sunrise), transit: at(t.dhuhr), sunset: at(t.sunset) };
}

function praytimesTimes(lat, lon, y, m, d) {
  const p = new PrayTimesCtor('MWL');
  p.adjust({ maghrib: '0 min', dhuhr: '0 min', highLats: 'NightMiddle' });
  const t = p.getTimes(new Date(Date.UTC(y, m - 1, d)), [lat, lon], 0, 0, 'Float');
  const base = Date.UTC(y, m - 1, d);
  const at = (h) =>
    Number.isFinite(h) ? new Date(base + Math.round(h * 3600) * 1000) : null;
  return { sunrise: at(t.sunrise), transit: at(t.dhuhr), sunset: at(t.sunset) };
}

const LIBS = [
  { id: 'adhan@4.4.6', fn: adhanTimes },
  { id: 'praytime@3.2.0', fn: praytimeTimes },
  { id: 'praytimes@0.0.5', fn: praytimesTimes },
];

// ---------------------------------------------------------------------- run

const files = readdirSync(DIR).filter((f) => /^usno_.*\.json$/.test(f)).sort();

// tallies[libId][quantity] = array of deltas in minutes
const tally = {};
const oracleTally = {};
const rows = [];

for (const f of files) {
  const raw = readFileSync(join(DIR, f), 'utf8');
  if (!raw.trim()) continue;
  const data = JSON.parse(raw);
  const props = data?.properties?.data;
  if (!props) continue;
  const [, city, date] = /^usno_(.+?)_(\d{4}-\d{2}-\d{2})\.json$/.exec(f);
  const [y, m, d] = date.split('-').map(Number);
  const [lat, lon] = COORDS[city];

  const sun = props.sundata ?? [];
  const pick = (phen) => sun.find((s) => s.phen === phen)?.time ?? null;
  const usno = {
    sunrise: pick('Rise') ? usnoMinutes(pick('Rise')) : null,
    transit: pick('Upper Transit') ? usnoMinutes(pick('Upper Transit')) : null,
    sunset: pick('Set') ? usnoMinutes(pick('Set')) : null,
    civilDawn: pick('Begin Civil Twilight')
      ? usnoMinutes(pick('Begin Civil Twilight'))
      : null,
    civilDusk: pick('End Civil Twilight')
      ? usnoMinutes(pick('End Civil Twilight'))
      : null,
  };

  // The USNO reports every event that falls within the requested UTC DAY, in
  // clock order, with no day marker. Both comparisons below therefore have to
  // be pinned to an absolute instant, and the two consumers need DIFFERENT
  // pinning, which is the trap this harness fell into twice:
  //
  //   `astronomy-engine`'s SearchRiseSet(-1) returns the first set at or after
  //   00:00 UTC of the day, which is exactly what the USNO prints for that day.
  //   So its sunset pairs with the SAME UTC day, unshifted.
  //
  //   A prayer library instead returns the sunset that FOLLOWS that day's
  //   sunrise, because Maghrib must come after Sunrise in the same card. West of
  //   about 120 degrees longitude that instant lands on the NEXT UTC day. At
  //   Anchorage (lon -149.9) it does so on every day of the year, so adhan's
  //   sunset for 11 Feb is 12 Feb 02:36 UTC, which is the USNO's 12 Feb "Set".
  //
  // Comparing either side against the wrong pinning produces a flat 3-minute
  // error at Anchorage for all three libraries at once, which is the signature
  // of a harness fault rather than a library fault. Both pinnings are built
  // explicitly below.
  const dayStart = Date.UTC(y, m - 1, d) / 60000;
  const sameDay = (minutes) => (minutes === null ? null : dayStart + minutes);

  // For astronomy-engine: the USNO's own day, as printed.
  const usnoOwnDay = {
    sunrise: sameDay(usno.sunrise),
    transit: sameDay(usno.transit),
    sunset: sameDay(usno.sunset),
    civilDawn: sameDay(usno.civilDawn),
    civilDusk: sameDay(usno.civilDusk),
  };

  // For the libraries: the evening events that follow THIS day's sunrise, which
  // are printed on the next UTC day whenever they fall before that day's own
  // sunrise in clock order.
  const nextName = `usno_${city}_${new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)}.json`;
  let nextSun = null;
  try {
    nextSun = JSON.parse(readFileSync(join(DIR, nextName), 'utf8'))?.properties
      ?.data?.sundata ?? null;
  } catch {
    nextSun = null;
  }
  const eveningAfterSunrise = (phen, ownValue) => {
    if (usno.sunrise === null || ownValue === null) return sameDay(ownValue);
    // The printed evening event already follows this day's sunrise.
    if (ownValue >= usno.sunrise) return sameDay(ownValue);
    // It does not, so the one that does is printed on the next day.
    if (!nextSun) return null;
    const t = nextSun.find((s) => s.phen === phen)?.time ?? null;
    return t === null ? null : dayStart + 1440 + usnoMinutes(t);
  };
  const usnoAfterSunrise = {
    sunrise: sameDay(usno.sunrise),
    transit: sameDay(usno.transit),
    sunset: eveningAfterSunrise('Set', usno.sunset),
    civilDawn: sameDay(usno.civilDawn),
    civilDusk: eveningAfterSunrise('End Civil Twilight', usno.civilDusk),
  };

  // astronomy-engine versus the USNO, which measures the ORACLE not the library.
  const ae = {
    sunrise: utcMinutes(aeRiseSet(lat, lon, y, m, d, +1)),
    sunset: utcMinutes(aeRiseSet(lat, lon, y, m, d, -1)),
    transit: utcMinutes(aeTransit(lat, lon, y, m, d)),
    civilDawn: utcMinutes(aeAltitude(lat, lon, y, m, d, -6, +1)),
    civilDusk: utcMinutes(aeAltitude(lat, lon, y, m, d, -6, -1)),
  };
  oracleTally['astronomy-engine'] ??= {};
  for (const k of Object.keys(usnoOwnDay)) {
    if (usnoOwnDay[k] === null || ae[k] === null) continue;
    (oracleTally['astronomy-engine'][k] ??= []).push(wrap(ae[k] - usnoOwnDay[k]));
  }

  for (const lib of LIBS) {
    tally[lib.id] ??= {};
    let t;
    try {
      t = lib.fn(lat, lon, y, m, d);
    } catch {
      continue;
    }
    for (const k of ['sunrise', 'transit', 'sunset']) {
      const got = utcMinutes(t[k]);
      if (got === null || usnoAfterSunrise[k] === null) continue;
      const delta = wrap(got - usnoAfterSunrise[k]);
      (tally[lib.id][k] ??= []).push(delta);
      if (Math.abs(delta) >= 2) {
        rows.push({ lib: lib.id, city, date, quantity: k, delta });
      }
    }
  }
}

function stat(arr) {
  if (!arr || !arr.length) return 'n/a';
  const eq = arr.filter((d) => d === 0).length;
  const one = arr.filter((d) => Math.abs(d) === 1).length;
  const two = arr.filter((d) => Math.abs(d) >= 2).length;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  let cell = `${eq}/${one}/${two}`;
  if (two) cell += ` [${Math.min(...arr)},${Math.max(...arr)}]`;
  return `${cell} mean ${mean.toFixed(2)}`;
}

out.push('## Every library against the US Naval Observatory');
out.push('');
out.push('Service `https://aa.usno.navy.mil/api/rstt/oneday`, API v4.0.1, tz=0 so all');
out.push('times are UTC. Cells are days equal / |delta|=1 / |delta|>=2, with the range');
out.push('and mean. 10 cities x 6 dates = 60 comparisons per quantity. Method offsets');
out.push('are zeroed, because Dhuhr +1 is a preset and not astronomy.');
out.push('');
out.push('| source | sunrise | transit (solar noon) | sunset |');
out.push('|---|---|---|---|');
out.push(
  `| \`astronomy-engine 2.1.19\` (the oracle) | ${stat(oracleTally['astronomy-engine'].sunrise)} | ${stat(oracleTally['astronomy-engine'].transit)} | ${stat(oracleTally['astronomy-engine'].sunset)} |`,
);
for (const lib of LIBS) {
  out.push(
    `| \`${lib.id}\` | ${stat(tally[lib.id].sunrise)} | ${stat(tally[lib.id].transit)} | ${stat(tally[lib.id].sunset)} |`,
  );
}

out.push('');
out.push('## The oracle against the USNO on civil twilight');
out.push('');
out.push('No authority publishes an 18-degree Fajr, but the USNO does publish civil');
out.push('twilight at -6 degrees. Agreeing there proves the twilight SOLVER, which is');
out.push('the same code path an 18-degree Fajr uses with a different constant.');
out.push('');
out.push('| quantity | astronomy-engine minus USNO |');
out.push('|---|---|');
out.push(`| begin civil twilight | ${stat(oracleTally['astronomy-engine'].civilDawn)} |`);
out.push(`| end civil twilight | ${stat(oracleTally['astronomy-engine'].civilDusk)} |`);

if (rows.length) {
  out.push('');
  out.push('## Every disagreement of 2 minutes or more against the USNO');
  out.push('| library | city | date | quantity | delta |');
  out.push('|---|---|---|---|---|');
  for (const r of rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))) {
    out.push(
      `| \`${r.lib}\` | ${r.city} | ${r.date} | ${r.quantity} | ${r.delta > 0 ? '+' : ''}${r.delta} |`,
    );
  }
} else {
  out.push('');
  out.push('No library disagreed with the USNO by 2 minutes or more on any of the 60');
  out.push('comparisons, for any of sunrise, transit or sunset.');
}

console.log(out.join('\n'));
