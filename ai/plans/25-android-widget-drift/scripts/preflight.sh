#!/usr/bin/env bash
# Session 25 pre-flight. Run: bash $TMPDIR/preflight-25.sh <k>
set -u
REPO=/Users/muji/repos/rn.athan.uk
STEP="${1:-}"
[ -z "$STEP" ] && { echo "FAIL: give the step number"; exit 1; }
cd "$REPO" || { echo "FAIL: cannot cd to $REPO"; exit 1; }

[ "$(pwd -P)" = "$REPO" ] || { echo "FAIL: wrong checkout"; exit 1; }
BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || { echo "FAIL: on $BRANCH, expected uat-2"; exit 1; }

DIRTY=$(git status --porcelain | grep -v -E 'ai/plans/README\.md|ai/plans/25-android-widget-drift/' || true)
[ -z "$DIRTY" ] || { echo "FAIL: tree holds more than this plan folder:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2 || { echo "FAIL: fetch"; exit 1; }
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "FAIL: uat-2 not a descendant of origin/uat-2"; exit 1; }
echo "package.json version: $(node -p "require('./package.json').version")"

S=$(adb -s 8f7ada76 get-state 2>/dev/null | tr -d '\r')
[ "$S" = "device" ] && echo "3T: device" || { echo "FAIL: 3T not connected (get-state='$S')"; exit 1; }

WM=$(grep -oE "androidx.work:work-runtime-ktx:[0-9.]+" node_modules/expo-background-task/android/build.gradle 2>/dev/null | head -1)
[ "$WM" = "androidx.work:work-runtime-ktx:2.9.1" ] && echo "workmanager: $WM" || { echo "FAIL: expected work-runtime-ktx:2.9.1, found '$WM'"; exit 1; }

count_anchor() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"; }
A=ai/plans/25-android-widget-drift/scripts/anchors
K=modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh
FAILED=0
check() {
  local n; n=$(count_anchor "$A/$1" "$2")
  echo "anchor $1: $n"
  [ "$n" = "1" ] || { echo "FAIL: anchor $1 counted $n, expected 1 (NEEDS REPLAN)"; FAILED=1; }
}

if [ "$STEP" -le 1 ]; then
  check 1-ensure-armed.txt "$K/WidgetRefreshScheduler.kt"
fi
if [ "$STEP" -le 2 ]; then
  check 2-gradle-deps.txt  modules/widgetrefresh/android/build.gradle
  check 2-module-fn.txt    "$K/WidgetRefreshModule.kt"
  check 2-boot-arm.txt     "$K/WidgetRefreshBootReceiver.kt"
  check 2-kinds-tail.txt   "$K/WidgetRefreshScheduler.kt"
fi
if [ "$STEP" -le 3 ]; then
  check 3-index-doc.txt    modules/widgetrefresh/index.ts
fi

[ "$FAILED" = "0" ] || exit 1

if [ "$STEP" -le 2 ] && [ -e "$K/WidgetRefreshWatchdogWorker.kt" ]; then
  echo "FAIL: WidgetRefreshWatchdogWorker.kt already exists"; exit 1
fi
if [ "$STEP" -le 3 ] && [ -e "$K/WidgetRefreshTickListener.kt" ]; then
  echo "FAIL: WidgetRefreshTickListener.kt already exists"; exit 1
fi

[ -x node_modules/.bin/jest ] && echo "jest: present" || { echo "FAIL: jest missing"; exit 1; }
echo "PREFLIGHT OK"
