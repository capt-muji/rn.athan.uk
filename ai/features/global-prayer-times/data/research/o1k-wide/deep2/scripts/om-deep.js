// Oman MARA fit: one recipe across 2021-2028.
// Run: TZ=Asia/Muscat node scripts/om-deep.js
const L = require("./lib");
const E = require("./engine");
const fs = require("fs");

const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";
const C = process.env.HOME + "/athan-gitree/census";
const LAT = 23.588, LNG = 58.3829;

const rows = {};
const toMin = (s, pm) => {
  let [h, m] = s.split(":").map(Number);
  if (pm && h < 12) h += 12;
  return h * 60 + m;
};

for (const y of [2021, 2023, 2025, 2026]) {
  for (const r of require(`${C}/ab-harvest/oman-muscat-${y}.json`)) {
    const [d, m, yy] = r[0].split("/").map(Number);
    rows[`${yy}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`] = {
      fajr: toMin(r[1]), sunrise: toMin(r[2]), dhuhr: toMin(r[3]),
      asr: toMin(r[4], true), maghrib: toMin(r[5], true), isha: toMin(r[6], true),
    };
  }
}
function addObj(src, year) {
  for (const [d, v] of Object.entries(src)) {
    if (!d.startsWith(String(year))) continue;
    // The banked 2028 parse added 12 h to dhuhr where the page prints 11:5x, giving 23:59.
    const dhuhrMin = toMin(v.dhuhr) >= 1200 ? toMin(v.dhuhr) - 720 : toMin(v.dhuhr);
    rows[d] = {
      fajr: toMin(v.fajr), sunrise: toMin(v.sunrise), dhuhr: dhuhrMin,
      asr: toMin(v.asr, true), maghrib: toMin(v.magrib || v.maghrib, true), isha: toMin(v.isha, true),
    };
  }
}
addObj(require(`${W}/data/om-muscat-2022.json`), 2022);
addObj(require(`${W}/data/om-muscat-2024.json`), 2024);
addObj(require(`${C}/o1k-wide/mideast/data/om-mara-muscat-2027.json`), 2027);
addObj(require(`${C}/o1k-wide/gulf2/data/om-muscat-2028.json`), 2028);

const days = Object.keys(rows).sort();
const c = L.coords(LAT, LNG);
const years = [...new Set(days.map((d) => d.slice(0, 4)))];
const printed = (k) => (d) => rows[d][k];

const coarse = E.grid(15, 20.5, 0.05);
const TAB_F = E.angleTable(c, days, coarse, "fajr");
const TAB_I = E.angleTable(c, days, coarse, "isha");
const T18 = {};
for (const d of days) T18[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: "hanafi" }, d);
const T18S = {};
for (const d of days) T18S[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: "shafi" }, d);

const out = { meta: { city: "Muscat", lat: LAT, lng: LNG, tz: "Asia/Muscat", rows: days.length, first: days[0], last: days[days.length - 1], years }, prayers: {} };

const fajr = E.fitAngle(TAB_F, days, printed("fajr"), [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
out.prayers.fajr = { kind: "angle", theta: fajr.theta, pad: fajr.pad, mode: fajr.mode, score: fajr.s };
const isha = E.fitAngle(TAB_I, days, printed("isha"), [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
out.prayers.isha = { kind: "angle", theta: isha.theta, pad: isha.pad, mode: isha.mode, score: isha.s };
const sunrise = E.fitFixed((d) => T18[d].sunrise, days, printed("sunrise"), [-5, -4, -3, -2, -1, 0, 1, 2]);
out.prayers.sunrise = { kind: "sunrise+pad", pad: sunrise.pad, mode: sunrise.mode, score: sunrise.s };
const dhuhr = E.fitFixed((d) => T18[d].dhuhr, days, printed("dhuhr"), [2, 3, 4, 5, 6, 7, 8]);
out.prayers.dhuhr = { kind: "noon+pad", pad: dhuhr.pad, mode: dhuhr.mode, score: dhuhr.s };
const asrH = E.fitFixed((d) => T18[d].asr, days, printed("asr"), [2, 3, 4, 5, 6, 7, 8]);
const asrS = E.fitFixed((d) => T18S[d].asr, days, printed("asr"), [2, 3, 4, 5, 6, 7, 8]);
out.prayers.asr_hanafi = { kind: "shadow", pad: asrH.pad, mode: asrH.mode, score: asrH.s };
out.prayers.asr_shafi = { kind: "shadow", pad: asrS.pad, mode: asrS.mode, score: asrS.s };
const maghrib = E.fitFixed((d) => T18[d].maghrib, days, printed("maghrib"), [2, 3, 4, 5, 6, 7, 8]);
out.prayers.maghrib = { kind: "sunset+pad", pad: maghrib.pad, mode: maghrib.mode, score: maghrib.s };

for (const [name, ref] of [
  ["fajr", (d) => TAB_F[fajr.theta][d]],
  ["isha", (d) => TAB_I[isha.theta][d]],
  ["sunrise", (d) => T18[d].sunrise],
  ["dhuhr", (d) => T18[d].dhuhr],
  ["maghrib", (d) => T18[d].maghrib],
  ["asr_hanafi", (d) => T18[d].asr],
  ["asr_shafi", (d) => T18S[d].asr],
]) {
  const p = out.prayers[name];
  const key = name.startsWith("asr_") ? "asr" : name;
  p.perYear = E.perYear(ref, days, printed(key), p.pad, p.mode);
  p.amplitude = E.amplitude(ref, days, printed(key), p.pad, p.mode);
}

// does the recipe hold year by year, refit per year?
const stab = {};
for (const y of years) {
  const yd = days.filter((d) => d.startsWith(y));
  const f = E.fitAngle(TAB_F, yd, printed("fajr"), [-2, -1, 0, 1, 2]);
  const i = E.fitAngle(TAB_I, yd, printed("isha"), [-2, -1, 0, 1, 2]);
  const dh = E.fitFixed((d) => T18[d].dhuhr, yd, printed("dhuhr"), [3, 4, 5, 6, 7]);
  const mg = E.fitFixed((d) => T18[d].maghrib, yd, printed("maghrib"), [3, 4, 5, 6, 7]);
  const a = E.fitFixed((d) => T18S[d].asr, yd, printed("asr"), [3, 4, 5, 6, 7]);
  stab[y] = { fajrTheta: f.theta, fajrPad: f.pad, fajrMode: f.mode, ishaTheta: i.theta, ishaPad: i.pad, ishaMode: i.mode, dhuhrPad: dh.pad, dhuhrMode: dh.mode, maghribPad: mg.pad, maghribMode: mg.mode, asrPad: a.pad, asrMode: a.mode };
}
out.stability = stab;

fs.writeFileSync(`${W}/om-deep.json`, JSON.stringify(out, null, 1));
console.log("rows", days.length, days[0], days[days.length - 1], "years", years.join(","));
for (const [k, v] of Object.entries(out.prayers)) console.log(k.padEnd(12), `theta ${v.theta ?? "-"} pad ${v.pad} ${v.mode}`.padEnd(34), E.fmt(v.score));
console.log("stability", JSON.stringify(stab));
