#!/usr/bin/env bash
# Ticket 63 step 1 break. Run from the repository root with uat holding step 1.
set -u
cp shared/time.ts $TMPDIR/break63-time.ts.bak

python3 - <<'EOF'
import pathlib
p = pathlib.Path('shared/time.ts')
s = p.read_text()
# Unpad the minute and seconds groups: the colon shapes lose their zero padding.
old_hm = "    : `${hours}:${pad2(minutes)}`;"
new_hm = "    : `${hours}:${minutes}`;"
old_ms = "      : `${minutes}:${pad2(secs)}`"
new_ms = "      : `${minutes}:${secs}`"
old_agp = "  return localiseDigits(`${hours}:${pad2(minutes % 60)}`);"
new_agp = "  return localiseDigits(`${hours}:${minutes % 60}`);"
for old, new in ((old_hm, new_hm), (old_ms, new_ms), (old_agp, new_agp)):
    assert s.count(old) == 1, f"break substitution not found once: {old}"
    s = s.replace(old, new)
p.write_text(s)
print("break applied: pad2 removed from three groups")
EOF

fails=0
npx jest shared/__tests__/time.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break63-a.log 2>&1
grep -q "Expected: \"0:05\"" $TMPDIR/break63-a.log && echo "caught: zero-padded seconds group (0:05)" && fails=$((fails+1))
npx jest stores/__tests__/countdown.test.ts --watchman=false --selectProjects=unit > $TMPDIR/break63-b.log 2>&1
grep -q "Expected: \"1:01\"" $TMPDIR/break63-b.log && echo "caught: zero-padded minute group (1:01)" && fails=$((fails+1))

cp $TMPDIR/break63-time.ts.bak shared/time.ts
rm $TMPDIR/break63-time.ts.bak
if [ "$fails" -eq 2 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 2 catches fired)"
  exit 1
fi
