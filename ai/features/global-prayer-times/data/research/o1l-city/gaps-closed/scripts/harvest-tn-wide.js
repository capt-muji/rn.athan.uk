// Widen the Tunisia July window: every day May-Sep for Kairouan and Sidi Bouzid, 2025 and 2026,
// to place the seasonal switch and test whether it is a 2026 regime or a yearly window.
const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/gaps-closed";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const targets = [
  { name: "Kairouan/Kairouan", gouv: 357, deleg: 630 },
  { name: "Sidi Bouzid/Sidi Bouzid", gouv: 355, deleg: 628 },
];

const logFd = fs.openSync(`${W}/logs/tn-wide.log`, "a");
const log = (s) => fs.writeSync(logFd, s + "\n");
let ok = 0, fail = 0;

for (const t of targets) {
  for (const year of [2025, 2026]) {
    for (const month of [5, 6, 9]) {
      const days = [];
      const last = new Date(year, month, 0).getDate();
      for (let d = 1; d <= last; d++) days.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
      const cap = `${W}/captures/tn-wide-${t.gouv}-${t.deleg}-${year}-${String(month).padStart(2, "0")}.ndjson`;
      const fd = fs.openSync(cap, "w");
      const rows = {};
      for (const date of days) {
        let body = null;
        for (let a = 0; a < 3 && body === null; a++) {
          try {
            body = execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA, "--max-time", "25",
              `https://www.meteo.tn/horaire_gouvernorat/${date}/${t.gouv}/${t.deleg}`], { encoding: "utf8", timeout: 30000 });
          } catch (e) { body = null; }
          if (body === null) sleep(1500);
        }
        if (body === null) { fail++; log(`FAIL ${t.name} ${date}`); continue; }
        fs.writeSync(fd, JSON.stringify({ date, body }) + "\n");
        let dd = null;
        try { dd = JSON.parse(body).data; } catch (e) { fail++; log(`PARSE ${t.name} ${date}`); continue; }
        if (!dd || !String(dd.date).startsWith(date) || dd.delegation.id !== t.deleg) { fail++; log(`ECHO ${t.name} ${date}`); continue; }
        rows[date] = { fajr: dd.sobh, dhuhr: dd.dhohr, asr: dd.aser, maghrib: dd.magreb, isha: dd.isha, lat: dd.lat.trim(), lng: dd.lng.trim() };
        ok++;
        sleep(700);
      }
      fs.closeSync(fd);
      fs.writeFileSync(`${W}/data/tn-wide-${t.gouv}-${t.deleg}-${year}-${String(month).padStart(2, "0")}.json`,
        JSON.stringify({ name: t.name, gouv: t.gouv, deleg: t.deleg, rows }));
      log(`${t.name} ${year}-${String(month).padStart(2, "0")}: ${Object.keys(rows).length}/${days.length}`);
    }
  }
}
log(`DONE tn-wide: ok ${ok} fail ${fail}`);
console.log(`DONE ok ${ok} fail ${fail}`);
