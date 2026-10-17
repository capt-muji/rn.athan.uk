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

session: self (lane, resume 2)
