// Egypt ESA monthlymwaket: one postback per city, November 2026, fresh form state each time.
// Usage: node eg-post.js
const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/tncities";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const PAGE = "https://www.esa.gov.eg/monthlymwaket.aspx";

const CITIES = [
  ["portsaid", "بورسعيـد"],
  ["luxor", "الأقصر"],
  ["assiut", "أسيــوط"],
];

function grab(html, name) {
  const inp = html.match(new RegExp('<input[^>]*name="' + name + '"[^>]*value="([\\s\\S]*?)"'));
  if (inp) return inp[1];
  const ta = html.match(new RegExp('<textarea[^>]*name="' + name + '"[^>]*>([\\s\\S]*?)</textarea>'));
  return ta ? ta[1] : null;
}

for (const [label, city] of CITIES) {
  const jar = `${W}/captures/eg-cookies-${label}.txt`;
  const getFile = `${W}/captures/eg-esa-get-${label}.html`;
  execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA, "-c", jar, "-o", getFile,
    "-w", `GET ${label} %{http_code} %{size_download}b\n`, PAGE], { stdio: ["ignore", "pipe", "inherit"] });
  const html = fs.readFileSync(getFile, "utf8");
  const form = new URLSearchParams();
  form.set("__EVENTTARGET", "ctl00$placeholder1$DropDownList2");
  form.set("__EVENTARGUMENT", "");
  form.set("__LASTFOCUS", "");
  form.set("__VIEWSTATE", grab(html, "__VIEWSTATE") || "");
  form.set("__VIEWSTATEGENERATOR", grab(html, "__VIEWSTATEGENERATOR") || "");
  form.set("__EVENTVALIDATION", grab(html, "__EVENTVALIDATION") || "");
  form.set("ctl00$placeholder1$DropDownList1", city);
  form.set("ctl00$placeholder1$DropDownList2", "11");
  const body = `${W}/captures/eg-body-${label}.txt`;
  fs.writeFileSync(body, form.toString());
  const out = `${W}/captures/eg-esa-monthlymwaket-${label}-2026-11.html`;
  execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA, "-b", jar,
    "-H", "Content-Type: application/x-www-form-urlencoded",
    "-H", `Referer: ${PAGE}`, "-H", "Origin: https://www.esa.gov.eg",
    "--data-binary", "@" + body, "-o", out, "-w", `POST ${label} %{http_code} %{size_download}b\n`, PAGE],
    { stdio: ["ignore", "pipe", "inherit"] });
  const t = fs.readFileSync(out, "utf8");
  console.log(`  ${label}: ${t.length}b, fajr cells ${(t.match(/فجر/g) || []).length}, city echo ${t.includes(city) ? "yes" : "no"}`);
}
