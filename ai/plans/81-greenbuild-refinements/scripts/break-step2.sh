#!/usr/bin/env bash
# Ticket 81 step 2 break. Run on uat after the step 2 merge.
set -u
cp components/countdown/Countdown.tsx $TMPDIR/break81-countdown.tsx.bak
cp shared/typography.ts $TMPDIR/break81-typography.ts.bak
fails=0

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/countdown/Countdown.tsx')
s = p.read_text()
old = "{'\\u2009\\u2009:\\u2009\\u2009'}"
new = "{'\\u2009:\\u2009'}"
assert s.count(old) == 1, "break substitution not found: doubled gap"
p.write_text(s.replace(old, new))
print("break applied: timer gap back to single thin spaces")
EOF
npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false --selectProjects=components > $TMPDIR/break81-s2a.log 2>&1
grep -qF "Unable to find an element" $TMPDIR/break81-s2a.log && echo "caught: single gap again" && fails=$((fails+1))
cp $TMPDIR/break81-countdown.tsx.bak components/countdown/Countdown.tsx

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/typography.ts')
s = p.read_text()
old = "  countdownSize: TEXT.sizeLarge - 2,"
new = "  countdownSize: TEXT.sizeLarge,"
assert s.count(old) == 1, "break substitution not found: ar countdown size"
p.write_text(s.replace(old, new))
print("break applied: ar countdown back to 26")
EOF
npx jest shared/__tests__/typography.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break81-s2b.log 2>&1
grep -qF "Expected: 24" $TMPDIR/break81-s2b.log && echo "caught: ar countdown size 26 again" && fails=$((fails+1))
cp $TMPDIR/break81-typography.ts.bak shared/typography.ts
rm $TMPDIR/break81-countdown.tsx.bak $TMPDIR/break81-typography.ts.bak

git diff --quiet -- components/countdown/Countdown.tsx shared/typography.ts || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 2 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 2 catches fired)"
  exit 1
fi