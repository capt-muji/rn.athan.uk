#!/bin/bash
# Session 6b pre-flight. The executor copies this file to $TMPDIR/preflight-6b.sh and runs
#   bash $TMPDIR/preflight-6b.sh <k>
# where <k> is the first line of PLAN.md section 6's checklist not ticked DONE: 1, 2 or 3.
# It ends "PREFLIGHT OK".
# "PREFLIGHT NEEDS REPLAN" means an anchor or a file no longer matches: PLAN.md section 2.2, item 1.
# "PREFLIGHT FAILED" means STOP and ask the owner, quoting the line.
set -u

REPO=/Users/muji/repos/rn.athan.uk
PLAN=ai/plans/06b-alert-all-or-nothing
MIN_VERSION=1.27.184

k="${1:-}"
fail() { echo "PREFLIGHT FAILED: $*"; exit 1; }

[ -n "$k" ] || fail "usage: preflight-6b.sh <first step not ticked DONE: 1, 2 or 3>"
case "$k" in 1|2|3) ;; *) fail "step must be 1, 2 or 3, not '$k'" ;; esac

# ---- the checkout ---------------------------------------------------------------------------
[ "$PWD" = "$REPO" ] || fail "run this from $REPO, not $PWD"
branch=$(git branch --show-current) || fail "git cannot read the branch"
[ "$branch" = "uat-2" ] || fail "the branch is '$branch', not uat-2"

# Porcelain is two status characters, a space, then the path, so cut -c4- is the path whatever the status
dirty=$(git status --porcelain | cut -c4- | grep -v -E '^(ai/plans/README\.md|ai/plans/06b-alert-all-or-nothing/(PLAN|LOG)\.md)$' || true)
[ -z "$dirty" ] || fail "the tree holds changes this plan does not expect:
$dirty"

git fetch origin uat-2 > /dev/null 2>&1 || fail "git fetch origin uat-2 failed"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 is not a descendant of origin/uat-2"
echo "branch uat-2, ahead of origin by $(git rev-list --count origin/uat-2..uat-2) commit(s)"

# ---- the version ----------------------------------------------------------------------------
version=$(node -p "require('./package.json').version") || fail "cannot read package.json"
echo "version $version"
lowest=$(printf '%s\n%s\n' "$version" "$MIN_VERSION" | sort -t. -k1,1n -k2,2n -k3,3n | head -1)
[ "$lowest" = "$MIN_VERSION" ] || fail "the version $version is lower than $MIN_VERSION, which this plan was written at"

# ---- Needs first ----------------------------------------------------------------------------
row1=$(grep -E '^\| 1 \| 6\. ' "$PLAN/../README.md" || true)
case "$row1" in
  *"| DONE |"*) echo "needs first: row 1 is DONE" ;;
  "") fail "cannot find row 1 in ai/plans/README.md" ;;
  *) fail "row 1 of ai/plans/README.md is not DONE, and this plan needs it" ;;
esac

# ---- the anchors and the files this step replaces ---------------------------------------------
if [ "$k" = "3" ]; then
  echo "step 3 is the device proof: no anchors to check"
else
  anchors=$(bash "$PLAN/scripts/anchor-check.sh" "$k") || fail "the anchor check could not run"
  echo "$anchors"
  case "$anchors" in
    *"ANCHORS OK"*) ;;
    *) echo "PREFLIGHT NEEDS REPLAN"; exit 0 ;;
  esac
fi

# ---- the tools ------------------------------------------------------------------------------
# Steps 1 and 2 never touch the phone, so a detached cable must not stop them
if [ "$k" != "3" ]; then
  echo "step $k does not touch the phone: the device checks are skipped"
  echo "PREFLIGHT OK"
  exit 0
fi

state=$(adb -s 8f7ada76 get-state 2>/dev/null || true)
[ "$state" = "device" ] || fail "adb -s 8f7ada76 get-state printed '$state', not 'device'"
echo "device 8f7ada76 attached"

auto=$(adb -s 8f7ada76 shell settings get global auto_time 2>/dev/null | tr -d '\r' || true)
[ "$auto" = "1" ] || fail "the phone's automatic time is '$auto', not '1'"
echo "automatic time on"

locked=$(adb -s 8f7ada76 shell dumpsys window policy 2>/dev/null | grep -c 'showing=true' || true)
[ "$locked" = "0" ] || fail "the phone's lock screen is showing; it must be left unlocked (PLAN.md section 2.2, item 12)"
echo "phone unlocked"

for tool in \
  "$HOME/athan-device-sweep/session3/bin/build-prod.zsh" \
  "$HOME/athan-device-sweep/session3/bin/build-mock.zsh" \
  "$HOME/athan-device-sweep/session6b/bin/build-mock-patch.zsh" \
  "$HOME/athan-device-sweep/session5/bin/devcheck.py" \
  "ai/plans/06-alert-integrity/scripts/device/isha_alarms.py"
do
  [ -s "$tool" ] || fail "missing tool: $tool"
done
echo "build and device tools present"

echo "PREFLIGHT OK"
