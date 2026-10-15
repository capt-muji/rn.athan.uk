#!/bin/bash
# Step 2 break: the deleted helper must stay deleted and stay gone from production
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

printf "import { splitColonSections } from '@/shared/time';\nexport const probe = splitColonSections;\n" > scratch-import-probe.ts
npx tsc --noEmit > "$TMPDIR/break2-tsc.log" 2>&1
STATUS=$?
rm scratch-import-probe.ts
if [ $STATUS -eq 0 ] || ! grep -q "has no exported member" "$TMPDIR/break2-tsc.log"; then
  echo "BREAK NOT APPLIED: tsc did not reject the deleted export"; exit 1
fi

HITS=$(grep -rn "splitColonSections\|CountdownSection\|ALL_DIGITS\|ALL_ZEROS\|dimDigit\|COLORS.countdown.colon" --include="*.ts" --include="*.tsx" shared components app hooks stores widgets 2>/dev/null | grep -v __tests__ | wc -l | tr -d ' ')
if [ "$HITS" != "0" ]; then
  echo "BREAK NOT APPLIED: $HITS production references remain"; exit 1
fi

echo "ALL ASPECTED: 1"
