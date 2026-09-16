# Step 2: an alert sheet change is all or nothing, in both directions

Every file this step writes is saved, finished, under `ai/plans/06b-alert-all-or-nothing/files/step2/`, mirroring the
repository's own paths, each with a `.txt` suffix so that jest, tsc and Biome leave them alone. Copy them; do
not type the code.

0. **Anchor check.** From `/Users/muji/repos/rn.athan.uk`:

   ```bash
   bash ai/plans/06b-alert-all-or-nothing/scripts/anchor-check.sh 2
   ```

   Expected last line: `ANCHORS OK`. `ANCHORS NEEDS REPLAN` means the plan is out of date (`PLAN.md` section 2.2,
   item 1).

1. **Goal:** when the phone refuses or fails any part of an alert sheet change, the saved settings AND the alarms go
   back to what they were, inside the same lock acquisition; when it refuses that too, the prayer is marked, and the
   next launch, return to the app or background run applies its saved settings again, even though the twelve-hour gate
   is shut.

2. **Branch:**

   ```bash
   git checkout -b fix/audit-81-all-or-nothing uat-2
   ```

3. **Files.** Exactly these, and nothing else apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`:

   - `shared/notifications.ts` is NOT changed by this step
   - `device/notifications.ts`
   - `stores/notifications.ts`
   - `stores/database.ts`
   - `hooks/useNotification.ts`
   - `stores/__tests__/notificationAlertCommit.test.ts` (new)
   - `device/__tests__/notificationNativeTimeout.test.ts`
   - `device/__tests__/reminderCancelFailure.test.ts`
   - `stores/__tests__/notificationOffCancelFailure.test.ts`
   - `stores/__tests__/notificationSchedulingLock.test.ts`
   - `stores/__tests__/notificationSinglePrayerUpdate.test.ts`
   - `stores/__tests__/notifications.test.ts`
   - `hooks/__tests__/useNotification.test.ts`
   - `app.json`, `package.json` (the version), and `android/app/build.gradle`, which is gitignored and never added

4. **Tests first (red).** Copy only the tests:

   ```bash
   F=ai/plans/06b-alert-all-or-nothing/files/step2
   cp $F/stores/__tests__/notificationAlertCommit.test.ts.txt stores/__tests__/notificationAlertCommit.test.ts
   cp $F/device/__tests__/notificationNativeTimeout.test.ts.txt device/__tests__/notificationNativeTimeout.test.ts
   cp $F/device/__tests__/reminderCancelFailure.test.ts.txt device/__tests__/reminderCancelFailure.test.ts
   cp $F/stores/__tests__/notificationOffCancelFailure.test.ts.txt stores/__tests__/notificationOffCancelFailure.test.ts
   cp $F/stores/__tests__/notificationSchedulingLock.test.ts.txt stores/__tests__/notificationSchedulingLock.test.ts
   cp $F/stores/__tests__/notificationSinglePrayerUpdate.test.ts.txt stores/__tests__/notificationSinglePrayerUpdate.test.ts
   cp $F/stores/__tests__/notifications.test.ts.txt stores/__tests__/notifications.test.ts
   cp $F/hooks/__tests__/useNotification.test.ts.txt hooks/__tests__/useNotification.test.ts
   ```

   Run them, path first:

   ```bash
   npx jest stores/__tests__/notificationAlertCommit.test.ts stores/__tests__/notificationOffCancelFailure.test.ts device/__tests__/reminderCancelFailure.test.ts device/__tests__/notificationNativeTimeout.test.ts stores/__tests__/notificationSchedulingLock.test.ts stores/__tests__/notificationSinglePrayerUpdate.test.ts hooks/__tests__/useNotification.test.ts stores/__tests__/notifications.test.ts --watchman=false --selectProjects=unit
   ```

   **This red run takes about fifteen seconds.** Expected, exactly:

   ```
   Test Suites: 8 failed, 8 total
   Tests:       74 failed, 185 passed, 259 total
   ```

   Four of the suites fail to compile at all, because `commitPrayerAlertChange` is not exported yet; the other four
   fail on the behaviour this step adds. If the totals differ, STOP (`PLAN.md` section 2.2, items 2 and 3).

5. **Change.** Copy the four production files:

   ```bash
   F=ai/plans/06b-alert-all-or-nothing/files/step2
   cp $F/device/notifications.ts.txt device/notifications.ts
   cp $F/stores/notifications.ts.txt stores/notifications.ts
   cp $F/stores/database.ts.txt stores/database.ts
   cp $F/hooks/useNotification.ts.txt hooks/useNotification.ts
   ```

   What those files now hold, so the review has it in words:

   - `stores/database.ts` gains `removeOneScheduledNotificationForPrayer` and `removeOneScheduledReminderForPrayer`,
     so a prayer's records can be deleted one identifier at a time instead of by prefix.
   - `device/notifications.ts`: both clears cancel every recorded identifier with `Promise.allSettled`, log each
     refusal, and RESOLVE with the identifiers the phone refused. Neither throws, and neither swallows.
   - `stores/notifications.ts`:
     - `canStillFire(record)` is `record.date >= today`;
     - `ScheduleAttempt` and `SKIPPED_DAY`, so a day's result says both what it tried and whether it was refused;
     - eleven repair marks, built once at module evaluation, under `preference_notification_repair_<type>_<name>`,
       with `markPrayerForRepair` (stored value plus one), `prayerRepairGeneration`, `clearPrayerRepairMark` (which
       uses `resetStoredAtom`, so the key goes too), `markedPrayers()` and `onlyThesePrayers()`;
     - the store clears delete only the records of cancels the phone took, keep the record of a refused cancel whose
       alarm can still fire, and answer with how many of those there were;
     - `_cancelStaleNotificationIds` answers with the identifiers the phone refused;
     - `_addMultipleSchedule*ForPrayer` no longer clear the records first; they delete and stale-cancel only what this
       pass did not attempt, and answer with the refusals that can still fire;
     - `applyPrayerAlerts`, `applyPrayerPreferences`, `undoPrayerAlertChange` and `commitPrayerAlertChange`, which
       replaces `updatePrayerNotifications`;
     - `_addAllSchedule*ForSchedule` take an optional filter and answer per prayer, with `null` for a prayer the pass
       did not look at;
     - `settlePrayerRepairMarks`, and `_rescheduleAllNotifications` reading each prayer's generation inside the lock
       before any work;
     - `refreshNotifications` runs the same reschedule, narrowed to the marked prayers, when the gate is shut and a
       mark exists, and does not stamp the gate for it.
   - `hooks/useNotification.ts`: `commitAlertMenuChanges` keeps the change detection, the permission check and the log,
     and hands both states to `commitPrayerAlertChange`. The preference writes and the rollback have moved into the
     store, with the comment about the deliberate absence of an error haptic.

6. **Green.** The same command as part 4. Expected, exactly:

   ```
   Test Suites: 8 passed, 8 total
   Tests:       259 passed, 259 total
   ```

   Then:

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Both exit 0. Biome prints `Checked 324 files in <n>ms. No fixes applied.`

7. **Breaks.**

   Run it from `/Users/muji/repos/rn.athan.uk`: every path inside it is relative to that directory, and from anywhere
   else every break prints `BREAK NOT APPLIED`.

   ```bash
   cp ai/plans/06b-alert-all-or-nothing/scripts/breaks-step2.sh $TMPDIR/breaks-6b-2.sh
   bash $TMPDIR/breaks-6b-2.sh
   ```

   It takes about a minute. Expected last two lines:

   ```
   breaks caught: 17 of 17
   ALL AS EXPECTED: 1
   ```

   Then `git status --porcelain` must list only this step's files and the three plan files. A `.break-backup` file in
   that list means a break did not restore: STOP.

8. **Version and commit.**

   ```bash
   node -e "const v=require('./package.json').version.split('.');v[2]=Number(v[2])+1;console.log(v.join('.'))"
   ```

   Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Then:

   ```bash
   git add device/notifications.ts stores/notifications.ts stores/database.ts hooks/useNotification.ts \
     stores/__tests__/notificationAlertCommit.test.ts device/__tests__/notificationNativeTimeout.test.ts \
     device/__tests__/reminderCancelFailure.test.ts stores/__tests__/notificationOffCancelFailure.test.ts \
     stores/__tests__/notificationSchedulingLock.test.ts stores/__tests__/notificationSinglePrayerUpdate.test.ts \
     stores/__tests__/notifications.test.ts hooks/__tests__/useNotification.test.ts \
     app.json package.json \
     ai/plans/README.md ai/plans/06b-alert-all-or-nothing/PLAN.md ai/plans/06b-alert-all-or-nothing/LOG.md
   ```

   Write this to `$TMPDIR/msg-6b-2.txt`, with `<VERSION>` replaced by the version the command printed:

   ```
   <VERSION> - fix(notifications): an alert sheet change is all or nothing, in both directions

   Switching a prayer Off sent every cancel and then failed on the refused one.
   The at-time records were kept, every reminder was cancelled and its record
   deleted, and the hook wrote the original alert back: the bell said Sound while
   the alarms behind it were gone, and the twelve-hour gate stopped the app
   noticing for half a day. Turning a prayer on had the mirror gap, restoring only
   the preference while alarms that did arm stayed armed under a bell saying Off.
   Finding 81.

   A refusal is now a value, not an exception. Both device clears answer with the
   identifiers the phone refused; the store clears delete only the records of the
   cancels it took and keep the record of a refused cancel whose alarm can still
   fire, which is the only way back to it; the per-day schedulers say whether they
   were refused; and the multi-day schedulers stop clearing the records before
   they start, so a day whose stored row cannot be read keeps its record with its
   alarm.

   commitPrayerAlertChange replaces updatePrayerNotifications. It writes the saved
   settings, does the work, and on any refusal or failure writes them back and
   applies them again, inside the SAME lock acquisition: the queue would otherwise
   run whatever was waiting in front of the undo, which was measured happening.

   A prayer the phone refused carries a generation-stamped repair mark under
   preference_notification_repair_*, the one prefix both cache wipes keep. While a
   mark stands, every launch, return to the app and background run runs the
   existing full reschedule narrowed to the marked prayers, so the empty-cache
   bail, the day-change check and the sweep all still run, at about a tenth of a
   full pass (owner, 2026-09-16). An operation that finds the generation moved
   touches nothing: not the settings, not the alarms, not the mark.

   Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
   ```

   ```bash
   git commit -F $TMPDIR/msg-6b-2.txt
   ```

   Run it in the background with its log (`EXECUTOR-BRIEF.md` section 3). In that log, the last `Tests:` line reads
   `Tests:       4501 passed, 4501 total` and four `100%` coverage lines are present.

9. **Review.** Spawn `Code Reviewer`, isolation `worktree`, no `model`, with exactly this prompt:

   ```
   Run git checkout --detach <sha>.

   Review this one commit. It makes an alert sheet change all or nothing in both directions: when the phone refuses or
   fails any part of it, the saved settings and the alarms both go back, inside the same scheduling-lock acquisition;
   when it refuses that too, the prayer is marked and the next launch or return to the app applies its saved settings
   again.

   Read in full: stores/notifications.ts, device/notifications.ts, stores/database.ts, hooks/useNotification.ts,
   stores/__tests__/notificationAlertCommit.test.ts, stores/__tests__/notificationOffCancelFailure.test.ts,
   device/__tests__/reminderCancelFailure.test.ts, hooks/__tests__/useNotification.test.ts, and
   ai/plans/06b-alert-all-or-nothing/PLAN.md sections 1 to 5.

   The owner's rule, which the commit must keep absolutely: what fires always equals what the bell shows. Off fires
   nothing, Silent fires silently, Sound fires with sound. No state is allowed to wait for "the next refresh".

   Check:
   - the undo runs inside the acquisition that failed, never as a second one;
   - the saved settings are written at-time first, in the commit's own order, everywhere they are written;
   - an operation that finds a prayer's generation changed touches nothing: not the settings, not the alarms, not the
     mark;
   - the marks are eleven atoms built once at module evaluation, read with store.get and cleared with resetStoredAtom,
     never by a key scan and never with a bare database.set;
   - a refusal is counted only when the alarm it names can still fire, and a spent record is dropped;
   - the record of a refused cancel is kept, and the record of a cancel the phone took is deleted;
   - the repair runs the full reschedule narrowed to the marked prayers, so the empty-cache bail, the day-change check
     and the sweep all still run, and it does not stamp the twelve-hour gate;
   - hooks/useNotification.ts no longer writes or rolls back any preference;
   - comments explain why, never what;
   - nothing else changed: no visual, no prayer time, no releases.json, no EAS.

   Reply with numbered findings, then one line: "merge" or "fix first".
   ```

   A "merge" verdict means go on. A "fix first" verdict: apply only a fix `PLAN.md` section 10 gives word for word;
   anything else is a STOP.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff fix/audit-81-all-or-nothing -m "Merge fix/audit-81-all-or-nothing into uat-2: an alert sheet change is all or nothing, reviewed"
    ```

11. **Done when:**

    ```bash
    git log --oneline -1 uat-2
    npx jest stores/__tests__/notificationAlertCommit.test.ts stores/__tests__/notificationOffCancelFailure.test.ts device/__tests__/reminderCancelFailure.test.ts device/__tests__/notificationNativeTimeout.test.ts stores/__tests__/notificationSchedulingLock.test.ts stores/__tests__/notificationSinglePrayerUpdate.test.ts hooks/__tests__/useNotification.test.ts stores/__tests__/notifications.test.ts --watchman=false --selectProjects=unit
    ```

    The first prints the merge commit. The second prints `Tests:       259 passed, 259 total`.
