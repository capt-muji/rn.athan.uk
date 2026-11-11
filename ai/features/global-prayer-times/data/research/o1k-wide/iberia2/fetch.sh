#!/bin/zsh
# usage: fetch.sh <url> <capture-name>
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
out="$HOME/athan-gitree/census/o1k-wide/iberia2/captures/$2"
code=$(curl -sSL --max-time 60 -A "$UA" -H 'Accept-Language: es,pt,it,de,fr,en;q=0.8' -o "$out" -w '%{http_code} %{content_type} %{size_download}' "$1")
echo "$code $1"
