#!/usr/bin/env bash
# Pre-flight for session 22. Run as: bash $TMPDIR/preflight-22.sh <k>
# <k> is the first step in PLAN.md section 6 not ticked DONE (1 for a new plan).
set -u

REPO=/Users/muji/repos/rn.athan.uk
PLAN=$REPO/ai/plans/22-dependency-freshness-sweep
K=${1:-1}
fail() { echo "PREFLIGHT FAIL: $*"; exit 1; }

# --- where we are ---
cd "$REPO" 2>/dev/null || fail "cannot cd to $REPO"
[ "$(pwd -P)" = "$(cd "$REPO" && pwd -P)" ] || fail "not in $REPO"
BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || fail "on '$BRANCH', expected uat-2"

# --- the tree holds nothing but this plan's own bookkeeping ---
DIRT=$(git status --porcelain | grep -vE ' (ai/plans/README\.md|ai/plans/22-dependency-freshness-sweep/(PLAN|LOG)\.md)$' || true)
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
  const a="1.28.25".split(".").map(Number), b=process.argv[1].split(".").map(Number);
  for (let i=0;i<3;i++){ if((b[i]||0)>(a[i]||0)) process.exit(0); if((b[i]||0)<(a[i]||0)) process.exit(1); }
' "$V" || fail "version $V is below the planned-at 1.28.25"

# --- Needs first: row 20 (session 21) must be DONE ---
grep -qE '^\| 20 \| 21\. Bump every non-SDK package.*\| DONE \|' ai/plans/README.md \
  || fail "row 20 (session 21) is not DONE in ai/plans/README.md"
echo "needs-first: row 20 is DONE"

# --- tools ---
command -v node >/dev/null || fail "node missing"
command -v yarn >/dev/null || fail "yarn missing"
command -v python3 >/dev/null || fail "python3 missing"
echo "node $(node -v), yarn $(yarn -v), git $(git --version | awk '{print $3}')"

# lint-staged 17's floors, checked before step 2 touches the package that enforces them
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

# the lint-staged config must be JSON inside package.json, not a YAML rc file
node -e '
  const c=require("./package.json")["lint-staged"];
  if (!c || typeof c !== "object") { console.log("PREFLIGHT FAIL: lint-staged config is not an object in package.json"); process.exit(1); }
  console.log("lint-staged config is JSON inside package.json");
' || exit 1

# --- anchors ---
# None. Neither step edits a source file, so this plan anchors on nothing;
# the branch, version and floor checks above are the whole gate.
echo "anchors: none (no step edits a source file)"

# --- the versions this plan ships are still the registry's latest ---
# A mover measured on 2026-09-26. If either has moved again, section 2.2 item 5 applies.
python3 - "$K" <<'PY' || exit 1
import json, sys, urllib.request
want = {"@types/node": ("26.6.3", 1), "lint-staged": ("17.6.0", 2)}
k = int(sys.argv[1])
for name, (planned, step) in want.items():
    if k > step:
        continue
    url = "https://registry.npmjs.org/" + name.replace("/", "%2f")
    try:
        latest = json.load(urllib.request.urlopen(url, timeout=20))["dist-tags"]["latest"]
    except Exception as e:
        print(f"note: could not reach the registry for {name} ({e}); skipping the freshness check")
        continue
    if latest != planned:
        print(f"PREFLIGHT FAIL: {name} latest is now {latest}, not the planned {planned} (PLAN.md section 2.2, item 5)")
        sys.exit(1)
    print(f"{name}: latest is still {planned}")
PY

echo "PREFLIGHT OK"
