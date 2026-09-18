#!/usr/bin/env bash
# Session 15 step 5 breaks.
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FAILURES=0
NOT_APPLIED=0

run_tests() {
  npx jest stores/__tests__/widgetAndroid.test.ts stores/__tests__/widgetAndroidFlagOff.test.ts --watchman=false --selectProjects=unit --forceExit >/tmp/break-out.txt 2>&1
  local code=$?
  tail -3 /tmp/break-out.txt | head -1
  return $code
}

break_a() {
  cp stores/widget.ts /tmp/break-widget.ts
  perl -pi -e 's/if \(Platform\.OS === .android. && !FEATURE_FLAGS\.androidWidgets\) return;/\/\/ gate removed/' stores/widget.ts
  if cmp -s stores/widget.ts /tmp/break-widget.ts; then echo "BREAK NOT APPLIED: android gate"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (a) NOT CAUGHT"; FAILURES=1; else echo "break (a) caught"; fi
  fi
  cp /tmp/break-widget.ts stores/widget.ts
}

break_b() {
  cp stores/widget.ts /tmp/break-widget.ts
  perl -pi -e "s/\{ widget: home\.PrayerWidgetDark, theme: 'dark', size: 'small' \}/{ widget: home.PrayerWidgetDark, theme: 'light', size: 'small' }/" stores/widget.ts
  if cmp -s stores/widget.ts /tmp/break-widget.ts; then echo "BREAK NOT APPLIED: theme stamp"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (b) NOT CAUGHT"; FAILURES=1; else echo "break (b) caught"; fi
  fi
  cp /tmp/break-widget.ts stores/widget.ts
}

break_a
break_b

if [ "$FAILURES" = 0 ] && [ "$NOT_APPLIED" = 0 ]; then echo "ALL AS EXPECTED: 1"; else exit 1; fi
