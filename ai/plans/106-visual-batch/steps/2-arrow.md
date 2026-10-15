# Step 2: the arrow geometry

Requirements: R2.1
Weight: 2

Anchor check: `explanation-arrow` and `infobox-placement` count exactly 1.

## Goal

The explanation arrow draws at width 36, height 15, with the row-band overlap 6 - same curved
shape, bigger, the prayer card unmoved.

## Branch

`git checkout -b feat/info-box-arrow uat` (fetch `origin` first).

## Files

- `components/prayer/Explanation.tsx`
- `components/overlay/OverlayInfoBox.tsx`
- `components/prayer/__tests__/Explanation.test.tsx`

## Red tests

In `components/prayer/__tests__/Explanation.test.tsx`, add geometry pins (none exist today).
Query the way the repo's proven pattern does (`Alert.test.tsx:23-25`): `queryAll((node) =>
node.type === 'RNSVGPath')` for the d strings, the `RNSVGSvgView` host for width and height:

1. `draws the up arrow at 36 by 15` - assert the Svg's `width` 36 and `height` 15, and both
   Path elements' `d` props start `M0 15`: the fill's ending ` Z`, the border stroke's without
   it.
2. `draws the down arrow at 36 by 15 mirrored` - same through `M0 0` for the down pair.
3. Add to the Explanation suite: `overlap-into-the-row constant is 6` - assert `TIP_OVERLAP
   === 6`. The pin lands in `components/prayer/__tests__/Explanation.test.tsx`, the only test
   file in this step's list.

Run: red today (30 by 12, overlap 4). Record the failing names and first lines.

## Change contracts

In `components/prayer/Explanation.tsx`:

- Up arrow: `width={36} height={15} viewBox={'0 0 36 15'}`. Both Path elements take the new
  geometry: the fill path `d={'M0 15 L14.4 4.4 Q18 1.3 21.6 4.4 L36 15 Z'}` and the border
  stroke path the same string without the trailing ` Z`
  (`d={'M0 15 L14.4 4.4 Q18 1.3 21.6 4.4 L36 15'}`).
- Down arrow: `width={36} height={15} viewBox={'0 0 36 15'}`. Fill path
  `d={'M0 0 L14.4 10.6 Q18 13.7 21.6 10.6 L36 0 Z'}`, border stroke the same string without
  ` Z`.
- The 1pt stroke stays on the side edges only; the fill colour and every other style value
  untouched.

In `components/overlay/OverlayInfoBox.tsx`:

- `export const TIP_OVERLAP = 6;` (the docblock line above it already says what it is).

Nothing else: the placement arithmetic, `SPACING.overlap` (-1) and the card body are untouched.

## Green run

1. `npx jest components/prayer/__tests__/Explanation.test.tsx components/overlay/__tests__/overlayPlacement.test.ts components/overlay/__tests__/catcherGeometry.test.ts --watchman=false`
   - new pins green, the placement arithmetic green through the imported constant.
2. `yarn validate`.

## Break script

`bash <TMPDIR-copy>/scripts/break-106.sh arrow` from the repository root. It restores
`TIP_OVERLAP` to 4 only, runs the constant pin, expects it red, then restores from the backup
copy. Output ends `BREAK OK`.

## Version and commit

The next patch after `uat`'s `package.json` (bump `app.json` first). Commit message:
`<VERSION> - feat(overlay): the info-box arrow draws 36 by 15 and sinks 6 into the row - same shape, bigger (the prayer card unmoved)`.

## Review checklist

- Four path strings, four dimension values, one constant, three pins. Nothing else.
- No placement arithmetic change; no per-locale value anywhere.

## Merge

`git checkout uat && git merge --no-ff feat/info-box-arrow -m "<VERSION> - merge feat/info-box-arrow: the bigger arrow"`.
Never push.

## Done when

Reds recorded, suites green, `yarn validate` green, merged, hook lines pasted, the step entry
ends with its `session:` line.
