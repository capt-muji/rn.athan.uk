#!/usr/bin/env bash
# Breaks for step 8 (jotai 3). Run with bash, from the repository root.
# Each break edits one decision the step's change makes, expects the named suite to FAIL, then restores it.
set -u

SYNC_SUITE=stores/__tests__/syncLoadable.test.ts
COMP_SUITE=__tests__/app/Navigation.test.tsx
CAUGHT=0
TOTAL=0

break_one() { # label file perl-expr suite project expected-failing-test
  TOTAL=$((TOTAL + 1))
  local label="$1" file="$2" expr="$3" suite="$4" project="$5" test_name="$6"
  cp "$file" "$file.bak"
  perl -0pi -e "$expr" "$file"
  if cmp -s "$file" "$file.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$file.bak" "$file"
    return
  fi
  if npx jest "$suite" --watchman=false --selectProjects="$project" >/dev/null 2>&1; then
    echo "NOT CAUGHT: $label (expected '$test_name' to fail)"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$file.bak" "$file"
}

# 1. The sentinel stops being a distinct object, so "still loading" and a resolved value collide and the launch
#    screen can never leave its loading branch.
break_one "loadable reports loading whatever the atom resolved to" stores/sync.ts \
  's/return data === LOADING \? LOADING :/return true ? LOADING :/' \
  "$SYNC_SUITE" unit "settles with hasData once the launch sync resolves"

# 2. A rejection propagates instead of being reported as hasError, so the launch screen never sees the error.
break_one "loadable rethrows instead of reporting hasError" stores/sync.ts \
  's/return \{ state: '"'"'hasError'"'"', error \};/throw error;/' \
  "$SYNC_SUITE" unit "reports hasError carrying the rejection"

# 3. The unit project stops transforming jotai's ESM, so every suite touching a store fails to load.
break_one "unit project stops transforming jotai" jest.config.js \
  "s{transformIgnorePatterns: \['/node_modules/\(\?!jotai\)'\],}{transformIgnorePatterns: ['/node_modules/'],}" \
  "$SYNC_SUITE" unit "the suite loads at all"

# 4. The components project stops transforming jotai.
break_one "components project stops transforming jotai" jest.config.js \
  's/\|reanimated-color-picker\|jotai\)\)/|reanimated-color-picker))/' \
  "$COMP_SUITE" components "the suite loads at all"

# 5. The per-test store is built without the atom-state map, so state leaks between tests.
break_one "component store drops its atom-state map" jest.components.setup.js \
  's/\[internals\.INTERNAL_KEY_atomStateMap\]: replaceableWeakMap\(\),//' \
  "$COMP_SUITE" components "every test starts from a fresh install"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
