# LOG — ticket 78

## Ticket 78

The D59 relaunch starves: the in-process reload silently skips most direction-change
crossings. Row 78 of `ai/plans/README.md`. This run: plan, grill, execute, audit on
branch `ticket/78` in `$HOME/athan-gitree/run-78`; no merge, no push, no DONE (the
owner's run order, 2026-10-14).

## Planning (2026-10-14)

Facts pinned before drafting:

- The commit path read end to end: `stores/language.ts` `commitLanguagePreference`
  (the convergence await, the direction branch, the reload catch),
  `stores/notifications.ts` `withSchedulingLock` (the promise-chain queue; the
  dequeue logs, the wait logs nothing), `shared/notifications.ts`
  `withNativeTimeout` (15 s per silent native call), `device/notifications.ts`
  (every arming and cancelling call wrapped), `app/index.tsx` (the launch-init
  latch and the unconditionally reopened Android refresh gate),
  `device/listeners.ts` (the foreground convergence retry).
- The pinned expo-updates sources: JS `reloadAsync` rejects only in development
  (`updates-js-reload.txt`); on a local mock build updates are disabled and the
  native leg is `RecreateReactContextProcedure`, which fires the
  `UpdatesStateEvent.Restart()` state line before any restart
  (`updates-recreate-procedure.txt`).
- Ticket 71's FINDINGS section 8 (D91) recovered from git (`git show
  af4588bc:ai/plans/71-appstate-teardown/FINDINGS.md`): the drive table and the
  silent signature, transcribed into `PLAN.md` section 4.
- The discriminator: the starved crossings log no convergence dequeue line, so the
  commit died inside the queue wait; they log no `Updates state change: Restart`,
  so the native leg was never reached. The direction branch computes true on both
  crossing directions. The latch is the aggravator.
- Planning proof (throwaway suite, deleted before any commit): with the lock mocked
  as a gate that never frees, today's code never calls `Updates.reloadAsync`;
  the proof failed at `expect(Updates.reloadAsync).toHaveBeenCalledTimes(1)` with
  `Expected number of calls: 1 / Received number of calls: 0`.

Owner decisions D78.1 to D78.6 recorded in `PLAN.md` section 2, each delegated by
the owner's run order, 2026-10-14.

session: ses-lead-78-planning

## Planning (2026-10-14) — the grill

The `athan-plan-griller` pass returned eleven findings. Adjudication: five musts,
five shoulds and one nice, every one accepted and applied:

1. must — the mock gate was a single module-scope `const` Promise; the first
   release freed the queue for the rest of the file. Fixed: `let` gate,
   recreated per test in `beforeEach`.
2. must — step 1's change replaces the lines the `language-commit-await.txt`
   anchor spans, so step 2's preflight would count 0 and die. Fixed: contract
   item 5 updates the anchor in the same commit.
3. must — the break script's `Tests: 1 failed` expectation was wrong for
   mutations a and b (test 5 times out with them). Fixed: per-mutation
   expectations.
4. must — test 5 had no reload call-count assertion, so its red today was a
   timeout, not the claimed line. Fixed: the assertion added before the
   `.resolves` await.
5. must — step 1's ledger edits dirtied the tree for step 2's preflight.
   Fixed: the preflight's clean check excludes the plan folder; the ceiling
   check (finding 11) added in the same edit.
6. should — 2.0.301 was skipped silently in D78.5. Fixed: the sequence spelled
   out.
7. should — the break script's perl patterns could miss a differently shaped
   implementation. Fixed: contract items 2 and 4 pin the race statement and
   the warn literal.
8. should — test 2 did not assert the reschedule's position in the order.
   Fixed: `invocationCallOrder` reschedule < allow < force < reload.
9. should — the Restart log line is emitted by `UpdatesStateMachine.kt`, not
   the procedure file. Fixed: the citation extended in PLAN.md section 4 and
   step 2.
10. should — the timer-clear contract had no observer. Fixed:
    `expect(jest.getTimerCount()).toBe(0)` in test 2.
11. nice — the version ceiling 2.0.399 is now enforced by the preflight.

The gate prints `PLAN OK` after the fixes; the preflight prints `PREFLIGHT OK`
with the plan folder dirty, as its exclusion intends.

session: ses-lead-78-planning

### Step 1 — done

Branch `ticket/78` in `$HOME/athan-gitree/run-78`, version 2.0.302. Pre-flight
`PREFLIGHT OK` on the clean tree at `e7891fb7`; branch and anchors verified.

Red (`stores/__tests__/rtlReloadBound.test.ts`, 5 tests): tests 2 and 4 passed;
tests 1, 3 and 5 failed at their reload-count assertions with
`Expected number of calls: 1 / Received number of calls: 0` —
1. `relaunches for the direction flip while the scheduling queue never frees`
   at `rtlReloadBound.test.ts:62`,
2. `leaves the queued convergence uncancelled after the capped relaunch` at
   `:94`,
3. `a refused relaunch under the cap still warns and resolves` at `:118`.

Green: the three suites (`rtlSwitch`, `languageConvergence`, `rtlReloadBound`)
pass, `Tests: 14 passed, 14 total`; coverage on `stores/language.ts` 100%
statements (41/41), branches (10/10), functions (5/5), lines (38/38);
`npx tsc --noEmit` clean; `npx biome check … --error-on-warnings` clean after
biome's own format of two `stringContaining` lines in the new suite (format
only; the warn line in `stores/language.ts` sits at exactly the 120-char limit
and stays one line, as the break script's perl needs).

Break script (second pass; see the process note), each mutation red then
restored, `git diff --stat` non-empty before each jest run:

- (a) race removed → `Tests: 3 failed` — tests 1, 3 and 5, each at its
  reload-count assertion (`Received number of calls: 0`). Note: the plan's
  parenthetical had test 5 failing by timeout at its `.resolves` await; it
  fails earlier, at the reload-count assertion the grill added before that
  await. The `Tests:` count matches the plan.
- (b) cap widened to 60_000 → `Tests: 3 failed` — the same three, test 1 after
  the 10 s advance (`Received number of calls: 0`).
- (c) warn deleted → `Tests: 1 failed` — test 1 at the warn assertion.

Process note: the first break-script pass ran against the implementation left
unstaged, so mutation (a)'s `git checkout -- stores/language.ts` restored the
index (HEAD) and wiped the uncommitted change; (b) and (c) then correctly
matched nothing and were never run against the implementation. The
implementation was re-applied byte-identically, staged (`git add`), and all
three mutations re-run; the results above are from that clean second pass.
The break script's checkout semantics require the implemented state in the
index, which staging provides.

Anchor: `scripts/anchors/language-commit-await.txt` replaced in this commit
with the new verbatim block — the bounded-await region, 14 lines — and the
count check prints `1`. Note: the contract's parenthetical end-point
("through the reload branch's closing brace") cannot fit the 3-to-15-line
bound together with the pinned race statement and the later `if`, so the
anchor covers the bounded-await region the change replaces.

Commit note: the first commit (`f5c7389f`) ran with no hooks — this worktree
lacks the generated `.husky/_` that `core.hooksPath` points at (husky's
install output is gitignored and the worktree never ran `yarn husky`), so the
gate never executed. The repo's own setup command (`yarn husky`, the
`prepare` script's command) generated the hooks directory, and the commit was
amended (`--amend --no-edit`, unpushed tip) so the gate ran on the identical
tree. Amended sha `00cf7c0f`. The hook chain
(`check-identifiers` → `lint-staged` → `yarn validate` →
`check-changed-coverage`) passed: `Tests: 2 skipped, 5568 passed, 5570 total`,
211 suites, coverage 100% statements (5282/5282), branches (2299/2299),
functions (1102/1102), lines (4731/4731). Cold review of `git show` against
the review checklist and the shipped classes: clean (files exactly the step's
list; `crossesBoundary` computed once and reused; timer cleared on the settle
path; healthy-path statements untouched; no console, no real clock, no
residue — the anchor updated in-commit).

session: ses_ec72eba7effeUhXvEF8IwfxLob

### Step 2 — done

Branch `ticket/78`, version 2.0.303. Pre-flight `PREFLIGHT OK` against the
step 1 commit. No red tests: a records step (R3.1 checked by the audit
reading the file). `bash scripts/check-plan.sh ai/plans/78-rtl-reload-starvation`
prints `PLAN OK`. `FINDINGS.md` written per the step's change contract: the
verdict sentence, the evidence chain (71's D91 table via `PLAN.md` section 4,
the missing dequeue line as discriminator, the missing `Updates state change:
Restart` clearing the native leg via `updates-js-reload.txt` and
`updates-recreate-procedure.txt`, drive 3's late init), the cleared suspects
(direction branch, native chain, `forceRTL`), the condemned await and the
launch-init latch left untouched as the aggravator (D78.3), the fix's
contract, and the residual with the device waiver. Every claim names its
source; no model, serial, place or person named; the queue cell and docs
message stay in `PLAN.md` section 8.

session: ses_ec72eba7effeUhXvEF8IwfxLob
