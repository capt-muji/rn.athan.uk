// Parse the ESA monthly tables captured by eg-year.js into one dated file per city-year.
// Usage: node eg-parse.js
const fs = require("fs");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/tncities";
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"];

function to24(t) {
  const m = t.trim().match(/(\d{1,2}):(\d{1,2})\s*([صم])/);
  if (!m) throw new Error("bad time: " + t);
  let h = parseInt(m[1], 10);
  const min = m[2];
  const am = m[3] === "ص";
  if (am && h === 12) h = 0;
  if (!am && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${min.padStart(2, "0")}`;
}

function parse(file, expectedCity) {
  const html = fs.readFileSync(file, "utf8");
  let table = null;
  for (const m of html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)) {
    if (m[1].includes("فجر")) { table = m[1]; break; }
  }
  if (!table) throw new Error("no prayer table in " + file);
  const out = {};
  for (const row of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]*>/g, "").trim());
    if (cells.length < 8) continue;
    const city = cells[0].replace(/ـ/g, "");
    if (expectedCity && city !== expectedCity.replace(/ـ/g, "")) throw new Error(`city mismatch: ${city} != ${expectedCity}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cells[1])) continue;
    const times = cells.slice(3, 9).map(to24);
    out[cells[1]] = Object.fromEntries(COLS.map((k, i) => [k, times[i]]));
  }
  return out;
}

for (const [label, city] of [["portsaid", "بورسعيـد"], ["luxor", "الأقصر"], ["assiut", "أسيــوط"]]) {
  const rows = {};
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const part = parse(`${W}/captures/eg-esa-monthlymwaket-${label}-2026-${mm}.html`, city);
    const days = Object.keys(part);
    if (!days.every((d) => d.slice(5, 7) === mm)) throw new Error(`${label} month ${mm} leaked another month`);
    Object.assign(rows, part);
  }
  fs.writeFileSync(`${W}/data/eg-esa-${label}-2026.json`, JSON.stringify(rows, null, 1));
  const d = Object.keys(rows).sort();
  console.log(`${label}: ${d.length} rows ${d[0]} .. ${d[d.length - 1]}`);
}

// control: the same month at Cairo, from the raw response banked by the mideast job the same day
{
  const rows = parse(`${process.env.HOME}/athan-gitree/census/o1k-wide/mideast/captures/eg-esa-monthlymwaket-cairo-2026-11.html`, "القاهرة");
  fs.writeFileSync(`${W}/data/eg-esa-cairo-2026-11.json`, JSON.stringify(rows, null, 1));
  const d = Object.keys(rows).sort();
  console.log(`cairo (control): ${d.length} rows ${d[0]} .. ${d[d.length - 1]}`);
}
