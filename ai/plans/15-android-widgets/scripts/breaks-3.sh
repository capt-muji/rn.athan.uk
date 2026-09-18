#!/usr/bin/env bash
# Session 15 step 3 breaks.
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FAILURES=0
NOT_APPLIED=0

run_tests() {
  npx jest shared/__tests__/widgetContract.test.ts --watchman=false --selectProjects=unit >/tmp/break-out.txt 2>&1
  local code=$?
  tail -3 /tmp/break-out.txt | head -1
  return $code
}

break_a() {
  cp widgets/PrayerWidget.tsx /tmp/break-pw.tsx
  perl -pi -e "s/typeof Column !== 'undefined'/typeof VStack !== 'undefined'/" widgets/PrayerWidget.tsx
  if cmp -s widgets/PrayerWidget.tsx /tmp/break-pw.tsx; then echo "BREAK NOT APPLIED: platform detector"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (a) NOT CAUGHT"; FAILURES=1; else echo "break (a) caught"; fi
  fi
  cp /tmp/break-pw.tsx widgets/PrayerWidget.tsx
}

break_a

# Plan break (b) (monospacedDigit removal) is intentionally not caught: it is
# a visual modifier with no testable behavior; recorded, not added.

if [ "$FAILURES" = 0 ] && [ "$NOT_APPLIED" = 0 ]; then echo "ALL AS EXPECTED: 1"; else exit 1; fi
