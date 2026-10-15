#!/usr/bin/env bash
# Pre-flight for plan 106. Copy to $TMPDIR and run with the repository
# root as the working directory.
set -u
fail=0
step() { printf '%s\n' "$1"; }

step "checking branch"
[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || { step "FAIL: not on uat"; fail=1; }

step "checking clean tree"
[ -z "$(git status --porcelain)" ] || { step "FAIL: tree is dirty"; fail=1; }

step "checking origin merged in"
git fetch -q origin uat || { step "FAIL: git fetch"; fail=1; }
git merge-base --is-ancestor origin/uat uat || { step "FAIL: origin/uat not merged into uat"; fail=1; }

step "checking version floor (2.0.787)"
v="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
python3 -c "import sys;sys.exit(0 if tuple(map(int,'$v'.split('.'))) >= (2,0,787) else 1)" || { step "FAIL: version $v below 2.0.787"; fail=1; }

step "Needs first: nothing"
step "checking anchors count exactly 1"
root="$(git rev-parse --show-toplevel)"
plan="$root/ai/plans/106-visual-batch"
check_anchor() {
  anchor="$1"; source="$2"
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$source")"
  [ "$count" = "1" ] || { step "FAIL: $anchor counts $count in $source"; fail=1; }
}
check_anchor "$plan/scripts/anchors/ar-record.anchor" "$root/shared/typography.ts"
check_anchor "$plan/scripts/anchors/day-styles.anchor" "$root/components/day/Day.tsx"
check_anchor "$plan/scripts/anchors/explanation-arrow.anchor" "$root/components/prayer/Explanation.tsx"
check_anchor "$plan/scripts/anchors/infobox-placement.anchor" "$root/components/overlay/OverlayInfoBox.tsx"
check_anchor "$plan/scripts/anchors/countdown-gap.anchor" "$root/components/countdown/Countdown.tsx"
check_anchor "$plan/scripts/anchors/countdown-gap-style.anchor" "$root/components/countdown/Countdown.tsx"

[ "$fail" = "0" ] && echo "PREFLIGHT OK" || { echo "PREFLIGHT FAILED"; exit 1; }
