#!/bin/bash
# Step 1 breaks: run from /Users/muji/repos/rn.athan.uk with
#   bash ai/plans/09-keep-still-due-rows-after-midnight/scripts/breaks-1.sh
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
  npx jest stores/__tests__/schedule.test.ts shared/__tests__/prayer.test.ts --watchman=false --selectProjects=unit > "$LOGS/$name.log" 2>&1
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

brk 1a stores/schedule.ts 's/const firstDate = PrayerUtils\.firstStillDueListDay\(type, date\);/const firstDate = TimeUtils.formatDateShort(date);/' "keeps yesterday's list on screen from a launch after 00:00, with the bar measured into its still-due rows: Isha at 00:01"

brk 1b shared/prayer.ts 's/(findNextReadable\(createPrayersForDate\(type, yesterday\), now\)) \? yesterday : today;/${1} ? today : yesterday;/' "answers today once yesterday's last row has passed"

brk 1c stores/schedule.ts 's/if \(fromStorage && fromStorage\.datetime <= now\)/if (fromStorage \&\& fromStorage.datetime < now)/' "never takes a still-to-come row from storage as the previous row, whatever the sequence holds: Isha at 00:01"

echo "ALL AS EXPECTED: $all"
