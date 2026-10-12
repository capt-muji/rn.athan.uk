## Ticket 61

## Planning (2026-10-12)

- Owner away run: three disjoint tickets planned to READY (61, 62, 65).
- Facts gathered and anchors verified; draft and grill follow.
- Grill round 1 (6 findings, all applied): the suite exists since 2.0.24 and
  is extended not clobbered; the yarn validate coverage gate added with its
  section 10 row; the orphaned currentPrayerLabels import leaves with the
  function; the grep claim narrowed; eleven not ten; the cast dropped.
- Grill round 2 (3 findings, all applied): the appended block's duplicated
  imports removed (parse-level failure); the contract's Text lines pre-wrapped
  under Biome's 120 columns; layout-key and row-width anchors now checked by
  the step and the pre-flight.
- Ticket set READY, planned at uat 2670e596.

### Step 01 — done

- Branch: `code/61-1-measure-every-name` off `uat`. Pre-flight:
  `PREFLIGHT OK`. Anchor check: measurer-body, prayer-longest, test-banner,
  test-import, layout-key, row-width each count 1.
- Red: `Unable to find an element with text: Fajr` on both new tests (the
  first unmounted label's `getByText` query), `Tests: 2 failed, 4 passed, 6
  total`, the three existing describes green, exactly as the step predicts.
- Change: the component body rewritten to the contract (one Text per id over
  both id arrays, keyed by id, into the widen-only store; `styles.hidden`
  byte identical); `getLongestPrayerNameIndex` and the `currentPrayerLabels`
  import deleted from `shared/prayer.ts`; its banner, describe block and
  import entry deleted from `shared/__tests__/prayer.test.ts`; the suite's
  two imports added and the two new tests appended verbatim. The plan's
  green-run `--selectProjects=components,unit` form is rejected by this Jest
  (30): run space-separated `--selectProjects unit components`, both projects
  selected as the plan intends.
- Green: `Tests: 154 passed, 154 total` across the three named suites;
  `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0;
  `yarn validate` exit 0, `Tests: 5469 passed, 5469 total`, Statements 100%
  (5206/5206), Branches 100% (2242/2242), Functions 100% (1082/1082), Lines
  100% (4662/4662). The `getLongestPrayerNameIndex` grep over components/,
  shared/, app/, hooks/, stores/ returns nothing.
- Break: `ALL AS EXPECTED: 1`; after the break `git status --porcelain`
  listed only the step's four files.
- Version: 2.0.107 (origin fetched under the version lock, uat and
  origin/uat both at 2.0.106; app.json, package.json and
  android/app/build.gradle versionName all set, app.json first).
- Commit: `cc35c44d` (2.0.107), hook green: `Tests: 5469 passed, 5469 total`;
  Statements 100% (5206/5206), Branches 100% (2242/2242), Functions 100%
  (1082/1082), Lines 100% (4662/4662).
- Review: read `git show cc35c44d` cold. One Text per id on both lists keyed
  by id; `stores/ui.ts` absent from the diff, so widen-only is untouched;
  `styles.hidden` byte identical (absent from the diff);
  `getLongestPrayerNameIndex` gone repo-wide by the plan's grep;
  `currentPrayerLabels` still live through `prayerLabel`. No lifecycle,
  thread, residue or rule finding. Clean, no fixes needed.
- Merge: `24925e0d` into uat (--no-ff), branch `code/61-1-measure-every-name`
  deleted after the merge.

session: ses_ecef23781ffe19Ux37GD9000la
