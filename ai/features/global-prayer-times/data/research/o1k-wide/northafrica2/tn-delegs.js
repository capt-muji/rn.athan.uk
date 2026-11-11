const fs = require("fs");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/northafrica2";
const html = fs.readFileSync(W + "/captures/tn-meteo-heures-prieres-live.html", "utf8");
const m = html.match(/<script[^>]*data-drupal-selector="drupal-settings-json"[^>]*>([\s\S]*?)<\/script>/);
if (!m) { console.log("NO settings script"); process.exit(1); }
const settings = JSON.parse(m[1]);
const blob = settings.rest_ephemeride_priere.restephemeridepriere;
const list = JSON.parse(blob.list_gouv.replace(/\\u0022/g, '"'));
fs.writeFileSync(W + "/data/tn-gouvernorats-delegations.json", JSON.stringify(list, null, 1));
for (const g of list) {
  if (["Tunis", "Sfax", "Kairouan"].includes(g.intituleFr)) {
    console.log(g.id, g.intituleFr, "->", (g.children || []).map(c => c.id + ":" + c.intituleFr).join(", "));
  }
}
console.log("gouvernorats:", list.length, "delegations total:", list.reduce((a, g) => a + (g.children || []).length, 0));
