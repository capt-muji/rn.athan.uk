#!/bin/bash
# Step 1 breaks: run from /Users/muji/repos/rn.athan.uk with bash ai/plans/06-alert-integrity/scripts/breaks-1.sh
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
T1="hooks/__tests__/notificationSettingsFallback.test.ts hooks/__tests__/useNotification.test.ts"
brk 1a hooks/useNotification.ts 's/\n\s*returnToApp\.stop\(\);//' unit "on ios, answers no and stops listening when Settings cannot open|on android, answers no and stops listening when Settings cannot open" $T1
brk 1b hooks/useNotification.ts "s/if \(state !== 'active'\) \{/if (state === 'background') {/" unit "reads the permission only once the app has gone inactive for Settings and come back" $T1
brk 1c hooks/useNotification.ts 's/\n\s*if \(!leftApp\) return;//' unit "does not take the app reporting active before it has left for Settings as the return" $T1
brk 1d hooks/useNotification.ts 's/\n\s*subscription\.remove\(\);\n(\s*markReturned\(\);)/\n$1/' unit "stops listening to app state changes once the app is back" $T1
brk 1e hooks/useNotification.ts 's/\n\s*await returnToApp\.returned;//' unit "reads the permission only once the app has gone background for Settings and come back|reads the permission only once the app has gone inactive for Settings and come back|does not take the app reporting active before it has left for Settings as the return" $T1
brk 1f hooks/useNotification.ts "s/(after settings:', error\);)\n\s*resolve\(false\);/\$1/" unit "answers no when the permission cannot be read once the app is back" $T1
brk 1g hooks/useNotification.ts "s/(open notification settings:', error\);)\n\s*resolve\(false\);/\$1/" unit "on ios, answers no and stops listening when Settings cannot open|on android, answers no and stops listening when Settings cannot open" $T1
brk 1h hooks/useNotification.ts "s/resolve\(finalStatus === 'granted'\);/resolve(true);/" unit "returns false when permission still denied after returning from settings" $T1
brk 1i hooks/useNotification.ts 's/\],\n\s*\/\/ Android reports a dialog closed[^\n]*\n\s*\{ onDismiss: \(\) => resolve\(false\) \}\n/]\n/' unit "answers no when Android closes the dialog without a button" $T1
brk 1j hooks/useNotification.ts 's/const returnToApp = listenForReturnToApp\(\);\n(\n\s*try \{\n(?:\s*\/\/[^\n]*\n)*\s*await Linking\.openSettings\(\);)/let returnToApp = { returned: Promise.resolve(), stop: () => {} };\n$1\n              returnToApp = listenForReturnToApp();/' unit "reads the return even when the app has left and come back before Settings answers that it opened" $T1
echo "ALL AS EXPECTED: $all"
