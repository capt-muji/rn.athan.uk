// Correct an athanpro table rendered in the wrong zone: local = printed + (off_city - off_render).
// The two zones are literals from the page; the delta is arithmetic, never fitted.
// Then gate the corrected table against solar noon and fit it at the page's own coordinates.
const fs = require("fs");
const path = require("path");
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = require(
  "$HOME/athan-gitree/census/adhan-build/node_modules/adhan");

function tzOffset(date, tz) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour12: false, year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(date).filter((x) => x.type !== "literal")
    .map((x) => [x.type, x.value]));
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - date.getTime()) / 60000);
}
const hhmm = (v) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };
const mm = (x) => `${String(Math.floor(((x % 1440) + 1440) % 1440 / 60)).padStart(2, "0")}:${String(((x % 60) + 60) % 60).padStart(2, "0")}`;
const diff = (a, b) => { const d = Math.abs(a - b) % 1440; return Math.min(d, 1440 - d); };
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

// argv: datafile cityTz renderTz
const [file, cityTz, renderTz] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(file, "utf8"));
const [lat, lon] = (d.meta.coord || []).map(Number);
const probe = new Date(Object.keys(d.rows).sort()[0] + "T12:00:00Z");
const offC = tzOffset(probe, cityTz), offR = tzOffset(probe, renderTz);
const delta = offC - offR;
const rows = {};
for (const [day, r] of Object.entries(d.rows)) {
  const row = {};
  for (const c of COLS) row[c] = mm(hhmm(r[c]) + delta);
  rows[day] = row;
}

const c = new Coordinates(lat, lon);
function model(day) {
  const p = CalculationMethod.MuslimWorldLeague();
  p.rounding = Rounding.None;
  return new PrayerTimes(c, new Date(day + "T00:00:00Z"), p);
}
let gate = 0;
for (const [day, r] of Object.entries(rows)) {
  const off = tzOffset(new Date(day + "T12:00:00Z"), cityTz);
  const pt = model(day);
  gate = Math.max(gate, diff(Math.round((pt.dhuhr.getTime() / 60000 + off + 1440 * 10) % 1440), hhmm(r.dhuhr)));
}
let best = null;
for (let fa = 14; fa <= 20.0001; fa += 0.5) {
  for (let ia = 14; ia <= 19.0001; ia += 0.5) {
    for (const hanafi of [false, true]) {
      let w = 0, e = 0, n = 0, worst = 0;
      const per = {}; COLS.forEach((x) => (per[x] = { exact: 0, within1: 0, worst: 0 }));
      for (const [day, r] of Object.entries(rows)) {
        const off = tzOffset(new Date(day + "T12:00:00Z"), cityTz);
        const p = CalculationMethod.MuslimWorldLeague();
        p.fajrAngle = fa; p.ishaAngle = ia; p.rounding = Rounding.None;
        const pt = new PrayerTimes(c, new Date(day + "T00:00:00Z"), p);
        pt.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
        for (const col of COLS) {
          const got = Math.round((pt[col].getTime() / 60000 + off + 1440 * 10) % 1440);
          const dd = diff(got, hhmm(r[col]));
          per[col].worst = Math.max(per[col].worst, dd);
          if (dd === 0) per[col].exact++;
          if (dd <= 1) per[col].within1++;
          if (col !== "sunrise") { worst = Math.max(worst, dd); if (dd === 0) e++; if (dd <= 1) w++; n++; }
        }
      }
      if (!best || w > best.w || (w === best.w && e > best.e)) best = { fa, ia, hanafi, w, e, n, worst, per };
    }
  }
}
const out = path.join(path.dirname(file), path.basename(file).replace(".json", `-${renderTz.replace(/\//g, "-")}-corrected.json`));
fs.writeFileSync(out, JSON.stringify({ rows, meta: { ...d.meta, cityTz, renderTz, deltaMin: delta } }, null, 1));
console.log(JSON.stringify({
  city: d.meta.city, lat, lon, cityTz, renderTz, offCity: offC, offRender: offR, deltaMin: delta,
  rows: Object.keys(rows).length, solarGateWorst: gate,
  recipe: { fajrAngle: best.fa, ishaAngle: best.ia, asr: best.hanafi ? "Hanafi" : "Shafi" },
  joint: `${best.e}/${best.w} of ${best.n}`, pctWithin1: +(100 * best.w / best.n).toFixed(1), worst: best.worst,
  per: best.per, out,
}, null, 1));
