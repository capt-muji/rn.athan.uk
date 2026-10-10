# Step 08: the scanner joins the repo, then wave 1 (help, What's New, Settings)

The AST scanner lands as a permanent repo script with a Jest wrapper guard whose allowlist
starts at every not-yet-migrated file and shrinks to zero at step 14. Then the first three
data surfaces migrate: `shared/help.ts` (27 strings), `shared/whatsNew.ts` (14), and the
Settings sheet.

Requirements: R3.2, R5.1

- Branch: `feat/38-08-wave1`
- Anchors: `settings-toggle` (historical, pre-step-03: the toggle row is gone; it marks
  the Settings section where the labels this step migrates still live)
- Files added: `scripts/scan-strings.mjs` (copied verbatim from
  `ai/plans/39-localisation/scripts/scan-strings.mjs`, which stays as the planning-time census
  tool), `scripts/string-census-allowlist.json`, `shared/__tests__/stringGuard.test.ts`
- Files changed: `shared/help.ts`, `shared/whatsNew.ts`,
  `components/sheets/screens/Settings.tsx`, `shared/i18n/en.ts` (the wave's keys join),
  `components/modals/__tests__/Help.test.tsx`, `components/modals/__tests__/WhatsNew.test.tsx`,
  `shared/__tests__/help.test.ts`, `shared/__tests__/whatsNew.test.ts`,
  `components/sheets/screens/__tests__/Settings.test.tsx`

## The guard

`shared/__tests__/stringGuard.test.ts` runs `node scripts/scan-strings.mjs --guard scripts/string-census-allowlist.json`
through `child_process.execFileSync`, fails when the scanner exits non-zero, and prints the
offender list in the assertion message. The committed allowlist is the census output's
display-holding files minus this step's three (help and whatsNew are data modules: their
remaining literals are the catalog values themselves, so they sit on a second list
`dataModules` the scanner's guard ignores - the guard's second rule asserts those files
import from `@/shared/i18n` and hold no free-standing display sink calls; the assertion is a
source read checking `getString`-style helpers are gone: help entries come from `t()`).

## Red

1. `stringGuard.test.ts` `it('holds no display literals outside the allowlist')` - commit the
   allowlist WITHOUT help/whatsNew/Settings first: the guard fails listing exactly those three
   files' hits. That is the red. Then migrate; the same test goes green.
2. `help.test.ts`: keep every verbatim question/answer assertion (byte-identical); add
   `it('sources every entry from the catalog')` - `getHelpEntries()` output equals
   `entries.map((e) => ({ ...e, q: t(e.qKey), a: t(e.aKey) }))`. Fails before the migration.

## Change

1. `shared/help.ts`: the arrays of literals become arrays of `TranslationKey`s
   (`help.q.x`, `help.a.x`, `help.step.x`); the public getters resolve through `t()`. Public
   shapes and byte output unchanged.
2. `shared/whatsNew.ts`: same treatment (`whatsNew.title.x`, `whatsNew.body.x`);
   `VISIBLE_WHATS_NEW` logic untouched.
3. `Settings.tsx`: every label literal becomes `t('settings.…')` (the labels catalogued in
   step 05; the toggle rows, card titles, `'Other'`, `"What's new"`, `'Help'`).
4. `shared/i18n/en.ts`: the wave's keys are already there from step 05's wave-zero pass for
   these three files; any string the migration finds missing joins now, byte-identical.

## Green

Guard green with the three files off the allowlist; help/whatsNew/Settings suites green with
unchanged copy pins; tsc, Biome clean.

## Break script

1. Reintroduce one literal in `Settings.tsx` (`label='Show seconds'` hardcoded). Guard test
   fails naming the file and line. Restore.
2. In `help.ts` resolve one question through a hardcoded string instead of `t()`. Named test 2
   fails. Restore.
3. Empty the allowlist JSON (`[]`) while unmigrated files remain: guard fails listing them.
   Restore the committed allowlist. End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): string guard lands; help, whatsNew and Settings render through the catalog`

## Review checklist

Every migrated string's bytes are pinned by an existing assertion that did not change (the
suites are the parity proof - name three in the review). Shipped classes: Residue (no key
authored that nothing reads; the allowlist is sorted and minimal).

## Done when

Guard green, the three files' display hits are zero, break `ALL AS EXPECTED: 1`, hook lines as
step 01, merged `--no-ff`.

## Restore

`git checkout --` the changed files; delete the three added files; restore the allowlist.
