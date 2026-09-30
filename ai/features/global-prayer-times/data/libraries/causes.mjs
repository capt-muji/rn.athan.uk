// R3 cause isolation.
//
// `compare.mjs` counts the deltas. This script explains them, by removing one
// candidate cause at a time and re-counting. Each block prints the delta profile
// before and after the cause is neutralised, so the reader can see exactly how
// much of a disagreement each cause owns.
//
// Run:  TZ=UTC node causes.mjs > causes.txt

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const CITIES = JSON.parse(
  readFileSync(new URL('./cities.json', import.meta.url), 'utf8'),
);
const adhan = await import('adhan');
const { PrayTime } = require('praytime');
const PrayTimesLib = require('praytimes');
const PrayTimesCtor = PrayTimesLib.PrayTimes ?? PrayTimesLib;

const MIN = 60000;
const out = [];

function days(year) {
  const r = [];
  const end = Date.UTC(year + 1, 0, 1);
  for (let t = Date.UTC(year, 0, 1); t < end; t += 86400000) {
    const d = new Date(t);
    r.push([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]);
  }
  return r;
}
const DAYS = days(2026);

const offCache = new Map();
function off(tz, y, m, d) {
  const k = `${tz}|${y}-${m}-${d}`;
  if (offCache.has(k)) return offCache.get(k);
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'longOffset',
  })
    .formatToParts(new Date(Date.UTC(y, m - 1, d, 12)))
    .find((p) => p.type === 'timeZoneName').value;
  const mt = /GMT([+-])(\d{2}):(\d{2})/.exec(part);
  const v = mt
    ? (mt[1] === '-' ? -1 : 1) * (Number(mt[2]) * 60 + Number(mt[3]))
    : 0;
  offCache.set(k, v);
  return v;
}

// Profile a delta series: how many days at each |delta|, and the extremes.
function profile(deltas) {
  const hist = new Map();
  let min = Infinity,
    max = -Infinity,
    n = 0,
    sum = 0;
  for (const d of deltas) {
    if (d === null) continue;
    hist.set(d, (hist.get(d) ?? 0) + 1);
    if (d < min) min = d;
    if (d > max) max = d;
    sum += d;
    n++;
  }
  const keys = [...hist.keys()].sort((a, b) => a - b);
  const shown = keys
    .slice(0, 12)
    .map((k) => `${k > 0 ? '+' : ''}${k}:${hist.get(k)}`)
    .join(' ');
  return {
    n,
    mean: n ? sum / n : 0,
    min,
    max,
    distinct: keys.length,
    shown,
  };
}

function line(label, p) {
  out.push(
    `| ${label} | ${p.n} | ${p.mean.toFixed(3)} | ${p.min} | ${p.max} | ${p.shown} |`,
  );
}

// ------------------------------------------------- cause 1: Dhuhr presets
//
// adhan's MuslimWorldLeague sets `methodAdjustments.dhuhr = 1`
// (CalculationMethod.ts L8). praytime 3.2.0's settings default to
// `dhuhr: '0 min'` (praytime.js L49). That alone is a systematic one minute.

out.push('## Cause 1: Dhuhr method offsets, not astronomy');
out.push('');
out.push('`adhan` CalculationMethod.ts L8 sets `methodAdjustments.dhuhr = 1` for MWL.');
out.push('`praytime` praytime.js L49 defaults `dhuhr: "0 min"`. Removing adhan\'s +1');
out.push('collapses the Dhuhr disagreement.');
out.push('');
out.push('| series | n | mean | min | max | histogram |');
out.push('|---|---|---|---|---|---|');

for (const cityName of ['London', 'Makkah', 'Tromso']) {
  const city = CITIES.find((c) => c.name === cityName);
  const asShipped = [];
  const zeroed = [];
  for (const [y, m, d] of DAYS) {
    const coords = new adhan.Coordinates(city.lat, city.lon);
    const p1 = adhan.CalculationMethod.MuslimWorldLeague();
    const pt1 = new adhan.PrayerTimes(coords, new Date(Date.UTC(y, m - 1, d)), p1);
    const p2 = adhan.CalculationMethod.MuslimWorldLeague();
    p2.methodAdjustments = { ...p2.methodAdjustments, dhuhr: 0 };
    const pt2 = new adhan.PrayerTimes(coords, new Date(Date.UTC(y, m - 1, d)), p2);

    const q = new PrayTime('MWL');
    q.location([city.lat, city.lon]);
    q.utcOffset(off(city.tz, y, m, d));
    q.format('x').round('nearest');
    const t = q.times([y, m, d]);

    const ref = Math.round(t.dhuhr / MIN);
    asShipped.push(ref - Math.round(pt1.dhuhr.getTime() / MIN));
    zeroed.push(ref - Math.round(pt2.dhuhr.getTime() / MIN));
  }
  line(`${cityName} Dhuhr, adhan as shipped`, profile(asShipped));
  line(`${cityName} Dhuhr, adhan dhuhr adj = 0`, profile(zeroed));
}

// ------------------------------------------------ cause 2: Maghrib presets
//
// praytime 3.2.0's `methods.defaults` carries `maghrib: '1 min'`
// (praytime.js L45) and its MWL entry does NOT override it (L35), so MWL
// Maghrib is sunset + 1. praytimes 0.0.5's MWL sets `maghrib: '0 min'`
// explicitly (praytimes.js L62). adhan's Maghrib is sunset exactly.

out.push('');
out.push('## Cause 2: Maghrib preset drift between the two PrayTimes lineages');
out.push('');
out.push('`praytime@3.2.0` praytime.js L45 defaults `maghrib: "1 min"`, and its MWL');
out.push('entry at L35 does not override it, so MWL Maghrib is sunset + 1 minute.');
out.push('`praytimes@0.0.5` praytimes.js L62 sets `maghrib: "0 min"` for MWL. `adhan`');
out.push('PrayerTimes.ts L183-191 uses sunset with no offset. This is the whole');
out.push('difference between the two PrayTimes columns in the Maghrib table.');
out.push('');
out.push('| series | n | mean | min | max | histogram |');
out.push('|---|---|---|---|---|---|');

for (const cityName of ['London', 'Makkah']) {
  const city = CITIES.find((c) => c.name === cityName);
  const shipped = [];
  const zeroed = [];
  const old = [];
  for (const [y, m, d] of DAYS) {
    const coords = new adhan.Coordinates(city.lat, city.lon);
    const pa = new adhan.PrayerTimes(
      coords,
      new Date(Date.UTC(y, m - 1, d)),
      adhan.CalculationMethod.MuslimWorldLeague(),
    );
    const ref = Math.round(pa.maghrib.getTime() / MIN);

    const q = new PrayTime('MWL');
    q.location([city.lat, city.lon]);
    q.utcOffset(off(city.tz, y, m, d));
    q.format('x').round('nearest');
    shipped.push(Math.round(q.times([y, m, d]).maghrib / MIN) - ref);

    const q2 = new PrayTime('MWL');
    q2.location([city.lat, city.lon]);
    q2.adjust({ maghrib: '0 min' });
    q2.utcOffset(off(city.tz, y, m, d));
    q2.format('x').round('nearest');
    zeroed.push(Math.round(q2.times([y, m, d]).maghrib / MIN) - ref);

    const p = new PrayTimesCtor('MWL');
    const o = off(city.tz, y, m, d) / 60;
    const t = p.getTimes(new Date(y, m - 1, d), [city.lat, city.lon], o, 0, 'Float');
    const base = Date.UTC(y, m - 1, d) - o * 60 * MIN;
    old.push(Math.round((base + t.maghrib * 60 * MIN) / MIN) - ref);
  }
  line(`${cityName} Maghrib, praytime@3.2.0 as shipped`, profile(shipped));
  line(`${cityName} Maghrib, praytime@3.2.0 maghrib="0 min"`, profile(zeroed));
  line(`${cityName} Maghrib, praytimes@0.0.5 as shipped`, profile(old));
}

// -------------------------------------------- cause 3: the Asr declination
//
// adhan's Asr uses the declination at solar NOON and solves the hour angle once
// (SolarTime.ts L93-99, which carries a `// TODO source shadow angle calculation`
// comment). The PrayTimes lineage evaluates the declination AT the Asr time and
// iterates (praytime.js L169-170 `iterations`, L279-284 `asrAngle`). At high
// latitude in winter the declination moves enough between noon and Asr for the
// two to part.

out.push('');
out.push('## Cause 3: Asr declination epoch, noon versus at-time');
out.push('');
out.push('`adhan` SolarTime.ts L93-99 computes the Asr shadow angle from the NOON');
out.push('declination and solves the hour angle once. The comment on that function is');
out.push('`// TODO source shadow angle calculation`. `praytime` praytime.js L279-284');
out.push('evaluates the declination at the Asr time itself, and L169-170 re-runs the');
out.push('whole pass `iterations` times. Raising `iterations` moves praytime further');
out.push('from adhan, which is the proof that this is the mechanism and not rounding.');
out.push('');
out.push('| series | n | mean | min | max | histogram |');
out.push('|---|---|---|---|---|---|');

for (const cityName of ['London', 'Oslo', 'Reykjavik']) {
  const city = CITIES.find((c) => c.name === cityName);
  for (const iters of [1, 3]) {
    const deltas = [];
    for (const [y, m, d] of DAYS) {
      const coords = new adhan.Coordinates(city.lat, city.lon);
      const pa = new adhan.PrayerTimes(
        coords,
        new Date(Date.UTC(y, m - 1, d)),
        adhan.CalculationMethod.MuslimWorldLeague(),
      );
      const ref = Math.round(pa.asr.getTime() / MIN);
      const q = new PrayTime('MWL');
      q.location([city.lat, city.lon]);
      q.adjust({ iterations: iters });
      q.utcOffset(off(city.tz, y, m, d));
      q.format('x').round('nearest');
      const v = q.times([y, m, d]).asr;
      deltas.push(Number.isFinite(v) ? Math.round(v / MIN) - ref : null);
    }
    line(`${cityName} Asr, praytime iterations=${iters}`, profile(deltas));
  }
}

// --------------------------------------- cause 4: the high-latitude rule
//
// adhan's HighLatitudeRule and praytime's highLats are the same three rules by
// name, but adhan applies the portion to `tomorrowSunrise - sunset`
// (PrayerTimes.ts L109) while praytime uses `24 + sunrise - sunset` of the SAME
// day (praytime.js L296). At high latitude those two nights differ.

out.push('');
out.push('## Cause 4: what "the night" means in the high-latitude rule');
out.push('');
out.push('`adhan` PrayerTimes.ts L109 defines the night as `tomorrowSunrise - sunset`,');
out.push('so it spans the real night. `praytime` praytime.js L296 uses');
out.push('`24 + times.sunrise - times.sunset`, both from the SAME day, which is a');
out.push('different interval whenever the day length changes. Below is the Fajr delta');
out.push('with each of the three rules, which shows the rule choice dominating.');
out.push('');
out.push('| series | n | mean | min | max | histogram |');
out.push('|---|---|---|---|---|---|');

const RULE_PAIRS = [
  ['MiddleOfTheNight', 'NightMiddle'],
  ['SeventhOfTheNight', 'OneSeventh'],
  ['TwilightAngle', 'AngleBased'],
];

for (const cityName of ['London', 'Oslo', 'Reykjavik', 'Anchorage']) {
  const city = CITIES.find((c) => c.name === cityName);
  for (const [adhanRule, ptRule] of RULE_PAIRS) {
    const deltas = [];
    for (const [y, m, d] of DAYS) {
      const coords = new adhan.Coordinates(city.lat, city.lon);
      const params = adhan.CalculationMethod.MuslimWorldLeague();
      params.highLatitudeRule = adhan.HighLatitudeRule[adhanRule];
      const pa = new adhan.PrayerTimes(
        coords,
        new Date(Date.UTC(y, m - 1, d)),
        params,
      );
      const ref = pa.fajr && !Number.isNaN(pa.fajr.getTime())
        ? Math.round(pa.fajr.getTime() / MIN)
        : null;
      const q = new PrayTime('MWL');
      q.location([city.lat, city.lon]);
      q.adjust({ highLats: ptRule });
      q.utcOffset(off(city.tz, y, m, d));
      q.format('x').round('nearest');
      const v = q.times([y, m, d]).fajr;
      deltas.push(
        ref !== null && Number.isFinite(v) ? Math.round(v / MIN) - ref : null,
      );
    }
    line(`${cityName} Fajr, rule ${adhanRule}/${ptRule}`, profile(deltas));
  }
}

// ------------------- cause 5: the residual, in SECONDS, with everything matched
//
// With the presets zeroed, both rounding rules off, and the same horizon event,
// what is left is the disagreement between the two solar engines and nothing
// else. Reported in seconds, because in minutes it is invisible.
//
// Both use a fixed depression for the horizon, and not quite the same one:
// adhan SolarTime.ts L35 uses `-50.0 / 60.0`, exactly -50 arcminutes.
// praytime praytime.js L182 uses `const horizon = 0.833`.
// The gap is 0.0003 degrees, which the sensitivity in astronomy.mjs turns into
// 0.08 s at Makkah and 0.21 s at Tromso, so it is NOT the mechanism here. The
// residual below tracks the declination error instead, which is why it grows
// with latitude exactly as the arcsecond sensitivity table predicts.

out.push('');
out.push('## Cause 5: the residual in SECONDS once every rule is matched');
out.push('');
out.push('adhan is run with `Rounding.None` and `dhuhr` adjustment 0, praytime with');
out.push('`round("none")` and `maghrib: "0 min"`. What remains is the two solar');
out.push('engines disagreeing and nothing else. Dhuhr is the cleanest probe because');
out.push('it depends on the equation of time only, with no latitude amplification.');
out.push('');
out.push('| city | prayer | n | mean (s) | min (s) | max (s) |');
out.push('|---|---|---|---|---|---|');

for (const cityName of ['Makkah', 'London', 'Oslo', 'Reykjavik']) {
  const city = CITIES.find((c) => c.name === cityName);
  for (const prayer of ['dhuhr', 'sunrise', 'maghrib']) {
    const seconds = [];
    for (const [y, m, d] of DAYS) {
      const params = adhan.CalculationMethod.MuslimWorldLeague();
      params.rounding = adhan.Rounding.None;
      params.methodAdjustments = { ...params.methodAdjustments, dhuhr: 0 };
      const pa = new adhan.PrayerTimes(
        new adhan.Coordinates(city.lat, city.lon),
        new Date(Date.UTC(y, m - 1, d)),
        params,
      );
      if (Number.isNaN(pa[prayer].getTime())) continue;
      const q = new PrayTime('MWL');
      q.location([city.lat, city.lon]);
      q.adjust({ maghrib: '0 min' });
      q.utcOffset(off(city.tz, y, m, d));
      q.format('x').round('none');
      const v = q.times([y, m, d])[prayer];
      if (!Number.isFinite(v)) continue;
      seconds.push((v - pa[prayer].getTime()) / 1000);
    }
    const mean = seconds.reduce((a, b) => a + b, 0) / seconds.length;
    out.push(
      `| ${cityName} | ${prayer} | ${seconds.length} | ${mean.toFixed(2)} | ${Math.min(...seconds).toFixed(1)} | ${Math.max(...seconds).toFixed(1)} |`,
    );
  }
}

// -------------------------------------------------- cause 6: rounding rule
//
// Rounding alone can produce a one-minute disagreement that looks like a
// correctness bug. Here adhan is held fixed at Nearest and praytime is run with
// each of its four rules against the same instants.

out.push('');
out.push('## Cause 6: rounding rule, with the astronomy held constant');
out.push('');
out.push('`adhan` DateUtils.ts L22-35 `roundedMinute`: `Nearest` rounds up at >= 30 s,');
out.push('`Up` always adds `60 - s` (so it moves a time even when s is 0), `None`');
out.push('leaves the seconds. `praytime` praytime.js L230-240 maps `up`/`down`/');
out.push('`nearest` to `Math.ceil`/`Math.floor`/`Math.round` on whole minutes, and any');
out.push('other value returns the raw timestamp. Same instants, four rules:');
out.push('');
out.push('| series | n | mean | min | max | histogram |');
out.push('|---|---|---|---|---|---|');

for (const rule of ['nearest', 'down', 'up', 'none']) {
  const city = CITIES.find((c) => c.name === 'London');
  const deltas = [];
  for (const [y, m, d] of DAYS) {
    const coords = new adhan.Coordinates(city.lat, city.lon);
    const pa = new adhan.PrayerTimes(
      coords,
      new Date(Date.UTC(y, m - 1, d)),
      adhan.CalculationMethod.MuslimWorldLeague(),
    );
    const q = new PrayTime('MWL');
    q.location([city.lat, city.lon]);
    q.utcOffset(off(city.tz, y, m, d));
    q.format('x').round(rule);
    const v = q.times([y, m, d]).sunrise;
    deltas.push(
      Number.isFinite(v)
        ? Math.floor(v / MIN) - Math.round(pa.sunrise.getTime() / MIN)
        : null,
    );
  }
  line(`London Sunrise, praytime round("${rule}") vs adhan Nearest`, profile(deltas));
}

console.log(out.join('\n'));
