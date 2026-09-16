# Step 1: a call into the notification system answers within fifteen seconds

Every file this step writes is saved, finished, under `ai/plans/06b-alert-all-or-nothing/files/step1/`, mirroring the
repository's own paths, each with a `.txt` suffix so that jest, tsc and Biome leave them alone. Copy them; do
not type the code.

0. **Anchor check.** From `/Users/muji/repos/rn.athan.uk`:

   ```bash
   bash ai/plans/06b-alert-all-or-nothing/scripts/anchor-check.sh 1
   ```

   Expected last line: `ANCHORS OK`. `ANCHORS NEEDS REPLAN` means the plan is out of date (`PLAN.md` section 2.2,
   item 1).

1. **Goal:** every call into the notification system that the scheduling queue can wait on, and every Android channel
   call start-up waits on, is given fifteen seconds, after which it is treated as refused; a start-up whose channel
   work fails still refreshes; an operation that fails before its own work begins no longer stops the queue for the
   rest of the process; and a call given up on reopens the twelve-hour gate, so the next foreground sweeps.

2. **Branch:**

   ```bash
   git checkout -b fix/audit-81-native-call-timeout uat-2
   ```

3. **Files.** Exactly these, and nothing else apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`:

   - `shared/notifications.ts`
   - `device/notifications.ts`
   - `stores/notifications.ts`
   - `stores/__tests__/notificationSchedulingLock.test.ts`
   - `shared/__tests__/notificationNativeTimeout.test.ts` (new)
   - `device/__tests__/notificationNativeTimeout.test.ts` (new)
   - `stores/__tests__/notificationGateReopenFailure.test.ts` (new)
   - `app.json`, `package.json` (the version), and `android/app/build.gradle`, which is gitignored and never added

4. **Tests first (red).** Copy only the tests:

   ```bash
   F=ai/plans/06b-alert-all-or-nothing/files/step1
   cp $F/shared/__tests__/notificationNativeTimeout.test.ts.txt shared/__tests__/notificationNativeTimeout.test.ts
   cp $F/device/__tests__/notificationNativeTimeout.test.ts.txt device/__tests__/notificationNativeTimeout.test.ts
   cp $F/stores/__tests__/notificationGateReopenFailure.test.ts.txt stores/__tests__/notificationGateReopenFailure.test.ts
   cp $F/stores/__tests__/notificationSchedulingLock.test.ts.txt stores/__tests__/notificationSchedulingLock.test.ts
   ```

   Run them, path first:

   ```bash
   npx jest shared/__tests__/notificationNativeTimeout.test.ts device/__tests__/notificationNativeTimeout.test.ts stores/__tests__/notificationGateReopenFailure.test.ts stores/__tests__/notificationSchedulingLock.test.ts --watchman=false --selectProjects=unit
   ```

   **This red run takes about a hundred seconds**, because ten of the tests wait on a promise that today never settles
   and fail through Jest's own ten-second timeout. Expect exactly this, and nothing else:

   ```
   Test Suites: 4 failed, 4 total
   Tests:       18 failed, 7 passed, 25 total
   ```

   Made up of:

   - `shared/__tests__/notificationNativeTimeout.test.ts`: all 8 of its tests fail, the first with
     `TypeError: (0 , _notifications.withNativeTimeout) is not a function`, because `withNativeTimeout` is not
     exported yet.
   - `device/__tests__/notificationNativeTimeout.test.ts`: all 7 tests fail with
     `thrown: "Exceeded timeout of 10000 ms for a test.`
   - `stores/__tests__/notificationGateReopenFailure.test.ts`: its 1 test fails the same way.
   - `stores/__tests__/notificationSchedulingLock.test.ts`: the 2 new tests fail the same way; the 7 that were already
     there pass.

   If any other test fails, or any of these passes, STOP (`PLAN.md` section 2.2, items 2 and 3).

5. **Change.** Copy the three production files:

   ```bash
   F=ai/plans/06b-alert-all-or-nothing/files/step1
   cp $F/shared/notifications.ts.txt shared/notifications.ts
   cp $F/device/notifications.ts.txt device/notifications.ts
   cp $F/stores/notifications.ts.txt stores/notifications.ts
   ```

   What those files now hold, so the review has it in words:

   - `shared/notifications.ts`: `NATIVE_CALL_TIMEOUT_MS` (15000, not exported), a module latch `nativeCallTimedOut`
     with `takeNativeCallTimedOut()`, and `withNativeTimeout(work, description)`, which races the call against a timer,
     rejects with `NOTIFICATION SYSTEM: <description> did not answer in 15000 ms`, and clears the timer in a `finally`.
     All five `setNotificationChannelAsync` and `deleteNotificationChannelAsync` calls go through it.
     `initializeNotifications` now wraps its three channel calls in their own try/catch and carries on, because a
     channel decides how a notification sounds, never whether it fires.
   - `device/notifications.ts`: both `scheduleNotificationAsync` calls and all three
     `cancelScheduledNotificationAsync` calls go through `withNativeTimeout`. The channel calls are plain awaits again,
     because each bounds its own call one level down.
   - `stores/notifications.ts`: `withSchedulingLock` keeps its log line and all four perf marks, measures in a
     `finally`, stays `async`, and sets `schedulingQueue = run.then(() => undefined, () => undefined)` so a failure
     never leaves the queue rejected; when its operation settles it reads the latch once and, if a call ran out of
     time, calls the new `reopenNotificationRefreshGate()`. The sweep's `getAllScheduledNotificationsAsync` goes
     through `withNativeTimeout`.

6. **Green.** The same command as part 4. Expected, exactly:

   ```
   Test Suites: 4 passed, 4 total
   Tests:       25 passed, 25 total
   ```

   Then:

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Both exit 0. Biome prints `Checked 323 files in <n>ms. No fixes applied.`

7. **Breaks.**

   Run it from `/Users/muji/repos/rn.athan.uk`: every path inside it is relative to that directory, and from anywhere
   else every break prints `BREAK NOT APPLIED`.

   ```bash
   cp ai/plans/06b-alert-all-or-nothing/scripts/breaks-step1.sh $TMPDIR/breaks-6b-1.sh
   bash $TMPDIR/breaks-6b-1.sh
   ```

   It takes about three minutes. Expected last two lines:

   ```
   breaks caught: 11 of 11
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
   git add shared/notifications.ts device/notifications.ts stores/notifications.ts \
     shared/__tests__/notificationNativeTimeout.test.ts device/__tests__/notificationNativeTimeout.test.ts \
     stores/__tests__/notificationGateReopenFailure.test.ts stores/__tests__/notificationSchedulingLock.test.ts \
     app.json package.json \
     ai/plans/README.md ai/plans/06b-alert-all-or-nothing/PLAN.md ai/plans/06b-alert-all-or-nothing/LOG.md
   ```

   Write this to `$TMPDIR/msg-6b-1.txt`, with `<VERSION>` replaced by the version the command printed:

   ```
   <VERSION> - fix(notifications): a call into the notification system answers within fifteen seconds

   expo-notifications' Android service answers through a ResultReceiver that is
   sent only from its catch of Exception, so an Error on the worker thread, or a
   receiver that has gone, leaves the promise pending for ever. Since finding 82
   the scheduling queue waits for every piece of work it started, so one such call
   held the queue for the rest of the process: no alert sheet change, no refresh
   and no background run armed or cancelled anything again, while the bell already
   showed what the user picked.

   withNativeTimeout races each call against fifteen seconds (owner, 2026-09-16)
   and rejects with what the call was doing. Every call the queue can wait on is
   wrapped: both arms, all three cancels, the sweep's list of pending
   notifications, and all five Android channel calls. A call given up on can still
   land afterwards and arm an alarm with no record, which only the sweep can find,
   so it reopens the twelve-hour gate.

   Start-up no longer loses its refresh to a channel it cannot create. A channel
   decides how a notification sounds, never whether it fires, and
   initializeNotifications awaits all three before it checks the permission and
   refreshes, so a failure there cost the launch refresh and the resume refresh
   outright.

   The lock's own chain no longer carries a failure into the queue. It logs its
   start line outside the try, so a logger that threw left schedulingQueue
   rejected, every later .then(onFulfilled) skipped its callback, and nothing was
   ever armed again in that process.

   Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
   ```

   ```bash
   git commit -F $TMPDIR/msg-6b-1.txt
   ```

   Run it in the background with its log (`EXECUTOR-BRIEF.md` section 3). In that log, the last `Tests:` line reads
   `Tests:       4512 passed, 4512 total` and four `100%` coverage lines are present.

9. **Review.** Spawn `Code Reviewer`, isolation `worktree`, no `model`, with exactly this prompt:

   ```
   Run git checkout --detach <sha>.

   Review this one commit. It gives every call into expo-notifications a fifteen-second limit, after which the call is
   treated as refused; lets start-up carry on when an Android channel cannot be created; stops an operation that fails
   before its own work begins from leaving the scheduling queue permanently rejected; and reopens the twelve-hour
   refresh gate when a call has been given up on.

   Read in full: shared/notifications.ts, device/notifications.ts, stores/notifications.ts,
   shared/__tests__/notificationNativeTimeout.test.ts, device/__tests__/notificationNativeTimeout.test.ts,
   stores/__tests__/notificationGateReopenFailure.test.ts, stores/__tests__/notificationSchedulingLock.test.ts, and
   ai/plans/06b-alert-all-or-nothing/PLAN.md sections 1 to 5.

   Check:
   - every call into expo-notifications that runs inside the scheduling lock is wrapped, and each is wrapped exactly
     once, at one level only;
   - withNativeTimeout can never leave a timer armed, and can never produce an unhandled rejection;
   - the new scheduling-queue chain runs operations in the same order as before, keeps every log line and perf mark,
     and keeps the queue fulfilled whatever an operation did;
   - a start-up that loses a channel still reaches the refresh;
   - the tests would fail if the limit, the race, the queue's catch or the gate reopen were removed;
   - comments explain why, never what;
   - nothing else changed: no visual, no prayer time, no releases.json, no EAS.

   Reply with numbered findings, then one line: "merge" or "fix first".
   ```

   A "merge" verdict means go on. A "fix first" verdict: apply only a fix `PLAN.md` section 10 gives word for word;
   anything else is a STOP.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff fix/audit-81-native-call-timeout -m "Merge fix/audit-81-native-call-timeout into uat-2: a notification call answers within fifteen seconds, reviewed"
    ```

11. **Done when:**

    ```bash
    git log --oneline -1 uat-2
    npx jest shared/__tests__/notificationNativeTimeout.test.ts device/__tests__/notificationNativeTimeout.test.ts stores/__tests__/notificationGateReopenFailure.test.ts stores/__tests__/notificationSchedulingLock.test.ts --watchman=false --selectProjects=unit
    ```

    The first prints the merge commit. The second prints `Tests:       25 passed, 25 total`.
