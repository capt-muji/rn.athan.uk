#!/usr/bin/env node
/*
 * adhan@4.4.6 CalculationMethod.MoonsightingCommittee() vs the moonsighting endpoint
 * (moonsighting.ahmedbukhamsin.sa/time_json.php, cached under ~/athan-research/endpoint/).
 *
 * Run:  cd ~/athan-research/adhan/harness && TZ=UTC node compare.cjs
 * TZ=UTC matters: adhan reads the calendar date from the Date's *local* components,
 * so the process zone must be UTC for new Date(2026, 0, 1+i) to mean that civil date.
 *
 * Sign convention everywhere: delta = adhan minus endpoint, in minutes.
 * Output: ../results/summary.json and ../results/tables.md
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
const {
  CalculationMethod, Coordinates, PrayerTimes, Madhab, Shafaq, Rounding,
  HighLatitudeRule, PolarCircleResolution,
} = adhan;

const EP = path.join(os.homedir(), 'athan-research/endpoint');
const OUT = path.join(__dirname, '..', 'results');
fs.mkdirSync(OUT, { recursive: true });
const HOST = 'moonsighting.ahmedbukhamsin.sa';
const YEAR = 2026;
const NDAYS = 365;
const CITIES = [
  ['london', 51.5072, -0.1276, 'Europe/London'],
  ['makkah', 21.4225, 39.8262, 'Asia/Riyadh'],
  ['jakarta', -6.2088, 106.8456, 'Asia/Jakarta'],
  ['cape-town', -33.9249, 18.4241, 'Africa/Johannesburg'],
  ['sydney', -33.8688, 151.2093, 'Australia/Sydney'],
  ['new-york', 40.7128, -74.006, 'America/New_York'],
  ['toronto', 43.6532, -79.3832, 'America/Toronto'],
  ['oslo', 59.9139, 10.7522, 'Europe/Oslo'],
  ['helsinki', 60.1699, 24.9384, 'Europe/Helsinki'],
  ['anchorage', 61.2181, -149.9003, 'America/Anchorage'],
  ['reykjavik', 64.1466, -21.9426, 'Atlantic/Reykjavik'],
  ['tromso', 69.6492, 18.9553, 'Europe/Oslo'],
].map(([name, lat, lon, tz]) => ({ name, lat, lon, tz }));
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const METHODS = {
  0: { label: 'm0 General+Hanafi', shafaq: Shafaq.General, madhab: Madhab.Hanafi },
  1: { label: 'm1 Abyad+Hanafi', shafaq: Shafaq.Abyad, madhab: Madhab.Hanafi },
  2: { label: 'm2 Ahmer+Shafi', shafaq: Shafaq.Ahmer, madhab: Madhab.Shafi },
};
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayDate = (i) => new Date(YEAR, 0, 1 + i); // local == UTC under TZ=UTC
const dayLabel = (i) => {
  const d = new Date(Date.UTC(YEAR, 0, 1 + i));
  return `${MON[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')}`;
};
const valid = (d) => d instanceof Date && !isNaN(d.getTime());

// ---------- endpoint ----------
function loadEP(city, m) {
  const file = `${EP}/${HOST}_${city}_${YEAR}_m${m}.json`;
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (d.times.length !== NDAYS) throw new Error(`${file}: ${d.times.length} days`);
  return d.times.map((e, i) => {
    if (!e.day.startsWith(dayLabel(i))) throw new Error(`label mismatch ${city} ${i} ${e.day}`);
    const o = { day: e.day };
    for (const [k, v] of Object.entries(e.times)) {
      const s = v.trim();
      const mm = /^(\d\d):(\d\d)$/.exec(s);
      o[k] = mm ? +mm[1] * 60 + +mm[2] : null;
      o[k + '_raw'] = s;
    }
    return o;
  });
}

// ---------- local time helpers ----------
const fmts = {};
/** minutes (with seconds as fraction) from local 00:00 of day i, in zone tz; null if invalid */
function locMin(date, tz, i) {
  if (!valid(date)) return null;
  const f = fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }));
  const p = {};
  for (const x of f.formatToParts(date)) p[x.type] = x.value;
  const dd = (Date.UTC(+p.year, +p.month - 1, +p.day) - Date.UTC(YEAR, 0, 1 + i)) / 864e5;
  return dd * 1440 + +p.hour * 60 + +p.minute + +p.second / 60;
}
function hhmm(date, tz, i) {
  const v = locMin(date, tz, i);
  if (v == null) return 'Invalid';
  const mins = Math.floor(v + 1e-9);
  const dd = Math.floor(mins / 1440);
  const r = mins - dd * 1440;
  const s = `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
  return dd === 0 ? s : `${s}(${dd > 0 ? '+' : ''}${dd}d)`;
}
/** adhan minus endpoint, wrapped to (-720, 720]; endpoint shows after-midnight times as 00:xx */
function delta(a, e) {
  if (a == null || e == null) return null;
  let d = a - e;
  while (d > 720) d -= 1440;
  while (d <= -720) d += 1440;
  return d;
}
/** mimic adhan roundedMinute (uses UTC seconds only, ignores ms) */
function roundVariant(date, mode) {
  if (!valid(date)) return date;
  const s = date.getUTCSeconds();
  let off;
  if (mode === 'nearest') off = s >= 30 ? 60 - s : -s;
  else if (mode === 'floor') off = -s;
  else if (mode === 'up') off = 60 - s; // adhan Rounding.Up: always +60-s, even at s=0
  else if (mode === 'ceil') off = s === 0 ? 0 : 60 - s;
  else throw new Error(mode);
  return new Date(date.getTime() + off * 1000);
}
const minuteOf = (date, tz, i) => {
  const v = locMin(date, tz, i);
  return v == null ? null : Math.floor(v + 1e-9);
};

// ---------- adhan ----------
function mcParams(m, o = {}) {
  const p = CalculationMethod.MoonsightingCommittee();
  p.shafaq = o.shafaq || METHODS[m].shafaq;
  p.madhab = o.madhab || METHODS[m].madhab;
  p.rounding = o.rounding || Rounding.Nearest;
  if (o.zeroAdj) p.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  if (o.hlr) p.highLatitudeRule = o.hlr;
  if (o.pcr) p.polarCircleResolution = o.pcr;
  return p;
}
const pt = (lat, lon, i, params) => new PrayerTimes(new Coordinates(lat, lon), dayDate(i), params);

/** raw (unrounded) candidates, built from adhan's own internal modules */
function candidates(lat, lon, i, shafaq) {
  const date = dayDate(i);
  const tomorrow = dayDate(i + 1);
  const coords = new Coordinates(lat, lon);
  const st = new SolarTime(date, coords);
  const st2 = new SolarTime(tomorrow, coords);
  const u = (x, d) => new TimeComponents(x).utcDate(d.getFullYear(), d.getMonth(), d.getDate());
  const sunrise = u(st.sunrise, date);
  const sunset = u(st.sunset, date);
  const tSunrise = u(st2.sunrise, tomorrow);
  const night = (tSunrise - sunset) / 1000;
  const doy = dayOfYear(date);
  return {
    sunrise, sunset, transit: u(st.transit, date),
    f18: u(st.hourAngle(-18, false), date),
    i18: u(st.hourAngle(-18, true), date),
    fSeason: Astronomical.seasonAdjustedMorningTwilight(lat, doy, YEAR, sunrise),
    iSeason: Astronomical.seasonAdjustedEveningTwilight(lat, doy, YEAR, sunset, shafaq),
    f7: new Date(sunrise.getTime() - (night / 7) * 1000),
    i7: new Date(sunset.getTime() + (night / 7) * 1000),
    fajrMinusSeason: null,
  };
}
const laterOf = (...ds) => {
  const v = ds.filter(valid);
  return v.length ? new Date(Math.max(...v.map(Number))) : new Date(NaN);
};
const earlierOf = (...ds) => {
  const v = ds.filter(valid);
  return v.length ? new Date(Math.min(...v.map(Number))) : new Date(NaN);
};

// ---------- stats ----------
function stats(list) {
  const n = list.length;
  let eq0 = 0, a1 = 0, ge2 = 0, sum = 0, mn = Infinity, mx = -Infinity;
  const months = {};
  const worst = [];
  for (const { i, d } of list) {
    if (d === 0) eq0++;
    else if (Math.abs(d) === 1) a1++;
    else {
      ge2++;
      const mo = dayLabel(i).slice(0, 3);
      months[mo] = (months[mo] || 0) + 1;
      worst.push([dayLabel(i), d]);
    }
    sum += d;
    mn = Math.min(mn, d);
    mx = Math.max(mx, d);
  }
  worst.sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
  return {
    n, eq0, abs1: a1, ge2,
    min: n ? mn : null, max: n ? mx : null, mean: n ? +(sum / n).toFixed(3) : null,
    ge2Months: months, worst: worst.slice(0, 6),
  };
}
const fmtMonths = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(' ') || '-';
const fmtNum = (x) => (x == null ? '-' : String(x));

// ---------- main comparison ----------
const summary = { generated: new Date().toISOString(), adhanVersion: require(path.join(__dirname, 'node_modules/adhan/package.json')).version, main: {}, rounding: {}, offsets: {}, isha: {}, asr: {}, rules: {}, hlrInvariance: {}, pcr: {}, lat60: {}, highLatDays: [] };
const md = [];
const P = (s = '') => md.push(s);

const EPD = {};
for (const c of CITIES) for (const m of [0, 1, 2]) EPD[`${c.name}_${m}`] = loadEP(c.name, m);

// 1. main stats: library defaults (Rounding.Nearest) with the m0/m1/m2 mapping
P('## 1. Main: adhan MC (library defaults, Rounding.Nearest, PolarCircleResolution.Unresolved) minus endpoint, minutes');
P('');
P('| city | prayer | method | n | Δ=0 | \\|Δ\\|=1 | \\|Δ\\|≥2 | min | max | mean | \\|Δ\\|≥2 by month | E missing | A invalid |');
P('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const c of CITIES) {
  for (const m of [0, 1, 2]) {
    const E = EPD[`${c.name}_${m}`];
    const per = Object.fromEntries(PRAYERS.map((p) => [p, []]));
    const miss = Object.fromEntries(PRAYERS.map((p) => [p, { E: 0, A: 0 }]));
    for (let i = 0; i < NDAYS; i++) {
      const t = pt(c.lat, c.lon, i, mcParams(m));
      for (const p of PRAYERS) {
        const a = minuteOf(t[p], c.tz, i);
        const e = E[i][p];
        if (e == null) miss[p].E++;
        if (a == null) miss[p].A++;
        const d = delta(a, e);
        if (d != null) per[p].push({ i, d });
      }
    }
    for (const p of PRAYERS) {
      const s = stats(per[p]);
      s.missing = miss[p];
      summary.main[`${c.name}|${p}|m${m}`] = s;
      P(`| ${c.name} | ${p} | m${m} | ${s.n} | ${s.eq0} | ${s.abs1} | ${s.ge2} | ${fmtNum(s.min)} | ${fmtNum(s.max)} | ${fmtNum(s.mean)} | ${fmtMonths(s.ge2Months)} | ${miss[p].E} | ${miss[p].A} |`);
    }
  }
}

// 2. rounding: exact-match counts per rounding rule (m0 for all prayers; asr/isha also m2)
P('');
P('## 2. Rounding: days with Δ=0 (and mean Δ) for each rounding rule applied to adhan\'s unrounded instant');
P('');
P('nearest = adhan Rounding.Nearest; up = adhan Rounding.Up (adds 60-s even at s=0); floor = Rounding.None truncated; ceil = Rounding.None ceiling.');
P('');
P('| city | prayer | method | n | nearest Δ=0 (mean) | floor Δ=0 (mean) | up Δ=0 (mean) | ceil Δ=0 (mean) |');
P('|---|---|---|---|---|---|---|---|');
const MODES = ['nearest', 'floor', 'up', 'ceil'];
for (const c of CITIES) {
  for (const m of [0, 2]) {
    const E = EPD[`${c.name}_${m}`];
    const acc = {};
    for (const p of PRAYERS) acc[p] = Object.fromEntries(MODES.map((k) => [k, []]));
    for (let i = 0; i < NDAYS; i++) {
      const t = pt(c.lat, c.lon, i, mcParams(m, { rounding: Rounding.None }));
      for (const p of PRAYERS) {
        if (m === 2 && !['asr', 'isha'].includes(p)) continue;
        for (const k of MODES) {
          const d = delta(minuteOf(roundVariant(t[p], k), c.tz, i), E[i][p]);
          if (d != null) acc[p][k].push({ i, d });
        }
      }
    }
    for (const p of PRAYERS) {
      if (m === 2 && !['asr', 'isha'].includes(p)) continue;
      const row = MODES.map((k) => stats(acc[p][k]));
      summary.rounding[`${c.name}|${p}|m${m}`] = Object.fromEntries(MODES.map((k, j) => [k, { eq0: row[j].eq0, abs1: row[j].abs1, ge2: row[j].ge2, mean: row[j].mean }]));
      P(`| ${c.name} | ${p} | m${m} | ${row[0].n} | ${row.map((s) => `${s.eq0} (${s.mean})`).join(' | ')} |`);
    }
  }
}

// 3. offsets: endpoint minus adhan's raw unadjusted instant (minutes with seconds)
P('');
P('## 3. Offsets: endpoint minute minus adhan raw instant with methodAdjustments zeroed (fractional minutes)');
P('');
P('If the endpoint adds k minutes and rounds to nearest, values sit in [k-0.5, k+0.5] give or take ephemeris differences.');
P('');
P('| city | quantity | n | min | max | mean | Δ=0 days with adj zeroed (nearest) | Δ=0 days with adhan adj (nearest) |');
P('|---|---|---|---|---|---|---|---|');
for (const c of CITIES) {
  const E = EPD[`${c.name}_0`];
  const q = { dhuhr: [], maghrib: [], sunrise: [], asr: [] };
  const z = { dhuhr: [], maghrib: [], sunrise: [], asr: [] };
  const w = { dhuhr: [], maghrib: [], sunrise: [], asr: [] };
  for (let i = 0; i < NDAYS; i++) {
    const raw = pt(c.lat, c.lon, i, mcParams(0, { rounding: Rounding.None, zeroAdj: true }));
    const zr = pt(c.lat, c.lon, i, mcParams(0, { zeroAdj: true }));
    const nr = pt(c.lat, c.lon, i, mcParams(0));
    const rawMap = { dhuhr: raw.dhuhr, maghrib: raw.sunset, sunrise: raw.sunrise, asr: raw.asr };
    for (const k of Object.keys(q)) {
      const e = E[i][k];
      const a = locMin(rawMap[k], c.tz, i);
      const d = delta(a, e);
      if (d != null) q[k].push(-d);
      const dz = delta(minuteOf(zr[k], c.tz, i), e);
      if (dz != null) z[k].push({ i, d: dz });
      const dw = delta(minuteOf(nr[k], c.tz, i), e);
      if (dw != null) w[k].push({ i, d: dw });
    }
  }
  for (const k of Object.keys(q)) {
    const v = q[k];
    const mean = v.reduce((s, x) => s + x, 0) / v.length;
    const r = { n: v.length, min: +Math.min(...v).toFixed(3), max: +Math.max(...v).toFixed(3), mean: +mean.toFixed(3), eq0ZeroAdj: stats(z[k]).eq0, eq0AdhanAdj: stats(w[k]).eq0 };
    summary.offsets[`${c.name}|${k}`] = r;
    P(`| ${c.name} | E.${k} − raw ${k === 'maghrib' ? 'sunset' : k} | ${r.n} | ${r.min} | ${r.max} | ${r.mean} | ${r.eq0ZeroAdj} | ${r.eq0AdhanAdj} |`);
  }
}

// 4. Isha shafaq mapping matrix and Asr mapping
P('');
P('## 4a. Mapping check, Isha: days with Δ=0 (mean Δ) for each adhan Shafaq against each endpoint method');
P('');
P('| city | endpoint | adhan General | adhan Abyad | adhan Ahmer |');
P('|---|---|---|---|---|');
for (const c of CITIES) {
  for (const m of [0, 1, 2]) {
    const E = EPD[`${c.name}_${m}`];
    const cells = [Shafaq.General, Shafaq.Abyad, Shafaq.Ahmer].map((sh) => {
      const l = [];
      for (let i = 0; i < NDAYS; i++) {
        const d = delta(minuteOf(pt(c.lat, c.lon, i, mcParams(m, { shafaq: sh })).isha, c.tz, i), E[i].isha);
        if (d != null) l.push({ i, d });
      }
      const s = stats(l);
      return { sh, eq0: s.eq0, n: s.n, mean: s.mean };
    });
    summary.isha[`${c.name}|m${m}`] = cells;
    P(`| ${c.name} | m${m} | ${cells.map((x) => `${x.eq0}/${x.n} (${x.mean})`).join(' | ')} |`);
  }
}
P('');
P('## 4b. Mapping check, Asr: days with Δ=0 (mean Δ)');
P('');
P('| city | endpoint field | adhan Shafi | adhan Hanafi |');
P('|---|---|---|---|');
for (const c of CITIES) {
  const rows = [['m0 asr', 0, 'asr'], ['m1 asr', 1, 'asr'], ['m2 asr', 2, 'asr'], ['m0 asr_s', 0, 'asr_s'], ['m0 asr_h', 0, 'asr_h']];
  for (const [label, m, key] of rows) {
    const E = EPD[`${c.name}_${m}`];
    const cells = [Madhab.Shafi, Madhab.Hanafi].map((mh) => {
      const l = [];
      for (let i = 0; i < NDAYS; i++) {
        const d = delta(minuteOf(pt(c.lat, c.lon, i, mcParams(m, { madhab: mh })).asr, c.tz, i), E[i][key]);
        if (d != null) l.push({ i, d });
      }
      const s = stats(l);
      return { mh, eq0: s.eq0, n: s.n, mean: s.mean };
    });
    summary.asr[`${c.name}|${label}`] = cells;
    P(`| ${c.name} | ${label} | ${cells.map((x) => `${x.eq0}/${x.n} (${x.mean})`).join(' | ')} |`);
  }
}

// 5. Fajr/Isha selection rules built from adhan's own candidates, rounded nearest
P('');
P('## 5. Fajr/Isha selection rules (candidates from adhan internals; rounded nearest; m0 and m2)');
P('');
P('- A = adhan as shipped.');
P('- S = seasonal function alone (no comparison).');
P('- R2 = documented <55°: Fajr later of (18°, seasonal), Isha earlier of (18°, seasonal); ≥55° also include 1/7 night; invalid candidates dropped.');
P('- R2s = R2 but 1/7-night candidates replaced by the same intervals computed at latitude 60° when |lat| > 60 ("slide down to 60").');
P('');
P('| city | prayer | method | rule | n | Δ=0 | \\|Δ\\|=1 | \\|Δ\\|≥2 | min | max | mean | \\|Δ\\|≥2 by month |');
P('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const c of CITIES) {
  for (const m of [0, 2]) {
    const E = EPD[`${c.name}_${m}`];
    const acc = {};
    for (const p of ['fajr', 'isha']) for (const r of ['A', 'S', 'R2', 'R2s']) acc[`${p}|${r}`] = [];
    for (let i = 0; i < NDAYS; i++) {
      const cand = candidates(c.lat, c.lon, i, METHODS[m].shafaq);
      const hi = Math.abs(c.lat) >= 55;
      let f7 = cand.f7, i7 = cand.i7;
      if (Math.abs(c.lat) > 60) {
        const c60 = candidates(Math.sign(c.lat) * 60, c.lon, i, METHODS[m].shafaq);
        f7 = new Date(cand.sunrise.getTime() - (c60.sunrise - c60.f7));
        i7 = new Date(cand.sunset.getTime() + (c60.i7 - c60.sunset));
      }
      const A = pt(c.lat, c.lon, i, mcParams(m));
      const rules = {
        'fajr|A': A.fajr,
        'isha|A': A.isha,
        'fajr|S': roundVariant(cand.fSeason, 'nearest'),
        'isha|S': roundVariant(cand.iSeason, 'nearest'),
        'fajr|R2': roundVariant(laterOf(cand.f18, cand.fSeason, hi ? cand.f7 : null), 'nearest'),
        'isha|R2': roundVariant(earlierOf(cand.i18, cand.iSeason, hi ? cand.i7 : null), 'nearest'),
        'fajr|R2s': roundVariant(laterOf(cand.f18, cand.fSeason, hi ? f7 : null), 'nearest'),
        'isha|R2s': roundVariant(earlierOf(cand.i18, cand.iSeason, hi ? i7 : null), 'nearest'),
      };
      for (const [k, v] of Object.entries(rules)) {
        const p = k.split('|')[0];
        const d = delta(minuteOf(v, c.tz, i), E[i][p]);
        if (d != null) acc[k].push({ i, d });
      }
    }
    for (const [k, l] of Object.entries(acc)) {
      const [p, r] = k.split('|');
      const s = stats(l);
      summary.rules[`${c.name}|${p}|m${m}|${r}`] = s;
      P(`| ${c.name} | ${p} | m${m} | ${r} | ${s.n} | ${s.eq0} | ${s.abs1} | ${s.ge2} | ${fmtNum(s.min)} | ${fmtNum(s.max)} | ${fmtNum(s.mean)} | ${fmtMonths(s.ge2Months)} |`);
    }
  }
}

// 6. HighLatitudeRule invariance for MC (all cities, all days, m0)
P('');
P('## 6. Does HighLatitudeRule change MC output? (instants differing from MiddleOfTheNight, all prayers, all days, m0)');
P('');
P('| city | SeventhOfTheNight | TwilightAngle | recommended() |');
P('|---|---|---|---|');
for (const c of CITIES) {
  let s7 = 0, ta = 0;
  for (let i = 0; i < NDAYS; i++) {
    const base = pt(c.lat, c.lon, i, mcParams(0, { hlr: HighLatitudeRule.MiddleOfTheNight }));
    const a = pt(c.lat, c.lon, i, mcParams(0, { hlr: HighLatitudeRule.SeventhOfTheNight }));
    const b = pt(c.lat, c.lon, i, mcParams(0, { hlr: HighLatitudeRule.TwilightAngle }));
    for (const p of PRAYERS) {
      const same = (x, y) => (valid(x) && valid(y) ? x.getTime() === y.getTime() : valid(x) === valid(y));
      if (!same(base[p], a[p])) s7++;
      if (!same(base[p], b[p])) ta++;
    }
  }
  const rec = HighLatitudeRule.recommended(new Coordinates(c.lat, c.lon));
  summary.hlrInvariance[c.name] = { SeventhOfTheNight: s7, TwilightAngle: ta, recommended: rec };
  P(`| ${c.name} | ${s7} | ${ta} | ${rec} |`);
}

// 7. PolarCircleResolution: full-year stats for the cities where it can matter
P('');
P('## 7. PolarCircleResolution effect (m0): Δ stats where both sides valid, plus validity counts');
P('');
P('| city | resolution | prayer | n | Δ=0 | \\|Δ\\|=1 | \\|Δ\\|≥2 | min | max | mean | A valid & E "-----" | A invalid & E valid |');
P('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const c of CITIES.filter((x) => x.lat > 59)) {
  const E = EPD[`${c.name}_0`];
  for (const r of [PolarCircleResolution.Unresolved, PolarCircleResolution.AqrabBalad, PolarCircleResolution.AqrabYaum]) {
    const per = Object.fromEntries(PRAYERS.map((p) => [p, []]));
    const cnt = Object.fromEntries(PRAYERS.map((p) => [p, { aOnly: 0, eOnly: 0 }]));
    for (let i = 0; i < NDAYS; i++) {
      const t = pt(c.lat, c.lon, i, mcParams(0, { pcr: r }));
      for (const p of PRAYERS) {
        const a = minuteOf(t[p], c.tz, i);
        const e = E[i][p];
        if (a != null && e == null) cnt[p].aOnly++;
        if (a == null && e != null) cnt[p].eOnly++;
        const d = delta(a, e);
        if (d != null) per[p].push({ i, d });
      }
    }
    for (const p of PRAYERS) {
      const s = stats(per[p]);
      summary.pcr[`${c.name}|${r}|${p}`] = { ...s, ...cnt[p] };
      P(`| ${c.name} | ${r} | ${p} | ${s.n} | ${s.eq0} | ${s.abs1} | ${s.ge2} | ${fmtNum(s.min)} | ${fmtNum(s.max)} | ${fmtNum(s.mean)} | ${cnt[p].aOnly} | ${cnt[p].eOnly} |`);
    }
  }
}

// 8. "slide down to 60": adhan MC evaluated at latitude 60 (same longitude) for cities above 60
P('');
P('## 8. adhan MC evaluated at latitude 60°, same longitude, for cities above 60° (m0)');
P('');
P('| city | prayer | n | Δ=0 | \\|Δ\\|=1 | \\|Δ\\|≥2 | min | max | mean |');
P('|---|---|---|---|---|---|---|---|---|');
for (const c of CITIES.filter((x) => x.lat > 60)) {
  const E = EPD[`${c.name}_0`];
  const per = Object.fromEntries(PRAYERS.map((p) => [p, []]));
  for (let i = 0; i < NDAYS; i++) {
    const t = pt(60, c.lon, i, mcParams(0));
    for (const p of PRAYERS) {
      const d = delta(minuteOf(t[p], c.tz, i), E[i][p]);
      if (d != null) per[p].push({ i, d });
    }
  }
  for (const p of PRAYERS) {
    const s = stats(per[p]);
    summary.lat60[`${c.name}|${p}`] = s;
    P(`| ${c.name} | ${p} | ${s.n} | ${s.eq0} | ${s.abs1} | ${s.ge2} | ${fmtNum(s.min)} | ${fmtNum(s.max)} | ${fmtNum(s.mean)} |`);
  }
}

// 9. named high-latitude days: endpoint vs every HighLatitudeRule x PolarCircleResolution
P('');
P('## 9. High-latitude days: endpoint (m0) vs adhan MC (General+Hanafi) for every HighLatitudeRule × PolarCircleResolution');
P('');
P('Local wall-clock times; (+1d)/(-1d) marks an instant on the next/previous local date. "Invalid" = adhan returned Invalid Date.');
const DAYS = [['tromso', 171], ['tromso', 354], ['reykjavik', 171], ['tromso', 0], ['tromso', 135], ['tromso', 140], ['tromso', 205], ['oslo', 171], ['helsinki', 171], ['anchorage', 171]];
for (const [city, i] of DAYS) {
  const c = CITIES.find((x) => x.name === city);
  const E = EPD[`${city}_0`][i];
  P('');
  P(`### ${city} ${dayLabel(i)} 2026 (lat ${c.lat})`);
  P('');
  P('| source | fajr | sunrise | dhuhr | asr | maghrib | isha |');
  P('|---|---|---|---|---|---|---|');
  P(`| endpoint m0 | ${PRAYERS.map((p) => E[p + '_raw']).join(' | ')} |`);
  const rec = { city, day: dayLabel(i), endpoint: Object.fromEntries(PRAYERS.map((p) => [p, E[p + '_raw']])), adhan: {} };
  for (const r of [PolarCircleResolution.Unresolved, PolarCircleResolution.AqrabBalad, PolarCircleResolution.AqrabYaum]) {
    for (const h of [HighLatitudeRule.MiddleOfTheNight, HighLatitudeRule.SeventhOfTheNight, HighLatitudeRule.TwilightAngle]) {
      const t = pt(c.lat, c.lon, i, mcParams(0, { pcr: r, hlr: h }));
      const row = PRAYERS.map((p) => hhmm(t[p], c.tz, i));
      rec.adhan[`${r}|${h}`] = row;
      P(`| adhan ${r} / ${h} | ${row.join(' | ')} |`);
    }
  }
  const cand = candidates(c.lat, c.lon, i, Shafaq.General);
  const cr = ['f18', 'fSeason', 'f7', 'sunrise', 'sunset', 'i7', 'iSeason', 'i18'].map((k) => `${k}=${hhmm(cand[k], c.tz, i)}`).join(', ');
  rec.candidates = cr;
  P('');
  P(`raw candidates (local, unrounded, floored to minute): ${cr}`);
  summary.highLatDays.push(rec);
}

fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 1));
fs.writeFileSync(path.join(OUT, 'tables.md'), md.join('\n') + '\n');
console.log('wrote', path.join(OUT, 'tables.md'), md.length, 'lines');
