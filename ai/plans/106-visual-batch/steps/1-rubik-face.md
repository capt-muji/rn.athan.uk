# Step 1: the Rubik face under ar

Requirements: R1.1, R1.2, R1.3
Weight: 2

Anchor check: `ar-record` and `day-styles` count exactly 1 (the preflight proved both; if either
moved, STOP: the plan is stale).

## Goal

The ARABIC record names Rubik for every family it carries, the two Rubik TTFs are bundled, and
nothing else changes - no Day.tsx value, no lineHeight, no scriptLineHeight.

## Branch

`git checkout -b feat/ar-rubik-face uat` (fetch `origin` first).

## Files

- `assets/fonts/Rubik-Regular.ttf`, `assets/fonts/Rubik-Medium.ttf` (new)
- `app.json`
- `shared/typography.ts`
- `shared/__tests__/typography.test.ts`
- `components/__tests__/typographySweep.test.tsx`

## Red tests

1. In `shared/__tests__/typography.test.ts`: change the four pinned family names (lines 31-34)
   to the Rubik contract - `familyRegular` to `'Rubik-Regular'`, `familyMedium` to
   `'Rubik-Medium'`, `familyDigits` (line 33, today Roboto Medium) to `'Rubik-Medium'`,
   `familyRowTime` (line 34, today Roboto Regular) to `'Rubik-Regular'`. Run: red today (the
   record still names Noto and Roboto).
2. In `components/__tests__/typographySweep.test.tsx`: change the two `NotoSansArabic-Medium`
   pins (lines 241, 258) to `Rubik-Medium`, and the row-time pin (line 281,
   `rowTimeFontFamilyUnder('ar')` today `'Roboto-Regular'`) to `'Rubik-Regular'`. Run: red
   today.

Record the exact failing names and first failing lines. Any other test failing is a STOP.

## Change contracts

1. Download the two pinned files (Rubik v31, weights 400 and 500, the full cut carrying Arabic
   and Latin digits):
   `curl -sL "https://fonts.gstatic.com/s/rubik/v31/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4i1UA.ttf" -o assets/fonts/Rubik-Regular.ttf`
   `curl -sL "https://fonts.gstatic.com/s/rubik/v31/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-NYi1UA.ttf" -o assets/fonts/Rubik-Medium.ttf`
   Then verify what landed with a stdlib python read of the sfnt tables (table directory entry
   i at byte 12+16i; hhea ascender/descender at its offset +4/+6; head unitsPerEm at +18; cmap
   format 4 segment ranges; OS/2 usWeightClass at its offset +4): expected per file, upem 1000,
   hhea ascent 935 descent -250 (box 1.185em), cmap covering U+0627 and U+0031, and
   usWeightClass 400 in Rubik-Regular.ttf, 500 in Rubik-Medium.ttf (the two files share every
   other metric, so the weight class is the only transposition guard). Any mismatch: STOP per
   PLAN 2.2, first row, with the numbers read.
2. `app.json`: add the two files to the expo-font plugin's list beside the four existing
   entries.
3. `shared/typography.ts`, the ARABIC record only: `familyRegular: 'Rubik-Regular'`,
   `familyMedium: 'Rubik-Medium'`, `familyDigits: 'Rubik-Medium'`, `familyRowTime:
   'Rubik-Regular'`. Every other record, `scriptLineHeight`, `size`, `lineHeight` and
   `letterSpacing` untouched.

## Green run

1. `npx jest shared/__tests__/typography.test.ts components/__tests__/typographySweep.test.tsx components/day/__tests__/DayLines.test.tsx --watchman=false`
   - the re-pinned cases green, the Day pins green untouched (lineHeight undefined, margins 2
   and 5).
2. `yarn validate` (the full suite proves R1.2: nothing non-ar moved).

## Break script

`bash <TMPDIR-copy>/scripts/break-106.sh face` from the repository root. It swaps the four
family values in `shared/typography.ts` back to their pre-change names only, runs the
typography test, expects it red, then restores from the backup copy. Output ends `BREAK OK`.

## Version and commit

The version is the next patch after `uat`'s `package.json` when the step runs (bump `app.json`
first, then `package.json`, then `android/app/build.gradle`). Commit message:
`<VERSION> - feat(typography): Arabic renders Rubik end to end - words, digits, letters, row times (the location-date gap rides the font's own box)`.

## Review checklist

- The diff carries two binary assets, one app.json line pair, four values in one record, and
  the re-pinned tests. Nothing else.
- No `components/day/Day.tsx` change. No lineHeight anywhere.

## Merge

`git checkout uat && git merge --no-ff feat/ar-rubik-face -m "<VERSION> - merge feat/ar-rubik-face: the Rubik face"`.
Never push.

## Done when

Reds recorded, the TTF verification recorded in `LOG.md`, suites green, `yarn validate` green,
merged into `uat`, the hook's `Tests:` and coverage lines pasted, and the step entry ends with
its `session:` line.
