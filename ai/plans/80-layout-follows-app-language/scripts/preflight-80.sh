#!/usr/bin/env bash
# Pre-flight for ticket 80. Run a copy from $TMPDIR against the worktree.
# bash 3.2 compatible. Ends PREFLIGHT OK or names the first failure.
set -u
repo="$HOME/athan-gitree/run-80"
fail() { echo "PREFLIGHT FAILED: $1"; exit 1; }

[ -d "$repo" ] || fail "worktree $repo missing"
cd "$repo" || fail "cannot enter $repo"

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "ticket/80" ] || fail "branch is $branch, expected ticket/80"

[ -z "$(git status --porcelain)" ] || fail "tree not clean: $(git status --porcelain | head -3)"

git merge-base --is-ancestor 1b0d5229 HEAD || fail "HEAD does not sit at or past the anchor 1b0d5229"

version="$(python3 -c 'import json;print(json.load(open("app.json"))["expo"]["version"])')"
lowest=$(printf '%s\n2.0.403' "$version" | sort -V | head -1)
[ "$lowest" = "2.0.403" ] || fail "version $version is below 2.0.403"

package="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
[ "$package" = "$version" ] || fail "app.json $version and package.json $package differ"

# Rows 73 and 78 must be DONE (the needs-first gate)
grep -q '^| 73 | .*| DONE' ai/plans/README.md || fail "row 73 is not DONE"
grep -q '^| 78 | .*| DONE' ai/plans/README.md || fail "row 78 is not DONE"

# Every anchor counts exactly 1 at the tree the steps edit
count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check() {
  n="$(count_anchor "ai/plans/80-layout-follows-app-language/scripts/anchors/$1" "$2")"
  [ "$n" = "1" ] || fail "anchor $1 counts $n in $2"
}
check layout-root.txt app/_layout.tsx
check layout-test-onscreen.txt __tests__/app/_layout.test.tsx
check picker-modal-root.txt components/sheets/screens/ColorPicker.tsx
check picker-direction-comment.txt components/sheets/screens/ColorPicker.tsx
check picker-test-comment.txt components/sheets/screens/__tests__/ColorPicker.test.tsx
check picker-test-snapshot-case.txt components/sheets/screens/__tests__/ColorPicker.test.tsx
check qibla-wave-read.txt components/sheets/screens/QiblaWave.tsx
check language-crossing.txt stores/language.ts
check rtlSwitch-refused.txt stores/__tests__/rtlSwitch.test.ts
check launch-init-reopen.txt app/index.tsx
check index-test-language-mock.txt __tests__/app/index.test.tsx

echo "PREFLIGHT OK"
