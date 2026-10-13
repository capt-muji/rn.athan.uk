# Audit 74: Arabic typography parity

Two reviewers over the code range (`git diff uat...lane/74 -- . ':(exclude)ai/plans'`), blind and
plan-conformance, at the delivered tip `9cadc69d`. Findings adjudicated against the code.

## Verified first-hand

- The three font digests equal step 1's pins: Regular `bdff3e56…aaef48`, Medium `5aaa32f0…b0c42`,
  OFL `a7a5a25e…e13af`. The two TTFs report usWeightClass 400 and 500.
- A cmap parse: both Noto faces carry 1250 codepoints, ASCII and Arabic-Indic digits, colon, dot
  and space, and no Latin letter (`U+0041`/`U+0061` absent); Roboto-Regular carries them.
- `app.json` lists the four font paths, the Roboto pair ahead of the Noto pair.
- The `en` side is byte-identical: `LATIN` returns the pre-change Roboto families and identity
  size, line height and letter spacing, so every swept non-ar style resolves what it resolved
  before.
- The delivered tip failed `yarn validate` (2 failed) before the fix commit below; it passes after.

## Findings and verdicts

| # | Source | Finding | Verdict |
| --- | --- | --- | --- |
| 1 | PC1, B1 | `components/__tests__/typographySweep.test.tsx:137,:154` still expected the 1.15 sizes (25, 17) while `shared/typography.ts` pins the factor at 1, so the tip was red | Fixed: pinned 22 and 15, retitled both cases to the unchanged-size contract |
| 2 | PC2, B3 | The tip commit `9cadc69d`'s subject claims 2.0.218 but touched no version file (both stayed 2.0.213) | Fixed: the audit fix commit bumps `package.json` and `app.json` together to 2.0.216 (next free above `origin/uat`'s 2.0.215); the historical miss is recorded in `LOG.md` |
| 3 | PC3 | The revert was unrecorded and its paragraph sat after step 3's closing `session:` line, breaking the ledger shape | Fixed: `LOG.md` carries a `### Size-factor revert — executed` entry (red, green, version, session) and step 3 closes with its own session line |
| 4 | PC4, B4 | The module docblock cited "the 1.15 factor's derivation" from a plan-folder file | Fixed: the docblock states the map's job alone; the citation is dropped, so `FONT-MEASUREMENTS.md` is uncited and dies with the folder |
| 5 | B5 | The constant's comment recorded review history and an open owner decision | Fixed: rewritten to the why of the value alone |
| 6 | PC7, B9 | `ARABIC_SIZE_FACTOR` was exported with no external reader | Fixed: made module-local; its value stays guarded by the identity table |
| 7 | B6 | The consumer comment guaranteed the module-scope answer "never goes stale" though a refused reload leaves ar with Latin styles | Fixed: narrowed to the one fact, that the answer changes only across the ar boundary |
| 8 | B7 | `shared/i18n/locale.ts` documented that nothing reads locale at module evaluation, which the sweep's module-scope callers now contradict | Fixed: the rationale now states the first call runs the synchronous reads and memoizes them for module-scope callers and bootstrap alike |
| 9 | PC6 | The two ar probe titles said "at the scaled size", which no longer distinguishes them from the en cases | Fixed with finding 1 |
| 10 | B8 | The countdown-family test asserted only that the module exports a function, under a title claiming the family | Fixed: renamed to what it proves (the ar branch is evaluated for coverage); the family is pinned at source level by the sweep guard |
| 11 | PC5 | Plan and README text still describe the 1.15 factor and "IN PROGRESS, step 1" | Fixed at the DONE fold: the queue cell carries the delivered state; the plan docs die with the merge |
| 12 | B2 | Under ar the swept styles resolve the Arabic-only face, so Latin content (untranslated What's New copy, language names, the Qibla location string) falls to the platform face on iOS | Carried, not fixed |

## Finding 12, adjudicated

The bundled Noto faces carry no Latin letters (measured above), so under ar every swept style's
Latin glyphs, punctuation outside the face's coverage and any non-Arabic script fall to the OS
fallback. Before this change the app's model was the mirror image: one bundled Latin face (Roboto)
with the OS supplying Arabic. The ticket extends the same model to Arabic, and per-locale family
selection is the plan's contracted design (R2.1). The correct alternative is per-script family
selection at render time, a mechanism the plan did not choose and that no single `fontFamily` can
express; a per-surface revert cannot be complete, because the affected surfaces (What's New, the
language list) carry mixed scripts. The effect is iOS-only and lands on untranslated or non-catalog
strings. Recorded as a carried item on the owner's ar parity pass (queue row 81's ground); no code
changed.

## Carried

- Finding 12: Latin/non-Arabic content under ar takes the platform fallback face on iOS, from the
  Arabic-only bundled faces. Owner's call, her ar parity pass.
