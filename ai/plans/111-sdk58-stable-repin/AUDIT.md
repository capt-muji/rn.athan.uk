# AUDIT 111

The plan's audit phase belongs to an EXECUTED ticket; ticket 111 is not EXECUTED (steps 3 to 5
are outstanding and the row is NEEDS REPLAN). This record covers the one range the ticket has
landed, steps 1 and 2, `git diff bc9699d3^1..5966e95b -- . ':(exclude)ai/plans'` written to
`$TMPDIR/audit-111.diff`, because that range is final for the pin set it names: step 3 and step
4 commit nothing unless they find a fixable defect, and step 5 is docs.

Three read-only reviewers ran over it at uat, as the lead skill's section 3 describes: a
plan-conformance pass (the plan plus the diff), a blind pass (the diff only), and a third blind
pass focused on threading, lifecycle and the notification plumbing. Every finding below is
adjudicated from the code, not from the reviewer's word.

## Pass 1: plan-conformance

1. [should] `ai/plans/111-sdk58-stable-repin/scripts/anchors-check.sh:22` read the three patch
   files step 1 deleted (a2, a3, a4) and the pre-re-pin bytes of the others, so the script now
   exits 1 with nine `DRIFT` lines, and `scripts/preflight-111.sh:30` calls it, hard-stopping
   the ticket's own pre-flight.
   **CONFIRMED** by running it (`DRIFT a4 ... count=`, `DRIFT a5 ... count=0`, `DRIFT a7 ...
   count=0`, exit 1). **Verdict: carried to the replan.** The anchors were consumed at step 1
   by design and the replan rewrites both scripts; editing a plan folder that is about to be
   replanned buys nothing. The replan must drop the anchors call from the pre-flight.
2. [should] `LOG.md:71` - the re-pin commit `addc75bb` is subject-labelled 2.0.861 while its
   tree carries 2.0.863, and the merge `bc9699d3` carries the same 2.0.863 as its parent
   `840aa613`, so the re-pin's merge changes no version and `wasAppUpgraded()` cannot see it.
   **CONFIRMED** from git: `git show addc75bb:package.json` prints 2.0.863, `bc9699d3^1` prints
   2.0.863, and the next commit `8878bd69` prints 2.0.865. **Verdict: rejected as a fix.** The
   lane-weather resolution that produced it is recorded in the ledger, 2.0.863 was never a
   shipped build, and the very next commit restored monotonicity; the only repair the reviewer
   proposes is a retroactive bump, and rewriting merged history is forbidden. The silent-upgrade
   class is already guarded by `shared/__tests__/versionLockstep.test.ts`.
3. [nice] `shared/__tests__/widgetOpenAppPatch.test.ts:3` - the docstring names
   `patches/expo-widgets+58.0.3.patch`, stale through two renames.
   **CONFIRMED** (`grep -n "expo-widgets+"` shows line 3 naming +58.0.3 while the tree carries
   +58.0.19, and lines 26 and 37 build the name from the installed version). **Verdict: FIXED.**
   The version leaves the docstring, because the replan rebuilds the patch at yet another
   version and a version-bearing name goes stale again.
4. [nice] `steps/1-repin.md:33` - the step's Files list omits
   `scripts/verify-expo-location-patch.sh`, which its commit changes.
   **CONFIRMED** (`git show --stat addc75bb` lists the script). **Verdict: carried to the
   replan**; the step file is rewritten there.
5. [nice] `biome.json:2` - the `$schema` URL still names 2.5.14 after the 2.5.15 bump, so
   `biome check . --error-on-warnings` prints the migrate info the ledger records.
   **CONFIRMED** (`grep -n schema biome.json`). **Verdict: FIXED.** One string, no behaviour,
   and the replan does not touch this file.

## Pass 2: blind

Its own checks are worth recording: every one of the 68 declared pins has an exact lock key,
all 1986 dependency references in the lock resolve, each renamed patch reverse-applies and
re-applies against the installed `node_modules` with every `index <pre>..<post>` blob hash
matching both images, `scripts/verify-expo-location-patch.sh` prints `PATCH AS SHIPPED`,
`npx tsc --noEmit` exits 0, the widget runtime load suite and the rest of the install-time
suites are green, `enableRemoteNotifications: false` is a real option that reaches the
resolved prebuild config, and `strokeBorder`'s `content` reaches native byte-identically
through `resolveShapeStyle`, so no pixel moves.

1. [should] `package.json:55` - `expo-location` moved from an exact pin to `~58.0.16` while
   the patch is named for the installed version, and patch-package applies a mismatched patch
   anyway, warning only.
   **CONFIRMED**: the pre-re-pin pin was exact (`git show bc9699d3^1:package.json` prints
   `"expo-location": "58.0.12"`), the plan's own table loosened it to `~58.0.16`, and the
   repo's version-name guard covers expo-widgets alone. The plan is wrong here: A7's contract
   ("three ✔ and nothing else on a clean install") is exactly what a tilde endangers once the
   lock is regenerated, since expo-location 58.0.17 exists on npm today.
   **Verdict: FIXED**, conservatively and by ruling. The pin is exact `58.0.16` again, the
   lock descriptor is `expo-location@58.0.16:`, and a fresh `yarn install` re-proved A7 by
   printing exactly three ✔ lines and nothing else. `expo-background-task` keeps its
   pre-existing `~58.0.11`; tightening it is the replan's call, because it rebuilds the patch.
2. [nice] `shared/__tests__/widgetOpenAppPatch.test.ts:3` - same as pass 1 finding 3.
   **Verdict: FIXED once**, recorded there.
3. [nice] `addc75bb`'s subject claims 2.0.861 while its tree carries 2.0.863 - same as pass 1
   finding 2. **Verdict: rejected as a fix**, recorded there.

## Pass 3: threading and lifecycle

Its checks: all three patches byte-exactly applied (`git apply --check -R` clean on each), the
background-task option plumbing traced from `registerTaskAsync` to the single constraint site
with the patched Kotlin proven compiled by `javap`, the location patch's `SENSOR_DELAY_GAME`
and `kCLHeadingFilterNone` present in the installed source and the release bytecode, the
widgets `openApp` chain consistent with the `@OptimizedComposeProps` reader, and
`enableRemoteNotifications: false` gating only the `aps-environment` entitlement with no code
path anywhere reaching APNs. `stores/__tests__/notifications.test.ts` 148 passed, the widget,
qibla and patch suites green. No must-fix.

1. [should] `scripts/verify-expo-location-patch.sh:67` - the `local-maven-repo` check tests
   `$PKG/android/local-maven-repo`, which the shipped package does not have (the repo sits at
   `node_modules/expo-location/local-maven-repo`), so the check always prints "absent", and
   `shared/__tests__/expoLocationPatch.test.ts` proves it only against a synthetic tree that
   puts the repo under `android/`. **CONFIRMED** by both paths above.
   **Verdict: carried to the replan.** Pre-existing rather than introduced here, and deleting a
   check together with its test case wants a step with its own red and break discipline; the
   `publication` grep above it is the switch that actually guards the patched Kotlin.
2. [nice] `patches/expo-background-task+58.0.11.patch` installs `didRegisterTaskForTesting`,
   which nothing calls. **Verdict: carried to the replan**, which rebuilds the patch against a
   new version and can drop it there.
3. [nice] `patches/expo-location+58.0.16.patch` installs `mLastAzimuth`, write-only since the
   gate's removal. **Verdict: carried to the replan**, same reason.
4. [nice] `shared/__tests__/widgetOpenAppPatch.test.ts:3` - same as pass 1 finding 3.
   **Verdict: FIXED once**, recorded there.
5. [nice] `stores/notifications.ts:1919` - the offline-refresh option is read by no test, so a
   patch that stops carrying it is caught at install time only. **Verdict: carried to the
   replan**, whose patch rebuild is where that guard belongs.

## Close

Seven findings are adjudicated above, four fixed and three carried with their reasons. The
audit's PASS step (DONE, and the plan folder's deletion) is not due: the ticket is not
EXECUTED, its row stands at NEEDS REPLAN, and the replan re-measures the pin set, rebuilds all
three patches and re-runs the device proofs before any of that happens.

