# Step 09: wave 2, every remaining component surface

Every display string under `components/` migrates to the catalog. The census
(`node ai/plans/39-localisation/scripts/scan-strings.mjs` from the repo root, or the repo copy
landed in step 08) names the files; the guard's allowlist sheds them all in this step.

Requirements: R3.2, R5.1
Weight: 2

- Branch: `feat/38-09-wave2`
- Anchors: `explanation-arabic` (now the single-line explanation), `overlaycontent-arabic`
  (the English half remains, and step 06 has since retitled `EXTRAS_ENGLISH` to the legacy
  title-case array in this region's `indexOf` line - edit against the retitled shape), plus
  each file's own hits from the census
- Files: from the census byFile table, the component files still holding display hits after
  step 08, including `components/sheets/screens/Alert.tsx` (10: `'Silent'`, `'Sound'`, `'Off'`,
  `'Close to save'`, `'15 min'`, stepper labels), `components/sheets/screens/ColorPicker.tsx`,
  `components/sheets/screens/Qibla.tsx` (17), `components/sheets/screens/QiblaCompass.tsx` (18),
  `components/sheets/screens/QiblaWave.tsx` (10), `components/sheets/screens/Sound.tsx`,
  `components/sheets/parts/Header.tsx`, `SoundItem.tsx`, `Stepper.tsx`,
  `components/modals/Update.tsx`, `WhatsNew.tsx`, `Help.tsx`, `components/ui/Glow.tsx`,
  `Error.tsx`, `components/prayer/Explanation.tsx` (the English line and the
  `EXTRAS_EXPLANATIONS` text), `components/overlay/Overlay.tsx`, `OverlayInfoBox.tsx`,
  `components/countdown/Bar.tsx`, `Countdown.tsx`, `components/day/*` copy,
  `components/ui/SettingsButton.tsx`, `ReminderCard.tsx`, and
  `shared/constants.ts` (`EXTRAS_EXPLANATIONS` becomes catalog keys `extras.explanation.<id>`,
  resolved through `t()` at the one consumer)
- Suites: R14's table rows for category 3 component files (Settings, Alert sheets, Qibla,
  Sound, SoundItem, Header, Modal, Help, WhatsNew, Update, Explanation, Overlay trio, Ago,
  Countdown, index tests)

## Red

The guard test with this step's files removed from the allowlist: it fails listing every
remaining component hit. That failing list, committed to LOG.md, is the wave's worklist and
its red.

## Change

File by file: every literal the census flags becomes `t('…')` with a byte-identical catalog
value; every JSX attribute label (`accessibilityLabel=`, `title=`, placeholder-style props)
included. Qibla copy follows D20: labels and instructions only, no sensor code. The
`Alert.alert` buttons in `device/qibla.ts` are device-side and belong to wave 3, not here.
Nothing visual moves: same strings, same nodes, same styles.

Each file's suite keeps its verbatim copy assertions unchanged - they are the parity proof.

## Green

Guard green for `components/`; every named suite green; tsc, Biome clean.

## Break script

1. Hardcode one label back in each of three files (one sheets, one modal, one ui). Guard fails
   naming all three lines. Restore.
2. Change one catalog value's bytes (`settings.title` to `'Configuration'`). The Settings
   suite's pin fails (the parity net). Restore. End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): every component surface renders through the catalog`

## Review checklist

The diff is a mechanical literal-to-`t()` swap. Hunt: a `t()` call wrapping an empty string, a
key authored for a string that also stayed hardcoded (double definition), an
`accessibilityLabel` missed (screen-reader copy is display copy). Shipped classes: Residue.

## Done when

`node scripts/scan-strings.mjs --guard scripts/string-census-allowlist.json` exits 0 with the
component files off the allowlist; `grep -rn "'[A-Z][a-z]+" components/ --include='*.tsx' | grep -v 't(' | grep -v __tests__`
reviewed to zero display hits; break `ALL AS EXPECTED: 1`; hook lines as step 01; merged
`--no-ff`.

## Restore

`git checkout --` each changed file; restore the allowlist.
