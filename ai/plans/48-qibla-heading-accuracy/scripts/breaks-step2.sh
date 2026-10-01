#!/bin/bash
# Every decision qiblaSettle.ts makes, broken one at a time. A break that changes nothing is NOT caught.
# Run from the repository root.

set -u
SRC="shared/qiblaSettle.ts"
TESTS="shared/__tests__/qiblaSettle.test.ts"
CAUGHT=0
TOTAL=0

run_break() {
  local label="$1"
  local search="$2"
  local replace="$3"
  TOTAL=$((TOTAL + 1))
  cp "$SRC" "$SRC.bak"
  # A pipe delimiter, because every line of this code holds a slash
  perl -pi -e "s|\Q$search\E|$replace|" "$SRC"
  if cmp -s "$SRC" "$SRC.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$SRC.bak" "$SRC"
    return
  fi
  if npx jest "$TESTS" --watchman=false --selectProjects=unit >/dev/null 2>&1; then
    echo "SURVIVED: $label"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$SRC.bak" "$SRC"
}

run_break "the span check is removed, so a 400ms burst passes as a 3s window" \
  'if (nowMs - window[0].atMs < SETTLE_WINDOW_MS * 0.9) return false;' \
  ''

run_break "the minimum-readings check is removed" \
  'if (window.length < SETTLE_MIN_READINGS) return false;' \
  ''

run_break "drift is compared without the absolute, so a leftward drift passes" \
  'return Math.abs(headingDelta(newer, older)) <= SETTLE_DRIFT_DEGREES;' \
  'return headingDelta(newer, older) <= SETTLE_DRIFT_DEGREES;'

run_break "the drift comparison flips to strictly-less, so the boundary is refused" \
  'return Math.abs(headingDelta(newer, older)) <= SETTLE_DRIFT_DEGREES;' \
  'return Math.abs(headingDelta(newer, older)) < SETTLE_DRIFT_DEGREES;'

run_break "the window halves are compared the wrong way, older against older" \
  'const newer = circularMean(window.slice(half).map((sample) => sample.degrees));' \
  'const newer = circularMean(window.slice(0, half).map((sample) => sample.degrees));'

run_break "the circular mean becomes a plain arithmetic mean, which breaks across north" \
  'return (Math.atan2(y / degrees.length, x / degrees.length) / DEGREES + 360) % 360;' \
  'return degrees.reduce((a, b) => a + b, 0) / degrees.length;'

run_break "headingDelta drops its wrap, so 10 from 350 reads -340" \
  'if (raw > 180) return raw - 360;' \
  ''

run_break "headingDelta wraps at the wrong boundary" \
  'if (raw <= -180) return raw + 360;' \
  'if (raw < -180) return raw + 360;'

run_break "the trailing window keeps everything, however old" \
  'samples.filter((sample) => nowMs - sample.atMs <= SETTLE_WINDOW_MS);' \
  'samples;'

run_break "the trailing window excludes a sample exactly on its edge" \
  'nowMs - sample.atMs <= SETTLE_WINDOW_MS' \
  'nowMs - sample.atMs < SETTLE_WINDOW_MS'

echo ""
echo "caught $CAUGHT of $TOTAL"
if [ "$CAUGHT" -eq "$TOTAL" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
