#!/usr/bin/env bash
# Ticket 81 step 4 break. Run on uat after the step 4 merge. Four restored
# phases, so each catch fires on its own failing line.
set -u
cp components/prayer/Ago.tsx $TMPDIR/break81-ago.tsx.bak
cp components/prayer/List.tsx $TMPDIR/break81-list.tsx.bak
fails=0

run_suites() { npx jest components/prayer/__tests__/Ago.test.tsx components/prayer/__tests__/List.test.tsx --selectProjects=components --watchman=false; }

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/prayer/Ago.tsx')
s = p.read_text()
old = "{'\\u2009\\u2009:\\u2009\\u2009'}"
new = "{'\\u2009:\\u2009'}"
assert s.count(old) == 1, "break substitution not found: doubled gap"
p.write_text(s.replace(old, new))
print("break applied: ago gap back to single thin spaces")
EOF
run_suites > $TMPDIR/break81-s4a.log 2>&1
grep -qF "Unable to find an element" $TMPDIR/break81-s4a.log && echo "caught: ago gap back to single" && fails=$((fails+1))
cp $TMPDIR/break81-ago.tsx.bak components/prayer/Ago.tsx

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/prayer/Ago.tsx')
s = p.read_text()
old = "  colon: {\n    opacity: 0.4,\n  },"
new = "  colon: {\n    opacity: 1,\n  },"
assert s.count(old) == 1, "break substitution not found: ago colon opacity"
p.write_text(s.replace(old, new))
print("break applied: ago colon opacity to 1")
EOF
run_suites > $TMPDIR/break81-s4b.log 2>&1
grep -qF "Expected: 0.4" $TMPDIR/break81-s4b.log && echo "caught: ago colon opacity gone" && fails=$((fails+1))
cp $TMPDIR/break81-ago.tsx.bak components/prayer/Ago.tsx

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/prayer/Ago.tsx')
s = p.read_text()
old = "    marginTop: -SPACING.xs,\n"
assert s.count(old) == 1, "break substitution not found: badge lift"
p.write_text(s.replace(old, ""))
print("break applied: badge lift removed")
EOF
run_suites > $TMPDIR/break81-s4c.log 2>&1
grep -qF "Expected: -4" $TMPDIR/break81-s4c.log && echo "caught: badge lift gone" && fails=$((fails+1))
cp $TMPDIR/break81-ago.tsx.bak components/prayer/Ago.tsx

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/prayer/List.tsx')
s = p.read_text()
old = "    marginBottom: SPACING.xxxl * 0.75,"
new = "    marginBottom: SPACING.xxxl,"
assert s.count(old) == 1, "break substitution not found: list gap"
p.write_text(s.replace(old, new))
print("break applied: list gap back to 30")
EOF
run_suites > $TMPDIR/break81-s4d.log 2>&1
grep -qF "Expected: 22.5" $TMPDIR/break81-s4d.log && echo "caught: list gap back to 30" && fails=$((fails+1))
cp $TMPDIR/break81-list.tsx.bak components/prayer/List.tsx
rm $TMPDIR/break81-ago.tsx.bak $TMPDIR/break81-list.tsx.bak

git diff --quiet -- components/prayer/Ago.tsx components/prayer/List.tsx || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 4 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 4 catches fired)"
  exit 1
fi