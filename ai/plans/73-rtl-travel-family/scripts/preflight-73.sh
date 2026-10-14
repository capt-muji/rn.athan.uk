#!/usr/bin/env bash
# Pre-flight for ticket 73. Run from a copy in $TMPDIR, with the worktree as cwd.
# This run's override (the owner's run order, 2026-10-14): all work stays on
# ticket/73 in $HOME/athan-gitree/run-73. No uat checkout, no merge, no push.
set -u
cd "$HOME/athan-gitree/run-73" || { echo "PREFLIGHT FAIL: worktree missing"; exit 1; }

branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = "ticket/73" ] || { echo "PREFLIGHT FAIL: on $branch, not ticket/73"; exit 1; }

[ -z "$(git status --porcelain)" ] || { echo "PREFLIGHT FAIL: tree not clean"; git status --porcelain; exit 1; }

head_subject=$(git log -1 --format=%s)
echo "head: $head_subject"

version=$(python3 -c 'import json;print(json.load(open("app.json"))["expo"]["version"])')
python3 -c 'import sys; sys.exit(0 if tuple(map(int, sys.argv[1].split("."))) >= (2,0,256) else 1)' "$version" \
  || { echo "PREFLIGHT FAIL: version $version below 2.0.256"; exit 1; }
echo "version: $version"

pkg=$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')
[ "$pkg" = "$version" ] || { echo "PREFLIGHT FAIL: package.json $pkg differs from app.json $version"; exit 1; }

ls node_modules/.bin/jest >/dev/null 2>&1 || { echo "PREFLIGHT FAIL: node_modules absent (run yarn install)"; exit 1; }

for pair in \
  "ai/plans/73-rtl-travel-family/scripts/anchors/segmented-derived.md:components/sheets/parts/SegmentedControl.tsx" \
  "ai/plans/73-rtl-travel-family/scripts/anchors/segmented-indicator.md:components/sheets/parts/SegmentedControl.tsx" \
  "ai/plans/73-rtl-travel-family/scripts/anchors/toggle-derived.md:components/sheets/parts/Toggle.tsx" \
  "ai/plans/73-rtl-travel-family/scripts/anchors/picker-render.md:components/sheets/screens/ColorPicker.tsx" \
  "ai/plans/73-rtl-travel-family/scripts/anchors/segmented-test-rtl.md:components/sheets/parts/__tests__/SegmentedControl.test.tsx" \
  "ai/plans/73-rtl-travel-family/scripts/anchors/toggle-test-rtl.md:components/sheets/parts/__tests__/Toggle.test.tsx"; do
  a="${pair%%:*}"; f="${pair##*:}"
  c=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$a" "$f")
  [ "$c" = "1" ] || { echo "PREFLIGHT FAIL: anchor $a counts $c in $f"; exit 1; }
done
echo "anchors: 6 x 1"

echo "PREFLIGHT OK"
