#!/usr/bin/env bash
set -u
STEP="${1:-1}"
REPO=/Users/muji/repos/rn.athan.uk
cd "$REPO" || { echo "FAIL: not $REPO"; exit 1; }

BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || { echo "FAIL: on $BRANCH, expected uat-2"; exit 1; }

DIRTY=$(git status --porcelain | grep -v -e 'ai/plans/README.md' \
  -e 'ai/plans/19-widget-polish-and-horizon/PLAN.md' \
  -e 'ai/plans/19-widget-polish-and-horizon/LOG.md')
[ -z "$DIRTY" ] || { echo "FAIL: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "FAIL: uat-2 is behind origin/uat-2"; exit 1; }

VERSION=$(node -p "require('./package.json').version")
echo "version: $VERSION (planned at 1.27.357, must not be lower)"

A=ai/plans/19-widget-polish-and-horizon/scripts/anchors
count() {
  local n
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$1.txt" "$2")
  echo "anchor $1: $n"
  [ "$n" = "1" ] || { echo "FAIL: anchor $1 counted $n, expected 1 -> NEEDS REPLAN"; exit 1; }
}
[ "$STEP" -le 1 ] && { count 1-1 widgets/PrayerWidget.tsx; count 1-2 widgets/PrayerWidget.tsx; count 1-3 widgets/PrayerWidget.tsx; }
[ "$STEP" -le 2 ] && count 2-1 scripts/generate-widget-assets.py
[ "$STEP" -le 3 ] && count 3-1 shared/widgetTimeline.ts

python3 -c 'import PIL' 2>/dev/null || { echo "FAIL: Pillow missing; step 2 regenerates the PNGs"; exit 1; }
echo "pillow: present"

STATE=$(adb -s 8f7ada76 get-state 2>&1 | tr -d '\r')
echo "device 8f7ada76: $STATE"
[ "$STATE" = "device" ] || { echo "FAIL: the 3T is not attached (section 2.2 item 7)"; exit 1; }

if xcrun devicectl list devices 2>/dev/null | grep -q '00008020-0015585C22D2002E.*connected'; then
  echo "device XS: connected"
else
  echo "FAIL: the iPhone XS is not connected (section 2.2 item 7)"; exit 1
fi

echo "PREFLIGHT OK"
