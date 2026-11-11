// Tunisia latitudinal edge check: the frozen recipe at the country's north and south ends.
// Usage: node tn-edge.js  (Bizerte 37.27N and Ben Guerdene 33.14N, Nov 2026 + Jan 2026)
const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/tncities";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const SITES = {
  bizerte: { gouv: 361, deleg: 634 },
  benguerdene: { gouv: 353, deleg: 488 },
  kasserine: { gouv: 362, deleg: 635 },
};
const MONTHS = ["2026-01", "2026-11"];

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

for (const [city, { gouv, deleg }] of Object.entries(SITES)) {
  const rows = {};
  for (const ym of MONTHS) {
    const [y, m] = ym.split("-").map(Number);
    const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (let i = 1; i <= n; i++) {
      const date = `${ym}-${String(i).padStart(2, "0")}`;
      let body = null;
      for (let a = 0; a < 3 && body === null; a++) {
        try {
          body = execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA, "--max-time", "20",
            `https://www.meteo.tn/horaire_gouvernorat/${date}/${gouv}/${deleg}`], { encoding: "utf8", timeout: 25000 });
        } catch { body = null; }
        if (!body) sleep(1000);
      }
      if (!body) { console.error(city, "FAILED", date); continue; }
      const dd = JSON.parse(body).data;
      if (!dd) { console.error(city, "null", date); continue; }
      rows[date] = { fajr: dd.sobh, dhuhr: dd.dhohr, asr: dd.aser, magrib: dd.magreb, isha: dd.isha, lat: dd.lat, lng: dd.lng };
      sleep(600);
    }
  }
  fs.writeFileSync(`${W}/data/tn-inm-${city}-edge.json`, JSON.stringify(rows, null, 1));
  console.log(city, Object.keys(rows).length, "rows", Object.keys(rows)[0], rows[Object.keys(rows)[0]].lat, rows[Object.keys(rows)[0]].lng);
}
