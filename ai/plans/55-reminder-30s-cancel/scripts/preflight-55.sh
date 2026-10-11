#!/bin/bash
# Preflight for job 55. Save a copy to $TMPDIR and run it from there.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

fail() { echo "PREFLIGHT FAIL: $1"; exit 1; }

[ "$(git branch --show-current)" = "uat" ] || fail "not on uat"
[ -z "$(git status --porcelain)" ] || fail "tree not clean"
git fetch origin --quiet || fail "fetch failed"
git merge-base --is-ancestor origin/uat uat || fail "origin/uat not merged in"

VERSION=$(python3 -c 'import json;print(json.load(open("package.json"))["version"])')
python3 -c 'import sys;sys.exit(0 if tuple(map(int,sys.argv[1].split("."))) >= (2,0,3) else 1)' "$VERSION" \
  || fail "version $VERSION lower than 2.0.3"

grep -q "^| 53 |.*DONE" ai/plans/README.md || fail "row 53 not DONE"
grep -Eq "^| 55 |.*(READY|PLANNING)" ai/plans/README.md || fail "row 55 not READY or PLANNING"

PLAN=ai/plans/55-reminder-30s-cancel
check_anchor() {
  local name="$1" source="$2"
  local count
  count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    "$PLAN/scripts/anchors/$name.txt" "$source")
  [ "$count" = "1" ] || fail "anchor $name count $count in $source"
}
check_anchor reminder-skip-docblock stores/notifications.ts
check_anchor reminder-time-calc stores/notifications.ts
check_anchor reminder-imminent-guard stores/notifications.ts
check_anchor reminder-identifier-try stores/notifications.ts

echo "PREFLIGHT OK"
