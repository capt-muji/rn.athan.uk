# Carried from mosque-db, 2026-11-14

Record for the app session: three uncommitted groups this working tree received
from the mosque-db repo (`~/repos/mosque-db`) on 2026-11-14. Verified by listing
this tree the same day. These files are part of this session's owed commit; the
mosque-db side deleted its originals, so this repo is now their only home.

## What was carried

- `scripts/build/` (8 files: `build-mock.zsh`, `build-mock-variant.zsh`,
  `build-mock-ramadan.zsh`, `build-prod.zsh`, `build-ios.zsh`,
  `devcheck.py`, `lupt-download.mjs`, `BUILD.md`): the live app build tools,
  carried because their natural home is this repo.
- `ai/plans/never-pushed-branches/` (2 patch files: `design-info-icon-candidates/0001-docs-design-ten-info-chip-glyph-candidates-owner-to-.patch`,
  `experiment-25-chronometer-ticking/0001-docs-widgets-the-Android-timerInterval-equivalent-in.patch`):
  patch files from the old gitree backups, carried so the branch work is not lost.
- `ai/plans/39-localisation/home-cldr-research/` (3 files, 92 KB: `cldr-compare.txt`,
  `cldr-summary.txt`, `cldr.json`): the CLDR research outputs for the home
  localisation plan.

## The mosque-db side is empty

The gitree originals were deleted from the mosque-db tree on 2026-11-14
(verified: `scripts/build/`, `ai/plans/never-pushed-branches/`,
`ai/plans/39-localisation/home-cldr-research/` all absent there). The tools now
live ONLY here. Commit them as part of this repo's next commit.

## Bake-integration worklist (from the mosque-db analysis)

Full analysis: mosque-db `ingest/.scratch/apprepo-recast-impact.md`. Its five
worklist bullets, copied verbatim so no cross-repo reading is needed:

1. **Land the owed commit first, alone**: commit the 13,956 `D` + 5 `M` working-tree
   changes (SLIMMING section 1 cut + AGENTS/README narrowing) as one version-bump
   commit before any recast work; verify the bake chain survives (zero paths under
   `ai/features/global-prayer-times/data/london-migration/`, `ai/features/moonsighting/`,
   `assets/data/`, `scripts/lupt/` in the commit).
2. **Add a bundle loader beside `stores/timetableAsset.ts`**: a sibling module that
   requires the bundled `manifest.json` + per-country `<CC>.json` (same
   require-by-number metro pattern; jest stub map like the one
   `stores/timetableAsset.ts` lines 2-4 names), verifies each `covered[].sha256`, and
   exposes covered/uncovered sets plus `generated_from_batch` for attribution.
3. **Keep the London chain shipping unchanged** (frozen 2026-2076 invariant,
   `SLIMMING.md` section 2): `getTimetableDay` keeps answering through the staged .bin
   for GB until a mosque-db bake replaces it; the loader treats London as one covered
   entry, not a special case, if the contract allows, otherwise as the documented
   exception.
4. **Build the location->timetable resolver behind the provider seam**: coordinate ->
   country -> covered bundle line serving within the one-minute longitude band
   (mosque-db `PLAN.md` section 9 clause 4e); tier-3 countries consult
   `<CC>-mosques.json` nearest-mosque; outside any band or in `uncovered[]` -> base
   engine, never a distant line (clause 4e). Add the prayer-time location input the
   app lacks today (expo-location exists only in `modules/qiblaheading/`,
   `package.json` line 56); leave `shared/prayer.ts` and the downstream readers
   untouched if `getTimetableDay(date)` keeps its signature.
5. **Name the base engine and the contract in docs**: read `manifest.uncovered[]` as
   the base-engine population (`tools/bake/README.md` lines 57-60 - the app owns the
   configs); advance `ai/features/moonsighting/` (RESEARCH-FINDINGS.md, IN PROGRESS)
   toward a runtime engine for uncovered countries; update the source-of-truth claims
   in `stores/timetable.ts` and `shared/timetableDecode.ts` headers and
   `AGENTS.md`/`README.md` to name the bake contract. Defer the recipe-compute ruling
   (mosque-db `EXPORTS.md` C5) - until ruled, the app consumes baked times only.

## The owed-commit shape

One commit carrying:

- the 13,961 working-tree changes already queued (13,956 deletions + 5
  modifications, measured 2026-11-14 via `git status --porcelain`), and
- these three carried groups (13 files under `scripts/build/`,
  `ai/plans/never-pushed-branches/`, `ai/plans/39-localisation/home-cldr-research/`).

Land the queue as the version-bump commit per worklist item 1, then commit the
carries (or carry them in the same commit if the session prefers one commit:
they are additions, not deletions, and touch none of the verified bake-chain
paths).
