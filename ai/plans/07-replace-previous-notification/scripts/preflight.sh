#!/bin/bash
# Session 7 pre-flight. The executor copies this file to $TMPDIR/preflight-7.sh and runs
#   bash $TMPDIR/preflight-7.sh <k>
# where <k> is the first item in PLAN.md section 6 not ticked DONE. It ends "PREFLIGHT OK".
# "PREFLIGHT NEEDS REPLAN" means an anchor no longer counts 1; "PREFLIGHT FAILED" means STOP.
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
node -e 'const [a,b,c]=process.argv[1].split(".").map(Number);process.exit(a>1||(a===1&&(b>27||(b===27&&c>=195)))?0:1)' "$version" \
  || fail "version $version is lower than the planned 1.27.195"
echo "NEEDS FIRST nothing"
dir=ai/plans/07-replace-previous-notification/scripts
while read -r step anchor source from; do
  if [ "$step" -ge "$k" ] && [ "$from" -le "$k" ]; then
    count=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$dir/anchors/$anchor.txt" "$source")
    echo "ANCHOR $anchor $source $count"
    if [ "$count" != "1" ]; then echo "PREFLIGHT NEEDS REPLAN: anchor $anchor counts $count in $source"; exit 1; fi
  fi
done < "$dir/anchors/manifest.txt"
[ -x node_modules/.bin/jest ] || fail "node_modules/.bin/jest is missing"
for tool in node python3 perl; do command -v "$tool" > /dev/null || fail "$tool is missing"; done
[ -f android/app/build.gradle ] || fail "android/app/build.gradle is missing, so set-version.sh cannot run"
[ -x "$HOME/Library/Android/sdk/build-tools/37.0.0/aapt" ] || fail "aapt is missing in the Android build tools 37.0.0"
echo "PREFLIGHT OK"
