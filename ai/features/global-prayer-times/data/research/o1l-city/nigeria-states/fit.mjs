import * as adhan from "$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js";
import fs from "fs";

const TZ = "Africa/Lagos";
const fmt = (d, tz) => d.toLocaleString("en-GB", {
  timeZone: tz || TZ, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
});
const mins = (s) => parseInt(s.slice(0, 2)) * 60 + parseInt(s.slice(3, 5)) + parseInt(s.slice(6, 8)) / 60;

function timesFor(lat, lon, y, m, d, method, madhab) {
  const date = new Date(Date.UTC(y, m - 1, d, 11, 0, 0));
  const params = method();
  params.madhab = madhab;
  const pt = new adhan.PrayerTimes(new adhan.Coordinates(lat, lon), date, params);
  return { fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha };
}

const METHODS = {
  egyptian: () => { const p = adhan.CalculationMethod.Egyptian(); return p; },
  mwl: () => adhan.CalculationMethod.MuslimWorldLeague(),
  umaq: () => adhan.CalculationMethod.UmmAlQura(),
};

function fit(mosque) {
  const rows = mosque.rows; // { 'YYYY-MM-DD': {fajr,...} }
  const lat = mosque.lat, lon = mosque.lon, tz = mosque.tz;
  const results = {};
  for (const [mname, method] of Object.entries(METHODS)) {
    for (const mode of ["round", "floor"]) {
      const perColDelta = {}; const perYear = {};
      let n = 0, exact = 0, within1 = 0, worst = 0;
      for (const [day, row] of Object.entries(rows)) {
        const [y, m, d] = day.split("-").map(Number);
        const t = timesFor(lat, lon, y, m, d, method, adhan.Madhab.Shafi);
        let dayWorst = 0; let okDay = true;
        for (const col of ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]) {
          const printed = mins(row[col] + ":00");
          const hv = fmt(t[col], tz);
          const computed = mode === "round"
            ? Math.round(mins(hv))
            : Math.floor(mins(hv));
          const delta = printed - computed;
          perColDelta[col] = perColDelta[col] || [];
          perColDelta[col].push(delta);
          const abs = Math.abs(delta);
          if (abs > dayWorst) dayWorst = abs;
          if (abs > 1) okDay = false;
        }
        n++;
        if (dayWorst === 0) exact++;
        if (dayWorst <= 1) within1++;
        if (dayWorst > worst) worst = dayWorst;
        const yr = y;
        perYear[yr] = perYear[yr] || { n: 0, exact: 0, within1: 0, worst: 0, worstWhen: "" };
        perYear[yr].n++;
        if (dayWorst === 0) perYear[yr].exact++;
        if (dayWorst <= 1) perYear[yr].within1++;
        if (dayWorst > perYear[yr].worst) { perYear[yr].worst = dayWorst; perYear[yr].worstWhen = day; }
        void okDay;
      }
      const margins = {};
      for (const [c, arr] of Object.entries(perColDelta)) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        margins[c] = Math.round(mean * 100) / 100;
      }
      results[`${mname}-${mode}`] = { n, exactPct: Math.round(1000 * exact / n) / 10, within1Pct: Math.round(1000 * within1 / n) / 10, worst, margins, perYear };
    }
  }
  return results;
}

const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const out = {};
for (const m of spec) {
  const rows = {};
  for (const f of m.files) Object.assign(rows, JSON.parse(fs.readFileSync(f, "utf8")));
  out[m.name] = fit({ rows, lat: m.lat, lon: m.lon, tz: m.tz });
  const best = Object.entries(out[m.name]).sort((a, b) => b[1].exactPct - a[1].exactPct)[0];
  console.log(`${m.name}: best ${best[0]} exact ${best[1].exactPct}% within1 ${best[1].within1Pct}% worst ${best[1].worst} n=${best[1].n}`);
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
