// Fit the frozen INM recipe plus a per-delegation horizon dip.
// Run: TZ=Africa/Tunis node fit.js <glob-tag>   (default tag "sw")
const fs = require("fs");
const path = require("path");
const L = require("./lib2");

const W = process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities";
const tag = process.argv[2] || "sw";
const dataDir = `${W}/data`;
const COLS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const HORIZON = ["fajr", "maghrib", "isha"];
const FAJR = 18.1, ISHA = 18.1;

const dem = (() => {
  const p = `${W}/data/tn-dem.json`;
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
})();

function bisectDip(day, col, targetSec) {
  // model seconds are monotone in the dip; find the dip where the model hits the target instant
  const f = (dip) => {
    if (col === "fajr") return day.at(day.st.hourAngle(-(FAJR + dip), false));
    if (col === "isha") return day.at(day.st.hourAngle(-(ISHA + dip), true));
    return day.at(day.st.hourAngle(L.SEA_HORIZON - dip, true));
  };
  let lo = -0.8, hi = 2.4;
  const rising = f(hi) > f(lo);
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const v = f(mid);
    if ((v < targetSec) === rising) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// Printed minute -> the instant the publisher's own arithmetic started from,
// with the column's pad and rounding direction taken off.
const PRINT_CENTRE = { fajr: 0.5, maghrib: 2.5, isha: 0.5 };

function horizonResidual(days, dip) {
  // the metric the census reports is within-1, so count it and break ties on absolute size
  let w1 = 0, sum = 0;
  for (const d of days) {
    const t = L.times(d.coord, { fajrAngle: FAJR, ishaAngle: ISHA, dip, madhab: "shafi" }, d.date);
    const r = [
      Math.abs(L.roundMin(t.fajr, 0, "round") - d.printed.fajr),
      Math.abs(L.roundMin(t.maghrib, 2, "ceil") - d.printed.maghrib),
      Math.abs(L.roundMin(t.isha, 0, "round") - d.printed.isha),
    ];
    for (const v of r) { if (v <= 1) w1++; sum += v; }
  }
  return -w1 + sum / (100 * days.length);
}

function fitDip(days) {
  let best = { dip: 0, cost: Infinity };
  for (let i = 0; i <= 200; i++) {
    const dip = i * 0.01;
    const cost = horizonResidual(days, dip);
    if (cost < best.cost - 1e-9) best = { dip, cost };
  }
  return best.dip;
}

function seasonDips(days) {
  const byMonth = {};
  for (const d of days) (byMonth[d.date.slice(5, 7)] = byMonth[d.date.slice(5, 7)] || []).push(d);
  return Object.fromEntries(Object.entries(byMonth).sort().map(([m, g]) => [m, +fitDip(g).toFixed(2)]));
}

function scoreDays(days, cfg) {
  const out = {};
  for (const c of COLS) out[c] = { n: 0, exact: 0, w1: 0, sum: 0, max: 0, signed: 0 };
  let all1 = 0;
  for (const d of days) {
    const t = L.times(d.coord, cfg, d.date);
    const m = {
      fajr: L.roundMin(t.fajr, cfg.pad.fajr, cfg.mode.fajr),
      dhuhr: L.roundMin(t.dhuhr, cfg.pad.dhuhr, cfg.mode.dhuhr),
      asr: L.roundMin(t.asr, cfg.pad.asr, cfg.mode.asr),
      maghrib: L.roundMin(t.maghrib, cfg.pad.maghrib, cfg.mode.maghrib),
      isha: L.roundMin(t.isha, cfg.pad.isha, cfg.mode.isha),
    };
    let ok = true;
    for (const c of COLS) {
      const s = out[c];
      const res = Math.abs(m[c] - d.printed[c]);
      s.n++; if (res === 0) s.exact++;
      if (res <= 1) s.w1++; else ok = false;
      s.sum += res; s.signed += m[c] - d.printed[c];
      if (res > s.max) s.max = res;
    }
    if (ok) all1++;
  }
  for (const c of COLS) {
    const s = out[c];
    s.mae = s.sum / s.n; s.meanSigned = s.signed / s.n;
    s.exactPct = (100 * s.exact) / s.n; s.w1Pct = (100 * s.w1) / s.n;
    delete s.sum; delete s.signed;
  }
  out.all1 = all1; out.all1Pct = (100 * all1) / days.length;
  return out;
}

function bestColumn(days, col, dip) {
  let best = null;
  for (const mode of ["round", "floor", "ceil"]) {
    for (let pad = -3; pad <= 8; pad += 0.5) {
      let exact = 0, w1 = 0, sum = 0;
      for (const d of days) {
        const t = L.times(d.coord, { fajrAngle: FAJR, ishaAngle: ISHA, dip, madhab: "shafi" }, d.date);
        const v = L.roundMin(t[col], pad, mode);
        const res = Math.abs(v - d.printed[col]);
        if (res === 0) exact++;
        if (res <= 1) w1++;
        sum += res;
      }
      const rank = exact * 1e6 + w1 * 1e3 - sum / days.length;
      if (!best || rank > best.rank) best = { rank, pad, mode, exactPct: (100 * exact) / days.length, w1Pct: (100 * w1) / days.length, mae: sum / days.length };
    }
  }
  delete best.rank;
  return best;
}

const FROZEN = {
  pad: { fajr: 0, dhuhr: 7, asr: 0, maghrib: 2, isha: 0 },
  mode: { fajr: "round", dhuhr: "round", asr: "round", maghrib: "ceil", isha: "round" },
};

function loadDelegation(file) {
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const dates = Object.keys(j.rows).sort();
  if (!dates.length) return null;
  const days = dates.map((date) => {
    const r = j.rows[date];
    const coord = new L.A.Coordinates(Number(r.lat), Number(r.lng));
    return {
      date,
      coord,
      ...L.mkDay(coord, date),
      printed: { fajr: L.toMin(r.fajr), dhuhr: L.toMin(r.dhuhr), asr: L.toMin(r.asr), maghrib: L.toMin(r.maghrib), isha: L.toMin(r.isha) },
      lat: Number(r.lat), lng: Number(r.lng),
    };
  });
  return { meta: j, days };
}

const files = fs.readdirSync(dataDir).filter((f) => f.startsWith(`tn-inm-${tag}-`) && f.endsWith(".json"));
const results = [];
for (const f of files) {
  const d = loadDelegation(path.join(dataDir, f));
  if (!d) continue;
  const coord = d.days[0].coord;
  const key = `${d.days[0].lat},${d.days[0].lng}`;
  const elev = dem[key] === undefined ? null : dem[key];

  const perCol = {};
  for (const c of HORIZON) {
    const dips = d.days.map((day) => bisectDip(day, c, (day.printed[c] - PRINT_CENTRE[c]) * 60));
    dips.sort((a, b) => a - b);
    const med = dips[Math.floor(dips.length / 2)];
    const mean = dips.reduce((a, b) => a + b, 0) / dips.length;
    const sd = Math.sqrt(dips.reduce((a, b) => a + (b - mean) ** 2, 0) / dips.length);
    perCol[c] = { median: +med.toFixed(3), mean: +mean.toFixed(3), sd: +sd.toFixed(3), min: +dips[0].toFixed(3), max: +dips[dips.length - 1].toFixed(3) };
  }
  const dipFit = fitDip(d.days);
  const seasonDip = seasonDips(d.days);
  const dipDem = elev === null ? null : L.dipDeg(elev);

  const cfgFor = (dip) => ({ fajrAngle: FAJR, ishaAngle: ISHA, dip, madhab: "shafi", pad: FROZEN.pad, mode: FROZEN.mode });
  const out = {
    name: d.meta.name, gouv: d.meta.gouv, deleg: d.meta.deleg,
    lat: d.days[0].lat, lng: d.days[0].lng, days: d.days.length,
    first: d.days[0].date, last: d.days[d.days.length - 1].date,
    demElevation: elev,
    dipDemDeg: dipDem === null ? null : +dipDem.toFixed(3),
    impliedElevationFromFitM: Math.round(L.elevationFromDip(dipFit)),
    dipFitDeg: +dipFit.toFixed(3),
    seasonDip,
    dipByCol: perCol,
    scoreFlat: scoreDays(d.days, cfgFor(0)),
    scoreFit: scoreDays(d.days, cfgFor(dipFit)),
    scoreDem: dipDem === null ? null : scoreDays(d.days, cfgFor(dipDem)),
    best: Object.fromEntries(COLS.map((c) => [c, bestColumn(d.days, c, dipFit)])),
  };
  results.push(out);
  console.log(`${out.name} ${out.lat},${out.lng} n=${out.days} dem=${elev} dipFit=${out.dipFitDeg} dipDem=${out.dipDemDeg} all1 flat=${out.scoreFlat.all1Pct.toFixed(1)} fit=${out.scoreFit.all1Pct.toFixed(1)} dem=${out.scoreDem ? out.scoreDem.all1Pct.toFixed(1) : "na"}`);
}

fs.writeFileSync(`${W}/data/tn-fits-${tag}.json`, JSON.stringify(results, null, 1));
console.log(`wrote ${results.length} delegations`);
