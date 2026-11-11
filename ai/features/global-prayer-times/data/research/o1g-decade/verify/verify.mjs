// Independent verification of the o1g decade claim.
// Stage 1: decode the publisher artifact ourselves, compare with truth/*.json.
// Stage 2: regenerate from fit/recipe.json with our own solar engine, re-score.
// Stage 3: leap-day rows, hand checks.
// Written from recipe.json alone; the other agents' code was not read.
import fs from 'node:fs';
import path from 'node:path';

const HOME = process.env.HOME;
const ROOT = path.join(HOME, 'athan-gitree/census/o1g-decade');
const BIN = '$HOME/repos/rn.athan.uk/assets/data/london-2026-2076.bin';
const OUT = path.join(ROOT, 'verify');

export const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];

const pad = (n, w = 2) => String(n).padStart(w, '0');
const iso = (y, m, d) => `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
const DAYMS = 86400000;

function daysInMonth(y, m) {
  return [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

// --- artifact decoder: 12-byte header, day-major 6x uint16 LE minutes ---------
export function decodeBin(file) {
  const buf = fs.readFileSync(file);
  const magic = buf.subarray(0, 4).toString('ascii');
  const fmt = buf.readUInt16LE(4);
  const epochDay = buf.readUInt16LE(6);
  const dayCount = buf.readUInt16LE(8);
  const cols = buf.readUInt16LE(10);
  if (magic !== 'LUPT' || fmt !== 1 || cols !== 6) throw new Error(`bad header ${magic}/${fmt}/${cols}`);
  if (buf.length !== 12 + dayCount * cols * 2) throw new Error(`bad length ${buf.length}`);
  const rows = new Map();
  for (let i = 0; i < dayCount; i++) {
    const t = new Date((epochDay + i) * DAYMS);
    const key = iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
    const o = {};
    for (let c = 0; c < cols; c++) o[PRAYERS[c]] = buf.readUInt16LE(12 + (i * cols + c) * 2);
    rows.set(key, o);
  }
  return { header: { magic, fmt, epochDay, dayCount, cols }, rows };
}

const hhmm = (m) => {
  const x = Math.round(m);
  return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
};

// ============================ STAGE 1 ========================================
function stageTruth() {
  const { header, rows } = decodeBin(BIN);
  const extracted = new Map();
  for (let y = 2028; y <= 2038; y++) {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInMonth(y, m); d++) {
        const k = iso(y, m, d);
        const r = rows.get(k);
        if (!r) throw new Error(`missing ${k}`);
        extracted.set(k, r);
      }
    }
  }
  const truthJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'truth/truth-2028-2038.json'), 'utf8'));
  const truthKeys = Object.keys(truthJson);
  const mismatches = [];
  const missing = [];
  for (const k of extracted.keys()) {
    if (!(k in truthJson)) { missing.push(k); continue; }
    for (const p of PRAYERS) {
      const t = truthJson[k][p];
      const [h, mi] = t.split(':').map(Number);
      const tm = h * 60 + mi;
      if (tm !== extracted.get(k)[p]) mismatches.push({ date: k, prayer: p, truth: t, bin: hhmm(extracted.get(k)[p]) });
    }
  }
  const extra = truthKeys.filter((k) => !extracted.has(k));
  const badDateField = truthKeys.filter((k) => truthJson[k].date !== k);

  // 2027 overlay: does the artifact agree with data/2027.json (the fit input)?
  const tbl2027 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/2027.json'), 'utf8'));
  const c2027 = [];
  for (const k of Object.keys(tbl2027)) {
    const r = rows.get(k);
    for (const p of PRAYERS) {
      const [h, mi] = tbl2027[k][p].split(':').map(Number);
      if (h * 60 + mi !== r[p]) c2027.push({ date: k, prayer: p, table: tbl2027[k][p], bin: hhmm(r[p]) });
    }
  }
  const out = {
    header,
    artifactRange: { first: [...rows.keys()][0], last: [...rows.keys()][rows.size - 1] },
    extractedDays: extracted.size,
    truthDays: truthKeys.length,
    truthCells: truthKeys.length * 6,
    cellMismatches: mismatches.length,
    mismatchesSample: mismatches.slice(0, 20),
    missingFromTruth: missing.length,
    extraInTruth: extra.length,
    badDateField: badDateField.length,
    artifactVs2027Table: { cells: Object.keys(tbl2027).length * 6, mismatches: c2027.length, sample: c2027.slice(0, 10) },
  };
  fs.writeFileSync(path.join(OUT, 'stage1-truth.json'), JSON.stringify(out, null, 2));
  console.log('STAGE1', JSON.stringify(out, null, 1).slice(0, 1200));
  fs.writeFileSync(path.join(OUT, 'extract-2028-2038.json'), JSON.stringify(Object.fromEntries(extracted)));
  return extracted;
}

// ============================ STAGE 2 ========================================
const D = Math.PI / 180;
const sind = (x) => Math.sin(x * D);
const cosd = (x) => Math.cos(x * D);
const tand = (x) => Math.tan(x * D);
const asind = (x) => Math.asin(x) / D;
const acosd = (x) => Math.acos(x) / D;
const atan2d = (y, x) => Math.atan2(y, x) / D;
const fix360 = (a) => ((a % 360) + 360) % 360;

// Meeus ch.22/25 solar coordinates (low-order, the standard "Meeus solar position").
function solar(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = fix360(280.46646 + T * (36000.76983 + 0.0003032 * T));
  const M = fix360(357.52911 + T * (35999.05029 - 0.0001537 * T));
  const C = sind(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) + sind(2 * M) * (0.019993 - 0.000101 * T) + sind(3 * M) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * sind(omega); // apparent longitude
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * cosd(omega);
  const dec = asind(sind(eps) * sind(lambda));
  const ra = fix360(atan2d(cosd(eps) * sind(lambda), cosd(lambda)));
  // apparent sidereal time at Greenwich (deg): Meeus 12.4 + nutation in longitude
  const theta0 = fix360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000);
  const dpsi = (-17.2 * sind(omega) - 1.32 * sind(2 * L0) - 0.23 * sind(2 * M) + 0.21 * sind(2 * omega)) / 3600;
  const gast = fix360(theta0 + dpsi * cosd(eps));
  return { T, dec, ra, gast };
}

// Julian day at 0h UT of a civil date (Meeus 7.1, Gregorian).
function jd0(y, m, d) {
  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;
}

// Solar transit as a fraction of the UT day: local sidereal time = apparent RA.
// g(t) = RA(t) - lon - GAST(t) falls by ~360 deg per day, so one root near noon.
function transitFraction(y, m, d, lon) {
  const jdStart = jd0(y, m, d);
  const s0 = solar(jdStart);
  const t0 = (((s0.ra - lon - s0.gast) / 360) % 1 + 1) % 1;
  const f = (t) => {
    const s = solar(jdStart + t);
    const diff = s.ra - lon - s.gast;
    return ((diff % 360) + 540) % 360 - 180; // signed residual, deg
  };
  let lo = t0 - 0.25, hi = t0 + 0.25;
  let flo = f(lo);
  if (flo < 0) throw new Error('bracket lost'); // g decreases through the root
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (fm > 0) { lo = mid; flo = fm; } else { hi = mid; }
  }
  return (lo + hi) / 2;
}

// Europe/London offset in minutes for a UTC instant, from the rule alone.
function lastSunday(y, month) {
  const last = new Date(Date.UTC(y, month, 0)).getUTCDate();
  const dow = new Date(Date.UTC(y, month - 1, last)).getUTCDay();
  return last - dow; // 0 = Sunday
}
function londonOffsetMs(utcMs) {
  const y = new Date(utcMs).getUTCFullYear();
  const start = Date.UTC(y, 2, lastSunday(y, 3), 1, 0, 0);
  const end = Date.UTC(y, 9, lastSunday(y, 10), 1, 0, 0);
  return utcMs >= start && utcMs < end ? 60 : 0;
}

const HA = (lat, dec, alt) => {
  const x = (sind(alt) - sind(lat) * sind(dec)) / (cosd(lat) * cosd(dec));
  return (acosd(Math.max(-1, Math.min(1, x))) / 15) * 60;
};
const rnd = (x) => Math.floor(x + 0.5);

export function generate(recipe, y, m, d) {
  const lat = recipe.coordinates.latitude, lon = recipe.coordinates.longitude;
  const jdStart = jd0(y, m, d);
  const t = transitFraction(y, m, d, lon); // UT fraction of day
  const utcMs = Date.UTC(y, m - 1, d) + t * DAYMS;
  const transitMin = t * 1440 + londonOffsetMs(utcMs);
  const dec = solar(jdStart + 0.5).dec; // 12:00 UT of the civil date
  const hz = recipe.solarModel.horizonAltitudeDegrees;
  const ha = HA(lat, dec, hz);
  const asrAlt = Math.atan(1 / (1 + Math.abs(Math.tan((lat - dec) * D)))) / D;
  const haAsr = HA(lat, dec, asrAlt);
  const key = `${pad(m)}-${pad(d)}`;
  const sunrise = rnd(transitMin - ha + recipe.prayers.sunrise.marginMinutes);
  const magrib = rnd(transitMin + ha + recipe.prayers.magrib.marginMinutes);
  const dhuhr = rnd(transitMin + recipe.prayers.dhuhr.marginMinutes);
  const asr = rnd(transitMin + haAsr + recipe.prayers.asr.marginMinutes);
  return {
    fajr: sunrise - recipe.prayers.fajr.table[key],
    sunrise,
    dhuhr,
    asr,
    magrib,
    isha: magrib + recipe.prayers.isha.table[key],
    _raw: { transitMin, dec, ha, asrAlt, haAsr, utcFrac: t, offset: londonOffsetMs(utcMs) },
  };
}

function score(pairs) {
  const n = pairs.length;
  let exact = 0, w1 = 0, worst = 0, sum = 0;
  for (const [p, t] of pairs) {
    const e = Math.abs(p - t);
    if (e === 0) exact++;
    if (e <= 1) w1++;
    if (e > worst) worst = e;
    sum += e;
  }
  return { n, exact, within1: w1, worst, mae: +(sum / n).toFixed(4), pctExact: +((100 * exact) / n).toFixed(2), pctWithin1: +((100 * w1) / n).toFixed(2) };
}

function stageGen(extracted) {
  const recipe = JSON.parse(fs.readFileSync(path.join(ROOT, 'fit/recipe.json'), 'utf8'));
  const all = { byPrayer: {}, byYear: {}, byYearPrayer: {}, worstCells: [] };
  const perPrayer = Object.fromEntries(PRAYERS.map((p) => [p, []]));
  const perYear = {};
  const perYearPrayer = {};
  const dist = {};
  for (let y = 2028; y <= 2038; y++) {
    perYear[y] = Object.fromEntries(PRAYERS.map((p) => [p, []]));
    perYearPrayer[y] = {};
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= daysInMonth(y, m); d++) {
        const k = iso(y, m, d);
        const g = generate(recipe, y, m, d);
        const tr = extracted.get(k);
        for (const p of PRAYERS) {
          const e = g[p] - tr[p];
          perPrayer[p].push([g[p], tr[p]]);
          perYear[y][p].push([g[p], tr[p]]);
          dist[e] = (dist[e] || 0) + 1;
          if (Math.abs(e) > 0) all.worstCells.push({ date: k, prayer: p, pred: hhmm(g[p]), truth: hhmm(tr[p]), delta: e });
        }
      }
    }
  }
  for (const p of PRAYERS) all.byPrayer[p] = score(perPrayer[p]);
  for (const y of Object.keys(perYear)) {
    const flat = PRAYERS.flatMap((p) => perYear[y][p]);
    all.byYear[y] = score(flat);
    for (const p of PRAYERS) perYearPrayer[y][p] = score(perYear[y][p]);
  }
  all.byYearPrayer = perYearPrayer;
  all.overall = score(PRAYERS.flatMap((p) => perPrayer[p]));
  all.errorDistribution = dist;
  all.worstCells.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  all.worstByPrayer = Object.fromEntries(PRAYERS.map((p) => [p, score(perPrayer[p])]));
  fs.writeFileSync(path.join(OUT, 'stage2-gen.json'), JSON.stringify(all, null, 2));
  console.log('STAGE2 overall', JSON.stringify(all.overall));
  console.log('STAGE2 byPrayer', JSON.stringify(all.byPrayer));
  console.log('STAGE2 byYear', JSON.stringify(Object.fromEntries(Object.entries(all.byYear).map(([y, s]) => [y, `${s.pctExact}%/${s.worst}`]))));
  console.log('STAGE2 dist', JSON.stringify(dist));
  return { all, recipe };
}

// ============================ STAGE 3 ========================================
function stageLeap(extracted, recipe) {
  const leapYears = [2028, 2032, 2036];
  const rows = leapYears.map((y) => {
    const t29 = extracted.get(`${y}-02-29`), t28 = extracted.get(`${y}-02-28`), t01 = extracted.get(`${y}-03-01`);
    const g = generate(recipe, y, 2, 29);
    return {
      year: y,
      truth: { '02-28': t28, '02-29': t29, '03-01': t01 },
      truthOffsets: {
        fajrLead_0228: t28.sunrise - t28.fajr, fajrLead_0229: t29.sunrise - t29.fajr, fajrLead_0301: t01.sunrise - t01.fajr,
        ishaLag_0228: t28.isha - t28.magrib, ishaLag_0229: t29.isha - t29.magrib, ishaLag_0301: t01.isha - t01.magrib,
      },
      predShipped: Object.fromEntries(PRAYERS.map((p) => [p, g[p]])),
      predCopy0301: null,
    };
  });
  // Variant: copy 03-01 row into the 02-29 slot of both tables, regenerate.
  const r2 = JSON.parse(JSON.stringify(recipe));
  for (const tbl of ['fajr', 'isha']) r2.prayers[tbl].table['02-29'] = r2.prayers[tbl].table['03-01'];
  let copyExact = 0, shippedExact = 0, cells = 0;
  const detail = [];
  for (const y of leapYears) {
    const t29 = extracted.get(`${y}-02-29`);
    const gs = generate(recipe, y, 2, 29);
    const gc = generate(r2, y, 2, 29);
    for (const p of PRAYERS) {
      cells++;
      if (gs[p] === t29[p]) shippedExact++;
      if (gc[p] === t29[p]) copyExact++;
    }
    rows.find((r) => r.year === y).predCopy0301 = Object.fromEntries(PRAYERS.map((p) => [p, gc[p]]));
    detail.push({ year: y, truth: t29, shipped: Object.fromEntries(PRAYERS.map((p) => [p, gs[p]])), copy0301: Object.fromEntries(PRAYERS.map((p) => [p, gc[p]])) });
  }
  const out = { leapDays: detail, offsetRows: rows.map((r) => ({ year: r.year, truthOffsets: r.truthOffsets })), shipped: { exact: shippedExact, cells }, copy0301: { exact: copyExact, cells } };
  fs.writeFileSync(path.join(OUT, 'stage3-leap.json'), JSON.stringify(out, null, 2));
  console.log('STAGE3', JSON.stringify(out.offsetRows));
  console.log('STAGE3 scores', JSON.stringify({ shipped: out.shipped, copy0301: out.copy0301 }));
  return out;
}

// ---- hand checks: step-by-step, printed intermediates ----------------------
function stageHand(recipe, extracted) {
  const picks = ['2028-12-21', '2038-06-21', '2028-03-26', '2033-10-30', '2032-02-29'];
  const lat = recipe.coordinates.latitude, lon = recipe.coordinates.longitude;
  const out = [];
  for (const k of picks) {
    const [y, m, d] = k.split('-').map(Number);
    const jdStart = jd0(y, m, d);
    const t = transitFraction(y, m, d, lon);
    const utcMs = Date.UTC(y, m - 1, d) + t * DAYMS;
    const off = londonOffsetMs(utcMs);
    const s12 = solar(jdStart + 0.5);
    const dec = s12.dec;
    const hz = recipe.solarModel.horizonAltitudeDegrees;
    const ha = HA(lat, dec, hz);
    const asrAlt = Math.atan(1 / (1 + Math.abs(Math.tan((lat - dec) * D)))) / D;
    const haAsr = HA(lat, dec, asrAlt);
    const transit = t * 1440 + off;
    const mm = `${pad(m)}-${pad(d)}`;
    const computed = {
      sunrise: rnd(transit - ha - 3),
      magrib: rnd(transit + ha + 3),
      dhuhr: rnd(transit + 5),
      asr: rnd(transit + haAsr + 2),
    };
    computed.fajr = computed.sunrise - recipe.prayers.fajr.table[mm];
    computed.isha = computed.magrib + recipe.prayers.isha.table[mm];
    out.push({
      date: k,
      steps: {
        jd0: jdStart,
        utcTransitFraction: +t.toFixed(8),
        utcTransitClock: `${pad(Math.floor(t * 24))}:${pad(Math.floor((t * 24 * 60) % 60))}:${pad(Math.floor((t * 86400) % 60))} UT`,
        londonOffsetMin: off,
        transitMinWall: +transit.toFixed(4),
        transitHHMM: hhmm(transit),
        declinationDeg: +dec.toFixed(6),
        hourAngleHorizonMin: +ha.toFixed(4),
        asrAltitudeDeg: +asrAlt.toFixed(6),
        hourAngleAsrMin: +haAsr.toFixed(4),
        sunriseRawMin: +(transit - ha - 3).toFixed(4),
        magribRawMin: +(transit + ha + 3).toFixed(4),
        dhuhrRawMin: +(transit + 5).toFixed(4),
        asrRawMin: +(transit + haAsr + 2).toFixed(4),
        fajrLead: recipe.prayers.fajr.table[mm],
        ishaLag: recipe.prayers.isha.table[mm],
      },
      computed: Object.fromEntries(PRAYERS.map((p) => [p, hhmm(computed[p])])),
      computedMinutes: computed,
      truth: Object.fromEntries(PRAYERS.map((p) => [p, hhmm(extracted.get(k)[p])])),
      match: PRAYERS.every((p) => computed[p] === extracted.get(k)[p]),
    });
  }
  fs.writeFileSync(path.join(OUT, 'stage4-hand.json'), JSON.stringify(out, null, 2));
  for (const r of out) {
    console.log(`HAND ${r.date} match=${r.match}`);
    console.log(`  transit=${r.steps.transitMinWall} (${r.steps.transitHHMM}) off=${r.steps.londonOffsetMin} dec=${r.steps.declinationDeg}`);
    console.log(`  HA_hz=${r.steps.hourAngleHorizonMin} asrAlt=${r.steps.asrAltitudeDeg} HA_asr=${r.steps.hourAngleAsrMin}`);
    console.log(`  raw sunrise=${r.steps.sunriseRawMin} dhuhr=${r.steps.dhuhrRawMin} asr=${r.steps.asrRawMin} magrib=${r.steps.magribRawMin}`);
    console.log(`  computed=${JSON.stringify(r.computed)} truth=${JSON.stringify(r.truth)}`);
  }
  return out;
}

if (import.meta.main) {
  const stage = process.argv[2] || 'all';
  const extracted = stageTruth();
  if (stage !== 'truth') {
    const { all, recipe } = stageGen(extracted);
    const leap = stageLeap(extracted, recipe);
    stageHand(recipe, extracted);
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ generatedAt: 'deterministic', overall: all.overall, byPrayer: all.byPrayer, byYear: all.byYear, byYearPrayer: all.byYearPrayer, errorDistribution: all.errorDistribution, leap }, null, 2));
    console.log('DONE');
  }
}
