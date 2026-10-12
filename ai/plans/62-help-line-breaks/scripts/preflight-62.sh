#!/bin/bash
# Ticket 62 pre-flight. Save a copy to $TMPDIR and run it from there.
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
plan='ai/plans/62-help-line-breaks'
row="$(grep '^| 39 |' ai/plans/README.md)"
case "$row" in *DONE*) ;; *) note 'needs-first row 39 not DONE' ;; esac
for a in en-restart:en en-cutoff:en ar-restart:ar ar-cutoff:ar ms-restart:ms ms-cutoff:ms so-restart:so so-cutoff:so hi-restart:hi hi-cutoff:hi th-restart:th th-cutoff:th; do
  name="${a%%:*}"; loc="${a#*:}"
  n="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$plan/scripts/anchors/$name.txt" "shared/i18n/$loc.ts")"
  [ "$n" = "1" ] || note "anchor $name count $n in shared/i18n/$loc.ts"
done
if [ "$fail" = 0 ]; then echo 'PREFLIGHT OK'; else echo 'PREFLIGHT FAILED'; exit 1; fi
