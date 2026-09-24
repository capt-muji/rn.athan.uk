#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FILE=shared/widgetTimeline.ts
SUITE=shared/__tests__/widgetTimeline.test.ts
CAUGHT=0
TOTAL=0

try() {
  LABEL="$1"; FROM="$2"; TO="$3"
  TOTAL=$((TOTAL + 1))
  cp "$FILE" "$FILE.bak"
  perl -0pi -e "s{\\Q$FROM\\E}{$TO}" "$FILE"
  if cmp -s "$FILE" "$FILE.bak"; then
    echo "BREAK NOT APPLIED: $LABEL"
    mv "$FILE.bak" "$FILE"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit > "$TMPDIR/break-19-3.log" 2>&1; then
    echo "NOT CAUGHT: $LABEL"
  else
    echo "caught: $LABEL"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$FILE.bak" "$FILE"
}

try "the horizon creeps back to 30 days" "TIMELINE_DAYS = 7" "TIMELINE_DAYS = 30"
try "the horizon creeps to 10 days" "TIMELINE_DAYS = 7" "TIMELINE_DAYS = 10"
try "the horizon shrinks below the ruling" "TIMELINE_DAYS = 7" "TIMELINE_DAYS = 3"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
