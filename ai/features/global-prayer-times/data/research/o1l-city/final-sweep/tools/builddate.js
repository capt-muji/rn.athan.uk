// Build-date recovery for the whole set: the span of 2026 days on which each page's printed
// "Today" block reproduces at the page's own recipe. One span for the fleet is the build window.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.dirname(__dirname);
const fits = JSON.parse(fs.readFileSync(path.join(ROOT, "fits-athpro.json"), "utf8"));
const spans = [];
for (const f of fits) {
  const raw = execFileSync("node", [path.join(ROOT, "tools/daterecover.js"), f.slug], { encoding: "utf8" });
  const days = (raw.split("days matching within 1 min:")[1] || "").trim().split(",").filter((x) => x && x !== "none");
  if (days.length) spans.push({ slug: f.slug, first: days[0], last: days[days.length - 1] });
}
const firsts = spans.map((s) => s.first).sort();
const lasts = spans.map((s) => s.last).sort();
console.log(`${spans.length}/${fits.length} pages have a recoverable build date`);
console.log(`earliest matching day ${firsts[0]}, latest matching day ${lasts[lasts.length - 1]}`);
console.log(`pages whose latest match is before 2026-10-05: ${spans.filter((s) => s.last < "2026-10-05").length}`);
fs.writeFileSync(path.join(ROOT, "build-dates.json"), JSON.stringify(spans, null, 1));
