#!/usr/bin/env bash
# Ticket 68 step 1 break. Run from the repository root with uat holding step 1.
set -u
cp stores/language.ts "$TMPDIR/break68-lang.ts.bak"

python3 - <<'PYEOF'
import pathlib
p = pathlib.Path('stores/language.ts')
s = p.read_text()
old = "if (localeDirection(locale) !== directionBefore) {"
new = "if (false && localeDirection(locale) !== directionBefore) {"
assert s.count(old) == 1, "break substitution not found once"
p.write_text(s.replace(old, new))
print("break applied: the boundary restart never fires")
PYEOF

npx jest stores/__tests__/rtlSwitch.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/break68a.log" 2>&1
if grep -q 'Received number of calls: 0' "$TMPDIR/break68a.log" && grep -q 'crossing to ar' "$TMPDIR/break68a.log"; then
  echo "caught: the boundary crossing no longer relaunches"
  cp "$TMPDIR/break68-lang.ts.bak" stores/language.ts
  rm "$TMPDIR/break68-lang.ts.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break68-lang.ts.bak" stores/language.ts
rm "$TMPDIR/break68-lang.ts.bak"
echo "BREAK NOT APPLIED (the crossing case did not fail)"
exit 1
