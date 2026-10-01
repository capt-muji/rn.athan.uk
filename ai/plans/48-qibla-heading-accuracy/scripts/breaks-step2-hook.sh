#!/bin/bash
# Every decision the gate makes in the hook, broken one at a time.
set -u
SRC="hooks/useQibla.ts"
TESTS="components/sheets/screens/__tests__/Qibla.test.tsx"
CAUGHT=0
TOTAL=0

run_break() {
  local label="$1"
  local search="$2"
  local replace="$3"
  TOTAL=$((TOTAL + 1))
  cp "$SRC" "$SRC.bak"
  perl -pi -e "s|\Q$search\E|$replace|" "$SRC"
  if cmp -s "$SRC" "$SRC.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$SRC.bak" "$SRC"
    return
  fi
  if npx jest "$TESTS" --watchman=false --selectProjects=components >/dev/null 2>&1; then
    echo "SURVIVED: $label"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$SRC.bak" "$SRC"
}

run_break "the gate is removed, so a cold first reading is drawn" \
  'if (!hasSettled(window, nowMs)) return;' \
  ''

run_break "the gate is inverted" \
  'if (!hasSettled(window, nowMs)) return;' \
  'if (hasSettled(window, nowMs)) return;'

run_break "the window is not trimmed, so samples accumulate forever" \
  'const window = trailingWindow([...samplesRef.current, { degrees: trueHeading, atMs: nowMs }], nowMs);' \
  'const window = [...samplesRef.current, { degrees: trueHeading, atMs: nowMs }];'

run_break "the window is never stored, so it can never fill" \
  'samplesRef.current = window;' \
  ''

# Deletes the LAST of the two `samplesRef.current = []` lines, which is the one in the NO_HEADING
# branch. `perl -0pi` slurps the file, because a one-line-at-a-time substitution cannot tell the two
# apart, and `\Q\E` does not survive an embedded newline in a shell-quoted search string.
run_break_last_clear() {
  local label="a lost heading leaves its stale half-window behind"
  TOTAL=$((TOTAL + 1))
  cp "$SRC" "$SRC.bak"
  perl -0pi -e 's|(.*)\n(\s*)samplesRef\.current = \[\];\n(\s*)if \(!blankRef|$1\n$3if (!blankRef|s' "$SRC"
  if cmp -s "$SRC" "$SRC.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$SRC.bak" "$SRC"
    return
  fi
  if npx jest "$TESTS" --watchman=false --selectProjects=components >/dev/null 2>&1; then
    echo "SURVIVED: $label"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$SRC.bak" "$SRC"
}
run_break_last_clear

run_break "the gate sits BELOW the haptic, so a tap fires on a refused reading" \
  'if (!hasSettled(window, nowMs)) return;' \
  'const settled = hasSettled(window, nowMs);'

echo ""
echo "caught $CAUGHT of $TOTAL"
if [ "$CAUGHT" -eq "$TOTAL" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
