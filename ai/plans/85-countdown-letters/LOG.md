# LOG — ticket 85

## Ticket 85

## Planning (2026-10-15)

Frontier closed live with the owner across the session: the lettered design in
every language, the old zero-drop behaviour git-verified (`fb42c372` era and
`194ed701`), letters at 55 percent and ink 0.4 tuned on the XS, inline baseline
spans, the 2 point gap span, no final device read, the colon-machinery sweep.
Full table in PLAN.md section 2.1.

Draft complete: PLAN.md, steps 1 and 2, handed component and suite, preflight,
anchors a1 to a8 all counted 1 at `f70eaf8e` (2.0.730).

The grill (2026-10-15) returned five blockers and five refinements; all ten
accepted and applied: the tree-restore step 0, the overlay test rewritten onto
`openOverlay`/`closeOverlay` (the derived atom is read-only), the handed suite
Biome-formatted, the `splitSingleColon` JSDoc reword joins the sweep, the dead
`COLORS` import leaves the constants test, R1.5 drops the size claim, the design
invariant names the enumerated instants, the ago helper renamed, the LOG
contract aligned, the queue cell reworded at READY.

Proofs (2026-10-15, planner, scratch worktree at `f70eaf8e` plus main tree):

- Red: the handed suite against uat's component fails 13 of 16, the first
  failure `Unable to find an element with text: 2 H`; the three carrier tests
  pass. Worktree removed after.
- Green: the handed component and suite in the main tree pass 16 of 16;
  `npx tsc --noEmit` clean; Biome clean.
- Coverage: the full components project aggregates `components/countdown/Countdown.tsx`
  to 100 percent on statements, branches, functions and lines (the module-level
  `ty.wordFace` ternary closes under the ar-loaded module of other suites, as on
  uat).
- The hook's four `100%` lines are the executor's authoritative gate at commit.

Resume from: planning finish (queue READY, docs commit, merge, push).


The planning commit's first hook run (2026-10-15) failed three gates and taught
the atomicity the plan now carries: the lettered tree alone makes the two colon
allowlist entries stale (directionalStyleGate), makes `splitColonSections`
test-only-reachable (unusedExports), and the local gradle file had drifted out
of lockstep (fixed to equal app.json, 2.0.731). The two steps merged into one
atomic step; the working tree restored to uat, the implementation and suite
living in the handed files.

Resume from: the planning docs commit, merge, push; then the executor dispatch.

### Step 00 — done (2026-10-15)

Tree restored per plan section 6: on `uat` (f2c78b17, equals `origin/uat`), working
tree clean, `git restore components/countdown/Countdown.tsx opencode.json` a no-op,
branch `85-countdown-letters` verified to carry no commits beyond `uat` then deleted.
`scripts/preflight-85.sh` copied to `$TMPDIR` and run: `PREFLIGHT OK` (all eight
anchor counts 1, version floor 2.0.732 above 2.0.730).

session: ses_ec225d674ffepfxk8RRRx8jJKN

### Step 01 — executing (2026-10-15)

Branch `85/lettered-countdown` off `uat`. Red: the handed suite against uat's colon
component fails 13 of 16, the three carriers passing (the held `--:--` display, the
bar pair, the renders-nothing guard); first failure `Unable to find an element with
text: 2 h`. Each failing test's first line, in suite order: `2 h` (Asr at 2h29m),
`2 h` (under ar), `42 m`, `1 h` (whole hour, seconds hidden), `1 h` (then `5 s`
expected), `45 s`, `9 m`, `0 s`, `5 s` (seconds preference on over ten minutes),
`2 h` (letter ink and size), gap span `Expected length: 2 / Received length: 0`,
`5 h` (overlay on Magrib), `10 s` (overlay before a list). Full red log at
`~/athan-gitree/sessions/85-red.log`.

Change: `handed/Countdown.tsx.txt` and `handed/Countdown.test.tsx.txt` copied over
their paths byte for byte; the sweep deleted `splitColonSections`, `CountdownSection`,
`ALL_DIGITS`, `ALL_ZEROS` with their docs and tests, the `dimDigit` and `colon` keys,
the `COLORS` import entry, the two allowlist entries; `splitSingleColon`'s JSDoc
reworded; the track pin moved to the literal `'rgba(160, 200, 255, 0.08)'`; queue row
set `IN PROGRESS, step 1 (2026-10-15)`.

Green: the named suite 16/16; full jest 214 suites, 5643 tests, all passed;
`tsc --noEmit` exit 0; `biome check . --error-on-warnings` clean; the production
grep (six symbols, seven dirs) prints nothing.

Breaks: `break-1.sh` first run printed `BREAK NOT APPLIED: component left modified`
after both mutations were caught and the file restored. Cause: the script's final
`git diff --quiet` compares the worktree against the index, and the step's own
ordering runs breaks before the commit, so the lettered component was necessarily
unstaged-modified. The mutations themselves were caught each time (`1H alone`
failing in both suite runs) and the component matched the handed file byte for byte
after the restore. Resolution: the step's eight files were staged (the commit adds
them by name regardless), the script re-run: `ALL ASPECTED: 1`. `break-2.sh`:
tsc rejected the scratch import with `has no exported member 'splitColonSections'`,
the grep still prints nothing, `ALL ASPECTED: 1`.

Version: lock held (no waits), `origin` fetched, 2.0.733 set in `app.json`,
`package.json` and `android/app/build.gradle` together.

session: ses_ec225d674ffepfxk8RRRx8jJKN
