// R13 Part 2g: the reconstruction using the parameters the timetable's OWN publisher documents.
// londonsalahtimes.com/technical (fetched 2026-09-30) states, in its own words:
//   Charing Cross 51.5073 N, 0.12755 W; Meeus, Astronomical Algorithms, 2nd ed. 1998
//   Sunrise: 3 minutes earlier   'Asr: 2 minutes later   Sunset: 3 minutes later   Zuhr: 5 minutes later
// Fajr and 'Isha: "based on the UK observations of Hizbul Ulama; they determined the times between
// Fajr and sunrise, and between sunset and 'Isha."
//
// This is the first time the programme has had the publisher's own stated parameters.

import fs from 'node:fs';
import { adhan, readElm, readLpt, toMin, computeDay, FIELDS } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

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

// `Other` carries no methodAdjustments, so only the publisher's own margins are applied.
const mkParams = (madhab) => {
  const p = new adhan.CalculationParameters('Other', 18, 17);
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab[madhab];
  return p;
};

const CHARING_CROSS = { lat: 51.5073, lon: -0.12755 };

/** The publisher's stated margins. */
const MARGINS = { sunrise: -3, dhuhr: 5, asr: 2, magrib: 3 };

const run = (lat, lon, yearList, margins) => {
  const coords = new adhan.Coordinates(lat, lon);
  const pS = mkParams('Shafi');
  const pH = mkParams('Hanafi');
  const t = {};
  for (const f of [...FIELDS, 'asr_2']) t[f] = { n: 0, exact: 0, w1: 0, worst: 0, misses: [] };
  for (const y of yearList) {
    const rows = years[y];
    const iv0 = perYear[y];
    for (const d of Object.keys(rows).sort()) {
      const iv = iv0[d.slice(5)];
      if (!iv) continue;
      const c = computeDay(d, coords, pS);
      const cH = computeDay(d, coords, pH);
      const srRaw = Math.round(c.sunrise);
      const mgRaw = Math.round(c.magrib);
      const got = {
        sunrise: srRaw + margins.sunrise,
        dhuhr: Math.round(c.dhuhr) + margins.dhuhr,
        asr: Math.round(c.asr) + margins.asr,
        asr_2: Math.round(cH.asr) + margins.asr,
        magrib: mgRaw + margins.magrib,
        fajr: srRaw - iv.fajr,
        isha: mgRaw + iv.isha,
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

say('R13 PART 2g: reconstruction with the publisher\'s OWN documented parameters');
say('Source: londonsalahtimes.com/technical, fetched 2026-09-30, credited on East London Mosque\'s');
say('own prayer-times page as "Prayer times produced by London Salah Times".');
say('Charing Cross 51.5073 N, 0.12755 W. Margins: sunrise -3, Zuhr +5, Asr +2, sunset +3.');
say('');

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
};

report('era B2: 2022, 2025, 2026', run(CHARING_CROSS.lat, CHARING_CROSS.lon, ERA_B2, MARGINS));
report('era B1: 2015 to 2021', run(CHARING_CROSS.lat, CHARING_CROSS.lon, ERA_B1, MARGINS));
report('all era B: 2015 to 2026', run(CHARING_CROSS.lat, CHARING_CROSS.lon, [...ERA_B1, ...ERA_B2], MARGINS));

say('== 2g.1 Sensitivity: the Asr +2 margin the publisher documents ==');
for (const asrMargin of [0, 1, 2, 3]) {
  const t = run(CHARING_CROSS.lat, CHARING_CROSS.lon, [...ERA_B1, ...ERA_B2], { ...MARGINS, asr: asrMargin });
  say(
    `  Asr margin +${asrMargin}: asr exact ${t.asr.exact}/${t.asr.n} (${((100 * t.asr.exact) / t.asr.n).toFixed(2)}%), within 1 min ${((100 * t.asr.w1) / t.asr.n).toFixed(2)}%, worst ${t.asr.worst}; asr_2 exact ${t.asr_2.exact}/${t.asr_2.n} (${((100 * t.asr_2.exact) / t.asr_2.n).toFixed(2)}%), worst ${t.asr_2.worst}`
  );
}
say('');

say('== 2g.2 Charing Cross against the points wave 1 fitted ==');
for (const [name, lat, lon] of [
  ['Charing Cross 51.5073,-0.12755 (publisher\'s own)', 51.5073, -0.12755],
  ['51.5,-0.1275 (wave 1 era B1 fit)', 51.5, -0.1275],
  ['51.5,-0.165 (wave 1 era B2 fit)', 51.5, -0.165],
  ['51.5072,-0.1276 (generic London)', 51.5072, -0.1276],
]) {
  const t = run(lat, lon, [...ERA_B1, ...ERA_B2], MARGINS);
  const six = FIELDS.reduce((a, f) => ({ n: a.n + t[f].n, exact: a.exact + t[f].exact, w1: a.w1 + t[f].w1 }), { n: 0, exact: 0, w1: 0 });
  say(
    `  ${name.padEnd(48)} six fields exact ${six.exact}/${six.n} (${((100 * six.exact) / six.n).toFixed(2)}%), within 1 min ${((100 * six.w1) / six.n).toFixed(2)}%, worst ${Math.max(...FIELDS.map((f) => t[f].worst))}`
  );
}
say('');

say('== 2g.3 Charing Cross on 2026 alone, against the app\'s own captured API year ==');
{
  const coords = new adhan.Coordinates(CHARING_CROSS.lat, CHARING_CROSS.lon);
  const pS = mkParams('Shafi');
  const pH = mkParams('Hanafi');
  const iv0 = perYear[2026];
  const t = {};
  for (const f of [...FIELDS, 'asr_2']) t[f] = { n: 0, exact: 0, w1: 0, worst: 0, misses: [] };
  for (const d of Object.keys(lpt).sort()) {
    const iv = iv0[d.slice(5)];
    if (!iv) continue;
    const c = computeDay(d, coords, pS);
    const cH = computeDay(d, coords, pH);
    const srRaw = Math.round(c.sunrise);
    const mgRaw = Math.round(c.magrib);
    const got = {
      sunrise: srRaw - 3,
      dhuhr: Math.round(c.dhuhr) + 5,
      asr: Math.round(c.asr) + 2,
      asr_2: Math.round(cH.asr) + 2,
      magrib: mgRaw + 3,
      fajr: srRaw - iv.fajr,
      isha: mgRaw + iv.isha,
    };
    for (const f of [...FIELDS, 'asr_2']) {
      const pub = toMin(lpt[d][f]);
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
  report('2026, app API year, Charing Cross + published margins', t);
  for (const f of [...FIELDS, 'asr_2']) {
    say(`  ${f} misses (${t[f].misses.length}): ${t[f].misses.length <= 40 ? t[f].misses.join(' ') : 'too many to list'}`);
  }
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part2g.txt', out + '\n');
console.log(out);
