// Job 1: the Norwegian schism's lines, fitted across all banked year files.
// IRN (claimed 16/15): bergen/trondheim/tromso API years + Rabita Oslo Nov-Dec.
// Mawaqeet (claimed 18/15): trondheim/kristiansand/alesund years + oslo/bergen/stavanger PDF years.
// Third line (Jamiat Ulama, islamweb.no): characterized at Oslo/Bergen.
// Substitution regimes (clamps, bridges, Tromso synthetic blocks) are classified
// per day, sized, and excluded from the claim score.
// Run: TZ=Europe/Oslo node no.mjs
import fs from 'node:fs';
import { loadFlex, makeContext45, freeScan2D, amplitude } from './lib8.mjs';
import { bestMargin } from './lib.mjs';

const HOME = process.env.HOME;
const N2 = HOME + '/athan-gitree/census/o1k-wide/nordics2/data/';
const EU = HOME + '/athan-gitree/census/o1k-wide/europe/data/';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit8/no-fit.json';

const irnCols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', asr2: 'asr2x', maghrib: 'magrib', isha: 'isha' };
const mwCols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', asr2: 'asr_hanafi', maghrib: 'magrib', isha: 'isha' };
const mwPdfCols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr_shafi', asr2: 'asr_hanafi', maghrib: 'magrib', isha: 'isha' };
const juCols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' };

const angles = (a, b, s) => { const r = []; for (let v = a; v <= b + 1e-9; v += s) r.push(Math.round(v * 100) / 100); return r; };
const FRACS = [1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8, 1 / 9, 1 / 10, 1 / 11, 1 / 12];
const isCEST = (d) => { const y = d.getFullYear(); return d >= new Date(y, 2, 29) && d < new Date(y, 9, 25); };

// best margin+mode for one prayer restricted to a subset of day indices.
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
  const badDays = [];
  for (const i of idx) {
    if (secArr[i] === null || Number.isNaN(secArr[i]) || Number.isNaN(chartArr[i])) continue;
    const mins = secArr[i] / 60 + margin;
    const v = mode === 'floor' ? Math.floor(mins) : mode === 'ceil' ? Math.ceil(mins) : Math.round(mins);
    const diff = Math.abs(v - chartArr[i]);
    if (diff === 0) exact++;
    if (diff <= 1) within1++; else badDays.push(slotsKey[i]);
    if (diff > worst) worst = diff;
    n++;
  }
  return { margin, mode, exact, within1, worst, coverage: n, badDays };
}

// two-pass: best margin on all parseable rows, then classify, then final
// stats restricted to angle-honest days at the same margin.
function claimScore(ctx, slots, secArr, chartArr, side) {
  const all = [...Array(slots.length).keys()];
  const pass1 = bestMarginOn(secArr, chartArr, all);
  if (!pass1) return null;
  let cls = classify(ctx, slots, secArr, chartArr, pass1.margin, pass1.mode, side);
  let angleIdx = all.filter((i) => cls.days[i] === 'angle');
  let final = statsOn(secArr, chartArr, angleIdx, pass1.margin, pass1.mode);
  const pass2 = bestMarginOn(secArr, chartArr, angleIdx);
  if (pass2 && (pass2.margin !== pass1.margin || pass2.mode !== pass1.mode)) {
    cls = classify(ctx, slots, secArr, chartArr, pass2.margin, pass2.mode, side);
    angleIdx = all.filter((i) => cls.days[i] === 'angle');
    final = statsOn(secArr, chartArr, angleIdx, pass2.margin, pass2.mode);
  }
  return { stats: final, class: cls };
}

// classify a twilight column against its claimed angle: angle-honest days vs
// substitutions, with the substitution sub-rules tagged. Returns a days array
// ('angle'|'substituted'|'angle-failed'|'null') plus summary.
function classify(ctx, slots, secArr, chartArr, margin, mode, side) {
  const days = [];
  for (let i = 0; i < slots.length; i++) {
    const chart = chartArr[i], comp = secArr[i];
    if (Number.isNaN(chart)) { days.push('null'); continue; }
    if (comp === null || Number.isNaN(comp)) { days.push('angle-failed'); continue; }
    const mins = comp / 60 + margin;
    const v = mode === 'floor' ? Math.floor(mins) : mode === 'ceil' ? Math.ceil(mins) : Math.round(mins);
    if (Math.abs(v - chart) <= 1) days.push('angle');
    else days.push('substituted');
  }
  const count = (k) => days.filter((d) => d === k).length;
  const windows = (k) => {
    const out = [];
    let cur = null;
    for (let i = 0; i < days.length; i++) if (days[i] === k) {
      if (cur && slots[i].key === cur.endNext) { cur.end = slots[i].key; cur.n++; cur.endNext = nextDay(slots[i].key); }
      else { if (cur) out.push(cur); cur = { start: slots[i].key, end: slots[i].key, n: 1, endNext: nextDay(slots[i].key) }; }
    }
    if (cur) out.push(cur);
    return out.filter((w) => w.n >= 2);
  };
  const anchorArr = side === 'fajr' ? ctx.raw.sunrise : ctx.raw.maghrib;
  const gaps = {};
  for (let i = 0; i < days.length; i++) if (days[i] === 'substituted') {
    const gap = chartArr[i] - anchorArr[i] / 60;
    const key = Number.isFinite(gap) ? Math.round(gap) : 'noanchor';
    gaps[key] = (gaps[key] || 0) + 1;
  }
  const topGaps = Object.entries(gaps).map(([g, n]) => ({ gapMin: g === 'noanchor' ? null : Number(g), days: n })).sort((a, b) => b.days - a.days).slice(0, 4);
  return { days, angleDays: count('angle'), angleFailed: count('angle-failed'), substituted: count('substituted'), nullDays: count('null'), windows: { substituted: windows('substituted') }, topPrintedGaps: topGaps };
}
const nextDay = (k) => { const [y, m, d] = k.split('-').map(Number); const t = new Date(y, m - 1, d + 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };

// Tromso honest-day detection: a real sunrise/maghrib pair straddles transit
// symmetrically; synthetic pairs do not.
function tromsoHonest(ctx, slots) {
  const min = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  const keep = [];
  const blocks = [];
  let cur = null;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const tr = min(new ctx.adhan.TimeComponents(ctx.solar[i].transit).utcDate(s.date.getFullYear(), s.date.getMonth(), s.date.getDate())) % 1440;
    const sr = s.chart.sunrise, mg = s.chart.maghrib;
    const len = mg >= sr ? mg - sr : mg + 1440 - sr;
    let off = (sr + len / 2) % 1440 - tr;
    if (off > 720) off -= 1440; if (off < -720) off += 1440;
    const honest = Math.abs(off) <= 3;
    if (honest) keep.push(i);
    if (!honest && !cur) cur = { start: s.key, end: s.key, n: 1 };
    else if (!honest && cur) { cur.end = s.key; cur.n++; }
    else if (honest && cur) { blocks.push(cur); cur = null; }
  }
  if (cur) blocks.push(cur);
  return { keep, blocks };
}

async function fitTable(cfg) {
  const { slots } = loadFlex(cfg.file, cfg.cols);
  slotsKey = slots.map((s) => s.key);
  const pack = await makeContext45(cfg.lat, cfg.lng, slots);
  const ctx = pack.ctx, n = slots.length;

  let honest = null;
  let scored = [...Array(n).keys()];
  if (cfg.tromso) {
    honest = tromsoHonest(ctx, slots);
    scored = honest.keep;
  }

  const chartF = slots.map((s) => s.chart.fajr), chartI = slots.map((s) => s.chart.isha);
  const fSec = [], iSec = [];
  for (let i = 0; i < n; i++) {
    fSec.push(cfg.portions ? pairPortions(ctx, i, cfg.claimFa, 15, 1 / 2, 1 / 7).f : sec(ctx.hourAngle(i, -cfg.claimFa, false)));
    iSec.push(sec(ctx.hourAngle(i, -cfg.claimIs, true)));
  }
  const fClaim = claimScore(ctx, slots, fSec, chartF, 'fajr');
  const iClaim = claimScore(ctx, slots, iSec, chartI, 'isha');

  // solar columns; dhuhr split by DST (IRN's +5 lands as +4.5 CET / +9.5 CEST)
  const chartDhuhr = slots.map((s) => s.chart.dhuhr);
  const cet = scored.filter((i) => !isCEST(slots[i].date)), cest = scored.filter((i) => isCEST(slots[i].date));
  const dhuhr = cfg.splitDhuhr
    ? { cet: cet.length ? bestMarginOn(ctx.raw.dhuhr, chartDhuhr, cet) : null, cest: cest.length ? bestMarginOn(ctx.raw.dhuhr, chartDhuhr, cest) : null }
    : { all: bestMarginOn(ctx.raw.dhuhr, chartDhuhr, scored) };
  const chartMag = slots.map((s) => s.chart.maghrib), chartSr = slots.map((s) => s.chart.sunrise), chartAsr = slots.map((s) => s.chart.asr);
  const maghrib = bestMarginOn(ctx.raw.maghrib, chartMag, scored);
  const sunrise = bestMarginOn(ctx.raw.sunrise, chartSr, scored);
  const asr1 = cfg.cols.asr ? bestMarginOn(ctx.raw.asr1, chartAsr, scored) : null;
  const asr2v = cfg.cols.asr2 ? bestMarginOn(ctx.raw.asr2, slots.map((s) => s.chart.asr2), scored) : null;
  const asrColVsShadow2 = cfg.cols.asr ? bestMarginOn(ctx.raw.asr2, chartAsr, scored) : null;

  // free angle scans on scored rows (bare)
  const packScored = scored.length === n ? pack : await makeContext45(cfg.lat, cfg.lng, scored.map((i) => slots[i]));
  const slotsScored = scored.map((i) => slots[i]);
  const free = cfg.freeScan ? {
    fajr: freeScan2D(packScored, slotsScored, 'f', 'bare', { angles: angles(11, 21, 0.25), other: 15 }).slice(0, 5),
    isha: freeScan2D(packScored, slotsScored, 'i', 'bare', { angles: angles(11, 21, 0.25), other: 15 }).slice(0, 5),
  } : null;

  return {
    tag: cfg.tag, line: cfg.line, file: cfg.file.replace(HOME, '$HOME'), lat: cfg.lat, lng: cfg.lng,
    rows: n, rowsScored: scored.length,
    tromsoBlocks: honest ? honest.blocks : undefined,
    claim: { fajr: fClaim, isha: iClaim },
    solar: { sunrise, dhuhr, maghrib, asr1, asr2: asr2v, asrColVsShadow2 },
    free,
    amplitude: amplitude(packScored, slotsScored, { kind: 'bare', fa: cfg.claimFa, is: cfg.claimIs }),
  };
}
let slotsKey;

// helpers
const sec = (dt) => (isNaN(dt.getTime()) ? null : dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds());
function pairPortions(ctx, i, fa, is, pf, pi) {
  const faT = ctx.hourAngle(i, -fa, false);
  const sf = new Date(ctx.srDate[i].getTime() - pf * ctx.night[i] * 1000);
  const f = isNaN(faT.getTime()) || sf > faT ? sf : faT;
  const isT = ctx.hourAngle(i, -is, true);
  const si = new Date(ctx.ssDate[i].getTime() + pi * ctx.night[i] * 1000);
  const it = isNaN(isT.getTime()) || si < isT ? si : isT;
  return { f: sec(f), i: sec(it) };
}

const tables = [
  { tag: 'irn-bergen', line: 'IRN', file: N2 + 'no-irn-bergen-2026.json', cols: irnCols, lat: 60.356091, lng: 5.379238, claimFa: 16, claimIs: 15, splitDhuhr: true, freeScan: true },
  { tag: 'irn-trondheim', line: 'IRN', file: N2 + 'no-irn-trondheim-2026.json', cols: irnCols, lat: 63.338124, lng: 10.475134, claimFa: 16, claimIs: 15, splitDhuhr: true, freeScan: true },
  { tag: 'irn-tromso', line: 'IRN', file: N2 + 'no-irn-tromso-2026.json', cols: irnCols, lat: 69.756929, lng: 18.613889, claimFa: 16, claimIs: 15, splitDhuhr: true, tromso: true },
  { tag: 'irn-line-oslo-rabita', line: 'IRN', file: EU + 'no-rabita-oslo-2026-novdec.json', cols: juCols, lat: 59.9139, lng: 10.7522, claimFa: 16, claimIs: 15, splitDhuhr: true },
  { tag: 'mawaqeet-trondheim', line: 'Mawaqeet', file: N2 + 'no-mawaqeet-trondheim-2026.json', cols: mwCols, lat: 63.4305, lng: 10.3951, claimFa: 18, claimIs: 15, portions: true },
  { tag: 'mawaqeet-kristiansand', line: 'Mawaqeet', file: N2 + 'no-mawaqeet-kristiansand-2026.json', cols: mwCols, lat: 58.1461, lng: 7.9956, claimFa: 18, claimIs: 15, portions: true },
  { tag: 'mawaqeet-alesund', line: 'Mawaqeet', file: N2 + 'no-mawaqeet-alesund-2026.json', cols: mwCols, lat: 62.4722, lng: 6.1494, claimFa: 18, claimIs: 15, portions: true },
  { tag: 'mawaqeet-oslo', line: 'Mawaqeet', file: EU + 'no-mawaqeet-oslo-2026.json', cols: mwPdfCols, lat: 59.9139, lng: 10.7522, claimFa: 18, claimIs: 15, portions: true },
  { tag: 'mawaqeet-bergen', line: 'Mawaqeet', file: EU + 'no-mawaqeet-bergen-2026.json', cols: mwPdfCols, lat: 60.3913, lng: 5.3221, claimFa: 18, claimIs: 15, portions: true },
  { tag: 'mawaqeet-stavanger', line: 'Mawaqeet', file: EU + 'no-mawaqeet-stavanger-2026.json', cols: mwPdfCols, lat: 58.97, lng: 5.7331, claimFa: 18, claimIs: 15, portions: true },
  { tag: 'ju-islamweb-oslo', line: 'JamiatUlama', file: EU + 'no-islamweb-oslo-2026.json', cols: juCols, lat: 59.9139, lng: 10.7522, claimFa: 18, claimIs: 15, portions: true, freeScan: true },
  { tag: 'ju-islamweb-bergen', line: 'JamiatUlama', file: EU + 'no-islamweb-bergen-2026.json', cols: juCols, lat: 60.3913, lng: 5.3221, claimFa: 18, claimIs: 15, portions: true },
];

const out = { job: 'fit8-no', meta: { adhan: '4.4.6', discipline: 'second resolution then explicit rounding', tz: 'Europe/Oslo', note: 'IRN dhuhr scored split by DST; twilight claim scores run on angle-honest days only; Tromso synthetic blocks excluded and sized separately' }, tables: [] };
for (const t of tables) {
  const res = await fitTable(t);
  out.tables.push(res);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  const c = res.claim;
  console.log(`\n${res.tag}  scored ${res.rowsScored}/${res.rows}`);
  console.log(`  sunrise m${res.solar.sunrise.margin} ${res.solar.sunrise.mode} exact ${res.solar.sunrise.exact}/${res.solar.sunrise.coverage}  maghrib m${res.solar.maghrib.margin} ${res.solar.maghrib.mode} exact ${res.solar.maghrib.exact}/${res.solar.maghrib.coverage}  asr ${res.solar.asr ? res.solar.asr.exact + ' m' + res.solar.asr.margin : '-'}  asr2 ${res.solar.asr2 ? res.solar.asr2.exact + ' m' + res.solar.asr2.margin : '-'}`);
  if (res.solar.dhuhr.all) console.log(`  dhuhr m${res.solar.dhuhr.all.margin} ${res.solar.dhuhr.all.mode} exact ${res.solar.dhuhr.all.exact}/${res.solar.dhuhr.all.coverage}`);
  else console.log(`  dhuhr CET m${res.solar.dhuhr.cet ? res.solar.dhuhr.cet.margin : '-'} ${res.solar.dhuhr.cet ? res.solar.dhuhr.cet.mode : ''} exact ${res.solar.dhuhr.cet ? res.solar.dhuhr.cet.exact + '/' + res.solar.dhuhr.cet.coverage : '-'} | CEST m${res.solar.dhuhr.cest ? res.solar.dhuhr.cest.margin : '-'} ${res.solar.dhuhr.cest ? res.solar.dhuhr.cest.mode : ''} exact ${res.solar.dhuhr.cest ? res.solar.dhuhr.cest.exact + '/' + res.solar.dhuhr.cest.coverage : '-'}`);
  if (c.fajr) console.log(`  claim fajr ${t.claimFa} m${c.fajr.stats.margin} ${c.fajr.stats.mode}: exact ${c.fajr.stats.exact}/${c.fajr.stats.coverage} w1 ${c.fajr.stats.within1} worst ${c.fajr.stats.worst} | days angle ${c.fajr.class.angleDays} failed ${c.fajr.class.angleFailed} subst ${c.fajr.class.substituted} null ${c.fajr.class.nullDays} windows ${JSON.stringify(c.fajr.class.windows.substituted)} gaps ${JSON.stringify(c.fajr.class.topPrintedGaps)}`);
  if (c.isha) console.log(`  claim isha ${t.claimIs} m${c.isha.stats.margin} ${c.isha.stats.mode}: exact ${c.isha.stats.exact}/${c.isha.stats.coverage} w1 ${c.isha.stats.within1} worst ${c.isha.stats.worst} | days angle ${c.isha.class.angleDays} failed ${c.isha.class.angleFailed} subst ${c.isha.class.substituted} null ${c.isha.class.nullDays} windows ${JSON.stringify(c.isha.class.windows.substituted)} gaps ${JSON.stringify(c.isha.class.topPrintedGaps)}`);
  if (res.tromsoBlocks) console.log(`  tromso synthetic blocks ${JSON.stringify(res.tromsoBlocks)}`);
  if (res.free) console.log(`  free fajr ${res.free.fajr.map((x) => x.params.fa + ':' + x.exact).join(' ')} | isha ${res.free.isha.map((x) => x.params.fa + ':' + x.exact).join(' ')}`);
  console.log(`  amplitude ${JSON.stringify(res.amplitude)}`);
}
console.log('\nwrote no-fit.json');
