// July-window boundary harvest for the Tunisia July class.
// One day per request from the meteo.tn dated archive, sequential with a pause.
const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/gaps-closed";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const targets = [
  { name: "Kairouan/Kairouan", gouv: 357, deleg: 630, cls: "class" },
  { name: "Sidi Bouzid/Sidi Bouzid", gouv: 355, deleg: 628, cls: "class" },
  { name: "Kairouan/Haffouz", gouv: 357, deleg: 523, cls: "class" },
  { name: "Sidi Bouzid/Sidi Ali Ben Aoun", gouv: 355, deleg: 509, cls: "control-in-region" },
  { name: "Kebili/Kebili", gouv: 1012, deleg: 482, cls: "control-out-region" },
];

function days(y, m, from, to) {
  const out = [];
  for (let d = from; d <= to; d++) out.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  return out;
}

const plan = [];
for (const t of targets) {
  const list = [...days(2026, 6, 24, 30), ...days(2026, 7, 1, 31), ...days(2026, 8, 1, 7)];
  plan.push({ ...t, days: list });
}
for (const t of targets.slice(0, 2)) plan.push({ ...t, days: days(2025, 7, 1, 31) });

const logFd = fs.openSync(`${W}/logs-tn-july.log`, "a");
const log = (s) => fs.writeSync(logFd, s + "\n");
let ok = 0, fail = 0;

for (const item of plan) {
  const cap = `${W}/captures/tn-july-${item.gouv}-${item.deleg}-${item.days[0].slice(0, 7)}.ndjson`;
  const fd = fs.openSync(cap, "w");
  const rows = {};
  for (const date of item.days) {
    let body = null;
    for (let a = 0; a < 3 && body === null; a++) {
      try {
        body = execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA, "--max-time", "25",
          `https://www.meteo.tn/horaire_gouvernorat/${date}/${item.gouv}/${item.deleg}`], { encoding: "utf8", timeout: 30000 });
      } catch (e) { body = null; }
      if (body === null) sleep(1500);
    }
    if (body === null) { fail++; log(`FAIL ${item.name} ${date}`); continue; }
    fs.writeSync(fd, JSON.stringify({ date, body }) + "\n");
    let dd = null;
    try { dd = JSON.parse(body).data; } catch (e) { fail++; log(`PARSE ${item.name} ${date}`); continue; }
    if (!dd || !String(dd.date).startsWith(date) || dd.delegation.id !== item.deleg) { fail++; log(`ECHO ${item.name} ${date}`); continue; }
    rows[date] = { fajr: dd.sobh, dhuhr: dd.dhohr, asr: dd.aser, maghrib: dd.magreb, isha: dd.isha, lat: dd.lat.trim(), lng: dd.lng.trim() };
    ok++;
    sleep(900);
  }
  fs.closeSync(fd);
  fs.writeFileSync(`${W}/data/tn-july-${item.gouv}-${item.deleg}-${item.days[0].slice(0, 7)}.json`,
    JSON.stringify({ name: item.name, cls: item.cls, gouv: item.gouv, deleg: item.deleg, rows }));
  log(`${item.name} ${item.days[0].slice(0, 7)}: ${Object.keys(rows).length}/${item.days.length}`);
}
log(`DONE tn-july: ok ${ok} fail ${fail}`);
console.log(`DONE ok ${ok} fail ${fail}`);
