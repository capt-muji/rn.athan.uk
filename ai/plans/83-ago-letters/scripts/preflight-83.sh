#!/bin/bash
# Ticket 83 pre-flight: the lane, a clean tree, row 85 landed, version floor, anchor counts
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "lane/83" ] && [ "$BRANCH" != "83-ago-letters" ]; then
  echo "PREFLIGHT FAIL: on $BRANCH, not lane/83 or its step branch"; exit 1
fi

BAD=$(git status --porcelain | grep -v -E "ai/plans/README.md|ai/plans/83-ago-letters/" | wc -l | tr -d ' ')
if [ "$BAD" != "0" ]; then echo "PREFLIGHT FAIL: dirty tree beyond the plan folder"; git status --porcelain; exit 1; fi

# Row 85 landed: the lettered countdown is in this tree's history (row 83's "Needs first" fact)
git merge-base --is-ancestor 5a3fba84 HEAD || { echo "PREFLIGHT FAIL: 5a3fba84 (row 85, lettered countdown) is not an ancestor of HEAD"; exit 1; }

FLOOR_OK=$(node -p "const v=require('./package.json').version.split('.').map(Number);const f=[2,0,735];v[0]>f[0]||(v[0]===f[0]&&v[1]>f[1])||(v[0]===f[0]&&v[1]===f[1]&&v[2]>=f[2])")
if [ "$FLOOR_OK" != "true" ]; then echo "PREFLIGHT FAIL: version below 2.0.735"; exit 1; fi

for A in ai/plans/83-ago-letters/scripts/anchors/*.txt; do
  NAME=$(basename "$A" .txt)
  SRC="${NAME%%-*}"
  case "$SRC" in
    a1|a2) FILE=shared/time.ts ;;
    a3|a4) FILE=components/prayer/Ago.tsx ;;
    a5) FILE=shared/__tests__/time.test.ts ;;
    a6) FILE=components/prayer/__tests__/Ago.test.tsx ;;
    a7) FILE=__tests__/app/Screen.test.tsx ;;
    a8) FILE=hooks/__tests__/usePrayerAgo.test.ts ;;
  esac
  COUNT=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A" "$FILE")
  if [ "$COUNT" != "1" ]; then echo "PREFLIGHT FAIL: anchor $NAME count $COUNT in $FILE"; exit 1; fi
done

echo "PREFLIGHT OK"
