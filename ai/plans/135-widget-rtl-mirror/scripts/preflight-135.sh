#!/usr/bin/env bash
# Pre-flight for ticket 135. Run from $TMPDIR against the lane worktree root:
#   bash preflight-135.sh $HOME/athan-gitree/worktrees/lane-135
set -u
ROOT="${1:?usage: preflight-135.sh <lane worktree root>}"
cd "$ROOT" || exit 1
fail() { echo "PREFLIGHT FAILED: $1"; exit 1; }
A="ai/plans/135-widget-rtl-mirror/scripts/anchors"

[ "$(git rev-parse --abbrev-ref HEAD)" = "lane/135" ] || fail "not on lane/135"
[ -z "$(git status --porcelain)" ] || fail "tree not clean"
git fetch -q origin uat || fail "fetch"
git merge-base --is-ancestor origin/uat HEAD || fail "origin/uat not merged into the lane branch"

PLANNED_AT="cd171855"
git merge-base --is-ancestor "$PLANNED_AT" HEAD || fail "planned-at sha not an ancestor"

V="$(node -p "require('./package.json').version")"
[ "$(printf '%s\n2.0.1013\n' "$V" | sort -V | head -1)" = "2.0.1013" ] || fail "version $V lower than planned-at 2.0.1013"

# Needs first: nothing. The queue row 135 must exist and sit open for this lane.
grep -q "^| 135 |" ai/plans/README.md || fail "queue row 135 missing"

count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
[ "$(count_anchor "$A/widget-strings-bake.txt" shared/widgetTimeline.ts)" = "1" ] || fail "anchor widget-strings-bake"
[ "$(count_anchor "$A/alabel.txt" widgets/PrayerWidget.tsx)" = "1" ] || fail "anchor alabel"
[ "$(count_anchor "$A/rtl-stamp-timeline.txt" shared/widgetTimeline.ts)" = "1" ] || fail "anchor rtl-stamp-timeline"
[ "$(count_anchor "$A/rtl-stamp-snapshot.txt" shared/widgetTimeline.ts)" = "1" ] || fail "anchor rtl-stamp-snapshot"
[ "$(count_anchor "$A/medium-composition.txt" widgets/PrayerWidget.tsx)" = "1" ] || fail "anchor medium-composition"
[ "$(count_anchor "$A/widget-strings-docblock.txt" shared/widgetTypes.ts)" = "1" ] || fail "anchor widget-strings-docblock"
[ "$(count_anchor "$A/entryview-body.txt" node_modules/expo-widgets/ios/Widgets/EntryView.swift)" = "1" ] || fail "anchor entryview-body"
[ "$(count_anchor "$A/patch-test-hunk-count.txt" shared/__tests__/widgetOpenAppPatch.test.ts)" = "1" ] || fail "anchor patch-test-hunk-count"

echo "PREFLIGHT OK"
