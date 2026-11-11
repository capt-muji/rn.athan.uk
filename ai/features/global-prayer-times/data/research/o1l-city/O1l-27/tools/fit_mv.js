const adhan = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");
const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "mv-5-islands-2026-11.json"), "utf8"));

const COORD = {
  "1": { name: "HA. Thuraakunu", lat: 6.9553, lon: 73.1006 },
  "953": { name: "Addu Hithadhoo", lat: -0.6094, lon: 73.0900 },
  "421": { name: "K. Thulusdhoo", lat: 4.3742, lon: 73.6497 },
  "603": { name: "M. Mulah", lat: 2.9467, lon: 73.5853 },
  "951": { name: "Gn. Fuvahmulah", lat: -0.2989, lon: 73.4239 },
  "415": { name: "Male", lat: 4.1755, lon: 73.5093 },
};

const OFF = 5 * 3600 * 1000; // Indian/Maldives, no DST

function compute(lat, lon, dateStr) {
  const [d, mo, y] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0) - OFF);
  const p = new adhan.CalculationParameters();
  p.method = null;
  p.fajrAngle = 20;
  p.ishaAngle = 18;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = adhan.Rounding.Nearest;
  p.adjustments = { fajr: 5, sunrise: -2, dhuhr: 4, asr: 1, maghrib: 2, isha: 4 };
  const t = new adhan.PrayerTimes(new adhan.Coordinates(lat, lon), date, p);
  const mid = Date.UTC(y, mo - 1, d, 0, 0, 0) - OFF;
  const f = (x) => Math.round((x.getTime() - mid) / 60000);
  return { fajr: f(t.fajr), sunrise: f(t.sunrise), dhuhr: f(t.dhuhr), asr: f(t.asr), maghrib: f(t.maghrib), isha: f(t.isha) };
}

const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

const report = {};
for (const [iid, d] of Object.entries(data)) {
  const ref = COORD[iid];
  const rows = d.rows;
  const per = {};
  let exactAll = 0, within1All = 0, cells = 0;
  for (const c of COLS) per[c] = { res: [], exact: 0, w1: 0 };
  for (const [dateStr, v] of Object.entries(rows)) {
    const cmp = compute(ref.lat, ref.lon, dateStr);
    let dayExact = true, dayW1 = true;
    for (const c of COLS) {
      const r = toMin(v[c]) - cmp[c];
      per[c].res.push(r);
      cells++;
      if (r === 0) per[c].exact++; else dayExact = false;
      if (Math.abs(r) <= 1) per[c].w1++; else dayW1 = false;
    }
    if (dayExact) exactAll++;
    if (dayW1) within1All++;
  }
  const summ = {};
  for (const c of COLS) {
    const a = per[c].res;
    const mean = a.reduce((s, x) => s + x, 0) / a.length;
    const mae = a.reduce((s, x) => s + Math.abs(x), 0) / a.length;
    summ[c] = {
      mean: +mean.toFixed(2), mae: +mae.toFixed(2),
      min: Math.min(...a), max: Math.max(...a),
      exact: per[c].exact, within1: per[c].w1, n: a.length,
    };
  }
  report[iid] = { island: d.island, coord: ref, rows: Object.keys(rows).length, cells, exactAllDays: exactAll, within1AllDays: within1All, columns: summ };
}

fs.writeFileSync(path.join(__dirname, "..", "data", "mv-5-islands-fit.json"), JSON.stringify(report, null, 1));
for (const [iid, r] of Object.entries(report)) {
  console.log(`\n== ${iid} ${r.island} @ ${r.coord.lat},${r.coord.lon}  ${r.rows} days  exact-days ${r.exactAllDays}  within1-days ${r.within1AllDays}/${r.rows}`);
  for (const c of COLS) {
    const s = r.columns[c];
    console.log(`   ${c.padEnd(8)} mean ${String(s.mean).padStart(6)} mae ${String(s.mae).padStart(5)} range ${s.min}..${s.max}  exact ${s.exact}/${s.n} within1 ${s.within1}/${s.n}`);
  }
}
