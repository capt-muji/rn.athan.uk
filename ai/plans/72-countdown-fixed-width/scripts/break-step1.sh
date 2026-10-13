#!/usr/bin/env bash
# Ticket 72 step 1 break. Run from the repository root with uat holding step 1.
set -u
cp shared/time.ts $TMPDIR/break72-time.ts.bak

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/time.ts')
s = p.read_text()
# Unpad the fixed-width hours group: the non-en shapes lose their leading zero.
old_shown = "    ? `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}`"
new_shown = "    ? `${hours}:${pad2(minutes)}:${pad2(secs)}`"
old_hidden = "    : `${pad2(hours)}:${pad2(minutes)}`;"
new_hidden = "    : `${hours}:${pad2(minutes)}`;"
# Flip the en dispatch: every locale takes the lettered path and the en pins read colon shapes.
old_dispatch = "currentLocaleId() === 'en'"
new_dispatch = "currentLocaleId() === 'zz'"
for old, new, want in ((old_shown, new_shown, 1), (old_hidden, new_hidden, 1), (old_dispatch, new_dispatch, 2)):
    assert s.count(old) == want, f"break substitution not found {want} time(s): {old}"
    s = s.replace(old, new)
p.write_text(s)
print("break applied: unpadded hours group, en dispatch flipped")
EOF

fails=0
npx jest shared/__tests__/time.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break72-a.log 2>&1
grep -qF 'Expected: "٠٢:٥٩:٠٠"' $TMPDIR/break72-a.log && echo "caught: unpadded fixed-width hours group" && fails=$((fails+1))
npx jest stores/__tests__/countdown.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break72-b.log 2>&1
grep -qF 'Expected: "1h 1m"' $TMPDIR/break72-b.log && echo "caught: en dispatch no longer lettered" && fails=$((fails+1))

cp $TMPDIR/break72-time.ts.bak shared/time.ts
rm $TMPDIR/break72-time.ts.bak
git diff --quiet -- shared/time.ts || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 2 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 2 catches fired)"
  exit 1
fi
