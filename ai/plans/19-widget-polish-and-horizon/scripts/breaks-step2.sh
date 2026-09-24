#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FILE=scripts/generate-widget-assets.py
SUITE=shared/__tests__/widgetAssets.test.ts
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
  if npx jest "$SUITE" --watchman=false --selectProjects=unit > "$TMPDIR/break-19-2.log" 2>&1; then
    echo "NOT CAUGHT: $LABEL"
  else
    echo "caught: $LABEL"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$FILE.bak" "$FILE"
}

try "the dark card drifts back to the bright purple" 'CARD_DARK = css("#09142d")' 'CARD_DARK = css("#252387")'
try "the dark card drifts to any other colour" 'CARD_DARK = css("#09142d")' 'CARD_DARK = css("#030d25")'
try "a pill colour drifts off the layout palette" 'css("#2743e0")' 'css("#2743e1")'

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
