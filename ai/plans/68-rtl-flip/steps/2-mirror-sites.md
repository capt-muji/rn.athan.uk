# Step 2: The mirror sites and the swap-proof conversions

Requirements: R3.1, R3.2, R3.3, R3.4, R4.1, R6.1
Weight: 2

## Anchor check

`bar-leftstyle`, `segmented-pill`, `toggle-travel`, `wave-point`,
`overlay-left`, `veil-left`. A count other than 1 is a STOP.

## Goal

The pill, the toggle and the wave mirror under RTL; the countdown tip and bar
mirror through the layout swap with no geometry change; the window-space
sites hold their physical coordinates through transforms under left-to-right
containing views; the gate reports no remainder and no stale entries.

## Branch

`git checkout -b feat/68-mirror-sites uat`

## Files

- `components/sheets/parts/SegmentedControl.tsx` (change)
- `components/sheets/parts/__tests__/SegmentedControl.test.tsx` (change)
- `components/sheets/parts/Toggle.tsx` (change)
- `components/sheets/parts/__tests__/Toggle.test.tsx` (change)
- `shared/qiblaWave.ts` (change)
- `components/sheets/screens/QiblaWave.tsx` (change: pass the direction)
- `shared/__tests__/qiblaWave.test.ts` (change)
- `components/overlay/Overlay.tsx` (change: the catcher transform)
- `components/overlay/__tests__/Overlay.test.tsx` (change: the R4.1 assertions)
- `components/overlay/VeilBackdrop.tsx` (change: the glow transform)
- `components/ui/RamadanDecorations.tsx` (change: ten transforms)
- `components/ui/__tests__/RamadanDecorations.test.tsx` (change: one R4.1 assertion)
- `scripts/directional-styles-allowlist.json` (change: entries leave)

## What needs no change (deliberate)

`components/countdown/tipGeometry.ts` and `components/countdown/Bar.tsx` stay
byte-identical: the tip style keeps its `left:` key, RN's
`swapLeftAndRightInRTL` rewrites that key under RTL so the tip lands at the
mirrored offset for free, and the bar fill (`width: X%` in a row) already
grows from the trailing edge. Adding an explicit mirror would double the
swap. The allowlist's Bar entry stays, its reason rewritten to
`worklet math has no logical key; the layout swap mirrors it (58b verified)`.

## Red tests

1. `SegmentedControl.test.tsx`: with a three-option control and the last
   selected, forcing RTL asserts the static transform `translateX: '0%'`
   (index 2 mirrors to slot 0) and the animated target `withTiming(0)`. Force
   the direction in the suite with
   `jest.spyOn(I18nManager, 'getConstants').mockReturnValue({ isRTL: true, doLeftAndRightSwapInRTL: true, localeIdentifier: 'ar' })`
   (the components project renders against the real I18nManager; the shared
   react-native mock does not apply to it).

2. `Toggle.test.tsx`: under the same RTL spy, the on target is
   `-SIZE.toggle.translateX` on first frame and `withTiming(-18)` on change.

3. `qiblaWave.test.ts`: `wavePoint(0.25, w, h, true).x` is
   `-wavePoint(0.25, w, false).x`; `waveHeading(progress, true)` is
   `-waveHeading(progress, false)` (an angle negates, an angle assertion
   states the negated angle); `waveTrail`'s existing cases gain mirrored
   twins asserting the mirrored points.

4. `Overlay.test.tsx` gains the R4.1 assertion (the pre-existing suite
   asserts counts and haptics only, so it carries nothing today): with a
   measured row fixture, every catcher Pressable's flattened style carries
   `transform: [{ translateX: region.left }]` for that row's region and no
   `left` key.

5. `RamadanDecorations.test.tsx` (the suite that renders the thread node) and
   a veil assertion: one Ramadan absolute's flattened style carries the
   translateX first entry equal to its old `left` value and no `left` key;
   the veil glow's flattened style carries the translateX equal to
   `window.width / 2 - columnWidth` and no `left` key.

Run the six suites. Expected: the new RTL cases fail (`translateX` asserts
the LTR values, the wave x-signs mismatch, the flattened-style assertions
find `left:` styles today); every existing case passes. Any other failure is
a STOP.

## Change contracts

1. `components/sheets/parts/SegmentedControl.tsx`: at render,
   `const isRTL = I18nManager.getConstants().isRTL;`
   (module-scope `import { I18nManager } from 'react-native';`); the derived
   target and the static transform both become
   `(isRTL ? options.length - 1 - selectedIndex : selectedIndex) * 100`.

2. `components/sheets/parts/Toggle.tsx`: the same `isRTL` read; the target
   becomes
   `value ? (isRTL ? -SIZE.toggle.translateX : SIZE.toggle.translateX) : 0`.

3. `shared/qiblaWave.ts`: `wavePoint`, `waveHeading`, `wavePath` and
   `waveTrail` each gain a trailing `isRTL: boolean` parameter
   (worklet-safe booleans); `wavePoint` returns `x: isRTL ? -x : x`;
   `waveHeading` returns `isRTL ? -angle : angle`; the trail derives from the
   mirrored points. `QiblaWave.tsx` reads `I18nManager.getConstants().isRTL`
   at render and passes it into each call.

4. The physical sites, each converted so the layout swap cannot touch it. The
   `left:` key becomes `transform: [{ translateX: <value> }]`, and the
   direction pin goes on the site's CONTAINING View as `direction: 'ltr'` —
   the pinned Yoga resolves an inset-less absolute's insets and static
   position with the containing node's direction, never the node's own, so
   the pin on the containing view is what holds the physical edge:
   - `components/overlay/Overlay.tsx`: the catcher Pressable's inline style
     drops `left: region.left` for
     `transform: [{ translateX: region.left }]`; `styles.container` on the
     overlay's absolute wrapper carries `direction: 'ltr'` (name the wrapper
     that holds `catcherRegions`; if the catchers' containing block is the
     screen-sized overlay root, the pin goes there).
   - `components/overlay/VeilBackdrop.tsx`: the glow style drops
     `left: window.width / 2 - columnWidth` for
     `transform: [{ translateX: window.width / 2 - columnWidth }]`; the glow's
     containing View carries `direction: 'ltr'`.
   - `components/ui/RamadanDecorations.tsx`: each of the ten allowlisted
     `left:` absolutes becomes the same transform form; `direction: 'ltr'`
     goes on each converted node's containing wrapper (the decorations'
     positioned block), not on the converted node. At the five sites whose
     style array already carries an animated `transform` (thread `:525`, moon
     glow `:578`, star glow `:657`, cloud `:758`, disc `:898`), the
     translateX joins that existing transform array as its first entry,
     never a second transform-bearing object (React Native's shallow
     style-array merge drops a duplicate `transform` key).

5. `scripts/directional-styles-allowlist.json`: remove the entries for
   `Overlay.tsx`, `VeilBackdrop.tsx` and the ten RamadanDecorations snippets
   whose sites converted; keep the Bar.tsx entry with the reason rewritten as
   above, and keep the catcherGeometry interface, region-id and prose entries
   unchanged (those sites stay physical by construction). The list shrinks
   from 21 entries to 9.

What the contract must never do: add a direction parameter to the countdown
tip, convert the catcherGeometry region ids or the interface field, touch
`stores/countdown.ts` prose, change any LTR rendered value, or edit
`widgets/` (step 3 owns the widget files).

## Green run

```
npx jest components/countdown shared/__tests__/qiblaWave.test.ts components/overlay components/ui components/sheets/parts shared/__tests__/directionalStyleGate.test.ts --watchman=false --selectProjects=unit,components
node scripts/check-directional-styles.js
npx tsc --noEmit
npx biome check . --error-on-warnings
```

All pass; the gate script prints its clean line and exits 0; exit 0 each.

## Break script

`bash scripts/break-step2.sh` from the plan folder, copied to `$TMPDIR`: it
forces `isRTL` false inside the SegmentedControl target, runs the parts
suite, expects the RTL pill case to fail with a translateX mismatch, restores
the file, ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch under the version lock. Add the thirteen
files plus `app.json` and `package.json` by name, `ai/plans/README.md`
(`IN PROGRESS, step 2`) and the plan's `PLAN.md` and `LOG.md`. Message:

```
<VERSION> - feat(rtl): the mirror sites and swap-proof window-space transforms

The segmented pill, toggle travel and qibla wave mirror under RTL; the
countdown tip rides the layout swap with no geometry change; the catchers,
veil glow and decorations hold physical coordinates through transforms under
left-to-right containing views; the allowlist shrinks to nine entries.
R3.1-R6.1.
```

## Review checklist

- Every LTR-rendered value is byte-identical: the pre-existing cases in all
  six suites pass without edits, and `tipGeometry.ts`/`Bar.tsx` are
  byte-identical to `Planned at`.
- The allowlist diff removes exactly the converted entries and rewrites the
  Bar.tsx reason.
- `node scripts/check-directional-styles.js` exits 0 with no stale entries.
- No `left:`/`right:` style key remains in the three converted files, and
  each converted site's containing view carries `direction: 'ltr'`.

## Merge

`git checkout uat && git merge --no-ff feat/68-mirror-sites -m "<VERSION> -
merge feat/68-mirror-sites: step 2, mirrors and transforms"`. A conflict
aborts and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the heading, shas, hook lines, break
line and `session:` line.
