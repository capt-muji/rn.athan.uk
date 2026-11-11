// O1l morocco-cities: per-city fits of the rebuilt Habous portal at ONE national margin regime.
// Engine: adhan 4.4.6, Rounding.None, method Other 19/17, Shafi asr, zero adjustments during the
// coordinate solve. Clock: fuseau:"GMT" (decree 2.26.530), so every printed time is UTC+0 and the
// adhan instants are read in UTC with no shift. No real clock is read anywhere.
//
// Coordinate solve, per city:
//   longitude  <- printed dhuhr against the solar transit (absorbs the national dhuhr margin)
//   latitude   <- the SHAPE of the sunrise-to-maghrib bracket over 61 days; the bracket's mean
//                 offset is profiled out, so latitude and the horizon offset do not trade off
//   margins    <- mean(printed - computed) per column at the solved point
// The national margin set is the median of the per-city margins. Every city is then scored at
// that one set with its own solved point.
const fs = require("fs");
const path = require("path");
const { PrayerTimes, CalculationParameters, Coordinates, Madhab, Rounding } = require(
  path.join(process.env.HOME, "athan-gitree/census/adhan-build/node_modules/adhan"),
);

const W = __dirname;
const MONTHS = ["2026-10", "2026-11"];
const PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"];
const RECORDED = { fajr: -1, sunrise: -3, dhuhr: 5, asr: 1, magrib: 4, isha: 0 };

function parseMonth(ym) {
  const raw = fs.readFileSync(path.join(W, "captures", `ma-habous-horaires-${ym}.js`), "utf8");
  return JSON.parse(
    raw
      .replace(/^\(window\.HORAIRES_MOIS=window\.HORAIRES_MOIS\|\|\[\]\)\.push\(/, "")
      .replace(/\)\s*;\s*$/, ""),
  );
}

const params = new CalculationParameters("Other", 19, 17);
params.madhab = Madhab.Shafi;
params.rounding = Rounding.None;

const coordsCache = new Map();
function coords(lat, lon) {
  const k = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  let c = coordsCache.get(k);
  if (!c) { c = new Coordinates(lat, lon); coordsCache.set(k, c); }
  return c;
}

// Local-component date (adhan reads getFullYear/getMonth/getDate), never the real clock.
function dayDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function rawTimes(dateStr, lat, lon) {
  const p = new PrayerTimes(coords(lat, lon), dayDate(dateStr), params);
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d) / 60000;
  const f = (t) => t.getTime() / 60000 - base; // minutes after UTC midnight of the printed date
  return { fajr: f(p.fajr), sunrise: f(p.sunrise), dhuhr: f(p.dhuhr), asr: f(p.asr), magrib: f(p.maghrib), isha: f(p.isha) };
}

const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };
const roundMin = (t) => Math.round(t);
const floorMin = (t) => Math.floor(t);

function monthDates(ym) {
  const [y, m] = ym.split("-").map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);
}

// ---------- load ----------
const data = Object.fromEntries(MONTHS.map((ym) => [ym, parseMonth(ym)]));
const cities = data["2026-10"].villes.map((v) => ({ c: v.c, n: v.n }));
let identityMismatches = 0;
{
  const nov = new Map(data["2026-11"].villes.map((v) => [v.c, v.n]));
  for (const v of data["2026-10"].villes) if (nov.get(v.c) !== v.n) identityMismatches++;
}

const rows = {};
for (const v of cities) rows[v.c] = {};
for (const ym of MONTHS) {
  for (const v of data[ym].villes) {
    monthDates(ym).forEach((date, i) => {
      const [fajr, sunrise, dhuhr, asr, magrib, isha] = v.h[i];
      rows[v.c][date] = { fajr, sunrise, dhuhr, asr, magrib, isha };
    });
  }
}
fs.writeFileSync(path.join(W, "data", "cities-190.json"), JSON.stringify(cities, null, 1));
for (const ym of MONTHS) {
  const out = {};
  for (const v of data[ym].villes) {
    out[v.c] = {};
    monthDates(ym).forEach((date, i) => {
      const [fajr, sunrise, dhuhr, asr, magrib, isha] = v.h[i];
      out[v.c][date] = { fajr, sunrise, dhuhr, asr, magrib, isha };
    });
  }
  fs.writeFileSync(path.join(W, "data", `${ym}.json`), JSON.stringify(out));
}

const geoRows = fs.readFileSync(path.join(W, "captures/ma_geonames/MA.txt"), "utf8").split("\n").filter(Boolean).map((l) => l.split("\t"));
const PLACES = geoRows.filter((r) => r[6] === "P" && r[4] && r[5]).map((r) => ({ lat: +r[4], lon: +r[5], dem: +r[16] || 0 }));
function demAt(lat, lon) {
  let bd = 1e9, best = 0;
  for (const p of PLACES) {
    const d = (p.lat - lat) ** 2 + ((p.lon - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bd) { bd = d; best = p.dem; }
  }
  return best;
}

const DATES = MONTHS.flatMap(monthDates);
const transit0 = Object.fromEntries(DATES.map((d) => [d, rawTimes(d, 30, 0).dhuhr]));

// Daylength (maghrib - sunrise) on a latitude grid, one table for all cities and dates.
const LAT0 = 17, LAT_STEP = 0.01, LAT_N = Math.round((38 - LAT0) / LAT_STEP) + 1;
const DLT = DATES.map((d) => {
  const arr = new Float64Array(LAT_N);
  for (let i = 0; i < LAT_N; i++) {
    const t = rawTimes(d, LAT0 + i * LAT_STEP, 0);
    arr[i] = t.magrib - t.sunrise;
  }
  return arr;
});
function daylength(di, lat) {
  const x = (lat - LAT0) / LAT_STEP;
  const i = Math.max(0, Math.min(LAT_N - 2, Math.floor(x)));
  const f = x - i;
  return DLT[di][i] * (1 - f) + DLT[di][i + 1] * f;
}

// ---------- coordinate solve ----------
function solveLon(c, dates, mDhuhr) {
  const res = dates.map((d) => transit0[d] - (toMin(rows[c][d].dhuhr) - mDhuhr));
  return median(res) / 4;
}

function solveLat(c, dates) {
  const di = dates.map((d) => DATES.indexOf(d));
  const D = dates.map((d) => toMin(rows[c][d].magrib) - toMin(rows[c][d].sunrise));
  // The bracket's mean offset (mMg - mSr) is profiled out, so latitude is set by the SHAPE of the
  // daylength curve across the window, not by its level.
  const rmsAt = (lat) => {
    const res = dates.map((d, i) => D[i] - daylength(di[i], lat));
    const mu = mean(res);
    return { mu, rms: Math.sqrt(mean(res.map((x) => (x - mu) ** 2))) };
  };
  let best = { lat: 0, rms: Infinity, mu: 0 };
  for (let lat = LAT0; lat <= 37.0001; lat += LAT_STEP) {
    const { mu, rms } = rmsAt(lat);
    if (rms < best.rms) best = { lat, rms, mu };
  }
  // parabolic refine on the three points around the grid minimum
  const a = rmsAt(best.lat - LAT_STEP), b = rmsAt(best.lat), c2 = rmsAt(best.lat + LAT_STEP);
  const denom = a.rms - 2 * b.rms + c2.rms;
  const delta = denom > 0 ? (0.5 * (a.rms - c2.rms)) / denom : 0;
  const lat = best.lat + Math.max(-1, Math.min(1, delta)) * LAT_STEP;
  const fin = rmsAt(lat);
  return { lat, rms: fin.rms, bracketOffset: fin.mu };
}

function fitCity(c, dates, mDhuhr) {
  const lon = solveLon(c, dates, mDhuhr);
  const { lat, rms, bracketOffset } = solveLat(c, dates);
  const res = Object.fromEntries(PRAYERS.map((p) => [p, []]));
  for (const d of dates) {
    const t = rawTimes(d, lat, lon);
    for (const p of PRAYERS) res[p].push(toMin(rows[c][d][p]) - t[p]);
  }
  const margins = Object.fromEntries(PRAYERS.map((p) => [p, mean(res[p])]));
  return { c, lat, lon, latRms: rms, bracketOffset, margins };
}

function fitAll(dates, mDhuhrInit = 5) {
  let mDhuhr = mDhuhrInit;
  let fits = [];
  for (let it = 0; it < 2; it++) {
    fits = cities.map((city) => fitCity(city.c, dates, mDhuhr));
    const dh = [];
    for (const f of fits) for (const d of dates) dh.push(toMin(rows[f.c][d].dhuhr) - (transit0[d] - 4 * f.lon));
    mDhuhr = median(dh);
  }
  const national = Object.fromEntries(PRAYERS.map((p) => [p, median(fits.map((f) => f.margins[p]))]));
  national.dhuhr = mDhuhr;
  return { fits, national };
}

// ---------- scoring ----------
function scoreCity(c, lat, lon, dates, margins) {
  const per = Object.fromEntries(PRAYERS.map((p) => [p, { cells: 0, within: 0, exact: 0, worst: 0, worstAt: "" }]));
  let within = 0, cells = 0, exact = 0, worst = 0, worstAt = "";
  for (const d of dates) {
    const t = rawTimes(d, lat, lon);
    for (const p of PRAYERS) {
      const printed = toMin(rows[c][d][p]);
      const value = t[p] + margins[p];
      const ad = Math.abs(printed - value);
      const s = per[p];
      s.cells++; cells++;
      if (ad <= 1.0001) { s.within++; within++; }
      if ((p === "fajr" ? floorMin(value) : roundMin(value)) === printed) { s.exact++; exact++; }
      if (ad > s.worst) { s.worst = ad; s.worstAt = d; }
      if (ad > worst) { worst = ad; worstAt = `${d} ${p}`; }
    }
  }
  return { c, lat: +lat.toFixed(3), lon: +lon.toFixed(3), cells, within, exact, worst: +worst.toFixed(2), worstAt, per };
}

// ---------- run ----------
const report = [];
const log = (s) => { report.push(s); console.log(s); };

log(`=== SURFACE ===`);
log(`months ${MONTHS.join(", ")} | cities ${cities.length} | identity mismatches ${identityMismatches} | cells ${cities.length * DATES.length * 6}`);
log(`engine adhan 4.4.6 | 19/17 Shafi | Rounding.None | clock UTC+0 (fuseau GMT) | days ${DATES.length}`);

const full = fitAll(DATES);
const m = full.national;
log(`\n=== COORDINATE SOLVE (${DATES.length} days, 190 cities) ===`);
log(`national margins: ${PRAYERS.map((p) => `${p} ${m[p].toFixed(2)}`).join(" | ")}`);
log(`solved latitude ${Math.min(...full.fits.map((f) => f.lat)).toFixed(2)} .. ${Math.max(...full.fits.map((f) => f.lat)).toFixed(2)} | longitude ${Math.min(...full.fits.map((f) => f.lon)).toFixed(2)} .. ${Math.max(...full.fits.map((f) => f.lon)).toFixed(2)}`);
log(`latitude-fit rms (bracket shape): median ${median(full.fits.map((f) => f.latRms)).toFixed(2)} min, worst ${Math.max(...full.fits.map((f) => f.latRms)).toFixed(2)}`);

const scored = full.fits.map((f) => scoreCity(f.c, f.lat, f.lon, DATES, m));
scored.forEach((r, i) => { r.n = cities[i].n; r.bracketOffset = full.fits[i].bracketOffset; r.latRms = full.fits[i].latRms; });

const totCells = scored.reduce((a, r) => a + r.cells, 0);
const totWithin = scored.reduce((a, r) => a + r.within, 0);
const totExact = scored.reduce((a, r) => a + r.exact, 0);
log(`\n=== PER-CITY SCORES AT ONE NATIONAL MARGIN SET (190 cities x ${DATES.length} days) ===`);
log(`cells within 1 min ${totWithin}/${totCells} (${((totWithin / totCells) * 100).toFixed(2)}pc) | exact (census convention) ${totExact}/${totCells} (${((totExact / totCells) * 100).toFixed(2)}pc)`);
log(`cities perfect ${scored.filter((r) => r.within === r.cells).length}/190 | worst residual ${Math.max(...scored.map((r) => r.worst)).toFixed(2)} min`);
for (const p of PRAYERS) {
  const cells = scored.reduce((a, r) => a + r.per[p].cells, 0);
  const within = scored.reduce((a, r) => a + r.per[p].within, 0);
  const exact = scored.reduce((a, r) => a + r.per[p].exact, 0);
  const wc = scored.slice().sort((a, b) => b.per[p].worst - a.per[p].worst)[0];
  log(`  ${p.padEnd(8)} within ${within}/${cells} (${((within / cells) * 100).toFixed(1)}pc) exact ${exact}/${cells} (${((exact / cells) * 100).toFixed(1)}pc) worst ${wc.per[p].worst.toFixed(2)} @ c=${wc.c} ${wc.n} ${wc.per[p].worstAt}`);
}

const buckets = { "366/366": 0, "360-365": 0, "350-359": 0, "340-349": 0, "<340": 0 };
for (const r of scored) {
  if (r.within === r.cells) buckets["366/366"]++;
  else if (r.within >= 360) buckets["360-365"]++;
  else if (r.within >= 350) buckets["350-359"]++;
  else if (r.within >= 340) buckets["340-349"]++;
  else buckets["<340"]++;
}
log(`\n  within-1 distribution: ${Object.entries(buckets).map(([k, v]) => `${k} ${v}`).join(" | ")}`);
const w1 = scored.map((r) => r.within).sort((a, b) => a - b);
log(`  city within-1 per 366: min ${w1[0]} p05 ${w1[Math.floor(w1.length * 0.05)]} median ${median(w1)} p95 ${w1[Math.floor(w1.length * 0.95)]} max ${w1[w1.length - 1]}`);
const exs = scored.map((r) => r.exact).sort((a, b) => a - b);
log(`  city exact per 366: min ${exs[0]} median ${median(exs)} max ${exs[exs.length - 1]}`);
const worstDist = scored.map((r) => r.worst).sort((a, b) => a - b);
log(`  city worst residual: median ${median(worstDist).toFixed(2)} p95 ${worstDist[Math.floor(worstDist.length * 0.95)].toFixed(2)} max ${worstDist[worstDist.length - 1].toFixed(2)}`);

log(`\n=== TEN WORST CITIES (by worst residual) ===`);
for (const r of scored.slice().sort((a, b) => b.worst - a.worst).slice(0, 10)) {
  const col = PRAYERS.map((p) => [p, r.per[p].worst]).sort((a, b) => b[1] - a[1])[0];
  log(`  c=${r.c} ${r.n} lat${r.lat} lon${r.lon}: within ${r.within}/${r.cells} exact ${r.exact} worst ${r.worst} @ ${r.worstAt} | dominant ${col[0]} ${col[1].toFixed(2)} | bracket ${r.bracketOffset.toFixed(2)} DEM ${demAt(r.lat, r.lon)} latRms ${r.latRms.toFixed(2)} | ${PRAYERS.map((p) => `${p} ${r.per[p].within}/${r.per[p].cells}`).join(" ")}`);
}

log(`\n=== TEN WEAKEST CITIES (by within-1) ===`);
for (const r of scored.slice().sort((a, b) => a.within - b.within).slice(0, 10)) {
  log(`  c=${r.c} ${r.n} lat${r.lat} lon${r.lon}: within ${r.within}/${r.cells} exact ${r.exact} worst ${r.worst} @ ${r.worstAt} | ${PRAYERS.map((p) => `${p} ${r.per[p].within}/${r.per[p].cells}`).join(" ")}`);
}

// ---------- national or city-varying ----------
log(`\n=== NATIONAL OR CITY-VARYING ===`);
const latArr = full.fits.map((f) => f.lat), lonArr = full.fits.map((f) => f.lon);
function corr(xs, ys) { const mx = mean(xs), my = mean(ys); return mean(xs.map((x, i) => (x - mx) * (ys[i] - my))) / (sd(xs) * sd(ys)); }
for (const p of PRAYERS) {
  const pc = full.fits.map((f) => f.margins[p]);
  log(`  ${p.padEnd(8)} per-city margin sd ${sd(pc).toFixed(3)} min | range ${Math.min(...pc).toFixed(2)}..${Math.max(...pc).toFixed(2)} | corr lat ${corr(latArr, pc).toFixed(2)} lon ${corr(lonArr, pc).toFixed(2)}`);
}
{
  const bo = full.fits.map((f) => f.bracketOffset);
  log(`  bracket (maghrib-sunrise) offset: median ${median(bo).toFixed(2)} sd ${sd(bo).toFixed(3)} range ${Math.min(...bo).toFixed(2)}..${Math.max(...bo).toFixed(2)} | corr lat ${corr(latArr, bo).toFixed(2)} lon ${corr(lonArr, bo).toFixed(2)}`);
}
const perCityScored = full.fits.map((f) => scoreCity(f.c, f.lat, f.lon, DATES, f.margins));
const pcWithin = perCityScored.reduce((a, r) => a + r.within, 0);
log(`  per-city margin set: ${pcWithin}/${totCells} (${((pcWithin / totCells) * 100).toFixed(2)}pc) vs national set ${((totWithin / totCells) * 100).toFixed(2)}pc | gain ${pcWithin - totWithin} cells (${((pcWithin - totWithin) / totCells * 100).toFixed(2)} pc)`);

// ---------- horizon term: sunrise/maghrib per-city spread ----------
const horizon = full.fits.map((f) => ({ c: f.c, bo: f.bracketOffset, dem: demAt(f.lat, f.lon), mSr: f.margins.sunrise, mMg: f.margins.magrib }));
log(`\n=== HORIZON TERM (sunrise/maghrib only) ===`);
log(`  bracket offset (maghrib - sunrise, minutes): median ${median(horizon.map((h) => h.bo)).toFixed(2)} sd ${sd(horizon.map((h) => h.bo)).toFixed(2)} range ${Math.min(...horizon.map((h) => h.bo)).toFixed(2)}..${Math.max(...horizon.map((h) => h.bo)).toFixed(2)}`);
log(`  corr(bracket offset, DEM) ${corr(horizon.map((h) => h.bo), horizon.map((h) => h.dem)).toFixed(2)} | corr with latitude ${corr(horizon.map((h) => h.bo), full.fits.map((f) => f.lat)).toFixed(2)} | corr with longitude ${corr(horizon.map((h) => h.bo), full.fits.map((f) => f.lon)).toFixed(2)}`);
const bins = [[0, 100], [100, 300], [300, 600], [600, 1000], [1000, 1500], [1500, 3000]];
for (const [lo, hi] of bins) {
  const s = horizon.filter((h) => h.dem >= lo && h.dem < hi);
  if (!s.length) continue;
  log(`  DEM ${String(lo).padStart(4)}-${String(hi).padEnd(4)} m: ${String(s.length).padStart(3)} cities | bracket offset median ${median(s.map((x) => x.bo)).toFixed(2)}`);
}
const lowland = horizon.filter((h) => h.dem < 200);
const halfsum = median(horizon.map((h) => h.mSr + h.mMg));
const seaB = median(lowland.map((h) => h.bo));
log(`  sea-level bracket (DEM < 200 m, ${lowland.length} cities): ${seaB.toFixed(2)} | halfsum (mSr + mMg) ${halfsum.toFixed(2)}`);
log(`  sea-level horizon margins: sunrise ${((halfsum - seaB) / 2).toFixed(2)} maghrib ${((halfsum + seaB) / 2).toFixed(2)}`);

// ---------- model score: four national columns + per-city horizon term ----------
const model = full.fits.map((f, i) => {
  const bo = f.bracketOffset;
  const mg = { ...m, sunrise: (halfsum - bo) / 2, magrib: (halfsum + bo) / 2 };
  return scoreCity(f.c, f.lat, f.lon, DATES, mg);
});
const mdCells = model.reduce((a, r) => a + r.cells, 0);
const mdWithin = model.reduce((a, r) => a + r.within, 0);
log(`\n=== GENERATOR MODEL SCORE (national on fajr/dhuhr/asr/isha, per-city horizon on sunrise/maghrib) ===`);
log(`  cells within 1 min ${mdWithin}/${mdCells} (${((mdWithin / mdCells) * 100).toFixed(2)}pc) | cities perfect ${model.filter((r) => r.within === r.cells).length}/190 | worst ${Math.max(...model.map((r) => r.worst)).toFixed(2)}`);
for (const p of PRAYERS) {
  const cells = model.reduce((a, r) => a + r.per[p].cells, 0);
  const within = model.reduce((a, r) => a + r.per[p].within, 0);
  log(`    ${p.padEnd(8)} ${within}/${cells} (${((within / cells) * 100).toFixed(2)}pc)`);
}

// ---------- between-month stability ----------
// Same solved point for both months, so the delta is the margin alone.
const monthMargins = (dates) =>
  full.fits.map((f) => {
    const res = Object.fromEntries(PRAYERS.map((p) => [p, []]));
    for (const d of dates) {
      const t = rawTimes(d, f.lat, f.lon);
      for (const p of PRAYERS) res[p].push(toMin(rows[f.c][d][p]) - t[p]);
    }
    return Object.fromEntries(PRAYERS.map((p) => [p, mean(res[p])]));
  });
const octDates = monthDates("2026-10"), novDates = monthDates("2026-11");
const octM = monthMargins(octDates), novM = monthMargins(novDates);
log(`\n=== BETWEEN-MONTH STABILITY (per-city margin, October minus November, same solved point) ===`);
for (const p of PRAYERS) {
  const d = octM.map((x, i) => x[p] - novM[i][p]);
  log(`  ${p.padEnd(8)} median ${median(d).toFixed(3)} | mean ${mean(d).toFixed(3)} | sd ${sd(d).toFixed(3)} | max |delta| ${Math.max(...d.map(Math.abs)).toFixed(2)}`);
}

// ---------- out of sample ----------
const octFit = fitAll(octDates);
const oos = octFit.fits.map((f) => scoreCity(f.c, f.lat, f.lon, novDates, octFit.national));
const octHalfsum = median(octFit.fits.map((f) => f.margins.sunrise + f.margins.magrib));
const oosCells = oos.reduce((a, r) => a + r.cells, 0);
const oosWithin = oos.reduce((a, r) => a + r.within, 0);
log(`\n=== OUT OF SAMPLE (points + margins from October, scored on November) ===`);
log(`  cells within 1 min ${oosWithin}/${oosCells} (${((oosWithin / oosCells) * 100).toFixed(2)}pc) | cities perfect ${oos.filter((r) => r.within === r.cells).length}/190 | worst ${Math.max(...oos.map((r) => r.worst)).toFixed(2)}`);
log(`  October margins ${PRAYERS.map((p) => `${p} ${octFit.national[p].toFixed(2)}`).join(" ")}`);
log(`  full-window    ${PRAYERS.map((p) => `${p} ${m[p].toFixed(2)}`).join(" ")}`);
for (const p of PRAYERS) {
  const cells = oos.reduce((a, r) => a + r.per[p].cells, 0);
  const within = oos.reduce((a, r) => a + r.per[p].within, 0);
  log(`    ${p.padEnd(8)} ${within}/${cells} (${((within / cells) * 100).toFixed(1)}pc) worst ${Math.max(...oos.map((r) => r.per[p].worst)).toFixed(2)}`);
}
{
  const oosModel = octFit.fits.map((f) => {
    const mg = { ...octFit.national, sunrise: (octHalfsum - f.bracketOffset) / 2, magrib: (octHalfsum + f.bracketOffset) / 2 };
    return scoreCity(f.c, f.lat, f.lon, novDates, mg);
  });
  const c2 = oosModel.reduce((a, r) => a + r.cells, 0), w2 = oosModel.reduce((a, r) => a + r.within, 0);
  log(`  out-of-sample with the per-city horizon term: ${w2}/${c2} (${((w2 / c2) * 100).toFixed(2)}pc) | cities perfect ${oosModel.filter((r) => r.within === r.cells).length}/190`);
}

// ---------- regime delta ----------
log(`\n=== REGIME DELTA (rebuilt national margin minus census-recorded margin) ===`);
for (const p of PRAYERS) log(`  ${p.padEnd(8)} rebuilt ${m[p].toFixed(2).padStart(6)} | recorded ${String(RECORDED[p]).padStart(3)} | delta ${(m[p] - RECORDED[p]).toFixed(2).padStart(6)}`);

// ---------- validation against Wikidata coordinates ----------
const wd = JSON.parse(fs.readFileSync(path.join(W, "data/coords-wikidata.json"), "utf8"));
const known = wd.filter((o) => o.best);
log(`\n=== SOLVED POINT vs WIKIDATA COORDINATE (${known.length} matched cities) ===`);
const dl = [], dn = [], sc = [];
for (const k of known) {
  const f = full.fits.find((x) => x.c === k.c);
  dl.push(f.lat - k.best.lat); dn.push(f.lon - k.best.lon);
  const s = scoreCity(k.c, k.best.lat, k.best.lon, DATES, m);
  sc.push({ ...s, n: cities.find((x) => x.c === k.c).n, wd: k.best.label, pop: k.best.pop });
}
log(`  latitude delta: median ${median(dl).toFixed(2)} sd ${sd(dl).toFixed(2)} | longitude delta: median ${median(dn).toFixed(2)} sd ${sd(dn).toFixed(2)}`);
log(`  worst latitude mismatches:`);
for (const k of known.slice().sort((a, b) => Math.abs(full.fits.find((x) => x.c === b.c).lat - b.best.lat) - Math.abs(full.fits.find((x) => x.c === a.c).lat - a.best.lat)).slice(0, 8)) {
  const f = full.fits.find((x) => x.c === k.c);
  log(`    c=${k.c} ${cities.find((x) => x.c === k.c).n} (wd ${k.best.label}): solved ${f.lat.toFixed(2)},${f.lon.toFixed(2)} vs ${k.best.lat},${k.best.lon} | dlat ${(f.lat - k.best.lat).toFixed(2)} dlon ${(f.lon - k.best.lon).toFixed(2)}`);
}
const scCells = sc.reduce((a, r) => a + r.cells, 0), scWithin = sc.reduce((a, r) => a + r.within, 0);
log(`  scored at the WIKIDATA point with the same national margins: ${scWithin}/${scCells} (${((scWithin / scCells) * 100).toFixed(1)}pc) within 1 min | cities perfect ${sc.filter((r) => r.within === r.cells).length}/${sc.length}`);
for (const r of sc.slice().sort((a, b) => b.worst - a.worst).slice(0, 8)) log(`    c=${r.c} ${r.n} (wd ${r.wd}): ${r.within}/${r.cells} worst ${r.worst} @ ${r.worstAt}`);

// ---------- clock ----------
log(`\n=== CLOCK CHECK ===`);
{
  const res = [];
  for (const f of full.fits) for (const d of DATES) res.push(toMin(rows[f.c][d].dhuhr) - transit0[d] + 4 * f.lon);
  log(`  printed dhuhr minus UTC solar transit over solved longitudes: median ${median(res).toFixed(2)} min sd ${sd(res).toFixed(2)}`);
  log(`  a UTC+1 table would sit at +60; the observed value is the dhuhr margin on a UTC+0 clock.`);
}

fs.writeFileSync(path.join(W, "data", "per-city-fit.json"), JSON.stringify({ nationalMargins: m, cities: scored, fits: full.fits }, null, 1));
fs.writeFileSync(path.join(W, "data", "out-of-sample.json"), JSON.stringify({ nationalMargins: octFit.national, cities: oos }, null, 1));
fs.writeFileSync(path.join(W, "run-summary.txt"), report.join("\n") + "\n");
console.log("\nwritten: data/per-city-fit.json, data/out-of-sample.json, run-summary.txt");
