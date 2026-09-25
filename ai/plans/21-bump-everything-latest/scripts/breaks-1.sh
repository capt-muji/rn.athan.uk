#!/usr/bin/env bash
# Breaks for step 1 (biome 2.5.14). Run with bash, from the repository root.
# Biome's config is not covered by a Jest suite: the guard is Biome's own exit code, so that is what is broken here.
set -u

CAUGHT=0
TOTAL=0

break_one() { # label perl-expr what-should-fail
  TOTAL=$((TOTAL + 1))
  local label="$1" expr="$2" what="$3"
  cp biome.json biome.json.bak
  perl -0pi -e "$expr" biome.json
  if cmp -s biome.json biome.json.bak; then
    echo "BREAK NOT APPLIED: $label"
    mv biome.json.bak biome.json
    return
  fi
  if npx biome check . --error-on-warnings >/dev/null 2>&1; then
    echo "NOT CAUGHT: $label (expected $what)"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv biome.json.bak biome.json
}

# 1. The schema stops matching the CLI, which is the exact defect this step closes. Biome still exits 0 on a
#    mismatch, so this break asserts on the message rather than the exit code.
TOTAL=$((TOTAL + 1))
cp biome.json biome.json.bak
perl -0pi -e 's{schemas/2\.5\.14/}{schemas/2.5.13/}' biome.json
if cmp -s biome.json biome.json.bak; then
  echo "BREAK NOT APPLIED: schema version falls behind the CLI"
else
  if npx biome check . --error-on-warnings 2>&1 | grep -q "configuration schema version does not match"; then
    echo "caught: schema version falls behind the CLI"
    CAUGHT=$((CAUGHT + 1))
  else
    echo "NOT CAUGHT: schema version falls behind the CLI (expected the mismatch notice)"
  fi
fi
mv biome.json.bak biome.json

# 2. The formatter's line width changes, so every file disagrees with the committed formatting.
break_one "line width changes from 120" \
  's/"lineWidth": 120/"lineWidth": 80/' \
  "Biome to report formatting differences"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
