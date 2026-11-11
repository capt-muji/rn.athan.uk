#!/bin/zsh
# Mawaqeet per-place annual PDF (12 monthly pages, one PDF) + the place page.
W="$HOME/athan-gitree/census/o1k-wide/nordics2"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
for slug in "$@"; do
  page="$W/captures/no-mawaqeet-$slug-page.html"
  curl -sSL -A "$UA" --max-time 30 "https://www.mawaqeet.no/bonnetider/$slug/" -o "$page" -w "page $slug %{http_code} %{size_download}\n"
  url=$(grep -o -E '"source":"[^"]+\.pdf"' "$page" | head -1 | sed 's/^"source":"//; s/"$//; s#\\/#/#g')
  echo "pdf-url $slug $url"
  [ -z "$url" ] && continue
  curl -sSL -A "$UA" --max-time 60 "$url" -o "$W/captures/no-mawaqeet-$slug-year.pdf" -w "pdf $slug %{http_code} %{size_download}\n"
  sleep 0.5
done
