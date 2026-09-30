#!/bin/bash
# Step 3 breaks. Run from the repository root: bash ai/plans/41-qibla-map/scripts/breaks-3.sh
#
# Every search text is text this plan fixes: a header field offset, a named constant, or a line the
# contract gives verbatim.
set -u

SUITES="shared/__tests__/pmtiles.test.ts shared/__tests__/pmtilesLive.test.ts device/__tests__/tiles.test.ts"
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

# 1 to 4. The header field offsets. An off-by-one here produced "minzoom 15, maxzoom 0" during development,
# which is the wrong-but-plausible result the live-bytes suite exists to catch.
run_break "root offset field moved" shared/pmtiles.ts \
  'rootOffset: readUint64(bytes, 8),' 'rootOffset: readUint64(bytes, 16),'

run_break "leaf offset field moved" shared/pmtiles.ts \
  'leafOffset: readUint64(bytes, 40),' 'leafOffset: readUint64(bytes, 48),'

run_break "zoom fields swapped" shared/pmtiles.ts \
  '    minZoom: bytes[100],
    maxZoom: bytes[101],' \
  '    minZoom: bytes[101],
    maxZoom: bytes[100],'

run_break "bounds scale wrong" shared/pmtiles.ts \
  'const COORDINATE_SCALE = 1e7;' 'const COORDINATE_SCALE = 1e6;'

# 5. The 64-bit read, where swapping the halves gives a plausible but wildly wrong offset.
run_break "uint64 halves swapped" shared/pmtiles.ts \
  'return view.getUint32(at + 4, true) * 4294967296 + view.getUint32(at, true);' \
  'return view.getUint32(at, true) * 4294967296 + view.getUint32(at + 4, true);'

# 6. The magic check, which is what turns a wrong URL into an error rather than nonsense.
run_break "magic check removed" shared/pmtiles.ts \
  "  if (magic !== 'PMTiles') throw new Error(\`PMTiles: unexpected magic \${magic}\`);" ''

# 7. The version check.
run_break "version check removed" shared/pmtiles.ts \
  '  if (version !== SUPPORTED_VERSION) throw new Error(`PMTiles: unsupported version ${version}`);' ''

# 8. The Hilbert rotation, without which neighbouring tiles scatter through the file.
run_break "hilbert rotation removed" shared/pmtiles.ts \
  '    if (up === 0) {' '    if (false) {'

# 9. The per-zoom offset that makes a tile id unique across zoom levels.
run_break "zoom offset dropped" shared/pmtiles.ts \
  '  for (let level = 0; level < tile.zoom; level += 1) id += 4 ** level;' ''

# 10. The directory's zero-offset shorthand. The search text is the second line only, because Biome wraps
# this assignment across two lines and a single-line search silently matches nothing.
run_break "zero-offset shorthand ignored" shared/pmtiles.ts \
  '      stored === 0 && index > 0 ? entries[index - 1].offset + entries[index - 1].length : stored - 1;' \
  '      stored - 1;'

# 11. Tile ids are stored as deltas, so reading them as absolutes breaks every lookup past the first.
run_break "tile ids read as absolutes" shared/pmtiles.ts \
  '    tileId += readVarint(bytes, cursor);' '    tileId = readVarint(bytes, cursor);'

# 12. The run-length span, which is how empty ocean is stored once rather than thousands of times.
run_break "run length ignored" shared/pmtiles.ts \
  '  return tileId < candidate.tileId + candidate.runLength ? candidate : null;' '  return candidate;'

# 13. The leaf pointer, without which a two-level archive reads a directory as a tile.
run_break "leaf pointer misread" shared/pmtiles.ts \
  'export const pointsAtLeaf = (entry: DirectoryEntry): boolean => entry.runLength === 0;' \
  'export const pointsAtLeaf = (entry: DirectoryEntry): boolean => entry.runLength === 1;'

# 14. The vector-tile check, which stops the decoder being handed a PNG.
run_break "tile type check inverted" shared/pmtiles.ts \
  'export const holdsVectorTiles = (header: PmTilesHeader): boolean => header.tileType === MVT_TILE_TYPE;' \
  'export const holdsVectorTiles = (header: PmTilesHeader): boolean => header.tileType !== MVT_TILE_TYPE;'

echo
echo "caught $CAUGHT of $TOTAL"
if [ "$CAUGHT" = "$TOTAL" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
