#!/usr/bin/env bash
# Session 24 pre-flight. Run: bash $TMPDIR/preflight-24.sh <k>
# <k> is the first step in PLAN.md section 6 not ticked DONE (1 for a new plan).
set -u

REPO=/Users/muji/repos/rn.athan.uk
STEP="${1:-}"
if [ -z "$STEP" ]; then
  echo "FAIL: give the step number, e.g. bash \$TMPDIR/preflight-24.sh 1"
  exit 1
fi

cd "$REPO" || { echo "FAIL: cannot cd to $REPO"; exit 1; }

PWD_NOW=$(pwd -P)
if [ "$PWD_NOW" != "$REPO" ]; then
  echo "FAIL: checkout is $PWD_NOW, expected $REPO"
  exit 1
fi

BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "uat-2" ]; then
  echo "FAIL: on branch $BRANCH, expected uat-2"
  exit 1
fi

DIRTY=$(git status --porcelain | grep -v -E 'ai/plans/README\.md|ai/plans/24-lock-widget-full-day-list/' || true)
if [ -n "$DIRTY" ]; then
  echo "FAIL: the tree holds changes beyond the three plan files:"
  echo "$DIRTY"
  exit 1
fi

git fetch -q origin uat-2 || { echo "FAIL: git fetch origin uat-2"; exit 1; }
if ! git merge-base --is-ancestor origin/uat-2 uat-2; then
  echo "FAIL: uat-2 is not a descendant of origin/uat-2"
  exit 1
fi

VERSION=$(node -p "require('./package.json').version")
echo "package.json version: $VERSION"

# Row 23 (session 24) needs nothing first. Every row above it must read DONE,
# CANCELLED or NOT PLANNED: an in-flight row above would mean the order broke.
INFLIGHT=$(grep -n '^| [0-9]' ai/plans/README.md | grep -E '\| (PLANNING|READY|IN PROGRESS|EXECUTED)' | grep -v '^107:' || true)
if [ -n "$INFLIGHT" ]; then
  echo "FAIL: another row is in flight, so session 24 is not the row to execute:"
  echo "$INFLIGHT"
  exit 1
fi

count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}

A=ai/plans/24-lock-widget-full-day-list/scripts/anchors
FAILED=0
check() {
  local label="$1" anchor="$2" source="$3"
  local n
  n=$(count_anchor "$anchor" "$source")
  echo "anchor $label: $n"
  if [ "$n" != "1" ]; then
    echo "FAIL: anchor $label counted $n, expected 1 (NEEDS REPLAN)"
    FAILED=1
  fi
}

if [ "$STEP" -le 1 ]; then
  check layout-tail      "$A/1-layout-tail.txt"      widgets/LockPrayerWidget.tsx
  check catch-layout1    "$A/1-catch-layout1.txt"    widgets/LockPrayerWidget.tsx
  check catch-layout2    "$A/1-catch-layout2.txt"    widgets/LockPrayerWidget.tsx
  check catch-layout3    "$A/1-catch-layout3.txt"    widgets/LockPrayerWidget.tsx
  check push-standard    "$A/1-push-standard.txt"    stores/widget.ts
  check push-extras      "$A/1-push-extras.txt"      stores/widget.ts
  check mock-tail        "$A/1-mock-tail.txt"        shared/__mocks__/widgets/LockPrayerWidget.ts
  check contract-count   "$A/1-contract-count.txt"   shared/__tests__/widgetContract.test.ts
  check contract-palette "$A/1-contract-palette.txt" shared/__tests__/widgetContract.test.ts
  check poisoned-1       "$A/1-poisoned-1.txt"       shared/__tests__/widgetLockRenderer.test.ts
  check poisoned-2       "$A/1-poisoned-2.txt"       shared/__tests__/widgetLockRenderer.test.ts
  check poisoned-3       "$A/1-poisoned-3.txt"       shared/__tests__/widgetLockRenderer.test.ts
  check app-json-tail    "$A/1-app-json-tail.txt"    app.json
fi

if [ "$FAILED" != "0" ]; then
  exit 1
fi

# The suite the step adds must not exist yet on step 1.
if [ "$STEP" -le 1 ] && [ -e shared/__tests__/widgetLockListRenderer.test.ts ]; then
  echo "FAIL: shared/__tests__/widgetLockListRenderer.test.ts already exists"
  exit 1
fi

if [ ! -x node_modules/.bin/jest ]; then
  echo "FAIL: node_modules/.bin/jest is missing (the nightly clean may have run)"
  exit 1
fi
echo "jest: present"

echo "PREFLIGHT OK"
