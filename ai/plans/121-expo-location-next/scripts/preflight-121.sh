#!/usr/bin/env bash
# Pre-flight for ticket 121 (expo-location/next evaluation). Read-only.
# Run from the lane worktree root: bash "$TMPDIR/preflight-121.sh"
# Prints PREFLIGHT OK on success, and a numbered reason list otherwise.
set -u
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  echo "PREFLIGHT FAILED"
  echo "1. not inside a git worktree"
  exit 1
fi
cd "$ROOT" || exit 1

PLANNED_SHA=ef0b09b2
PLANNED_VERSION=2.0.898
LOC_VERSION=58.0.16
NEXT=node_modules/expo-location/src/next

fail=0
n=0
reason() { n=$((n + 1)); echo "$n. $1"; fail=1; }

branch="$(git branch --show-current)"
[ "$branch" = "lane/121" ] || reason "branch is '$branch', expected lane/121"

if [ -n "$(git status --porcelain)" ]; then
  reason "worktree is not clean: $(git status --porcelain | wc -l | tr -d ' ') path(s)"
fi

git fetch -q origin uat 2>/dev/null || reason "git fetch -q origin uat failed"
if ! git merge-base --is-ancestor origin/uat HEAD 2>/dev/null; then
  reason "origin/uat is not an ancestor of HEAD; rebase the lane onto uat"
fi
if ! git merge-base --is-ancestor "$PLANNED_SHA" HEAD 2>/dev/null; then
  reason "the planned-at sha $PLANNED_SHA is not an ancestor of HEAD"
fi

version="$(python3 -c "import json;print(json.load(open('package.json'))['version'])")"
lower="$(python3 -c "import sys;a=sys.argv[1];b=sys.argv[2];print(1 if [int(x) for x in a.split('.')]<[int(x) for x in b.split('.')] else 0)" "$version" "$PLANNED_VERSION")"
[ "$lower" = "0" ] || reason "package.json version $version is lower than the planned $PLANNED_VERSION"

if [ ! -d "$NEXT" ]; then
  if [ -d node_modules/expo-location ]; then
    reason "node_modules/expo-location is present but $NEXT is missing (the subpackage is an exports entry, not a nested package)"
  else
    reason "node_modules/expo-location is missing; run yarn install in this worktree"
  fi
fi

if [ -f node_modules/expo-location/package.json ]; then
  installed="$(python3 -c "import json;print(json.load(open('node_modules/expo-location/package.json'))['version'])")"
  if [ "$installed" != "$LOC_VERSION" ]; then
    reason "expo-location is $installed, expected $LOC_VERSION (re-verify every /next cite against the installed tree before any step)"
  fi
fi

for f in "$NEXT/index.ts" "$NEXT/Location.ts" "$NEXT/types/Position.types.ts" \
         "$NEXT/native/types/NativeLocationModuleNextClass.types.ts" \
         node_modules/expo-location/CHANGELOG.md patches/expo-location+58.0.16.patch \
         device/qibla.ts hooks/useQibla.ts modules/qiblaheading/index.ts \
         shared/qiblaSettle.ts ai/AGENTS.md ai/UPSTREAM-PRS.md; do
  [ -f "$f" ] || reason "missing source file $f"
done

A="ai/plans/121-expo-location-next/scripts/anchors"
src_of() {
  case "$1" in
    next-index.md) echo "$NEXT/index.ts" ;;
    next-location.md) echo "$NEXT/Location.ts" ;;
    next-js-index.md) echo "$NEXT/js/index.ts" ;;
    next-position-heading.md) echo "$NEXT/types/Position.types.ts" ;;
    next-permissions-option.md) echo "$NEXT/types/Permissions.types.ts" ;;
    next-native-manifest.md) echo "$NEXT/native/types/NativeLocationModuleNextClass.types.ts" ;;
    changelog-next.md) echo "node_modules/expo-location/CHANGELOG.md" ;;
    qibla-watch.md|qibla-read-position.md) echo "device/qibla.ts" ;;
    qibla-sheet-branch.md) echo "hooks/useQibla.ts" ;;
    qiblaheading-index.md) echo "modules/qiblaheading/index.ts" ;;
    patch-android-gate.md|patch-ios-filter.md) echo "patches/expo-location+58.0.16.patch" ;;
    agents-qibla-lock.md) echo "ai/AGENTS.md" ;;
    upstream-location-pr.md) echo "ai/UPSTREAM-PRS.md" ;;
    settle-gate.md) echo "shared/qiblaSettle.ts" ;;
  esac
}

for f in "$A"/*.md; do
  name="$(basename "$f")"
  src="$(src_of "$name")"
  if [ -z "$src" ]; then
    reason "anchor $name has no mapped source"
    continue
  fi
  [ -f "$src" ] || { reason "anchor $name source $src is missing"; continue; }
  lines="$(awk 'END{print NR}' "$f")"
  if [ "$lines" -lt 3 ] || [ "$lines" -gt 15 ]; then
    reason "anchor $name has $lines lines, must be 3 to 15"
  fi
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$f" "$src")"
  [ "$count" = "1" ] || reason "anchor $name counts $count in $src, must count 1"
done

[ "$fail" = "0" ] || { echo "PREFLIGHT FAILED"; exit 1; }
echo "PREFLIGHT OK"
exit 0
