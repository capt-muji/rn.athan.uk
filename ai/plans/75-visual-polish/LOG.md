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


### Step 03 — done

Pre-flight: `PREFLIGHT OK` from $TMPDIR against the repaired gate (anchors counted
against the planned-at sha `1b0d5229`). This entry replaces the same-day
`Step 03 — stopped: pre-flight` entry: the whole-ticket gate that stopped the step
was unsatisfiable by design after step 1, and the lead's planning repair (below)
re-pointed it; this step's own three anchors — `constants-interactive.txt`,
`toggle-track.txt`, `settings-card.txt` — each counted 1 in the working tree before
any work started.

Red run: 15 tests, 1 failed as predicted, 14 passed — `borders its off state with the
cards' edge colour` failed at `Toggle.test.tsx:83` (`Expected: rgba(99, 102, 241,
0.15)`, `Received: "#3b3977"`); `keeps its on state border unchanged` passed; every
travel claim passed untouched.

Change: `shared/constants.ts:745` `inactiveBorder: '#3b3977'` →
`'rgba(99, 102, 241, 0.15)'`, the doc comment and every other line untouched;
`Toggle.tsx` carried no diff (its sole reader keeps reading the repointed key).
Green: the toggle suite 15/15, travel claims included; the constants suite 49/49 —
it never pinned the old value, so no pin update was needed. `yarn validate`:
`Tests: 2 skipped, 5576 passed, 5578 total`, coverage 100% (Statements 5284/5284,
Branches 2303/2303, Functions 1102/1102, Lines 4733/4733).

Formatter note: biome canonicalises the apostrophe-carrying test name to double
quotes (fewer escapes than the single-quoted escape); the name text is the plan's
verbatim. The first `yarn validate` failed on that quote style alone; the formatter
applied it and the rerun went green.

Version 2.0.454 in `app.json` then `package.json`, `npx biome check --write app.json`
after the node rewrite; both files one-line diffs, agreeing.

Commit `aee3ec7a` (`aee3ec7aea67caaab270674d53b2f138c913f501`) on `ticket/75`. The
pre-commit hook fired end to end: `check-identifiers --staged` ✔, lint-staged
(biome `--write` + `jest --findRelatedTests` on the two touched sources) ✔,
`yarn validate` ✔ (`Tests: 2 skipped, 5576 passed, 5578 total`; coverage 100% —
5284/2303/1102/4733), `check-changed-coverage --staged` ✔ (silent on success). This
ledger entry lands in a docs-only commit at the same version rather than an amend of
the step commit: amending would rehash the commit away from the sha this entry
records.

Break script after the commit: the replace hit exactly one line (verified with
`git diff --stat` before running), `-t "cards"` ran red — last line
`Tests:       1 failed, 14 skipped, 15 total`, the off-state colour claim receiving
`#3b3977` — then `git checkout -- shared/constants.ts` restored the committed value
and the full suite ran green (`Tests: 15 passed, 15 total`).

Review pass (cold, against the checklist): `Toggle.tsx` carries no diff; the travel
claims were not edited, only added beside (the import line extended with `COLORS`,
pure additions inside the describe); `LabeledToggle.test.tsx` and the settings sheet
suites pass inside the hook's full validate run; no lifecycle, thread or residue
class applies to a one-value constant repoint; no stale value stands anywhere (the
constants suite never pinned the old literal). No findings.

session: ses_ec6277b8bffedMBK3OqKPyUOQf

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

### Step 04 — stopped: layout swap

Anchor check: steps 01–03 ticked above, `ticket/75` at `547d36e6` / 2.0.454, clean
tree. Build: `npx expo run:ios` from the worktree root, background log
`$TMPDIR/t75-build.log`, prebuild + pods + compile ≈ 5.5 min, dev build with Metro on
its default port. The app launched on the booted simulator and the Standard schedule
rendered.

Simulator: `Athan-77`, iPhone 16 (com.apple.CoreSimulator.SimDeviceType.iPhone-16),
iOS 18.5 runtime, UDID SIMULATOR_UDID. App version under the
build: 2.0.454 (the record commit would have been 2.0.455; no record commit landed —
the step stopped, version stays 2.0.454).

Booted-state note: the app relaunched already in Arabic — persisted state on this
simulator from an earlier session, not this run's doing. To run the drive as written
(from English), the language was set back to English through the app's own Settings
before the drive began; no data was wiped, no code touched. The build log carries
three full launch sequences: the Arabic boot, the ar→en crossing, and the en→ar
crossing — the D59 force + reload fired on both crossings.

Environment drift, not acted on: `xcrun simctl list devices` now also shows a second
booted simulator, `Athan-76` (iOS 26.5), which the lead's pre-dispatch check did not
have. All reads below came from the Athan-77 session the build opened.

Data-path note: launches 1 (Arabic boot) and 3 (English relaunch) carried the mock
path — prayers a minute either side of launch (11:09–11:17, then 11:27–11:34). The
launch-2 relaunch under `ar` pulled the REAL API instead: Fajr 04:03, Sunrise 05:38,
Dhuhr 13:03, Asr 16:58, Magrib 20:19, Isha 21:31, date rolled to الخميس ١٥ أكتوبر.
The step file expects the mock path on the dev build throughout; the reads below do
not hinge on the data source, but the drift is recorded.

The drive, each read from an image this session read directly (paths under
`$HOME/athan-gitree/sessions/75/`):

1. Settings → Language → العربية. The app reloads on the crossing; waited for the
   schedule to render again (لندن visible, ≤20 s).
2. Standard page under `ar` (`step04-ar-standard.png`, header crop
   `step04-ar-header-crop.png`): the location/date block sits LEFT (AX rects x=16),
   the mark RIGHT (~x=335–375). Mark crop `step04-ar-standard-mark.png`: the arched
   door on the building's RIGHT wall, five orange windows on the LEFT wall.
3. Extras page under `ar` (`step04-ar-extras.png`): same arrangement, same mark —
   the crop `step04-ar-extras-mark.png` is byte-identical (`cmp`) to the Standard
   one. Second pagination dot active.
4. Settings sheet scroll (`step04-ar-sheet-scrolling.png`,
   `step04-ar-sheet-scrolling-2.png`): two frames captured immediately after flings,
   content displaced from the top both times; no scrollbar along either edge of the
   sheet. The off toggle (إظهار التاريخ الهجري) shows the faint indigo off-state
   outline on the dark track — indicative only; R3.1's proof stays step 3's jest
   suite. (A third upward fling dismissed the sheet — recorded, then re-driven.)
5. English control face (`step04-en-standard.png`): LTR layout, mark beside the date
   text on the right, as at 2.0.402. Mark crop `step04-en-mark.png`: door on the
   LEFT wall, windows on the RIGHT wall.

Rulings' verdicts:

- R1.1, the mark mirrored under RTL: the DRAWN MARK is mirrored — the `ar` crop is
  the `en` crop flipped horizontally (door left→right, windows right→left), on both
  schedule pages, byte-identical between the pages. The scaleX transform step 1
  landed demonstrably renders. PASS on the transform.
- R1.1's positional read in the step file ("the date column on the right, the mosque
  mark on the left, its face turned inwards toward the text"): NOT MET on this
  simulator. The layout sides do not swap under `ar` — date column LEFT, mark RIGHT,
  so the flipped door faces outward, away from the text. This is not transient: the
  pre-drive boot was a true process launch with `ar` stored and `forceRTL(true)`
  applied in bootstrap at start (stores/bootstrap.ts:89–92), and it rendered
  LTR-arranged too (settings rows: icon left, chevron ‹ at the right end). The
  native layout swap the app's own RTL components assume ("the layout swap owns the
  inset keys", Toggle.tsx / SegmentedControl.tsx from ticket 73) never engages on
  this simulator, though the relaunch mechanism itself fires.
- R2.1, no scrollbar on a moving sheet: no indicator along either edge in both
  in-flight frames, content displaced. PASS (indicative face read; the ruling's
  proof is step 2's jest test).

Why stopped: the step's own drive read for the Arabic face is unsatisfiable here —
the sides the plan predicts are not the sides the simulator renders, and the fix is
never an inline edit in this step. PLAN.md section 7 names the path for exactly
this: the lead drives the owner's iPhone XS read-only for the missing read. No
commit, no version bump: the record commit at 2.0.455 belongs to a landed step.
Tree left clean; screenshots die with the session under
`$HOME/athan-gitree/sessions/75/`.

session: ses_ec61d5111ffeihoywlFFVGxY9w

### Step 04 — adjudicated done (the lead, 2026-10-14)

The stop's missing read is the POSITIONAL premise (sides swap under ar), which this
ticket never owned: the position is the native RTL layout swap rows 58a and 68
shipped, and the owner herself recorded it working on her device - her ruling opens
"sits correctly on the left under ar". This ticket owns the FACING, and the
simulator proved it: the ar mark crop is the en crop mirrored, on both schedule
pages, byte-identical between the pages. The two mechanisms are independent (the
row layout flip places the mark; the scaleX transform turns it), so on her device,
where the swap engages and the mark sits left, the mirrored mark faces inwards.
Both her rulings therefore carry a read verdict: the mirror PASS from the crops,
the scrollbar PASS from the two in-flight frames with no indicator on either edge,
the English control clean.

The iPhone XS fallback is ruled out: the XS cannot render this branch's code without
an install, which the owner's run order forbids, and the position it could show is
already her recorded observation. No drive.

The environment finding is referred, not fixed here: this simulator (Athan-77, iOS
18.5) rendered LTR-arranged through a true process launch with `ar` stored and
`forceRTL(true)` applied at bootstrap, while the D59 reload fired on every crossing.
The direction plumbing is ticket 80's claimed ground (stores/bootstrap.ts, the
layout-direction work); the observation stands recorded here for that lane and goes
in the run report. Nothing in this ticket's files was changed for it.

The data-path drift (launch 2 pulling the real API under ar) is recorded above by
the executor; the reads never hinged on the data source, no time was committed, no
identifier written.

Step 4 closes done: both rulings proven, the control face clean, the transcription
and screenshots under `$HOME/athan-gitree/sessions/75/` dying with the ticket's
merge. The record commit lands at 2.0.455.

session: ses_ec65be08affe8jX8HEkUVF1iGJ
