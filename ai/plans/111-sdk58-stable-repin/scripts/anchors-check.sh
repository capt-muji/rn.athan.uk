#!/usr/bin/env bash
# Anchor check for plan 111. Every anchor must count exactly 1 at the uat tree.
set -u
ROOT="$(git rev-parse --show-toplevel)"
DIR="$(cd "$(dirname "$0")/anchors" && pwd)"
fail=0
check() {
  local name="$1" src="$2"
  local n
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$DIR/$name" "$ROOT/$src")
  if [ "$n" = "1" ]; then
    echo "OK $name"
  else
    echo "DRIFT $name count=$n in $src"
    fail=1
  fi
}
check a1-package-expo.txt package.json
check a1b-package-location.txt package.json
check a1c-package-widgets.txt package.json
check a1d-package-rn.txt package.json
check a2-bgtask-constant.txt patches/expo-background-task+58.0.10.patch
check a3-location-headingfilter.txt patches/expo-location+58.0.12.patch
check a4-widgets-openapp.txt patches/expo-widgets+58.0.14.patch
check a5-appjson-notifs-plugin.txt app.json
check a7-strokeborder.txt widgets/PrayerWidget.tsx
check a10-upstream-table.txt ai/UPSTREAM-PRS.md
if [ "$fail" = "0" ]; then echo "ANCHORS OK"; else exit 1; fi
