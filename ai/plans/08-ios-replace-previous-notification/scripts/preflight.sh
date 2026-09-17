#!/bin/bash
# Session 8 pre-flight. Run: bash $TMPDIR/preflight-8.sh <k>
# <k> is always 1 here: the plan has one checklist item, the study.
set -uo pipefail
REPO=/Users/muji/repos/rn.athan.uk
PLAN=$REPO/ai/plans/08-ios-replace-previous-notification
UDID=00008020-0015585C22D2002E
cd "$REPO" || { echo "PREFLIGHT FAILED: cannot cd $REPO"; exit 1; }

fail() { echo "PREFLIGHT FAILED: $1"; exit 1; }
replan() { echo "PREFLIGHT NEEDS REPLAN: $1"; exit 1; }

[ "$(pwd)" = "$REPO" ] || fail "wrong checkout"
[ "$(git branch --show-current)" = "uat-2" ] || fail "not on uat-2 (on $(git branch --show-current))"

ALLOWED='^?? ai/plans/08-ios-replace-previous-notification/|^ M ai/plans/README.md|^ M ai/plans/08-ios-replace-previous-notification/'
DIRTY=$(git status --porcelain | grep -Ev "$ALLOWED" || true)
[ -z "$DIRTY" ] || fail "unexpected working-tree changes: $DIRTY"

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 is behind origin/uat-2"

VERSION=$(node -p "require('./package.json').version")
echo "VERSION $VERSION"
python3 - "$VERSION" <<'PY' || fail "version $VERSION is lower than the planned-at version 1.27.204"
import sys
planned = (1, 27, 204)
actual = tuple(int(part) for part in sys.argv[1].split('.'))
sys.exit(0 if actual >= planned else 1)
PY

# Needs first: nothing (rows 1 to 3 are DONE; verify, since a NEEDS REPLAN row
# ahead of this one would mean this plan is being run out of order).
ROW=$(grep -m1 '^| 3 |' ai/plans/README.md)
echo "$ROW" | grep -q '| DONE |' || fail "row 3 (session 7) is not DONE: $ROW"

# The six anchors every splice relies on, counted with the template's Python
# command. Five live in the checkout; the pod anchor is counted against the
# node_modules copy, which is exactly what the worktree's pod install copies.
count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check_anchor() {
  local n
  n=$(count_anchor "$PLAN/scripts/anchors/$1" "$2")
  if [ "$n" != "1" ]; then replan "anchor $1 counts $n in $2"; fi
  echo "ANCHOR $1 OK"
}
check_anchor 1-index-import-listeners.txt app/index.tsx
check_anchor 2-index-import-useNotification.txt app/index.tsx
check_anchor 3-index-const.txt app/index.tsx
check_anchor 4-index-call-listeners.txt app/index.tsx
check_anchor 5-index-call-init.txt app/index.tsx
check_anchor 6-pod-interruptionlevel.txt \
  node_modules/expo-notifications/ios/ExpoNotifications/Notifications/NotificationRecords.swift

# Tools.
xcodebuild -version >/dev/null 2>&1 || fail "xcodebuild is unavailable"
pymobiledevice3 version >/dev/null 2>&1 || fail "pymobiledevice3 is unavailable"
xcrun devicectl list devices 2>/dev/null | grep -q "$UDID" || fail "iPhone XS $UDID is not visible to devicectl"
xcrun devicectl device info apps --device "$UDID" 2>/dev/null | grep -q 'com.mugtaba.athan.experiments' \
  && echo "NOTE a study build is already installed; the study will continue from its cursor" \
  || true
[ -d "$REPO/node_modules/expo-keep-awake" ] || fail "expo-keep-awake is not in node_modules"

echo "PREFLIGHT OK"
