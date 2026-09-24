#!/usr/bin/env bash
set -u
STEP="${1:-1}"
REPO=/Users/muji/repos/rn.athan.uk
cd "$REPO" || { echo "FAIL: not $REPO"; exit 1; }

BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || { echo "FAIL: on $BRANCH, expected uat-2"; exit 1; }

DIRTY=$(git status --porcelain | grep -v -e 'ai/plans/README.md' \
  -e 'ai/plans/15d-android-widget-proportional-sizing/PLAN.md' \
  -e 'ai/plans/15d-android-widget-proportional-sizing/LOG.md')
[ -z "$DIRTY" ] || { echo "FAIL: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "FAIL: uat-2 is behind origin/uat-2"; exit 1; }

VERSION=$(node -p "require('./package.json').version")
echo "version: $VERSION (planned at 1.27.338, must not be lower)"

A=ai/plans/15d-android-widget-proportional-sizing/scripts/anchors
K=modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshScheduler.kt
count() {
  local n
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$1.txt" "$2")
  echo "anchor $1: $n"
  [ "$n" = "1" ] || { echo "FAIL: anchor $1 counted $n, expected 1 -> NEEDS REPLAN"; exit 1; }
}
[ "$STEP" -le 1 ] && { count 1-1 widgets/PrayerWidget.tsx; count 1-2 widgets/PrayerWidget.tsx; count 1-3 widgets/PrayerWidget.tsx; }
[ "$STEP" -le 2 ] && count 2-1 shared/widgetTypes.ts
[ "$STEP" -le 3 ] && { count 3-1 "$K"; count 3-2 "$K"; }

for SERIAL in 8f7ada76 G6RWBAQ4VKWWEAIZ; do
  STATE=$(adb -s "$SERIAL" get-state 2>&1 | tr -d '\r')
  echo "device $SERIAL: $STATE"
  [ "$STATE" = "device" ] || { echo "FAIL: $SERIAL not attached (section 2.2 item 7)"; exit 1; }
done

echo "PREFLIGHT OK"
