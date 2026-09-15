#!/usr/bin/env node
/*
 * Follow-up checks for the adhan MC study.
 * Run: cd ~/athan-research/adhan/harness && TZ=UTC node edges.cjs > ../results/edges.md
 * 1. seasonal coefficient tables, evaluated through adhan's own Astronomical functions
 * 2. Sydney DST boundary rows
 * 3. Tromso polar-edge rows with raw candidates, and polar-night Fajr/Isha vs 18 degrees
 * 4. Tromso Asr outliers with noon solar altitude
 * 5. leap-year runs (London 2024, Sydney 2024) against the cached endpoint
 * Sign convention: delta = adhan minus endpoint, minutes.
 */
'use strict';
if (process.env.TZ !== 'UTC') {
  console.error('Run with TZ=UTC');
  process.exit(1);
}
const fs = require('fs');
const path = require('path');
const os = require('os');
const adhan = require('adhan');
const LIB = path.join(__dirname, 'node_modules/adhan/lib/cjs');
const def = (m) => m.default || m;
const Astronomical = def(require(LIB + '/Astronomical.js'));
const SolarTime = def(require(LIB + '/SolarTime.js'));
const TimeComponents = def(require(LIB + '/TimeComponents.js'));
const { dayOfYear } = require(LIB + '/DateUtils.js');
const { CalculationMethod, Coordinates, PrayerTimes, Madhab, Shafaq, Rounding } = adhan;
const EP = path.join(os.homedir(), 'athan-research/endpoint');
const HOST = 'moonsighting.ahmedbukhamsin.sa';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const valid = (d) => d instanceof Date && !isNaN(d.getTime());
const out = [];
const P = (s = '') => out.push(s);

const dayDate = (y, i) => new Date(y, 0, 1 + i);
const label = (y, i) => {
  const d = new Date(Date.UTC(y, 0, 1 + i));
  return `${MON[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')}`;
};
function loadEP(city, y, m) {
  const file = `${EP}/${HOST}_${city}_${y}_m${m}.json`;
  if (!fs.existsSync(file)) return null;
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  return d.times.map((e, i) => {
    if (!e.day.startsWith(label(y, i))) throw new Error(`label mismatch ${file} ${i} ${e.day}`);
    const o = {};
    for (const [k, v] of Object.entries(e.times)) {
      const s = v.trim();
      const mm = /^(\d\d):(\d\d)$/.exec(s);
      o[k] = mm ? +mm[1] * 60 + +mm[2] : null;
      o[k + '_raw'] = s;
    }
    return o;
  });
}
const fmts = {};
function locMin(date, tz, y, i) {
  if (!valid(date)) return null;
  const f = fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }));
  const p = {};
  for (const x of f.formatToParts(date)) p[x.type] = x.value;
  const dd = (Date.UTC(+p.year, +p.month - 1, +p.day) - Date.UTC(y, 0, 1 + i)) / 864e5;
  return dd * 1440 + +p.hour * 60 + +p.minute + +p.second / 60;
}
const minuteOf = (d, tz, y, i) => {
  const v = locMin(d, tz, y, i);
  return v == null ? null : Math.floor(v + 1e-9);
};
function hhmm(date, tz, y, i) {
  const v = minuteOf(date, tz, y, i);
  if (v == null) return 'Invalid';
  const dd = Math.floor(v / 1440);
  const r = v - dd * 1440;
  const s = `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
  return dd === 0 ? s : `${s}(${dd > 0 ? '+' : ''}${dd}d)`;
}
function delta(a, e) {
  if (a == null || e == null) return null;
  let d = a - e;
  while (d > 720) d -= 1440;
  while (d <= -720) d += 1440;
  return d;
}
function stats(list) {
  const n = list.length;
  let eq0 = 0, a1 = 0, ge2 = 0, sum = 0, mn = Infinity, mx = -Infinity;
  const months = {};
  for (const { lab, d } of list) {
    if (d === 0) eq0++;
    else if (Math.abs(d) === 1) a1++;
    else {
      ge2++;
      months[lab.slice(0, 3)] = (months[lab.slice(0, 3)] || 0) + 1;
    }
    sum += d;
    mn = Math.min(mn, d);
    mx = Math.max(mx, d);
  }
  return { n, eq0, a1, ge2, min: n ? mn : '-', max: n ? mx : '-', mean: n ? (sum / n).toFixed(3) : '-', months: Object.entries(months).map(([k, v]) => `${k}:${v}`).join(' ') || '-' };
}
function mc(m, o = {}) {
  const p = CalculationMethod.MoonsightingCommittee();
  p.shafaq = [Shafaq.General, Shafaq.Abyad, Shafaq.Ahmer][m];
  p.madhab = m === 2 ? Madhab.Shafi : Madhab.Hanafi;
  if (o.rounding) p.rounding = o.rounding;
  return p;
}
function candidates(lat, lon, y, i, shafaq) {
  const date = dayDate(y, i);
  const tomorrow = dayDate(y, i + 1);
  const coords = new Coordinates(lat, lon);
  const st = new SolarTime(date, coords);
  const st2 = new SolarTime(tomorrow, coords);
  const u = (x, d) => new TimeComponents(x).utcDate(d.getFullYear(), d.getMonth(), d.getDate());
  const sunrise = u(st.sunrise, date);
  const sunset = u(st.sunset, date);
  const night = (u(st2.sunrise, tomorrow) - sunset) / 1000;
  const doy = dayOfYear(date);
  return {
    st, sunrise, sunset,
    f18: u(st.hourAngle(-18, false), date),
    i18: u(st.hourAngle(-18, true), date),
    fSeason: Astronomical.seasonAdjustedMorningTwilight(lat, doy, y, sunrise),
    iSeason: Astronomical.seasonAdjustedEveningTwilight(lat, doy, y, sunset, shafaq),
    f7: new Date(sunrise.getTime() - (night / 7) * 1000),
    i7: new Date(sunset.getTime() + (night / 7) * 1000),
  };
}

// ---------- 1. coefficient tables via adhan's own functions ----------
P('## E1. Seasonal model minutes, evaluated with adhan 4.4.6 Astronomical.seasonAdjusted*Twilight (2026, northern hemisphere)');
P('');
P('Anchor days: dyy 0 = 21 Dec (a), dyy 91 = 22 Mar (b), dyy 137 = 7 May (c), dyy 183 = 22 Jun (d). Fajr = minutes before sunrise, Isha = minutes after sunset.');
P('');
const base = new Date(Date.UTC(2026, 5, 1, 12, 0, 0));
const anchorDoy = { a: 355, b: 81, c: 127, d: 173 }; // doy + 10 = dyy (mod 365) for 2026
const LATS = [0, 21.4225, 40.7128, 51.5072, 53.75, 55, 59.9139];
P('| lat | series | a (dyy 0) | b (dyy 91) | c (dyy 137) | d (dyy 183) | year min | year max |');
P('|---|---|---|---|---|---|---|---|');
for (const lat of LATS) {
  const series = {
    fajr: (doy) => (base - Astronomical.seasonAdjustedMorningTwilight(lat, doy, 2026, base)) / 60000,
    'isha General': (doy) => (Astronomical.seasonAdjustedEveningTwilight(lat, doy, 2026, base, Shafaq.General) - base) / 60000,
    'isha Abyad': (doy) => (Astronomical.seasonAdjustedEveningTwilight(lat, doy, 2026, base, Shafaq.Abyad) - base) / 60000,
    'isha Ahmer': (doy) => (Astronomical.seasonAdjustedEveningTwilight(lat, doy, 2026, base, Shafaq.Ahmer) - base) / 60000,
  };
  for (const [name, fn] of Object.entries(series)) {
    let mn = Infinity, mx = -Infinity;
    for (let doy = 1; doy <= 365; doy++) {
      const v = fn(doy);
      mn = Math.min(mn, v);
      mx = Math.max(mx, v);
    }
    P(`| ${lat} | ${name} | ${['a', 'b', 'c', 'd'].map((k) => fn(anchorDoy[k]).toFixed(2)).join(' | ')} | ${mn.toFixed(2)} | ${mx.toFixed(2)} |`);
  }
}
P('');
P('Raw coefficient formula values (no rounding) at the FAQ 2.10 Blackburn latitude, for several candidate latitudes:');
P('');
P('| lat | fajr a b c d | general a b c d | abyad a b c d | ahmer a b c d |');
P('|---|---|---|---|---|');
for (const lat of [53.7, 53.75, 53.8]) {
  const L = lat / 55;
  const f = [75 + 28.65 * L, 75 + 19.44 * L, 75 + 32.74 * L, 75 + 48.1 * L];
  const g = [75 + 25.6 * L, 75 + 2.05 * L, 75 - 9.21 * L, 75 + 6.14 * L];
  const w = [75 + 25.6 * L, 75 + 7.16 * L, 75 + 36.84 * L, 75 + 81.84 * L];
  const r = [62 + 17.4 * L, 62 - 7.16 * L, 62 + 5.12 * L, 62 + 19.44 * L];
  P(`| ${lat} | ${f.map((x) => x.toFixed(2)).join(' ')} | ${g.map((x) => x.toFixed(2)).join(' ')} | ${w.map((x) => x.toFixed(2)).join(' ')} | ${r.map((x) => x.toFixed(2)).join(' ')} |`);
}

// ---------- 2. Sydney DST boundary ----------
P('');
P('## E2. Sydney DST boundary (m0)');
P('');
const offFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Sydney', timeZoneName: 'shortOffset', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
P('| date | zone offset at 12:00 UTC-ish local noon | endpoint fajr dhuhr maghrib | adhan fajr dhuhr maghrib | Δ dhuhr |');
P('|---|---|---|---|---|');
{
  const E = loadEP('sydney', 2026, 0);
  for (const i of [91, 92, 93, 94, 95, 273, 274, 275, 276, 277]) {
    const t = new PrayerTimes(new Coordinates(-33.8688, 151.2093), dayDate(2026, i), mc(0));
    const noonUTC = new Date(Date.UTC(2026, 0, 1 + i, 2, 0, 0));
    const off = offFmt.formatToParts(noonUTC).find((x) => x.type === 'timeZoneName').value;
    const d = delta(minuteOf(t.dhuhr, 'Australia/Sydney', 2026, i), E[i].dhuhr);
    P(`| ${label(2026, i)} | ${off} | ${E[i].fajr_raw} ${E[i].dhuhr_raw} ${E[i].maghrib_raw} | ${['fajr', 'dhuhr', 'maghrib'].map((p) => hhmm(t[p], 'Australia/Sydney', 2026, i)).join(' ')} | ${d} |`);
  }
}

// ---------- 3. Tromso polar edges ----------
P('');
P('## E3. Tromso 69.6492 N polar-edge days: endpoint m0 vs adhan (Unresolved) and adhan raw candidates');
P('');
P('| date | endpoint F S D A M I | adhan F S D A M I | f18 | fSeason | f7 | sunrise | sunset | i7 | iSeason(General) | i18 |');
P('|---|---|---|---|---|---|---|---|---|---|---|');
{
  const lat = 69.6492, lon = 18.9553, tz = 'Europe/Oslo';
  const E = loadEP('tromso', 2026, 0);
  const days = [];
  for (let i = 8; i <= 20; i++) days.push(i);
  for (let i = 132; i <= 142; i++) days.push(i);
  for (let i = 202; i <= 212; i++) days.push(i);
  for (let i = 322; i <= 334; i++) days.push(i);
  for (const i of days) {
    const t = new PrayerTimes(new Coordinates(lat, lon), dayDate(2026, i), mc(0));
    const c = candidates(lat, lon, 2026, i, Shafaq.General);
    P(`| ${label(2026, i)} | ${PRAYERS.map((p) => E[i][p + '_raw']).join(' ')} | ${PRAYERS.map((p) => hhmm(t[p], tz, 2026, i)).join(' ')} | ${['f18', 'fSeason', 'f7', 'sunrise', 'sunset', 'i7', 'iSeason', 'i18'].map((k) => hhmm(c[k], tz, 2026, i)).join(' | ')} |`);
  }
  // polar-night days: endpoint has fajr but adhan invalid -> compare with raw 18 degree candidates
  const lf = [], li = [];
  const noRiseDays = [];
  for (let i = 0; i < 365; i++) {
    const t = new PrayerTimes(new Coordinates(lat, lon), dayDate(2026, i), mc(0));
    if (!valid(t.fajr) && E[i].fajr != null) {
      const c = candidates(lat, lon, 2026, i, Shafaq.General);
      const r18f = new Date(Math.round(c.f18.getTime() / 60000) * 60000);
      const r18i = new Date(Math.round(c.i18.getTime() / 60000) * 60000);
      lf.push({ lab: label(2026, i), d: delta(minuteOf(r18f, tz, 2026, i), E[i].fajr) });
      li.push({ lab: label(2026, i), d: delta(minuteOf(r18i, tz, 2026, i), E[i].isha) });
      noRiseDays.push(label(2026, i));
    }
  }
  const sf = stats(lf), si = stats(li);
  P('');
  P(`Days where endpoint prints Fajr/Isha but adhan (Unresolved) returns Invalid: ${noRiseDays.length} (${noRiseDays[0]} .. ${noRiseDays[noRiseDays.length - 1]}).`);
  P(`On those days, raw 18° time rounded to nearest minute minus endpoint: Fajr n=${sf.n} Δ=0 ${sf.eq0}, |Δ|=1 ${sf.a1}, |Δ|≥2 ${sf.ge2}, min ${sf.min}, max ${sf.max}; Isha n=${si.n} Δ=0 ${si.eq0}, |Δ|=1 ${si.a1}, |Δ|≥2 ${si.ge2}, min ${si.min}, max ${si.max}.`);
  // existence mismatches
  const mism = [];
  for (let i = 0; i < 365; i++) {
    const t = new PrayerTimes(new Coordinates(lat, lon), dayDate(2026, i), mc(0));
    for (const p of PRAYERS) {
      const a = valid(t[p]);
      const e = E[i][p] != null;
      if (a !== e) mism.push(`${label(2026, i)} ${p}: adhan ${a ? hhmm(t[p], tz, 2026, i) : 'Invalid'} / endpoint ${E[i][p + '_raw']}`);
    }
  }
  P('');
  P(`Existence mismatches (one side has a time, the other does not): ${mism.length}`);
  P('');
  const grouped = {};
  for (const s of mism) {
    const key = s.split(':')[0].replace(/^\w+ \d+ /, '');
    (grouped[key] = grouped[key] || []).push(s);
  }
  for (const [k, v] of Object.entries(grouped)) P(`- ${k}: ${v.length} days; first ${v[0]}; last ${v[v.length - 1]}`);
  const nonFajrIsha = mism.filter((s) => !/ (fajr|isha):/.test(s));
  P('');
  P('Sunrise/maghrib existence mismatches in full:');
  for (const s of nonFajrIsha) P(`- ${s}`);
}

// ---------- 4. Tromso Asr outliers ----------
P('');
P('## E4. Tromso Asr outliers (m0 Hanafi): endpoint vs adhan, with noon solar altitude from adhan SolarCoordinates');
P('');
P('| date | endpoint asr | adhan asr | Δ | noon altitude ° | endpoint sunrise / maghrib |');
P('|---|---|---|---|---|---|');
{
  const lat = 69.6492, lon = 18.9553, tz = 'Europe/Oslo';
  const E = loadEP('tromso', 2026, 0);
  for (const i of [318, 319, 320, 321, 322, 323, 324, 325, 326, 14, 15, 16, 17, 18, 19, 20, 21]) {
    const t = new PrayerTimes(new Coordinates(lat, lon), dayDate(2026, i), mc(0));
    const st = new SolarTime(dayDate(2026, i), new Coordinates(lat, lon));
    const alt = Astronomical.altitudeOfCelestialBody(lat, st.solar.declination, 0);
    P(`| ${label(2026, i)} | ${E[i].asr_raw} | ${hhmm(t.asr, tz, 2026, i)} | ${delta(minuteOf(t.asr, tz, 2026, i), E[i].asr)} | ${alt.toFixed(2)} | ${E[i].sunrise_raw} / ${E[i].maghrib_raw} |`);
  }
}

// ---------- 5. leap years ----------
P('');
P('## E5. Leap-year check (2024): adhan MC (Nearest) minus endpoint');
P('');
P('| city | method | prayer | n | Δ=0 | \\|Δ\\|=1 | \\|Δ\\|≥2 | min | max | mean | \\|Δ\\|≥2 by month |');
P('|---|---|---|---|---|---|---|---|---|---|---|');
for (const [city, lat, lon, tz, methods] of [['london', 51.5072, -0.1276, 'Europe/London', [0, 1, 2]], ['sydney', -33.8688, 151.2093, 'Australia/Sydney', [0]]]) {
  for (const m of methods) {
    const E = loadEP(city, 2024, m);
    if (!E) {
      P(`| ${city} | m${m} | (no cached 2024 table) |`);
      continue;
    }
    for (const p of PRAYERS) {
      const l = [];
      for (let i = 0; i < E.length; i++) {
        const t = new PrayerTimes(new Coordinates(lat, lon), dayDate(2024, i), mc(m));
        const d = delta(minuteOf(t[p], tz, 2024, i), E[i][p]);
        if (d != null) l.push({ lab: label(2024, i), d });
      }
      const s = stats(l);
      P(`| ${city} | m${m} | ${p} | ${s.n} | ${s.eq0} | ${s.a1} | ${s.ge2} | ${s.min} | ${s.max} | ${s.mean} | ${s.months} |`);
    }
  }
}
{
  const q = JSON.parse(fs.readFileSync(`${EP}/${HOST}_london_2024_m0.json`, 'utf8')).query;
  P('');
  P(`London 2024 cached query parameters: ${JSON.stringify(q)}`);
}
process.stdout.write(out.join('\n') + '\n');
