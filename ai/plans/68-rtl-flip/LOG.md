# Ticket 68: RTL flip: supportsRTL, forceRTL-at-switch, relaunch, widget layoutDirection (58b)

## Planning (2026-10-12, opened 2026-10-13 after midnight)

Opened under the owner's clear-the-board instruction (full workflow
autonomously, no questions). Three explore fact packs feed section 4: the
language-switch flow (entry points, convergence, reload machinery, cold-start
re-reads, the storage keys), the seven RTL-sensitive surfaces (the four
mirror sites with their tests, the 58a gate and its 21 allowlist entries (9 after step 2's surgery),
the window-space catchers), and the widget direction plumbing at the pinned
`expo-widgets`/`@expo/ui` 58.0.14 (the Host `layoutDirection` contract, the
stamp sites, every version pin and digest site).

Verified by the planner at `61fb7675`: `swapLeftAndRightInRTL` exists in the
pinned `react-native 0.88.0-rc.3` (`I18nManager.js:68`), `app.json:75` is the
flip target, `expo-updates ~58.0.15` with the Error.tsx reload precedent, and
`Host` is exported from both `@expo/ui/swift-ui` and
`@expo/ui/jetpack-compose`.

Planner rulings recorded in PLAN.md section 2: P10 (the relaunch mechanism,
after the reconcile resolves), P11 (bootstrap owns the launch-time
direction), P12 (`localeDirection` beside `LOCALE_IDS`), P13 (render-time
`I18nManager.getConstants().isRTL` reads, constant within a process), P14
(transforms for the swap-proof sites, allowlist shrinks), P15 (a dedicated
`rtl` boolean on both widget shapes, v8/v4), P16 (Host wraps every widget
root).

Four steps drafted: the flip and restart (weight 2), the mirrors and
transforms (weight 2), the widget direction (weight 2), the 3T device proof
(weight 3, alone). Thirteen anchors extracted; three break scripts written.

Drafted while ticket 59's executor held the checkout (its steps touch the
catalogs and width store, disjoint from every 68 anchor); the grill, the
gate re-run and the READY commit waited for its return so the griller read a
settled tree.

Grill round one (sixteen findings, all applied): the tip mirror geometry
corrected to the centre-symmetric form, the five transform-collision sites
join their existing transform arrays, every converted node gained
`direction: 'ltr'` (later superseded by round two's containing-view fix), the
Jest 30 output-format greps fixed, the project selectors fixed for .tsx
suites, the bootstrap cast and mock hygiene corrected, the react-native mock
file added to every list, the R4.1 assertions made real, the allowlist counts
corrected to 21/9, the widget-renderer stub tables and the lock-renderer
direction case added.

Grill round two (seventeen findings, all applied): P16's Host wrap is deleted
— the pinned `@expo/ui` Host compiles to a `HostView` node the widget runtime
rejects (iOS red box, Android `View not found`) — so step 3 ships the `rtl`
stamp alone and R5.2 is recorded blocked on the runtime, with step 4's widget
screenshot made mandatory evidence of today's unstamped rendering; the tip's
explicit mirror is deleted because the retained `left:` is already swapped to
`start` under RTL (R3.1 rewritten to the swap truth, `tipGeometry.ts` and
`Bar.tsx` now byte-identical); `direction: 'ltr'` moves from the converted
nodes to their CONTAINING views (the pinned Yoga resolves inset-less
absolutes with the containing node's direction); `expo-updates` gains its
jest mapping and mock file (the unit project cannot load the store without
them); `shared/__tests__/nativeConfig.test.ts` replaces the non-existent
path; the break scripts' substitution and grep strings match the repaired
contracts; the RTL .tsx spy mechanism, the waveHeading negated-angle formula,
the lock/return-site corrections, the four-file counts and the atlas and
build-script facts all replaced. Gate after both rounds: `PLAN OK`.

## Planner rulings on the step-1 STOPs (2026-10-13, the lead under the owner's no-questions instruction)

First STOP: the preflight tripped on an untracked `ai/plans/59-prayer-names/AUDIT.md`
stray (the 59 DONE merge's `git rm -r` removed only tracked files). Ruling:
the stray is deleted (59's record lives in its DONE queue cell and commit
2.0.147), and untracked paths under `ai/plans/` other than this plan's own
files are treated as absent for cleanliness — they are the lead's planning
namespace, never an executor's.

Second STOP: step 1's verbatim test failed `tsc` — `mock.invocationCallOrder.at(-1)`
widens to `number | undefined` against `toBeGreaterThan`. Ruling: the plan's
sketch gains the non-null assertions (`at(-1)!` on the three order reads), and
the red expectation is corrected: the two pure-negative cases (the
same-direction rtlSwitch case and the no-preference bootstrap case) pass at
red by construction. The executor's measured red already matches every other
named failure.

### Step 01 — DONE

Branch `feat/68-rtl-flip` off uat (`e3761f15`), version 2.0.151. Preflight
passes every check: on `uat`, `origin/uat` merged, version 2.0.150 at entry,
row 67 DEFERRED, and the three anchors this step edits (`appjson-rtl`,
`commit-flow`, `locale-ids`) each counting 1. The only porcelain entry is the
waived untracked `ai/plans/64-volume-copy/`.

Red verified exactly as the repaired plan predicts: 5 failed, 17 passed. The
two rtlSwitch crossing cases fail on `Expected number of calls: 1, Received
number of calls: 0` (`reloadAsync`), the first two bootstrap cases on 0
`allowRTL`/`forceRTL` calls, and nativeConfig on `{"supportsRTL": true}`
against `{"supportsRTL": false}`; the two pure-negative cases pass at red, as
the repaired expectation records. All four change contracts applied verbatim.

One implementation note: the bootstrap direction spies are read from inside
`jest.isolateModules`, because the isolated registry re-executes the
moduleNameMapper-mapped react-native mock, so a top-level import is a
different instance (a probe proved this before the red run).

Green: unit 6 suites / 52 tests pass, `components/sheets/__tests__/Language.test.tsx`
passes 5/5 unchanged (the sheet never learned about the restart), `npx tsc
--noEmit` exit 0, `npx biome check . --error-on-warnings` exit 0.
`scripts/break-step1.sh`: `caught: the boundary crossing no longer
relaunches`, `ALL AS EXPECTED: 1`.

Review, cold against `git show 01542516`: app.json carries the one flag
beside the version rule's mandated bump; the restart block sits inside the
`try`, after the reconcile `await`; no new storage key (`preference_language`
stays the only locale key written); no worklet, timer or subscription added;
no unread production export. Clean read, no fix applied.

Committed `01542516` (2.0.151, 12 files, +147/-6) under the version lock,
merged `--no-ff` as `a1716f25`; the lock released after the merge. Hook:
Test Suites 208 passed / 208 total, `Tests: 5477 passed, 5477 total`, and the
four coverage lines at 100% (statements 5193/5193, branches 2225/2225,
functions 1082/1082, lines 4649/4649).

This entry is uncommitted on uat: the ledger carries the shas the commit
creates, so it rides into step 2's commit (the ticket 59 precedent).

session: ses_ecd61365cffe8TKeEwD5BM4On0

### Step 02 — DONE

Branch `feat/68-mirror-sites` off uat (`6a714f2f`), version 2.0.153. Anchor
check: all six anchors this step edits (`bar-leftstyle`, `segmented-pill`,
`toggle-travel`, `wave-point`, `overlay-left`, `veil-left`) count 1.

Red: 10 new cases failed across the six suites, all existing cases passing
(290 passed). The two crossings of the segmented pill state the mirrored
slot, the toggle's first-frame and animated travel negate, the wave point,
heading, path and trail twins mirror, the catcher and veil-glow and cloud
flattened styles carry a translateX first entry where they carried `left:`.

Deviations, all recorded rather than guessed:
- The plan's green command writes `--selectProjects=unit,components`, which
  jest 30 rejects ("no projects were found matching the selection", a
  comma-joined name is not a project). The same six paths ran as
  `--selectProjects unit components`.
- `components/overlay/__tests__/VeilBackdrop.test.tsx` is not in the plan's
  Files list, but it is the veil's own suite and the home red item 5's veil
  assertion needs; it is the fourteenth changed file.
- The RTL assertions sit in suites named `... under RTL`, so the break
  script's `-t 'RTL'` filter selects exactly them.
- The SegmentedControl animated-target case: `withTiming(0)` is also emitted
  by the option fade, so that assertion alone passed at red. The case gained
  `expect(withTiming).not.toHaveBeenCalledWith(200, ...)` to isolate the
  pill's own target, which is the assertion the plan asks for.
- The wave functions' trailing `isRTL` parameter carries a `false` default:
  the plan's review checklist requires the pre-existing cases unedited, and
  a required parameter fails tsc on every existing three-argument call.
- The direction pin went on the three containing views of the converted
  decorations (the decorations root, FloatingMoon's root, FloatingStar's
  root). Those are the real containing blocks; the plan names the root alone.
- The Ramadan R4.1 assertion is made on the cloud, the one converted site
  whose old `left` was the constant 0 and therefore the one value the suite
  can state outright; the other nine offsets are internal geometry.

Green: 27 suites / 300 tests pass across both projects, `node
scripts/check-directional-styles.js` prints `DIRECTIONAL STYLES OK` and exits
0, `npx tsc --noEmit` exit 0, `npx biome check . --error-on-warnings` exit 0.
No `left:`/`right:` key remains in the three converted files;
`tipGeometry.ts` and `Bar.tsx` are untouched, so the tip rides the layout
swap byte-identically. `scripts/break-step2.sh`: `caught: the pill no longer
mirrors`, `ALL AS EXPECTED: 1`.

Review, cold: the allowlist keeps nine entries (Bar with the rewritten
reason, six catcherGeometry entries, the two prose entries) and the twelve
converted entries left; every converted node's inset became a transform; the
LTR cases in all six suites are unedited and pass.

Sequence note: the step commit first landed on uat because the branch was not
made first. uat was one unpushed commit ahead of origin/uat, so the commit
was moved onto `feat/68-mirror-sites` at `db50f9db`, uat reset to `6a714f2f`,
and the merge taken `--no-ff` as this step prescribes; no published history
was touched.

Committed `db50f9db` (2.0.153, 18 files, +335/-103) under the version lock,
merged `--no-ff` as `4bd52292`; the lock released after the merge. The commit
carried step 1's ledger entry, closing its reference. Hook: Test Suites 208
passed / 208 total, `Tests: 5493 passed, 5493 total`, coverage 100%
(statements 5198/5198, branches 2239/2239, functions 1082/1082, lines
4655/4655).

session: ses_ecd61365cffe8TKeEwD5BM4On0
