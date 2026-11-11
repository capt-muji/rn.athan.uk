#!/bin/zsh
# Discovery sweep: for each state mufti host, ask the CMS's own search for "waktu solat 2027"
# and list every link that looks like a 2027 prayer artifact.
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
cd "$(dirname "$0")/captures" || exit 1

probe() {
  local tag=$1 url=$2
  curl -sSL --max-time 35 -A "$UA" "$url" -o "search-$tag.html" -w "$tag %{http_code} %{size_download}\n" 2>&1 | tail -1
  grep -o -i -E '(href|src)="[^"]*"' "search-$tag.html" 2>/dev/null \
    | sed 's/^[a-z]*="//; s/"$//' \
    | grep -i -E '\.(pdf|jpg|png|xlsx)|waktu|takwim|taqwim' \
    | grep -i -E '2027|waktu|takwim|taqwim|solat' | sort -u | head -12
}

probe wp-kedah   "https://mufti.kedah.gov.my/wp-json/wp/v2/search?search=waktu%20solat&per_page=20"
probe wp-johor   "https://mufti.johor.gov.my/wp-json/wp/v2/search?search=takwim&per_page=20"
probe wp-ns      "https://muftins.gov.my/wp-json/wp/v2/search?search=waktu%20solat&per_page=20"
probe wp-pahang  "https://mufti.pahang.gov.my/wp-json/wp/v2/search?search=waktu%20solat&per_page=20"
probe wp-penang  "https://mufti.penang.gov.my/wp-json/wp/v2/search?search=takwim&per_page=20"
probe wp-perak   "https://mufti.perak.gov.my/wp-json/wp/v2/search?search=waktu%20solat&per_page=20"
probe wp-selangor "https://www.muftiselangor.gov.my/wp-json/wp/v2/search?search=takwim&per_page=20"
probe wp-wp      "https://www.muftiwp.gov.my/wp-json/wp/v2/search?search=takwim&per_page=20"
probe wp-melaka  "https://muftimelaka.gov.my/wp-json/wp/v2/search?search=takwim&per_page=20"
probe wp-sabah   "https://mufti.sabah.gov.my/wp-json/wp/v2/search?search=waktu%20solat&per_page=20"
probe wp-sarawak "https://muftisarawak.gov.my/wp-json/wp/v2/search?search=waktu%20solat&per_page=20"
probe wp-tganu   "https://mufti.terengganu.gov.my/wp-json/wp/v2/search?search=waktu%20solat&per_page=20"
probe wp-perlis  "https://muftiperlis.gov.my/wp-json/wp/v2/search?search=waktu%20solat&per_page=20"
