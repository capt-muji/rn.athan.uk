#!/usr/bin/env zsh
# Resolve masjid_id -> name/address/country via the keyless range API (masjid_detail=yes).
cd "$HOME/athan-gitree/census/o1l-city/masjidal-global"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
OUT=probe/resolved.ndjson
[ -s "$OUT" ] || : > "$OUT"
done_ids=()
while read -r l; do
  [ -n "$l" ] && done_ids+=("$(echo "$l" | cut -f1)")
done < <(cut -f1 "$OUT" 2>/dev/null)
for id in "$@"; do
  (( ${done_ids[(I)$id]} )) && continue
  f="probe/r_${id}.json"
  code=$(curl -sS -m 40 -A "$UA" "https://masjidal.com/api/v1/time/range?masjid_id=${id}&masjid_detail=yes&from_date=2025-06-01&to_date=2025-06-01" -o "$f" -w "%{http_code}")
  python3 - "$id" "$code" "$f" <<'PY' >> "$OUT"
import json,sys,re
mid,code,f=sys.argv[1],sys.argv[2],sys.argv[3]
try:
    d=json.load(open(f))
except Exception:
    print("\t".join([mid,code,"PARSE_FAIL","","",""])); raise SystemExit
info=(d.get("data") or {}).get("masjid_info") if isinstance(d.get("data"),dict) else None
salah=(d.get("data") or {}).get("salah") if isinstance(d.get("data"),dict) else None
iq=(d.get("data") or {}).get("iqamah") if isinstance(d.get("data"),dict) else None
if not info:
    msg=(d.get("message") or "")
    if isinstance(msg,list): msg="; ".join(map(str,msg))
    print("\t".join([mid,code,"NO_MASJID",str(msg)[:80],"",""])); raise SystemExit
addr=(info.get("location") or "").replace("\t"," ")
cc=""
m=re.search(r",\s*([A-Z]{2})\s*$", addr)
if m: cc=m.group(1)
n_iq=len(iq or [])
print("\t".join([mid,code,"OK",(info.get("name") or "").replace("\t"," ")[:70],addr[:120],cc,str(len(salah or [])),str(n_iq)]))
PY
  echo "$id $code" >&2
  sleep 0.35
done
