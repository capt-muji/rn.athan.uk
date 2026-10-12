#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
sed -i '' 's/paddingStart: SCREEN.paddingHorizontal + 4,/paddingLeft: SCREEN.paddingHorizontal + 4,/' components/day/Day.tsx
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/gate-break-6.log" 2>&1 && { echo "BREAK NOT APPLIED"; exit 1; }
grep -q "components/day/Day.tsx" "$TMPDIR/gate-break-6.log" || { echo "BREAK NOT APPLIED: failure did not name Day.tsx"; exit 1; }
sed -i '' 's/paddingLeft: SCREEN.paddingHorizontal + 4,/paddingStart: SCREEN.paddingHorizontal + 4,/' components/day/Day.tsx
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/gate-green-6.log" 2>&1
tail -4 "$TMPDIR/gate-green-6.log"
echo "ALL ASPECTED: 1"
