#!/usr/bin/env bash
# Session 15 pre-flight. Usage: bash ai/plans/15-android-widgets/scripts/preflight.sh <first-unfinished-step>
set -u
STEP="${1:-1}"

cd /Users/muji/repos/rn.athan.uk || { echo "PREFLIGHT FAIL: not the main checkout"; exit 1; }
[ "$(git branch --show-current)" = "uat-2" ] || { echo "PREFLIGHT FAIL: not on uat-2"; exit 1; }
[ "$(pwd)" = "/Users/muji/repos/rn.athan.uk" ] || { echo "PREFLIGHT FAIL: pwd"; exit 1; }

BAD="$(git status --porcelain | grep -v -E 'ai/plans/(README\.md|15-android-widgets/(PLAN|LOG)\.md)' || true)"
[ -z "$BAD" ] || { echo "PREFLIGHT FAIL: dirty tree: $BAD"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "PREFLIGHT FAIL: origin/uat-2 not an ancestor"; exit 1; }

VERSION="$(node -e "console.log(require('./package.json').version)")"
echo "version $VERSION"
[ "$(printf '%s\n1.27.241' "$VERSION" | sort -V | head -1)" = "1.27.241" ] || { echo "PREFLIGHT FAIL: version below planned"; exit 1; }

ROW6="$(grep -n '^| 6 |' ai/plans/README.md | grep -c DONE || true)"
[ "$ROW6" = "1" ] || { echo "PREFLIGHT FAIL: needs-first row 6 not DONE"; exit 1; }

count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}

[ "$(count_anchor /dev/null /dev/null)" = "0" ] # sanity: python method available

if [ "$STEP" -le 1 ]; then
  A='{
              "name": "PrayerWidget",
              "displayName": "Next Prayer (Light)",
              "description": "A countdown to the next prayer.",
              "ios": { "supportedFamilies": ["systemSmall"], "contentMarginsDisabled": true }
            },'
  C="$(printf '%s' "$A" | python3 -c 'import sys;print(open("app.json").read().count(sys.stdin.read()))')"
  [ "$C" = "1" ] || { echo "PREFLIGHT FAIL: A1 count $C"; exit 1; }
fi

if adb -s 8f7ada76 get-state >/dev/null 2>&1; then echo "device ok"; else echo "device 8f7ada76 offline (needed from step 7 proof)"; fi
python3 -c "import PIL" 2>/dev/null && echo "PIL ok" || echo "PIL missing (needed for step 6 regeneration only)"

echo "PREFLIGHT OK"
