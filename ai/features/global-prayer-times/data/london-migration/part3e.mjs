// R13 Part 3e: the complete offline reconstruction, and the Asr shift the corpus exposes.
//
// Part 3d found that the publisher's OWN transcribed equations leave a residual bounded in
// [-0.5, +0.5] minutes with mean 0.000 across all fifty published future years, which means those
// equations ARE the generator. This part states the whole-timetable result on all seven fields, and
// then measures a finding that fell out of 3d.1: the Asr margin the generator applies changed
// between the 2026 timetable and the 2027 one.

import fs from 'node:fs';
import zlib from 'node:zlib';
import { readLupt } from './xlsx.mjs';
import { readElm, readLpt, toMin, ELM_YEARS } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const FUTURE = [];
for (let y = 2027; y <= 2076; y += 1) FUTURE.push(y);
const future = {};
for (const y of FUTURE) future[y] = readLupt(`./lupt/LUPT-${y}.xlsx`);

const RAD = Math.PI / 180;

/** The publisher's own solar position, transcribed from londonsalahtimes.com/technical. */
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

const sunEvents = (iso, lat = 51.5073, lon = -0.12755) => {
  const { dec, E } = solar(jdOf(iso) + 0.5);
  const noon = 720 - 4 * lon - E + londonOffsetMin(iso);
  const hourAngle = (altDeg) => {
    const c = (Math.sin(altDeg * RAD) - Math.sin(lat * RAD) * Math.sin(dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
    if (c < -1 || c > 1) return null;
    return (Math.acos(c) / RAD) * 4;
  };
  const H = hourAngle(-0.833333);
  const asrAt = (factor) => {
    const h = hourAngle(Math.atan(1 / (factor + Math.tan(Math.abs(lat - dec) * RAD))) / RAD);
    return h === null ? null : noon + h;
  };
  return { noon, sunrise: H === null ? null : noon - H, sunset: H === null ? null : noon + H, asr1: asrAt(1), asr2: asrAt(2) };
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

const table = tableOf(future[2027]);
table['02-29'] = tableOf(future[2028])['02-29'];

const FIELDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'asr_2', 'magrib', 'isha'];

/**
 * The whole timetable for one day, from the interval table, the publisher's equations and its
 * documented margins. `asrMargin` is a parameter because 3d.1 measured that it changed in 2027.
 */
const reconstruct = (iso, asrMargin) => {
  const ev = sunEvents(iso);
  const iv = table[iso.slice(5)];
  if (!iv || ev.sunrise === null) return null;
  const R = (x) => Math.floor(x + 0.5);
  const sunrise = R(ev.sunrise - 3);
  const magrib = R(ev.sunset + 3);
  return {
    sunrise,
    magrib,
    dhuhr: R(ev.noon + 5),
    asr: R(ev.asr1 + asrMargin),
    asr_2: R(ev.asr2 + asrMargin),
    fajr: sunrise + 3 - iv.fajr,
    isha: magrib - 3 + iv.isha,
  };
};

say('R13 PART 3e: the complete offline reconstruction of London, and the 2027 Asr shift');
say('');

say('== 3e.1 All seven published fields, fifty published future years, nothing fetched ==');
say('Inputs: the 366-slot interval table (732 bytes) and the publisher\'s own equations. No network.');
say('');
say('field      n       exact                 within 1 min          worst  beyond 1 min');
{
  const stat = {};
  for (const f of FIELDS) stat[f] = { e: 0, w1: 0, worst: 0, beyond: 0, misses: [] };
  let n = 0;
  for (const y of FUTURE) {
    for (const d of Object.keys(future[y]).sort()) {
      const got = reconstruct(d, 2);
      if (!got) continue;
      n += 1;
      for (const f of FIELDS) {
        const delta = got[f] - toMin(future[y][d][f]);
        const a = Math.abs(delta);
        const s = stat[f];
        if (a === 0) s.e += 1;
        if (a <= 1) s.w1 += 1;
        else {
          s.beyond += 1;
          if (s.misses.length < 20) s.misses.push(`${d}${delta > 0 ? '+' : ''}${delta}`);
        }
        if (a > s.worst) s.worst = a;
      }
    }
  }
  let tE = 0;
  let tW = 0;
  let tB = 0;
  for (const f of FIELDS) {
    const s = stat[f];
    tE += s.e;
    tW += s.w1;
    tB += s.beyond;
    say(
      `${f.padEnd(9)} ${String(n).padStart(6)}  ${`${s.e} (${((100 * s.e) / n).toFixed(3)}%)`.padStart(20)}  ${`${s.w1} (${((100 * s.w1) / n).toFixed(3)}%)`.padStart(20)}  ${String(s.worst).padStart(5)}  ${s.beyond}${s.misses.length ? ` -> ${s.misses.join(' ')}` : ''}`
    );
  }
  say('');
  say(`SEVEN FIELDS: ${tE} of ${n * 7} exact (${((100 * tE) / (n * 7)).toFixed(3)}%), ${tW} within 1 minute (${((100 * tW) / (n * 7)).toFixed(3)}%), ${tB} beyond 1 minute.`);
  say(`That is ${n} days, 2027 to 2076, reproduced from ${732} bytes of table plus arithmetic.`);
}
say('');

say('== 3e.2 The Asr margin changed between the 2026 timetable and the 2027 one ==');
say('3d.1 fitted margin 0 on the ELM PDFs 2015 to 2026 and margin +2 on the .xlsx years 2027 to 2076.');
say('The published digits are the evidence, so this compares them directly: the same calendar slot,');
say('the same Asr column, in consecutive published years.');
say('');
say('The Asr interval after solar noon, which removes the sun and leaves the margin:');
say('slot     2025 asr  2026 asr  2027 asr   2026 gap-from-noon  2027 gap-from-noon  shift');
{
  const elm25 = readElm(2025);
  const elm26 = readElm(2026);
  for (const slot of ['01-15', '03-15', '06-21', '09-15', '12-15']) {
    const n26 = sunEvents(`2026-${slot}`).noon;
    const n27 = sunEvents(`2027-${slot}`).noon;
    const a25 = toMin(elm25[`2025-${slot}`].asr);
    const a26 = toMin(elm26[`2026-${slot}`].asr);
    const a27 = toMin(future[2027][`2027-${slot}`].asr);
    const g26 = a26 - n26;
    const g27 = a27 - n27;
    say(
      `${slot}   ${String(a25).padStart(8)}  ${String(a26).padStart(8)}  ${String(a27).padStart(8)}   ${g26.toFixed(2).padStart(18)}  ${g27.toFixed(2).padStart(18)}  ${(g27 - g26).toFixed(2).padStart(5)}`
    );
  }
}
say('');
say('Across the whole year, mean (published Asr minus computed Asr) per published year:');
{
  const rows = [];
  for (const y of ELM_YEARS.filter((v) => v >= 2015)) {
    const r = readElm(y);
    const d1 = [];
    const d2 = [];
    for (const d of Object.keys(r).sort()) {
      const ev = sunEvents(d);
      d1.push(toMin(r[d].asr) - ev.asr1);
      d2.push(toMin(r[d].asr_2) - ev.asr2);
    }
    rows.push([`ELM PDF ${y}`, d1.reduce((a, b) => a + b, 0) / d1.length, d2.reduce((a, b) => a + b, 0) / d2.length]);
  }
  {
    const r = readLpt();
    const d1 = [];
    const d2 = [];
    for (const d of Object.keys(r).sort()) {
      const ev = sunEvents(d);
      d1.push(toMin(r[d].asr) - ev.asr1);
      d2.push(toMin(r[d].asr_2) - ev.asr2);
    }
    rows.push(['app API 2026', d1.reduce((a, b) => a + b, 0) / d1.length, d2.reduce((a, b) => a + b, 0) / d2.length]);
  }
  for (const y of [2027, 2028, 2035, 2050, 2076]) {
    const r = future[y];
    const d1 = [];
    const d2 = [];
    for (const d of Object.keys(r).sort()) {
      const ev = sunEvents(d);
      d1.push(toMin(r[d].asr) - ev.asr1);
      d2.push(toMin(r[d].asr_2) - ev.asr2);
    }
    rows.push([`.xlsx ${y}`, d1.reduce((a, b) => a + b, 0) / d1.length, d2.reduce((a, b) => a + b, 0) / d2.length]);
  }
  say('source            Mithl 1 margin   Mithl 2 margin');
  for (const [label, m1, m2] of rows) say(`${label.padEnd(17)} ${m1.toFixed(3).padStart(14)}   ${m2.toFixed(3).padStart(14)}`);
}
say('');
say('== 3e.3 What the shift is worth to a London user, day by day ==');
say('The same calendar slot in the app\'s own 2026 year against the published 2027 year, Asr only,');
say('with the sun\'s own annual drift removed by comparing each to its own year\'s computed Asr.');
{
  const lpt = readLpt();
  const deltas = [];
  for (const d of Object.keys(lpt).sort()) {
    const slot = d.slice(5);
    if (slot === '02-29') continue;
    const r27 = future[2027][`2027-${slot}`];
    if (!r27) continue;
    const g26 = toMin(lpt[d].asr) - sunEvents(d).asr1;
    const g27 = toMin(r27.asr) - sunEvents(`2027-${slot}`).asr1;
    deltas.push(Math.round(g27) - Math.round(g26));
  }
  const hist = new Map();
  for (const v of deltas) hist.set(v, (hist.get(v) ?? 0) + 1);
  say(`  Asr margin shift, 2026 to 2027, distribution over ${deltas.length} slots: ${[...hist.entries()].sort().map(([k, v]) => `${k >= 0 ? '+' : ''}${k}: ${v} days`).join(', ')}`);
  say('  This is the provider\'s own change, not the app\'s. It arrives whether v2.0 ships or not.');
}
say('');

say('== 3e.4 Byte cost of the offline London, stated once ==');
{
  const slots = Object.keys(table).sort();
  const buf = Buffer.from([...slots.map((s) => table[s].fajr), ...slots.map((s) => table[s].isha)]);
  const rle = (arr) => {
    const runs = [];
    for (const v of arr) {
      if (runs.length && runs[runs.length - 1][0] === v) runs[runs.length - 1][1] += 1;
      else runs.push([v, 1]);
    }
    return runs;
  };
  const rleBuf = Buffer.from([...rle(slots.map((s) => table[s].fajr)).flat(), ...rle(slots.map((s) => table[s].isha)).flat()]);
  say(`  366 slots, two uint8 arrays:   ${buf.length} raw, ${zlib.gzipSync(buf, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(buf).length} brotli`);
  say(`  the same, run-length encoded:  ${rleBuf.length} raw, ${zlib.gzipSync(rleBuf, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(rleBuf).length} brotli`);
  say(`  Fajr runs: ${rle(slots.map((s) => table[s].fajr)).length}, Isha runs: ${rle(slots.map((s) => table[s].isha)).length}`);
  say(`  Fajr range: ${Math.min(...slots.map((s) => table[s].fajr))} to ${Math.max(...slots.map((s) => table[s].fajr))} minutes`);
  say(`  Isha range: ${Math.min(...slots.map((s) => table[s].isha))} to ${Math.max(...slots.map((s) => table[s].isha))} minutes`);
  say('  Both fit uint8, so the table needs no encoding cleverness at all.');
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part3e.txt', out + '\n');
console.log(out);
