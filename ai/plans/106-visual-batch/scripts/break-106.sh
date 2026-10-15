#!/usr/bin/env bash
# Break script for plan 106. Three modes:
#   break-106.sh face  - step 1: swap the four ar family values back, expect the typography test red
#   break-106.sh arrow - step 2: restore TIP_OVERLAP to 4, expect the constant pin red
#   break-106.sh gap   - step 3: re-insert the gap span, expect the rewritten case red
# All modes restore from the backup copy. Run from the repository root.
set -u
mode="${1:?usage: break-106.sh face|arrow|gap}"

break_face() {
  file="shared/typography.ts"
  cp "$file" "$file.break-106-backup" || return 2
  perl -pi -e "s/familyRegular: 'Rubik-Regular'/familyRegular: 'NotoSansArabic-Regular'/; s/familyMedium: 'Rubik-Medium'/familyMedium: 'NotoSansArabic-Medium'/; s/familyDigits: 'Rubik-Medium'/familyDigits: TEXT.family.medium/; s/familyRowTime: 'Rubik-Regular'/familyRowTime: TEXT.family.regular/" "$file"
  cmp -s "$file" "$file.break-106-backup" && { echo "BREAK FAILED: perl matched nothing"; mv "$file.break-106-backup" "$file"; return 2; }
  npx jest shared/__tests__/typography.test.ts --watchman=false 2>&1 | tail -15
  status=${PIPESTATUS[0]}
  mv "$file.break-106-backup" "$file"
  [ "$status" = "0" ] && { echo "BREAK FAILED: test still green"; return 2; }
  echo "BREAK OK"
}

break_arrow() {
  file="components/overlay/OverlayInfoBox.tsx"
  cp "$file" "$file.break-106-backup" || return 2
  perl -pi -e 's/export const TIP_OVERLAP = 6;/export const TIP_OVERLAP = 4;/' "$file"
  cmp -s "$file" "$file.break-106-backup" && { echo "BREAK FAILED: perl matched nothing"; mv "$file.break-106-backup" "$file"; return 2; }
  npx jest components/prayer/__tests__/Explanation.test.tsx --watchman=false -t "overlap-into-the-row" 2>&1 | tail -15
  status=${PIPESTATUS[0]}
  mv "$file.break-106-backup" "$file"
  [ "$status" = "0" ] && { echo "BREAK FAILED: test still green"; return 2; }
  echo "BREAK OK"
}

break_gap() {
  file="components/countdown/Countdown.tsx"
  cp "$file" "$file.break-106-backup" || return 2
  perl -pi -e 's/^(\s*)(\{group.digits\})$/$1$2\n$1<Text style={styles.gap}> <\/Text>/' "$file"
  cmp -s "$file" "$file.break-106-backup" && { echo "BREAK FAILED: perl matched nothing"; mv "$file.break-106-backup" "$file"; return 2; }
  npx jest components/countdown/__tests__/Countdown.test.tsx --watchman=false -t "no gap node" 2>&1 | tail -15
  status=${PIPESTATUS[0]}
  mv "$file.break-106-backup" "$file"
  [ "$status" = "0" ] && { echo "BREAK FAILED: test still green"; return 2; }
  echo "BREAK OK"
}

case "$mode" in
  face) break_face ;;
  arrow) break_arrow ;;
  gap) break_gap ;;
  *) echo "usage: break-106.sh face|arrow|gap"; exit 2 ;;
esac
