#!/bin/bash
# Session 6b, step 2 breaks.
# Save this file to $TMPDIR/breaks-6b-2.sh and run it from /Users/muji/repos/rn.athan.uk with
#   bash $TMPDIR/breaks-6b-2.sh
# Each break makes one exact substitution, runs the tests that guard it, expects them to FAIL, and puts the file back.
# It ends "ALL AS EXPECTED: 1" when every break was caught, and "ALL AS EXPECTED: 0" otherwise. It takes about a minute.
set -u

caught=0
total=0

run_break() {
  label="$1"
  file="$2"
  expr="$3"
  tests="$4"
  total=$((total + 1))
  cp "$file" "$file.break-backup"
  perl -0pi -e "$expr" "$file"
  if cmp -s "$file" "$file.break-backup"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$file.break-backup" "$file"
    return
  fi
  # shellcheck disable=SC2086
  if npx jest $tests --watchman=false --selectProjects=unit > /dev/null 2>&1; then
    echo "BREAK NOT CAUGHT: $label"
  else
    echo "caught: $label"
    caught=$((caught + 1))
  fi
  mv "$file.break-backup" "$file"
}

COMMIT_SUITE="stores/__tests__/notificationAlertCommit.test.ts"
OFF_SUITE="stores/__tests__/notificationOffCancelFailure.test.ts"
REMINDER_SUITE="device/__tests__/reminderCancelFailure.test.ts"
DEVICE_SUITE="device/__tests__/notificationNativeTimeout.test.ts"
SINGLE_SUITE="stores/__tests__/notificationSinglePrayerUpdate.test.ts"
HOOK_SUITE="hooks/__tests__/useNotification.test.ts"

run_break "the at-time clear does not report what the phone refused" \
  device/notifications.ts \
  's/    refused\.push\(notifications\[position\]\.id\);/    \/\/ broken/' \
  "$OFF_SUITE $DEVICE_SUITE"

run_break "the reminder clear does not report what the phone refused" \
  device/notifications.ts \
  's/    refused\.push\(reminders\[position\]\.id\);/    \/\/ broken/' \
  "$REMINDER_SUITE $COMMIT_SUITE"

run_break "the store clear deletes the record of a refused cancel too" \
  stores/notifications.ts \
  's/    if \(refused\.has\(record\.id\) && canStillFire\(record\)\) \{\n      refusedThatCanFire \+= 1;\n      continue;\n    \}\n    Database\.removeOneScheduledNotificationForPrayer\(scheduleType, prayerIndex, record\.id\);/    if (refused.has(record.id) \&\& canStillFire(record)) refusedThatCanFire += 1;\n    Database.removeOneScheduledNotificationForPrayer(scheduleType, prayerIndex, record.id);/' \
  "$OFF_SUITE"

run_break "an alarm whose moment has passed still counts as refused" \
  stores/notifications.ts \
  's/  record\.date >= TimeUtils\.getTodayDateString\(\);/  record.date >= TimeUtils.getPreviousDateString(TimeUtils.getTodayDateString());/' \
  "$COMMIT_SUITE $OFF_SUITE"

run_break "the records are cleared before the days are scheduled again" \
  stores/notifications.ts \
  's/  const existingRecords = Database\.getAllScheduledNotificationsForPrayer\(scheduleType, prayerIndex\);\n\n  const nextXDays/  const existingRecords = Database.getAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);\n  Database.clearAllScheduledNotificationsForPrayer(scheduleType, prayerIndex);\n\n  const nextXDays/' \
  "$COMMIT_SUITE"

run_break "a refused day is not counted as refused" \
  stores/notifications.ts \
  's/    return \{ identifier, refused: true \};/    return { identifier, refused: false };/' \
  "$COMMIT_SUITE"

run_break "the change is never put back" \
  stores/notifications.ts \
  's/    logger\.warn\('"'"'NOTIFICATION: The phone refused part of the alert change, putting the prayer back'"'"', \{\n      englishName,\n      refusals,\n    \}\);\n    await undoPrayerAlertChange\(scheduleType, prayerIndex, englishName, arabicName, previous, generation\);/    logger.warn('"'"'NOTIFICATION: The phone refused part of the alert change, putting the prayer back'"'"', {\n      englishName,\n      refusals,\n    });/' \
  "$COMMIT_SUITE"

run_break "the undo does not put the saved settings back" \
  stores/notifications.ts \
  's/  applyPrayerPreferences\(scheduleType, prayerIndex, previous\);\n\n  try \{/  try {/' \
  "$COMMIT_SUITE"

run_break "the undo runs even when a newer change owns the prayer" \
  stores/notifications.ts \
  's/  if \(prayerRepairGeneration\(scheduleType, prayerIndex\) !== generation\) \{\n    logger\.info\('"'"'NOTIFICATION: A newer alert change owns this prayer, leaving it alone'"'"', \{ prayerIndex, englishName \}\);\n    return;\n  \}/  \/\/ broken/' \
  "$COMMIT_SUITE"

run_break "the mark is cleared although a newer change replaced it" \
  stores/notifications.ts \
  's/  if \(store\.get\(atom\) !== generation\) return;\n\n  resetStoredAtom\(atom, key\);/  resetStoredAtom(atom, key);/' \
  "$COMMIT_SUITE"

run_break "every mark carries the same generation" \
  stores/notifications.ts \
  's/  const generation = store\.get\(atom\) \+ 1;/  const generation = 1;/' \
  "$COMMIT_SUITE"

run_break "a refused pass leaves the prayer unmarked" \
  stores/notifications.ts \
  's/    if \(atTimeRefusals \+ reminderRefusals > 0\) \{\n      markPrayerForRepair\(scheduleType, prayerIndex\);\n      return;\n    \}/    if (atTimeRefusals + reminderRefusals > 0) return;/' \
  "$OFF_SUITE"

run_break "a prayer the pass never looked at is treated as put right" \
  stores/notifications.ts \
  's/    if \(atTimeRefusals === null \|\| reminderRefusals === null\) return;/    \/\/ broken/' \
  "$COMMIT_SUITE"

run_break "a marked prayer is not put right until the gate opens" \
  stores/notifications.ts \
  's/    const marked = markedPrayers\(\);\n    if \(marked\.length === 0\) \{/    const marked: MarkedPrayer\[\] = [];\n    if (marked.length === 0) {/' \
  "$OFF_SUITE $COMMIT_SUITE"

run_break "putting one prayer right closes the gate for twelve hours" \
  stores/notifications.ts \
  's/      await _rescheduleAllNotifications\(\{ deferWidgetRefresh: true, only: onlyThesePrayers\(marked\) \}\);/      await _rescheduleAllNotifications({ deferWidgetRefresh: true, only: onlyThesePrayers(marked) });\n      store.set(lastNotificationScheduleAtom, Date.now());/' \
  "$OFF_SUITE $COMMIT_SUITE"

run_break "the saved settings are written reminder first" \
  stores/notifications.ts \
  's/  setPrayerAlertType\(scheduleType, prayerIndex, state\.atTimeAlert\);\n  setReminderAlertType\(scheduleType, prayerIndex, state\.reminderAlert\);/  setReminderAlertType(scheduleType, prayerIndex, state.reminderAlert);\n  setPrayerAlertType(scheduleType, prayerIndex, state.atTimeAlert);/' \
  "$COMMIT_SUITE $SINGLE_SUITE"

run_break "the hook hands the store the states the wrong way round" \
  hooks/useNotification.ts \
  's/      currentState,\n      originalState\n    \);/      originalState,\n      currentState\n    );/' \
  "$HOOK_SUITE"

echo "breaks caught: $caught of $total"
if [ "$caught" -eq "$total" ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "ALL AS EXPECTED: 0"
fi
