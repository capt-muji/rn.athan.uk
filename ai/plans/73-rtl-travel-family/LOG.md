# LOG — ticket 73

## Ticket 73

## Decisions relayed to executors

- 2026-10-14: the first executor dispatch was misread dead from a too-early tree snapshot; a second executor was dispatched onto the live first child, and the lead's cleanup (`git checkout --` on the step-1 test file, then a stash) raced the first child's mutation pass. The executor later logged this as an external `git reset --hard` at 06:33 and suspected the concurrent lane: the actor was the lead, and no run-78 command touched this worktree. The stash was dropped; root cause recorded — liveness reconciles now read the session store, never the tree alone.
- 2026-10-14: the executor's STOP on step 1's mutation (c) is upheld. The Reanimated Jest mock evaluates `useAnimatedStyle` synchronously, so the animated transform entry shadows the static fallback in `toHaveStyle` and the static sign is unobservable in Jest; the plan's claim that the drawn transform is the static one was unproven theory. Mutation (c) is dropped from step 1 by the plan amendment of this date; (a) covers the step's changed guard and (b) the derived slot. Step 1 restarts cold from the amended plan (the lead, under the owner's run order, 2026-10-14).

### Step 1 — done

Branch `ticket/73`, commit `4c1ae0be`, version 2.0.260 (`2.0.260 - fix(alert):
the segmented pill keys its travel on the locale's own direction, not the
bridge snapshot`). Preflight ended `PREFLIGHT OK` (anchors 6 x 1). Red as
predicted: the mirrored-slot test received `translateX: "200%"` where `-200%`
was expected, the slide test's `toHaveBeenCalledWith(-200, ...)` unmet (received
`200`); 2 failed, 10 passed, no other case. Green 12/12; `npx tsc --noEmit` 0;
`npx biome check . --error-on-warnings` 0. Break `bash $TMPDIR/break-73-1.sh`:
count 2, `ALL AS EXPECTED: 1`, tree back to the step's two files. Mutations:
(a) `const isRTL = false;` — fails both new tests (proven by the break run);
(b) `const slot = selectedIndex;` — fails both new tests
('draws the pill under the mirrored slot…' and 'slides the pill to the mirrored
slot…'). Hook: `Tests: 2 skipped, 5563 passed, 5565 total`; coverage
Statements/Branches/Functions/Lines 100% (5272/2297/1100/4721). Review: en
tests untouched; the new describe forces the locale through `setActiveLocale`
(the app's own path); the only production change is the direction source, its
comment and the import pair; the two remaining `I18nManager` strings are the
plan's own comment text, no code residue.

Incident, recorded for the relay: the first commit landed as `255ef116` with
ticket 81's message — the executor convention `$TMPDIR/msg-<step>.txt` collides
across concurrent sessions in the machine temp dir, and this session read a
stale `msg-1.txt` from the ticket-81 lane. Content was verified exactly this
step's six files (README cell `IN PROGRESS, step 1`, versions 2.0.260, the
SegmentedControl diff); the commit was amended in place (nothing merges this
run) to the plan's exact message, hook re-ran green on the amend. From here on
message files are written by shell under ticket-unique names
(`t73-step<N>-commit-msg.txt`). Second defect, also this session's: the first
commit attempt failed the hook's biome on `app.json` — a whole-file
`json.dumps` rewrite re-serialised every line; restored from HEAD and bumped
the version line surgically instead (1-line diff, biome clean).

session: ses_ec70bc668ffeK0ux7kMx2FbfI1

### Step 2 — done

Branch `ticket/73`, commit `d7dec7c5`, version 2.0.261 (`2.0.261 - fix(alert):
the switch thumb keys its travel on the locale's own direction, not the bridge
snapshot`). Anchors recounted 1 and 1 at step time. Red as predicted: the
mounted-on test received `translateX: 18` where `-18` was expected, the change
test's `toHaveBeenCalledWith(-SIZE.toggle.translateX, ...)` unmet (received
`18`); 2 failed, 11 passed, no other case. Green 13/13; tsc 0; biome 0. Break
`bash $TMPDIR/t73-break-2.sh`: count 2, `ALL AS EXPECTED: 1`. Mutations:
(a) `const isRTL = false;` — fails both new tests (proven by the break);
(b) `const target = value ? SIZE.toggle.translateX : 0;` — fails both new tests
('draws its thumb settled at the mirrored on position…' and 'animates its thumb
to the mirrored on position…'). Hook: `Tests: 2 skipped, 5563 passed, 5565
total`; coverage 100% (5272/2297/1100/4721). Review: en tests untouched; the
production change is the direction source, its comment and the import pair; the
two remaining `I18nManager` strings are the plan's comment text. Message file
written by shell under the ticket-unique name; no collision this time.

session: ses_ec70bc668ffeK0ux7kMx2FbfI1

### Step 3 — done

Branch `ticket/73`, commit `ce1fd50d`, version 2.0.262 (`2.0.262 -
fix(settings): the colour picker resolves the direction the library
snapshotted`). Anchor recounted 1 at step time. Red as predicted: both new
tests failed with `Expected: "ltr"` / `Received: undefined` and
`Expected: "rtl"` / `Received: undefined`; 2 failed, 12 passed, no other case.
Green 14/14; tsc 0; biome 0 (no import-order assist needed). Break
`bash $TMPDIR/t73-break-3.sh`: count 1 (only the RTL test fails against a
hard-wired 'ltr', as planned), `ALL AS EXPECTED: 1`. Mutations:
(a) the break's hard-wired `'ltr'` (proven by the break); (b) the swapped
ternary `? 'ltr' : 'rtl'` — fails both new tests, each receiving the other
direction. Hook: `Tests: 2 skipped, 5565 passed, 5567 total`; coverage 100%
(5273/2299/1100/4722). Review: the only production changes are the keyed
direction, its comment, the extended import and the two style arrays; the
`styles.panel`/`styles.hueSlider` objects untouched; the RTL test mocks
`getConstants` inside a try with `restoreAllMocks` in its finally.

session: ses_ec70bc668ffeK0ux7kMx2FbfI1

## Planning (2026-10-14)

- Worktree `$HOME/athan-gitree/run-73`, branch `ticket/73` off `b1bf6f89` (uat 2.0.255). The main checkout stays read-only; the owner's run order forbids merge, push and DONE this run.
- Code map read: `components/sheets/parts/SegmentedControl.tsx`, `components/sheets/parts/Toggle.tsx`, `components/sheets/screens/ColorPicker.tsx`, `components/sheets/screens/ReminderCard.tsx`, `components/sheets/screens/Alert.tsx`, existing tests for each.
- Library read: `reanimated-color-picker@5.1.3` (`Panel1.js`, `SliderCore.js`, `Thumb`, `styles.js`, `utils.js` — its `isRtl` is hardcoded `false`).
- RN read: `react-native@0.88.0-rc.3` transform pipeline (`processTransform.js`, `conversions.h`, `Transform.h/.cpp`, `primitives.h`).
- Dispatched: `explore` (ses_ec749808bffeBy9GxnTZF6y8bf) on the rc's translateX direction handling; `vision` (ses_ec7488332ffey2qsICobQcZOKh) on `$HOME/Downloads/IMG_0029.png` (never committed).
- Family sibling noted, out of ticket scope and out of this run's editable surface: `shared/qiblaWave.ts` `wavePoint` negates x under RTL for the QiblaWave phone's translateX; if the rc mirrors animated translateX, the drawn wave path and the phone diverge under ar. Reported to the queue owner in the plan's report section; not fixed here.
- `yarn install` completed in the worktree (patches applied, INSTALL_OK).
- Vision read of `$HOME/Downloads/IMG_0029.png` (2026-10-14, iPhone XS current build under ar; transcribed only, never committed): the big panel spans x=63..1061 of 1125 px, y=1000..1599 (332.67 x 199.67 pt), its saturation and brightness gradients are both monotonic and LTR-ordered (white left, pure hue right, bright top, black bottom); the selection circle sits exactly on the panel's top-right corner at (1061, 999) carrying S100 V100 hue 152, which is the colour that corner means; the hue marker sits at 42.2 percent of the bar with hue 152 = 42.2 percent of the wheel, bar ramp red-left to magenta-right; both swatch rows, title and buttons symmetric. THE ONE DEFECT: a constant opaque 1 px (0.33 pt) accent-green vertical line at the panel's exact right edge, full height, staying bright even where the panel is black — the image layers stop about 1 px short of the right edge, exposing the container's pure-hue background — plus a fainter 1 px light-green-white line along the bottom edge (x=92..1031, alpha-blended). Top and left edges are clean. So the current iOS build renders the picker LTR-correct with a direction-keyed 1 px shortfall at the trailing edges; her 2026-10-13 split-box reading and the reversed hue marker belong to the earlier test surface (the 3T mock build).
- Explore worker returned (2026-10-14): RN 0.88.0-rc.3 contains no transform-direction coupling anywhere — `BaseViewProps.cpp:544-565` resolves transforms from the frame size alone, `Transform.cpp:178-187` resolves percentages with no flip, Android's `BaseViewManager.java:570-655` applies the decomposed matrix physically, Reanimated 4.7.0 has no direction handling, and the Jest side passes transform values through unchanged. The RTL-conditional sites in the renderer are borders, Yoga's left/right swap (`YogaLayoutableShadowNode.cpp:641-643`, gated on the global `doLeftAndRightSwapInRTL` flag AND the node's resolved direction), root constraints, culling, iOS scroll offsets and the Android per-view `layoutDirection` (`SurfaceMountingManager.kt:811-815`). The `direction` style prop converts into the node's yoga style (`propsConversions.h:27`).
- Diagnosis settled from both reports plus the owner's measurements: the app components branch on `I18nManager.getConstants().isRTL`, a bridge-start snapshot; in a starved crossing (row 78's measured state) the native layout already renders Arabic while the snapshot still says LTR, so the English travel branch runs under RTL layout and every travel exits right — Off's pill at the anchor alone looked right, Silent one pill-width past the edge, Sound gone (row 68's missing indicator), every switch thumb off its track. The picker's half: the library hardcodes LTR; Android's left/right swap re-anchors its left-placed absolute children (the reversed marker, the split box), iOS's swap-off rendering leaves the 1 px rounding sliver.
- Scratch proofs, round one (static containment) in `$HOME/athan-gitree/worktrees/plan-73` (deleted after): steps 1 and 2 red-then-green exactly as the plan predicts; the accessibility-label reach proven (`UNSAFE_getByType` and `screen.root.queryAll` are dead ends in @testing-library/react-native@14.0.1 — the library host tree sits outside the walk root; the labels are `Saturation and brightness 2D slider` and `Hue Slider`); the step-3 break substitution counts 1 and fails the named test.
- The grill (2026-10-14) returned six findings; all applied. The decisive one: the app consumes the package's `react-native` field (`lib/src`), whose `utils.tsx:6` reads `I18nManager.isRTL` at module load — the compiled builds Jest resolves froze `false`, which is what the first proofs ran against. A static `direction: 'ltr'` would force LTR resolution onto the library's RTL-written geometry in every completed crossing and re-break the picker there; the design became the keyed containment (D3), and one compiled-build citation in the plan was corrected with it. The other findings: the READY-commit/clean-tree gap, the version-bump exception missing from the executor's stop-list, three rotated step numbers, the stale two-line comments above the rewritten describes, and the break scripts' ungated success marker.
- Scratch proofs, round two (keyed containment, all changes together): both new picker tests red (`Expected: "ltr"` / `Expected: "rtl"`, both `Received: undefined`), green 14/14 after the keyed change; the hard-wired-'ltr' break fails exactly the RTL test (grep count 1); the swapped-ternary mutation fails both; the whole components project passes 350/350 with steps 1 to 3 applied together; `npx tsc --noEmit` exits 0; biome clean after one organize-imports pass. The keyed picker tests need no locale forcing, so the plan's step 3 imports only `I18nManager` and `StyleSheet`.

## Findings (executed)

- The family's mechanism, pinned from the pinned sources and the owner's two test readings:
  RN 0.88.0-rc.3 flips no transform on any path (BaseViewProps.cpp resolveTransform is
  direction-blind; Android's BaseViewManager applies the decomposed matrix physically;
  Reanimated 4.7.0 carries no direction handling), so the travels exited the screen because
  the controls branched on I18nManager.getConstants().isRTL — a bridge-start snapshot that a
  starved crossing (row 78's state) leaves at false while the native layout already renders
  the Arabic locale: the English travel branch ran under RTL layout and pushed the pill and
  every switch thumb off the control to the right. The picker's half: the library hardcodes
  isRtl false, so Android's RTL left/right swap re-anchored its left-placed absolute
  children to the physical right (the reversed hue marker, the displaced rotated overlay of
  the 2026-10-13 split box), and iOS's swap-off rendering left only the ~1px RTL rounding
  sliver at the panel's right and bottom edges that the 2026-10-14 read measured.
- The fixes: the segmented control and the switch derive their travel's direction from the
  locale's own direction (localeDirection of currentLocaleId, the same source bootstrap keys
  forceRTL on); the picker's panel and hue bar carry a direction keyed to the bridge snapshot
  the library branched its geometry on, so each launch state resolves the layout its geometry
  is written for. English rendering is untouched: under en every changed expression evaluates
  to the value it held at 2.0.255.
- Proven by the named tests red before green, the break scripts (each ending
  `ALL AS EXPECTED: 1`), the mutation passes, and coverage at 100 percent statements,
  branches, functions and lines on every changed file.
- Reported, not fixed (outside this run's editable surface and outside the ticket's four
  defects): QiblaWave reads the same lagging bridge constant, but its SVG path and its phone
  travel share one flag and cannot diverge from each other; the queue owner may fold the
  read into the same locale-keyed source when a ticket touches that surface.
- The owner's device test is the acceptance bar; nothing here was proven on a phone.

### Step 4 — done

Branch `ticket/73`, commit `78925c55`, version 2.0.263 (`2.0.263 - docs(plans): ticket
73 executed: the RTL travel family, three behaviour fixes proven by tests`). The commit
carries the records text above (49 lines), the four ticked checklist boxes in PLAN.md, the
queue row's EXECUTED cell and the 2.0.263 version pair; its diff touches nothing else. The
hook gated the commit green (a landed commit is a passed hook). The executor's final report
claimed this entry existed; it did not — the lead reconstructed it from the repository on
2026-10-14 and this entry records that repair. The executor's report also flagged that
step 4's re-run of the pre-flight cannot pass post-execution (three anchors count 0 because
steps 1 to 3 replaced their own anchor text): upheld as a plan defect in the plan's step-4
Checks line, harmless to the code, adjudicated in AUDIT.md.

session: ses_ec70bc668ffeK0ux7kMx2FbfI1



