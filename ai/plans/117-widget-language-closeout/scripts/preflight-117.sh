#!/usr/bin/env bash
# Pre-flight for ticket 117. Save a copy to $TMPDIR and run it with the lane worktree
# path as the argument (default: the lane worktree's constant path).
# bash 3.2 compatible. Ends PREFLIGHT OK or names the failure.
set -u
tree="${1:-$HOME/athan-gitree/worktrees/lane-117}"
cd "$tree" || { echo "PREFLIGHT FAIL: no tree $tree"; exit 1; }

fail=""

# 1. On a branch off uat, clean tree.
branch="$(git branch --show-current)"
[ -n "$branch" ] || fail="$fail\n- detached HEAD"
[ -z "$(git status --porcelain)" ] || fail="$fail\n- tree not clean"

# 2. uat merged in (the lane branch's merge-base with uat is uat's tip or older;
# uat itself must contain the planned-at sha).
git merge-base --is-ancestor 164df7bd HEAD || fail="$fail\n- planned-at sha 164df7bd not an ancestor"

# 3. Version at or above the planned-at version.
v="$(node -p 'require("./package.json").version')"
lowest=$(printf '%s\n2.0.1069\n' "$v" | sort -V | head -1)
[ "$lowest" = "2.0.1069" ] || fail="$fail\n- version $v below 2.0.1069"

# 4. Needs first: row 135 DONE; row 117 in flight.
grep -q "^| 135 |.*DONE 2026-10-18" ai/plans/README.md || fail="$fail\n- row 135 not DONE"
row117="$(grep -c '^| 117 |' ai/plans/README.md)"
[ "$row117" = "1" ] || fail="$fail\n- row 117 matches $row117 lines, expected 1"
row69="$(grep -c '^| 69 |' ai/plans/README.md)"
[ "$row69" = "1" ] || fail="$fail\n- row 69 matches $row69 lines, expected 1"

# 5. Anchors: each counts exactly 1 in its source.
count() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"; }
plan="ai/plans/117-widget-language-closeout"
check_anchor() {
  src="$1"; name="$2"
  c="$(count "$plan/scripts/anchors/$name" "$src")"
  [ "$c" = "1" ] || fail="$fail\n- anchor $name counts $c in $src, expected 1"
}
check_anchor patches/expo-widgets+58.0.20.patch a1-patch-cpp.md
check_anchor patches/expo-widgets+58.0.20.patch a2-patch-swift.md
check_anchor patches/expo-widgets+58.0.20.patch a3-patch-kt.md
check_anchor ai/UPSTREAM-PRS.md a6-upstream-ledger.md
check_anchor app.json a7-appjson-locale.md
check_anchor e2e/device-atlas-oneplus3t.md a8-atlas-picker.md

if [ -n "$fail" ]; then
  printf "PREFLIGHT FAIL:%b\n" "$fail"
  exit 1
fi
echo "PREFLIGHT OK"
