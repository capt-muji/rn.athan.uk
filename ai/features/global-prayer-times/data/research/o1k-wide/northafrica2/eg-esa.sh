#!/bin/zsh
# Egypt ESA monthlymwaket postback: Alexandria + Aswan, November 2026.
set -euo pipefail
W="$HOME/athan-gitree/census/o1k-wide/northafrica2"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
GET="$W/captures/eg-esa-monthlymwaket-GET.html"

curl -sS --http2 --compressed -A "$UA" -o "$GET" \
  -w "GET %{http_code} %{size_download}b %{time_total}s\n" \
  "https://www.esa.gov.eg/monthlymwaket.aspx"

node - <<'EOF'
const fs = require("fs");
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/northafrica2";
const html = fs.readFileSync(W + "/captures/eg-esa-monthlymwaket-GET.html", "utf8");
const field = (name) => {
  const m = html.match(new RegExp('name="' + name + '"[^>]*>\\s*<option[^>]*value="([^"]*)"'));
  const re = new RegExp('<textarea[^>]*name="' + name + '"[^>]*>([\\s\\S]*?)</textarea>');
  const t = html.match(re);
  const i = html.indexOf('name="' + name + '"');
  return null;
};
const grab = (name) => {
  // value may sit in value="..." attr (input) or textarea content
  let re = new RegExp('<input[^>]*name="' + name.replace(/\$/g, "\\$") + '"[^>]*value="([\\s\\S]*?)"');
  let m = html.match(re);
  if (m) return m[1];
  re = new RegExp('<textarea[^>]*name="' + name.replace(/\$/g, "\\$") + '"[^>]*>([\\s\\S]*?)</textarea>');
  m = html.match(re);
  if (m) return m[1];
  return null;
};
const vs = grab("__VIEWSTATE");
const vsg = grab("__VIEWSTATEGENERATOR");
const ev = grab("__EVENTVALIDATION");
const opts = [...html.matchAll(/<option value="([^"]*)">/g)].map(m => m[1]);
const alex = opts.find(o => o.includes("سكندرية"));
const aswan = opts.filter(o => o.replace(/ـ/g, "").includes("سوان"));
fs.writeFileSync(W + "/captures/eg-esa-formstate.json", JSON.stringify({
  viewstate_len: vs ? vs.length : 0,
  viewstategenerator: vsg,
  eventvalidation_len: ev ? ev.length : 0,
  n_city_options: opts.length,
  alexandria_value: alex, aswan_values: aswan,
}, null, 1));
fs.writeFileSync(W + "/captures/eg-esa-viewstate.txt", vs || "");
fs.writeFileSync(W + "/captures/eg-esa-eventvalidation.txt", ev || "");
console.log("options:", opts.length, "alex:", alex, "aswan:", aswan);
EOF
