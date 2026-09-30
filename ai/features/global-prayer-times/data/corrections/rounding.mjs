// R6: a mean residual sitting at exactly +0.5 is not a policy margin, it is a rounding rule.
// Most authorities round a prayer time UP to the next whole minute (never announce a prayer
// early) and round sunrise DOWN. A library that rounds to nearest is then half a minute out
// by construction. This measures the rounding rule separately from the policy margin.
// node rounding.mjs

import * as adhan from 'adhan';
import * as P from './parse.mjs';
import { SITES } from './sites.mjs';
import { FIELDS, mean } from './measure.mjs';

const fmtCache = new Map();
function localSeconds(date, tz) {
  let f = fmtCache.get(tz);
  if (!f) { f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); fmtCache.set(tz, f); }
  const p = f.formatToParts(date), g = (t) => Number(p.find((x) => x.type === t).value);
  return g('hour') * 3600 + g('minute') * 60 + g('second');
}

// `adhan` rounds internally and exposes the rule as `params.rounding`, so the rounding has
// to be switched off at the source with `Rounding.None` and applied here on real seconds.
const MODES = {
  nearest: (s) => Math.round(s / 60),
  up: (s) => Math.ceil(s / 60),
  down: (s) => Math.floor(s / 60),
};
const NONE = adhan.Rounding.None;

const CASES = ['SG-2026', 'MY-WLY01', 'ID-jakarta', 'EG-cairo', 'TR-9541', 'SA-makkah', 'OM-muscat', 'AE-dubai', 'BN-2026', 'QA-doha'];

console.log('## J. Rounding, measured separately from the policy margin\n');
console.log('Mean residual per field under three rounding rules for the SAME baseline.');
console.log('A rule is the authority\'s when it drives the mean onto a whole number.\n');
console.log('| site | rounding | fajr | sunrise | dhuhr | asr | maghrib | isha |');
console.log('|---|---|---|---|---|---|---|---|');

const summary = [];
for (const id of CASES) {
  const s = SITES.find((x) => x.id === id);
  const days = s.load(P);
  const rows = {};
  for (const [name, fn] of Object.entries(MODES)) {
    const acc = Object.fromEntries(FIELDS.map((k) => [k, []]));
    for (const day of days) {
      const [y, m, d] = day.date.split('-').map(Number);
      const p = adhan.CalculationMethod.Other();
      p.fajrAngle = s.spec.fajr;
      if (s.spec.ishaInterval) { p.ishaInterval = (s.spec.ramadanIshaInterval && day.hijriMonth === 9) ? s.spec.ramadanIshaInterval : s.spec.ishaInterval; p.ishaAngle = 0; }
      else p.ishaAngle = s.spec.isha;
      p.madhab = adhan.Madhab.Shafi;
      p.rounding = NONE;
      const t = new adhan.PrayerTimes(new adhan.Coordinates(s.lat, s.lon), new Date(Date.UTC(s.dummyYear ?? y, m - 1, d, 12)), p);
      const map = { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
      for (const k of FIELDS) {
        if (day[k] === null || day[k] === undefined) continue;
        acc[k].push(day[k] - fn(localSeconds(map[k], s.tz)));
      }
    }
    rows[name] = Object.fromEntries(FIELDS.map((k) => [k, mean(acc[k])]));
    console.log(`| \`${id}\` | ${name} | ${FIELDS.map((k) => rows[name][k].toFixed(2)).join(' | ')} |`);
  }
  // Which rounding rule puts each field closest to a whole number?
  const best = Object.fromEntries(FIELDS.map((k) => {
    const scored = Object.entries(rows).map(([n, v]) => [n, Math.abs(v[k] - Math.round(v[k]))]);
    scored.sort((a, b) => a[1] - b[1]);
    return [k, scored[0][0]];
  }));
  summary.push([id, best]);
}

console.log('\n## J2. Which rounding rule each authority appears to use\n');
console.log('| site | fajr | sunrise | dhuhr | asr | maghrib | isha |');
console.log('|---|---|---|---|---|---|---|');
for (const [id, best] of summary) console.log(`| \`${id}\` | ${FIELDS.map((k) => best[k]).join(' | ')} |`);

console.log('\n## J3. What the right rounding rule buys, measured\n');
console.log('Exact-match rate under nearest rounding against the best per-field rounding rule.\n');
console.log('| site | exact, nearest rounding | exact, per-field best rounding | gain |');
console.log('|---|---|---|---|');
for (const [id, best] of summary) {
  const s = SITES.find((x) => x.id === id);
  const days = s.load(P);
  const score = (pick) => {
    const acc = Object.fromEntries(FIELDS.map((k) => [k, []]));
    for (const day of days) {
      const [y, m, d] = day.date.split('-').map(Number);
      const p = adhan.CalculationMethod.Other();
      p.fajrAngle = s.spec.fajr;
      if (s.spec.ishaInterval) { p.ishaInterval = (s.spec.ramadanIshaInterval && day.hijriMonth === 9) ? s.spec.ramadanIshaInterval : s.spec.ishaInterval; p.ishaAngle = 0; }
      else p.ishaAngle = s.spec.isha;
      p.madhab = adhan.Madhab.Shafi;
      p.rounding = NONE;
      const t = new adhan.PrayerTimes(new adhan.Coordinates(s.lat, s.lon), new Date(Date.UTC(s.dummyYear ?? y, m - 1, d, 12)), p);
      const map = { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
      for (const k of FIELDS) {
        if (day[k] === null || day[k] === undefined) continue;
        acc[k].push(day[k] - MODES[pick(k)](localSeconds(map[k], s.tz)));
      }
    }
    let n = 0, e = 0;
    for (const k of FIELDS) {
      const c = Math.round(mean(acc[k]));
      for (const v of acc[k]) { n++; if (v === c) e++; }
    }
    return [e, n];
  };
  const [eN, n] = score(() => 'nearest');
  const [eB] = score((k) => best[k]);
  console.log(`| \`${id}\` | ${eN} (${(100 * eN / n).toFixed(1)}%) | ${eB} (${(100 * eB / n).toFixed(1)}%) | ${(100 * (eB - eN) / n).toFixed(1)} pp |`);
}
