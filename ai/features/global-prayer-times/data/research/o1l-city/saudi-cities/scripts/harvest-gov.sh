#!/bin/zsh
# Saudi governorate harvest: umqserv keyless GET, one per city-Hijri-year.
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
W="$HOME/athan-gitree/census/o1l-city/saudi-cities"
CAP="$W/captures"
cities=(
  "yanbu:24.0895:38.0618"
  "jubail:27.0046:49.6460"
  "khamis-mushait:18.3000:42.7333"
  "najran:17.4917:44.1322"
  "jizan:16.8892:42.5511"
  "arar:30.9753:41.0381"
  "sakaka:29.9697:40.2064"
  "al-baha:20.0129:41.4677"
  "al-khobar:26.2794:50.2083"
  "hofuf:25.3647:49.5872"
  "hafar-al-batin:28.4328:45.9708"
  "al-qatif:26.5196:50.0115"
  "unaizah:26.0840:43.9936"
  "al-kharj:24.1483:47.3050"
  "dawadmi:24.5000:44.3833"
  "wadi-ad-dawasir:20.4667:44.8000"
  "bishah:19.9844:42.6000"
  "al-lith:20.1500:40.2833"
  "al-ula:26.6085:37.9236"
  "rafha:29.6267:43.5014"
  "turaif:31.6725:38.6636"
  "sharurah:17.4833:47.1167"
)
for c in $cities; do
  name=${c%%:*}; rest=${c#*:}; lat=${rest%%:*}; lon=${rest#*:}
  for yh in 1448 1449; do
    out="$CAP/sa-$name-$yh.json"
    if [[ -s "$out" ]] && [[ $(jq 'length' "$out" 2>/dev/null) -gt 300 ]]; then
      echo "skip $name $yh (held $(jq 'length' "$out") rows)"; continue
    fi
    code=$(curl -sS -A "$UA" --max-time 120 -o "$out" -w "%{http_code}" \
      "https://umqserv.kacst.gov.sa/api/v1/Prayer/GetPrayerHijriYear?lang=en&format=24&yh=$yh&lat=$lat&lon=$lon&zone=3")
    n=$(jq 'length' "$out" 2>/dev/null)
    first=$(jq -r '.[0].date' "$out" 2>/dev/null)
    last=$(jq -r '.[-1].date' "$out" 2>/dev/null)
    echo "sa $name $yh http=$code rows=$n $first .. $last"
    sleep 1
  done
done
