// Fit every athanpro month in data/ against its own city zone and print one line each.
// Gate is dhuhr vs solar noon; the recipe scan is 14-20 fajr, 14-19 isha, both asr schools.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.dirname(__dirname);
const TZ = {
  "ss-juba": "Africa/Juba",
  "lr-monrovia": "Africa/Monrovia",
  "tm-ashgabat": "Asia/Ashgabat",
  "np-kathmandu": "Asia/Kathmandu",
  "mm-yangon": "Asia/Yangon",
  "pg-port-moresby": "Pacific/Port_Moresby",
  "sb-honiara": "Pacific/Guadalcanal",
  "vu-port-vila": "Pacific/Efate",
  "ws-apia": "Pacific/Apia",
  "ki-south-tarawa": "Pacific/Tarawa",
  "pw-koror": "Pacific/Palau",
  "fm-pohnpei": "Pacific/Pohnpei",
  "hn-tegucigalpa": "America/Tegucigalpa",
};

const out = {};
for (const [slug, tz] of Object.entries(TZ)) {
  const file = path.join(ROOT, "data", `athanpro-${slug}.json`);
  if (!fs.existsSync(file)) continue;
  const raw = execFileSync("node", [path.join(ROOT, "tools/deshift.js"), file, tz, tz], {
    encoding: "utf8", maxBuffer: 1 << 24,
  });
  const j = JSON.parse(raw);
  out[slug] = j;
  console.log(
    `${slug.padEnd(18)} gate=${String(j.solarGateWorst).padStart(3)} ` +
    `recipe=${j.recipe.fajrAngle}/${j.recipe.ishaAngle}${j.recipe.asr === "Hanafi" ? "H" : "S"} ` +
    `joint=${j.joint} pct=${j.pctWithin1} worst=${j.worst} rows=${j.rows}`);
}
fs.writeFileSync(path.join(ROOT, "fits-athpro.json"), JSON.stringify(out, null, 1));
