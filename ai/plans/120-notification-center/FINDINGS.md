# FINDINGS: ticket 120, the iOS delivered-notification stack

Every claim carries its source as `path:line`. Claims the device alone can settle carry the tag
`UNMEASURED`, with the experiment that settles them named. The plan is `PLAN.md`; the protocol is
its section 7 and this file's section 4.

## 1. The current state

### 1.1 The app tree carries no delivered-notification handling

The sweep, run from the worktree root at the plan's base:

```bash
grep -rn "dismissAllNotificationsAsync\|dismissNotificationAsync\|getPresentedNotificationsAsync\|setBadgeCountAsync" \
  app device hooks shared stores plugins --include='*.ts' --include='*.tsx' --include='*.js'
```

Output: empty (exit 1). No app-code file dismisses a delivered notification, reads the delivered
set, or sets a badge. The Jest stand-in declares none of them either
(`shared/__mocks__/expo-notifications.ts`, anchor `a7-mockContentInput.txt`).

### 1.2 The entry points, one row each

| Entry point | Where | What it does | Can it reach the delivered set |
| --- | --- | --- | --- |
| At-time content | `shared/notifications.ts:125-140` (anchor `a1-genNotificationContent.txt`) | Title only, `autoDismiss: false`, `interruptionLevel: 'timeSensitive'`, `AndroidNotificationPriority.MAX`; no thread identifier, no badge | No |
| Reminder content | `shared/notifications.ts:175-190` (anchor `a2-genReminderNotificationContent.txt`) | Title only, `autoDismiss: true`, `HIGH`; no thread identifier, no badge | No |
| At-time identity | `device/notifications.ts:46-52` (anchor `a3-prayerIdentifier.txt`) | `athan_<schedule>_<prayer>_<date>`; the comment states the platform contract: the same identifier replaces in place on both platforms | No |
| Reminder identity | `device/notifications.ts:63-68` | `reminder_<schedule>_<prayer>_<date>_<interval>`; the interval is part of the identity, the slot is not | No |
| Arming | `device/notifications.ts:220-269`, the call at `:242-254` (anchor `a4-armingCall.txt`) | One `scheduleNotificationAsync` with a date trigger, the channel id and the alarm-clock delivery, bounded by `withNativeTimeout` | No |
| Foreground handler | `hooks/useNotification.ts:12-20` (anchor `a5-foregroundHandler.txt`) | A notification firing while the app is open plays sound and is shown in the banner and the list, so it lands in the delivered set too | No |
| Android posting | `plugins/replacePreviousNotification.js:29-45` (anchor `a6-androidDelegate.txt`) | Rewrites every request identifier to the one shared tag `athan-notification` before posting, so the newest replaces the one before it | No |
| Init path | `shared/notifications.ts:572-603`, permission branch at `:589-599` (anchor `a10-initPermissionBranch.txt`) | Channel prep, permission check, refresh, background-task registration | No: it composes nothing and dismisses nothing |
| Native call bound | `shared/notifications.ts:65-81` | Every call into the notification system is bounded at 15 s and a timeout reopens the refresh gate | Not applicable |

### 1.3 When the app is open, and when it is not

| Moment | Function | Citation |
| --- | --- | --- |
| Cold launch, once per process, behind the 1.5 s post-paint delay | `initializeNotifications` | `app/index.tsx:115-138` |
| When data lands on a cold start | `refreshNotifications` | `app/index.tsx:168-172` |
| Every return from background to active | `initializeNotifications`, then `sync()` and a conditional `refreshNotifications` | `device/listeners.ts:46-69` |
| The background task (can run with the app not open) | `rescheduleAllNotificationsFromBackground` | `device/tasks.ts:21-49` |

The background task never runs the init path, so "the app is open" is exactly the two
`initializeNotifications` call sites. A dismissal placed there can never fire while the phone
sits in a pocket.

### 1.4 The pinned lever surface (expo-notifications 58.1.4)

| Lever | Mechanism at this version | Citation |
| --- | --- | --- |
| iOS thread identifier | The content record declares `threadIdentifier`, reads it back and assigns it onto the outgoing `UNMutableNotificationContent`; the scheduler builds the request's content from that record | `node_modules/expo-notifications/ios/ExpoNotifications/Notifications/NotificationRecords.swift:297,322,368-369`; `.../Scheduling/SchedulerModule.swift:135` |
| iOS support arrived | 58.0.0, PR expo/expo#49429, 2026-09-10 | `node_modules/expo-notifications/CHANGELOG.md:118` |
| Android thread identifier | The same input field becomes the notification's group key | `node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/ArgumentsNotificationContentBuilder.java:51`; `.../notifications/model/NotificationData.kt:62` |
| Android support arrived | 58.1.1, PR expo/expo#43388 | `node_modules/expo-notifications/CHANGELOG.md:31` |
| JS input shape | `NotificationContentInput` carries `threadIdentifier`; `summaryArgument` exists on the read-side type `NotificationContentIos` only, so app code cannot name a thread's header | `node_modules/expo-notifications/build/Notifications.types.d.ts:538-631` (input), `:455-530` (read side) |
| iOS dismissal | `dismissAllNotificationsAsync` to `removeAllDeliveredNotifications()`; `dismissNotificationAsync` to `removeDeliveredNotifications(withIdentifiers:)`; `getPresentedNotificationsAsync` reads `deliveredNotifications()`. Nothing here touches pending requests | `node_modules/expo-notifications/ios/ExpoNotifications/Notifications/Presenting/PresentationModule.swift:12-42` |
| Android dismissal | Routes to `notificationManager.cancelAll()`, which clears the one visible notification the delegate posts | `.../service/NotificationsService.kt:175`; `.../service/delegates/ExpoPresentationDelegate.kt:275-277` |
| iOS rendering semantics | Without a thread identifier all of an app's notifications group under the app; with one they group per thread per app; the identifier is never shown; the user's settings can override the grouping | Apple's WWDC18-710 session notes ("What's New in User Notifications"), the grouping section |

## 2. The delivered volume, and what the center holds

### 2.1 What row 111 measured on the XS

The 111 ledger records one real evening of her configuration on the Release build: three
`Created process assertion for will present notification` events for this bundle at 17:38:00,
18:03:00 and 18:08:00, with the 18:08 one matched to the armed Magrib request (requested 17:07:49
for trigger 2026-10-16 18:08:00 +0100) and the 18:03 one matched to its five-minute reminder
(`ai/plans/111-sdk58-stable-repin/LOG.md`, the "Step 4, R4.2" entry). The 17:38 event belongs to
the 30-minute reminder of the same prayer. So one prayer's own evening delivered three
notifications.

The ledger's recorded configuration for that day: Fajr off, Sunrise, Dhuhr, Asr, Magrib and Isha
each silent or sound, with Magrib carrying two reminders. Silent rows still deliver a
notification: silence is `sound: false`, not absence.

### 2.2 The day's derived volume

Inputs: six at-time rows on the Standard schedule, each carrying an alert type (Off fires
nothing; Silent and Sound both deliver); each prayer can carry up to two reminders
(`ReminderInterval`, `shared/types.ts:209`; two reminder slots, `shared/types.ts:211-220`), and a
reminder is armed only when the row's bell asks for it. With her recorded configuration that is
five at-time deliveries plus the two recorded reminders for Magrib: seven delivered notifications
for the day, and the count rises with every prayer she sets to Sound with reminders.

Over a week without a clear, that is the accumulation the row describes: nothing in the app
removes, replaces or groups a delivered notification, and iOS keeps delivered notifications until
the user or the app removes them (`UNUserNotificationCenter.deliveredNotifications()`, the same
set `dismissAllNotificationsAsync` empties).

### 2.3 What is not measured

`UNMEASURED`: the rendering. How many rows the center shows, whether the app's entries sit in one
group, what the group header says, and what the Settings grouping mode offers on her iOS 18.7
phone. The row 111 evidence index holds app screens only; no capture of the center exists. The
experiment in section 4 settles it, and it is the first thing her unlock buys.

## 3. The options, the frozen-rule blast radius, the recommendation

### 3.1 The levers

| Lever | Mechanism | What the user sees | Files a code step would touch |
| --- | --- | --- | --- |
| Group under a thread (B) | `threadIdentifier` on both composers, iOS-gated | One thread: nothing new, the app-level group already exists; two threads: the app's notifications split into two groups under the app | `shared/notifications.ts`, `shared/__mocks__/expo-notifications.ts`, the content suites |
| Clear the delivered stack on open (C) | `dismissAllNotificationsAsync`, iOS-gated, inside `initializeNotifications` | The center holds nothing from this app at the moment the app is open; Android is untouched | `shared/notifications.ts`, `device/notifications.ts`, the mock, `notificationsInit` and `notifications` suites |
| Both (D) | C plus a thread identifier | As C during the session; grouping inside it | Both rows above |
| Replace in place | One shared identifier, or re-adding a delivered identifier | Not available: one identifier per at-time notification arms one day only, and a past date is never re-armed | Rejected, no step |

### 3.2 Each lever against each frozen rule

| Frozen rule | A (status quo) | B (group) | C (clear, recommended) | D (both) | Replace |
| --- | --- | --- | --- | --- | --- |
| Candidate rows armed whole in time order against the 64 budget | untouched | untouched: a content field, not an identity | untouched: the call touches the delivered set only | untouched | BROKEN: every armed day collapses into one pending request |
| A reminder never outruns its athan | untouched | untouched | untouched | untouched | untouched |
| Android channel sound, audio attributes, importance frozen at creation | untouched | untouched when iOS-gated; a group key on Android is a new visible face | untouched when iOS-gated; Android's call routes to `cancelAll()` | untouched when iOS-gated | untouched |
| Android one-visible delegate | untouched | untouched | untouched | untouched | untouched |
| The settled visual surface | untouched | a new group header or a split group: needs her say | nothing visible in the app itself; the center's list changes | as B | a change to what the center holds |
| Date-scoped identities and the idempotent re-arm contract | untouched | untouched | untouched | untouched | replaced by one identity, which the contract states must stay unique (`device/notifications.ts:46-52`) |

### 3.3 The recommendation

**Option C, clear the delivered stack when the app opens, iOS-gated.** Argued in `PLAN.md`
section 5: the accumulation is the complaint, removal is the only lever that shortens it, the
moment is the app being open, and the call touches the delivered set alone so every frozen rule
survives. The rival it beat is option B, the lever the release note names, which leaves every
entry in place and adds a visible surface whose structure is unmeasured.

The falsifier: a read showing the entries are not grouped under the app today (section 4, void
shape b), or a read showing she relies on the center as a log of what she missed. Either one
re-opens the choice, and the middle option is then "keep the newest delivered, dismiss the rest",
which mirrors Android's one-visible rule more closely at the cost of one read and a sort.

## 4. The experiment, waiting on her unlock

The phone is attached and locked. The refusal signature is the one row 111 recorded: the
automation prepare step times out, the runner's build destination fails, and the launch call
fails to allocate the device; the tooling names the locked device as the cause. Nothing is faked;
every rendering claim above stays tagged `UNMEASURED` until this runs.

The protocol is `PLAN.md` section 7 and is not repeated here: vehicle, notification set, the three
reads (structure, log corroboration, delivered-set dump), the four void shapes with their actions,
the evidence path, and the two waits.

## 5. Residual unknowns and the waits

| Unknown | Measured by | Blocked on |
| --- | --- | --- |
| The center's rendering today (entries, grouping, header) | Section 4, read 1 | Her unlock |
| The delivery count for the read window | Section 4, read 2 | Her unlock |
| The delivered set with identifiers and dates | Section 4, read 3, if her ruling's build carries the diagnostic call | Her ruling |
| Whether Android's group key changes its visible face | A 3T read of the same afternoon's notifications | Not needed while every lever stays iOS-gated; it opens only if she asks for Android grouping |
| Which lever she takes | Her ruling | Her reading of `PLAN.md` section 5 |

No code, no build, no device contact in this ticket. The row ends with her ruling; the ruling
opens the code ticket.
