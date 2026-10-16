#!/usr/bin/env bash
# Anchor check for plan 111. Every anchor must count exactly 1 at the uat tree.
# Step 1 runs this once, before its first edit: the anchors assert the starting state it moves away
# from. The pre-flight does not call it (the first attempt's audit finding 1).
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
check a2-package-widgets.txt package.json
check a3-package-ui.txt package.json
check a4-appjson-notifs-plugin.txt app.json
check a5-strokeborder.txt widgets/PrayerWidget.tsx
check a6-bgtask-options.txt stores/notifications.ts
check a7-widgets-patch-openapp.txt patches/expo-widgets+58.0.19.patch
if [ "$fail" = "0" ]; then echo "ANCHORS OK"; else exit 1; fi
