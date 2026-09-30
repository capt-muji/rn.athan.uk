#!/bin/bash
# Breaks for session 43 step 3: the alignment state machine.
# Each break is an exact substitution on text the PLAN fixes: a constant name, a constant value, or a
# comparison the contract gives. Run from the repository root.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1

TARGET=shared/qiblaAlignment.ts
SUITE=shared/__tests__/qiblaAlignment.test.ts
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

# The hysteresis gap is the whole defence against a buzzing hand: collapsing it must fail the chatter test.
break_one "hysteresis removed, leave equals enter" \
  "export const LEAVE_DEGREES = 8;" \
  "export const LEAVE_DEGREES = 4;"

# The crossing bound is what keeps the antipode silent.
break_one "crossing bound removed" \
  "export const CROSSING_LIMIT_DEGREES = 90;" \
  "export const CROSSING_LIMIT_DEGREES = 360;"

# Entering must latch, or every sample on the line taps.
break_one "alignment never latches" \
  "return { state: { isAligned: true, previousOffset: offset }, hasCrossed: true };" \
  "return { state: { isAligned: false, previousOffset: offset }, hasCrossed: true };"

# Leaving must clear the latch, or the phone can only ever tap once.
break_one "alignment never released" \
  "if (isAligned && distance > LEAVE_DEGREES) {" \
  "if (false && isAligned && distance > LEAVE_DEGREES) {"

# The entry window must be a window, not an exact equality.
break_one "entry window widened to a half turn" \
  "export const ENTER_DEGREES = 4;" \
  "export const ENTER_DEGREES = 180;"

# Both readings must be near the line for a crossing to count.
break_one "crossing checks only the current reading" \
  "Math.abs(previousOffset) < CROSSING_LIMIT_DEGREES" \
  "true"

# The sign comparison is the crossing itself.
break_one "sign change no longer detected" \
  "Math.sign(offset) !== Math.sign(previousOffset)" \
  "false"

# The offset must be the shorter way round, or wrapping at north breaks.
break_one "offset no longer wraps" \
  "const offset = shortestDelta(heading, qibla);" \
  "const offset = qibla - heading;"

restore
echo "caught $caught of $total"
[ "$caught" = "$total" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
