# Session 6b: an alert sheet change is all or nothing, in both directions (finding 81)

**Status: queued 2026-09-15 by the owner, split out of session 6 (`alert-integrity.md`) while that session was being
planned.** Plan it in its own planning session (`ai/plans/PLANNER-BRIEF.md`). Its plan anchors on the code session 6's
step 3 changes (`stores/notifications.ts` and `device/notifications.ts` with `settleAll`), so its row's "Needs first" is
`1` and it is planned only after session 6 is DONE, so its anchors are verified against the merged code on `uat-2`
(`ai/plans/README.md`, "Order").

## The owner's rule and decisions, 2026-09-15

> If I, as a user, see that the alert is the bell icon with a slash, then I know I'm not going to get notifications.
> If I have the bell icon, then I'm going to get notifications. If I have the sound icon, then I'm going to get
> notifications. It's as simple as that. If I turn it off, I expect it to turn off.

- **An alert sheet change (every at-time, reminder and interval change) is all or nothing, in both directions.** When
  the phone does not accept every part of a change, the app undoes the whole change, bell and alarms together: a failed
  arm when turning on puts the bell back and cancels what did arm; a refused cancel when turning off puts the bell back
  and re-arms that setting. The owner's words: "If the alert fail to schedule, then I shouldn't have sound on. It
  should be sound off."
- **If the phone refuses the undo too,** the app tries again at the next launch, return to the app or background run.
  This was explained to the owner as a limit of the phone, the one case where the state waits for a later event, and
  the owner confirmed the all-or-nothing rule.
- **The athan sound change's matching gap is not part of this session;** it becomes its own session later.
- No error is shown to the user for any of this. Waiting for "the next refresh" to heal a wrong state is not acceptable.

## The finding

Finding 81 in `ai/features/uat-2/AUDIT-FINDINGS.md`: switching a prayer Off calls `updatePrayerNotifications`. Its
at-time clear rejects on a refused cancel with its records kept, while the reminder clear catches each failure, so
every reminder is cancelled and deleted; `commitAlertMenuChanges` then writes the original alert back. The 12-hour gate
stops a resume from re-arming. On Android the delegate disarms the alarm before removing its stored request, so the
refused alarm may be gone too while still listed. iOS cannot hit the cancel half. The turning-on half: a rejected
commit restores only the preferences, so alarms that did arm stay armed.

## The first design, and why it was not enough

Planning session 6 proposed the design below (`/Users/muji/athan-device-sweep/session6/planning/DESIGN-81-82.md`, copied
here in full so it survives). A Software Architect (Claude Opus 5) attacked it on 2026-09-15 and found one blocker, three
major and five minor problems, three of them measured with probes. The review follows the design. The next planning
session starts from both.

### The first design (for reference, superseded)

#### Design for review: findings 81 and 82 (rn.athan.uk, uat-2 at b5159305)

Read ai/features/uat-2/AUDIT-FINDINGS.md sections "81." and "82.", ai/prompts/alert-integrity.md, and the files named
below in full: stores/notifications.ts, device/notifications.ts, hooks/useNotification.ts,
components/sheets/screens/Alert.tsx, app/index.tsx, device/listeners.ts, device/tasks.ts, shared/notifications.ts,
stores/sync.ts, stores/database.ts, and node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/
notifications/scheduling/NotificationScheduler.kt plus service/delegates/ExpoSchedulingDelegate.kt.

#### The owner's rule (2026-09-15)

What fires always equals what the bell shows: Off nothing, Silent silent, Sound sound. No healing "on the next
refresh". Decided in planning: **an alert sheet change is all or nothing, both directions.** If the phone refuses any
part of a change (a cancel when turning off, an arm when turning on), the app undoes the whole change, bell and alarms
together. If the phone refuses the undo too, the app retries at the next launch, return to the app or background run.
The athan SOUND change (commitSoundSelection) has the same gap but is queued for a later session: out of scope here.

#### Every caller of the scheduling lock (withSchedulingLock, a promise queue)

| Caller | Path | Lock operation | Gate |
| --- | --- | --- | --- |
| Launch, 1.5 s after mount | app/index.tsx: reopenRefreshGateOnColdLaunch (Android), initializeNotifications, then checkInitialPermissions, refreshNotifications and registerBackgroundTask | refreshNotifications | 12 h gate |
| After launch sync lands | app/index.tsx effect on state hasData | refreshNotifications | 12 h gate |
| Return from background | device/listeners.ts: initializeNotifications then refreshNotifications; then sync().then(refreshNotifications if a download changed an armed day) | refreshNotifications | 12 h gate |
| Background task | device/tasks.ts calls rescheduleAllNotificationsFromBackground: sync() OUTSIDE the lock, then the lock | backgroundReschedule | none; stamps on success |
| Alert sheet close | components/sheets/screens/Alert.tsx handleDismiss then commitAlertMenuChanges: prefs written first, then updatePrayerNotifications | updatePrayerNotifications | none |
| Sound sheet close | commitSoundSelection then rescheduleAllNotifications | rescheduleAllNotifications | none |
| A download | stores/sync.ts saveDownloadedDays then reopenNotificationGate (atom RESET), outside the lock | none | reopens |
| Midnight | countdown only; no scheduling call | none | none |
| Stalled network | fetch never settles: the after-sync refresh, the resume refresh-after-sync and the background task's lock never run; the 1.5 s launch refresh and the resume refresh still run | unchanged | unchanged |

#### Step 3 (finding 82), already prototyped and tested in a scratch worktree

A private `settleAll` in stores/notifications.ts (Promise.allSettled, then throw the first rejection) replaces every
Promise.all whose pieces can reject: the days in _addMultipleScheduleNotificationsForPrayer and
_addMultipleScheduleRemindersForPrayer, updatePrayerNotifications, _addAllScheduleNotificationsForSchedule,
_addAllScheduleRemindersForSchedule, _rescheduleAllNotifications. device/notifications.ts
clearAllScheduledNotificationForPrayer waits for every cancel (allSettled) before throwing the first refusal.
Invariant: no lock operation settles while any piece of work it started is still running.

#### Step 4 (finding 81, both directions): the proposal to attack

1. **Device clears report refusals instead of throwing.** `clearAllScheduledNotificationForPrayer` and
   `clearAllScheduledRemindersForPrayer` (device) cancel every recorded identifier with Promise.allSettled, log each
   refusal, and resolve with the identifiers the phone refused (string[]). Today the at-time one rejects on the first
   refusal and the reminder one swallows refusals.
2. **Store clears keep the records of refused cancels.** `clearAllScheduledNotificationForPrayer` and
   `clearAllScheduledRemindersForPrayer` (store) read the prayer's records, call the device clear, clear the records,
   then add back each record whose identifier was refused; they resolve with the count refused. Today the at-time
   store clear keeps every record on a refusal (the device clear rejects before the records clear) and the reminder
   clear deletes every record even when a cancel was refused, leaving an armed reminder with no record (the sweep
   refuses to cancel anything when no records exist at all).
3. **`_cancelStaleNotificationIds` resolves with the count refused** (still logs and continues).
4. **The per-day schedulers report refusal.** `scheduleNotificationForDate` and `scheduleReminderNotificationForDate`
   return `{ identifier: string | null; refused: boolean }`; the catch path still records the deterministic
   identifier as today (issue #15: the OS may still hold the previous alarm for it).
5. **`_addMultipleScheduleNotificationsForPrayer` / `_addMultipleScheduleRemindersForPrayer` resolve with the count
   refused**: refused days plus refused stale cancels.
6. **`updatePrayerNotifications`** (the sheet commit's lock operation) sums the counts of its two halves after
   settleAll and throws `Error('NOTIFICATION: The phone refused N of the changes for <name>')` when N > 0.
7. **The global reschedule keeps today's semantics for prayers that are on**: refused arms and refused stale cancels
   of an on-prayer do not reject it (the old alarm survives under the same identifier, and the sweep retries stale
   ones). A refused cancel while clearing an OFF prayer (at-time, and now reminders too) rejects the reschedule after
   settleAll, as the at-time one does today, so the gate is not stamped.
8. **Every lock operation that rejects reopens the 12-hour gate** (resetStoredAtom(lastNotificationScheduleAtom)) in
   withSchedulingLock's catch, before rejecting. Today a failed background run or a failed commit can leave a recently
   stamped gate closed, so the next foreground skips for up to 12 hours.
9. **`commitAlertMenuChanges` undoes a failed commit in full**: on a rejection it writes the original prefs back (as
   today), then awaits `updatePrayerNotifications(..., original.atTimeAlert, original.reminderAlert)` to put the
   alarms back to the original setting; a rejection of that undo is logged; it returns false either way. The interval
   is read by the scheduler from the atom, which the prefs restore has already written.

Testable invariant: when commitAlertMenuChanges settles, the prayer's saved at-time alert, reminder alert and interval
equal what its armed identifiers express (no identifier for an Off prayer; reminders only while both are on, at the
saved interval), unless the phone refused the undo too, in which case the refresh gate is open.

#### Alternatives rejected so far

- Keep the user's choice and retry later: the owner rejected it (the bell shows Off while an alarm can still fire).
- Roll back the prefs only (today): finding 81.
- Retry refused calls in-operation with delays: the Android refusals found in source are an exception inside
  NotificationsService's work (system_server trouble) or a lost React context (ReactContextLost during reload), neither
  recovers within milliseconds, and timers would enter every scheduling test.
- Replace a refused alarm with a far-future trigger: needs the same failing service, and leaves a request behind.
- Run the sweep before rethrowing a failed reschedule: widens refresh behaviour beyond the findings.
- Make refresh-path schedule refusals reject: changes the issue #15 contract (the surviving alarm) and was not decided.

#### Questions for the reviewer

Attack the design. In particular:
- Any caller or interleaving in the table where the invariant still breaks (the undo is a second lock operation,
  queued behind whatever was queued meanwhile; the prefs are restored before it is queued).
- Whether keeping refused records can make the sweep or a later clear misbehave.
- Whether reopening the gate inside withSchedulingLock on every failure causes a loop or a visible cost.
- Whether a data exception (getPrayerForDate throwing) in a commit should also undo (it rejects, so it does).
- Whether any existing test pins behaviour this contradicts in a way that signals a real regression rather than an
  intended change: stores/__tests__/notificationOffCancelFailure.test.ts, notificationRefreshGate.test.ts,
  notificationStaleCancelFailure.test.ts, device/__tests__/reminderCancelFailure.test.ts,
  stores/__tests__/notifications.test.ts ("keeps the existing OS notification alive when re-scheduling it fails").
- Anything simpler that meets the owner's rule.
Reply with numbered findings (severity, the scenario that breaks, the exact change you recommend), then a verdict:
"design holds" or "design needs changes".

### The design review of that design (Software Architect, Claude Opus 5, 2026-09-15)

Verdict: the design needs changes.

1. **Blocker: a successful refresh can close the gate while the prayer is still wrong.** Item 7 lets a refresh ignore
   refused arms for prayers that are on, on the theory that the old alarm survives under the same identifier; after a
   partial commit that is false, because the commit already cancelled that identifier. Scenario (Android, refusing
   cancels and arms; `getAllScheduledNotificationsAsync` still works because it reads SharedPreferences): Fajr on Sound,
   both days armed, gate stamped; commit Off cancels today, tomorrow refused, commit rejects, gate reset, Fajr back to
   Sound; the undo's arms are refused but recorded as armed, undo rejects, gate reset; the next resume's refresh arms are
   refused again, ignored, the sweep sees records for both days, the gate is stamped. Result: bell Sound, today's Fajr
   unarmed, no retry for 12 hours. Measured (probe P2, today's code): a refused arm for a day with no alarm lets
   `refreshNotifications` resolve, records the day, stamps the gate, and leaves nothing armed. Refused sweep and stale
   cancels are also ignored by the refresh (`notificationStaleCancelFailure.test.ts`, "keeps the window armed when the OS
   refuses the retry too", pins an old-interval reminder still armed after a clean resolve). **Recommended:** a persisted
   repair marker per prayer (stored outside the atoms, with a generation number), bumped by the commit before it writes
   the preferences and cleared, only if its generation is unchanged, by any lock operation that finishes that prayer's
   part with no refusal and no rejection; `shouldRescheduleNotifications()` answers true while any marker exists; the
   refresh and the background run never stamp the gate while a marker remains, and do not reject for it (so the sweep and
   the widget push still run); for a marked prayer refusals count as in a commit; issue #15's tolerance stays only for
   unmarked prayers; a refused sweep cancel leaves the gate open. This replaces the blanket gate reopen and the rejection
   for Off prayers, and covers findings 3 and 9. Note for the planner: a key starting `scheduled_` is wiped by
   `replacePrayerCache`'s keep list in `stores/sync.ts`, so choose a prefix both wipes keep, or add it to both lists.
2. **Major: resetting the gate inside `withSchedulingLock`'s catch can jam the queue for good.** If the reset (an MMKV
   write and a log line) throws before `reject`, the commit never settles, and `schedulingQueue` becomes a rejected
   promise, so every later `.then(onFulfilled)` skips its callback: nothing schedules again in that process.
   **Recommended:** wrap any reset in try/catch and always reject; harden the chain as
   `const run = schedulingQueue.then(task); schedulingQueue = run.catch(() => undefined);`.
3. **Major: a day whose row read throws loses its record while its alarm stays armed.** `_addMultipleSchedule*` clears
   the prayer's records before scheduling, and `getPrayerForDate` is called outside the per-day try, so a rejected day is
   neither re-recorded nor stale-cancelled. Measured (probe P1, session 6's step 3 tree): Fajr Silent, both days armed and
   recorded, tomorrow's row read throwing; commit Silent to Sound rejects (records: today only; OS: both days); commit Off
   resolves (records: none; OS: tomorrow); a refresh with every alert Off resolves, the sweep skips for no records, the
   gate is stamped, and tomorrow's Fajr is still armed. This is the owner's own setup (Fajr only). **Recommended:** keep
   `existingRecords`; for a rejected day re-add the existing record whose identifier matches that day's identifier;
   before rethrowing, re-add every existing record not re-recorded; in the store clears delete the records of confirmed
   cancels one by one instead of clearing the prefix; add a lock test with earlier records and a throwing day asserting
   records equal the OS (session 6's throwing-day tests start with no records).
4. **Major: an operation already queued behind a failing commit runs before the rollback.** Measured (probe P3, today's
   hook): Fajr Sound; commit Off with today's cancel refused and tomorrow's held; a refresh queued behind it; hold
   released. The refresh read Fajr as Off and cancelled both days again, then rejected; end state preferences Sound, only
   today armed, both days recorded. The commit's catch runs about four microtasks after the rejection, the next queued
   callback about two. **Recommended:** undo inside the same lock acquisition: a store-level operation that, on any
   refusal or rejection, writes the original preferences (if the generation is unchanged) and applies them before
   releasing the lock; the hook keeps only the optimistic write and the boolean.
5. **Minor: the rollback can undo a newer commit of the same prayer that already reported success** (commit 1 Off is
   queued; the user reopens the sheet, picks Silent, commit 2 is queued; commit 1 fails and its undo, queued after commit
   2, arms Sound). **Recommended:** compare the generation; if it moved, skip both the preference restore and the undo.
6. **Minor: refusals that cannot fire are counted and kept.** Refused stale cancels of days already passed would undo a
   change, and a past record kept on an Off prayer would make every refresh reject for ever. **Recommended:** count and
   keep only records dated yesterday or later (a post-midnight Isha is filed under yesterday); drop older records after a
   refused cancel; for a refused future stale identifier, keep its record so a later clear retries it.
7. **Minor: reopening the gate on every failure has a visible cost:** every return to the app runs a full reschedule while
   a refusal persists, and a failed background widget push would reopen it too. **Recommended:** reopen only through the
   marker.
8. **Minor: `settleAll` turns one never-answering native call into a permanent lock hold** (Android's ResultReceiver
   replies only from `NotificationsService.handleIntent`'s catch of `Exception`; an `Error` on the worker thread, or
   `doWork` finding no receiver, never replies). Before session 6's step 3, a rejection of another piece released the
   lock. **Recommended:** document it, or add a watchdog in `withSchedulingLock` (for example 60 seconds) that logs, marks
   the prayers the operation touched, and releases the queue.
9. **Minor (iOS): process death mid-commit or mid-undo** leaves the bell and alarms disagreeing for up to 12 hours,
   since iOS has no cold-launch gate reopen. Covered by the marker, written before the preferences.

Answers the review gave:
- **Callers:** the table covers every caller of the lock. It misses three harmless gate and preference writers:
  `forceNotificationReschedule` in `stores/version.ts`, `reopenNotificationGate` via `fetchLastDayOfPreviousYear`, and the
  migration's preference writes. Refresh rejections are swallowed by `initializeNotifications`, the post-sync effect in
  `app/index.tsx` and `device/listeners.ts`.
- **Kept records** are treated by the sweep as intended and never cancelled; the upgrade wipe drops them with everything
  else.
- **Existing tests:** `notificationOffCancelFailure.test.ts`, `notificationRefreshGate.test.ts` and
  `reminderCancelFailure.test.ts` change by intent; `notificationStaleCancelFailure.test.ts`'s second case is a real
  regression signal (finding 1); `useNotification.test.ts`'s "rolls back preferences" passes while asserting nothing about
  an undo and needs undo cases (arguments, order, rejection, generation skip).
- **Android native:** a refused cancel is either nothing done (`ReactContextLost` before the broadcast) or the alarm
  disarmed but still listed (an exception after `alarmManager.cancel`); a still-listed request is re-armed by
  BOOT_COMPLETED or MY_PACKAGE_REPLACED before any retry. A refused schedule can have saved the new request without
  resetting the alarm. A past trigger resolves as success and sends a separate remove broadcast.
- **iOS:** a cancel cannot reject, so turning a prayer Off never undoes; turning one on undoes only on rare `add` errors;
  the 64-pending cap drops silently.

The review's probes are local to the planning session:
`/private/tmp/claude-502/-Users-muji-repos-rn-athan-uk/11ff5fb0-6f41-49b2-bfa6-4aa02b5d50c4/scratchpad/probe81/`. Re-create
them if that folder is gone.

## How to run it

- Plan it after session 6's plan is executed and audited, so its anchors are the merged `settleAll` code.
- Write the sturdier design first, from the review's recommendations, and put it through a second independent design
  review before any step is written. Trace every caller in the review's table.
- Decide, with the owner where it is theirs to decide, the watchdog question (finding 8) and the key prefix for the
  repair marker.
- One branch per finding, 100% coverage of the change, red before green, a break for every decision, an independent
  Code Reviewer, and proof on the OnePlus 3T with a local production build of the paths that can be shown on a phone.
