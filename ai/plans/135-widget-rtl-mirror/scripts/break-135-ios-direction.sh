#!/usr/bin/env bash
# Breaks R2.1: flip the hunk's LTR default and the patch guard must catch it.
# Restores by copying the pristine file back from $TMPDIR; patch-package is
# never run here (with a package argument it regenerates the patch from the
# mutated tree, which would bake the break into the committed patch).
set -e
cd "$(dirname "$0")/../../../.."
SWIFT=node_modules/expo-widgets/ios/Widgets/EntryView.swift
cp "$SWIFT" "$TMPDIR/entryview-135.swift"
restore() { cp "$TMPDIR/entryview-135.swift" "$SWIFT"; }
trap restore EXIT
python3 - <<'PYEOF'
from pathlib import Path
p = Path("node_modules/expo-widgets/ios/Widgets/EntryView.swift")
s = p.read_text()
old = 'let rtl = (entry.props?["rtl"] as? Bool) ?? false'
assert s.count(old) == 1, "hunk not installed"
p.write_text(s.replace(old, 'let rtl = (entry.props?["rtl"] as? Bool) ?? true'))
PYEOF
npx jest shared/__tests__/widgetOpenAppPatch.test.ts --watchman=false --selectProjects=unit 2>&1 | tail -5
echo "BREAK 135-IOS-DIRECTION: expected FAIL above (the guard pins the false default); file restored from TMPDIR"
