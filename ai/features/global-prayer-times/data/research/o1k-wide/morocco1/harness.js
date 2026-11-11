// Recipe check harness for the rebuilt Habous ministry portal (data/horaires-YYYY-MM.js).
// Census recipe: fajr 19 / isha 17, margins fajr -1 / sunrise -3 / dhuhr +5 / asr +1 / maghrib +4 / isha 0,
// fajr floor, asr Shafi (shadow factor 1), printed clock = UTC+0 (fuseau:"GMT", decree 2.26.530).
const fs = require("fs");
const path = require("path");
const W = __dirname;
const RAD = Math.PI / 180;

function parseMonth(ym) {
  const raw = fs.readFileSync(path.join(W, "captures", `ma-habous-horaires-${ym}.js`), "utf8");
  return JSON.parse(raw.replace(/^\(window\.HORAIRES_MOIS=window\.HORAIRES_MOIS\|\|\[\]\)\.push\(/, "").replace(/\)\s*;\s*$/, ""));
}

function julianNoon(y, m, d) {
  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5 + 0.5;
}

function sunPos(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const Mr = M * RAD;
  const C = (1.914602 - T * (0.004817 + 0.000014 * T)) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) + 0.000289 * Math.sin(3 * Mr);
  const omega = 125.04 - 1934.136 * T;
  const lambda = (L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD)) * RAD;
  const eps0 = 23 + 26 / 60 + 21.448 / 3600 - (46.8150 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600;
  const eps = (eps0 + 0.00256 * Math.cos(omega * RAD)) * RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const Lr = L0 * RAD;
  const yv = Math.tan(eps / 2) ** 2;
  const eqtime = 4 * (yv * Math.sin(2 * Lr) - 2 * e * Math.sin(Mr) + 4 * e * yv * Math.sin(Mr) * Math.cos(Lr)
    - 0.5 * yv * yv * Math.sin(4 * Lr) - 1.25 * e * e * Math.sin(2 * Mr)) / RAD;
  return { dec, eqtime };
}

function hourAngleDeg(altDeg, latDeg, dec) {
  const cosH = (Math.sin(altDeg * RAD) - Math.sin(latDeg * RAD) * Math.sin(dec))
    / (Math.cos(latDeg * RAD) * Math.cos(dec));
  return Math.acos(Math.min(1, Math.max(-1, cosH))) / RAD;
}

const MARGINS = { fajr: -1, sunrise: -3, dhuhr: 5, asr: 1, magrib: 4, isha: 0 };

function dayTimes(dateStr, lat, lon, margins) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const { dec, eqtime } = sunPos(julianNoon(y, m, d));
  const noon = 720 - 4 * lon - eqtime;
  const sunsetH = hourAngleDeg(-0.833, lat, dec);
  const fajrH = hourAngleDeg(-19, lat, dec);
  const ishaH = hourAngleDeg(-17, lat, dec);
  const asrAlt = Math.atan(1 / (1 + Math.tan(Math.abs(lat * RAD - dec)))) / RAD;
  const asrH = hourAngleDeg(asrAlt, lat, dec);
  const M = margins || MARGINS;
  return {
    fajr: noon - 4 * fajrH + M.fajr,
    sunrise: noon - 4 * sunsetH + M.sunrise,
    dhuhr: noon + M.dhuhr,
    asr: noon + 4 * asrH + M.asr,
    magrib: noon + 4 * sunsetH + M.magrib,
    isha: noon + 4 * ishaH + M.isha,
  };
}
const dayTimesAdj = (date, lat, lon, adj) => dayTimes(date, lat, lon, adj);

function toMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function floorMin(t) { const f = Math.floor(t); return `${String(Math.floor(f / 60)).padStart(2, "0")}:${String(f % 60).padStart(2, "0")}`; }
function roundMin(t) { const r = Math.round(t); return `${String(Math.floor(r / 60)).padStart(2, "0")}:${String(r % 60).padStart(2, "0")}`; }

function monthDates(ym) {
  const [y, m] = ym.split("-").map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);
}

const PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"];
const MONTHS = ["2026-10", "2026-11"];
const data = Object.fromEntries(MONTHS.map((ym) => [ym, parseMonth(ym)]));

// ---- 1. enumerate + identity ----
const cities = data["2026-10"].villes.map((v) => ({ c: v.c, n: v.n, months: MONTHS }));
const byIdOct = new Map(data["2026-10"].villes.map((v) => [v.c, v]));
const byIdNov = new Map(data["2026-11"].villes.map((v) => [v.c, v]));
let identityMismatches = 0;
for (const [id, v] of byIdOct) if (!byIdNov.has(id) || byIdNov.get(id).n !== v.n) identityMismatches++;
fs.writeFileSync(path.join(W, "data", "cities.json"), JSON.stringify(cities, null, 1));

// ---- 2. normalize rows ----
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

// ---- 3. monotonicity (per city, per prayer, day-over-day across the joined window) ----
let monoViol = 0, monoViolCross = 0, monoWorst = 0;
const nonDec = new Set(["fajr", "sunrise", "dhuhr"]);
for (const v of data["2026-10"].villes) {
  const octRows = byIdOct.get(v.c).h;
  const novRows = byIdNov.get(v.c).h;
  const seq = [...octRows, ...novRows];
  for (let i = 1; i < seq.length; i++) {
    for (const p of PRAYERS) {
      const a = toMin(seq[i - 1][PRAYERS.indexOf(p)]), b = toMin(seq[i][PRAYERS.indexOf(p)]);
      const ok = nonDec.has(p) ? b >= a : b <= a;
      if (!ok) {
        monoViol++;
        if (i === octRows.length) monoViolCross++;
        monoWorst = Math.max(monoWorst, Math.abs(b - a));
      }
    }
  }
}

// ---- 4. sample check: 10 cities at known coordinates ----
const SAMPLE = [
  { c: 1, lat: 34.0209, lon: -6.8416 },   // Rabat
  { c: 58, lat: 33.5731, lon: -7.5898 },  // Casablanca
  { c: null, name: "طنجة", lat: 35.7595, lon: -5.8340 },   // Tangier
  { c: null, name: "فاس", lat: 34.0331, lon: -5.0078 },    // Fes
  { c: null, name: "مراكش", lat: 31.6295, lon: -7.9811 },  // Marrakech
  { c: null, name: "أكادير", lat: 30.4278, lon: -9.5981 }, // Agadir
  { c: null, name: "وجدة", lat: 34.6867, lon: -1.9114 },   // Oujda
  { c: null, name: "الناظور", lat: 35.1681, lon: -2.9287 },// Nador
  { c: 156, lat: 27.1536, lon: -13.2033 }, // Laayoune
  { c: null, name: "الداخلة", lat: 23.6848, lon: -15.9579 }, // Dakhla
];
const sampleResults = [];
for (const s of SAMPLE) {
  const id = s.c != null ? s.c : byIdOct && (() => {
    const hit = cities.find((x) => x.n.includes(s.name));
    return hit ? hit.c : null;
  })();
  let cells = 0, within = 0, exact = 0, worst = 0, worstAt = "";
  const perMonth = {}, perPrayer = Object.fromEntries(PRAYERS.map((p) => [p, [0, 0]]));
  for (const ym of MONTHS) {
    perMonth[ym] = [0, 0];
    monthDates(ym).forEach((date, i) => {
      const printed = data[ym].villes.find((v) => v.c === id).h[i];
      const comp = dayTimes(date, s.lat, s.lon);
      PRAYERS.forEach((p, j) => {
        const P = toMin(printed[j]), C = comp[p];
        const diff = Math.abs(P - C);
        cells++;
        perMonth[ym][0]++; perPrayer[p][0]++;
        if (diff <= 1.0001) { within++; perMonth[ym][1]++; perPrayer[p][1]++; }
        if (p === "fajr" ? floorMin(C) === printed[j] : roundMin(C) === printed[j]) exact++;
        if (diff > worst) { worst = diff; worstAt = `${date} ${p}`; }
      });
    });
  }
  const name = cities.find((x) => x.c === id).n;
  const perMonthStr = MONTHS.map((m) => `${m} ${perMonth[m][1]}/${perMonth[m][0]}`).join(", ");
  const perPrayerStr = PRAYERS.map((p) => `${p} ${perPrayer[p][1]}/${perPrayer[p][0]}`).join(" ");
  sampleResults.push({ id, name, lat: s.lat, lon: s.lon, cells, within, exact, worst: +worst.toFixed(2), worstAt, pass: within === cells, perMonthStr, perPrayerStr });
}

// ---- 5. national anchored check (all 190, coords solved from the portal's own rows) ----
// ---- 5. national per-city fit (all 190): lon from dhuhr; (lat, m_sr, m_mg) from sunrise/maghrib;
//         margins for fajr/asr/isha fitted as means; then per-day residual gate ----
function horizonH(lat, dec, altDeg) { return hourAngleDeg(altDeg, lat, dec); }
function asrAltDeg(lat, dec, s) { return Math.atan(s / (s + Math.tan(Math.abs(lat * RAD - dec)))) / RAD; }
const national = [];
for (const v of data["2026-10"].villes) {
  const days = [];
  for (const ym of MONTHS) {
    monthDates(ym).forEach((date, i) => {
      const r = data[ym].villes.find((x) => x.c === v.c).h[i].map(toMin);
      days.push({ date, fajr: r[0], sunrise: r[1], dhuhr: r[2], asr: r[3], magrib: r[4], isha: r[5],
        noon: r[2] - MARGINS.dhuhr, ...(() => { const { dec, eqtime } = sunPos(julianNoon(...date.split("-").map(Number))); return { dec, eqtime }; })() });
    });
  }
  const lonSamples = days.map((d) => (725 - d.eqtime - d.dh) / 4);
  lonSamples.sort((a, b) => a - b);
  const lon = lonSamples[Math.floor(lonSamples.length / 2)];
  const D = days.map((d) => d.magrib - d.sunrise);
  const best = { phi: 0, sse: Infinity, mDiff: 0 };
  for (let phi = 18; phi <= 40; phi += 0.01) {
    const hs = days.map((d) => 8 * horizonH(phi, d.dec, -0.833));
    const mDiff = D.reduce((a, x, t) => a + x - hs[t], 0) / D.length;
    const sse = D.reduce((a, x, t) => a + (x - hs[t] - mDiff) ** 2, 0);
    if (sse < best.sse) Object.assign(best, { phi, sse, mDiff });
  }
  const lat = best.phi, mDiff = best.mDiff;
  const halfsum = days.reduce((a, d) => a + d.sunrise + d.magrib - 2 * d.noon, 0) / days.length;
  const mSr = (halfsum - mDiff) / 2, mMg = (halfsum + mDiff) / 2;
  const mFajr = days.reduce((a, d) => a + d.fajr - (d.noon - 4 * horizonH(lat, d.dec, -19)), 0) / days.length;
  const mAsr = days.reduce((a, d) => a + d.asr - (d.noon + 4 * horizonH(lat, d.dec, asrAltDeg(lat, d.dec, 1))), 0) / days.length;
  const mIsha = days.reduce((a, d) => a + d.isha - (d.noon + 4 * horizonH(lat, d.dec, -17)), 0) / days.length;
  // per-day residual gate with fitted margins; recorded-margin residuals too
  const rec = { fajr: [], asr: [], isha: [] };
  let fitWithin = 0, fitCells = 0, fitWorst = 0, recWithin = 0, recCells = 0, recWorst = 0;
  const perPrayerFit = Object.fromEntries(PRAYERS.map((p) => [p, [0, 0]]));
  for (const d of days) {
    const comp = {
      fajr: d.noon - 4 * horizonH(lat, d.dec, -19) + mFajr,
      sunrise: d.noon - 4 * horizonH(lat, d.dec, -0.833) + mSr,
      dhuhr: d.noon + MARGINS.dhuhr,
      asr: d.noon + 4 * horizonH(lat, d.dec, asrAltDeg(lat, d.dec, 1)) + mAsr,
      magrib: d.noon + 4 * horizonH(lat, d.dec, -0.833) + mMg,
      isha: d.noon + 4 * horizonH(lat, d.dec, -17) + mIsha,
    };
    const recComp = {
      fajr: d.noon - 4 * horizonH(lat, d.dec, -19) + MARGINS.fajr,
      asr: d.noon + 4 * horizonH(lat, d.dec, asrAltDeg(lat, d.dec, 1)) + MARGINS.asr,
      isha: d.noon + 4 * horizonH(lat, d.dec, -17) + MARGINS.isha,
    };
    for (const p of PRAYERS) {
      const diff = Math.abs(d[p] - comp[p]);
      fitCells++; perPrayerFit[p][0]++;
      if (diff <= 1.0001) { fitWithin++; perPrayerFit[p][1]++; }
      if (diff > fitWorst) fitWorst = diff;
    }
    for (const p of ["fajr", "asr", "isha"]) {
      rec[p].push(d[p] - recComp[p]);
      const diff = Math.abs(d[p] - recComp[p]);
      recCells++;
      if (diff <= 1.0001) recWithin++;
      if (diff > recWorst) recWorst = diff;
    }
  }
  const recMean = Object.fromEntries(["fajr", "asr", "isha"].map((p) => [p, +(rec[p].reduce((a, b) => a + b, 0) / rec[p].length).toFixed(2)]));
  national.push({
    c: v.c, n: v.n, lat: +lat.toFixed(3), lon: +lon.toFixed(3),
    mFajr: +mFajr.toFixed(2), mSr: +mSr.toFixed(2), mMg: +mMg.toFixed(2), mAsr: +mAsr.toFixed(2), mIsha: +mIsha.toFixed(2), mDhuhr: MARGINS.dhuhr,
    fitCells, fitWithin, fitWorst: +fitWorst.toFixed(2), perPrayerFit,
    recCells, recWithin, recWorst: +recWorst.toFixed(2), recMean,
    passFit: fitWithin === fitCells, passRec: recWithin === recCells,
  });
}
fs.writeFileSync(path.join(W, "data", "recipe-national.json"), JSON.stringify(national, null, 1));

// ---- report ----
console.log("=== ENUMERATION ===");
console.log("cities:", cities.length, "| identity mismatches across months:", identityMismatches, "| ids:", Math.min(...cities.map(c => c.c)), "-", Math.max(...cities.map(c => c.c)));
console.log("=== MONOTONICITY (61-day joined window, 190 cities) ===");
console.log("violations:", monoViol, "(of which at the Oct/Nov boundary:", monoViolCross, ") | worst reversal(min):", monoWorst);
console.log("=== SAMPLE (10 cities, known coords) ===");
for (const r of sampleResults) console.log(`c=${r.id} ${r.name} lat${r.lat} lon${r.lon}: ${r.within}/${r.cells} within1min, ${r.exact} exact, worst ${r.worst}min @ ${r.worstAt} -> ${r.pass ? "PASS" : "DEVIATE"}\n   months: ${r.perMonthStr} | prayers: ${r.perPrayerStr}`);
console.log("=== NATIONAL (190 cities, per-city fit) ===");
const fitPass = national.filter((r) => r.passFit), fitFail = national.filter((r) => !r.passFit);
const recPass = national.filter((r) => r.passRec);
const fitCellsTot = national.reduce((a, r) => a + r.fitCells, 0), fitWithinTot = national.reduce((a, r) => a + r.fitWithin, 0);
const recCellsTot = national.reduce((a, r) => a + r.recCells, 0), recWithinTot = national.reduce((a, r) => a + r.recWithin, 0);
console.log(`ANGLE hold-rate (fitted margins, angles 19/Shafi/17): ${fitPass.length}/190 cities | cells ${fitWithinTot}/${fitCellsTot}`);
console.log(`RECORDED-recipe hold-rate (margins -1/+5/+1/0): ${recPass.length}/190 cities fully within 1 min | cells ${recWithinTot}/${recCellsTot}`);
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
console.log("fitted margins medians (min): fajr", med(national.map(r => r.mFajr)), "sunrise", med(national.map(r => r.mSr)), "maghrib", med(national.map(r => r.mMg)), "asr", med(national.map(r => r.mAsr)), "isha", med(national.map(r => r.mIsha)));
console.log("recorded-margin mean deltas (printed - recipe-computed) medians: fajr", med(national.map(r => r.recMean.fajr)), "asr", med(national.map(r => r.recMean.asr)), "isha", med(national.map(r => r.recMean.isha)));
console.log("fit deviating cities (angles fail):");
for (const r of fitFail) console.log(`  c=${r.c} ${r.n} lat${r.lat}: fit ${r.fitWithin}/${r.fitCells} worst ${r.fitWorst} | perPrayer ${JSON.stringify(Object.fromEntries(Object.entries(r.perPrayerFit).map(([k, [w, t]]) => [k, `${w}/${t}`])))}`);
console.log("recorded-margin deviating cities (first 10 by recWorst):");
for (const r of national.filter((x) => !x.passRec).sort((a, b) => b.recWorst - a.recWorst).slice(0, 10)) console.log(`  c=${r.c} ${r.n} lat${r.lat}: rec ${r.recWithin}/${r.recCells} worst ${r.recWorst} deltas ${JSON.stringify(r.recMean)}`);

// ---- 6. angle discrimination at real coords (mutation pass): does 19/Shafi/17 beat alternatives? ----
const DISC = [
  { id: 1, lat: 34.0209, lon: -6.8416 },   // Rabat
  { id: 81, lat: 34.0331, lon: -5.0078 },  // Fes
  { id: 117, lat: 30.4278, lon: -9.5981 }, // Agadir
  { id: 156, lat: 27.1536, lon: -13.2033 },// Laayoune
  { id: 165, lat: 23.6848, lon: -15.9579 },// Dakhla
];
const COMBOS = [
  { f: 19, i: 17, s: 1, label: "recipe 19/17 Shafi" },
  { f: 18, i: 17, s: 1, label: "fajr 18" },
  { f: 20, i: 17, s: 1, label: "fajr 20" },
  { f: 19, i: 16, s: 1, label: "isha 16" },
  { f: 19, i: 18, s: 1, label: "isha 18" },
  { f: 19, i: 17, s: 2, label: "asr Hanafi (s2)" },
];
console.log("=== ANGLE DISCRIMINATION (real coords, fitted margins, days within 1 min of 61) ===");
for (const s of DISC) {
  const line = COMBOS.map((cb) => {
    const mF = [], mI = [], mA = [];
    const days = [];
    for (const ym of MONTHS) monthDates(ym).forEach((date, i) => {
      const r = data[ym].villes.find((x) => x.c === s.id).h[i].map(toMin);
      const { dec, eqtime } = sunPos(julianNoon(...date.split("-").map(Number)));
      days.push({ fajr: r[0], asr: r[3], isha: r[5], dh: r[2], dec, noon: r[2] - MARGINS.dhuhr });
    });
    for (const d of days) {
      mF.push(d.fajr - (d.noon - 4 * hourAngleDeg(-cb.f, s.lat, d.dec)));
      mI.push(d.isha - (d.noon + 4 * hourAngleDeg(-cb.i, s.lat, d.dec)));
      mA.push(d.asr - (d.noon + 4 * hourAngleDeg(asrAltDeg(s.lat, d.dec, cb.s), s.lat, d.dec)));
    }
    const compF = days.map((d, t) => d.noon - 4 * hourAngleDeg(-cb.f, s.lat, d.dec) + mF[t]);
    const compI = days.map((d, t) => d.noon + 4 * hourAngleDeg(-cb.i, s.lat, d.dec) + mI[t]);
    const compA = days.map((d, t) => d.noon + 4 * hourAngleDeg(asrAltDeg(s.lat, d.dec, cb.s), s.lat, d.dec) + mA[t]);
    const wF = days.reduce((a, d, t) => a + (Math.abs(d.fajr - compF[t]) <= 1.0001 ? 1 : 0), 0);
    const wI = days.reduce((a, d, t) => a + (Math.abs(d.isha - compI[t]) <= 1.0001 ? 1 : 0), 0);
    const wA = days.reduce((a, d, t) => a + (Math.abs(d.asr - compA[t]) <= 1.0001 ? 1 : 0), 0);
    return `${cb.label}: f${wF} a${wA} i${wI}`;
  });
  console.log(`c=${s.id} ${cities.find((x) => x.c === s.id).n}: ${line.join(" | ")}`);
}
