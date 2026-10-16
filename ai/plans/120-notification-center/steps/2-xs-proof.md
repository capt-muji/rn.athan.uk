# Step 2: the XS proof, then the phone returns to the shipping build

Requirements: R2.1, R1.5
Weight: 3

## Anchor check

Step 1's merge is on `uat` and `git log --oneline uat -1` names it. The build bay (main tree)
is checked out on `uat`, clean. No code anchors: this step changes no code.

## Goal

On the iPhone XS, a delivered notification is visible in the Notification Center before the
app opens and the center holds zero of this app's entries after the app opens, with one clear
log line per open; then the phone ends on the merged prod build with real data.

## Precondition

The phone is unlocked (`xcrun devicectl device info lockState --device $IPHONE_UDID`). Every
contact with the phone sits inside `$HOME/athan-gitree/device-<XS serial>.lock`, taken in
short cycles, retried in `sleep 15` loops while lane 111 holds it, released the moment a cycle
ends. Record every wait longer than one retry. Read `e2e/device-atlas-iphone-xs.md` first.

## The build (main tree, under `$HOME/athan-gitree/build.lock`)

Never two builds at once. From the main tree at merged `uat`:

```bash
export EXPO_PUBLIC_IOS_WIDGETS=1 CI=1 EXPO_NO_TELEMETRY=1
npx expo prebuild -p ios --no-install
DEVELOPMENT_TEAM=$TEAM_ID npx expo run:ios --configuration Release --device $IPHONE_UDID
```

No `EXPO_PUBLIC_ENV`, so the mock API serves: Asr sits 60 to 119 s after every download, and
logging stays on. `EXPO_PUBLIC_IOS_WIDGETS=1` is not optional (the widgets plugin strips
without it). The run's own launch is the throwaway (What's New marks itself).

## The proof cycles

Two cycles, each: deliver while closed, read the center, open, read the center.

1. Terminate the app:
   `xcrun devicectl device process terminate --device $IPHONE_UDID com.mugtaba.athan`.
2. Start the log capture in the background, writing to
   `$HOME/athan-gitree/sessions/120/syslog-cycle-<n>.log`:
   `pymobiledevice3 syslog live --udid $IPHONE_UDID`.
3. Bounded wait for the mock Asr delivery (poll the capture for
   `will present notification`, deadline 180 s, checks every 15 s). Absent by the deadline:
   relaunch the app once to re-seed and retry one wait. Two misses is a STOP with the capture.
4. Read the center before the open. Swipe down from the home screen's top edge through
   agent-device; screenshot with
   `pymobiledevice3 developer dvt screenshot --udid $IPHONE_UDID <path>`; read the image;
   transcribe the Athan entries into `$HOME/athan-gitree/sessions/120/cycle-<n>-before.md`.
   Screenshots never enter this repository. The reader reads the image itself when it can see;
   otherwise `vision` with one question: "how many notification-center entries carry the Athan
   app's name, and what does each say?".
5. Open the app neutrally (never by tapping the notification):
   `xcrun devicectl device process launch --device $IPHONE_UDID com.mugtaba.athan`, wait 10 s.
6. Read the center after the open (swipe, screenshot, transcribe to
   `cycle-<n>-after.md`). Expected: zero Athan entries, and one
   `NOTIFICATION: Cleared the delivered notifications` line in the cycle's capture.

Cycle 1 expected: before holds at least one entry, after holds zero.
Cycle 2 expected: before holds exactly ONE entry (cycle 1's open emptied the center, so a
second surviving entry would mean the first clear failed), after holds zero. Cycle 2's before
read is the proof the clear actually emptied the center, not that iOS hid one entry behind a
group.

Stop the capture between cycles (`pkill -f 'pymobiledevice3 syslog'`), relaunch the app once
(to re-seed Asr), terminate it, and start the next capture.

## Return the phone to the shipping state

Under `$HOME/athan-gitree/build.lock` and the device lock:

```bash
export EXPO_PUBLIC_ENV=prod EXPO_PUBLIC_API_KEY=$(cat $HOME/.config/athan/.api_key) EXPO_PUBLIC_IOS_WIDGETS=1 CI=1 EXPO_NO_TELEMETRY=1
npx expo prebuild -p ios --no-install
DEVELOPMENT_TEAM=$TEAM_ID npx expo run:ios --configuration Release --device $IPHONE_UDID
```

The key is never printed. The run's launch is the throwaway; one more launch renders the
schedule on real data. If this session prepared the agent-device runner, uninstall both runner
apps. Expected end state: the schedule renders, no crash report for the bundle
(`xcrun devicectl device info processes --device $IPHONE_UDID` shows no crash spin, and the
launch exits 0).

## Void shapes

Each recorded with tool, command and what absent looked like: an empty center before any open
(delivery failed: retry per the cycle), a delivery that never lands inside 180 s twice,
agent-device wedging (devicectl plus screenshot alone, the swipe missing, recorded), lane-111
contention past 15 minutes (release, record, retry later in the session).

## Records

`LOG.md` findings text, recorded the moment the proof lands:

- The two cycles' before/after transcriptions and their counts.
- The clear log lines with timestamps.
- The build versions (mock and prod) and the versions' `app.json` numbers.
- Every read not taken, with the reason.

DONE row text (the lead applies at audit):

`DONE 2026-10-16, audited: iOS clears the delivered stack on every app open - one call in
initializeNotifications, iOS-gated, before the refresh, outside the scheduling lock, never
from the background task; red-green unit coverage with the mutation pass at <VERSION>, and
the XS proof (entry before the open, zero after, the clear line in the capture) on the mock
build, her phone returned to the merged prod build. Identifiers, channels, pending requests,
the 64-budget arming and the Android delegate untouched.`

## Done when

Both cycles recorded (or their void shapes), the phone on the prod build with the schedule
rendering, the evidence under `$HOME/athan-gitree/sessions/120/`, the findings in `LOG.md`,
the docs commit merged.
