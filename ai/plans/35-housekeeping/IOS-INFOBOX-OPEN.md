# OPEN: the Extras explanation box is still mispositioned on iOS

**Status: NOT FIXED. Android is correct, both iPhones are not.** Start the next session here.

## What the owner reports, after the rebuild to 1.29.68

- **OnePlus 3T (Android 9): perfect on every Extras row.** The owner confirmed this twice.
- **iPhone XS simulator AND the physical iPhone XS: wrong on EVERY Extras row.**

The owner's exact framing, which narrows it and must not be lost:

> "It's not about the box overlapping the date. It's more about the box being pointing to the
> correct row. It's **too far away from the row** on the iPhone. Compare both, look at the
> difference." And: "We're only talking about **the box itself**, the **position of the box**."

So: the box's placement relative to its row is right on Android and too far from the row on iOS.
The row itself, the pill and the catchers are all correct on both. This is the box's offset only.

## What shipped in 1.29.67 and 1.29.68 (keep, it is not the cause)

Both commits are correct as far as they go and Android proves it:

1. The box no longer has a fixed `INFO_BOX_HEIGHT = 300` against ~166pt of content. It hangs from
   the row edge (`top` when below, `bottom` when above) with no height, so it is as tall as its
   content.
2. `showInfoBoxAbove` no longer uses a hard-coded `visualRowIndex >= 3`, which was written for the
   six-row Standard list and flipped the Extras list's last row (and on Fridays its last TWO,
   Duha and Istijaba, which is exactly the "last 2 too high" the owner first reported).

## The evidence, and what it points at

Read from the owner's screenshots at `~/Desktop/Screenshot iPhone XS replica (18) 28-09-2026 at
09.35.*.png` (XS simulator, 1.29.68, Monday 28 Sep, a FOUR-row Extras list):

| Screenshot | Selected row | Where the row is drawn | What the box does |
| --- | --- | --- | --- |
| 09.35.29 | Midnight | y ~705 | Sits below the row, looks correct |
| 09.35.26 | Last Third | y ~840 | Sits below the row |
| 09.35.23 | Suhoor | y ~974 | Sits below the row |
| 09.35.20 | Duha | y ~1110 | Flips above; its card overlaps the date text |
| 09.35.34 | (closed) | Midnight 705, Last Third 840, Suhoor 974, Duha 1110 | The list at rest |

**The rows are ~134pt apart in the closed list** (705, 840, 974, 1110). But `STYLES.prayer.height`
is **57**, and `Overlay.tsx` computes every anchor as
`listMeasurements.pageY + visualRowIndex * STYLES.prayer.height`.

That is the prime suspect: **the constant the overlay multiplies by does not match the row pitch iOS
actually lays out.** On Android the two agree, which is why Android is pixel-perfect. Screenshot
points are in image pixels and the XS replica renders at 3x, so convert before concluding: 134
image px at 3x is ~45pt, and at 2x ~67pt. Neither is 57, so **measure it properly before designing
a fix** rather than trusting this paragraph.

## How to measure it correctly next session

Do NOT drive the app by tapping guessed coordinates. That is what went wrong at the end of this
session: taps meant for a list row landed on the settings sheet and the sound sheet, and produced
nonsense readings. Instead:

1. `agent-device open --udid EB00ED20-949A-4834-99A9-668F971EB53C com.mugtaba.athan`, then
   `snapshot` and read rects from the accessibility tree, which returns real POINTS, not pixels.
2. With the overlay CLOSED, record each Extras row's `rect.y` and `rect.height`. Compare the pitch
   with `STYLES.prayer.height` (57) and with what `List.tsx` actually renders.
3. Open one row, snapshot again, and record the explanation box's own rect against that row's rect.
4. Do the same on the 3T via `mobile-mcp`, whose numbers ARE pixels at 420dpi, and compare the two
   devices in the same unit before concluding anything.

## The other thing to check, from `List.tsx`

`measureList` bails on the Extras page:

```ts
if (!listRef.current || !isStandard) return;
```

So `measurementsListAtom` is only ever the STANDARD list's rect, and the Extras box is positioned
from it. If the two lists sit at different `pageY` on iOS but the same on Android, that alone would
produce this exact symptom. Verify before changing it: the measurement is deliberate and shared, and
this session did not establish which page it belongs to.

## What is already covered by tests

`components/overlay/__tests__/overlayPlacement.test.ts` pins the anchor arithmetic, the four-row
Extras list, and the five-row Friday list, and every case is verified red against the old rule.
Those tests will NOT catch this, because they assert the anchor formula rather than the row pitch
the platform lays out. A fix for this needs a test over the pitch itself.
