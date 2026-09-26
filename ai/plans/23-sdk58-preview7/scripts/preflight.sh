#!/bin/bash
# Pre-flight for session 23, rewritten by the 2026-09-26 replan for steps 4 and 5.
# Run as: bash $TMPDIR/preflight-23.sh <k>   where <k> is the first unticked step.
set -u

STEP="${1:-4}"
REPO=/Users/muji/repos/rn.athan.uk
PLAN="$REPO/ai/plans/23-sdk58-preview7"

fail () { echo "PREFLIGHT FAILED: $1"; exit 1; }

cd "$REPO" || fail "cannot cd to $REPO"

[ "$(pwd)" = "$REPO" ] || fail "wrong checkout: $(pwd)"
[ "$(git branch --show-current)" = "uat-2" ] || fail "not on uat-2: $(git branch --show-current)"

DIRTY=$(git status --porcelain | grep -v 'ai/plans/README.md' \
                               | grep -v 'ai/plans/23-sdk58-preview7/PLAN.md' \
                               | grep -v 'ai/plans/23-sdk58-preview7/LOG.md' || true)
[ -z "$DIRTY" ] || fail "tree has unexpected changes:
$DIRTY"

git fetch -q origin uat-2 || fail "git fetch failed"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 is not a descendant of origin/uat-2"

VERSION=$(node -p "require('$REPO/package.json').version")
echo "package.json version: $VERSION   (planned at 1.28.41; never lower)"

# "Needs first" is nothing for this row, so no row is checked here.

if [ "$STEP" -le 4 ]; then
  COUNT=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    "$PLAN/scripts/anchors/4-1.txt" "$REPO/package.json")
  [ "$COUNT" = "1" ] || fail "anchor 4-1 counted $COUNT, not 1"
  echo "anchor 4-1: 1"
fi

# Step 5 anchors on nothing: it adds a file and appends to two documents.

command -v node > /dev/null || fail "node not found"
[ -f "$REPO/node_modules/expo-widgets/scripts/build-bundle.mjs" ] \
  || fail "expo-widgets build-bundle.mjs missing; run yarn install"

if [ "$STEP" -le 4 ]; then
  STATE=$(adb -s 8f7ada76 get-state 2>&1 | tr -d '\n')
  [ "$STATE" = "device" ] || fail "3T not connected: adb get-state said '$STATE'"
  echo "3T: device"

  command -v aapt2 > /dev/null || fail "aapt2 not found; step 4 part 11 needs it to verify the APK's providers"
  echo "aapt2: present"
fi

echo "PREFLIGHT OK"
