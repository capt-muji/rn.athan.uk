// Egypt ESA: one city-year each, twelve postbacks per city, fresh form state per request.
// Usage: node eg-year.js
const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/tncities";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const PAGE = "https://www.esa.gov.eg/monthlymwaket.aspx";

const CITIES = [["portsaid", "بورسعيـد"], ["luxor", "الأقصر"], ["assiut", "أسيــوط"]];
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function grab(html, name) {
  const inp = html.match(new RegExp('<input[^>]*name="' + name + '"[^>]*value="([\\s\\S]*?)"'));
  if (inp) return inp[1];
  const ta = html.match(new RegExp('<textarea[^>]*name="' + name + '"[^>]*>([\\s\\S]*?)</textarea>'));
  return ta ? ta[1] : "";
}

for (const [label, city] of CITIES) {
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const out = `${W}/captures/eg-esa-monthlymwaket-${label}-2026-${mm}.html`;
    if (fs.existsSync(out) && fs.statSync(out).size > 20000) { console.log(label, mm, "banked"); continue; }
    const jar = `${W}/captures/eg-cookies-${label}-${mm}.txt`;
    const getFile = `${W}/captures/eg-esa-get-${label}-${mm}.html`;
    execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA, "-c", jar, "-o", getFile, PAGE]);
    const html = fs.readFileSync(getFile, "utf8");
    const form = new URLSearchParams();
    form.set("__EVENTTARGET", "ctl00$placeholder1$DropDownList2");
    form.set("__EVENTARGUMENT", "");
    form.set("__LASTFOCUS", "");
    form.set("__VIEWSTATE", grab(html, "__VIEWSTATE"));
    form.set("__VIEWSTATEGENERATOR", grab(html, "__VIEWSTATEGENERATOR"));
    form.set("__EVENTVALIDATION", grab(html, "__EVENTVALIDATION"));
    form.set("ctl00$placeholder1$DropDownList1", city);
    form.set("ctl00$placeholder1$DropDownList2", String(m));
    const body = `${W}/captures/eg-body-${label}-${mm}.txt`;
    fs.writeFileSync(body, form.toString());
    execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA, "-b", jar,
      "-H", "Content-Type: application/x-www-form-urlencoded",
      "-H", `Referer: ${PAGE}`, "-H", "Origin: https://www.esa.gov.eg",
      "--data-binary", "@" + body, "-o", out, PAGE]);
    const t = fs.readFileSync(out, "utf8");
    const dates = [...t.matchAll(/<td[^>]*>(\d{4}-\d{2}-\d{2})<\/td>/g)].map((x) => x[1]);
    console.log(label, mm, `${t.length}b`, "rows", dates.length, dates[0] || "-", dates[dates.length - 1] || "-");
    sleep(800);
  }
}
