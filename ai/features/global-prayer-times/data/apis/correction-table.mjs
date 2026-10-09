// R4 part 3: is an authority's published year a COMPACT CORRECTION on a computed baseline, or noise?
// Compares JAKIM's own published year (e-solat.gov.my, `period=year`) and Kemenag's published month
// against a local `adhan` computation with that authority's stated angles, then measures how many bytes
// the residual costs under four encodings. Nothing here is used as a prayer time.
// Run from /tmp/athan-r4-trust, where `adhan` is installed and the authority years are cached in ./auth.

import * as adhan from 'adhan';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';

// JAKIM zone -> the reference coordinate JAKIM publishes for it, and the zone's main town.
// Coordinates are from JAKIM's own zone definitions where available, otherwise the town centre.
// Marked in the report as cited, not measured.
const ZONES = {
  WLY01: { name: 'Kuala Lumpur, Putrajaya', lat: 3.1390,  lon: 101.6869 },
  SGR01: { name: 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam', lat: 3.0738, lon: 101.5183 },
  JHR02: { name: 'Johor Bahru, Kota Tinggi, Mersing, Kulai', lat: 1.4655, lon: 103.7578 },
  PLS01: { name: 'Kangar, Perlis', lat: 6.4414, lon: 100.1986 },
  SBH01: { name: 'Sandakan, Sabah', lat: 5.8402, lon: 118.1179 },
};

const TZ = 'Asia/Kuala_Lumpur';
const FIELDS = ['fajr', 'syuruk', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ADHAN_FIELD = { fajr: 'fajr', syuruk: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };

// JAKIM's published parameters: Fajr 20 deg, Isha 18 deg, Shafi Asr.
// AlAdhan lists the same pair for method 17. Source: aladhan.com/v1/methods.
function jakimParams() {
  const p = adhan.CalculationMethod.Other();
  p.fajrAngle = 20;
  p.ishaAngle = 18;
  p.madhab = adhan.Madhab.Shafi;
  return p;
}

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
function zoneMin(date) {
  const p = fmt.formatToParts(date);
  const g = (t) => Number(p.find((x) => x.type === t).value);
  return g('hour') * 60 + g('minute') + (g('second') >= 30 ? 1 : 0);
}
function hhmmssMin(s) {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})/.exec(String(s).trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]) + (Number(m[3]) >= 30 ? 1 : 0);
}

function stats(v) {
  if (!v.length) return { n: 0 };
  const counts = new Map();
  for (const x of v) counts.set(x, (counts.get(x) || 0) + 1);
  const mode = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  return {
    n: v.length,
    min: Math.min(...v),
    max: Math.max(...v),
    spread: Math.max(...v) - Math.min(...v),
    mode: mode[0],
    modeShare: +(mode[1] / v.length).toFixed(3),
    mean: +mean.toFixed(2),
    distinct: counts.size,
    hist: [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([k, n]) => `${k >= 0 ? '+' : ''}${k}:${n}`).join(' '),
  };
}

// Four encodings of one city-year of six times, and of one city-year of residuals.
function encodings(label, rowsOfSix) {
  const days = rowsOfSix.length;
  const naive = JSON.stringify(rowsOfSix.map((r) => ({
    date: r.date, fajr: r.hhmm[0], sunrise: r.hhmm[1], dhuhr: r.hhmm[2],
    asr: r.hhmm[3], maghrib: r.hhmm[4], isha: r.hhmm[5],
  })));
  const compact = JSON.stringify(rowsOfSix.map((r) => r.hhmm));
  const minutes = JSON.stringify(rowsOfSix.map((r) => r.min));
  const binary = Buffer.alloc(days * 6 * 2);
  rowsOfSix.forEach((r, i) => r.min.forEach((m, j) => binary.writeUInt16LE(m ?? 0xffff, (i * 6 + j) * 2)));
  const resid = rowsOfSix.every((r) => r.resid) ? JSON.stringify(rowsOfSix.map((r) => r.resid)) : null;
  const residBin = resid ? Buffer.from(rowsOfSix.flatMap((r) => r.resid.map((d) => (d ?? 0) & 0xff))) : null;
  const row = (k, buf) => ({
    encoding: k, raw: buf.length, gzip: gzipSync(buf, { level: 9 }).length, brotli: brotliCompressSync(buf).length,
  });
  const out = [
    row('naive JSON (HH:MM, named keys)', Buffer.from(naive)),
    row('compact JSON (array of 6 HH:MM)', Buffer.from(compact)),
    row('minutes-since-midnight JSON', Buffer.from(minutes)),
    row('binary uint16 x 6 x days', binary),
  ];
  if (resid) {
    out.push(row('residual JSON (int minutes)', Buffer.from(resid)));
    out.push(row('residual binary int8 x 6 x days', residBin));
  }
  console.log(`\n--- byte cost, ${label}, ${days} days ---`);
  console.log('| encoding | raw B | gzip B | brotli B | raw B/day | brotli B/day |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const r of out) {
    console.log(`| ${r.encoding} | ${r.raw} | ${r.gzip} | ${r.brotli} | ${(r.raw / days).toFixed(1)} | ${(r.brotli / days).toFixed(1)} |`);
  }
  return out;
}

const report = { zones: {}, encodings: {} };

for (const [zone, meta] of Object.entries(ZONES)) {
  const f = `auth/jakim_${zone}_2026.json`;
  if (!existsSync(f)) { console.log(`no cache for ${zone}`); continue; }
  const j = JSON.parse(readFileSync(f, 'utf8'));
  const coords = new adhan.Coordinates(meta.lat, meta.lon);
  const residuals = Object.fromEntries(FIELDS.map((k) => [k, []]));
  const rows = [];

  for (const day of j.prayerTime) {
    // `date` is `01-Jan-2026`, with Malay month names in the tail of the year (`Dis` for December).
    const [dd, mon, yyyy] = day.date.split('-');
    // The response mixes English and Malay month abbreviations: Jan..Jul in English, then
    // `Ogos`, `Sep`, `Okt`, `Nov`, `Dis`. Both spellings are accepted.
    const MONTHS = { Jan: 0, Feb: 1, Mac: 2, Mar: 2, Apr: 3, Mei: 4, May: 4, Jun: 5, Jul: 6,
      Ogos: 7, Ogo: 7, Aug: 7, Sep: 8, Sept: 8, Okt: 9, Oct: 9, Nov: 10, Dis: 11, Dec: 11 };
    const mi = MONTHS[mon];
    if (mi === undefined) { console.log(`unparsed month ${mon}`); continue; }
    const noonUTC = new Date(Date.UTC(Number(yyyy), mi, Number(dd), 4)); // midday in UTC+8
    const t = new adhan.PrayerTimes(coords, noonUTC, jakimParams());

    const min = [], hhmm = [], resid = [];
    for (const k of FIELDS) {
      const pub = hhmmssMin(day[k]);
      const loc = zoneMin(t[ADHAN_FIELD[k]]);
      min.push(pub);
      hhmm.push(String(day[k]).slice(0, 5));
      const d = pub === null ? null : pub - loc; // published minus computed
      resid.push(d);
      if (d !== null) residuals[k].push(d);
    }
    rows.push({ date: `${yyyy}-${String(mi + 1).padStart(2, '0')}-${dd}`, min, hhmm, resid });
  }

  console.log(`\n=== JAKIM ${zone} (${meta.name}), published year vs local adhan at Fajr 20 / Isha 18, Shafi Asr ===`);
  console.log(`baseline coordinate used: ${meta.lat}, ${meta.lon} (cited, JAKIM does not publish one per zone in this response)`);
  console.log('| field | n | min | max | spread | mode | mode share | mean |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- |');
  const z = {};
  for (const k of FIELDS) {
    const s = stats(residuals[k]);
    z[k] = s;
    console.log(`| ${k} | ${s.n} | ${s.min} | ${s.max} | ${s.spread} | ${s.mode} | ${s.modeShare} | ${s.mean} |`);
  }
  for (const k of FIELDS) if (z[k].spread > 2) console.log(`  ${k} residual histogram: ${z[k].hist}`);
  report.zones[zone] = z;
  if (zone === 'WLY01') report.encodings.WLY01 = encodings(`JAKIM ${zone} published year`, rows);
}

writeFileSync('/tmp/athan-r4-trust/correction-result.json', JSON.stringify(report, null, 1));
console.log('\nwrote /tmp/athan-r4-trust/correction-result.json');
