#!/bin/bash
# Step 1 breaks: run from /Users/muji/repos/rn.athan.uk with
#   bash ai/plans/07-replace-previous-notification/scripts/breaks-1.sh
# Shared shape: copy, one perl substitution, check it changed, run the named tests, expect the named
# test to fail, restore. Paths are relative to the repository root, where the script runs.
LOGS="$TMPDIR/plan7-breaks"
mkdir -p "$LOGS"
all=1
brk() { # name, file, perl substitution, expected failing test title
  local name="$1" file="$2" sub="$3" title="$4"
  cp "$file" "$LOGS/$name.backup"
  perl -0pi -e "$sub" "$file"
  if cmp -s "$file" "$LOGS/$name.backup"; then
    echo "BREAK $name NOT AS EXPECTED: the substitution did not change $file"
    all=0
    return
  fi
  npx jest plugins/__tests__/replacePreviousNotification.test.ts --watchman=false --selectProjects=unit > "$LOGS/$name.log" 2>&1
  local code=$?
  cp "$LOGS/$name.backup" "$file"
  local missing=""
  if ! grep -F -- "● " "$LOGS/$name.log" | grep -qF -- "$title"; then missing=" [$title]"; fi
  if [ "$code" != "0" ] && [ -z "$missing" ]; then
    echo "BREAK $name AS EXPECTED: $(grep -E '^Tests:' "$LOGS/$name.log")"
  else
    echo "BREAK $name NOT AS EXPECTED: jest exit $code, not failing:$missing (log $LOGS/$name.log)"
    all=0
  fi
}
T="plugins/__tests__/replacePreviousNotification.test.ts"
P="plugins/replacePreviousNotification.js"
brk 1a "$P" 's/const val SHARED_NOTIFICATION_TAG = "athan-notification"/const val SHARED_NOTIFICATION_TAG = "athan"/' "post every notification under the shared tag"
brk 1b "$P" "s/'android.intent.action.MY_PACKAGE_REPLACED'/'android.intent.action.BOOT_COMPLETED'/" "removes expo notifications receiver and declares the app own one with the same six actions"
brk 1c "$P" "s/'tools:node': 'remove'/'tools:node': 'merge'/" "removes expo notifications receiver and declares the app own one with the same six actions"
brk 1d app.json 's|\n\s*"\./plugins/replacePreviousNotification",||' "loads the plugin from app.json"
brk 1e "$P" 's/= AthanPresentationDelegate\(context\)/= ExpoPresentationDelegate(context)/' "hand presentation to the shared-tag delegate"
echo "ALL AS EXPECTED: $all"
