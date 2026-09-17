#!/bin/bash
# Session 7 pre-flight (replanned). The executor copies this file to $TMPDIR/preflight-7.sh and runs
#   bash $TMPDIR/preflight-7.sh <k>
# where <k> is the first item in PLAN.md section 6 not ticked DONE (2: only the device proof is left).
# It ends "PREFLIGHT OK". "PREFLIGHT NEEDS REPLAN" means an anchor no longer counts 1;
# "PREFLIGHT FAILED" means STOP.
k="$1"
fail() { echo "PREFLIGHT FAILED: $*"; exit 1; }
[ -n "$k" ] || fail "usage: preflight-7.sh <first step not ticked DONE>"
cd /Users/muji/repos/rn.athan.uk || fail "cannot enter /Users/muji/repos/rn.athan.uk"
[ "$(git rev-parse --show-toplevel)" = "/Users/muji/repos/rn.athan.uk" ] || fail "not the main checkout"
branch=$(git branch --show-current)
[ "$branch" = "uat-2" ] || fail "the branch is $branch, not uat-2"
other=$(git status --porcelain | grep -vE '^.. (ai/plans/(README\.md|07-replace-previous-notification/(PLAN|LOG)\.md)|opencode\.json)$')
[ -z "$other" ] || fail "changes other than the plan files: $other"
git fetch origin uat-2 > /dev/null 2>&1 || fail "git fetch origin uat-2 failed"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 does not contain origin/uat-2"
version=$(node -p 'require("./package.json").version')
echo "VERSION $version"
node -e 'const [a,b,c]=process.argv[1].split(".").map(Number);process.exit(a>1||(a===1&&(b>27||(b===27&&c>=201)))?0:1)' "$version" \
  || fail "version $version is lower than the planned 1.27.201"
echo "NEEDS FIRST nothing"
dir=ai/plans/07-replace-previous-notification/scripts
while read -r step anchor source from; do
  if [ "$step" -ge "$k" ] && [ "$from" -le "$k" ]; then
    count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$dir/anchors/$anchor.txt" "$source")
    echo "ANCHOR $anchor $source $count"
    if [ "$count" != "1" ]; then echo "PREFLIGHT NEEDS REPLAN: anchor $anchor counts $count in $source"; exit 1; fi
  fi
done < "$dir/anchors/manifest.txt"
if [ "$k" -ge 2 ]; then
  # Step 1 is DONE: its work must be present on uat-2 for the proof to prove anything.
  [ -f plugins/replacePreviousNotification.js ] || fail "plugins/replacePreviousNotification.js is missing, so step 1 is not merged"
  [ -f plugins/__tests__/replacePreviousNotification.test.ts ] || fail "the step 1 suite is missing"
  grep -q '"./plugins/replacePreviousNotification"' app.json || fail "step 1's plugin line is missing from app.json"
  echo "STEP1 PRESENT"
  # The fixed-days mock must still key the driven dates to the times every prediction uses.
  mock="$dir/mocks/fixed-days.ts.txt"
  grep -q "day('2026-09-12', '04:40', '06:12', '13:05', '16:42', '19:47', '20:58')" "$mock" \
    || fail "the fixed-days mock no longer keys 2026-09-12 as the plan expects"
  grep -q "day('2026-09-13', '04:42', '06:14', '13:05', '16:40', '19:45', '20:56')" "$mock" \
    || fail "the fixed-days mock no longer keys 2026-09-13 as the plan expects"
  grep -q "day('2026-09-14', '04:44', '06:16', '13:05', '16:39', '19:42', '20:54')" "$mock" \
    || fail "the fixed-days mock no longer keys 2026-09-14 as the plan expects"
  [ -f "$dir/device/posts.py" ] || fail "$dir/device/posts.py is missing"
  [ -f "$dir/device/tray.py" ] || fail "$dir/device/tray.py is missing"
  python3 -m py_compile "$dir/device/posts.py" "$dir/device/tray.py" || fail "the device scripts do not compile"
  echo "MOCK KEYED"
fi
[ -x node_modules/.bin/jest ] || fail "node_modules/.bin/jest is missing"
for tool in node python3 perl; do command -v "$tool" > /dev/null || fail "$tool is missing"; done
[ -f android/app/build.gradle ] || fail "android/app/build.gradle is missing, so set-version.sh cannot run"
[ -x "$HOME/Library/Android/sdk/build-tools/37.0.0/aapt" ] || fail "aapt is missing in the Android build tools 37.0.0"
[ -f ~/athan-device-sweep/session5/bin/devcheck.py ] || fail "devcheck.py is missing"
[ -f ~/athan-device-sweep/session3/bin/build-mock.zsh ] || fail "build-mock.zsh is missing"
echo "PREFLIGHT OK"
