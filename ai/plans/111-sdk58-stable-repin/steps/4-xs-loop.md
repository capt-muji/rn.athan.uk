# Step 4: the owner-ordered iPhone XS deep-dive loop

Requirements: R4.1, R4.2, R4.3, R4.4, R4.5, R4.6, R4.7, R4.8
Weight: 3

## Anchor check

None: the anchors verified at pre-flight and step 1 consumed them.

## Goal

Her order (D111.2, D111.5): a Release-configuration build with the real API on
her iPhone XS (`IPHONE_UDID`), then an iterative loop over the app's surfaces
until nothing is broken. This step is the iOS half of the re-pin's proof.

## Build and install

The phone is the connected XS; the generated ios project signs automatically
with `TEAM_ID`. Mirror the Android prod env (the key file is
`$HOME/.config/athan/.api_key`, the same file `build-prod.zsh` reads; it is
never printed). `expo run:ios` never re-syncs an existing native folder, so the
prebuild runs first, mirroring `build-prod.zsh`'s order (the
`enableRemoteNotifications` plugin change and the stable native config must
regenerate into `ios/` or R4.1 proves nothing about R1.6):

```bash
export EXPO_PUBLIC_ENV=prod EXPO_PUBLIC_API_KEY=$(cat $HOME/.config/athan/.api_key) CI=1 EXPO_NO_TELEMETRY=1
npx expo prebuild -p ios --no-install
npx expo run:ios --configuration Release --device
```

A signing failure is the section 2.2 STOP with the xcodebuild error.

## The loop

Run every check, record the observable, and iterate: a red check is reproduced,
captured, and either fixed by the plan's named contracts (never improvised) or
raised as a STOP. The loop ends when every check below is green in one pass.

1. **Cold start (R4.1).** Launch via xcodebuildmcp or `xcrun devicectl device
   process launch --device <UDID> com.mugtaba.athan`. Expected: the schedule
   renders; no crash report (`xcrun devicectl device info` / the crash list
   shows none new for the bundle). The row 91 crash class was dev-only; a
   Release crash here is a STOP with the .ips.
2. **Real athan delivery (R4.2).** Read the next armed time from the app's
   schedule, wait for the real moment (never more than one wait per prayer;
   if the next prayer is hours out, continue the loop and return). Expected:
   the banner delivers with sound and time-sensitive interruption; capture the
   delivered notification through log capture (xcodebuildmcp) and transcribe.
   Punctuality is read against the armed time.
3. **Compass stream (R4.3).** Open the qibla sheet via agent-device. Expected:
   heading readings flow while the phone turns; the iOS hunk of the location
   patch (`kCLHeadingFilterNone`) means a stationary phone still updates as
   CoreLocation refines. Read the stream through the app's own Pino lines via
   log capture; never a screenshot alone.
4. **Language switch (R4.4).** Switch to العربية and back through
   agent-device taps. Expected: the purple loader shows on the tap, the
   relaunch completes (the D59 in-process reload), the target locale renders
   from frame one, and no AppState soft exception becomes a crash (row 71's
   class is log-only).
5. **Background refresh (R4.5).** Background the app past a refresh window
   (the BGTaskScheduler registration carries `requiresNetworkConnectivity:
   false` from the patch). Expected: the notification gate stamps; the capture
   targets are the Pino lines `NOTIFICATION: Starting refreshNotifications`
   (`stores/notifications.ts:61`) and `NOTIFICATION: Refresh complete`
   (`stores/notifications.ts:1813`), read through log capture. iOS runs
   BGProcessing on its own schedule; the dev-menu simulate path is gated off
   (row 91), so the proof is the registered task plus the stamp, not a forced
   run.
6. **Widgets (R4.6).** Home-screen small and medium, lock-screen rectangular
   and inline: all render current data for the day. The owner's existing
   widget setup stands; read what renders, transcribe, never screenshot into
   the repo.
7. **Reminder before its athan (R4.7).** With a reminder configured (the
   owner's config stands; configure none), the reminder fires before its athan,
   never after (the queue's rule: a reminder never outruns its athan).
8. **Day rollover (R4.8).** One named midnight boundary (`PRAYER_TIMEZONE`)
   while the app runs: the list rolls, the countdown moves to the next day's
   first prayer, yesterday's rows mark (the day-roll ground of row 32). The
   wait is bounded to that one midnight, read once the next morning; no
   indefinite overnight loop.

Every check's observable is a log line, a dump, or a transcription. A
screenshot reaches a screen; it never proves what is on one.

## Records

Captures land under `$HOME/athan-gitree/sessions/111/xs/`; the ledger names
each. The UDID and any device-identifying value never enter the repository.

## Version and commit

No commit unless a defect is ruled fixable; any fix rides its own branch and
version.

## Review

The reviewer reads the captures against the expected readings, blind.

## Done when

R4.1 to R4.8 hold in one clean pass of the loop, with the captures recorded.

## Restore

The owner's phone keeps the Release install (it is her app, production-signed
for development); note the install in the ledger so she knows what replaced
her dev build. Reinstall the dev build on her word.
