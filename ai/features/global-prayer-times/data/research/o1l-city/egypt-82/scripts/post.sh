#!/bin/zsh
# One ESA postback: city option value + month number -> raw HTML on stdout path.
# usage: post.sh <outfile> <cityValue> <month>
set -euo pipefail
W="$HOME/athan-gitree/census/o1l-city/egypt-82"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
OUT="$1"; CITY="$2"; MONTH="$3"
BODY="$W/captures/.body.tmp"
node -e '
const fs=require("fs");
const st=JSON.parse(fs.readFileSync(process.env.W+"/captures/eg-formstate.json","utf8"));
const f=new URLSearchParams();
f.set("__EVENTTARGET","ctl00$placeholder1$DropDownList2");
f.set("__EVENTARGUMENT","");
f.set("__LASTFOCUS","");
f.set("__VIEWSTATE",st.viewstate);
f.set("__VIEWSTATEGENERATOR",st.vsg);
f.set("__EVENTVALIDATION",st.ev);
f.set("ctl00$placeholder1$DropDownList1",process.env.CITY);
f.set("ctl00$placeholder1$DropDownList2",process.env.MONTH);
fs.writeFileSync(process.env.BODY,f.toString());
' 
curl -sS --http2 --compressed -A "$UA" \
  -b "$W/captures/eg-cookies.txt" -c "$W/captures/eg-cookies.txt" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Referer: https://www.esa.gov.eg/monthlymwaket.aspx" \
  -H "Origin: https://www.esa.gov.eg" \
  --data-binary "@$BODY" \
  -o "$OUT" -w "%{http_code} %{size_download}b\n" \
  "https://www.esa.gov.eg/monthlymwaket.aspx"
rm -f "$BODY"
