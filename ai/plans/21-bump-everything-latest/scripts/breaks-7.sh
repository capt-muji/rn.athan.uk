#!/usr/bin/env bash
# Breaks for step 7 (husky 9). Run with bash, from the repository root.
# Each break edits one thing the step's guard suite pins, expects that suite to FAIL, then restores it.
set -u

SUITE=shared/__tests__/qualityGate.test.ts
CAUGHT=0
TOTAL=0

run_suite() { npx jest "$SUITE" --watchman=false --selectProjects=unit >/dev/null 2>&1; }

break_one() { # label file perl-expr expected-failing-test
  TOTAL=$((TOTAL + 1))
  local label="$1" file="$2" expr="$3" test_name="$4"
  cp "$file" "$file.bak"
  perl -0pi -e "$expr" "$file"
  if cmp -s "$file" "$file.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$file.bak" "$file"
    return
  fi
  if run_suite; then
    echo "NOT CAUGHT: $label (expected '$test_name' to fail)"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$file.bak" "$file"
}

# 1. The prepare script stops arming the hook, so a fresh clone installs no hook at all.
break_one "prepare no longer runs husky" package.json \
  's/"prepare": "husky"/"prepare": "echo skipped"/' \
  "declares a prepare script, so yarn install arms the hook"

# 2. The hook stops running the full gate, leaving lint-staged alone: no tsc, no Biome, no suite.
break_one "pre-commit drops yarn validate" .husky/pre-commit \
  's/ && yarn validate//' \
  "runs lint-staged and the full validate gate"

# 3. The hook stops running lint-staged.
break_one "pre-commit drops lint-staged" .husky/pre-commit \
  's/npx lint-staged && //' \
  "runs lint-staged and the full validate gate"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
