# Ticket 120: iOS clears the delivered notification stack on app open

| Field | Value |
| --- | --- |
| Brief | iOS delivered-stack clear on app open, the owner's Android-parity ruling (the investigation's option C) |
| Planned at | `d1ce39d9` (uat 2.0.924, 2026-10-16) |
| Planned by | Lane 120; every open question agent-ruled, the owner's outcome ruling taken 2026-10-16 in the queue row |
| Needs first | nothing (her ruling taken 2026-10-16) |
| Parent | none |
| Group | notifications delivered-set presentation; `shared/notifications.ts` is touched by no other open lane |
| Batch budget | 2 |
| Session budget | 3 |
| Steps count | 2 (one code, one device) |
| Device | iPhone XS (`IPHONE_UDID`, iOS 18.7.10) for the proof; no Android device work |
| Owner decisions still needed | none |

## 1. Goal

Today every athan and reminder that fires on iOS stays in the Notification Center until the
owner clears it by hand: app code never touches the delivered set (no dismissal, no
presented-set read, no badge). Android already delivers exactly one visible notification at a
time because its presentation delegate posts under one shared tag, the newest replacing the one
before it. The owner ruled 2026-10-16 (queue row 120, quoted in substance): iOS must behave
like Android, one visible notification at a time, the newest replacing the one before it, so a
sleeper never wakes to a stack. The ruled mechanism is the investigation's option C: when the
app opens, iOS clears the whole delivered stack. When this ticket is DONE, opening the app on
iOS (cold launch and every return from the background) leaves the center empty of this app's
entries, and the owner sees an empty Notification Center after opening the app on her XS.

Rules that apply:

- The owner's outcome ruling (row 120, 2026-10-16) is the recorded say-so for this change; the
  clear-on-open shape is her accepted recommendation inside that outcome.
- Hard fences from the row: no identifier change, no channel change, no pending-request change,
  the 64-budget arming and the reminder-never-outruns rule untouched, the Android delegate and
  the frozen channels untouched, and the notification arming logic out of scope entirely. This
  change touches delivered-stack presentation only.
- `ai/AGENTS.md`: full unit coverage of every line a change touches, red before green, a
  mutation pass on guarded logic, `yarn validate` green, version bump on every commit.
- The repository's placeholders rule: `IPHONE_UDID` and `TEAM_ID` never expand inside any file
  this ticket writes.

## 2. Decisions

### 2.1 Taken

| ID | What | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D120.0 | iOS behaves like Android: the clear-on-open mechanism (option C) implements her one-at-a-time ruling | Owner, ruling taken in session | 2026-10-16 | Queue row 120 |
| D120.1 | The clear lives in a new exported `clearDeliveredNotifications` in `shared/notifications.ts`, called inside `initializeNotifications` after the permission grant and immediately before the injected refresh, awaited, outside the scheduling lock | Agent-ruled | 2026-10-16 | This section |
| D120.2 | The call is wrapped in `withNativeTimeout` with its own try/catch; a failure or a timeout is logged and swallowed and never stops the refresh | Agent-ruled | 2026-10-16 | This section |
| D120.3 | The platform gate is `Platform.OS !== 'ios'` as the function's first line, mirroring `deleteLegacyAndroidAudioChannels`'s android gate, so the Android `cancelAll` route (expo-notifications 58.1.5, `ExpoPresentationDelegate.kt:275-278`) never fires | Agent-ruled | 2026-10-16 | This section |
| D120.4 | The clear runs only when `checkPermissions()` granted: iOS purges the delivered set when authorization is revoked, so the permissionless call is a guaranteed no-op on every open of a permissionless install | Agent-ruled | 2026-10-16 | This section |
| D120.5 | One info log line per clear: `NOTIFICATION: Cleared the delivered notifications`. House pattern (every notification operation logs), and it is the unified-log proof marker for step 2 | Agent-ruled | 2026-10-16 | This section |
| D120.6 | The XS proof vehicle is a mock-env Release build installed on the XS (deterministic imminent deliveries per the seed shape in `mocks/simple.ts` `buildTimes`, logs on), then a prod-env Release build of merged uat returns the phone to real data as the final act | Agent-ruled | 2026-10-16 | This section |
| D120.7 | The row's named before-read (the center's structure on the current binary) is taken opportunistically under the device lock and is not acceptance: the row already carries the measured multi-athan configuration, and the load-bearing evidence is the entry-before, zero-after pair | Agent-ruled | 2026-10-16 | This section |

D120.1 argued twice. Challenge one: put the clear before `checkPermissions()` unconditionally,
so no state can skip it. Rejected: with authorization revoked iOS has already emptied the
delivered set and cancelled pending requests, so the unconditional call is a wasted native call
on every open of a permissionless install, and the permission branch reads as "clear what
fired, then re-arm what is next". Challenge two: fire-and-forget instead of awaiting before the
refresh. Rejected: the row's shape is "before the refresh", a serial await gives the proof a
deterministic log order, and the worst case is already bounded at fifteen seconds by
`withNativeTimeout`, the same bound the channel preparation above it already accepts. The
recommendation survived both challenges.

D120.4 argued twice. Challenge: the settings-level presentation toggle (notifications off in
Settings while authorization stands) can leave nothing presenting, making the clear a no-op
there too. True and harmless: dismissing an empty delivered set is a system no-op, and the
toggle state is not observable from `getPermissionsAsync`. The permission gate stays.

D120.6 argued twice. Challenge: prove on the prod build only, waiting for a real prayer hour.
Rejected: her configuration's next delivery can sit hours out, the wait would hold the XS
device lock far longer than lane 111 contention allows, and the clear's code path is
env-independent. The mock build delivers the same iOS delivered-set mechanics with logs on;
the prod install at the end still proves cold launch on real data. The mock's seed shape is
stated from the code in step 2, not from memory: in the evening window Maghrib arms on the
next minute boundary and Isha the minute after, in the small hours Fajr arms next-minute, and
the spent late-evening window arms nothing imminent.

### 2.2 The executor must not decide

Every stop is a STOP to the lane lead, answered agent-ruled from this plan or recorded as a new
decision. No situation in this plan reaches the owner.

## 3. Pre-flight

`scripts/preflight-120.sh`, run from a copy saved to `$TMPDIR`. It checks the lane worktree at
`lane/120`, a clean tree, `uat` merged into the branch, the version not lower than planned, and
every anchor counting exactly 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map (anchors under `scripts/anchors/`, each counting 1 at `d1ce39d9`):

| File | Line span | Role |
| --- | --- | --- |
| `shared/notifications.ts` | 572-603 | `initializeNotifications`: channel prep, permission check, injected refresh, optional background-task registration. The clear inserts here (anchor a1) |
| `shared/notifications.ts` | 34-81 | `NATIVE_CALL_TIMEOUT_MS` and `withNativeTimeout`: the fifteen-second bound every native call in this file rides |
| `shared/notifications.ts` | 527-536 | `deleteLegacyAndroidAudioChannels`: the platform-gate precedent the new function mirrors (anchor a2) |
| `app/index.tsx` | 133-138 | Cold-launch caller: deferred 1.5 s post-paint, calls `initializeNotifications` (anchor a7) |
| `device/listeners.ts` | 46-52 | Foreground-return caller: background-to-active transition calls `initializeNotifications` (anchor a8) |
| `device/tasks.ts` | 23-60 | The background task: calls `rescheduleAllNotificationsFromBackground` only, never `initializeNotifications`, so the clear structurally never runs from the background (anchor a5) |
| `hooks/useNotification.ts` | 12-20 | The foreground presentation handler: what fires while the app is open presents and enters the delivered set after the clear ran (anchor a6) |
| `shared/__mocks__/expo-notifications.ts` | 56-59 | The jest mock for expo-notifications; `dismissAllNotificationsAsync` is missing and must be added (anchor a3) |
| `shared/__tests__/notifications.test.ts` | 632-661 | The `initializeNotifications` suite the new tests join (anchor a4) |
| `__tests__/app/index.test.tsx`, `device/__tests__/listeners.test.ts`, `device/__tests__/tasks.test.ts` | whole | Existing route coverage: both callers route through `initializeNotifications`; the task-body suite gains one fence test asserting the executor never dismisses delivered notifications |

Library facts, verified from the installed `node_modules/expo-notifications@58.1.5`:

- `dismissAllNotificationsAsync` is exported (`src/index.ts:20`) and defined at
  `src/dismissAllNotificationsAsync.ts:10-16`.
- iOS native: routes to `UNUserNotificationCenter.current().removeAllDeliveredNotifications()`
  (`ios/ExpoNotifications/Notifications/Presenting/PresentationModule.swift:19-21` and
  `37-39`). Delivered notifications only; pending requests and channels are untouched.
- Android native: the same JS call routes to `notificationManager.cancelAll()`
  (`android/.../ExpoPresentationDelegate.kt:275-278`), which would cancel the app's posted
  notifications and change the frozen one-visible face. This is why the iOS gate is mandatory.
- `getPresentedNotificationsAsync` exists (`src/index.ts:18`) for any diagnostic read.

How the pieces interact: `initializeNotifications` runs on exactly two events (cold launch
post-paint, background-to-active). Inside it, the channel preparation is awaited and
failure-swallowed, then the permission check gates the injected refresh, which internally takes
the scheduling lock in `stores/notifications.ts`. The clear slots between the grant and the
refresh, outside that lock by construction.

Why the obvious fixes are wrong:

- One shared scheduling identifier (true replace-in-place) collapses the date-scoped
  candidate-row arming against the 64-request budget; rejected in the investigation and fenced
  by the identifier freeze.
- `threadIdentifier` grouping shortens nothing: one thread equals the app-level group iOS
  already gives every app, and the pinned API exposes no `summaryArgument`. Rejected.
- A badge would count what the owner wants gone. Neither composer writes one; out of scope.

## 5. Design

The approach, one sentence a test can check: on iOS, every call to `initializeNotifications`
with permission granted dismisses the whole delivered set exactly once, before the injected
refresh, and no failure of that dismissal changes anything else.

The invariant: pending requests, scheduling identifiers, channels, the 64-budget arming and the
reminder rule are byte-identical before and after this change; only the delivered set is
dismissed, only on iOS, only through the two `initializeNotifications` routes.

Alternatives rejected: covered in section 4 and the row (status quo, thread grouping,
replace-in-place, both). The clear-on-open is the only lever inside every fence.

Concurrency trace:

- Cold launch: the post-paint timeout fires `initializeNotifications`; the clear awaits (worst
  case fifteen seconds, then `withNativeTimeout` rejects), then the refresh takes the lock. A
  clear that times out sets `nativeCallTimedOut`; the refresh's own `withSchedulingLock`
  acquisition consumes it and reopens the gate, so the next foreground runs a full reschedule.
  That is the existing designed semantic for any unanswered native call, not new behavior.
- Foreground return: `listeners.ts` fires `initializeNotifications` un-awaited (unchanged), so
  the clear adds at most its bounded wait to that path.
- A notification firing while the app is foreground: the presentation handler shows it and it
  enters the delivered set after the open's clear already ran; it survives until the next open.
  On Android the delegate posts it the same way. Parity holds.
- The background task (`device/tasks.ts`) never calls `initializeNotifications`, so the clear
  never runs from the background: a notification the sleeper never saw is never removed without
  an app open.

Acceptance criteria:

- [R1.1] WHEN initializeNotifications runs with notification permission granted on iOS THE SYSTEM SHALL dismiss the whole delivered set exactly once through Notifications.dismissAllNotificationsAsync before the injected refresh runs
- [R1.2] WHEN initializeNotifications runs on Android THE SYSTEM SHALL leave delivered notifications untouched
- [R1.3] WHEN initializeNotifications runs on iOS with permission denied THE SYSTEM SHALL leave delivered notifications untouched
- [R1.4] WHEN the dismissal call rejects or never answers within the native call timeout on iOS THE SYSTEM SHALL swallow the failure, log one error line, and still run the injected refresh and resolve initializeNotifications without throwing
- [R1.5] WHEN the app cold-launches or returns from the background to active THE SYSTEM SHALL reach the clear through initializeNotifications on both routes and WHEN the background task runs THE SYSTEM SHALL leave delivered notifications untouched (the background half is pinned by the tasks.test.ts fence test, the route half by the existing caller suites and anchor a5)
- [R2.1] WHEN the proof build on the iPhone XS delivers notifications while the app is closed THE SYSTEM SHALL show those entries in the Notification Center before the app opens and zero entries after the app opens, with one clear log line per open in the captured log when the Release build emits JS logs

Design review: one function, one call site, three fences (platform, permission, background) all
structural. The riskiest line is the ordering guarantee before the refresh, pinned by the
invocation-order assertion in the red test.

## 6. Steps

Checklist:

- [ ] Step 1 `steps/1-code.md` — the clear function, the call, the mock, red-first tests, the
      mutation pass, coverage 100 on touched lines (Weight 2)
- [ ] Step 2 `steps/2-xs-proof.md` — the XS proof: mock-build entry-before, zero-after pair with
      the log line, then the prod build returns her phone to real data (Weight 3)

## 7. Device proof

The phone: iPhone XS, `IPHONE_UDID`, iOS 18.7.10, unlocked, the XS automation channel restored
(row 124). Lane 111 holds it for long stretches: take `$HOME/athan-gitree/device-<XS
serial>.lock` in short cycles, retry in `sleep 15` loops, never skip, and record any read the
lock cost. Read `e2e/device-atlas-iphone-xs.md` before the first screenshot; transcribe what
the center shows, never commit a screenshot.

Build (from the main tree at merged uat, under `$HOME/athan-gitree/build.lock`; the scripts and
the atlas own the order):

1. Mock-env Release build carrying the change, opening the shell with
   `unset EXPO_PUBLIC_ENV` so no earlier shell state leaks a prod env into a mock cycle:
   `export EXPO_PUBLIC_IOS_WIDGETS=1 CI=1 EXPO_NO_TELEMETRY=1` (no `EXPO_PUBLIC_ENV`, so the
   mock API serves and logs stay on), `npx expo prebuild -p ios --no-install`, then
   `DEVELOPMENT_TEAM=$TEAM_ID npx expo run:ios --configuration Release --device $IPHONE_UDID`.
   The run's own launch is the throwaway first launch (What's New marks itself).
2. Delivery cycle one: start the log capture (`pymobiledevice3 syslog live --udid
   $IPHONE_UDID`) before anything else, launch the app, give the init 20 s to arm, terminate
   the app (`xcrun devicectl device process terminate --device $IPHONE_UDID
   com.mugtaba.athan`), and wait inside the 180 s deadline for the seed's imminent rows to
   fire (the evening shape arms Maghrib on the next minute boundary and Isha the minute
   after; the small hours arm Fajr next-minute; the spent late-evening window arms nothing
   imminent, so no cycle runs there). Expected: the banner-delivery line the lane-111 loop
   proved (`Created process assertion for will present notification`) at the armed minute.
3. Read the center before the open: swipe down from the top centre at the notch (top-left
   opens the Today view) through agent-device; the runner lane 111 prepared may already sit on
   the phone, else `AGENT_DEVICE_IOS_TEAM_ID=$TEAM_ID agent-device prepare ios-runner --udid
   $IPHONE_UDID` and uninstall both runner apps afterwards; screenshot
   (`pymobiledevice3 developer dvt screenshot --udid $IPHONE_UDID`), read the image, transcribe
   the Athan entries. Expected: the entries this cycle's deliveries produced. Write the swipe
   route back into the atlas after the first working read.
4. Open the app neutrally:
   `xcrun devicectl device process launch --device $IPHONE_UDID com.mugtaba.athan`, wait 10 s.
5. Read the center after the open: swipe, screenshot, transcribe. Expected: zero Athan entries,
   and one `NOTIFICATION: Cleared the delivered notifications` line in the capture when the
   Release build emits JS logs (a missing line is a recorded void read, never a rebuild: the
   pair is the gate).
6. Delivery cycle two: repeat 2 and 3. Expected before the second open: exactly the entries
   delivered since cycle one's open and not one more (cycle one's open emptied the center, so
   a surviving entry would be red), then open and read zero again. This cycle is the proof the
   first clear really emptied the center, not that iOS hid entries behind a group.
7. Return the phone to the shipping state: prod-env Release build of merged uat
   (`export EXPO_PUBLIC_ENV=prod EXPO_PUBLIC_API_KEY=$(cat $HOME/.config/athan/.api_key)
   EXPO_PUBLIC_IOS_WIDGETS=1 CI=1 EXPO_NO_TELEMETRY=1`, the key never printed), prebuild, run
   to the device, throwaway launch, verify the schedule renders and no crash report exists for
   the bundle.
8. Evidence lands under `$HOME/athan-gitree/sessions/120/`: the transcriptions, the two
   per-cycle before/after reads, the log excerpt with the clear lines, the build versions. It
   dies at DONE with the plan folder.

Void shapes, each recorded with its tool and what absent looked like: a center read showing no
Athan entry before any open (retry one more delivery cycle; two empties in a row is a STOP with
the capture), a delivery that never lands inside 180 s (re-launch to re-seed, retry once), the
clear log line missing from the Release capture (the before-and-after pair stands, the miss
recorded), agent-device wedging (fall back to devicectl launch plus pymobiledevice3 screenshot
alone and record the missing swipe), lane-111 lock contention past 15 minutes (release, record,
retry the cycle later in the session).

## 8. Records

Findings text for `LOG.md` and the DONE row text are in `steps/2-xs-proof.md` section Records.
The docs commit at DONE: `<VERSION> - docs(plans): ticket 120 DONE: iOS clears the delivered
stack on app open, XS-proven`, with `<VERSION>` the next patch after `uat`, taken under
`$HOME/athan-gitree/version.lock`, `app.json` bumped first then `package.json`.

## 9. Push

None. The lane never pushes; the orchestrator pushes `uat` when every unpushed commit is
audited.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| Red test fails with `dismissAllNotificationsAsync is not a function` | Mock line not added first | Add the mock line (step 1 order pins it), rerun |
| Ordering assertion red after green | The clear moved after the refresh | Restore the exact insertion point at anchor a1 |
| An existing suite reds (listeners, app index, tasks) | The change altered `initializeNotifications`'s external contract | STOP: the contract is unchanged; diff against anchor a1 and restore |
| Coverage below 100 on `shared/notifications.ts` | An uncovered branch in the new function | Add the missing case from the mutation list before proceeding |
| iOS build fails signing | Team inline flag or profile | The atlas's build row owns the sequence; verify `DEVELOPMENT_TEAM=$TEAM_ID` rode the command |
| The XS refuses automation (RSD failure) | The row-124 class returned | `xcrun devicectl device info lockState --device $IPHONE_UDID`; if it errors, record and STOP the device step, the code step stands on its own gates |
| Lane-111 lock contention beyond 15 minutes | Shared phone | Release the device lock, record the gap, retry later in the session; never skip the lock |

Anticipated review fixes, word for word: "the nested describe's `afterEach` restoring
`Platform.OS = 'ios'` hard-codes the default twice, capture the original once instead" and
"the break script's perl pattern is the only untested regex in the plan, run it against a
scratch copy first".

Restore lists: step 1 restores nothing (additive code); every mutation-pass mutant is restored
by `git checkout -- shared/notifications.ts` before the green rerun; step 2 restores the phone
to the prod build (its own final act) and removes the agent-device runner apps if this session
prepared them.

## 11. Subagents

Planning: `explore` for facts, `athan-plan-griller` for the grill. Delivery: the lane lead
dispatches `athan-executor` for each step and `athan-reviewer` (blind plus plan-conformance)
for the audit. Image reads: the reader reads screenshots itself when it can see them, else
`vision` with one exact question per image. Nothing else, ever.

## 12. Report

Plain sentences: what changed (one iOS-gated clear on app open), what was proven (red-green
unit coverage with the mutation pass, the XS entry-before zero-after pair with the log line),
the decisions agent-ruled, then the progress table and the four-line handoff.
