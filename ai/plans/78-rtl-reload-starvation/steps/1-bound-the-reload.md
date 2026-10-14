# Step 1 — Bound the boundary-crossing wait

Requirements: R1.1, R1.2, R1.3, R1.4, R2.1, R2.2
Weight: 2

## Anchor check

Run the pre-flight (`bash $TMPDIR/preflight-78.sh` after copying it there); it ends `PREFLIGHT OK` and proves all six anchors count 1, among them `language-commit-await.txt` in `stores/language.ts`.

## Goal

A direction-change pick always reaches `Updates.reloadAsync` within 10 s of the pick, whatever the scheduling queue holds; the healthy path and every other behaviour stay as today.

## Branch

Work on `ticket/78` in `$HOME/athan-gitree/run-78` (D78.6): no new branch, no merge this run. Confirm with `git rev-parse --abbrev-ref HEAD` → `ticket/78`.

## Files

- `stores/language.ts` (the change)
- `stores/__tests__/rtlReloadBound.test.ts` (new suite)
- `ai/plans/78-rtl-reload-starvation/scripts/anchors/language-commit-await.txt` (contract item 5 updates it with the code)
- `ai/plans/78-rtl-reload-starvation/PLAN.md` and `LOG.md` (the ticked box and the ledger)
- `app.json`, `package.json` (the version bump, together, 2.0.302)

## Red tests

Write `stores/__tests__/rtlReloadBound.test.ts` first, modelled on `stores/__tests__/rtlSwitch.test.ts`, with one difference the whole ticket hangs on: the `@/stores/notifications` mock must NOT be a pass-through lock. Mock it as:

```ts
let mockReleaseQueue: () => void = () => {};
let mockQueueGate: Promise<void> = Promise.resolve();

jest.mock('@/stores/notifications', () => ({
  rescheduleAllForLanguageChange: jest.fn(() => Promise.resolve(true)),
  withSchedulingLock: (operation: () => Promise<unknown>) => mockQueueGate.then(() => operation()),
}));
```

This reproduces the real lock's semantics for a held queue (the operation waits behind a holder that never settles) without importing the notifications module. The gate is a `let` and is recreated per test, or the first release would free the queue for the rest of the file. `beforeEach`: recreate the gate (`mockQueueGate = new Promise<void>((resolve) => { mockReleaseQueue = resolve; });`), then `jest.useFakeTimers({ now: 0 })`, `I18nManager.forceRTL(false)`, `jest.clearAllMocks()`, reset both atoms to `''`. Mock `@/shared/logger` exactly as `rtlSwitch.test.ts` does. `afterEach`: `setActiveLocale('en')`, `jest.useRealTimers()`.

The tests, each with what it proves:

1. `'relaunches for the direction flip while the scheduling queue never frees'` (R1.1, R1.2, red today): `const committed = commitLanguagePreference('ar')`; `await jest.advanceTimersByTimeAsync(9_999)`; assert `Updates.reloadAsync` not called; `await jest.advanceTimersByTimeAsync(1)`; assert `Updates.reloadAsync` called exactly once; assert the warn `logger.warn` was called with the exact string `'LANGUAGE: surface convergence still unsettled after 10000 ms, relaunching for the direction flip'`; assert `forceRTL` was last called with `true` and its call order precedes the reload; `mockReleaseQueue()`; `await committed`.
2. `'keeps the converged order and stays silent when the queue frees in time'` (R1.3, green guard): release the gate before the commit; `commitLanguagePreference('ar')` resolves without advancing timers past the cap; one `rescheduleAllForLanguageChange` call; assert the full call order through `invocationCallOrder`, as `rtlSwitch.test.ts`'s first test does: reschedule, then `allowRTL`, then `forceRTL(true)`, then one reload; no warn carrying the cap string; then `expect(jest.getTimerCount()).toBe(0)` — the losing timer was cleared.
3. `'leaves the queued convergence uncancelled after the capped relaunch'` (R1.4, red today): hold the gate; `const committed = commitLanguagePreference('ar')`; advance past the cap; assert `Updates.reloadAsync` called exactly once; then `mockReleaseQueue()`; `await committed`; assert `rescheduleAllForLanguageChange` ran once — the queued operation still executed, proving the race cancelled nothing.
4. `'never relaunches a same-direction pick under a held queue'` (R2.1, green guard): `store.set(languagePreferenceAtom, 'ms')`, `setActiveLocale('ms')`; hold the gate; `commitLanguagePreference('en')` is the same-direction pick (`en` and `ms` are both LTR); advance past the cap; assert zero `reloadAsync` calls, zero `forceRTL` calls, and no warn carrying the cap string; release the gate and await the commit.
5. `'a refused relaunch under the cap still warns and resolves'` (R2.2, red today): hold the gate; `reloadAsync.mockRejectedValueOnce(new Error('reload refused'))`; `const committed = commitLanguagePreference('ar')`; advance past the cap; assert `Updates.reloadAsync` called exactly once; `await expect(committed).resolves.toBeUndefined()`; assert the warn `'LANGUAGE: relaunch failed after the RTL flip'`; assert `forceRTL` last called with `true`; release the gate.

Run: `./node_modules/.bin/jest stores/__tests__/rtlReloadBound.test.ts --watchman=false --selectProjects=unit`

Expected red on today's code: tests 1, 3 and 5 fail at their first reload assertion with `Expected number of calls: 1 / Received number of calls: 0` (the planning proof already failed at exactly that line); tests 2 and 4 pass. Record the three failing names and failure lines in `LOG.md`. Anything else failing is a `STOP:`.

## Change contracts

`stores/language.ts`, and nothing else:

1. Add one module constant beside `launchDirection`:

```ts
/** The bound on a boundary crossing's convergence wait: the measured healthy cycle is ~1.4 s,
 *  a single silent native call legally burns 15 s, and row 78's starved crossings waited past
 *  four minutes. Past this the flip applies and forward-only convergence heals next launch. */
const RELOAD_CONVERGENCE_CAP_MS = 10_000;
```

2. In `commitLanguagePreference`, compute the branch once, before the convergence await: `const crossesBoundary = localeDirection(locale) !== directionBefore;`. Replace the bare `await reconcileLanguageSurfaces();` with: when `crossesBoundary` is false, the same bare await; when true, the statement `await Promise.race([reconcileLanguageSurfaces(), <the timer promise>]);`, where the timer promise is a `setTimeout(..., RELOAD_CONVERGENCE_CAP_MS)` promise whose callback logs the warn (the exact string of R1.2) and resolves. The timer is cleared when reconciliation settles first. The race never rejects: `reconcileLanguageSurfaces` catches its own failures, and the timer only resolves. The later `if` uses `crossesBoundary`, never a recomputation.

3. Every other line of the function and file is untouched: the store writes, `setActiveLocale`, the busy bracket, `allowRTL`, `forceRTL`, the reload catch with its warn.
4. Two shapes are pinned so the break script's patterns match: the race's first element is the inline call `reconcileLanguageSurfaces()`, and the warn is the string literal, never a template literal or an interpolated constant.
5. The change replaces the lines `scripts/anchors/language-commit-await.txt` spans. In the same commit, replace that anchor's content with the new verbatim block (from the bounded await through the reload branch's closing brace, 3 to 15 lines), then verify `python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' scripts/anchors/language-commit-await.txt stores/language.ts` prints `1`. Step 2's preflight runs after this update.

The warn string, asserted verbatim by test 1: `LANGUAGE: surface convergence still unsettled after 10000 ms, relaunching for the direction flip`

## Green run

`./node_modules/.bin/jest stores/__tests__/rtlSwitch.test.ts stores/__tests__/languageConvergence.test.ts stores/__tests__/rtlReloadBound.test.ts --watchman=false --selectProjects=unit --coverage --collectCoverageFrom='stores/language.ts'`

Expected: all suites pass; `stores/language.ts` at 100% statements, branches, functions, lines. Then the full gate via the commit hook.

## Break script

Run after green, each mutation restored before the next; the suite must go red each time, proving the tests guard the change:

```bash
cd "$HOME/athan-gitree/run-78"
J="./node_modules/.bin/jest stores/__tests__/rtlReloadBound.test.ts --watchman=false --selectProjects=unit"

# a. the race removed (the bare await restored): test 1 and 3 fail with 0 reload calls
perl -0pi -e 's/await Promise\.race\(\[reconcileLanguageSurfaces\(\)(?s).*?\]\);/await reconcileLanguageSurfaces();/' stores/language.ts
$J 2>&1 | tail -5; git checkout -- stores/language.ts

# b. the cap widened past the observation window: test 1 fails at the 10 s advance
perl -0pi -e 's/RELOAD_CONVERGENCE_CAP_MS = 10_000/RELOAD_CONVERGENCE_CAP_MS = 60_000/' stores/language.ts
$J 2>&1 | tail -5; git checkout -- stores/language.ts

# c. the warn deleted: test 1 fails on the warn assertion
perl -0pi -e "s/logger\.warn\('LANGUAGE: surface convergence still unsettled after 10000 ms, relaunching for the direction flip'\);//" stores/language.ts
$J 2>&1 | tail -5; git checkout -- stores/language.ts
```

Expected per run, recorded in `LOG.md` per mutation: (a) `Tests: 3 failed` — tests 1 and 3 at their reload assertions, test 5 by timeout at its `.resolves` await; (b) `Tests: 3 failed` — the same three, test 1 failing at the 10 s advance; (c) `Tests: 1 failed` — test 1 at the warn assertion. A mutation that stays green, or a perl substitution that changed nothing (`git diff --stat stores/language.ts` empty before the jest run), is a `STOP:`.

## Version and commit

Bump `app.json` then `package.json` to `2.0.302`. Commit everything in one commit on `ticket/78`:

`2.0.302 - fix(language): the direction relaunch no longer waits on the scheduling queue without bound`

The hook prints the `Tests:` line and coverage; record both in `LOG.md`.

## Review checklist

- The healthy path is byte-identical: the pass-through suites (`rtlSwitch`, `languageConvergence`) pass unchanged.
- `crossesBoundary` is computed once, before the await, and reused by the branch.
- The timer is cleared on the reconciliation-wins path.
- No `console.log`, no real clock, no edit outside the named files.

## Merge

None this run: the branch `ticket/78` is the deliverable (D78.5, D78.6).

## Done when

The checklist box for step 1 is ticked in `PLAN.md` section 6, the commit is on `ticket/78`, the hook's `Tests:` and coverage lines are in `LOG.md`, and each mutation's failing tests are recorded there.
