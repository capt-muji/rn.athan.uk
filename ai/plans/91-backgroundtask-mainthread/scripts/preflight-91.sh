#!/usr/bin/env bash
# Ticket 91 pre-flight. Run from the repository root of the MAIN checkout after
# saving this file to $TMPDIR:  bash $TMPDIR/preflight-91.sh
# Checks: uat checkout, clean tree, origin fetched, planned-at ancestry,
# version floor, queue status, anchor counts. Prints PREFLIGHT OK.
set -u
cd "$HOME/repos/rn.athan.uk"
fail=0
step() { printf '%s\n' "$1"; }

BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$BRANCH" = "uat" ] || { step "FAIL: on $BRANCH, expected uat"; fail=1; }

DIRTY=$(git status --porcelain | grep -v '^?? ai/plans/91-backgroundtask-mainthread' | head -5)
[ -z "$DIRTY" ] || { step "FAIL: tree not clean: $DIRTY"; fail=1; }

git fetch -q origin uat || { step "FAIL: fetch origin uat"; fail=1; }
git merge-base --is-ancestor f9af66c2 HEAD || { step "FAIL: HEAD does not descend from planned-at f9af66c2"; fail=1; }
git merge-base --is-ancestor origin/uat HEAD || { step "FAIL: origin/uat not merged in"; fail=1; }

VER=$(node -e 'const v=require("./package.json").version;const p=v.split(".").map(Number);console.log(p[0]*1e6+p[1]*1e3+p[2])')
[ "$VER" -ge 2000751 ] || { step "FAIL: version below 2.0.751"; fail=1; }

QUEUE=$(grep -c '^| 91 |.*READY' ai/plans/README.md)
[ "$QUEUE" -ge 1 ] || { step "FAIL: row 91 not READY in the queue"; fail=1; }

A=ai/plans/91-backgroundtask-mainthread/scripts/anchors
count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check() {
  local name="$1" src="$2"
  local c
  c=$(count_anchor "$A/$name" "$src")
  [ "$c" = "1" ] || { step "FAIL: anchor $name counts $c in $src"; fail=1; }
}
check sequence-arm.txt device/backgroundTaskDebug.ts
check bg-header.txt device/backgroundTaskDebug.ts
check simulate-doc.txt device/backgroundTaskDebug.ts
check arm-doc.txt device/backgroundTaskDebug.ts
check test-header.txt device/__tests__/backgroundTaskDebug.test.ts
check test-aftereach.txt device/__tests__/backgroundTaskDebug.test.ts
check test-full-sequence.txt device/__tests__/backgroundTaskDebug.test.ts
check index-call.txt app/index.tsx
check register-path.txt stores/notifications.ts
check debug-helper.txt node_modules/expo-background-task/ios/BackgroundTaskDebugHelper.swift

[ "$fail" -eq 0 ] && { step "PREFLIGHT OK"; exit 0; }
step "PREFLIGHT FAILED"
exit 1
