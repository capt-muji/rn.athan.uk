#!/usr/bin/env bash
# Session 45 break script. Run from the repository root: bash $TMPDIR/breaks-45.sh
#
# The substitution uses | as its delimiter, because every line of these files holds a / (division, and JSDoc),
# which made a /-delimited script fail to compile at all while printing BREAK NOT APPLIED for each break.
set -u
caught=0
total=0

run_break() {
  label="$1"; file="$2"; suite="$3"
  export BREAK_SEARCH="$4" BREAK_REPLACE="$5"
  total=$((total + 1))
  cp "$file" "$file.bak"
  perl -0pi -e 's|\Q$ENV{BREAK_SEARCH}\E|$ENV{BREAK_REPLACE}|' "$file"
  if cmp -s "$file" "$file.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$file.bak" "$file"
    return
  fi
  if npx jest "$suite" --watchman=false --selectProjects=unit >/dev/null 2>&1; then
    echo "SURVIVED: $label"
  else
    echo "caught:   $label"
    caught=$((caught + 1))
  fi
  mv "$file.bak" "$file"
}

G=shared/qiblaGeometry.ts
GS=shared/__tests__/qiblaGeometry.test.ts
A=shared/qiblaAlignment.ts
AS=shared/__tests__/qiblaAlignment.test.ts

run_break "the rhumb line: a straight line instead of the great circle" "$G" "$GS" \
  'points.push(projectMercator(greatCirclePoint(from, index / (QIBLA_PATH_POINTS - 1)), size));' \
  'const t = index / (QIBLA_PATH_POINTS - 1); points.push(projectMercator({ latitude: from.latitude + (KAABA.latitude - from.latitude) * t, longitude: from.longitude + (KAABA.longitude - from.longitude) * t }, size));'

run_break "bearing: swap the atan2 arguments" "$G" "$GS" \
  'return (Math.atan2(y, x) / DEGREES + 360) % 360;' \
  'return (Math.atan2(x, y) / DEGREES + 360) % 360;'

run_break "bearing: drop the wrap, so a westward qibla reads negative" "$G" "$GS" \
  'return (Math.atan2(y, x) / DEGREES + 360) % 360;' \
  'return Math.atan2(y, x) / DEGREES;'

run_break "no latitude clamp, so a polar position runs to infinity" "$G" "$GS" \
  'const clamped = Math.max(-MERCATOR_MAX_LATITUDE, Math.min(MERCATOR_MAX_LATITUDE, point.latitude));' \
  'const clamped = point.latitude;'

run_break "no edge split, so the route streaks back across the whole map" "$G" "$GS" \
  'if (Math.abs(points[index].x - points[index - 1].x) > size / 2) runs.push([]);' \
  'if (size < 0) runs.push([]);'

run_break "the degenerate case divides by zero at Makkah" "$G" "$GS" \
  'if (angular === 0) return { latitude: from.latitude, longitude: from.longitude };' \
  ''

run_break "Mercator y not inverted, so north and south swap" "$G" "$GS" \
  'const y = 0.5 - Math.log(Math.tan(Math.PI / 4 + (clamped * DEGREES) / 2)) / (2 * Math.PI);' \
  'const y = 0.5 + Math.log(Math.tan(Math.PI / 4 + (clamped * DEGREES) / 2)) / (2 * Math.PI);'

run_break "the path stops short of Makkah" "$G" "$GS" \
  'points.push(projectMercator(greatCirclePoint(from, index / (QIBLA_PATH_POINTS - 1)), size));' \
  'points.push(projectMercator(greatCirclePoint(from, (index / (QIBLA_PATH_POINTS - 1)) * 0.8), size));'

run_break "the equator is not at the centre of the map" "$G" "$GS" \
  'return { x: ((point.longitude + 180) / 360) * size, y: y * size };' \
  'return { x: ((point.longitude + 180) / 360) * size, y: y * size * 0.9 };'

run_break "one threshold instead of two: the buzz" "$A" "$AS" \
  'return wasAligned ? away <= ALIGNMENT_EXIT_DEGREES : away <= ALIGNMENT_ENTER_DEGREES;' \
  'return away <= ALIGNMENT_ENTER_DEGREES;'

run_break "the hysteresis runs backwards" "$A" "$AS" \
  'return wasAligned ? away <= ALIGNMENT_EXIT_DEGREES : away <= ALIGNMENT_ENTER_DEGREES;' \
  'return wasAligned ? away <= ALIGNMENT_ENTER_DEGREES : away <= ALIGNMENT_EXIT_DEGREES;'

run_break "no absolute value, so only one side of the line ever counts" "$A" "$AS" \
  'const away = Math.abs(offset);' \
  'const away = offset;'

run_break "the offset is not wrapped, so a tap fires at the antipode" "$A" "$AS" \
  'if (raw > 180) return raw - 360;' \
  'if (raw > 3600) return raw - 360;'

run_break "the lower wrap is missing" "$A" "$AS" \
  'if (raw <= -180) return raw + 360;' \
  'if (raw <= -3600) return raw + 360;'

run_break "the tap repeats while the user holds still" "$A" "$AS" \
  'export const shouldTap = (wasAligned: boolean, nowAligned: boolean): boolean => !wasAligned && nowAligned;' \
  'export const shouldTap = (_wasAligned: boolean, nowAligned: boolean): boolean => nowAligned;'

run_break "the tap fires on leaving rather than arriving" "$A" "$AS" \
  'export const shouldTap = (wasAligned: boolean, nowAligned: boolean): boolean => !wasAligned && nowAligned;' \
  'export const shouldTap = (wasAligned: boolean, nowAligned: boolean): boolean => wasAligned && !nowAligned;'

run_break "the enter threshold is opened to the exit one" "$A" "$AS" \
  'export const ALIGNMENT_ENTER_DEGREES = 4;' \
  'export const ALIGNMENT_ENTER_DEGREES = 8;'

run_break "the exit threshold is closed to the enter one" "$A" "$AS" \
  'export const ALIGNMENT_EXIT_DEGREES = 8;' \
  'export const ALIGNMENT_EXIT_DEGREES = 4;'

echo "caught $caught of $total"
[ "$caught" -eq "$total" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
