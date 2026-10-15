#!/usr/bin/env bash
# Break script for plan 104. Two modes:
#   break-104.sh marks  - step 1: comment out the two perfMark lines, expect the marks test red
#   break-104.sh defer  - step 3: comment out the deferral await, expect the ordering test red
# Both modes restore the file from the backup copy afterwards. Run from the repository root.
set -u
mode="${1:?usage: break-104.sh marks|defer}"

break_marks() {
  file="components/sheets/parts/Sheet.tsx"
  cp "$file" "$file.break-104-backup" || return 2
  perl -pi -e "s/^(\\s*)(.*perfMark\\(\\x27sheet_close_haptic(_settled)?\\x27.*\\);)\$/\$1\/\/ break-104: \$2/" "$file"
  git diff --quiet -- "$file" && { echo "BREAK FAILED: perl matched nothing"; mv "$file.break-104-backup" "$file"; return 2; }
  npx jest --watchman=false -t "marks the close haptic dispatch" 2>&1 | tail -15
  status=${PIPESTATUS[0]}
  mv "$file.break-104-backup" "$file"
  [ "$status" = "0" ] && { echo "BREAK FAILED: test still green"; return 2; }
  echo "BREAK OK"
}

break_defer() {
  file="components/sheets/screens/Sound.tsx"
  cp "$file" "$file.break-104-backup" || return 2
  perl -pi -e 's/^(\s*)(await deferPastNextPaint\(\);)/$1\/\/ break-104: $2/' "$file"
  git diff --quiet -- "$file" && { echo "BREAK FAILED: perl matched nothing"; mv "$file.break-104-backup" "$file"; return 2; }
  npx jest --watchman=false -t "defers the commit start past the next paint" 2>&1 | tail -15
  status=${PIPESTATUS[0]}
  mv "$file.break-104-backup" "$file"
  [ "$status" = "0" ] && { echo "BREAK FAILED: test still green"; return 2; }
  echo "BREAK OK"
}

case "$mode" in
  marks) break_marks ;;
  defer) break_defer ;;
  *) echo "usage: break-104.sh marks|defer"; exit 2 ;;
esac
