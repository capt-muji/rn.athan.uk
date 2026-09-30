#!/bin/bash
# Step 2 breaks. Run from the repository root: bash ai/plans/41-qibla-map/scripts/breaks-2.sh
#
# Every search text below is text THIS PLAN fixes: a named constant, a key, or a line the step's
# contract gives verbatim, never a shape the executor's own code might spell differently.
set -u

SUITES="shared/__tests__/tileCache.test.ts"
CAUGHT=0
TOTAL=0

run_break() {
  local label="$1" file="$2" search="$3" replace="$4"
  TOTAL=$((TOTAL + 1))
  cp "$file" "$file.bak"
  # Driven through the environment with a non-slash delimiter: the search texts hold '/' and '*'
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

# 1. The owner's cap itself. 25 MB is a ruling, not a tuning knob.
run_break "cache cap raised" shared/tileCache.ts \
  'export const TILE_CACHE_CAP_BYTES = 25 * 1024 * 1024;' \
  'export const TILE_CACHE_CAP_BYTES = 250 * 1024 * 1024;'

# 2. Eviction itself. Without it the cache grows without limit, which is what the owner asked to bound.
run_break "eviction disabled" shared/tileCache.ts \
  'while (totalBytes(order) > TILE_CACHE_CAP_BYTES && order.length > 1) {' \
  'while (false) {'

# 3. Least-recently-used ordering. Evicting the newest is the exact opposite of the rule.
run_break "eviction takes the newest" shared/tileCache.ts \
  '    database.remove(storageKey(order[0].key));
    order = order.slice(1);' \
  '    database.remove(storageKey(order[order.length - 1].key));
    order = order.slice(0, -1);'

# 4. A read must count as a use, or the order is write order and not use order.
run_break "reads no longer refresh the order" shared/tileCache.ts \
  '  const others = readOrder().filter((held) => held.key !== key);
  writeOrder([...others, { key, bytes: buffer.byteLength }]);' \
  ''

# 5. The oversized-tile guard: one pathological tile must never empty the whole cache.
run_break "oversized tile accepted" shared/tileCache.ts \
  '  if (bytes.length > TILE_CACHE_CAP_BYTES) return;' ''

# 6. A write must move the tile to the most-recently-used end, or rewriting a tile never refreshes it.
run_break "rewrite no longer refreshes the order" shared/tileCache.ts \
  '  let order = [...readOrder().filter((held) => held.key !== key), { key, bytes: bytes.length }];' \
  '  let order = [{ key, bytes: bytes.length }, ...readOrder().filter((held) => held.key !== key)];'

echo
echo "caught $CAUGHT of $TOTAL"
if [ "$CAUGHT" = "$TOTAL" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
