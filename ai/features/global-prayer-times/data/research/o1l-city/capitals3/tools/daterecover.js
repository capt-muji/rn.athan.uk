// Date recovery for an undated live block: which days of 2026 reproduce the printed times?
// Scans every day across an angle grid; a day that matches on all five prayers dates the block.
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

// argv: lat lon tz fajr dhuhr asr maghrib isha [year]
const [latS, lonS, tz, ...rest] = process.argv.slice(2);
const year = rest.length > 5 ? Number(rest[5]) : 2026;
const printed = { fajr: rest[0], dhuhr: rest[1], asr: rest[2], maghrib: rest[3], isha: rest[4] };
const c = new Coordinates(Number(latS), Number(lonS));
const days = [];
const start = Date.UTC(year, 0, 1);
for (let i = 0; i < 366; i++) {
  const d = new Date(start + i * 86400000);
  if (d.getUTCFullYear() !== year) continue;
  days.push(d.toISOString().slice(0, 10));
}
const hits = [];
for (const day of days) {
  const off = tzOffset(new Date(day + "T12:00:00Z"), tz);
  for (let fa = 14; fa <= 20.0001; fa += 0.25) {
    for (let ia = 14; ia <= 19.0001; ia += 0.25) {
      for (const hanafi of [false, true]) {
        const params = CalculationMethod.MuslimWorldLeague();
        params.fajrAngle = fa; params.ishaAngle = ia; params.rounding = Rounding.None;
        const pt = new PrayerTimes(c, new Date(day + "T00:00:00Z"), params);
        pt.madhab = hanafi ? Madhab.Hanafi : Madhab.Shafi;
        let ok = 0, worst = 0;
        for (const col of ["fajr", "dhuhr", "asr", "maghrib", "isha"]) {
          const got = Math.round((pt[col].getTime() / 60000 + off + 1440 * 10) % 1440);
          const dd = diff(got, hhmm(printed[col]));
          worst = Math.max(worst, dd);
          if (dd <= 1) ok++;
        }
        if (ok === 5) hits.push({ day, fa, ia, asr: hanafi ? "Hanafi" : "Shafi", worst });
      }
    }
  }
}
const byDay = {};
for (const h of hits) (byDay[h.day] = byDay[h.day] || []).push(h);
console.log(JSON.stringify({ lat: Number(latS), lon: Number(lonS), tz, year, printed,
  hitDays: Object.keys(byDay).length,
  days: Object.keys(byDay).sort().slice(0, 40).map((d) => ({ day: d, fits: byDay[d].length,
    sample: byDay[d].slice(0, 3) })) }, null, 1));
