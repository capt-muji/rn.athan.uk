#!/usr/bin/env bash
# Step 5: nothing unvouched is drawn. The two ceilings are gone, north can be reported lost, and an arrival is felt
# only when the hint had been up for a second
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
Q=components/sheets/screens/Qibla.tsx

# ---- nothing unvouched is drawn ----
run_break "an unwaved phone is drawn anyway" "$H" \
  "          if (!hasWaved(waveRef.current)) return;
" ""
run_break "an unwaved phone is drawn after ten seconds, as it once was" "$H" \
  "if (!hasWaved(waveRef.current)) return;" "if (!hasWaved(waveRef.current) && waitedMs < 10_000) return;"
run_break "an unvouched heading is drawn anyway" "$H" \
  "          if (!arrivedWarm && !isCertain(accuracyRef.current)) return;
" ""
run_break "an unvouched heading is drawn after three seconds, as it once was" "$H" \
  "if (!arrivedWarm && !isCertain(accuracyRef.current)) return;" \
  "if (!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs < 3000) return;"
run_break "the phone's certainty no longer draws it" "$H" \
  "if (!arrivedWarm && !isCertain(accuracyRef.current)) return;" "if (!arrivedWarm) return;"
run_break "a warm reopen no longer draws" "$H" \
  "if (!arrivedWarm && !isCertain(accuracyRef.current)) return;" "if (!isCertain(accuracyRef.current)) return;"
run_break "the latch removed" "$H" \
  "        settledRef.current = true;
        clearLost();" \
  "        clearLost();"
run_break "every phone runs the fused gate" "$H" "        if (fusedRef.current) {" "        if (true) {"
run_break "a fused phone runs the other phones' gate" "$H" "        if (fusedRef.current) {" "        if (false) {"

# ---- the arrival the user feels ----
run_break "an arrival is felt one millisecond sooner" "$H" \
  "const ARRIVAL_ANNOUNCE_MS = 1000;" "const ARRIVAL_ANNOUNCE_MS = 999;"
run_break "an arrival is felt one millisecond later" "$H" \
  "const ARRIVAL_ANNOUNCE_MS = 1000;" "const ARRIVAL_ANNOUNCE_MS = 1001;"
run_break "an arrival exactly a second in is silent" "$H" \
  "arrivedQuietly = waitedMs < ARRIVAL_ANNOUNCE_MS;" "arrivedQuietly = waitedMs <= ARRIVAL_ANNOUNCE_MS;"
run_break "every arrival is felt, however quick" "$H" \
  "          arrivedQuietly = waitedMs < ARRIVAL_ANNOUNCE_MS;
" ""
run_break "no arrival is felt on a phone without the fused sensor" "$H" \
  "arrivedQuietly = waitedMs < ARRIVAL_ANNOUNCE_MS;" "arrivedQuietly = true;"
run_break "a wave is silent" "$H" "      let arrivedQuietly = false;" "      let arrivedQuietly = true;"
run_break "a quick wave is silent" "$H" \
  "          logger.info('QIBLA: compass drawn after a wave', { waitedMs });" \
  "          logger.info('QIBLA: compass drawn after a wave', { waitedMs });
          arrivedQuietly = waitedMs < ARRIVAL_ANNOUNCE_MS;"
run_break "a quiet arrival silences every arrival after it" "$H" \
  "{ ...previous, hasHeading: true, arrivedQuietly, lost: false }" \
  "{ ...previous, hasHeading: true, arrivedQuietly: previous.arrivedQuietly || arrivedQuietly, lost: false }"
run_break "the sheet feels every arrival, quiet or not" "$Q" \
  "if (!showsCompass || arrivedQuietly) return;" "if (!showsCompass) return;"
run_break "the sheet feels no arrival" "$Q" \
  "    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
" ""
run_break "the wait is counted from the open even after the hint returned" "$H" \
  "    warmHeadingRef.current = null;
    awaitNorth();" \
  "    warmHeadingRef.current = null;"
run_break "the wait is never timed" "$H" \
  "    waitingSinceRef.current = Date.now();
" ""

# ---- north reported lost ----
run_break "north is reported lost one millisecond sooner" "$H" "const LOST_AFTER_MS = 5000;" "const LOST_AFTER_MS = 4999;"
run_break "north is reported lost one millisecond later" "$H" "const LOST_AFTER_MS = 5000;" "const LOST_AFTER_MS = 5001;"
run_break "north is never reported lost" "$H" \
  "    awaitNorth();

    // The heading watch and the position warm up independently" \
  "    // The heading watch and the position warm up independently"
run_break "north is reported lost to a user who refused location" "$H" \
  "    const granted = await requestQiblaPermission();" \
  "    awaitNorth();
    const granted = await requestQiblaPermission();"
run_break "a drawn compass does not end the wait" "$H" \
  "        settledRef.current = true;
        clearLost();" \
  "        settledRef.current = true;"
run_break "a drawn compass keeps the report on screen" "$H" \
  "{ ...previous, hasHeading: true, arrivedQuietly, lost: false }" "{ ...previous, hasHeading: true, arrivedQuietly }"
run_break "a close does not end the wait" "$H" \
  "    clearBlank();
    clearLost();
    unwatchRef.current?.();" \
  "    clearBlank();
    unwatchRef.current?.();"
run_break "a close keeps the report on screen" "$H" \
  "{ ...previous, hasHeading: false, lost: false }" "{ ...previous, hasHeading: false }"
run_break "a close forgets the report only when a compass was drawn" "$H" \
  "previous.hasHeading || previous.lost ?" "previous.hasHeading ?"
run_break "a delivering sensor is reported lost for want of a wave" "$H" \
  "        clearLost();
        // Counted before the reading is judged" \
  "        // Counted before the reading is judged"
run_break "an overtaking open leaves the first open's wait running" "$H" \
  "    clearLost();
    waitingSinceRef.current = Date.now();" \
  "    waitingSinceRef.current = Date.now();"
run_break "the report sets nothing" "$H" \
  "setState((previous) => ({ ...previous, lost: true }))" "setState((previous) => ({ ...previous, lost: false }))"

# ---- the two lines ----
run_break "the first line reworded" "$Q" "Could not find north" "Could not find North"
run_break "the second line reworded" "$Q" \
  "Please try standing in a different location" "Please try standing somewhere else"
run_break "the first line in the headline's colour" "$Q" \
  "<Text style={styles.message}>Could not find north</Text>" "<Text style={styles.headline}>Could not find north</Text>"
run_break "the second line in the headline's colour" "$Q" \
  "<Text style={styles.message}>Please try standing in a different location</Text>" \
  "<Text style={styles.headline}>Please try standing in a different location</Text>"
run_break "the report shown from the first frame" "$Q" "{lost && <QiblaLost />}" "{isCalibrating && <QiblaLost />}"
run_break "the report never shown" "$Q" "        {lost && <QiblaLost />}
" ""
run_break "the report added to the column, moving the hint" "$Q" \
  "    left: 0,
    position: 'absolute',
    right: 0," \
  "    left: 0,
    right: 0,"

# ---- what a mock build records ----
run_break "a drawn compass is not recorded" "$H" \
  "          logger.info('QIBLA: compass drawn after a wave', { waitedMs });
" ""
run_break "the record loses how long the wave took" "$H" \
  "logger.info('QIBLA: compass drawn after a wave', { waitedMs });" \
  "logger.info('QIBLA: compass drawn after a wave', { waitedMs: 0 });"

echo "CAUGHT: $CAUGHT of $TOTAL"
echo "ALL AS EXPECTED: $([ "$UNEXPECTED" = "0" ] && echo 1 || echo 0)"
