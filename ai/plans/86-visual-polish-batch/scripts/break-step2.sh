#!/usr/bin/env bash
# Ticket 86 step 2 break. Run from the repository root with uat holding step 2.
set -u
cp components/sheets/screens/Alert.tsx "$TMPDIR/break86-alert.tsx.bak"

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/sheets/screens/Alert.tsx')
s = p.read_text()
old = "      <Note text={t(Platform.OS === 'android' ? 'volume.note.android' : 'volume.note.ios')} />\n"
new = ""
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
p.write_text(s)
print("break applied: the alert sheet's note removed from under the header")
EOF

npx jest components/sheets/screens/__tests__/Alert.test.tsx -t 'under the header, above the Athan card' --watchman=false --selectProjects=components > "$TMPDIR/break86-step2.log" 2>&1
if grep -q 'carries the volume note under the header' "$TMPDIR/break86-step2.log"; then
  echo "caught: the note is gone from the alert sheet"
  cp "$TMPDIR/break86-alert.tsx.bak" components/sheets/screens/Alert.tsx
  rm "$TMPDIR/break86-alert.tsx.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break86-alert.tsx.bak" components/sheets/screens/Alert.tsx
rm "$TMPDIR/break86-alert.tsx.bak"
echo "BREAK NOT APPLIED (the note's removal did not fail the order case)"
exit 1
