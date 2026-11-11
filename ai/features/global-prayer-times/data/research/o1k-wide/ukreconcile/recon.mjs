// Reconciliation harness: one measurement pass over every UK capture, for the
// interval-versus-angle question. Independent of fit4/fit12/verify3 fitting code;
// adhan semantics are shared because the recipe objects are what is being named.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const AD = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs';
const adhan = require(`${AD}/Adhan.js`);
const SolarTime = require(`${AD}/SolarTime.js`).default;
const TimeComponents = require(`${AD}/TimeComponents.js`).default;
const { Coordinates, CalculationParameters, PrayerTimes, Madhab, Rounding } = adhan;

const ROOT = '$HOME/athan-gitree/census/o1k-wide';
const TZ = process.env.TZ || 'Europe/London';
const RAD = Math.PI / 180, DEG = 180 / Math.PI;

// ---------- parsing, fit4's documented pm policy (a data trap, not a fit) ----------
function pmFlag(prayer, rawVals) {
  if (prayer === 'fajr' || prayer === 'sunrise') return false;
  for (const v of rawVals) {
    const m = /^(\d{1,2}):/.exec(v || '');
    if (m && parseInt(m[1], 10) <= 9) return true;
  }
  return false;
}
function parseCol(v, prayer, isPm) {
  let h = parseInt(v.slice(0, v.indexOf(':')), 10);
  const m = parseInt(v.slice(-2), 10);
  if (isPm) {
    if (prayer === 'dhuhr' ? h <= 9 : h < 12) h += 12;
  }
  return h * 60 + m;
}

const ALIASES = {
  fajr: ['fajr', 'fajr_begins', 'subh_sadiq'],
  sunrise: ['sunrise'],
  dhuhr: ['dhuhr', 'zuhr', 'zuhr_begins', 'noon'],
  asr: ['asr', 'asr1', 'asr_mithl_1'],
  maghrib: ['magrib', 'maghrib', 'maghrib_begins'],
  isha: ['isha', 'isha_begins', 'esha'],
};

function loadCapture(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const keys = Object.keys(d).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && d[k]).sort();
  const cols = {};
  for (const [p, names] of Object.entries(ALIASES)) {
    const name = keys.length && names.find((n) => d[keys[0]][n] != null);
    if (name) cols[p] = name;
  }
  const raw = {};
  for (const [p, col] of Object.entries(cols)) raw[p] = keys.map((k) => String(d[k][col] ?? '').trim());
  const pm = {};
  for (const [p, vals] of Object.entries(raw)) pm[p] = pmFlag(p, vals);
  const rows = [];
  for (let i = 0; i < keys.length; i++) {
    const r = { iso: keys[i] };
    let ok = true;
    for (const [p, vals] of Object.entries(raw)) {
      const v = vals[i];
      if (!/^\d{1,2}:\d{2}$/.test(v)) { ok = false; break; }
      r[p] = parseCol(v, p, pm[p]);
    }
    if (ok) rows.push(r);
  }
  // an isha can print past midnight (high-latitude summer caps, Notts June 01:02)
  for (const r of rows) {
    if (r.isha != null && r.maghrib != null && r.isha < r.maghrib - 60) r.isha += 1440;
  }
  return { rows, cols, rowsRaw: keys.length };
}

// ---------- wall clock <-> instant ----------
const fmtCache = new Map();
function zoneFmt(tz) {
  if (!fmtCache.has(tz)) fmtCache.set(tz, new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  }));
  return fmtCache.get(tz);
}
function wallMin(ts) {
  const p = Object.fromEntries(zoneFmt(TZ).formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  return (Number(p.hour) % 24) * 60 + Number(p.minute) + Number(p.second) / 60;
}
function instantFor(iso, wall) {
  const [y, m, d] = iso.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  let t = base + wall * 60000;
  for (let k = 0; k < 3; k++) {
    const off = wallMin(t) - (((t - base) / 60000) % 1440);
    t = base + (wall - off) * 60000;
  }
  return t;
}

// ---------- solar altitude (NOAA low-precision, 0.01 deg class) ----------
function solarAltitude(ts, lat, lng) {
  const jd = ts / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
  const g = (((357.528 + 0.9856003 * n) % 360 + 360) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const gmst = ((18.697374558 + 24.06570982441908 * n) % 24 + 24) % 24;
  const lst = gmst * 15 * RAD + lng * RAD;
  const H = lst - ra;
  const alt = Math.asin(Math.sin(lat * RAD) * Math.sin(dec) + Math.cos(lat * RAD) * Math.cos(dec) * Math.cos(H));
  return alt * DEG;
}
// the twilight angle a printed time implies: positive depression
function impliedAngle(iso, wall, lat, lng) {
  return -solarAltitude(instantFor(iso, wall), lat, lng);
}

// ---------- adhan prediction ----------
const inst = (date, hours) => new TimeComponents(hours).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
function secOf(dt) {
  const p = Object.fromEntries(zoneFmt(TZ).formatToParts(dt).map((x) => [x.type, x.value]));
  return (Number(p.hour) % 24) * 3600 + Number(p.minute) * 60 + Number(p.second);
}
function solarCtx(lat, lng, rows) {
  const coords = new Coordinates(lat, lng);
  const out = new Map();
  for (const r of rows) {
    const [y, m, d] = r.iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const st = new SolarTime(date, coords);
    const sr = inst(date, st.sunrise), ss = inst(date, st.sunset);
    const tomorrow = new Date(y, m - 1, d + 1);
    const st2 = new SolarTime(tomorrow, coords);
    out.set(r.iso, {
      srMin: secOf(sr) / 60, ssMin: secOf(ss) / 60,
      night: (inst(tomorrow, st2.sunrise).getTime() - ss.getTime()) / 1000,
    });
  }
  return out;
}
function anglePair(lat, lng, iso, fa, is) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const st = new SolarTime(date, new Coordinates(lat, lng));
  const base = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  const toMin = (hours) => wallMin(base + hours * 3600000);
  const hf = st.hourAngle(-fa, false), hi = st.hourAngle(-is, true);
  // hourAngle returns the UTC clock hour of the event, which is exactly what
  // adhan's TimeComponents(...).utcDate() consumes. Near midsummer at 57N the
  // 15 deg isha falls just past midnight, so a reading before noon is next-day.
  const ishaMin = Number.isNaN(hi) ? null : wallMin(base + hi * 3600000);
  return {
    fajr: Number.isNaN(hf) ? null : wallMin(base + hf * 3600000),
    isha: ishaMin == null ? null : ishaMin < 720 ? ishaMin + 1440 : ishaMin,
  };
}

// ---------- scoring ----------
const MODES = { floor: Math.floor, ceil: Math.ceil, nearest: Math.round };
function scorePredictions(rows, preds, target) {
  let n = 0, exact = 0, w1 = 0, worst = 0;
  for (let i = 0; i < rows.length; i++) {
    const t = rows[i][target], c = preds[i];
    if (t == null || c == null || Number.isNaN(c)) continue;
    n++;
    // times wrap at midnight; a capped isha and its angle can sit either side
    let diff = c - t;
    diff = ((diff + 720) % 1440 + 1440) % 1440 - 720;
    if (diff === 0) exact++;
    if (Math.abs(diff) <= 1) w1++;
    worst = Math.max(worst, Math.abs(diff));
  }
  return { n, exact, w1, worst, exactShare: n ? exact / n : 0, w1Share: n ? w1 / n : 0 };
}
function bestNamed(pairs) {
  let best = null;
  for (const [mode, f] of Object.entries(MODES)) {
    for (let m = -20; m <= 20; m += 0.5) {
      let n = 0, exact = 0, w1 = 0, worst = 0;
      for (const { t, c } of pairs) {
        if (t == null || c == null || Number.isNaN(c)) continue;
        n++;
        let diff = f(c + m) - t;
        diff = ((diff + 720) % 1440 + 1440) % 1440 - 720;
        if (diff === 0) exact++;
        if (Math.abs(diff) <= 1) w1++;
        worst = Math.max(worst, Math.abs(diff));
      }
      const s = { n, exact, w1, worst, exactShare: n ? exact / n : 0, w1Share: n ? w1 / n : 0 };
      if (!best || s.exact > best.exact || (s.exact === best.exact && s.w1 > best.w1)) best = { mode, margin: m, ...s };
    }
  }
  return best;
}

function median(xs) {
  const a = [...xs].sort((x, y) => x - y);
  if (!a.length) return null;
  const n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
}
function quantile(xs, q) {
  const a = [...xs].sort((x, y) => x - y);
  if (!a.length) return null;
  return a[Math.min(a.length - 1, Math.max(0, Math.round(q * (a.length - 1))))];
}

function intervalFit(offsets) {
  if (offsets.length < 5) return null;
  const F0 = median(offsets);
  let ss = 0, w1 = 0;
  for (const o of offsets) { ss += (o - F0) ** 2; if (Math.abs(o - F0) <= 1) w1++; }
  return {
    n: offsets.length, offset: +F0.toFixed(2), rms: +Math.sqrt(ss / offsets.length).toFixed(2),
    w1Share: +(w1 / offsets.length).toFixed(3),
    min: Math.min(...offsets), max: Math.max(...offsets), range: Math.max(...offsets) - Math.min(...offsets),
  };
}

function shape(values) {
  if (!values.length) return null;
  const v = values.map((x) => x.v);
  let maxStep = 0, flat = 0;
  for (let i = 1; i < v.length; i++) {
    const s = Math.abs(v[i] - v[i - 1]);
    maxStep = Math.max(maxStep, s);
    if (s === 0) flat++;
  }
  const distinct = [...new Set(v)].sort((a, b) => a - b);
  return {
    n: v.length, min: Math.min(...v), max: Math.max(...v), range: Math.max(...v) - Math.min(...v),
    distinct: distinct.length, distinctValues: distinct,
    maxStep, flatShare: v.length > 1 ? +(flat / (v.length - 1)).toFixed(3) : 0,
  };
}

// implied-angle constancy: an angle recipe holds one depression all year.
// A printed minute quantises the implied angle, so the yardstick is the local
// rate of change: a true angle's jitter is rate/sqrt(12), a stepping table's is larger.
function angleConstancy(rows, lat, lng, prayer) {
  const pts = [];
  for (const r of rows) {
    if (r[prayer] == null) continue;
    const a = impliedAngle(r.iso, r[prayer], lat, lng);
    const up = impliedAngle(r.iso, r[prayer] + 0.6, lat, lng);
    const dn = impliedAngle(r.iso, r[prayer] - 0.6, lat, lng);
    pts.push({ iso: r.iso, a, rate: Math.abs(up - dn) / 1.2 });
  }
  if (pts.length < 5) return null;
  const a = pts.map((x) => x.a);
  const mean = a.reduce((s, x) => s + x, 0) / a.length;
  const sd = Math.sqrt(a.reduce((s, x) => s + (x - mean) ** 2, 0) / a.length);
  const rateSd = pts.reduce((s, x) => s + x.rate, 0) / pts.length / Math.sqrt(12);
  // winter half only: at UK latitudes a 15-18 deg twilight exists Sep-Apr all the way to 57N,
  // so this is the window where an angle claim is testable at every town.
  const w = pts.filter((p) => ['09', '10', '11', '12', '01', '02', '03', '04'].includes(p.iso.slice(5, 7)));
  const wa = w.map((p) => p.a);
  const wMean = wa.reduce((s, x) => s + x, 0) / wa.length;
  const wSd = Math.sqrt(wa.reduce((s, x) => s + (x - wMean) ** 2, 0) / wa.length);
  const wRate = w.reduce((s, x) => s + x.rate, 0) / w.length / Math.sqrt(12);
  // core winter: Nov-Feb, where a 15-18 deg twilight exists even at 57N, so the
  // summer cap or the install's invented summer value cannot enter the verdict
  const c = pts.filter((p) => ['11', '12', '01', '02'].includes(p.iso.slice(5, 7)));
  const ca = c.map((p) => p.a);
  const cMean = ca.reduce((s, x) => s + x, 0) / ca.length;
  const cSd = Math.sqrt(ca.reduce((s, x) => s + (x - cMean) ** 2, 0) / ca.length);
  const cRate = c.reduce((s, x) => s + x.rate, 0) / c.length / Math.sqrt(12);
  const med = median(a);
  const w1 = a.filter((x) => Math.abs(x - med) <= 0.2).length;
  const byMonth = {};
  for (const p of pts) (byMonth[p.iso.slice(5, 7)] ||= []).push(p.a);
  const monthMeans = {};
  for (const [mm, xs] of Object.entries(byMonth)) monthMeans[mm] = +(xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(2);
  return {
    n: pts.length, median: +med.toFixed(2), min: +Math.min(...a).toFixed(2), max: +Math.max(...a).toFixed(2),
    spread: +(Math.max(...a) - Math.min(...a)).toFixed(2),
    sd: +sd.toFixed(3), rateSd: +rateSd.toFixed(3), ratio: +(sd / rateSd).toFixed(2),
    winter: {
      n: wa.length, mean: +wMean.toFixed(2), range: +(Math.max(...wa) - Math.min(...wa)).toFixed(2),
      ratio: +(wSd / wRate).toFixed(2),
    },
    core: {
      n: ca.length, mean: +cMean.toFixed(2), range: +(Math.max(...ca) - Math.min(...ca)).toFixed(2),
      ratio: +(cSd / cRate).toFixed(2),
    },
    within02: +(w1 / a.length).toFixed(3), monthMeans,
    days: pts.map((p) => ({ iso: p.iso, a: +p.a.toFixed(2) })),
  };
}

// Whole-table DST defect: some publishers print every column on GMT year round
// (Walsall 2020, Slough 2022) or blip for a few days (Coventry's March rows).
// The printed solar column tells us the shift: sunrise is solar, so a ~60 min
// disagreement with the computed sunrise is the table's clock, not its recipe.
function repairClock(rows, lat, lng) {
  const coords = new Coordinates(lat, lng);
  let shifted = 0;
  for (const r of rows) {
    let anchor = r.sunrise, anchorMin = null;
    if (anchor != null) anchorMin = r.sunrise;
    else if (r.maghrib != null) { anchorMin = r.maghrib; }
    if (anchorMin == null) continue;
    const [y, m, d] = r.iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const st = new SolarTime(date, coords);
    const sr = secOf(inst(date, st.sunrise)) / 60;
    const ss = secOf(inst(date, st.sunset)) / 60;
    const ref = anchor != null ? sr : ss;
    const bias = anchorMin - ref;
    if (Math.abs(bias) > 30) {
      const hours = Math.round(bias / 60) * 60;
      for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
        if (r[k] != null) r[k] -= hours;
      }
      shifted++;
    }
  }
  return shifted;
}

// ---------- run ----------
const TOWNS = JSON.parse(fs.readFileSync(path.join(ROOT, 'ukreconcile/towns.json'), 'utf8'));
const lupt = JSON.parse(fs.readFileSync(path.join(ROOT, 'fit14/lupt_fi.json'), 'utf8'));

const luptCheck = [];
for (const f of fs.readdirSync(path.join(ROOT, 'uktowns2/data')).filter((x) => x.startsWith('lupt-2027-'))) {
  const { rows } = loadCapture(path.join(ROOT, 'uktowns2/data', f));
  let nF = 0, badF = 0, nI = 0, badI = 0;
  for (const r of rows) {
    const key = r.iso.slice(5);
    if (r.sunrise != null && lupt.F[key] != null) { nF++; if (Math.abs((r.sunrise - r.fajr) - lupt.F[key]) > 0) badF++; }
    if (r.maghrib != null && lupt.I[key] != null && r.isha != null) { nI++; if (Math.abs((r.isha - r.maghrib) - lupt.I[key]) > 0) badI++; }
  }
  luptCheck.push({ file: f, rows: rows.length, nF, badF, nI, badI });
}
// the ELM capture is the LUPT-adopted London table; check it too
{
  const { rows } = loadCapture(path.join(ROOT, 'uktowns2/data/elm-london-2026.json'));
  let nF = 0, badF = 0, nI = 0, badI = 0;
  for (const r of rows) {
    const key = r.iso.slice(5);
    if (r.sunrise != null && lupt.F[key] != null) { nF++; if (Math.abs((r.sunrise - r.fajr) - lupt.F[key]) > 0) badF++; }
    if (r.maghrib != null && lupt.I[key] != null && r.isha != null) { nI++; if (Math.abs((r.isha - r.maghrib) - lupt.I[key]) > 0) badI++; }
  }
  luptCheck.push({ file: 'elm-london-2026 (LUPT-adopted)', rows: rows.length, nF, badF, nI, badI });
}

const out = { tz: TZ, luptCheck, towns: {} };
for (const t of TOWNS) {
  const file = path.join(ROOT, t.src);
  const { rows, cols, rowsRaw } = loadCapture(file);
  const clockShifted = repairClock(rows, t.lat, t.lng);
  const ctx = solarCtx(t.lat, t.lng, rows);

  const F = [], I = [], dF = [], dI = [], fajrAng = [], ishaAng = [];
  for (const r of rows) {
    if (r.sunrise != null && r.fajr != null) {
      const f = r.sunrise - r.fajr; F.push({ iso: r.iso, v: f });
      fajrAng.push({ iso: r.iso, v: impliedAngle(r.iso, r.fajr, t.lat, t.lng) });
      if (lupt.F[r.iso.slice(5)] != null) dF.push({ iso: r.iso, d: f - lupt.F[r.iso.slice(5)] });
    }
    if (r.maghrib != null && r.isha != null) {
      const i = r.isha - r.maghrib; I.push({ iso: r.iso, v: i });
      ishaAng.push({ iso: r.iso, v: impliedAngle(r.iso, r.isha, t.lat, t.lng) });
      if (lupt.I[r.iso.slice(5)] != null) dI.push({ iso: r.iso, d: i - lupt.I[r.iso.slice(5)] });
    }
  }

  // defect blips: F or I more than 20 min from the local 7-day median
  const blips = [];
  for (const [key, arr] of [['F', F], ['I', I]]) {
    const v = arr.map((x) => x.v);
    for (let i = 0; i < v.length; i++) {
      const w = v.slice(Math.max(0, i - 3), Math.min(v.length, i + 4));
      const med = median(w);
      if (Math.abs(v[i] - med) > 20) blips.push({ iso: arr[i].iso, array: key, value: v[i], localMedian: med });
    }
  }
  const blipIsos = new Set(blips.map((b) => b.iso));
  const clean = rows.filter((r) => !blipIsos.has(r.iso));

  const preds = {};
  for (const [name, fa, is] of [['karachi', 18, 18], ['isna', 15, 15], ['mwl', 18, 17], ['diyanet', 18, 16]]) {
    preds[name] = { fajr: [], isha: [] };
    for (const r of rows) {
      const p = anglePair(t.lat, t.lng, r.iso, fa, is);
      preds[name].fajr.push(p.fajr); preds[name].isha.push(p.isha);
    }
  }
  preds.wifaqul = { fajr: [], isha: [] };
  for (const r of rows) {
    const c = ctx.get(r.iso);
    const p = anglePair(t.lat, t.lng, r.iso, 18, 15);
    const fSafe = c.srMin - (1 / 2) * c.night / 60;
    const iSafe = c.ssMin + (1 / 7) * c.night / 60;
    preds.wifaqul.fajr.push(p.fajr == null ? fSafe : Math.max(p.fajr, fSafe));
    preds.wifaqul.isha.push(p.isha == null ? iSafe : Math.min(p.isha, iSafe));
  }
  // adhan's stock middle-of-night rule: 18/18 capped at half the night on both ends
  preds.karachiHalfNight = { fajr: [], isha: [] };
  for (const r of rows) {
    const c = ctx.get(r.iso);
    const p = anglePair(t.lat, t.lng, r.iso, 18, 18);
    const fSafe = c.srMin - 0.5 * c.night / 60;
    const iSafe = c.ssMin + 0.5 * c.night / 60;
    preds.karachiHalfNight.fajr.push(p.fajr == null ? fSafe : Math.max(p.fajr, fSafe));
    preds.karachiHalfNight.isha.push(p.isha == null ? iSafe : Math.min(p.isha, iSafe));
  }

  const coreRows = rows.filter((r) => ['11', '12', '01', '02'].includes(r.iso.slice(5, 7)));
  const coreIsos = new Set(coreRows.map((r) => r.iso));
  const side = (prayer, arr, angArr, dArr) => {
    if (process.env.DBG === t.tag) {
      for (let i = 0; i < rows.length; i++) {
        const p = preds.wifaqul[prayer][i], print = rows[i][prayer];
        if (p == null || print == null) continue;
        let d = p - print; d = ((d + 720) % 1440 + 1440) % 1440 - 720;
        if (Math.abs(d) > 1) process.stderr.write(`DBG ${t.tag} ${prayer} ${rows[i].iso} printed=${print} pred=${p.toFixed(1)} diff=${d.toFixed(1)}\n`);
      }
    }
    const named = {};
    const namedCore = {};
    for (const name of Object.keys(preds)) {
      const all = rows.map((r, i) => ({ t: r[prayer], c: preds[name][prayer][i] }));
      named[name] = bestNamed(all);
      namedCore[name] = bestNamed(all.filter((_, i) => coreIsos.has(rows[i].iso)));
    }
    // a recipe is its parameters: a free offset proves the angle FORM, never the recipe.
    // This block allows the printer's rounding mode but no offset.
    const namedZero = {};
    const namedZeroAll = {};
    for (const name of Object.keys(preds)) {
      const score = (onlyCore) => {
        let b = null;
        for (const [mode, f] of Object.entries(MODES)) {
          let n = 0, exact = 0, w1 = 0, worst = 0;
          for (let i = 0; i < rows.length; i++) {
            if (onlyCore && !coreIsos.has(rows[i].iso)) continue;
            const t = rows[i][prayer], c = preds[name][prayer][i];
            if (t == null || c == null || Number.isNaN(c)) continue;
            n++;
            let diff = f(c) - t;
            diff = ((diff + 720) % 1440 + 1440) % 1440 - 720;
            if (diff === 0) exact++;
            if (Math.abs(diff) <= 1) w1++;
            worst = Math.max(worst, Math.abs(diff));
          }
          const s = { mode, n, exact, w1, worst, exactShare: n ? exact / n : 0, w1Share: n ? w1 / n : 0 };
          if (!b || s.w1 > b.w1 || (s.w1 === b.w1 && s.exact > b.exact)) b = s;
        }
        return b;
      };
      namedZero[name] = score(true);
      namedZeroAll[name] = score(false);
    }
    return {
      count: arr.length,
      columnCount: rows.filter((r) => r[prayer] != null).length,
      shape: shape(arr),
      interval: intervalFit(arr.map((x) => x.v)),
      angle: angleConstancy(rows, t.lat, t.lng, prayer),
      named,
      namedCore,
      namedZero,
      namedZeroAll,
      lupt: dArr.length ? {
        n: dArr.length,
        median: +median(dArr.map((x) => x.d)).toFixed(2),
        within1: +((dArr.filter((x) => Math.abs(x.d - median(dArr.map((y) => y.d))) <= 1).length) / dArr.length).toFixed(3),
        min: Math.min(...dArr.map((x) => x.d)), max: Math.max(...dArr.map((x) => x.d)),
        months: Object.fromEntries([...new Set(dArr.map((x) => x.iso.slice(5, 7)))].map((mm) => {
          const xs = dArr.filter((x) => x.iso.slice(5, 7) === mm).map((x) => x.d);
          return [mm, +(xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(1)];
        })),
      } : null,
      blips: blips.filter((b) => (prayer === 'fajr' ? b.array === 'F' : b.array === 'I')),
    };
  };

  out.towns[t.tag] = {
    town: t.town, region: t.region, file: t.src, lat: t.lat, lng: t.lng, span: t.span,
    rowsRaw, rowsParsed: rows.length, rowsClean: clean.length, cols, clockShifted,
    fajr: side('fajr', F, fajrAng, dF),
    isha: side('isha', I, ishaAng, dI),
  };
  fs.writeFileSync(path.join(ROOT, 'ukreconcile/recon.json'), JSON.stringify(out, null, 1));
  const f = out.towns[t.tag].fajr, i = out.towns[t.tag].isha;
  process.stderr.write(`${t.tag.padEnd(22)} rows=${String(rows.length).padStart(3)} dst=${String(clockShifted).padStart(3)} blips=${String(blips.length).padStart(2)} F[${f.shape ? f.shape.min + '..' + f.shape.max : '-'}] aF=${f.angle ? f.angle.median + '(' + f.angle.ratio + ')' : '-'} I[${i.shape ? i.shape.min + '..' + i.shape.max : '-'}] aI=${i.angle ? i.angle.median + '(' + i.angle.ratio + ')' : '-'}\n`);
}
fs.writeFileSync(path.join(ROOT, 'ukreconcile/recon.json'), JSON.stringify(out, null, 1));
console.log('done', Object.keys(out.towns).length);
