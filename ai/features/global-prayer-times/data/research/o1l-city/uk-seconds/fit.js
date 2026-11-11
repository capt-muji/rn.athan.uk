// fit.js <tag> <data-file> <lat> <lng> — score a year's dated rows against the census angle presets.
const fs = require("fs");
const adhan = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");

const [tag, file, lat, lng] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(file, "utf8"));
const rows = payload.rows || payload;
const coords = new adhan.Coordinates(parseFloat(lat), parseFloat(lng));
const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false });

const presets = {
  ISNA: adhan.CalculationMethod.NorthAmerica,
  MWL: adhan.CalculationMethod.MuslimWorldLeague,
  Karachi: adhan.CalculationMethod.Karachi,
  Egypt: adhan.CalculationMethod.Egyptian,
  UmmAlQura: adhan.CalculationMethod.UmmAlQura,
  Turkey: adhan.CalculationMethod.Turkey,
};

function minutes(s) { const [h, m] = s.split(":").map(Number); return h * 60 + m; }
function wrap(x) { let d = x; while (d > 720) d -= 1440; while (d < -720) d += 1440; return d; }

const result = { tag, lat: parseFloat(lat), lng: parseFloat(lng), days: Object.keys(rows).length, presets: {} };
const dates = Object.keys(rows).sort();
for (const [name, factory] of Object.entries(presets)) {
  const params = factory();
  params.rounding = adhan.Rounding.None;
  const score = { fajr: [0, 0, 0], dhuhr: [0, 0, 0], asr: [0, 0, 0], maghrib: [0, 0, 0], isha: [0, 0, 0] };
  for (const d of dates) {
    const [y, mo, da] = d.split("-").map(Number);
    const pt = new adhan.PrayerTimes(coords, new Date(y, mo - 1, da, 12), params);
    for (const [key, field] of [["fajr", "fajr"], ["dhuhr", "dhuhr"],
                                ["asr", "asr"], ["maghrib", "maghrib"], ["isha", "isha"]]) {
      const printed = minutes(rows[d][field]);
      const [hh, mm] = fmt.format(pt[key]).split(":").map(Number);
      const delta = Math.abs(wrap(printed - (hh * 60 + mm)));
      score[key][0] += delta === 0 ? 1 : 0;
      score[key][1] += delta <= 1 ? 1 : 0;
      score[key][2] += delta;
    }
  }
  const n = dates.length;
  result.presets[name] = Object.fromEntries(Object.entries(score).map(([k, v]) =>
    [k, { exact: +(v[0] / n * 100).toFixed(1), within1: +(v[1] / n * 100).toFixed(1), mae: +(v[2] / n).toFixed(1) }]));
}
// Interval signature: F = sunrise - fajr, I = isha - maghrib, by month.
const sig = { months: {} };
for (const d of dates) {
  const m = d.slice(0, 7);
  const r = rows[d];
  const F = minutes(r.sunrise) - minutes(r.fajr);
  const I = minutes(r.isha) - minutes(r.maghrib);
  (sig.months[m] = sig.months[m] || []).push([F, I]);
}
sig.table = Object.fromEntries(Object.entries(sig.months).map(([m, a]) => {
  const fs_ = a.map(x => x[0]), is_ = a.map(x => x[1]);
  const rng = v => Math.max(...v) - Math.min(...v);
  return [m, { Fmin: Math.min(...fs_), Fmax: Math.max(...fs_), Frange: rng(fs_),
               Imin: Math.min(...is_), Imax: Math.max(...is_), Irange: rng(is_) }];
}));
result.signature = sig.table;
console.log(JSON.stringify(result));
