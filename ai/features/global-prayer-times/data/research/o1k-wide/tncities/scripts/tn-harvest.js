// Tunisia INM dated archive, one city per run: every day of 2020-2026.
// Usage: node tn-harvest.js <city>   (kairouan|gafsa|sfax)
const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/tncities";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const CITIES = {
  kairouan: { gouv: 357, deleg: 630 },
  gafsa: { gouv: 365, deleg: 638 },
  sfax: { gouv: 359, deleg: 632 },
};

const city = process.argv[2];
const { gouv, deleg } = CITIES[city];
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

function daysInYear(y) {
  const n = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
  const out = [];
  for (let i = 0; i < n; i++) out.push(new Date(Date.UTC(y, 0, 1 + i)).toISOString().slice(0, 10));
  return out;
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const log = (...a) => console.error(`[${city}]`, ...a);

for (const year of YEARS) {
  const days = daysInYear(year);
  const ndjsonPath = `${W}/captures/tn-horaire-${city}-${year}.ndjson`;
  const dataPath = `${W}/data/tn-inm-${city}-${year}.json`;
  const ndjson = fs.openSync(ndjsonPath, "w");
  const rows = {};
  let nulls = 0, failed = 0;

  for (const date of days) {
    let body = null;
    for (let attempt = 0; attempt < 3 && body === null; attempt++) {
      try {
        body = execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA, "--max-time", "20",
          `https://www.meteo.tn/horaire_gouvernorat/${date}/${gouv}/${deleg}`],
          { encoding: "utf8", timeout: 25000 });
      } catch (e) { body = null; }
      if (!body) { sleep(1000); continue; }
      fs.writeSync(ndjson, body.trim() + "\n");
      try {
        const dd = JSON.parse(body).data;
        if (!dd) { nulls++; break; }
        if (!dd.date.startsWith(date)) throw new Error("date mismatch " + dd.date);
        rows[date] = { fajr: dd.sobh, dhuhr: dd.dhohr, asr: dd.aser, magrib: dd.magreb, isha: dd.isha };
      } catch (e) {
        failed++;
        log("BAD", date, String(e).slice(0, 80));
      }
      break;
    }
    if (body === null) { failed++; log("FAILED", date); }
    sleep(400);
  }

  fs.closeSync(ndjson);
  fs.writeFileSync(dataPath, JSON.stringify(rows, null, 1));
  const keys = Object.keys(rows).sort();
  log(`year ${year}: ${keys.length} rows, ${nulls} null days, ${failed} failures`);
}
log("done");
