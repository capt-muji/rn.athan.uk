# Step 02: the 3T clock-driven proof

Requirements: R5.1
Weight: 3

Anchor check: none (no source edit). Preflight already ran.

## Goal

On the OnePlus 3T, with the clock 20 seconds before an armed reminder's moment, a cold launch
runs a scheduling pass inside the window and the reminder still fires at its moment, once, with
the content it was armed with.

## Branch

```
git checkout -b docs/device-55-proof uat
```

No code changes. The step records evidence and moves the row.

## Build

```
mkdir -p $HOME/athan-gitree/sessions/55
zsh $HOME/athan-gitree/bin/build-mock.zsh uat $HOME/repos/rn.athan.uk/mocks/simple.ts $HOME/athan-gitree/sessions/55/mock.apk
```

Ends `BUILD-MOCK OK`; the `.apk` sits outside `/tmp` and the repository. The mock build carries
the production package id `com.mugtaba.athan` with `versionCode 1000000`, serves the simple mock
timetable, and opens `athan-storage-dev`, never the owner's `athan-storage`.

Check the package before installing (the tool exists first, `aapt2` never `aapt`):

```
AAPT2=${ANDROID_HOME:-$HOME/Library/Android/sdk}/build-tools/37.0.0/aapt2
[ -x "$AAPT2" ] || { echo "no aapt2 at $AAPT2"; exit 1; }
"$AAPT2" dump badging $HOME/athan-gitree/sessions/55/mock.apk | grep "^package"
```

Expected output starts `package: name='com.mugtaba.athan' versionCode='1000000'`. Anything else:
STOP before installing.

Install and launch once so the mock download seeds the timetable:

```
adb -s $3T_SERIAL install -r $HOME/athan-gitree/sessions/55/mock.apk
adb -s $3T_SERIAL shell monkey -p com.mugtaba.athan 1
```

Note: the mock's own scheduling state starts empty in `athan-storage-dev`, so its first pass
re-arms the OS alarms from the mock's defaults. The owner's preferences sit untouched in
`athan-storage` and re-arm the next time his local production build launches; the report to the
owner says so.

## Arm

Through the alert sheet, arm on the Standard schedule: the at-time bell for one prayer on Silent,
and one 5-minute Sound reminder on another prayer whose armed reminder moment, on tomorrow's row
of the mock timetable, is at least 20 minutes ahead (the mock places today's row within a few
minutes of first launch, so the next armed reminder always sits on tomorrow's row). Wait for the
sheet to commit (the scheduling lock drains in a few seconds).

## Choose the target

```
adb -s $3T_SERIAL shell dumpsys alarm > $HOME/athan-gitree/sessions/55/alarms-before.md
```

The saved file holds the unfiltered `dumpsys alarm` output. The dump carries no per-notification
identifier: the app's armed requests appear as `RTC_WAKEUP` lines whose `Alarm{...}` ends with
`com.mugtaba.athan` and whose bundle block carries `tag=expo.modules.notifications.NOTIFICATION_EVENT`
(the parser in `e2e/scripts/device_checks.py` keys them the same way). The reminder target T is
the `when` epoch of the entry that sits exactly 300000 milliseconds before another
NOTIFICATION_EVENT entry's `when`: that pair is the 5-minute reminder and its prayer's at-time
alarm. The expected-fire list for the clock jump is: every app NOTIFICATION_EVENT entry in the
unfiltered dump whose `when` is before T, plus the app's far-future tombstone alarm (an app entry
whose `when` sits in 2036; the exact epoch varies per install), named on the list so its presence
is explained. An alarm the jump fires that the list does not name is STOP.

## Drive and prove

1. `adb -s $3T_SERIAL shell settings put global auto_time 0`
2. Set the clock to 20 seconds before T:
   `adb -s $3T_SERIAL shell service call alarm 2 i64 <T-ms-minus-20000>` where `<T-ms-minus-20000>`
   is T's epoch in milliseconds minus 20000. The expected reply starts `Result: Parcel(00000000`.
   A `Permission Denial` reply is STOP and report.
3. Cold launch: `adb -s $3T_SERIAL shell input keyevent KEYCODE_HOME`, then
   `adb -s $3T_SERIAL shell am kill com.mugtaba.athan`, then
   `adb -s $3T_SERIAL shell monkey -p com.mugtaba.athan 1`. The Android cold launch reopens the
   refresh gate (`stores/notifications.ts:1741`, called from `app/index.tsx:107`), so the launch
   refresh runs a full pass at T minus 20 seconds.
4. After first content renders (about 3 seconds), capture the window state:
   `adb -s $3T_SERIAL shell dumpsys alarm > $HOME/athan-gitree/sessions/55/alarms-inside-window.md`.
   The target's `when=` line must still be present and unchanged. Missing or moved: STOP, and
   transcribe the last 40 logcat lines.
5. Clear logcat (`adb -s $3T_SERIAL logcat -c`), then poll for the fire at most 6 times, 10
   seconds apart (`sleep 10` between polls, never longer): each poll runs
   `adb -s $3T_SERIAL logcat -d | grep -iE "notif|reminder"` and appends to
   `$HOME/athan-gitree/sessions/55/fire.md`. Later polls repeat earlier lines; judge "posted
   once" on the posting's unique timestamp. The reminder's notification must post at its moment,
   at T, with the armed content (title in the `... in 5m` shape, the prayer's name). No posting
   by the sixth poll is STOP.
6. `adb -s $3T_SERIAL shell settings put global auto_time 1`, then read
   `adb -s $3T_SERIAL shell settings get global auto_time` and expect `1`. Leave the 3T on the
   mock build.

If `uiautomator dump` is needed for anything, it fails silently while the countdown animates:
prove the screen with the logcat lines and alarm dumps only. Transcribe what was read; no
screenshots are committed.

## Version and commit

Version from the same lockstep rule (expected 2.0.6). Add by name:
`ai/plans/README.md`, `ai/plans/55-reminder-30s-cancel/LOG.md`,
`ai/plans/55-reminder-30s-cancel/steps/02-device-proof.md`. Set the row to
`IN PROGRESS, step 2`. Commit message:

```
<VERSION> - docs(plans): job 55 step 02, 3T clock-driven proof recorded
```

## Review checklist

- The evidence files exist under `sessions/55/` and their transcriptions sit in LOG.md.
- The before dump lists the target; the inside-window dump still lists it with the same `when`;
  the fire log shows one posting.
- Automatic time reads back on (`1`).
- Nothing outside the plan's file list changed.

## Merge

```
git checkout uat && git merge --no-ff docs/device-55-proof -m "Merge docs/device-55-proof into uat: job 55 step 02"
```

## Done when

Checklist ticked, LOG.md appended with the evidence transcriptions, the commit sha, version and
merge sha, then the executor runs Finishing.
