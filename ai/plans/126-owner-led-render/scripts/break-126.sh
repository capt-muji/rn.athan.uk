#!/usr/bin/env bash
# Job 126 break script: five mutants, each must redden the suite, each restored.
# Run with bash from the worktree root. Ends ALL AS EXPECTED: 5 on success.
set -u
expected=0
restore() {
  if [ -f "$1.bak" ]; then mv "$1.bak" "$1"; fi
}
trap 'restore board/reader.mjs; restore board/index.html' EXIT

run_suite() { node --test 'board/tests/*.test.mjs' >/dev/null 2>&1; }

mutate() {
  # mutate <file> <perl-pattern> <replacement>
  cp "$1" "$1.bak"
  perl -pi -e "s/\Q$2\E/$3/g" "$1"
  if cmp -s "$1" "$1.bak"; then
    echo "BREAK NOT APPLIED: substitution missed in $1: $2"
    exit 1
  fi
}

echo "M1: DONE guard startsWith -> includes"
mutate board/reader.mjs "statusCell.startsWith('DONE')" "statusCell.includes('DONE')"
mutate board/reader.mjs "status.startsWith('DONE')" "status.includes('DONE')"
if run_suite; then echo "M1 STAYED GREEN"; exit 1; else expected=$((expected + 1)); echo "M1 red as expected"; fi
restore board/reader.mjs

echo "M2: OWNER-LED column -> Blocked"
mutate board/reader.mjs "['OWNER-LED', 'Owner-led']," "['OWNER-LED', 'Blocked'],"
if run_suite; then echo "M2 STAYED GREEN"; exit 1; else expected=$((expected + 1)); echo "M2 red as expected"; fi
restore board/reader.mjs

echo "M3: waitingLine returns null"
mutate board/reader.mjs "return text.slice(0, 140);" "return null;"
if run_suite; then echo "M3 STAYED GREEN"; exit 1; else expected=$((expected + 1)); echo "M3 red as expected"; fi
restore board/reader.mjs

echo "M4: awaitingOwner forced false"
mutate board/reader.mjs "const awaitingOwner = mapped.status === 'OWNER-LED';" "const awaitingOwner = false;"
if run_suite; then echo "M4 STAYED GREEN"; exit 1; else expected=$((expected + 1)); echo "M4 red as expected"; fi
restore board/reader.mjs

echo "M5: badge wording reverted"
mutate board/index.html "Awaiting owner" "Owner steered"
if run_suite; then echo "M5 STAYED GREEN"; exit 1; else expected=$((expected + 1)); echo "M5 red as expected"; fi
restore board/index.html

echo "ALL AS EXPECTED: $expected"
[ "$expected" -eq 5 ]
