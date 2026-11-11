// Tunisia INM dated archive: one row per day, Tunis city delegation (342/615).
const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const year = parseInt(process.argv[2], 10);
const gouv = process.argv[3] || "342";
const deleg = process.argv[4] || "615";

function daysInYear(y) {
  const n = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(new Date(Date.UTC(y, 0, 1 + i)).toISOString().slice(0, 10));
  }
  return out;
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const ndjsonPath = `${W}/captures/tn-horaire-tunis-${year}.ndjson`;
const ndjson = fs.openSync(ndjsonPath, "w");
const rows = {};
let nulls = 0;
let failed = 0;

for (const date of daysInYear(year)) {
  let body = null;
  for (let attempt = 0; attempt < 3 && body === null; attempt++) {
    try {
      body = execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA, "--max-time", "20",
        `https://www.meteo.tn/horaire_gouvernorat/${date}/${gouv}/${deleg}`],
        { encoding: "utf8", timeout: 25000 });
    } catch (e) { body = null; }
    if (!body) { sleep(300); continue; }
    fs.writeSync(ndjson, body.trim() + "\n");
    try {
      const j = JSON.parse(body);
      const dd = j.data;
      if (!dd) { nulls++; break; }
      if (!dd.date.startsWith(date)) throw new Error("date mismatch " + dd.date);
      rows[date] = { fajr: dd.sobh, dhuhr: dd.dhohr, asr: dd.aser, magrib: dd.magreb, isha: dd.isha };
    } catch (e) {
      failed++;
      console.error("BAD", date, String(e).slice(0, 80));
    }
    break;
  }
  if (body === null) { failed++; console.error("FAILED", date); }
  sleep(150);
}

fs.closeSync(ndjson);
fs.writeFileSync(`${W}/data/tn-inm-tunis-${year}.json`, JSON.stringify(rows, null, 1));
const keys = Object.keys(rows).sort();
console.log(`year ${year}: ${keys.length} rows, ${nulls} null days, ${failed} failures`);
if (keys.length) {
  console.log("first", keys[0], JSON.stringify(rows[keys[0]]));
  console.log("last", keys[keys.length - 1], JSON.stringify(rows[keys[keys.length - 1]]));
}
