#!/usr/bin/env bash
# Step 4: Android on Google's sensor alone, behind a wave. Every rule of the wave, the gate and the binding is broken
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

SUITES="components/sheets/screens/__tests__/Qibla.test.tsx shared/__tests__/qiblaWaveGate.test.ts modules/qiblaheading/__tests__/index.test.ts"
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
W=shared/qiblaWaveGate.ts
B=modules/qiblaheading/index.ts

# ---- the wave ----
run_break "a turn counts sooner than 30 degrees" "$W" "const WAVE_TURN_DEGREES = 30;" "const WAVE_TURN_DEGREES = 28;"
run_break "a turn counts later than 30 degrees" "$W" "const WAVE_TURN_DEGREES = 30;" "const WAVE_TURN_DEGREES = 31;"
run_break "seven turns make a wave" "$W" "const WAVE_TURNS = 8;" "const WAVE_TURNS = 7;"
run_break "nine turns are needed" "$W" "const WAVE_TURNS = 8;" "const WAVE_TURNS = 9;"
run_break "the ceiling shortened" "$W" "export const WAVE_CEILING_MS = 10_000;" "export const WAVE_CEILING_MS = 9_999;"
run_break "the ceiling lengthened" "$W" "export const WAVE_CEILING_MS = 10_000;" "export const WAVE_CEILING_MS = 10_001;"
run_break "the whole angle taken for half of it" "$W" \
  "Math.cos((WAVE_TURN_DEGREES * DEGREES) / 2)" "Math.cos(WAVE_TURN_DEGREES * DEGREES)"
run_break "an attitude and its negative taken for two" "$W" \
  "Math.abs(dot(from, to)) <= TURN_COSINE" "dot(from, to) <= TURN_COSINE"
run_break "a reading that is no attitude is taken for one" "$W" \
  "  if (!isAttitude(attitude)) return wave;
" ""
run_break "a quaternion of zeros is taken for an attitude" "$W" \
  "lengthSquared > 0.5 && lengthSquared < 2" "lengthSquared < 2"
run_break "a quaternion of infinities is taken for an attitude" "$W" \
  "lengthSquared > 0.5 && lengthSquared < 2" "lengthSquared > 0.5"
run_break "a quaternion a fifth as long is taken for an attitude" "$W" "lengthSquared > 0.5" "lengthSquared > 0.01"
run_break "a quaternion five times as long is taken for an attitude" "$W" "lengthSquared < 2" "lengthSquared < 100"
run_break "one axis ignored" "$W" \
  "a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]" "a[0] * b[0] + a[1] * b[1] + a[3] * b[3]"
run_break "the first sample already counts a turn" "$W" \
  "if (wave === null) return { from: attitude, turns: 0 };" "if (wave === null) return { from: attitude, turns: 1 };"
run_break "counted from the last sample, not the last counted attitude" "$W" \
  "if (!hasTurned(wave.from, attitude)) return wave;" \
  "if (!hasTurned(wave.from, attitude)) return { from: attitude, turns: wave.turns };"
run_break "counted from where the wave began, not the last counted attitude" "$W" \
  "return { from: attitude, turns: wave.turns + 1 };" "return { from: wave.from, turns: wave.turns + 1 };"
run_break "a turn is not counted" "$W" \
  "return { from: attitude, turns: wave.turns + 1 };" "return { from: attitude, turns: wave.turns };"
run_break "a wave seen before any sample" "$W" "wave !== null && wave.turns >= WAVE_TURNS" "wave === null || wave.turns >= WAVE_TURNS"

# ---- the gate ----
run_break "the wave no longer opens the gate" "$H" \
  "if (!waved && waitedMs < WAVE_CEILING_MS) return;" "if (waitedMs < WAVE_CEILING_MS) return;"
run_break "the ceiling no longer opens the gate" "$H" \
  "if (!waved && waitedMs < WAVE_CEILING_MS) return;" "if (!waved) return;"
run_break "the ceiling fires one millisecond late" "$H" "waitedMs < WAVE_CEILING_MS" "waitedMs <= WAVE_CEILING_MS"
run_break "a fused phone waits the shorter ceiling" "$H" "waitedMs < WAVE_CEILING_MS" "waitedMs < CERTAINTY_CEILING_MS"
run_break "a fused phone is never refused" "$H" \
  "          if (!waved && waitedMs < WAVE_CEILING_MS) return;
" ""
run_break "a drawn compass is not recorded" "$H" \
  "          logger.info('QIBLA: compass drawn on the fused sensor', { waved, turns: waveRef.current?.turns, waitedMs });
" ""
run_break "the record says every phone was waved" "$H" "{ waved, turns: waveRef.current?.turns, waitedMs }" \
  "{ waved: true, turns: waveRef.current?.turns, waitedMs }"
run_break "the record loses the turns" "$H" "{ waved, turns: waveRef.current?.turns, waitedMs }" \
  "{ waved, turns: 0, waitedMs }"
run_break "the record loses the wait" "$H" "{ waved, turns: waveRef.current?.turns, waitedMs }" \
  "{ waved, turns: waveRef.current?.turns, waitedMs: 0 }"
run_break "a fused phone runs the other phones' gate" "$H" "        if (fusedRef.current) {" "        if (false) {"
run_break "every phone runs the fused gate" "$H" "        if (fusedRef.current) {" "        if (true) {"
run_break "the wave is not counted" "$H" \
  "        waveRef.current = advanceWave(waveRef.current, attitude);
" ""
run_break "the wave is counted after the reading is judged" "$H" \
  "        waveRef.current = advanceWave(waveRef.current, attitude);
        processReading(headingDegrees);" \
  "        processReading(headingDegrees);
        waveRef.current = advanceWave(waveRef.current, attitude);"
run_break "a close keeps the last visit's wave" "$H" \
  "    waveRef.current = null;
" ""
run_break "the fused heading is not drawn" "$H" "        processReading(headingDegrees);
" ""
run_break "a close leaves the sensor running" "$H" \
  "    unwatchNativeRef.current?.();
" ""
# ---- a fused sensor that delivers nothing ----
run_break "a silent sensor is waited on for ever" "$H" \
  "      silenceRef.current = setTimeout(fallBack, FUSED_SILENCE_MS);
" ""
run_break "a silent sensor is given up on one millisecond sooner" "$H" \
  "const FUSED_SILENCE_MS = 3000;" "const FUSED_SILENCE_MS = 2999;"
run_break "a silent sensor is given up on one millisecond later" "$H" \
  "const FUSED_SILENCE_MS = 3000;" "const FUSED_SILENCE_MS = 3001;"
run_break "a first sample does not end the wait for one" "$H" \
  "        clearSilence();
        // Counted before the reading is judged" \
  "        // Counted before the reading is judged"
run_break "a close does not end the wait for a first sample" "$H" \
  "    clearBlank();
    clearSilence();
    unwatchRef.current?.();" \
  "    clearBlank();
    unwatchRef.current?.();"
run_break "an overtaking open leaves the first open's wait running" "$H" \
  "      clearSilence();
      silenceRef.current = setTimeout(fallBack, FUSED_SILENCE_MS);" \
  "      silenceRef.current = setTimeout(fallBack, FUSED_SILENCE_MS);"
run_break "an overtaking open strands the first open's listener" "$H" \
  "      unwatchNativeRef.current?.();
      unwatchNativeRef.current = watchFusedHeading(" \
  "      unwatchNativeRef.current = watchFusedHeading("
run_break "the fallback is not recorded" "$H" \
  "    logger.warn('QIBLA: the fused sensor delivered nothing, reading the platform heading instead');
" ""
run_break "the fallback leaves the silent sensor armed" "$H" \
  "    unwatchNativeRef.current?.();
    unwatchNativeRef.current = null;
    fusedRef.current = false;" \
  "    unwatchNativeRef.current = null;
    fusedRef.current = false;"
run_break "the silent sensor is stopped again by the close" "$H" \
  "    unwatchNativeRef.current?.();
    unwatchNativeRef.current = null;
    fusedRef.current = false;" \
  "    unwatchNativeRef.current?.();
    fusedRef.current = false;"
run_break "a fallen-back visit still waits for a wave" "$H" \
  "    unwatchNativeRef.current = null;
    fusedRef.current = false;" \
  "    unwatchNativeRef.current = null;"
run_break "the fallback starts no platform heading" "$H" \
  "    watchHeading(({ trueHeading }) => processReading(trueHeading)).then((unwatch) => {" \
  "    Promise.resolve(NOTHING_TO_STOP).then((unwatch) => {"
run_break "a late fallback watch is kept by whichever visit is open" "$H" \
  "      if (visitRef.current !== visit) {" "      if (!activeRef.current) {"
run_break "a late fallback watch is always kept" "$H" "      if (visitRef.current !== visit) {" "      if (false) {"
run_break "a fallback watch is always dropped" "$H" "      if (visitRef.current !== visit) {" "      if (true) {"
run_break "a dropped fallback watch is left running" "$H" \
  "      if (visitRef.current !== visit) {
        unwatch();
        return;" \
  "      if (visitRef.current !== visit) {
        return;"
run_break "a kept fallback watch outlives the close" "$H" \
  "    unwatchFallbackRef.current?.();
" ""
run_break "a close does not end the visit" "$H" \
  "    visitRef.current += 1;
" ""

# ---- which phone reads what, and what the other phones still do ----
run_break "the fused sensor is never chosen" "$H" "fusedRef.current = hasFusedHeading();" "fusedRef.current = false;"
run_break "the fused sensor is always chosen" "$H" "fusedRef.current = hasFusedHeading();" "fusedRef.current = true;"
run_break "the platform heading runs beside the fused sensor" "$H" \
  "    let unwatchPromise = Promise.resolve(NOTHING_TO_STOP);" \
  "    let unwatchPromise = watchHeading(({ trueHeading }) => processReading(trueHeading));"
run_break "the iPhone's accuracy no longer reaches its gate" "$H" \
  "        accuracyRef.current = accuracyDegrees;
" ""
run_break "the iPhone's platform heading is not started" "$H" \
  "      unwatchPromise = watchHeading(({ trueHeading }) => processReading(trueHeading));
" ""
run_break "the iPhone loses its warm reopen" "$H" \
  "if (!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs < CERTAINTY_CEILING_MS) return;" \
  "if (!isCertain(accuracyRef.current) && waitedMs < CERTAINTY_CEILING_MS) return;"
run_break "the iPhone loses its certainty" "$H" \
  "if (!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs < CERTAINTY_CEILING_MS) return;" \
  "if (!arrivedWarm && waitedMs < CERTAINTY_CEILING_MS) return;"
run_break "the iPhone's ceiling fires one millisecond early" "$H" \
  "waitedMs < CERTAINTY_CEILING_MS" "waitedMs < CERTAINTY_CEILING_MS - 1"
run_break "a warm reopen that is also certain is announced as an arrival" "$H" \
  "arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);" \
  "arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered) && !isCertain(accuracyRef.current);"
run_break "a warm visit silences every arrival after it" "$H" \
  "{ ...previous, hasHeading: true, arrivedWarm }" \
  "{ ...previous, hasHeading: true, arrivedWarm: previous.arrivedWarm || arrivedWarm }"

# ---- the binding ----
run_break "the module looked up under another name" "$B" "'ExpoQiblaHeading'" "'ExpoQiblaCompass'"
run_break "the lookup is not kept" "$B" "  if (nativeModule === undefined) {" "  if (nativeModule !== null) {"
run_break "a phone always carries the fused sensor" "$B" \
  "resolveNative()?.isFusedOrientationAvailable?.() ?? false;" "resolveNative()?.isFusedOrientationAvailable?.() ?? true;"
run_break "the fused watch arms on a phone that cannot run it" "$B" \
  "  if (!native?.isFusedOrientationAvailable?.()) return NOTHING_TO_STOP;" \
  "  if (!native?.isFusedOrientationAvailable) return NOTHING_TO_STOP;"
run_break "the fused watch listens to the wrong event" "$B" "'onFusedOrientation'" "'onHeadingAccuracy'"
run_break "the fused listener is added off the native side" "$B" \
  "  const subscription = native.addListener('onFusedOrientation', onReading);" \
  "  const { addListener } = native;
  const subscription = addListener('onFusedOrientation', onReading);"
run_break "the fused sensor is started off the native side" "$B" \
  "  native.startFusedOrientation();" \
  "  const { startFusedOrientation } = native;
  startFusedOrientation();"
run_break "the fused sensor is stopped off the native side" "$B" \
  "    native.stopFusedOrientation();" \
  "    const { stopFusedOrientation } = native;
    stopFusedOrientation();"
run_break "the accuracy readings are started off the native side" "$B" \
  "  native.startHeadingAccuracy();" \
  "  const { startHeadingAccuracy } = native;
  startHeadingAccuracy();"
run_break "the accuracy readings are stopped off the native side" "$B" \
  "    native.stopHeadingAccuracy();" \
  "    const { stopHeadingAccuracy } = native;
    stopHeadingAccuracy();"
run_break "the fused sensor is never started" "$B" "  native.startFusedOrientation();
" ""
run_break "the fused sensor is started before anything listens" "$B" \
  "  const subscription = native.addListener('onFusedOrientation', onReading);
  native.startFusedOrientation();" \
  "  native.startFusedOrientation();
  const subscription = native.addListener('onFusedOrientation', onReading);"
run_break "the fused subscription is never removed" "$B" \
  "    subscription.remove();
    native.stopFusedOrientation();" \
  "    native.stopFusedOrientation();"
run_break "the fused sensor is never stopped" "$B" "    native.stopFusedOrientation();
" ""
run_break "a stop acts every time it is called" "$B" "    if (stopped) return;
" ""
run_break "the accuracy watch arms on a phone that cannot report one" "$B" \
  "  if (!native?.isHeadingAccuracyAvailable?.()) return NOTHING_TO_STOP;" \
  "  if (!native?.isHeadingAccuracyAvailable) return NOTHING_TO_STOP;"
run_break "the accuracy watch listens to the wrong event" "$B" "'onHeadingAccuracy'" "'onFusedOrientation'"
run_break "the accuracy passes on the heading instead" "$B" \
  "({ accuracyDegrees }: { accuracyDegrees: number }) =>
    onReading(accuracyDegrees)" \
  "({ trueHeading }: { trueHeading: number }) =>
    onReading(trueHeading)"
run_break "the accuracy readings are never started" "$B" "  native.startHeadingAccuracy();
" ""
run_break "the accuracy subscription is never removed" "$B" \
  "    subscription.remove();
    native.stopHeadingAccuracy();" \
  "    native.stopHeadingAccuracy();"
run_break "the accuracy readings are never stopped" "$B" "    native.stopHeadingAccuracy();
" ""

echo "CAUGHT: $CAUGHT of $TOTAL"
echo "ALL AS EXPECTED: $([ "$UNEXPECTED" = "0" ] && echo 1 || echo 0)"
