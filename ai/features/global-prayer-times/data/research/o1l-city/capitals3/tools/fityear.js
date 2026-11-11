// Full-year fit with an optional fixed maghrib offset (the mawaqit board class).
// argv: datafile tz lat lon [maghribOffsetMin]
const fs = require("fs");
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = require(
  "$HOME/athan-gitree/census/adhan-build/node_modules/adhan");
const [file, tz, latS, lonS, magS] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(file, "utf8"));
const rows = d.rows;
const lat = +latS, lon = +lonS, mag = +(magS || 0);
const loc = (x) => { const s = x.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit" }); const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const hh = (v) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };
const diff = (a, b) => { const x = Math.abs(a - b) % 1440; return Math.min(x, 1440 - x); };
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
let best = null;
for (let fa = 14; fa <= 20.0001; fa += 0.5) {
  for (let ia = 14; ia <= 19.0001; ia += 0.5) {
    for (const hanafi of [false, true]) {
      const per = {}; COLS.forEach((c) => (per[c] = { exact: 0, within1: 0, worst: 0 }));
      let w = 0, e = 0, n = 0, worst = 0;
      for (const [day, row] of Object.entries(rows)) {
        const p = CalculationMethod.MuslimWorldLeague();
        p.fajrAngle = +fa.toFixed(2); p.ishaAngle = +ia.toFixed(2); p.rounding = Rounding.None;
        const pt = new PrayerTimes(new Coordinates(lat, lon), new Date(day + "T00:00:00Z"), p);
        pt.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
        for (const c of COLS) {
          const got = loc(pt[c]) + (c === "maghrib" ? mag : 0);
          const dd = diff(got, hh(row[c]));
          per[c].worst = Math.max(per[c].worst, dd);
          if (dd === 0) per[c].exact++;
          if (dd <= 1) per[c].within1++;
          if (c !== "sunrise") { worst = Math.max(worst, dd); if (dd === 0) e++; if (dd <= 1) w++; n++; }
        }
      }
      if (!best || w > best.w || (w === best.w && e > best.e)) best = { fa, ia, hanafi, w, e, n, worst, per };
    }
  }
}
const days = Object.keys(rows).sort();
const yr = days[0].slice(0, 4);
const byYear = {};
for (const day of days) (byYear[day.slice(0, 4)] = byYear[day.slice(0, 4)] || []).push(day);
const jan = rows[yr + "-01-15"], jul = rows[yr + "-07-15"];
console.log(JSON.stringify({
  file: file.split("/").pop(), rows: days.length, span: `${days[0]}..${days[days.length - 1]}`,
  recipe: { fajrAngle: best.fa, ishaAngle: best.ia, asr: best.hanafi ? "Hanafi" : "Shafi", maghribOffsetMin: mag },
  joint: `${best.e} exact / ${best.w} within-1 of ${best.n}`,
  pctWithin1: +(100 * best.w / best.n).toFixed(2), worst: best.worst, per: best.per,
  amplitudeFajrJanJul: jan && jul ? hh(jul.fajr) - hh(jan.fajr) : null,
  amplitudeIshaJanJul: jan && jul ? hh(jul.isha) - hh(jan.isha) : null,
}, null, 1));
