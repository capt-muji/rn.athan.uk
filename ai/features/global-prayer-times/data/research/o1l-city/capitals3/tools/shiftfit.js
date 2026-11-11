// Recover a month table printed on a wrong clock: scan a constant shift (minutes) over the
// whole table and report the best joint fit at each shift. A shift that makes all six columns
// reproduce at one recipe means the table is a correct computation on a wrong offset label.
const fs = require("fs");
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = require(
  "$HOME/athan-gitree/census/adhan-build/node_modules/adhan");

function tzOffset(date, tz) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour12: false, year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(date).filter((x) => x.type !== "literal")
    .map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}
const hhmm = (v) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };
const diff = (a, b) => { const d = Math.abs(a - b) % 1440; return Math.min(d, 1440 - d); };
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

const [file, tz] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(file, "utf8"));
const [lat, lon] = (d.meta.coord || []).map(Number);
const off = tzOffset(new Date("2026-09-01T12:00:00Z"), tz);
const c = new Coordinates(lat, lon);

function score(shift, fa, ia, hanafi) {
  const agg = { exact: 0, within1: 0, worst: 0, n: 0, per: {} };
  for (const col of COLS) agg.per[col] = { exact: 0, within1: 0, worst: 0 };
  for (const [day, row] of Object.entries(d.rows)) {
    const params = CalculationMethod.MuslimWorldLeague();
    params.fajrAngle = fa; params.ishaAngle = ia; params.rounding = Rounding.None;
    const pt = new PrayerTimes(c, new Date(day + "T00:00:00Z"), params);
    pt.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
    for (const col of COLS) {
      const got = Math.round((pt[col].getTime() / 60000 + off + shift + 1440 * 10) % 1440);
      const dd = diff(got, hhmm(row[col]));
      const s = agg.per[col];
      s.worst = Math.max(s.worst, dd);
      if (dd === 0) s.exact++;
      if (dd <= 1) s.within1++;
      if (col !== "sunrise") {
        agg.worst = Math.max(agg.worst, dd);
        if (dd === 0) agg.exact++;
        if (dd <= 1) agg.within1++;
        agg.n++;
      }
    }
  }
  return agg;
}

const out = [];
for (let shift = -720; shift <= 720; shift += 15) {
  let best = null;
  for (let fa = 14; fa <= 20.0001; fa += 0.5) {
    for (let ia = 14; ia <= 19.0001; ia += 0.5) {
      for (const hanafi of [false, true]) {
        const s = score(shift, fa, ia, hanafi);
        if (!best || s.within1 > best.s.within1 || (s.within1 === best.s.within1 && s.exact > best.s.exact))
          best = { s, fa, ia, hanafi };
      }
    }
  }
  out.push({ shiftMin: shift, within1: best.s.within1, exact: best.s.exact, of: best.s.n,
    worst: best.s.worst, fa: best.fa, ia: best.ia, asr: best.hanafi ? "Hanafi" : "Shafi" });
}
out.sort((a, b) => b.within1 - a.within1 || a.worst - b.worst);
console.log(JSON.stringify({ file: file.split("/").pop(), city: d.meta.city, lat, lon, tz,
  offsetMin: off, rows: Object.keys(d.rows).length, top: out.slice(0, 4) }, null, 1));
