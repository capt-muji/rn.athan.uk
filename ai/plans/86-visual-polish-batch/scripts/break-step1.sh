#!/usr/bin/env bash
# Ticket 86 step 1 break. Run from the repository root with uat holding step 1.
set -u
cp shared/typography.ts "$TMPDIR/break86-typography.ts.bak"

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/typography.ts')
s = p.read_text()
old = "  blockLineHeight: (n) => Math.round(n * LATIN_LINE_RATIO),"
new = "  blockLineHeight: (n) => Math.round(n * 1.5),"
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
p.write_text(s)
print("break applied: the ar box back to the 1.5x script box")
EOF

npx jest components/__tests__/typographySweep.test.tsx -t 'Latin default box' --watchman=false --selectProjects=components > "$TMPDIR/break86-step1.log" 2>&1
if grep -q 'the ar title and subtitle the Latin default box' "$TMPDIR/break86-step1.log"; then
  echo "caught: the ar title box is 33 again, so the gap returns"
  cp "$TMPDIR/break86-typography.ts.bak" shared/typography.ts
  rm "$TMPDIR/break86-typography.ts.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break86-typography.ts.bak" shared/typography.ts
rm "$TMPDIR/break86-typography.ts.bak"
echo "BREAK NOT APPLIED (the ar title box did not move to 33)"
exit 1
