#!/usr/bin/env bash
# Break step 2's qibla maths six ways, and prove the tests catch every one.
# Run from the repository root with: bash ai/plans/37-qibla-compass/scripts/break-step-2.sh

set -u

FILES=(shared/qibla.ts device/qibla.ts components/sheets/screens/Qibla.tsx components/sheets/screens/Settings.tsx components/sheets/parts/Sheet.tsx)
BACKUP_DIR="$(mktemp -d)"
# Keyed on the full path with separators flattened: two of these files are both named qibla.ts, and a basename key
# silently restores one over the other
key() { echo "${1//\//__}"; }
for file in "${FILES[@]}"; do cp "$file" "$BACKUP_DIR/$(key "$file")"; done
restore() { for file in "${FILES[@]}"; do cp "$BACKUP_DIR/$(key "$file")" "$file"; done; }
trap 'restore; rm -rf "$BACKUP_DIR"' EXIT

caught=0
total=0

# $1 label, $2 file, $3 search text, $4 replacement, $5 the suite that must fail, $6 the test expected to fail
break_one() {
  local label="$1" target="$2" search="$3" replace="$4" suite="$5" expects="$6"
  total=$((total + 1))
  restore

  if ! grep -qF "$search" "$target"; then
    echo "BREAK NOT APPLIED: $label"
    return
  fi

  python3 - "$target" "$search" "$replace" << 'PY'
import sys
path, search, replace = sys.argv[1], sys.argv[2], sys.argv[3]
source = open(path).read()
open(path, "w").write(source.replace(search, replace, 1))
PY

  local project=unit
  case "$suite" in *.tsx) project=components;; esac

  if npx jest "$suite" --watchman=false --selectProjects=$project --silent > /dev/null 2>&1; then
    echo "SURVIVED: $label (expected to fail: $expects)"
  else
    echo "caught:   $label"
    caught=$((caught + 1))
  fi
}

MATHS=shared/__tests__/qibla.test.ts
DEVICE=device/__tests__/qibla.test.ts
SHEET=components/sheets/screens/__tests__/Qibla.test.tsx
SETTINGS=components/sheets/screens/__tests__/Settings.test.tsx

# 1. The rhumb-line / flat-map bug the IJARPED study found in 5 of the 20 most-downloaded qibla apps.
break_one "great circle becomes a flat-map bearing" shared/qibla.ts \
  "const bearing = Qibla(coordinates);" \
  "const bearing = (Math.atan2(KAABA.longitude - position.longitude, KAABA.latitude - position.latitude) * 180) / Math.PI;" \
  "$MATHS" "the invariant and published-value tests"

# 2. Android's negative heading left unnormalised.
break_one "heading normalisation drops the negative case" shared/qibla.ts \
  "((heading % FULL_TURN) + FULL_TURN) % FULL_TURN" \
  "heading % FULL_TURN" \
  "$MATHS" "normaliseHeading on New York, Seattle and Cape Town"

# 3. The needle spins the long way round.
break_one "shortest delta becomes a naive difference" shared/qibla.ts \
  "const difference = to - from + HALF_TURN;" \
  "const difference = to - from;" \
  "$MATHS" "shortestDelta wrap cases"

# 4. The exact half turn resolves inconsistently.
break_one "the half-turn tie is left at minus 180" shared/qibla.ts \
  "return delta === -HALF_TURN ? HALF_TURN : delta;" \
  "return delta;" \
  "$MATHS" "shortestDelta from 0 to 180"

# 5. The animated angle wraps, so the needle spins across the seam.
break_one "the animated angle wraps instead of accumulating" shared/qibla.ts \
  "current + shortestDelta(current, heading)" \
  "heading" \
  "$MATHS" "unwrapAngle continuity"

# 6. A second source of truth for the Kaaba.
break_one "the Kaaba constant drifts from adhan" shared/qibla.ts \
  "latitude: 21.4225241, longitude: 39.8261818" \
  "latitude: 21.4225, longitude: 39.8262" \
  "$MATHS" "states the same Kaaba position adhan computes from"

# 7. The -1 sentinel drawn as a real bearing, which points the arrow confidently at nothing.
break_one "the not-ready sentinel is drawn" device/qibla.ts \
  "if (heading.trueHeading === NO_HEADING) return;" \
  "" \
  "$DEVICE" "ignores the not-ready reading rather than drawing it"

# 8. Precision the feature cannot use, spending battery for nothing.
break_one "the position asks for the finest accuracy" device/qibla.ts \
  "accuracy: Location.Accuracy.Balanced" \
  "accuracy: Location.Accuracy.Highest" \
  "$DEVICE" "asks for city accuracy rather than the finest the phone offers"

# 9. A permission failure read as a grant.
break_one "a permission read failure answers true" device/qibla.ts \
  "logger.warn('QIBLA: Failed to read location permissions', { error });
    return false;" \
  "logger.warn('QIBLA: Failed to read location permissions', { error });
    return true;" \
  "$DEVICE" "answers false when the permission cannot be read"

# 10. The sensor outliving the sheet, which is Performance Design Rule 7.
break_one "the sensor is never stopped" components/sheets/screens/Qibla.tsx \
  "stopHeading.current?.();" \
  "" \
  "$SHEET" "stops watching when it is closed"

# 11. The sensor armed at mount, so it runs from launch on every device.
break_one "the sensor is armed before the sheet opens" components/sheets/screens/Qibla.tsx \
  "onPresent={handlePresent}" \
  "" \
  "$SHEET" "watches the heading once it is opened"

# 12. A second present without a dismiss, which strands the first stream forever.
break_one "a re-present strands the previous stream" components/sheets/screens/Qibla.tsx \
  "    releaseSensor();
    setReading({ status: 'looking' });" \
  "    setReading({ status: 'looking' });" \
  "$SHEET" "releases the previous stream when it is presented twice without a dismiss"

# 13. A one-time present callback, which arms the sensor once and leaves the needle dead on every later open.
break_one "the sensor arms only on the first open" components/sheets/screens/Qibla.tsx \
  "onPresent={handlePresent}" \
  "onFirstPresent={handlePresent}" \
  "$SHEET" "arms the sensor again every time it is reopened"

# 14. The gate opened without a permission, so the compass points from nowhere.
break_one "the qibla row opens without a permission" components/sheets/screens/Settings.tsx \
  "if (!granted) return;" \
  "" \
  "$SETTINGS" "opens nothing when the permission is refused"

restore
echo
echo "caught $caught of $total"
[ "$caught" -eq "$total" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
