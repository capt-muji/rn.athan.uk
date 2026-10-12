#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
sed -i '' 's/marginStart: 3,/marginLeft: 3,/' components/sheets/parts/Stepper.tsx
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/gate-break-4.log" 2>&1 && { echo "BREAK NOT APPLIED"; exit 1; }
grep -q "components/sheets/parts/Stepper.tsx" "$TMPDIR/gate-break-4.log" || { echo "BREAK NOT APPLIED: failure did not name Stepper.tsx"; exit 1; }
sed -i '' 's/marginLeft: 3,/marginStart: 3,/' components/sheets/parts/Stepper.tsx
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/gate-green-4.log" 2>&1
tail -4 "$TMPDIR/gate-green-4.log"
echo "ALL ASPECTED: 1"
