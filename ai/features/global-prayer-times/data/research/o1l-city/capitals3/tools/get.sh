#!/bin/zsh
# get.sh <url> <outfile>
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
curl -sS -L --max-time 45 -A "$UA" -H "Accept-Language: en-GB,en;q=0.9" -w '\n--HTTP:%{http_code} %{size_download} %{url_effective}\n' "$1" -o "$2" 2>&1 | tail -2
