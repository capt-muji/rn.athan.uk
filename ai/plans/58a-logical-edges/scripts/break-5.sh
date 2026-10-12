#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
# both 241 and 250 carry paddingEnd: SPACING.md, so the break exposes two lines
sed -i '' 's/paddingEnd: SPACING.md,/paddingRight: SPACING.md,/' components/sheets/screens/Settings.tsx
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/gate-break-5.log" 2>&1 && { echo "BREAK NOT APPLIED"; exit 1; }
hits=$(grep -c "components/sheets/screens/Settings.tsx" "$TMPDIR/gate-break-5.log") || true
[ "$hits" -ge 2 ] || { echo "BREAK NOT APPLIED: expected Settings.tsx twice, saw $hits"; exit 1; }
sed -i '' 's/paddingRight: SPACING.md,/paddingEnd: SPACING.md,/' components/sheets/screens/Settings.tsx
npx jest shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit > "$TMPDIR/gate-green-5.log" 2>&1
tail -4 "$TMPDIR/gate-green-5.log"
echo "ALL ASPECTED: 1"
