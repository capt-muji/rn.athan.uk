#!/bin/zsh
# Oman MARA calendar_page2.asp: six second cities x 12 months x {2026, 2031}.
# CityID list read from the page's own <select>: 0 Muscat, 1 Ibra, 2 Adam, 3 Izki,
# 5 Buraimi, 51 Sohar, 55 Salalah, 56 Sur, 60 Ibri, 78 Nizwa, 85 Yanqul.
set -u
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
W="$HOME/athan-gitree/census/o1l-city/mideast-cities"
CAP="$W/captures"
cities=("salalah:55" "sohar:51" "nizwa:78" "sur:56" "ibri:60" "buraimi:5")
for c in $cities; do
  name=${c%%:*}; id=${c#*:}
  for year in 2026 2031; do
    for month in 1 2 3 4 5 6 7 8 9 10 11 12; do
      mm=$(printf "%02d" $month)
      out="$CAP/om-$name-$year-$mm.html"
      code=$(curl -sS -A "$UA" --max-time 60 -o "$out" -w "%{http_code}" \
        "https://www.mara.gov.om/calendar_page2.asp?year=$year&month=$month&CityID=$id")
      rows=$(grep -o "<td  align='center'><font color='#000000'>[0-9]*/[0-9]*/[0-9]*" "$out" | wc -l | tr -d ' ')
      echo "om $name $year-$mm http=$code rows=$rows"
    done
  done
done
