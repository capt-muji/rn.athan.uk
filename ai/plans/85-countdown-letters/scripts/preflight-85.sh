#!/bin/bash
# Ticket 85 pre-flight: uat, clean tree, version floor, anchor counts
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "uat" ]; then echo "PREFLIGHT FAIL: on $BRANCH, not uat"; exit 1; fi

git fetch -q origin uat || { echo "PREFLIGHT FAIL: fetch"; exit 1; }
UNMERGED=$(git log --oneline origin/uat..uat | wc -l | tr -d ' ')
if [ "$UNMERGED" != "0" ]; then echo "PREFLIGHT FAIL: $UNMERGED commits not on origin/uat"; exit 1; fi

BAD=$(git status --porcelain | grep -v -E "ai/plans/README.md|ai/plans/85-countdown-letters/" | wc -l | tr -d ' ')
if [ "$BAD" != "0" ]; then echo "PREFLIGHT FAIL: dirty tree beyond the plan folder"; git status --porcelain; exit 1; fi

VERSION=$(node -p "require('./package.json').version.split('.').map(Number)" | tr -d ' ')
FLOOR_OK=$(node -p "const v=require('./package.json').version.split('.').map(Number);const f=[2,0,730];v[0]>f[0]||(v[0]===f[0]&&v[1]>f[1])||(v[0]===f[0]&&v[1]===f[1]&&v[2]>=f[2])")
if [ "$FLOOR_OK" != "true" ]; then echo "PREFLIGHT FAIL: version below 2.0.730"; exit 1; fi

for A in ai/plans/85-countdown-letters/scripts/anchors/*.txt; do
  NAME=$(basename "$A" .txt)
  SRC="${NAME%%-*}"
  case "$SRC" in
    a1|a2) FILE=components/countdown/Countdown.tsx ;;
    a3|a4|a5) FILE=shared/time.ts ;;
    a6) FILE=shared/constants.ts ;;
    a7) FILE=shared/__tests__/time.test.ts ;;
    a8) FILE=shared/__tests__/constants.test.ts ;;
  esac
  COUNT=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A" "$FILE")
  if [ "$COUNT" != "1" ]; then echo "PREFLIGHT FAIL: anchor $NAME count $COUNT in $FILE"; exit 1; fi
done

echo "PREFLIGHT OK"
