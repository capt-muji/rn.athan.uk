# Plan: Session 50. Which patch actually fixed the compass: EXECUTED record

| Field | Value |
| --- | --- |
| Brief | `ai/plans/48-qibla-heading-accuracy/WHAT-FIXED-IT.md` |
| Planned at | `4cc397a0` (version 1.29.215), 2026-10-02 |
| Executed | 2026-10-02 (1.29.216 to 1.29.217); step 1 in `c0cf68a3`, merged `476522b7`; step 2 written from the device proof. Audited PASS (see `AUDIT.md`) |
| Device | OnePlus 3T on local production builds, plus the owner's iPhone XS for experiment D |
| Owner question that started the row | 🐋  "which one was the issue? That's the real question. Because I think one of these three patches actually fixed it." |

**Both steps DONE. The full step-by-step plan (pre-flight script, build-experiment.sh, break script,
per-step contracts) is in git history at this file's pre-compression state; what follows is the
executed record and the mechanics worth keeping.**

## 1. The question, and the rules it ran under

Four changes landed between the build the owner rejected (1.29.203) and the build he loves (1.29.205);
they were never tested apart. The row isolates each on his own hardware, outdoors, untethered
(session 49's rule: no heading reading taken over a cable is evidence about anywhere). It ships NO
feature and changes NO app behaviour: every experiment is a `node_modules` edit and a rebuild, and the
only committed code is a guard script.

Owner's rules in force, quoted from the plan:
- 🐋  "we want accuracy, 1000% accuracy, always, always, always accuracy. No. I don't care about
  smoothness anymore." (2026-10-01): accuracy judged FIRST, responsiveness second.
- 🐋  "This works absolutely perfectly. I love it. It's amazing... It's so clear, it's so smooth...
  both phones are pointing in the perfect direction." (2026-10-02): the verdict being decomposed.
- The standing rule (sessions 40/41): no invented constant, no tuned offset, no per-location
  calibration. Every experiment RESTORES a documented platform default `expo-location` itself shipped.
- Visuals settled: nothing visual is committed.

## 2. Decisions taken while planning (all seven held)

1. **B runs, judged pass/fail on whether a compass appears at all** (owner): its starvation is the
   finding, not a failure of the experiment.
2. **C runs as the control** (owner): confirmed on device rather than resting on the probe.
3. **All experiments outdoors, untethered, back to back in one trip** (owner).
4. **A FIFTH experiment, E, added for the calibration hint**: `git log 5e4882b7..62f66c21` shows two
   commits, not one (see `MEASURED.md` section 4).
5. **The valuable pair is C and E, not A and B**: reversing the row's own hypothesis, from the
   arithmetic bound in `MEASURED.md` section 1. A and B still run; the owner asked for A himself
   (🐋  "What if we dropped it back down to 5 Hz?").
6. **Order E, C, A, B, D**: the mechanism-bearing experiments first, while he is freshest.
7. **No experiment is ever committed**: all five are `node_modules`-style working-tree edits; the only
   committed code is step 1's guard.

## 3. The two mechanical facts the plan rested on

**`build-prod.zsh` does not build the working tree. It builds a git REF**, checked out into its own
worktree, and links only `node_modules` back to the main checkout. So A, B, D (all in `node_modules`)
reach the APK through the shared symlink, but **C and E edit app code the ref cannot see: built
naively they would produce an APK of unmodified code that looks correct and proves nothing.** The fix:
C and E went into a THROWAWAY ref made with `git commit-tree` (writes the commit object directly, runs
no hook (not `--no-verify`, which is forbidden); no commit lands on any branch, nothing merges). The
script asserted `git diff uat-2 $REF --name-only` counted exactly 1 before each build.

**The restore path, run before it was trusted.** `npx patch-package` alone CANNOT restore an
already-edited tree (refuses; `patch -R` fails the same way), found by executing the plan's own
script, and the sharpest planning finding. Working restore, measured end to end: replace the package
from yarn's cache, then `npx patch-package` (`expo-location@58.0.9 ✔`), then
`bash scripts/verify-expo-location-patch.sh`, which prints `PATCH AS SHIPPED`. The build script trapped its own
exit so no failure path could strand the tree. Details and the failure transcript:
`MEASURED.md` section 8.

## 4. What shipped

**Step 1, the patch guard** (`feat/50-patch-guard`, `c0cf68a3` 1.29.217, merged `476522b7`):
`scripts/verify-expo-location-patch.sh` + `shared/__tests__/expoLocationPatch.test.ts` +
one `biome.json` probes-exclusion line. Five checks (both `SENSOR_DELAY_GAME` registrations = 2,
`DEGREE_DELTA` absent, `kCLHeadingFilterNone` = 1, no `publication` block, no `local-maven-repo` (the
last two being session 49's prebuilt-AAR trap). 8 fixture-tree tests, red-before-green, 8 of 8 breaks
caught, reviewed clean in one round. It counts rather than tests presence (a half-restored tree with
one registration back is invisible to a presence check) and fails loudly on a missing file (`grep -c`
on a missing command reads as a real zero). `scripts/` is already `UNMEASURED` in the coverage gate, so
the `.sh` needs no entry.

**Step 2, the records**: `VERDICT.md` from the device proof, every number from a file under
`~/athan-device-sweep/session50/`, no number recalled.

**The device proof itself** (between the steps): five APKs built first, one at a time (shared
`node_modules`), installs over wireless adb, owner's verdicts taken outdoors in one sitting in the
order E, C, A, B, D, each with `dumpsys sensorservice` rate captured and four fixed questions asked
(appears? / Kaaba at 12 o'clock? / dial follows? / better-worse-same, accuracy before smoothness).
D was an Xcode Release build to the XS. Both phones restored to the shipped build before the session
ended; `auto_time` never changed. Full scripts and symptom tables are in git history.

## 5. What this file lost in compression, and where it lives

The 1,126-line plan (pre-flight bash, the full `build-experiment.sh`, the 8-break script, per-step
file lists, red-green commands, review checklists, symptom table, review-fix wordings, stopping-partway
table) is recoverable from git history of this file, and the operative lessons survived into
`MEASURED.md` and `LOG.md`: the ref-vs-tree trap (section 3), the restore path (section 3 and
`MEASURED.md` section 8), the guard's contract (section 4), the coverage-gate two-registrations and
working-tree rules (`MEASURED.md` section 9), and the wait-on-the-process-not-the-log lesson (`LOG.md`).
