// R13 Part 2h: the timetable reproduced from its publisher's OWN documented formulas.
// Every equation below is transcribed from londonsalahtimes.com/technical (fetched 2026-09-30),
// which East London Mosque's prayer-times page credits as the producer of its timetable.
// This is a measuring instrument built to test the publisher's claim, not code for the app.

import fs from 'node:fs';
import { readElm, readLpt, toMin, FIELDS } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const acot = (x) => Math.atan(1 / x);

/** Julian Day at 00:00 UT of an ISO calendar date, Meeus page 143. */
const julianDay = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  let Y = y;
  let M = m;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;
};

/** The publisher's own sequence, at Julian Day jd. */
const sun = (jd) => {
  const T = (jd - 2_451_545) / 36_525;
  const r = T / 10;
  const L0 =
    (280.4664567 +
      360_007.6982779 * r +
      0.03032028 * r ** 2 +
      r ** 3 / 49_931 -
      r ** 4 / 15_300 -
      r ** 5 / 2_000_000) %
    360;
  const M = 357.5291092 + 35_999.0502909 * T - 0.0001536 * T ** 2 - T ** 3 / 24_490_000;
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T ** 2;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T ** 2) * Math.sin(rad(M)) +
    (0.019993 - 0.000101 * T) * Math.sin(rad(2 * M)) +
    0.000289 * Math.sin(rad(3 * M));
  const trueLong = L0 + C;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T));
  const eps0 = 23 + 26 / 60 + (21.448 - 46.815 * T - 0.00059 * T ** 2 + 0.001813 * T ** 3) / 3600;
  const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
  const delta = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
  const y = Math.tan(rad(eps / 2)) ** 2;
  // The page gives E in degrees, then says multiply by 4 to get minutes of time.
  const Edeg = deg(
    y * Math.sin(rad(2 * L0)) -
      2 * e * Math.sin(rad(M)) +
      4 * e * y * Math.sin(rad(M)) * Math.cos(rad(2 * L0)) -
      0.5 * y * y * Math.sin(rad(4 * L0)) -
      1.25 * e * e * Math.sin(rad(2 * M))
  );
  return { delta, Eminutes: 4 * Edeg };
};

/**
 * The publisher's events, in hours UT. `lon` positive east, as the page specifies.
 * m0 = 12 - L/15 - E/15, with E in DEGREES per the page's own m0 equation.
 */
const events = (iso, lat, lon) => {
  // Iterate once on the transit so the declination is read at the transit rather than at 00:00 UT.
  let jd = julianDay(iso) + 0.5;
  let s = sun(jd);
  let m0 = 12 - lon * 4 / 60 - s.Eminutes / 60;
  for (let i = 0; i < 3; i += 1) {
    s = sun(julianDay(iso) + m0 / 24);
    m0 = 12 - (lon * 4) / 60 - s.Eminutes / 60;
  }
  const { delta } = s;
  const H =
    deg(
      Math.acos(
        (Math.sin(rad(-0.833333)) - Math.sin(rad(lat)) * Math.sin(rad(delta))) /
          (Math.cos(rad(lat)) * Math.cos(rad(delta)))
      )
    ) / 15;
  const asrFor = (t) => {
    const target = deg(acot(t + Math.tan(rad(Math.abs(lat - delta)))));
    return (
      m0 +
      deg(
        Math.acos(
          (Math.sin(rad(target)) - Math.sin(rad(lat)) * Math.sin(rad(delta))) /
            (Math.cos(rad(lat)) * Math.cos(rad(delta)))
        )
      ) /
        15
    );
  };
  return { m0, sunrise: m0 - H, sunset: m0 + H, asr1: asrFor(1), asr2: asrFor(2) };
};

/** London wall-clock minutes from an hours-UT value on a given ISO date. */
const londonOffsetMinutes = (() => {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' });
  return (iso, hoursUt) => {
    const ms = Date.UTC(...iso.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v)))) + hoursUt * 3_600_000;
    const name = f.formatToParts(new Date(ms)).find((p) => p.type === 'timeZoneName').value;
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
    return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
  };
})();

const localMinutes = (iso, hoursUt) => hoursUt * 60 + londonOffsetMinutes(iso, hoursUt);

const ERA_B1 = [2015, 2017, 2018, 2019, 2020, 2021];
const ERA_B2 = [2022, 2025, 2026];
const years = {};
for (const y of [...ERA_B1, ...ERA_B2]) years[y] = readElm(y);
const lpt = readLpt();

const intervalsOf = (rows) => {
  const out = {};
  for (const [date, row] of Object.entries(rows)) {
    const sr = toMin(row.sunrise);
    const mg = toMin(row.magrib);
    if (sr === null || mg === null) continue;
    out[date.slice(5)] = { fajr: sr + 3 - toMin(row.fajr), isha: toMin(row.isha) - (mg - 3) };
  }
  return out;
};
const perYear = {};
for (const y of Object.keys(years)) perYear[y] = intervalsOf(years[y]);

const LAT = 51.5073;
const LON = -0.12755;

const run = (lat, lon, yearList, asrMargin, source) => {
  const t = {};
  for (const f of [...FIELDS, 'asr_2']) t[f] = { n: 0, exact: 0, w1: 0, worst: 0, misses: [] };
  for (const y of yearList) {
    const rows = source === 'lpt' ? lpt : years[y];
    const iv0 = perYear[y];
    for (const d of Object.keys(rows).sort()) {
      const iv = iv0[d.slice(5)];
      if (!iv) continue;
      const ev = events(d, lat, lon);
      const sr = Math.round(localMinutes(d, ev.sunrise));
      const ss = Math.round(localMinutes(d, ev.sunset));
      const got = {
        sunrise: sr - 3,
        dhuhr: Math.round(localMinutes(d, ev.m0)) + 5,
        asr: Math.round(localMinutes(d, ev.asr1)) + asrMargin,
        asr_2: Math.round(localMinutes(d, ev.asr2)) + asrMargin,
        magrib: ss + 3,
        fajr: sr - iv.fajr,
        isha: ss + iv.isha,
      };
      for (const f of [...FIELDS, 'asr_2']) {
        const pub = toMin(rows[d][f]);
        if (pub === null) continue;
        const delta = got[f] - pub;
        const s = t[f];
        s.n += 1;
        if (delta === 0) s.exact += 1;
        if (Math.abs(delta) <= 1) s.w1 += 1;
        s.worst = Math.max(s.worst, Math.abs(delta));
        if (delta !== 0) s.misses.push(`${d}${delta > 0 ? '+' : ''}${delta}`);
      }
    }
  }
  return t;
};

const report = (label, t) => {
  say(`-- ${label}`);
  say('field    n      exact              within 1 min       worst  beyond 1 min');
  for (const f of [...FIELDS, 'asr_2']) {
    const s = t[f];
    if (!s.n) continue;
    say(
      `${f.padEnd(8)} ${String(s.n).padStart(5)} ${`${s.exact} (${((100 * s.exact) / s.n).toFixed(2)}%)`.padStart(18)} ${`${s.w1} (${((100 * s.w1) / s.n).toFixed(2)}%)`.padStart(18)} ${String(s.worst).padStart(5)}  ${s.n - s.w1}`
    );
  }
  const six = FIELDS.reduce((a, f) => ({ n: a.n + t[f].n, exact: a.exact + t[f].exact, w1: a.w1 + t[f].w1 }), { n: 0, exact: 0, w1: 0 });
  say(
    `SIX FIELDS: ${six.exact}/${six.n} exact (${((100 * six.exact) / six.n).toFixed(2)}%), ${six.w1}/${six.n} within 1 min (${((100 * six.w1) / six.n).toFixed(2)}%), worst ${Math.max(...FIELDS.map((f) => t[f].worst))}`
  );
  say('');
  return { t, six };
};

say('R13 PART 2h: London reproduced from its publisher\'s own published formulas');
say('Every equation transcribed from londonsalahtimes.com/technical, fetched 2026-09-30.');
say('Charing Cross 51.5073 N, 0.12755 W. Meeus Astronomical Algorithms 2nd ed. 1998.');
say('Fajr and Isha are the Hizbul Ulama intervals against this computed sun, exactly as the');
say('publisher describes them: "they determined the times between Fajr and sunrise, and between');
say('sunset and Isha".');
say('');

say('== 2h.1 The publisher\'s stated Asr margin of +2 minutes, tested ==');
for (const asrMargin of [0, 1, 2, 3]) {
  const t = run(LAT, LON, [...ERA_B1, ...ERA_B2], asrMargin);
  say(
    `  Asr +${asrMargin}: asr exact ${t.asr.exact}/${t.asr.n} (${((100 * t.asr.exact) / t.asr.n).toFixed(2)}%), within 1 min ${((100 * t.asr.w1) / t.asr.n).toFixed(2)}%, worst ${t.asr.worst}  |  asr_2 exact ${t.asr_2.exact}/${t.asr_2.n} (${((100 * t.asr_2.exact) / t.asr_2.n).toFixed(2)}%), within 1 min ${((100 * t.asr_2.w1) / t.asr_2.n).toFixed(2)}%, worst ${t.asr_2.worst}`
  );
}
say('');

const bestMargin = [0, 1, 2, 3].reduce((best, m) => {
  const t = run(LAT, LON, [...ERA_B1, ...ERA_B2], m);
  return !best || t.asr.exact + t.asr_2.exact > best.score ? { m, score: t.asr.exact + t.asr_2.exact } : best;
}, null).m;
say(`Asr margin that best reproduces the published digits: +${bestMargin}`);
say('');

report(`era B2 (2022, 2025, 2026), Asr +${bestMargin}`, run(LAT, LON, ERA_B2, bestMargin));
report(`era B1 (2015 to 2021), Asr +${bestMargin}`, run(LAT, LON, ERA_B1, bestMargin));
const all = report(`all era B (2015 to 2026), Asr +${bestMargin}`, run(LAT, LON, [...ERA_B1, ...ERA_B2], bestMargin));

say('== 2h.2 2026 alone, against the app\'s OWN captured API year ==');
{
  const t = run(LAT, LON, [2026], bestMargin, 'lpt');
  report('2026 API year, publisher formulas', t);
  for (const f of [...FIELDS, 'asr_2']) {
    const s = t[f];
    say(`  ${f}: ${s.misses.length} misses${s.misses.length <= 60 ? ` -> ${s.misses.join(' ')}` : ''}`);
  }
}
say('');

say('== 2h.3 Verdict inputs ==');
say(`Six fields across era B: ${all.six.exact}/${all.six.n} exact, ${all.six.w1}/${all.six.n} within 1 minute.`);
say(`Values beyond 1 minute: ${all.six.n - all.six.w1}.`);

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part2h.txt', out + '\n');
console.log(out);
