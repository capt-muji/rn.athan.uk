#!/usr/bin/env bash
# Anchor check for job 56. Every anchor must count exactly 1 in its source file.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
A=ai/plans/56-ticket-board/scripts/anchors
fail=0
count() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check() {
  local n
  n=$(count "$A/$1" "$2")
  if [ "$n" != "1" ]; then
    echo "anchor $1 in $2: count $n (must be 1)"
    fail=1
  fi
}
check A1-unmeasured-entry.txt scripts/check-changed-coverage.js
check A2-biome-files.txt biome.json
check A3-executor-ledger.txt .opencode/agents/athan-executor.md
check A4-template-records.txt ai/plans/TEMPLATE.md
check A5-readme-howwork.txt README.md
check A6-readme-layout.txt README.md
if [ "$fail" -ne 0 ]; then
  echo 'ANCHORS FAILED'
  exit 1
fi
echo 'ANCHORS OK'
