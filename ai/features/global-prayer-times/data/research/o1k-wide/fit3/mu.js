// Mauritius: Jummah Masjid Port Louis 2026, 365 rows. Fit the base table,
// then characterize the derived (azaan/jamaat) columns and the regional
// adjustment encoding. Run: TZ=Indian/Mauritius node mu.js
import * as fs from 'node:fs';
import { loadAdhan, params, parseHHMM, bestMargin, evalFixed, secOfDay, scoreLine } from './lib.mjs';

const HOME = process.env.HOME;
const DATA = HOME + '/athan-gitree/census/o1k-wide/southernafrica2/data/jummahmasjid-mauritius-2026.json';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit3/mu.json';

const adhan = await loadAdhan();
const raw = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const isos = Object.keys(raw.rows).sort();
const rows = isos.map(iso => {
  const [y, m, d] = iso.split('-').map(Number);
  const r = raw.rows[iso];
  const mm = s => parseHHMM(s);
  return {
    iso, y, m, d,
    sehri: mm(r.sehri),
    fajrBegin: mm(r.fajr.begin), fajrAzaan: mm(r.fajr.azaan), fajrJamaat: mm(r.fajr.jamaat),
    sunriseStart: mm(r.sunrise.start), sunriseEnd: mm(r.sunrise.end),
    zawaalStart: mm(r.zawaal.start), zawaalEnd: mm(r.zawaal.end),
    zohrBegin: mm(r.zohr.begin),
    asrBegin: mm(r.asr.begin), asrAzaan: mm(r.asr.azaan), asrJamaat: mm(r.asr.jamaat),
    sunsetStart: mm(r.sunset.start), sunsetEnd: mm(r.sunset.end),
    maghrib: mm(r.maghrib),
    eshaBegin: mm(r.esha.begin), eshaAzaan: mm(r.esha.azaan), eshaJamaat: mm(r.esha.jamaat),
  };
});
console.log('rows', rows.length, rows[0].iso, '..', rows[rows.length - 1].iso);

const CITY = { lat: -20.1667, lon: 58.5 };
function computeAt(y, m, d, fajrA, ishaA, madhab) {
  const p = params(adhan, fajrA, ishaA);
  if (madhab) p.madhab = madhab;
  return new adhan.PrayerTimes(new adhan.Coordinates(CITY.lat, CITY.lon), new Date(y, m - 1, d), p);
}

function fitAngle(printed, lo, hi, step, pick) {
  let best = null;
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const ang = Math.round(a * 100) / 100;
    const sec = secOfDay(rows, (y, m, d) => computeAt(y, m, d, ang, ang), pick);
    const r = bestMargin(sec, printed);
    if (!best || r.exact > best.r.exact || (r.exact === best.r.exact && r.within1 > best.r.within1)) best = { angle: ang, r };
  }
  return best;
}
function refine(printed, pick, b) {
  let best = { angle: b.angle, r: evalFixed(secOfDay(rows, (y, m, d) => computeAt(y, m, d, b.angle, b.angle), pick), printed, b.r.margin, b.r.mode) };
  for (let a = b.angle - 0.1; a <= b.angle + 0.1 + 1e-9; a += 0.01) {
    const ang = Math.round(a * 100) / 100;
    const sec = secOfDay(rows, (y, m, d) => computeAt(y, m, d, ang, ang), pick);
    const r = bestMargin(sec, printed);
    if (r.exact > best.r.exact || (r.exact === best.r.exact && r.within1 > best.r.within1)) best = { angle: ang, r };
  }
  return best;
}

const out = { country: 'mu', publisher: raw.publisher, source: raw.source, rows: rows.length, span: [rows[0].iso, rows[rows.length - 1].iso], tz: 'Indian/Mauritius (UTC+4, no DST)', coords: CITY };

// angle fits for the three dawn/dusk astronomical-looking columns
out.fajr_begin = refine(rows.map(r => r.fajrBegin), t => t.fajr, fitAngle(rows.map(r => r.fajrBegin), 10, 22, 0.1, t => t.fajr));
out.esha_begin_angle = refine(rows.map(r => r.eshaBegin), t => t.isha, fitAngle(rows.map(r => r.eshaBegin), 8, 20, 0.1, t => t.isha));
out.sehri_angle = refine(rows.map(r => r.sehri), t => t.fajr, fitAngle(rows.map(r => r.sehri), 10, 24, 0.1, t => t.fajr));
console.log('fajr.begin', scoreLine('fajrBegin', out.fajr_begin.r), 'angle', out.fajr_begin.angle);
console.log('esha.begin as angle', scoreLine('eshaBegin', out.esha_begin_angle.r), 'angle', out.esha_begin_angle.angle);
console.log('sehri as angle', scoreLine('sehri', out.sehri_angle.r), 'angle', out.sehri_angle.angle);

// solar columns: sunrise start/end, sunset start/end, maghrib
const solar = {};
for (const [name, pick] of [['sunriseStart', t => t.sunrise], ['sunsetStart', t => t.maghrib], ['sunsetEnd', t => t.maghrib]]) {
  const col = { sunriseStart: 'sunriseStart', sunsetStart: 'sunsetStart', sunsetEnd: 'sunsetEnd' }[name];
  const sec = secOfDay(rows, (y, m, d) => computeAt(y, m, d, 90, 90), pick);
  solar[name] = bestMargin(sec, rows.map(r => r[col]));
}
solar.maghrib = solar.sunsetStart;
console.log('sunrise.start', scoreLine('sunriseStart', solar.sunriseStart));
console.log('sunset.start', scoreLine('sunsetStart', solar.sunsetStart));
console.log('sunset.end vs sunset event', scoreLine('sunsetEnd', solar.sunsetEnd));

// asr: Shafi and Hanafi
for (const [mad, name] of [[adhan.Madhab.Shafi, 'asr_shafi'], [adhan.Madhab.Hanafi, 'asr_hanafi']]) {
  const sec = secOfDay(rows, (y, m, d) => computeAt(y, m, d, 90, 90, mad), t => t.asr);
  solar[name] = bestMargin(sec, rows.map(r => r.asrBegin));
  console.log('asr.begin', name, scoreLine(name, solar[name]));
}

// noon family: zawaal/zohr vs transit
const noonSec = secOfDay(rows, (y, m, d) => {
  const st = new adhan.SolarTime(new Date(y, m - 1, d), new adhan.Coordinates(CITY.lat, CITY.lon));
  return new adhan.TimeComponents(st.transit).utcDate(y, m - 1, d);
}, t => t);
for (const name of ['zawaalStart', 'zawaalEnd', 'zohrBegin']) {
  solar[name] = bestMargin(noonSec, rows.map(r => r[name]));
  console.log(name, scoreLine(name, solar[name]));
}

// derived-column interval histograms
function hist(f) {
  const h = {};
  rows.forEach(r => { const v = f(r); h[v] = (h[v] || 0) + 1; });
  return h;
}
const intervals = {
  sehri_minus_fajrBegin: hist(r => r.sehri - r.fajrBegin),
  fajrAzaan_minus_begin: hist(r => r.fajrAzaan - r.fajrBegin),
  fajrJamaat_minus_begin: hist(r => r.fajrJamaat - r.fajrBegin),
  sunriseEnd_minus_start: hist(r => r.sunriseEnd - r.sunriseStart),
  sunsetEnd_minus_start: hist(r => r.sunsetEnd - r.sunsetStart),
  maghrib_minus_sunsetEnd: hist(r => r.maghrib - r.sunsetEnd),
  maghrib_minus_sunsetStart: hist(r => r.maghrib - r.sunsetStart),
  zawaalEnd_minus_start: hist(r => r.zawaalEnd - r.zawaalStart),
  zohrBegin_minus_zawaalEnd: hist(r => r.zohrBegin - r.zawaalEnd),
  asrAzaan_minus_begin: hist(r => r.asrAzaan - r.asrBegin),
  asrJamaat_minus_azaan: hist(r => r.asrJamaat - r.asrAzaan),
  eshaAzaan_minus_begin: hist(r => r.eshaAzaan - r.eshaBegin),
  eshaJamaat_minus_azaan: hist(r => r.eshaJamaat - r.eshaAzaan),
  eshaBegin_minus_maghrib: hist(r => r.eshaBegin - r.maghrib),
  fajrJamaat_minus_azaan: hist(r => r.fajrJamaat - r.fajrAzaan),
};
// esha.begin as fixed interval from maghrib: score the dominant interval
const domIsh = Number(Object.entries(intervals.eshaBegin_minus_maghrib).sort((a, b) => b[1] - a[1])[0][0]);
{
  let exact = 0, within1 = 0, worst = 0; const bad = [];
  rows.forEach(r => {
    const v = r.maghrib + domIsh;
    const diff = Math.abs(v - r.eshaBegin);
    if (diff === 0) exact++;
    if (diff <= 1) within1++;
    if (diff > worst) worst = diff;
    if (diff > 1) bad.push(r.iso + ':' + diff);
  });
  intervals.esha_begin_as_maghrib_plus = { interval: domIsh, exact, within1, worst, n: rows.length, bad: bad.slice(0, 10) };
  console.log('esha.begin = maghrib +' + domIsh + ':', 'exact', exact + '/' + rows.length, 'within1', within1, 'worst', worst, bad.length ? 'bad: ' + bad.slice(0, 5).join(' ') : '');
}
console.log('intervals:', JSON.stringify(intervals, null, 1));

out.solar_fits = solar;
out.intervals = intervals;
out.fixed_columns = {
  zohr_azaan: '12:45 fixed (365/365 per publisher note, verified in rows)',
  zohr_jamaat: '13:00 (313 days), 13:10 on Fridays (52 days)',
  asr_jamaat_minus_azaan: 15,
  esha_jamaat_minus_azaan: '15 (337 days), 10 (28 days)',
  fajr_jamaat_minus_azaan: '30 (295 days), 25 (70 days)',
};
out.regional_adjustments = {
  ...raw.regional_adjustments,
  encoding: 'publisher-stated, not per-town data in the bundle: each region tier carries TWO fixed minute adjustments, maghrib +n and sehri -n, symmetric; 3 tiers x 2 directions = 6 adjustments',
};
out.note = raw.note + ' | sehri column = fajr.begin - 10 (see intervals); sunrise.start/sunset.end bracket the -0.833 sunrise and sunset events (interval histograms)';
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('wrote', OUT);
