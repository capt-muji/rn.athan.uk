#!/bin/bash
# Ticket 119 pre-flight. Run from the lane worktree root
# ($HOME/athan-gitree/worktrees/lane-119). Ends PREFLIGHT OK or names the failed check.
set -u

PLAN_DIR="ai/plans/119-agent-cli-read-only-set"
ANCHORS="$PLAN_DIR/scripts/anchors"
FAILED=0

fail() {
  echo "FAIL: $1"
  FAILED=1
}

# --- worktree on the lane branch, clean, uat contained in HEAD ---
[ "$(git rev-parse --abbrev-ref HEAD)" = "lane/119" ] || fail "not on lane/119"
[ -z "$(git status --porcelain)" ] || fail "tree is not clean"
git rev-parse --verify --quiet uat >/dev/null || fail "uat ref is missing"
[ "$(git rev-list --count HEAD..uat)" = "0" ] || fail "uat holds commits this branch lacks: report NEEDS_CONTEXT, the lane rebases"

# --- hook readiness: an unhooked worktree commit is a measured defect (row 125) ---
[ -x node_modules/.bin/jest ] || fail "node_modules missing: run yarn install under commit.lock before committing"

# --- version not lower than Planned at (2.0.924) ---
VERSION="$(node -p "require('./package.json').version")"
node -e '
const [v, floor] = process.argv.slice(1);
const parse = (s) => s.split(".").map(Number);
const [a, b, c] = parse(v);
const [x, y, z] = parse(floor);
if (a < x || (a === x && (b < y || (b === y && c < z)))) process.exit(1);
' "$VERSION" "2.0.924" || fail "version $VERSION is below the Planned-at floor 2.0.924"

# --- needs first: nothing (the owner's option-B ruling is taken, row 119) ---

# --- anchors: every anchor counts exactly 1 in ai/AGENTS.md ---
for a in "$ANCHORS"/*.md; do
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$a" ai/AGENTS.md)
  [ "$n" = "1" ] || fail "anchor $(basename "$a") counts $n in ai/AGENTS.md, want 1"
done

if [ "$FAILED" = "0" ]; then
  echo "PREFLIGHT OK"
else
  exit 1
fi
