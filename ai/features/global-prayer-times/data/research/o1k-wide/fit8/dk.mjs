// Job 3: Denmark's three-way split at Copenhagen (55.6761, 12.5683).
// Lines: mawaqeet Copenhagen year (claimed 18/15), Imam Ali 91 rows (Tehran
// 17.7/4.5, the page's own script), salah.dk + Khair al Bariya + DIT live days.
// Run: TZ=Europe/Copenhagen node dk.mjs
import fs from 'node:fs';
import { loadFlex, makeContext45, freeScan2D, amplitude, freezeDiag } from './lib8.mjs';
import { bestMargin } from './lib.mjs';

const HOME = process.env.HOME;
const N2 = HOME + '/athan-gitree/census/o1k-wide/nordics2/data/';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit8/dk-fit.json';
const LAT = 55.6761, LNG = 12.5683;
const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', asr2: 'asr_hanafi', maghrib: 'magrib', isha: 'isha' };

const sec = (dt) => (isNaN(dt.getTime()) ? null : dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds());
const angles = (a, b, s) => { const r = []; for (let v = a; v <= b + 1e-9; v += s) r.push(Math.round(v * 100) / 100); return r; };
const FRACS = [1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8, 1 / 9, 1 / 10, 1 / 11, 1 / 12];

function bestMarginOn(secArr, chartArr, idx) {
  const sv = [], cv = [];
  for (const i of idx) {
    if (secArr[i] === null || Number.isNaN(secArr[i]) || Number.isNaN(chartArr[i])) continue;
    sv.push(secArr[i]); cv.push(chartArr[i]);
  }
  if (sv.length === 0) return null;
  const r = bestMargin(Float64Array.from(sv), Int32Array.from(cv), { jMax: 60, m0: -15 });
  return { ...r, coverage: sv.length };
}

// ---- mawaqeet Copenhagen year ------------------------------------------------
async function mawaqeet() {
  const { slots } = loadFlex(N2 + 'no-mawaqeet-kobenhavn-2026.json', cols);
  const pack = await makeContext45(LAT, LNG, slots);
  const ctx = pack.ctx, n = slots.length;
  const all = [...Array(n).keys()];
  const chartF = slots.map((s) => s.chart.fajr), chartI = slots.map((s) => s.chart.isha);
  const fSec = [], iSec = [];
  for (let i = 0; i < n; i++) {
    const faT = ctx.hourAngle(i, -18, false);
    const sf = new Date(ctx.srDate[i].getTime() - (ctx.night[i] / 2) * 1000);
    fSec.push(sec(isNaN(faT.getTime()) || sf > faT ? sf : faT));
    iSec.push(sec(ctx.hourAngle(i, -15, true)));
  }
  const res = {
    tag: 'mawaqeet-copenhagen', rows: n,
    fajr: bestMarginOn(fSec, chartF, all),
    isha: bestMarginOn(iSec, chartI, all),
    solar: {
      sunrise: bestMarginOn(ctx.raw.sunrise, slots.map((s) => s.chart.sunrise), all),
      dhuhr: bestMarginOn(ctx.raw.dhuhr, slots.map((s) => s.chart.dhuhr), all),
      asrShafi: bestMarginOn(ctx.raw.asr1, slots.map((s) => s.chart.asr), all),
      asrHanafi: bestMarginOn(ctx.raw.asr2, slots.map((s) => s.chart.asr2), all),
      maghrib: bestMarginOn(ctx.raw.maghrib, slots.map((s) => s.chart.maghrib), all),
    },
    nullIshaDays: slots.filter((s) => Number.isNaN(s.chart.isha)).length,
    diagFajr: freezeDiag(slots, 'fajr'),
    amplitude: amplitude(pack, slots, { kind: 'portions', fajr: 1 / 2, isha: 1 / 7, fa: 18, is: 15 }),
  };
  return res;
}

// ---- Imam Ali year samples (Tehran method) -----------------------------------
async function imamAli() {
  const file = N2 + 'dk-imamali-copenhagen-2026-samples.json';
  const iaCols = { fajr: 'fajr', sunrise: 'sunrise', sunset: 'sunset', dhuhr: 'dhuhr', maghrib: 'magrib' };
  const { slots } = loadFlex(file, iaCols);
  const pack = await makeContext45(LAT, LNG, slots);
  const ctx = pack.ctx, n = slots.length;
  const all = [...Array(n).keys()];
  const fSec = slots.map((_, i) => sec(ctx.hourAngle(i, -17.7, false)));
  const mSec = slots.map((_, i) => sec(ctx.hourAngle(i, -4.5, true)));
  const sSec = slots.map((_, i) => sec(ctx.ssDate[i]));
  const res = {
    tag: 'imamali-copenhagen', rows: n,
    months: slots.map((s) => s.key.slice(0, 7)).filter((v, i, a) => a.indexOf(v) === i),
    fajr177: bestMarginOn(fSec, slots.map((s) => s.chart.fajr), all),
    fajr18: bestMarginOn(slots.map((_, i) => sec(ctx.hourAngle(i, -18, false))), slots.map((s) => s.chart.fajr), all),
    fajr177vs15: bestMarginOn(slots.map((_, i) => sec(ctx.hourAngle(i, -15, false))), slots.map((s) => s.chart.fajr), all),
    maghrib45: bestMarginOn(mSec, slots.map((s) => s.chart.maghrib), all),
    maghribAtSunset: bestMarginOn(sSec, slots.map((s) => s.chart.maghrib), all),
    sunsetCol: bestMarginOn(sSec, slots.map((s) => s.chart.sunset), all),
    dhuhr: bestMarginOn(ctx.raw.dhuhr, slots.map((s) => s.chart.dhuhr), all),
    sunrise: bestMarginOn(ctx.raw.sunrise, slots.map((s) => s.chart.sunrise), all),
  };
  return res;
}

// ---- single live days ---------------------------------------------------------
async function singleDays() {
  const pack = await makeContext45(LAT, LNG, [{ key: '2026-11-10', date: new Date(2026, 10, 10), chart: {} }]);
  const ctx = pack.ctx;
  const i = 0;
  const minOf = (dt) => (dt && !isNaN(dt.getTime?.())) ? Math.round(dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60) : null;
  const secToMin = (s) => Math.round((s / 60) * 10) / 10;
  const out = { day: '2026-11-10', publishers: {}, computed: {} };
  out.computed = {
    fajr15: minOf(ctx.hourAngle(i, -15, false)), fajr16: minOf(ctx.hourAngle(i, -16, false)),
    fajr17: minOf(ctx.hourAngle(i, -17, false)), fajr177: minOf(ctx.hourAngle(i, -17.7, false)),
    fajr18: minOf(ctx.hourAngle(i, -18, false)),
    sunrise: minOf(ctx.srDate[i]), dhuhr: secToMin(ctx.raw.dhuhr[i]),
    asr1: secToMin(ctx.raw.asr1[i]), asr2: secToMin(ctx.raw.asr2[i]),
    maghrib: secToMin(ctx.raw.maghrib[i]), maghrib45: minOf(ctx.hourAngle(i, -4.5, true)),
    isha15: minOf(ctx.hourAngle(i, -15, true)), isha16: minOf(ctx.hourAngle(i, -16, true)),
    isha17: minOf(ctx.hourAngle(i, -17, true)), isha18: minOf(ctx.hourAngle(i, -18, true)),
  };
  const pubs = [
    ['salah.dk', { fajr: '05:48', sunrise: '07:34', dhuhr: '11:55', asr: '13:47', asrHanafi: '14:20', maghrib: '16:12', isha: '17:59' }],
    ['khair-al-bariya', { fajr: '05:25', sunrise: '07:26', dhuhr: '11:59', asr: '13:53', maghrib: '16:21', isha: '18:08' }],
    ['dit-wakf', { fajr: '05:47', sunrise: '07:31', dhuhr: '11:55', asr: '13:48', maghrib: '16:15', isha: '17:52' }],
    ['adan.dk-snippet-unverified', { fajr: '05:26', sunrise: '11:54', dhuhr: '11:54', asr: '13:47', maghrib: '16:12', isha: '18:14' }],
    ['imamali-tehran', { fajr: '05:28', dhuhr: '11:54', maghrib: '16:41' }],
  ];
  const p2m = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  for (const [name, row] of pubs) {
    const diffs = {};
    for (const [p, v] of Object.entries(row)) diffs[p] = p2m(v) + ' vs ' + (out.computed[p] !== undefined ? fmt(out.computed[p]) : '-');
    out.publishers[name] = diffs;
  }
  function fmt(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.round(m) % 60).padStart(2, '0'); }
  return out;
}

const out = { job: 'fit8-dk', meta: { adhan: '4.4.6', lat: LAT, lng: LNG, tz: 'Europe/Copenhagen' } };
out.mawaqeet = await mawaqeet();
out.imamali = await imamAli();
out.singleDays = await singleDays();
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));

const m = out.mawaqeet;
console.log(`mawaqeet-copenhagen rows ${m.rows}  fajr 18/midnight-cap m${m.fajr.margin} ${m.fajr.mode}: exact ${m.fajr.exact}/${m.fajr.coverage} w1 ${m.fajr.within1}  | isha 15 m${m.isha.margin} ${m.isha.mode}: exact ${m.isha.exact}/${m.isha.coverage} w1 ${m.isha.within1}  | null isha days ${m.nullIshaDays}`);
for (const [k, v] of Object.entries(m.solar)) console.log(`  solar ${k} m${v.margin} ${v.mode} exact ${v.exact}/${v.coverage} w1 ${v.within1}`);
console.log(`  diagFajr ${JSON.stringify(m.diagFajr)}  amplitude ${JSON.stringify(m.amplitude)}`);
const a = out.imamali;
console.log(`imamali rows ${a.rows} months ${a.months.join(',')}  fajr17.7 m${a.fajr177.margin} ${a.fajr177.mode} exact ${a.fajr177.exact}/${a.fajr177.coverage} | fajr18 m${a.fajr18.margin} exact ${a.fajr18.exact} | maghrib4.5 m${a.maghrib45.margin} ${a.maghrib45.mode} exact ${a.maghrib45.exact}/${a.maghrib45.coverage} | maghrib=sunset m${a.maghribAtSunset.margin} exact ${a.maghribAtSunset.exact} | sunset col m${a.sunsetCol.margin} exact ${a.sunsetCol.exact}/${a.sunsetCol.coverage} | dhuhr m${a.dhuhr.margin} exact ${a.dhuhr.exact}/${a.dhuhr.coverage} | sunrise m${a.sunrise.margin} exact ${a.sunrise.exact}/${a.sunrise.coverage}`);
console.log('single day 2026-11-10 computed:', JSON.stringify(out.singleDays.computed));
for (const [name, diffs] of Object.entries(out.singleDays.publishers)) console.log(' ', name, JSON.stringify(diffs));
console.log('\nwrote dk-fit.json');
