#!/bin/bash
# Session 6b, step 1 breaks.
# Save this file to $TMPDIR/breaks-6b-1.sh and run it from /Users/muji/repos/rn.athan.uk with
#   bash $TMPDIR/breaks-6b-1.sh
# Each break makes one exact substitution, runs the tests that guard it, expects them to FAIL, and puts the file back.
# It ends "ALL AS EXPECTED: 1" when every break was caught, and "ALL AS EXPECTED: 0" otherwise.
# It takes about three minutes: four of the breaks make a test wait for a promise that never settles, and those fail
# through Jest's own ten-second timeout.
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

SHARED_SUITE="shared/__tests__/notificationNativeTimeout.test.ts"
DEVICE_SUITE="device/__tests__/notificationNativeTimeout.test.ts"
LOCK_SUITE="stores/__tests__/notificationSchedulingLock.test.ts"

run_break "the call is not raced against the timer" \
  shared/notifications.ts \
  's/return await Promise\.race\(\[work, timeout\]\);/return await work;/' \
  "$SHARED_SUITE $DEVICE_SUITE"

run_break "the timer is left armed after the call answers" \
  shared/notifications.ts \
  's/\n    clearTimeout\(timer\);\n/\n/' \
  "$SHARED_SUITE"

run_break "the limit is ten seconds, not fifteen" \
  shared/notifications.ts \
  's/const NATIVE_CALL_TIMEOUT_MS = 15_000;/const NATIVE_CALL_TIMEOUT_MS = 10_000;/' \
  "$SHARED_SUITE"

run_break "the limit is thirty seconds, not fifteen" \
  shared/notifications.ts \
  's/const NATIVE_CALL_TIMEOUT_MS = 15_000;/const NATIVE_CALL_TIMEOUT_MS = 30_000;/' \
  "$SHARED_SUITE"

run_break "arming a prayer is not given a limit" \
  device/notifications.ts \
  's/`arming \$\{identifier\}`/`working on \$\{identifier\}`/g' \
  "$DEVICE_SUITE"

run_break "cancelling one alarm is not given a limit" \
  device/notifications.ts \
  's/`cancelling \$\{notificationId\}`/`working on \$\{notificationId\}`/' \
  "$DEVICE_SUITE"

run_break "clearing a prayer's alarms is not given a limit" \
  device/notifications.ts \
  's/`cancelling \$\{notification\.id\}`/`working on \$\{notification.id\}`/' \
  "$DEVICE_SUITE"

run_break "clearing a prayer's reminders is not given a limit" \
  device/notifications.ts \
  's/`cancelling \$\{reminder\.id\}`/`working on \$\{reminder.id\}`/' \
  "$DEVICE_SUITE"

run_break "creating the Android channel is not given a limit" \
  shared/notifications.ts \
  's/`creating the \$\{channelId\} channel`/`working on \$\{channelId\}`/g' \
  "$SHARED_SUITE $DEVICE_SUITE"

run_break "listing the pending notifications is not given a limit" \
  stores/notifications.ts \
  "s/'listing the pending notifications'/'working on the pending notifications'/" \
  "$LOCK_SUITE"

run_break "the queue takes an early failure with it" \
  stores/notifications.ts \
  's/schedulingQueue = run\.then\(\n    \(\) => undefined,\n    \(\) => undefined\n  \);/schedulingQueue = run;/' \
  "$LOCK_SUITE"

echo "breaks caught: $caught of $total"
if [ "$caught" -eq "$total" ]; then
  echo "ALL AS EXPECTED: 1"
else
  echo "ALL AS EXPECTED: 0"
fi
