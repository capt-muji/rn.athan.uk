# LOG 74

## Planning (2026-10-13)

## Ticket 74

Planned on lane/74 off uat line `cfb9b837` (2.0.201). The owner is away; her 2026-10-13 RTL-test
rulings are the brief. Facts measured at plan time: the token layer (`shared/constants.ts:292-323`),
the two Roboto faces' metrics, the candidate Noto Sans Arabic v2.013 metrics and digests, today's
fallback face for the record, the relaunch path (`stores/language.ts:77-89`), the per-locale width
keys (`stores/ui.ts:113-131`). Decisions D74.1 to D74.8 in PLAN.md section 2.

Grill round one found 16 defects (9 must, 4 should, 3 nice); all applied — the jest project name,
the preflight Needs-first check, two inventory weights (Qibla action, Update cancelText), the
Countdown.text unset-family contract via `ty.arabic`, the guard exception for D74.6 styles, the
D74.3 seven-site enumeration, R1.8/R1.9 as live-resolution clauses, the red-build sha and red-en
baseline in step 3, the 1.142 rounding rule, the 25-file counts, the FONT-MEASUREMENTS.md
survival line, preflight copy-out paths, the uat-tip wording, per-file sxHeight.

Grill round two found 7 (2 must, 5 should); all applied — the preflight expected-drift argument
schedule (this plan's own merges drift anchors 04 and 05-10 on a known schedule), the
unused-exports gate allow-list entry that step 2 removes, the Countdown ternary source
assertion and its break target, the 10-to-12 first-failure line, the RNTL-inside-isolateModules
sentence, the R1.2-to-digests tie, step 1's drift clause.

Gate `PLAN OK` after both rounds.

### Step 1 — executed on lane/74, commit pending merge

Ran in the dedicated lane worktree (dispatch, 2026-10-13): branch `lane/74`, branched from the
pre-merge uat line at `cfb9b837` (2.0.201) plus this plan's own READY docs commit `7ac7e8ff`
(2.0.203) — that tip is the red-build sha step 3 builds from. Steps 2 and 3 dispatch separately;
the lead merges; nothing pushed.

Preflight `bash "$TMPDIR/preflight-74.sh" 09` printed `PREFLIGHT FAILED` with exactly the two
lane-setup deviations, both consequences of the dispatch's own setup and recorded verbatim:

1. checkout is on 'lane/74', expected uat
2. queue row 72 status is 'READY 2026-10-13', expected DONE (Needs first)

Row 72 is mid-flight on the main checkout's own lane (`feat/72-reminder-copy`, 2.0.207-2.0.211
local, unpushed); all ten anchors passed, 09 included (row 72's countdown rewrite has not landed
on this lane's line, so it still counts 1). Step 1 touches no row-72 file; the drift schedule
for steps 2 and 3 is unchanged.

Red first: `shared/__tests__/typography.test.ts` written against the not-yet-existing module;
`npx jest shared/__tests__/typography.test.ts --watchman=false --selectProjects=unit` failed
with the expected import resolution error, verbatim: `Configuration error: Could not locate
module @/shared/typography mapped as: $HOME/athan-gitree/lanes/74/$1` (typography.test.ts:9,
jest-resolve createNoMappedModuleFoundError). No other suite ran.

Fonts: downloaded from the pinned release URL in `$TMPDIR`, digests verified, then copied into
`assets/fonts/` and re-verified byte-exact in place:

- Regular `bdff3e5659d67e67def05b33f749683b9376ae819d65d3dd62ac4640b3aaef48` (pin matches)
- Medium `5aaa32f0fe7fdd828342aea06a3c645edb51bcea2620af68b4c385a3b9fb0c42` (pin matches)
- OFL.txt `a7a5a25eb188bf1cd96982030d53e23c33485c69b1044a562254226857ee13af` (pin matches)

Green: `yarn validate` exit 0; `Tests: 2 skipped, 5502 passed, 5504 total`; coverage
Statements/Branches/Functions/Lines all `100%`. One executor-side fix between red and green: the
live-resolution tests first held the required module in an optional typed holder and tsc flagged
`possibly undefined`; switched to local consts inside the `isolateModules` callback (house style,
per flags.test.ts). Biome's organizeImports safe fix applied to the test's import line. The
jotai "multiple instances" console.warn inside `isolateModules` is inherent to the plan's
live-resolution pattern and not a failure.

Mutation pass (R1.10), each revert verified before the next:

1. `ARABIC_SIZE_FACTOR` to 1.0: first failure `Expected: 12, Received: 10` — the table's first
   assertion, the 10-to-12 mapping line. Reverted.
2. ar `familyMedium` to `'NotoSansArabic-Bold'`: first failure `Expected:
   "NotoSansArabic-Medium", Received: "NotoSansArabic-Bold"` — the family assertion. Reverted.
3. `typographyFor` returns `ARABIC` for `'ms'`: first failure `Expected: "Roboto-Regular",
   Received: "NotoSansArabic-Regular"` — the ms identity assertion. Reverted.

Version: next free patch taken from the MAIN checkout's log per the dispatch — its working tree
sits at 2.0.211 (verified, past the 2.0.210 floor the dispatch named), so this step takes
2.0.212 in `package.json` and `app.json`. No `android/app/build.gradle` exists in this lane
(android/ is a prebuild output, gitignored); the lockstep test checks versionName only when a
prebuild is present, so there was nothing to set on disk.

app.json diff is exactly the version line and the two Noto entries after the two Roboto entries.
A first python json round-trip reformatted the whole file; reverted and re-applied both edits
surgically so the diff stays minimal. No component file changed in this step. The
unused-exports allow-list entry `typographyFor` names step 2 as the consumer that removes it;
the module docblock cites FONT-MEASUREMENTS.md by path, one line.

commit: this commit, 2.0.212, on `lane/74` (the lead reads the sha at merge)

session: ses_ecab0d857ffebRp3ZUP8kxPA2i

### Step 2 — executed on lane/74, commit pending merge

Lane continuation (dispatch, 2026-10-13): merged the main checkout's uat (650570b8, 2.0.211) into
lane/74 before the step — merge commit f23def0d; conflicts confined to the two version lines,
resolved in favour of the highest (this lane's 2.0.212). Row 72's landed Countdown.tsx and
Ago.tsx carry every inventory style key unchanged (`text`, `countdown`, and the new
`countdownColon` untouched; `prayerAgo`), so no inventory row drifted — the sweep base is row
72's merged code as the dispatch required.

Preflight: the step dictates `preflight-74.sh 04 09`, but the script matches full anchor
basenames against the argument list, so the invocation that actually expresses the expected-drift
list is `preflight-74.sh 04-appjson-fonts 09-countdown-styles`. It printed the two
lane-expectation deviations, recorded verbatim (same class as step 1):

1. checkout is on 'lane/74', expected uat
2. queue row 72 status is 'IN PROGRESS, step 3, 2026-10-13', expected DONE (Needs first)

(row 72's device step is still pending on the main checkout's lane; its code is final on uat per
the dispatch.) Anchor 04 drifted as this plan's own schedule expects (note, not a failure);
anchor 09 counts exactly 1 — the planner re-pinned it against row 72's landed countdown form in
the READY docs commit 7ac7e8ff, so it is not drifted and naming it costs nothing.

Red first: components/__tests__/typographySweep.test.tsx written before the sweep. First run: 28
failed, 3 passed. The 25 guard rows fail (first verbatim: `the sweep guard › resolves
ui/Error.tsx through the locale typography map`, `Expected substring: "import { typographyFor }
from '@/shared/typography';"`) and the Countdown source assertion fails; both ar probes fail with
`Expected: "NotoSansArabic-Medium", Received: "Roboto-Medium"`; both en probes and the ar-branch
coverage evaluation pass — exactly the plan's prediction.

Two probe-harness defects found and fixed while reaching red (test-only; no contract changed):

1. RNTL registers its cleanup jest hooks at import time, so requiring it mid-test is a
   jest-circus error ("Hooks cannot be defined inside tests"); fixed with
   `process.env.RNTL_SKIP_AUTO_CLEANUP = 'true'` at file scope — the per-case fresh registries
   leave the auto cleanup nothing stale to unmount.
2. RNTL's `render` is async and publishes `screen` only after its act settles; awaiting it inside
   `jest.isolateModulesAsync`, and reading `rntl.screen` live instead of destructuring the
   getter's pre-render snapshot, is what makes the probes deterministic. The unawaited render was
   also the cause of an invalid-hook crash across registries.

Sweep: all 25 inventory files convert their listed styles to the consumer form (`const ty =
typographyFor(currentLocaleId());` beside StyleSheet.create; families through `ty.familyMedium` /
`ty.familyRegular`; sizes, line heights and letter spacings through the map with the pre-change
tokens as arguments). QiblaCompass converts the dial Text's family only (fontSize stays
`radius * FACE.cardinalSize`); its `TEXT` import dies with the conversion, the dial family being
its only use. Countdown.text gains the exact `ty.arabic ? ty.familyRegular : undefined`
expression. Help titleBadgeGlyph, Help chevron and stepMark, Settings chevron, ColorPicker
chevron stay byte-identical (D74.6). The `typographyFor` allow-list entry is removed from
shared/__tests__/unusedExports.test.ts; the 25 consumers landed in this same commit.

Green: `npx jest components/__tests__/typographySweep.test.tsx --watchman=false
--selectProjects=components` 31/31; `yarn validate` exit 0; `Tests: 2 skipped, 5543 passed, 5545
total`; coverage Statements/Branches/Functions/Lines all `100%`. The Countdown.text ternary's ar
branch executes only when its module evaluates under ar, so the sweep suite evaluates Countdown
under ar once (its en branch is covered by every existing import).

Mutation pass (R2.7 with R1.10), each revert verified before the next:

1. Header title family back to raw TEXT.family: the guard names the file — `the sweep guard ›
   resolves sheets/parts/Header.tsx through the locale typography map`, `Expected: 0` raw
   references. Reverted.
2. Countdown ternary flattened to a bare `ty.familyRegular`: the source assertion fails —
   `Expected substring: "ty.arabic ? ty.familyRegular : undefined"`. Reverted.
3. Help question `ty.size(15)` back to the raw 15: the ar probe fails on the fontSize —
   `Expected: 17, Received: 15`. Reverted.
4. ARABIC_SIZE_FACTOR to 1.0: the step-1 table fails (`Expected: 12`) and the ar probe fails at
   the same time. Reverted.

(A first break run reverted its mutation targets with `git checkout --`, which on uncommitted
sweep work destroyed the sweep in the three touched files; repaired by resetting the step's files
and re-applying the sweep script, then re-running the pass with copy-restore reverts and a
byte-identity check. The repaired run's outputs are the recorded ones.)

Version: uat's package.json is 2.0.211 (650570b8) and this lane carries 2.0.212 (step 1); the
highest plus one is 2.0.213, set in package.json and app.json under the version lock. No
android/app/build.gradle exists in this lane (android/ is a gitignored prebuild output), so there
was nothing to set on disk; versionLockstep passes.

commit: this commit, 2.0.213, on `lane/74` (the lead reads the sha at merge)

session: ses_ecaa426a0ffeLwFMaBCiNb8Teu

### Step 3 — pending

The device proof ran as live owner reads on the iPhone XS rather than a separate capture pass; the verdicts below are the acceptance record.

Owner verdict on the device read (2026-10-13, live): the weight fix stands ("definitely heavier, whatever you did for that one worked"), English unchanged, nothing clipped - and the 1.15 size factor is REJECTED as oversize ("everything way too big, ruined the whole design; reduce it back to what it was"). Ruled: the factor returns to 1 (sizes as before; the family and weight carry the improvement); her final parity number is pending the discussion she asked for. The time-ago badge overlap she saw was the factor push-down and goes with it.

session: ses_ecca54b79ffeEOa1A5fYvCMQl0

### Size-factor revert — executed

Red first: the sweep's two ar probes failed against the reverting module (`Expected: 25, Received: 22`; `Expected: 17, Received: 15`); the revert commit carried no version bump.

Green (audit fix): `yarn validate` exit 0, coverage 100%; `package.json` and `app.json` bumped to 2.0.216 together.

session: ses_ec9a31fe8ffei1Mun9HGvtBeAJ
