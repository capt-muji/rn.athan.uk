// R13 Part 2f: does an apparent-altitude Asr solve reproduce London's two Asr columns?
// Part 2e measured adhan's Asr at 37.6% exact on Mithl 1. Wave 1 recorded that London's source
// treats the shadow target as an APPARENT altitude with refraction, which adhan does not, and
// that a solver doing so reached 353/365. This tests that independently.
//
// The solar position code below is the standard NOAA/Meeus low-precision algorithm, used here
// only as a measuring instrument. Nothing in it is proposed for the app.

import fs from 'node:fs';
import { readElm, toMin } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** Julian day from a UTC instant. */
const julian = (ms) => ms / 86_400_000 + 2_440_587.5;

/** Sun declination and equation of time (minutes) at a Julian day, NOAA/Meeus. */
const solar = (jd) => {
  const t = (jd - 2_451_545) / 36_525;
  const L0 = (280.46646 + t * (36_000.76983 + t * 0.0003032)) % 360;
  const M = 357.52911 + t * (35_999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const C =
    Math.sin(rad(M)) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * t) +
    Math.sin(rad(3 * M)) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * t;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  const eps0 = 23 + (26 + seconds / 60) / 60;
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

/** Geometric solar altitude in degrees at a UTC instant. */
const altitude = (ms, lat, lon) => {
  const jd = julian(ms);
  const { decl, eqTime } = solar(jd);
  const minutesUtc = ((ms / 60_000) % 1440 + 1440) % 1440;
  const trueSolarTime = minutesUtc + eqTime + 4 * lon;
  let ha = trueSolarTime / 4 - 180;
  if (ha < -180) ha += 360;
  if (ha > 180) ha -= 360;
  const zenith = deg(
    Math.acos(
      Math.sin(rad(lat)) * Math.sin(rad(decl)) + Math.cos(rad(lat)) * Math.cos(rad(decl)) * Math.cos(rad(ha))
    )
  );
  return 90 - zenith;
};

/** Saemundsson refraction, in degrees, for an apparent altitude h. */
const refraction = (h) => 1.02 / Math.tan(rad(h + 10.3 / (h + 5.11))) / 60;

/** The Asr target altitude for shadow factor t at declination decl, latitude lat. */
const asrAltitude = (t, lat, decl) => deg(Math.atan(1 / (t + Math.tan(rad(Math.abs(lat - decl))))));

/**
 * Solve for the instant, in UTC ms, at which the sun's altitude crosses the Asr target.
 * `mode` decides whether the target is a geometric altitude (adhan's reading) or an apparent
 * one, which means the geometric altitude is the target minus refraction.
 */
const solveAsr = (isoDate, lat, lon, factor, mode) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const noonUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
  const { decl } = solar(julian(noonUtc));
  const target = asrAltitude(factor, lat, decl);
  const geometricTarget = mode === 'apparent' ? target - refraction(target) : target;

  // Bisect between solar noon and sunset.
  let lo = noonUtc;
  let hi = noonUtc + 10 * 3_600_000;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (altitude(mid, lat, lon) > geometricTarget) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

const londonClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const londonMinutes = (ms) => {
  const parts = londonClock.formatToParts(new Date(ms));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return get('hour') * 60 + get('minute') + get('second') / 60;
};

const ERA_B2 = [2022, 2025, 2026];
const years = {};
for (const y of ERA_B2) years[y] = readElm(y);

say('R13 PART 2f: Asr reproduced by an apparent-altitude solve');
say('Solver: NOAA/Meeus solar position, bisected to the second. Used as a measuring instrument only.');
say('Point: 51.5, -0.165. Era B2: 2022, 2025, 2026.');
say('');

const LAT = 51.5;
const LON = -0.165;

say('column  factor  refraction  exact            within 1 min     worst');
for (const [column, factor] of [
  ['asr', 1],
  ['asr_2', 2],
]) {
  for (const mode of ['geometric', 'apparent']) {
    let n = 0;
    let exact = 0;
    let w1 = 0;
    let worst = 0;
    for (const y of ERA_B2) {
      const rows = years[y];
      for (const d of Object.keys(rows).sort()) {
        const pub = toMin(rows[d][column]);
        if (pub === null) continue;
        const ms = solveAsr(d, LAT, LON, factor, mode);
        const delta = Math.round(londonMinutes(ms)) - pub;
        n += 1;
        if (delta === 0) exact += 1;
        if (Math.abs(delta) <= 1) w1 += 1;
        worst = Math.max(worst, Math.abs(delta));
      }
    }
    say(
      `${column.padEnd(7)} ${String(factor).padStart(6)}  ${mode.padEnd(10)} ${`${exact}/${n} (${((100 * exact) / n).toFixed(2)}%)`.padStart(16)} ${`${w1} (${((100 * w1) / n).toFixed(2)}%)`.padStart(16)} ${String(worst).padStart(5)}`
    );
  }
}
say('');
say('Reference, from Part 2e: adhan\'s own Asr reached 37.63% exact on Mithl 1 and 56.53% on Mithl 2,');
say('both within 1 minute on 95.34% and 99.00% respectively, worst 2 minutes.');

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part2f.txt', out + '\n');
console.log(out);
