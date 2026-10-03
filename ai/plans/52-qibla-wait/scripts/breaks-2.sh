#!/usr/bin/env bash
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

SUITES="components/sheets/screens/__tests__/Qibla.test.tsx shared/__tests__/qiblaSettle.test.ts"
CAUGHT=0
TOTAL=0
UNEXPECTED=0

run_break() {
  local label="$1" file="$2" search="$3" replace="$4"
  TOTAL=$((TOTAL + 1))
  cp "$file" "$file.bak"
  perl -0pi -e "s/\Q$search\E/$replace/" "$file"
  if cmp -s "$file" "$file.bak"; then
    echo "BREAK NOT APPLIED: $label"
    UNEXPECTED=$((UNEXPECTED + 1))
    mv "$file.bak" "$file"
    return
  fi
  if npx jest $SUITES --watchman=false >/dev/null 2>&1; then
    echo "SURVIVED: $label"
    UNEXPECTED=$((UNEXPECTED + 1))
  else
    echo "CAUGHT: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$file.bak" "$file"
}

H=hooks/useQibla.ts
S=shared/qiblaSettle.ts

run_break "warm path disabled" "$H" \
  "arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);" \
  "arrivedWarm = false;"
run_break "warm path always on" "$H" \
  "arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);" \
  "arrivedWarm = remembered !== null;"
run_break "remembered heading never stored" "$H" "warmHeadingRef.current = trueHeading;" ""
run_break "remembered heading cleared on close" "$H" \
  "    confirmRef.current = [];
    clearBlank();" \
  "    confirmRef.current = [];
    warmHeadingRef.current = null;
    clearBlank();"
run_break "confirm buffer not cleared on close" "$H" \
  "    settledRef.current = false;
    confirmRef.current = [];" \
  "    settledRef.current = false;"
run_break "confirm buffer not cleared on lost fix" "$H" \
  "        samplesRef.current = [];
        confirmRef.current = [];" \
  "        samplesRef.current = [];"
run_break "tolerance widened" "$S" \
  "export const WARM_TOLERANCE_DEGREES = 3;" "export const WARM_TOLERANCE_DEGREES = 90;"
run_break "confirm count dropped to 1" "$S" \
  "export const WARM_CONFIRM_READINGS = 8;" "export const WARM_CONFIRM_READINGS = 1;"
run_break "isWarmStream ignores the count" "$S" \
  "  if (readings.length < WARM_CONFIRM_READINGS) return false;" ""
run_break "isWarmStream reads whole buffer" "$S" \
  "const recent = readings.slice(-WARM_CONFIRM_READINGS);" "const recent = readings;"

echo "CAUGHT: $CAUGHT of $TOTAL"
echo "ALL AS EXPECTED: $([ "$UNEXPECTED" = "0" ] && echo 1 || echo 0)"
