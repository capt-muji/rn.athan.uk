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
