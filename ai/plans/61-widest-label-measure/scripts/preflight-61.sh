#!/bin/bash
# Ticket 61 pre-flight. Save a copy to $TMPDIR and run it from there.
set -u
cd "$(git rev-parse --show-toplevel)" || { echo 'PREFLIGHT FAILED: not a repo'; exit 1; }
fail=0
note() { printf 'FAIL: %s\n' "$1"; fail=1; }
[ "$(git rev-parse --abbrev-ref HEAD)" = "uat" ] || note 'not on uat'
[ -z "$(git status --porcelain)" ] || note 'tree not clean'
git fetch -q origin uat || note 'cannot fetch origin uat'
git merge-base --is-ancestor origin/uat uat || note 'origin/uat not merged into uat'
python3 - <<'PY' || note 'version below Planned at'
import json
v = tuple(int(x) for x in json.load(open('package.json'))['version'].split('.'))
raise SystemExit(0 if v >= (2, 0, 105) else 1)
PY
plan='ai/plans/61-widest-label-measure'
row="$(grep '^| 39 |' ai/plans/README.md)"
case "$row" in *DONE*) ;; *) note 'needs-first row 39 not DONE' ;; esac
for a in measurer-body:components/ui/InitialWidthMeasurement.tsx prayer-longest:shared/prayer.ts test-banner:shared/__tests__/prayer.test.ts test-import:shared/__tests__/prayer.test.ts; do
  name="${a%%:*}"; src="${a#*:}"
  n="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$plan/scripts/anchors/$name.txt" "$src")"
  [ "$n" = "1" ] || note "anchor $name count $n in $src"
done
if [ "$fail" = 0 ]; then echo 'PREFLIGHT OK'; else echo 'PREFLIGHT FAILED'; exit 1; fi
