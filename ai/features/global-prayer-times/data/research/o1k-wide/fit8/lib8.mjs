// fit8 extensions over the fit4 engine: per-prayer coverage (nulls allowed),
// extra fajr/isha cap families (frozen-45, minute caps), seasonal amplitude.
// Census discipline: adhan 4.4.6, second resolution then explicit rounding.
import fs from 'node:fs';
import { loadAdhan, parseHHMM, bestMargin } from './lib.mjs';
import { makeContext } from './engine.mjs';

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const secOf = (dt) => dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();

// Load a dated JSON map into slots; chart values may be null -> NaN per prayer.
// cols: { prayer: columnKey | null }. Returns { keys, slots } sorted by date.
export function loadFlex(file, cols) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const keys = Object.keys(data).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && data[k]).sort();
  const slots = keys.map((key) => {
    const [y, m, d] = key.split('-').map(Number);
    const chart = {};
    for (const [p, col] of Object.entries(cols)) {
      const v = col === null ? null : String(data[key][col] ?? '').trim();
      const mm = v && /^\d{1,2}:\d{2}$/.test(v) ? parseHHMM(v) : NaN;
      chart[p] = Number.isNaN(mm) ? NaN : mm;
    }
    return { key, date: new Date(y, m - 1, d), chart };
  });
  return { keys, slots };
}

// Context plus a parallel 45N context (same lng, same dates) for frozen-45 caps.
export async function makeContext45(lat, lng, slots) {
  const ctx = await makeContext(lat, lng, slots);
  const ctx45 = await makeContext(45, lng, slots);
  return { ctx, ctx45 };
}

// fajr/isha seconds for day i under a cap spec:
//   { kind: 'bare' }                                  angle only, NaN when absent
//   { kind: 'portions', fajr, isha }                  night-fraction fallback (adhan semantics)
//   { kind: 'frozen45', fa, is }                      lat-45 hour angle replaces (Diyanet style)
//   { kind: 'frozen45IfNaN', fa, is }                 lat-45 value only when the real angle is NaN
//   { kind: 'minuteCap', fa, is, fCap, iCap }         angle, capped: fajr no earlier than
//                                                     sunrise-fCap, isha no later than maghrib+iCap
//   { kind: 'minuteOnly', fCap, iCap }                fixed gaps off sunrise/maghrib
// Returns { f, i } seconds (null where undefined).
export function pairUnder(ctx45pack, i, fa, is, spec) {
  const { ctx, ctx45 } = ctx45pack;
  const out = { f: null, i: null };
  const faT = ctx.hourAngle(i, -fa, false);
  const isT = ctx.hourAngle(i, -is, true);
  const f45 = ctx45.hourAngle(i, -fa, false);
  const i45 = ctx45.hourAngle(i, -is, true);
  const pick = (t) => (t && !isNaN(t.getTime()) ? secOf(t) : null);
  if (spec.kind === 'bare') {
    out.f = pick(faT); out.i = pick(isT);
  } else if (spec.kind === 'portions') {
    const sf = new Date(ctx.srDate[i].getTime() - spec.fajr * ctx.night[i] * 1000);
    const si = new Date(ctx.ssDate[i].getTime() + spec.isha * ctx.night[i] * 1000);
    const ft = isNaN(faT.getTime()) || sf > faT ? sf : faT;
    const it = isNaN(isT.getTime()) || si < isT ? si : isT;
    out.f = secOf(ft); out.i = secOf(it);
  } else if (spec.kind === 'frozen45') {
    out.f = pick(f45); out.i = pick(i45);
  } else if (spec.kind === 'frozen45IfNaN') {
    out.f = isNaN(faT.getTime()) ? pick(f45) : pick(faT);
    out.i = isNaN(isT.getTime()) ? pick(i45) : pick(isT);
  } else if (spec.kind === 'minuteCap') {
    const fGap = (spec.fCap * 60);
    const iGap = (spec.iCap * 60);
    const capF = ctx.srDate[i].getTime() - fGap * 1000;
    const capI = ctx.ssDate[i].getTime() + iGap * 1000;
    const ft = isNaN(faT.getTime()) ? new Date(capF) : (faT.getTime() < capF ? new Date(capF) : faT);
    const it = isNaN(isT.getTime()) ? new Date(capI) : (isT.getTime() > capI ? new Date(capI) : isT);
    out.f = secOf(ft); out.i = secOf(it);
  } else if (spec.kind === 'minuteOnly') {
    out.f = secOf(new Date(ctx.srDate[i].getTime() - spec.fCap * 60000));
    out.i = secOf(new Date(ctx.ssDate[i].getTime() + spec.iCap * 60000));
  }
  return out;
}

// Score one prayer column: computed seconds vs chart minutes, NaN charts skipped.
// Sweeps margin+rounding like bestMargin. Returns best stats + coverage.
export function scoreColumn(secArr, chartArr, opts = {}) {
  const fv = [];
  for (let i = 0; i < secArr.length; i++) {
    if (secArr[i] !== null && !Number.isNaN(chartArr[i])) fv.push([secArr[i], chartArr[i]]);
  }
  if (fv.length === 0) return null;
  const r = bestMargin(Float64Array.from(fv, (x) => x[0]), Int32Array.from(fv, (x) => x[1]), opts);
  return { ...r, coverage: fv.length };
}

// Full table score for one candidate: solar columns + fajr/isha under a cap spec.
export async function scoreOne(pack, slots, cols, spec) {
  const { ctx } = pack;
  const n = slots.length;
  const col = (p) => Float64Array.from({ length: n }, (_, i) =>
    pairUnder(pack, i, spec.fa ?? 0, spec.is ?? 0, spec)[p]);
  const solar = {
    sunrise: cols.sunrise ? scoreColumn(ctx.raw.sunrise, slots.map((s) => s.chart.sunrise)) : null,
    dhuhr: scoreColumn(ctx.raw.dhuhr, slots.map((s) => s.chart.dhuhr)),
    asr: cols.asr ? scoreColumn(ctx.raw.asr1, slots.map((s) => s.chart.asr)) : null,
    asr2: cols.asr2 ? scoreColumn(ctx.raw.asr2, slots.map((s) => s.chart.asr2)) : null,
    maghrib: scoreColumn(ctx.raw.maghrib, slots.map((s) => s.chart.maghrib)),
  };
  const fajr = scoreColumn(col('f'), slots.map((s) => s.chart.fajr));
  const isha = scoreColumn(col('i'), slots.map((s) => s.chart.isha));
  return { spec, solar, fajr, isha };
}

// Seasonal amplitude: computed fajr-sunrise gap (minutes) on the nearest
// Jan 1-ish and Jun 21-ish rows under a cap spec, plus the chart gaps.
export function amplitude(pack, slots, spec) {
  const pickIdx = (mon) => slots.reduce((best, s, i) => {
    if (s.date.getMonth() !== mon) return best;
    const dist = Math.abs(s.date.getDate() - 15) + (mon === 0 ? 0 : 190);
    return best === null || dist < best.dist ? { i, dist } : best;
  }, null);
  const at = (i) => {
    const p = pairUnder(pack, i, spec.fa ?? 0, spec.is ?? 0, spec);
    const sr = secOf(pack.ctx.srDate[i]) / 60;
    return p.f === null ? null : (p.f / 60) - sr;
  };
  const jan = pickIdx(0), jul = pickIdx(6);
  const out = {};
  for (const [tag, hit] of [['jan', jan], ['jul', jul]]) {
    if (!hit) continue;
    const s = slots[hit.i];
    const computed = at(hit.i);
    const chartGap = Number.isNaN(s.chart.fajr) || Number.isNaN(s.chart.sunrise)
      ? null : s.chart.fajr - s.chart.sunrise;
    out[tag] = { date: s.key, computedGapMin: computed === null ? null : Math.round(computed * 10) / 10, chartGapMin: chartGap };
  }
  return out;
}

// Free scan for ONE side (f|fajr or i|isha). fajr depends only on its own
// parameters under every cap family, so the two-sided free fit decomposes
// into two 2D scans. grid: { angles?, fracs?, caps? }.
export function freeScan2D(pack, slots, prayer, kind, grid) {
  const chartArr = slots.map((s) => s.chart[prayer === 'f' ? 'fajr' : 'isha']);
  const isF = prayer === 'f';
  const angles = grid.angles ?? [];
  const fracs = grid.fracs ?? [null];
  const caps = grid.caps ?? [null];
  const out = [];
  for (const fa of angles) {
    for (const fr of fracs) {
      for (const cap of caps) {
        const spec = buildSpec(isF, kind, fa, fr, cap, grid.other);
        if (!spec) continue;
        const secArr = Float64Array.from({ length: slots.length }, (_, i) =>
          pairUnder(pack, i, spec.fa ?? 0, spec.is ?? 0, spec)[prayer]);
        const r = scoreColumn(secArr, chartArr);
        if (r) out.push({ params: { fa: spec.fa, fr: isF ? spec.fajr : spec.isha, cap: isF ? spec.fCap : spec.iCap, kind }, ...r });
      }
    }
  }
  out.sort((a, b) => b.exact - a.exact || b.within1 - a.within1 || a.worst - b.worst);
  return out.slice(0, 8);
}

function buildSpec(isF, kind, fa, fr, cap, other) {
  if (kind === 'bare') return { kind, fa, is: other };
  if (kind === 'portions') return isF
    ? { kind, fajr: fr, isha: other ?? fr }
    : { kind, fajr: other ?? fr, isha: fr, fa: other };
  if (kind === 'frozen45') return { kind, fa, is: other };
  if (kind === 'frozen45IfNaN') return { kind, fa, is: other };
  if (kind === 'minuteCap') return isF
    ? { kind, fa, is: other, fCap: cap, iCap: 9999 }
    : { kind, fa: other, is: fa, fCap: 9999, iCap: cap };
  if (kind === 'minuteOnly') return isF ? { kind, fCap: cap, iCap: 9999 } : { kind, fCap: 9999, iCap: cap };
  return null;
}

// Diagnose a chart column's freeze behaviour: distinct values + longest runs.
export function freezeDiag(slots, p) {
  const vals = slots.map((s) => s.chart[p]);
  const ok = vals.filter((v) => !Number.isNaN(v));
  let longest = 1, longVal = ok[0], cur = 1, curVal = ok[0], runs = [];
  for (let i = 1; i < ok.length; i++) {
    if (ok[i] === curVal) { cur++; if (cur > longest) { longest = cur; longVal = curVal; } }
    else { if (cur >= 3) runs.push({ len: cur, val: curVal }); cur = 1; curVal = ok[i]; }
  }
  if (cur >= 3) runs.push({ len: cur, val: curVal });
  const fmt = (v) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(Math.round(v) % 60).padStart(2, '0')}`;
  return { distinct: new Set(ok).size, longestRun: longest, longestRunValue: fmt(longVal), runs: runs.sort((a, b) => b.len - a.len).slice(0, 6) };
}
