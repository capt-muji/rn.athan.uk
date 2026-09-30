// R11 Part 3, the closed gap. The IFiS rule, stated and scored.
//
// The measurement that identifies it: at all five northern Swedish cities the printed DAY is
// exactly 300 minutes on 21 December and the printed NIGHT is exactly 300 minutes on 21 June,
// regardless of latitude. Kiruna's true 21 December day is 87 minutes and its true 21 June
// night does not exist at all. So IFiS applies a SYMMETRIC FIVE-HOUR FLOOR:
//
//   day   is never shorter than 300 minutes, centred on solar noon
//   night is never shorter than 300 minutes, centred on solar midnight
//
// and it first binds at 59.36 N, three hundredths of a degree above Stockholm. That is why
// R9's frozen-fraction rule reproduced Stockholm and Malmo to 1 minute and failed at Kiruna:
// at Stockholm the floor never engages so the true sunrise is printed, while at Kiruna it
// engages on 95 days and R9 measured the fraction against the TRUE night instead of the
// FLOORED one.
//
// Stage two, unchanged from R9 in shape: on days the 18-degree Fajr or 16-degree Isha has no
// solution, IFiS holds a fraction of the night. This script tests that fraction against the
// FLOORED night, which is the correction R9's Kiruna failure needed.
import { readFileSync, writeFileSync } from 'node:fs';
import { timeAtAngle, asrTime, midDay, toH, hm } from '../countries/solar-harness.mjs';

const SR_ANG = 1.65, FLOOR = 300, FAJR_ANG = 18, ISHA_ANG = 16, DHUHR_OFF = 5;
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const CITIES = [
  { name: 'Malmo', f: '../countries/se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  { name: 'Stockholm', f: '../countries/se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  { name: 'Umea', f: './se-umea.tsv', lat: 63.8258, lng: 20.2630 },
  { name: 'Lulea', f: './se-lulea.tsv', lat: 65.5848, lng: 22.1567 },
  { name: 'Gallivare', f: './se-gallivare.tsv', lat: 67.1333, lng: 20.6667 },
  { name: 'Pajala', f: './se-pajala.tsv', lat: 67.2117, lng: 23.3700 },
  { name: 'Kiruna', f: '../countries/se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
];
const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL(f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const st = a => {
  if (!a.length) return { n: 0, median: NaN, p90: NaN, max: NaN };
  const s = a.map(Math.abs).sort((x, y) => x - y);
  return { n: s.length, median: +s[Math.floor(s.length / 2)].toFixed(1), p90: +s[Math.floor(0.9 * s.length)].toFixed(1), max: +s[s.length - 1].toFixed(1) };
};

// The rule, implemented once, as a single clamp on the half-day.
//
// Sunrise and sunset are symmetric about solar noon by construction, so the whole floor
// reduces to bounding the half-day between 150 and 570 minutes: a day never shorter than
// 300 minutes and never longer than 1140, which is the same thing as a night never shorter
// than 300 minutes. On a polar day or a polar night the half-day is taken as its limit.
function halfDayMinutes(y, m, d, lat, lng, tz) {
  const sr = timeAtAngle(y, m, d, lat, lng, tz, SR_ANG, -1);
  if (sr !== null) return (midDay(y, m, d, lng, tz) - sr) * 60;
  // No solution: the sun is either up all day or down all day. Decide from the declination
  // against the latitude, which is what makes the sun circumpolar.
  const decl = timeAtAngle(y, m, d, 0, lng, tz, SR_ANG, -1) !== null ? null : null;
  const summer = (lat >= 0) === (m >= 4 && m <= 8);
  return summer ? 720 : 0;
}

function ifisDay(y, m, d, lat, lng, tz, fFrac, iFrac) {
  const noon = midDay(y, m, d, lng, tz);
  const half = Math.min(570, Math.max(150, halfDayMinutes(y, m, d, lat, lng, tz)));
  const sr = noon - half / 60, ss = noon + half / 60;
  const night = 24 - (ss - sr);
  const f18 = timeAtAngle(y, m, d, lat, lng, tz, FAJR_ANG, -1);
  const i16 = timeAtAngle(y, m, d, lat, lng, tz, ISHA_ANG, 1);
  const fajr = f18 !== null && f18 > sr - night * fFrac ? f18 : sr - night * fFrac;
  const isha = i16 !== null && i16 < ss + night * iFrac ? i16 : ss + night * iFrac;
  const rawHalf = halfDayMinutes(y, m, d, lat, lng, tz);
  return { fajr, sunrise: sr, dhuhr: noon + DHUHR_OFF / 60, asr: asrTime(y, m, d, lat, lng, tz, 1), maghrib: ss, isha, night: night * 60, floored: rawHalf > 570 || rawHalf < 150 };
}

// Fit the two fractions per city by minimising the median absolute error, then report.
console.log('=== the IFiS rule, fitted and scored per city, 365 days, minutes ===');
console.log('city        fitF    1/F    fitI    1/I    fajr med/p90/max      shuruk          dhohr         magrib          isha            flooredDays');
const summary = [];
for (const c of CITIES) {
  const rows = load(c.f);
  let bf = null, bfe = 1e9, bi = null, bie = 1e9;
  for (let fr = 0.13; fr <= 0.26; fr += 0.0005) {
    const e = [];
    for (const r of rows) { const o = ifisDay(2026, r.m, r.d, c.lat, c.lng, r.tz, fr, 0.18); e.push((toH(r.fajr) - o.fajr) * 60); }
    const m = st(e).median;
    if (m < bfe) { bfe = m; bf = fr; }
  }
  for (let ir = 0.11; ir <= 0.24; ir += 0.0005) {
    const e = [];
    for (const r of rows) { const o = ifisDay(2026, r.m, r.d, c.lat, c.lng, r.tz, bf, ir); e.push((toH(r.isha) - o.isha) * 60); }
    const m = st(e).median;
    if (m < bie) { bie = m; bi = ir; }
  }
  const e = { fajr: [], shuruk: [], dhohr: [], magrib: [], isha: [] };
  let fl = 0;
  const perDay = [];
  for (const r of rows) {
    const o = ifisDay(2026, r.m, r.d, c.lat, c.lng, r.tz, bf, bi);
    if (o.floored) fl++;
    e.fajr.push((toH(r.fajr) - o.fajr) * 60);
    e.shuruk.push((toH(r.shuruk) - o.sunrise) * 60);
    e.dhohr.push((toH(r.dhohr) - o.dhuhr) * 60);
    e.magrib.push((toH(r.magrib) - o.maghrib) * 60);
    e.isha.push((toH(r.isha) - o.isha) * 60);
    perDay.push({ m: r.m, d: r.d, printedFajr: r.fajr, ruleFajr: hm(o.fajr), printedIsha: r.isha, ruleIsha: hm(o.isha), printedNightMin: Math.round(1440 - (toH(r.magrib) - toH(r.shuruk)) * 60), ruleNightMin: Math.round(o.night), floored: o.floored });
  }
  const cell = k => { const s = st(e[k]); return `${String(s.median).padStart(4)}/${String(s.p90).padStart(5)}/${String(s.max).padEnd(6)}`; };
  console.log(`${c.name.padEnd(11)} ${bf.toFixed(4)} ${(1 / bf).toFixed(2)}  ${bi.toFixed(4)} ${(1 / bi).toFixed(2)}  ${['fajr', 'shuruk', 'dhohr', 'magrib', 'isha'].map(cell).join('  ')}  ${fl}`);
  summary.push({ city: c.name, lat: c.lat, lng: c.lng, fajrFraction: +bf.toFixed(4), ishaFraction: +bi.toFixed(4), flooredDays: fl, errors: Object.fromEntries(['fajr', 'shuruk', 'dhohr', 'magrib', 'isha'].map(k => [k, st(e[k])])) });
  if (c.name === 'Kiruna') writeFileSync(new URL('./se-kiruna-rule-perday.json', import.meta.url), JSON.stringify(perDay, null, 1));
}
writeFileSync(new URL('./sweden-rule-summary.json', import.meta.url), JSON.stringify(summary, null, 2));

// The day-length and night-length floors, stated as a single measurement.
console.log('\n=== the floor, verified on the two solstices ===');
console.log('city        21Jun printedNight  21Dec printedDay   trueJunNight   trueDecDay');
for (const c of CITIES) {
  const rows = load(c.f);
  const j = rows.find(r => r.m === 6 && r.d === 21), dd = rows.find(r => r.m === 12 && r.d === 21);
  const jn = 1440 - (toH(j.magrib) - toH(j.shuruk)) * 60, dday = (toH(dd.magrib) - toH(dd.shuruk)) * 60;
  const jsr = timeAtAngle(2026, 6, 21, c.lat, c.lng, 2, SR_ANG, -1), jss = timeAtAngle(2026, 6, 21, c.lat, c.lng, 2, SR_ANG, 1);
  const dsr = timeAtAngle(2026, 12, 21, c.lat, c.lng, 1, SR_ANG, -1), dss = timeAtAngle(2026, 12, 21, c.lat, c.lng, 1, SR_ANG, 1);
  console.log(`${c.name.padEnd(11)} ${jn.toFixed(0).padStart(8)} min      ${dday.toFixed(0).padStart(7)} min     ${jsr === null ? '   none' : (1440 - (jss - jsr) * 60).toFixed(0).padStart(6) + ' min'}   ${dsr === null ? '  none' : ((dss - dsr) * 60).toFixed(0).padStart(5) + ' min'}`);
}
