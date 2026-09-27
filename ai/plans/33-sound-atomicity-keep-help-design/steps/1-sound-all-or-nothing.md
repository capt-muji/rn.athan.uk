# Step 1: The athan change is all or nothing, selection included (specified)

0. **Anchor check:** run the section 3 pre-flight for step 1. Both anchors must count `1`:

```bash
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/33-sound-atomicity-keep-help-design/scripts/anchors/1-1.txt hooks/useNotification.ts
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/33-sound-atomicity-keep-help-design/scripts/anchors/1-2.txt stores/notifications.ts
```

Any count other than `1` means NEEDS REPLAN.

1. **Goal:** picking an athan either plays that athan everywhere or leaves the phone on the one it already had, with
   the stored selection always naming what the alarms actually play.

2. **Branch:** `git checkout -b fix/33-sound-all-or-nothing uat-2`

3. **Files:**
   - `stores/notifications.ts`
   - `hooks/useNotification.ts`
   - `stores/__tests__/notificationSoundCommit.test.ts` (new)
   - `hooks/__tests__/useNotification.test.ts`

   Nothing else may change, apart from `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).**

New suite: `stores/__tests__/notificationSoundCommit.test.ts`.

Copy the fixture shape from `stores/__tests__/notificationSchedulingLock.test.ts`: the same three `jest.mock` calls
(`@/shared/logger`, `@/stores/widget`, `@/stores/sync`), a `NOW` of `Date.parse('2026-08-29T08:00:00.000Z')` pinned
with `jest.useFakeTimers({ now: NOW })` in `beforeEach` and released with `jest.useRealTimers()` in `afterEach`, and
three stored London days built through `PrayerUtils.transformApiData`, every time at `12:00`. The clock is pinned
because a real-clock day read feeding a fixed time is ISSUES #41's exact trap. `beforeEach` also calls
`Database.clearAllExcept([])`, sets `standardPrayerAlertAtoms[0]` to `AlertType.Sound`, and calls
`setSoundPreference(PREVIOUS_SOUND)`.

Constants: `PREVIOUS_SOUND = 2`, `NEW_SOUND = 6`.

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `stores the chosen athan when every part of the change lands` | The happy path commits the selection | `commitSoundSelection(NEW_SOUND, PREVIOUS_SOUND, async () => undefined)` | resolves `true`, and `getSoundPreference()` is `NEW_SOUND` |
| `creates the channel for the chosen athan before it arms anything` | The channel is created with the new athan, and before the re-arm reads it | an `updateChannel` that records its argument | recorded argument is `NEW_SOUND`, and resolves `true` |
| `puts the athan back AND re-arms on it when the channel refuses` | The undo re-arms rather than only rewriting the preference: the owner's all-or-nothing rule | an `updateChannel` that records each argument and throws on `NEW_SOUND` | resolves `false`, `getSoundPreference()` is `PREVIOUS_SOUND`, and the recorded arguments are exactly `[NEW_SOUND, PREVIOUS_SOUND]` |
| `never lets a queued pass see the athan it is about to throw away` | The undo happens inside the SAME lock acquisition | start `commitSoundSelection(NEW_SOUND, PREVIOUS_SOUND, updateChannel)` that throws on `NEW_SOUND`, then immediately start `refreshNotifications()`, and record `getSoundPreference()` when that resolves | the recorded value is `PREVIOUS_SOUND`, never `NEW_SOUND` |
| `stores the athan the user can see even when putting it back also fails` | Settings never shows an athan the user did not pick, whatever the phone says | an `updateChannel` that throws for every argument | resolves `false`, and `getSoundPreference()` is `PREVIOUS_SOUND` |

Changed suite: `hooks/__tests__/useNotification.test.ts`. Its `describe('commitSoundSelection')` block currently owns
five tests that script `mockUpdateAndroidChannel` and `mockRescheduleAllNotifications` directly. The behaviour they
describe moves into the store, so replace that whole `describe` with one that mocks
`NotificationStore.commitSoundSelection` and proves only what the hook still owns:

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `hands the store the selection, the athan before it, and the channel updater` | The hook reads the previous athan and passes all three, which is its whole remaining job | `mockGetSoundPreference` returns `PREVIOUS_SOUND`; call `commitSoundSelection(NEW_SOUND)` | `mockStoreCommitSoundSelection` called once with `NEW_SOUND`, `PREVIOUS_SOUND`, and `Device.updateAndroidChannel` |
| `answers with the store's verdict` | The hook never invents an outcome | the store mock resolving `false` | resolves `false` |

Do not change any other test in that file. `mockRescheduleAllNotifications` stays in the file's mock factory, because
other describes use it.

Command, path before flags:

```bash
npx jest stores/__tests__/notificationSoundCommit.test.ts hooks/__tests__/useNotification.test.ts --watchman=false --selectProjects=unit
```

Expected BEFORE the change: every test in the new suite fails, each with

```
TypeError: (0 , _notifications.commitSoundSelection) is not a function
```

and the two rewritten hook tests fail with `TypeError: NotificationStore.commitSoundSelection is not a function`.
If any of them passes, or a test outside these two files fails, STOP.

5. **Change.** This step is built from the contracts below; no file is copied.

**Add to `stores/notifications.ts`,** immediately after `rescheduleAllNotifications` (anchor `1-2.txt`):

- Name: `commitSoundSelection`
- Signature:
  `export const commitSoundSelection = (selection: number, previousSelection: number, updateChannel: (sound: number) => Promise<unknown>): Promise<boolean>`
- What it answers: whether the phone now plays `selection` everywhere.
- What it does, all inside ONE `withSchedulingLock(..., 'commitSoundSelection')` acquisition: stores the athan,
  creates its channel through `updateChannel`, then re-arms with
  `_rescheduleAllNotifications({ deferWidgetRefresh: true })`. When any part throws, it does the same three things
  again with `previousSelection`. When THAT also throws, it stores `previousSelection` and gives up, because the
  stored athan is what Settings shows and it must name the athan the user can still hear.
- What it must never do: write the preference, or undo it, outside the lock acquisition that does the arming; leave
  `selection` stored after a failure; throw.
- `updateChannel` is a parameter rather than a direct import because `stores/` must not import `device/`; the hook
  passes `Device.updateAndroidChannel`.
- Log lines, exactly:
  - on success, `logger.info` with `'NOTIFICATION: Committed athan selection:'` and `{ previousSelection, selection }`
  - on the first failure, `logger.error` with `'NOTIFICATION: The athan change failed, putting the athan back:'` and the error
  - on a failed undo, `logger.error` with `'NOTIFICATION: Putting the athan back failed; the next refresh re-arms it:'` and the error

**Replace the body of `commitSoundSelection` in `hooks/useNotification.ts`** (anchor `1-1.txt`). It keeps its name,
its signature `(selection: number) => Promise<boolean>` and its `perfMark('sound_commit_start')` /
`perfMeasure('sound_commit', 'sound_commit_start')` pair. Between them it reads
`NotificationStore.getSoundPreference()` and returns
`NotificationStore.commitSoundSelection(selection, previousSelection, Device.updateAndroidChannel)`. It no longer
writes the preference, no longer calls `Device.updateAndroidChannel` itself, and no longer catches: the store owns
all of that now.

Replace the JSDoc above it too. The existing block documents the optimistic write and the two consequences that were
"deliberately not attempted", and every sentence of that is now false. The new block says, briefly, that the store
commits the athan under the scheduling lock so the selection and the alarms cannot disagree, and that this function
reads the athan in force before the change so the store has something to go back to.

The invariant, from section 5: **the stored athan always names the athan the alarms were last armed with, and a
failed change leaves both on the athan that was in force before it.**

6. **Green.** The same command. Expected `Tests:       2 failed, 0 total` must NOT appear; expect every named test to
   pass, with the new suite reporting `Tests:       5 passed, 5 total` when run alone. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exiting 0.

7. **Breaks.** Save as `$TMPDIR/breaks-33-1.sh` and run with `bash $TMPDIR/breaks-33-1.sh` from the repository root.

```bash
#!/bin/bash
# Step 1 breaks: every decision commitSoundSelection makes
set -u
SUITE="stores/__tests__/notificationSoundCommit.test.ts"
TARGET="stores/notifications.ts"
CAUGHT=0
TOTAL=0

# The pattern is a real perl regex, already escaped in each call below. \Q...\E is NOT used: it does
# not protect an interpolated \n, so a multi-line search silently matches nothing and the break reports
# BREAK NOT APPLIED while the code is untouched (measured while planning this session).
run_break() {
  local label="$1" search="$2" replace="$3"
  TOTAL=$((TOTAL + 1))
  cp "$TARGET" "$TARGET.bak"
  perl -0pi -e "s/$search/$replace/" "$TARGET"
  if cmp -s "$TARGET" "$TARGET.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$TARGET.bak" "$TARGET"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit > /dev/null 2>&1; then
    echo "SURVIVED: $label"
  else
    echo "CAUGHT: $label"
    CAUGHT=$((CAUGHT + 1))
  fi
  mv "$TARGET.bak" "$TARGET"
}

# 1. The undo only rewrites the preference instead of re-arming: the owner's whole ruling
run_break "undo stops re-arming" \
  'await armEverything\(previousSelection\);' \
  'setSoundPreference(previousSelection);'

# 2. The failed change keeps the athan the user picked
run_break "failure keeps the new athan" \
  'await armEverything\(previousSelection\);' \
  'await armEverything(selection);'

# 3. The commit reports success even when it failed
run_break "failure reports success" \
  '    return false;\n  \}, .commitSoundSelection.\);' \
  "    return true;\n  }, 'commitSoundSelection');"

# 4. The channel is never created, so Android keeps playing the old athan
run_break "channel never created" \
  'await updateChannel\(sound\);' \
  'await Promise.resolve();'

# 5. The preference is never written, so Settings never moves
run_break "preference never written" \
  'setSoundPreference\(sound\);' \
  'void sound;'

# 6. The work leaves the lock, which is what let a queued pass see the abandoned athan
run_break "commit runs outside the lock" \
  'return withSchedulingLock\(async \(\) => \{' \
  'return (async () => {'

echo "CAUGHT $CAUGHT of $TOTAL"
[ "$CAUGHT" -eq "$TOTAL" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
```

Expected: every break CAUGHT, the script ending `ALL AS EXPECTED: 1`. Break 1 and break 2 are each caught by
`puts the athan back AND re-arms on it when the channel refuses`; break 3 by all five; break 4 by
`creates the channel for the chosen athan before it arms anything`; break 5 by
`stores the chosen athan when every part of the change lands`; break 6 by
`never lets a queued pass see the athan it is about to throw away`. A `BREAK NOT APPLIED` line means the code does not
carry the text the plan fixed: STOP and ask (section 2.2).

8. **Version and commit.**

```bash
node -p "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;v.join('.')"
```

Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name:
`stores/notifications.ts`, `hooks/useNotification.ts`, `stores/__tests__/notificationSoundCommit.test.ts`,
`hooks/__tests__/useNotification.test.ts`, `app.json`, `package.json`, `ai/plans/README.md`, and this folder's
`PLAN.md` and `LOG.md`. Commit message, in a heredoc at `$TMPDIR/msg-1.txt`:

```
<VERSION> - fix(notifications): the athan change is all or nothing, selection included

Picking an athan wrote the preference, then awaited the channel update and the reschedule, and on a
throw put only the preference back. Two things were wrong with that. The re-arm is not atomic, so a
failure part way left some prayers on the new athan and the rest on the old while the restored
preference agreed with neither. And rescheduleAllNotifications takes the scheduling lock itself, so it
had released the lock before it rethrew: the undo ran outside it, and anything queued behind the commit
armed with the athan that was about to be thrown away. Measured while planning: a queued pass saw the
abandoned athan every time.

The commit moves into stores/notifications.ts, where the lock is, and does the write, the channel, the
re-arm and the undo inside ONE acquisition. The undo now RE-ARMS on the previous athan rather than only
rewriting the preference, which is the owner's ruling of 2026-09-27: the selection is part of the
commit, not a setting beside it, so a stored athan the alarms do not play is the same defect as an
alert whose bell lies. When the undo itself fails the preference still goes back, because that is what
Settings shows and it must name an athan the user can hear.

The hook keeps the name, the signature and the perf marks, and now only reads the athan in force and
hands all three to the store. Its five sound tests move to a new store suite, which also pins the
concurrency: a pass queued behind a failing commit never sees the abandoned athan.
```

The pre-commit hook runs the full suite: the last `Tests:` line ends `passed, <n> total`, and four `100%` coverage
lines are present.

9. **Review.** Read `git show <sha>` back cold, as a stranger, against this list:
   - `commitSoundSelection` in the store has the plan's exact name, signature and three log lines;
   - every write and every undo is inside the one `withSchedulingLock` acquisition, and nothing awaits outside it;
   - the undo re-arms, rather than only writing the preference;
   - a failed undo still leaves `previousSelection` stored;
   - the store imports nothing from `device/`;
   - the hook keeps its signature and both perf marks, and no longer catches;
   - the stale JSDoc on the hook is gone, and the new one says why rather than what;
   - the five new tests match their rows in part 4, and no other test changed;
   - nothing beyond the four files changed.

   A clean read finds no behaviour the plan did not ask for. Handle a finding as `EXECUTOR-BRIEF.md` section 4, item 8
   says.

10. **Merge.**

```bash
git checkout uat-2 && git merge --no-ff fix/33-sound-all-or-nothing -m "Merge fix/33-sound-all-or-nothing into uat-2: the athan change is all or nothing, reviewed"
```

11. **Done when:**
    - `npx jest stores/__tests__/notificationSoundCommit.test.ts --watchman=false --selectProjects=unit` prints `Tests:       5 passed, 5 total`;
    - `bash $TMPDIR/breaks-33-1.sh` ends `ALL AS EXPECTED: 1`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0;
    - `git log --oneline -1 uat-2` shows the merge.
