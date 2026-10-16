#!/bin/bash
# Ticket 117 pre-flight. Save a copy to $TMPDIR and run it from there.
set -u
cd "$HOME/athan-gitree/worktrees/lane-117" || { echo 'PREFLIGHT FAILED: no lane worktree'; exit 1; }
fail=0
note() { printf 'FAIL: %s\n' "$1"; fail=1; }
[ "$(git rev-parse --abbrev-ref HEAD)" = "lane/117" ] || note 'not on lane/117'
[ -z "$(git status --porcelain)" ] || note 'tree not clean'
git fetch -q origin uat || note 'cannot fetch origin uat'
git merge-base --is-ancestor origin/uat uat || note 'origin/uat not merged into uat'
git merge-base --is-ancestor uat lane/117 || note 'uat not merged into lane/117'
python3 - <<'PY' || note 'version below 2.0.858'
import json
v = tuple(int(x) for x in json.load(open('package.json'))['version'].split('.'))
raise SystemExit(0 if v >= (2, 0, 858) else 1)
PY
plan='ai/plans/117-widget-language-inventory'
for a in alabel:widgets/PrayerWidget.tsx static-resolver:widgets/PrayerWidget.tsx lock-pair:widgets/LockPrayerWidget.tsx widget-strings:shared/widgetTimeline.ts footer-for:shared/time.ts ar-units:shared/i18n/ar.ts appjson-gallery:app.json; do
  name="${a%%:*}"; src="${a#*:}"
  n="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$plan/scripts/anchors/$name.txt" "$src")"
  [ "$n" = "1" ] || note "anchor $name count $n in $src"
done
patch_n="$(cat patches/expo-widgets+*.patch 2>/dev/null | python3 -c 'import sys;print(sys.stdin.read().count(open(sys.argv[1]).read()))' "$plan/scripts/anchors/patch-locale.txt")"
[ "$patch_n" = "1" ] || note "anchor patch-locale count $patch_n across patches/expo-widgets+*.patch (ticket 111 drift: PLAN.md section 10 protocol)"
ls patches/expo-widgets+*.patch > /dev/null 2>&1 || note 'no patches/expo-widgets+*.patch'
if [ "$fail" = 0 ]; then echo 'PREFLIGHT OK'; else echo 'PREFLIGHT FAILED'; exit 1; fi
