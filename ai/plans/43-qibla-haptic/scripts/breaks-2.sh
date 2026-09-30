#!/bin/bash
# Breaks for session 43 step 2: the great-circle path.
# Every search text is fixed by the plan: the segment count, or a term of the interpolation given verbatim.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

TARGET=shared/greatCircle.ts
SUITE=shared/__tests__/greatCircle.test.ts
BACKUP=$(mktemp)
cp "$TARGET" "$BACKUP"
restore() { cp "$BACKUP" "$TARGET"; }
trap restore EXIT

caught=0
total=0

break_one() {
  local label="$1" search="$2" replace="$3"
  total=$((total + 1))
  restore
  SEARCH="$search" REPLACE="$replace" perl -0pi -e 's{\Q$ENV{SEARCH}\E}{$ENV{REPLACE}}' "$TARGET"
  if cmp -s "$TARGET" "$BACKUP"; then
    echo "BREAK NOT APPLIED: $label"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit >/dev/null 2>&1; then
    echo "SURVIVED: $label"
  else
    echo "caught: $label"
    caught=$((caught + 1))
  fi
}

# THE defect this module exists to prevent: linear interpolation IS the rhumb line.
break_one "spherical interpolation replaced by a straight line" \
  "const fromWeight = Math.sin((1 - fraction) * arc) / Math.sin(arc);" \
  "const fromWeight = 1 - fraction;"

break_one "destination weight made linear" \
  "const toWeight = Math.sin(fraction * arc) / Math.sin(arc);" \
  "const toWeight = fraction;"

# The path must have enough points to be a curve at all.
break_one "path reduced to its two endpoints" \
  "export const PATH_SEGMENTS = 32;" \
  "export const PATH_SEGMENTS = 1;"

# The arc is what every weight is scaled by.
break_one "arc length halved" \
  "const arc = 2 * Math.asin(" \
  "const arc = 1 * Math.asin("

# The latitude term of the haversine.
break_one "haversine loses its latitude term" \
  "const halfLatitude = Math.sin((toLatitude - fromLatitude) / 2) ** 2;" \
  "const halfLatitude = 0;"

# The coincident-points guard prevents a divide by zero.
break_one "zero arc no longer guarded" \
  "if (arc === 0) return [from, to];" \
  "if (false) return [from, to];"

# Cartesian reconstruction: z carries latitude.
break_one "latitude dropped from the reconstruction" \
  "const z = fromWeight * Math.sin(fromLatitude) + toWeight * Math.sin(toLatitude);" \
  "const z = 0;"

restore
echo "caught $caught of $total"
[ "$caught" = "$total" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
