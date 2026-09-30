// R13 Part 2i: the Asr column reconciled, using the publisher's own coordinates and margin.
// londonsalahtimes.com/technical documents Charing Cross 51.5073 N 0.12755 W and "Asr: 2 minutes
// later". Part 2f showed an apparent-altitude solve reaches 81% on Mithl 1 with no margin.
// This sweeps the margin against both the geometric and apparent readings, at both the
// publisher's point and wave 1's fitted point, to find which combination reproduces the digits.

import fs from 'node:fs';
import { readElm, toMin } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const julian = (ms) => ms / 86_400_000 + 2_440_587.5;

const solar = (jd) => {
  const t = (jd - 2_451_545) / 36_525;
  const L0 = (280.46646 + t * (36_000.76983 + t * 0.0003032)) % 360;
  const M = 357.52911 + t * (35_999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const C =
    Math.sin(rad(M)) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * t) +
    Math.sin(rad(3 * M)) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(omega));
  const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
  const y = Math.tan(rad(eps / 2)) ** 2;
  const eqTime =
    4 *
    deg(
      y * Math.sin(2 * rad(L0)) -
        2 * e * Math.sin(rad(M)) +
        4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) -
        0.5 * y * y * Math.sin(4 * rad(L0)) -
        1.25 * e * e * Math.sin(2 * rad(M))
    );
  return { decl, eqTime };
};

const altitude = (ms, lat, lon) => {
  const { decl, eqTime } = solar(julian(ms));
  const minutesUtc = (((ms / 60_000) % 1440) + 1440) % 1440;
  let ha = (minutesUtc + eqTime + 4 * lon) / 4 - 180;
  if (ha < -180) ha += 360;
  if (ha > 180) ha -= 360;
  return (
    90 -
    deg(
      Math.acos(
        Math.sin(rad(lat)) * Math.sin(rad(decl)) + Math.cos(rad(lat)) * Math.cos(rad(decl)) * Math.cos(rad(ha))
      )
    )
  );
};

const refraction = (h) => 1.02 / Math.tan(rad(h + 10.3 / (h + 5.11))) / 60;

const solveAsr = (iso, lat, lon, factor, mode) => {
  const [y, m, d] = iso.split('-').map(Number);
  const noonUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
  const { decl } = solar(julian(noonUtc));
  const target = deg(Math.atan(1 / (factor + Math.tan(rad(Math.abs(lat - decl))))));
  const geo = mode === 'apparent' ? target - refraction(target) : target;
  let lo = noonUtc;
  let hi = noonUtc + 10 * 3_600_000;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (altitude(mid, lat, lon) > geo) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const londonMinutes = (ms) => {
  const p = clock.formatToParts(new Date(ms));
  const g = (t) => Number(p.find((x) => x.type === t).value);
  return g('hour') * 60 + g('minute') + g('second') / 60;
};

const ERA_B = [2015, 2017, 2018, 2019, 2020, 2021, 2022, 2025, 2026];
const years = {};
for (const y of ERA_B) years[y] = readElm(y);

say('R13 PART 2i: reconciling the two published Asr columns');
say('Solver: NOAA/Meeus solar position, bisected to the second. A measuring instrument only.');
say(`Years: all era B, ${ERA_B.join(', ')}. ${ERA_B.length * 365} days.`);
say('');
say('point                      mode        margin  Mithl 1 exact         within 1   Mithl 2 exact         within 1   worst');

const POINTS = [
  ['Charing Cross 51.5073,-0.12755', 51.5073, -0.12755],
  ['51.5,-0.165 (wave 1 era B2)', 51.5, -0.165],
  ['51.5,-0.1275 (wave 1 era B1)', 51.5, -0.1275],
];

let best = null;
for (const [name, lat, lon] of POINTS) {
  for (const mode of ['geometric', 'apparent']) {
    for (const margin of [0, 1, 2]) {
      let n = 0;
      let e1 = 0;
      let e2 = 0;
      let w1a = 0;
      let w1b = 0;
      let worst = 0;
      for (const y of ERA_B) {
        const rows = years[y];
        for (const d of Object.keys(rows).sort()) {
          const p1 = toMin(rows[d].asr);
          const p2 = toMin(rows[d].asr_2);
          if (p1 === null || p2 === null) continue;
          n += 1;
          const d1 = Math.round(londonMinutes(solveAsr(d, lat, lon, 1, mode))) + margin - p1;
          const d2 = Math.round(londonMinutes(solveAsr(d, lat, lon, 2, mode))) + margin - p2;
          if (d1 === 0) e1 += 1;
          if (d2 === 0) e2 += 1;
          if (Math.abs(d1) <= 1) w1a += 1;
          if (Math.abs(d2) <= 1) w1b += 1;
          worst = Math.max(worst, Math.abs(d1), Math.abs(d2));
        }
      }
      const row = {
        name,
        mode,
        margin,
        n,
        e1,
        e2,
        w1a,
        w1b,
        worst,
        score: e1 + e2,
      };
      if (!best || row.score > best.score) best = row;
      say(
        `${name.padEnd(26)} ${mode.padEnd(10)} ${String(margin).padStart(6)}  ${`${e1}/${n} (${((100 * e1) / n).toFixed(1)}%)`.padStart(20)} ${`${((100 * w1a) / n).toFixed(1)}%`.padStart(9)}  ${`${e2}/${n} (${((100 * e2) / n).toFixed(1)}%)`.padStart(20)} ${`${((100 * w1b) / n).toFixed(1)}%`.padStart(9)} ${String(worst).padStart(6)}`
      );
    }
  }
}
say('');
say(`BEST: ${best.name}, ${best.mode} target, margin +${best.margin}`);
say(`  Mithl 1: ${best.e1}/${best.n} exact (${((100 * best.e1) / best.n).toFixed(2)}%), ${best.w1a}/${best.n} within 1 min`);
say(`  Mithl 2: ${best.e2}/${best.n} exact (${((100 * best.e2) / best.n).toFixed(2)}%), ${best.w1b}/${best.n} within 1 min`);
say(`  Worst error: ${best.worst} min`);
say('');
say('Reference: adhan 4.4.6\'s own Asr at 51.5,-0.165 reached 60.44% on Mithl 1 and 49.73% on');
say('Mithl 2 across the same years (Part 2h), and 37.63% on Mithl 1 for era B2 alone (Part 2e).');

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part2i.txt', out + '\n');
console.log(out);
