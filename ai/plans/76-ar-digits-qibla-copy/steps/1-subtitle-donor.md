# Step 1: the subtitle width donor

Requirements: R1.1, R1.2, R1.3
Weight: 2

Anchor check: `scripts/anchors/qibla-subtitle.txt` counts 1 in
`components/sheets/screens/Qibla.tsx`; `scripts/anchors/qibla-wider-line-test.txt`
counts 1 in `components/sheets/screens/__tests__/Qibla.test.tsx` (the pre-flight
verifies both).

Goal: the Qibla sheet's subtitle box fits the wider of its two sentences in the active
language, so neither line truncates, and the en rendering does not move.

Branch: `ticket/76` (commit directly on it; this run creates no side branches and
merges nothing).

Files: `components/sheets/screens/Qibla.tsx`,
`components/sheets/screens/__tests__/Qibla.test.tsx`, `app.json`, `package.json`.

Red tests, written first in `Qibla.test.tsx`:

1. Replace the `subtitleOpacity` helper (lines 207-209) with testID-based lookups and
   give the three texts stable ids in the component: `qibla-subtitle-waiting` on the
   in-flow line, `qibla-subtitle-ready` on the absolute line, `qibla-subtitle-donor`
   on the donor. Every existing test that queries the two sentences by text moves to
   the ids with its invariant unchanged (lines 236-276 and 334-341 in the current
   file).
2. New test, red first, named "sizes its box to the wider of its two sentences under
   en": render the sheet and assert the donor exists by testID, its flattened style
   has `height: 0`, no `marginTop` and no `position`, its `numberOfLines` is 1, and
   its text content equals `t('qibla.subtitleReady')`. Red line recorded in LOG.md:
   the donor testID is absent today, so `getByTestId` throws "unable to find".
3. New sweep, red first, named "sizes its box to the wider of its two sentences in
   each shipped locale" (`it.each` over `LOCALE_IDS` from `shared/i18n/locale.ts`):
   per locale, set it (try/finally restoring `en`, the pattern of
   `Explanation.test.tsx:62-71`), render the sheet, and assert the same structural
   facts: the donor exists, `height: 0`, no `marginTop`, no `position`,
   `numberOfLines` 1, and its text equals `t('qibla.subtitleReady')` in that locale.
   Six cases, all red today for the same reason. This sweep is what makes R1.1
   observable for all six locales, not two.
4. Update the test at current lines 261-269: its invariant becomes "the waiting line
   is in flow and the ready line is absolute" (both still true post-fix) and its
   comment keeps the measured en widths (158.6dp in flow, 150.4dp absolute) plus the
   new sentence: under ar and so the ready sentence is the wider one, which is what
   the donor pays for.

Change contract, `QiblaSubtitle` in `Qibla.tsx`:

- Keep the two `Animated.Text` lines exactly as they are, adding the testIDs.
- Add between them a plain `Text` with testID `qibla-subtitle-donor`,
  `accessibilityElementsHidden`, `importantForAccessibility={'no-hide-descendants'}`,
  `numberOfLines={1}`, style `[styles.subtitleText, styles.subtitleDonor]`, content
  `t('qibla.subtitleReady')`.
- Styles: define the shared text metrics (fontFamily, fontSize, color) once as the
  object `styles.subtitleText`; `styles.subtitle` spreads that object and adds
  `marginTop: SPACING.xs`; `styles.subtitleDonor` spreads `styles.subtitleText` and
  adds `{ height: 0, opacity: 0 }` and no margin (the donor adds width, never height;
  a `StyleSheet.create` value is one object, never an array).
  `styles.subtitleOver` is unchanged.
- One comment on the donor, one line: why it exists (the absolute line cannot widen
  the box, and which sentence is wider depends on the language).
- No other line of the file changes. The `qibla-place` text, the calibration view and
  every style outside `QiblaSubtitle` stay byte-identical.

Green run: `npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components`
(jest.config.js defines the projects `unit` and `components`; this suite is a .tsx
suite and runs under `components`). Expected: the whole file passes, including the
new donor tests. Then `yarn validate` (tsc, Biome, Jest). Expected: clean. Then
`yarn format` if Biome asks.

Break script (run after green, revert immediately):

```bash
# Prove the donor is what the new tests guard: drop its id
perl -0pi -e "s/ testID=\{'qibla-subtitle-donor'\}//" components/sheets/screens/Qibla.tsx
npx jest components/sheets/screens/__tests__/Qibla.test.tsx -t 'wider of its two sentences' --watchman=false --selectProjects=components
# Expected: 7 failed (the en donor test and the six locale cases of the sweep).
# Revert:
git checkout -- components/sheets/screens/Qibla.tsx
```

Version and commit: bump `app.json` then `package.json` to 2.0.602. Commit message:
`2.0.602 - fix(qibla): the subtitle box sizes to the wider sentence in every language, so the ready line never truncates under ar`.

Review: read the diff cold. The donor must not inherit a margin; the ready line must
stay absolute; the en test comments must carry both width pairs; no query anywhere
still resolves the subtitle pair by text content.

Merge: none this run.

Done when: the red lines are recorded in LOG.md, the suite and `yarn validate` are
green, the break script failed exactly the seven donor tests (the en case and the six
locale cases), and the commit is on `ticket/76` with both version files at 2.0.602.
