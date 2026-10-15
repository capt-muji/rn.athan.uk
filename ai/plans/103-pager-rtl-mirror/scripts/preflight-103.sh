#!/usr/bin/env bash
# Pre-flight for plan 103. Copy to $TMPDIR and run from the repository root.
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

step "checking version floor (2.0.784)"
v="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
python3 -c "import sys;sys.exit(0 if tuple(map(int,'$v'.split('.'))) >= (2,0,784) else 1)" || { step "FAIL: version $v below 2.0.784"; fail=1; }

step "Needs first: nothing"
step "checking anchors count exactly 1"
root="$(git rev-parse --show-toplevel)"
plan="$root/ai/plans/103-pager-rtl-mirror"
check_anchor() {
  anchor="$1"; source="$2"
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$anchor" "$source")"
  [ "$count" = "1" ] || { step "FAIL: $anchor counts $count in $source"; fail=1; }
}
check_anchor "$plan/scripts/anchors/pager-block.anchor" "$root/app/Navigation.tsx"
check_anchor "$plan/scripts/anchors/dots-row.anchor" "$root/app/Navigation.tsx"
check_anchor "$plan/scripts/anchors/pageselected-mapping.anchor" "$root/app/Navigation.tsx"
check_anchor "$plan/scripts/anchors/root-direction.anchor" "$root/app/_layout.tsx"
check_anchor "$plan/scripts/anchors/locale-direction.anchor" "$root/shared/i18n/locale.ts"

[ "$fail" = "0" ] && echo "PREFLIGHT OK" || { echo "PREFLIGHT FAILED"; exit 1; }
