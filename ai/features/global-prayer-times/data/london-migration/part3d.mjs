// R13 Part 3d: two results from Part 3c that must be checked before they are believed.
//   1. The publisher's own Asr formula plus its documented +2 margin reproduced BOTH published Asr
//      columns on 18,263 of 18,263 days. A 100.00% result is a claim about the generator, so it is
//      re-derived here against a second corpus it was not measured on.
//   2. Fajr, sunrise, Maghrib and Isha are within 1 minute on 100% of the fifty future years but
//      exact on only 63%, while the same code reaches 93% on the ELM PDFs. A systematic 1-minute
//      split is a rounding rule, not a boundary coin flip, so the rule is fitted here.

import fs from 'node:fs';
import { readLupt } from './xlsx.mjs';
import { readElm, readLpt, toMin, ELM_YEARS } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const FUTURE = [];
for (let y = 2027; y <= 2076; y += 1) FUTURE.push(y);
const future = {};
for (const y of FUTURE) future[y] = readLupt(`./lupt/LUPT-${y}.xlsx`);

const RAD = Math.PI / 180;

/**
 * The publisher's own solar position, transcribed equation for equation from
 * londonsalahtimes.com/technical (Meeus, Astronomical Algorithms, 2nd ed. 1998).
 * A measuring instrument only: nothing here becomes a displayed prayer time.
 */
const solar = (jd) => {
  const T = (jd - 2451545) / 36525;
  const r = T / 10;
  const L0 = 280.4664567 + 360007.6982779 * r + 0.03032028 * r * r + r ** 3 / 49931 - r ** 4 / 15300 - r ** 5 / 2000000;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T - T ** 3 / 24490000;
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * RAD) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M * RAD) +
    0.000289 * Math.sin(3 * M * RAD);
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
  const eps0 = 23 + 26 / 60 + 21.448 / 3600 - (46.815 * T + 0.00059 * T * T - 0.001813 * T ** 3) / 3600;
  const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
  const dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const E =
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD)) /
    RAD;
  return { dec, E: E * 4 };
};

const jdOf = (iso) => {
  const [Y, M, D] = iso.split('-').map(Number);
  const a = Math.floor((14 - M) / 12);
  const y2 = Y + 4800 - a;
  const m2 = M + 12 * a - 3;
  return (
    D + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045 - 0.5
  );
};

const offsetCache = new Map();
const londonOffsetMin = (iso) => {
  if (offsetCache.has(iso)) return offsetCache.get(iso);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hourCycle: 'h23' }).formatToParts(
    new Date(`${iso}T12:00:00Z`)
  );
  const v = (Number(parts.find((p) => p.type === 'hour').value) - 12) * 60;
  offsetCache.set(iso, v);
  return v;
};

/** The publisher's own four sun events, in London minutes, unrounded. */
const sunEvents = (iso, lat, lon) => {
  const { dec, E } = solar(jdOf(iso) + 0.5);
  const noon = 720 - 4 * lon - E + londonOffsetMin(iso);
  const hourAngle = (altDeg) => {
    const c = (Math.sin(altDeg * RAD) - Math.sin(lat * RAD) * Math.sin(dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
    if (c < -1 || c > 1) return null;
    return (Math.acos(c) / RAD) * 4;
  };
  const H = hourAngle(-0.833333);
  const asrAt = (factor) => {
    const target = Math.atan(1 / (factor + Math.tan(Math.abs(lat - dec) * RAD))) / RAD;
    const h = hourAngle(target);
    return h === null ? null : noon + h;
  };
  return {
    noon,
    sunrise: H === null ? null : noon - H,
    sunset: H === null ? null : noon + H,
    asr1: asrAt(1),
    asr2: asrAt(2),
  };
};

const ROUNDERS = {
  'half-up': (x) => Math.floor(x + 0.5),
  'half-down': (x) => Math.ceil(x - 0.5),
  'half-even': (x) => {
    const f = Math.floor(x);
    if (x - f !== 0.5) return Math.round(x);
    return f % 2 === 0 ? f : f + 1;
  },
  floor: Math.floor,
  ceil: Math.ceil,
};

const CORPORA = [
  ['ELM PDFs, era B, 2015 to 2026', ELM_YEARS.filter((y) => y >= 2015).map((y) => [y, readElm(y)])],
  ['ELM PDF 2026 + app API 2026', [[2026, readElm(2026)], [2026, readLpt()]]],
  ['publisher .xlsx, 2027 to 2076', FUTURE.map((y) => [y, future[y]])],
];

say('R13 PART 3d: verifying the two surprising results of Part 3c');
say('Solver: the publisher\'s own Meeus equations, transcribed from londonsalahtimes.com/technical.');
say('Charing Cross 51.5073 N, 0.12755 W, the publisher\'s own stated point.');
say('');

say('== 3d.1 The Asr result, re-derived on three corpora ==');
say('The publisher documents: "\'Asr: 2 minutes later". Its own Asr equation is A = m0 + acos(...)/15');
say('with the shadow target acot(factor + tan|lat - dec|), geometric, no refraction correction.');
say('');
say('corpus                          column  rounder     margin  exact                within 1');
for (const [label, corpus] of CORPORA) {
  for (const [col, factor] of [['asr', 1], ['asr_2', 2]]) {
    for (const rounder of ['half-up', 'half-down']) {
      for (const margin of [0, 2]) {
        let e = 0;
        let w1 = 0;
        let n = 0;
        for (const [, rows] of corpus) {
          for (const d of Object.keys(rows).sort()) {
            const ev = sunEvents(d, 51.5073, -0.12755);
            const raw = factor === 1 ? ev.asr1 : ev.asr2;
            const pub = toMin(rows[d][col]);
            if (raw === null || pub === null) continue;
            n += 1;
            const a = Math.abs(ROUNDERS[rounder](raw + margin) - pub);
            if (a === 0) e += 1;
            if (a <= 1) w1 += 1;
          }
        }
        if (n === 0) continue;
        say(
          `${label.padEnd(31)} ${col.padEnd(7)} ${rounder.padEnd(11)} ${String(margin).padStart(6)}  ${`${e} (${((100 * e) / n).toFixed(2)}%)`.padStart(19)}  ${((100 * w1) / n).toFixed(2)}%`
        );
      }
    }
  }
  say('');
}

say('== 3d.2 The 1-minute split on the sun fields: fitting the rounder ==');
say('Sunrise = computed sunrise - 3, Maghrib = computed sunset + 3, Zuhr = computed transit + 5.');
say('');
say('corpus                          field    rounder      exact                within 1');
for (const [label, corpus] of CORPORA) {
  for (const [field, get] of [
    ['sunrise', (ev) => (ev.sunrise === null ? null : ev.sunrise - 3)],
    ['dhuhr', (ev) => ev.noon + 5],
    ['magrib', (ev) => (ev.sunset === null ? null : ev.sunset + 3)],
  ]) {
    for (const rounder of ['half-up', 'half-down', 'half-even', 'floor', 'ceil']) {
      let e = 0;
      let w1 = 0;
      let n = 0;
      for (const [, rows] of corpus) {
        for (const d of Object.keys(rows).sort()) {
          const raw = get(sunEvents(d, 51.5073, -0.12755));
          const pub = toMin(rows[d][field]);
          if (raw === null || pub === null) continue;
          n += 1;
          const a = Math.abs(ROUNDERS[rounder](raw) - pub);
          if (a === 0) e += 1;
          if (a <= 1) w1 += 1;
        }
      }
      say(
        `${label.padEnd(31)} ${field.padEnd(8)} ${rounder.padEnd(12)} ${`${e} (${((100 * e) / n).toFixed(2)}%)`.padStart(19)}  ${((100 * w1) / n).toFixed(2)}%`
      );
    }
    say('');
  }
}

say('== 3d.3 The mean signed residual, which says whether the gap is a rule or noise ==');
for (const [label, corpus] of CORPORA) {
  for (const [field, get] of [
    ['sunrise', (ev) => (ev.sunrise === null ? null : ev.sunrise - 3)],
    ['dhuhr', (ev) => ev.noon + 5],
    ['magrib', (ev) => (ev.sunset === null ? null : ev.sunset + 3)],
    ['asr(+2)', (ev) => (ev.asr1 === null ? null : ev.asr1 + 2)],
  ]) {
    const deltas = [];
    for (const [, rows] of corpus) {
      for (const d of Object.keys(rows).sort()) {
        const raw = get(sunEvents(d, 51.5073, -0.12755));
        const pub = toMin(rows[d][field === 'asr(+2)' ? 'asr' : field]);
        if (raw === null || pub === null) continue;
        deltas.push(raw - pub);
      }
    }
    const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const sorted = [...deltas].sort((a, b) => a - b);
    say(
      `${label.padEnd(31)} ${field.padEnd(8)} mean ${mean.toFixed(4).padStart(9)}  median ${sorted[Math.floor(sorted.length / 2)].toFixed(4).padStart(9)}  min ${sorted[0].toFixed(3).padStart(8)}  max ${sorted[sorted.length - 1].toFixed(3).padStart(8)}`
    );
  }
  say('');
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part3d.txt', out + '\n');
console.log(out);
