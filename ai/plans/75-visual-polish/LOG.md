# Ticket 75 ledger

## Ticket 75

Visual polish: mosque SVG mirroring, no scrollbars anywhere, toggle outline to the
card edge. Branch `ticket/75`, worktree `$HOME/athan-gitree/run-75`, anchor
`1b0d5229` (2.0.402).

## Planning (2026-10-14)

The owner is not interviewable this run; her three rulings in the queue row are the
specification, and the run order (2026-10-14) authorises autonomous decisions.

Research findings, all verified against `1b0d5229`:

- The mosque mark is `components/ui/Masjid.tsx`, one `Image` drawing
  `masjid.png` or `masjid-ramadan.png`. `Day.tsx` mounts it on both schedule pages
  beside the date; `Error.tsx` is the other mount site (ticket 80 claims that file;
  the mirror lands inside `Masjid.tsx`, so it never changes).
- The toggle's off-state border is `COLORS.interactive.inactiveBorder` (`#3b3977`),
  one reader in the whole repo (`Toggle.tsx:83`). The cards' edge is
  `rgba(99, 102, 241, 0.15)` (`Settings.tsx` `styles.card:221`; the same literal on
  the Alert, Language, Sound and Reminder cards).
- The scrollables sweep: the three modal scroll views already hide their indicators
  with tests; the shared `Sheet.tsx` wrapper is the one surface missing it; no
  `FlatList` or `SectionList` in app source; the pager draws no indicator; the
  prayer list is a plain `View`; the Qibla sheet renders `BottomSheetView`.
- The library (`@gorhom/bottom-sheet` 5.2.14) forwards
  `showsVerticalScrollIndicator` to the wrapped scroll view
  (`createBottomSheetScrollableComponent.tsx:40,81`), default true.
- Her question answered: the sheet scrollbar predates the RTL work.
  `1a1b4a8c` (1.5.3, 2026-08-28) hid it in the `@expo/ui` sheet era; `59267ed6`
  the same day reverted sheets to the library verbatim from `9e6ba84`, which never
  hid it, and the hiding died there. Rows 58a and 68 never touched the indicator.

Decisions D75.1 to D75.6 sit in `PLAN.md` section 2.1 with their sources. The plan
passed the grill (findings and verdicts below) and `scripts/check-plan.sh` printed
`PLAN OK`.

## Planning (2026-10-14): grill findings

The griller verified the plan against the worktree: all six anchors count 1, the cited
lines and library claims check out, the D75.3 history verifies commit by commit, the
step-2 red-phase prediction holds (the components project renders the library's
published mock, whose `BottomSheetScrollView` injects no default), and every
acceptance criterion traces to a step. Five musts, five shoulds, three nices; every
one applied:

- The bolded `**Weight:**` lines never matched the gate's `^Weight:` grep: unbolded,
  and the gate now prints `PLAN OK`.
- `--selectProjects=app` named a project that does not exist (`jest.config.js` holds
  `unit` and `components`): every jest command re-pointed to `components`, the
  constants suite to `unit`.
- `node_modules` was missing in the worktree and the plan named no action: the lead
  symlinked the main checkout's in (the executor never installs), and section 3
  records the rule.
- The break scripts ran before their step's commit, so `git checkout --` would revert
  the uncommitted change: every break moved after its commit, restoring the committed
  file.
- Step 1's LTR claim sat inside the `ar` describe's `beforeEach` and would fail on a
  correct change: it moved to its own describe with an explicit `setActiveLocale('en')`.
- The sweep overstated Help's test (it pins the height, not the indicator): wording
  set right for the sweep and the test map.
- The pre-flight's ticket-80 guard missed `ColorPicker.tsx`, which that ticket's plan
  claims: added, and the count line now says eleven.
- "byte-identical to the pre-ticket face" was unreadable from an image: the English
  control read now names what to see.
- The foreground `expo run:ios` would die at the harness timeout: it runs in the
  background against a log, polled in 15-second cycles.
- The anchor checks named no working directory: every step now says the worktree root.
- The scroll screenshot now captures during the gesture, with the prop test named as
  the ruling's proof.
- The D59 wait wording aligned between PLAN and the step file; the transcription names
  the running version against the record commit's bump.

The gate printed `PLAN OK` after the fixes.

### Step 01 — done

Anchor `masjid-image.txt` counted 1 in `components/ui/Masjid.tsx`. Red run: 10 tests,
2 failed as predicted, 8 passed — `mirrors the mark under the Arabic locale` failed at
`Masjid.test.tsx:77` and `mirrors the Ramadan variant under the Arabic locale on the
same rule` failed at `:86`, both on `toHaveStyle({ transform: [{ scaleX: -1 }] })`
(expected transform, received none); `draws the mark unmirrored under the English
locale` passed.

Change: `components/ui/Masjid.tsx` took the `isRTL` read on
`localeDirection(currentLocaleId())`, the one-line row 73/78 comment, the
`isRTL && styles.mirrored` style entry and the `mirrored` stylesheet key. Green: the
file's suite 10/10, `tsc --noEmit` clean.

Version 2.0.451 in `app.json` then `package.json`. Commit `d6755e64`
(`d6755e6469a9d10cd26f1aef312c1934ef13d2c6`) on `ticket/75`.

Deviation, recorded: `.husky/_` does not exist in this worktree, so `core.hooksPath`
pointed at a missing directory and git ran no hook — the commit landed with the
gates silently skipped. The gate commands then ran manually against the committed
tree: `yarn validate` passed (`Tests: 2 skipped, 5573 passed, 5575 total`; coverage
Statements/Branches/Functions/Lines all `100%`, 5284/2303/1102/4733);
`node scripts/check-identifiers.js --push d6755e64...` exit 0;
`node scripts/check-changed-coverage.js --push d6755e64...` exit 0. The lead should
create `.husky/_` (or run husky) before steps 3-4 so their hooks fire.

Second deviation, recorded: `biome check . --error-on-warnings` failed on a
pre-existing `app.json` formatting drift introduced by the plan-landing commit
`a7763ba9` (it split two arrays that `1b0d5229` kept one-line). It would have
blocked every commit, so the formatter restored its own canonical shape
(`npx biome check --write app.json`, content otherwise untouched) in this step's
commit. Biome repo-wide now passes.

Break script after the commit: the stripped file ran `-t "mirrors"` red — last line
`Tests:       2 failed, 8 skipped, 10 total` — then `git checkout --` restored and
the full suite ran green (`Tests: 10 passed, 10 total`).

Review pass (cold, against the checklist): the comment links the row 73 precedent
and the row 78 cause in one line, no copy of the Toggle paragraph; no `Platform`
check, no `I18nManager` read, no new asset; the LTR path keeps the same style-array
shape with a trailing `false` RN ignores; nothing beyond the contract moved
(sources, variants, splash gate, sizing, container). No findings.

session: ses_ec63afda5ffe1E11Y4giDFXKa2

### Step 02 — done

Anchor `sheet-contentwrapper.txt` counted 1 in `components/sheets/parts/Sheet.tsx`.
Red run: 26 tests, 1 failed as predicted, 25 passed — `hides the scroll indicator on
its scroll view` failed at `Sheet.test.tsx:108` (`Expected: false, Received:
undefined`, the library default drawing the indicator); `lays out a sheet that is not
scrollable with no scroll view` stayed green untouched (R2.2).

Change: the scrollable branch of `contentStyle` took
`showsVerticalScrollIndicator: false` verbatim per the contract, with the one-line
ruling comment; the fixed branch untouched. Green: the file's suite 26/26,
`tsc --noEmit` clean, biome clean on both touched files.

Version 2.0.452 in `app.json` then `package.json`. Commit `035fe4df`
(`035fe4df4d9907b5b2839841ff8868d6936fa035`) on `ticket/75`.

The hook again silently skipped (`.husky/_` still missing in the worktree, the step 01
deviation stands); the gate commands ran manually against the committed tree:
`yarn validate` passed (`Tests: 2 skipped, 5574 passed, 5576 total`, one more than
step 01's run — the new claim; coverage Statements/Branches/Functions/Lines all
`100%`, 5284/2303/1102/4733); `check-identifiers.js --push 035fe4df...` exit 0;
`check-changed-coverage.js --push 035fe4df...` exit 0.

Break script after the commit: the stripped file ran `-t "hides the scroll indicator"`
red — last line `Tests:       1 failed, 25 skipped, 26 total` — then `git checkout --`
restored and the full suite ran green (`Tests: 26 passed, 26 total`).

Review pass (cold, against the checklist): the fixed branch was not touched and
`BottomSheetView` receives no scroll prop; the comment carries the ruling and the
pinned library default, not the history (the history lives in `LOG.md`); nothing
beyond the contract moved (snap points, paddings, lifecycle). No findings.

session: ses_ec63afda5ffe1E11Y4giDFXKa2


### Step 03 — stopped: pre-flight

Ran the pre-flight from $TMPDIR per the step file. It did not print PREFLIGHT OK:

- `PREFLIGHT FAIL: anchor masjid-image.txt counts 0 in components/ui/Masjid.tsx (expected 1)`
- `PREFLIGHT FAIL: anchor sheet-contentwrapper.txt counts 0 in components/sheets/parts/Sheet.tsx (expected 1)`

Both anchors pin the pre-change code that this ticket's own steps contracted to
rewrite: step 1 (d6755e64) reflowed the `Image` element to add `isRTL &&
styles.mirrored`, step 2 (035fe4df) added `showsVerticalScrollIndicator: false` to
the scrollable `contentStyle` branch. The anchor files were never refreshed (last
touched by the planning commit a7763ba9), so the whole-ticket pre-flight can only
pass before step 1. Not repaired: anchors are not the executor's to edit.

Everything else on the gate passed: branch ticket/75 descended from 1b0d5229, clean
tree, app.json and package.json agreeing at 2.0.452, node_modules present, all
fifteen parallel-invariant files untouched since the anchor. Step 3's own three
anchor checks (constants-interactive, toggle-track, settings-card) each count 1.

No step work started; tree untouched. Awaiting replan: refresh the two anchors to
the committed post-step-2 text, or rule the pre-flight a pre-step-1-only gate.

session: ses_ec62cc4daffeZXvxMAfGxMv2ph

## Planning repair (2026-10-14)

Step 3's executor stopped on the pre-flight: the whole-ticket anchor block counted
steps 1 and 2's anchors against the working tree, where their own commits had already
rewritten the pinned code, so the gate was unsatisfiable after step 1. A plan defect,
repaired by the lead: the pre-flight now counts every anchor against the planned-at
sha `1b0d5229` (the template's own meaning), and each step's anchor check keeps
guarding that step's files in the working tree at step time. The version ladder
shifts by the repair commit: step 3 commits at 2.0.454, step 4's record commit at
2.0.455. Step 3's own three anchors counted 1 in the working tree throughout (the
executor verified before stopping); no code changed in this repair.
