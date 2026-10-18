#!/usr/bin/env bash
# Breaks D135.4: relocalise the unit letters and the red suite must catch it.
set -e
cd "$(dirname "$0")/../../../.."
# The fix is uncommitted in the tree at break time, so restore by copying the
# pristine file back from $TMPDIR, never `git checkout` (it would revert the fix).
TS=shared/widgetTimeline.ts
cp "$TS" "$TMPDIR/letters-135.ts"
restore() { cp "$TMPDIR/letters-135.ts" "$TS"; }
trap restore EXIT
python3 - <<'PYEOF'
from pathlib import Path
p = Path("shared/widgetTimeline.ts")
s = p.read_text()
old = "  h: 'h',\n  m: 'm',\n  s: 's',"
new = "  h: t('duration.h'),\n  m: t('duration.m'),\n  s: t('duration.s'),"
assert s.count(old) == 1, "anchor drifted"
p.write_text(s.replace(old, new))
PYEOF
npx jest shared/__tests__/widgetSnapshot.test.ts -t "fixed Latin unit letters" --watchman=false --selectProjects=unit 2>&1 | tail -5
echo "BREAK 135-LETTERS: expected FAIL above, file restored from TMPDIR"
