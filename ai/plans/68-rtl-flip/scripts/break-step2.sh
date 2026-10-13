#!/usr/bin/env bash
# Ticket 68 step 2 break. Run from the repository root with uat holding step 2.
set -u
cp components/sheets/parts/SegmentedControl.tsx "$TMPDIR/break68-seg.tsx.bak"

python3 - <<'PYEOF'
import pathlib
p = pathlib.Path('components/sheets/parts/SegmentedControl.tsx')
s = p.read_text()
old = "(isRTL ? options.length - 1 - selectedIndex : selectedIndex) * 100"
new = "(false ? options.length - 1 - selectedIndex : selectedIndex) * 100"
assert s.count(old) == 2, f"break substitution found {s.count(old)} times, expected 2"
p.write_text(s.replace(old, new))
print("break applied: the pill ignores the direction")
PYEOF

npx jest components/sheets/parts/__tests__/SegmentedControl.test.tsx -t 'RTL' --watchman=false --selectProjects=components > "$TMPDIR/break68b.log" 2>&1
if grep -q 'translateX' "$TMPDIR/break68b.log" && grep -q 'Expected' "$TMPDIR/break68b.log"; then
  echo "caught: the pill no longer mirrors"
  cp "$TMPDIR/break68-seg.tsx.bak" components/sheets/parts/SegmentedControl.tsx
  rm "$TMPDIR/break68-seg.tsx.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break68-seg.tsx.bak" components/sheets/parts/SegmentedControl.tsx
rm "$TMPDIR/break68-seg.tsx.bak"
echo "BREAK NOT APPLIED (the RTL pill case did not fail)"
exit 1
