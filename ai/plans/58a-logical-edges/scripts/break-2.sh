#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
sed -i '' 's/marginStart: SPACING.lg - 1,/marginLeft: SPACING.lg - 1,/' components/prayer/Time.tsx
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/gate-break-2.log" 2>&1 && { echo "BREAK NOT APPLIED"; exit 1; }
grep -q "components/prayer/Time.tsx" "$TMPDIR/gate-break-2.log" || { echo "BREAK NOT APPLIED: failure did not name Time.tsx"; exit 1; }
sed -i '' 's/marginLeft: SPACING.lg - 1,/marginStart: SPACING.lg - 1,/' components/prayer/Time.tsx
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/gate-green-2.log" 2>&1
tail -4 "$TMPDIR/gate-green-2.log"
echo "ALL ASPECTED: 1"
