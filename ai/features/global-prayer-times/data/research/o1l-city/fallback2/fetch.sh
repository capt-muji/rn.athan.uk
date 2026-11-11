#!/bin/zsh
# fetch.sh <outfile> <url> [attempts]
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
out=$1; url=$2; tries=${3:-3}
for i in $(seq 1 $tries); do
  code=$(curl -sS -A "$UA" -H 'Accept-Language: en,fr;q=0.8' --compressed -o "$out" -w '%{http_code} %{size_download}' -m 45 "$url" 2>/dev/null)
  print -r -- "attempt $i $url -> $code"
  [[ $code == 200* ]] && exit 0
  sleep 3
done
exit 1
