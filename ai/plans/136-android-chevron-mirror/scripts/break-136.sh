#!/usr/bin/env bash
# Killing-mutant pass for ticket 136 step 2: each chevron pin is rewritten to
# 'inherit' one at a time and the sweep suite must fail every time.
# Ends ALL AS EXPECTED: 3.
set -u
cd "$(git rev-parse --show-toplevel)"
OUT=0
SUITE=components/__tests__/chevronDirection.test.tsx

mutate() {
  local file="$1" label="$2"
  local count
  count=$(grep -c "direction: 'ltr'," "$file")
  if [ "$count" != "1" ]; then
    echo "BREAK NOT APPLIED: $file holds $count pin lines, expected 1"
    OUT=1
    return
  fi
  perl -pi -e "s/direction: 'ltr',/direction: 'inherit',/" "$file"
  if npx jest "$SUITE" --watchman=false --selectProjects=components \
      > "$TMPDIR/brk-136.log" 2>&1; then
    echo "MUTANT SURVIVED: $label"
    OUT=1
  else
    echo "killed: $label"
  fi
  git checkout -- "$file"
}

mutate components/sheets/screens/Settings.tsx settings-chevrons
mutate components/sheets/screens/ColorPicker.tsx colorpicker-chevron
mutate components/modals/Help.tsx help-chevron

if [ "$OUT" = "0" ]; then
  echo "ALL AS EXPECTED: 3"
else
  echo "BREAK FAILED"
  exit 1
fi
