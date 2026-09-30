#!/bin/bash
# Breaks for session 43 step 1: our own qibla bearing.
# Every search text is fixed by the plan: a constant value, or a term of the formula the plan gives verbatim.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

TARGET=shared/qibla.ts
SUITE=shared/__tests__/qibla.test.ts
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

# The coordinates are the whole point of the step.
break_one "kaaba latitude wrong by a degree" \
  "{ latitude: 21.4225, longitude: 39.8262 }" \
  "{ latitude: 22.4225, longitude: 39.8262 }"

break_one "kaaba longitude wrong by a degree" \
  "{ latitude: 21.4225, longitude: 39.8262 }" \
  "{ latitude: 21.4225, longitude: 40.8262 }"

# Swapping the two atan2 terms gives a plausible wrong answer, which is why it is a break.
break_one "east and north swapped" \
  "Math.atan2(east, north)" \
  "Math.atan2(north, east)"

# Dropping the cos term turns the great circle into something close to a rhumb line.
break_one "longitude span no longer weighted by latitude" \
  "const east = Math.sin(longitudeSpan) * Math.cos(toLatitude);" \
  "const east = Math.sin(longitudeSpan);"

# The north term's second half is what makes it a great circle at all.
break_one "north term loses its correction" \
  "Math.cos(fromLatitude) * Math.sin(toLatitude) -" \
  "Math.cos(fromLatitude) * Math.sin(toLatitude) + 0 *"

# The result must be normalised, or bearings west of the Kaaba come back negative.
break_one "result not normalised" \
  "return normaliseHeading(Math.atan2(east, north) / DEGREES_TO_RADIANS);" \
  "return Math.atan2(east, north) / DEGREES_TO_RADIANS;"

# Radians, not degrees, into the trigonometry.
break_one "degrees fed straight into the trigonometry" \
  "const DEGREES_TO_RADIANS = Math.PI / 180;" \
  "const DEGREES_TO_RADIANS = 1;"

restore
echo "caught $caught of $total"
[ "$caught" = "$total" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
