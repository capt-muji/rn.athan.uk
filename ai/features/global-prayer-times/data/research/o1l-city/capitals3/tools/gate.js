// Solar gate for one athanpro month table: dhuhr against solar noon at the page's own
// coordinates, in the IANA zone. Reports the worst day and the offset the table implies.
const fs = require("fs");
const { Coordinates, CalculationMethod, PrayerTimes, Rounding } = require(
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

const [file, tz] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(file, "utf8"));
const [lat, lon] = (d.meta.coord || []).map(Number);
const off = tzOffset(new Date("2026-09-01T12:00:00Z"), tz);
const c = new Coordinates(lat, lon);
const params = CalculationMethod.MuslimWorldLeague();
params.rounding = Rounding.None;
const per = [];
for (const [day, row] of Object.entries(d.rows)) {
  const pt = new PrayerTimes(c, new Date(day + "T00:00:00Z"), params);
  const noon = Math.round((pt.dhuhr.getTime() / 60000 + off + 1440 * 10) % 1440);
  per.push({ day, printed: row.dhuhr, noon, delta: diff(noon, hhmm(row.dhuhr)) });
}
const worst = per.reduce((a, b) => (b.delta > a.delta ? b : a));
const deltas = per.map((x) => x.delta).sort((a, b) => a - b);
console.log(JSON.stringify({
  file: file.split("/").pop(), city: d.meta.city, lat, lon, tz, offsetMin: off,
  rows: per.length, gateWorst: worst.delta, gateWorstDay: worst.day,
  gateMedian: deltas[Math.floor(deltas.length / 2)],
  gateDistinct: [...new Set(per.map((x) => x.delta))].sort((a, b) => a - b),
  impliedOffsetVsPrinted: per.slice(0, 3).map((x) => ({ day: x.day, printedDhuhr: x.printed,
    solarNoonLocal: `${String(Math.floor(x.noon / 60)).padStart(2, "0")}:${String(x.noon % 60).padStart(2, "0")}` })),
}, null, 1));
