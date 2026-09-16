# Plan: Session 6b. An alert sheet change is all or nothing, in both directions (finding 81)

Resume from: section 6, step 1. Sections 1 to 5 and the design review are written.

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/alert-all-or-nothing.md` |
| Planned at | `e046bf77` (version 1.27.183), 2026-09-16 |
| Planned by | Claude, planning session on 2026-09-16 |
| Needs first | 1 (session 6, DONE) |
| Steps | 4, each one branch, one commit, one version, then the device proof |
| Device | OnePlus 3T: a local production build, a throwaway mock build that forces a refusal, then the latest mock build |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

Today an alert sheet change is not all or nothing. Switching a prayer Off sends every cancel, and one refusal makes
the whole change fail: the at-time records are kept, every reminder is cancelled and its record deleted, and the hook
writes the original alert back. The bell then shows Sound while the alarms behind it are gone, and the 12-hour gate
stops the app from noticing for half a day. Turning a prayer on has the mirror gap: a refused arm restores only the
preference, so alarms that did arm stay armed under a bell that says Off.

When this plan is DONE, one sentence holds: **an alert sheet change either lands completely or is undone completely,
bell and alarms together.** If the phone refuses part of the change, the app puts the preferences back and puts the
alarms back to match, inside the same lock acquisition, before anything else can run. If the phone refuses the undo
too, the prayer carries a repair mark, and the next launch, return to the app or background run redoes that one
prayer until the phone accepts it.

The owner notices this only when the phone misbehaves: a prayer they switched Off shows its bell on again, with its
alarms matching the bell, instead of showing Off with alarms silently gone.

The owner's rules that apply, quoted:

- `ai/prompts/alert-all-or-nothing.md`, owner, 2026-09-15: "If I, as a user, see that the alert is the bell icon with
  a slash, then I know I'm not going to get notifications. If I have the bell icon, then I'm going to get
  notifications. If I have the sound icon, then I'm going to get notifications. It's as simple as that. If I turn it
  off, I expect it to turn off."
- The same brief, owner, 2026-09-15: "If the alert fail to schedule, then I shouldn't have sound on. It should be
  sound off."
- The same brief: "No error is shown to the user for any of this. Waiting for 'the next refresh' to heal a wrong state
  is not acceptable."
- `ai/prompts/README.md`, standing rule: "Never copy, average or synthesise a prayer time."
- `ai/prompts/README.md`, standing rule: "Keep every visual exactly as it is — fixes change behaviour, never pixels."

## 2. Decisions

### 2.1 Taken

1. **An alert sheet change is all or nothing, in both directions.** When the phone does not accept every part of a
   change, the app undoes the whole change, bell and alarms together. Owner, 2026-09-15,
   `ai/prompts/alert-all-or-nothing.md` and `ai/prompts/README.md`.
2. **If the phone refuses the undo too, the app tries again at the next launch, return to the app or background run.**
   Owner, 2026-09-15, same sources.
3. **No error is shown to the user for any of this.** Owner, 2026-09-15, same sources.
4. **A call into the notification system that never answers is given up on after 15 seconds and treated as refused.**
   Owner, 2026-09-16, this session: "maybe give up after 15s instead of 30s? same as option 1 but shorter".
   The scheduling queue waits for every piece of work it started (finding 82), so without this one silent native call
   would stop the app arming or cancelling anything for the rest of the process, with the bell already showing the
   user's choice.
5. **A prayer the phone refused is repaired on its own, not by a full reschedule.** The app marks that prayer and, on
   the next launch or return, redoes only that prayer; the normal 12-hour cycle is untouched. Owner, 2026-09-16, this
   session, after being shown the measured cost of the alternative on their own 3T: a full pass on returning from
   background took 118 ms and 123 ms (`~/athan-device-sweep/session5/mockcheck/reopen.logcat.txt`), against 47, 55, 52
   and 50 ms for a production build with one alert on (`AUDIT-FINDINGS.md`, "Measured on the device").
6. **The refusal is forced on the 3T with a throwaway build.** Owner, 2026-09-16, this session: "I don't want to see
   it, but I will let you do as much testing as you need to to ensure it is absolutely bulletproof. So yes, you can
   build whatever you want, you can throw away whatever you want. It needs to be bulletproof. I don't need to see it.
   I trust you to do it."
7. **The 3T is always left unlocked, with the app open and "Stay awake" on.** Owner, 2026-09-16, this session: "I have
   purposefully left the screen unlocked, and the app is open and stay awake is on... This should be the state
   always." No step in this plan changes that, and section 7 restates it.
8. **The repair mark is keyed `preference_notification_repair_<type>_<name>`.** Planner: `preference_` is the only
   prefix both wipes keep (`UPGRADE_KEEP_PREFIXES` in `stores/version.ts:144` and `replacePrayerCache`'s keep list in
   `stores/sync.ts:342`), so a mark cannot be lost by a cache wipe while the alarms it describes survive. A key under
   `scheduled_` would be kept by the download wipe and dropped by the upgrade wipe. The key does not match
   `INDEX_KEY_PATTERN` (`stores/notifications.ts:256`), so the preference migration leaves it alone.
9. **The mark carries a generation number, and the number is the mark.** Planner: 0 means clean, and any other value
   is both "marked" and "which change marked it". One number answers two questions the design needs: whether a prayer
   still needs repair, and whether the change that is finishing is still the newest one for that prayer. Without the
   second, a failed commit would undo a newer commit that had already reported success.
10. **A refused cancel counts only when the alarm it names can still fire.** A record dated before yesterday is
    dropped without counting, because that alarm's moment has passed; a record dated yesterday or later is kept and
    counted. Planner, from the first design review's minor finding 6: counting a past refusal would undo a change the
    user made for no reason, and keeping a past record on an Off prayer would make every later clear retry it for
    ever. Yesterday, not today, because an Extras night row is filed under the day it leads into.
11. **The post-reschedule sweep is not changed.** Planner: a stale OS entry the sweep cannot cancel has no record, so
    there is no prayer to mark, and the sweep already asks again on the next full reschedule. Changing it would widen
    this session past finding 81. Recorded as a limit in section 5.
12. **`updatePrayerNotifications` is renamed `commitPrayerAlertChange`.** Planner: after step 4 the function commits a
    change and undoes it, which its old name does not describe, and leaving the old name exported beside the new one
    would leave an export with no production caller.
13. **The athan sound change (`commitSoundSelection`) keeps today's behaviour.** Owner, 2026-09-15,
    `ai/prompts/README.md`: it "becomes its own session later", not this one.

### 2.2 The executor must not decide

STOP, append what you saw and the question to `LOG.md`, and ask the owner the question given, whenever one of these
happens:

1. **An anchor count other than 1**, in the pre-flight or in a step's part 0. This is NEEDS REPLAN
   (`EXECUTOR-BRIEF.md` section 1, item 4). Tell the owner: "Anchor `<id>` counts `<n>` in `<file>`, so the plan is out
   of date. Please run the planning prompt."
2. **A test fails that this plan does not name**, or a named test fails with a line this plan does not give. Ask: "In
   step `<k>`, `<test>` failed with `<first failure line>`, which the plan does not expect. Shall I stop here so the
   plan can be refreshed?"
3. **A named test passes in the red run**, before the change. Ask: "In step `<k>`, `<test>` passed before the change,
   so it does not guard the line it was written for. Shall I stop here so the plan can be refreshed?"
4. **A `Code Reviewer` (GLM 5.3) finding that section 10 does not answer word for word.** Ask: "The reviewer asks:
   `<finding in its words>`. The plan gives no fix for it. Do you want it applied (the plan is then refreshed first),
   or shall I merge without it?"
5. **A break script prints anything other than `ALL AS EXPECTED: 1`.** Ask: "Step `<k>`'s break script ended
   `<last line>`. A break the plan expects to be caught was not. Shall I stop here?"
6. **Anything that would touch visuals, a prayer time, `releases.json`, the `uat` branch or EAS.** Ask: "Step `<k>`
   would change `<what>`, which this plan forbids. What do I do?"
7. **A build script prints `FAILED`.** Ask: "`<script>` failed with `<line>`. What do I do?"
8. **The `vision` subagent (GLM 5.3 Flash) gives an answer the plan does not expect**, after the repeats the plan
   allows. Ask: "vision read `<file>` as `<answer>`; the plan expects `<expected>`. What do I do?"
9. **An alarm dump names an app alarm whose tag is neither `*walarm*:expo.modules.notifications.NOTIFICATION_EVENT`
   nor `*walarm*:ACTION_FORCE_STOP_RESCHEDULE`**, or lists an alarm section 7 does not predict. Ask: "The alarm dump
   holds `<line>`, which the plan does not list. What do I do?"
10. **`repair_proof.py` prints a line starting `REPAIR PROOF NOT AS EXPECTED`.** Ask: "`repair_proof.py` printed
    `<line>`. What do I do?"
11. **adb hangs twice, or prints "InputChannel is not initialized".** Ask: "The OnePlus 3T is not answering adb.
    Please reboot it and reply when it is back, unlocked with Athan open."
12. **The phone's screen is off or locked.** Do not change any setting on the phone. Ask: "The OnePlus 3T's screen is
    `<off/locked>`. It should be unlocked with Athan open. Please put it back and reply when that is done."

## 3. Pre-flight

To be written (section 6's anchors decide its contents).

## 4. Background the executor needs

### 4.1 Code map

| File | What it does | This plan |
| --- | --- | --- |
| `hooks/useNotification.ts` | The alert sheet's commit, the sound commit, the permission paths | Step 4 moves the preference write, the rollback and the failure log into the store |
| `stores/notifications.ts` | The atoms, the scheduling lock, every schedule and clear path, the 12-hour gate, the background task | Steps 1 to 4 |
| `device/notifications.ts` | Every call into expo-notifications for one prayer: arm, cancel, cancel-all | Steps 1 and 2 |
| `shared/notifications.ts` | Identifiers, content, Android channels, `initializeNotifications` | Step 1 adds the native-call timeout |
| `stores/database.ts` | The MMKV record store for armed identifiers | Step 2 adds single-record removal |
| `stores/storage.ts` | `atomWithStorageNumber` and `resetStoredAtom`, and THE RULE: never write MMKV behind one of these atoms | Step 3 uses `atomWithStorageNumber` for the repair mark |
| `stores/sync.ts` | Downloads, the armed-day counter, `replacePrayerCache`'s keep list | Read only: decision 8 |
| `stores/version.ts` | `UPGRADE_KEEP_PREFIXES`, the forced reschedule on upgrade | Read only: decision 8 |
| `components/sheets/screens/Alert.tsx` | The sheet; `handleDismiss` calls `commitAlertMenuChanges` | Not changed: no visual or behavioural change reaches it |
| `app/index.tsx`, `device/listeners.ts`, `device/tasks.ts` | The three callers of the refresh and the background reschedule | Not changed; step 3 changes what `refreshNotifications` does when the gate is shut |

### 4.2 How the pieces interact

Every caller of the scheduling lock, at `e046bf77`. The lock is a promise queue: operations run one at a time, in the
order they were enqueued, and since finding 82 each one waits for every piece of work it started before it settles.

| Caller | Path | Lock operation | 12-hour gate |
| --- | --- | --- | --- |
| Launch, 1500 ms after mount | `app/index.tsx:99-108`: `reopenRefreshGateOnColdLaunch` (Android only), then `initializeNotifications(checkInitialPermissions, refreshNotifications, registerBackgroundTask)` | `refreshNotifications` | Reopened first on Android, so it always runs |
| After the launch sync lands | `app/index.tsx:138-142`, effect on `state === 'hasData'` | `refreshNotifications` | Honoured |
| Return from background | `device/listeners.ts:50`, then `sync().then(...)` at `:61-68` refreshes again only when a download moved an armed day | `refreshNotifications` | Honoured |
| Background task | `device/tasks.ts:34-35` calls `rescheduleAllNotificationsFromBackground`, which syncs OUTSIDE the lock and then takes it | `backgroundReschedule` | Ignored; stamps on success |
| Alert sheet close | `components/sheets/screens/Alert.tsx:60-75` `handleDismiss`, then `commitAlertMenuChanges` | `updatePrayerNotifications` | Ignored |
| Sound sheet close | `hooks/useNotification.ts:300-318` `commitSoundSelection` | `rescheduleAllNotifications` | Ignored |
| A download | `stores/sync.ts:110-116` `saveDownloadedDays`, outside the lock | none | Reopened when an armed day changed |
| Upgrade | `stores/version.ts:194-201` `forceNotificationReschedule` | none | Reopened |
| Midnight | Countdown only | none | none |
| A stalled network | The after-sync refresh, the resume refresh-after-sync and the background task's lock never run; the 1500 ms launch refresh and the resume refresh still do | unchanged | unchanged |

Three facts the steps depend on:

- **The preferences are written before the alarms.** `commitAlertMenuChanges` writes the three atoms and only then
  enqueues the scheduling work, because `_addMultipleScheduleRemindersForPrayer` reads the interval from the atom
  while it runs (`stores/notifications.ts:800`). Reordering would schedule the old interval.
- **The lock is a queue, not a mutex.** Anything enqueued while a commit runs executes before that commit's own
  follow-up work, unless the follow-up runs inside the same acquisition. The first design review measured this
  (probe P3): a refresh queued behind a failing commit read the prayer's restored preference and cancelled both days
  again before the commit's catch ran.
- **`getOnInit: true` means an atom is read from MMKV once, at module evaluation.** `stores/storage.ts`'s THE RULE:
  a bare `database.set` on the key behind an atom is invisible to every later `store.get`. The repair mark is
  therefore written with `store.set`, never with `Database.database.set`.

### 4.3 What today's code does with a refusal

| Place | Today | Why it is wrong |
| --- | --- | --- |
| `device/notifications.ts:120-131` `clearAllScheduledNotificationForPrayer` | Sends every cancel, waits for all, throws the first refusal | The store's record delete on the line after it never runs, so records are kept for cancels that DID land |
| `device/notifications.ts:196-208` `clearAllScheduledRemindersForPrayer` | Sends every cancel, logs each failure, always resolves | The store then deletes every reminder record, so a reminder still armed is left with no record and nothing can find it again |
| `stores/notifications.ts:111-122` `_cancelStaleNotificationIds` | Logs each refusal and resolves | Nothing upstream learns that an alarm the app no longer wants is still armed |
| `stores/notifications.ts:597-618` `scheduleNotificationForDate` | Catches, records the deterministic identifier, returns it | Correct for a refresh (issue #15: the OS keeps the previous alarm under that identifier) and wrong for a commit, where the caller cannot tell a refused arm from a successful one |
| `stores/notifications.ts:646-647` `_addMultipleScheduleNotificationsForPrayer` | Clears the prayer's records, then schedules each day | A day whose stored row cannot be read rejects outside the per-day try, so its record is gone while its alarm stays armed |
| `hooks/useNotification.ts:263-274` `commitAlertMenuChanges` | Writes the three preferences back and returns false | The alarms are left wherever the failure stopped, disagreeing with the bell |

### 4.4 Existing tests over this code

| Suite | What it proves today | This plan |
| --- | --- | --- |
| `stores/__tests__/notifications.test.ts` | The whole store, including "keeps the existing OS notification alive when re-scheduling it fails" and the two `updatePrayerNotifications` cases | Call sites renamed in step 4 |
| `stores/__tests__/notificationSchedulingLock.test.ts` | Finding 82: every piece of work ends before the lock is released | Call sites renamed in step 4 |
| `stores/__tests__/notificationSinglePrayerUpdate.test.ts` | One prayer's commit: at-time and reminder halves | Call sites renamed in step 4 |
| `stores/__tests__/notificationOffCancelFailure.test.ts` | A refused cancel rejects the refresh, keeps every record, leaves the gate open | Changes by intent in step 2: the refresh resolves, only the refused record is kept |
| `stores/__tests__/notificationStaleCancelFailure.test.ts` | A refused stale cancel does not reject, and the sweep retries it | Kept; step 3 adds the mark |
| `device/__tests__/reminderCancelFailure.test.ts` | The reminder clear resolves and logs each refusal | Changes by intent in step 2: it resolves with the refused identifiers |
| `stores/__tests__/notificationRefreshGate.test.ts` | The 12-hour gate, and that a bail is not stamped | Step 3 adds the repair branch |
| `hooks/__tests__/useNotification.test.ts` | The hook, including "rolls back preferences" | Step 4 moves those assertions to the store's commit |
| `hooks/__tests__/notificationSettingsFallback.test.ts` | Finding 79's Settings path | Call site renamed in step 4 |

### 4.5 Why the obvious simple fix is wrong

**"Make every clear reject, and roll the preferences back."** That is today's behaviour on the at-time half, and it is
finding 81: the records stay, the reminders are lost, and the alarms are left disagreeing with the bell.

**"Undo by calling `updatePrayerNotifications` again from the hook's catch."** That was the first design, and the
first design review measured it failing (probe P3): the undo is a second lock acquisition, queued behind whatever was
enqueued in the meantime, and the preferences are restored before it is queued. A refresh sitting in the queue read
the restored preference and acted on it first. The undo has to run inside the same acquisition.

**"Keep the 12-hour gate open while anything is wrong."** The first design review recommended this, and the owner
rejected it on cost once it was measured (decision 5): it makes every return to the app run a full reschedule of all
eleven prayers while one prayer is wrong.

**"Retry the refused call a few times with a delay."** The Android refusals found in expo-notifications' source are an
exception inside `NotificationsService`'s work, or a lost React context during a reload. Neither recovers within
milliseconds, and timers would enter every scheduling test.

## 5. Design

### 5.1 The invariants

**I1, the commit.** When the alert sheet's commit settles, the prayer's saved at-time alert, reminder alert and
reminder interval are the values whose alarms the phone accepted: the new ones when the phone accepted every part,
the original ones when it refused or failed any part. If the phone refused the undo too, the prayer carries a repair
mark.

**I2, the mark.** When any scheduling operation settles, each prayer it touched carries a repair mark if and only if
the phone refused or failed a part of that prayer's work that can still fire.

**I3, the repair.** While a prayer carries a repair mark, every launch, return to the app and background run applies
that prayer's saved preferences again, and the mark is cleared only by a pass that the phone accepted in full.

### 5.2 The approach

**A refusal becomes a value, not an exception.** Every call that can be refused resolves with what the phone refused,
and the caller decides. Four kinds of failure are then one thing: a refused cancel, a refused arm, a call that never
answers, and a stored row that cannot be read.

**A native call that does not answer within 15 seconds is refused.** `withNativeTimeout` in `shared/notifications.ts`
races each call into expo-notifications against a 15-second timer (owner, decision 4). Every call the scheduling lock
can await is wrapped, so the lock can never be held for longer than one such call.

**The undo runs inside the same lock acquisition as the change.** The store gains `commitPrayerAlertChange`, which
takes the new values and the original values. Inside one acquisition it applies the new values; if any part is
refused or fails, it writes the original preferences back and applies them, before releasing the lock. Nothing that
was queued meanwhile can run between the failure and the undo.

**A repair mark carries a generation.** `preference_notification_repair_<type>_<name>` holds 0 when the prayer is
clean, and otherwise the generation of the mark. The commit bumps it before the preferences move, so a process death
between the preference write and the alarms still leaves the mark. An operation clears it only when it finishes that
prayer's work with nothing refused AND the generation is still the one it started with, so a failed commit can never
undo a newer commit that already succeeded.

**Repair is per prayer, not a full reschedule.** When the 12-hour gate is shut and a mark exists,
`refreshNotifications` applies the marked prayers' saved preferences instead of skipping. The gate itself keeps
exactly today's meaning (owner, decision 5).

### 5.3 The pieces, in order

1. **`withNativeTimeout(work, description)`** in `shared/notifications.ts`. Races `work` against a 15-second timer and
   rejects with a named error when the timer wins; clears the timer either way. Applied to both
   `scheduleNotificationAsync` calls and all three `cancelScheduledNotificationAsync` calls in
   `device/notifications.ts`, the three `setNotificationChannelAsync` calls the schedulers await in
   `shared/notifications.ts`, and the sweep's `getAllScheduledNotificationsAsync` in `stores/notifications.ts`.
2. **`withSchedulingLock` keeps the queue fulfilled.** The chain becomes `const run = schedulingQueue.then(...)` with
   `schedulingQueue = run.then(() => undefined, () => undefined)`. A rejected queue promise would make every later
   `.then(onFulfilled)` skip its callback, and nothing would ever schedule again in that process.
3. **The device clears resolve with what was refused.** Both `clearAllScheduledNotificationForPrayer` and
   `clearAllScheduledRemindersForPrayer` in `device/notifications.ts` cancel every recorded identifier with
   `Promise.allSettled`, log each refusal, and resolve with the refused identifiers.
4. **The store clears delete only what the phone confirmed.** Each reads the prayer's records, calls the device clear,
   deletes the record of every identifier the phone did not refuse, deletes the record of every refused identifier
   dated before yesterday, and resolves with the count of refused identifiers dated yesterday or later
   (decision 10). `stores/database.ts` gains `removeOneScheduledNotificationForPrayer` and
   `removeOneScheduledReminderForPrayer`.
5. **The per-day schedulers report refusal.** `scheduleNotificationForDate` and `scheduleReminderNotificationForDate`
   resolve with `{ identifier: string | null; refused: boolean }`. The catch path still records the deterministic
   identifier, so issue #15's surviving alarm is unchanged.
6. **`_addMultipleSchedule*ForPrayer` stop clearing the records first.** They read the existing records, schedule
   every day, then delete and stale-cancel only the records whose identifier this pass did not attempt. A day whose
   stored row cannot be read rejects after every other day has settled, before any record is deleted, so its record
   survives with its alarm. Each resolves with the number of refusals that can still fire.
7. **`commitPrayerAlertChange`** replaces `updatePrayerNotifications`. It bumps the mark, writes the new preferences,
   and inside one lock acquisition applies them through `applyPrayerAlerts`; on any refusal or failure it writes the
   original preferences back and applies those, unless the generation has moved. It resolves true only when the new
   values landed in full.
8. **`_addAllSchedule*ForSchedule` report per prayer**, and `_rescheduleAllNotifications` marks every prayer with a
   refusal and clears the mark of every prayer it finished clean.
9. **`refreshNotifications` repairs when the gate is shut and a mark exists.**

### 5.4 The concurrency trace

Every caller of section 4.2's table, before and after.

| Caller | Before | After |
| --- | --- | --- |
| Launch refresh (Android, gate reopened) | Full reschedule; a refused arm is ignored and the gate is stamped | Full reschedule; a refused arm marks that prayer, the gate is still stamped, and the next return repairs that prayer alone |
| Launch refresh (gate shut, no mark) | Skips | Skips, unchanged |
| Launch refresh (gate shut, a mark) | Skips, so a wrong prayer waits up to 12 hours | Applies the marked prayers' saved preferences inside the lock |
| After-sync refresh | As the launch refresh | As the launch refresh |
| Return from background | As the launch refresh | As the launch refresh |
| Background task | Full reschedule, always | Full reschedule, always; marks and clears as the full reschedule does |
| Alert sheet close | Preferences first, then one lock acquisition; a failure rolls back preferences only | Mark, preferences, then one lock acquisition that applies and, on any failure, restores and re-applies before releasing |
| Sound sheet close | `rescheduleAllNotifications` | Unchanged; the full reschedule it runs marks and clears as above |
| A download | Reopens the gate | Unchanged |
| Upgrade | Reopens the gate | Unchanged; the forced reschedule clears marks it finishes clean |
| Midnight | Nothing | Unchanged |
| Stalled network | The gated refreshes still run | Unchanged |

Two interleavings the design is built for:

- **A refresh queued behind a failing commit.** The commit's undo runs inside the commit's own acquisition, so the
  queued refresh sees the restored preferences and the restored alarms, not a half-undone state.
- **A second commit for the same prayer while the first is still running.** The second bumps the generation the
  moment its sheet closes. The first then finds the generation moved and skips both its preference restore and its
  undo, leaving the state to the second, which owns it.

### 5.5 Alternatives rejected

- **Keep the user's choice and repair later.** The owner rejected it: the bell would show Off while an alarm can still
  fire.
- **Roll the preferences back only.** Today's behaviour, and finding 81 itself.
- **Undo from the hook's catch.** Measured failing by the first design review, probe P3 (section 4.5).
- **Hold the 12-hour gate open while any prayer is wrong.** Rejected by the owner on measured cost (decision 5).
- **Retry a refused call in place, with delays.** Neither Android refusal recovers in milliseconds, and timers would
  enter every scheduling test (section 4.5).
- **A watchdog in `withSchedulingLock` that releases the queue after 60 seconds.** Rejected: it would let a late
  native call land beside the next operation, which is exactly the race finding 82 closed. The 15-second per-call
  timeout keeps the lock's guarantee and turns the hang into a refusal the repair mark already handles.
- **Mark the prayer behind a stale identifier the sweep could not cancel.** Rejected: a stale identifier has no
  record, so the prayer would have to be parsed out of the identifier string, and the sweep already asks again on the
  next full reschedule (decision 11).

### 5.6 Known limits, written down rather than fixed

- A stale OS entry the sweep cannot cancel is retried only by the next full reschedule, up to 12 hours later
  (decision 11).
- `commitSoundSelection` keeps today's rollback, which restores the preference but not the alarms (decision 13; the
  owner's own later session).
- `deleteLegacyAndroidAudioChannels` and `createDefaultAndroidChannel` run in `initializeNotifications`, outside the
  scheduling lock. A hang there delays the refresh that follows it but cannot hold the queue, so they are not wrapped.

### 5.7 The design review

To be filled in by the planning session once the review has answered.

## 6. Steps

To be written.

## 7. Device proof

To be written.

## 8. Records

To be written.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after a
PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

To be written.

## 11. Subagents in this plan

To be written.

## 12. Report to the owner

To be written.
