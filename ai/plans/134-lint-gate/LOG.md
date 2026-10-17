# Lane 134 log: widgets-off Android release builds fail their own lint gate

## Ticket 134 (2026-10-17)

Lane worktree `$HOME/athan-gitree/worktrees/lane-134` off `80f707d5` (2.0.1002).
Scratch proof worktree `$HOME/athan-gitree/worktrees/plan-134` (detached at
`80f707d5`, never committed, removed at planning's end).

## Planning (2026-10-17)

- Evidence read: `ai/AGENTS.md`, the ticket row, `app.config.ts`,
  `plugins/androidLocaleConfig.js`, `shared/__tests__/config.test.ts`,
  `shared/__tests__/flags.test.ts`, `shared/__tests__/nativeLocalesConfig.test.ts`,
  the failed fleettest logs (`gradle.log`: `:app:lintVitalRelease FAILED`, 150
  ExtraTranslation errors, 30 unique keys; `gradle-rerun.log`: the owner's
  lint-excluded passing rerun; `prebuild.log`: env exports only
  EXPO_PUBLIC_ANDROID_PACKAGE and EXPO_PUBLIC_IOS_APP_ID).
- The 131-era contradiction re-derived from git history: lane 131's LOG
  (`393fdcfb`) records the ca73f5a9 scratch build's FIRST gradle run failing
  lintVitalRelease identically; the passing second run followed re-adding
  `EXPO_PUBLIC_ANDROID_WIDGETS=1` (the grill-finding-11 revert). No build has
  ever passed lintVital widgets-off. The historical mock/prod builds passed
  because `build-mock.zsh`'s `.env` keeps `EXPO_PUBLIC_ANDROID_WIDGETS=1` from
  `.env.example` (only ENV and API_KEY lines are stripped).
- Verified from node_modules at expo 58.0.13: `prebuildAsync.js:52` and
  `ensureConfigAsync.js` both call `getConfig(projectRoot)` with no options;
  `Config.js` `getDynamicConfig` passes `{projectRoot, staticConfigPath,
  packageJsonPath, config}` to the exported function. `platform` is undefined
  at every CLI evaluation of `app.config.ts`.
- Second defect found behind the first: `plugins/androidLocaleConfig.js`
  `defaultLocaleStringEntries` enumerates widget kinds from the RESOLVED
  `config.plugins`; the widgets-off path strips the expo-widgets entry before
  appending the locale plugin, so the branch as written would write only the 2
  permission defaults, and the 28 widget keys would still fail lint (140
  errors). The android-kind defaults also have no writer with expo-widgets
  stripped. The scratch proof measures both.
- `yarn install` in the lane worktree under `commit.lock` (9.13 s, cached);
  hooks active from the first commit. Skeleton commit `0954fe38` (2.0.1003)
  landed with the full hook pass (Tests: 2 skipped, 5737 passed, 5739 total;
  four 100% coverage lines) and merged as `5bef8d06`; the main tree's
  `android/app/build.gradle` versionName synced to 2.0.1003.
- Session restarts during planning: two server restarts interrupted the
  scratch green build; the red evidence and the plan files survived, LOG.md
  was recreated from the lane's context. No lock was lost (build.lock held
  continuously by this lane; no other lane is live).

### Scratch proof (2026-10-17)

- Recipe `sessions/134/red-green-134.sh`: `.env` from `.env.example` with every
  EXPO_PUBLIC_(ENV|API_KEY|IOS_WIDGETS|ANDROID_WIDGETS) line stripped, env
  local/key, `EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest`,
  `CI=1 npx expo prebuild -p android --no-install --clean`,
  `./gradlew assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a`,
  scratch worktree `plan-134` detached at `80f707d5`, node_modules symlinked to
  the main checkout (yarn.lock hashes verified equal), TMPDIR isolated. All
  under `build.lock`.
- RED (pre-fix, measured): prebuild env export line `env: export
  EXPO_PUBLIC_ANDROID_PACKAGE EXPO_PUBLIC_IOS_APP_ID` (byte-shape identical to
  the owner's prebuild.log); `values/locales_defaults.xml` ABSENT;
  `values-b+ar/strings.xml` 30 strings; gradle `> Task :app:lintVitalRelease
  FAILED`, `Lint found 150 errors`, 153 ExtraTranslation lines, 30 unique
  keys, `BUILD FAILED in 3m 56s`, no APK. Identical to the owner's run at
  2.0.996 (3m 59s).
- GREEN (both fixes applied in the scratch worktree, never committed; the
  scratch diff verified byte-for-byte against the plan's change contracts A
  and B, modulo the comment and docblock sentences that ride step 1):
  prebuild env export line `env: export EXPO_PUBLIC_ANDROID_PACKAGE
  EXPO_PUBLIC_IOS_APP_ID`; `values/locales_defaults.xml` 30 strings;
  `values-b+ar/strings.xml` 30 strings; gradle `> Task :app:lintVitalRelease`
  executed (log line 2193, no FAILED, no SKIPPED), zero ExtraTranslation
  lines, `BUILD SUCCESSFUL in 6m 47s`, 1499 actionable tasks;
  `aapt2 dump badging` prints `package: name='com.mugtaba.athan.fleettest'
  versionCode='1000000' versionName='2.0.1002'`.

## Resume 2 (2026-10-17, 22:38, new lane session)

- The planning session died to a harness fault mid-green-build (two server
  restarts). The orphaned build completed on its own at 17:16 and PASSED;
  the results above were recorded by the resuming lane after verifying the
  log pair, the 30-string defaults file, the surviving APK's badging, and
  the scratch diff against the contracts. The orchestrator cleared the
  orphaned build.lock; locks taken fresh from here.
- Session list checked before any write: no live sibling on lane 134; lane
  branch tip still 0954fe38, nothing after the dead worker.
- D134.7 (agent-ruled, 2026-10-17): accept the orphaned green run as the
  planning scratch proof instead of re-running it. For - every artefact was
  re-verified from disk (logs, defaults xml, badging) and step 2 re-runs the
  whole build from merged content anyway. Against - the run was unattended;
  the log pair and artefacts are self-verifying (BUILD SUCCESSFUL, task
  executed, 30 strings, badging), so the risk it hides is nil. Survives.
- D134.8 (agent-ruled, 2026-10-17): the proof build keeps the plan's
  scratch-worktree mechanism (detached worktree at the merged uat sha,
  node_modules symlinked after yarn.lock hash check, under build.lock)
  rather than prebuilding widgets-off inside the main tree. For - a
  `--clean` widgets-off prebuild in the build bay would replace the bay's
  android state mid-owner-testing and the standard scripts cannot express
  widgets-off without edits D134.6 bans. Against - the lane rules name the
  main tree for builds; the scratch worktree builds identical uat content
  under the same lock and the red already reproduced the owner's failure
  there byte-for-byte. Survives.
- Plan repairs on resume: step 2's scratch worktree renamed back to
  `plan-134` (the recipe hardcodes the path; step 2 recreates it at the
  merged sha after planning removed it); step 1's merge instruction now
  names the lane-protocol merge (main tree, uat.lock, fetch,
  check-version-uniqueness, --no-ff) instead of a checkout the lane
  worktree cannot perform; step 1's version paragraph names the
  version-uniqueness gate before the bump.

## Grill and gate (2026-10-17, resume 2)

- Griller pass (one worker, blind to the planning conversation): 9 findings
  (4 must, 4 should, 1 nice), every one confirmed against the code before
  applying. Jest project selector `shared` replaced by `unit` in the three
  Run lines and the break script (the config defines only `unit` and
  `components`; measured: the old selector exits 1 having run zero tests).
  The break script's basename guard replaced with a git-toplevel check (the
  lane worktree's basename is `lane-134`; the old guard rejected the only
  tree that can hold the fixed code). Commit and merge messages renumbered
  2.0.1004 to 2.0.1005 (the planning finish commit takes 2.0.1004). The
  false red prediction corrected: the assertion added to the
  platform-android strip test passes at HEAD by the branch's first
  disjunct, so only the argv-route test and the renamed EXPO_WIDGETS_ANDROID
  assertion run red. R1.3's no-android-token leg given its owner (an
  assertion in the combined-resolution parity test). The preflight rewritten
  to run in the lane worktree (branch lane/134 or fix/*, origin/uat ancestor
  check) instead of a main-tree location it could not coherently name. The
  version paragraph's dead referents removed (version.lock is a lock, never
  a source; the uniqueness script prints no candidate number). The docblock
  replacement sentence supplied verbatim. The @expo/config label corrected
  (58.0.6 under the installed expo 58.0.13).
- Gate: `bash scripts/check-plan.sh ai/plans/134-lint-gate` prints
  `PLAN OK` (run from the lane worktree root, 2026-10-17).

## Execution (2026-10-17, resume 2)

- Step 1 dispatch 1 (executor session ses_eb42290f4ffeWMSDoGu7FWDDmp)
  died to a server restart before doing anything (session db: interrupted;
  worktree clean, no branch, no locks). Dispatch 2
  (ses_eb4218febffemGXU8DUQ9GsMXC) returned a clean STOP before branching:
  the committed preflight used `declare -A` (bash 4 associative arrays), but
  this machine's only bash is /bin/bash 3.2.57, so under `set -u` the
  subscript parsed as an arithmetic name and tripped `resolve: unbound
  variable`.
- D134.9 (agent-ruled, 2026-10-17, answering that STOP): rewrite the
  preflight to bash 3.2 with parallel indexed arrays, no interpreter pin, no
  install. For - scripts/check-plan.sh's own header fixes the repo
  convention ("bash 3.2 compatible (macOS): no assoc arrays, no mapfile")
  and the repair needs nothing new. Against - zsh exists on every mac, but
  the plan says run with bash and zsh carries its own traps. Survives.
  Applied and verified: all six anchor counts print 1 under /bin/bash 3.2,
  the guard and branch checks parse. Step 1's version renumbered to
  2.0.1006 (this repair commit takes 2.0.1005).

- D134.10 (agent-ruled, 2026-10-17, answering that STOP): repair the break
  script's failure detector from the `✕` mark (which this jest never prints
  under --silent non-verbose) to the failure block bullet `●` or a
  `Tests:.*failed` summary line, and fix the plan's break-script invocation
  path to `ai/plans/134-lint-gate/scripts/break-134.sh`. For - the executor
  proved all seven mutants die (diagnostic copy, `ALL AS EXPECTED: 7`), so
  only the detector is wrong, and the two indicators it now greps are the
  ones the configuration actually prints. Against - relaxing the detector
  risks a false kill; the exit-code check still runs first and the summary
  line names counts, so a crash cannot pass as a kill. Survives. The
  executor's verified diff is preserved at
  `$HOME/athan-gitree/sessions/134/step1/step1-unfinished.patch` for the
  re-dispatch; red and green stay as the ledger's recorded evidence. Step
  1's version renumbered to 2.0.1007 (this repair commit takes 2.0.1006).

### Step 02 - build-bay green proof at the merged fix (2026-10-17, lane-run)

Lane-run per D134.5, from merged uat content `087d30ff` (2.0.1007), scratch
worktree `$HOME/athan-gitree/worktrees/plan-134` detached there,
`node_modules` symlinked after the yarn.lock sha256 hashes verified equal,
recipe `bash $HOME/athan-gitree/sessions/134/red-green-134.sh green` under
`build.lock`, TMPDIR isolated. The worktree and its TMPDIR were removed
after the run; the APK died with the worktree (badging read recorded below,
nothing installed anywhere, no adb command run).

- `.env` written by the recipe from `.env.example` minus every
  `EXPO_PUBLIC_(ENV|API_KEY|IOS_WIDGETS|ANDROID_WIDGETS)` line: the printed
  bytes show only `EXPO_PUBLIC_IOS_APP_ID`, `EXPO_PUBLIC_ANDROID_PACKAGE`
  and the local env/key pair.
- Prebuild log env export line: `env: export EXPO_PUBLIC_ANDROID_PACKAGE
  EXPO_PUBLIC_IOS_APP_ID` (byte-shape identical to the owner's failing
  fleettest prebuild.log).
- `values/locales_defaults.xml` after prebuild: 30 `<string>` entries
  (planning red at `80f707d5`: ABSENT).
- `values-b+ar/strings.xml`: 30 `<string>` entries.
- Gradle `./gradlew assembleRelease --no-daemon
  -PreactNativeArchitectures=arm64-v8a`: exit 0, `> Task :app:lintVitalRelease`
  at log line 2202 (executed, no FAILED, no SKIPPED), zero ExtraTranslation
  lines (planning red: 153 lines, 150 errors, 30 unique keys), `BUILD
  SUCCESSFUL in 8m 14s`, APK produced.
- `aapt2 dump badging` (build-tools 37.0.0, existence checked): `package:
  name='com.mugtaba.athan.fleettest' versionCode='1000000'
  versionName='2.0.1007' ...`.
- Logs kept at `$HOME/athan-gitree/sessions/134/logs/green-{prebuild,gradle}.log`
  (overwriting the planning-era scratch run of the same names; the planning
  run's numbers are transcribed above and in the Resume 2 section).

R3.1 proven at the merged fix; R3.2 already recorded by the planning red.

- The executor's finishing session truncated twice at commit boundaries
  (its background hook outlived its turn); the lane carried each wait and
  verified every artefact by script. The first step-1 commit `1d520426`
  omitted the staged version files (message 2.0.1007, content 2.0.1006);
  the executor reset, restaged all eight files and recommitted as
  `7453d2a9` with both files at 2.0.1007 and the hook green
  (`Tests: 2 skipped, 5743 passed, 5745 total`). The lane merged it as
  `087d30ff` and synced the main tree's `android/app/build.gradle`
  versionName to 2.0.1007.

session: self (lane, resume 2)

### Step 01 - the config branch and the plugin defaults

Executor session ses_eb41dee53ffexozXqvEmfceAAo, 2026-10-17, worktree
`$HOME/athan-gitree/worktrees/lane-134`.

- Preflight: copy to `$TMPDIR`, run under /bin/bash 3.2 with the worktree root
  as cwd, `PREFLIGHT OK` on lane/134 and again on the fix branch after
  `git checkout -b fix/134-locale-plugin-every-android` (off 8b64cc4d, the
  uat tip).
- Red, written verbatim from the plan, all three suites run with
  `--selectProjects=unit --watchman=false`:
  - config.test.ts `Tests: 1 failed, 22 passed, 23 total`; failing line 212
    `expect(resolved.plugins).toContain('./plugins/androidLocaleConfig');`
    in `registers the locale config on the real CLI route: platform
    undefined, android argv, widgets off`. The fourth new test passed red as
    the plan predicts (it pins the guard).
  - flags.test.ts `Tests: 2 failed, 22 passed, 24 total`; failing lines 236
    and 258, both `toContain('./plugins/androidLocaleConfig')` mismatches
    (the new argv-route test and the renamed EXPO_WIDGETS_ANDROID test).
  - nativeLocalesConfig.test.ts `Tests: 1 failed, 4 passed, 5 total`;
    `Expected: 30 / Received: 2` at line 148.
- Change contracts A and B applied verbatim (branch condition, comment
  sentence, helper + docblock replacements + function body).
- Green: the three suites `23 passed, 23 total`, `24 passed, 24 total`,
  `5 passed, 5 total`; `npx tsc --noEmit` exit 0; `npx biome check .
  --error-on-warnings` exit 0 (452 files); `yarn validate` exit 0 with
  `Tests: 2 skipped, 5743 passed, 5745 total` and coverage
  `Statements 100% (5401/5401)`, `Branches 100% (2326/2326)`,
  `Functions 100% (1130/1130)`, `Lines 100% (4838/4838)`.
- Break script, run verbatim as
  `bash ai/plans/134-lint-gate/scripts/break-134.sh` from the worktree root
  (the plan's `scripts/break-134.sh` path resolves to the plan folder's copy;
  the repo-root scripts/ holds no such file - first invocation by the bare
  plan path exited 127 before anything mutated): every one of the seven
  substitutions matched and every jest run exited 1, but the script printed
  seven `BREAK NOT APPLIED: ... (no failing test)` lines and ended
  `BREAKS FAILED: 7`. Cause: expect_fail greps the jest log for `✕`, and
  this jest (piped, non-verbose, --silent, no custom reporters) prints `●`
  failure blocks only - no `✕` mark exists in any run, red or green. The
  plan's `ALL AS EXPECTED: 7` is unreachable with the committed detector.
- Diagnostic (evidence only, never the gate): a `$TMPDIR` copy of the script
  with the single grep changed from `✕` to `●` prints `mutant killed` for
  all seven and `ALL AS EXPECTED: 7`. So the substantive mutation
  requirement holds: each mutant reddens the three named suites. Only the
  script's success detector is wrong.
- STOP returned: the committed break script is plan-given content and its
  detector needs the lane's repair; the step's break gate cannot be
  satisfied as written. No version bump, no commit, no merge; version.lock
  and commit.lock never taken. Work saved to
  `$HOME/athan-gitree/sessions/134/step1/` (unfinished patch 217 lines,
  status, red/green/validate/break logs); the worktree restored clean on
  lane/134 and the child branch deleted.

session: ses_eb41dee53ffexozXqvEmfceAAo

#### Resume (after the D134.10 detector repair)

Executor session ses_eb415b8c6ffenYz7aBaiPXrGEG, 2026-10-17, same worktree.
Red and green stand as recorded above; nothing was reverted or re-run red.

- Preflight rerun from a `$TMPDIR` copy under /bin/bash: `PREFLIGHT OK` on
  lane/134 at `57fe44cf`, and again on the fresh branch
  `fix/134-locale-plugin-every-android` (six anchor counts all 1).
- The verified diff `$HOME/athan-gitree/sessions/134/step1/step1-unfinished.patch`
  applied clean; read cold against contracts A and B and the three red-test
  snippets: every byte matches, only the five step files touched.
- Green: `23 passed, 23 total`, `24 passed, 24 total`, `5 passed, 5 total`
  (unit selector, watchman off); `npx tsc --noEmit` exit 0;
  `npx biome check . --error-on-warnings` exit 0 (452 files).
- Break gate, repaired script, run verbatim from the worktree root: all seven
  mutants killed, last line `ALL AS EXPECTED: 7`; `git status --porcelain`
  afterwards listed only the five step files.
- Version 2.0.1007 under version.lock: fetch clean,
  `VERSIONS OK 7 commits across 4 refs, 0 unreadable, no shared version`
  (2.0.936 grandfathered), app.json then package.json set by value-only sed.
- Ticket row set to `IN PROGRESS, step 1`.
- First commit `1d520426` was defective: the add-by-name list omitted app.json
  and package.json, so the commit's content held 2.0.1006 under a 2.0.1007
  message (the lead caught it; nothing merged). The lead-ordered
  `--amend --no-edit` could not run: the uniqueness gate reads the
  still-reachable defective commit and refused with
  `VERSION COLLISION 2.0.1006: 1d520426 f9ad3a5a`. Repaired by mechanism only:
  under commit.lock, `git reset --soft 57fe44cf` (dropping the unmerged
  defective tip; its staged tree was already the intended final one) and a
  fresh `git commit -F` with the same message - the amend reproduced exactly,
  no gate bypassed, no shared ref touched, the dropped sha stays in the reflog.
- Final commit `7453d2a9`
  `2.0.1007 - fix(config): the locale-config plugin rides every android resolution, defaults cover the stripped-widgets case`:
  8 files (five step files, app.json, package.json, queue row), hook green,
  `Tests: 2 skipped, 5743 passed, 5745 total`, coverage `Statements 100%
  (5401/5401)`, `Branches 100% (2326/2326)`, `Functions 100% (1130/1130)`,
  `Lines 100% (4838/4838)`; `git show HEAD:app.json` and `HEAD:package.json`
  both print 2.0.1007; `git status --porcelain` empty afterwards; commit.lock
  and version.lock released. No merge: the lane merges in the main tree.

session: ses_eb415b8c6ffenYz7aBaiPXrGEG

### Step 01 - completed (2026-10-17)

- Re-dispatch applied the saved patch; green suites 23/24/5 passed, tsc and
  biome exit 0, break script `ALL AS EXPECTED: 7`.
- Commit `7453d2a9` at 2.0.1007 (first attempt `1d520426` omitted the version
  files; reset and recommitted), hook `Tests: 2 skipped, 5743 passed, 5745
  total`, coverage `Statements 100% (5401/5401)`, `Branches 100% (2326/2326)`,
  `Functions 100% (1130/1130)`, `Lines 100% (4838/4838)`.
- Merged as `087d30ff`.

session: ses_eb408a78cffeTCB1Csr97qXp5S
