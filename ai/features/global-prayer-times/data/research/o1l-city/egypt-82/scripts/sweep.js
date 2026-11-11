#!/usr/bin/env node
// Full-year ESA sweep: every city option x 12 months, resumable, with state refresh.
const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/egypt-82";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const COOKIES = W + "/captures/eg-cookies2.txt";
const GETFILE = W + "/captures/EG-GET-latest.html";
const log = (s) => fs.appendFileSync(W + "/logs/sweep.log", s + "\n");
const rowsIn = (f) => (fs.readFileSync(f, "utf8").match(/<td[^>]*>\d{4}-\d{2}-\d{2}<\/td>/g) || []).length;

function state() {
  execFileSync("curl", ["-sS", "--compressed", "-A", UA, "-c", COOKIES, "-o", GETFILE,
    "https://www.esa.gov.eg/monthlymwaket.aspx"]);
  const h = fs.readFileSync(GETFILE, "utf8");
  const grab = (n) => {
    let m = h.match(new RegExp('<input[^>]*name="' + n + '"[^>]*value="([\\s\\S]*?)"'));
    if (m) return m[1];
    m = h.match(new RegExp('<textarea[^>]*name="' + n + '"[^>]*>([\\s\\S]*?)</textarea>'));
    return m ? m[1] : null;
  };
  return { vs: grab("__VIEWSTATE"), vsg: grab("__VIEWSTATEGENERATOR"), ev: grab("__EVENTVALIDATION"),
           cities: JSON.parse(fs.readFileSync(W + "/captures/eg-formstate.json", "utf8")).cities };
}

async function post(st, cityValue, month, out) {
  const f = new URLSearchParams();
  f.set("__EVENTTARGET", "ctl00$placeholder1$DropDownList2");
  f.set("__EVENTARGUMENT", "");
  f.set("__LASTFOCUS", "");
  f.set("__VIEWSTATE", st.vs);
  f.set("__VIEWSTATEGENERATOR", st.vsg);
  f.set("__EVENTVALIDATION", st.ev);
  f.set("ctl00$placeholder1$DropDownList1", cityValue);
  f.set("ctl00$placeholder1$DropDownList2", String(month));
  const body = W + "/captures/.body.tmp";
  fs.writeFileSync(body, f.toString());
  const code = execFileSync("curl", ["-sS", "--compressed", "-A", UA,
    "-b", COOKIES, "-c", COOKIES,
    "-H", "Content-Type: application/x-www-form-urlencoded",
    "-H", "Referer: https://www.esa.gov.eg/monthlymwaket.aspx",
    "-H", "Origin: https://www.esa.gov.eg",
    "--data-binary", "@" + body, "-o", out, "-w", "%{http_code}",
    "https://www.esa.gov.eg/monthlymwaket.aspx"], { encoding: "utf8" }).trim();
  fs.unlinkSync(body);
  return code;
}

(async () => {
  let st = state();
  const cities = st.cities;
  let done = 0, fails = 0;
  for (let i = 0; i < cities.length; i++) {
    if (process.env.ONLY && !process.env.ONLY.split(",").includes(String(i))) continue;
    const c = cities[i];
    for (let m = 1; m <= 12; m++) {
      const out = `${W}/captures/eg-esa-2026-${String(m).padStart(2, "0")}-city${String(i).padStart(2, "0")}.html`;
      if (fs.existsSync(out) && rowsIn(out) > 0) { done++; continue; }
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        await post(st, c.value, m, out);
        ok = fs.existsSync(out) && rowsIn(out) > 0;
        if (!ok) { st = state(); await new Promise((r) => setTimeout(r, 900)); }
      }
      done++;
      if (!ok) { fails++; log(`FAIL ${i} ${c.key} m${m}`); }
      await new Promise((r) => setTimeout(r, 250));
    }
    console.log(`city ${i} ${c.key} (${done})`);
  }
  console.log(`SWEEP COMPLETE fails=${fails}`);
})();
