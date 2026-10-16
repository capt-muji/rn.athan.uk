#!/usr/bin/env bash
# Break script for plan 108. Four modes:
#   break-108.sh pulls - step 1: revert both subtitle gaps to -10, expect the sweep red
#   break-108.sh sound - step 2: restore the sound list's ar 6, expect the sweep red
#   break-108.sh day   - step 2: restore the location dial to SPACING.py, expect DayLines red
#   break-108.sh note  - step 3: delete the note's lineHeight, expect the note suite red
# All modes restore from the backup copy. Run from the repository root.
set -u
mode="${1:?usage: break-108.sh pulls|sound|day|note}"

break_pulls() {
  file="components/sheets/parts/Header.tsx"
  qibla="components/sheets/screens/Qibla.tsx"
  cp "$file" "$file.break-108-backup" || return 2
  cp "$qibla" "$qibla.break-108-backup" || return 2
  perl -pi -e 's/marginTop: compactArabic \? SPACING\.py : SPACING\.xs/marginTop: compactArabic ? -10 : SPACING.xs/' "$file" "$qibla"
  cmp -s "$file" "$file.break-108-backup" && cmp -s "$qibla" "$qibla.break-108-backup" && { echo "BREAK FAILED: perl matched nothing"; mv "$file.break-108-backup" "$file"; mv "$qibla.break-108-backup" "$qibla"; return 2; }
  npx jest components/__tests__/typographySweep.test.tsx --watchman=false 2>&1 | tail -15
  status=${PIPESTATUS[0]}
  mv "$file.break-108-backup" "$file"
  mv "$qibla.break-108-backup" "$qibla"
  [ "$status" = "0" ] && { echo "BREAK FAILED: test still green"; return 2; }
  echo "BREAK OK"
}

break_sound() {
  file="components/sheets/screens/Sound.tsx"
  cp "$file" "$file.break-108-backup" || return 2
  perl -pi -e 's/marginTop: SPACING\.md,/marginTop: 6,/' "$file"
  cmp -s "$file" "$file.break-108-backup" && { echo "BREAK FAILED: perl matched nothing"; mv "$file.break-108-backup" "$file"; return 2; }
  npx jest components/__tests__/typographySweep.test.tsx --watchman=false -t "one value with en" 2>&1 | tail -15
  status=${PIPESTATUS[0]}
  mv "$file.break-108-backup" "$file"
  [ "$status" = "0" ] && { echo "BREAK FAILED: test still green"; return 2; }
  echo "BREAK OK"
}

break_day() {
  file="components/day/Day.tsx"
  cp "$file" "$file.break-108-backup" || return 2
  perl -pi -e 's/marginBottom: compactArabic \? SPACING\.sm : SPACING\.quart/marginBottom: compactArabic ? SPACING.py : SPACING.quart/' "$file"
  cmp -s "$file" "$file.break-108-backup" && { echo "BREAK FAILED: perl matched nothing"; mv "$file.break-108-backup" "$file"; return 2; }
  npx jest components/day/__tests__/DayLines.test.tsx --watchman=false -t "8 points under ar" 2>&1 | tail -15
  status=${PIPESTATUS[0]}
  mv "$file.break-108-backup" "$file"
  [ "$status" = "0" ] && { echo "BREAK FAILED: test still green"; return 2; }
  echo "BREAK OK"
}

break_note() {
  file="components/sheets/parts/VolumeNote.tsx"
  cp "$file" "$file.break-108-backup" || return 2
  perl -pi -e 's/^.*lineHeight: ty\.scriptLineHeight\?\.\(TEXT\.sizeDetail\),\n?//' "$file"
  perl -0pi -e 's/\n *lineHeight: ty\.scriptLineHeight\?\.\(TEXT\.sizeDetail\),//' "$file"
  cmp -s "$file" "$file.break-108-backup" && { echo "BREAK FAILED: perl matched nothing"; mv "$file.break-108-backup" "$file"; return 2; }
  npx jest components/sheets/parts/__tests__/VolumeNote.test.tsx --watchman=false -t "script line box" 2>&1 | tail -15
  status=${PIPESTATUS[0]}
  mv "$file.break-108-backup" "$file"
  [ "$status" = "0" ] && { echo "BREAK FAILED: test still green"; return 2; }
  echo "BREAK OK"
}

case "$mode" in
  pulls) break_pulls ;;
  sound) break_sound ;;
  day) break_day ;;
  note) break_note ;;
  *) echo "usage: break-108.sh pulls|sound|day|note"; exit 2 ;;
esac
