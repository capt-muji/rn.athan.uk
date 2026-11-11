const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/northafrica2";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const st = JSON.parse(fs.readFileSync(W + "/captures/eg-esa-formstate.json", "utf8"));
const vs = fs.readFileSync(W + "/captures/eg-esa-viewstate.txt", "utf8").trim();
const ev = fs.readFileSync(W + "/captures/eg-esa-eventvalidation.txt", "utf8").trim();
const cookieJar = W + "/captures/eg-cookies.txt";

function post(city, label) {
  const form = new URLSearchParams();
  form.set("__EVENTTARGET", "ctl00$placeholder1$DropDownList2");
  form.set("__EVENTARGUMENT", "");
  form.set("__LASTFOCUS", "");
  form.set("__VIEWSTATE", vs);
  form.set("__VIEWSTATEGENERATOR", st.viewstategenerator);
  form.set("__EVENTVALIDATION", ev);
  form.set("ctl00$placeholder1$DropDownList1", city);
  form.set("ctl00$placeholder1$DropDownList2", "11");
  const bodyFile = W + `/captures/eg-body-${label}.txt`;
  fs.writeFileSync(bodyFile, form.toString());
  const out = W + `/captures/eg-esa-monthlymwaket-${label}-2026-11.html`;
  execFileSync("curl", ["-sS", "--http2", "--compressed", "-A", UA,
    "-b", cookieJar,
    "-H", "Content-Type: application/x-www-form-urlencoded",
    "-H", "Referer: https://www.esa.gov.eg/monthlymwaket.aspx",
    "-H", "Origin: https://www.esa.gov.eg",
    "--data-binary", "@" + bodyFile,
    "-o", out, "-w", "%{http_code} %{size_download}b\n",
    "https://www.esa.gov.eg/monthlymwaket.aspx"], { stdio: ["ignore", "pipe", "inherit"] });
  const html = fs.readFileSync(out, "utf8");
  const rows = (html.match(/فجر/g) || []).length;
  console.log(label, "bytes", html.length, "fajr cells", rows);
  return html;
}
post("الأسكندرية", "alexandria");
post("أســوان", "aswan");
