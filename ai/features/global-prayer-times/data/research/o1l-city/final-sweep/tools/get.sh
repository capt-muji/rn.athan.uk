#!/bin/zsh
# usage: get.sh URL OUTFILE [timeout]
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
curl -sS -L --compressed --max-time ${3:-40} -A "$UA" -o "$2" -w '%{http_code} %{size_download} %{url_effective}\n' "$1" 2>&1 | tail -1
