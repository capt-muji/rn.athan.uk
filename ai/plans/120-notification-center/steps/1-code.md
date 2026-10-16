# Step 1: the clear function, the call, red-first tests, the mutation pass

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5
Weight: 2

## Anchor check

Run `bash scripts/preflight-120.sh` from a `$TMPDIR` copy (section 3 of PLAN.md). Every anchor
counts 1. Any other count is a STOP.

## Goal

`initializeNotifications` with permission granted on iOS dismisses the whole delivered set
exactly once, before the injected refresh, with every failure swallowed and logged; Android and
the permission-denied path never touch the delivered set; the background task never reaches the
clear.

## Branch

`lane/120` in the lane worktree (`$HOME/athan-gitree/worktrees/lane-120`, `node_modules`
installed and the husky shim live since the skeleton commit). No new branch: one commit on the
lane branch, made under `$HOME/athan-gitree/commit.lock`, merged into `uat` in the main tree
under `$HOME/athan-gitree/uat.lock` with `git fetch -q origin uat` first and `--no-ff`.

## Files

- `shared/notifications.ts` (the new function; one insertion inside `initializeNotifications`)
- `shared/__mocks__/expo-notifications.ts` (one mock line)
- `shared/__tests__/notifications.test.ts` (the new tests)
- `device/__tests__/tasks.test.ts` (one fence test pinning the background half of R1.5)

## Red tests

Add the mock line first, at anchor a3, directly after `cancelAllScheduledNotificationsAsync`:

```ts
export const dismissAllNotificationsAsync = jest.fn().mockResolvedValue(undefined);
```

Then the tests: a nested describe inside the existing `describe('initializeNotifications')`
at anchor a4, directly after the existing 'handles errors gracefully' test. The import block
gains two lines: `dismissAllNotificationsAsync` in the `expo-notifications` import, and
`import logger from '@/shared/logger';` (the moduleNameMapper routes it to the jest.fn mock).

```ts
describe('the delivered-stack clear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  afterEach(() => {
    Platform.OS = 'ios';
  });

  it('clears the delivered stack on iOS before the refresh when permission is granted', async () => {
    const checkPermissions = jest.fn().mockResolvedValue(true);
    const refreshFn = jest.fn().mockResolvedValue(undefined);

    await initializeNotifications(checkPermissions, refreshFn);

    expect(dismissAllNotificationsAsync).toHaveBeenCalledTimes(1);
    expect((dismissAllNotificationsAsync as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      refreshFn.mock.invocationCallOrder[0]
    );
    expect(logger.info).toHaveBeenCalledWith('NOTIFICATION: Cleared the delivered notifications');
  });

  it('does not clear the delivered stack on Android', async () => {
    Platform.OS = 'android';
    const checkPermissions = jest.fn().mockResolvedValue(true);
    const refreshFn = jest.fn().mockResolvedValue(undefined);

    await initializeNotifications(checkPermissions, refreshFn);

    expect(dismissAllNotificationsAsync).not.toHaveBeenCalled();
  });

  it('does not clear the delivered stack when permissions are denied', async () => {
    const checkPermissions = jest.fn().mockResolvedValue(false);
    const refreshFn = jest.fn().mockResolvedValue(undefined);

    await initializeNotifications(checkPermissions, refreshFn);

    expect(dismissAllNotificationsAsync).not.toHaveBeenCalled();
  });

  it('a failed clear never stops the refresh', async () => {
    (dismissAllNotificationsAsync as jest.Mock).mockRejectedValueOnce(new Error('dismiss refused'));
    const checkPermissions = jest.fn().mockResolvedValue(true);
    const refreshFn = jest.fn().mockResolvedValue(undefined);

    await expect(initializeNotifications(checkPermissions, refreshFn)).resolves.toBeUndefined();
    expect(dismissAllNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'NOTIFICATION: Failed to clear the delivered notifications, carrying on:',
      expect.any(Error)
    );
  });

  it('a clear that never answers is given up on and the refresh still runs', async () => {
    jest.useFakeTimers();
    (dismissAllNotificationsAsync as jest.Mock).mockReturnValue(new Promise(() => {}));
    const checkPermissions = jest.fn().mockResolvedValue(true);
    const refreshFn = jest.fn().mockResolvedValue(undefined);

    try {
      const init = initializeNotifications(checkPermissions, refreshFn);
      await jest.advanceTimersByTimeAsync(15_000);
      await expect(init).resolves.toBeUndefined();
      expect(refreshFn).toHaveBeenCalledTimes(1);
      expect(dismissAllNotificationsAsync).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
```

The three `as jest.Mock` casts follow this file's own pattern (six use sites on
`setNotificationChannelAsync` at lines 389, 472, 489, 508, 544, 576): jest's moduleNameMapper
mocks `expo-notifications` at runtime only, so `tsc` types the import as the real SDK
function and every `.mock` accessor or `mock*` mutator needs the cast
(D120.8).

The `beforeEach` clear is load-bearing: the unit project sets no `clearMocks`, the shared
module mock accumulates calls across the file, and the pre-existing 'calls refreshFn when
permissions are granted' test (which also calls `initializeNotifications` with permission on
the default iOS platform) would otherwise spend its dismiss call into the first new test's
count.

One more test joins `device/__tests__/tasks.test.ts`, inside the existing describe, pinning
R1.5's background half against the registered executor (the file's own pattern):

```ts
it('never dismisses delivered notifications: the clear is an open-time act', async () => {
  mockReschedule.mockResolvedValue(undefined);
  const executor = getRegisteredExecutor();

  await executor();

  const { dismissAllNotificationsAsync } = require('expo-notifications');
  expect(dismissAllNotificationsAsync).not.toHaveBeenCalled();
});
```

Run, recording the exact failing names and first failing lines:

```bash
npx jest shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit
```

Expected red before any code change: 'clears the delivered stack on iOS before the refresh
when permission is granted' (dismiss called 0 times), 'a failed clear never stops the refresh'
(dismiss called 0 times), 'a clear that never answers is given up on and the refresh still
runs' (dismiss called 0 times). The two fence tests ('does not clear ... on Android', '...
when permissions are denied') pass before the change: they are fence pins that must stay
green after it. The tasks.test.ts addition is green before the change and must stay green
after it: it pins the background fence. Any of the three expected-red tests passing before the
change is a STOP.

## Change contracts

The new function in `shared/notifications.ts`, placed after `deleteLegacyAndroidAudioChannels`
(before the `initializeNotifications` docblock), verbatim:

```ts
/**
 * Clears every notification the app has delivered into the iOS Notification Center.
 *
 * Android's presentation delegate replaces in place at post time, so at most one entry is ever
 * visible; iOS has no post-time hook, so every app open empties the center instead and a
 * sleeper never wakes to a stack. Delivered notifications only: pending requests, identifiers
 * and channels are untouched, and the background task never runs it.
 */
export const clearDeliveredNotifications = async () => {
  if (Platform.OS !== 'ios') return;

  try {
    await withNativeTimeout(
      Notifications.dismissAllNotificationsAsync(),
      'clearing the delivered notifications'
    );
    logger.info('NOTIFICATION: Cleared the delivered notifications');
  } catch (error) {
    logger.error('NOTIFICATION: Failed to clear the delivered notifications, carrying on:', error);
  }
};
```

The insertion inside `initializeNotifications` at anchor a1, verbatim:

```ts
    const hasPermission = await checkPermissions();
    if (hasPermission) {
      await clearDeliveredNotifications();

      await refreshFn();
```

Nothing else in the file changes. No call-site comment: the function's docblock carries the
why, and no history sits in comments.

## Green run

```bash
npx jest shared/__tests__/notifications.test.ts device/__tests__/tasks.test.ts --watchman=false --selectProjects=unit
yarn validate
```

Expected: both suites green including the three pre-existing `initializeNotifications` tests,
`yarn validate` printing its three gates green. Coverage of the touched lines at 100 percent
via the pre-commit hook's `node scripts/check-changed-coverage.js --staged`.

## Mutation pass (guarded logic)

Apply each mutant to its named file, run the suites, record red, restore with
`git checkout -- <file>`:

| ID | Mutant | Must redden |
| --- | --- | --- |
| M1 | Delete the platform gate line (`if (Platform.OS !== 'ios') return;`) | 'does not clear the delivered stack on Android' |
| M2 | Hoist: the clear call moves above the `hasPermission` branch | 'does not clear the delivered stack when permissions are denied' |
| M3 | Drop the try/catch (bare awaited call in the function) | 'a failed clear never stops the refresh' |
| M4 | Reorder: the clear call moves after `await refreshFn()` | 'clears the delivered stack on iOS' (ordering assertion) |
| M5 | Unbound: `withNativeTimeout(...)` becomes a bare `await Notifications.dismissAllNotificationsAsync()` | 'a clear that never answers is given up on' |
| M6 | Leak: the task body in `device/tasks.ts` gains `require('@/shared/notifications').clearDeliveredNotifications()` beside the reschedule require | 'never dismisses delivered notifications' in tasks.test.ts |

## Break script

After green, one break proves the suite still bites:

```bash
perl -0pi -e 's/await clearDeliveredNotifications\(\);\n\n      await refreshFn\(\);/await refreshFn();\n\n      await clearDeliveredNotifications();/' shared/notifications.ts
npx jest shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit
git checkout -- shared/notifications.ts
```

Expected: 'clears the delivered stack on iOS' reds on the ordering assertion, the rest green,
then the restore greens it.

## Version and commit

Under `$HOME/athan-gitree/version.lock`: `git fetch -q origin uat`, read `uat`'s
`package.json` in the main tree, take the next patch after the higher of it and the branch's
current version. Bump `app.json` first, then `package.json`, by replacing the version string
in place (never a JSON re-serialization: biome owns the array layout). The worktree carries no
`android/`; the build bay's gitignored `android/app/build.gradle` syncs after the merge under
`$HOME/athan-gitree/build.lock`. Commit on `lane/120` under `$HOME/athan-gitree/commit.lock`:

`<VERSION> - feat(notifications): iOS clears the delivered stack on app open`

The commit carries the hook's `Tests:` and coverage lines in its output; an output without a
`Tests:` line is an unhooked commit: run `yarn validate` and the coverage check by hand before
continuing.

## Review

Read the diff cold: the function matches its contract verbatim, the insertion sits at anchor
a1, no other line moved, no comment carries history.

## Merge

In the main tree under `$HOME/athan-gitree/uat.lock`: `git fetch -q origin uat`, verify
`uat` checked out and clean, `git merge --no-ff lane/120 -m "<VERSION> - merge lane/120 step
1"`. Then sync `android/app/build.gradle` `versionName` under
`$HOME/athan-gitree/build.lock`. A conflict on the queue or the version files is lane weather:
abort, rebase `lane/120` onto `uat`, keep both lanes' rows and the higher version, retry once,
STOP if it still conflicts.

## Done when

Green run recorded, mutation pass recorded (six reds), break script recorded, commit merged,
`uat` green, the hook lines in `LOG.md`.
