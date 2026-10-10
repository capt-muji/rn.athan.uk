#!/usr/bin/env bash
# Session 38 pre-flight. Run: bash <this script> <first step number not ticked DONE>
# Ends PREFLIGHT OK, or names the failed check and exits 1.
set -euo pipefail
FATAL() { echo "PREFLIGHT FAILED: $1"; exit 1; }
# Works from the plan folder and from $TMPDIR (the executor copies it there)
REPO="$HOME/repos/rn.athan.uk"
if [ -d "$(dirname "$0")/../../../.." ] && [ -d "$(dirname "$0")/../../../..//shared" ]; then
  REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"
fi
cd "$REPO" || FATAL "cannot enter $REPO"

K=${1:-1}

[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || FATAL "not on uat"
[ -z "$(git status --porcelain)" ] || FATAL "tree not clean"
git fetch -q origin uat
git merge-base --is-ancestor origin/uat uat || FATAL "origin/uat not merged in"

VERSION=$(node -p "require('./package.json').version")
node -e "const [a,b,c]='$VERSION'.split('.').map(Number);const [x,y,z]='1.29.305'.split('.').map(Number);process.exit(a>x||(a===x&&b>y)||(a===x&&b===y&&c>=z)?0:1)" \
  || FATAL "version $VERSION below planned-at 1.29.305"

grep -q '^| 37 |.*DONE' ai/plans/README.md || FATAL "row 37 not DONE"
git merge-base --is-ancestor c3149dfc HEAD || FATAL "planned-at sha not an ancestor"
[ -s ai/plans/39-localisation/scripts/string-census.json ] || FATAL "census missing"

# name:step:source - every anchor owned by a step not yet DONE counts exactly 1.
# Anchors owned by DONE steps are consumed by design and skipped.
MAP="
row-conditional:2:components/prayer/Prayer.tsx
row-styles:2:components/prayer/Prayer.tsx
settings-toggle:3:components/sheets/screens/Settings.tsx
explanation-arabic:3:components/prayer/Explanation.tsx
toarabic:3:shared/text.ts
overlaycontent-arabic:3:components/overlay/overlayContent.ts
shownames-atom:3:stores/ui.ts
prayerrow-type:4:shared/types.ts
createprayer:4:shared/prayer.ts
namesforDate:4:shared/prayer.ts
unreadable-row:4:shared/prayer.ts
scheduled-record-type:4:shared/notifications.ts
survived-record:4:stores/notifications.ts
multi-schedule-sig:4:stores/notifications.ts
alert-sheet-write:4:components/prayer/Alert.tsx
reschedule-head:4:stores/notifications.ts
constants-arrays:5:shared/constants.ts
night-branch:6:shared/prayer.ts
atom-factory:6:stores/notifications.ts
reminder-atoms:6:stores/notifications.ts
migration-core:6:stores/notifications.ts
reschedule-generations:6:stores/notifications.ts
useprayer-sentinel:6:hooks/usePrayer.ts
countdown-seed:6:stores/countdown.ts
countdown-name:6:stores/countdown.ts
ago-text:10:hooks/usePrayerAgo.ts
rowpress-istijaba:6:components/prayer/rowPress.ts
sequence-listposition:6:shared/sequence.ts
plan-key:6:shared/notifications.ts
device-ids:6:device/notifications.ts
slug:6:shared/notifications.ts
content-builders:7:shared/notifications.ts
reminder-content:7:shared/notifications.ts
channel-reminder:10:shared/notifications.ts
channel-configs:10:shared/notifications.ts
extras-channel:10:shared/notifications.ts
width-atoms:11:stores/ui.ts
setwidth:11:stores/ui.ts
version-keeplist:12:stores/version.ts
version-captured:12:stores/version.ts
version-upgrade:12:stores/version.ts
sync-keeplist:11:stores/sync.ts
widget-versions:13:shared/widgetTypes.ts
widget-row-name:13:shared/widgetTypes.ts
widget-next-name:13:shared/widgetTypes.ts
widget-android-row:13:shared/widgetTypes.ts
widget-guard:13:widgets/PrayerWidget.tsx
widget-eyebrow:13:widgets/PrayerWidget.tsx
widget-rowkey:13:widgets/PrayerWidget.tsx
widget-units:13:widgets/PrayerWidget.tsx
widget-dateparse:13:widgets/PrayerWidget.tsx
timeline-names:13:shared/widgetTimeline.ts
timeline-next:13:shared/widgetTimeline.ts
"

ANCHORS=ai/plans/39-localisation/scripts/anchors
[ -d "$ANCHORS" ] || FATAL "no anchors folder"
FAIL=0
while IFS=: read -r NAME STEP SRC; do
  [ -n "$NAME" ] || continue
  if [ "$STEP" -lt "$K" ]; then continue; fi
  [ -f "$SRC" ] || { echo "SOURCE GONE: $NAME ($SRC)"; FAIL=1; continue; }
  COUNT=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$ANCHORS/$NAME.txt" "$SRC")
  [ "$COUNT" = "1" ] || { echo "ANCHOR COUNT $COUNT: $NAME in $SRC (step $STEP)"; FAIL=1; }
done <<< "$MAP"
[ "$FAIL" = "0" ] || FATAL "anchor check failed"

echo "PREFLIGHT OK (from step $K)"
