#!/usr/bin/env bash
# Session 15 step 2 breaks.
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
FAILURES=0
NOT_APPLIED=0

run_tests() {
  TZ=America/New_York npx jest shared/__tests__/widgetSnapshot.test.ts --watchman=false --selectProjects=unit >/tmp/break-out.txt 2>&1
  local code=$?
  tail -3 /tmp/break-out.txt | head -1
  return $code
}

break_a() {
  cp shared/widgetTimeline.ts /tmp/break-wt.ts
  # Original plan break (first-prayer horizon) is unrepresentable in a London-shaped
  # fixture: list order equals chronological order there, so last-read == max.
  # Equivalent break on the same decision line: never answer null on an empty window.
  perl -pi -e 's/if \(horizonEpochMs === null\) \{/if (false) {/' shared/widgetTimeline.ts
  if cmp -s shared/widgetTimeline.ts /tmp/break-wt.ts; then echo "BREAK NOT APPLIED: horizon null guard"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (a) NOT CAUGHT"; FAILURES=1; else echo "break (a) caught"; fi
  fi
  cp /tmp/break-wt.ts shared/widgetTimeline.ts
}

break_b() {
  cp shared/widgetTimeline.ts /tmp/break-wt.ts
  perl -pi -e "s/startEpochMs: TimeUtils\.getDayAnchor\(prayer\.belongsToDate\)\.getTime\(\)/startEpochMs: new Date(prayer.belongsToDate + 'T00:00:00Z').getTime()/" shared/widgetTimeline.ts
  if cmp -s shared/widgetTimeline.ts /tmp/break-wt.ts; then echo "BREAK NOT APPLIED: day anchor"; NOT_APPLIED=1; else
    if run_tests; then echo "BREAK (b) NOT CAUGHT"; FAILURES=1; else echo "break (b) caught"; fi
  fi
  cp /tmp/break-wt.ts shared/widgetTimeline.ts
}

break_a
break_b

if [ "$FAILURES" = 0 ] && [ "$NOT_APPLIED" = 0 ]; then echo "ALL AS EXPECTED: 1"; else exit 1; fi
