# Step 4: Delete seven dead symbols in `stores/database.ts` and `stores/notifications.ts`

0. **Anchor check:** run `bash $TMPDIR/preflight-34.sh 4`. Anchors `4-1`, `4-2`, `4-3` and `4-4` must
   each print `1`. Any other count, or `EMPTY ANCHOR`, means NEEDS REPLAN.

1. **Goal:** `mmkvStorage`, the four `clearAllScheduled*` wrappers, `unregisterBackgroundTask` and
   `getBackgroundTaskStatus` leave the tree, and the bulk-wipe guard gets stronger rather than weaker.

2. **Branch:** `git checkout -b chore/34-database-and-notifications uat-2`

3. **Files:**
   - `stores/database.ts`, `stores/notifications.ts`
   - `stores/__tests__/database.test.ts`, `stores/__tests__/notifications.test.ts`
   - `app.json`, `package.json`
   - `ai/plans/README.md`, `ai/plans/34-dead-code-sweep/PLAN.md`, `ai/plans/34-dead-code-sweep/LOG.md`

4. **Tests first (red).** Make the production edits of part 5 first, then run:

   ```bash
   npx tsc --noEmit
   ```

   **Expected: 7 errors**, four `TS2724` on `stores/__tests__/database.test.ts` lines 20 to 23 naming
   the four wrappers, two `TS2769` on `stores/__tests__/notifications.test.ts` lines 1334 and 1335
   (the `jest.spyOn` calls), and two `TS2305`/`TS2724` on that same file's lines 44 and 62 naming
   `getBackgroundTaskStatus` and `unregisterBackgroundTask`. `mmkvStorage` produces no error, because
   nothing referenced it.

   If `tsc` names a file this plan does not list, STOP (`PLAN.md` section 2.2, item 3).

   | Suite | Change | What it proves after |
   | --- | --- | --- |
   | `stores/__tests__/database.test.ts` | remove the four names from the import clause, and delete their four `describe` blocks | unchanged for every other database function |
   | `stores/__tests__/notifications.test.ts` | remove `getBackgroundTaskStatus` and `unregisterBackgroundTask` from the import clause, delete their two `describe` blocks, and repoint the bulk-wipe guard onto `clearPrefix` | the guard proves MORE: see below |

   **The bulk-wipe guard, and why the repoint strengthens it.** The test
   `never bulk-cancels or bulk-wipes during a global reschedule` spies on two of the deleted
   wrappers. All four wrapped one primitive, `Database.clearPrefix`, and after this step that
   primitive has exactly ONE production caller (`stores/sync.ts`, wiping a year of prayer data). So
   spying on `clearPrefix` catches a bulk wipe however it is spelled, including one written as a
   direct `clearPrefix` call that the old spies would have missed entirely.

   Replace these two lines:

   ```ts
       const scheduleWipe = jest.spyOn(Database, 'clearAllScheduledNotificationsForSchedule');
       const reminderWipe = jest.spyOn(Database, 'clearAllScheduledRemindersForSchedule');
   ```

   with:

   ```ts
       const bulkWipe = jest.spyOn(Database, 'clearPrefix');
   ```

   and these two:

   ```ts
       expect(scheduleWipe).not.toHaveBeenCalled();
       expect(reminderWipe).not.toHaveBeenCalled();
   ```

   with:

   ```ts
       expect(bulkWipe).not.toHaveBeenCalled();
   ```

   The test keeps its name.

   Run:

   ```bash
   npx jest stores/__tests__/database.test.ts stores/__tests__/notifications.test.ts --watchman=false --selectProjects=unit
   ```

   Expected after the edits: both suites pass.

   Tests that must NOT change: every other `describe` in both suites, and in particular
   `never bulk-cancels via refreshNotifications or the background reschedule`, which sits directly
   below the repointed test and is untouched.

5. **Change.** This is a `(specified)` step.

   | Anchor | File | What goes |
   | --- | --- | --- |
   | `4-1` | `stores/database.ts` | the `mmkvStorage` doc comment and its `export const`, and the blank line after it |
   | `4-2` | `stores/database.ts` | both `clearAllScheduledNotificationsFor*` doc comments and their whole `export function` bodies, and the blank line after |
   | `4-3` | `stores/database.ts` | both `clearAllScheduledRemindersFor*` doc comments and their whole `export function` bodies |
   | `4-4` | `stores/notifications.ts` | the `unregisterBackgroundTask` doc comment through the end of `getBackgroundTaskStatus`, both functions whole |

   Then the fixpoint, in the SAME commit:

   - `mmkvStorage` was the only user of `createJSONStorage`, so delete the line
     `import { createJSONStorage } from 'jotai/utils';` from `stores/database.ts`.
   - Check `stores/notifications.ts` for imports left unused by the two deleted functions. Both used
     `TaskManager` and `BackgroundTask`, and both are still used by `registerBackgroundTask` and
     `rescheduleAllNotificationsFromBackground`, so both imports stay. Biome decides this, not the
     plan: run `npx biome check . --error-on-warnings` and act on what it names.

   **What must NOT be deleted, because the names collide.** Three symbols are named
   `clearAllScheduledRemindersForPrayer` and two are named
   `clearAllScheduledNotificationForPrayer`-like. Only the `stores/database.ts` exports go. Keep:

   - `device/notifications.ts`'s exported `clearAllScheduledRemindersForPrayer`, which cancels real
     OS notifications and answers with the identifiers the phone refused;
   - `stores/notifications.ts`'s module-private `const clearAllScheduledRemindersForPrayer`, which
     wraps that device call and keeps the record of a refused cancel;
   - `stores/database.ts`'s `clearPrefix`, `removeOneScheduledNotificationForPrayer` and
     `removeOneScheduledReminderForPrayer`, which are how records are removed one at a time.

   That one-at-a-time removal is deliberate and documented in `removeOneScheduledNotificationForPrayer`'s
   own comment: a refused cancel keeps its record, because the record is the only way back to an
   alarm the OS still holds. The four bulk wrappers this step deletes are the opposite of that rule,
   which is why nothing calls them.

   **The invariant this step keeps:** every exported symbol is reachable by an import, or is
   allow-listed, AND no path arms, cancels or wipes a notification differently from before.

6. **Green.**

   ```bash
   npx jest stores/__tests__/database.test.ts stores/__tests__/notifications.test.ts --watchman=false --selectProjects=unit
   ```

   Both pass. Then:

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Both exit 0. If Biome names an unused import this step does not list, delete it in this commit
   only if part 5 names it; otherwise STOP (`PLAN.md` section 2.2, item 6).

   ```bash
   python3 scripts/find-unused-exports.py | head -2
   ```

   prints `NEVER reachable from production code: 13`.

7. **Breaks.** Save as `$TMPDIR/breaks-34-4.sh` and run `bash $TMPDIR/breaks-34-4.sh` from the
   repository root.

   ```bash
   #!/bin/bash
   # Step 4 breaks: the repointed bulk-wipe guard must still catch a bulk wipe, and the
   # one-at-a-time record removal must stay.
   set -u
   cd /Users/muji/repos/rn.athan.uk || exit 1
   caught=0
   total=0

   try() { # try <label> <file> <perl> <expected>
     total=$((total + 1))
     cp "$2" "$2.bak"
     perl -pi -e "$3" "$2"
     if cmp -s "$2" "$2.bak"; then
       echo "BREAK NOT APPLIED: $1"
       mv "$2.bak" "$2"
       return
     fi
     if npx jest stores/__tests__/notifications.test.ts --watchman=false --selectProjects=unit --silent > "$TMPDIR/b34-4.log" 2>&1; then
       echo "NOT CAUGHT: $1 (expected $4 to fail)"
     else
       echo "caught: $1 (expected $4)"
       caught=$((caught + 1))
     fi
     mv "$2.bak" "$2"
   }

   # A reschedule that bulk-wipes records must be caught by the repointed guard. clearPrefix is
   # the one primitive every bulk wipe goes through, which is why the guard now watches it.
   try "a global reschedule bulk-wipes by prefix" stores/notifications.ts \
     "s/^export const rescheduleAllNotifications = async \(\) => \{\$/export const rescheduleAllNotifications = async () => {\n  Database.clearPrefix('scheduled_notifications_');/" \
     "never bulk-cancels or bulk-wipes during a global reschedule"

   # A reminder record must still be removed one identifier at a time
   try "reminder records are never removed" stores/notifications.ts \
     "s/^    Database\.removeOneScheduledReminderForPrayer\(scheduleType, prayerIndex, record\.id\);\$/    \/\/ broken/" \
     "clears reminders when the reminder alert is off but at-time stays on"

   # And so must an at-time record
   try "at-time records are never removed" stores/notifications.ts \
     "s/^    Database\.removeOneScheduledNotificationForPrayer\(scheduleType, prayerIndex, record\.id\);\$/    \/\/ broken/" \
     "clears notifications of prayers whose alert is off (heals interrupted settings commit)"

   echo "caught $caught of $total"
   [ "$caught" = "3" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   | Break | Expected to fail |
   | --- | --- |
   | a global reschedule bulk-wipes by prefix | `never bulk-cancels or bulk-wipes during a global reschedule` |
   | reminder records are never removed | `clears reminders when the reminder alert is off but at-time stays on` |
   | at-time records are never removed | `clears notifications of prayers whose alert is off (heals interrupted settings commit)` |

   Ends `ALL AS EXPECTED: 1`. All three were run while planning and all three failed their named
   test. The first is the one that matters here: it proves the repointed guard still catches a bulk
   wipe, and it does so through `clearPrefix`, which the old spies could not have seen.

   **If any break prints `BREAK NOT APPLIED`,** its search text does not match the code as it stands,
   which means either the plan is stale or the executor's own edit moved it. STOP (`PLAN.md`
   section 2.2, item 4). Never reshape the code to fit a break.

   Afterwards, `git status --porcelain` must list only this step's files and the three plan files,
   and no `.bak` file may remain.

8. **Version and commit.** Version command as step 1. Add by name:

   ```
   stores/database.ts
   stores/notifications.ts
   stores/__tests__/database.test.ts
   stores/__tests__/notifications.test.ts
   app.json
   package.json
   ai/plans/README.md
   ai/plans/34-dead-code-sweep/PLAN.md
   ai/plans/34-dead-code-sweep/LOG.md
   ```

   Commit message, to `$TMPDIR/msg-4.txt` with `<VERSION>` replaced:

   ```
   <VERSION> - chore(stores): delete seven exports nothing reaches

   mmkvStorage was superseded by stores/storage.ts and took jotai's
   createJSONStorage import with it. unregisterBackgroundTask and
   getBackgroundTaskStatus were written for debugging and rollback and were never
   called.

   The four clearAllScheduled* wrappers are the interesting ones: they bulk-delete
   records by prefix, which is exactly what this app must not do. A refused cancel
   keeps its record, because that record is the only way back to an alarm the OS
   still holds, so records are removed one identifier at a time. Nothing called the
   wrappers because nothing may.

   One of them was hidden from the old sweep by its own name: THREE symbols are
   called clearAllScheduledRemindersForPrayer, one here, one in
   device/notifications.ts that cancels real notifications, and one private to
   stores/notifications.ts that wraps it. The two live ones made this one read as
   used.

   The guard that proved no bulk wipe happens gets stronger rather than weaker. It
   spied on two of the deleted wrappers; it now spies on Database.clearPrefix, the
   single primitive all four went through, which after this commit has exactly one
   production caller. A bulk wipe written any other way is now caught too.
   ```

9. **Review.** Read `git show <sha>` back cold against this list:

   - exactly seven exports are gone, and `clearPrefix`, `removeOneScheduledNotificationForPrayer`
     and `removeOneScheduledReminderForPrayer` are all still present in `stores/database.ts`;
   - `device/notifications.ts` is NOT in the diff, so its `clearAllScheduledRemindersForPrayer` and
     `clearAllScheduledNotificationForPrayer` are untouched;
   - `stores/notifications.ts` still holds its module-private `clearAllScheduledRemindersForPrayer`
     and the at-time equivalent, with their refused-cancel logic unchanged;
   - `registerBackgroundTask` and `rescheduleAllNotificationsFromBackground` are untouched;
   - `createJSONStorage` is no longer imported, and no other import was removed;
   - the bulk-wipe guard keeps its name and asserts on `clearPrefix`;
   - the test below it, about `refreshNotifications` and the background reschedule, is unchanged;
   - no deleted symbol's name survives in a comment;
   - no test was weakened;
   - the version is bumped in both files and they match;
   - nothing beyond part 3's files changed.

   A clean read is: seven exports and one import gone, four `describe` blocks and two more gone, and
   one guard watching a lower and more general primitive.

   A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/34-database-and-notifications -m "Merge chore/34-database-and-notifications into uat-2: seven dead exports removed, the bulk-wipe guard widened, reviewed"
    ```

11. **Done when:**

    - `python3 scripts/find-unused-exports.py | head -2` prints
      `NEVER reachable from production code: 13`;
    - `npx tsc --noEmit` exits 0;
    - `npx biome check . --error-on-warnings` exits 0;
    - `grep -c 'mmkvStorage\|createJSONStorage' stores/database.ts` prints `0`;
    - `grep -c 'export function clearAllScheduled' stores/database.ts` prints `0`;
    - `grep -c 'clearAllScheduledRemindersForPrayer' device/notifications.ts` prints `1`;
    - `grep -c "jest.spyOn(Database, 'clearPrefix')" stores/__tests__/notifications.test.ts` prints `1`.

    Tick the step in `PLAN.md` section 6, and append to `LOG.md` as step 1 part 11 says.
