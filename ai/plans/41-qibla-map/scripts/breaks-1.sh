#!/bin/bash
# Step 1 breaks. Run from the repository root: bash ai/plans/41-qibla-map/scripts/breaks-1.sh
#
# Each break makes one exact substitution in a file this step writes, runs the tests that must
# notice, and restores the file. A substitution that changes nothing prints BREAK NOT APPLIED and
# counts as not caught, because a break that cannot be applied proves nothing about the tests.
set -u

SUITES="shared/__tests__/tileGeometry.test.ts shared/__tests__/vectorTile.test.ts shared/__tests__/qiblaStreet.test.ts hooks/__tests__/useQiblaMap.test.ts"
CAUGHT=0
TOTAL=0

run_break() {
  local label="$1" file="$2" search="$3" replace="$4"
  TOTAL=$((TOTAL + 1))
  cp "$file" "$file.bak"
  # The search and replace texts hold '/' (every Math.PI division), so the substitution is driven
  # through the environment with a non-slash delimiter rather than interpolated into the perl source.
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

# 1. The tunnel NAME guard. Without it "Queensway Tunnel" is named in Birmingham, a real measured defect.
run_break "tunnel name guard removed" shared/qiblaStreet.ts \
  'return !isTunnelName(name);' 'return true;'

# 2. The tunnel TAG guard. The name guard alone misses a tunnel whose name does not say so.
run_break "tunnel tag guard removed" shared/qiblaStreet.ts \
  'if (tags.is_tunnel === true) return false;' ''

# 3. The visible-kind filter. Without it the subway under Manhattan is named as a street.
run_break "rail and path kinds admitted" shared/qiblaStreet.ts \
  "const VISIBLE_KINDS = new Set(['highway', 'major_road', 'minor_road', 'other']);" \
  "const VISIBLE_KINDS = new Set(['highway', 'major_road', 'minor_road', 'other', 'rail', 'path']);"

# 4. The sidewalk and service exclusions.
run_break "excluded details emptied" shared/qiblaStreet.ts \
  "const EXCLUDED_DETAILS = new Set(['sidewalk', 'crossing', 'steps', 'corridor', 'service']);" \
  "const EXCLUDED_DETAILS = new Set([]);"

# 5. The straightness floor. A bent road has no single direction to sight along.
run_break "straightness floor dropped" shared/qiblaStreet.ts \
  'const MINIMUM_STRAIGHTNESS = 0.95;' 'const MINIMUM_STRAIGHTNESS = 0;'

# 6. The length floor.
run_break "length floor dropped" shared/qiblaStreet.ts \
  'const MINIMUM_LENGTH_METRES = 40;' 'const MINIMUM_LENGTH_METRES = 0;'

# 7. The search radius, which decides whether a street is the one in front of the user.
run_break "search radius widened" shared/qiblaStreet.ts \
  'export const SEARCH_RADIUS_METRES = 122;' 'export const SEARCH_RADIUS_METRES = 1220;'

# 8. The acute reading. Without the flip the same line digitised backwards gives a mirrored instruction.
run_break "acute flip removed" shared/qiblaStreet.ts \
  "    return { street, turn: HALF_TURN - magnitude, side: isRight ? 'left' : 'right' };" \
  "    return { street, turn: magnitude, side: isRight ? 'right' : 'left' };"

# 9. The side of the turn.
run_break "turn side inverted" shared/qiblaStreet.ts \
  "  return { street, turn: magnitude, side: isRight ? 'right' : 'left' };" \
  "  return { street, turn: magnitude, side: isRight ? 'left' : 'right' };"

# 10. Nearness dominating the choice of street.
run_break "nearness weight removed" shared/qiblaStreet.ts \
  'return nearness * 2 + reach;' 'return reach;'

# 11. Deduplication by name: one road split into segments must be one reference.
run_break "dedupe disabled" shared/qiblaStreet.ts \
  '      if (seen.has(street.name)) return false;' '      if (false) return false;'

# 11a. The ranking itself, which the caller re-applies across the whole tile grid.
run_break "ranking disabled" shared/qiblaStreet.ts \
  '    .sort((first, second) => usefulness(second) - usefulness(first))' ''

# 12. Zigzag decoding, which every signed coordinate in every tile depends on.
run_break "zigzag sign dropped" shared/vectorTile.ts \
  'const zigzagToSigned = (encoded: number): number => (encoded >> 1) ^ -(encoded & 1);' \
  'const zigzagToSigned = (encoded: number): number => encoded >> 1;'

# 13. Coordinates accumulating: geometry is a stream of relative moves.
run_break "coordinates no longer accumulate" shared/vectorTile.ts \
  '      x += zigzagToSigned(readVarint(cursor));' \
  '      x = zigzagToSigned(readVarint(cursor));'

# 14. MoveTo starting a new part.
run_break "moveTo no longer splits parts" shared/vectorTile.ts \
  '      if (command === COMMAND_MOVE_TO && current.length > 0) {' '      if (false) {'

# 15. The default extent, which decides the scale of every tile that omits one.
run_break "default extent changed" shared/vectorTile.ts \
  'const DEFAULT_EXTENT = 4096;' 'const DEFAULT_EXTENT = 256;'

# 16. Web Mercator's y, where a sign error mirrors the world north to south.
run_break "mercator y inverted" shared/tileGeometry.ts \
  'const y = Math.floor(((1 - mercatorY / Math.PI) / 2) * tilesPerAxis);' \
  'const y = Math.floor(((1 + mercatorY / Math.PI) / 2) * tilesPerAxis);'

# 17. The inverse projection, which turns a tile point back into a position.
run_break "inverse mercator inverted" shared/tileGeometry.ts \
  'const mercatorY = Math.PI * (1 - (2 * (tile.y + point.y / extent)) / tilesPerAxis);' \
  'const mercatorY = Math.PI * (1 + (2 * (tile.y + point.y / extent)) / tilesPerAxis);'

# 18. Longitude scaling by latitude, which is what makes a local metre a metre.
run_break "longitude scale no longer shrinks" shared/tileGeometry.ts \
  'longitude: 111412.84 * Math.cos(latitude * RADIANS_PER_DEGREE),' 'longitude: 111412.84,'

echo
echo "caught $CAUGHT of $TOTAL"
if [ "$CAUGHT" = "$TOTAL" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
