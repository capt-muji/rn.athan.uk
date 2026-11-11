#!/usr/bin/env zsh
# Brave HTML search per metro, two phrasings; extract candidate mosque domains.
cd "$HOME/athan-gitree/census/o1l-city/us-unresolved"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
mkdir -p captures/search
out="scripts/candidates.tsv"
[ -f "$out" ] || printf "metro\tstate\tquery\tdomain\n" > "$out"
while IFS='|' read -r city state; do
  for ph in "masjid prayer times" "islamic center salah schedule"; do
    q="$city $state $ph"
    slug=$(print -r -- "$city-$state-$ph" | tr ' /' '__' | tr -cd 'A-Za-z0-9_-')
    f="captures/search/${slug}.html"
    [ -s "$f" ] || curl -sSL -m 30 -A "$UA" "https://search.brave.com/search?q=${(j:+:)${(s: :)q}}" -o "$f"
    grep -oE 'href="https?://[^"]+' "$f" 2>/dev/null | sed 's/^href="//' \
      | sed -E 's#^https?://(www\.)?##; s#/.*##' | sort -u \
      | grep -viE '^(islamicfinder|quranmajeed|muslimandquran|namazvakitleri|aladhan|timesprayer|prayertimes|salah|hikmah|facebook|youtube|yelp|mapquest|yellowpages|tripadvisor|wikipedia|instagram|x|twitter|linkedin|masjidway|google|brave|bing|duckduckgo|pinterest|tiktok|reddit|zillow|indeed|glassdoor|amazon|apple|play|apps\.apple|salatomatic|muslimpro|islamicity|halaltrip|zabihah|faithiq|yaqeen|seekersguidance|soundvision|ca\.irfan|irfanview|microsoft|cloudflare|gstatic|schema|w3|wordpress|shopify|godaddy|squarespace|wixsite|weebly|blogspot)\.' \
      | grep -vE '\.(gov|edu|org\.uk|co\.uk)$' >> /tmp/cand.$$
  done
  awk -v c="$city" -v s="$state" '!seen[$0]++{printf "%s\t%s\t%s\t%s\n", c, s, "brave", $0}' /tmp/cand.$$ >> "$out"
  rm -f /tmp/cand.$$
  echo "$city $state -> $(awk -F'\t' -v c="$city" '$1==c' "$out" | wc -l | tr -d ' ')"
  sleep 1
done < scripts/metros.txt
