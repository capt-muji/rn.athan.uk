#!/usr/bin/env bash
# Ticket 81 pre-flight. The executor saves a copy to $TMPDIR and runs it from
# the repository root with the step number: bash preflight-81.sh <step>
set -u
cd "$(git rev-parse --show-toplevel)"
step="${1:-}"
fail=0
say() { echo "PREFLIGHT: $1"; }

[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || { say "FAIL: not on uat"; exit 1; }
[ -z "$(git status --porcelain)" ] || { say "FAIL: tree not clean"; exit 1; }
git fetch -q origin uat
git merge-base --is-ancestor origin/uat uat || { say "FAIL: origin/uat not merged into uat"; exit 1; }

ver=$(python3 -c "import json;print(json.load(open('package.json'))['version'])")
floor="2.0.24$step"
python3 -c "import sys; sys.exit(0 if tuple(int(x) for x in sys.argv[1].split('.')) >= tuple(int(x) for x in sys.argv[2].split('.')) else 1)" "$ver" "$floor" \
  || { say "FAIL: version $ver below step $step's floor $floor"; exit 1; }
say "step $step, version $ver, floor $floor"

row74=$(grep -c '^| 74 |.*DONE' ai/plans/README.md)
row79=$(grep -c '^| 79 |.*DONE' ai/plans/README.md)
[ "$row74" -ge 1 ] || { say "FAIL: needs-first row 74 is not DONE"; fail=1; }
[ "$row79" -ge 1 ] || { say "FAIL: needs-first row 79 is not DONE"; fail=1; }

plan=ai/plans/81-greenbuild-refinements
count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
anchors_for() {
  case "$1" in
    1) echo "time-split.txt:shared/time.ts time-test-dim.txt:shared/__tests__/time.test.ts" ;;
    2) echo "countdown-gap.txt:components/countdown/Countdown.tsx countdown-fontsize.txt:components/countdown/Countdown.tsx typography-arabic.txt:shared/typography.ts typography-latin.txt:shared/typography.ts typography-iface.txt:shared/typography.ts countdown-test-gap.txt:components/countdown/__tests__/Countdown.test.tsx typography-test-ar.txt:shared/__tests__/typography.test.ts typography-test-lat.txt:shared/__tests__/typography.test.ts" ;;
    3) echo "time-render.txt:components/prayer/Time.tsx time-test-each.txt:components/prayer/__tests__/Time.test.tsx time-test-head.txt:components/prayer/__tests__/Time.test.tsx" ;;
    4) echo "ago-parts.txt:components/prayer/Ago.tsx ago-style.txt:components/prayer/Ago.tsx list-styles.txt:components/prayer/List.tsx ago-test-each.txt:components/prayer/__tests__/Ago.test.tsx" ;;
    5) echo "" ;;
    *) echo "UNKNOWN" ;;
  esac
}

step_list=$(anchors_for "$step")
[ "$step_list" != "UNKNOWN" ] || { say "FAIL: unknown step $step (1 to 5)"; exit 1; }
for pair in $step_list; do
  a="${pair%%:*}"; f="${pair#*:}"
  n=$(count_anchor "$plan/scripts/anchors/$a" "$f")
  if [ "$n" = "1" ]; then say "anchor ok: $a"; else say "FAIL: anchor $a count $n in $f"; fail=1; fi
done

if [ "$fail" -eq 0 ]; then
  echo "PREFLIGHT OK"
else
  echo "PREFLIGHT FAILED"
  exit 1
fi