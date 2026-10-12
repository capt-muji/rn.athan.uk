#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
# the stylesheet pair at OverlayInfoBox.tsx 94-95 is the only 'end: 0,' pair in the file
sed -i '' 's/end: 0,/right: 0,/' components/overlay/OverlayInfoBox.tsx
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/gate-break-3.log" 2>&1 && { echo "BREAK NOT APPLIED"; exit 1; }
grep -q "components/overlay/OverlayInfoBox.tsx" "$TMPDIR/gate-break-3.log" || { echo "BREAK NOT APPLIED: failure did not name OverlayInfoBox.tsx"; exit 1; }
sed -i '' 's/right: 0,/end: 0,/' components/overlay/OverlayInfoBox.tsx
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/gate-green-3.log" 2>&1
tail -4 "$TMPDIR/gate-green-3.log"
echo "ALL ASPECTED: 1"
