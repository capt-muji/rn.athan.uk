# LOG — ticket 80

## Ticket 80

## Decisions relayed to executors

- 2026-10-14, step 1: the executor's STOP on the ar modal case is upheld and answered. The plan-verbatim press lacked the `await` the modal's commit needs (the repo's own idiom: the LTR case presses through `await openPicker()`); without it the press runs but the Modal never commits, so the testID lookup fails. Decision (the lead, under the owner's run order 2026-10-14): the ar case's press line gains `await` — the amended text is in the step file now — and nothing else about the case changes; the break script's grep stands, because the awaited press opens the modal and the mutated read then fails with `Received: "ltr"`. The plan files carry this amendment inside step 1's own commit.
- 2026-10-14, step 3: the executor's STOP on the wave suite is upheld and answered. The stage View hides its subtree from accessibility (`accessibilityElementsHidden` — a drawn gesture says nothing a reader can use), so RNTL excludes the SVG from queries unless `includeHiddenElements: true` (the repo's own reach, Qibla.test's `qibla-wave-phone` query). Decision (the lead, under the owner's run order 2026-10-14): the `guidePath` helper gains the flag, nothing else about the suite changes; the amended text is in the step file. The plan files carry this amendment inside step 3's own commit.

## Planning (2026-10-14)

- Worktree `$HOME/athan-gitree/run-80`, branch `ticket/80` off `1b0d5229` (uat 2.0.402). The main checkout stays read-only; the owner's run order forbids merge, push and DONE this run.
- Ground read: `stores/language.ts`, `stores/bootstrap.ts`, `app/index.tsx`, `app/_layout.tsx`, `shared/i18n/locale.ts`, `device/listeners.ts`, `device/updates.ts`, `stores/notifications.ts` (the scheduling lock, the convergence driver), `components/sheets/screens/QiblaWave.tsx`, `shared/qiblaWave.ts`, `components/sheets/screens/ColorPicker.tsx`, `components/sheets/parts/SegmentedControl.tsx`, `components/sheets/parts/Toggle.tsx`.
- Pinned sources read at the installed tree: `react-native` 0.88.0-rc.3 `I18nManager.js`, `RCTI18nManager.mm`, `RCTI18nUtil.m`, `I18nUtil.kt`.
- Ground from history: `git show 0b62c90e:ai/plans/73-rtl-travel-family/AUDIT.md` and `LOG.md` (the QiblaWave sibling read, the swatch-ring ruling D4, the known window row 80 must close); rows 78 and 68 records for the starvation bound, the launch-init latch and D59.
- Planning scratch (deleted before any commit): a throwaway render of `Layout` under en and ar pinned the root's jest shape — a host View whose style arrives as the flattened object `{"flex":1,"backgroundColor":"#2c1c77"}` — and both red failure lines (`Expected: "ltr"/"rtl", Received: undefined`).
- The root inventory (an explore worker, 2026-10-14): one tree root (`GestureHandlerRootView`), every modal and sheet in-tree except the colour picker's react-native `Modal` (the app's only one); five existing `direction: 'ltr'` sites (Overlay, VeilBackdrop, Time, Countdown, RamadanDecorations) prove the prop's per-subtree reach in-repo, row 68's window-space catchers having device-proven it on the 3T; the `direction` prop sits in the installed ViewStyle types and the Fabric conversions; `InitialWidthMeasurement` mounts under the root and measures text intrinsic width, direction-safe.
- The grill, round 1 (2026-10-14): eleven findings, all applied — the RNTL 14 removal of `UNSAFE_*` queries (the wave suite now reaches the guide path through a `testID`), babel-plugin-jest-hoist's variable rule (the mock prefix), the localized picker row label under ar (`لون شريط العد التنازلي`), the break-1 grep contradiction, the rtlSwitch whole-suite red scope, a false import claim, the untested R1.3, the break-3 dead sed, the version-ladder gap, the mutation assertion number.
- The grill, round 2 (2026-10-14): seven findings, all applied — the break-1 arithmetic (the expected total is 2, not 1), the wave suite's red narrative (both cases fail at the testID lookup today), the index suite's missing static import, a `.tsx` typo in section 4.1, the restore-list overcount, the missing R1.4 for the modal host, and the marker write's placement pinned inside the try.
- `bash scripts/check-plan.sh ai/plans/80-layout-follows-app-language` prints `PLAN OK` after both rounds.

## Execution (2026-10-14)

### Step 1 — green (one plan defect found, adjudicated, plan amended)

Branch `ticket/80` in the worktree, straight to the branch per the owner's run order. Pre-flight `PREFLIGHT OK` (copy run from `$TMPDIR`); the five step-1 anchors each count 1.

Red, exactly as the plan names (jest, `--watchman=false`): `__tests__/app/_layout.test.tsx` 3 failed / 12 passed — `the root layout direction › lays the tree out left-to-right under the app's English locale` `Expected: "ltr" / Received: undefined`, `... right-to-left under the app's Arabic locale ...` `Expected: "rtl" / Received: undefined`, `... flips the root direction in place ...` `Expected: "rtl" / Received: undefined`; `components/sheets/screens/__tests__/ColorPicker.test.tsx` 2 failed / 13 passed — both new cases `Unable to find an element with testID: picker-modal-root`.

Contracts applied verbatim (the two imports extended, the commented `direction` const above `Layout`'s return, the root style key, `modalDirection` beside `pickerDirection`, the overlay `testID` + style array).

Plan defect at green: the plan-verbatim ar modal case pressed without `await` and the Modal's commit needs a microtask — the case failed `Unable to find an element with testID: picker-modal-root` with the change landed, and probe runs (scratch suite, deleted) showed `await fireEvent.press` fixes it and its absence fails even LTR. Executor STOPped; the lead upheld the diagnosis and amended the step file (the press line now awaits). Recorded under "Decisions relayed to executors".

Green after the amendment: both suites 30 passed / 30 total; `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0.

Break script `$TMPDIR/t80-break-1.sh` last line `ALL AS EXPECTED: 2`; both ar cases fail `Expected: "rtl" / Received: "ltr"`. Mutation pass: (a) root `direction` → `'ltr'` — the `_layout` ar cases die `Expected: "rtl" / Received: "ltr"`; (b) modal → `'ltr'` — the modal ar case dies the same shape; (c) modal → `'rtl'` — the LTR overlay assertion dies `Expected: "ltr" / Received: "rtl"` ((c) first ran chained on (b)'s mutated file and proved nothing — rerun from the restored original, recorded as executed). All restored after.

Version 2.0.405, `app.json` first then `package.json`, surgical line edits.

Commit `f4363882`. Hook finding, recorded for the lead: the worktree had no `.husky/_` (husky's prepare never ran here), and git silently skips hooks when `core.hooksPath` is missing — the first commit attempt ran no gate at all. Repair: the shims were materialized with the repo's own husky CLI (`npx husky`, gitignored path, no dependency change), the unpushed commit was soft-reset and re-made so the gate genuinely ran on staged content. The hook's evidence: lint-staged (biome + `jest --bail --findRelatedTests` on the four staged files), then `yarn validate` (tsc, biome, `jest --silent --coverage`), then check-identifiers and check-changed-coverage; coverage summary Statements 100% (5285/5285), Branches 100% (2301/2301), Functions 100% (1102/1102), Lines 100% (4734/4734); `Tests:       2 skipped, 5574 passed, 5576 total`.

Review verdict: cold pass — no visual value changed in states that render right today (the resolved direction equals the native answer under system-RTL+ar and system-LTR+en); the starved-state premise asserted in both suites; imports limited to the named ones plus the lead-adjudicated `await`; no what-comments added.

session: ses_ec6683627ffeLg5INxlK8V41Yv

### Step 2 — green

Branch `ticket/80`, straight to the branch. The four anchors each count 1.

Red, exactly as the plan names: `stores/__tests__/rtlSwitch.test.ts` 8 failed / 8 total — the shared `beforeEach` throws on the missing exports (`TypeError: Cannot read properties of undefined (reading 'write')` inside `atomWithStorageString`'s write path), the recorded whole-suite red; `__tests__/app/index.test.tsx` 1 failed / 43 passed — `the launch init and the relaunch handoff ... › skips the reopen on a context that consumed a language relaunch handoff` fails `Expected: not "NOTIFICATION: Android cold launch, reopening the refresh gate so alarms are re-armed"`, while the cold-launch guard case passes at 2.0.402 as the plan states.

Contracts applied verbatim: `relaunchHandoffAtom` + `consumeRelaunchHandoff` beside `languageCommitBusyAtom` (with the plan's doc comments), the marker write as the try's first statement before `reloadAsync`, the clear in the catch before the warn, the index import extended with `consumeRelaunchHandoff`, the anchor block replaced by the handoff branch with its six-line comment.

Green: `rtlSwitch` + `languageConvergence` 13 passed / 13 total (unit), `index.test` 44 passed / 44 total, and the untouched `rtlReloadBound` 5 passed / 5 total (R2.5's companion). `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0.

Break script `$TMPDIR/t80-break-2.sh` last line `ALL AS EXPECTED: 1` (with the condition hard-wired false, the skip case fails on the reopen line; the grep found `skips the reopen`). Mutation pass, all from the restored original: (a) the condition inverted — both index handoff cases die on the reopen line; (b) the consume's clear removed — `consumes the marker exactly once` dies `Expected: "" / Received: "ar"` on its second assertion; (c) the catch's clear removed — `clears the marker when the relaunch is refused` dies `Expected: "" / Received: "ar"`. All restored after.

Version 2.0.406, `app.json` first then `package.json`, surgical line edits. Review verdict: cold pass — the reopen still precedes `initializeNotifications` on a cold launch; the marker touches only whether the gate reopens, never what converges (the `reconcileLanguageSurfaces` chain is untouched and both suites assert its call); the new MMKV key is the plan's D3 name; no log line beyond the two named. The hook now runs in this worktree (`.husky/_` materialized at step 1, see above); its lines are recorded in this commit's log read.

session: ses_ec6683627ffeLg5INxlK8V41Yv

### Step 2 commit record (added at step 3)

Step 2 landed as `36d7b61a`; its hook's evidence: coverage summary Statements 100% (5296/5296), Branches 100% (2305/2305), Functions 100% (1103/1103), Lines 100% (4744/4744); `Tests:       2 skipped, 5580 passed, 5582 total`.

### Step 3 — green (one plan defect found, adjudicated, plan amended)

Branch `ticket/80`, straight to the branch. The three anchors each count 1.

Red, exactly as the amended plan predicts: the new `QiblaWave.test.tsx` suite failed both cases at the testID lookup (`Unable to find an element with testID: qibla-wave-guide`, 2 failed / 2 total).

Plan defect at green, same class as step 1's: the wave's stage View carries `accessibilityElementsHidden` + `importantForAccessibility={'no-hide-descendants'}` (the drawn-gesture rule), so RNTL excludes the whole SVG subtree from queries unless `includeHiddenElements: true` — the repo's own suites reach SVG testIDs exactly that way (`Settings.test.tsx:146`). The plan-verbatim `guidePath` helper could not find the path with the change landed. Probe runs (scratch suite, deleted) proved the fix and that nothing hid behind it: with the flag, the en case's `d` equals the unmirrored path and the ar case's equals the mirrored path against the landed change. Executor STOPped; the lead upheld the diagnosis and amended the step file (the helper now passes the flag). Recorded under "Decisions relayed to executors".

Contracts applied verbatim: the react-native import drops `I18nManager`, the locale import sits sorted between `constants` and `qiblaWave`, the anchor block replaced by the four-line comment and the re-keyed read, the guide Path gains `testID={'qibla-wave-guide'}`, and both picker premise comments restated (the `pickerDirection` line untouched; the test-side comment keeps only the row-73 premise).

Green after the amendment: `QiblaWave` + `ColorPicker` + `Qibla` suites 176 passed / 176 total; `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0.

Break script `$TMPDIR/t80-break-3.sh` last line `ALL AS EXPECTED: 1` — the reverted bridge read leaves the ar case red on the path-string diff the plan names (the received `d` is the unmirrored path where the mirrored one was expected). Mutation pass, both from the restored original: (a) `const isRTL = false;` — the ar case dies on the mirrored expectation (1 failed / 1 passed); (b) the guide path's `isRTL` argument negated — both cases die (2 failed / 2 total). All restored after.

Version 2.0.407, `app.json` first then `package.json`, surgical line edits. Review verdict: cold pass — no drawing constant moved (`shared/qiblaWave.ts` untouched; the component's only new props are the testID and the re-keyed boolean); the picker diff is two comment blocks and nothing else; the new suite asserts the starved-state premise explicitly (`I18nManager.getConstants().isRTL` false while the mirrored path is drawn).

session: ses_ec6683627ffeLg5INxlK8V41Yv

## Findings (executed)

- The React tree's root (`GestureHandlerRootView`, app/_layout.tsx) and the picker modal's
  overlay host (the app's one native-host root, ColorPicker.tsx) carry
  `direction: localeDirection(currentLocaleId())`: the layout follows the SELECTED app
  language in every launch state, and the system locale resolves the initial default only
  (her XS ruling). Proven red-first: the en case failed `Expected: "ltr" / Received:
  undefined` and both ar cases `Expected: "rtl" / Received: undefined` (the root's style
  had no `direction` key), and both picker cases `Unable to find an element with testID:
  picker-modal-root`; green 30/30 cases across the two suites; mutations (a) the root
  `direction` → `'ltr'` killing both _layout ar cases, (b) the modal's → `'ltr'` killing
  the modal ar case (`Expected: "rtl" / Received: "ltr"`), (c) the modal's → `'rtl'`
  killing the LTR case's overlay assertion (`Expected: "ltr" / Received: "rtl"`); break
  `ALL AS EXPECTED: 2`.
- The crossing's relaunch context consumes a one-shot handoff marker
  (`preference_language_relaunch_handoff`, owner-delegated) written before `reloadAsync`
  and cleared on a refused reload, and the launch init skips the cold-launch
  refresh-gate reopen on that answer: an in-process reload cancels no alarm, so the reopen
  stays a cold-launch concern (row 78's aggravator closed). Convergence itself is
  untouched: `reconcileLanguageSurfaces` still runs in every launch context, the
  stamp semantics and the languageConvergence suite unchanged (all 5 green). The
  notification-language diagnosis recorded: an English Maghrib while the app spoke Arabic
  was convergence not yet landed — copy is baked at arm time — now bounded by row 78's
  10 s cap, the relaunch, and the relaunch context's own reconcile.
- The Qibla calibration wave mirrors on the locale's own direction (row 73's reported
  sibling read folded in), proven by the new suite's ar case red-first against the bridge
  read; the picker keeps its snapshot keying with both premise comments restated.
- The en-countdown colon observation needs no fix: row 82 ruled one colon design in every
  language (row 84 carries it; row 85 would restore the en letters only when she says go).
- Versions 2.0.405, 2.0.406, 2.0.407 landed on `ticket/80` (2.0.403 planning, 2.0.404 the
  ready plan, 2.0.408 this commit); `yarn validate` green at the head; the identifier
  gate clean. Device work waived by the owner's run order 2026-10-14: her device test is
  the acceptance bar.

### Step 3 commit record (added at step 4)

Step 3 landed as `88caba8d`; its hook's evidence: coverage summary Statements 100% (5296/5296), Branches 100% (2305/2305), Functions 100% (1103/1103), Lines 100% (4744/4744); `Tests:       2 skipped, 5582 passed, 5584 total`.

### Step 4 — executed

Branch `ticket/80`, straight to the branch. No anchor: a docs step, no production file touched.

Contracts applied: the findings text above under `## Findings (executed)` with every placeholder replaced by this run's measured values (step 1 red shapes and 30/30 green; step 2's languageConvergence at 5/5, index 44/44, rtlReloadBound 5/5; step 3's red-first ar case and its records); the queue row 80's status cell became `EXECUTED 2026-10-14, awaiting audit` (one-line row change, the row's six pipes intact, verified by field-splitting the row); all four checklist boxes ticked; versions 2.0.405-2.0.408 recorded.

Version 2.0.408, `app.json` first then `package.json`, surgical line edits. Review verdict: cold pass — the findings carry only values these steps measured; the queue row parses (one line changed, cells intact); no code file in the diff.

session: ses_ec6683627ffeLg5INxlK8V41Yv
