#!/usr/bin/env bash
# Step 3: the gate's three lines became one, so each term of that one line is broken in turn
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

SUITES="components/sheets/screens/__tests__/Qibla.test.tsx"
CAUGHT=0
TOTAL=0
UNEXPECTED=0

# The search and the replacement travel in the environment, so a `/`, a `$` or a backtick in either is plain text
run_break() {
  local label="$1" file="$2" search="$3" replace="$4"
  TOTAL=$((TOTAL + 1))
  cp "$file" "$file.bak"
  SEARCH="$search" REPLACE="$replace" perl -0pi -e 's/\Q$ENV{SEARCH}\E/$ENV{REPLACE}/' "$file"
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

run_break "a warm reopen no longer opens the gate" "$H" \
  "if (!arrivedWarm && !isCertain(accuracyRef.current)" "if (!isCertain(accuracyRef.current)"
run_break "the phone's certainty no longer opens the gate" "$H" \
  "!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs" "!arrivedWarm && waitedMs"
run_break "the ceiling no longer opens the gate" "$H" \
  " && waitedMs < CERTAINTY_CEILING_MS) return;" ") return;"
run_break "the ceiling fires one millisecond early" "$H" \
  "waitedMs < CERTAINTY_CEILING_MS" "waitedMs < CERTAINTY_CEILING_MS - 1"
run_break "the ceiling fires one millisecond late" "$H" \
  "waitedMs < CERTAINTY_CEILING_MS" "waitedMs <= CERTAINTY_CEILING_MS"
run_break "the gate never refuses" "$H" \
  "        if (!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs < CERTAINTY_CEILING_MS) return;
" ""
run_break "the latch removed" "$H" \
  "        settledRef.current = true;
" ""
run_break "the accuracy watch no longer feeds the gate" "$H" \
  "      if (reported !== undefined) accuracyRef.current = reported;
" ""
run_break "a warm reopen is announced as an arrival" "$H" \
  "{ ...previous, hasHeading: true, arrivedWarm }" "{ ...previous, hasHeading: true, arrivedWarm: false }"
run_break "a close leaves the last visit's compass drawn" "$H" \
  "    // watch is torn down, so reporting one would be a lie in any case
    setState((previous) => (previous.hasHeading ? { ...previous, hasHeading: false } : previous));" \
  "    // watch is torn down, so reporting one would be a lie in any case"

echo "CAUGHT: $CAUGHT of $TOTAL"
echo "ALL AS EXPECTED: $([ "$UNEXPECTED" = "0" ] && echo 1 || echo 0)"
