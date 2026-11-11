// Oman MARA calendar_page2: plain GETs, 12 months per year, Muscat CityID=0.
// The English/Arabic page prints afternoons in 12-hour form with no meridiem.
const { execFileSync } = require("child_process");
const fs = require("fs");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const year = parseInt(process.argv[2], 10);
const rows = {};
const tz = "Asia/Muscat";

for (let month = 1; month <= 12; month++) {
  const out = `${W}/captures/om-mara-muscat-${year}-${String(month).padStart(2, "0")}.html`;
  const url = `https://www.mara.gov.om/calendar_page2.asp?year=${year}&month=${month}&CityID=0`;
  try {
    execFileSync("curl", ["-sS", "-A", UA, "--max-time", "40", "-o", out, url], { timeout: 45000 });
  } catch (e) {
    console.error("FETCH FAILED", year, month);
    continue;
  }
  const html = fs.readFileSync(out, "utf8");
  const trs = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
  let n = 0;
  for (const tr of trs) {
    const tds = [...tr.matchAll(/<td[^>]*>(?:<font[^>]*>)?([^<]*)</g)].map((m) => m[1].trim());
    if (tds.length < 7) continue;
    const m = /^(\d+)\/(\d+)\/(\d{4})$/.exec(tds[0]);
    if (!m) continue;
    const [, day, mon, yr] = m.map(Number);
    if (yr !== year || mon !== month) continue;
    const norm = tds.slice(1, 7).map((t, i) => {
      const [hh, mm] = t.split(":").map(Number);
      return `${String(i >= 2 && hh < 12 ? hh + 12 : hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    });
    rows[`${yr}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`] =
      Object.fromEntries(["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"].map((k, i) => [k, norm[i]]));
    n++;
  }
  console.log(`${year}-${String(month).padStart(2, "0")}: ${n} rows`);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400);
}

fs.writeFileSync(`${W}/data/om-muscat-${year}.json`, JSON.stringify(rows, null, 1));
const keys = Object.keys(rows).sort();
console.log(`${tz} ${year}: ${keys.length} rows, ${keys[0]} .. ${keys[keys.length - 1]}`);
