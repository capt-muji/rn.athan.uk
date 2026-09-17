#!/bin/bash
# Step 2 breaks: run from /Users/muji/repos/rn.athan.uk with
#   bash ai/plans/09-keep-still-due-rows-after-midnight/scripts/breaks-2.sh
# Shared shape: copy, one perl substitution, check it changed, run the named suites, expect the named
# test to fail, restore. Paths are relative to the repository root, where the script runs.
LOGS="$TMPDIR/plan9-breaks"
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
  npx jest stores/__tests__/notificationsAroundMidnight.test.ts shared/__tests__/prayer.test.ts shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit > "$LOGS/$name.log" 2>&1
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

brk 2a shared/notifications.ts 's/PrayerUtils\.firstStillDueListDayForPrayer\(scheduleType, englishName, TimeUtils\.createInstant\(\)\)/TimeUtils.getTodayDateString()/' "keeps yesterday's list Isha armed, re-attempted under its own identifier"

brk 2b shared/prayer.ts 's/row\.datetime > now \? yesterday : today/row.datetime >= now ? yesterday : today/' "treats a row at exactly the asking instant as passed, as the scheduler does"

brk 2c shared/notifications.ts 's/const first = startDate \?\? TimeUtils\.getTodayDateString\(\);/const first = TimeUtils.getTodayDateString();/' "starts from a given start date when one is given"

brk 2d stores/notifications.ts 's/return TimeUtils\.createInstant\(\) < cutoff;/return false;/' "keeps the record of a refused cancel of a still-due yesterday alarm, so the repair can reach it"

echo "ALL AS EXPECTED: $all"
