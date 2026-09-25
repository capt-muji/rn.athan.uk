#!/usr/bin/env bash
# Pre-flight for session 21. Run as: bash $TMPDIR/preflight-21.sh <k>
# <k> is the first step in PLAN.md section 6 not ticked DONE (1 for a new plan).
set -u

REPO=/Users/muji/repos/rn.athan.uk
PLAN=$REPO/ai/plans/21-bump-everything-latest
A=$PLAN/scripts/anchors
K=${1:-1}
fail() { echo "PREFLIGHT FAIL: $*"; exit 1; }

# --- where we are ---
cd "$REPO" 2>/dev/null || fail "cannot cd to $REPO"
[ "$(pwd -P)" = "$(cd "$REPO" && pwd -P)" ] || fail "not in $REPO"
BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || fail "on '$BRANCH', expected uat-2"

# --- the tree holds nothing but this plan's own bookkeeping ---
DIRT=$(git status --porcelain | grep -vE ' (ai/plans/README\.md|ai/plans/21-bump-everything-latest/(PLAN|LOG)\.md)$' || true)
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
  const a="1.27.384".split(".").map(Number), b=process.argv[1].split(".").map(Number);
  for (let i=0;i<3;i++){ if((b[i]||0)>(a[i]||0)) process.exit(0); if((b[i]||0)<(a[i]||0)) process.exit(1); }
' "$V" || fail "version $V is below the planned-at 1.27.384"

# --- Needs first: nothing ---
echo "needs-first: nothing"

# --- tools ---
command -v node >/dev/null || fail "node missing"
command -v yarn >/dev/null || fail "yarn missing"
command -v python3 >/dev/null || fail "python3 missing"
echo "node $(node -v), yarn $(yarn -v), git $(git --version | awk '{print $3}')"

# lint-staged 17 (step 6) and husky 9 (step 7) set floors; check them once, here
node -e '
  const [maj,min,pat]=process.version.slice(1).split(".").map(Number);
  if (maj>22 || (maj===22 && (min>22 || (min===22 && pat>=1)))) process.exit(0);
  process.exit(1);
' || fail "node $(node -v) is below lint-staged 17's floor of 22.22.1"
python3 - <<'PY' || exit 1
import subprocess, sys
v = subprocess.check_output(["git","--version"]).decode().split()[2]
parts = [int(p) for p in v.split(".")[:3] if p.isdigit()]
while len(parts) < 3: parts.append(0)
if tuple(parts) < (2,32,0):
    print(f"PREFLIGHT FAIL: git {v} is below lint-staged 17's floor of 2.32.0"); sys.exit(1)
print(f"git {v} clears lint-staged 17's floor")
PY

# --- anchors, for steps k onward only ---
count() { python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"; }
check() { # step anchorfile sourcefile
  [ "$K" -le "$1" ] || return 0
  n=$(count "$2" "$3") || fail "cannot read $2 or $3"
  [ "$n" = "1" ] || fail "anchor $(basename "$2") counted $n in $3, expected 1 (NEEDS REPLAN)"
  echo "anchor $(basename "$2") = 1"
}
check 1 "$A/1-1.txt" biome.json
check 7 "$A/7-1.txt" shared/__tests__/qualityGate.test.ts
check 7 "$A/7-2.txt" .husky/pre-commit
check 8 "$A/8-1.txt" stores/sync.ts
check 8 "$A/8-2.txt" stores/sync.ts
check 8 "$A/8-3.txt" jest.config.js
check 8 "$A/8-4.txt" jest.config.js
check 8 "$A/8-5.txt" jest.components.setup.js
check 8 "$A/8-6.txt" jest.components.setup.js

echo "PREFLIGHT OK"
