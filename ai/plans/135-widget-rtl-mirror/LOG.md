# LOG — ticket 135

## Ticket 135 (2026-10-18)

Lane opened on the previous lane-135 session's empty ground (no branch, no folder,
no commits; verified against the session store and the tree before any write).
Worktree `$HOME/athan-gitree/worktrees/lane-135` from `uat` at `cd171855`
(2.0.1013); `yarn install` with the tracked hooks pinned; patches applied.

## Planning (2026-10-18)

Survey: both widget layout modules in full, `stores/widget.ts`,
`shared/widgetTimeline.ts`, `shared/widgetTypes.ts`, the app countdown at HEAD
(`components/countdown/Countdown.tsx`, letters at 95 percent since `3a11aa38`),
`shared/time.ts` `formatTimeAgo`, the converter sources
(`expo-widgets` iOS `ViewRenderer.swift`, `TextView.swift`, `EntryView.swift`;
Android `ExpoWidgetEmittableTree.kt`, `ExpoWidgetsPeekWidget.kt`), the patch, the
widget test suites, and row 68's P16 record (`a3d8d282` and its LOG: the Host
compiles to a `HostView` node the runtime rejects).

Measurements taken at planning:

- SDK receipt: the iOS 27.1 SDK's SwiftUICore interface carries exactly one
  `Text(timerInterval:)` initializer (`pauseTime`, `countsDown`, `showsHours`); no
  per-unit overload exists.
- Probe (iOS 26.5 simulator, system Arabic, screenshots read by `vision`; raw files
  under `~/athan-gitree/tmp-135-probe/`, never committed): the default ticking timer
  renders Latin digits with colons under system Arabic (`1:48:57` at 1h49,
  `45:27` at 45m, unpadded hours, hours group auto-dropping, `108:57` total-minutes
  under `showsHours: false`); a pinned `en_US` environment changes nothing; and
  `.environment(\.layoutDirection, .rightToLeft)` flips an HStack pair natively
  (Arabic word right, countdown left).
- Build-site receipt: the Arabic unit letters are baked app-side in
  `widgetStrings()`; the patch's device-locale hunks feed only the STATIC tables.

Frontier: eleven decisions taken agent-ruled (PLAN.md section 2.1, D135.1 to
D135.11), each with the losing options argued. The two the owner vetoes by right:
D135.5 (the iOS countdown keeps the platform's ticking face; letters are impossible
on a ticking WidgetKit text) and D135.6 (no locale pin unless the iOS 18.5
simulator shows native digits under system Arabic).

Draft: PLAN.md, four step files, records, pre-flight, three break scripts, eight
anchors (each counted 1 at `cd171855`).

Grill round one (fifteen findings, all applied): the planned-at version was
2.0.1014 where `uat` at `cd171855` carries 2.0.1013 (header, pre-flight, LOG and
step references re-pinned); step 4's Android build named `build-mock.zsh`, which
hard-unsets the suffix and cannot produce the fleettest id (the step now spells
the ticket-134 scratch-worktree fleettest ritual with the suffix exported inside
the prebuild and the `aapt2` gate); the step-3 break script ran
`npx patch-package expo-widgets` after mutating the tree, which would have baked
the break into the committed patch (restores from `$TMPDIR` now, patch-package
ban recorded); step 2's tests 4 and 5 are guards green at red time (marked, and
the records text now says three reds plus two guards); the mirror table claimed
a `textAlign: 'end'` that today's tree never passes (the row now states the no-
prop truth, test 4 asserts the falsy path gains no prop, and the two stale
textAlign comments are named for deletion); R5.1 as written was false under step
1's own ms/so/hi/th byte change (scoped to direction inputs plus en bytes); step
3's docblock negative would never go green while the v8/v4 version comments keep
their provenance words (scoped to the two field docblocks); the locale seeding
pattern now names `setActiveLocale` and `widgetTimeline.test.ts:200-221`; the
step-1 comment placement is pinned above the fields so the break anchor holds;
the mutant count is the table's eight swappable rows; the XS in-place upgrade
now cites the atlas's dev-signed signing row with the `EXPO_IOS_SUFFIX`
fallback; and three nices (diff --git headers, the `unit` jest project, the
pre-flight comment's claim). Gate re-run: PLAN OK.

Grill round two (four musts, three shoulds, six nices, all applied): the step-3
Swift hunk carried a `return` keyword that breaks a ViewBuilder body (verified by
`swiftc` on the exact shape: `missing return in getter`; `-typecheck` hides it and
the failure would have surfaced only at the owner's step-4 phone build) — deleted;
PLAN section 7 still named the round-one-dead `build-mock.zsh` path and now names
the scratch-worktree ritual; the two step-1/2 break scripts restored with
`git checkout`, which would have reverted the uncommitted fix (both now copy the
pristine file to `$TMPDIR` and restore from it, ticket 134's pattern); D135.6's
trigger said "the XS under system Arabic" where step 4 rightly forbids touching
her phone's system settings (the trigger is the iOS 18.5 simulator, the XS read
is app-Arabic only); the step-2 done-when said six mutants (eight); step 3's
Files and Review now name `widgetContract.test.ts` (two test files); the
fleettest suffix now rides the gradle invocation too (`ai/AGENTS.md`'s "prebuild
and build"); the 3T read gains the LTR-ambient precondition (an Arabic system
locale double-flips the composition mirror); the break scripts carry
`--selectProjects=unit`; step 3's red reason is the docblock's missing consumer
name, not a "blocked" word the field docblocks never carried; the docblock
expectation matches the contract's verbatim wording; step 1 names `LOCALE_IDS`;
the convergence wait is bounded by its logcat line with a 60 second ceiling; and
the conceded `textAlign` non-defect left the anticipated-fixes list (the table is
correct as written). Gate re-run: PLAN OK both rounds.

The planning probe artefacts stay under `~/athan-gitree/tmp-135-probe/` (never
committed); the probe app itself is deleted at the lane's end unless step 4's
simulator branch needs the 18.5 rebuild.

OWNER AMENDMENT MID-PLAN, 2026-10-18 (queue commit `65a88291`, read after grill
round two): item 2 amended — the Android widget countdown is exactly the app
countdown component's face (Latin digits, lowercase h m s, HEAD sizing: letters
0.95 x, tight, 12 point group gap at the 26 point digit size, composed because the
runtime's Text is single-style); the iOS widget countdown keeps what it is now,
no formatting change, row 128 discarded outright. The planning frontier's D135.5
and D135.6 are therefore HER rulings now, not agent-ruled: the plan's evidence
(the SDK's single timerInterval initializer, row 22's concatenation finding, the
Latin-digit probe under system Arabic) stands recorded and agrees with her. The
conditional locale-pin branch is dead; step 4's simulator read is confirmatory
only. Rows 117 (unparked, runs after 135) and 116 (still benched) noted; neither
touches this lane.

### Step 00 — planning
session: pending
