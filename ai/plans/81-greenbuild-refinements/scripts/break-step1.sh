#!/usr/bin/env bash
# Ticket 81 step 1 break. Run on uat after the step 1 merge.
set -u
cp shared/time.ts $TMPDIR/break81-time.ts.bak
fails=0

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/time.ts')
s = p.read_text()
old = "    const isSeconds = groups.length === 3 && index === 2;\n    sections.push({ text: group, dim: !isSeconds && ALL_ZEROS.test(group), colon: false });"
new = "    sections.push({ text: group, dim: ALL_ZEROS.test(group), colon: false });"
assert s.count(old) == 1, "break substitution not found: seconds carve"
p.write_text(s.replace(old, new))
print("break applied: seconds carve removed")
EOF
npx jest shared/__tests__/time.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break81-s1.log 2>&1
grep -qF "Expected: false" $TMPDIR/break81-s1.log && echo "caught: seconds dim again" && fails=$((fails+1))
cp $TMPDIR/break81-time.ts.bak shared/time.ts
rm $TMPDIR/break81-time.ts.bak

git diff --quiet -- shared/time.ts || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 1 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 1 catches fired)"
  exit 1
fi