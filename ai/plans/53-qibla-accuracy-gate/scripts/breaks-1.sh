#!/usr/bin/env bash
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

SUITES="components/sheets/screens/__tests__/Qibla.test.tsx components/sheets/screens/__tests__/QiblaDiagnostic.test.tsx shared/__tests__/qiblaSettle.test.ts"
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
S=shared/qiblaSettle.ts
Q=components/sheets/screens/Qibla.tsx

run_break "certainty path removed" "$H" \
  "        else if (isCertain(accuracyRef.current)) openedBy = 'certainty';
" ""
run_break "certainty path always on" "$H" "isCertain(accuracyRef.current)" "true"
run_break "ceiling removed" "$H" \
  "        else if (waitedMs >= CERTAINTY_CEILING_MS) openedBy = 'ceiling';
" ""
run_break "ceiling fires at once" "$H" "waitedMs >= CERTAINTY_CEILING_MS" "waitedMs >= 0"
run_break "ceiling counted from the fix, not the first reading" "$H" \
  "      firstReadingAtRef.current ??= nowMs;

      const bearing = bearingRef.current;
      if (bearing === null) return;
" \
  "      const bearing = bearingRef.current;
      if (bearing === null) return;
      firstReadingAtRef.current ??= nowMs;
"
run_break "dropped reading does not restart the ceiling" "$H" \
  "        firstReadingAtRef.current = null;
        if (!blankRef.current)" \
  "        if (!blankRef.current)"
run_break "close does not restart the ceiling" "$H" \
  "    firstReadingAtRef.current = null;
    clearBlank();" \
  "    clearBlank();"
run_break "latch removed" "$H" \
  "        settledRef.current = true;
" ""
run_break "certainty outranks a warm reopen" "$H" \
  "        if (arrivedWarm) openedBy = 'warm';
        else if (isCertain(accuracyRef.current)) openedBy = 'certainty';" \
  "        if (isCertain(accuracyRef.current)) openedBy = 'certainty';
        else if (arrivedWarm) openedBy = 'warm';"
run_break "a sample with no cone erases the last certainty" "$H" \
  "if (reported !== undefined) accuracyRef.current = reported;" "accuracyRef.current = reported;"
run_break "Android's cone ignored" "$H" \
  "diagnostic.accuracyDegrees ?? diagnostic.fusedErrorDegrees" "diagnostic.accuracyDegrees"
run_break "certainty kept across a close" "$H" \
  "    accuracyRef.current = undefined;
" ""
run_break "a genuine loss keeps the latch" "$H" \
  "    settledRef.current = false;
    warmHeadingRef.current = null;" \
  "    warmHeadingRef.current = null;"
run_break "what drew the compass never reported" "$H" \
  "{ ...previous, hasHeading: true, arrivedWarm, openedBy }" "{ ...previous, hasHeading: true, arrivedWarm }"
run_break "what drew the compass kept across a close" "$H" \
  "arrivedWarm: false, openedBy: null }" "arrivedWarm: false }"
run_break "accuracy watch left running on close" "$H" \
  "    unwatchDiagnosticRef.current?.();
" ""
run_break "bar widened to the validity floor" "$S" \
  "export const CERTAINTY_THRESHOLD_DEGREES = 15;" "export const CERTAINTY_THRESHOLD_DEGREES = 45;"
run_break "bar tightened to the value that never fired" "$S" \
  "export const CERTAINTY_THRESHOLD_DEGREES = 15;" "export const CERTAINTY_THRESHOLD_DEGREES = 5;"
run_break "negative accuracy accepted" "$S" "accuracyDegrees >= 0 && " ""
run_break "ceiling shortened below the wait it replaced" "$S" \
  "export const CERTAINTY_CEILING_MS = 3000;" "export const CERTAINTY_CEILING_MS = 1000;"
run_break "ceiling lengthened" "$S" \
  "export const CERTAINTY_CEILING_MS = 3000;" "export const CERTAINTY_CEILING_MS = 9000;"
run_break "readout stops naming what drew the compass" "$Q" \
  'drew on ${openedBy ?? PENDING}' 'drew on ${PENDING}'
run_break "readout drops the bar and the ceiling" "$Q" \
  'bar ${CERTAINTY_THRESHOLD_DEGREES} / ceiling ${CERTAINTY_CEILING_MS}ms' 'bar / ceiling'

echo "CAUGHT: $CAUGHT of $TOTAL"
echo "ALL AS EXPECTED: $([ "$UNEXPECTED" = "0" ] && echo 1 || echo 0)"
