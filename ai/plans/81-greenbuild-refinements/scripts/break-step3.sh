#!/usr/bin/env bash
# Ticket 81 step 3 break. Run on uat after the step 3 merge.
set -u
cp components/prayer/Time.tsx $TMPDIR/break81-timetsx.tsx.bak
fails=0

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/prayer/Time.tsx')
s = p.read_text()
old_gap = "{'\\u2009\\u2009:\\u2009\\u2009'}"
new_gap = "{'\\u2009:\\u2009'}"
old_opacity = "  colon: {\n    opacity: 0.4,\n  },"
new_opacity = ""
for old, new, label in ((old_gap, new_gap, "doubled gap"), (old_opacity, new_opacity, "colon opacity")):
    assert s.count(old) == 1, f"break substitution not found: {label}"
    s = s.replace(old, new)
p.write_text(s)
print("break applied: single gap, no colon opacity")
EOF
npx jest components/prayer/__tests__/Time.test.tsx --watchman=false --selectProjects=components > $TMPDIR/break81-s3.log 2>&1
grep -qF "Unable to find an element" $TMPDIR/break81-s3.log && echo "caught: gap back to single" && fails=$((fails+1))
grep -qF "Expected: 0.4" $TMPDIR/break81-s3.log && echo "caught: colon opacity gone" && fails=$((fails+1))
cp $TMPDIR/break81-timetsx.tsx.bak components/prayer/Time.tsx
rm $TMPDIR/break81-timetsx.tsx.bak

git diff --quiet -- components/prayer/Time.tsx || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 2 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 2 catches fired)"
  exit 1
fi