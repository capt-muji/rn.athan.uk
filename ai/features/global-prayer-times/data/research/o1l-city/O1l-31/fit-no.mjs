// Norway IRN line at nine cities plus Oslo, one recipe across the span.
// adhan 4.4.6, TZ Europe/Oslo, second resolution then explicit rounding.
import fs from 'node:fs';
import { loadFlex, makeContext45, freeScan2D, amplitude } from './lib8.mjs';
import { bestMargin } from './lib.mjs';

const W = process.env.HOME + '/athan-gitree/census/o1l-city/O1l-31';
const OUT = W + '/fits/no-irn-fit.json';

const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const angles = (a, b, s) => { const r = []; for (let v = a; v <= b + 1e-9; v += s) r.push(Math.round(v * 100) / 100); return r; };

const cities = [
  ['stavanger', 59.102013, 5.712610],
  ['haugesund', 59.468248, 5.082381],
  ['alesund', 62.767125, 6.168668],
  ['sandnes', 58.983132, 6.394641],
  ['fredrikstad', 59.186201, 10.868024],
  ['sarpsborg', 59.254954, 11.229781],
  ['bodo', 67.309478, 13.915441],
  ['harstad', 68.929738, 16.520913],
  ['alta', 70.049627, 23.082535],
  ['oslo', 59.972397, 10.775729],
];

const sec = (dt) => (isNaN(dt.getTime()) ? null : dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds());
const nextDay = (k) => { const [y, m, d] = k.split('-').map(Number); const t = new Date(y, m - 1, d + 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };

function honestDays(ctx, slots) {
  const min = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  const keep = [], blocks = [];
  let cur = null;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const tr = min(new ctx.adhan.TimeComponents(ctx.solar[i].transit).utcDate(s.date.getFullYear(), s.date.getMonth(), s.date.getDate())) % 1440;
    const sr = s.chart.sunrise, mg = s.chart.maghrib;
    const len = mg >= sr ? mg - sr : mg + 1440 - sr;
    let off = (sr + len / 2) % 1440 - tr;
    if (off > 720) off -= 1440; if (off < -720) off += 1440;
    const honest = Math.abs(off) <= 3;
    if (honest) { keep.push(i); if (cur) { blocks.push(cur); cur = null; } }
    else if (!cur) cur = { start: s.key, end: s.key, n: 1 };
    else { cur.end = s.key; cur.n++; }
  }
  if (cur) blocks.push(cur);
  return { keep, blocks };
}

function marginOn(secArr, chartArr, idx) {
  const sv = [], cv = [];
  for (const i of idx) {
    if (secArr[i] === null || Number.isNaN(secArr[i]) || Number.isNaN(chartArr[i])) continue;
    sv.push(secArr[i]); cv.push(chartArr[i]);
  }
  if (!sv.length) return null;
  return bestMargin(Float64Array.from(sv), Int32Array.from(cv), { jMax: 60, m0: -15 });
}

function statsOn(secArr, chartArr, idx, margin, mode) {
  let exact = 0, within1 = 0, worst = 0, n = 0; const bad = [];
  for (const i of idx) {
    if (secArr[i] === null || Number.isNaN(secArr[i]) || Number.isNaN(chartArr[i])) continue;
    const mins = secArr[i] / 60 + margin;
    const v = mode === 'floor' ? Math.floor(mins) : mode === 'ceil' ? Math.ceil(mins) : Math.round(mins);
    const diff = Math.abs(v - chartArr[i]);
    if (diff === 0) exact++; else if (diff > 1) bad.push(idxKey[i]);
    if (diff <= 1) within1++;
    if (diff > worst) worst = diff;
    n++;
  }
  return { margin, mode, exact, within1, worst, coverage: n, badDays: bad.slice(0, 12) };
}
let idxKey;

// classify a twilight column: angle-honest vs substituted, tag substitution gaps
function classify(ctx, slots, secArr, chartArr, margin, mode, side) {
  const days = [];
  for (let i = 0; i < slots.length; i++) {
    const chart = chartArr[i], comp = secArr[i];
    if (Number.isNaN(chart)) { days.push('null'); continue; }
    if (comp === null || Number.isNaN(comp)) { days.push('angle-failed'); continue; }
    const mins = comp / 60 + margin;
    const v = mode === 'floor' ? Math.floor(mins) : mode === 'ceil' ? Math.ceil(mins) : Math.round(mins);
    days.push(Math.abs(v - chart) <= 1 ? 'angle' : 'substituted');
  }
  const count = (k) => days.filter((d) => d === k).length;
  const windows = (k) => {
    const out = []; let cur = null;
    for (let i = 0; i < days.length; i++) if (days[i] === k) {
      if (cur && slots[i].key === cur.endNext) { cur.end = slots[i].key; cur.n++; cur.endNext = nextDay(slots[i].key); }
      else { if (cur) out.push(cur); cur = { start: slots[i].key, end: slots[i].key, n: 1, endNext: nextDay(slots[i].key) }; }
    }
    if (cur) out.push(cur);
    return out.filter((w) => w.n >= 2);
  };
  const anchor = side === 'fajr' ? ctx.raw.sunrise : ctx.raw.maghrib;
  const gaps = {};
  for (let i = 0; i < days.length; i++) if (days[i] === 'substituted') {
    const g = chartArr[i] - anchor[i] / 60;
    const key = Number.isFinite(g) ? Math.round(g) : 'noanchor';
    gaps[key] = (gaps[key] || 0) + 1;
  }
  return {
    days, angleDays: count('angle'), angleFailed: count('angle-failed'), substituted: count('substituted'), nullDays: count('null'),
    windows: windows('substituted'),
    topGaps: Object.entries(gaps).map(([g, n]) => ({ gapMin: g === 'noanchor' ? null : Number(g), days: n })).sort((a, b) => b.days - a.days).slice(0, 4),
  };
}

function claim(ctx, slots, secArr, chartArr, side, scored) {
  const p1 = marginOn(secArr, chartArr, scored);
  if (!p1) return null;
  let cls = classify(ctx, slots, secArr, chartArr, p1.margin, p1.mode, side);
  let angleIdx = scored.filter((i) => cls.days[i] === 'angle');
  let st = statsOn(secArr, chartArr, angleIdx, p1.margin, p1.mode);
  const p2 = marginOn(secArr, chartArr, angleIdx);
  if (p2 && (p2.margin !== p1.margin || p2.mode !== p1.mode)) {
    cls = classify(ctx, slots, secArr, chartArr, p2.margin, p2.mode, side);
    angleIdx = scored.filter((i) => cls.days[i] === 'angle');
    st = statsOn(secArr, chartArr, angleIdx, p2.margin, p2.mode);
  }
  return { stats: st, class: cls };
}

const out = { job: 'o1l-31-no-irn', meta: { engine: 'adhan 4.4.6', tz: 'Europe/Oslo', claim: 'IRN 16/15', discipline: 'second resolution, explicit rounding, synthetic polar days excluded from the score' }, tables: [] };

for (const [city, lat, lng] of cities) {
  const { slots } = loadFlex(W + '/data/no-irn-' + city + '-2026.json', cols);
  idxKey = slots.map((s) => s.key);
  const pack = await makeContext45(lat, lng, slots);
  const ctx = pack.ctx;
  const { keep, blocks } = honestDays(ctx, slots);
  const n = slots.length;
  const fSec = [], iSec = [];
  for (let i = 0; i < n; i++) {
    fSec.push(sec(ctx.hourAngle(i, -16, false)));
    iSec.push(sec(ctx.hourAngle(i, -15, true)));
  }
  const chartF = slots.map((s) => s.chart.fajr), chartI = slots.map((s) => s.chart.isha);
  const fC = claim(ctx, slots, fSec, chartF, 'fajr', keep);
  const iC = claim(ctx, slots, iSec, chartI, 'isha', keep);
  const chart = (p) => slots.map((s) => s.chart[p]);
  const solar = {
    sunrise: marginOn(ctx.raw.sunrise, chart('sunrise'), keep),
    dhuhr: marginOn(ctx.raw.dhuhr, chart('dhuhr'), keep),
    asr: marginOn(ctx.raw.asr1, chart('asr'), keep),
    asrVsShadow2: marginOn(ctx.raw.asr2, chart('asr'), keep),
    maghrib: marginOn(ctx.raw.maghrib, chart('maghrib'), keep),
  };
  const free = {
    fajr: freeScan2D(pack, slots, 'f', 'bare', { angles: angles(11, 21, 0.25), other: 15 }).slice(0, 5),
    isha: freeScan2D(pack, slots, 'i', 'bare', { angles: angles(11, 21, 0.25), other: 15 }).slice(0, 5),
  };
  const amp = amplitude(pack, slots, { kind: 'bare', fa: 16, is: 15 });
  const res = { city, lat, lng, rows: n, scored: keep.length, syntheticBlocks: blocks, claim: { fajr: fC, isha: iC }, solar, free, amplitude: amp };
  out.tables.push(res);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  const s = (x) => x ? `m${x.margin} ${x.mode} ${x.exact}/${x.coverage} w1 ${x.within1} worst ${x.worst}` : '-';
  console.log(`\n${city} rows ${n} scored ${keep.length}${blocks.length ? ' synthetic ' + JSON.stringify(blocks) : ''}`);
  console.log(`  sunrise ${s(solar.sunrise)} | dhuhr ${s(solar.dhuhr)} | asr ${s(solar.asr)} (shadow2 ${s(solar.asrVsShadow2)}) | maghrib ${s(solar.maghrib)}`);
  if (fC) console.log(`  fajr16 ${s(fC.stats)} | angle ${fC.class.angleDays} failed ${fC.class.angleFailed} subst ${fC.class.substituted} null ${fC.class.nullDays} gaps ${JSON.stringify(fC.class.topGaps)} win ${JSON.stringify(fC.class.windows)}`);
  if (iC) console.log(`  isha15 ${s(iC.stats)} | angle ${iC.class.angleDays} failed ${iC.class.angleFailed} subst ${iC.class.substituted} null ${iC.class.nullDays} gaps ${JSON.stringify(iC.class.topGaps)} win ${JSON.stringify(iC.class.windows)}`);
  console.log(`  free fajr ${free.fajr.map((x) => x.params.fa + ':' + x.exact).join(' ')} | isha ${free.isha.map((x) => x.params.fa + ':' + x.exact).join(' ')}`);
  console.log(`  amp ${JSON.stringify(amp)}`);
}
console.log('\nwrote fits/no-irn-fit.json');
