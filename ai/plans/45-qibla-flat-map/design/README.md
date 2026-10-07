# The qibla compass design, locked by the owner on 2026-09-30

`shared/qiblaCompass.ts` cites this page. The drawing code is now the specification: `FACE` in
`shared/qiblaCompass.ts`, the two palettes in `COLORS.qibla` (`shared/constants.ts`), the Kaaba in
`shared/kaabaFigure.ts`, and the clearances pinned by `shared/__tests__/qiblaCompass.test.ts`. The owner moved
several values on the phone after the lock, so where an old render and the code differ, the code is right. The
generator and its two renders left the repository on 2026-10-07 and are in git history under this folder.

## Decisions the drawing keeps

- The jewel at the pivot is the Rub el Hizb as an OUTLINE, never filled.
- The line and its barbed head are ONE closed path, with no seam.
- The rim is one disc and one ring, and nothing is drawn above or outside the dial. The owner removed the fixed
  marker.
- N, E, S and W are drawn in the ink colour, never the accent, and N is not singled out.
- On the line the whole instrument turns gold at once, off the same flag that fires the haptic.

## Rules for any new drawing on this sheet, the hint included

- No compass rose and no pointed radiating rays: they read as another faith's emblem.
- No hexagram and no filled eight-point star. The outlined Rub el Hizb is approved.
- No pinwheel of L-shaped blocks and no square Kufic. A motif built from repeated blocks must have all four mirror
  axes: a four-fold rotation alone drew a swastika by accident, and two overlapped triangles drew a six-point star.
- Check every new motif against this list before the owner sees it.
- Colours come from `COLORS.qibla` alone. The owner ruled out white, grey and black for this sheet.
