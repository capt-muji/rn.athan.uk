# Ticket 73 — RTL travel family: segmented pill, toggle travel, colour picker marker and split box

| | |
| --- | --- |
| Brief | Queue row 73 (verbatim in `ai/plans/README.md`) plus the owner's run order of 2026-10-14: one continuous run through audit, physical device work waived (proofs are tests), version range 2.0.256 to 2.0.299, no merge into uat, no push, no DONE |
| Planned at | `b1bf6f89` (uat 2.0.255, 2026-10-14) |
| Planned by | The lead. The owner is not interviewable this run; every decision below records its source, and decisions she would own are recorded owner-delegated to "the owner's run order, 2026-10-14" |
| Needs first | nothing |
| Parent | nothing |
| Group | the app shell's RTL surfaces (row 68's ground). Parallel-safe against row 78: this plan touches `components/sheets/**`, its own plan folder, the ticket 73 queue row, and the version lines of `app.json` and `package.json` |
| Batch budget | 6 |
| Session budget | 8 |
| Steps count | 4 |
| Device | none (the owner's run order, 2026-10-14: physical device work waived; she tests the result on device herself) |
| Owner decisions still needed | none |

## 1. Goal

What is wrong today, in one family: three surfaces branch their physical transforms on
`I18nManager.getConstants().isRTL`, a snapshot read at bridge start, while the native layout
direction follows the app's own forced direction live. In any state where the two disagree —
the starved crossing of row 78 is the proven one: the face and preferences flip to Arabic, the
reload never lands, and the bridge constant still reports the launch direction — the controls
take the English travel branch under a native RTL layout, and every travel exits the screen to
the right: the Athan segmented pill (Off draws behind Off, Silent lands half off-screen, Sound
fully off-screen; row 68 measured no visible indicator at all while `صوت` carried
`selected=true`), and every bottom-sheet switch (off rests at the right, pressing on sends the
circle further right, off the pill). The fourth defect sits in the colour picker:
`reanimated-color-picker@5.1.3` snapshots `I18nManager.isRTL` once at module load
(`node_modules/reanimated-color-picker/lib/src/utils.tsx:6`, the source tree the package's
`react-native` field hands the bundler) and writes its geometry for that snapshot, while the
layout direction follows the live locale. When the snapshot says LTR (a starved crossing; also
every English launch), the library places each absolute child left-anchored, and Android's RTL
left/right swap then re-anchors those children to the physical right edge — the hue marker
travels opposite the drag, and the rotated brightness overlay lands a full panel-width-minus-height away (the 2026-10-13 split box) — while on iOS, where the swap is off, the same
LTR-snapshot state renders the panel exact except a ~1px uncovered sliver at the right and
bottom edges (the owner's 2026-10-14 read, transcribed in `LOG.md`). When the snapshot says
RTL (an app launch or completed crossing under ar), the library takes its own designed RTL
path and must keep doing so: the fix keys the subtree's resolved direction to the same
snapshot the library branched on, never overriding it.

What is true when DONE:

- The segmented pill and the switch derive their travel's direction from the active locale's
  own direction — the same source bootstrap keys `forceRTL` on — so the branch matches the
  rendered locale in every state, starved crossing included.
- The colour picker's panel and hue bar resolve the layout direction the library snapshotted
  (LTR in every state whose bridge constant says LTR, RTL in every state whose says RTL), so
  the library's geometry and its layout agree in every launch state, and the starved-crossing
  states render exactly as English does.
- English rendering is byte-identical to 2.0.255 (her explicit ruling in the ticket).

The owner notices by testing on device: the pill sits behind the chosen option and slides
between options under ar, the switch thumb travels into the track, the hue marker follows the
finger, and the big panel shows no seam.

The owner's rules that apply:

- "keeping en bytes identical" and "en rendering must stay byte-identical" (queue row 73; the
  owner's run order, 2026-10-14).
- "Animated components first-frame in their settled state; only value changes animate"
  (`ai/AGENTS.md`; the SegmentedControl already follows this — keep it).
- "Visuals are settled; these fixes are owner-ruled defects, so behaviour fixes only"
  (the owner's run order, 2026-10-14).
- "Physical device work is WAIVED. Prove with unit/component tests (full coverage of every
  touched line, red before green, mutation pass on guarded logic)" (the owner's run order,
  2026-10-14).
- "do NOT merge anything into uat, do NOT push, do NOT set the queue row to DONE" (the owner's
  run order, 2026-10-14).

## 2. Decisions

### 2.1 Taken

| # | Decision | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D1 | The diagnosis: RN 0.88.0-rc.3 flips no transform anywhere (verified exhaustively from the pinned source); the app components' `I18nManager.getConstants().isRTL` lags the native RTL layout in a starved crossing, so the English travel branch runs under RTL layout and every travel exits right. The ticket's earlier working diagnosis (the rc anchoring `start: 3` at the physical left) is withdrawn: the anchor is sound (Off's pill sits behind Off), the branch was wrong | The lead, from the pinned source and the owner's measurements | 2026-10-14 | `LOG.md` planning entries, section 4 below |
| D2 | The fix for (a) and (b) keys the direction on the active locale through `localeDirection(currentLocaleId()) === 'rtl'` — the same source bootstrap keys `forceRTL` on (`stores/bootstrap.ts:92`) — replacing the `I18nManager.getConstants().isRTL` read in `SegmentedControl.tsx` and `Toggle.tsx` | The lead, owner-delegated (the owner's run order, 2026-10-14) | 2026-10-14 | section 5, steps 1 and 2 |
| D3 | The fix for (c) and (d) contains the library from app code: each of `Panel1` and `HueSlider` gains a `direction` style keyed to `I18nManager.getConstants().isRTL` — the same snapshot the library branched its geometry on at module load (`lib/src/utils.tsx:6`) — so the subtree resolves LTR exactly in the states whose geometry is LTR-written and RTL exactly in the states whose is RTL-written. A static `direction: 'ltr'` was rejected at the grill: it would re-open the completed-crossing state, whose library geometry is RTL-written. No `patches/` entry: the patches directory is outside this run's editable surface, and this containment needs none because the left/right swap requires the node's own resolved direction to be RTL (`YogaLayoutableShadowNode.cpp:641-642`) | The lead, owner-delegated (the owner's run order, 2026-10-14), corrected at the grill | 2026-10-14 | section 5, step 3 |
| D4 | The Swatches rows, the hue bar's rainbow and every other picker surface stay exactly as they render today: the ticket names the hue marker and the big box, the swatch ring's `left: 0` sits inside a cell the ring exactly fills, so no defect exists there | The lead, from the library source and the vision read | 2026-10-14 | section 4 |
| D5 | `QiblaWave.tsx` reads the same lagging constant but draws its SVG path and its phone travel from one flag, so the two cannot diverge from each other in any state; it is not one of the four defects and is left alone. `shared/qiblaWave.ts` is outside this run's editable surface | The lead, from `shared/qiblaWave.ts:41-50` | 2026-10-14 | section 12 (reported to the queue owner) |
| D6 | Device work waived; the owner's own device test is the acceptance bar. Proofs are the red/green tests, the mutation pass and the source citations in this plan | The owner (run order), recorded by the lead | 2026-10-14 | sections 6 and 7 |
| D7 | Every commit lands on `ticket/73` in `$HOME/athan-gitree/run-73`; no branch-per-step off uat, no merge into uat, no push. The standing executor rules that name uat are overridden by this run order. The lead commits this plan folder and the queue's READY cell as `2.0.257 - docs(plans): ticket 73 READY` before any executor dispatch, so the executor's first pre-flight sees a clean tree. Version ladder: the READY plan commit takes 2.0.257, the amendment and ladder-correction commits take 2.0.258 and 2.0.259, steps 1 to 4 take 2.0.260 to 2.0.263, audit fixes take 2.0.264 upward, all inside the reserved range | The owner (run order), recorded by the lead | 2026-10-14 | steps 1 to 4 |
| D8 | The version-lock directory protocol is kept (concurrent lanes take numbers); `android/app/build.gradle` is absent in the worktree, which the lockstep test tolerates (`shared/__tests__/versionLockstep.test.ts:69-71`), so versions bump `app.json` and `package.json` together only | The lead, owner-delegated (the owner's run order, 2026-10-14) | 2026-10-14 | steps 1 to 4 |

### 2.2 The executor must not decide

- A finding that the mechanism citations in section 4 do not hold at the planned-at sha: return
  `NEEDS_CONTEXT: NEEDS REPLAN, <the citation and what contradicts it>`. Never repair the
  diagnosis in flight.
- A need to edit any file outside `components/sheets/**`, this plan folder, the ticket 73
  row of `ai/plans/README.md`, or the version lines of `app.json` and `package.json` that D8
  requires every step to bump: return `STOP:` naming the file and the need. The parallel
  invariant forbids the edit.
- A Jest failure in a file this plan does not name: return `STOP:` with the failing test and
  its output.
- Any wish to change colours, sizes, timings, labels or animation behaviour: forbidden
  (owner-ruled visuals; en bytes identical).

## 3. Pre-flight

`scripts/preflight-73.sh` in this folder, run from a copy in `$TMPDIR` (the executor saves a
copy and runs `bash $TMPDIR/preflight-73.sh`). It checks: the worktree exists, the branch is
`ticket/73`, the tree is clean, `app.json` and `package.json` carry one version of at least
2.0.256 and match, `node_modules/.bin/jest` exists, and all six anchors count exactly 1. It
ends `PREFLIGHT OK`. Anything else ends `PREFLIGHT FAIL: <reason>` and stops the run.

## 4. Background the executor needs

### The code map

| File | One line |
| --- | --- |
| `components/sheets/parts/SegmentedControl.tsx` | The alert sheet's segmented control; lines 118-182 hold the pill's percent travel and the `isRTL` read the fix replaces (anchors `segmented-derived.md`, `segmented-indicator.md`) |
| `components/sheets/parts/Toggle.tsx` | The switch primitive; lines 26-70 hold the thumb travel and the `isRTL` read the fix replaces (anchor `toggle-derived.md`) |
| `components/sheets/screens/ColorPicker.tsx` | The countdown-bar colour row and its picker modal; lines 164-169 mount the library pieces whose styles gain `direction: 'ltr'` (anchor `picker-render.md`), styles at lines 304-311 |
| `components/sheets/parts/__tests__/SegmentedControl.test.tsx` | What a screen reader hears, what a press reports, where the pill sits; the RTL describe at lines 141-176 the step rewrites (anchor `segmented-test-rtl.md`) |
| `components/sheets/parts/__tests__/Toggle.test.tsx` | The switch's announcements, thumb positions and haptics; the RTL describe at lines 100-127 the step rewrites (anchor `toggle-test-rtl.md`) |
| `components/sheets/screens/__tests__/ColorPicker.test.tsx` | Opens, saves, resets, dismissals; step 3 adds the containment test beside them |
| `shared/i18n/locale.ts` | `localeDirection` (line 23), `currentLocaleId` (line 61), `setActiveLocale` (line 69): the locale's own direction, live at call time |
| `stores/bootstrap.ts` | Line 92: the app keys `forceRTL` on `localeDirection` of the stored locale — the same source D2 keys the controls on |

### How the pieces interact, and why the obvious fix is wrong

The obvious fix — negating the travel the other way, or keying the pill to the measured
container as the ticket's first working diagnosis sketched — is wrong twice. First, the
travel's sign under a working reload is already right: `start: 3` anchors the pill at the
row's start edge (the physical right under the native RTL layout) and the negated percent
moves it one segment per option toward the row's end; the owner's own observation that Off's
pill sits behind Off proves the anchor sound. Second, the transforms are physical in this RN
release: an exhaustive walk of the pinned source (the planning record in `LOG.md`, 2026-10-14)
found no direction handling on any transform path — `BaseViewProps.cpp:544-565` resolves
transforms from `frameSize` alone, `Transform.cpp:178-187` resolves percentages against the
frame with no sign flip, Android's `BaseViewManager.java:570-655` decomposes the matrix onto
physical `setTranslationX`, and Reanimated 4.7.0 carries no direction handling of its own.
So the defect is not in the transform math; it is that the branch never engaged. The state
her 2026-10-13 test caught is the starved crossing row 78 measured: three of six direction
crossings flip the face and preferences, then the reload never lands — the native layout
direction has already followed `forceRTL(true)`, while `I18nManager.getConstants().isRTL`
still reports the bridge-start snapshot, false. The components take the English branch
(`slot = selectedIndex`, `translateX = +SIZE.toggle.translateX`) under a layout whose rows
mirror and whose anchors sit at the right: positive travel pushes the pill and the thumb
further right, off the control — Off's slot is index 0 and draws at the anchor, which is why
Off alone looked right, Silent landed one pill-width past the right edge (half off-screen),
Sound two (gone; row 68's missing indicator), and the switch's thumb left its track.

The picker is the other half of the family. `reanimated-color-picker@5.1.3` snapshots
`I18nManager.isRTL` at module load (`lib/src/utils.tsx:6`; the package's `react-native` field
serves `lib/src` to the bundler, while Jest resolves the compiled `lib/commonjs`, whose
`utils.js:19` froze the same value `false` — so on device the snapshot follows the launch
state and in tests it is always false, which is why the tests below force the constant
explicitly). With the snapshot false, every absolute child the library places — the hue thumb
at `left: 0` (`lib/src/styles.ts:22`), the panel's images at `left: 0, top: 0` — carries LTR
math. Android swaps the meaning of `left` and `right` for a node whose resolved layout
direction is RTL while `doLeftAndRightSwapInRTL` is set
(`YogaLayoutableShadowNode.cpp:641-642`; the flag is Android's default), which re-anchors all
of those to the physical right: the hue marker sits at the right at hue 0 and travels right
as hue grows (her observation: drag to red, the circle sits fully right), and the rotated
brightness overlay lands a full panel-width-minus-height away (her 2026-10-13 split box; the
overlay's translate compensation is `lib/src/components/Panels/Panel1.tsx:70`). On iOS the
swap flag is off, so the same false-snapshot state lands as drawn — the 2026-10-14 vision
read found the panel's gradients exact, the thumb and the hue marker colour-consistent —
except a ~1px sliver at the right and bottom edges where the RTL-resolved frames round a hair
short and the container's pure-hue background shows through. Keying each host's resolved
direction to the snapshot value (`ltr` when the bridge constant is false, `rtl` when true)
removes the swap mismatch and the RTL rounding in the false-snapshot states, equals the
inherited default under English, and leaves the true-snapshot states resolving exactly as
they do uncontained today, preserving the library's designed RTL path there.

`direction` reaches Yoga per node: the raw prop converts into the node's yoga style
(`ReactCommon/react/renderer/components/view/propsConversions.h:27`) and resolves down the
subtree, which is why one style on each library container covers every absolute child inside
it. The `@platform ios` note on the prop's doc comment is stale; the conversion sits in the
shared C++ renderer both platforms build on.

### The existing tests and what each proves

- `SegmentedControl.test.tsx`: en slot math, first-frame settled, mount-never-animates,
  change-animates over `ANIMATION.duration`, the a11y contract, the disabled path; the RTL
  describe pins the mirrored slot through a `getConstants` mock — the mock is the defect's
  mirror image, which is why the step rewrites it through `setActiveLocale`.
- `Toggle.test.tsx`: en thumb positions, mount-settled, change-animates, haptics, disabled;
  its RTL describe rewrites the same way.
- `ColorPicker.test.tsx`: open/save/reset/dismiss behaviour; nothing today pins any style on
  the library pieces, which is the gap step 3's test closes.

## 5. Design

The approach, one sentence a test can check: the controls' travel branches on the active
locale's own direction (`localeDirection(currentLocaleId()) === 'rtl'`), and the picker's
panel and hue bar carry a `direction` keyed to the bridge snapshot the library branched on
(`I18nManager.getConstants().isRTL ? 'rtl' : 'ltr'`), so the false-snapshot states render the
picker exactly as English does, the true-snapshot states keep today's library-RTL rendering,
and under English nothing changes.

Alternatives rejected:

- Patching the library (`patches/reanimated-color-picker+5.1.3.patch`): the repo's patch route
  exists, but `patches/` is outside this run's editable surface, and app-code containment
  reaches the same result without touching the dependency (D3).
- Keying the travel on a measured container or folding the offset into one transform (the
  ticket's first sketch): treats an anchor that the evidence shows is sound; changes en
  geometry code paths for no gain.
- Reading `I18nManager.isRTL` again at render: same snapshot, same lag; rejected for D2's live
  source.
- Setting `direction: 'ltr'` statically on the picker hosts: rejected at the grill; it would
  force LTR resolution onto the library's RTL-written geometry in the completed-crossing state
  and re-break the picker there. Keying to the snapshot (D3) is the shipped form.
- Setting `direction` on the picker root (`styles.colorPicker`): wider than the two named
  defects; the swatch rows keep today's rendering under ar by D4.

The concurrency trace: none. No timers, no subscriptions, no threads change; both worklet
chains keep their existing single evaluation order (first evaluation snaps, later ones time),
and `setActiveLocale` already bumps `localeVersionAtom`, whose subscription in
`SheetHost.tsx:21` re-renders every sheet on a switch, so the controls re-read the locale on
the same render that repaints their labels.

The design review: the one risk a test cannot see is the device rendering itself, which D6
assigns to the owner's device test. Everything else is pinned by named tests below and the
source citations above.

**Acceptance criteria:**

- [R1.1] WHEN the segmented control renders with Sound selected while the active locale is Arabic and the bridge constant reports LTR THE SYSTEM SHALL draw its indicator at translateX '-200%' (the mirrored slot).
- [R1.2] WHEN the segmented control's saved selection changes while the active locale is Arabic and the bridge constant reports LTR THE SYSTEM SHALL animate the indicator to the negative percent target and never the positive one.
- [R1.3] WHILE the active locale is English THE SYSTEM SHALL draw and animate the indicator exactly as at 2.0.255, proven by the existing en tests unchanged and green.
- [R2.1] WHEN a switch renders with value on while the active locale is Arabic and the bridge constant reports LTR THE SYSTEM SHALL draw its thumb at translateX -SIZE.toggle.translateX.
- [R2.2] WHEN a switch's value changes to on while the active locale is Arabic and the bridge constant reports LTR THE SYSTEM SHALL animate its thumb to the negative travel and never the positive one.
- [R2.3] WHILE the active locale is English THE SYSTEM SHALL draw and animate the thumb exactly as at 2.0.255, proven by the existing en tests unchanged and green.
- [R3.1] WHEN the picker modal renders while the bridge constant reports LTR THE SYSTEM SHALL pass a style resolving to direction 'ltr' to both Panel1 and HueSlider, proven by each host node's flattened style carrying it.
- [R3.2] WHEN the picker modal renders while the bridge constant reports RTL THE SYSTEM SHALL pass a style resolving to direction 'rtl' to both Panel1 and HueSlider, proven the same way.
- [R3.3] WHILE the active locale is English THE SYSTEM SHALL render the picker exactly as at 2.0.255, because explicit 'ltr' equals the inherited default under an LTR bridge constant.
- [R4.1] WHEN any step's code lands THE SYSTEM SHALL show Jest coverage of 100 percent statements, branches, functions and lines on every file the step changed.
- [R4.2] WHEN the mutation substitutions named in a step run against that step's file THE SYSTEM SHALL fail the named test of that file.

## 6. Steps

Checklist:

- [x] Step 1 — SegmentedControl keys its travel on the locale's own direction
- [x] Step 2 — Toggle keys its travel on the locale's own direction
- [ ] Step 3 — The picker's panel and hue bar resolve LTR under every locale
- [ ] Step 4 — Records and the executed state

Every step: work in `$HOME/athan-gitree/run-73`, on `ticket/73`, per D7. Before step 1, save
`ai/plans/73-rtl-travel-family/scripts/preflight-73.sh` to `$TMPDIR` and run
`bash $TMPDIR/preflight-73.sh`; expected output ends `PREFLIGHT OK`. `git status --porcelain`
must be empty before the pre-flight and clean again after each step's commit, else STOP.

### Step 1 — SegmentedControl keys its travel on the locale's own direction

Requirements: R1.1, R1.2, R1.3, R4.1, R4.2
Weight: 2

Anchor check: `segmented-derived.md`, `segmented-indicator.md` and
`segmented-test-rtl.md` each count 1 in their files (the preflight already verified; a count
other than 1 at step time is `NEEDS_CONTEXT: NEEDS REPLAN`).

Goal: the pill's travel branches on the locale's own direction, so a starved crossing (bridge
still LTR, layout and text Arabic) draws the pill behind the chosen option.

Files: `components/sheets/parts/SegmentedControl.tsx`,
`components/sheets/parts/__tests__/SegmentedControl.test.tsx`.

Red tests. In `SegmentedControl.test.tsx`:

1. Delete the import of `I18nManager` from `react-native` (line 7).
2. Add to the existing imports: `import { setActiveLocale } from '@/shared/i18n/locale';`.
3. Replace the whole describe block anchored by `segmented-test-rtl.md` with:

```tsx
// The pill keys its direction on the active locale, not the bridge snapshot: a starved
// crossing (row 78) renders the Arabic locale while I18nManager still reports the launch
// direction, and the pill travelled off-screen exactly there (row 73)
describe('the Athan control under the Arabic locale while the bridge still reports LTR', () => {
  beforeEach(() => {
    setActiveLocale('ar');
  });

  afterEach(() => {
    setActiveLocale('en');
  });

  it('draws the pill under the mirrored slot the moment its width is known', async () => {
    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Sound} onSelect={jest.fn()} />);

    await measure(306);

    // Sound is the last of three options; the pill's anchor is the option row's start edge
    // (the physical right under the RTL layout the locale forces), so its slot mirrors two
    // segments toward the row's end: -200%
    expect(drawn()[0]).toHaveStyle({ width: 100, transform: [{ translateX: '-200%' }] });
  });

  it('slides the pill to the mirrored slot when the saved option changes', async () => {
    await render(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Silent} onSelect={jest.fn()} />);
    await measure(306);
    const withTiming = jest.spyOn(Reanimated, 'withTiming');

    await screen.rerender(<SegmentedControl options={ATHAN_OPTIONS} selected={AlertType.Sound} onSelect={jest.fn()} />);

    // Sound's slot mirrors two segments from the anchor: -200. The LTR target 200 is never
    // asked for (the option fade asks 0, so the signed negative is what isolates the pill's
    // target)
    expect(withTiming).toHaveBeenCalledWith(-200, { duration: ANIMATION.duration });
    expect(withTiming).not.toHaveBeenCalledWith(200, { duration: ANIMATION.duration });
  });
});
```

Run `npx jest components/sheets/parts/__tests__/SegmentedControl.test.tsx --watchman=false --selectProjects=components`
from the worktree root. Expected: the two new tests fail — the first with
`translateX: "200%"` received where `'-200%'` was expected (the bridge constant is false, so
today's code takes the English slot), the second with the `toHaveBeenCalledWith(-200, ...)`
assertion unmet because `withTiming` received `200`. Any other failure: STOP.

Change. In `SegmentedControl.tsx`:

1. Replace the import line
   `import { I18nManager, type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';`
   with
   `import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';`.
2. The file already imports `currentLocaleId` from `'@/shared/i18n/locale'` (line 14);
   extend that import to `import { currentLocaleId, localeDirection } from '@/shared/i18n/locale';`.
3. Replace the two lines of the `segmented-derived.md` anchor's neighbourhood — the comment
   line `// RTL mirrors the pill's slot: the layout swap owns the inset keys, so the index mirrors here`
   and the line `const isRTL = I18nManager.getConstants().isRTL;` — with:

```tsx
  // RTL mirrors the pill's slot: the layout swap owns the inset keys, so the index mirrors
  // here. The locale's own direction, not the bridge snapshot: a starved crossing (row 78)
  // renders Arabic while I18nManager still reports the launch direction, and the pill's
  // English travel then exits the screen under the RTL layout (row 73)
  const isRTL = localeDirection(currentLocaleId()) === 'rtl';
```

Nothing else changes: the derived value, the static fallback transform, the indicator styles
and the option rendering keep their exact code.

Green run: the same Jest command passes every test in the file, then `npx tsc --noEmit`
exits 0 and `npx biome check . --error-on-warnings` exits 0.

Break script. Save as `$TMPDIR/break-73-1.sh` and run with `bash` from the worktree root:

```bash
#!/usr/bin/env bash
set -u
cd "$HOME/athan-gitree/run-73" || exit 1
f=components/sheets/parts/SegmentedControl.tsx
cp "$f" "$f.bak73"
python3 - <<'PY'
from pathlib import Path
p = Path('components/sheets/parts/SegmentedControl.tsx')
s = p.read_text()
old = "const isRTL = localeDirection(currentLocaleId()) === 'rtl';"
new = "const isRTL = false;"
assert s.count(old) == 1, 'anchor for break not found once'
p.write_text(s.replace(old, new))
PY
npx jest components/sheets/parts/__tests__/SegmentedControl.test.tsx --watchman=false --selectProjects=components > "$TMPDIR/break-73-1.log" 2>&1
status=$?
mv "$f.bak73" "$f"
if [ $status -ne 0 ]; then
  grep -c "while the bridge still reports LTR" "$TMPDIR/break-73-1.log"
  echo "ALL AS EXPECTED: 1"
else
  echo "BREAK NOT APPLIED"
fi
```

Expected output: a count of 2 (the two failing tests of the new describe) then
`ALL AS EXPECTED: 1`. After it, `git status --porcelain` lists only this step's two files and
the plan files. The break fails the named tests because the constant false reproduces the
starved crossing against the fixed test forcing.

Mutation pass, after green and before commit: apply each mutation alone, run the same Jest
command, expect the named failure, revert by restoring the backup —
(a) `const isRTL = false;` must fail both new tests (the break already proved this one),
(b) in the derived value, `const slot = isRTL ? -selectedIndex : selectedIndex;` changed to
`const slot = selectedIndex;` must fail both new tests.
No third mutation: the static fallback's own sign was dropped at execution (the executor's
finding, relayed 2026-10-14, upheld) — the Reanimated Jest mock evaluates `useAnimatedStyle`
synchronously, so the animated transform entry shadows the static one in `toHaveStyle` and
the static line's sign is unobservable in Jest; the step's changed line is the `isRTL`
source, whose guard mutation (a) covers, and (b) additionally pins the derived slot. The
static line itself is unchanged by this step.
Record each mutation and its failing test name in `LOG.md`.

Version and commit. Take the version lock (`mkdir $HOME/athan-gitree/version.lock`, retry in a
short sleep loop while it exists, `rmdir` after the commit). Set `2.0.260` in `app.json` then
`package.json` (the worktree has no `android/`; D8). Add by name:
`components/sheets/parts/SegmentedControl.tsx`,
`components/sheets/parts/__tests__/SegmentedControl.test.tsx`,
`ai/plans/README.md`, `ai/plans/73-rtl-travel-family/PLAN.md`,
`ai/plans/73-rtl-travel-family/LOG.md`. In `ai/plans/README.md` set the ticket 73 status cell
from `PLANNING` to `IN PROGRESS, step 1`. Commit on `ticket/73` with
`2.0.260 - fix(alert): the segmented pill keys its travel on the locale's own direction, not the bridge snapshot`.
The hook's last `Tests:` line must end `passed, <n> total` with the four `100%` coverage
lines present.

Review. Read `git show <sha>` cold against: en tests untouched; the two new tests force the
locale through the app's own path; the only production change is the direction source and its
comment; no `I18nManager` residue in the file.

Merge: none (D7). The commit stays on `ticket/73`.

Done when: the checklist box for step 1 is ticked, `LOG.md` carries the step entry with the
commit sha, version, the hook's `Tests:` and coverage lines, the break's last line, the
mutation records, and a final `session:` line.

### Step 2 — Toggle keys its travel on the locale's own direction

Requirements: R2.1, R2.2, R2.3, R4.1, R4.2
Weight: 2

Anchor check: `toggle-derived.md` and `toggle-test-rtl.md` each count 1.

Goal: the thumb's travel branches on the locale's own direction, so a starved crossing draws
and animates the thumb into the track.

Files: `components/sheets/parts/Toggle.tsx`,
`components/sheets/parts/__tests__/Toggle.test.tsx`.

Red tests. In `Toggle.test.tsx`:

1. Delete the import of `I18nManager` from `react-native` (line 7).
2. Add to the imports: `import { setActiveLocale } from '@/shared/i18n/locale';` beside the
   `@/shared/constants` import.
3. Replace the whole describe block anchored by `toggle-test-rtl.md` with:

```tsx
// The thumb keys its direction on the active locale, not the bridge snapshot: a starved
// crossing (row 78) renders the Arabic locale while I18nManager still reports the launch
// direction, and the thumb left the track exactly there (row 73)
describe('the reminder switch under the Arabic locale while the bridge still reports LTR', () => {
  beforeEach(() => {
    setActiveLocale('ar');
  });

  afterEach(() => {
    setActiveLocale('en');
  });

  // ai/AGENTS.md: a toggle mounted on shows its settled state on the first frame
  it('draws its thumb settled at the mirrored on position when mounted on', async () => {
    await render(<Toggle value onToggle={jest.fn()} />);

    expect(thumb()).toHaveStyle({ transform: [{ translateX: -SIZE.toggle.translateX }] });
  });

  // ai/AGENTS.md: a toggle mounted on shows its settled state on the first frame, and only a change animates
  it('animates its thumb to the mirrored on position when the value changes after mount', async () => {
    const withTiming = jest.spyOn(Reanimated, 'withTiming');
    await render(<Toggle value={false} onToggle={jest.fn()} />);

    await screen.rerender(<Toggle value onToggle={jest.fn()} />);

    expect(withTiming).toHaveBeenCalledWith(-SIZE.toggle.translateX, { duration: ANIMATION.duration });
    expect(withTiming).not.toHaveBeenCalledWith(SIZE.toggle.translateX, { duration: ANIMATION.duration });
  });
});
```

Run `npx jest components/sheets/parts/__tests__/Toggle.test.tsx --watchman=false --selectProjects=components`.
Expected: the two new tests fail — the first received `transform: [{translateX: 18}]` where
`-18` was expected, the second unmet on the negative target because `withTiming` received
`18`. Any other failure: STOP.

Change. In `Toggle.tsx`:

1. Replace
   `import { I18nManager, Pressable, StyleSheet } from 'react-native';`
   with
   `import { Pressable, StyleSheet } from 'react-native';`.
2. Add beside the `@/shared/constants` import:
   `import { currentLocaleId, localeDirection } from '@/shared/i18n/locale';`.
3. Replace the two lines — the comment
   `// RTL travels the thumb the other way: the layout swap owns the inset keys, not the travel`
   and `const isRTL = I18nManager.getConstants().isRTL;` — with:

```tsx
  // RTL travels the thumb the other way: the layout swap owns the inset keys, not the
  // travel. The locale's own direction, not the bridge snapshot: a starved crossing (row 78)
  // renders Arabic while I18nManager still reports the launch direction, and the English
  // travel then pushes the thumb off the track under the RTL layout (row 73)
  const isRTL = localeDirection(currentLocaleId()) === 'rtl';
```

Green run: the same Jest command passes every test in the file, then `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` exit 0.

Break script. `$TMPDIR/break-73-2.sh`, same shape as step 1 with: the file
`components/sheets/parts/Toggle.tsx`, the old string
`const isRTL = localeDirection(currentLocaleId()) === 'rtl';`, the new string
`const isRTL = false;`, and the log grep counting
`while the bridge still reports LTR`. Expected: count 2 then `ALL AS EXPECTED: 1`.

Mutation pass: (a) `const isRTL = false;` (the break), (b) the derived value's
`value ? (isRTL ? -SIZE.toggle.translateX : SIZE.toggle.translateX) : 0` changed to
`value ? SIZE.toggle.translateX : 0` must fail both new tests. Record both in `LOG.md`.

Version and commit. Under the lock, set `2.0.261` in `app.json` then `package.json`. Add by
name: `components/sheets/parts/Toggle.tsx`,
`components/sheets/parts/__tests__/Toggle.test.tsx`, `ai/plans/README.md`,
`ai/plans/73-rtl-travel-family/PLAN.md`, `ai/plans/73-rtl-travel-family/LOG.md`. Set the
ticket 73 status cell to `IN PROGRESS, step 2`. Commit on `ticket/73` with
`2.0.261 - fix(alert): the switch thumb keys its travel on the locale's own direction, not the bridge snapshot`.

Review. Read `git show <sha>` cold against: en tests untouched; the production change is the
direction source, its comment and the import pair; no `I18nManager` residue.

Merge: none (D7).

Done when: step 2's box is ticked and `LOG.md` carries the entry with sha, version, hook
lines, break line, mutations and the `session:` line.

### Step 3 — The picker's panel and hue bar resolve the direction the library snapshotted

Requirements: R3.1, R3.2, R3.3, R4.1, R4.2
Weight: 2

Anchor check: `picker-render.md` counts 1.

Goal: each of the two picker hosts resolves its layout direction to the value the library
snapshotted at module load (`I18nManager.getConstants().isRTL`, the same constant): LTR in the
false-snapshot states, whose geometry is LTR-written (no Android left/right swap inside, no
RTL frame rounding, marker and drag in agreement), RTL in the true-snapshot states, whose
geometry is RTL-written and renders as it does uncontained today.

Files: `components/sheets/screens/ColorPicker.tsx`,
`components/sheets/screens/__tests__/ColorPicker.test.tsx`.

Red tests. In `ColorPicker.test.tsx`, add to the imports:
`import { I18nManager, StyleSheet } from 'react-native';` beside the existing testing-library
import. Add these two tests inside the top describe, before the `opens nothing` test:

```tsx
  // The library snapshots I18nManager.isRTL at module load and writes its geometry for that
  // value, while the layout direction follows the live locale, and Android swaps left and
  // right for RTL-resolved nodes: keying the picker's resolved direction to the same snapshot
  // keeps the geometry and its layout in step in every launch state (row 73). The picker
  // hosts carry no testID, so the reach is their accessibility labels
  it('renders the panel and the hue bar locked to the snapshotted direction, LTR here', async () => {
    await render(<ColorPickerSettings />);
    await openPicker();

    const panel = screen.getByLabelText('Saturation and brightness 2D slider');
    const slider = screen.getByLabelText('Hue Slider');

    expect(StyleSheet.flatten(panel.props.style).direction).toBe('ltr');
    expect(StyleSheet.flatten(slider.props.style).direction).toBe('ltr');
  });

  // The components project renders against the real I18nManager, so the snapshot the picker
  // keys on is forced here rather than through the shared react-native mock
  it('renders the panel and the hue bar locked to the snapshotted direction, RTL when the snapshot says so', async () => {
    jest
      .spyOn(I18nManager, 'getConstants')
      .mockReturnValue({ isRTL: true, doLeftAndRightSwapInRTL: true, localeIdentifier: 'ar' });

    try {
      await render(<ColorPickerSettings />);
      await openPicker();

      const panel = screen.getByLabelText('Saturation and brightness 2D slider');
      const slider = screen.getByLabelText('Hue Slider');

      expect(StyleSheet.flatten(panel.props.style).direction).toBe('rtl');
      expect(StyleSheet.flatten(slider.props.style).direction).toBe('rtl');
    } finally {
      jest.restoreAllMocks();
    }
  });
```

(The reach is proven at planning: the library's hosts carry those labels —
`lib/src/components/Panels/Panel1.tsx` passes `label: 'Saturation and brightness 2D slider'`
to its core, `lib/src/components/Sliders/Hue/HueSlider.tsx` passes `label: 'Hue Slider'` — and
the testing library's engine reaches modal content the tree walk cannot. `UNSAFE_getByType`
does not exist in `@testing-library/react-native@14.0.1`; do not use it.)

Run `npx jest components/sheets/screens/__tests__/ColorPicker.test.tsx --watchman=false --selectProjects=components`.
Expected: both new tests fail with `Expected: "ltr"` and `Received: undefined`, and
`Expected: "rtl"` and `Received: undefined`. Any other test failing: STOP.

Change. In `ColorPicker.tsx`:

1. Extend the react-native import (line 4) to
   `import { I18nManager, Modal, Pressable, StyleSheet, Text, View } from 'react-native';`.
2. Inside the component body, directly above the `return (` of the main render, add:

```tsx
  // The picker library snapshots I18nManager.isRTL at module load and writes its geometry
  // for that snapshot, while the layout direction follows the live locale: keying the
  // picker's resolved direction on the same snapshot keeps the two in step in every launch
  // state (a starved crossing snapshots false, a completed one true)
  const pickerDirection = I18nManager.getConstants().isRTL ? 'rtl' : 'ltr';
```

3. In the picker modal's JSX, change the two mounts to carry the keyed direction:

```tsx
              <Panel1 style={[styles.panel, { direction: pickerDirection }]} />
              <HueSlider style={[styles.hueSlider, { direction: pickerDirection }]} />
```

The `styles.panel` and `styles.hueSlider` objects keep exactly the keys they carry at
2.0.255; nothing else in the file changes.

Green run: the same Jest command passes every test in the file, then `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` exit 0. If biome reports the import-order assist on
the touched files, run `npx biome check --write components/sheets/` once and rerun; any other
biome finding: STOP and quote it.

Break script. `$TMPDIR/break-73-3.sh`, same shape as step 1 with: the file
`components/sheets/screens/ColorPicker.tsx`, a python replace of the exact substring
`const pickerDirection = I18nManager.getConstants().isRTL ? 'rtl' : 'ltr';` by
`const pickerDirection = 'ltr';` (occurs once), and the log grep counting
`snapshotted direction`. Expected: count 1 (only the RTL test fails; the LTR test still
passes against a hard-wired 'ltr') then `ALL AS EXPECTED: 1`.

Mutation pass: (a) the break's hard-wired 'ltr' (proven by the break itself),
(b) `? 'rtl' : 'ltr'` changed to `? 'ltr' : 'rtl'` must fail both new tests (each receives
the other direction). Record both in `LOG.md`.

Version and commit. Under the lock, set `2.0.262` in `app.json` then `package.json`. Add by
name: `components/sheets/screens/ColorPicker.tsx`,
`components/sheets/screens/__tests__/ColorPicker.test.tsx`, `ai/plans/README.md`,
`ai/plans/73-rtl-travel-family/PLAN.md`, `ai/plans/73-rtl-travel-family/LOG.md`. Set the
ticket 73 status cell to `IN PROGRESS, step 3`. Commit on `ticket/73` with
`2.0.262 - fix(settings): the colour picker resolves the direction the library snapshotted`.

Review. Read `git show <sha>` cold against: the only production changes are the keyed
direction, its comment, the extended import and the two style arrays; the styles objects
untouched; the two tests force both snapshot values; no `I18nManager` residue in the test
beyond the mock with its restore.

Merge: none (D7).

Done when: step 3's box is ticked and `LOG.md` carries the entry with sha, version, hook
lines, break line, mutations and the `session:` line.

### Step 4 — Records and the executed state

Requirements: R4.1
Weight: 1

Anchor check: none (docs step).

Goal: the ledger carries its records text and the ticket reads EXECUTED.

Files: `ai/plans/73-rtl-travel-family/LOG.md`, `ai/plans/README.md`.

Change. Apply the records text from section 8 into `LOG.md` under its heading, with the
measured values (shas, versions, hook lines). Set the ticket 73 status cell to `EXECUTED`.
No code changes.

Checks: `bash $TMPDIR/preflight-73.sh` still ends `PREFLIGHT OK` (the version now reads
2.0.263 after the bump below).

Version and commit. Under the lock, set `2.0.263` in `app.json` then `package.json`. Add by
name: `ai/plans/73-rtl-travel-family/LOG.md`, `ai/plans/73-rtl-travel-family/PLAN.md` (tick
step 4's box), `ai/plans/README.md`. Commit on `ticket/73` with
`2.0.263 - docs(plans): ticket 73 executed: the RTL travel family, three behaviour fixes proven by tests`.

Done when: the LOG carries the records, the queue reads EXECUTED, and the `session:` line is
written. Return `DONE` (the Finishing branch-and-merge steps of the standing instructions do
not run this time: D7 forbids the uat merge, and the docs commit above is the executed
commit).

## 7. Device proof

None this run (D6, the owner's run order, 2026-10-14: physical device work is waived; never a
production build, never a physical phone, never EAS). The proofs are the named tests, the
break scripts, the mutation passes and the source citations of section 4. The owner's own
device test is the acceptance bar: under ar, the pill sits behind the chosen option and
slides between options, the switch thumb travels into the track, the hue marker follows the
finger, and the big panel carries no seam; under en, every surface renders as at 2.0.255.

## 8. Records

The findings text written into `LOG.md` under `## Findings (executed)`:

```markdown
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
```

The queue cell text the lead applies on DONE (the status cell of row 73, replacing
`EXECUTED`):

```text
DONE 2026-10-14, audited: the family's root was never a transform flip — RN 0.88.0-rc.3 applies every transform physically (verified exhaustively at the pinned source) — but the controls branching on I18nManager.getConstants().isRTL, a bridge-start snapshot a starved crossing (row 78) leaves at the launch direction while the layout already renders Arabic, so the English travel branch ran under RTL layout and sent the pill and every switch thumb off the control; the picker's half was the library's module-load isRTL snapshot disagreeing with the live layout direction: the false-snapshot geometry met Android's RTL left/right swap (the reversed marker, the split box) and iOS's RTL frame rounding (the 1px seam). Fixes: the pill and the thumb key their travel on the locale's own direction (the source bootstrap keys forceRTL on), and the picker's panel and hue bar resolve the direction that same library snapshot took, so each launch state's geometry meets its own layout; en rendering byte-identical, first-frame settled kept, full coverage red-before-green with mutation passes, device work waived by her run order (her device test is the acceptance bar). QiblaWave's same constant read reported to the queue, unfixed by scope and surface
```

The docs commit message for the DONE merge: `2.0.<n> - docs(plans): ticket 73 DONE: the RTL travel family, the queue cell set` (the merging session owns the number and the plan folder's deletion).

## 9. Push

None. The executor never pushes; this run's order also forbids merging into uat (D7). The
lead pushes nothing.

## 10. When something goes wrong

| Symptom | What it means | The action |
| --- | --- | --- |
| A new test passes red-run | The forcing did not engage (the locale did not switch, or the bridge mock leaks) | STOP: quote the test name and the received value; never weaken the assertion |
| A test the plan did not name fails | An unseen coupling | STOP: quote the test and its output |
| `getByLabelText` cannot find the library hosts | The library version changed its labels | STOP: quote the error (NEEDS REPLAN, the picker test's reach broke) |
| The hook fails on coverage below 100 | A touched line is untested | Add the missing case to the step's tests, never an ignore; if the line is unreachable by design, STOP: NEEDS REPLAN |
| `git status --porcelain` lists a file outside the step's list | Parallel-lane bleed or scratch | Restore it (`git checkout -- <file>`), then rerun; if it returns, STOP |
| The version lock directory never clears | The parallel lane holds it | Keep the short sleep loop; if it blocks past 10 minutes, STOP: BLOCKED, version lock held |
| A break prints `BREAK NOT APPLIED` | The substitution missed the code | STOP: NEEDS REPLAN, quote the break and the file |

Anticipated review fixes, word for word:

- "The comment above the direction read repeats the code" — fix: keep the first sentence
  (the layout-swap reason) and delete any sentence the code already states; the three-line
  form in the step is the ceiling.
- "The picker comment explains what, not why" — fix: delete the second clause and keep
  `// The picker's geometry is left-anchored LTR (the library hardcodes it), so the subtree
  resolves LTR under every locale`.
- "The new describe names row 78 in a comment; rows are queue state, not code history" —
  reject: the comment names the state the test forces, and the repo's own RTL describes
  already cite the rule they enforce; the row reference is the why.

Restore lists:

- Step 1: `git checkout -- components/sheets/parts/SegmentedControl.tsx
  components/sheets/parts/__tests__/SegmentedControl.test.tsx app.json package.json`.
- Step 2: same shape with `parts/Toggle.tsx` and its test.
- Step 3: same shape with `screens/ColorPicker.tsx` and its test.
- Step 4: `git checkout -- ai/plans/README.md ai/plans/73-rtl-travel-family/LOG.md app.json package.json`.

## 11. Subagents

Planning: `explore` answered the rc's transform-direction facts (returned 2026-10-14, recorded
in `LOG.md`); `vision` read `$HOME/Downloads/IMG_0029.png` (transcribed in `LOG.md`; the file
is never committed). Delivery: the lead dispatches `athan-executor` for the steps and the two
`athan-reviewer` passes for the audit. Every worker may call `vision` for an image it cannot
see. Nothing else, ever.

## 12. Report to the owner

Three behaviour fixes, one family: the segmented pill and every switch thumb now key their
travel on the locale's own direction instead of a bridge snapshot that a starved reload
leaves behind, and the colour picker's panel and hue bar lock their layout direction to the
LTR their geometry is written for. English rendering never moves; Arabic gains the pill
behind the chosen option, thumbs that travel into their tracks, a hue marker that follows
the finger, and a seam-free panel. Everything is proven by tests red before green, breaks,
mutations and 100 percent coverage; the device proof is hers to take (the run order waived
it). QiblaWave carries the same lagging constant read with no visible defect today; it is
recorded in the plan for a future ticket that owns that surface.

Progress for the owner's eye: steps 1 to 3 land the three fixes, step 4 records; the audit's
two reviewers follow; the orchestrator merges and applies DONE.
