#!/usr/bin/env bash
# Pre-flight for ticket 123. Save a copy to $TMPDIR and run it from the worktree root.
set -u
fail=0
reason() { echo "PREFLIGHT FAIL: $1"; fail=1; }

# Worktree and branch
[ "$(git branch --show-current)" = "lane/123" ] || reason "not on lane/123 ($(git branch --show-current))"
[ -z "$(git status --porcelain)" ] || reason "tree not clean"

# uat fetched and the branch anchored at or past the planned sha
git fetch -q origin uat
base=$(git merge-base lane/123 uat)
git merge-base --is-ancestor 8a44f0ab "$base" 2>/dev/null || reason "merge base $base is before planned sha 8a44f0ab"

# Version not lower than planned
ver=$(node -e "console.log(require('./package.json').version)")
node -e "const p=a=>a.split('.').map(Number);const [x,y]=['$ver','2.0.885'].map(p);process.exit(x[0]>y[0]||(x[0]===y[0]&&x[1]>y[1])||(x[0]===y[0]&&x[1]===y[1]&&x[2]>=y[2])?0:1)" || \
  reason "version $ver is lower than planned 2.0.885"

# Anchors: each counts exactly 1 in its source
F=ai/plans/123-android-widget-refresh/scripts/anchors
SCHED=modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshScheduler.kt
for pair in \
  "js-refresh-entry.txt:stores/widget.ts" \
  "js-flip-chain.txt:stores/widget.ts" \
  "js-android-push.txt:stores/widget.ts" \
  "kt-update-all.txt:$SCHED" \
  "kt-arm-next.txt:$SCHED" \
  "kt-watchdog.txt:modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshWatchdogWorker.kt" \
  "kt-listener.txt:modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshSystemListener.kt" \
  "kt-module.txt:modules/widgetrefresh/android/src/main/java/expo/modules/widgetrefresh/WidgetRefreshModule.kt" \
  "appjson-r8.txt:app.json" \
  "module-doc.txt:modules/widgetrefresh/index.ts"; do
  a="${pair%%:*}"; src="${pair##*:}"
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$F/$a" "$src")
  [ "$n" = "1" ] || reason "anchor $a counts $n in $src (want 1)"
done

# The row's premise: SDK 58 stable is installed. A newer pin means the plan re-verifies.
ew=$(node -e "console.log(require('expo-widgets/package.json').version)" 2>/dev/null)
ex=$(node -e "console.log(require('expo/package.json').version)" 2>/dev/null)
[ "$ew" = "58.0.19" ] || reason "expo-widgets is $ew, plan is written against 58.0.19"
[ "$ex" = "58.0.12" ] || reason "expo is $ex, plan is written against 58.0.12"

# The refresh chain is still frozen at 1.28.25; a change means the plan re-verifies
n=$(git log --oneline 2014efad..uat -- modules/widgetrefresh | wc -l | tr -d ' ')
[ "$n" = "0" ] || reason "the refresh module moved since 2014efad ($n commits); re-verify the inventory"

[ "$fail" = "0" ] && echo "PREFLIGHT OK"
exit "$fail"
