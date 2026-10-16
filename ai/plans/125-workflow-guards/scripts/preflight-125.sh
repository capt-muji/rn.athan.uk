#!/usr/bin/env bash
# Pre-flight for ticket 125. Save a copy to $TMPDIR and run it from the lane
# worktree root: bash "$TMPDIR/preflight-125.sh" with cwd at the worktree.
set -u
fail=0
say() { echo "PREFLIGHT FAIL: $1"; fail=1; }

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[ "$branch" = "lane/125" ] || say "not on lane/125 (on ${branch:-nothing})"
[ -z "$(git status --porcelain)" ] || say "tree not clean"

git fetch -q origin uat 2>/dev/null
base=$(git merge-base HEAD origin/uat)
[ "$(git rev-parse origin/uat)" = "$base" ] || say "origin/uat not merged in"

v=$(node -e "console.log(require('./app.json').expo.version)")
python3 -c "import sys; sys.exit(0 if tuple(int(x) for x in '$v'.split('.')) >= (2,0,939) else 1)" || \
  say "version $v below the 2.0.939 step-1 floor"

# Sibling-owned files must be untouched by this branch.
for f in e2e/README.md ai/UPSTREAM-PRS.md ai/plans/SDK58-PROGRAMME.md; do
  git diff --name-only 455571f8..HEAD -- "$f" | grep -q . && say "branch touches sibling-owned $f"
done

# Git-verified anchors count exactly 1 at the planned-at sha.
for a in prepare-line:package.json \
         unmeasured-scripts:scripts/check-changed-coverage.js \
         lane-fresh-worktree:.opencode/agents/athan-lane.md \
         lane-locks-bullet:.opencode/agents/athan-lane.md \
         lead-hand-range:.agents/skills/athan-lead/SKILL.md \
         reviewer-diff-file:.opencode/agents/athan-reviewer.md \
         pre-push-head:.husky/pre-push; do
  n="${a%%:*}"; t="${a##*:}"
  p="ai/plans/125-workflow-guards/scripts/anchors/$n.txt"
  [ -f "$p" ] || { say "anchor file missing: $n"; continue; }
  c=$(git show "455571f8:$t" | python3 -c 'import sys; print(sys.stdin.read().count(open(sys.argv[1]).read().rstrip("\n")))' "$p")
  [ "$c" = "1" ] || say "anchor $n counts $c (want 1)"
done

# The husky shim anchor is checked against the live worktree file: .husky/_ is
# gitignored and absent from every sha, present wherever an install ran.
p="ai/plans/125-workflow-guards/scripts/anchors/husky-shim-resolution.txt"
if [ -f ".husky/_/h" ]; then
  c=$(python3 -c 'import sys; print(open(".husky/_/h").read().count(open(sys.argv[1]).read().rstrip("\n")))' "$p")
  [ "$c" = "1" ] || say "anchor husky-shim-resolution counts $c in .husky/_/h (want 1)"
else
  say "no .husky/_/h in this worktree: run yarn install before executing"
fi

[ "$fail" = "0" ] && echo "PREFLIGHT OK"
exit "$fail"
