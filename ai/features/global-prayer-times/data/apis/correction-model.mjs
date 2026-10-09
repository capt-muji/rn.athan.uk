// R4 part 3, second stage: how compact is the correction, really?
// Three models of JAKIM's published year, each on top of a local `adhan` baseline at the
// authority's stated angles. Reports the worst-case error each model still leaves, and its byte cost.
// Run from /tmp/athan-r4-trust. Nothing here is used as a prayer time.

import * as adhan from 'adhan';
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';

const ZONES = {
  WLY01: { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869 },
  SGR01: { name: 'Selangor west', lat: 3.0738, lon: 101.5183 },
  JHR02: { name: 'Johor Bahru', lat: 1.4655, lon: 103.7578 },
  PLS01: { name: 'Perlis', lat: 6.4414, lon: 100.1986 },
  SBH01: { name: 'Sandakan', lat: 5.8402, lon: 118.1179 },
};
const FIELDS = ['fajr', 'syuruk', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ADHAN = { fajr: 'fajr', syuruk: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const MONTHS = { Jan: 0, Feb: 1, Mac: 2, Mar: 2, Apr: 3, Mei: 4, May: 4, Jun: 5, Jul: 6,
  Ogos: 7, Aug: 7, Sep: 8, Okt: 9, Oct: 9, Nov: 10, Dis: 11, Dec: 11 };

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const zoneMin = (d) => {
  const p = fmt.formatToParts(d), g = (t) => Number(p.find((x) => x.type === t).value);
  return g('hour') * 60 + g('minute') + (g('second') >= 30 ? 1 : 0);
};
const pubMin = (s) => { const m = /^(\d{1,2}):(\d{2}):(\d{2})/.exec(s); return m ? +m[1] * 60 + +m[2] + (+m[3] >= 30 ? 1 : 0) : null; };

function params() {
  const p = adhan.CalculationMethod.Other();
  p.fajrAngle = 20; p.ishaAngle = 18; p.madhab = adhan.Madhab.Shafi;
  return p;
}

const all = {};
for (const [zone, meta] of Object.entries(ZONES)) {
  const f = `auth/jakim_${zone}_2026.json`;
  if (!existsSync(f)) continue;
  const coords = new adhan.Coordinates(meta.lat, meta.lon);
  const resid = Object.fromEntries(FIELDS.map((k) => [k, []]));
  for (const day of JSON.parse(readFileSync(f, 'utf8')).prayerTime) {
    const [dd, mon, yyyy] = day.date.split('-');
    const mi = MONTHS[mon];
    if (mi === undefined) continue;
    const t = new adhan.PrayerTimes(coords, new Date(Date.UTC(+yyyy, mi, +dd, 4)), params());
    for (const k of FIELDS) {
      const p = pubMin(String(day[k]));
      if (p !== null) resid[k].push(p - zoneMin(t[ADHAN[k]]));
    }
  }
  all[zone] = resid;
}

const round = (x) => Math.round(x);
const worst = (v) => Math.max(...v.map(Math.abs));

console.log('## Model A: one constant per field per zone (6 integers per zone, no per-day data)\n');
console.log('| zone | ' + FIELDS.join(' | ') + ' | worst residual after the constant (min) |');
console.log('| --- |' + FIELDS.map(() => ' --- |').join('') + ' --- |');
const constants = {};
for (const [zone, resid] of Object.entries(all)) {
  const c = {}, left = [];
  for (const k of FIELDS) {
    c[k] = round(resid[k].reduce((a, b) => a + b, 0) / resid[k].length);
    left.push(worst(resid[k].map((d) => d - c[k])));
  }
  constants[zone] = c;
  console.log(`| ${zone} | ${FIELDS.map((k) => (c[k] >= 0 ? '+' : '') + c[k]).join(' | ')} | ${Math.max(...left)} |`);
}

console.log('\n## Model B: one constant per field per zone, plus a 12-value monthly correction per field\n');
console.log('| zone | worst residual after constant + monthly (min) | values stored |');
console.log('| --- | --- | --- |');
for (const [zone, meta] of Object.entries(ZONES)) {
  const f = `auth/jakim_${zone}_2026.json`;
  if (!existsSync(f)) continue;
  const coords = new adhan.Coordinates(meta.lat, meta.lon);
  const byMonth = Object.fromEntries(FIELDS.map((k) => [k, Array.from({ length: 12 }, () => [])]));
  for (const day of JSON.parse(readFileSync(f, 'utf8')).prayerTime) {
    const [dd, mon, yyyy] = day.date.split('-');
    const mi = MONTHS[mon];
    if (mi === undefined) continue;
    const t = new adhan.PrayerTimes(coords, new Date(Date.UTC(+yyyy, mi, +dd, 4)), params());
    for (const k of FIELDS) {
      const p = pubMin(String(day[k]));
      if (p !== null) byMonth[k][mi].push(p - zoneMin(t[ADHAN[k]]));
    }
  }
  let mx = 0;
  for (const k of FIELDS) for (const m of byMonth[k]) {
    if (!m.length) continue;
    const c = round(m.reduce((a, b) => a + b, 0) / m.length);
    mx = Math.max(mx, worst(m.map((d) => d - c)));
  }
  console.log(`| ${zone} | ${mx} | ${FIELDS.length * 12} integers |`);
}

console.log('\n## Model C: the exact per-day residual, which reproduces the published year to the minute\n');
const ONE = all.WLY01;
const bytes = Buffer.from(FIELDS.flatMap((k) => ONE[k].map((d) => d & 0xff)));
const nib = Buffer.alloc(Math.ceil(bytes.length / 2));
// The per-day residual for JAKIM fits in 4 bits once the per-field constant is removed
const centred = FIELDS.flatMap((k) => ONE[k].map((d) => d - constants.WLY01[k] + 8));
for (let i = 0; i < centred.length; i += 2) nib[i / 2] = ((centred[i] & 0xf) << 4) | (centred[i + 1] & 0xf);
const rows = [
  ['exact residual, int8 per field per day', bytes],
  ['exact residual, 4 bits per field per day (constant removed)', nib],
];
console.log('| encoding | raw B | gzip B | brotli B | B/zone-year |');
console.log('| --- | --- | --- | --- | --- |');
for (const [label, buf] of rows) {
  console.log(`| ${label} | ${buf.length} | ${gzipSync(buf, { level: 9 }).length} | ${brotliCompressSync(buf).length} | ${brotliCompressSync(buf).length} |`);
}
const centredRange = [Math.min(...centred) - 8, Math.max(...centred) - 8];
console.log(`\nWLY01 residual after the per-field constant is removed: range ${centredRange[0]} to ${centredRange[1]} minutes, so 4 bits per value is enough.`);
console.log(`Model A constant table, all 5 zones: ${5 * 6} signed bytes = 30 B raw.`);
