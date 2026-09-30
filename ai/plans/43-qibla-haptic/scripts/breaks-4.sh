#!/bin/bash
# Breaks for session 43 step 4: the screen, the arrow and the haptic.
# Every search text is fixed by the plan: a constant the contract names, an enum member given verbatim, or a
# testID the test rows name. Run from the repository root, AFTER `npx biome check . --write`, never before:
# a formatter that rewraps a line moves a break's search text and the break silently stops testing anything.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

SCREEN=components/sheets/screens/Qibla.tsx
MAP=components/qibla/WorldMap.tsx
HOOK=hooks/useQiblaWorld.ts
SUITES="hooks/__tests__/useQiblaWorld.test.ts"
COMPONENT_SUITE="components/qibla/__tests__/WorldMap.test.tsx"

BACKUP_DIR=$(mktemp -d)
cp "$SCREEN" "$BACKUP_DIR/screen" 2>/dev/null
cp "$MAP" "$BACKUP_DIR/map" 2>/dev/null
cp "$HOOK" "$BACKUP_DIR/hook" 2>/dev/null
restore() {
  cp "$BACKUP_DIR/screen" "$SCREEN" 2>/dev/null
  cp "$BACKUP_DIR/map" "$MAP" 2>/dev/null
  cp "$BACKUP_DIR/hook" "$HOOK" 2>/dev/null
}
trap restore EXIT

caught=0
total=0

# $1 label, $2 file, $3 search, $4 replace, $5 project (unit|components)
break_one() {
  local label="$1" file="$2" search="$3" replace="$4" project="$5"
  local suite
  total=$((total + 1))
  restore
  SEARCH="$search" REPLACE="$replace" perl -0pi -e 's{\Q$ENV{SEARCH}\E}{$ENV{REPLACE}}' "$file"
  if git diff --quiet -- "$file"; then
    echo "BREAK NOT APPLIED: $label"
    return
  fi
  if [ "$project" = "components" ]; then suite="$COMPONENT_SUITE"; else suite="$SUITES"; fi
  if npx jest "$suite" --watchman=false --selectProjects="$project" >/dev/null 2>&1; then
    echo "SURVIVED: $label"
  else
    echo "caught: $label"
    caught=$((caught + 1))
  fi
}

# The iOS reference frame cost session 40 a whole session. The default points at nothing.
break_one "ios reference frame left at the arbitrary default" "$SCREEN" \
  "iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical," \
  "" "components"

# The sensor must not arm at mount: every sheet is mounted from launch.
break_one "sensor armed at mount" "$SCREEN" \
  "{isOpen && " \
  "{true && " "components"

# One tap per crossing, never per sample.
break_one "haptic fires on every reading" "$SCREEN" \
  "if (step.hasCrossed)" \
  "if (true)" "components"

# The path must be drawn from every point, not from its ends.
break_one "path drawn as one straight segment" "$MAP" \
  "path.map(" \
  "[path[0], path[path.length - 1]].map(" "components"

# Nothing may run before the user opens the sheet.
break_one "position read at mount" "$HOOK" \
  "const start = useCallback(async () => {" \
  "const start = useCallback(async () => {}, []); const unusedStart = useCallback(async () => {" "unit"

# A missing coastline must degrade, never blank the screen.
break_one "a failed tile fetch blanks the screen" "$HOOK" \
  "status: 'ready'" \
  "status: 'unavailable'" "unit"

# The world zoom is what makes both places fit one canvas.
break_one "world zoom set to street level" "device/tiles.ts" \
  "const WORLD_ZOOM = 3;" \
  "const WORLD_ZOOM = 15;" "unit"

restore
echo "caught $caught of $total"
[ "$caught" = "$total" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
