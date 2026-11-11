// Extract the IGGÖ's own published Vienna table (2026) and solve the implied twilight
// depression per day, to identify where the published high-latitude clause engages.
// Run: TZ=Europe/Vienna node at-iggo-table.js
const fs = require("fs");
const S = require("./solar");
const O = process.env.HOME + "/athan-gitree/census/o1l-city/gaps-closed";
const CAP = `${O}/captures`;
const COORD = new S.A.Coordinates(48.2082, 16.3738);

function parse(file, year) {
  const h = fs.readFileSync(file, "utf8");
  const rows = [];
  const trs = h.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  for (const tr of trs) {
    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim().split("\n")[0].trim());
    if (cells.length < 7 || !/^\d{2}\.\d{2}\.$/.test(cells[0])) continue;
    const [dd, mm] = cells[0].slice(0, 5).split(".");
    rows.push({
      date: `${year}-${mm}-${dd}`,
      fajr: cells[1], sunrise: cells[2], dhuhr: cells[3], asr: cells[4], maghrib: cells[5], isha: cells[6],
    });
  }
  return rows;
}

const all = [];
for (const m of ["05", "06", "07", "08", "09", "10", "11", "12"]) {
  const f = `${CAP}/at-iggo-wien-2026-${m}.html`;
  if (!fs.existsSync(f)) continue;
  all.push(...parse(f, 2026));
}
all.sort((a, b) => a.date.localeCompare(b.date));

// Implied depression: the angle whose computed time rounds to the printed minute.
function implied(day, col, base, dir) {
  const printed = S.toMin(day[col]);
  let best = null;
  for (let a = 8; a <= 20; a += 0.01) {
    const t = S.times(COORD, { fajrAngle: a, ishaAngle: a, madhab: "shafi", tz: "Europe/Vienna" }, day.date);
    const v = t[col] === null ? null : S.roundMin(t[col], 0, "round");
    if (v === printed) {
      if (best === null) best = [a, a];
      else best[1] = a;
    }
  }
  return best;
}

const out = all.map((d) => ({
  date: d.date,
  printed: { fajr: S.toMin(d.fajr), isha: S.toMin(d.isha), dhuhr: S.toMin(d.dhuhr), asr: S.toMin(d.asr), sunrise: S.toMin(d.sunrise), maghrib: S.toMin(d.maghrib) },
  fajrBand: implied(d, "fajr"),
  ishaBand: implied(d, "isha"),
}));

// Margins on the solar columns, measured from the published table itself.
const marg = { sunrise: [], dhuhr: [], asr: [], maghrib: [] };
for (const d of out) {
  const t = S.times(COORD, { fajrAngle: 18, ishaAngle: 16, madhab: "shafi", tz: "Europe/Vienna" }, d.date);
  for (const c of Object.keys(marg)) marg[c].push(d.printed[c] - t[c] / 60);
}
const stat = (a) => ({ mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), min: +Math.min(...a).toFixed(2), max: +Math.max(...a).toFixed(2) });

fs.writeFileSync(`${O}/data/at-iggo-wien-2026-implied.json`, JSON.stringify({ days: out.length, solarMargins: Object.fromEntries(Object.entries(marg).map(([k, v]) => [k, stat(v)])), out }, null, 1));

console.log("days", out.length, out[0].date, out[out.length - 1].date);
console.log("solar margins (published - computed):", JSON.stringify(Object.fromEntries(Object.entries(marg).map(([k, v]) => [k, stat(v)]))));
for (const d of out.filter((x) => ["2026-05-20", "2026-06-01", "2026-06-10", "2026-06-21", "2026-06-30", "2026-07-10", "2026-07-20", "2026-08-01", "2026-08-15", "2026-09-01", "2026-09-15", "2026-10-01"].includes(x.date))) {
  console.log(d.date, "fajr", d.printed.fajr, "band", d.fajrBand, "isha", d.printed.isha, "band", d.ishaBand);
}
