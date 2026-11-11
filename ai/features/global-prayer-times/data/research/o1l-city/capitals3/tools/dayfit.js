// Single-day offset/shift scan: does a printed block reproduce at one coordinate under one
// constant shift and one recipe? Reports the best (shift, angles) and the residual per column.
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
const diff = (a, b) => { const d = Math.abs(a - b) % 1440; return Math.min(d, 1440 - d); };
// lat lon tz date fajr dhuhr asr maghrib isha
const [lat, lon, tz, date, ...t] = process.argv.slice(2);
const printed = { fajr: t[0], dhuhr: t[1], asr: t[2], maghrib: t[3], isha: t[4] };
const off = tzOffset(new Date(date + "T12:00:00Z"), tz);
let best = null;
for (let shift = -720; shift <= 720; shift += 5) {
  for (let fa = 12; fa <= 20.001; fa += 0.5) {
    for (let ia = 12; ia <= 19.001; ia += 0.5) {
      for (const hanafi of [false, true]) {
        const p = CalculationMethod.MuslimWorldLeague();
        p.fajrAngle = fa; p.ishaAngle = ia; p.rounding = Rounding.None;
        const pt = new PrayerTimes(new Coordinates(+lat, +lon), new Date(date + "T00:00:00Z"), p);
        pt.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
        const res = {}; let worst = 0;
        for (const c of Object.keys(printed)) {
          const got = Math.round((pt[c].getTime() / 60000 + off + shift + 1440 * 10) % 1440);
          res[c] = diff(got, hhmm(printed[c]));
          worst = Math.max(worst, res[c]);
        }
        if (!best || worst < best.worst) best = { shift, fa, ia, asr: hanafi ? "Hanafi" : "Shafi", worst, res };
      }
    }
  }
}
console.log(JSON.stringify({ date, lat: +lat, lon: +lon, tz, offsetMin: off, printed, best }, null, 1));
