#!/usr/bin/env bash
# Ticket 64 step 1 break. Run from the repository root with uat holding step 1.
set -u
cp shared/i18n/en.ts "$TMPDIR/break64-en.ts.bak"

python3 - <<'PYEOF'
import pathlib
p = pathlib.Path('shared/i18n/en.ts')
s = p.read_text()
old = "'help.q.volume': 'Which volume controls the sound level?',"
new = "'help.q.volume': 'Why is the athan so quiet?',"
assert s.count(old) == 1, "break substitution not found once"
p.write_text(s.replace(old, new))
print("break applied: the question regresses to the symptom wording")
PYEOF

npx jest shared/__tests__/help.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/break64a.log" 2>&1
if grep -q 'Which volume controls the sound level?' "$TMPDIR/break64a.log" && grep -q 'Why is the athan so quiet?' "$TMPDIR/break64a.log"; then
  echo "caught: the reworded question assertion fails"
  cp "$TMPDIR/break64-en.ts.bak" shared/i18n/en.ts
  rm "$TMPDIR/break64-en.ts.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break64-en.ts.bak" shared/i18n/en.ts
rm "$TMPDIR/break64-en.ts.bak"
echo "BREAK NOT APPLIED (the question assertion did not fail)"
exit 1
