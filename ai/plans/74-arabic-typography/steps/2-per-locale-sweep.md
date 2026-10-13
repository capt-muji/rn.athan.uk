# Step 2: the per-locale sweep of every text style

Requirements: R2.1, R2.2, R2.3, R2.4, R2.5, R2.6, R2.7

Weight: 2

## Anchor check

Copy `ai/plans/74-arabic-typography/scripts/preflight-74.sh` to `$TMPDIR`, then run it from the
repository root: `bash "$TMPDIR/preflight-74.sh" 04 09`. Expected output: `PREFLIGHT OK` (04 is
drifted by this ticket's own step 1 fonts entry; 09 stays drifted until the bounded replan
re-pins it against row 72's landed form — the replan happens before this step starts; section 10
of PLAN.md owns both).

## Goal

Every text style in the app resolves its rendered numbers through the locale typography module.
Under ar the app renders Noto Sans Arabic at the pinned table; under the five other locales every
style keeps its exact pre-change numbers.

## Branch

`git fetch origin`, then `git checkout -b code/74-typography-sweep uat` (after step 1's merge).

## Files

- The 25 inventory files below
- `components/__tests__/typographySweep.test.tsx` (new)
- `shared/__tests__/unusedExports.test.ts` (the `typographyFor` allow-list entry removed; the
  consumers land in this same commit)

The inventory: 25 files, the style keys each converts, and the treatment. `F+S` means family and
fontSize (plus lineHeight and letterSpacing where the style sets them), resolved through
`typographyFor(currentLocaleId())` at module scope. "untouched" means the style keeps its source
form byte-for-byte.

| File | Styles | Treatment |
| --- | --- | --- |
| components/ui/Error.tsx | heading (F+S, medium), subtext (F+S, regular) | convert |
| components/ui/InitialWidthMeasurement.tsx | hidden (F+S, regular) | convert |
| components/sheets/screens/Alert.tsx | cardTitle (medium), cardHint (regular), optionLabel (regular), unavailableText (regular + lineHeight) | convert |
| components/sheets/screens/ColorPicker.tsx | label (regular), resetText (regular), modalTitle (medium); chevron untouched | convert |
| components/sheets/screens/Language.tsx | optionLabel (regular), applyingLabel (regular) | convert |
| components/sheets/screens/Qibla.tsx | action (medium), headline (medium), message (regular), place (regular + lineHeight), subtitle (regular) | convert |
| components/sheets/screens/QiblaCompass.tsx | inline dial Text: fontFamily only; fontSize stays `radius * FACE.cardinalSize` | family only |
| components/sheets/screens/ReminderCard.tsx | cardTitle (medium), cardHint (regular), optionLabel (regular) | convert |
| components/sheets/screens/Settings.tsx | cardTitle (medium), whatsNewLabel (regular), athanLabel (regular); chevron untouched | convert |
| components/sheets/screens/Sound.tsx | cardHint (regular) | convert |
| components/sheets/parts/Header.tsx | title (medium, letterSpacing), subtitle (regular) | convert |
| components/sheets/parts/LabeledToggle.tsx | label (regular) | convert |
| components/sheets/parts/SegmentedControl.tsx | label (regular) | convert |
| components/sheets/parts/SoundItem.tsx | text (regular), countdown (regular) | convert |
| components/sheets/parts/Stepper.tsx | buttonText (medium), value (medium), unit (regular) | convert |
| components/countdown/Countdown.tsx | text (no family today: gains `fontFamily: ty.arabic ? ty.familyRegular : undefined`, so ar leaves the fallback and every other locale keeps the unset property and its system face), countdown (medium) | convert |
| components/prayer/Ago.tsx | prayerAgo (regular) | convert |
| components/prayer/Explanation.tsx | infoTitle (medium), infoExplanation (regular + lineHeight) | convert |
| components/prayer/Prayer.tsx | text (regular) | convert |
| components/prayer/Time.tsx | text (regular) | convert |
| components/modals/Help.tsx | question (medium, lineHeight, letterSpacing), cause (regular, lineHeight), stepText (medium, lineHeight), actionText (medium), buttonText (medium); chevron, stepMark, titleBadgeGlyph untouched | convert |
| components/modals/Modal.tsx | title (medium, letterSpacing) | convert |
| components/modals/Update.tsx | message (regular, lineHeight, letterSpacing), cancelText (medium), updateText (medium) | convert |
| components/modals/WhatsNew.tsx | version (regular, lineHeight, letterSpacing), title (medium, letterSpacing), body (regular, lineHeight, letterSpacing), buttonText (medium) | convert |
| components/day/Day.tsx | location (regular), date (regular) | convert |

Consumer form in each file:

```ts
import { currentLocaleId } from '@/shared/i18n/locale';
import { typographyFor } from '@/shared/typography';

const ty = typographyFor(currentLocaleId());
```

then inside the style literals: `fontFamily: ty.familyMedium` (or `ty.familyRegular` matching the
inventory's weight column), `fontSize: ty.size(<pre-change number or token expression>)`,
`lineHeight: ty.lineHeight(<pre-change number>)`, `letterSpacing: ty.letterSpacing(<pre-change
value>)`. Token expressions stay as the argument (`ty.size(TEXT.sizeDetail - 1)`); the map owns
the rendered number. The one exception is Countdown.tsx `text`, which sets no family today: its
family expression is `ty.arabic ? ty.familyRegular : undefined` per the inventory row, so
English keeps the unset property.

## Red first

Write `components/__tests__/typographySweep.test.tsx` before the sweep:

1. The guard table: for every file in the inventory, read the source and assert it imports
   `typographyFor` and holds no `fontFamily: TEXT.family` reference outside the styles D74.6
   names untouched (Help.tsx titleBadgeGlyph is the one expected survivor); for Countdown.tsx
   also assert the source contains the inventory's exact family expression
   `ty.arabic ? ty.familyRegular : undefined`, so the one behavioural conversion no render probe
   reaches is pinned at source level (R2.6). Red today on all 25.
2. The render probes with `@testing-library/react-native`, under
   `jest.isolateModules` + `jest.resetModules` per locale case, `setActiveLocale` before the
   require: require `@testing-library/react-native` inside the same `isolateModules` callback as
   the component and render inside it, so component, library and React resolve from one module
   registry. `BottomSheetHeader` with title and string subtitle — assert the title Text's
   fontFamily equals `NotoSansArabic-Medium` and fontSize 25 under ar, and `Roboto-Medium` with
   fontSize 22 and letterSpacing -0.3 under en; `ModalHelp` with the real catalog — assert the
   first question Text renders `NotoSansArabic-Medium` at fontSize 17 under ar and `Roboto-Medium`
   at 15 under en. Red today on the ar assertions, green on the en assertions (en is already
   byte-identical).

Record the first failing names and lines verbatim.

## Change contracts

- Each inventory file converts its listed styles to the consumer form above; no other style in
  the file moves; the untouched styles stay byte-identical (R2.5).
- `InitialWidthMeasurement.tsx` resolves the same record, so the hidden Texts measure the
  rendered rows (R2.4); the widen-only per-locale keys (`stores/ui.ts:113-131`) absorb the new
  widths with no stored-state change.
- The en table (R2.2) pins the pre-change numbers per probed style; the guard table pins the
  file set (R2.6, R2.7).

## Green run

`npx jest components/__tests__/typographySweep.test.tsx --watchman=false --selectProjects=components`,
then `yarn validate` over the whole repo. Expected: guard and probes green, the full gate green
at the coverage ceilings.

## Break script

1. Revert one swept file's family to its raw `TEXT.family` form, run the guard: it names that
   file. Revert. Delete or simplify Countdown.tsx's family ternary to a bare
   `ty.familyRegular`, run the guard: the Countdown source assertion fails. Revert.
2. Change one `ty.size` call back to its raw number in a probed file, run the probes: the ar
   assertion fails on the fontSize. Revert.
3. Flip `ARABIC_SIZE_FACTOR` to `1.0` in `shared/typography.ts`, run both suites: the step-1
   table and the ar probes fail together. Revert.

Record the first failing line of each; these three are the mutation pass (R2.7 with R1.10).

## Version and commit

Version from the version command: the next patch after uat's `package.json`. Bump `package.json`
and `app.json` together. Commit message:
`<VERSION> - feat(74): every text style resolves through the locale typography map`.

## Review checklist

- The diff touches only the 25 inventory files plus the new test.
- No untouched style drifted; the untouched list is diff-visible.
- No `fontWeight` added anywhere; the weight rides the family files.

## Merge

`git checkout uat && git merge --no-ff code/74-typography-sweep -m "<VERSION> - merge code/74-typography-sweep: ticket 74 step 2"`. Never push.

## Done when

R2.1 to R2.7 hold, the mutation pass is recorded, `yarn validate` is green, and the width layer
still measures through the same resolved styles.
