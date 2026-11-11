#!/bin/sh
# Fit every harvested masjidbox India table: recover coordinates, then score the recipe.
set -u
cd "$HOME/athan-gitree/census/o1l-city/india-cities"

fit() {
  tag=$1; lat0=$2; lat1=$3; lon0=$4; lon1=$5; year=${6:-2026}
  src="captures/mbx-$tag-$year.json"
  [ -f "$src" ] || { echo "===== $tag $year MISSING"; return; }
  python3 -c "import json;d=json.load(open('$src'));json.dump(d['days'],open('/tmp/d-$tag-$year.json','w'))"
  cat > "/tmp/c-$tag-$year.json" <<EOF
{"rows":"/tmp/d-$tag-$year.json","year":$year,"latRange":[$lat0,$lat1],"lonRange":[$lon0,$lon1],"recipe":{"fajr":18,"isha":17,"school":0,"adj":{}}}
EOF
  echo "===== $tag $year"
  node fit-solve.cjs "/tmp/c-$tag-$year.json" 2>&1 | sed -n '1p;2p;3p;5p;6p'
}

fit mumbai-deeniyat 18.85 19.10 72.75 72.95
fit mumbai-sunni-pathan 18.85 19.10 72.75 72.95
fit chennai-madeena 12.90 13.20 80.10 80.35
fit bengaluru-rahmania 12.90 13.25 77.45 77.75
fit srinagar-jamiat-ahlihadees 34.00 34.20 74.75 74.90
fit srinagar-soqte 34.00 34.20 74.75 74.90
fit gujarat-varedia 22.70 23.10 72.90 73.30
echo FIT_BATCH_DONE
