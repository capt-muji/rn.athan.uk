#!/bin/zsh
# fetch a mawaqit mosque page by slug, save raw + parse
set -u
cd $HOME/athan-gitree/census/o1l-city/O1l-33
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
for slug in "$@"; do
  f="captures/mawaqit-${slug//\//_}.html"
  code=$(curl -sL -A "$UA" --max-time 45 "https://mawaqit.net/en/m/$slug" -o "$f" -w "%{http_code}")
  echo "$slug HTTP $code bytes $(wc -c < "$f" | tr -d ' ')"
  node mawaqit.mjs "$f" "data/mawaqit-${slug//\//_}.json" 2>&1 | head -2
  sleep 1
done
