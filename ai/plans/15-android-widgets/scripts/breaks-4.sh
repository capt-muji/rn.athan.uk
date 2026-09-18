#!/usr/bin/env bash
# Session 15 step 4 breaks (target the layout's render-time decisions).
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FAILURES=0
NOT_APPLIED=0

run_tests() {
  npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit >/tmp/break-out.txt 2>&1
  local code=$?
  tail -3 /tmp/break-out.txt | head -1
  return $code
}

break_a() {
  cp widgets/PrayerWidget.tsx /tmp/break-pw.tsx
  perl -pi -e 's/const totalMinutes = Math\.max\(1, Math\.ceil\(\(targetEpochMs - nowMs\) \/ 60000\)\);/const totalMinutes = Math.max(1, Math.floor((targetEpochMs - nowMs) \/ 60000));/' widgets/PrayerWidget.tsx
  if cmp -s widgets/PrayerWidget.tsx /tmp/break-pw.tsx; then echo "BREAK NOT APPLIED: label ceil"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (a) NOT CAUGHT"; FAILURES=1; else echo "break (a) caught"; fi
  fi
  cp /tmp/break-pw.tsx widgets/PrayerWidget.tsx
}

break_b() {
  cp widgets/PrayerWidget.tsx /tmp/break-pw.tsx
  perl -pi -e 's/if \(epoch === null \|\| epoch <= nowMs\) continue;/if (epoch === null || epoch < nowMs) continue;/' widgets/PrayerWidget.tsx
  if cmp -s widgets/PrayerWidget.tsx /tmp/break-pw.tsx; then echo "BREAK NOT APPLIED: boundary scan"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (b) NOT CAUGHT"; FAILURES=1; else echo "break (b) caught"; fi
  fi
  cp /tmp/break-pw.tsx widgets/PrayerWidget.tsx
}

break_a
break_b

if [ "$FAILURES" = 0 ] && [ "$NOT_APPLIED" = 0 ]; then echo "ALL AS EXPECTED: 1"; else exit 1; fi
