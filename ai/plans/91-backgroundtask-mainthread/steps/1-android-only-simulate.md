# Step 1: the simulate arms on Android only

**Requirements:** R1.1, R1.2, R2.1, R2.2, R3.1, R4.1
Weight: 2

## Anchor check

Run the pre-flight first (PLAN.md section 3). It counts every anchor, including the
three source anchors and the three suite anchors this step edits. Any count other
than 1 is `NEEDS CONTEXT: NEEDS REPLAN, <the anchor and its count>`.

## Goal

`runBackgroundTaskDebugSequence` computes `canSimulate = __DEV__ &&
Platform.OS === 'android'`, logs it in the armed line, and returns before arming the
simulate timers when it is false. A dev context on iOS arms no trigger and logs no
post-trigger snapshot; a dev context on Android keeps today's exact sequence. The
suite pins both sides, the disabled paths stay green, and no other file changes.

## Branch

```bash
git checkout -b fix/91-android-only-simulate uat
```

Expected: `Switched to a new branch 'fix/91-android-only-simulate'`. With the step's
commit, set row 91 in `ai/plans/README.md` to `IN PROGRESS, step 1`.

## Files

Changed: `device/backgroundTaskDebug.ts`,
`device/__tests__/backgroundTaskDebug.test.ts`, `ai/plans/README.md`,
`ai/plans/91-backgroundtask-mainthread/PLAN.md`,
`ai/plans/91-backgroundtask-mainthread/LOG.md`, `package.json`, `app.json`. The
gitignored `android/app/build.gradle` gets the same `versionName`, never added.
Nothing else.

## Red tests

Write every test edit before any code change. All edits are verbatim below.

1. In `device/__tests__/backgroundTaskDebug.test.ts`, replace the suite doc block
   (the `test-header.txt` excerpt) with exactly:

```ts
/**
 * Unit tests for device/backgroundTaskDebug.ts (ISSUES.md #8 instrumentation)
 *
 * The debug module must never affect production behavior: the snapshot
 * sequence no-ops unless enabled, and the simulate call arms on Android
 * only inside __DEV__ (the native module fatalErrors on Release builds,
 * and its private selector's XPC reply aborts iOS processes).
 */
```

2. Under `import * as TaskManager from 'expo-task-manager';` add its next line in
   Biome's package order, exactly:

```ts
import { Platform } from 'react-native';
```

3. In the `runBackgroundTaskDebugSequence gating` describe, replace the
   `afterEach` block (the `test-aftereach.txt` excerpt) with exactly:

```ts
  afterEach(() => {
    jest.useRealTimers();
    delete process.env.EXPO_PUBLIC_BG_DEBUG;
    delete process.env.EXPO_PUBLIC_ENV;
    setDev(true);
    Platform.OS = 'ios';
  });
```

4. Replace the test opening at the `test-full-sequence.txt` excerpt (the whole test
   through its closing `});`) with exactly these two tests:

```ts
  it('arms the full sequence on Android in __DEV__: trigger at 8s, post-run snapshot at +5s', async () => {
    setDev(true);
    Platform.OS = 'android';
    mockTrigger.mockResolvedValue(undefined);

    runBackgroundTaskDebugSequence();

    await jest.advanceTimersByTimeAsync(8000);
    expect(mockTrigger).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(5000);
    const messages = (logger.info as jest.Mock).mock.calls.map((call) => call[0]);
    expect(messages).toContain('BACKGROUND_TASK_DEBUG: launch snapshot');
    expect(messages).toContain('BACKGROUND_TASK_DEBUG: post-trigger snapshot');
    expect(logger.info).toHaveBeenCalledWith(
      'BACKGROUND_TASK_DEBUG: Sequence armed',
      expect.objectContaining({ canSimulate: true })
    );
  });

  it('never simulates on iOS in __DEV__: the private selector aborts the process', async () => {
    setDev(true);
    Platform.OS = 'ios';

    runBackgroundTaskDebugSequence();
    await jest.advanceTimersByTimeAsync(60_000);

    expect(mockTrigger).not.toHaveBeenCalled();
    const messages = (logger.info as jest.Mock).mock.calls.map((call) => call[0]);
    expect(messages).toContain('BACKGROUND_TASK_DEBUG: launch snapshot');
    expect(messages).not.toContain('BACKGROUND_TASK_DEBUG: post-trigger snapshot');
    expect(logger.info).toHaveBeenCalledWith(
      'BACKGROUND_TASK_DEBUG: Sequence armed',
      expect.objectContaining({ canSimulate: false })
    );
  });
```

Proves R1.1, R2.1 and R2.2 on the iOS side together with the Android test's
`canSimulate: true` pin. Red now against today's code with three failures inside
`never simulates on iOS in __DEV__`: `expect(mockTrigger).not.toHaveBeenCalled()`
fails with `Number of calls: 1`, the `canSimulate: false` pin fails with
`canSimulate: true` in the received object, and the post-trigger assertion fails
with the message present. Run and record the exact failing lines:

```bash
npx jest device/__tests__/backgroundTaskDebug.test.ts --watchman=false --selectProjects=unit
```

Expected: exit 1, the failures above in
`runBackgroundTaskDebugSequence gating > never simulates on iOS in __DEV__`, every
other test in the file passing. The new test passing, or any other test failing, is
`STOP:`.

## Change contracts

1. In `device/backgroundTaskDebug.ts`, under
   `import * as TaskManager from 'expo-task-manager';` add exactly:

```ts
import { Platform } from 'react-native';
```

2. Replace the doc-block sentence holding `in DEBUG builds only` (inside the
   `bg-header.txt` excerpt) with exactly:

```ts
 * task (ISSUES.md #8). Runs once per cold launch: snapshots the task state
 * (registration, persisted options, system status, pending notifications),
 * then, in DEBUG Android builds only, simulates a system trigger so the full
 * execution chain (BGTaskScheduler handler → TaskService → JS task →
 * reschedule → native resubmit) is observable without waiting for the OS.
```

3. Replace the `simulateBackgroundTaskTrigger` doc opening (inside the
   `simulate-doc.txt` excerpt) with exactly:

```ts
/**
 * Simulates the system firing the background task (DEBUG Android builds only)
 *
 * Delegates to BackgroundTask.triggerTaskWorkerForTestingAsync, which calls
 * the private _simulateLaunchForTaskWithIdentifier: selector on
 * BGTaskScheduler. If no task request is pending, the Xcode/syslog console
```

4. Replace the arm body (the `sequence-arm.txt` excerpt) with exactly:

```ts
export const runBackgroundTaskDebugSequence = () => {
  if (!isDebugEnabled()) return;

  // The simulate's pending-request reply throws on a background queue and aborts iOS processes.
  const canSimulate = __DEV__ && Platform.OS === 'android';

  logger.info('BACKGROUND_TASK_DEBUG: Sequence armed', {
    triggerDelayMs: TRIGGER_DELAY_MS,
    canSimulate,
  });
  void logBackgroundTaskDiagnostics('launch snapshot');

  if (!canSimulate) return;

  setTimeout(() => {
    void simulateBackgroundTaskTrigger();
    setTimeout(() => {
      void logBackgroundTaskDiagnostics('post-trigger snapshot');
    }, POST_RUN_DELAY_MS);
  }, TRIGGER_DELAY_MS);
};
```

The contract: the arm answers the enabled check, then one boolean that is true only
on a dev Android context; the armed log carries that boolean; the timers arm only
behind it. It must never read storage, never touch the register path, never guard
inside `simulateBackgroundTaskTrigger`. It throws nothing.

## Green run

```bash
npx jest device/__tests__/backgroundTaskDebug.test.ts --watchman=false --selectProjects=unit
npx tsc --noEmit
npx biome check . --error-on-warnings
```

Expected: every command exits 0, and the file's whole suite passes: the three
no-op gates (R3.1), the Android sequence test (R1.2, R2.2), the iOS test (R1.1,
R2.1). Errors in code you wrote from a contract: fix your code. Errors in the
contract's verbatim lines: `STOP:` with the error quoted.

## Break script

Save as `$TMPDIR/break-91-1.sh`, run with `bash` from the repository root. It
applies three mutations to `device/backgroundTaskDebug.ts`, each named with the
test that must fail, and restores between them.

```bash
#!/usr/bin/env bash
# Ticket 91 step 1 break script. Each break must flip its named tests red.
set -u
SRC=device/backgroundTaskDebug.ts
SUITE="npx jest device/__tests__/backgroundTaskDebug.test.ts --watchman=false --selectProjects=unit"
cp "$SRC" "$TMPDIR/bgd.bak"
fail=0
expect_fail() {
  local name="$1"; shift
  if "$@" > "$TMPDIR/break-91.log" 2>&1; then
    echo "BREAK NOT APPLIED: $name"; fail=1
  else
    echo "broke: $name"
  fi
}
# B1: the platform clause leaves the gate -> iOS simulates again
perl -pi -e "s/__DEV__ && Platform\.OS === 'android'/__DEV__/" "$SRC"
expect_fail "B1 platform gate dropped (never simulates on iOS)" $SUITE
cp "$TMPDIR/bgd.bak" "$SRC"
# B2: the platform flips -> Android never simulates
perl -pi -e "s/Platform\.OS === 'android'/Platform.OS === 'ios'/" "$SRC"
expect_fail "B2 platform inverted (arms the full sequence on Android)" $SUITE
cp "$TMPDIR/bgd.bak" "$SRC"
# B3: the armed log lies -> the Android canSimulate pin fails
perl -pi -e "s/^    canSimulate,\$/    canSimulate: false,/" "$SRC"
expect_fail "B3 armed log frozen false (Android canSimulate pin)" $SUITE
cp "$TMPDIR/bgd.bak" "$SRC"
[ "$fail" -eq 0 ] && echo "ALL AS EXPECTED: 1" || echo "BREAKS FAILED"
exit "$fail"
```

`B1` must fail `never simulates on iOS in __DEV__` (the trigger fires and the
post-trigger line logs). `B2` must fail `arms the full sequence on Android in
__DEV__` (no trigger on Android). `B3` must fail the same Android test at the
`canSimulate: true` pin. After the script, `git status --porcelain` lists only this
step's files and the plan files. A break passing where the plan says it fails is
`STOP:`.

## Version and commit

Take the version lock (`mkdir $HOME/athan-gitree/version.lock`, retry in short
sleep cycles while it exists, `rmdir` after the merge; a STOP before that removes
it too; the lane lead of row 100 shares it), then inside the lock:

```bash
git fetch -q origin uat
node -e '
const { execSync } = require("node:child_process");
const local = require("./package.json").version;
const origin = JSON.parse(execSync("git show origin/uat:package.json", { encoding: "utf8" })).version;
const bump = (v) => { const p = v.split(".").map(Number); p[2] += 1; return p.join("."); };
console.log(bump(local >= origin ? local : origin));
'
```

Expected: one line, the next patch above the greater of `uat`'s and `origin/uat`'s
version. Set it in `app.json` first, then `package.json`, then the `versionName`
line of `android/app/build.gradle` (line 96 shape: `versionName "2.0.xxx"`), all
three matching. The gradle file is gitignored and never added; the lockstep test
fails if it differs.

Write the message to `$TMPDIR/msg-91-1.txt` with `<VERSION>` replaced:

```
<VERSION> - fix(device): the background-task simulate arms on Android only, ending the iOS language-switch crash

The debug sequence invoked BGTaskScheduler's private launch-simulation
selector at every JS context start; on iOS 18 its pending-request reply
throws a main-thread-only exception on a background queue and aborts the
process (two .ips reports, 2026-10-15). iOS dev contexts keep the armed
line and the launch snapshot; Android's sequence is unchanged; no
scheduling path changes.
```

Add every file from the Files list by name (plus the plan files this run changed
and the two version files), commit in the background with `git commit -F`, and read
the log. The hook's last `Tests:` line must end `passed, <n> total` and the four
coverage lines must each read `100%`. If only
`shared/__tests__/audioMatrix.test.ts` times out, wait in the background for load
average below 8 and commit again, up to 3 times.

## Review

Read `git show <sha>` cold against this checklist:

- The gate line, the armed log and the early return match contract 4
  byte-for-byte; the two doc blocks match contracts 2 and 3.
- The `Platform` import sits directly under the `expo-task-manager` import in both
  files.
- The suite holds the two platform tests verbatim, the `afterEach` restore, and no
  other test changed.
- No file outside the Files list changed; `stores/`, `node_modules` and `patches/`
  are untouched (R4.1).
- No `console.log`, no comment explaining what, no ignore comment.
- Versions: the three places match, the message starts `<VERSION> - `.

A fix the plan's symptom table gives: apply and amend. Anything else: `STOP:`.

## Merge

```bash
git checkout uat && git merge --no-ff fix/91-android-only-simulate -m "<VERSION> - merge ticket 91 step 1: the simulate arms on Android only"
git branch -d fix/91-android-only-simulate
```

A conflict: `git merge --abort`, then `STOP:`.

## Done when

The checklist box for step 1 in PLAN.md section 6 is ticked, `LOG.md` carries the
step entry (`### Step 01 — done` heading, `session:` line last) with the branch,
sha, version, hook lines, break result, review verdict and merge sha, and row 91 in
the queue reads `IN PROGRESS, step 1` inside the step's own commit. Finishing (the
executed docs commit, status EXECUTED) runs when the lead's dispatch covers the
whole plan; a dispatch ending at this step returns `ROTATE: steps 1 to 1 done, next
none` instead.

## Restore list

On a mid-step stop: `mkdir -p $HOME/athan-gitree/sessions/91` then
`git diff > $HOME/athan-gitree/sessions/91/step1-unfinished.patch` and
`git status --porcelain > $HOME/athan-gitree/sessions/91/step1-unfinished-status.txt`,
then `git checkout -- device/backgroundTaskDebug.ts
device/__tests__/backgroundTaskDebug.test.ts app.json package.json`, `git checkout
uat`, and if `git log --oneline uat..fix/91-android-only-simulate` prints nothing,
`git branch -D fix/91-android-only-simulate`. Restore the gradle `versionName` by
hand to `uat`'s `package.json` value.
