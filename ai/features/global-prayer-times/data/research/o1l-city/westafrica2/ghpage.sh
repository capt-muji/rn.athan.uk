#!/bin/zsh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
for p in {1..15}; do
  curl -s -m 20 -A "$UA" "https://ghanamasjid.org/api/method/masjid.masjid.api.masjid.get_masjids?page=$p&limit=20" -o captures/gh-all-p$p.json
  n=$(python3 -c "import json;print(len(json.load(open('captures/gh-all-p$p.json'))['message']))" 2>/dev/null || echo ERR)
  echo "page $p -> $n"
  [ "$n" = "0" ] && break
done
echo DONE
