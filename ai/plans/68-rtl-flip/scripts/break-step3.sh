#!/usr/bin/env bash
# Ticket 68 step 3 break. Run from the repository root with uat holding step 3.
set -u
cp shared/widgetTimeline.ts "$TMPDIR/break68-timeline.ts.bak"

python3 - <<'PYEOF'
import pathlib
p = pathlib.Path('shared/widgetTimeline.ts')
s = p.read_text()
old = "rtl: localeDirection(currentLocaleId()) === 'rtl',"
new = "rtl: true,"
count = s.count(old)
assert count >= 1, "break substitution not found"
p.write_text(s.replace(old, new))
print(f"break applied: {count} stamp sites now always claim rtl")
PYEOF

npx jest shared/__tests__/widgetTimeline.test.ts -t 'schema version' --watchman=false --selectProjects=unit > "$TMPDIR/break68c.log" 2>&1
if grep -q 'Expected: true' "$TMPDIR/break68c.log" && grep -q 'Received: false' "$TMPDIR/break68c.log"; then
  echo "caught: the entries no longer carry the locale's direction"
  cp "$TMPDIR/break68-timeline.ts.bak" shared/widgetTimeline.ts
  rm "$TMPDIR/break68-timeline.ts.bak"
  echo "ALL AS EXPECTED: 1"
  exit 0
fi
cp "$TMPDIR/break68-timeline.ts.bak" shared/widgetTimeline.ts
rm "$TMPDIR/break68-timeline.ts.bak"
echo "BREAK NOT APPLIED (the every-entry direction assertion did not fail)"
exit 1
