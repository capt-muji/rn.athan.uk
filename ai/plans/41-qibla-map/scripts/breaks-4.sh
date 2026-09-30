#!/bin/bash
# Step 4 breaks. Run from the repository root: bash ai/plans/41-qibla-map/scripts/breaks-4.sh
#
# Run `npx biome check --write` BEFORE this script, never after: a formatter that rewraps a line
# moves a search text and the break then silently applies to nothing. Step 3 lost a break that way.
set -u

SUITES="components/qibla/__tests__/mapProjection.test.ts shared/__tests__/qiblaSentence.test.ts"
CAUGHT=0
TOTAL=0

run_break() {
  local label="$1" file="$2" search="$3" replace="$4"
  TOTAL=$((TOTAL + 1))
  cp "$file" "$file.bak"
  SEARCH="$search" REPLACE="$replace" perl -0777 -pi -e 's{\Q$ENV{SEARCH}\E}{$ENV{REPLACE}}' "$file"
  if cmp -s "$file" "$file.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$file.bak" "$file"
    return
  fi
  if npx jest $SUITES --watchman=false --selectProjects=unit --silent >/dev/null 2>&1; then
    echo "SURVIVED: $label"
  else
    echo "caught:   $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$file.bak" "$file"
}

# 1. The drawn radius, which is the measured path budget.
run_break "drawn radius widened" components/qibla/mapProjection.ts \
  'export const DRAWN_RADIUS_METRES = 122;' 'export const DRAWN_RADIUS_METRES = 761;'

# 2. Screen y grows downward while north grows up. Getting this wrong mirrors the map.
run_break "north drawn downward" components/qibla/mapProjection.ts \
  '    y: canvas / 2 - offset.north * pointsPerMetre,' \
  '    y: canvas / 2 + offset.north * pointsPerMetre,'

# 3. East on the canvas.
run_break "east drawn westward" components/qibla/mapProjection.ts \
  '    x: canvas / 2 + offset.east * pointsPerMetre,' \
  '    x: canvas / 2 - offset.east * pointsPerMetre,'

# 4. The scale itself, without which the radius means nothing.
run_break "canvas scale wrong" components/qibla/mapProjection.ts \
  '  const pointsPerMetre = canvas / 2 / DRAWN_RADIUS_METRES;' \
  '  const pointsPerMetre = canvas / DRAWN_RADIUS_METRES;'

# 5 and 6. The ray's own axes. A swapped sine and cosine reflects the bearing about the north east diagonal,
# which looks plausible and is wrong everywhere except 45 degrees.
run_break "ray sine and cosine swapped" components/qibla/mapProjection.ts \
  '    x: canvas / 2 + Math.sin(radians) * reach,
    y: canvas / 2 - Math.cos(radians) * reach,' \
  '    x: canvas / 2 + Math.cos(radians) * reach,
    y: canvas / 2 - Math.sin(radians) * reach,'

run_break "ray drawn anticlockwise" components/qibla/mapProjection.ts \
  '  const radians = bearing * RADIANS_PER_DEGREE;' \
  '  const radians = -bearing * RADIANS_PER_DEGREE;'

# 7. The along-the-street threshold, which is what stops the screen stating a turn the map cannot support.
run_break "along-the-street threshold removed" shared/qiblaSentence.ts \
  'const ALONG_THE_STREET_DEGREES = 5;' 'const ALONG_THE_STREET_DEGREES = 0;'

# 8. The rounding, without which the screen prints a decimal it cannot justify.
run_break "turn no longer rounded" shared/qiblaSentence.ts \
  '  const rounded = Math.round(answer.turn);' '  const rounded = answer.turn;'

# 9. The side, which is half the instruction.
run_break "side dropped from the sentence" shared/qiblaSentence.ts \
  'then turn ${rounded} degrees to the ${answer.side}.' 'then turn ${rounded} degrees.'

echo
echo "caught $CAUGHT of $TOTAL"
if [ "$CAUGHT" = "$TOTAL" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
