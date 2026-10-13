#!/usr/bin/env bash
# Ticket 72 step 3 break. Run from the repository root with uat holding step 3.
set -u
cp shared/i18n/en.ts $TMPDIR/break72-en.ts.bak

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/i18n/en.ts')
s = p.read_text()
# Drop the unit word from the en channel label: the reverted copy breaks.
old_value = "'channel.reminder': '{name} in {n}m Reminder',"
new_value = "'channel.reminder': '{name} in {n} Reminder',"
assert s.count(old_value) == 1, "en channel value not found once"
s = s.replace(old_value, new_value)
p.write_text(s)
print("break applied: en channel label lost its unit word")
EOF

fails=0
npx jest shared/__tests__/prayerIdContract.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break72-e.log 2>&1
grep -qF 'pins the channel-name formats in English' $TMPDIR/break72-e.log && grep -qF 'FAIL' $TMPDIR/break72-e.log && echo "caught: contract pin on the channel format" && fails=$((fails+1))
npx jest shared/__tests__/catalogLock.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break72-f.log 2>&1
grep -qF 'FAIL shared/__tests__/catalogLock.test.ts' $TMPDIR/break72-f.log && echo "caught: en hash drifted from the lock" && fails=$((fails+1))

cp $TMPDIR/break72-en.ts.bak shared/i18n/en.ts
rm $TMPDIR/break72-en.ts.bak
git diff --quiet -- shared/i18n/en.ts || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 2 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 2 catches fired)"
  exit 1
fi
