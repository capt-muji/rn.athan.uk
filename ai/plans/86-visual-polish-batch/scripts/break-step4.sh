#!/usr/bin/env bash
# Ticket 86 step 4 break. Run from the repository root with uat holding step 4.
set -u
cp components/countdown/tipGeometry.ts "$TMPDIR/break86-tip.ts.bak"

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/countdown/tipGeometry.ts')
s = p.read_text()
old = "  const raw = isRTL ? COUNTDOWN_BAR.WIDTH - span + COUNTDOWN_TIP.OFFSET : span - COUNTDOWN_TIP.OFFSET;"
new = "  const raw = span - COUNTDOWN_TIP.OFFSET;"
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
p.write_text(s)
print("break applied: the tip ignores the layout direction again")
EOF

npx jest components/countdown/__tests__/tipGeometry.test.ts -t 'mirrors every ordinary position' --watchman=false --selectProjects=unit > "$TMPDIR/break86-step4.log" 2>&1
if grep -q 'mirrors every ordinary position' "$TMPDIR/break86-step4.log"; then
  echo "caught: the RTL tip is back at its LTR left"
  cp "$TMPDIR/break86-tip.ts.bak" components/countdown/tipGeometry.ts
  rm "$TMPDIR/break86-tip.ts.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break86-tip.ts.bak" components/countdown/tipGeometry.ts
rm "$TMPDIR/break86-tip.ts.bak"
echo "BREAK NOT APPLIED (the unmirrored tip did not fail the mirror case)"
exit 1
