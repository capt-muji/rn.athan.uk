#!/usr/bin/env bash
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

SUITE=components/sheets/screens/__tests__/Qibla.test.tsx
TARGET=components/sheets/screens/Qibla.tsx
CAUGHT=0
TOTAL=0
UNEXPECTED=0

run_break() {
  local label="$1" search="$2" replace="$3"
  TOTAL=$((TOTAL + 1))
  cp "$TARGET" "$TARGET.bak"
  perl -0pi -e "s/\Q$search\E/$replace/" "$TARGET"
  if cmp -s "$TARGET" "$TARGET.bak"; then
    echo "BREAK NOT APPLIED: $label"
    UNEXPECTED=$((UNEXPECTED + 1))
    mv "$TARGET.bak" "$TARGET"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=components >/dev/null 2>&1; then
    echo "SURVIVED: $label"
    UNEXPECTED=$((UNEXPECTED + 1))
  else
    echo "CAUGHT: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$TARGET.bak" "$TARGET"
}

run_break "the owner's wording" "Hold flat and turn slowly" "Hold flat and turn"
run_break "the one-line cap" "numberOfLines={1}" "numberOfLines={2}"

echo "CAUGHT: $CAUGHT of $TOTAL"
echo "ALL AS EXPECTED: $([ "$UNEXPECTED" = "0" ] && echo 1 || echo 0)"
