const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/northafrica2";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const year = parseInt(process.argv[2], 10);
const gouv = process.argv[3] || "342";
const deleg = process.argv[4] || "615";

function daysInYear(y) {
  const n = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
  const out = [];
  const d = new Date(Date.UTC(y, 0, 1));
  for (let i = 0; i < n; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const ndjson = fs.openSync(`${W}/captures/tn-horaire-tunis-${year}.ndjson`, "w");
const rows = {};
let nulls = 0;
const days = daysInYear(year);
for (const date of days) {
  let body = null;
  for (let attempt = 0; attempt < 3 && body === null; attempt++) {
    try {
      body = execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA,
        "--max-time", "20",
        `https://www.meteo.tn/horaire_gouvernorat/${date}/${gouv}/${deleg}`],
        { encoding: "utf8", timeout: 25000 });
    } catch (e) { body = null; }
    if (body && body.includes('"data":null')) { fs.writeSync(ndjson, body.trim() + "\n"); nulls++; body = ""; break; }
    if (body) {
      fs.writeSync(ndjson, body.trim() + "\n");
      try {
        const j = JSON.parse(body);
        if (j.data) {
          const dd = j.data;
          if (!dd.date.startsWith(date)) throw new Error("date mismatch " + dd.date);
          rows[date] = { fajr: dd.sobh, dhuhr: dd.dhohr, asr: dd.aser, magrib: dd.magreb, isha: dd.isha };
        } else { nulls++; }
      } catch (e) { body = null; }
    }
    if (!body) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
  }
  if (body === null) console.log("FAILED", date);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
}
fs.closeSync(ndjson);
fs.writeFileSync(`${W}/data/tn-inm-tunis-${year}.json`, JSON.stringify(rows, null, 1));
const keys = Object.keys(rows).sort();
console.log(`year ${year}: ${keys.length} rows, ${nulls} null days`);
if (keys.length) console.log("first", keys[0], JSON.stringify(rows[keys[0]]), "last", keys[keys.length - 1], JSON.stringify(rows[keys[keys.length - 1]]));
