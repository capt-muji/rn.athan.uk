#!/usr/bin/env bash
# Job 126 break script: six mutants, each must redden the suite, each restored.
# Run with bash from the worktree root. Ends ALL AS EXPECTED: 6 on success.
set -u
expected=0
restore() {
  if [ -f "$1.bak" ]; then mv "$1.bak" "$1"; fi
}
trap 'restore board/reader.mjs; restore board/index.html' EXIT

run_suite() {
  node --test 'board/tests/*.test.mjs' >/dev/null 2>&1
}

mutate() {
  # mutate <file> <replacement-number> <perl-program>
  # All of one mutant's substitutions run in one perl pass against one pristine backup.
  cp "$1" "$1.bak"
  perl -pi -e "$3" "$1"
  if cmp -s "$1" "$1.bak"; then
    echo "BREAK NOT APPLIED: substitution missed in $1: $3"
    exit 1
  fi
}

expect_red() {
  if run_suite; then echo "$1 STAYED GREEN"; exit 1; else echo "$1 red as expected"; fi
}

echo "M1: DONE guard startsWith -> includes"
mutate board/reader.mjs 1 "s/\QstatusCell.startsWith('DONE')\E/statusCell.includes('DONE')/g; s/\Qstatus.startsWith('DONE')\E/status.includes('DONE')/g"
expect_red M1
expected=$((expected + 1))
restore board/reader.mjs

echo "M2: OWNER-LED column -> Blocked"
mutate board/reader.mjs 2 "s/\Q['OWNER-LED', 'Owner-led'],\E/['OWNER-LED', 'Blocked'],/"
expect_red M2
expected=$((expected + 1))
restore board/reader.mjs

echo "M3: waitingLine returns null"
mutate board/reader.mjs 3 "s/\Qreturn text.slice(0, 140);\E/return null;/"
expect_red M3
expected=$((expected + 1))
restore board/reader.mjs

echo "M4: awaitingOwner forced false"
mutate board/reader.mjs 4 "s/\Qconst awaitingOwner = mapped.status === 'OWNER-LED';\E/const awaitingOwner = false;/"
expect_red M4
expected=$((expected + 1))
restore board/reader.mjs

echo "M5: badge wording reverted"
mutate board/index.html 5 "s/\QAwaiting owner\E/Owner steered/"
expect_red M5
expected=$((expected + 1))
restore board/index.html

echo "M6: waiting line wiring dropped"
mutate board/index.html 6 "s/\Qif (ticket.awaitingOwner) card.append(waitingEl(ticket));\E/if (false) card.append(waitingEl(ticket));/"
expect_red M6
expected=$((expected + 1))
restore board/index.html

echo "M7: displayColumn owner-led exclusion dropped"
mutate board/index.html 7 "s/\Qticket.status !== 'DONE' && ticket.status !== 'OWNER-LED' && unmetOf(ticket).length > 0\E/ticket.status !== 'DONE' && unmetOf(ticket).length > 0/"
expect_red M7
expected=$((expected + 1))
restore board/index.html

echo "ALL AS EXPECTED: $expected"
[ "$expected" -eq 7 ]
