# Plan 131: expo-location, the six named unverified readings

| Field | Value |
| --- | --- |
| Brief | Six bounded device readings re-derived from row 121's record, each recorded with its command, its output and what absent looks like. No app change. |
| Planned at | `ca73f5a9`, 2.0.984, 2026-10-17 |
| Planned by | Lane 131 (agent-ruled throughout) |
| Needs first | Nothing (row 124, the XS channel, is DONE) |
| Parent | None (derives from row 121's audit list) |
| Group | None. This lane writes `ai/plans/131-six-readings/` and the row 131 cell only. The two e2e docs belong to lanes 122 and 133 and stay untouched. |
| Batch budget | 3 weight units |
| Session budget | 7 weight units |
| Steps count | 3 (two device, one docs) |
| Device | OnePlus 3T (Android 9, serial placeholder 3T_SERIAL) and iPhone XS (iOS 18.7.10, udid placeholder IPHONE_UDID) |
| Owner decisions still needed | None |

## 1. Goal

Row 121's audit left six behaviours unverified because each needs a phone. This ticket
captures them as bounded device readings. Every reading records three things: the exact
command or call that produced it, the output read back, and what the absent form looks
like. The readings, re-derived from row 121's DONE cell:

1. RD1: whether Android's GMS provider reports a bearing on a stationary phone (3T).
2. RD2: whether /next `enableLocationServices` shows an in-app dialog or opens Settings
   on the 3T.
3. RD3: the XS temporary-full-accuracy prompt under a reduced accuracy grant.
4. RD4: whether /next `getPosition` returns the same cached fix the classic
   `getLastKnownPositionAsync` returns.
5. RD5: how a coarse-only Android grant reports on a position request (3T).
6. RD6: an adopted prebuild's exact native deltas. VOID BY RULING: row 121's ruling of
   2026-10-16 adopted nothing, so no adopted prebuild exists to diff, and row 121's own
   record already states both native modules compile into every build today, which makes
   an adoption's native deltas zero by construction. Recorded void with the citation, not
   forced.

What is true when DONE: the row 131 cell carries all six verdicts with their evidence
class named, the phones sit in their found state (grants restored, services on, a clean
build on the XS), `uat` carries no app-code change from this ticket, and the plan folder
and evidence are dead per the records rule.

The owner's rules that apply: the qibla lock and the location contract stand untouched
(`ai/AGENTS.md` hard rules; `device/qibla.ts` is the contract). A screenshot reaches a
screen and never proves what is on one, so every records claim rides a log line or a
dump. Never write a position, an address or a place name into any record: the fixture
positions the tests carry, and indoor or one-room descriptions. The phones are the
owner's: every grant or services change is restored and the restoration recorded.

## 2. Decisions

### 2.1 Taken (all agent-ruled 2026-10-17, recorded here)

- D131.1 Reading 6 is void by ruling. Row 121's DONE cell: "her ruling taken: adopt
  nothing, the classic heading path and the upstream PR stay". No adopted prebuild
  exists; building one to diff it would re-open a ruling the owner closed. For: forcing
  a void reading manufactures work row 121's record already answers (both native modules
  compile into every build today). Against: a scratch prebuild diff would measure the
  GMS provider's gradle deltas. The against falls: those deltas belong to any future
  adoption row, not to a void premise. Committed.
- D131.2 The vehicle is a probe shell built in a scratch worktree, never committed. The
  shell replaces `app/_layout.tsx` and `app/index.tsx` with a minimal pair so none of the
  app's stores, sync or notification convergence runs on the owner's phones. Android
  builds as the fleettest package (`EXPO_ANDROID_SUFFIX=fleettest` exported inside the
  scratch prebuild and gradle, never passed as an argument), so it installs beside the
  owner's app. iOS builds as `com.mugtaba.athan` (the one id with a cached profile) over
  the installed app, in the local/mock env so it opens `athan-storage-dev` and never
  reads the owner's `athan-storage`, and a clean build of the same `uat` content is
  reinstalled at the end. For: the /next calls need JS only a build can carry, and the
  probe shell is the smallest vehicle that cannot touch her state. Against: a debug
  screen inside the full app. The against falls: it drags notification convergence onto
  her phones. Committed.
- D131.3 Coordinates are redacted at the source: the probe logs never contain a latitude
  or longitude. Logged fields are timestamp, accuracy, heading, headingAccuracy, speed,
  mocked. For: redaction after capture leaves raw coordinates in transcripts that could
  leak into records. Against: full transcripts are easier to debug. The against falls:
  the records rule is absolute. Committed.
- D131.4 RD5 runs on the 3T through `pm grant`/`pm revoke` on the fleettest package. The
  3T on Android 9 has no coarse-only UI, so the grant is set at the framework level,
  which is exactly the state a coarse-only grant is. If a sibling phone (8T, S23, Find
  X8) is connected at execution time and its atlas allows contact, its coarse-grant UI is
  observed and recorded as a bonus line; no second choreography runs. For: bounded scope,
  the 3T is named free. Against: the S23's Android 12+ approximate-grant UI is the modern
  path. The against falls: the reading asks how the grant reports, not how it is granted,
  and a second phone doubles the grant dances on the owner's fleet. Committed.
- D131.5 The lane runs the device steps itself and dispatches the grill and the two
  audit reviewers. For: the device steps interleave locks, 15-second cycles and host
  choreography that a cold executor cannot hold mid-turn. Against: the lane rules prefer
  dispatched executors. The against falls: the rules also let the lane run each phase
  itself when dispatch cannot carry the lock discipline, and this ticket's steps are
  choreography, not code. Recorded in LOG.md. Committed.
- D131.6 The 3T reading order is RD4, RD1, RD5, RD2: the two no-change readings first,
  then the grant change, then the services change last, so every earlier reading runs
  with services on and both grants. Committed.
- D131.7 The probe logs through `console.log` with `[RD n]` markers, not the Pino
  wrapper. The no-`console.log` rule binds committed code; this file is plan scaffolding
  that never ships, and bare markers grep clean in logcat and syslog. Committed.

### 2.2 The executor must not decide

- A reading that appears to contradict the qibla lock or the location contract
  (`device/qibla.ts`) stops the step. Record the observation verbatim in READINGS.md,
  change nothing, and name the contradiction as row material in the report. No fix in
  this ticket.
- A phone that cannot be restored to its found state (grant, services, installed build)
  stops the step. Record what changed and what resisted, and report.
- A prompt or dialog whose buttons cannot be read or reached stops that reading at the
  capture; the screenshot and the log lines so far are the record.

## 3. Pre-flight

`scripts/preflight-131.sh`, run from the plan folder or a `$TMPDIR` copy. It checks: `uat`
checked out in the main tree, clean; `origin/uat` fetched and merged into `uat`; the
worktree's version not lower than 2.0.984; row 124 DONE in the queue; every anchor
counts exactly 1; the tools exist (`aapt2`, `adb`, `xcrun devicectl`, `pymobiledevice3`,
`agent-device`, `zsh`); the 3T visible to adb; the XS visible to devicectl. It ends
`PREFLIGHT OK`.

## 4. Background the executor needs

Code map (one line each):

- `device/qibla.ts` (92 lines): the whole location surface. Six classic calls:
  `getForegroundPermissionsAsync` (:20), `requestForegroundPermissionsAsync` (:24),
  `getLastKnownPositionAsync` (:54), `getCurrentPositionAsync` (:55),
  `reverseGeocodeAsync` (:69), `watchHeadingAsync` (:89). This is the location contract
  the readings must not contradict. Anchor `qibla-readposition.txt`.
- `node_modules/expo-location/src/next/js/locationServices.ts`:
  `enableLocationServices()` is Android-only; its docblock claims an in-app dialog under
  the GMS provider and Settings under the Android provider. RD2 tests the claim on the
  3T. Anchor `next-enableservices.txt`.
- `node_modules/expo-location/src/next/types/Permissions.types.ts`:
  `RequestPermissionsAccuracyOption.FULL` shows the iOS temporary-full-accuracy prompt
  when the app holds a reduced accuracy; the purpose key `ExpoLocationFullAccuracy`
  ships by plugin default. RD3 tests it live. Anchor `next-temp-accuracy.txt`.
- `node_modules/expo-location/src/next/js/getPosition.ts`: `getPosition` returns a cached
  fix younger than `maxCachedAge` seconds, waits up to `timeout` seconds for a new one,
  falls back to last known, and with `timeout: 0` returns the last known location right
  away. RD4 leans on the `timeout: 0` sentence; RD1 on a fresh wait. Anchor
  `getposition-cache.txt`.
- `node_modules/expo-location/src/next/types/Position.types.ts`: `Position.heading` is
  course over ground, `number | null`; `headingAccuracy` its uncertainty. RD1's verdict
  fields.
- `e2e/device-atlas-iphone-xs.md`: the XS build and install recipe (prebuild, xcodebuild
  generic Release with the inline team, `devicectl device install app`), the Settings
  routes, and the traps (system alerts swallow taps; screenshots are the reliable read).
  Anchor `xs-build-recipe.txt`.
- `e2e/device-atlas-oneplus3t.md`: the 3T facts. Android 9 asks the location permission
  once with no precise or approximate choice (that split arrives at API 31); Play
  Services shows a second Location Accuracy prompt after the grant.
- `$HOME/athan-gitree/BUILD.md` (not in the repo): the mock recipe this plan mirrors in
  the scratch worktree, step by step, with the fleettest suffix exported.
- `app/_layout.tsx`, `app/index.tsx`: the two files the scratch probe shell replaces.
  Never committed; the plan carries the replacement source in `scripts/probe-131.txt`.

How the pieces interact: the probe shell runs at the router root, logs a P0 block
(platform, provider, services, permission read), then runs RD4 and RD1 when the
permission is granted, then waits in a 2-second poll loop for the two host-driven state
changes: services off (RD2 fires once) and accuracy reduced (RD5 fires once). On iOS the
same shell runs P0, RD4, then waits for accuracy reduced to call
`requestForegroundPermissions({ accuracy: 'full' })` (RD3). Every reading logs BEGIN,
its result lines, and END, each prefixed `[RD n]`. Relaunches rerun the same flow; the
record cites the designated capture lines.

Existing tests: none are touched. No app code changes, so the coverage gate has nothing
new to cover. The hook's `Tests:` line still runs on every lane commit.

Why the obvious alternatives are wrong: adb alone cannot call /next APIs; the full app
with a debug screen runs sync and notification convergence on the owner's phones; a
simulator cannot answer RD1, RD2, RD3 or RD5 (they need GMS, real Settings, a real
CoreLocation grant and a real grant downgrade).

## 5. Design

The approach in one sentence: a throwaway probe shell in a scratch worktree makes the
five live calls on the two phones under the device locks, and every claim lands as a log
line or a dump, never a screenshot's word.

Alternatives rejected: driving the owner's installed app (it carries no /next import);
reading the /next source only (row 121 already did; these six are the phone questions).

Concurrency trace: the probe is single-threaded async on the JS thread. The two waiters
poll on a 2-second `setTimeout` chain with a 15-minute deadline; each fires once. The
host choreography is strictly ordered: state change, probe reaction, capture, restore.

Log capture: Android `adb -s 3T_SERIAL logcat -v time ReactNativeJS:V *:S` filtered on
`[RD`; iOS `pymobiledevice3 syslog live --udid IPHONE_UDID` filtered on `[RD` (fallback
in section 10). Screenshots accompany prompts and dialogs as reach evidence only.

Redaction invariant: the probe source contains no coordinate log call. Committed records
(READINGS.md, the row cell) describe fixes as indoors, one room, or against the test
fixtures' London position by distance in metres, never as coordinates.

**Acceptance criteria:**

- [R0.1] WHEN ticket 131 closes THE SYSTEM SHALL leave `uat` carrying no change outside `ai/plans/131-six-readings/`, the row 131 cell, and the three version files.
- [R1.1] WHEN the 3T probe holds both location grants with services on and the phone lies stationary indoors THE SYSTEM SHALL log RD1 lines naming the fresh fix's `timestamp`, `horizontalAccuracy`, `heading` and `headingAccuracy` values verbatim with null kept as null, or the `no fresh fix within 30 s indoors` verdict line when the fix is null.
- [R1.2] WHEN RD1's fresh fix carries no bearing THE SYSTEM SHALL name the absent form in READINGS.md as the RD1 verdict, quoting the logged `heading: null`.
- [R2.1] WHEN location services are off on the 3T and the probe calls `enableLocationServices` THE SYSTEM SHALL record the `dumpsys window` focused-window line captured between the call and its resolution plus the promise's resolved value as a log line.
- [R2.2] WHEN RD2 completes THE SYSTEM SHALL carry a services-on read-back, either `settings get secure location_providers_allowed` showing gps and network or the probe's services line reading true, logged after the restore.
- [R3.1] WHEN the XS app's grant holds reduced accuracy and the probe calls `requestForegroundPermissions` with accuracy full THE SYSTEM SHALL record the prompt's screenshot reference, the resolved response line, and the after-get permission line.
- [R3.2] WHEN RD3 completes THE SYSTEM SHALL carry the precise-location restore read (the probe's permission line showing accuracy full) and the clean-build reinstall evidence (the installed bundle version line after the restore install).
- [R4.1] WHEN the probe runs on one platform with the location permission granted THE SYSTEM SHALL log RD4 lines naming the classic `getLastKnownPositionAsync` timestamp and the /next `getPosition` timeout-zero timestamp with their equality verdict.
- [R5.1] WHEN the 3T fleettest app holds ACCESS_COARSE_LOCATION granted and ACCESS_FINE_LOCATION revoked THE SYSTEM SHALL log the /next permission read (granted, scope, accuracy) and the `getPosition` outcome, with a thrown error logged verbatim when it throws.
- [R5.2] WHEN RD5 completes THE SYSTEM SHALL name the grant restoration (fine re-granted, probe permission line showing accuracy full) and the fleettest package's final state (uninstalled, phone as found).
- [R6.1] WHEN the readings fold into the queue row THE SYSTEM SHALL record RD6 as void by ruling in the row cell, citing row 121's adopt-nothing ruling of 2026-10-16.

## 6. Steps

Checklist:

- [x] Step 1: the 3T session, RD4, RD1, RD5, RD2 (`steps/1-3t-readings.md`)
- [x] Step 2: the XS session, RD3 plus the iOS half of RD4 (`steps/2-xs-reading.md`)
- [x] Step 3: records, row cell, evidence fold (`steps/3-records.md`)

Step details live in `steps/`. Each device step runs alone under the matching
`device-<SERIAL>.lock`, and the scratch builds run under `build.lock` in the scratch
worktree `$HOME/athan-gitree/worktrees/plan-131` (detached at `ca73f5a9`, removed before
the lane ends).

## 7. Device proof

Builds (scratch worktree, never committed):

- Android fleettest: mirror BUILD.md steps with the suffix exported. Prebuild
  `CI=1 npx expo prebuild -p android --no-install --clean` with
  `EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key EXPO_ANDROID_SUFFIX=fleettest
  EXPO_NAME_SUFFIX=FleetTest` exported and every inherited `EXPO_PUBLIC_*` unset first;
  verify `applicationId 'com.mugtaba.athan.fleettest'` in the generated
  `android/app/build.gradle`; `TMPDIR=<fresh dir> ./gradlew assembleRelease --no-daemon
  -PreactNativeArchitectures=arm64-v8a`; verify with
  `aapt2 dump badging <apk> | grep "^package"` prints the fleettest id, and stop if it
  prints `com.mugtaba.athan` bare. Install `adb -s 3T_SERIAL install -r <apk>`.
- iOS: the atlas recipe. `EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key
  EXPO_PUBLIC_IOS_WIDGETS=1 CI=1 npx expo prebuild -p ios --no-install --clean` with
  inherited `EXPO_PUBLIC_*` (minus the three set) and both suffix vars unset;
  `xcodebuild -workspace ios/Athan.xcworkspace -scheme Athan -configuration Release
  -destination 'generic/platform=iOS' -allowProvisioningUpdates
  CODE_SIGN_STYLE=Automatic DEVELOPMENT_TEAM=<paid team> build`; install with
  `xcrun devicectl device install app --device IPHONE_UDID <app path>`.

Each reading's capture commands and expected lines live in the step files. No clock
changes run, so no `dumpsys alarm` read is owed. The 3T sits indoors, one room, flat on
the desk, for RD1. Force-stop is never used on the 3T (`am kill` after HOME if a restart
is needed, per the e2e rules); the XS app relaunches through devicectl.

## 8. Records

`READINGS.md` in this folder holds one section per reading: the call or command, the
cited log lines or dump lines (transcribed, position-free), the verdict, and the absent
form. Evidence transcripts live under `$HOME/athan-gitree/sessions/131/` and die with
the merge. The row 131 cell text at DONE is drafted in step 3 and folded by the audit.
Docs commit messages start with the version and name the ticket.

## 9. Push

None. The lane never pushes; the orchestrator pushes `uat` after audit.

## 10. When something goes wrong

| Symptom | What it means | Action |
| --- | --- | --- |
| Metro cannot resolve `expo-location/next` in the scratch build | Package exports off on this Metro | Replace the import with `expo-location/build/next/index.js` in the scratch copy only, record the substitution in LOG.md |
| Gradle TLS handshake failure mid-download | Transient network (BUILD.md lesson) | `curl` the URL; on HTTP 200, plain retry, no config change |
| `aapt2 dump badging` prints `com.mugtaba.athan` bare | The suffix did not reach prebuild | Stop. Rebuild with the suffix exported inside prebuild and gradle; never install the bare-id artifact on the 3T |
| devicectl returns the RSD allocation failure | Row 124's fault class | Run row 124's ladder rung 3 (`sudo pkill -9 remoted && sudo pkill -9 usbmuxd`, replug); if it persists, stop the XS step and report |
| `pymobiledevice3 syslog live` shows no `[RD` lines | RN console output not riding syslog | Fallback: `pymobiledevice3 developer dvt console --udid IPHONE_UDID`; if still none, the iOS evidence moves to the permission dumps (`devicectl device info details`), named so in READINGS.md |
| The GMS services dialog's buttons cannot be read from the screenshot | The dialog is the reach-only form | Capture the dumpsys focus line as the evidence, dismiss with BACK, restore services with `settings put secure location_providers_allowed +gps,+network`, and record RD2 as answered by the focus dump alone |
| The XS temp-full-accuracy prompt never appears | The absent form is itself the reading | Log the resolved response line (expected `accuracy: reduced`), restore precise ON, record the prompt's absence as RD3's verdict with the response line as evidence |
| A reading appears to contradict `device/qibla.ts` or the qibla lock | Section 2.2 | Stop the step, record verbatim, name it as new-row material |

Restore lists: the 3T (fleettest app uninstalled, location services on, no grant changes
on the owner's package); the XS (precise location on, While Using grant as found, a
clean local build of `uat` content installed). The scratch worktree (created detached, no branch) is
removed with `git worktree remove`.

## 11. Subagents

Planning: `explore` for fact questions (none owed; the lane measured everything
directly), `athan-plan-griller` for the grill. Delivery: the lane runs the steps itself
(D131.5) and dispatches two `athan-reviewer` passes at audit (plan-conformance and
blind), each handed the commit range, the diff file path and a findings file path.
`vision` reads any screenshot the lane cannot.

## 12. Report to the owner

Plain sentences: what each of the six readings answered, what the absent forms looked
like, what was restored on each phone, and that no app code changed. The progress table,
then the agent-ruled decision table, then the four-line handoff.
