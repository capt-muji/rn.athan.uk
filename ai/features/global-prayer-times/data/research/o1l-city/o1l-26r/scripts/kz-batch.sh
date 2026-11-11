#!/bin/zsh
cd "$HOME/athan-gitree/census/o1l-city/o1l-26r"
while read -r name lat lng; do
  for y in 2025 2026 2027; do
    ./scripts/kz-pull.sh "$lat" "$lng" 5 "$name-$y" "$y-01-01" "$y-12-31" "data/kz-$name-$y.json"
  done
done <<'LIST'
atyrau 47.116667 51.883333
kostanay 53.219333 63.634194
pavlodar 52.315556 76.956389
ustkamenogorsk 49.948325 82.627848
taraz 42.883333 71.366667
turkistan 43.302025 68.268979
karazhal 48.001042 70.785762
ayagoz 47.966667 80.433333
LIST
