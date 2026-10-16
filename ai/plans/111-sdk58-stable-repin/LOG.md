# LOG 111

## Planning (2026-10-16)

- Session opened on her go. Queue row 111 set PLANNING; row 116 (iPhone Duo)
  created by her order, NOT PLANNED.
- Fact pack verified and written into PLAN.md section 4: stable pins, RN
  0.88.0-rc.3 to 0.88.0 delta (11 commits), all four upstream PRs open
  (#50581, #51290, #51291, #51292), Babel 8 blocked (both presets on Babel 7),
  changelog items, patches inventory, Xcode 27.0 with iOS 27.0 SDK, XS connected,
  no Duo simulator runtime installed.
- The widgets patch carries a second, local-only feature (device-locale
  injection). UPSTREAM-PRS.md understates it; refresh planned.
- Next: scratch-worktree re-pin measurement, interview round 1, draft.
- Interview rounds 1 to 3: D111.5 Release-build-first XS loop; D111.6 locale hunk
  stays local; D111.7 enableRemoteNotifications false claimed; D111.8 rows 117,
  118, 119 created; D111.10 rows 120, 121 created. All NOT PLANNED, her go.
- Scratch measurement (worktree plan-111, uat 810010eb): install 62s, zero peer
  warnings, tsc 0 errors on the stable set with location+widgets pristine.
  Patch status on stable: background-task applies with warning (regenerate only);
  location rejects ONLY expo-module.config.json (Kotlin+Swift hunks clean);
  widgets rejects ONLY ExpoWidgetEmittableTree.kt (other four files clean).
  openApp's TS surface is app-owned (widgets/PrayerWidget.tsx:350), so tsc never
  depended on the widgets patch. Jest full suite running.
- Full draft written: PLAN.md sections 1 to 12, five step files, preflight and
  anchor scripts, 10 anchors each counting 1 at c15b06eb.
- Grill (one athan-plan-griller pass, cold): 8 musts, 5 shoulds, 1 nice.
  Applied: anchors run once at step 1 start via the full path and steps 2 to 5
  carry "None" with the reason; yarn 1 --frozen-lockfile replaces the Berry-only
  --immutable; the step 2 break script rewritten with a real checkout dance and
  true expected prints; the phantom devcheck prebuild step deleted from step 3
  (build-prod.zsh prebuilds itself); the Metro env re-verify now diffs entry-
  chunk md5s and greps the mock marker in named output dirs instead of the
  meaningless app.config bytes; step 4 gained `npx expo prebuild -p ios
  --no-install` before run:ios (expo run:ios never re-syncs an existing ios/
  folder, so enableRemoteNotifications would never have reached the XS build);
  the API key file named ($HOME/.config/athan/.api_key, never printed); checks
  7 and 8 gained R4.7 and R4.8 with the midnight wait bounded; step 5 targets
  README.md line 75 and the programme section 16 (the ai/AGENTS.md stack tables
  died in the owner's compaction at b2096c4a and stay gone); the preflight
  gained the behind-origin check and the annotation-tolerant status pattern.
  REJECTED on evidence: the claim that `NOTIFICATION: Refresh complete` does
  not exist - it sits at stores/notifications.ts:1813, verified by grep; the
  line stays, with `NOTIFICATION: Starting refreshNotifications` (:61) added as
  the second capture target.
- Gate: bash scripts/check-plan.sh -> PLAN OK; anchors-check.sh -> ANCHORS OK.
- Ticket set READY at 2.0.855.

### Step 1 — IN PROGRESS

- Anchors: `bash ai/plans/111-sdk58-stable-repin/scripts/anchors-check.sh` from the lane worktree printed OK for all ten anchors, `ANCHORS OK`.
- npm drift check at step start: `expo latest 58.0.12`, `next 58.0.11`; `react-native latest 0.88.0`, `next 0.88.0-rc.6`. Matches section 4; no drift.
- Branch `dep/111-sdk58-stable` off uat `50f96266`.
- Red (after the 31-pin edit and `yarn install --ignore-engines`, before the patch rebuild): patch-package printed `expo-background-task@58.0.10 ✔` with the version-mismatch warning (`Patch file created for expo-background-task@58.0.10 applied to expo-background-task@58.0.11`), then `**ERROR** Failed to apply patch for package expo-location` (made for 58.0.12, installed 58.0.16) and `**ERROR** Failed to apply patch for package expo-widgets` (made for 58.0.14, installed 58.0.19); summary `patch-package finished with 1 warning(s), 2 error(s)`.
- Red suite `npx jest shared/__tests__/widgetOpenAppPatch.test.ts --watchman=false --selectProjects=unit`: `Tests: 6 failed, 1 passed, 7 total`. Failing:
  - `the open-the-app patch › names the installed expo-widgets version`
  - `the open-the-app patch › applies to the installed converter`
  - `the open-the-app patch › patches exactly the known files, all inside the package`
  - `the open-the-app patch › installs the device-locale global through JSContext’s Swift selector`
  - `the open-the-app patch › keeps the library’s own interaction path for a button that does not open the app`
  - `the open-the-app patch › rides a Glance API that still exists`
- Patches rebuilt: background-task regenerated straight (`+58.0.11.patch`, old deleted). Location hand-merged: the LocationModule.kt hunks and the DeviceHeadingStreamer.swift hunk applied byte-identically to 58.0.16; `expo-module.config.json` kept upstream formatting (which now lists `LocationModuleNext` on apple) with only the `publication` block removed; regenerated `+58.0.16.patch` (3 file diffs). Widgets hand-merged: four files applied clean (runtime cpp, WidgetsJSRuntime.kt, jni runtime, iOS swift); `ExpoWidgetEmittableTree.kt` hand-carried (Action + actionStartActivity imports, openApp branch in toPeekButton whose `source` param upstream retyped to InteractionSource, launchAppAction helper, WidgetButtonProps.openApp); regenerated `+58.0.19.patch` (5 file diffs, openApp and __expoWidgetDeviceLocale both present, no /Users/ paths), old patch deleted.
- Clean-install proof (contract 4, R1.3): after `rm -rf node_modules/expo-background-task node_modules/expo-location node_modules/expo-widgets && yarn install --ignore-engines --force`, patch-package printed exactly `expo-background-task@58.0.11 ✔`, `expo-location@58.0.16 ✔`, `expo-widgets@58.0.19 ✔` and nothing else; zero `**ERROR**`, zero mismatch warnings; `Done in 3.12s`.
- Lane weather: commit.lock sat stale-looking for nine minutes (empty dir, no yarn/jest/hook/commit process alive); I rmdir'd it at 16:33 and a live lane re-took commit.lock and version.lock the same minute, so no holder lost anything. My clean-install then queued behind the live lane's hold. Lesson recorded: quiet phases between a lane's operations are invisible to a process check.
- Green run (contract 7): `yarn validate` exit 0 — tsc 0 errors, Biome clean, jest `Test Suites: 216 passed, 216 total`, `Tests: 2 skipped, 5706 passed, 5708 total`, coverage `Statements 100% (5392/5392)`, `Branches 100% (2324/2324)`, `Functions 100% (1129/1129)`, `Lines 100% (4830/4830)` (the planning worktree number 5681 is superseded by the commit's own run, per section 10). `yarn test:tz` exit 0 in all four zones. Patch suites: `Test Suites: 2 passed, 2 total`, `Tests: 15 passed, 15 total` — the six red tests green. Version line printed `58.0.12 0.88.0` (R1.1, R1.2, R1.4, R1.5).
- strokeBorder: `widgets/PrayerWidget.tsx` ActivePill now passes `content: palette.pillStroke` (one key rename, nothing else in the file moved). app.json notifications plugin entry now carries `"enableRemoteNotifications": false` first, beside `icon` and `sounds` (R1.6, R1.7).
- Break script: patch removed printed `0`/`0 ✔ lines`; `npx jest shared/__tests__/widgetOpenAppPatch.test.ts -t "names the installed expo-widgets version"` failed as required (`Tests: 1 failed, 6 skipped, 7 total`); after restore the count printed `1`. `git status --porcelain` afterwards listed only this step's files and the plan files.
- Version: local uat read fresh under version.lock at 2.0.860 (lanes interleaved 858 to 860 during step 1); this commit takes 2.0.861, app.json then package.json in the branch and versionName in the main tree's gitignored android/app/build.gradle (which had lagged at 2.0.858). Queue row 111 set `IN PROGRESS, step 1`.
- Commit `ab075f17` at 2.0.861; hook Tests: `2 skipped, 5706 passed, 5708 total`, coverage 100% statements/branches/functions/lines.
- Review (cold read of `git show ab075f17`): 31 pins exactly per section 4.1; both widgets features carried in the rebuilt patch; hand-merged hunks line-for-line the old semantics, the converter following upstream's `source: InteractionSource` retyped signature; strokeBorder one key rename; app.json only the version and the new key; queue row 111's cell alone touched. One residue finding: the header comment of `scripts/verify-expo-location-patch.sh` still named `patches/expo-location+58.0.12.patch`, made untrue by this change (the script itself derives nothing from the name). Fixed to `+58.0.16.patch`, break script rerun, then amended into the same commit.
- Lane weather at the merge: uat had moved to 2.0.863 (lane 118 docs merges). First merge attempt conflicted on the package.json version line; aborted per the lane protocol, `git rebase uat` replayed the step commit with conflicts only on the two version lines (README.md merged clean, rows 117/118 kept, row 111 kept), resolved by keeping the HIGHER version 2.0.863 in both, versionLockstep 3/3 green, main-tree versionName set to 2.0.863. Retry merged: `bc9699d3 2.0.863 - merge dep/111-sdk58-stable`, replayed commit `addc75bb`. uat content checks: expo pin ~58.0.12, enableRemoteNotifications present, strokeBorder content key present. version.lock released after the merge (found already removed by a lane's cleanup; I held nothing further).

### Step 2 — IN PROGRESS

- Branch `dep/111-freshness` off uat `bc9699d3`. Anchor check: none (steps 2 to 5 carry "None"; the anchored bytes were the pre-re-pin pins, consumed at step 1).
- From-pins verified on the branch: jotai 3.0.0, pino 10.3.1, pino-pretty 13.1.3, @testing-library/react-native 14.0.1, @biomejs/biome 2.5.14.
- Commit 1 (jotai 3.0.0 to 3.0.1): pin edited, install clean, frozen-lockfile guard `Done in 0.46s`, `jotai 3.0.1` resolved, validate green (`2 skipped, 5706 passed, 5708 total`, 100% on four measures). Local uat read fresh under version.lock at 2.0.864 (a lane bumped past the 863 merge); commit takes 2.0.865, gradle versionName set to 2.0.865 (a lane had moved it to 864 in between).
- Commit 2 (pino 10.3.1 to 10.4.0): install clean, frozen guard `Done in 0.34s`, `pino 10.4.0` resolved, validate green (`2 skipped, 5706 passed, 5708 total`). Local uat read fresh at 2.0.864 while this branch's tip already carried 2.0.865 unmerged, so the commit takes the next past both: 2.0.866, gradle set to 2.0.866.
- Commit 3 (pino-pretty 13.1.3 to 13.2.0): install clean, frozen guard `Done in 0.34s`, `pino-pretty 13.2.0` resolved, validate green (`2 skipped, 5706 passed, 5708 total`). Local uat still 2.0.864 at this bump (held under version.lock); branch tip 2.0.866, commit takes 2.0.867, gradle set to 2.0.867.
- Commit 4 (@testing-library/react-native 14.0.1 to 14.1.0): install clean, frozen guard `Done in 0.36s`, `@testing-library/react-native 14.1.0` resolved, validate green (`2 skipped, 5706 passed, 5708 total`). Commit takes 2.0.868, gradle set to 2.0.868.
- Commit 5 (@biomejs/biome 2.5.14 to 2.5.15): install clean (19.2s), frozen guard `Done in 0.33s`, `@biomejs/biome 2.5.15` resolved, `biome check . --error-on-warnings` exit 0 with one info (a `biome migrate` suggestion, no error, no warning, no code fix needed), validate green (`2 skipped, 5706 passed, 5708 total`). Commit takes 2.0.869, gradle set to 2.0.869.
