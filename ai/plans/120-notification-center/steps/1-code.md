# Step 1: the clear function, the call, red-first tests, the mutation pass

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5
Weight: 2

## Anchor check

Run `bash scripts/preflight-120.sh` from a `$TMPDIR` copy (section 3 of PLAN.md). Every anchor
counts 1. Any other count is a STOP.

## Goal

`initializeNotifications` with permission granted on iOS dismisses the whole delivered set
exactly once, before the injected refresh, with every failure swallowed; Android and the
permission-denied path never touch the delivered set; the background task never reaches the
clear.

## Branch

`lane/120` in the lane worktree. No new branch: one commit on the lane branch, merged into
`uat` in the main tree under `$HOME/athan-gitree/uat.lock` with `git fetch -q origin uat`
first and `--no-ff`.

## Files

- `shared/notifications.ts` (the new function; one insertion inside `initializeNotifications`)
- `shared/__mocks__/expo-notifications.ts` (one mock line)
- `shared/__tests__/notifications.test.ts` (the new tests)

## Red tests

Add the mock line first, at anchor a3, directly after `cancelAllScheduledNotificationsAsync`:

```ts
export const dismissAllNotificationsAsync = jest.fn().mockResolvedValue(undefined);
```

Then the tests, inside the existing `describe('initializeNotifications')` at anchor a4. Import
`dismissAllNotificationsAsync` from `expo-notifications` beside the existing imports. The suite
keeps the file's `Platform.OS` set-and-restore pattern (`Platform.OS = 'ios'`, restore to the
original in `afterEach` if the suite does not already).

Test 1 (R1.1, ordering):

```ts
it('clears the delivered stack on iOS before the refresh when permission is granted', async () => {
  Platform.OS = 'ios';
  const checkPermissions = jest.fn().mockResolvedValue(true);
  const refreshFn = jest.fn().mockResolvedValue(undefined);

  await initializeNotifications(checkPermissions, refreshFn);

  expect(dismissAllNotificationsAsync).toHaveBeenCalledTimes(1);
  expect(dismissAllNotificationsAsync.mock.invocationCallOrder[0]).toBeLessThan(
    refreshFn.mock.invocationCallOrder[0]
  );
});
```

Test 2 (R1.2 fence): same shape, `Platform.OS = 'android'`,
`expect(dismissAllNotificationsAsync).not.toHaveBeenCalled()`.

Test 3 (R1.3 fence): `Platform.OS = 'ios'`, `checkPermissions` resolves false, same
`not.toHaveBeenCalled()`.

Test 4 (R1.4 rejection):

```ts
it('a failed clear never stops the refresh', async () => {
  Platform.OS = 'ios';
  dismissAllNotificationsAsync.mockRejectedValueOnce(new Error('dismiss refused'));
  const checkPermissions = jest.fn().mockResolvedValue(true);
  const refreshFn = jest.fn().mockResolvedValue(undefined);

  await expect(initializeNotifications(checkPermissions, refreshFn)).resolves.toBeUndefined();
  expect(refreshFn).toHaveBeenCalledTimes(1);
});
```

Test 5 (R1.4 timeout), mirroring `device/__tests__/notificationNativeTimeout.test.ts`'s fake
timer pattern:

```ts
it('a clear that never answers is given up on and the refresh still runs', async () => {
  Platform.OS = 'ios';
  jest.useFakeTimers();
  dismissAllNotificationsAsync.mockReturnValue(new Promise(() => {}));
  const checkPermissions = jest.fn().mockResolvedValue(true);
  const refreshFn = jest.fn().mockResolvedValue(undefined);

  const init = initializeNotifications(checkPermissions, refreshFn);
  await jest.advanceTimersByTimeAsync(15_000);
  await expect(init).resolves.toBeUndefined();
  expect(refreshFn).toHaveBeenCalledTimes(1);

  jest.useRealTimers();
});
```

Run, recording the exact failing names and first failing lines:

```bash
npx jest shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit -t 'delivered'
```

Expected red: tests 1, 4 and 5 fail with `dismissAllNotificationsAsync` never called (test 1)
or the refresh never reached after the rejection (test 4 shows a rejected `init` before the
change only if the change threw, so its red form is `expected undefined, received error` or the
dismiss never being called; test 5 fails on the dismiss assertion). Tests 2 and 3 pass before
the change: they are fence pins that must stay green after it. If a red test passes before any
code change, that is a STOP.

## Change contracts

The new function in `shared/notifications.ts`, placed after `deleteLegacyAndroidAudioChannels`
(before the `initializeNotifications` docblock), verbatim:

```ts
/**
 * Clears every notification the app has delivered into the iOS Notification Center.
 *
 * The owner's Android-parity ruling (2026-10-16): opening the app empties the center, so a
 * sleeper never wakes to a stack. Android's presentation delegate replaces in place at post
 * time; iOS has no post-time hook, so the clear rides every app open instead. Delivered
 * notifications only: pending requests, identifiers and channels are untouched, and the
 * background task never runs it.
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
why.

## Green run

```bash
npx jest shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit
yarn validate
```

Expected: the suite green, `yarn validate` printing its three gates green. Coverage of the
touched lines at 100 percent via the pre-commit hook's
`node scripts/check-changed-coverage.js --staged`.

## Mutation pass (guarded logic)

Apply each mutant to `shared/notifications.ts`, run the named test, record red, restore with
`git checkout -- shared/notifications.ts`:

| ID | Mutant | Must redden |
| --- | --- | --- |
| M1 | Gate flip: `Platform.OS !== 'ios'` becomes `Platform.OS !== 'android'` | Tests 1 and 2 |
| M2 | Hoist: the clear call moves above the `hasPermission` branch | Test 3 |
| M3 | Drop the try/catch (bare awaited call in the function) | Test 4 |
| M4 | Reorder: the clear call moves after `await refreshFn()` | Test 1 |
| M5 | Unbound: `withNativeTimeout(...)` becomes a bare `await Notifications.dismissAllNotificationsAsync()` | Test 5 |

## Break script

After green, one break proves the suite still bites:

```bash
perl -0pi -e 's/await clearDeliveredNotifications\(\);\n\n      await refreshFn\(\);/await refreshFn();\n\n      await clearDeliveredNotifications();/' shared/notifications.ts
npx jest shared/__tests__/notifications.test.ts --watchman=false --selectProjects=unit -t 'clears the delivered stack'
git checkout -- shared/notifications.ts
```

Expected: the ordering test reds (`dismissAllNotificationsAsync` invocation order after
`refreshFn`), then the restore greens it.

## Version and commit

Under `$HOME/athan-gitree/version.lock`: `git fetch -q origin uat`, read `uat`'s
`package.json`, take the next patch. Bump `app.json` first, then `package.json` (the worktree
carries no `android/`; the build bay's gitignored `android/app/build.gradle` syncs after the
merge under `$HOME/athan-gitree/build.lock`). Commit on `lane/120`:

`<VERSION> - feat(notifications): iOS clears the delivered stack on app open`

The commit carries the hook's `Tests:` and coverage lines in its output; an output without a
`Tests:` line is an unhooked commit: run `yarn validate` and the coverage check by hand before
continuing.

## Review

Read the diff cold: the function matches its contract verbatim, the insertion sits at anchor
a1, no other line moved, no comment drifted into history.

## Merge

In the main tree under `$HOME/athan-gitree/uat.lock`: `git fetch -q origin uat`, `git checkout
uat` (already checked out; verify clean), `git merge --no-ff lane/120 -m "<VERSION> - merge
lane/120 step 1"`. Then sync `android/app/build.gradle` `versionName` under
`$HOME/athan-gitree/build.lock`. A conflict on the queue or the version files is lane weather:
abort, rebase `lane/120` onto `uat`, keep both lanes' rows and the higher version, retry once,
STOP if it still conflicts.

## Done when

Green run recorded, mutation pass recorded (five reds), break script recorded, commit merged,
`uat` green, the hook lines in `LOG.md`.
