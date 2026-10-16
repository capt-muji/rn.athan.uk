# Step 3: the owner-ordered iPhone XS deep-dive loop

Requirements: R4.1, R4.2, R4.3, R4.4, R4.5, R4.6, R4.7, R4.8
Weight: 3

## Anchor check

None: the anchors verified at pre-flight and step 1 consumed them.

## Precondition: the phone must be unlocked

The XS refused automation throughout the first attempt while it was locked, and this session
re-measured it 2026-10-16. Check before building:

```bash
xcrun devicectl device info lockState --device $IPHONE_UDID
AGENT_DEVICE_IOS_TEAM_ID=$TEAM_ID agent-device prepare ios-runner --udid $IPHONE_UDID
```

Expected: `lockState` answers, and the runner prepares. While the phone is locked, `lockState`
fails with `Failed to allocate RSD device. ... error -402653181 (0xE8000003)` and the runner
prints a readiness timeout; either is the section 2.2 STOP. Report it, leave the 3T work merged,
and end the session. No agent step can unlock the phone. `agent-device devices --platform ios`
names the device and any session holding it; a claim left by an earlier session is cleared with
`agent-device close` before a new session opens.

## Goal

Her order (D111.2, D111.5): a Release-configuration build with the real API on her iPhone XS
(`IPHONE_UDID`), then an iterative loop over the app's surfaces until nothing is broken. This step
is the iOS half of the re-pin's proof, and it re-runs the three checks the first attempt greened
because they proved the superseded pin set.

## Build and install

The phone is the connected XS; the generated ios project signs automatically with `TEAM_ID`.
Mirror the Android prod env (the key file is `$HOME/.config/athan/.api_key`, the same file
`build-prod.zsh` reads; it is never printed). `expo run:ios` never re-syncs an existing native
folder, so the prebuild runs first, mirroring `build-prod.zsh`'s order:

```bash
export EXPO_PUBLIC_ENV=prod EXPO_PUBLIC_API_KEY=$(cat $HOME/.config/athan/.api_key) EXPO_PUBLIC_IOS_WIDGETS=1 CI=1 EXPO_NO_TELEMETRY=1
npx expo prebuild -p ios --no-install
DEVELOPMENT_TEAM=$TEAM_ID npx expo run:ios --configuration Release --device $IPHONE_UDID
```

`EXPO_PUBLIC_IOS_WIDGETS=1` is not optional: `app.config.ts` strips the widgets plugin when it is
unset, so without it the build carries no widget extension and R4.6 cannot be observed on it. The
team rides the command inline because Xcode holds no live account session on this machine
(`e2e/device-atlas-iphone-xs.md`). This step runs from the main tree, whose `node_modules` step 2
refreshes.

A signing failure is the section 2.2 STOP with the xcodebuild error. `--device` fails selection
while two devices answer, so pass the UDID on the flag instead: `--device <UDID>`. The UDID never
enters a file in this repository.

## The loop

Run every check, record the observable, and iterate: a red check is reproduced, captured, and
either fixed by the plan's named contracts or raised as a STOP. The loop ends when every check
below is green in one pass.

1. **Cold start (R4.1).** Launch with `xcrun devicectl device process launch --device <UDID>
   com.mugtaba.athan`. Expected: the schedule renders; no crash report for the bundle. `run:ios`'s
   own launch is the throwaway first launch (the What's New modal marks itself), so the read is
   the second open. A Release crash here is a STOP with the `.ips`.
2. **Real athan delivery (R4.2).** Read the next armed time from `xcrun devicectl device info` or
   from the app's own schedule, wait for the real moment (never more than one wait per prayer; if
   the next prayer is hours out, continue the loop and return). Expected: the banner delivers at
   the interruption level its armed row carries, at its armed second. Capture the delivered
   notification through log capture and transcribe; the first attempt proved delivery this way
   (`Created process assertion for will present notification` at the armed time) while the owner's
   configuration left every prayer but Asr silent, which proves delivery, not sound. Record which
   half was exercised.
3. **Compass stream (R4.3).** Open the qibla sheet through agent-device. Expected: heading
   readings flow while the phone turns, and a stationary phone still updates because the location
   patch's iOS hunk sets `kCLHeadingFilterNone`. Read the stream through the unified log
   (`locationd` `kCLConnectionMessageHeading` and the app's CoreLocation delegate lines) over a
   bounded window; never a screenshot alone. The first attempt measured roughly 105 delegate
   invocations a second over 30 s.
4. **Language switch (R4.4).** Switch to العربية and back through agent-device taps. Expected: the
   purple loader shows on the tap and speaks the target's words from frame one, the relaunch
   completes (the D59 in-process reload), the target locale renders from frame one, and no AppState
   soft exception becomes a crash (row 71's class is log-only). Leave the app in English.
5. **Background refresh (R4.5).** Background the app past a refresh window (the BGTaskScheduler
   registration carries `requiresNetworkConnectivity: false` from the patch). Two observables
   satisfy this criterion (D111.17): the registered `BGProcessingTaskRequest
   com.expo.modules.backgroundtask.processing` re-submitted on launch, beside a live native
   scheduling trace (`Got N pending notification`, settings checks); or, on a logging-enabled
   build, the two Pino lines `NOTIFICATION: Starting refreshNotifications` and
   `NOTIFICATION: Refresh complete`. The plain prod build emits neither Pino line by design, so the
   registered task plus the native trace is the observable this step records.
6. **Widgets (R4.6).** Home-screen small and medium, lock-screen rectangular and inline: all render
   current data for the day. The owner's existing widget setup stands; read what renders,
   transcribe, never screenshot into the repository. The first attempt reached only the reachable
   home page (no Athan widget on it) because home paging is not drivable through the runner: every
   horizontal swipe foregrounds the session app. Lock-screen widgets need the screen locked, which
   backgrounds the app, so read them after check 8 rather than before it.
7. **Reminder before its athan (R4.7).** With a reminder configured (the owner's config stands;
   configure none), the reminder fires before its athan, never after. Read both deliveries from the
   log with their armed times beside them. If her configuration arms no reminder for the next
   athan, record R4.7 as not exercised and continue: removing or adding a reminder is
   notification-scheduling ground and `ai/AGENTS.md` makes it ask-first.
8. **Day rollover (R4.8).** One named midnight boundary (`PRAYER_TIMEZONE`) while the app runs: the
   list rolls, the countdown moves to the next day's first prayer, yesterday's rows mark. The wait
   is bounded to that one midnight, read once the next morning; no indefinite overnight loop. The
   app stays foreground through midnight, which is why check 6's lock-screen read follows it.

Every check's observable is a log line, a dump, or a transcription. A screenshot reaches a screen;
it never proves what is on one.

## Records

Captures land under `$HOME/athan-gitree/sessions/111/xs/`; the ledger names each. The UDID and any
device-identifying value never enter the repository.

## Version and commit

No commit unless a defect is ruled fixable; any fix rides its own branch and version.

## Review

The reviewer reads the captures against the expected readings, blind.

## Done when

R4.1 to R4.8 hold in one clean pass of the loop, with the captures recorded.

## Restore

The owner's phone keeps the Release install (it is her app, development-signed production build);
note the install in the ledger so she knows what replaced her dev build. Uninstall the two helper
apps the `agent-device` runner installs, as `e2e/device-atlas-iphone-xs.md` directs, before the
step ends. Reinstall the dev build on her word.
