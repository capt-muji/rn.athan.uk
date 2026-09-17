#!/bin/bash
# Session 9 pre-flight. The executor copies this file to $TMPDIR/preflight-9.sh and runs
#   bash $TMPDIR/preflight-9.sh <k>
# where <k> is the first item in PLAN.md section 6 not ticked DONE (1, 2 or 3; 3 is the device proof).
# It ends "PREFLIGHT OK". "PREFLIGHT NEEDS REPLAN" means an anchor no longer counts 1;
# "PREFLIGHT FAILED" means STOP.
k="$1"
fail() { echo "PREFLIGHT FAILED: $*"; exit 1; }
[ -n "$k" ] || fail "usage: preflight-9.sh <first step not ticked DONE>"
cd /Users/muji/repos/rn.athan.uk || fail "cannot enter /Users/muji/repos/rn.athan.uk"
[ "$(git rev-parse --show-toplevel)" = "/Users/muji/repos/rn.athan.uk" ] || fail "not the main checkout"
branch=$(git branch --show-current)
[ "$branch" = "uat-2" ] || fail "the branch is $branch, not uat-2"
other=$(git status --porcelain | grep -vE '^.. (ai/plans/(README\.md|09-keep-still-due-rows-after-midnight/(PLAN|LOG)\.md))$')
[ -z "$other" ] || fail "changes other than the plan files: $other"
git fetch origin uat-2 > /dev/null 2>&1 || fail "git fetch origin uat-2 failed"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 does not contain origin/uat-2"
version=$(node -p 'require("./package.json").version')
echo "VERSION $version"
node -e 'const [a,b,c]=process.argv[1].split(".").map(Number);process.exit(a>1||(a===1&&(b>27||(b===27&&c>=211)))?0:1)' "$version" \
  || fail "version $version is lower than the planned 1.27.211"
echo "NEEDS FIRST nothing"
dir=ai/plans/09-keep-still-due-rows-after-midnight/scripts
while read -r step anchor source from; do
  if [ "$step" = "$k" ] && [ "$from" -le "$k" ]; then
    count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$dir/anchors/$anchor.txt" "$source")
    echo "ANCHOR $anchor $source $count"
    if [ "$count" != "1" ]; then echo "PREFLIGHT NEEDS REPLAN: anchor $anchor counts $count in $source"; exit 1; fi
  fi
done < "$dir/anchors/manifest.txt"
if [ "$k" -ge 2 ]; then
  # Step 1 must be merged: its helper is present and the schedule suite's interim tests are gone
  grep -q "export const firstStillDueListDay" shared/prayer.ts || fail "step 1 is not merged: firstStillDueListDay is missing"
  grep -q "hides the bar from a launch after 00:00" stores/__tests__/schedule.test.ts \
    && fail "step 1 is not merged: the interim test block is still there"
  echo "STEP1 PRESENT"
fi
# The fixed-days mock must still key the five days the device proof drives to
mock="$dir/mocks/fixed-days.ts.txt"
grep -q "day('2026-09-24', '03:00', '05:00', '13:00', '17:00', '22:30', '23:40')" "$mock" \
  || fail "the fixed-days mock no longer keys 2026-09-24 as the plan expects"
grep -q "day('2026-09-25', '02:30', '04:30', '13:00', '17:30', '00:40', '01:30')" "$mock" \
  || fail "the fixed-days mock no longer keys 2026-09-25 as the plan expects"
grep -q "day('2026-09-26', '02:00', '04:00', '13:00', '17:30', '22:00', '23:30')" "$mock" \
  || fail "the fixed-days mock no longer keys 2026-09-26 as the plan expects"
grep -q "day('2026-09-27', '00:10', '03:00', '13:00', '17:00', '21:00', '22:30')" "$mock" \
  || fail "the fixed-days mock no longer keys 2026-09-27 as the plan expects"
grep -q "day('2026-09-28', '03:00', '05:00', '13:00', '17:00', '20:58', '22:30')" "$mock" \
  || fail "the fixed-days mock no longer keys 2026-09-28 as the plan expects"
[ -f "$dir/device/posts.py" ] || fail "$dir/device/posts.py is missing"
[ -f "$dir/device/tray.py" ] || fail "$dir/device/tray.py is missing"
python3 -m py_compile "$dir/device/posts.py" "$dir/device/tray.py" || fail "the device scripts do not compile"
echo "MOCK KEYED"
[ -x node_modules/.bin/jest ] || fail "node_modules/.bin/jest is missing"
for tool in node python3 perl; do command -v "$tool" > /dev/null || fail "$tool is missing"; done
[ -f android/app/build.gradle ] || fail "android/app/build.gradle is missing, so set-version.sh cannot run"
[ -f mocks/simple.ts ] || fail "mocks/simple.ts is missing, so the final build cannot run"
adb -s 8f7ada76 get-state > /dev/null 2>&1 || fail "adb cannot see the OnePlus 3T 8f7ada76"
[ "$(adb -s 8f7ada76 get-state 2>/dev/null)" = "device" ] || fail "the 3T is not in state device"
[ -f ~/athan-device-sweep/session5/bin/devcheck.py ] || fail "devcheck.py is missing"
[ -f ~/athan-device-sweep/session3/bin/build-mock.zsh ] || fail "build-mock.zsh is missing"
echo "PREFLIGHT OK"
