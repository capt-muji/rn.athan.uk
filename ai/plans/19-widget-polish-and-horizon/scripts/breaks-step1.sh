#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FILE=widgets/PrayerWidget.tsx
SUITE=shared/__tests__/widgetRenderer.test.ts
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
  if npx jest "$SUITE" --watchman=false --selectProjects=unit > "$TMPDIR/break-19-1.log" 2>&1; then
    echo "NOT CAUGHT: $LABEL"
  else
    echo "caught: $LABEL"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$FILE.bak" "$FILE"
}

try "pill spans the whole column again" "APad(PILL_LEAD, 1, 0, 0)" "APad(0, 1, 0, 0)"
try "rows keep their old fixed inset" "APad(ROWS_LEAD, 0, 0, 0)" "APad(12, 0, 12, 0)"
try "the narrow-grant clamp is dropped" "Math.max(0, Math.min(ROW_GUTTER, Math.floor((LIST_WIDTH - rowContentWidth) / 2)))" "ROW_GUTTER"
try "the gutter widens past the approved inset" "const ROW_GUTTER = 12;" "const ROW_GUTTER = 20;"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
