// Shared fit engine for the fit4 jobs. Census discipline: adhan 4.4.6 at
// second resolution (rounding 'none'), explicit margin+rounding per prayer,
// dates built from the data's own strings, TZ comes from the runner's env.
import fs from 'node:fs';
import { loadAdhan, parseHHMM, bestMargin } from './lib.mjs';

const HOME = process.env.HOME;
export const A2 = (x) => Math.round(x * 20) / 20; // 0.05 grid exactness

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const secOf = (dt) => dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();

// pm flag: fajr/sunrise are always am. An afternoon column is 12h when some
// value's hour is 9 or less (no dhuhr/asr/maghrib/isha in these zones starts
// before 10:00 on the 24h clock), otherwise 24h.
export function pmFlag(prayer, rawVals) {
  if (prayer === 'fajr' || prayer === 'sunrise') return false;
  for (const v of rawVals) {
    const m = /^(\d{1,2}):/.exec(v);
    if (m && parseInt(m[1], 10) <= 9) return true;
  }
  return false;
}

// Bump policy for 12h afternoon columns: asr/maghrib/isha bump any hour < 12;
// dhuhr bumps only hours 1-9 (pre-noon "11:56"-class values are genuine AM).
export function parseCol(v, prayer, isPm) {
  let h = parseInt(v.slice(0, v.indexOf(':')), 10);
  const m = parseInt(v.slice(-2), 10);
  if (isPm) {
    if (prayer === 'dhuhr' ? h <= 9 : h < 12) h += 12;
  }
  return h * 60 + m;
}

export function loadTable(cfg) {
  const data = JSON.parse(fs.readFileSync(cfg.file, 'utf8'));
  const keys = Object.keys(data).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && data[k] && !(cfg.drop && cfg.drop(k))).sort();
  const cols = cfg.cols;
  const raw = {};
  for (const [p, col] of Object.entries(cols)) raw[p] = keys.map((k) => String(data[k][col] ?? '').trim());
  const pm = {};
  for (const [p, vals] of Object.entries(raw)) pm[p] = pmFlag(p, vals);
  const slots = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const [y, m, d] = key.split('-').map(Number);
    const chart = {};
    let ok = true;
    for (const [p, vals] of Object.entries(raw)) {
      const v = vals[i];
      if (!/^\d{1,2}:\d{2}$/.test(v)) { ok = false; break; }
      chart[p] = parseCol(v, p, pm[p]);
    }
    if (ok) slots.push({ key, date: new Date(y, m - 1, d), chart });
  }
  return { slots, pm, rowsTotal: keys.length, rowsParsed: slots.length };
}

export async function makeContext(lat, lng, slots) {
  const adhan = await loadAdhan();
  const coords = new adhan.Coordinates(lat, lng);
  const n = slots.length;
  const solar = slots.map((s) => new adhan.SolarTime(s.date, coords));
  const inst = (date, hours) =>
    new adhan.TimeComponents(hours).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
  const srDate = new Array(n), ssDate = new Array(n), night = new Float64Array(n);
  const raw = {
    sunrise: new Float64Array(n), dhuhr: new Float64Array(n),
    asr1: new Float64Array(n), asr2: new Float64Array(n), maghrib: new Float64Array(n),
  };
  for (let i = 0; i < n; i++) {
    const st = solar[i], d = slots[i].date;
    srDate[i] = inst(d, st.sunrise);
    ssDate[i] = inst(d, st.sunset);
    raw.sunrise[i] = secOf(srDate[i]);
    raw.dhuhr[i] = secOf(inst(d, st.transit));
    raw.asr1[i] = secOf(inst(d, st.afternoon(1)));
    raw.asr2[i] = secOf(inst(d, st.afternoon(2)));
    raw.maghrib[i] = secOf(ssDate[i]);
    const tomorrow = addDays(d, 1);
    const st2 = new adhan.SolarTime(tomorrow, coords);
    night[i] = (inst(tomorrow, st2.sunrise).getTime() - ssDate[i].getTime()) / 1000;
  }
  const hourAngle = (i, angle, after) => inst(slots[i].date, solar[i].hourAngle(angle, after));

  // fajr/isha seconds for one day, adhan semantics: the later of (angle time,
  // portion-of-night time); the portion fallback covers NaN. portions null = bare.
  const pairSec = (i, fa, is, portions) => {
    const out = { f: null, i: null };
    const faT = hourAngle(i, -fa, false);
    if (portions) {
      const safe = new Date(srDate[i].getTime() - portions.fajr * night[i] * 1000);
      const t = isNaN(faT.getTime()) || safe > faT ? safe : faT;
      out.f = secOf(t);
    } else if (!isNaN(faT.getTime())) out.f = secOf(faT);
    const isT = hourAngle(i, -is, true);
    if (portions) {
      const safe = new Date(ssDate[i].getTime() + portions.isha * night[i] * 1000);
      const t = isNaN(isT.getTime()) || safe < isT ? safe : isT;
      out.i = secOf(t);
    } else if (!isNaN(isT.getTime())) out.i = secOf(isT);
    return out;
  };
  return { adhan, coords, solar, raw, srDate, ssDate, night, inst, hourAngle, pairSec, n };
}

// -- solar (angle-independent) scores ---------------------------------------

export function solarScores(ctx, slots, cols) {
  const chartOf = (p) => Int32Array.from(slots, (s) => s.chart[p]);
  const out = {};
  if (cols.sunrise) out.sunrise = bestMargin(ctx.raw.sunrise, chartOf('sunrise'));
  out.dhuhr = bestMargin(ctx.raw.dhuhr, chartOf('dhuhr'));
  if (cols.asr) {
    out.asrShafi = bestMargin(ctx.raw.asr1, chartOf('asr'));
    out.asrHanafi = bestMargin(ctx.raw.asr2, chartOf('asr'));
    out.asrBest = out.asrShafi.exact >= out.asrHanafi.exact ? 'shafi' : 'hanafi';
  }
  out.maghrib = bestMargin(ctx.raw.maghrib, chartOf('maghrib'));
  return out;
}

const solarTotal = (solar) =>
  (solar.sunrise?.exact ?? 0) + solar.dhuhr.exact +
  Math.max(solar.asrShafi?.exact ?? 0, solar.asrHanafi?.exact ?? 0) + solar.maghrib.exact;

// -- candidate scoring --------------------------------------------------------

export function scoreCandidate(ctx, slots, cand, solar) {
  const n = ctx.n;
  const fChart = Int32Array.from(slots, (s) => s.chart.fajr);
  const iChart = Int32Array.from(slots, (s) => s.chart.isha);
  const fv = [], iv = [];
  for (let i = 0; i < n; i++) {
    const p = ctx.pairSec(i, cand.fa, cand.is, cand.portions ?? null);
    if (p.f !== null) fv.push([p.f, fChart[i]]);
    if (p.i !== null) iv.push([p.i, iChart[i]]);
  }
  const f = bestMargin(Float64Array.from(fv, (x) => x[0]), Int32Array.from(fv, (x) => x[1]));
  const g = bestMargin(Float64Array.from(iv, (x) => x[0]), Int32Array.from(iv, (x) => x[1]));
  const fFull = { ...f, coverage: fv.length };
  const iFull = { ...g, coverage: iv.length };
  return {
    ...cand,
    fajr: fFull, isha: iFull,
    total: fFull.exact + iFull.exact + solarTotal(solar),
  };
}

// A named preset served exactly as its library defines it: fixed adjustments,
// fixed rounding, zero margin. Baseline for "does the portal serve the stock
// preset" questions.
export function scoreStockPreset(ctx, slots, preset, solar) {
  const params = preset.make();
  params.rounding = 'none';
  params.madhab = preset.madhab ?? 'shafi';
  const PT = ctx.adhan.PrayerTimes;
  const map = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const per = {};
  let exact = 0, within1 = 0;
  for (const p of map) {
    if (slots[0].chart[p] === undefined) continue;
    let e = 0, w = 0, worst = 0;
    for (let i = 0; i < slots.length; i++) {
      const pt = new PT(ctx.coords, slots[i].date, params);
      const mins = secOf(pt[p]) / 60;
      const diff = Math.abs(Math.round(mins) - slots[i].chart[p]);
      if (diff === 0) e++;
      if (diff <= 1) w++;
      if (diff > worst) worst = diff;
    }
    per[p] = { exact: e, within1: w, worst, margin: 0, mode: 'preset', coverage: slots.length };
    exact += e; within1 += w;
  }
  return { name: preset.name, stock: true, per, total: exact, within1 };
}

// -- free fit -----------------------------------------------------------------

export function freeFit(ctx, slots, opts = {}) {
  const { faMin = 12, faMax = 21, isMin = 12, isMax = 21, coarse = 0.25 } = opts;
  const fChart = Int32Array.from(slots, (s) => s.chart.fajr);
  const iChart = Int32Array.from(slots, (s) => s.chart.isha);
  const n = ctx.n;

  const scan = (portions, tag) => {
    const top = [];
    const fas = []; for (let a = faMin; a <= faMax + 1e-9; a += coarse) fas.push(A2(a));
    const iss = []; for (let a = isMin; a <= isMax + 1e-9; a += coarse) iss.push(A2(a));
    for (const fa of fas) {
      const fBuf = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        const v = ctx.pairSec(i, fa, iss[0], portions).f;
        fBuf[i] = v === null ? -1 : v;
      }
      const fv = [];
      for (let i = 0; i < n; i++) if (fBuf[i] >= 0) fv.push([fBuf[i], fChart[i]]);
      const bf = bestMargin(Float64Array.from(fv, (x) => x[0]), Int32Array.from(fv, (x) => x[1]));
      const fCov = fv.length;
      for (const is of iss) {
        const iv = [];
        for (let i = 0; i < n; i++) {
          const v = ctx.pairSec(i, fa, is, portions).i;
          if (v !== null) iv.push([v, iChart[i]]);
        }
        const bi = bestMargin(Float64Array.from(iv, (x) => x[0]), Int32Array.from(iv, (x) => x[1]));
        top.push({ fa, is, tag, cov: Math.min(fCov, iv.length), sum: bf.exact + bi.exact, w1: bf.within1 + bi.within1, worst: bf.worst + bi.worst, bf, bi });
      }
    }
    top.sort((a, b) => b.sum - a.sum || b.w1 - a.w1 || a.worst - b.worst);
    const refined = [...top.slice(0, 3)];
    for (const seed of top.slice(0, 3)) {
      for (let dfa = -0.5; dfa <= 0.501; dfa += 0.05) {
        for (let dis = -0.5; dis <= 0.501; dis += 0.05) {
          const fa = A2(seed.fa + dfa), is = A2(seed.is + dis);
          if (fa < faMin || fa > faMax || is < isMin || is > isMax) continue;
          if (refined.some((r) => Math.abs(r.fa - fa) < 1e-9 && Math.abs(r.is - is) < 1e-9)) continue;
          const fv = [], iv = [];
          for (let i = 0; i < n; i++) {
            const p = ctx.pairSec(i, fa, is, portions);
            if (p.f !== null) fv.push([p.f, fChart[i]]);
            if (p.i !== null) iv.push([p.i, iChart[i]]);
          }
          const bf = bestMargin(Float64Array.from(fv, (x) => x[0]), Int32Array.from(fv, (x) => x[1]));
          const bi = bestMargin(Float64Array.from(iv, (x) => x[0]), Int32Array.from(iv, (x) => x[1]));
          refined.push({ fa, is, tag, cov: Math.min(fv.length, iv.length), sum: bf.exact + bi.exact, w1: bf.within1 + bi.within1, worst: bf.worst + bi.worst, bf, bi });
        }
      }
    }
    refined.sort((a, b) => b.sum - a.sum || b.w1 - a.w1 || a.worst - b.worst);
    return refined;
  };

  const bare = scan(null, 'bare');
  const capSeventh = scan({ fajr: 1 / 7, isha: 1 / 7 }, 'cap-1/7');
  const capHalf7 = scan({ fajr: 1 / 2, isha: 1 / 7 }, 'cap-1/2+1/7');

  // Pure portion scan (fractions 1/2..1/12) on the best capped pair.
  const fracs = [1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8, 1 / 9, 1 / 10, 1 / 11, 1 / 12];
  const seed = capHalf7[0].sum >= capSeventh[0].sum ? capHalf7[0] : capSeventh[0];
  const portions = [];
  const fBuf = new Float64Array(n), iBuf = new Float64Array(n);
  for (const pF of fracs) {
    for (let i = 0; i < n; i++) {
      const faT = ctx.hourAngle(i, -seed.fa, false);
      const safe = new Date(ctx.srDate[i].getTime() - pF * ctx.night[i] * 1000);
      const t = isNaN(faT.getTime()) || safe > faT ? safe : faT;
      fBuf[i] = secOf(t);
    }
    for (const pI of fracs) {
      for (let i = 0; i < n; i++) {
        const isT = ctx.hourAngle(i, -seed.is, true);
        const safe = new Date(ctx.ssDate[i].getTime() + pI * ctx.night[i] * 1000);
        const t = isNaN(isT.getTime()) || safe < isT ? safe : isT;
        iBuf[i] = secOf(t);
      }
      const bf = bestMargin(fBuf, fChart);
      const bi = bestMargin(iBuf, iChart);
      portions.push({ pF, pI, fa: seed.fa, is: seed.is, sum: bf.exact + bi.exact, w1: bf.within1 + bi.within1, worst: bf.worst + bi.worst, bf, bi });
    }
  }
  portions.sort((a, b) => b.sum - a.sum || b.w1 - a.w1 || a.worst - b.worst);

  return {
    grid: { fajr: `${faMin}-${faMax}@${coarse} + 0.05 refine`, isha: `${isMin}-${isMax}@${coarse} + 0.05 refine`, portions: '1/2..1/12 on the best capped pair' },
    bare: bare.slice(0, 10),
    capSeventh: capSeventh.slice(0, 10),
    capHalf7: capHalf7.slice(0, 10),
    portionScan: portions.slice(0, 10),
  };
}

// -- diagnostics ------------------------------------------------------------

export function runStats(mins) {
  const fmt = (v) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
  let longest = 1, cur = 1, curVal = mins[0], longVal = mins[0];
  for (let i = 1; i < mins.length; i++) {
    if (mins[i] === curVal) {
      cur++;
      if (cur > longest) { longest = cur; longVal = curVal; }
    } else { cur = 1; curVal = mins[i]; }
  }
  return { distinct: new Set(mins).size, longestRun: longest, longestRunValue: fmt(longVal) };
}

export function diagColumns(slots) {
  return {
    fajr: runStats(slots.map((s) => s.chart.fajr)),
    sunrise: slots[0].chart.sunrise !== undefined ? runStats(slots.map((s) => s.chart.sunrise)) : null,
    isha: runStats(slots.map((s) => s.chart.isha)),
  };
}

// -- one table ---------------------------------------------------------------

export async function fitTable(cfg, candidates, opts = {}) {
  const t = loadTable(cfg);
  const ctx = await makeContext(cfg.lat, cfg.lng, t.slots);
  const cols = cfg.cols;
  const solar = solarScores(ctx, t.slots, cols);
  const cands = candidates.map((c) => scoreCandidate(ctx, t.slots, c, solar));
  cands.sort((a, b) => b.total - a.total);
  const free = opts.skipFree ? null : freeFit(ctx, t.slots, opts.free ?? {});
  const diag = diagColumns(t.slots);
  return {
    tag: cfg.tag, file: cfg.file, lat: cfg.lat, lng: cfg.lng, tz: cfg.tz,
    rowsParsed: t.rowsParsed, rowsTotal: t.rowsTotal, pm: t.pm, cols,
    solar, candidates: cands, freeFit: free, diag,
  };
}

export const fmtFrac = (x) =>
  ({ '0.5': '1/2', '0.3333333333333333': '1/3', '0.25': '1/4', '0.2': '1/5', '0.16666666666666666': '1/6', '0.14285714285714285': '1/7', '0.125': '1/8', '0.1111111111111111': '1/9', '0.1': '1/10', '0.09090909090909091': '1/11', '0.08333333333333333': '1/12' })[String(x)] ?? x.toFixed(3);

export function printTable(res) {
  const l = (s) => console.log(s);
  l(`\n### ${res.tag}  (${res.rowsParsed}/${res.rowsTotal} rows, ${res.lat},${res.lng}, TZ ${res.tz})`);
  l('solar (angle-independent, best margin+mode):');
  for (const [name, r] of Object.entries(res.solar)) if (r.exact !== undefined) l('  ' + `${name.padEnd(10)} exact ${String(r.exact).padStart(3)}  within1 ${String(r.within1).padStart(3)}  worst ${String(r.worst).padStart(3)}  (margin ${r.margin >= 0 ? '+' + r.margin : r.margin} ${r.mode})`);
  l('candidates (fajr/isha with their best margin+mode):');
  for (const c of res.candidates) {
    const por = c.portions ? ` cap ${fmtFrac(c.portions.fajr)}/${fmtFrac(c.portions.isha)}` : '';
    l(`  ${c.name.padEnd(34)} ${String(c.fa).padStart(4)}/${String(c.is).padStart(4)}${por.padEnd(12)} total ${String(c.total).padStart(4)}  fajr ${c.fajr.exact}/${c.fajr.coverage}  isha ${c.isha.exact}/${c.isha.coverage}  worst f${c.fajr.worst} i${c.isha.worst}`);
  }
  if (res.freeFit) {
    const f = res.freeFit;
    l(`free fit: bare best ${f.bare[0].fa}/${f.bare[0].is} sum ${f.bare[0].sum} cov ${f.bare[0].cov} | cap1/7 ${f.capSeventh[0].fa}/${f.capSeventh[0].is} sum ${f.capSeventh[0].sum} | cap1/2+1/7 ${f.capHalf7[0].fa}/${f.capHalf7[0].is} sum ${f.capHalf7[0].sum}`);
    const ps = f.portionScan[0];
    l(`  portion scan best: ${fmtFrac(ps.pF)}/${fmtFrac(ps.pI)} on ${ps.fa}/${ps.is} sum ${ps.sum} (fajr ${ps.bf.exact}, isha ${ps.bi.exact})`);
  }
  l(`diag: fajr ${res.diag.fajr.distinct} distinct, longest run ${res.diag.fajr.longestRun} @${res.diag.fajr.longestRunValue}; isha ${res.diag.isha.distinct} distinct, longest run ${res.diag.isha.longestRun} @${res.diag.isha.longestRunValue}`);
}
