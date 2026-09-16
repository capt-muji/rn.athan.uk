# Plan: Session 6b. An alert sheet change is all or nothing, in both directions (finding 81)

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/alert-all-or-nothing.md` |
| Planned at | `03cc5688` (version 1.27.184), 2026-09-16. Every file this plan replaces is checked by its sha256 before the step runs (section 3), which is stronger than a tree sha: the planning commits after `03cc5688` change documents only |
| Planned by | Claude, planning session on 2026-09-16 |
| Needs first | 1 (session 6, DONE) |
| Steps | 2, each one branch, one commit, one version, then the device proof |
| Device | OnePlus 3T: a local production build, two throwaway patched mock builds, then the latest mock build |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

**Every file this plan writes is saved, finished, under `ai/plans/06b-alert-all-or-nothing/files/`,** mirroring the
repository's own paths with a `.txt` suffix on each, so that jest, tsc and Biome leave them alone. The executor copies
them; it never types the code. Every one of them was written, run and proven in a scratch worktree while this
plan was made: red before green, 100% coverage on all four measures, and every break caught.

## 1. Goal

Today an alert sheet change is not all or nothing. Switching a prayer Off sends every cancel, and one refusal makes the
whole change fail: the at-time records are kept, every reminder is cancelled and its record deleted, and the hook
writes the original alert back. The bell then shows Sound while the alarms behind it are gone, and the 12-hour gate
stops the app noticing for half a day. Turning a prayer on has the mirror gap: a refused arm restores only the
preference, so alarms that did arm stay armed under a bell that says Off.

When this plan is DONE, one sentence holds: **an alert sheet change either lands completely or is undone completely,
bell and alarms together.** If the phone refuses part of the change, the app puts the preferences back and puts the
alarms back to match, inside the same lock acquisition, before anything else can run. If the phone refuses the undo
too, the prayer carries a repair mark, and the next launch, return to the app or background run redoes that one prayer
until the phone accepts it.

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
   Owner, 2026-09-16, this session: "maybe give up after 15s instead of 30s? same as option 1 but shorter". The
   scheduling queue waits for every piece of work it started (finding 82), so without this one silent native call
   would stop the app arming or cancelling anything for the rest of the process, with the bell already showing what
   the user picked.
5. **A prayer the phone refused is repaired on its own, not by a full reschedule.** The app marks that prayer and, on
   the next launch or return, redoes only that prayer; the normal 12-hour cycle is untouched. Owner, 2026-09-16, after
   being shown the measured cost of the alternative on their own 3T: a full pass on returning from background took
   118 ms and 123 ms (`~/athan-device-sweep/session5/mockcheck/reopen.logcat.txt`), against 47, 55, 52 and 50 ms for a
   production build with one alert on (`AUDIT-FINDINGS.md`, "Measured on the device").
6. **The refusal is forced on the 3T with a throwaway build.** Owner, 2026-09-16: "I don't want to see it, but I will
   let you do as much testing as you need to to ensure it is absolutely bulletproof. So yes, you can build whatever
   you want, you can throw away whatever you want. It needs to be bulletproof. I don't need to see it. I trust you to
   do it."
7. **The 3T is always left unlocked, with the app open and "Stay awake" on.** Owner, 2026-09-16: "I have purposefully
   left the screen unlocked, and the app is open and stay awake is on... This should be the state always." No step in
   this plan changes that, and section 7 restates it.
8. **The repair mark is keyed `preference_notification_repair_<type>_<name>`.** Planner: `preference_` is the only
   prefix both wipes keep (`UPGRADE_KEEP_PREFIXES` in `stores/version.ts:144` and `replacePrayerCache`'s keep list in
   `stores/sync.ts:342`), so a mark cannot be lost by a cache wipe while the alarms it describes survive. The key does
   not match `INDEX_KEY_PATTERN` (`stores/notifications.ts:256`), so the preference migration leaves it alone. The
   second design review measured both wipes and the migration pattern against this key and confirmed it.
9. **The mark carries a generation number, and the number is the mark.** Planner: 0 means clean, and any other value
   is both "marked" and "which change marked it". The generation is the stored value plus one, per prayer. One number
   answers two questions: whether a prayer still needs repairing, and whether the change now finishing is still the
   newest one for that prayer. Without the second, a failed commit would undo a newer commit that had already
   succeeded, and would write its own settings back over it.
10. **An operation that finds a prayer's generation changed since it read it touches nothing:** not the preferences,
    not the alarms, not the mark. Planner, from the second design review's finding 8.
11. **A refused cancel counts only when the alarm it names can still fire: its record is dated today or later.**
    Planner, corrected by the second design review's finding 3, which measured that every row filed under yesterday is
    already past even at 00:05, because an Extras night row fires on the evening BEFORE the day it is filed under. A
    spent refusal is logged, its record dropped, and the change stands.
12. **The repair is the existing full reschedule, narrowed to the marked prayers.** Planner, from the second design
    review's two blockers: a separate per-prayer path lacks the empty-cache bail (measured: it cancelled a marked
    prayer's alarms on a day with no stored rows and then reported it clean) and lacks the sweep (measured: it
    reported a prayer clean while the OS still held both its alarms). Narrowing the pass keeps both, keeps the
    day-change re-check, and still costs about a tenth of a full pass, which is what decision 5 asked for.
13. **The post-reschedule sweep is not changed.** Planner: a stale OS entry the sweep cannot cancel has no record, so
    there is no prayer to mark; the refusal is counted by the prayer whose stale identifier it was, that prayer is
    marked, and the repair pass it triggers ends in the sweep, which asks again.
14. **A call given up on reopens the twelve-hour gate.** Planner, from the second design review's finding 13: a timed
    out call can still land afterwards and arm an alarm the app has no record of, and only the sweep can find one of
    those. A full reschedule on the next foreground is a bounded, rare cost, and it does not reopen decision 5, which
    was about every refusal.
15. **`updatePrayerNotifications` is renamed `commitPrayerAlertChange`.** Planner: after step 2 the function commits a
    change and undoes it, which its old name does not describe, and leaving the old name exported beside the new one
    would leave an export with no production caller.
16. **A marked prayer is repaired on every launch, return to the app and background run, with no attempt limit.**
    Planner, from the second design review's finding 15: one prayer is about a tenth of the measured 118 to 123 ms, the
    phone refusing is the broken case anyway, and the launch and resume paths already skip the refresh entirely when
    the notification permission is denied (`shared/notifications.ts`, `initializeNotifications`).
17. **The athan sound change (`commitSoundSelection`) keeps today's behaviour.** Owner, 2026-09-15,
    `ai/prompts/README.md`: it "becomes its own session later", not this one.
18. **Step 1's per-call limit is not turned into one budget for a whole lock acquisition.** Planner, from the second
    design review's finding 5: the owner approved a limit on one call; an acquisition-wide budget could wrongly refuse
    a legitimate long pass on a cold, throttled 3T. The real worst case is written down in section 5.6 instead.

### 2.2 The executor must not decide

STOP, append what you saw and the question to `LOG.md`, and ask the owner the question given, whenever one of these
happens:

1. **`anchor-check.sh` prints `ANCHORS NEEDS REPLAN`.** This is NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4).
   Tell the owner: "The plan's check reports `<the lines that were not OK>`, so the plan is out of date. Please run the
   planning prompt."
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
   nor `*walarm*:ACTION_FORCE_STOP_RESCHEDULE`**, or holds an alarm section 7 does not predict. Ask: "The alarm dump
   holds `<line>`, which the plan does not list. What do I do?"
10. **`isha_alarms.py` prints a line starting `ISHA ALARMS NOT AS EXPECTED`**, or `refusal_proof.py` prints a line
    starting `REFUSAL PROOF NOT AS EXPECTED`. Ask: "`<script>` printed `<line>`. What do I do?"
11. **adb hangs twice, or prints "InputChannel is not initialized".** Ask: "The OnePlus 3T is not answering adb.
    Please reboot it and reply when it is back, unlocked with Athan open."
12. **The phone's screen is off or locked.** Do not change any setting on the phone. Ask: "The OnePlus 3T's screen is
    `<off/locked>`. It should be unlocked with Athan open. Please put it back and reply when that is done."
13. **The owner reports that Isha is not Off** in section 7.2. Ask: "Isha is already on. May I use it for the proof
    and put it back to its current setting afterwards, or do I stop?"

## 3. Pre-flight

Run this from `/Users/muji/repos/rn.athan.uk`:

```bash
cp ai/plans/06b-alert-all-or-nothing/scripts/preflight.sh $TMPDIR/preflight-6b.sh
bash $TMPDIR/preflight-6b.sh <k>
```

`<k>` is the first line of section 6's checklist not ticked DONE: `1` for a new plan, `2` when step 1 is done, `3` when
only the device proof is left. The script is saved at `ai/plans/06b-alert-all-or-nothing/scripts/preflight.sh` and is
given in full there. It ends `PREFLIGHT OK`.

- `PREFLIGHT NEEDS REPLAN`: an anchor or a file sha no longer matches. Section 2.2, item 1.
- `PREFLIGHT FAILED`: anything else. STOP and ask the owner, quoting the line.

## 4. Background the executor needs

### 4.1 Code map

| File | What it does | This plan |
| --- | --- | --- |
| `shared/notifications.ts` | Identifiers, content, Android channels, `initializeNotifications` | Step 1: the fifteen-second limit, and a start-up that carries on past a channel failure |
| `device/notifications.ts` | Every call into expo-notifications for one prayer: arm, cancel, cancel-all | Steps 1 and 2 |
| `stores/notifications.ts` | The atoms, the scheduling lock, every schedule and clear path, the 12-hour gate, the background task | Steps 1 and 2 |
| `stores/database.ts` | The MMKV record store for armed identifiers | Step 2: removing one record at a time |
| `hooks/useNotification.ts` | The alert sheet's commit, the sound commit, the permission paths | Step 2: the preference write, the rollback and the failure log move into the store |
| `stores/storage.ts` | `atomWithStorageNumber` and `resetStoredAtom`, and THE RULE: never write MMKV behind one of these atoms | Read only; step 2 obeys it |
| `stores/sync.ts` | Downloads, the armed-day counter, `replacePrayerCache`'s keep list | Read only: decision 8 |
| `stores/version.ts` | `UPGRADE_KEEP_PREFIXES`, the forced reschedule on upgrade | Read only: decision 8 |
| `components/sheets/screens/Alert.tsx` | The sheet; `handleDismiss` calls `commitAlertMenuChanges` | Not changed: no visual and no behavioural change reaches it |
| `app/index.tsx`, `device/listeners.ts`, `device/tasks.ts` | The three callers of the refresh and the background reschedule | Not changed; step 2 changes what `refreshNotifications` does when the gate is shut |

### 4.2 How the pieces interact

Every caller of the scheduling lock, at `03cc5688`. The lock is a promise queue: operations run one at a time, in the
order they were enqueued, and since finding 82 each one waits for every piece of work it started before it settles.

| Caller | Path | Lock operation | 12-hour gate |
| --- | --- | --- | --- |
| Launch, 1500 ms after mount | `app/index.tsx:99-108`: `reopenRefreshGateOnColdLaunch` (Android only), then `initializeNotifications(checkInitialPermissions, refreshNotifications, registerBackgroundTask)` | `refreshNotifications` | Reopened first on Android, so it always runs |
| After the launch sync lands | `app/index.tsx:138-142`, effect on `state === 'hasData'` | `refreshNotifications` | Honoured |
| Return from background | `device/listeners.ts:50`, then `sync().then(...)` at `:61-68` refreshes again only when a download moved an armed day | `refreshNotifications` | Honoured |
| Background task | `device/tasks.ts:34-35` calls `rescheduleAllNotificationsFromBackground`, which syncs OUTSIDE the lock and then takes it | `backgroundReschedule` | Ignored; stamps on success |
| Alert sheet close | `components/sheets/screens/Alert.tsx:60-75` `handleDismiss`, then `commitAlertMenuChanges` | `updatePrayerNotifications`, `commitPrayerAlertChange` after step 2 | Ignored |
| Sound sheet close | `hooks/useNotification.ts:300-318` `commitSoundSelection` | `rescheduleAllNotifications` | Ignored |
| A download | `stores/sync.ts:110-116` `saveDownloadedDays`, outside the lock | none | Reopened when an armed day changed |
| Upgrade | `stores/version.ts:194-201` `forceNotificationReschedule` | none | Reopened |
| Midnight | Countdown only | none | none |
| A stalled network | The after-sync refresh, the resume refresh-after-sync and the background task's lock never run; the 1500 ms launch refresh and the resume refresh still do | unchanged | unchanged |

Three facts the steps depend on:

- **The preferences are written before the alarms.** The commit writes the three atoms and only then does the
  scheduling work, because `_addMultipleScheduleRemindersForPrayer` reads the interval from the atom while it runs
  (`stores/notifications.ts:800`). Reordering would schedule the old interval.
- **The lock is a queue, not a mutex.** Anything enqueued while a commit runs executes before that commit's own
  follow-up work, unless the follow-up runs inside the same acquisition. The first design review measured this
  (probe P3): a refresh queued behind a failing commit read the prayer's restored preference and cancelled both days
  again before the commit's catch ran.
- **`getOnInit: true` means an atom is read from MMKV once, at module evaluation.** `stores/storage.ts`'s THE RULE:
  a bare `database.set` on the key behind an atom is invisible to every later `store.get`, and two atoms built over
  the same key hold different values. The second design review measured both. The repair marks are therefore eleven
  atoms built once, at module evaluation, and are written with `store.set` and cleared with `resetStoredAtom`.

### 4.3 What today's code does with a refusal

| Place | Today | Why it is wrong |
| --- | --- | --- |
| `device/notifications.ts:120-131` `clearAllScheduledNotificationForPrayer` | Sends every cancel, waits for all, throws the first refusal | The store's record delete on the line after it never runs, so records are kept for cancels that DID land |
| `device/notifications.ts:196-208` `clearAllScheduledRemindersForPrayer` | Sends every cancel, logs each failure, always resolves | The store then deletes every reminder record, so a reminder still armed is left with no record and nothing can find it again |
| `stores/notifications.ts:111-122` `_cancelStaleNotificationIds` | Logs each refusal and resolves | Nothing upstream learns that an alarm the app no longer wants is still armed |
| `stores/notifications.ts:597-618` `scheduleNotificationForDate` | Catches, records the deterministic identifier, returns it | Correct for a refresh (issue #15: the OS keeps the previous alarm under that identifier) and wrong for a commit, where the caller cannot tell a refused arm from one that landed |
| `stores/notifications.ts:646-647` `_addMultipleScheduleNotificationsForPrayer` | Clears the prayer's records, then schedules each day | A day whose stored row cannot be read rejects outside the per-day try, so its record is gone while its alarm stays armed |
| `hooks/useNotification.ts:263-274` `commitAlertMenuChanges` | Writes the three preferences back and returns false | The alarms are left wherever the failure stopped, disagreeing with the bell |

### 4.4 Existing tests over this code

| Suite | What it proves today | This plan |
| --- | --- | --- |
| `stores/__tests__/notifications.test.ts` | The whole store, including "keeps the existing OS notification alive when re-scheduling it fails" | Step 2 renames two call sites and their titles; every assertion stands |
| `stores/__tests__/notificationSchedulingLock.test.ts` | Finding 82: every piece of work ends before the lock is released | Step 1 adds two cases; step 2 renames the call sites and changes four expectations by intent (a refused cancel no longer rejects a refresh; it marks the prayer) |
| `stores/__tests__/notificationSinglePrayerUpdate.test.ts` | One prayer's commit: the at-time and reminder halves | Step 2 renames the call sites |
| `stores/__tests__/notificationOffCancelFailure.test.ts` | A refused cancel rejects the refresh, keeps every record, leaves the gate open | Step 2 changes it by intent: the refresh finishes, only the refused record is kept, and the next return puts the prayer right without closing the gate |
| `stores/__tests__/notificationStaleCancelFailure.test.ts` | A refused stale cancel does not reject, and the sweep retries it | Unchanged, and it still passes: the stale record is still deleted before the cancel, so the sweep still finds the survivor |
| `device/__tests__/reminderCancelFailure.test.ts` | The reminder clear resolves and logs each refusal | Step 2 changes it by intent: it resolves WITH the refused identifiers |
| `stores/__tests__/notificationRefreshGate.test.ts` | The 12-hour gate, and that a bail is not stamped | Unchanged, and it still passes: its prayers carry no mark, so the new branch is not taken |
| `hooks/__tests__/useNotification.test.ts` | The hook, including the preference writes and the rollback | Step 2 rewrites its `commitAlertMenuChanges` block: what it proved about preferences and scheduling is now proved against the real store in `notificationAlertCommit.test.ts`, and the hook's own tests are what it still does — change detection, the permission check, and handing both states to the store unchanged |
| `components/prayer/__tests__/Alert.test.tsx`, `components/sheets/screens/__tests__/Alert.test.tsx` | The bell and the sheet | Unchanged, and they still pass |

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

**"Write a small repair pass that redoes one prayer."** The second design review measured this failing twice: without
the full reschedule's empty-cache bail it cancels a marked prayer's alarms on a day with no stored rows and then
reports the prayer clean, and without the sweep it reports a prayer clean while the OS still holds both its alarms
(decision 12).

**"Retry the refused call a few times with a delay."** The Android refusals found in expo-notifications' source are an
exception inside `NotificationsService`'s work, or a lost React context during a reload. Neither recovers within
milliseconds, and timers would enter every scheduling test.

## 5. Design

### 5.1 The invariants

**I1, the commit.** When the alert sheet's commit settles, the prayer's saved at-time alert, reminder alert and
reminder interval are the values whose alarms the phone accepted: the new ones when the phone accepted every part,
the original ones when it refused or failed any part. If the phone refused the undo too, the prayer carries a repair
mark.

**I2, the mark.** When any scheduling operation settles, each prayer it looked at carries a repair mark if and only if
the phone refused or failed a part of that prayer's work that can still fire. A prayer the operation did not look at
keeps the mark it had.

**I3, the repair.** While a prayer carries a repair mark, every launch, return to the app and background run applies
that prayer's saved preferences again, and the mark is cleared only by a pass that the phone accepted in full and that
no newer change has overtaken.

### 5.2 The approach

**A refusal becomes a value, not an exception.** Every call that can be refused resolves with what the phone refused,
and the caller decides. Four kinds of failure are then one thing: a refused cancel, a refused arm, a call that never
answers, and a stored row that cannot be read.

**A native call that does not answer within 15 seconds is refused.** `withNativeTimeout` in `shared/notifications.ts`
races each call into expo-notifications against a 15-second timer (owner, decision 4). Every call the scheduling lock
can await is wrapped, and so is every channel call `initializeNotifications` awaits, because a hang there prevents the
refresh rather than delaying it.

**The undo runs inside the same lock acquisition as the change.** The store gains `commitPrayerAlertChange`, which
takes the new values and the original values. Inside one acquisition it applies the new values; if any part is refused
or fails, it writes the original preferences back and applies them, before releasing the lock. Nothing that was
queued meanwhile can run between the failure and the undo.

**A repair mark carries a generation.** `preference_notification_repair_<type>_<name>` holds 0 when the prayer is
clean, and otherwise the generation of the mark, which is the stored value plus one. The commit bumps it before the
preferences move, so a process death between the preference write and the alarms still leaves the mark. An operation
clears it only when it finishes that prayer's work with nothing refused AND the generation is still the one it started
with, and an operation that finds the generation moved touches nothing at all.

**Repair is the full reschedule, narrowed to the marked prayers.** When the 12-hour gate is shut and a mark exists,
`refreshNotifications` runs `_rescheduleAllNotifications` with a per-prayer filter, so the empty-cache bail, the
day-change re-check and the post-reschedule sweep all still run. The gate itself keeps exactly today's meaning and is
not stamped by a repair (owner, decision 5; second design review, decision 12).

### 5.3 The pieces, in order

1. **`withNativeTimeout(work, description)`** in `shared/notifications.ts`. Races `work` against a 15-second timer,
   rejects with a named error when the timer wins, and clears the timer in a `finally` either way. Applied to both
   `scheduleNotificationAsync` calls and all three `cancelScheduledNotificationAsync` calls in
   `device/notifications.ts`, to the sweep's `getAllScheduledNotificationsAsync` in `stores/notifications.ts`, and to
   all five channel calls in `shared/notifications.ts`.
2. **`initializeNotifications` carries on past a channel failure.** A channel decides how a notification sounds, never
   whether it fires, and it is awaited before the permission check and the refresh, so losing one used to cost the
   refresh: two of the three events a marked prayer is repaired on.
3. **`withSchedulingLock` keeps the queue fulfilled.** The chain becomes `const run = schedulingQueue.then(...)` with
   `schedulingQueue = run.then(() => undefined, () => undefined)`. A rejected queue promise makes every later
   `.then(onFulfilled)` skip its callback, and nothing would ever schedule again in that process. `withSchedulingLock`
   stays declared `async`, so a synchronous throw in its own wrapper reaches the caller as a rejection.
4. **A call given up on reopens the gate.** `withNativeTimeout` latches it; `withSchedulingLock` reads the latch once
   when its operation settles and reopens the 12-hour gate (decision 14).
5. **The device clears resolve with what was refused.** Both `clearAllScheduledNotificationForPrayer` and
   `clearAllScheduledRemindersForPrayer` cancel every recorded identifier with `Promise.allSettled`, log each refusal,
   and resolve with the refused identifiers.
6. **The store clears delete only what the phone confirmed.** Each reads the prayer's records, calls the device clear,
   deletes the record of every identifier the phone did not refuse, deletes the record of every refused identifier
   dated before today, and resolves with the count of refused identifiers dated today or later (decision 11).
   `stores/database.ts` gains `removeOneScheduledNotificationForPrayer` and `removeOneScheduledReminderForPrayer`.
7. **The per-day schedulers report refusal.** `scheduleNotificationForDate` and `scheduleReminderNotificationForDate`
   resolve with `{ identifier: string | null; refused: boolean }`. The catch path still records the deterministic
   identifier, so issue #15's surviving alarm is unchanged.
8. **`_addMultipleSchedule*ForPrayer` stop clearing the records first.** They read the existing records, schedule every
   day, then delete and stale-cancel only the records whose identifier this pass did not attempt. A day whose stored
   row cannot be read rejects after every other day has settled, before any record is deleted, so its record survives
   with its alarm. Each resolves with the number of refusals that can still fire.
9. **`commitPrayerAlertChange`** replaces `updatePrayerNotifications`. It bumps the mark, writes the new preferences,
   and inside one lock acquisition applies them through `applyPrayerAlerts`; on any refusal or failure it writes the
   original preferences back and applies those, unless the generation has moved. It resolves true only when the new
   values landed in full. `applyPrayerPreferences` writes the three settings at-time first and is never reordered,
   because `setPrayerAlertType` forces the reminder Off whenever the at-time value is Off.
10. **`_addAllSchedule*ForSchedule` take a filter and report per prayer**, answering `null` for a prayer the pass did
    not look at, and `_rescheduleAllNotifications` reads each prayer's generation inside the lock, then marks every
    prayer with a refusal and clears the mark of every prayer it finished clean.
11. **`refreshNotifications` repairs when the gate is shut and a mark exists**, through the same reschedule with the
    marked prayers as its filter, and does not stamp the gate.

### 5.4 The concurrency trace

| Caller | Before | After |
| --- | --- | --- |
| Launch refresh (Android, gate reopened) | Full reschedule; a refused arm is ignored and the gate is stamped | Full reschedule; a refused arm marks that prayer, the gate is still stamped, and the next return repairs that prayer alone |
| Launch refresh (gate shut, no mark) | Skips | Skips, unchanged |
| Launch refresh (gate shut, a mark) | Skips, so a wrong prayer waits up to 12 hours | The same reschedule, narrowed to the marked prayers, inside the lock |
| After-sync refresh | As the launch refresh | As the launch refresh |
| Return from background | As the launch refresh | As the launch refresh |
| Background task | Full reschedule, always | Full reschedule, always; marks and clears as the full reschedule does |
| Alert sheet close | Preferences first, then one lock acquisition; a failure rolls back preferences only | Mark, preferences, then one lock acquisition that applies and, on any failure, restores and re-applies before releasing |
| Sound sheet close | `rescheduleAllNotifications` | Unchanged; the full reschedule it runs marks and clears as above |
| A download | Reopens the gate | Unchanged |
| Upgrade | Reopens the gate | Unchanged; the forced reschedule clears the marks of the prayers it finishes clean |
| Midnight | Nothing | Unchanged |
| Stalled network | The gated refreshes still run | Unchanged |

Four interleavings the design is built for, each with a test that fails without it
(`stores/__tests__/notificationAlertCommit.test.ts`):

- **A refresh queued behind a failing commit.** The commit's undo runs inside the commit's own acquisition, so the
  queued refresh sees the restored preferences and the restored alarms, not a half-undone state.
- **A second commit for the same prayer while the first is still queued.** The second bumps the generation the moment
  its sheet closes. The first then finds the generation moved and touches nothing, leaving the state to the second.
  Without that, the first's undo would write its own settings back over the second's, and the second's reminders would
  be armed at the first's interval, because the schedulers read the interval from its atom.
- **A first commit that succeeds while a second is already queued.** Its mark-clear finds a generation it does not own
  and leaves it, so the second can still put itself back.
- **A prayer marked while a pass for other prayers is waiting its turn.** The pass never looks at it, so it keeps its
  mark, and its own commit can still be put back.

### 5.5 Alternatives rejected

- **Keep the user's choice and repair later.** The owner rejected it: the bell would show Off while an alarm can still
  fire.
- **Roll the preferences back only.** Today's behaviour, and finding 81 itself.
- **Undo from the hook's catch.** Measured failing by the first design review, probe P3.
- **Hold the 12-hour gate open while any prayer is wrong.** Rejected by the owner on measured cost (decision 5).
- **A separate per-prayer repair pass.** Measured failing twice by the second design review (decision 12).
- **Retry a refused call in place, with delays.** Neither Android refusal recovers in milliseconds, and timers would
  enter every scheduling test.
- **A watchdog in `withSchedulingLock` that releases the queue after 60 seconds.** It would let a late native call land
  beside the next operation, which is exactly the race finding 82 closed.
- **One fifteen-second budget for a whole lock acquisition.** Decision 18.
- **Keeping the record of a refused stale cancel.** It would stop the sweep finding that alarm, because the sweep
  cancels exactly the OS entries that have no record, and it would break
  `notificationStaleCancelFailure.test.ts`'s second case for no gain: the refusal is already counted, the prayer is
  already marked, and the repair pass it triggers ends in the sweep.

### 5.6 Known limits, written down rather than fixed

- **The worst case a hang can hold the lock for is 90 seconds, not 15.** The wrapped calls are serial in places: a
  channel then an arm (2), then the stale cancels (3), then in a full reschedule the sweep's list and its cancels (5),
  and in a commit the new settings then the original ones (6). Six serial fifteen-second limits is 90 seconds, during
  which the bell shows a value whose alarms may not exist yet and nothing else can schedule. It ends by itself, which
  is the whole point: before this, it did not.
- **A timed-out call can still land afterwards** and arm an alarm with no record. Decision 14 answers it by reopening
  the gate, so the next foreground runs a full reschedule and its sweep.
- **The fifteen seconds run on wall clock, but the give-up can only land while the app is running.** Section 7.3
  probed this on the 3T, and the audit of 2026-09-16 timed the answer off
  `~/athan-device-sweep/session6b/hang-off2.logcat.txt`: the JS thread went quiet at 16:37:31.502, as the app was
  sent to the background (`LOG.md`'s 7.3 retry entry times the HOME press at 16:37:25 to 32), and wrote nothing at
  all until the resume woke it at 16:38:13.260. The fifteen-second timer fired 34 ms later, at 16:38:13.294 — 41.8
  seconds of wall clock after the call began, not fifteen. The deadline itself had passed long before: had the
  countdown paused with the thread, it would have had fifteen seconds still to run and fired around 16:38:28. So a
  hang the phone sleeps through is not given up on until the user comes back, and, on the thaw, a call the phone
  really did make races against a timer whose deadline has already passed, which treats it as refused and puts the
  change back. The two Android hang modes found in the native source never answer at all, so they cannot be
  affected.
- **A stale OS entry the sweep cannot cancel** is retried by the next pass for that prayer, which the refusal has
  marked, and by the sweep that pass ends in.
- **`commitSoundSelection` keeps today's rollback**, which restores the preference but not the alarms (decision 17).
  Under this design, a reschedule it fails now marks the prayers the phone refused, so those prayers re-apply the
  rolled-back sound at the next repair while unmarked ones keep the new one until the next full pass. It is a partial
  improvement to a path this session does not otherwise touch, and its own session will finish it.
- **The mark is read outside the lock** by `refreshNotifications` and again inside it by the reschedule. A prayer
  marked between the two is not in that pass's filter and keeps its mark, which the last interleaving in section 5.4
  covers.

### 5.7 The design review

A `Software Architect` (Claude Opus 5) attacked the design on 2026-09-16, in a worktree detached at `e046bf77`, with
six probe suites it wrote and ran under `$TMPDIR`. It reported two blockers, seven majors and seven minors, and the
verdict "design needs changes". Every finding was answered before a step was written:

| Finding | Answer |
| --- | --- |
| Blocker 1: a separate repair pass has no empty-cache bail, and cancels a marked prayer's alarms then reports it clean (measured) | Decision 12: the repair is the full reschedule, narrowed |
| Blocker 2: a separate repair pass has no sweep, and reports a prayer clean while the OS holds its alarms (measured) | Decision 12, the same change |
| Major 3: "yesterday or later" counts refusals that can no longer fire, because a night row fires BEFORE the day it is filed under (measured) | Decision 11: today or later |
| Major 4: pieces 6 and 11 contradicted each other on refused stale cancels | Decision 13 and section 5.5's last item: the record is still deleted, the refusal is counted, and the repair's sweep asks again |
| Major 5: "the lock can never be held longer than one call" is arithmetically wrong | Decision 18 and section 5.6's first item: the real worst case is written down |
| Major 6: the mark atoms must be module-scope singletons (measured: two atoms over one key disagree) | Section 4.2's third fact, and the code builds eleven atoms once |
| Major 7: a key scan would report every prayer ever marked (measured: `store.set(atom, 0)` leaves the key) | The marks are read through the atoms and cleared with `resetStoredAtom` |
| Major 8: the generation was under-specified in three places | Decisions 9 and 10, and the generations are read inside the lock |
| Major 9: the fifteen seconds are wall time, so a suspended process can turn work the phone did into a refusal | Section 5.6's third item, and section 7.3 probes it on the 3T |
| Minor 10: a hang in the start-up channel calls prevents the refresh rather than delaying it | Piece 2: start-up carries on past a channel failure |
| Minor 11: `clearTimeout` must be in a `finally` | Piece 1, and a test asserts no timer is left armed |
| Minor 12: keep `withSchedulingLock` async, keep the log and perf marks, `perfMeasure` in a `finally` | Piece 3 |
| Minor 13: a timed-out call that lands later arms an alarm with no record | Decision 14 |
| Minor 14: the undo must write all three preferences, in the commit's order | Piece 9 |
| Minor 15: the repair has no bound and no permission check | Decision 16 |
| Minor 16: how the marks interact with `commitSoundSelection` | Section 5.6's fifth item |

## 6. Steps

- [x] Step 1: a call into the notification system answers within fifteen seconds
      (`steps/1-native-call-timeout.md`) DONE in baa4fc7f
- [x] Step 2: an alert sheet change is all or nothing, in both directions (`steps/2-all-or-nothing.md`) DONE in e99d7099
- [x] Step 3: the device proof (section 7), which makes no commit of its own until section 8's records commit DONE in 8dde8df3

Each step is one branch, one commit, one version, one review, one merge. Both steps' finished files are saved under
`ai/plans/06b-alert-all-or-nothing/files/step1/` and `files/step2/`, mirroring the repository's own paths.

## 7. Device proof

Run this after step 2 is merged. Every command runs from `/Users/muji/repos/rn.athan.uk`. **No step in this plan
changes the phone's clock**, so no armed alarm can be fired early. The owner receives no screenshots: only the
`vision` (GLM 5.3 Flash) subagent reads them.

**The screen coordinates below were read off the 3T while this plan was written** (1080x1920, screenshots at
`~/athan-device-sweep/session6b/planning/`). The Standard list and the alert sheet are the same on a production build
as on a mock one.

| What | Tap |
| --- | --- |
| Fajr's bell | `tap 970 677` |
| Sunrise's bell | `tap 970 826` |
| Dhuhr's bell | `tap 970 976` |
| Asr's bell | `tap 970 1125` |
| Magrib's bell | `tap 970 1274` |
| Isha's bell | `tap 970 1424` |
| In the sheet: Athan Off | `tap 248 1031` |
| In the sheet: Athan Silent | `tap 540 1031` |
| In the sheet: Athan Sound | `tap 858 1031` |
| In the sheet: the Reminder switch | `tap 927 1266` |
| Close the sheet, which saves | `key back` |

Each is `python3 ~/athan-device-sweep/session5/bin/devcheck.py <tap or key> ...`.

### 7.0 Preparation and safety reading

1. Run `date '+%H:%M'`. If it is 23:45 or later, stop and continue after 00:15 (`EXECUTOR-BRIEF.md` section 3).
2. Tell the owner, word for word: "The device proof starts now and needs about forty minutes. It puts a production
   build on first, which re-arms your saved alerts, then two throwaway test builds that keep their own data, then the
   mock build again. I will not need your hands, and I will leave the phone unlocked with Athan open."
3. Run `mkdir -p ~/athan-device-sweep/session6b/build ~/athan-device-sweep/session6b/mocks`.
4. Run `cp mocks/simple.ts ~/athan-device-sweep/session6b/mocks/simple.ts`.
5. Run `git rev-parse uat-2` and write the sha in `LOG.md` as `FINAL=<sha>`. Every `<FINAL>` below is that sha.
6. Run `adb -s 8f7ada76 get-state`. Expected: `device`.
7. Run `adb -s 8f7ada76 shell settings get global auto_time`. Expected: `1`.
8. Run `adb -s 8f7ada76 shell dumpsys window policy | grep -c 'showing=true' || true`. Expected: `0`. `1` means the
   phone is locked: section 2.2, item 12. Do not unlock it yourself and do not change any setting on the phone.
9. Run `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session6b/alarms-start.txt`, then
   `grep -A1 'com.mugtaba.athan}' ~/athan-device-sweep/session6b/alarms-start.txt | grep -o 'tag=\*walarm\*:[A-Za-z_.]*' | sort | uniq -c`.
   Expected: one line ending `tag=*walarm*:ACTION_FORCE_STOP_RESCHEDULE` with count 1 (the year-2036 WorkManager
   alarm, `when=2036-09-12 04:40:40.505`, on every 3T dump), and at most one line ending
   `tag=*walarm*:expo.modules.notifications.NOTIFICATION_EVENT`, whose count is the alarms the installed build armed.
   Any other tag: section 2.2, item 9.

### 7.1 The ordinary paths, on a local production build

This is the half that can be shown with real prayer times: turning a prayer on arms exactly its future instants, and
turning it off cancels exactly those and nothing else.

1. Build in the background:
   `zsh ~/athan-device-sweep/session3/bin/build-prod.zsh <FINAL> ~/athan-device-sweep/session6b/build/athan-6b-prod.apk > $TMPDIR/build-prod-6b.log 2>&1`.
   Expected: the log holds `BUILD-PROD OK`, and after it a line starting `package` ending `versionName <version>`,
   with the version `node -p "require('./package.json').version"` prints.
2. `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session6b/build/athan-6b-prod.apk`
   in the background, writing to `$TMPDIR/install-prod-6b.log`. Expected: a line containing `Success`, then a state
   line naming that version. `adb install -r` keeps the owner's data.
3. `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold prod-cold > $TMPDIR/cold-prod-6b.log 2>&1` in the
   background. A `DUMP FAILED` line is expected while the countdown animates. Then run
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15` twice, one after the other.
4. `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session6b/alarms-prod-cold.txt`.
5. `python3 ai/plans/06-alert-integrity/scripts/device/isha_alarms.py ~/athan-device-sweep/session6b/alarms-prod-cold.txt ~/athan-device-sweep/session6b/alarms-prod-cold.txt off 5`.
   - `ISHA ALARMS AS EXPECTED (off)`: Isha is armed for no day, as it is when saved Off. Go on.
   - `ISHA TOO CLOSE`: the line gives a command to wait with, `until [ "$(date +%s)" -gt <seconds> ]; do sleep 15; done`.
     Run it exactly as printed, in the background, then repeat items 4 and 5.
   - `ISHA ALARMS NOT AS EXPECTED (off)`: section 2.2, item 13.
6. Turn Isha on, Silent, with its reminder on:
   `tap 970 1424`, `wait 3`, `tap 540 1031`, `wait 2`, `tap 927 1266`, `wait 2`, `key back`, `wait 10`.
7. `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session6b/alarms-isha-on.txt`, then
   `python3 ai/plans/06-alert-integrity/scripts/device/isha_alarms.py ~/athan-device-sweep/session6b/alarms-prod-cold.txt ~/athan-device-sweep/session6b/alarms-isha-on.txt on 5`.
   Expected: `ISHA ALARMS AS EXPECTED (on)`. Anything else: section 2.2, item 10.
8. Turn Isha off again: `tap 970 1424`, `wait 3`, `tap 248 1031`, `wait 2`, `key back`, `wait 10`.
9. `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session6b/alarms-isha-off.txt`, then
   `python3 ai/plans/06-alert-integrity/scripts/device/isha_alarms.py ~/athan-device-sweep/session6b/alarms-prod-cold.txt ~/athan-device-sweep/session6b/alarms-isha-off.txt off 5`.
   Expected: `ISHA ALARMS AS EXPECTED (off)`. Write both results in `LOG.md`.

### 7.2 A refused cancel, forced

A refusal cannot be made to happen on a healthy phone, so it is forced by a build whose `device/notifications.ts`
refuses the first at-time cancel of the run. The owner approved this on 2026-09-16 (decision 6). The patched file is
never committed and never merged: `build-mock-patch.zsh` copies it into its own detached worktree and restores that
worktree afterwards.

1. Build the patch directory the build script takes, which mirrors the repository and so cannot carry the `.txt`
   suffix:

   ```bash
   mkdir -p ~/athan-device-sweep/session6b/patch-refuse/device
   cp ai/plans/06b-alert-all-or-nothing/device-patches/refuse-once/device/notifications.ts.txt ~/athan-device-sweep/session6b/patch-refuse/device/notifications.ts
   ```

2. `zsh ~/athan-device-sweep/session6b/bin/build-mock-patch.zsh <FINAL> ~/athan-device-sweep/session6b/mocks/simple.ts ~/athan-device-sweep/session6b/patch-refuse ~/athan-device-sweep/session6b/build/athan-6b-refuse.apk > $TMPDIR/build-refuse-6b.log 2>&1`,
   in the background. Expected: the log holds `BUILD-MOCK-PATCH OK`, and a line reading
   `patched        1 file(s) from /Users/muji/athan-device-sweep/session6b/patch-refuse: device/notifications.ts`.
3. `python3 ~/athan-device-sweep/session5/bin/devcheck.py install ~/athan-device-sweep/session6b/build/athan-6b-refuse.apk`
   in the background. This build keeps its own data in `athan-storage-dev` and never opens the owner's.
4. `python3 ~/athan-device-sweep/session5/bin/devcheck.py cold refuse-cold > $TMPDIR/cold-refuse-6b.log 2>&1` in the
   background, then `devcheck.py wait 15`.

   The mock puts Asr 60 to 119 seconds after each download and the other rows a minute apart either side, so Magrib's
   instant is about two minutes after this cold launch and will pass while items 5 to 10 run. That does not weaken the
   proof: a record dated today still counts as able to fire (decision 11), so the refusal is still counted and the
   change is still put back, and `refusal_proof.py` reads only the lines the app wrote. Section 7.3 waits longer
   still, for the same reason and with the same answer.
5. Turn Magrib on, Silent, so there is something to cancel. Magrib, not Isha, because the mock's Isha is the last row
   and the closest to the countdown: `tap 970 1274`, `wait 3`, `tap 540 1031`, `wait 2`, `key back`, `wait 10`.
6. `python3 ~/athan-device-sweep/session5/bin/devcheck.py logs refuse-on`, then copy
   `~/athan-device-sweep/session5/mockcheck/refuse-on.logcat.txt` to `~/athan-device-sweep/session6b/`.
7. Turn Magrib off again, which is the change the phone will refuse: `tap 970 1274`, `wait 3`, `tap 248 1031`,
   `wait 2`, `key back`, `wait 10`.
8. `python3 ~/athan-device-sweep/session5/bin/devcheck.py logs refuse-off`, then copy
   `~/athan-device-sweep/session5/mockcheck/refuse-off.logcat.txt` to `~/athan-device-sweep/session6b/`.
9. `python3 ai/plans/06b-alert-all-or-nothing/scripts/device/refusal_proof.py ~/athan-device-sweep/session6b/refuse-off.logcat.txt`.
   Expected, on one line: `REFUSAL PROOF AS EXPECTED`. Anything starting `REFUSAL PROOF NOT AS EXPECTED`: section 2.2,
   item 10.
10. `python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session6b/refuse-after.png`, then
    spawn `vision` with the prompt `VISION_BELL` below. Expected answer: `SILENT`. The bell has come back on by
    itself, which is the owner's rule working. Any other answer: repeat items 7 to 10 once; still not `SILENT`:
    section 2.2, item 8.

The `vision` prompt `VISION_BELL`:

```text
Read the image at <path>. It is a screenshot of an Android phone running a prayer times app, showing a list of prayer
names with times and a bell icon at the right of each row. Look ONLY at the row whose name is Magrib. Answer with
exactly one word:
OFF if that row's icon is a bell with a diagonal line struck through it;
SILENT if that row's icon is a bell with NO line struck through it. The app's Silent glyph is a RINGING bell, so
short curved arcs beside the bell still mean SILENT;
SOUND if that row's icon is a loudspeaker rather than a bell;
OTHER if you cannot find a row named Magrib.
```

### 7.3 A call that never answers, and a phone that sleeps through it

This probes the limit the second design review raised: the fifteen seconds are wall time, so a process suspended
mid-commit could come back to a timer that has already fired (`PLAN.md` section 5.6).

1. Build its patch directory, then build:

   ```bash
   mkdir -p ~/athan-device-sweep/session6b/patch-hang/device
   cp ai/plans/06b-alert-all-or-nothing/device-patches/hang-once/device/notifications.ts.txt ~/athan-device-sweep/session6b/patch-hang/device/notifications.ts
   zsh ~/athan-device-sweep/session6b/bin/build-mock-patch.zsh <FINAL> ~/athan-device-sweep/session6b/mocks/simple.ts ~/athan-device-sweep/session6b/patch-hang ~/athan-device-sweep/session6b/build/athan-6b-hang.apk > $TMPDIR/build-hang-6b.log 2>&1
   ```

   Run the build in the background. Expected: `BUILD-MOCK-PATCH OK`.
2. Install it and cold launch it, as 7.2 items 3 and 4, with the label `hang-cold`.
3. Turn Magrib on, Silent: `tap 970 1274`, `wait 3`, `tap 540 1031`, `wait 2`, `key back`, `wait 10`.
4. Turn Magrib off, then leave the app at once: `tap 970 1274`, `wait 3`, `tap 248 1031`, `wait 2`, `key back`,
   `key home`.
5. `python3 ~/athan-device-sweep/session5/bin/devcheck.py wait 15` twice, then
   `python3 ~/athan-device-sweep/session5/bin/devcheck.py resume hang-back`, then `wait 10`.
6. `python3 ~/athan-device-sweep/session5/bin/devcheck.py logs hang-off`, copy
   `~/athan-device-sweep/session5/mockcheck/hang-off.logcat.txt` to `~/athan-device-sweep/session6b/`, and write in
   `LOG.md` every line it holds that contains `did not answer in 15000 ms`, `putting the prayer back`,
   `Marked a prayer to be put right`, or `ran out of time`.
7. `python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session6b/hang-after.png`, then
   spawn `vision` with `VISION_BELL`. Write the answer in `LOG.md`. **Both answers are a pass**: `SILENT` means the
   commit was put back as any other refusal, and `OFF` means the phone answered before the limit and the change
   stood. Anything else: section 2.2, item 8.

### 7.4 The phone left as the owner keeps it

1. `zsh ~/athan-device-sweep/session3/bin/build-mock.zsh <FINAL> ~/athan-device-sweep/session6b/mocks/simple.ts ~/athan-device-sweep/session6b/build/athan-6b-mock.apk > $TMPDIR/build-mock-6b.log 2>&1`,
   in the background. Expected: `BUILD-MOCK OK`.
2. Install it and cold launch it, as 7.2 items 3 and 4, with the label `final-mock`.
3. `adb -s 8f7ada76 shell dumpsys alarm > ~/athan-device-sweep/session6b/alarms-end.txt`, and write in `LOG.md` the
   count of `tag=*walarm*:expo.modules.notifications.NOTIFICATION_EVENT` lines it holds.
4. `adb -s 8f7ada76 shell settings get global auto_time`. Expected: `1`. It was never changed.
5. **Do not touch "Stay awake", do not lock the phone, and do not press HOME.** The owner keeps the 3T unlocked with
   Athan open and "Stay awake" on, always (decision 7). The last thing this plan does on the phone is the cold launch
   in item 2, which leaves Athan on screen.
6. Spawn `Reality Checker`, isolation `worktree`, no `model`, with this prompt:

   ```
   Run git checkout --detach <FINAL>.

   Read ai/plans/06b-alert-all-or-nothing/LOG.md and section 8's records text in
   ai/plans/06b-alert-all-or-nothing/PLAN.md. For every claim the records text makes about the OnePlus 3T, name the
   file under ~/athan-device-sweep/session6b/ that proves it, and say whether that file actually proves it. Read the
   alarm dumps and the logcat files yourself. Do not read any .png: you cannot see images, and the vision subagent's
   answers are quoted in LOG.md.

   Reply with one line per claim: "proven by <file>" or "NOT PROVEN: <why>". Then one line: "evidence holds" or
   "evidence does not hold".
   ```

   "evidence does not hold": STOP and give the owner each `NOT PROVEN` line in the Reality Checker's words.

## 8. Records

### 8.1 Findings text

Append this to `ai/features/uat-2/AUDIT-FINDINGS.md`, at the end of the file. Replace only the values named
`<LIKE_THIS>`, each with what this session measured.

**This is the pre-audit form of the note.** The audit of 2026-09-16 amended the appended text itself with two things
the template cannot produce: what `vision` actually described, and the timing it took off `hang-off2.logcat.txt`.
The note in `AUDIT-FINDINGS.md` is the one that shipped; this template is kept as the plan wrote it.

```markdown
# Session 6b of the queue: finding 81, 16 September 2026

The brief is `ai/prompts/alert-all-or-nothing.md`, planned by Claude in `ai/plans/06b-alert-all-or-nothing/PLAN.md`
and executed by GLM 5.3, with a GLM 5.3 Code Reviewer on every commit. The last code commit is `<FINAL_SHORT>`
(`<FINAL_VERSION>`), and the records commit that carries this note follows it; the last suite run reported
`Tests:       <TESTS_AFTER> passed, <TESTS_AFTER> total`, at 100% statements, branches, functions and lines.

## 81. CLOSED: an alert sheet change is all or nothing, in both directions

A refusal is now answered rather than thrown or swallowed. Both device clears report the identifiers the phone
refused; the store clears delete only the records of the cancels it took and keep the record of a refused cancel whose
alarm can still fire; the per-day schedulers say whether they were refused; and the multi-day schedulers no longer
clear the records before they start, so a day whose stored row cannot be read keeps its record with its alarm.

`commitPrayerAlertChange` replaces `updatePrayerNotifications`. It writes the saved settings, does the work, and on
any refusal or failure writes them back and applies them again inside the SAME lock acquisition: a second acquisition
was measured running behind whatever was already queued, which read the half-undone prayer and acted on it. A prayer
the phone refused carries a generation-stamped mark under `preference_notification_repair_*`, the one prefix both
cache wipes keep, and while it stands every launch, return to the app and background run runs the existing full
reschedule narrowed to the marked prayers, so the empty-cache bail, the day-change check and the sweep all still run.
An operation that finds the generation moved touches nothing: not the settings, not the alarms, not the mark.

A call into the notification system that has not answered in fifteen seconds is treated as refused (owner,
2026-09-16), which is what stops one silent native call holding the scheduling queue for the rest of the process. A
call given up on also reopens the twelve-hour gate, because it can still land afterwards and arm an alarm with no
record, which only the sweep can find. Start-up no longer loses its refresh to an Android channel it cannot create.

Proven by `stores/__tests__/notificationAlertCommit.test.ts` (25 tests over the nine combinations an alert sheet can
close on, both lists, and eight ways the phone can refuse), and by every break of step 2 failing its named tests.

On the 3T, on a local production build of `<FINAL_SHORT>`: turning Isha on Silent with its reminder armed exactly its
future athan and reminder instants, and turning it off cancelled exactly those and left the owner's other alarms
(`alarms-isha-on.txt`, `alarms-isha-off.txt`, checked by `isha_alarms.py` against the saved 2026 payload). On a
throwaway build whose first at-time cancel is refused, switching Magrib off put the bell back on by itself with its
alarm re-armed (`refuse-off.logcat.txt`, and the screenshot read by vision as `<VISION_REFUSE>`). On a second
throwaway build whose first cancel never answers, `<HANG_OUTCOME>`. Write
`<HANG_OUTCOME>` as `the app gave the call up as refused and put the change back, exactly as any other refusal` when
vision answered `SILENT` in section 7.3, and as `the phone answered before the limit, so the change stood` when it
answered `OFF`. Neither throwaway build was committed or merged: the build script copies the patched
file into its own detached worktree and restores it afterwards.

Two limits are written down rather than fixed (`ai/plans/06b-alert-all-or-nothing/PLAN.md` section 5.6): six serial
fifteen-second limits can hold the lock for ninety seconds in the worst case, and `commitSoundSelection` still
restores its preference without its alarms, which is its own session.

## State left behind

The 3T runs the mock build of `<FINAL_SHORT>` with the Asr-next mock data, unlocked, with Athan open and "Stay awake"
on, and automatic time never moved. Nothing was built on or pushed to EAS, and `releases.json` is untouched. The
evidence is in `~/athan-device-sweep/session6b/`.
```

### 8.2 Table rows

The executor sets the `ai/plans/README.md` row 2 status to EXECUTED and leaves everything else in that row alone.

The exact new text of the `ai/prompts/README.md` row for session 6b, for the auditor to apply on PASS:

```markdown
| 6b | **An alert sheet change is all or nothing, both directions**: finding 81, with the sturdier design the first design review asked for, reviewed again before building | `alert-all-or-nothing.md` | **DONE** 16 September 2026, <FIRST_VERSION> to <FINAL_VERSION>: a refusal is answered rather than thrown, a failed change puts the bell and the alarms back inside the same lock acquisition, and a prayer the phone refuses is marked and put right on the next launch or return; a notification call that does not answer in fifteen seconds counts as refused; proven on the 3T with a throwaway build that forces the refusal |
```

### 8.3 Docs commit

The version is the next patch after `uat-2`'s, from the same command both steps use:

```bash
node -e "const v=require('./package.json').version.split('.');v[2]=Number(v[2])+1;console.log(v.join('.'))"
```

Then `EXECUTOR-BRIEF.md` section 4b, with this message:

```
<VERSION> - docs(plans): session 6b executed: an alert sheet change is all or nothing

Finding 81 is closed: a refusal is answered rather than thrown or swallowed, a
failed change puts the saved settings and the alarms back inside the same lock
acquisition, and a prayer the phone refused is marked and put right on the next
launch, return to the app or background run.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after a
PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### 10.1 Symptom table

`EXECUTOR-BRIEF.md` section 7 holds the general table. These are this session's own risks.

| Symptom | Cause | Action |
| --- | --- | --- |
| `anchor-check.sh` prints `file <path> CHANGED since the plan was written` | Something merged into `uat-2` after this plan was written touches a file it replaces | NEEDS REPLAN: section 2.2, item 1 |
| `anchor-check.sh` prints `file <path> EXISTS but the plan creates it` | A previous, part-finished run of this step left the file behind | Restore the tree as section 10.3 says for that step, then run the anchor check again |
| Step 1's red run finishes in under a minute | The tests did not reach the code they guard | STOP: section 2.2, item 2. Ten of them must fail through Jest's ten-second timeout |
| Step 1's red run holds an `unhandled rejection` failure | An expectation was taken after the clock moved rather than before it | The saved test files take each expectation BEFORE `advanceTimersByTimeAsync`. Copy them again from `files/step1/` and rerun |
| `jest` reports `2 skipped` in the totals | `shared/__tests__/audioMatrix.test.ts` skips its two bundle checks when `android/` and `ios/` are absent, which happens only in a worktree | Expected in a reviewer's worktree, never in the main checkout. Not a finding |
| A break prints `BREAK NOT APPLIED` | The file no longer holds the text the break substitutes | NEEDS REPLAN: section 2.2, item 1 |
| A break prints `BREAK NOT CAUGHT` | A decision has no test guarding it | STOP: section 2.2, item 5 |
| A `.break-backup` file is left in `git status` | A break script was interrupted | `mv <file>.break-backup <file>` for each, then run the break script again |
| `yarn validate` reports coverage below 100% | A test was lost in a copy | STOP and ask. Never add an ignore comment |
| `build-mock-patch.zsh` prints `patch directory holds no files`, or `patch directory must not be under /tmp or inside the repo` | The patch directory was given as a path inside the repository | The build script takes only a directory outside the repository: use `~/athan-device-sweep/session6b/patch-refuse` or `~/athan-device-sweep/session6b/patch-hang`, built by the `mkdir` and `cp` in sections 7.2 and 7.3 |
| `build-mock-patch.zsh` prints `<sha> does not track device/notifications.ts` | The `<FINAL>` sha is wrong | Run `git rev-parse uat-2` again and use that |
| The patched worktree is left dirty | The build was interrupted between the copy and the restore | Run `git -C ~/athan-device-sweep/worktrees/mock-patch-build checkout -- device/notifications.ts mocks/simple.ts`, then build again |
| `refusal_proof.py` says the undo was refused as well | The patched build refused more than one cancel | Cold launch it again (`devcheck.py cold`), which resets the count, and repeat section 7.2 items 4 to 8 once. A second time: section 2.2, item 10 |
| The 3T's screen is off when a screenshot is taken | Something turned "Stay awake" off | STOP: section 2.2, item 12. Do not change the setting yourself |

### 10.2 Anticipated review fixes

These are the only fixes the executor may make without asking. Each is given word for word. Anything else a reviewer
asks for is section 2.2, item 4.

1. **"The commit message's `<VERSION>` was not replaced."** Amend the commit with the same message, with `<VERSION>`
   replaced by the version `package.json` holds.
2. **"`app.json`, `package.json` and `android/app/build.gradle` do not all hold the same version."** Set all three to
   the version `package.json` holds, and amend the commit with `app.json` and `package.json` added.
3. **"A file in the commit is not in the step's file list."** If it is `android/app/build.gradle`, remove it from the
   commit: it is gitignored and is never added. Any other file: STOP.
4. **"A `.break-backup` file is in the commit."** Remove it from the commit and delete it.
5. **"The reviewer cannot find `ai/plans/06b-alert-all-or-nothing/PLAN.md` in its worktree."** Reply to the same
   reviewer with SendMessage: "Run `git checkout --detach <sha>` first, as the prompt says; the plan is in the
   repository at that commit."
6. **"Step 2 removes tests from `hooks/__tests__/useNotification.test.ts`."** Reply to the same reviewer with
   SendMessage, word for word: "That is the change this step makes, and the plan gives it: see
   `ai/plans/06b-alert-all-or-nothing/PLAN.md` section 4.4's row for that suite. What those tests proved about the
   preferences and the scheduling is now proved against the real store in
   `stores/__tests__/notificationAlertCommit.test.ts`, and the hook's own tests are what the hook still does. Coverage
   is 100% on all four measures. Please review it on that basis."
7. **"A call into expo-notifications is not wrapped: `updateAndroidChannel` in `device/notifications.ts`."** Reply to
   the same reviewer with SendMessage, word for word: "That call runs outside the scheduling lock, from
   `commitSoundSelection` only, so it cannot hold the queue. The athan sound change is its own session by the owner's
   decision of 2026-09-15, recorded as decision 17 in `ai/plans/06b-alert-all-or-nothing/PLAN.md`. Please review the
   calls inside the lock."

### 10.3 Stopping part-way

`EXECUTOR-BRIEF.md` section 4a, with these files.

**Step 1.** Restore: `git checkout -- shared/notifications.ts device/notifications.ts stores/notifications.ts stores/__tests__/notificationSchedulingLock.test.ts app.json package.json`.
Delete: `shared/__tests__/notificationNativeTimeout.test.ts`, `device/__tests__/notificationNativeTimeout.test.ts`,
`stores/__tests__/notificationGateReopenFailure.test.ts`.

**Step 2.** Restore: `git checkout -- device/notifications.ts stores/notifications.ts stores/database.ts hooks/useNotification.ts device/__tests__/notificationNativeTimeout.test.ts device/__tests__/reminderCancelFailure.test.ts stores/__tests__/notificationOffCancelFailure.test.ts stores/__tests__/notificationSchedulingLock.test.ts stores/__tests__/notificationSinglePrayerUpdate.test.ts stores/__tests__/notifications.test.ts hooks/__tests__/useNotification.test.ts app.json package.json`.
Delete: `stores/__tests__/notificationAlertCommit.test.ts`.

**Step 3, the device proof.** Nothing in the repository changes. On the phone: install the mock build of `<FINAL>`
(section 7.4) so it is not left on a throwaway build, and leave it unlocked with Athan open.

## 11. Subagents in this plan

Only these, and no `model` is ever passed: the executor's subagents run on GLM.

| Step | Agent type | Model | Isolation | Why | Its prompt |
| --- | --- | --- | --- | --- | --- |
| 1 | `Code Reviewer` | GLM 5.3 | `worktree` | Every commit is reviewed before its merge | `steps/1-native-call-timeout.md`, part 9 |
| 2 | `Code Reviewer` | GLM 5.3 | `worktree` | The same | `steps/2-all-or-nothing.md`, part 9 |
| 7.2 | `vision` | GLM 5.3 Flash | none | The executor cannot see images, and the bell coming back on is the proof | `PLAN.md` section 7.2, `VISION_BELL` |
| 7.3 | `vision` | GLM 5.3 Flash | none | The same | `PLAN.md` section 7.2, `VISION_BELL` |
| 7.4 | `Reality Checker` | GLM 5.3 | `worktree` | Does the evidence prove each claim the records text makes? | `PLAN.md` section 7.4, item 6 |
| 8 | `Code Reviewer` | GLM 5.3 | `worktree` | The `executed` docs commit | `EXECUTOR-BRIEF.md` section 4b, item 5 |

## 12. Report to the owner

The final message. Start it with `🤖  Model: GLM 5.3 (execution session)` and, on the next line, `Time: ` followed by
the output of `date '+%H:%M:%S %d.%m.%Y'`, run before writing it.

Say, in a few plain sentences:

- that an alert sheet change is now all or nothing: when the phone refuses any part of it, the bell and the alarms both
  go back to what they were, and when it refuses that too, the prayer is put right on the next launch or return to the
  app;
- that a call into the notification system that has not answered in fifteen seconds now counts as refused, which is
  what the owner chose on 2026-09-16;
- what the 3T showed: whether Isha armed and cancelled exactly its own instants on the production build, and what the
  forced-refusal build did when Magrib was switched off;
- the two limits section 5.6 records, in one sentence: a hang can hold the scheduling queue for up to ninety seconds
  before it gives up, and the athan sound change still restores its preference without its alarms, which is its own
  session;
- that the phone is on the mock build of the final commit, unlocked, with Athan open and "Stay awake" on.

Then the progress table, in `EXECUTOR-BRIEF.md` section 6's format, with a row for each step, each review, the device
proof and the records commit. Then a line `**<done>/<total> done.**`, then a line naming each row of
`ai/plans/README.md` still to run with its status.

End with the audit prompt from `ai/plans/README.md`, started with `claude-plan`:

```
Audit session (start with claude-plan). Read ai/plans/AUDITOR-BRIEF.md and audit ai/plans/06b-alert-all-or-nothing/PLAN.md.
```
