# Step 2: the XS proof, then the phone returns to the shipping build

Requirements: R2.1, R1.5
Weight: 3

## Anchor check

Step 1's merge is on `uat` and `git log --oneline uat -1` names it. The build bay (main tree)
is checked out on `uat`, clean. No code anchors: this step changes no app code. The one atlas
write-back (below) rides this step's docs commit.

## Goal

On the iPhone XS, delivered notifications are visible in the Notification Center before the
app opens and the center holds zero of this app's entries after the app opens, with the clear
log line in the capture when the Release build emits it; then the phone ends on the merged
prod build with real data.

## Precondition

The phone is unlocked (`xcrun devicectl device info lockState --device $IPHONE_UDID`). Every
contact with the phone sits inside `$HOME/athan-gitree/device-<XS serial>.lock`, taken in
short cycles, retried in `sleep 15` loops while lane 111 holds it, released the moment a cycle
ends. Record every wait longer than one retry. Read `e2e/device-atlas-iphone-xs.md` first.

## What the mock delivers, from the code (`mocks/simple.ts` buildTimes)

The seed picks today's rows by the download's London clock:

- 06:00 to 23:52 (the evening shape): Asr already passed; Maghrib arms on the next minute
  boundary (fires 1 to 60 s after the download) and Isha the minute after (61 to 120 s). Both
  fire inside two minutes of the launch's download.
- 00:00 to 06:00 (the pre-dawn shape): Fajr on the next minute boundary (1 to 60 s); Sunrise
  11 minutes out.
- 23:53 to 23:59 (the spent shape): all six rows already passed, nothing imminent. Do not run
  a proof cycle in this window; wait for the day roll.

Every launch and every return to the foreground re-downloads and re-seeds today's rows at new
relative times, so each cycle re-arms its own imminent deliveries under the date-scoped
identifiers.

## The build (main tree, under `$HOME/athan-gitree/build.lock`)

Never two builds at once. Metro is env-blind (e2e/README.md), so every env switch between
builds clears its cache first: `rm -rf node_modules/.cache/metro` before each prebuild. From
the main tree at merged `uat`, opening with `unset EXPO_PUBLIC_ENV` so no earlier shell state
leaks a prod env into a mock cycle:

```bash
unset EXPO_PUBLIC_ENV
rm -rf node_modules/.cache/metro
export EXPO_PUBLIC_IOS_WIDGETS=1 CI=1 EXPO_NO_TELEMETRY=1
npx expo prebuild -p ios --no-install
DEVELOPMENT_TEAM=$TEAM_ID npx expo run:ios --configuration Release --device $IPHONE_UDID
```

No `EXPO_PUBLIC_ENV`, so the mock API serves and logging stays on. `EXPO_PUBLIC_IOS_WIDGETS=1`
is not optional (the widgets plugin strips without it). The run's own launch is the throwaway
(What's New marks itself). After the build, prove which transform shipped by the embedded
bundle (the key is never printed, mirroring build-prod.zsh's own check):

```bash
if LC_ALL=C grep -aqF -- "$(cat $HOME/.config/athan/.api_key)" ios/Athan/main.jsbundle; then
  echo "STOP: the mock build carries the prod key; the cache served a stale transform"
fi
```

Expected: no output (the mock bundle holds no key).

## The proof cycles

Two cycles, each: start the capture, launch, let the app arm, terminate, let the deliveries
land while closed, read the center, open the app, read the center again. The capture starts
before the launch so the reseed's arming lines and every delivery line land inside it.

1. Start the log capture in the background, writing to
   `$HOME/athan-gitree/sessions/120/syslog-cycle-<n>.log`:
   `pymobiledevice3 syslog live --udid $IPHONE_UDID`.
2. Launch: `xcrun devicectl device process launch --device $IPHONE_UDID com.mugtaba.athan`;
   give the init 20 s (the post-paint init runs at 1.5 s, the refresh arms the seeded rows).
3. Terminate: `xcrun devicectl device process terminate --device $IPHONE_UDID
   com.mugtaba.athan`.
4. Bounded wait for the deliveries (poll the capture for `will present notification`,
   deadline 180 s, checks every 15 s). Evening shape: up to two lines, the second while the
   app was closed. Absent by the deadline: relaunch once to re-seed and retry one wait. Two
   misses is a STOP with the capture.
5. Read the center before the open. Open the Notification Center with a swipe down from the
   TOP CENTRE at the notch (top-left opens the Today view instead); screenshot with
   `pymobiledevice3 developer dvt screenshot --udid $IPHONE_UDID <path>`; read the image;
   transcribe every Athan entry into
   `$HOME/athan-gitree/sessions/120/cycle-<n>-before.md`. Screenshots never enter this
   repository. The reader reads the image itself when it can see; otherwise `vision` with one
   question: "how many notification-center entries carry the Athan app's name, and what does
   each say?". After the first working read, write the swipe route back into
   `e2e/device-atlas-iphone-xs.md`'s routes table (one row).
6. Open the app neutrally (never by tapping the notification):
   `xcrun devicectl device process launch --device $IPHONE_UDID com.mugtaba.athan`, wait 10 s.
7. Read the center after the open (swipe, screenshot, transcribe to
   `cycle-<n>-after.md`). Expected: zero Athan entries.

Cycle 1 expected: the before-read holds the entries this cycle's deliveries produced (one or
two by the seed shape); the after-read holds zero.

Cycle 2 expected: the before-read holds exactly the entries delivered since cycle 1's open and
not one more (cycle 1's entries must not survive its open; a surviving entry is red, the STOP
with both transcriptions). The after-read holds zero again.

The clear log line (`NOTIFICATION: Cleared the delivered notifications`, one per open) is
corroborating evidence, not the gate: a Release unified-log capture may not carry the JS log
line, and D120.7 already rules the before-and-after pair primary. A missing line is recorded
as a void read, never chased with another build.

Stop the capture between cycles (`pkill -f 'pymobiledevice3 syslog'`), then start the next
capture, relaunch the app for 20 s to re-seed, and terminate it again.

## Return the phone to the shipping state

Under `$HOME/athan-gitree/build.lock` and the device lock:

```bash
export EXPO_PUBLIC_ENV=prod EXPO_PUBLIC_API_KEY=$(cat $HOME/.config/athan/.api_key) EXPO_PUBLIC_IOS_WIDGETS=1 CI=1 EXPO_NO_TELEMETRY=1
rm -rf node_modules/.cache/metro
npx expo prebuild -p ios --no-install
DEVELOPMENT_TEAM=$TEAM_ID npx expo run:ios --configuration Release --device $IPHONE_UDID
```

The key is never printed. Prove the prod transform shipped, mirroring build-prod.zsh:

```bash
LC_ALL=C grep -aqF -- "$(cat $HOME/.config/athan/.api_key)" ios/Athan/main.jsbundle \
  || echo "STOP: the prod bundle holds no key; the cache served a stale transform"
```

Expected: no output. The run's launch is the throwaway; one more launch renders the
schedule on real data. If this session prepared the agent-device runner, uninstall both runner
apps. Expected end state: the schedule renders, the launch exits 0. A mock-cycle retry after
this block re-opens with `unset EXPO_PUBLIC_ENV` in the same shell.

## Void shapes

Each recorded with tool, command and what absent looked like: an empty center before any open
(delivery failed: retry per the cycle), a delivery that never lands inside 180 s twice, the
clear log line missing from the Release capture (the pair stands, recorded as missing),
agent-device wedging (devicectl plus screenshot alone, the swipe missing, recorded), lane-111
contention past 15 minutes (release, record, retry later in the session).

## Records

`LOG.md` findings text, recorded the moment the proof lands:

- The two cycles' before/after transcriptions and their counts, with which seed shape served.
- The clear log lines with timestamps, or their recorded absence.
- The build versions (mock and prod), the versions' `app.json` numbers, and each bundle
  marker check's outcome.
- Every read not taken, with the reason.

The step's docs commit (the atlas write-back plus `LOG.md` and the row update) takes the next
patch after `uat` under `$HOME/athan-gitree/version.lock`, bumping `app.json` first, then
`package.json`, and lands on `lane/120` under `$HOME/athan-gitree/commit.lock`, merged into
`uat` under `$HOME/athan-gitree/uat.lock` with the build bay's gitignored
`android/app/build.gradle` `versionName` synced after under `$HOME/athan-gitree/build.lock`.

DONE row text (the lead applies at audit):

`DONE 2026-10-16, audited: iOS clears the delivered stack on every app open - one call in
initializeNotifications, iOS-gated, before the refresh, outside the scheduling lock, never
from the background task; red-green unit coverage with the mutation pass at <VERSION>, and
the XS proof (entries before the open, zero after, cycle 2 holding only post-open deliveries)
on the mock build, her phone returned to the merged prod build. Identifiers, channels,
pending requests, the 64-budget arming and the Android delegate untouched.`

## Done when

Both cycles recorded (or their void shapes), the phone on the prod build with the schedule
rendering, the evidence under `$HOME/athan-gitree/sessions/120/`, the findings in `LOG.md`,
the docs commit merged.
