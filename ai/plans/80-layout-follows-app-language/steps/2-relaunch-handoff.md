### Step 2 — the relaunch handoff

Requirements: R2.1, R2.2, R2.3, R2.4, R2.5
Weight: 2

**Anchor check.** `language-crossing.txt` in `stores/language.ts`, `rtlSwitch-refused.txt` in `stores/__tests__/rtlSwitch.test.ts`, `launch-init-reopen.txt` in `app/index.tsx`, `index-test-language-mock.txt` in `__tests__/app/index.test.tsx`, each counting 1.

**Goal.** A language crossing's in-process relaunch stops paying the cold-launch refresh-gate reopen: the crossing writes a one-shot handoff marker before it reloads, the next context's launch init consumes it and skips `reopenRefreshGateOnColdLaunch()` (alarms survive an in-process reload; the reopen exists for the force-stop a cold launch may follow). A genuine cold launch keeps the reopen exactly as at 2.0.402. Nothing about convergence changes: the launch init still calls `reconcileLanguageSurfaces()` in every context.

**Branch.** None beyond `ticket/80`, per the run order.

**Files.**

- `stores/language.ts`
- `app/index.tsx`
- `stores/__tests__/rtlSwitch.test.ts`
- `__tests__/app/index.test.tsx`

**Red tests.**

1. `stores/__tests__/rtlSwitch.test.ts` (unit project), a new describe after the refused-relaunch case, `the relaunch handoff`:

```ts
describe('the relaunch handoff', () => {
  it('writes the marker before the reload so the next context can consume it', async () => {
    let markerAtReload = 'unset';
    reloadAsync.mockImplementationOnce(() => {
      markerAtReload = store.get(relaunchHandoffAtom);
      return Promise.resolve();
    });

    await commitLanguagePreference('ar');

    expect(markerAtReload).toBe('ar');
    expect(store.get(relaunchHandoffAtom)).toBe('ar');
  });

  it('clears the marker when the relaunch is refused, so a later cold launch reopens the gate', async () => {
    reloadAsync.mockRejectedValueOnce(new Error('reload refused'));

    await expect(commitLanguagePreference('ar')).resolves.toBeUndefined();

    expect(store.get(relaunchHandoffAtom)).toBe('');
  });

  it('consumes the marker exactly once: true then cleared, false when none was held', () => {
    store.set(relaunchHandoffAtom, 'ar');

    expect(consumeRelaunchHandoff()).toBe(true);
    expect(store.get(relaunchHandoffAtom)).toBe('');
    expect(consumeRelaunchHandoff()).toBe(false);
  });

  it('marks nothing on a same-direction switch', async () => {
    await commitLanguagePreference('ms');

    expect(store.get(relaunchHandoffAtom)).toBe('');
  });
});
```

Add `consumeRelaunchHandoff, relaunchHandoffAtom` to the file's existing `@/stores/language` import. The suite's `beforeEach` gains `store.set(relaunchHandoffAtom, '');` beside its two existing resets. Red today: the real module exports neither name, so the suite's shared `beforeEach` throws on every one of its eight cases (`store.set(undefined, ...)` failing inside `atomWithStorageString`'s write path) until the atom export and the reset land with the change — that whole-suite red is the recorded red state, and the four new cases are the ones that stay red until the contract's code lands.

2. `__tests__/app/index.test.tsx` (components project). Replace the `index-test-language-mock.txt` anchor's mock with:

```ts
// The language convergence pass owns its own suite; here it would re-arm alerts behind the
// launch under test, so the launch is observed calling it instead of running it. The handoff
// consumption is driven the same way: the store's own suite owns its semantics
let mockRelaunchHandoff = false;
jest.mock('@/stores/language', () => ({
  reconcileLanguageSurfaces: jest.fn(),
  consumeRelaunchHandoff: jest.fn(() => mockRelaunchHandoff),
}));
```

Then a new describe after the `alerts and the settling window` describe:

```tsx
describe('the launch init and the relaunch handoff, Friday 11 September 2026 at 14:00', () => {
  beforeEach(() => {
    mockRelaunchHandoff = false;
  });

  afterEach(() => {
    onPlatform('ios');
  });

  it('reopens the refresh gate on a context that began as a cold launch', async () => {
    showLondonDay('2026-09-11', '14:00');
    onPlatform('android');

    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    expect(logger.info).toHaveBeenCalledWith(
      'NOTIFICATION: Android cold launch, reopening the refresh gate so alarms are re-armed'
    );
    expect(jest.mocked(reconcileLanguageSurfaces)).toHaveBeenCalledTimes(1);
  });

  it('skips the reopen on a context that consumed a language relaunch handoff', async () => {
    mockRelaunchHandoff = true;
    showLondonDay('2026-09-11', '14:00');
    onPlatform('android');

    await render(<Index />);

    await act(() => jest.advanceTimersByTime(SETTLING_WINDOW_MS));

    expect(logger.info).not.toHaveBeenCalledWith(
      'NOTIFICATION: Android cold launch, reopening the refresh gate so alarms are re-armed'
    );
    expect(logger.info).toHaveBeenCalledWith(
      'APP: context began as a language relaunch, skipping the cold-launch gate reopen'
    );
    expect(jest.mocked(reconcileLanguageSurfaces)).toHaveBeenCalledTimes(1);
  });
});
```

The describe uses the fake timers `showLondonDay` primes. `onPlatform` comes from the harness import the file already carries (line 12); the describe's `afterEach` restores iOS by calling `onPlatform('ios')`. Add a new import line `import { reconcileLanguageSurfaces } from '@/stores/language';` (the file has no static import of that module today, only the `jest.mock`; the mock factory stands behind the imported binding). Red today: the skip case fails (`Expected ... not to have been called with` the reopen line, and the skip line `Expected ... to have been called with` misses); the cold-launch case passes both assertions at 2.0.402 — it is the no-regression guard, and its reconcile assertion holds there too.

**Change contracts.**

1. `stores/language.ts`:
   - Beside `languageCommitBusyAtom` (after line 28), add:

```ts
/**
 * The D-relaunch handoff (row 80): written before a crossing's reloadAsync and consumed by
 * the next context's launch init, so an in-process relaunch — where no force-stop cancelled
 * any alarm — does not pay the cold-launch refresh-gate reopen (row 78's aggravator).
 * '' means no handoff is held.
 */
export const relaunchHandoffAtom = atomWithStorageString('preference_language_relaunch_handoff', '');

/** Reads and clears the marker in one step: the answer is whether this context began as a language relaunch */
export const consumeRelaunchHandoff = (): boolean => {
  const held = store.get(relaunchHandoffAtom);
  if (held === '') return false;

  store.set(relaunchHandoffAtom, '');
  return true;
};
```

   - Inside the crossing branch (the `language-crossing.txt` anchor), immediately before `await Updates.reloadAsync();` as the try's first statement, add `store.set(relaunchHandoffAtom, locale);`.
   - Inside the catch, before the `logger.warn`, add `store.set(relaunchHandoffAtom, '');` — a refused relaunch leaves the old context alive, and the next genuine cold launch must reopen the gate.
2. `app/index.tsx`:
   - Extend the existing `@/stores/language` import with `consumeRelaunchHandoff`.
   - Replace the `launch-init-reopen.txt` anchor block with:

```tsx
      // This effect runs once per cold launch, and on Android a cold launch may
      // follow a force-stop that cancelled every armed alarm without touching
      // the refresh timestamp. Reopen the gate before the refresh reads it.
      // A language relaunch is not that launch: the process lived through it and
      // the alarms with it, so the handoff marker skips the reopen and the gate
      // answers within its window.
      if (consumeRelaunchHandoff()) {
        logger.info('APP: context began as a language relaunch, skipping the cold-launch gate reopen');
      } else {
        reopenRefreshGateOnColdLaunch();
      }
```

3. No scheduling path changes: `_rescheduleAllNotifications`, `rescheduleAllForLanguageChange`, `reopenRefreshGateOnColdLaunch` itself, the stamp, and the launch init's `initializeNotifications(...).then(() => reconcileLanguageSurfaces())` chain are untouched.

**Green run.** `npx jest stores/__tests__/rtlSwitch.test.ts stores/__tests__/languageConvergence.test.ts --watchman=false --selectProjects=unit` and `npx jest __tests__/app/index.test.tsx --watchman=false --selectProjects=components` — all green. Then tsc and Biome at 0. The untouched `languageConvergence` and `rtlReloadBound` suites passing is R2.5's proof.

**Break script.** `$TMPDIR/t80-break-2.sh`:

```bash
#!/usr/bin/env bash
set -u
cd "$HOME/athan-gitree/run-80" || exit 1
cp app/index.tsx "$TMPDIR/t80-index.bak"
sed -i '' 's/if (consumeRelaunchHandoff()) {/if (false) {/' app/index.tsx
failed=0
npx jest __tests__/app/index.test.tsx --watchman=false --selectProjects=components -t 'relaunch handoff' > "$TMPDIR/t80-break-2.log" 2>&1 || failed=1
grep -q 'skips the reopen' "$TMPDIR/t80-break-2.log" || failed=$((failed + 10))
cp "$TMPDIR/t80-index.bak" app/index.tsx
if [ "$failed" -eq 1 ]; then echo "ALL AS EXPECTED: 1"; else echo "BREAK NOT APPLIED ($failed)"; fi
```

Expected: `ALL AS EXPECTED: 1` — with the condition hard-wired false, the skip case fails (the reopen line was logged where it must not be). Then `git status --porcelain` lists only this step's four files plus the plan files.

**Mutation pass.** (a) `if (consumeRelaunchHandoff())` inverted to `if (!consumeRelaunchHandoff())` — both index cases fail; (b) the consume's `store.set(relaunchHandoffAtom, '')` removed — the rtlSwitch `consumes the marker exactly once` case fails on its second assertion (the atom still reads `ar` after the consume); (c) the catch's clear removed — the `clears the marker when the relaunch is refused` case fails. Record all three, then restore.

**Version and commit.** Version 2.0.406. Commit message:

```
2.0.406 - fix(language): a crossing's relaunch context consumes a handoff marker and skips the cold-launch gate reopen
```

Same add-by-name discipline as step 1.

**Review.** Read the diff cold against: the reopen still runs before `initializeNotifications` on a cold launch; the marker never influences what the convergence pass arms, only whether the gate reopens; the new MMKV key is named in the plan (D3, owner-delegated); no log line beyond the two named.

**Done when.** Step 2's checklist box is ticked and LOG.md carries the entry.
