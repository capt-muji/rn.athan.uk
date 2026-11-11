const fs = require("fs");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/northafrica2";
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
  let n = 0;
  for (const row of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(c => c[1].trim());
    if (cells.length < 8) continue;
    const city = cells[0].replace(/ـ/g, "");
    if (expectedCity && city !== expectedCity.replace(/ـ/g, "")) throw new Error(`city mismatch: ${city}`);
    const date = cells[1];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const times = cells.slice(3, 9).map(to24);
    out[date] = {};
    COLS.forEach((k, i) => { out[date][k] = times[i]; });
    n++;
  }
  return { out, n };
}

for (const [label, city] of [["alexandria", "الأسكندرية"], ["aswan", "أســوان"]]) {
  const { out, n } = parse(`${W}/captures/eg-esa-monthlymwaket-${label}-2026-11.html`, city);
  fs.writeFileSync(`${W}/data/eg-esa-${label}-2026-11.json`, JSON.stringify(out, null, 1));
  const dates = Object.keys(out).sort();
  console.log(label, n, "rows", dates[0], "..", dates[dates.length - 1]);
  console.log("  first:", JSON.stringify(out[dates[0]]), "\n  last: ", JSON.stringify(out[dates[dates.length - 1]]));
}
