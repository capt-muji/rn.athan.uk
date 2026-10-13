# Step 1: Arabic fonts bundled and the locale typography module

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R1.7, R1.8, R1.9, R1.10

Weight: 2

## Anchor check

Copy `ai/plans/74-arabic-typography/scripts/preflight-74.sh` to `$TMPDIR`, then run it from the
repository root: `bash "$TMPDIR/preflight-74.sh" 09`. Expected output: `PREFLIGHT OK` (the
drifted 09 anchor is row 72's landed countdown rewrite, a Needs-first precondition of this
ticket; section 10 of PLAN.md owns the bounded replan that re-pins it).

## Goal

The repo carries the two Noto Sans Arabic faces with a verified digest each, registered beside
Roboto through the expo-font plugin array, and a pure locale typography module whose map is
tested over all six locales. No component consumes the module yet; the app renders exactly as
before.

## Branch

`git fetch origin`, then `git checkout -b code/74-arabic-typography-module uat`.

## Files

- `assets/fonts/NotoSansArabic-Regular.ttf` (new, downloaded, digest-pinned)
- `assets/fonts/NotoSansArabic-Medium.ttf` (new, downloaded, digest-pinned)
- `assets/fonts/OFL.txt` (new, from the release zip)
- `app.json` (two entries added to the expo-font fonts array)
- `shared/typography.ts` (new)
- `shared/__tests__/typography.test.ts` (new)
- `shared/__tests__/unusedExports.test.ts` (allow-list entry added, removed again in step 2)

## Red first

Write `shared/__tests__/typography.test.ts` against the module before the module exists. The
suite:

1. The map table: for each of the six `LOCALE_IDS`, assert `typographyFor(locale)` against the
   pinned record — ar families and the Math.round table (10 to 12, 13 to 15, 14 to 16, 15 to 17,
   16 to 18, 18 to 21, 20 to 23, 22 to 25, 26 to 30, 28 to 32; lineHeight 16 to 18, 20 to 23,
   22 to 25; letterSpacing 0), the five others to the Roboto names and identity functions.
2. The live resolution: with `jest.isolateModules` plus `jest.resetModules`, call
   `setActiveLocale('ar')`, require both `@/shared/i18n/locale` and `@/shared/typography`,
   evaluate `typographyFor(currentLocaleId())`, and assert the ar record (families, the table,
   letterSpacing 0, arabic true); repeat with `'en'` for the Roboto identity record with
   `arabic` false.
3. The mutation targets named in the break script below are the table assertions.

Record the first failing output verbatim (the import resolution error is the expected first
failure). Any other suite failing is a STOP.

## Change contracts

- `shared/typography.ts`: exports `ARABIC_SIZE_FACTOR = 1.15`, the `LocaleTypography` interface
  (`familyRegular`, `familyMedium`, `size`, `lineHeight`, `letterSpacing`, `arabic`), and
  `typographyFor(locale: LocaleId): LocaleTypography`. The ar record: families
  `NotoSansArabic-Regular` / `NotoSansArabic-Medium`; `size` and `lineHeight`
  `Math.round(n * ARABIC_SIZE_FACTOR)`; `letterSpacing` returns 0; `arabic` true. The non-ar
  record: families from `TEXT.family`; identity functions; `arabic` false. Imports: `TEXT` from
  `@/shared/constants`, the `LocaleId` type from `@/shared/i18n/locale`. No react import. The
  module exports nothing else; consumers resolve `typographyFor(currentLocaleId())` at their own
  module scope. The docblock cites
  `ai/plans/74-arabic-typography/FONT-MEASUREMENTS.md` for the factor derivation in one line.
- `app.json`: the expo-font fonts array lists the two Roboto paths unchanged, then
  `./assets/fonts/NotoSansArabic-Regular.ttf` and `./assets/fonts/NotoSansArabic-Medium.ttf`.
  Nothing else in the file moves.
- `shared/__tests__/unusedExports.test.ts`: `REACHED_WITHOUT_AN_IMPORT` gains the entry
  `typographyFor: 'the 25 swept consumers land in this ticket's step 2; the entry dies with them'`
  (the `MAX_WHATS_NEW_ITEMS` precedent). Without it the unused-exports gate fails both its
  assertions at step 1, where the module has no production consumer yet. Step 2 removes the
  entry in the same commit that lands the consumers.
- Download and verify (run from `$TMPDIR`, never inside the repo):

```bash
curl -sL --max-time 60 -o NotoSansArabic-v2.013.zip \
  "https://github.com/notofonts/arabic/releases/download/NotoSansArabic-v2.013/NotoSansArabic-v2.013.zip"
unzip -o -q NotoSansArabic-v2.013.zip -d noto-arabic
shasum -a 256 noto-arabic/NotoSansArabic/hinted/ttf/NotoSansArabic-Regular.ttf \
  noto-arabic/NotoSansArabic/hinted/ttf/NotoSansArabic-Medium.ttf \
  noto-arabic/OFL.txt
```

Expected digests: Regular `bdff3e5659d67e67def05b33f749683b9376ae819d65d3dd62ac4640b3aaef48`,
Medium `5aaa32f0fe7fdd828342aea06a3c645edb51bcea2620af68b4c385a3b9fb0c42`,
`OFL.txt` `a7a5a25eb188bf1cd96982030d53e23c33485c69b1044a562254226857ee13af`. Copy the two TTFs
to `assets/fonts/` under their release names and `OFL.txt` to `assets/fonts/OFL.txt`. A mismatch
is a STOP (section 2.2 of PLAN.md); re-download once, then stop for the owner. R1.2 needs no
separate run: R1.1's digests pin the byte-exact files parsed at plan time, whose tables carry
usWeightClass 400 and 500 (`FONT-MEASUREMENTS.md`).

## Green run

`npx jest shared/__tests__/typography.test.ts --watchman=false --selectProjects=unit` then the
full `yarn validate`. Expected: the new suite green, the whole gate green, coverage at the repo
ceilings.

## Break script

1. Edit `ARABIC_SIZE_FACTOR` to `1.0`, run the suite: the ar table assertions fail first
   (expected first failure: the 10-to-12 mapping line, the table's first assertion). Revert.
2. Edit the ar `familyMedium` to `'NotoSansArabic-Bold'`, run: the family assertion fails. Revert.
3. Edit `typographyFor` to return `ARABIC` for `'ms'`, run: the ms identity assertion fails.
   Revert.

All three failures are the mutation pass (R1.10); record the first failing line of each.

## Version and commit

Version from the version command: the next patch after uat's `package.json`. Bump `package.json`
and `app.json` together (the gradle file joins at build time per the lockstep test's
gitignored-file rule). Commit message:
`<VERSION> - feat(74): bundled Noto Sans Arabic and the locale typography map`.

The step's LOG.md entry records the pre-merge uat sha it branched from; step 3 builds the red
from that sha.

## Review checklist

- `app.json` diff is exactly the two array entries.
- No component file changed in this step.
- The unused-exports allow-list entry names step 2 as the consumer that removes it.
- The docblock cites the measurements file by path, one line, no history.

## Merge

`git checkout uat && git merge --no-ff code/74-arabic-typography-module -m "<VERSION> - merge code/74-arabic-typography-module: ticket 74 step 1"`. Never push.

## Done when

R1.1 to R1.10 hold, the digests match, `yarn validate` is green, and the rendered app is
unchanged (no consumer yet).
