// Tunisia INM dated archive sweep. Sequential; run several processes over disjoint plan files.
// Usage: node sweep.js <plan.json> <sleepMs> <tag>
// plan.json: [{gouv, deleg, name, days:[YYYY-MM-DD,...]}, ...]
const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const planPath = process.argv[2];
const sleepMs = Number(process.argv[3] || 1000);
const tag = process.argv[4] || "sweep";

const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const out = fs.openSync(`${W}/logs/${tag}.log`, "a");
const log = (s) => fs.writeSync(out, s + "\n");

const stats = { requests: 0, ok: 0, nulls: 0, failed: 0 };
const t0 = Date.now();

for (const item of plan) {
  const capPath = `${W}/captures/tn-horaire-${tag}-${item.gouv}-${item.deleg}.ndjson`;
  const fd = fs.openSync(capPath, "w");
  const rows = {};
  for (const date of item.days) {
    let body = null;
    for (let attempt = 0; attempt < 3 && body === null; attempt++) {
      try {
        body = execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA, "--max-time", "25",
          `https://www.meteo.tn/horaire_gouvernorat/${date}/${item.gouv}/${item.deleg}`],
          { encoding: "utf8", timeout: 30000 });
      } catch (e) { body = null; }
      if (body === null) sleep(1500);
    }
    stats.requests++;
    if (body === null) { stats.failed++; log(`FAIL ${item.name} ${date}`); continue; }
    fs.writeSync(fd, JSON.stringify({ date, gouv: item.gouv, deleg: item.deleg, body }) + "\n");
    let dd = null;
    try { dd = JSON.parse(body).data; } catch (e) { stats.failed++; log(`PARSE ${item.name} ${date}`); continue; }
    if (!dd) { stats.nulls++; continue; }
    if (!String(dd.date).startsWith(date) || dd.delegation.id !== item.deleg) {
      stats.failed++; log(`ECHO ${item.name} ${date} got ${dd.date} ${dd.delegation.id}`); continue;
    }
    rows[date] = {
      fajr: dd.sobh, dhuhr: dd.dhohr, asr: dd.aser, maghrib: dd.magreb, isha: dd.isha,
      lat: dd.lat.trim(), lng: dd.lng.trim(),
    };
    stats.ok++;
    sleep(sleepMs);
  }
  fs.closeSync(fd);
  fs.writeFileSync(`${W}/data/tn-inm-${tag}-${item.gouv}-${item.deleg}.json`,
    JSON.stringify({ name: item.name, gouv: item.gouv, deleg: item.deleg, rows }, null, 0));
  log(`${item.name} ${item.gouv}/${item.deleg}: ${Object.keys(rows).length}/${item.days.length}`);
}

const line = `DONE ${tag}: delegations ${plan.length}, requests ${stats.requests}, ok ${stats.ok}, nulls ${stats.nulls}, failed ${stats.failed}, ${((Date.now() - t0) / 1000).toFixed(0)}s`;
log(line);
console.log(line);
