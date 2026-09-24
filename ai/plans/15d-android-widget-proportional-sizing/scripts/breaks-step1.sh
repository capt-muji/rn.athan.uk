#!/usr/bin/env bash
set -u
# REPO_ROOT lets an audit run this against its own worktree; the default is the
# main checkout, which is where the executor runs it
cd "${REPO_ROOT:-/Users/muji/repos/rn.athan.uk}" || exit 1
FILE=widgets/PrayerWidget.tsx
SUITE=shared/__tests__/widgetRenderer.test.ts
CAUGHT=0
TOTAL=0

run_break() {
  local label="$1" search="$2" replace="$3"
  TOTAL=$((TOTAL + 1))
  cp "$FILE" "$FILE.bak"
  perl -0pi -e "s/\Q$search\E/$replace/" "$FILE"
  if cmp -s "$FILE" "$FILE.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$FILE.bak" "$FILE"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit >/dev/null 2>&1; then
    echo "NOT CAUGHT: $label"
  else
    echo "caught: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$FILE.bak" "$FILE"
}

run_break "list takes its own rounded share instead of the remainder" \
  "const LIST_WIDTH = innerWidth - HERO_WIDTH;" \
  "const LIST_WIDTH = Math.round(innerWidth - REFERENCE_HERO_WIDTH * scale) + 1;"

run_break "hero ignores the scale and stays fixed" \
  "const HERO_WIDTH = Math.round(REFERENCE_HERO_WIDTH * scale);" \
  "const HERO_WIDTH = REFERENCE_HERO_WIDTH;"

run_break "the fallback ignores the declared minimum" \
  "ANDROID_MEDIUM_MIN_WIDTH;" \
  "347;"

run_break "the name box ignores the scale" \
  "const ROW_NAME_WIDTH = Math.round(REFERENCE_NAME_WIDTH * scale);" \
  "const ROW_NAME_WIDTH = REFERENCE_NAME_WIDTH;"

run_break "the row text never shrinks" \
  "const rowTextSize = Math.max(ROW_TEXT_MIN_SIZE, Math.min(ROW_TEXT_SIZE, Math.round(ROW_TEXT_SIZE * scale)));" \
  "const rowTextSize = ROW_TEXT_SIZE;"

run_break "the row text ignores its ceiling and grows on a wide grant" \
  "Math.min(ROW_TEXT_SIZE, Math.round(ROW_TEXT_SIZE * scale))" \
  "Math.round(ROW_TEXT_SIZE * scale)"

run_break "the inner width forgets the card padding" \
  "const innerWidth = grantedWidth - CARD_PAD_START - CARD_PAD_END;" \
  "const innerWidth = grantedWidth;"

run_break "the row text ignores its legible floor" \
  "Math.max(ROW_TEXT_MIN_SIZE, Math.min(ROW_TEXT_SIZE, Math.round(ROW_TEXT_SIZE * scale)))" \
  "Math.min(ROW_TEXT_SIZE, Math.round(ROW_TEXT_SIZE * scale))"

run_break "the fallback accepts an unusable stamped width" \
  "typeof stampedWidth === 'number' && stampedWidth > 0 ? stampedWidth : ANDROID_MEDIUM_MIN_WIDTH" \
  "stampedWidth ?? ANDROID_MEDIUM_MIN_WIDTH"

run_break "the card padding drifts from the arithmetic" \
  "APad(CARD_PAD_START, 13, CARD_PAD_END, FOOTER_BOTTOM_PAD)" \
  "APad(13, 13, 24, FOOTER_BOTTOM_PAD)"

echo "caught $CAUGHT of $TOTAL"
[ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1"
