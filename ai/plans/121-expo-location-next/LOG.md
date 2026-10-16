# LOG.md - ticket 121

## Planning (2026-10-16)

Frontier worked agent-ruled per the standing hands-off order; decisions D121.1 to D121.9 in
PLAN.md section 2. Facts measured directly from the installed `expo-location` 58.0.16 source tree,
the published `Location (next)` documentation page, the package changelog, the npm registry and the
upstream pull request's API record; the app's own location and heading surface read in full.

## Ticket 121

Planning skeleton landed with the draft; the grill, the gate and READY follow.

DRAFT (2026-10-16): the plan drafted - three docs steps, sixteen anchors extracted from the
installed tree and verified at `ef0b09b2` (2.0.898) by `scripts/build-anchors.sh` (all sixteen
counting 1), the pre-flight script written, and FINDINGS sections 1 to 8 drafted to land with the
READY commit.

Anchor extraction (2026-10-16): `bash ai/plans/121-expo-location-next/scripts/build-anchors.sh`
printed, one line per anchor, its source, its line count and its count; every count 1, every line
count inside the 3-to-15 band.

Grill round 1 (2026-10-16, dispatched cold as `athan-plan-griller`): sixteen findings, every one
reproduced by the grill itself and every one applied before the READY commit. The must was the
pre-flight's `/next` presence test, which asked for a nested `src/next/package.json` that does not
exist (the subpackage is an `exports` entry), so no branch could ever have printed `PREFLIGHT OK`;
it now tests the directory. The shoulds: the two script paths written as bare `scripts/...` where
they live under the plan folder, the missing statement of when the pre-flight runs, R2.1's command
narrowed to the import grep (the wider grep prints 13 lines, now classified), 58.0.15's TSDoc entry
added to the changelog table, "three hunks" corrected to six hunks in three files, `Types (13)`
corrected to 14, the `hasLocationServicesEnabled` platform parenthetical moved to
`enableLocationServices`, the classic docs page's two line numbers corrected to 424 and 698, the
native-manifest cite widened to `:17-38` with the anchor described for what it carries, the
`qibla-sheet-branch` anchor re-extracted as 252-266 so the classic branch is inside it, both JS
anchors re-scoped to what they carry, the ask-first sentence attributed to the row's own constraint
rather than to a rule `ai/AGENTS.md` does not hold, and the two generated native files' reading
attributed to the plugin's default at a named main-tree commit rather than to the planned sha. The
nices: the `ai/AGENTS.md` cite corrected to 157-160 and the upstream PR's title quoted with its
`[location] ` prefix.

READY (2026-10-16): `bash scripts/check-plan.sh ai/plans/121-expo-location-next` printed `PLAN OK`.
Commit `efff4dd1` (2.0.901, branch `docs/121-plan-ready` off `lane/121`), hook `Tests: 2 skipped,
5706 passed, 5708 total`, coverage 100 percent on statements, branches, functions and lines; merged
`--no-ff` into `uat` as `092a98ff`. `lane/121` fast-forwarded to the commit. Pre-flight ran on
`lane/121` on a clean tree: `PREFLIGHT OK`.

### Step 1 — DONE (the /next surface at 58.0.16)

Branch `docs/121-1-next-surface` off `lane/121` at `efff4dd1` (2.0.901), pre-flight run on
`lane/121` before the branch: `PREFLIGHT OK`. Verification battery
`ai/plans/121-expo-location-next/scripts/verify-claims.sh`, output
`$HOME/athan-gitree/sessions/121/claims-step1.out` (273 lines, exit 0). Every criterion's value
reproduced:

- R1.1: `expo-location` 58.0.16, `package.json` pins `58.0.16`; `src/next/index.ts:1-33`,
  `Location.ts:1-17` and `js/index.ts:1-29` read as FINDINGS section 1.2 records.
- R1.2: `grep -rn "heading\|Heading" src/next/js | wc -l` printed `0`; over `src/next` it printed
  `5`, all at `types/Position.types.ts:91, 92, 142, 144, 149`.
- R1.3: the same grep over the two `/next` native trees printed `13`, nine at
  `LocationRecords.kt:156, 161, 169, 173, 206, 210, 238, 275, 288` and four at
  `Position.swift:13, 14, 37, 38`.
- R1.4: `Position.types.ts:137-149` quoted; `Position.swift:37` carries `heading: course >= 0 ?
  course : nil`; `LocationRecords.kt:275` carries `heading = if (hasBearing())`.
- R1.5: the published `Location (next)` page fetched through the documentation server's
  `fetch_url` on 2026-10-16: 1376 lines, 0 `compass` hits, 4 `heading` hits at lines 1080, 1081,
  1091 and 1092, all the `Position` table and its example.
- R1.6: the changelog's `/next` entries, 58.0.10 (#49988, #49992), 58.0.12 (#51067), 58.0.13
  (#49849, #50262, #49972, #50263, #50198), 58.0.14 (#50876, #51326, #51325 three, #49995), 58.0.15
  (#51231) and 58.0.16 (#51220-class service interface, #51320); none names heading.
- R1.7: `Permissions.types.ts:49-62`, `TemporaryFullAccuracyRequester.swift:19`
  (`requestTemporaryFullAccuracyAuthorization(withPurposeKey:)`) and
  `TemporaryFullAccuracyPlistKeys.swift:4` (`NSLocationTemporaryUsageDescriptionDictionary`); the
  plugin default at `withLocation.ts:272-276`; the main tree at `092a98ff` 2.0.901 carries the key at
  `ios/Athan/Info.plist:79-83` and `app.json` carries zero `expo-location` entries.

Plan repair recorded here: `scripts/verify-claims.sh` is added to the Files lines of steps 1 to 3
in PLAN.md section 6, because the plan's step Files lines named only files the step changes and the
claim battery is the step's evidence generator. Commit and merge shas are recorded in step 2's
entry, which is this ledger's convention.

session: ses_eba28a6b2ffe7uxiUDK37TNMie

### Step 2 — DONE (the app mapping and the heading answer)

Branch `docs/121-2-app-mapping` off `lane/121` at `5c48b0d3` (2.0.902). Step 1's commit
`5c48b0d3` (2.0.902, hook `Tests: 2 skipped, 5706 passed, 5708 total`, coverage 100 percent on all
four measures) merged `--no-ff` into `uat` as `a0cfb70c`; `lane/121` fast-forwarded to `5c48b0d3`.
The claim battery re-run, output `$HOME/athan-gitree/sessions/121/claims-step2.out` (exit 0):

- R2.1: `git grep -n "^import .*expo-location" -- '*.ts' '*.tsx'` printed exactly
  `device/__tests__/qibla.test.ts:5` and `device/qibla.ts:1`; the wider
  `git grep -n "expo-location" -- '*.ts' '*.tsx'` printed 13 lines, classified in FINDINGS
  section 3 (two imports, two comment mentions, the suite's mock line, eight guard path strings).
- R2.2: `device/qibla.ts` is 92 lines and makes exactly six classic calls, at lines 20, 24, 54, 55,
  69 and 89; the mapping table in FINDINGS section 3 carries each one's `/next` equivalent, and
  `reverseGeocodeAsync` and `watchHeadingAsync` are the two with none.
- R2.3: `hooks/useQibla.ts:249-266` read; the fused branch calls `watchFusedHeading` and the else
  branch calls `watchHeading` beside `watchHeadingAccuracy`; `modules/qiblaheading/index.ts:1-9` and
  `shared/qiblaSettle.ts:32-39` read as quoted.
- R3.2: the patch's six hunks re-enumerated by file and patch line, `scripts/verify-expo-location-patch.sh`
  printed `PATCH AS SHIPPED`, and the upstream record re-read; the pull request's state re-measured
  the same day through the GitHub API and unchanged (`open`, one bot comment, last updated
  2026-10-09T11:43:19Z, label `contributor: external`). FINDINGS section 2 now says six hunks in
  three files with each hunk's patch line, and records the second measurement.

Records wording fixed in this step: the hunk sentence in FINDINGS section 2 named the wrong patch
lines for the emission gate and the constant; both now read from the patch itself.

session: ses_eba28a6b2ffe7uxiUDK37TNMie

### Step 3 — DONE (the migration cost and the ruling pack)

Branch `docs/121-3-ruling-pack` off `lane/121` at `f0369c60` (2.0.903). Step 2's commit
`f0369c60` (2.0.903, hook `Tests: 2 skipped, 5706 passed, 5708 total`, coverage 100 percent on all
four measures) merged `--no-ff` into `uat` as `6e2dde16`; `lane/121` fast-forwarded to `f0369c60`.
The claim battery's third run stands on the same output as step 2 (no source moved); FINDINGS
sections 4 to 8 finalised:

- R3.1: FINDINGS section 2 enumerates the patch's six hunks by file and patch line and records the
  pull request's state, label and both measurement times.
- R4.1: FINDINGS section 5 carries three options (A partial adoption, B recommended, C wholesale)
  with one line of measured ground rejecting A and C, and the recommendation's challenge, surviving
  answer and flip-check.
- R4.2: the C1 to C5 compass matrix, experiments E1 to E5 with their waiting conditions, and
  unverified claims U1 to U6 each with the experiment that settles it.
- R4.3: the queue row is set EXECUTED with the surface's shape, the heading answer, the mapping's
  two gaps, the migration cost, the recommendation, the matrix and both lists.

Nothing outside `ai/plans/`, the queue row and the two tracked version files changed in this row.

session: ses_eba28a6b2ffe7uxiUDK37TNMie
