#!/usr/bin/env bash
# Ticket 86 step 5 break. Run from the repository root with uat holding step 5.
set -u
cp components/sheets/screens/languageSheet.ts "$TMPDIR/break86-sheet.ts.bak"

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/sheets/screens/languageSheet.ts')
s = p.read_text()
old = "  dismiss();\n  commit(id).catch(() => undefined);"
new = "  commit(id)\n    .catch(() => undefined)\n    .then(dismiss);"
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
p.write_text(s)
print("break applied: the dismissal waited for the commit again")
EOF

npx jest components/sheets/__tests__/Language.test.tsx -t 'dismisses at once' --watchman=false --selectProjects=components > "$TMPDIR/break86-step5.log" 2>&1
if grep -q 'dismisses at once, with no applying row' "$TMPDIR/break86-step5.log"; then
  echo "caught: the sheet stayed open until the commit settled"
  cp "$TMPDIR/break86-sheet.ts.bak" components/sheets/screens/languageSheet.ts
  rm "$TMPDIR/break86-sheet.ts.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break86-sheet.ts.bak" components/sheets/screens/languageSheet.ts
rm "$TMPDIR/break86-sheet.ts.bak"
echo "BREAK NOT APPLIED (the deferred dismissal did not fail the at-once case)"
exit 1
