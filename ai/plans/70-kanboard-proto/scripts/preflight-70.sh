#!/usr/bin/env bash
# Pre-flight for ticket 70. Run from a saved copy in $TMPDIR against the checkout.
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "not a git repo"; exit 1; }
fail=0
step() { printf '%s\n' "$1"; }
die() { printf 'PREFLIGHT FAILED: %s\n' "$1"; exit 1; }

[ "$(git branch --show-current)" = "uat" ] || die "checkout is not on uat"
[ -z "$(git status --porcelain)" ] || die "tree is not clean"
git fetch origin -q
merge_base="$(git merge-base HEAD origin/uat)"
[ "$(git rev-parse origin/uat)" = "$merge_base" ] || die "origin/uat has unmerged commits"

version="$(node -p "require('./package.json').version")"
node -e "const a=process.argv[1].split('.').map(Number),b='2.0.1085'.split('.').map(Number);process.exit(a>=b?0:1)" "$version" || die "version $version is below the planned 2.0.1085"

count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
expect_one() {
  local n
  n="$(count_anchor "$1" "$2")"
  [ "$n" = "1" ] || die "anchor $3 matches $n times, expected 1"
}
plan_anchors="ai/plans/70-kanboard-proto/scripts/anchors"
expect_one "$plan_anchors/reader-statusmap.txt" board/reader.mjs reader-statusmap
expect_one "$plan_anchors/board-columns.txt" board/index.html board-columns
expect_one "$plan_anchors/board-palette.txt" board/index.html board-palette
expect_one "$plan_anchors/board-compose.txt" board/docker-compose.yml board-compose
expect_one "$plan_anchors/opencode-mcp.txt" opencode.json opencode-mcp
expect_one "$plan_anchors/package-scripts.txt" package.json package-scripts
expect_one "$plan_anchors/queue-header.txt" ai/plans/README.md queue-header
expect_one "$plan_anchors/queue-rows.txt" ai/plans/README.md queue-rows

if command -v docker >/dev/null 2>&1; then
  step "docker CLI present (needed by step 4 only)"
else
  step "WARN: docker CLI absent; steps 1-3 proceed, step 4 live proof will block"
fi

step "PREFLIGHT OK"
