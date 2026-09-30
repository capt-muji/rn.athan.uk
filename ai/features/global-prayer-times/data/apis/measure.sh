#!/bin/bash
# R4: measure one endpoint's status, size, latency and headers. Polite: caller spaces calls.
# usage: ./measure.sh <name> <url> [extra curl args...]
set -u
name="$1"; url="$2"; shift 2
out="raw/$name"
curl -sS --max-time 25 -o "$out.body" -D "$out.headers" \
  -w '{"name":"%{url_effective}","http_code":%{http_code},"size_download":%{size_download},"time_namelookup":%{time_namelookup},"time_connect":%{time_connect},"time_appconnect":%{time_appconnect},"time_starttransfer":%{time_starttransfer},"time_total":%{time_total},"content_type":"%{content_type}","http_version":"%{http_version}","ssl_verify":%{ssl_verify_result},"num_redirects":%{num_redirects}}' \
  -A 'athan-research/1.0 (prayer-times research; one-off measurement)' \
  "$@" "$url" > "$out.meta.json" 2>"$out.err"
echo -n "$name  "; cat "$out.meta.json"; echo
