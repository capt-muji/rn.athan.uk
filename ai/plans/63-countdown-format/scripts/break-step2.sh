#!/usr/bin/env bash
# Ticket 63 step 2 break. Run from the repository root with uat holding step 2.
set -u
cp shared/i18n/en.ts $TMPDIR/break63-en.ts.bak

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/i18n/en.ts')
s = p.read_text()
old = "'notification.reminder': '{name} in {n}',"
new = "'notification.reminder': '{name} in {n}m',"
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
p.write_text(s)
print("break applied: unit token restored in en notification.reminder")
EOF

npx jest shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break63-c.log 2>&1
grep -q 'Expected: "Fajr in 15"' $TMPDIR/break63-c.log && grep -q 'Received: "Fajr in 15m"' $TMPDIR/break63-c.log && {
  echo "caught: reminder title regains the unit token"
  cp $TMPDIR/break63-en.ts.bak shared/i18n/en.ts
  rm $TMPDIR/break63-en.ts.bak
  echo "ALL AS EXPECTED: 1"
  exit 0
}
cp $TMPDIR/break63-en.ts.bak shared/i18n/en.ts
rm $TMPDIR/break63-en.ts.bak
echo "BREAK NOT APPLIED (the notifications suite did not catch the restored token)"
exit 1
