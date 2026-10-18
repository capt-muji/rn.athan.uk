#!/usr/bin/env bash
# Pre-flight for ticket 138. Run from the lane worktree root after saving a copy to $TMPDIR.
# bash 3.2 compatible.
set -u
fail=0
note() { echo "PREFLIGHT FAIL: $1"; fail=1; }

# Clean tree.
if [ -n "$(git status --porcelain)" ]; then note "tree not clean"; fi

# On the lane branch, with origin/uat merged in.
git fetch -q origin uat || note "cannot fetch origin uat"
branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "lane/138" ] || note "not on lane/138 (on $branch)"
git merge-base --is-ancestor origin/uat HEAD || note "origin/uat not merged into HEAD"

# Version at or above the plan's base.
version="$(node -e "console.log(JSON.parse(require('fs').readFileSync('app.json','utf8')).expo.version)")"
node -e "
const mine = process.argv[1].split('.').map(Number);
const base = [2,0,1052];
for (let i = 0; i < 3; i++) {
  if (mine[i] !== base[i]) { process.exit(mine[i] > base[i] ? 0 : 1); }
}
" "$version" || note "version $version below the plan's base 2.0.1052"

# Needs first: nothing. No check needed.

# Anchors: every count exactly 1.
plan=ai/plans/138-semver-discipline
count() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$plan/scripts/anchors/$1" "$2"
}
[ "$(count uniqueness-merge-handling.md scripts/check-version-uniqueness.js)" = "1" ] || note "anchor uniqueness-merge-handling"
[ "$(count agents-version-rule.md ai/AGENTS.md)" = "1" ] || note "anchor agents-version-rule"
[ "$(count lane-merge-bullet.md .opencode/agents/athan-lane.md)" = "1" ] || note "anchor lane-merge-bullet"
[ "$(count lockstep-shape.md shared/__tests__/versionLockstep.test.ts)" = "1" ] || note "anchor lockstep-shape"
[ "$(count updates-comparator.md device/updates.ts)" = "1" ] || note "anchor updates-comparator"
[ "$(count appjson-android-block.md app.json)" = "1" ] || note "anchor appjson-android-block"

# Hook files still byte-identical to e37a3210 (steps 1 and 2 edit them).
[ "$(git show e37a3210:.husky/commit-msg | shasum | cut -d' ' -f1)" = "$(shasum < .husky/commit-msg | cut -d' ' -f1)" ] || note ".husky/commit-msg differs from e37a3210"
[ "$(git show e37a3210:.husky/pre-merge-commit | shasum | cut -d' ' -f1)" = "$(shasum < .husky/pre-merge-commit | cut -d' ' -f1)" ] || note ".husky/pre-merge-commit differs from e37a3210"

[ "$fail" -eq 0 ] && echo "PREFLIGHT OK"
exit "$fail"
