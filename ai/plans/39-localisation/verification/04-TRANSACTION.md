# Verification: the language commit transaction

| Field | Value |
| --- | --- |
| Base | `uat` `52109ec0` (1.29.303) |
| Date | 2026-10-09 |
| Claim under test | A language change is an all-or-nothing commit (`commitLanguageSelection`, modelled on `commitSoundSelection`) under `withSchedulingLock` with a persisted intent marker. It replaces armed requests in place on deterministic identifiers with no cancel pass and no zero-alarm window, and the launch, foreground and background cycles repair a killed commit. |
| Result | 12 confirmed, 6 contradicted (4 MAJOR, 2 MINOR), 2 uncertain |

## Method

Read in full from the worktree: `ai/AGENTS.md`, `SINGLE-LANGUAGE-PIVOT.md`, `OWNER-DECISIONS.md`,
`PLAN.md`, `research/R11-LANGUAGE-COMMIT.md`, `NOTIFICATION-EVIDENCE.md`, `R4-FINDINGS.md`,
`R5-FINDINGS.md`, `research/R5-PRODUCTION-ENGINEERING.md`, `research/R8-FIRST-RUN-LOCALE.md`.

Code read in full: `stores/notifications.ts`, `device/notifications.ts`, `shared/notifications.ts`,
`device/tasks.ts`, `device/listeners.ts`, `app/index.tsx`, `hooks/useNotification.ts`,
`stores/widget.ts`, `stores/version.ts`, `plugins/replacePreviousNotification.js`,
`patches/expo-background-task+58.0.10.patch`, `stores/__tests__/notificationSoundCommit.test.ts`,
`stores/__tests__/notificationSchedulingLock.test.ts`,
`stores/__tests__/notificationAlertCommit.test.ts`.

Library source read in full under `node_modules`: `expo-notifications` `ExpoSchedulingDelegate.kt`,
`SharedPreferencesNotificationsStore.kt`, `NotificationsService.kt`, `NotificationScheduler.kt`,
`NotificationChannelManagerModule.kt`, `AndroidXNotificationsChannelManager.java`,
`SchedulerModule.swift`, `TriggerRecords.swift`. `expo-task-manager` `TaskService.java`.
`expo-modules-core` `RNHeadlessAppLoader.kt`.

External primary sources, fetched raw into scratch: Apple's documentation JSON for
`UNNotificationRequest.identifier`, `UNUserNotificationCenter.add(_:withCompletionHandler:)` and
`NSString.localizedUserNotificationString(forKey:arguments:)`. AOSP `NotificationManager.java` and
`AlarmManager.java` (javadoc blocks only, see "Not verified").

No test was run. No build, device or simulator was used. Every cited line was read at `52109ec0`.

Drift note: every `file:line` in R11 still lands on the cited code at `52109ec0`. The older R5
report cites the identifier builders at `device/notifications.ts:55, 68` and the channel caches at
`shared/notifications.ts:429-446`. They now sit at `:49-50`, `:61-66` and `:431-437`. The facts hold.

## Findings

### TXN-1. CONFIRMED: `withSchedulingLock` is an in-memory FIFO promise chain with no timeout and no re-entrancy
- **Record says:** the queue never drops or interleaves operations (R11 section A, citing `stores/notifications.ts:44-50, 55-79`).
- **Evidence:** `stores/notifications.ts:45` `let schedulingQueue: Promise<void> = Promise.resolve();`. `:58` chains each operation with `schedulingQueue.then`. `:73-76` re-seats the queue on a promise that always fulfils, so a rejected holder never poisons later callers. Six acquisitions exist: `:1341`, `:1687`, `:1716`, `:1807`, `:1814`, `:1873`.
- **Attack tried:** a throwing holder (survives, `:73-76`, proven by `notificationSchedulingLock.test.ts:370-388`). A holder that never settles: the lock has no timeout of its own. It relies on `withNativeTimeout` (`shared/notifications.ts:32, 63-79`, 15 s) around each native call. Re-entrancy: a nested acquisition would wait on its own holder. Every in-lock path calls the internal `_rescheduleAllNotifications` (`:1720`, `:1808`, `:1820`, `:1878`), never the exported wrapper.
- **Consequence:** the language commit must bound every native await. `Device.updateAndroidChannel` is not bounded (`device/notifications.ts:35-38`), so the plan must not copy that shape for the channel renames. The bounded shape is `shared/notifications.ts:480-483`.

### TXN-2. CONFIRMED: request identifiers are deterministic and carry no language
- **Record says:** deterministic identifiers make a re-arm an in-place replace (pivot fact 10, R11 step 7).
- **Evidence:** `device/notifications.ts:49-50` builds `athan_${scheduleType}_${englishName.toLowerCase()}_${date}`. `:61-66` builds `reminder_${scheduleType}_${englishName.toLowerCase()}_${date}_${intervalMinutes}`. Inputs are kind, schedule, the English name, the list day and the interval.
- **Attack tried:** looked for any display string, sound index or slot entering the identifier. None does. The slot is left out on purpose (`:57-59`).
- **Consequence:** none, provided stage one keeps the identifier bytes (R15's freeze gate).

### TXN-3. CONFIRMED: no cancel-all exists, and every cancel runs after the scheduling it follows
- **Record says:** no cancel pass, no zero-alarm window (R11 step 7, R4 correction 2).
- **Evidence:** production code holds three cancel sites, all per identifier: `device/notifications.ts:141`, `:168`, `:277`. `cancelAllScheduledNotificationsAsync` appears only in the Jest mock. The arming path schedules first (`stores/notifications.ts:926-930`), then removes stale records (`:939-941`), then cancels only identifiers it did not attempt (`:943`). The sweep cancels only OS identifiers with no record (`:1528-1534`) and refuses to act on an empty record set (`:1521-1526`).
- **Attack tried:** a commit spanning a prayer boundary or midnight, a budget overflow and the sweep. The plan is a pure function of preferences, stored days and the clock (`shared/notifications.ts:294-328`, `:268-284`). Language is not an input, so a language re-arm attempts the same identifiers the phone already holds. Up to 22 per-prayer plans (at-time and reminder halves of 11 prayers) are computed in one synchronous block before the first await resolves, so one pass cannot plan against two clocks. Rows are taken in time order to the budget (`:269-275`), so only far-end rows can ever fall out. A refused schedule records the identifier as attempted (`stores/notifications.ts:874-880`), so neither the stale cancel nor the sweep removes its old alarm.
- **Consequence:** none. The claim survives.

### TXN-4. CONFIRMED: iOS replaces a pending request with the same identifier
- **Record says:** same-identifier scheduling replaces in place on iOS (`device/notifications.ts:44-48`, R4).
- **Evidence:** `node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Scheduling/SchedulerModule.swift:46` calls `UNUserNotificationCenter.current().add(request)` with the caller's identifier (`:133-137`). Apple, `https://developer.apple.com/documentation/usernotifications/unnotificationrequest/identifier`: "If you use the same identifier when scheduling a new notification, the system removes the previously scheduled notification with that identifier and replaces it with the new one."
- **Attack tried:** an at-time alarm re-armed in its final second. `TriggerRecords.swift:102-110` turns the date into `UNTimeIntervalNotificationTrigger(timeInterval: date.timeIntervalSinceNow, repeats: false)` inside `EXUtilities.catchException`. When that constructor raises, `buildNotificationRequest` throws before `add` runs (`SchedulerModule.swift:41-55`), the promise rejects, and the old request stays. A small positive interval replaces the request and fires. That the constructor raises on a non-positive interval is the reason the wrapper exists, and was not sourced from Apple here.
- **Consequence:** none. The atomicity of the replace rests on Apple's sentence and has no device proof in the record.

### TXN-5. CONFIRMED: Android overwrites the stored request and re-sets the same alarm, with no cancel in between
- **Record says:** the Android PendingIntent derives from the identifier, so re-scheduling replaces (`device/notifications.ts:44-48`).
- **Evidence:** `ExpoSchedulingDelegate.kt:67-72` saves the request, then sets the alarm. The store key is `notification_request-` plus the identifier (`SharedPreferencesNotificationsStore.kt:71-77, 117-118`). The alarm's PendingIntent is built from the URI `.../scheduled/<identifier>/trigger` with `FLAG_UPDATE_CURRENT` (`NotificationsService.kt:417-445`). AOSP `AlarmManager.java:418-419`, the javadoc of `set`: "If there is already an alarm scheduled for the same IntentSender, that previous alarm will first be canceled." The library arms through `setAlarmClock` (`ExpoSchedulingDelegate.kt:121-124`). At fire time the receiver reads the content back from the store (`ExpoSchedulingDelegate.kt:77-81`).
- **Attack tried:** process death between the store write and the alarm call. The old alarm stays armed on an equal PendingIntent at the same instant, and it posts whatever the store holds. No alarm is lost. Reboot and app update: `NotificationsService.kt:33-39, 674-676` route `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED` to `setupScheduledNotifications` (`ExpoSchedulingDelegate.kt:23-32`), which re-arms every stored request. The repo's receiver carries those actions (`plugins/replacePreviousNotification.js:9-16, 73-78`, generated `android/app/src/main/AndroidManifest.xml:107-117`). A force-stop cancels alarms and nothing re-arms until launch (`stores/notifications.ts:1763-1777`).
- **Consequence:** none. After a reboot mid-commit the alarms return in whatever copy the store holds, mixed if the commit died part way.

### TXN-6. CONFIRMED: this library freezes copy at schedule time on both platforms
- **Record says:** notification copy is frozen at schedule time (pivot fact 10, `NOTIFICATION-EVIDENCE.md`).
- **Evidence:** iOS assigns a plain string (`NotificationRecords.swift:340` `content.title = title`). Android builds the content from the JS map at schedule time (`NotificationScheduler.kt:68`) and serialises it into the store.
- **Attack tried:** looked for a scheduling input that carries a localisation key. `titleLocalizationKey` and `bodyLocalizationKey` exist only on received-notification types (`src/Notifications.types.ts:229, 250`).
- **Consequence:** none for the claim. On Android the copy lives in a store read at fire time, which matters for the alternatives below.

### TXN-7. CONFIRMED: an Android channel renames in place, and the repo's dedup caches would block it
- **Record says:** re-creating a channel on its id changes name and description only, and the three session caches must be invalidated (R4 correction 1, R5, R11 steps 5 and 6).
- **Evidence:** AOSP `NotificationManager.java` javadoc of `createNotificationChannel`: "This can also be used to restore a deleted channel and to update an existing channel's name, description, group, and/or importance." and "All other fields are ignored for channels that already exist." The library builds a fresh `NotificationChannel` and calls `createNotificationChannel` with no delete (`AndroidXNotificationsChannelManager.java:79-87`, `NotificationChannelManagerModule.kt:45-63`). The caches are process-scoped (`shared/notifications.ts:431`, `:434`, `:437`) and their guards return early (`:447`, `:478`, `:496`).
- **Attack tried:** looked for a path that bypasses the caches. `createDefaultAndroidChannel` (`:419-428`) has no guard and runs on every init, so the athan 1 channel would rename on each launch and foreground. Every other channel needs the invalidation.
- **Consequence:** none beyond TXN-14.

### TXN-8. CONTRADICTED (MAJOR): in the model being copied, a refused or timed-out request is not a failure, so the rollback almost never runs
- **Record says:** "On failure, re-run the whole sequence on the previous selection inside the same acquisition" and the marker clears "only on full success" (pivot, R11 steps 9 to 11).
- **Evidence:** `commitSoundSelection` rolls back only when `armEverything` throws (`stores/notifications.ts:1723-1737`). A refused schedule never throws: the catch at `:871-881` and `:1066-1075` answers `{ refused: true }`. `_rescheduleAllNotifications` turns refusals into per-prayer repair marks (`:1622-1630`) and returns `true`. It returns `false`, not a throw, on an empty cache (`:1605-1610`), and `armEverything` ignores the result (`:1720`). So a pass in which the phone refuses all 64 requests ends at `:1725-1726` with `return true`. The suite proves rollback for a refused channel only (`notificationSoundCommit.test.ts:128-158`). The alert commit is the path that does undo on a refused arm, and its suite proves it (`notificationAlertCommit.test.ts:323-338, 687-701`). The sound commit has no such case. iOS has no channel step (`device/notifications.ts:33`), so on iOS the realistic throw sources are the sweep's listing (`stores/notifications.ts:1507-1510`) and an unreadable stored day (`notificationSchedulingLock.test.ts:297-321`).
- **Attack tried:** traced every throw source inside `_rescheduleAllNotifications`. `settleAll` rethrows only what escapes the per-day catch.
- **Consequence:** the plan must define failure before the step files are written. Either the commit counts refusals and the empty-cache bail as failure, as `commitPrayerAlertChange` does (`:1359-1370`), which needs `_rescheduleAllNotifications` to return its refusal total and is ask-first scheduling logic. Or the plan states that refused requests finish forward through the existing repair marks, and D28's failure line appears only on a throw.

### TXN-9. CONTRADICTED (MAJOR): the language can change with no commit, no marker and, on iOS, no forced re-arm
- **Record says:** the commit runs when the user picks a language (R11 line 4). The stored preference is nullable, and null means "derive from the device locale on every launch", with a re-read on Android foreground return (`SINGLE-LANGUAGE-PIVOT.md:77-80, 235-239`, `research/R8-FIRST-RUN-LOCALE.md:44`).
- **Evidence:** a fresh install holds null, so a device or per-app OS language change moves the rendered language outside `commitLanguageSelection`. Nothing then forces a re-arm on iOS: the cold-launch gate reopen is Android only (`stores/notifications.ts:1787-1788`), and `refreshNotifications` skips inside the 2 hour gate (`:1794-1800`). On an Android foreground return the process survives, so the gate stays closed and the channel caches stay populated (`shared/notifications.ts:431-437`). No marker exists because no commit wrote one.
- **Attack tried:** looked for the derived-language path in R11, R13, R16, R18 and `CONSTRAINTS.md`. None invokes the commit. R5's own answer to this exact case is recorded and unused: put the arming locale in the scheduling stamp and treat a mismatch as a forced reschedule (`research/R5-PRODUCTION-ENGINEERING.md:417`).
- **Consequence:** the plan must run the same re-arm, channel rename and widget push whenever the language in force differs from the language last armed, at launch and on foreground. A persisted "armed language" stamp covers the picker, the device-locale path and every crash window with one check. See the first alternative.

### TXN-10. CONTRADICTED (MAJOR): OS-held state is not all-or-nothing, and D18's wording cannot be met as written
- **Record says:** D18 rules that no half-applied state may survive a crash or a force quit (`SINGLE-LANGUAGE-PIVOT.md:44-46`, `OWNER-DECISIONS.md` D18). R11 itself says a mid-batch death leaves mixed copy (`R11:82-85`, section B row 7).
- **Evidence:** the 64 requests are separate native calls issued in parallel (`stores/notifications.ts:926-930`, `:1622-1627`). Every repair path needs a running JS runtime: launch (`app/index.tsx:102-111`), foreground (`device/listeners.ts:45-50`), background task (`device/tasks.ts:23-35`). Between the kill and the next process start the phone fires whatever it holds.

| Side effect | Written by | Rollback restores it | After a kill part way |
| --- | --- | --- | --- |
| Marker key | synchronous MMKV | n/a | survives, drives repair |
| Language preference | synchronous MMKV | yes | whichever side of the write |
| Width key choice | synchronous MMKV | yes | self-heals on measure |
| Armed requests (up to 64) | one async native call each | only if the second pass lands | mixed copy, never fewer alarms |
| Android channel names | one async native call each, OS state | only if re-created again | mixed names in system settings |
| Widget timelines | deferred push after the lock (TXN-12) | only by a later push | old language until the next push |
| Notifications already delivered | OS | no | stay in the shade as posted |
| Per-prayer repair marks | set by refusals (`:1566-1568`) | no, they persist by design | drive a later partial re-arm |
| UI | atom re-render | yes, it re-renders twice | new process reads the stored value |

- **Attack tried:** looked for any mechanism that makes the batch atomic or hides unapplied requests. None exists on either platform through this library.
- **Consequence:** the plan must restate the guarantee the design delivers: never fewer alarms, and mixed-language copy bounded by the next process start. That is an owner-facing change to D18, so it needs his acceptance. How long the window lasts after a user force quit on iOS is the open observation: check on the iPhone whether the background task still runs after a swipe-away, by reading the `BACKGROUND_TASK: Task started` log line.

### TXN-11. CONTRADICTED (MAJOR): the record does not say which way a surviving marker completes, and one reading breaks D28
- **Record says:** the completion pass "runs the commit forward from the marker" (R11 section B row 1), "a surviving marker drives idempotent forward completion at next launch" (pivot Q13), and also "the stored language is what the user already saw" (R11 section B) and "completes or rolls back" (pivot, "The switch").
- **Evidence:** on a double failure the model writes the previous preference and keeps the marker (R11 step 10, mirroring `stores/notifications.ts:1731-1737`). The marker holds target and previous. If repair completes toward the marker's target, the next launch flips the app to the language the user was told had failed. If repair converges on the stored preference, the marker's payload is never read. A death between the marker write and the in-lock preference write includes the whole queue wait, so that window can be seconds long.
- **Attack tried:** read every sentence in R11 and the pivot that names a direction. They do not agree.
- **Consequence:** the plan must pin one rule: repair always converges on the stored preference, and the marker is a dirty flag. Then a kill before the preference write silently drops the choice, which is "nothing" and is acceptable under D18. The step file for the crash-window suite needs that rule first.

### TXN-12. CONTRADICTED (MINOR): the widget re-push does not happen inside the lock acquisition
- **Record says:** the widget re-push rides the reschedule inside the one acquisition (claim under test, R11 step 8).
- **Evidence:** with `deferWidgetRefresh: true` the push is queued through `requestAnimationFrame` and `setTimeout` (`stores/notifications.ts:1646-1658`) and nothing awaits it. It runs after the operation returns, so after the lock releases and after any marker clear. Its failures are swallowed (`:1651-1653`, `stores/widget.ts:226-228, 384-385`). It reads the settings when it fires (`stores/widget.ts:176`, `:353`), not when the commit ran.
- **Attack tried:** a kill in the frame after the commit returns leaves widgets on the old language with no marker. The next launch or foreground sync pushes again (`stores/widget.ts:19-22`), so it heals.
- **Consequence:** wording. The plan either states the widget push is eventually consistent, or the commit takes the awaited branch (`:1659-1663`) since a progress UI is already covering the screen. Even then a failed push cannot trigger a rollback.

### TXN-13. CONFIRMED: launch, foreground and background each have a real call site, and none reads a language marker today
- **Record says:** the marker waits for the launch, foreground and background repair cycles (R11 step 10).
- **Evidence:** launch: `app/index.tsx:102-111`, and again when data lands (`:141-145`). Foreground: `device/listeners.ts:45-69`. Background: `device/tasks.ts:23-35` runs `rescheduleAllNotificationsFromBackground` (`stores/notifications.ts:1860-1900`), registered at `:1943-1946` through `initializeNotifications` (`shared/notifications.ts:579-586`).
- **Attack tried:** looked for conditions that skip them. All three sit behind notification permission (`shared/notifications.ts:579-589`). Registration returns early when the system reports Restricted (`stores/notifications.ts:1918-1927`). On iOS the launch path is gated for 2 hours unless a prayer is marked (`:1794-1800`). The background run is always a full reschedule, so it would re-arm copy from the stored language, but it renames only channels it touches and clears no language marker.
- **Consequence:** none for the claim. The marker check, the gate bypass and the marker clear are new code in three places, which the plan must list.

### TXN-14. CONTRADICTED (MINOR): the set of channels to rename is not specified, and the re-arm alone leaves old names behind
- **Record says:** "Re-create the channels with the SAME ids and localised names" (R11 step 6).
- **Evidence:** channels are created only for alerts armed with Sound at schedule time (`device/notifications.ts:106-113, 228-231`) and for athan 1 and the extras channel at init (`shared/notifications.ts:571-574`). A previously selected athan's channel, or a reminder interval the user moved away from, is never touched again. Up to 16 athan, 1 extras and 66 reminder ids exist (`shared/constants.ts:95`, `shared/notifications.ts:380-396`).
- **Attack tried:** looked for an enumeration. `getNotificationChannelsAsync` exists in the library (`NotificationChannelManagerModule.kt:27-35`) and the repo never calls it.
- **Consequence:** the plan must say that the commit lists the existing channels and re-creates each known id with its localised name. Otherwise system settings keeps channel names in two languages for good.

### TXN-15. CONFIRMED: one JavaScript runtime per process runs the scheduler, so the in-memory lock serialises every JS writer
- **Record says:** the lock serialises the commit against every other scheduling pass (R11 section A).
- **Evidence:** Android headless start uses the application's single `ReactHost` (`RNHeadlessAppLoader.kt:35-49`) and an Activity that arrives takes that same host over (`:62-67`). A task runs in an existing task manager when one is alive (`TaskService.java:415-418`). The tree defines one task (`device/tasks.ts:23`) and one notification handler that only sets presentation (`hooks/useNotification.ts:11-18`). No received-notification task is registered.
- **Attack tried:** a second scheduler in a headless task, a notification handler, a widget task, the boot receiver. The only non-JS writer is the native receiver that re-arms from the store on boot and package replace (`ExpoSchedulingDelegate.kt:23-32`). It takes no lock, and it runs when no commit can be in flight. No cross-process protection exists, and none is needed on Android.
- **Consequence:** none. The iOS task-manager source was not read (see "Not verified").

### TXN-16. CONFIRMED: suspension cannot let a second writer in or deadlock a waiter
- **Record says:** no cancel is safe because abandonment is survivable (R11 section C).
- **Evidence:** the lock has no timeout (`stores/notifications.ts:55-79`), so nothing can enter early. A suspended process runs no JS at all. Waiters are chained promises and resume in order. A native call that never answers is released by the 15 s timer (`shared/notifications.ts:63-79`), which also reopens the gate (`stores/notifications.ts:66-67`).
- **Attack tried:** Android pauses JS timers while the Activity is paused unless a headless task is registered (`TaskService.java:407-412`). A commit backgrounded with an unanswered native call therefore holds the lock until the app returns or a background task starts. That delays, and does not deadlock.
- **Consequence:** none.

### TXN-17. CONFIRMED: the double-failure path leaves the state R11 describes, and the app is not "exactly as it was" in that case
- **Record says:** on double failure the previous preference stays and the marker waits (R11 step 10). D28 says the app is exactly as it was after a failed commit.
- **Evidence:** following `stores/notifications.ts:1723-1739`. Preference: previous. Marker: present. Armed requests: each holds whichever of the two passes last landed on it, so a mix. Channels: a mix of names. Widgets: neither pass reached the push at `:1646`, so they hold whatever was last pushed. Repair marks: set for refused prayers.
- **Attack tried:** checked whether D28 can hold. It holds only when the second pass lands in full. A phone that refused the first pass is the phone most likely to refuse the second, so the undo is the least reliable step in the sequence.
- **Consequence:** D28's sentence needs its condition written into the plan: exact restoration after a clean undo, repair to the previous language otherwise.

### TXN-18. CONFIRMED: the suites R11 leans on exist and cover what it says, with one limit
- **Record says:** R11 section D lists the existing coverage.
- **Evidence:** `notificationSoundCommit.test.ts:109-159` holds the five cases at the cited lines (`:119`, `:128`, `:139`, `:151`). `notificationSchedulingLock.test.ts:205-388` holds the queue-order cases, the 15 s timeout (`:355-368`) and the surviving queue (`:370-388`). `notificationAlertCommit.test.ts` holds the arm and undo cases from `:244`, the generation cases at `:464-501`, the kept-mark case at `:503-534` and the repair-on-return cases at `:536-643`. The gate, cancel-failure, version, channel and widget suites named by R11 all exist.
- **Attack tried:** looked for a test that proves copy is replaced. None can: the mock OS is a set of identifiers (`notificationSchedulingLock.test.ts:77`), so the replace premise is assumed, never observed. No suite schedules a refusal during `commitSoundSelection`.
- **Consequence:** the new language-commit suite must add a content-keyed mock, and the device proof must read the armed titles from a dump.

### TXN-19. UNCERTAIN: no measured duration exists for a full re-arm on the floor Android phone
- **Record says:** nothing. R11 cites one figure, the widget build at about 0.5 s per schedule on an A12 (`stores/notifications.ts:1640-1642`).
- **Evidence:** the code carries the marks that would produce the number: `sched_<operation>` (`stores/notifications.ts:56-65`) and `sound_commit` (`hooks/useNotification.ts:281-287`). One pass plans 22 times over 11 prayers and 66 candidate days (`shared/constants.ts:89`, `shared/notifications.ts:294-328`), about 16,000 row reads in one synchronous block, then issues up to 64 native calls. A failed commit runs the pass twice. Each Android call is a broadcast handled off the main thread (`NotificationsService.kt:663-672`), so an ANR is unlikely.
- **Attack tried:** searched the record, `e2e/` and the README for a recorded timing. None found.
- **Consequence:** run `commitSoundSelection` on the 3T with a gate-on build and 64 armed requests, and record `sound_commit` and `sched_commitSoundSelection`. The progress UI design and the "can it outlive a foreground session" question wait on that number.

### TXN-20. UNCERTAIN: whether iOS delivery-time keys can follow an in-app language
- **Record says:** delivery-time localisation is unreachable through the library and would need a second catalog (`NOTIFICATION-EVIDENCE.md`, R5 section 4.2).
- **Evidence:** confirmed unreachable (TXN-6). Apple, `https://developer.apple.com/documentation/foundation/nsstring/localizedusernotificationstring(forkey:arguments:)`: "When the notification is about to be displayed, the string object uses the key and arguments you specify to load the appropriate localized version of the string."
- **Attack tried:** looked for a documented statement on which language the system uses when the app overrides its own language. Found none.
- **Consequence:** settle with a spike on the iPhone only if the second alternative below is pursued: schedule a keyed request, change the app's language override, and read the delivered title.

## Better alternatives

**1. Forward-only commit with an "armed language" stamp. Recommended.** Persist the language the
last full pass armed, under a `preference_` key. Launch, foreground and the background task
compare it with the language in force. A mismatch forces a full pass: channel renames, the
in-place re-arm, the widget push, then the stamp. The picker writes the preference and runs the
same pass under the lock. There is no undo.
- Cost: one key in place of the marker, one comparison at three call sites, a gate bypass on iOS.
  Less code than the marker plus rollback, and it is R5's own recommendation
  (`research/R5-PRODUCTION-ENGINEERING.md:417`).
- It closes TXN-9 and TXN-11 outright and removes the undo that TXN-8 and TXN-17 show to be the
  weak step. Request budget: unchanged, same identifiers.
- Failure mode: the UI is in the new language while some requests keep old copy until the next
  pass. That is the same window the record's design has after any kill.
- It displaces D28's failure face, in which the sheet reopens on the previous language. That is an
  owner ruling, so it goes to him as a choice, with the note that an undo against a refusing phone
  often cannot land.
- Test burden: one crash-window suite over one flag, no rollback matrix.

**2. Delivery-time localisation on iOS. Not for 2.0.0.** It needs a patch or a local module that
sets localisation keys, generated `.strings` files for every locale, a declared localisation list,
and proof that the system follows an in-app override (TXN-20). It removes the iOS re-arm only.
It adds a second catalog format and a native build step for one platform.

**3. Android post-time copy through the repo's own presentation delegate. Worth a later spike.**
The repo already subclasses the presentation delegate (`plugins/replacePreviousNotification.js:35-45`),
and the content is read from the store at fire time (TXN-5). The delegate could build the title at
post time from a small copy table the app writes natively on a language change. The switch becomes
one atomic write and the Android re-arm disappears.
- Cost: Kotlin in the config plugin, a native-readable table, a prayer id and kind in the request
  data, new plugin tests, and a device proof. It touches the path that posts every alarm.
- It splits the platforms: iOS still re-arms.

**4. Two-phase commit under temporary identifiers. Rejected.** It doubles the pending count to
128 during the switch against a budget of 64 (`shared/constants.ts:75`), fires twice if the
process dies between the phases, and breaks the identifier contract the records and the sweep
rely on. The in-place replace already gives "never fewer alarms" without it.

**5. Apply on the next reschedule, with no stamp. Rejected.** On iOS the 2 hour gate would leave
old copy armed with nothing to force a pass.

The record's core choice is right: replace in place on deterministic identifiers under the
existing lock. No alternative beats that. The rollback layer and the picker-only marker are the
parts to change.

## Not verified

- No device or simulator was used. The iOS replace (TXN-4), the Android channel rename on the 3T
  (TXN-7), every timing (TXN-19) and the iOS background task after a force quit (TXN-10) need a
  device.
- Partial reads: the gate, cancel-failure, version, channel-update and widget suites (existence
  only). `NotificationRecords.swift` (the title assignment line only). `stores/sync.ts` (the gate
  and widget-push lines only). AOSP `NotificationManager.java` and `AlarmManager.java` (the
  quoted javadoc blocks only). The generated Android manifest (the receiver lines only).
- Not read: `stores/database.ts`, `stores/storage.ts`, `shared/prayer.ts`,
  `components/sheets/screens/Sound.tsx`, the `expo-task-manager` and
  `expo-background-task` iOS sources, the `expo-background-task` Android sources beyond the patch,
  `expo-notifications` JS (`scheduleNotificationAsync`), `CONSTRAINTS.md`,
  `research/R4-LOCALE-DETECTION-AND-UX.md`, R13 to R18.
- The single-runtime finding (TXN-15) is proven for Android only. The iOS half rests on the
  platform model, not on a read of the library.
- Not sourced from a primary document: that `UNTimeIntervalNotificationTrigger` raises on a
  non-positive interval (TXN-4), and that `setAlarmClock` shares the replace rule quoted from the
  `set` javadoc (TXN-5).
- What iOS does with pending requests beyond 64 was not sourced. Alternative 4 is rejected on the
  repo's own budget figure.
- The record's claim that both cache wipes keep `preference_` keys holds at
  `stores/version.ts:144-156` (file read in full) and at `stores/sync.ts:357-365` (those lines
  only).
- `modules/widgetrefresh` was searched, not read. Its Kotlin sources hold no reference to a
  headless start, a React host or the notifications library, so it is not counted as a second
  scheduler in TXN-15.
