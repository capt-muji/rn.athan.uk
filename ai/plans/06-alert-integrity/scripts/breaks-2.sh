#!/bin/bash
# Step 2 breaks: run from /Users/muji/repos/rn.athan.uk with bash ai/plans/06-alert-integrity/scripts/breaks-2.sh
# Shared by every breaks script: copy, one perl substitution, check it changed, run the named tests, expect each
# named test to fail, restore. Paths are relative to the repository root, where the script runs.
LOGS="$TMPDIR/plan6-breaks"
mkdir -p "$LOGS"
all=1
brk() { # name, file, perl substitution, jest project, expected failing test titles joined by "|", test paths...
  local name="$1" file="$2" sub="$3" project="$4" expected="$5"
  shift 5
  cp "$file" "$LOGS/$name.backup"
  perl -0pi -e "$sub" "$file"
  if cmp -s "$file" "$LOGS/$name.backup"; then
    echo "BREAK $name NOT AS EXPECTED: the substitution did not change $file"
    all=0
    return
  fi
  npx jest "$@" --watchman=false --selectProjects="$project" > "$LOGS/$name.log" 2>&1
  local code=$?
  cp "$LOGS/$name.backup" "$file"
  local missing=""
  local IFS='|'
  for title in $expected; do
    grep -qF -- "● " "$LOGS/$name.log" && grep -F -- "● " "$LOGS/$name.log" | grep -qF -- "$title" || missing="$missing [$title]"
  done
  unset IFS
  if [ "$code" != "0" ] && [ -z "$missing" ]; then
    echo "BREAK $name AS EXPECTED: $(grep -E '^Tests:' "$LOGS/$name.log")"
  else
    echo "BREAK $name NOT AS EXPECTED: jest exit $code, not failing:$missing (log $LOGS/$name.log)"
    all=0
  fi
}
T2="__tests__/app/index.test.tsx"
brk 2a app/index.tsx "s/ && state !== 'hasError';/;/" components "lifts the splash onto the error screen, without waiting for decorations that screen never draws|holds the splash over the error screen until its Masjid icon has loaded, then lifts it" $T2
brk 2b app/index.tsx "s/state !== 'hasError';/state === 'hasError';/" components "holds the splash until the decorations have loaded|lifts the splash once the decorations have loaded" $T2
echo "ALL AS EXPECTED: $all"
