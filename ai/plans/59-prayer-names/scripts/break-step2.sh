#!/usr/bin/env bash
# Ticket 59 step 2 break. Run from the repository root with uat holding step 2.
set -u
cp stores/ui.ts $TMPDIR/break59-ui.ts.bak

python3 - <<'EOF'
import pathlib
p = pathlib.Path('stores/ui.ts')
s = p.read_text()
old = "  if (width <= cached) return;"
assert s.count(old) == 1, "break substitution not found once"
p.write_text(s.replace(old, ""))
print("break applied: grow-toward-truth guard removed")
EOF

npx jest stores/__tests__/ui.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break59b.log 2>&1
if grep -q "never narrows the cache" $TMPDIR/break59b.log; then
  echo "caught: the cache accepts a narrowing measure"
  cp $TMPDIR/break59-ui.ts.bak stores/ui.ts
  rm $TMPDIR/break59-ui.ts.bak
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp $TMPDIR/break59-ui.ts.bak stores/ui.ts
rm $TMPDIR/break59-ui.ts.bak
echo "BREAK NOT APPLIED (the widen-only suite did not fail)"
exit 1
