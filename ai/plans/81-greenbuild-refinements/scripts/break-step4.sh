#!/usr/bin/env bash
# Ticket 81 step 4 break. Run on uat after the step 4 merge.
set -u
cp components/prayer/Ago.tsx $TMPDIR/break81-ago.tsx.bak
cp components/prayer/List.tsx $TMPDIR/break81-list.tsx.bak
fails=0

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/prayer/Ago.tsx')
s = p.read_text()
subs = [
    ("{'\\u2009\\u2009:\\u2009\\u2009'}", "{'\\u2009:\\u2009'}", 1),
    ("  colon: {\n    opacity: 0.4,\n  },", "", 1),
    ("    marginTop: -SPACING.xs,\n", "", 1),
]
for old, new, want in subs:
    assert s.count(old) == want, f"break substitution not found {want} time(s): {old[:40]}"
    s = s.replace(old, new)
p.write_text(s)
print("break applied: ago single gap, no opacity, no lift")
EOF
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
npx jest components/prayer/__tests__/Ago.test.tsx components/prayer/__tests__/List.test.tsx --selectProjects=components --watchman=false > $TMPDIR/break81-s4.log 2>&1
grep -qF "Unable to find an element" $TMPDIR/break81-s4.log && echo "caught: ago gap or sentence back to single" && fails=$((fails+1))
grep -qF "Expected: 0.4" $TMPDIR/break81-s4.log && echo "caught: ago colon opacity gone" && fails=$((fails+1))
grep -qF "Expected: -4" $TMPDIR/break81-s4.log && echo "caught: badge lift gone" && fails=$((fails+1))
grep -qF "Expected: 22.5" $TMPDIR/break81-s4.log && echo "caught: list gap back to 30" && fails=$((fails+1))
cp $TMPDIR/break81-ago.tsx.bak components/prayer/Ago.tsx
cp $TMPDIR/break81-list.tsx.bak components/prayer/List.tsx
rm $TMPDIR/break81-ago.tsx.bak $TMPDIR/break81-list.tsx.bak

git diff --quiet -- components/prayer/Ago.tsx components/prayer/List.tsx || { echo "RESTORE FAILED"; exit 1; }
if [ "$fails" -eq 4 ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED (only $fails of 4 catches fired)"
  exit 1
fi