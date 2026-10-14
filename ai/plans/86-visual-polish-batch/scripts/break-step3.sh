#!/usr/bin/env bash
# Ticket 86 step 3 break. Run from the repository root with uat holding step 3.
set -u
cp components/prayer/List.tsx "$TMPDIR/break86-list.tsx.bak"

python3 - <<'EOF'
import pathlib
p = pathlib.Path('components/prayer/List.tsx')
s = p.read_text()
old = "  container: {\n    marginHorizontal: SCREEN.paddingHorizontal,\n    marginBottom: 28,\n  },"
new = "  container: {\n    marginHorizontal: SCREEN.paddingHorizontal,\n    marginBottom: SPACING.xxxl * 0.75,\n  },"
assert s.count(old) == 1, "break substitution not found once"
s = s.replace(old, new)
s = s.replace("import { SCREEN } from '@/shared/constants';", "import { SCREEN, SPACING } from '@/shared/constants';")
p.write_text(s)
print("break applied: the Standard gap back to 22.5")
EOF

npx jest components/prayer/__tests__/List.test.tsx -t 'quarter more' --watchman=false --selectProjects=components > "$TMPDIR/break86-step3.log" 2>&1
if grep -q 'renders a quarter more' "$TMPDIR/break86-step3.log"; then
  echo "caught: the Standard gap is 22.5 again"
  cp "$TMPDIR/break86-list.tsx.bak" components/prayer/List.tsx
  rm "$TMPDIR/break86-list.tsx.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break86-list.tsx.bak" components/prayer/List.tsx
rm "$TMPDIR/break86-list.tsx.bak"
echo "BREAK NOT APPLIED (the 22.5 gap did not fail the case)"
exit 1
