// R13 Part 3c: the definitive fully-offline measurement.
// Part 3 established that the publisher's 2027 table reproduces all fifty published years exactly
// against their own published sun. This measures the SAME table against a COMPUTED sun, which is the
// only remaining question: can a London user be served with the network off, forever?
//
// The 2027 table is the one to ship: Part 3.2 measured it at 18250/18250 on both Fajr and Isha across
// 2027 to 2076, where the app's own 2026 capture leaves 200 Isha values 1 minute out.

import fs from 'node:fs';
import zlib from 'node:zlib';
import { readLupt } from './xlsx.mjs';
import { readElm, readLpt, toMin, adhan, dayDate, londonMinutesExact, ELM_YEARS } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const FUTURE = [];
for (let y = 2027; y <= 2076; y += 1) FUTURE.push(y);
const future = {};
for (const y of FUTURE) future[y] = readLupt(`./lupt/LUPT-${y}.xlsx`);

/** A bare parameter set. A named method carries its own `methodAdjustments` (Part 3b.1). */
const sunParams = () => {
  const p = new adhan.CalculationParameters('Other', 18, 17);
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  return p;
};

const tableOf = (rows) => {
  const out = {};
  for (const [date, row] of Object.entries(rows)) {
    out[date.slice(5)] = {
      fajr: toMin(row.sunrise) + 3 - toMin(row.fajr),
      isha: toMin(row.isha) - (toMin(row.magrib) - 3),
    };
  }
  return out;
};

// The shipped table: the publisher's 2027 year, which is a leap-capable 365-slot table plus 02-29
// taken from the nearest published leap year.
const table = tableOf(future[2027]);
table['02-29'] = tableOf(future[2028])['02-29'];

say('R13 PART 3c: can a London user be served with the network off, forever?');
say('');
say('The shipped table: the publisher\'s 2027 intervals, 365 slots, plus 02-29 from the 2028 year.');
say(`  02-29: Fajr ${table['02-29'].fajr}, Isha ${table['02-29'].isha}. Part 3.3 measured this pair identical`);
say('  across all 13 leap years in the corpus, so one slot settles it and nothing is interpolated.');
say('');

say('== 3c.1 The reconstruction, field by field, over every year available ==');
say('Rules, all from the publisher\'s own technical page (cited, londonsalahtimes.com/technical):');
say('  sunrise = computed sunrise - 3      Zuhr    = computed transit + 5');
say('  Maghrib = computed sunset  + 3      Fajr    = (that sunrise + 3) - interval');
say('  Asr     = Mithl 1 shadow solve      Isha    = (that Maghrib - 3) + interval');
say('Computed sun: adhan 4.4.6, rounding None, then half-up to the minute.');
say('');

const POINTS = [
  ['Charing Cross 51.5073,-0.12755', new adhan.Coordinates(51.5073, -0.12755)],
  ['51.5,-0.1275', new adhan.Coordinates(51.5, -0.1275)],
  ['51.5,-0.165', new adhan.Coordinates(51.5, -0.165)],
];

const CORPORA = [
  ['ELM PDFs, era B, 2015 to 2026', ELM_YEARS.filter((y) => y >= 2015).map((y) => [y, readElm(y)])],
  ['publisher .xlsx, 2027 to 2076', FUTURE.map((y) => [y, future[y]])],
];

const FIELDS = ['fajr', 'sunrise', 'dhuhr', 'magrib', 'isha'];

const measure = (coords, corpus) => {
  const params = sunParams();
  const stat = {};
  for (const f of FIELDS) stat[f] = { exact: 0, w1: 0, worst: 0, beyond: 0, misses: [] };
  let n = 0;
  for (const [, rows] of corpus) {
    for (const d of Object.keys(rows).sort()) {
      const iv = table[d.slice(5)];
      if (!iv) continue;
      n += 1;
      const pt = new adhan.PrayerTimes(coords, dayDate(d), params);
      const cSunrise = Math.round(londonMinutesExact(pt.sunrise, d) - 3);
      const cMagrib = Math.round(londonMinutesExact(pt.maghrib, d) + 3);
      const got = {
        sunrise: cSunrise,
        magrib: cMagrib,
        dhuhr: Math.round(londonMinutesExact(pt.dhuhr, d) + 5),
        fajr: cSunrise + 3 - iv.fajr,
        isha: cMagrib - 3 + iv.isha,
      };
      for (const f of FIELDS) {
        const delta = got[f] - toMin(rows[d][f]);
        const a = Math.abs(delta);
        const s = stat[f];
        if (a === 0) s.exact += 1;
        if (a <= 1) s.w1 += 1;
        else {
          s.beyond += 1;
          if (s.misses.length < 40) s.misses.push(`${d}${delta > 0 ? '+' : ''}${delta}`);
        }
        if (a > s.worst) s.worst = a;
      }
    }
  }
  return { stat, n };
};

for (const [corpusLabel, corpus] of CORPORA) {
  say(`-- ${corpusLabel}`);
  say('point                              field      exact                within 1 min         worst  beyond 1');
  for (const [label, coords] of POINTS) {
    const { stat, n } = measure(coords, corpus);
    for (const f of FIELDS) {
      const s = stat[f];
      say(
        `${label.padEnd(34)} ${f.padEnd(9)} ${`${s.exact} (${((100 * s.exact) / n).toFixed(2)}%)`.padStart(19)} ${`${s.w1} (${((100 * s.w1) / n).toFixed(2)}%)`.padStart(19)} ${String(s.worst).padStart(5)}  ${s.beyond}`
      );
    }
    say('');
  }
}

say('== 3c.2 The best point, and every value it puts more than 1 minute out ==');
{
  const coords = new adhan.Coordinates(51.5073, -0.12755);
  for (const [corpusLabel, corpus] of CORPORA) {
    const { stat, n } = measure(coords, corpus);
    const totalBeyond = FIELDS.reduce((a, f) => a + stat[f].beyond, 0);
    const totalExact = FIELDS.reduce((a, f) => a + stat[f].exact, 0);
    const totalW1 = FIELDS.reduce((a, f) => a + stat[f].w1, 0);
    say(`${corpusLabel}: ${n} days, ${n * 5} values across the five sun-derived fields.`);
    say(`  exact ${totalExact} (${((100 * totalExact) / (n * 5)).toFixed(2)}%), within 1 minute ${totalW1} (${((100 * totalW1) / (n * 5)).toFixed(2)}%), beyond 1 minute ${totalBeyond}`);
    for (const f of FIELDS) {
      if (stat[f].beyond > 0) say(`  ${f}: ${stat[f].beyond} beyond 1 min -> ${stat[f].misses.join(' ')}`);
    }
    say('');
  }
}

say('== 3c.3 Asr, the one field an interval table cannot carry ==');
say('Asr is not an interval against sunrise or Maghrib; it is a shadow solve. Part 2f and 2i measured');
say('that adhan\'s own Asr reproduces this source poorly and an apparent-altitude solve does better.');
say('Restated here on the fifty published future years, which neither was fitted against.');
say('');
{
  // The publisher's own formula, transcribed from its technical page: the shadow target is
  // acot(factor + tan(|lat - dec|)), with an apparent-altitude refraction correction tested separately.
  const RAD = Math.PI / 180;
  const solarPosition = (jd) => {
    const T = (jd - 2451545) / 36525;
    const L0 = 280.4664567 + 360007.6982779 * (T / 10) + 0.03032028 * (T / 10) ** 2;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    const C =
      (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * RAD) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * M * RAD) +
      0.000289 * Math.sin(3 * M * RAD);
    const sunLong = L0 + C;
    const lambda = sunLong - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
    const eps0 = 23 + 26 / 60 + 21.448 / 3600 - (46.815 * T + 0.00059 * T * T - 0.001813 * T ** 3) / 3600;
    const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
    const dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    const y = Math.tan((eps / 2) * RAD) ** 2;
    const eqTime =
      4 *
      ((y * Math.sin(2 * L0 * RAD) -
        2 * e * Math.sin(M * RAD) +
        4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
        0.5 * y * y * Math.sin(4 * L0 * RAD) -
        1.25 * e * e * Math.sin(2 * M * RAD)) /
        RAD);
    return { dec, eqTime };
  };
  const jdOf = (iso) => {
    const [Y, M, D] = iso.split('-').map(Number);
    const a = Math.floor((14 - M) / 12);
    const y2 = Y + 4800 - a;
    const m2 = M + 12 * a - 3;
    return D + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045 - 0.5;
  };
  const londonOffsetMin = (iso) => {
    const probe = new Date(`${iso}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hourCycle: 'h23' }).formatToParts(probe);
    return (Number(parts.find((p) => p.type === 'hour').value) - 12) * 60;
  };

  const asrMinutes = (iso, lat, lon, factor, apparent) => {
    const jd = jdOf(iso);
    const { dec, eqTime } = solarPosition(jd + 0.5);
    const noonUtc = 720 - 4 * lon - eqTime;
    // The publisher's own Asr equation: target altitude is acot(factor + tan|lat - dec|).
    const target = Math.atan(1 / (factor + Math.tan(Math.abs(lat - dec) * RAD))) / RAD;
    // "Apparent" adds the standard refraction correction at that altitude, which Part 2f found fits better.
    const h = apparent ? target - 0.0167 / Math.tan((target + 10.3 / (target + 5.11)) * RAD) : target;
    const cosH = (Math.sin(h * RAD) - Math.sin(lat * RAD) * Math.sin(dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
    if (cosH < -1 || cosH > 1) return null;
    const H = Math.acos(cosH) / RAD;
    return noonUtc + H * 4 + londonOffsetMin(iso);
  };

  say('column  factor  refraction  margin  exact                within 1 min         worst');
  for (const [col, factor] of [['asr', 1], ['asr_2', 2]]) {
    for (const apparent of [false, true]) {
      for (const margin of [0, 2]) {
        let e = 0;
        let w1 = 0;
        let worst = 0;
        let n = 0;
        for (const y of FUTURE) {
          for (const d of Object.keys(future[y]).sort()) {
            const v = asrMinutes(d, 51.5073, -0.12755, factor, apparent);
            if (v === null) continue;
            n += 1;
            const delta = Math.round(v + margin) - toMin(future[y][d][col]);
            const a = Math.abs(delta);
            if (a === 0) e += 1;
            if (a <= 1) w1 += 1;
            if (a > worst) worst = a;
          }
        }
        say(
          `${col.padEnd(7)} ${String(factor).padStart(6)}  ${(apparent ? 'apparent' : 'geometric').padEnd(10)} ${String(margin).padStart(6)}  ${`${e} (${((100 * e) / n).toFixed(2)}%)`.padStart(19)} ${`${w1} (${((100 * w1) / n).toFixed(2)}%)`.padStart(19)} ${String(worst).padStart(5)}`
        );
      }
    }
  }
  say('');
  say('  adhan 4.4.6\'s own Asr at Charing Cross, for comparison, on the same fifty years:');
  for (const [col, madhab] of [['asr', 'Shafi'], ['asr_2', 'Hanafi']]) {
    const p = sunParams();
    p.madhab = adhan.Madhab[madhab];
    const coords = new adhan.Coordinates(51.5073, -0.12755);
    let e = 0;
    let w1 = 0;
    let worst = 0;
    let n = 0;
    for (const y of FUTURE) {
      for (const d of Object.keys(future[y]).sort()) {
        const pt = new adhan.PrayerTimes(coords, dayDate(d), p);
        const v = londonMinutesExact(pt.asr, d);
        if (v === null) continue;
        n += 1;
        const delta = Math.round(v) - toMin(future[y][d][col]);
        const a = Math.abs(delta);
        if (a === 0) e += 1;
        if (a <= 1) w1 += 1;
        if (a > worst) worst = a;
      }
    }
    say(`  ${col} vs adhan madhab=${madhab}: ${e}/${n} exact (${((100 * e) / n).toFixed(2)}%), ${w1} within 1 (${((100 * w1) / n).toFixed(2)}%), worst ${worst}`);
  }
}
say('');

say('== 3c.4 What the three options actually cost in bytes ==');
{
  const slots = Object.keys(table).sort();
  const buf = Buffer.from([...slots.map((s) => table[s].fajr), ...slots.map((s) => table[s].isha)]);
  say(`  Option A, the interval table (366 slots x 2 uint8): ${buf.length} raw, ${zlib.brotliCompressSync(buf).length} brotli`);
  say('    Needs a computed sun and a computed Asr in the app. Fajr and Isha exact where the sun is exact.');

  const packed = [];
  for (const y of FUTURE) {
    for (const d of Object.keys(future[y]).sort()) {
      for (const f of ['fajr', 'sunrise', 'dhuhr', 'asr', 'asr_2', 'magrib', 'isha']) packed.push(toMin(future[y][d][f]));
    }
  }
  const p16 = Buffer.alloc(packed.length * 2);
  packed.forEach((v, i) => p16.writeUInt16LE(v, i * 2));
  say(`  Option B, all fifty published years (uint16 minutes): ${p16.length} raw, ${zlib.brotliCompressSync(p16).length} brotli`);
  say('    Needs no computation at all. Every value is the authority\'s own digit. Expires in 2077.');

  const ten = [];
  for (const y of FUTURE.slice(0, 10)) {
    for (const d of Object.keys(future[y]).sort()) {
      for (const f of ['fajr', 'sunrise', 'dhuhr', 'asr', 'asr_2', 'magrib', 'isha']) ten.push(toMin(future[y][d][f]));
    }
  }
  const t16 = Buffer.alloc(ten.length * 2);
  ten.forEach((v, i) => t16.writeUInt16LE(v, i * 2));
  say(`  Option B', ten published years 2027 to 2036: ${t16.length} raw, ${zlib.brotliCompressSync(t16).length} brotli`);

  const oneYear = Buffer.from(JSON.stringify(future[2027]));
  say(`  Option C, one fetched year as the app does today: ${oneYear.length} raw JSON, ${zlib.gzipSync(oneYear, { level: 9 }).length} gzip on the wire`);
  say('');
  say('  For scale, from R6: the app\'s 4.9 MB JS bundle and 67 MB release bundle.');
  const bBrotli = zlib.brotliCompressSync(p16).length;
  say(`  Option B is ${((100 * bBrotli) / (4.9 * 1024 * 1024)).toFixed(3)}% of the JS bundle and ${((100 * bBrotli) / (67 * 1024 * 1024)).toFixed(4)}% of the release bundle.`);
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part3c.txt', out + '\n');
console.log(out);
