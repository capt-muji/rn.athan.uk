#!/usr/bin/env bash
# Ticket 79 step 2 pre-flight. The executor saves a copy to $TMPDIR and runs it
# from the repository root after step 1 is merged. Step 1's edits consume five
# of the planning anchors, so this variant checks the three that survive.
set -u
cd "$(git rev-parse --show-toplevel)"
fail=0
say() { echo "PREFLIGHT: $1"; }

[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || { say "FAIL: not on uat"; exit 1; }
[ -z "$(git status --porcelain)" ] || { say "FAIL: tree not clean"; exit 1; }
git fetch -q origin uat
git merge-base --is-ancestor origin/uat uat || { say "FAIL: origin/uat not merged into uat"; exit 1; }

ver=$(python3 -c "import json;print(json.load(open('package.json'))['version'])")
python3 -c "import sys; sys.exit(0 if tuple(int(x) for x in sys.argv[1].split('.')) >= tuple(int(x) for x in sys.argv[2].split('.')) else 1)" "$ver" 2.0.232 \
  || { say "FAIL: version $ver below step 1's 2.0.232"; exit 1; }
say "version $ver"

row72=$(grep -c '^| 72 |.*DONE' ai/plans/README.md)
row74=$(grep -c '^| 74 |.*DONE' ai/plans/README.md)
[ "$row72" -ge 1 ] || { say "FAIL: needs-first row 72 is not DONE"; fail=1; }
[ "$row74" -ge 1 ] || { say "FAIL: needs-first row 74 is not DONE"; fail=1; }

plan=ai/plans/79-countdown-dim-noshift
count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check() {
  n=$(count_anchor "$plan/scripts/anchors/$1" "$2")
  if [ "$n" = "1" ]; then say "anchor ok: $1"; else say "FAIL: anchor $1 count $n in $2"; fail=1; fi
}
check countdown-colon-render.txt components/countdown/Countdown.tsx
check time-splitcolonsections.txt shared/time.ts
check constants-colors-text.txt shared/constants.ts

if [ "$fail" -eq 0 ]; then
  echo "PREFLIGHT OK"
else
  echo "PREFLIGHT FAILED"
  exit 1
fi