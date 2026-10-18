#!/usr/bin/env bash
# Breaks R1.1: pin the mirror off and the red suite must catch it.
set -e
cd "$(dirname "$0")/../../../.."
# The fix is uncommitted in the tree at break time, so restore by copying the
# pristine file back from $TMPDIR, never `git checkout` (it would revert the fix).
W=widgets/PrayerWidget.tsx
cp "$W" "$TMPDIR/mirror-135.tsx"
restore() { cp "$TMPDIR/mirror-135.tsx" "$W"; }
trap restore EXIT
python3 - <<'PYEOF'
from pathlib import Path
p = Path("widgets/PrayerWidget.tsx")
s = p.read_text()
old = "const rtl = input.rtl === true;"
new = "const rtl = false;"
assert s.count(old) == 1, "anchor drifted"
p.write_text(s.replace(old, new))
PYEOF
npx jest shared/__tests__/widgetRenderer.test.ts -t "under rtl" --watchman=false --selectProjects=unit 2>&1 | tail -5
echo "BREAK 135-MIRROR: expected FAIL above, file restored from TMPDIR"
