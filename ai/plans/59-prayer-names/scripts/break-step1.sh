#!/usr/bin/env bash
# Ticket 59 step 1 break. Run from the repository root with uat holding step 1.
set -u
cp shared/i18n/ms.ts $TMPDIR/break59-ms.ts.bak

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/i18n/ms.ts')
s = p.read_text()
old = "'prayer.last third': 'Sepertiga malam',"
new = "'prayer.last third': 'Sepertiga akhir malam',"
assert s.count(old) == 1, "break substitution not found once"
p.write_text(s.replace(old, new))
print("break applied: ms Last Third restored to the long phrase")
EOF

npx jest shared/__tests__/catalogGates.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break59a.log 2>&1
if grep -q 'Expected: "Sepertiga malam"' $TMPDIR/break59a.log && grep -q 'Sepertiga akhir malam' $TMPDIR/break59a.log; then
  echo "caught: the long phrase regains the column"
  cp $TMPDIR/break59-ms.ts.bak shared/i18n/ms.ts
  rm $TMPDIR/break59-ms.ts.bak
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp $TMPDIR/break59-ms.ts.bak shared/i18n/ms.ts
rm $TMPDIR/break59-ms.ts.bak
echo "BREAK NOT APPLIED (the D81 pin did not fail)"
exit 1
