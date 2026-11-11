#!/bin/zsh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
for p in bj/parakou bj/natitingou bj/cotonou ci/bouake ci/yamoussoukro bf/koudougou bf/banfora bf/ouagadougou gh/kumasi gh/tamale gh/takoradi gh/accra sl/freetown gm/banjul tg/atakpame tg/lome; do
  f="captures/matw-$(echo $p | tr '/' '-').html"
  code=$(curl -sL -m 30 -A "$UA" "https://matwprojectca.org/donate/namaz-timetable/$p" -o "$f" -w "%{http_code}")
  n=$(grep -c -E '[0-9]{2} [A-Z][a-z]{2} 2026' "$f" 2>/dev/null | head -1)
  echo "$p $code dates=$n"
done
