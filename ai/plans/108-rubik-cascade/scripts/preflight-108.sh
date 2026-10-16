#!/usr/bin/env bash
# Pre-flight for plan 108. Copy to $TMPDIR and run with the repository
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

step "checking version floor (2.0.826)"
v="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
python3 -c "import sys;sys.exit(0 if tuple(map(int,'$v'.split('.'))) >= (2,0,826) else 1)" || { step "FAIL: version $v below 2.0.826"; fail=1; }

step "Needs first: nothing"
step "checking anchors count exactly 1"
root="$(git rev-parse --show-toplevel)"
plan="$root/ai/plans/108-rubik-cascade"
check_anchor() {
  anchor="$1"; source="$2"
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$source")"
  [ "$count" = "1" ] || { step "FAIL: $anchor counts $count in $source"; fail=1; }
}
check_anchor "$plan/scripts/anchors/header-subtitle.anchor" "$root/components/sheets/parts/Header.tsx"
check_anchor "$plan/scripts/anchors/qibla-subtitle.anchor" "$root/components/sheets/screens/Qibla.tsx"
check_anchor "$plan/scripts/anchors/sound-list-gap.anchor" "$root/components/sheets/screens/Sound.tsx"
check_anchor "$plan/scripts/anchors/day-dial.anchor" "$root/components/day/Day.tsx"
check_anchor "$plan/scripts/anchors/note-text.anchor" "$root/components/sheets/parts/VolumeNote.tsx"
check_anchor "$plan/scripts/anchors/script-line-height.anchor" "$root/shared/typography.ts"
check_anchor "$plan/scripts/anchors/sweep-qibla.anchor" "$root/components/__tests__/typographySweep.test.tsx"
check_anchor "$plan/scripts/anchors/sweep-sound-hint.anchor" "$root/components/__tests__/typographySweep.test.tsx"
check_anchor "$plan/scripts/anchors/sweep-header-boxes.anchor" "$root/components/__tests__/typographySweep.test.tsx"
check_anchor "$plan/scripts/anchors/daylines-gap.anchor" "$root/components/day/__tests__/DayLines.test.tsx"
check_anchor "$plan/scripts/anchors/volume-note-style.anchor" "$root/components/sheets/parts/__tests__/VolumeNote.test.tsx"

[ "$fail" = "0" ] && echo "PREFLIGHT OK" || { echo "PREFLIGHT FAILED"; exit 1; }
