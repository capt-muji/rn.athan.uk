// R9: invert a whole published month for one city. Used where an authority prints a
// monthly table rather than a single day, which is stronger evidence than one row:
// a month separates a real angle (flat across the month) from a table that drifts.
//
// Input format, one line per day, tab separated:
//   day  fajr  sunrise  dhuhr  asr  maghrib  isha
import { readFileSync } from 'node:fs';
import { invertRow } from './solar-harness.mjs';

const TABLES = {
  'za-mjc-capetown-2026-09.tsv': {
    name: 'South Africa, Cape Town, Muslim Judicial Council',
    src: 'mjc.org.za/salaah-times/, 2026-09-30',
    lat: -33.9249, lng: 18.4241, tz: 2, y: 2026, m: 9,
  },
};

const stat = a => {
  const s = [...a].sort((x, y) => x - y);
  return { n: s.length, min: s[0], q1: s[Math.floor(0.25 * s.length)], median: s[Math.floor(0.5 * s.length)],
    q3: s[Math.floor(0.75 * s.length)], max: s[s.length - 1] };
};

for (const [file, t] of Object.entries(TABLES)) {
  const acc = { fajrAngle: [], sunriseAngle: [], dhuhrOffsetMin: [], asrFactor: [],
    maghribMinusSunsetMin: [], ishaAngle: [], ishaAfterMaghribMin: [] };
  for (const line of readFileSync(new URL('./' + file, import.meta.url), 'utf8').split('\n')) {
    const c = line.split('\t').map(s => s.trim());
    if (c.length !== 7 || !/^\d+$/.test(c[0])) continue;
    const [d, fajr, sunrise, dhuhr, asr, maghrib, isha] = c;
    const inv = invertRow({ y: t.y, m: t.m, d: +d, lat: t.lat, lng: t.lng, tz: t.tz,
      fajr, sunrise, dhuhr, asr, maghrib, isha });
    for (const k of Object.keys(acc)) if (inv[k] !== undefined) acc[k].push(inv[k]);
  }
  console.log(`\n=== ${t.name} ===\n${t.src}`);
  for (const [k, a] of Object.entries(acc)) if (a.length) console.log('  ', k.padEnd(24), JSON.stringify(stat(a)));
}
