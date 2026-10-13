#!/usr/bin/env bash
# Ticket 81 step 3 break. Run on uat after the step 3 merge. Two restored
# phases, so each catch fires on its own failing line.
set -u
cp components/prayer/Time.tsx $TMPDIR/break81-timetsx.tsx.bak
fails=0

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/prayer/Time.tsx')
s = p.read_text()
old = "{'\\u2009\\u2009:\\u2009\\u2009'}"
new = "{'\\u2009:\\u2009'}"
assert s.count(old) == 1, "break substitution not found: doubled gap"
p.write_text(s.replace(old, new))
print("break applied: gap back to single thin spaces")
EOF
npx jest components/prayer/__tests__/Time.test.tsx --watchman=false --selectProjects=components > $TMPDIR/break81-s3a.log 2>&1
grep -qF "Unable to find an element" $TMPDIR/break81-s3a.log && echo "caught: gap back to single" && fails=$((fails+1))
cp $TMPDIR/break81-timetsx.tsx.bak components/prayer/Time.tsx

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/prayer/Time.tsx')
s = p.read_text()
old = "  colon: {\n    opacity: 0.4,\n  },"
new = "  colon: {\n    opacity: 1,\n  },"
assert s.count(old) == 1, "break substitution not found: colon opacity"
p.write_text(s.replace(old, new))
print("break applied: colon opacity to 1")
EOF
npx jest components/prayer/__tests__/Time.test.tsx --watchman=false --selectProjects=components > $TMPDIR/break81-s3b.log 2>&1
grep -qF "Expected: 0.4" $TMPDIR/break81-s3b.log && echo "caught: colon opacity gone" && fails=$((fails+1))
cp $TMPDIR/break81-timetsx.tsx.bak components/prayer/Time.tsx
rm $TMPDIR/break81-timetsx.tsx.bak

git diff --quiet -- components/prayer/Time.tsx || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 2 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 2 catches fired)"
  exit 1
fi