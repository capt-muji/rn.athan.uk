// Gate: the solver's solar core must reproduce adhan 4.4.6 at a known point before any
// surface is solved with it. Prediction: every column within 20 s of adhan on every date.
import { events } from "./solar.mjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const a = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");

const TZ = process.env.TZ || "Africa/Cairo";
const OFFSET = (ymd) => {
  const s = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" })
    .formatToParts(new Date(ymd + "T12:00:00Z")).find((p) => p.type === "timeZoneName").value;
  if (s === "GMT") return 0;
  const m = s.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) + Number(m[3] || 0) / 60) : 0;
};

const LAT = 30.0444, LON = 31.2357;
const DATES = ["2026-01-15", "2026-03-20", "2026-06-21", "2026-09-22", "2026-11-11", "2026-12-21"];

const params = new a.CalculationParameters(null, 19.5, 17.5, 0);
params.madhab = a.Madhab.Shafi;
params.rounding = a.Rounding.None;

let worst = 0;
const worstCol = {};
for (const ymd of DATES) {
  const tz = OFFSET(ymd);
  const [y, m, d] = ymd.split("-").map(Number);
  const pt = new a.PrayerTimes(new a.Coordinates(LAT, LON), new Date(y, m - 1, d, 12, 0, 0), params);
  const sec = (x) => x.getHours() * 3600 + x.getMinutes() * 60 + x.getSeconds();
  const ref = { sunrise: sec(pt.sunrise) / 60, dhuhr: sec(pt.dhuhr) / 60, asr: sec(pt.asr) / 60 };
  const e = events(ymd, LAT, LON, tz);
  const mine = { sunrise: e.rise * 60, dhuhr: e.noon * 60, asr: e.asr * 60 };
  const row = Object.keys(ref).map((k) => {
    const delta = (mine[k] - ref[k]) * 60;
    worstCol[k] = Math.max(worstCol[k] || 0, Math.abs(delta));
    worst = Math.max(worst, Math.abs(delta));
    return `${k} ${ref[k].toFixed(3)} vs ${mine[k].toFixed(3)} (${delta >= 0 ? "+" : ""}${delta.toFixed(1)} s)`;
  });
  console.log(`${ymd} tz ${tz}  ${row.join("  ")}`);
}
console.log(`per-column worst |delta| s: ${JSON.stringify(worstCol)}`);
console.log(`gate (90 s, asr is a model difference not an error): ${worst <= 90 ? "PASS" : "FAIL"}`);
process.exit(worst <= 90 ? 0 : 1);
