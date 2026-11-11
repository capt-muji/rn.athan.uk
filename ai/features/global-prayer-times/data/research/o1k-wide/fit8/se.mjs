// Job 2: Sweden's IF national year. Stockholm, Uppsala, Goteborg (365 each)
// + Angered (equals IF Goteborg). Claim: IFiS = Diyanet European 18/16 exact.
// Tests: bare 18/16, night-portion fallbacks, frozen-45 (Diyanet), minute caps.
// Freeze diagnosis on fajr/isha. Run: TZ=Europe/Stockholm node se.mjs
import fs from 'node:fs';
import { loadFlex, makeContext45, freeScan2D, amplitude, freezeDiag } from './lib8.mjs';
import { bestMargin } from './lib.mjs';

const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1k-wide/nordics2/data/';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit8/se-fit.json';

const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' };
const angles = (a, b, s) => { const r = []; for (let v = a; v <= b + 1e-9; v += s) r.push(Math.round(v * 100) / 100); return r; };
const capsMin = (a, b, s) => { const r = []; for (let v = a; v <= b + 1e-9; v += s) r.push(Math.round(v * 10) / 10); return r; };
const FRACS = [1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8, 1 / 9, 1 / 10, 1 / 11, 1 / 12];

const sec = (dt) => (isNaN(dt.getTime()) ? null : dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds());

function pairUnder(ctx, i, fa, is, spec) {
  const out = { f: null, i: null };
  const faT = ctx.hourAngle(i, -fa, false);
  const isT = ctx.hourAngle(i, -is, true);
  const pick = (t) => (t && !isNaN(t.getTime()) ? sec(t) : null);
  if (spec.kind === 'bare') { out.f = pick(faT); out.i = pick(isT); }
  else if (spec.kind === 'portions') {
    const sf = new Date(ctx.srDate[i].getTime() - spec.fajr * ctx.night[i] * 1000);
    const si = new Date(ctx.ssDate[i].getTime() + spec.isha * ctx.night[i] * 1000);
    const ft = isNaN(faT.getTime()) || sf > faT ? sf : faT;
    const it = isNaN(isT.getTime()) || si < isT ? si : isT;
    out.f = sec(ft); out.i = sec(it);
  } else if (spec.kind === 'frozen45') { out.f = pick(spec.f45); out.i = pick(spec.i45); }
  else if (spec.kind === 'frozen45IfNaN') {
    out.f = isNaN(faT.getTime()) ? pick(spec.f45) : pick(faT);
    out.i = isNaN(isT.getTime()) ? pick(spec.i45) : pick(isT);
  } else if (spec.kind === 'minuteCap') {
    const capF = ctx.srDate[i].getTime() - spec.fCap * 60000;
    const capI = ctx.ssDate[i].getTime() + spec.iCap * 60000;
    const ft = isNaN(faT.getTime()) ? new Date(capF) : (faT.getTime() < capF ? new Date(capF) : faT);
    const it = isNaN(isT.getTime()) ? new Date(capI) : (isT.getTime() > capI ? new Date(capI) : isT);
    out.f = sec(ft); out.i = sec(it);
  }
  return out;
}

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

function statsOn(secArr, chartArr, idx, margin, mode) {
  let exact = 0, within1 = 0, worst = 0, n = 0;
  for (const i of idx) {
    if (secArr[i] === null || Number.isNaN(secArr[i]) || Number.isNaN(chartArr[i])) continue;
    const mins = secArr[i] / 60 + margin;
    const v = mode === 'floor' ? Math.floor(mins) : mode === 'ceil' ? Math.ceil(mins) : Math.round(mins);
    const diff = Math.abs(v - chartArr[i]);
    if (diff === 0) exact++;
    if (diff <= 1) within1++;
    if (diff > worst) worst = diff;
    n++;
  }
  return { margin, mode, exact, within1, worst, coverage: n };
}

async function fitTable(cfg) {
  const tableCols = cfg.diyanetCols
    ? { fajr: 'fajr_imsak', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' }
    : cols;
  const { slots } = loadFlex(cfg.file, tableCols);
  const pack = await makeContext45(cfg.lat, cfg.lng, slots);
  const ctx = pack.ctx, ctx45 = pack.ctx45, n = slots.length;
  const all = [...Array(n).keys()];

  const chartF = slots.map((s) => s.chart.fajr), chartI = slots.map((s) => s.chart.isha);
  const capM = (name) => [Number(name.match(/cap (\d+)\/(\d+)/)?.[1] ?? 0), Number(name.match(/cap (\d+)\/(\d+)/)?.[2] ?? 0)];
  const series = {};
  for (const name of ['bare', 'portion 1/2+1/7', 'portion 1/7+1/7', 'frozen45', 'frozen45IfNaN', 'cap 80/80', 'cap 90/90', 'cap 120/90', 'cap 120/70']) {
    const fSec = [], iSec = [];
    const [fCap, iCap] = capM(name);
    for (let i = 0; i < n; i++) {
      const spec = { fajr: name.includes('1/2') ? 1 / 2 : 1 / 7, isha: 1 / 7, fCap, iCap };
      if (name.startsWith('frozen45If')) { spec.kind = 'frozen45IfNaN'; spec.f45 = ctx45.hourAngle(i, -18, false); spec.i45 = ctx45.hourAngle(i, -16, true); }
      else if (name === 'frozen45') { spec.kind = 'frozen45'; spec.f45 = ctx45.hourAngle(i, -18, false); spec.i45 = ctx45.hourAngle(i, -16, true); }
      else if (name.startsWith('portion')) spec.kind = 'portions';
      else if (name.startsWith('cap')) spec.kind = 'minuteCap';
      else spec.kind = 'bare';
      const p = pairUnder(ctx, i, 18, 16, spec);
      fSec.push(p.f); iSec.push(p.i);
    }
    series[name] = { fajr: bestMarginOn(fSec, chartF, all), isha: bestMarginOn(iSec, chartI, all) };
  }
  // per-month exactness for bare 18/16 (the claim) — where does it hold/break
  const months = {};
  for (const [name, s] of [['bare18/16', series['bare']]]) {
    for (const prayer of ['fajr', 'isha']) {
      const secArr = prayer === 'fajr' ? (() => { const a = []; for (let i = 0; i < n; i++) a.push(pairUnder(ctx, i, 18, 16, { kind: 'bare' }).f); return a; })() : (() => { const a = []; for (let i = 0; i < n; i++) a.push(pairUnder(ctx, i, 18, 16, { kind: 'bare' }).i); return a; })();
      const chart = prayer === 'fajr' ? chartF : chartI;
      const m = s[prayer];
      for (let i = 0; i < n; i++) {
        if (secArr[i] === null || Number.isNaN(chart[i])) continue;
        const key = `${slots[i].date.getFullYear()}-${String(slots[i].date.getMonth() + 1).padStart(2, '0')}`;
        const mins = secArr[i] / 60 + m.margin;
        const v = m.mode === 'floor' ? Math.floor(mins) : m.mode === 'ceil' ? Math.ceil(mins) : Math.round(mins);
        const o = months[key] ??= { fajr: { e: 0, w1: 0, t: 0 }, isha: { e: 0, w1: 0, t: 0 } };
        const d = Math.abs(v - chart[i]);
        o[prayer].t++; if (d === 0) o[prayer].e++; if (d <= 1) o[prayer].w1++;
      }
    }
  }

  // solar columns
  const chartSr = slots.map((s) => s.chart.sunrise), chartDh = slots.map((s) => s.chart.dhuhr);
  const chartAsr = slots.map((s) => s.chart.asr), chartMag = slots.map((s) => s.chart.maghrib);
  const solar = {
    sunrise: bestMarginOn(ctx.raw.sunrise, chartSr, all),
    dhuhr: bestMarginOn(ctx.raw.dhuhr, chartDh, all),
    asrShafi: bestMarginOn(ctx.raw.asr1, chartAsr, all),
    asrHanafi: bestMarginOn(ctx.raw.asr2, chartAsr, all),
    maghrib: bestMarginOn(ctx.raw.maghrib, chartMag, all),
  };

  const free = {
    fajrBare: freeScan2D(pack, slots, 'f', 'bare', { angles: angles(10, 22, 0.25), other: 16 }).slice(0, 5),
    ishaBare: freeScan2D(pack, slots, 'i', 'bare', { angles: angles(10, 22, 0.25), other: 18 }).slice(0, 5),
    fajrPortion: freeScan2D(pack, slots, 'f', 'portions', { angles: angles(14, 20, 0.5), fracs: FRACS }).slice(0, 5),
    ishaPortion: freeScan2D(pack, slots, 'i', 'portions', { angles: angles(12, 20, 0.5), fracs: FRACS }).slice(0, 5),
    fajrCap: freeScan2D(pack, slots, 'f', 'minuteCap', { angles: angles(15, 20, 1), caps: capsMin(50, 160, 5), other: 16 }).slice(0, 5),
    ishaCap: freeScan2D(pack, slots, 'i', 'minuteCap', { angles: angles(13, 19, 1), caps: capsMin(50, 160, 5), other: 18 }).slice(0, 5),
  };

  return {
    tag: cfg.tag, file: cfg.file.replace(HOME, '$HOME'), lat: cfg.lat, lng: cfg.lng,
    rows: n,
    series: Object.fromEntries(Object.entries(series).map(([k, v]) => [k, { fajr: v.fajr, isha: v.isha }])),
    months,
    solar,
    free,
    diagFajr: freezeDiag(slots, 'fajr'),
    diagIsha: freezeDiag(slots, 'isha'),
    amplitudeFrozen45: amplitude(pack, slots, { kind: 'bare', fa: 18, is: 16 }),
  };
}

const tables = [
  { tag: 'ifis-stockholm', file: D + 'se-ifis-stockholm-2026.json', lat: 59.3293, lng: 18.0686 },
  { tag: 'ifis-uppsala', file: D + 'se-ifis-uppsala-2026.json', lat: 59.8586, lng: 17.6389 },
  { tag: 'ifis-goteborg', file: D + 'se-ifis-goteborg-2026.json', lat: 57.7089, lng: 11.9746 },
  { tag: 'angered-goteborg', file: D + 'se-angered-2026.json', lat: 57.7089, lng: 11.9746 },
  { tag: 'diyanet-koeln-control', file: HOME + '/athan-gitree/census/o1k-wide/europe/data/de-diyanet-koeln-2026.json', lat: 50.9685, lng: 6.9616, diyanetCols: true },
];

const out = { job: 'fit8-se', meta: { adhan: '4.4.6', discipline: 'second resolution then explicit rounding', tz: 'Europe/Stockholm' }, tables: [] };
for (const t of tables) {
  const res = await fitTable(t);
  out.tables.push(res);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(`\n${res.tag}  rows ${res.rows}`);
  for (const [k, v] of Object.entries(res.solar)) if (v) console.log(`  solar ${k} m${v.margin} ${v.mode} exact ${v.exact}/${v.coverage} w1 ${v.within1}`);
  for (const [k, v] of Object.entries(res.series)) console.log(`  ${k.padEnd(18)} fajr ${v.fajr ? v.fajr.exact + '/' + v.fajr.coverage + ' m' + v.fajr.margin + ' ' + v.fajr.mode + ' w' + v.fajr.worst : '-'}  isha ${v.isha ? v.isha.exact + '/' + v.isha.coverage + ' m' + v.isha.margin + ' ' + v.isha.mode + ' w' + v.isha.worst : '-'}`);
  const f = res.free;
  console.log(`  free bare fajr ${f.fajrBare.map((x) => x.params.fa + ':' + x.exact).join(' ')} | isha ${f.ishaBare.map((x) => x.params.fa + ':' + x.exact).join(' ')}`);
  console.log(`  free portion fajr ${f.fajrPortion[0] ? f.fajrPortion[0].params.fa + ' ' + Math.round(f.fajrPortion[0].params.fr * 1000) / 1000 + ':' + f.fajrPortion[0].exact : '-'} | isha ${f.ishaPortion[0] ? f.ishaPortion[0].params.fa + ' ' + Math.round(f.ishaPortion[0].params.fr * 1000) / 1000 + ':' + f.ishaPortion[0].exact : '-'}`);
  console.log(`  free cap fajr ${f.fajrCap[0] ? f.fajrCap[0].params.cap + ':' + f.fajrCap[0].exact : '-'} | isha ${f.ishaCap[0] ? f.ishaCap[0].params.cap + ':' + f.ishaCap[0].exact : '-'}`);
  console.log(`  diag fajr ${JSON.stringify(res.diagFajr)}`);
  console.log(`  diag isha ${JSON.stringify(res.diagIsha)}`);
  console.log(`  months ${JSON.stringify(res.months)}`);
  console.log(`  amplitude ${JSON.stringify(res.amplitudeFrozen45)}`);
}
console.log('\nwrote se-fit.json');
