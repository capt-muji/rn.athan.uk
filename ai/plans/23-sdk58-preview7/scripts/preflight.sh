#!/usr/bin/env bash
# Pre-flight for session 23. Run as: bash $TMPDIR/preflight-23.sh <k>
# <k> is the first step in PLAN.md section 6 not ticked DONE (1 for a new plan).
set -u

REPO=/Users/muji/repos/rn.athan.uk
PLAN=$REPO/ai/plans/23-sdk58-preview7
A=$PLAN/scripts/anchors
K=${1:-1}
fail() { echo "PREFLIGHT FAIL: $*"; exit 1; }

# --- where we are ---
cd "$REPO" 2>/dev/null || fail "cannot cd to $REPO"
[ "$(pwd -P)" = "$(cd "$REPO" && pwd -P)" ] || fail "not in $REPO"
BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || fail "on '$BRANCH', expected uat-2"

# --- the tree holds nothing but this plan's own bookkeeping ---
DIRT=$(git status --porcelain | grep -vE ' (ai/plans/README\.md|ai/plans/23-sdk58-preview7/(PLAN|LOG)\.md)$' || true)
[ -z "$DIRT" ] && echo "tree clean (bar plan bookkeeping)" || fail "unexpected changes:
$DIRT"

# --- uat-2 is not behind origin ---
git fetch -q origin uat-2 || fail "git fetch failed"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "uat-2 is behind origin/uat-2"
echo "uat-2 is at or ahead of origin/uat-2"

# --- version is not below the planned-at version ---
V=$(node -p "require('./package.json').version")
echo "package.json version: $V"
node -e '
  const a="1.28.33".split(".").map(Number), b=process.argv[1].split(".").map(Number);
  for (let i=0;i<3;i++){ if((b[i]||0)>(a[i]||0)) process.exit(0); if((b[i]||0)<(a[i]||0)) process.exit(1); }
' "$V" || fail "version $V is below the planned-at 1.28.33"

# --- Needs first: nothing ---
echo "needs-first: nothing"

# --- tools ---
command -v node >/dev/null || fail "node missing"
command -v yarn >/dev/null || fail "yarn missing"
command -v python3 >/dev/null || fail "python3 missing"
echo "node $(node -v), yarn $(yarn -v), git $(git --version | awk '{print $3}')"

# --- anchors, for steps k onward only ---
count() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"; }
check() { # step anchorfile sourcefile
  [ "$K" -le "$1" ] || return 0
  n=$(count "$2" "$3") || fail "cannot read $2 or $3"
  [ "$n" = "1" ] || fail "anchor $(basename "$2") counted $n in $3, expected 1 (NEEDS REPLAN)"
  echo "anchor $(basename "$2") = 1"
}
check 1 "$A/1-1.txt" widgets/PrayerWidget.tsx
check 1 "$A/1-2.txt" widgets/PrayerWidget.tsx
check 1 "$A/1-3.txt" shared/__tests__/widgetOpenAppPatch.test.ts

# --- the patches this plan rebuilds are the ones present ---
if [ "$K" -le 1 ]; then
  for p in expo-background-task expo-widgets; do
    ls patches/$p+58.0.3.patch >/dev/null 2>&1 \
      || fail "patches/$p+58.0.3.patch is missing; step 1 rebuilds it and expects it here"
  done
  echo "both 58.0.3 patches present, as step 1 expects"
fi

# --- the target versions are still what the plan names ---
python3 - "$K" <<'PY' || exit 1
import json, sys, urllib.request
# step -> {package: planned dist-tag value}
want = {
  1: {"expo": ("next", "58.0.0-preview.7")},
  2: {"react": ("latest", "19.3.0"), "react-native": ("next", "0.88.0-rc.2")},
  3: {"react-native-reanimated": ("latest", "4.7.0"), "react-native-worklets": ("latest", "0.13.0")},
}
k = int(sys.argv[1])
for step, pkgs in sorted(want.items()):
    if k > step:
        continue
    for name, (tag, planned) in pkgs.items():
        url = "https://registry.npmjs.org/" + name.replace("/", "%2f")
        try:
            tags = json.load(urllib.request.urlopen(url, timeout=20))["dist-tags"]
        except Exception as e:
            print(f"note: could not reach the registry for {name} ({e}); skipping its freshness check")
            continue
        actual = tags.get(tag)
        if actual != planned:
            print(f"PREFLIGHT FAIL: {name} {tag} is now {actual}, not the planned {planned} "
                  f"(PLAN.md section 2.2, item 4)")
            sys.exit(1)
        print(f"{name}: {tag} is still {planned}")
PY

echo "PREFLIGHT OK"
