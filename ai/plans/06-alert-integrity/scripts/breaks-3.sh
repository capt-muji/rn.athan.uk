#!/bin/bash
# Step 3 breaks: run from /Users/muji/repos/rn.athan.uk with bash ai/plans/06-alert-integrity/scripts/breaks-3.sh
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
T3="stores/__tests__/notificationSchedulingLock.test.ts"
brk 3a stores/notifications.ts "s/await settleAll\(promises\);\n  logger\.info\('NOTIFICATION: Rescheduled all notifications/await Promise.all(promises);\n  logger.info('NOTIFICATION: Rescheduled all notifications/" unit "runs only once every prayer the failing refresh is arming has landed" $T3
brk 3b stores/notifications.ts "s/await settleAll\(promises\);\n  logger\.info\('REMINDER: Rescheduled all reminders/await Promise.all(promises);\n  logger.info('REMINDER: Rescheduled all reminders/" unit "runs only once another prayer's reminders have armed, when one prayer's reminder day throws" $T3
brk 3c stores/notifications.ts "s/await settleAll\(\[\n    _addAllScheduleNotificationsForSchedule/await Promise.all([\n    _addAllScheduleNotificationsForSchedule/" unit "runs only once the reminders the failing refresh is arming, in another part of it, have landed" $T3
brk 3d stores/notifications.ts "s/await settleAll\(promises\);\n  \}, 'updatePrayerNotifications'\);/await Promise.all(promises);\n  }, 'updatePrayerNotifications');/" unit "runs only once the failing commit's reminder cancels have landed" $T3
brk 3e stores/notifications.ts "s/const attempts = await settleAll\(\n    nextXDays\.map\(\(date\) =>\n      scheduleNotificationForDate\(/const attempts = await Promise.all(\n    nextXDays.map((date) =>\n      scheduleNotificationForDate(/" unit "runs only once the other day of a failing refresh has armed, when one athan day throws" $T3
brk 3f stores/notifications.ts "s/const attempts = await settleAll\(\n    nextXDays\.map\(\(date\) =>\n      scheduleReminderNotificationForDate\(/const attempts = await Promise.all(\n    nextXDays.map((date) =>\n      scheduleReminderNotificationForDate(/" unit "runs only once the other day of a failing refresh has armed, when one reminder day throws" $T3
brk 3g device/notifications.ts "s/const results = await Promise\.allSettled\(promises\);\n  const refusal = results\.find\(\(result\): result is PromiseRejectedResult => result\.status === 'rejected'\);\n  if \(refusal\) throw refusal\.reason;/await Promise.all(promises);/" unit "runs only once every cancel the failing refresh sent for the same prayer has landed" $T3
brk 3h stores/notifications.ts "s/if \(failure\) throw failure\.reason;\n/\n/" unit "runs only once every prayer the failing refresh is arming has landed|runs only once the failing commit's reminder cancels have landed" $T3
echo "ALL AS EXPECTED: $all"
