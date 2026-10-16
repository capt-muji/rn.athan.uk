# LOG 111

Resume from: ticket 111 is READY after the 2026-10-16 refresh (the lane's Plan phase). The next
phase is Execute, at step 1: the delta re-pin to `expo 58.0.13` (eight direct pins moved, two
transitive) with the three patches regenerated and the first attempt's carried audit findings
fixed in the same commit; then step 2's 3T release build and alarm gates (the phone is
connected); then step 3's XS loop, which waits on the owner unlocking her phone (measured
2026-10-16: `xcrun devicectl device info lockState` fails with "Failed to allocate RSD device",
the lock signature the first attempt recorded); then step 4's records. The section "Refresh
(2026-10-16)" below carries the measurements and `AUDIT.md` carries the first attempt's three
review passes.

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

session: ses_ebab395c9ffevlqjIPhEQfzt5C

### Step 2 — IN PROGRESS

- Branch `dep/111-freshness` off uat `bc9699d3`. Anchor check: none (steps 2 to 5 carry "None"; the anchored bytes were the pre-re-pin pins, consumed at step 1).
- From-pins verified on the branch: jotai 3.0.0, pino 10.3.1, pino-pretty 13.1.3, @testing-library/react-native 14.0.1, @biomejs/biome 2.5.14.
- Commit 1 (jotai 3.0.0 to 3.0.1): pin edited, install clean, frozen-lockfile guard `Done in 0.46s`, `jotai 3.0.1` resolved, validate green (`2 skipped, 5706 passed, 5708 total`, 100% on four measures). Local uat read fresh under version.lock at 2.0.864 (a lane bumped past the 863 merge); commit takes 2.0.865, gradle versionName set to 2.0.865 (a lane had moved it to 864 in between).
- Commit 2 (pino 10.3.1 to 10.4.0): install clean, frozen guard `Done in 0.34s`, `pino 10.4.0` resolved, validate green (`2 skipped, 5706 passed, 5708 total`). Local uat read fresh at 2.0.864 while this branch's tip already carried 2.0.865 unmerged, so the commit takes the next past both: 2.0.866, gradle set to 2.0.866.
- Commit 3 (pino-pretty 13.1.3 to 13.2.0): install clean, frozen guard `Done in 0.34s`, `pino-pretty 13.2.0` resolved, validate green (`2 skipped, 5706 passed, 5708 total`). Local uat still 2.0.864 at this bump (held under version.lock); branch tip 2.0.866, commit takes 2.0.867, gradle set to 2.0.867.
- Commit 4 (@testing-library/react-native 14.0.1 to 14.1.0): install clean, frozen guard `Done in 0.36s`, `@testing-library/react-native 14.1.0` resolved, validate green (`2 skipped, 5706 passed, 5708 total`). Commit takes 2.0.868, gradle set to 2.0.868.
- Commit 5 (@biomejs/biome 2.5.14 to 2.5.15): install clean (19.2s), frozen guard `Done in 0.33s`, `@biomejs/biome 2.5.15` resolved, `biome check . --error-on-warnings` exit 0 with one info (a `biome migrate` suggestion, no error, no warning, no code fix needed), validate green (`2 skipped, 5706 passed, 5708 total`). Commit takes 2.0.869, gradle set to 2.0.869.
- Green run after the fifth commit: `jotai 3.0.1`, `pino 10.4.0`, `pino-pretty 13.2.0`, `@biomejs/biome 2.5.15`, `@testing-library/react-native 14.1.0` all resolving from the branch lock (R2.1); the fifth commit's own hook validate ran the committed tree green (`2 skipped, 5706 passed, 5708 total`, 100% on all four measures).
- Break script: uat's lock restored printed `jotai 3.0.0`; the branch's lock restored printed `jotai 3.0.1` — the lock pins what package.json names. Tree clean afterwards.
- Review (cold read of the five diffs): one pin plus the version pair per commit, yarn.lock hunks belonging to that package alone, the first commit also carrying the row-111 step-2 move and the ledger; no unrelated hunks; every hook green (Tests: `2 skipped, 5706 passed, 5708 total`).
- Lane weather at this merge: uat had moved to 2.0.864 (lane 117's planning merge). First merge attempt conflicted on the two version lines; aborted, `git rebase uat` stopped once at the jotai commit with the same two-line conflict, resolved keeping the higher 2.0.865, the remaining four commits replayed untouched (866 to 869). Retry merged: `5966e95b 2.0.869 - merge dep/111-freshness`.
- Checklist: R2.1 holds on uat. The five commits: `8878bd69` 2.0.865 jotai, `8d4973d2` 2.0.866 pino, `59f5f958` 2.0.867 pino-pretty, `f1ea53a3` 2.0.868 @testing-library/react-native, `490ddffa` 2.0.869 @biomejs/biome.

session: ses_ebab395c9ffevlqjIPhEQfzt5C

### Lane ruling 2026-10-16 — step order swap (agent-ruled)

- The OnePlus 3T is absent from adb at steps 1-2 close (checked twice); the XS is
  connected. Ruling: step 4 (XS loop) runs before step 3, re-checking the 3T at
  each boundary. Why: her XS deep-dive order is the named priority, the steps are
  independent proofs of the same merged re-pin (step 4 names no input from step
  3), and an idle wait with runnable ordered work serves nothing. If the 3T is
  still absent when step 4 closes, the queue row gets the reason and the lane
  returns BLOCKED naming it (steps 3 and 5 outstanding).

### Step 4 — R4.1 cold start GREEN

- Build (main tree, uat 2.0.872 content, node_modules at the stable set): `npx expo prebuild -p ios --no-install` then `npx expo run:ios --configuration Release --device` under `EXPO_PUBLIC_ENV=prod EXPO_PUBLIC_API_KEY=<read, never printed> CI=1 EXPO_NO_TELEMETRY=1 DEVELOPMENT_TEAM=<TEAM_ID>` (the inline team is the atlas's standing route; the verbatim `--device` fails selection with two connected devices, so the UDID rode the flag). Release build embedded main.jsbundle (6.2 MB), installed and launched on the XS at 17:07 (PID 98229). This Release install replaced her dev build (her app, development-signed production build); her notification, widget and language config stood.
- Prebuild ground re-verified: generated Info.plist carries UIBackgroundModes fetch+processing with `com.expo.modules.backgroundtask.processing`, and zero `remote-notification` entries (R1.6's enableRemoteNotifications false regenerated into ios/).
- run:ios's own launch was the throwaway first launch (What's New marks itself); the check read is the second open. AX dump (agent-device runner, prepared after a daemon restart under the team env; the MCP daemon's env lacked it): schedule renders "London, UK", "Fri, 16 Oct 2026", rows Fajr 05:51 (off), Sunrise 07:23 (silent), Dhuhr 12:51 (silent), Asr 15:31 (sound), Magrib 18:08 (silent), Isha 19:31 (silent), countdown "48m" to Magrib. No crash reports in the system crash-log domain for the bundle; the original PID alive through the read. Captures: sessions/111/xs/01-first-launch.png (OCR transcription in the session notes).

session: ses_eba90557fffegXgpdEF29mZxAH

### Step 4 — R4.3 compass stream GREEN

- Qibla sheet opened via taps (Settings row at (187,376)pt from OCR box 265,1128px). Sheet renders title "Qibla", subtitle "Follow below instructions", calibration hint "Wake up the compass / Move your phone like this"; after ~90s stationary it shows the lost state "Could not find north / Please try standing in a different location" — the designed gate: no heading the phone vouched for, so no dial is drawn (qibla lock held).
- The stream itself is proven by the unified log: `locationd` `kCLConnectionMessageHeading` and `Athan{CoreLocation}` "#CLLocationManager invoking #delegate" lines. Bounded 30s window (17:24): 6304 locationd heading messages, 3148 Athan CoreLocation delegate invocations (~105/s) — the unfiltered stream the location patch's `kCLHeadingFilterNone` buys; a throttled stream could not produce this rate. Captures: qibla-sheet.png, qibla-2.png, qibla-3.png (TMPDIR, transcriptions in the session notes; syslog at $TMPDIR/xs111/syslog.txt).

session: ses_eba90557fffegXgpdEF29mZxAH

### Step 4 — R4.4 language switch GREEN both directions

- To العربية: Language row reached (Settings > scroll > Language at (187,572)pt), tap on العربية (4th row, canonical order). Loader on the tap (1.2s capture: full-screen line at y~460pt, Arabic script garbled by Latin OCR — the loader speaks the TARGET's words from frame one), blank relaunch window at 3.7s, Arabic schedule at 6.2s: المغرب countdown 42m, لندن، المملكة المتحدة, الجمعة، 16 أكتوبر 2026, rows الفجر 05:51, الشروق 07:23, 12:51, 15:31, 18:08, 19:31 — same real times, RTL layout, Arabic typography from frame one.
- Back to English: loader reads "Setting English language" (1.2s), English schedule at ~4s (Magrib 40m, London, UK, Fri 16 Oct 2026, LTR). No crash, no AppState exception in the unified log (only benign UIAccessibility posts); the app left in English as ordered. Her bells carried across both switches (العصر صوت = Asr sound seen in the Arabic tree). Captures: lang-loader.png, lang-after.png, back-loader.png, back-after.png.

session: ses_eba90557fffegXgpdEF29mZxAH

### Step 4 — R4.6 widgets PARTIAL (home reachable page; lock screen deferred past midnight)

- Home screen reached via the atlas route (app-switcher, tap clear wallpaper at (30,200)pt). The reachable home page carries NO Athan widget: OCR of two captures reads only the clock, battery, one icon label (the tooling's runner app) and the Search pill — no prayer text anywhere on the page.
- Home paging is not drivable through this runner: every horizontal swipe (four start bands: icon row y=400pt, top band y=55pt and y=30pt, left gutter x=8pt; both directions) foregrounds the session app instead of paging the home screen — XCTest gesture delivery activates the session's target app. The app's own pager pages fine through scroll left/right (the Extras night-times view paged and paged back; its tonight read captured: Midnight countdown 6h 26m at 17:33, rows Midnight/Last Third/Suhoor for Sat 17 Oct — capture 08-extras-evening.png).
- Lock-screen widgets need the screen locked, which backgrounds the app; that read is deferred to after the R4.8 midnight read so the app stays foreground through 00:00. Not observed yet, recorded as not observed.
- Captures: 06-home-a/b/c.png (home page + the two paging attempts), 08-extras-evening.png.

session: ses_eba90557fffegXgpdEF29mZxAH

### Step 4 — R4.5 ground: BGTask registered and re-armed; the named Pino stamp is structurally absent in prod

- Registered task proof: the unified log shows the app cancelling and re-submitting `BGProcessingTaskRequest com.expo.modules.backgroundtask.processing` on every launch and relaunch (17:25:34 Arabic relaunch, 17:27:25 English relaunch, both "submitTaskRequest ... earliestBeginDate ..."), beside the Info.plist registration (`com.expo.modules.backgroundtask.processing` under UIBackgroundModes fetch+processing, verified in the generated plist).
- The step's named capture targets (`NOTIFICATION: Starting refreshNotifications` at stores/notifications.ts:61, `NOTIFICATION: Refresh complete` at :1813) are Pino lines, and `shared/logger.ts` disables Pino whenever `EXPO_PUBLIC_ENV` is prod or preview (`isLoggingEnabled` returns false; `pino({ enabled: false })`). Measured: 0 `NOTIFICATION:` lines in 16k+ Athan syslog lines this session while `Athan{React}` runtime lines and `Athan{UserNotifications}` native lines DO appear. The named stamp observable cannot exist on this build by the app's own design, not by a defect in the refresh: the native scheduling trace is live (`Got 62 pending notification`, settings checks, on every relaunch).
- Backgrounding treatment and the overnight BGProcessing run window remain (the app backgrounds for the widget/lock reads and the syslog keeps recording); the stamp itself has no external observable on a prod build. Flagged for the reviewer and the lead: R4.5's requirement holds on the registered-task half; the stamp half needs either a preview-env build (logging on) or a ruling that the native trace plus the BGTask submission satisfies it.

session: ses_eba90557fffegXgpdEF29mZxAH

### Step 4 — R4.2 real athan delivery GREEN on the current build (recovered evidence)

- The interrupted run left a delivery watcher and its output in `$TMPDIR/xs111/`
  (`deliver-watch.sh`, `delivery-lines.txt`, covering 17:38 to 18:08); this session read them.
  The unified log records three `[com.mugtaba.athan] Created process assertion for will present
  notification` events on the Release build: 17:38:00, 18:03:00 and 18:08:00. The 18:08 event
  is Magrib's armed moment (`UserNotificationsCore`: the notification was requested at
  17:07:49 with trigger date `2026-10-16 18:08:00.096 +0100`, armed on the build's first
  launch), and 18:03 is its five-minute reminder. A real athan moment therefore delivers its
  notification on this build.
- Caveat recorded rather than glossed: her configuration leaves Magrib and every prayer but Asr
  silent, so this proves delivery, not sound. The sound path was not exercised here.
- This proof is a property of the pin set the replan replaces, so the replan re-runs it.

### Lane resume 2026-10-16 18:22 — true position reconciled (agent-ruled)

- The row said `IN PROGRESS, step 2`; the repository disagrees and wins. Step 1
  merged as `bc9699d3` (commit `addc75bb`, 2.0.861), step 2 as `5966e95b`
  (commits `8878bd69` to `490ddffa`, 2.0.865 to 2.0.869), and the docs commit
  `8eb0a48e` (2.0.870, an ancestor of uat) recorded both while leaving the row on
  step 2: the row is stale by two steps. The interrupted executor then opened
  step 4 and left the five entries above uncommitted; they are carried forward
  unchanged, and nothing ticked is redone.
- Devices measured at resume, 18:22 to 18:30: the OnePlus 3T is absent from adb
  (`adb devices` empty after `kill-server` then `start-server`; ioreg lists the
  iPhone as the only phone on USB), so step 3's install, alarm and widget checks
  cannot run. The iPhone XS answers `devicectl device info` but refuses
  automation: `agent-device prepare ios-runner` prints "iOS device is not ready
  for automation: Command timeout", its runner's xcodebuild destination errors
  "An unknown error occurred", and `devicectl device process launch` fails
  "Failed to allocate RSD device" on three attempts 30 seconds apart. The
  tooling names the cause: the device must be unlocked. Her phone locked itself
  after the interrupted run, and no agent step can unlock it.
- Ruling (agent-ruled, 2026-10-16): the lane carries every device-free
  acceptance it can, merges that work and returns BLOCKED on the two
  instruments instead of idling. Why: both remaining device gates need a phone
  that is physically absent or locked, and a wait would hold the lane with no
  runnable work. Steps 3's phone half, 4's remaining checks and step 5 stay
  outstanding; step 5 is deliberately not run out of order because its content
  quotes the run's incidents (step 3's Metro verdict, the XS loop's results) and
  would have to be rewritten after the devices return.
- R4.5 ruling (agent-ruled, 2026-10-16): the requirement holds on the
  registered-task half plus the live native scheduling trace, and the plan's two
  named Pino capture targets are unreachable by design, not by defect. Why:
  `shared/logger.ts` disables Pino when `EXPO_PUBLIC_ENV` is prod or preview,
  and the plan's own D111.5 orders the prod build, so no real-API build can emit
  those lines; a mock/dev build would emit them but proves nothing about the
  prod refresh path. The observables recorded stand as R4.5's evidence.
- XS captures re-read by this session (the lane verifies, it does not trust):
  `01-first-launch.png` shows the rendered schedule (Magrib next, 56m, London,
  UK, Fri 16 Oct 2026, Fajr 05:51 off, Asr 15:31 sound), `06-home-a.png` shows
  the reachable home page carrying no Athan widget, and `back-loader.png` shows
  the English loader from the return switch. R4.1, R4.3 and R4.4 stand as
  recorded.

### Step 3 — R3.1 the 3T release build: FAILED, and why (upstream defect + npm drift)

- `zsh $HOME/athan-gitree/bin/build-prod.zsh uat .../sessions/111/3t/athan-uat-prod.apk`
  under `build.lock` at 18:27 against uat `8a44f0ab` (2.0.885): prebuild and Gradle ran
  11m 9s and **failed** — `BUILD-PROD FAILED: gradle exited 1`, no APK produced. This is
  the first Android build attempted on the re-pin, so R3.1 is RED.
- The failure: `> Task :expo-widgets:compileReleaseKotlin FAILED`, 16 `Unresolved reference`
  errors inside the package's own `notifications/CustomNotification*.kt` files, for example
  `CustomNotifications.kt:6` `import io.github.jakex7.peek.notification.PeekNotificationViews`.
  Our patch does not touch those files (`patches/expo-widgets+58.0.19.patch` carries five:
  the Hermes runtime cpp, `ExpoWidgetEmittableTree.kt`, `WidgetsJSRuntime.kt`, the jni
  runtime, and the iOS Swift), so the failure is upstream, not ours.
- Root cause measured from the published packages: `expo-widgets@58.0.19`'s Android source
  imports `io.github.jakex7.peek.*`, while the dependency it declares at
  `android/build.gradle:147` is `io.github.expo.peek:peek-emittables:0.3.2`, whose classes
  are packaged as `io.github.expo.peek.notification.*`. The namespace moved to
  `io.github.expo.peek` and 58.0.19's source was not moved with it, so the module cannot
  compile. `expo-widgets@58.0.20` (npm `latest`) carries the corrected
  `io.github.expo.peek.*` imports; `58.0.19` is a broken release.
- npm drift measured at this step's start, every one published after the plan was written
  and after step 1 merged: `expo` `latest` is `58.0.13` (published 2026-10-16T15:43Z; the
  plan pins `58.0.12`, published 06:23Z) and `expo-widgets` `latest` is `58.0.20`
  (published 15:42Z; the plan pins `58.0.19`, published 06:22Z). `react-native` `latest` is
  still `0.88.0`. expo 58.0.13's `bundledNativeModules.json` moves 17 of its 124 pins past
  the plan's table, among them expo-widgets `~58.0.20`, expo-location `~58.0.17`,
  expo-modules-core `~58.0.21`, expo-notifications `~58.1.5`, expo-router `~58.0.22` and
  `@expo/ui` `~58.0.20`.
- Verdict (agent-ruled, 2026-10-16): the ticket is **NEEDS REPLAN**, on the plan's own
  section 2.2 — "npm drift ... STOP and report; that is a NEEDS REPLAN, never an improvised
  re-measure". Why: the plan's pin table, its anchors and R1.1/R1.2 name exact versions that
  are now behind npm; one pinned package is upstream-broken at the version the plan chose;
  and the row-18 ride-`next` policy orders the newest at every attempt. The repair is a
  re-pin of the whole set, with all three patches rebuilt and the device proofs re-run
  against it, not a one-package bump. The replan must re-measure the patch apply status at
  the new versions rather than carrying the plan's 58.0.16 / 58.0.19 findings forward.
- Not run, because the re-pin invalidates them: the Metro env re-verify, the 3T install and
  alarm gates, and the remainder of the XS loop. Each would prove a property of a pin set
  that is about to move.

### Ticket state at the lane's stop (2026-10-16) — NEEDS REPLAN

- Steps 1 and 2 are merged and hold R1.1 to R1.7 and R2.1 for the pin set they name. That
  pin set is no longer the newest, and its expo-widgets cannot build Android.
- Step 3: R3.1 red on the Android build (above); R3.2 to R3.4 not attempted.
- Step 4: R4.1, R4.3 and R4.4 green with captures re-read by this session; R4.2 green on
  recovered evidence (the captured delivery watcher output); R4.6 partial (the reachable home
  page carries no Athan widget, the lock screen never observed); R4.5 ground only, closed by
  the ruling above; R4.7 and R4.8 not observed.
- Step 5: not run; its content quotes the run's incidents and the replan rewrites it.
- Instruments at the stop: the OnePlus 3T is connected (adb serial `3T_SERIAL`;
  `settings get global auto_time` reads 1) and its gate is open. The owner's iPhone XS is
  still locked, and `agent-device prepare ios-runner` still refuses with "the device must
  be unlocked", so the XS gate is closed until she unlocks it.
- Resume after the replan: re-execute step 1's shape against the new pin set, then the 3T
  gates, then the XS loop once the phone is unlocked, then step 5.
- Audit: the three reviewers (plan-conformance, blind, threading) ran over the landed code
  range `bc9699d3^1..5966e95b`; `AUDIT.md` records every finding with its verdict. Four are
  fixed here: the patched `expo-location` pin back to exact (it was exact before this change,
  the plan loosened it to `~58.0.16`, and A7's three-tick contract cannot survive a tilde with
  58.0.17 already on npm), the stale patch filename in the widget patch suite's docstring, the
  `biome.json` schema URL, and the three-tick re-proof from a fresh install. Three are carried
  to the replan with their reasons: the consumed anchors in `preflight-111.sh`, the step file's
  missing script entry, and the threading pass's three patch and guard items.
- The re-pin's own version is recorded rather than repaired: `addc75bb`'s subject says 2.0.861
  while its tree and its parent carry 2.0.863, so that merge changed no version and
  `wasAppUpgraded()` could not see it. 2.0.863 was never a shipped build and the next commit
  restored monotonicity at 2.0.865; a retroactive bump would rewrite merged history, which the
  hard rules forbid.



## Refresh (2026-10-16, lane session) — NEEDS REPLAN repaired

- Entry phase: Plan (the refresh). The row's NEEDS REPLAN reason is measured and stands: the first
  Android build on `expo 58.0.12` failed at `:expo-widgets:compileReleaseKotlin` (16 unresolved
  `io.github.jakex7.peek.*` references; 58.0.19 is broken upstream, 58.0.20 fixes it), and npm
  moved to `expo 58.0.13` (2026-10-16T15:43Z) and `expo-widgets 58.0.20` (15:42Z). The plan's own
  section 2.2 forbids an improvised bump, so the whole set was re-measured.
- Re-measured in this lane's worktree (`$HOME/athan-gitree/worktrees/lane-111-replan`, uat
  `fece11d3` 2.0.896) with the raw logs under `$HOME/athan-gitree/sessions/111/replan/`:
  - `expo@58.0.13`'s `bundledNativeModules.json` (124 entries) moves 17 pins against 58.0.12's.
    Of the packages this repository declares, eight direct pins move (expo, @expo/ui,
    expo-haptics, expo-location, expo-notifications, expo-router, expo-splash-screen,
    expo-widgets) and two transitive pins follow from expo's own dependencies (babel-preset-expo
    ~58.0.16 to ~58.0.17, expo-modules-core ~58.0.20 to ~58.0.21).
  - Candidate install at the eight pins: exit 0, zero peer warnings, resolved expo 58.0.13,
    expo-widgets 58.0.20, expo-location 58.0.17, @expo/ui 58.0.20, expo-notifications 58.1.5,
    expo-modules-core 58.0.21, expo-router 58.0.22, expo-haptics 58.0.7, expo-splash-screen
    58.0.10, react-native 0.88.0.
  - `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0 (444 files);
    `npx jest --watchman=false` 34.9 s: `Test Suites: 1 failed, 215 passed, 216 total`,
    `Tests: 2 failed, 2 skipped, 5704 passed, 5708 total`. The single red suite is
    `shared/__tests__/widgetOpenAppPatch.test.ts` (`names the installed expo-widgets version`,
    `patches exactly the known files, all inside the package`), red only because the patch file
    is still named for 58.0.19; regenerating it at 58.0.20 greens both.
  - Patch apply status at the new packages, measured twice (published tarball file lists and the
    installed tree): all three patches apply WHOLE, no rejected hunk. `expo-widgets` 58.0.19 to
    58.0.20 changes CHANGELOG, android/build.gradle, WidgetsModule.kt, the four
    notifications/CustomNotification*.kt files, package.json and scripts/build-layout-registry.mjs
    - not one of the five files the patch carries. `expo-location` 58.0.16 to 58.0.17 changes
    CHANGELOG, android/build.gradle, LocationTaskConsumer.kt, the local-maven-repo version
    directory and package.json - not one of the three files the patch carries.
    expo-background-task is unchanged at 58.0.11.
  - Babel 8 rider re-measured, still blocked: `@babel/core` 8.0.7 is latest;
    `babel-preset-expo@58.0.17` depends on 36 `@babel/*` 7.x packages (including
    `@babel/preset-typescript ^7.23.0`) and `@react-native/babel-preset@0.88.0` depends on
    `@babel/core ^7.25.2`. The four `@babel/*` devDependencies stay at `^7.29.x`; step 4 records
    it and the row 18 policy carries.
- Refresh written: `PLAN.md` rewritten (target table, patch table, Babel rider, the landed truth,
  the carried audit findings, the XS precondition, the acceptance criteria), the step set rebuilt
  as four steps (the landed freshness step is gone; the step-1 shape is now the delta re-pin plus
  the audit hygiene), the anchor set rebuilt to assert step 1's starting state, and
  `scripts/preflight-111.sh` rewritten to check the new target table and to stop counting the
  anchors (the first attempt's audit finding 1).
- Landed truths carried rather than redone: steps 1 and 2 of the first attempt are merged
  (`bc9699d3` 2.0.863, `5966e95b` 2.0.869) and their invariant work stands; R4.5's ruling
  (D111.17) stands; R4.1, R4.2, R4.3 and R4.4 were greened on the superseded pin set and step 3
  re-runs them; R4.6 is partial and R4.7 and R4.8 were never observed.

### Grill (2026-10-16) — 14 findings, all adjudicated and applied

- One cold `athan-plan-griller` pass over the refreshed folder. It confirmed the anchors (7 of 7
  counting 1 at uat `fece11d3`, inside the 3-to-15-line band), `PLAN OK`, the ten npm `latest`
  values, the eight-plus-two pin delta and the patch file lists from the published tarballs.
- Applied (four musts): the XS build env gains `EXPO_PUBLIC_IOS_WIDGETS=1` and an inline
  `DEVELOPMENT_TEAM`, because `app.config.ts` strips the widgets plugin without the first and
  Xcode holds no live account session for the second (the atlas records both) - otherwise R4.6 is
  unobservable on that build. The red-capture block moved behind contract 2, because at uat's pins
  the patches match the installed packages and the named suite passes; the red only exists once the
  new pins are in. Step 3's precondition now uses the atlas's measured runner command and the
  `lockState` probe this session ran. R3.4 is restated as the Jest suite it is
  (`shared/__tests__/widgetRuntimeLoads.test.ts`), with the logcat clause dropped: those lines are
  Pino and a prod build disables Pino.
- Applied (five shoulds and two nices): R3.2 now claims only what the bare `check:device` run
  proves (its prayer-time judgement needs an `expected-times.json` this repository has no generator
  for); R3.5's md5 clause no longer contradicts the step's "either outcome" text and gains R3.6 for
  the mock marker; the verify script's docstring rename joins contract 5; step 2's Restore states
  one outcome; R4.7 records "not exercised" when her configuration arms no reminder rather than
  touching ask-first scheduling ground; the background-task symbol is nine lines, not eight; and
  the carried findings are six, not five.
- Also split R1.10, R1.11 and R3.5 into single-clause IDs (R1.10 to R1.13, R3.5 and R3.6).
- Post-grill additions by the lane: step 2 opens with the main tree's `node_modules` refresh
  (`build-prod.zsh` links the build worktree's `node_modules` to the main checkout's), step 3's
  Restore uninstalls the runner's two helper apps, and the pre-flight stops requiring the checkout
  to be literally on `uat` so a lane worktree can run it.
- Gate: `bash scripts/check-plan.sh ai/plans/111-sdk58-stable-repin` -> `PLAN OK`.
