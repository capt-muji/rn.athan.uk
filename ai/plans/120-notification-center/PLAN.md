# Ticket 120: iOS Notification Center: group or clear the delivered stack (threadIdentifier)

| Field | Value |
| --- | --- |
| Brief | Queue row 120: measure what the iOS delivered stack holds today, write the delivery levers the pinned SDK offers with each one's blast radius on the frozen delivery rules, return one recommendation plus the XS experiment that settles the rendering, and let her rule the shape |
| Planned at | uat `b329d543` 2.0.900, 2026-10-16 (every anchor counted 1 at this sha) |
| Planned by | lane 120 (agent-ruled frontier, standing hands-off order 2026-10-16) |
| Needs first | nothing (her 2026-10-16 order; the standing clear-the-board order is her go) |
| Parent | nothing |
| Group | none (docs-only; the queue row and the two tracked version files, `package.json` and `app.json`, serialize as lane weather) |
| Batch budget | 3 weight units |
| Session budget | 3 weight units (one lane session carries all three docs steps) |
| Steps count | 3 (all weight 1, docs) |
| Device | none this wave (no device contact, no builds; the XS read is written as the named experiment and waits on her unlock) |
| Owner decisions still needed | her ruling on section 5's options; her hand on the XS for the named experiment |

## 1. Goal

The owner read the SDK 58 release note for expo-notifications (local notifications can
be grouped on iOS with `threadIdentifier`) and ordered this row. Android already
delivers exactly one visible notification at a time: `plugins/replacePreviousNotification.js`
writes a presentation delegate that posts every notification under one shared tag,
`athan-notification`, so the newest replaces the one before it (row 3, 1.27.198). iOS
carries no delivered-notification handling at all. Every fired athan and every fired
reminder stays in the Notification Center under the app until the user clears it.

When DONE, the queue row carries: the measured state of both platforms with a citation for
every claim, the delivery levers the pinned package actually offers (grouping, clearing a
delivered notification, replacing one) with each one's blast radius on the frozen delivery
rules, one recommendation with its rejected rivals, the XS experiment that settles what the
center renders (waiting on her unlock), and the condition the code wave waits on. Nothing
outside `ai/plans/`, the queue row and the two tracked version files changes before her word.

The owner's rules that govern, quoted:

- Row 120, the order: "she read the SDK 58 release note (expo-notifications on iOS:
  notifications can be grouped with threadIdentifier) and ordered a ticket".
- Row 120, the deliverable: "THE ROW decides what iOS should do: grouping under a thread (one
  stack with a header), clearing or replacing delivered notifications, or both ... and she
  rules the shape. Reminders answer too: they join the athan thread or sit apart".
- Row 120 supersedes the programme's standing ruling, and this plan reverses it explicitly:
  `ai/plans/SDK58-PROGRAMME.md:24-26` scope item 2 said "Already ruled at past re-pins, do not
  re-litigate: no SwiftPM (CocoaPods stays), no threadIdentifier grouping, no Live Activities."
  The `threadIdentifier` half is dead. No longer re-litigated: the reverse is now the open
  question this row answers.
- `ai/AGENTS.md:130-133`: "Notifications: candidate rows are armed whole in time order against
  the request budget (64), never a day count. A reminder never outruns the athan it warns
  about. Android channel sound, audio attributes and importance are frozen at creation, so a
  new generation means new channel ids and one-time legacy deletion."
- `ai/AGENTS.md:98`: "Visuals are settled. Fixes change behaviour only. Touch no pixel without
  the owner's say." Any gathered or split notification group is a visible surface.
- `ai/AGENTS.md:106-107`: "Ask first: installing dependencies, deleting non-empty files, MMKV
  schema keys, notification scheduling logic, `app.json` and `eas.json`." Every lever this row
  recommends lands in the notification path, so no code ships in this ticket.
- `ai/AGENTS.md:85`: "Never name a model in any file". This plan and its findings name work,
  never a model.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who | When | Recorded |
| --- | --- | --- | --- | --- |
| D120.1 | The deliverable is investigation only: no code, no build, no device contact. The XS read is written as the named experiment and recorded as not observed, because the phone is attached but locked and no agent step can unlock it | agent-ruled | 2026-10-16 | here, sections 5 and 7; why: row 120's own words are "INVESTIGATION FIRST", her standing order for this run is hands-off, and row 111's resume record already proves the locked-XS refusal signature |
| D120.2 | Evidence hierarchy: the app's own code and the pinned package's own source first (each cited by `path:line`), the pinned package's changelog second, the vendor's own published notification documentation third, and every rendering claim that only the device can settle marked unmeasured and named to the experiment | agent-ruled | 2026-10-16 | here, section 4 and FINDINGS sections 1 to 2; why: the row's facts are code facts, and the one thing code cannot answer is what the phone draws |
| D120.3 | The recommendation to her is option C, clear the delivered stack when the app opens, iOS-gated, argued twice in section 5 | agent-ruled | 2026-10-16 | here, section 5 |
| D120.4 | The thread lever alone is rejected as the primary answer: with one thread the app already gets one group named after itself, and the pinned JS content input exposes no `summaryArgument`, so a named header is not settable from app code | agent-ruled | 2026-10-16 | here, section 5; why: WWDC18-710 notes (no thread identifier groups everything under the app) plus `node_modules/expo-notifications/build/Notifications.types.d.ts:538-631` (input carries `threadIdentifier`, no summary field), so grouping alone shortens nothing |
| D120.5 | Replacement by one shared identifier is rejected: collapsing the date-scoped identifiers would fold every armed day into a single pending request and break the candidate-rows arming against the 64 budget | agent-ruled | 2026-10-16 | here, section 5; why: `device/notifications.ts:46-52` states the identifier is the identity that makes re-arming idempotent, and one identifier per prayer rather than per prayer and date arms one day only |
| D120.6 | Every lever in this row is iOS-gated. Android keeps its delegate, its one visible notification and its frozen channels: the group key would change a visible Android face, and Android's dismissal call clears the one notification the owner currently sees | agent-ruled | 2026-10-16 | here, section 5; why: `ai/AGENTS.md:98` and `:130-133` freeze the Android face, and `node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/service/delegates/ExpoPresentationDelegate.kt:275-277` routes Android dismissal to `cancelAll()` |
| D120.7 | Reminders need no thread of their own: under the recommended lever they clear with everything else, and if she takes grouping they join the athan thread, because a reminder and the athan it warns about are one event | agent-ruled | 2026-10-16 | here, section 5 |
| D120.8 | The deliverable folds into the queue row; no findings file survives DONE, because no shipped code or config would cite one. Precedent: rows 65, 66, 117, 118, 119, 122, 123 | agent-ruled | 2026-10-16 | here, section 8 |
| D120.9 | The lane executes all three docs steps itself; the grill and both audit reviewers are dispatched as workers | agent-ruled | 2026-10-16 | LOG.md; why: the three steps are measurement and writing with no red-green code loop, and the lane already holds the measurements from planning, while the grill and the blind audit are exactly the worker jobs that add rigour |

### 2.2 The executor must not decide

- `require('expo-notifications/package.json').version` answering other than 58.1.4: STOP. A
  sibling lane re-pinned the SDK; the lead re-verifies every pinned-source citation before a
  step continues.
- The app-tree sweep for `dismissAllNotificationsAsync`, `dismissNotificationAsync`,
  `getPresentedNotificationsAsync` and `setBadgeCountAsync` printing any app-code line: STOP.
  Row 120's verified state is zero call sites; a hit means the code moved under this plan.
- `SHARED_NOTIFICATION_TAG` in `plugins/replacePreviousNotification.js` not equal to
  `athan-notification`: STOP. The Android one-visible face is the premise of the comparison.
- Any question about the device: never attempt to unlock, never ask her to unlock mid-step,
  never fake a reading. A locked XS is the recorded state; the experiment stays unwritten-in.
- A build, an install, a Maestro flow or a clock change: STOP. This wave carries no device
  contact, and notification scheduling logic is ask-first by `ai/AGENTS.md:107`.
- Any command printing what FINDINGS.md does not predict: STOP and report the exact
  divergence. Never widen the reading list to chase it.

## 3. Pre-flight

`scripts/preflight-120.sh`, saved to `$TMPDIR` and executed from the worktree root
(`bash "$TMPDIR/preflight-120.sh"` with the working directory at the worktree root). It checks:
the worktree is on `lane/120` with a tree clean apart from the plan folder, the queue row and
the two tracked version files, `origin/uat` is fetched, the local `uat` ref is at or past
`b329d543`, `package.json` is not lower than 2.0.900, every anchor under `scripts/anchors/`
counts exactly 1 in its source file, the installed `expo-notifications` is 58.1.4, the pinned
iOS thread assignment and the three delivered-set API names are present in the installed
source, the Android group-key mapping is present, and the app-tree sweep for the four delivered
APIs is empty. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Files this row reads. None of them changes outside the plan folder, the queue row and the two
tracked version files.

Repository code, with the anchor that holds it:

- `shared/notifications.ts` - the content composers and the one init path. `genNotificationContent`
  (anchor `a1-genNotificationContent.txt`) builds an at-time athan: title only, `autoDismiss:
  false`, `interruptionLevel: 'timeSensitive'`, `AndroidNotificationPriority.MAX`.
  `genReminderNotificationContent` (anchor `a2-genReminderNotificationContent.txt`) builds a
  reminder the same way with `autoDismiss: true` and `HIGH`. Neither sets a thread identifier and
  neither sets a badge. `withNativeTimeout` (:65-81) bounds every call into the notification
  system at 15 s. The channel block (:408-540) owns the frozen Android face: channel sound,
  importance, vibration and alarm audio attributes are set at creation, and the legacy-channel
  sweep (:535-560) exists because Android cannot change a channel's sound after creation.
  `initializeNotifications` (:572-603) runs the channel prep, the permission check, the refresh
  and the background-task registration; the permission branch is anchor `a10-initPermissionBranch.txt`.
- `device/notifications.ts` - the platform layer. `prayerNotificationIdentifier` (anchor
  `a3-prayerIdentifier.txt`) and `reminderNotificationIdentifier` (:63-68) build the date-scoped
  identities whose comment states the platform contract: the same identifier replaces in place on
  both platforms. `addOneScheduledReminderForPrayer` (:220-269) arms a reminder; its arming call
  is anchor `a4-armingCall.txt`. The at-time arm (:100-160) is the same shape with the athan
  channel and the athan content.
- `plugins/replacePreviousNotification.js` - the Android presentation delegate (anchor
  `a6-androidDelegate.txt`): every notification is posted under the companion object's
  `SHARED_NOTIFICATION_TAG`, and the manifest edit removes expo's own receiver so routing is
  deterministic. This is the whole of Android's one-visible-notification behaviour.
- `hooks/useNotification.ts` - the foreground handler (anchor `a5-foregroundHandler.txt`): a
  notification that fires while the app is open plays its sound and is shown in the banner and in
  the list, so it also lands in the delivered set.
- `shared/__mocks__/expo-notifications.ts` - the Jest stand-in. Its `NotificationContentInput`
  (anchor `a7-mockContentInput.txt`) declares the fields the app composes; a future code step that
  adds a content field extends this interface beside its production tests, and its
  `dismissAllNotificationsAsync` does not exist yet.
- The moments the app is open, and the one that is not:
  `app/index.tsx:98-158` runs `initializeListeners` at mount and `initializeNotifications` once
  per process behind the 1.5 s post-paint delay; `app/index.tsx:168-172` re-runs
  `refreshNotifications` when data lands; `device/listeners.ts:33-74` calls
  `initializeNotifications` again on every return from background to active;
  `device/tasks.ts:21-49` is the background task body, and it calls
  `rescheduleAllNotificationsFromBackground`, never the init path. So "the app is open" is
  exactly the two init call sites, and the background task is never one of them.

Installed packages, cited by `path:line` at the pinned version 58.1.4 (never anchored, because
`node_modules` is not versioned; the pre-flight checks each of these lines):

- `node_modules/expo-notifications/ios/ExpoNotifications/Notifications/NotificationRecords.swift`
  (:297, :322, :368-369) - the content record declares `threadIdentifier`, reads it back, and
  assigns it onto the outgoing `UNMutableNotificationContent`.
- `node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Scheduling/SchedulerModule.swift`
  (:135) - the scheduler builds the request's content from that record, so a local notification
  scheduled through the JS API carries the thread identifier.
- `node_modules/expo-notifications/build/Notifications.types.d.ts` (:538-631) - the JS content
  input type. `threadIdentifier` is an input field. `NotificationContentIos` (:455-530) carries
  `summaryArgument` on the read side only, so app code cannot name a thread's header.
- `node_modules/expo-notifications/CHANGELOG.md` (:118 and :31) - iOS grouping support landed in
  58.0.0 (PR expo/expo#49429, 2026-09-10); the Android group-key support landed in 58.1.1
  (PR expo/expo#43388). Both are in the installed version, which is the version the row's
  release-note reading refers to.
- `node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/ArgumentsNotificationContentBuilder.java`
  (:51) and `.../notifications/model/NotificationData.kt` (:62) - on Android the same field is the
  notification's group key.
- `node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Presenting/PresentationModule.swift`
  (:12-42) - the delivered-set API on iOS. `dismissAllNotificationsAsync` calls
  `removeAllDeliveredNotifications()`; `dismissNotificationAsync` calls
  `removeDeliveredNotifications(withIdentifiers:)`; `getPresentedNotificationsAsync` reads
  `deliveredNotifications()`. Nothing in this module touches pending requests.
- `node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/service/NotificationsService.kt`
  (:175) with `.../service/delegates/ExpoPresentationDelegate.kt` (:275-277) - on Android the same
  dismissal call routes to `notificationManager.cancelAll()`, which clears the one visible
  notification the delegate posts.

Vendor semantics, cited so section 5 does not rest on a guess:

- Apple's "What's New in User Notifications" session notes (WWDC18-710): without a thread
  identifier all of an app's notifications are grouped in one group named after the app; with a
  thread identifier they group per thread per app; the identifier is never shown to the user; and
  the user's own notification settings can override the app's grouping (Automatic, by app, off).
  The rendering this produces on iOS 18.7 is what the named experiment reads, because the notes
  describe iOS 12 and no device read exists yet.

How the pieces interact. The app builds one content object per notification and arms it with a
date trigger and a date-scoped identity. The OS delivers it with no app code running, which is
why nothing in the app can react at delivery time while the app is suspended. What the app
controls is therefore two things only: what the content carries (title, sound, interruption
level, and on iOS a thread identifier) and what the OS stores for it; and what the app does the
next time it runs (which is where a removal of delivered notifications could live). Android
already answers the second half by never letting a second notification coexist: the delegate
rewrites the identifier at the posting layer to one shared tag, so the newest replaces the one
before it. iOS has no equivalent rewrite: its posting layer is the system's, and the identity
that reaches it is the app's own date-scoped identifier.

Why the obvious fix is wrong. The obvious reading of the release note is "set `threadIdentifier`
on the content and iOS groups them". It does group them, and that changes nothing visible here:
the app's notifications are already grouped in one group named after the app, a single thread
identifier keeps them in one such group, and the pinned JS input exposes no summary argument to
name it. The second obvious fix, "give every notification the same identifier so each replaces
the one before it", is the Android mechanism, and on iOS it would collapse the schedule: one
identifier for all at-time notifications arms one pending request instead of a candidate row per
prayer per day, which breaks the 64-budget arming the row's dependency graph rests on.

## 5. Design

The frames, one table each in FINDINGS: the lever table (lever, mechanism at the pinned version,
what it changes for the user, files a code step would touch), and the frozen-rule table (each
lever against each frozen rule: candidate rows armed whole in time order against the 64 budget; a
reminder never outruns its athan; Android channel sound, audio attributes and importance frozen
at creation; the Android one-visible delegate; the settled visual surface).

The options for her ruling:

- **Option A, status quo.** Nothing changes. The center keeps what it holds until the user clears
  it. Cheapest, and it leaves the row's own complaint standing: iOS accumulates where Android
  shows one.
- **Option B, group under a thread.** Add `threadIdentifier` to both content composers, iOS-gated.
  One thread for everything changes nothing visible (the app-level group already exists). Two
  threads, athans and reminders, split the app's notifications into two groups under the app.
  Neither shortens the stack, both add a visible surface whose rendering is unmeasured, and the
  user's own notification settings can override the grouping anyway.
- **Option C, clear the delivered stack when the app opens (recommended).** One iOS-gated call in
  `initializeNotifications` (`shared/notifications.ts:572-603`, whose permission branch is anchor
  `a10-initPermissionBranch.txt`) dismisses the app's delivered notifications. That function runs
  at cold launch and on every return to the foreground, and never from the background task
  (`device/tasks.ts:21-49`). The delivered set is what it touches, so pending requests, the armed
  schedule and the 64 budget are untouched.
- **Option D, C plus B.** The clear keeps the stack short and a thread identifier names what remains
  during the session. The grouping half carries the same unmeasured rendering and the same visible
  surface as B, so it is a rider she can take after the experiment, never the reason to touch the
  content.
- **Rejected, replace in place.** Giving every at-time notification one identifier, or re-adding a
  delivered notification's identifier on the next open, is not a delivered-stack lever on iOS: the
  first collapses the arming (D120.5), and the second cannot be aimed at a past prayer's identity
  because a re-arm for a past date is dropped by the schedule itself.

The recommendation argued twice. For C: the accumulation is the row's whole complaint, the only
lever that shortens the stack is removal, and the app can remove exactly when it is open. The
moment is already instrumented, the call is bounded by the existing 15 s wrapper, the call cannot
run from the background task, and every frozen rule survives because the change touches the
delivered set alone. Challenge: does clearing on open destroy something the owner wants, namely
the record of what she missed? Partly, and the answer is that the app's own screen is the record
at that instant: the opened app shows the passed row, the next row and the countdown, and Android's
behaviour is stricter still, because it removes the previous notification the moment a new one
fires without asking her. C survivors. Flipped-argument check on the strongest rival, B: B is the
lever the release note names, costs one field per composer, and its visible change is small. It
fails on the row's own words: she asked what the center should do about a stack that grows, and
grouping leaves every entry inside the group; the app already has the group. C stands.

**Acceptance criteria:**

- [R1.1] WHEN the executor runs the delivered-API sweep across the app tree THE SYSTEM SHALL record the sweep command and its empty output in FINDINGS.md section 1.
- [R1.2] WHEN FINDINGS.md section 1 is read THE SYSTEM SHALL name each app-code notification entry point (both content composers, both identifiers, the arming call, the foreground handler, the Android posting delegate, the init path) with a `path:line` citation.
- [R1.3] WHEN the pinned expo-notifications 58.1.4 sources are read THE SYSTEM SHALL record the iOS thread-identifier assignment, the Android group-key mapping, the three iOS delivered-set APIs and the two changelog entries that landed the support, each with `path:line`.
- [R1.4] WHEN the app's open moments are traced THE SYSTEM SHALL name the function that runs at cold launch, on the foreground return and in the background task, each with `path:line`, and record that the background task never runs the init path.
- [R2.1] WHEN the row 111 XS evidence is read THE SYSTEM SHALL record the three delivery events of the recorded configuration with their times and the reminder or athan each belongs to.
- [R2.2] WHEN the delivered volume of one day is derived THE SYSTEM SHALL record the count from the composers and the recorded configuration, and mark the iOS retention and grouping rendering unmeasured pending the named experiment.
- [R3.1] WHEN FINDINGS.md section 3 is read THE SYSTEM SHALL give every option its mechanism, the files a code step would touch, and its line in the frozen-rule table.
- [R3.2] WHEN the recommendation is read THE SYSTEM SHALL name the rival it beat and the measurement that would falsify it.
- [R4.1] WHEN the XS protocol is read THE SYSTEM SHALL name the vehicle, the notification set, each read with its command, and what a void read looks like.
- [R4.2] WHEN the XS is locked THE SYSTEM SHALL record the read as not observed with the unlock named as its prerequisite.
- [R5.1] WHEN the queue row is updated at DONE THE SYSTEM SHALL carry the options, the recommendation, the frozen-rule blast radius, the protocol's reading list and the waits.

## 6. Steps

Checklist (all three inline in this file; the ledger in `LOG.md`):

- [ ] Step 1 the current state and the pinned lever surface (R1.1 to R1.4)
- [ ] Step 2 the delivered volume and the recommendation (R2.1, R2.2, R3.1, R3.2)
- [ ] Step 3 the XS experiment, the not-observed record and the outcome text (R4.1, R4.2, R5.1)

### Step 1 - the current state and the pinned lever surface

Requirements: R1.1, R1.2, R1.3, R1.4
Weight: 1
Anchor check: all seven anchors count 1 (the pre-flight covers them), and the pre-flight's
pinned-source checks pass.
Goal: FINDINGS.md section 1 written as the entry-point table plus the pinned lever list, every
line cited.
Branch: `docs/120-1-state` off `lane/120`. Files: `ai/plans/120-notification-center/FINDINGS.md`
(section 1 refined in place from the READY-committed draft), `ai/plans/120-notification-center/LOG.md`,
`ai/plans/README.md` (status IN PROGRESS, step 1), plus the two tracked version files under the lock.
Red tests: none, a docs step; the check is the criteria above.
Change contract: run the four-API sweep with
`grep -rn "dismissAllNotificationsAsync\|dismissNotificationAsync\|getPresentedNotificationsAsync\|setBadgeCountAsync" app device hooks shared stores plugins --include='*.ts' --include='*.tsx' --include='*.js'`
and record its output verbatim; read the seven repository files and the eight pinned-source
locations of section 4; write section 1 as a table with one row per entry point: entry point,
file and line, what it composes or does, and whether it can reach the delivered set.
Green run: every row carries a `path:line` citation and the sweep output is empty.
Break script: none, a docs step with no code to break.
Version and commit: next patch after `uat`'s `package.json` under the version lock, message
`<VERSION> - docs(plans): ticket 120 step 1, the delivered-stack state and the pinned levers`.
Review: read the diff cold against the sources, one citation at a time.
Merge: `--no-ff` into `uat` under the `uat` lock.
Done when: R1.1 to R1.4 hold.

### Step 2 - the delivered volume and the recommendation

Requirements: R2.1, R2.2, R3.1, R3.2
Weight: 1
Anchor check: all seven anchors count 1.
Goal: FINDINGS.md sections 2 and 3 written, every claim cited or marked unmeasured, the
recommendation stated with its rival and its falsifier.
Branch: `docs/120-2-recommendation` off `lane/120`. Files: FINDINGS.md sections 2 and 3, LOG.md,
`ai/plans/README.md` (step 2), plus the two tracked version files under the lock.
Change contract: read the row 111 ledger and its XS evidence index
(`ai/plans/111-sdk58-stable-repin/LOG.md`, the `Step 4` entries) for the delivery events and the
recorded configuration, and the session evidence under `$HOME/athan-gitree/sessions/111/` for
anything the center itself showed; derive the day's volume from the two composers and the
recorded alert types; write the lever table, the frozen-rule table, the five options of section 5
with the recommendation argued twice, and the falsifier. One commit carries both subjects because
both are reading-only notes about the same stack, taken and written in one sitting.
Green run: every FINDINGS claim in sections 2 and 3 carries a citation or an unmeasured tag, and
the derived volume's inputs are quoted.
Break script: none.
Version and commit: as step 1, message
`<VERSION> - docs(plans): ticket 120 step 2, the delivered volume and the recommendation`.
Review: read the diff cold against the 111 ledger and the pinned sources.
Done when: R2.1, R2.2, R3.1 and R3.2 hold.

### Step 3 - the XS experiment, the not-observed record and the outcome text

Requirements: R4.1, R4.2, R5.1
Weight: 1
Anchor check: all seven anchors count 1.
Goal: FINDINGS.md sections 4 and 5 written with section 7's protocol, the not-observed record
with its prerequisite, and the queue row set EXECUTED with its outcome text.
Branch: `docs/120-3-experiment` off `lane/120`. Files: FINDINGS.md sections 4 and 5, LOG.md,
`ai/plans/README.md` (EXECUTED, the outcome text), plus the two tracked version files under the lock.
Change contract: write the protocol as section 7 gives it (the vehicle, the notification set, the
three reads, the void-read shapes, the evidence path, the waits); record the phone's state as
attached and locked with the refusal signature row 111 recorded, and mark every rendering claim
unmeasured; write the queue outcome text of section 8 with the measured values in place.
Green run: the row text carries the options, the recommendation, the protocol's reading list and
the two waits, and no rendering claim stands unmarked.
Break script: none.
Version and commit: as step 1, message
`<VERSION> - docs(plans): ticket 120 executed: the delivered-stack options, the recommendation, the XS experiment`.
Review: read the diff cold against the sources and against section 7's protocol.
Finishing: set EXECUTED, the executed docs commit, merge `--no-ff`, no push.

## 7. Device proof

None this wave. The row's constraint is no device contact and no builds. The state measured at
planning, and the experiment that waits on her hand, recorded here so her ruling has a cost
beside it.

Measured phone state. The XS is attached and locked. Row 111's resume record measured the exact
refusal signature this session saw again: `agent-device prepare ios-runner` answers "iOS device
is not ready for automation: Command timeout", its runner's build destination fails, and
`xcrun devicectl device process launch` fails "Failed to allocate RSD device". The tooling names
the cause: the device must be unlocked, and no agent step unlocks it.

The named experiment, waiting on her unlock:

- Vehicle: the Release build already installed on the XS (production-signed, real API, her own
  configuration). No build is needed for the baseline read, because what the center holds is a
  property of the delivered notifications the app already posts: the mock build differs only in
  the times. A second read after her ruling's build repeats the same three reads.
- The notification set: her recorded configuration already delivers a multi-athan day. Five
  at-time rows deliver (Sunrise, Dhuhr, Asr, Magrib and Isha silent or sound; Fajr off), and
  Magrib carries two reminders, which is what row 111 measured: three delivered notifications for
  that one evening, 17:38, 18:03 and 18:08. Before the read, the app's own schedule names which
  rows fire that day.
- Read 1, the center's structure: on the phone, open the Notification Center from the lock screen
  (the route is measured then written back into `e2e/device-atlas-iphone-xs.md`, which carries no
  such route today) and transcribe: the number of this app's entries, each entry's title,
  whether they sit in one group or several, and the group header's text. Then read
  Settings > Notifications > Athan and record the grouping setting it offers (Automatic, by app,
  off). A screenshot reaches a screen; the image-capable worker's transcription is the record.
- Read 2, the machine corroboration: capture the unified log over the window and count the
  delivery lines (`Created process assertion for will present notification` for this bundle id,
  beside `UserNotificationsCore`'s requested and trigger dates), then compare that count with the
  center's entry count.
- Read 3, the delivered set itself: the definitive reading is `getPresentedNotificationsAsync()`
  from inside the app, which returns the delivered notifications with their identifiers, dates
  and thread identifiers. If her ruling's build does not carry a diagnostic call for it, reads 1
  and 2 stand and the entry count is the transcription's; the reading is named as the future
  ticket's option, never faked now.
- What absent looks like, each with its action: (a) the center holds zero entries for this app
  while the log carries delivery lines: the user's grouping is off or the system cleared them;
  record both readings and stop, because there is nothing to shorten. (b) The entries are present
  and carry no group header: this iOS version renders them ungrouped, the app-group premise of
  D120.4 is refuted at 18.7, and the recommendation's rationale is re-derived from that reading
  before any lever is taken. (c) The entry count is below the log's delivery count: something
  removed entries between the deliveries and the read; name it before choosing a lever. (d) The
  phone refuses automation again: record the refusal verbatim and take nothing.
- Evidence per read: the transcription, the log window and its line count, the delivered-set dump
  when a build carries it, and the schedule's armed list for the day. Saved under
  `$HOME/athan-gitree/sessions/120/`, never committed.
- Waits on: her unlock (the physical read) and her ruling (which lever the code wave builds).

## 8. Records

- `LOG.md`: every step entry opens `### Step <NN> — <state>` and ends `session: <id>`; planning
  sections use `## Planning (2026-10-16)` and `## Ticket 120`.
- The queue cell the lead applies on DONE (draft, refined by what execution measured):
  `DONE 2026-10-16, audited: the delivered-stack investigation answers and folds here, its folder
  closed, no code and no device contact. ANSWER: group, clear or both, with one recommendation -
  CLEAR, iOS-gated. MEASURED: iOS carries no delivered-notification handling at all (the four-API
  sweep over app code is empty: no dismissal, no presented-set read, no badge); the foreground
  handler puts what fires while the app is open into the banner and the list (hooks/useNotification.ts:12-20);
  the pinned expo-notifications 58.1.4 does apply threadIdentifier on iOS (NotificationRecords.swift:297/322/368-369
  into the content the scheduler builds at SchedulerModule.swift:135; landed 58.0.0, expo/expo#49429)
  and maps it to Android's notification group key (ArgumentsNotificationContentBuilder.java:51;
  landed 58.1.1), while the JS input exposes no summaryArgument (Notifications.types.d.ts:538-631),
  so one thread equals the app-level group iOS already gives every app (WWDC18-710) and grouping
  shortens nothing; the delivered-set APIs touch delivered notifications only
  (dismissAllNotificationsAsync to removeAllDeliveredNotifications, PresentationModule.swift:12-42).
  REJECTED: thread grouping as the answer (no shortening; the header is not settable); replacement
  by one shared identifier (it would collapse the date-scoped candidate-row arming against the 64
  budget); every Android-side lever (a group key changes the frozen one-visible face, and Android's
  dismissal call routes to cancelAll, ExpoPresentationDelegate.kt:275-277). BLAST RADIUS of the
  recommendation: no identifier change, no channel change, no pending-request change, the 64-budget
  arming, the reminder-never-outruns rule and the Android delegate all untouched; one iOS-gated call
  in initializeNotifications (shared/notifications.ts:572-603), which runs at cold launch and on
  every foreground return and never from the background task (device/tasks.ts:21-49). Reminders need
  no thread of their own: they clear with everything else, and they join the athan thread if she
  takes grouping. THE NAMED EXPERIMENT waits on her unlock: her recorded configuration already
  delivers a multi-athan day (five at-time rows plus Magrib's two reminders; row 111 measured the
  three deliveries of that one evening at 17:38, 18:03 and 18:08), and the protocol reads the
  center's structure, its group header and the Settings grouping mode, corroborates the count
  against the unified log's delivery lines, names the delivered-set dump as the future ticket's
  option, and treats a zero-entry center, an ungrouped center, a count below the log's, or a locked
  phone as the four void shapes. The row ends with her ruling; the ruling opens the code ticket.`
- Docs commit messages: per step, `<VERSION> - docs(plans): ticket 120 ...` as section 6 gives them.

## 9. Push

None. The lane never pushes; the orchestrator pushes `uat` when every unpushed commit is audited.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| `expo-notifications` resolves to a version other than 58.1.4 | STOP per 2.2; the lead re-verifies every pinned-source citation against the new pin before a step continues |
| The app-tree sweep prints a line | STOP per 2.2; row 120's verified state is zero call sites |
| `SHARED_NOTIFICATION_TAG` differs from `athan-notification` | STOP per 2.2; the Android comparison's premise moved |
| The XS answers automation (unlocked mid-run) | Do not improvise a reading: the experiment is written, not run. Record the state and continue the docs steps |
| A command prints something FINDINGS.md does not predict | STOP and report the exact divergence; never widen the reading list |
| The pre-commit hook's `Tests:` line missing or coverage below 100 | Never commit; investigate the hook log first |
| Merge conflict on `ai/plans/README.md` or the two tracked version files | Lane weather: abort, rebase onto `uat`, keep both lanes' rows and the higher version, retry once, then STOP if it still conflicts |

Anticipated review fixes, word for word: none expected beyond records wording; any finding lands
in `AUDIT.md` with its verdict.

Restore lists: every step's diff touches only `ai/plans/120-notification-center/`, the queue row
and the two tracked version files on its own branch; `git checkout lane/120 -- .` inside the
worktree restores the prior state, and an unmerged branch deletes with `git branch -D`.

## 11. Subagents

Planning: fact questions were measured directly by the lane (the sources are the primary
evidence); `athan-plan-griller` grills this draft cold. Delivery: the lane executes all three docs
steps itself (D120.9), recorded in LOG.md; the audit dispatches one `athan-reviewer` blind (the
diff plus `ai/AGENTS.md`, every number re-measured) and one `athan-reviewer` plan-conformance
(this folder plus the diff). `vision` is not needed this wave; no image arises without the device
read.

## 12. Report to the owner

Plain sentences: iOS never handled its delivered notifications, so every athan and reminder stays
in the center until she clears it, while Android shows exactly one at a time. The release note she
read is real and the pinned SDK applies it: a thread identifier reaches the system on iOS and works
as a group key on Android. Grouping is not the answer to her complaint, because the center already
groups the app's notifications under the app, one thread changes nothing visible, and the pinned
JS API cannot name a thread's header. The answer is removal: one iOS-gated call when the app opens,
which runs at cold launch and on every return to the foreground and never from the background
task, touches the delivered set alone, and leaves the armed schedule, the 64-request budget, the
reminder rule, the Android channels and the Android one-visible face exactly as they are. Reminders
clear with everything else and would join the athan thread if she ever takes grouping. What code
cannot settle is what the phone draws, so the plan carries the experiment that settles it, waiting
on her unlock. Then the progress table, then the handoff block the lane's final return carries.
