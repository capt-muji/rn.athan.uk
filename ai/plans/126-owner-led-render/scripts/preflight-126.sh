#!/usr/bin/env bash
# Job 126 pre-flight. Save a copy to $TMPDIR and run it from the lane worktree root.
set -u
fail=0
step() { printf '%s\n' "$*"; }

W="$(pwd)"
BRANCH="$(git branch --show-current)"
if [ "$BRANCH" != "lane/126" ]; then step "FAIL: expected branch lane/126, on $BRANCH"; fail=1; fi

BASE_CONTAINS="$(git merge-base --is-ancestor 7e029a34 HEAD && echo yes || echo no)"
if [ "$BASE_CONTAINS" != "yes" ]; then step "FAIL: HEAD is not at or past the planned-at sha 7e029a34"; fail=1; fi

STATUS="$(git status --porcelain)"
if [ -n "$STATUS" ]; then step "FAIL: tree not clean:"; step "$STATUS"; fail=1; fi

git fetch -q origin uat || { step "FAIL: origin fetch failed"; fail=1; }
VERSION="$(node -p "require('./package.json').version")"
if [ "$(printf '%s\n2.0.958\n' "$VERSION" | sort -V | head -1)" != "2.0.958" ]; then
  step "FAIL: version $VERSION below the planned 2.0.958"; fail=1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 24 ]; then step "FAIL: node $NODE_MAJOR below 24"; fail=1; fi

PLAN="ai/plans/126-owner-led-render"
for a in "$PLAN"/scripts/anchors/*.anchor; do
  name="$(basename "$a" .anchor)"
  case "$name" in
    reader-*) src="board/reader.mjs" ;;
    template-*) src="board/index.html" ;;
  esac
  count="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$a" "$src")"
  if [ "$count" != "1" ]; then step "FAIL: anchor $name counts $count in $src"; fail=1; fi
done

if [ -f board/tests/reader.test.mjs ] && node --test 'board/tests/*.test.mjs' >/dev/null 2>&1; then
  step "FAIL: the suite already passes; the step's red phase cannot run"; fail=1
else
  step "suite baseline red (absent or failing): the red phase can run"
fi

[ "$fail" -eq 0 ] && echo "PREFLIGHT OK" || echo "PREFLIGHT FAILED"
exit "$fail"
