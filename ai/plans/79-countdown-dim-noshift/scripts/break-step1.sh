#!/usr/bin/env bash
# Ticket 79 step 1 break. Run from the repository root with uat holding step 1.
set -u
cp shared/constants.ts $TMPDIR/break79-constants.ts.bak
cp components/countdown/Countdown.tsx $TMPDIR/break79-countdown.tsx.bak
fails=0

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/constants.ts')
s = p.read_text()
subs = [
    ("dimDigit: 'rgba(255, 255, 255, 0.7)'", "dimDigit: 'rgba(138, 169, 214, 0.38)'", 1),
    ("colon: 'rgba(255, 255, 255, 0.4)'", "colon: 'rgba(138, 169, 214, 0.38)'", 1),
]
for old, new, want in subs:
    assert s.count(old) == want, f"break substitution not found {want} time(s): {old}"
    s = s.replace(old, new)
p.write_text(s)
print("break applied: both dim levels back on the muted colour")
EOF
npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false --selectProjects=components > $TMPDIR/break79-a.log 2>&1
grep -qF 'Expected: "rgba(255, 255, 255, 0.7)"' $TMPDIR/break79-a.log && grep -qF 'Expected: "rgba(255, 255, 255, 0.4)"' $TMPDIR/break79-a.log \
  && echo "caught: both ruled dim levels substituted" && fails=$((fails+1))
cp $TMPDIR/break79-constants.ts.bak shared/constants.ts

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/countdown/Countdown.tsx')
s = p.read_text()
old = "    fontFamily: ty.familyDigits,\n    fontVariant: ['tabular-nums'],\n"
new = "    fontFamily: ty.familyDigits,\n"
assert s.count(old) == 1, "break substitution not found: fontVariant pin"
p.write_text(s.replace(old, new))
print("break applied: tabular pin removed")
EOF
npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false --selectProjects=components > $TMPDIR/break79-b.log 2>&1
grep -qF 'Expected: ["tabular-nums"]' $TMPDIR/break79-b.log \
  && echo "caught: tabular pin removed" && fails=$((fails+1))
cp $TMPDIR/break79-countdown.tsx.bak components/countdown/Countdown.tsx
rm $TMPDIR/break79-constants.ts.bak $TMPDIR/break79-countdown.tsx.bak

git diff --quiet -- shared/constants.ts components/countdown/Countdown.tsx || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 2 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 2 catches fired)"
  exit 1
fi