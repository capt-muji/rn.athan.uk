#!/usr/bin/env bash
# Ticket 72 step 2 break. Run from the repository root with uat holding step 2.
set -u
cp components/countdown/Countdown.tsx $TMPDIR/break72-countdown.tsx.bak
cp components/prayer/Ago.tsx $TMPDIR/break72-ago.tsx.bak

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/countdown/Countdown.tsx')
s = p.read_text()
# Recolour the timer's colon node bright: the always-dim colon rule breaks.
old_colon = "  countdownColon: {\n    color: COLORS.text.muted,\n  },"
new_colon = "  countdownColon: {\n    color: COLORS.text.primary,\n  },"
assert s.count(old_colon) == 1, "colon style not found once in Countdown.tsx"
s = s.replace(old_colon, new_colon)
p.write_text(s)

q = pathlib.Path('components/prayer/Ago.tsx')
t = q.read_text()
# Empty the badge's gap node: the thin-space gaps disappear.
old_gap = "{'\\u2009:\\u2009'}"
new_gap = "{':'}"
assert t.count(old_gap) == 1, "gap node not found once in Ago.tsx"
t = t.replace(old_gap, new_gap)
q.write_text(t)
print("break applied: bright colon node, empty gap node")
EOF

fails=0
npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false --selectProjects=components > $TMPDIR/break72-c.log 2>&1
grep -qF 'renders the colon nodes dim' $TMPDIR/break72-c.log && grep -qF 'FAIL' $TMPDIR/break72-c.log && echo "caught: bright colon node" && fails=$((fails+1))
npx jest components/prayer/__tests__/Ago.test.tsx --watchman=false --selectProjects=components > $TMPDIR/break72-d.log 2>&1
grep -qF 'splits the duration colon with thin-space gaps under ar' $TMPDIR/break72-d.log && grep -qF 'FAIL' $TMPDIR/break72-d.log && echo "caught: emptied gap node" && fails=$((fails+1))

cp $TMPDIR/break72-countdown.tsx.bak components/countdown/Countdown.tsx
cp $TMPDIR/break72-ago.tsx.bak components/prayer/Ago.tsx
rm $TMPDIR/break72-countdown.tsx.bak $TMPDIR/break72-ago.tsx.bak
git diff --quiet -- components/countdown/Countdown.tsx components/prayer/Ago.tsx || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 2 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 2 catches fired)"
  exit 1
fi
