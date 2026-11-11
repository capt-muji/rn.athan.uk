// fit2.js <tag> <data-file> <lat> <lng> — per-column angle sweep at zero margins, core window and full span.
const fs = require("fs");
const adhan = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");

const [tag, file, lat, lng] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(file, "utf8"));
const rows = payload.rows || payload;
const coords = new adhan.Coordinates(parseFloat(lat), parseFloat(lng));
const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false });

const all = Object.keys(rows).sort().filter(d => rows[d].fajr && rows[d].fajr !== "00:00");
const core = all.filter(d => { const m = +d.slice(5, 7); return m <= 2 || m >= 11; });
const minutes = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const wrap = x => { let d = x; while (d > 720) d -= 1440; while (d < -720) d += 1440; return d; };

function score(key, params, dates) {
  let exact = 0, within = 0, sum = 0, worst = 0;
  for (const d of dates) {
    const [y, mo, da] = d.split("-").map(Number);
    const pt = new adhan.PrayerTimes(coords, new Date(y, mo - 1, da, 12), params);
    const [hh, mm] = fmt.format(pt[key]).split(":").map(Number);
    const delta = Math.abs(wrap(minutes(rows[d][key]) - (hh * 60 + mm)));
    if (delta === 0) exact++;
    if (delta <= 1) within++;
    sum += delta;
    if (delta > worst) worst = delta;
  }
  const n = dates.length;
  return { n, exact: +(exact / n * 100).toFixed(1), within1: +(within / n * 100).toFixed(1),
           mae: +(sum / n).toFixed(2), worst };
}

const presets = {
  ISNA: adhan.CalculationMethod.NorthAmerica,
  MWL: adhan.CalculationMethod.MuslimWorldLeague,
  Karachi: adhan.CalculationMethod.Karachi,
  Egypt: adhan.CalculationMethod.Egyptian,
  Turkey: adhan.CalculationMethod.Turkey,
};

function sweep(key) {
  let best = null;
  for (let a = 90; a <= 200; a++) {
    const params = new adhan.CalculationParameters();
    params.rounding = adhan.Rounding.None;
    params[key === "fajr" ? "fajrAngle" : "ishaAngle"] = a / 10;
    const s = score(key, params, core);
    if (!best || s.within1 > best.s.within1 || (s.within1 === best.s.within1 && s.mae < best.s.mae))
      best = { angle: a / 10, s };
  }
  return best;
}

const out = { tag, days: all.length, coreDays: core.length, span: [all[0], all[all.length - 1]],
              best: { fajr: sweep("fajr"), isha: sweep("isha") }, presets: {} };
for (const [name, factory] of Object.entries(presets)) {
  const params = factory();
  params.rounding = adhan.Rounding.None;
  out.presets[name] = { fajr: score("fajr", params, core), isha: score("isha", params, core),
                        dhuhr: score("dhuhr", params, all), maghrib: score("maghrib", params, all) };
}
console.log(JSON.stringify(out));
