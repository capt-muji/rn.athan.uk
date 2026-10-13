#!/usr/bin/env bash
# Ticket 82 step 1 break. Run from the repository root with uat holding step 1.
set -u
cp components/countdown/Countdown.tsx $TMPDIR/break82-step1.tsx.bak

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/countdown/Countdown.tsx')
s = p.read_text()
# Re-insert the en render gate: English loses its section nodes again, which is the
# exact locale branch this row removes.
old = "  const sections = splitColonSections(displayTime);"
new = "  const sections = currentLocaleId() === 'en' ? null : splitColonSections(displayTime);"
assert s.count(old) == 1, f"break substitution not found once: {old}"
p.write_text(s.replace(old, new))
print("break applied: the en render gate is back")
EOF

fails=0
npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false --selectProjects=components > $TMPDIR/break82-step1.log 2>&1
grep -qF "Unable to find an element with text: 02" $TMPDIR/break82-step1.log && echo "caught: en renders one node again, the section pins fail" && fails=$((fails+1))

cp $TMPDIR/break82-step1.tsx.bak components/countdown/Countdown.tsx
rm $TMPDIR/break82-step1.tsx.bak
git diff --quiet -- components/countdown/Countdown.tsx || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 1 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 1 catches fired)"
  exit 1
fi
