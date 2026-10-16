# LOG 111

Resume from: step 3, the owner-ordered iPhone XS deep-dive loop, and its one condition is the
owner unlocking her phone. Steps 1 and 2 are merged: the `expo 58.0.13` re-pin is on uat and the
OnePlus 3T's release build is green, so nothing else in the ticket waits on hardware. Run the
step's precondition first (`xcrun devicectl device info lockState --device IPHONE_UDID` must
answer, and `AGENT_DEVICE_IOS_TEAM_ID=$TEAM_ID agent-device prepare ios-runner --udid
$IPHONE_UDID` must prepare); while the phone is locked both fail with the RSD allocation error and
the step returns to this note. Then step 4's records, then the audit and DONE.

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

### Step 1 — DONE (the replan run: the delta re-pin, three patches regenerated, the carried hygiene)

- Branch `dep/111-repin-5813` off uat `092a98ff` (2.0.901), created in the lane worktree
  `$HOME/athan-gitree/worktrees/lane-111-replan`.
- Pre-flight: `ai/plans/111-sdk58-stable-repin/scripts/preflight-111.sh` copied to `$TMPDIR` and run
  from the worktree -> `PREFLIGHT OK`. Clean tree, origin/uat merged in, version 2.0.901 >= floor
  2.0.896, the three starting patch files present, 7 anchor files non-empty, and every npm `latest`
  at the section 4.1 value (no drift): expo 58.0.13, react-native 0.88.0, expo-background-task
  58.0.11, expo-location 58.0.17, expo-widgets 58.0.20, @expo/ui 58.0.20, expo-notifications
  58.1.5, expo-router 58.0.22, expo-haptics 58.0.7, expo-splash-screen 58.0.10.
- Anchor check: `bash ai/plans/111-sdk58-stable-repin/scripts/anchors-check.sh` -> `ANCHORS OK`,
  a1 to a7 each counting 1.
- Contract 1 (the eight pins): moved by `sed` on the exact lines, byte-identical otherwise -
  `expo ~58.0.12`->`~58.0.13`, `@expo/ui 58.0.19`->`58.0.20`, `expo-haptics ~58.0.6`->`~58.0.7`,
  `expo-location 58.0.16`->`58.0.17`, `expo-notifications ~58.1.4`->`~58.1.5`,
  `expo-router ~58.0.21`->`~58.0.22`, `expo-splash-screen ~58.0.9`->`~58.0.10`,
  `expo-widgets 58.0.19`->`58.0.20`. Nothing else in `package.json` moved.
- Contract 2 (the red on the new pins): `yarn install --ignore-engines` exit 0; patch-package
  printed `expo-background-task@58.0.11 ✔`, `expo-location@58.0.16 ✔`, `expo-widgets@58.0.19 ✔`
  with the two version-mismatch warnings (58.0.16 applied to 58.0.17, 58.0.19 applied to 58.0.20)
  and no `**ERROR**` line; no peer warning beyond yarn's own two lowercase workspace ones.
  `shared/__tests__/widgetOpenAppPatch.test.ts` failed exactly the two named tests, `names the
  installed expo-widgets version` and `patches exactly the known files, all inside the package`
  (`Tests: 2 failed, 5 passed, 7 total`). Resolved on that install: expo 58.0.13, react-native
  0.88.0, expo-widgets 58.0.20, expo-location 58.0.17, @expo/ui 58.0.20, expo-notifications 58.1.5,
  expo-router 58.0.22, expo-haptics 58.0.7, expo-splash-screen 58.0.10, expo-modules-core 58.0.21,
  babel-preset-expo 58.0.17.
- Contract 3 (the three patches regenerated; no hunk hand-merged, every one applied whole):
  background-task - the `didRegisterTaskForTesting` static function and its docblock (10 lines with
  the blank separator) deleted from the installed `ios/BackgroundTaskScheduler.swift`, then
  `npx patch-package expo-background-task`; the regenerated `+58.0.11.patch` differs from the old
  file by that deletion alone plus the `index 906678b..712d728` -> `906678b..e6be88e` line of the
  file it touched. location - the `mLastAzimuth` declaration, its assignment in the magnetometer
  branch and its reset deleted from the installed `LocationModule.kt` (0 occurrences left),
  regenerated as `+58.0.17.patch` (3 file diffs, 8 hunks), old `+58.0.16.patch` deleted; every
  original marker kept (SENSOR_DELAY_GAME twice, the DEGREE_DELTA removal, kCLHeadingFilterNone,
  the `publication` block removal, the rate-limit comment). widgets - regenerated as
  `+58.0.20.patch`, `diff` against the old file exit 0 (byte-identical; 58.0.20 changes none of the
  five files), 5 file diffs, both features present (`openApp`/`launchAppAction`/
  `WidgetButtonProps.openApp` and the `__expoWidgetDeviceLocale` injection), old `+58.0.19.patch`
  deleted.
- Contract 4 (clean install, R1.3): `rm -rf node_modules/expo-background-task
  node_modules/expo-location node_modules/expo-widgets && yarn install --ignore-engines --force`
  printed exactly `expo-background-task@58.0.11 ✔`, `expo-location@58.0.17 ✔`,
  `expo-widgets@58.0.20 ✔`, no `**ERROR**` line and zero `version mismatch` lines.
- Contract 5 (the vacuous check, R1.10 first half): the script docstring now names
  `patches/expo-location+58.0.17.patch`; the `local-maven-repo` block and its else-branch deleted;
  the comment above the `publication` grep rewritten to say the `publication` block is what makes
  autolinking resolve the prebuilt AAR and its absence is the guard.
- Contract 6: `shared/__tests__/expoLocationPatch.test.ts` lost the `withMavenRepo` override field,
  its `mkdirSync` line and the `refuses a tree with a local maven repo` case; seven cases remain,
  and biome's formatter collapsed the `makeTree` signature onto one line (the only other hunk).
- Contract 7 (the new guard suite, R1.11): `shared/__tests__/backgroundTaskPatch.test.ts`, four
  cases reading the installed package in place - the offline option in `src/BackgroundTask.types.ts`
  and `build/BackgroundTask.types.d.ts`, the WorkManager constraint line in the Kotlin, the
  `request.requiresNetworkConnectivity` line in the Swift, and a package-wide grep for
  `didRegisterTaskForTesting`.
- Contract 8 (green): `yarn validate` exit 0 - tsc 0 errors, Biome clean, `Test Suites: 217 passed,
  217 total`, `Tests: 2 skipped, 5709 passed, 5711 total`, coverage `Statements 100% (5392/5392)`,
  `Branches 100% (2324/2324)`, `Functions 100% (1129/1129)`, `Lines 100% (4830/4830)`. `yarn test:tz`
  exit 0, four zones, 217/217 and `2 skipped, 5709 passed, 5711 total` in each. The three patch
  suites: `Test Suites: 3 passed, 3 total`, `Tests: 18 passed, 18 total`. The node line printed
  `58.0.13 0.88.0`; the seven: @expo/ui 58.0.20, expo-haptics 58.0.7, expo-location 58.0.17,
  expo-notifications 58.1.5, expo-router 58.0.22, expo-splash-screen 58.0.10, expo-widgets 58.0.20.
  `bash scripts/verify-expo-location-patch.sh` -> `PATCH AS SHIPPED` (R1.10).
- Contract 9 (the landed invariants untouched, R1.6, R1.7): `app.json` changed only its version
  line, so the `expo-notifications` plugin entry still carries `"enableRemoteNotifications": false`;
  `widgets/PrayerWidget.tsx` is not in this commit at all.
- Break script (verbatim, under the commit lock, from the worktree root): `0` then `0 ✔ lines` with
  the widgets patch moved aside; the named test FAILS (`Tests: 1 failed, 6 skipped, 7 total`); `1`
  after the patch came back; the background-task suite FAILS (`Tests: 1 failed, 3 passed, 4 total`)
  under the Swift mutation; passes again after the restore (`Tests: 4 passed, 4 total`); last line
  `ALL AS EXPECTED: 1`, exit 0. `git status --porcelain` afterwards listed only this step's files
  and the plan files.
- Mutation pass (the review checklist's fourth item, run on the installed package): every marker
  broken at once, so all four cases failed with their own message
  (`expect(received).toContain(expected) // indexOf` on the TS, Kotlin and Swift assertions and
  `expect(received).toBe(expected)` on the absence grep - `Tests: 4 failed, 4 total`), then the four
  files restored from byte copies and the suite green again (`Tests: 4 passed, 4 total`) with the
  before/after md5 lists identical.
- Version: uat read fresh under version.lock at 2.0.905 (the sibling lanes took 2.0.902 to 2.0.905
  while step 1 ran); this commit took 2.0.906 - `app.json` first, then `package.json`, then
  `versionName` in the main tree's gitignored `android/app/build.gradle` (which had lagged at
  2.0.898). Queue row 111 set `IN PROGRESS, step 1`.
- Lane weather: the main tree's uat advanced from 2.0.901 to 2.0.905 during step 1 (docs lanes
  120/121 merging), so this commit sits on the older base and a version-file conflict at the merge
  is expected and handled by the lane protocol. It fired: the first merge attempt conflicted on
  `app.json` and `package.json` alone (uat at 2.0.907), the merge was aborted, and the rebase onto
  uat resolved the two files to 2.0.908 - the next patch past the higher version - with the row-111
  cell and every other file replayed untouched.

session: ses_eba1b96b6ffe2uZ6oyyedZ7GqS

- Commit: `0118393a` at 2.0.908 - one commit, 11 files, +247/-103 (the rebase re-rolled `eb299ad9`,
  and its version-prefixed message was amended to match the resolved number). Its own hook
  (lint-staged, `yarn validate`, `check-changed-coverage`): `Test Suites: 217 passed, 217 total`,
  `Tests: 2 skipped, 5709 passed, 5711 total`, coverage `Statements 100% (5392/5392)`,
  `Branches 100% (2324/2324)`, `Functions 100% (1129/1129)`, `Lines 100% (4830/4830)`. A first
  attempt at the commit was refused by the coverage gate (the two changed/new suites were unstaged,
  and it measures the working tree), so the whole set was staged and the commit re-run.
- Break script's last line: `ALL AS EXPECTED: 1`.
- Review (a cold read of `git show eb299ad9` and the rebased `0118393a`): the eight pins and nothing
  else in `package.json` beyond the version; `app.json` only its version line; the row-111 cell only
  its state phrase, the record kept byte-for-byte; the widgets patch byte-identical under its new
  name; the location patch's three files and every original hunk intact; the background-task patch's
  single removed hunk; the script's renamed docstring, rewritten comment and deleted block; the seven
  remaining cases in the location suite; the four new ones. R1.9 reads as the installed tree: the
  regenerated location patch must carry `mLastAzimuth` on its four removal lines (the declaration,
  the assignment, the reset, and the upstream gate line that named it), because a removal hunk quotes
  what it removes, while `didRegisterTaskForTesting` is absent from the patch outright and
  `mLastAzimuth` is absent from the installed `LocationModule.kt` - the plan's own review item
  ("the installed `LocationModule.kt` carries no `mLastAzimuth`") is the reading applied. No
  lifecycle, thread, residue or rule class found in the diff.

- Merged: `9dd4eb6a` `2.0.908 - merge dep/111-repin-5813` into uat in the main tree under uat.lock.
  The retry merged clean, `ort` auto-merging `package.json` and `app.json` because both sides carried
  the same 2.0.908; uat was `723a6c32` (2.0.908, lane 121's docs merge) at the retry. Merged content:
  the eight pins of section 4.1, the version trio at 2.0.908, `"enableRemoteNotifications": false`
  present once, `strokeBorder({ content: palette.pillStroke, ... })` with no `color` parameter, the
  background-task patch free of `didRegisterTaskForTesting` and the location patch with no added
  `mLastAzimuth` line.
- Step checks on the merged re-pin: R1.1 `58.0.13`, R1.2 `0.88.0`, R1.8 the seven at their targets,
  R1.3 the three `✔` lines with no error and no mismatch warning, R1.4 `yarn validate` green at 100
  percent on four measures, R1.5 `yarn test:tz` green in four zones, R1.6 and R1.7 as above, R1.9 as
  above, R1.10 `PATCH AS SHIPPED`, R1.11 the new suite green, R1.12 and R1.13 the publication case
  and the mutation pass. The installed-package checks were measured in the lane worktree, whose tree
  is byte-identical to the merged commit; the main tree's `node_modules` refresh is step 2's opening
  action, not this step's.
- Locks: version, commit and uat locks all released; no worktree created by this step (the lane
  worktree is the lead's).

session: ses_eba1b96b6ffe2uZ6oyyedZ7GqS

### Step 2 — DONE (the 3T release build and its gates: R3.1 to R3.6)

- Main tree (the build bay), under `commit.lock` at 19:20: `git fetch -q origin uat && git checkout uat
  && git merge --ff-only origin/uat` -> already at `9dd4eb6a` (2.0.908). `yarn install
  --ignore-engines --force` exit 0 in 8.88 s, printing exactly `expo-background-task@58.0.11 ✔`,
  `expo-location@58.0.17 ✔`, `expo-widgets@58.0.20 ✔`, no `**ERROR**` line and zero
  version-mismatch lines; the only two warnings are "Workspaces can only be enabled in private
  projects" (`logs/install.log`). `node -e` printed `58.0.13 58.0.20`. The gitignored
  `android/app/build.gradle` already carried `versionName "2.0.908"`, so no edit was needed there
  and nothing was staged.
- R3.1: `zsh $HOME/athan-gitree/bin/build-prod.zsh uat .../3t/athan-uat-prod.apk` under
  `build.lock` 19:20:45 to 19:29:22 - exit 0, `BUILD-PROD OK`, 517 s wall, gradle
  `BUILD SUCCESSFUL in 8m 32s`, 1499 tasks executed. `> Task :expo-widgets:compileReleaseKotlin`
  ran clean (gradle log line 2080) - the task that failed in 11 m 9 s at 58.0.19 - and the
  identity line reads `EXPO_PUBLIC_ENV=prod, real API key present in the bundle (not printed),
  archs arm64-v8a`. APK 70 029 987 bytes, `com.mugtaba.athan` versionCode 1000000 versionName
  2.0.908, signer `fac61745…` (the owner's debug certificate), sha256 `029abb44…`
  (`athan-uat-prod.apk`, `athan-uat-prod.apk.build.txt`).
- The 58.0.19 failure log lived at `logs/athan-uat-prod.gradle.log`, the same path this successful
  run writes, so it was overwritten by the build itself; the failure stands quoted in this file's
  `### Step 3 — R3.1 the 3T release build: FAILED` entry above (12 `Unresolved reference` lines on
  `io.github.jakex7.peek.*`, `:expo-widgets:compileReleaseKotlin FAILED`, `BUILD FAILED in 11m 9s`).
- Install and launch: `adb -s 3T_SERIAL install -r` -> `Success`; `am start -W
  com.mugtaba.athan/.MainActivity` -> `Status: ok`, ThisTime 4845 ms; installed
  `versionName=2.0.908`, pid 22172. `auto_time` read `1` before the install and `1` after the
  gates; no clock change was made (`logs/install-apk.log`, `am-start.log`).
- R3.2: `yarn check:device 3T_SERIAL` exits 1 on one check only, its build-identity guard -
  `FAIL installed 2.0.908 is BEHIND the tree's 2.0.913` at 19:36 and `...2.0.915` at 19:38. Every
  other check PASSes in both runs: `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`,
  `POST_NOTIFICATIONS` declared (SDK 28), 24 notification channels with `extras_at_time_v3`
  present, an athan channel present, all 3 prayer channels carrying a sound, and `41 future prayer
  alert(s) armed (0 already fired)`. The guard fires because the sibling lanes carried `uat` past
  the commit this build proves while the step ran: `git diff --stat 9dd4eb6a..uat` is `app.json`,
  `package.json`, `ai/plans/README.md`, `.opencode/agents/athan-lane.md` - version lines and
  documentation, no application source. The script's own documented route for that comparison,
  `ALLOW_STALE=1 yarn check:device 3T_SERIAL`, exits 0: `installed 2.0.908 differs from the tree's
  2.0.915 (behind)` then `== all checks passed ==` (`logs/check-device-1.txt`, `-2`,
  `-3-plain.txt`, `-4-allow-stale.txt`). The far-future app alarm the script names on its `..`
  line is `2036-10-09 22:03  in 87506h 25m  ACTION_FORCE_STOP_RESCHEDULE` (epoch 2107199034081;
  8 such blocks in the dump). The epoch this plan names, 2104803640505, does not appear on this
  install.
- R3.3: the live `dumpsys alarm` app blocks read the 3T form - `window=0 repeatInterval=0 count=0
  flags=0x3` with an `Alarm clock:` sub-block carrying `triggerTime=` and a `showIntent`, tag
  `*walarm*:expo.modules.notifications.NOTIFICATION_EVENT`; 41 future prayer alerts plus one
  `WidgetRefreshReceiver` alert. Armed times recorded: 2026-10-17 01:53, 04:35, 04:40, 06:27,
  06:32, 13:05, 16:12, 16:37, 16:42, then 2026-10-18 01:43, 04:37, 04:42 … through 2026-10-21
  (`logs/alarm-grep-final.txt`, `alarm-final.txt`, `alarm-after-fetch.txt`).
- The armed table is production data, not the mock's: the alarm set was identical on all 24
  fifteen-second polls from launch (`logs/alarm-poll.txt`), 41 alerts spread over six days, and
  nothing armed near the 19:30 launch - a mock table's prayers sit either side of launch.
- R3.4: `npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false
  --selectProjects=unit` under `build.lock` - exit 0, `Test Suites: 1 passed, 1 total`,
  `Tests: 3 passed, 3 total`, 3.297 s (`logs/widget-runtime.log`).
- Widget observation (the step's own word: an observation, not a criterion): `dumpsys appwidget`
  before placement showed the eight Athan providers registered with `Widgets:` empty and
  `widgets.size=0`, and the home screen carried no widget (`home-screen.png`). The picker's first
  Athan cell (`Extra Times (Dark) 3×2`, long-pressed at the atlas's (234,460)) placed one:
  `widgets.size=1`, `id=2`, `provider=ExtrasWidgetDarkProvider / com.mugtaba.athan`. It renders
  the device locale's extras row with no loading placeholder - title `نصف الليل`, a countdown
  `4 س 20 د`, the target `00:00`, and the calendar line `6 جم` (`logs/appwidget.txt`,
  `appwidget-after-place.txt`; `picker-01/02/03*.png`, `widget-01-just-placed.png`,
  `widget-02-rendered.png`). The picker strip labels its first two cells `3×2` and `5×2` where
  `e2e/device-atlas-oneplus3t.md` records `2x2`/`4x2`; the strip order and the replay coordinate
  still hold, and no file was edited for it.
- R3.5, R3.6 (D111.11): two `npx expo export --platform android` runs under `build.lock` into
  `$TMPDIR/111-export-prod` and `$TMPDIR/111-export-mock`, both exit 0, differing in
  `EXPO_PUBLIC_ENV` alone. The plan's recipe sets that variable alone, and `app.config.ts` refuses
  `EXPO_PUBLIC_ENV=prod` without the key (`EXPO_PUBLIC_API_KEY is missing while
  EXPO_PUBLIC_ENV=prod`), so the key was read from `$HOME/.config/athan/.api_key` into both
  processes' environment and never printed. The two entry-chunk md5 lines: prod
  `entry-e4c4647cfee50da372526d947fb83df9.hbc` `afa8d8377bdb3692bc4bbeb46b928da4`; mock
  `entry-301ac79233a81a9e492b0be848dca144.hbc` `a3d4e28ff9ce15029b6c994877d7fa6e`. They DIFFER,
  so the changed `EXPO_PUBLIC_*` invalidated the transform cache instead of shipping stale bytes;
  on the plan's own reading the Metro env-blindness gotcha does not stand at this pin set, and
  step 4 owns the e2e README edit. The plan's `*.js` glob matches nothing because this project
  exports Hermes bytecode (`.hbc`); the mock chunk greps its marker (`grep -rl "mock"` names the
  mock entry chunk, 5 occurrences; the prod chunk carries `prod` 10 times as the control)
  (`logs/export-prod.log`, `export-mock.log`).
- Punctuality: NOT RUN, and not runnable inside this session. The next armed fire is
  `2026-10-17 01:53`, 6 h 14 m past the gate pass at 19:38, and no clock change is planned on this
  phone, so there is no fire to wait for here. Nothing fired and nothing failed, so this is not a
  miss; the armed time is recorded above and the notification capture (`dumpsys notification
  --noredact` plus logcat at the fire) is owed to whoever holds the phone past 01:53.
- Nothing in the repository changed: the main tree is clean and the lane worktree lists only this
  plan folder's `LOG.md` and `PLAN.md`; every lock is released; no screenshot or recording entered
  the repository. The 3T keeps the `2.0.908` production install - the release build this step
  exists to prove.

session: ses_eba0eef02ffezpNmvYPeSHi6rF

## Lane rotation 2026-10-16 — steps 1 and 2 done, step 3 waits on the owner's phone

- Plan (the refresh): merged `2dd1fe6a` (commit `e81457d5`, 2.0.901). The whole pin set was
  re-measured before it was re-pinned, the anchors were rebuilt to assert step 1's starting state,
  the pre-flight stopped counting them, and the first attempt's six carried audit findings became
  named contracts. One cold grill pass returned 14 findings; all were adjudicated and applied.
- Step 1: commit `eb299ad9`, rebased to `0118393a` at 2.0.908 after lane weather, merge `9dd4eb6a`.
  The eight pins moved to the `expo 58.0.13` set, the three patches were regenerated at
  58.0.11/58.0.17/58.0.20, `didRegisterTaskForTesting` and `mLastAzimuth` left the patches, the
  vacuous `local-maven-repo` check and its fixture were deleted, and
  `shared/__tests__/backgroundTaskPatch.test.ts` was added. Hook: `Tests: 2 skipped, 5709 passed,
  5711 total`, coverage 100 percent on all four measures. Clean install printed exactly three `✔`
  lines with no error and no version-mismatch warning.
- Step 2: the 3T release build and gates (see its own entry above).
- Step 3 (the owner-ordered XS deep-dive loop): NOT RUN. Measured by this lane 2026-10-16 19:00:
  `xcrun devicectl device info lockState --device IPHONE_UDID` fails with `Failed to allocate RSD
  device. ... error -402653181 (0xE8000003)`, the lock signature the first attempt recorded, and
  the phone cannot be driven by any agent step until the owner unlocks it. Nothing else in the
  ticket waits on hardware: R4.1, R4.3 and R4.4 were green on the superseded pin set and re-run
  there, R4.2 was green on recovered evidence, R4.6 was partial, R4.5's ground stands (D111.17) and
  R4.7 and R4.8 were never observed.
- Step 4 (records): waits for step 3, because its programme section quotes the run's incidents.
- Versions: `9dd4eb6a` changes no version, because lane 121's docs merge had taken 2.0.908 before
  the retry and the lane protocol resolves the version trio to the higher of the two (equal here).
  The class is the one the first attempt's audit recorded at 2.0.863; the next commit in this lane
  (this ledger commit) carries 2.0.909 and restores monotonicity. A retroactive bump would rewrite
  merged history, which the hard rules forbid.
- Plan repairs made during execution: R1.9 restated, because a removal hunk must name the symbol it
  removes, so the criterion now reads "adds no patch line naming the symbol and carries neither
  symbol in the installed sources".

Resume from: step 3's overnight windows on 2026-10-17 — the midnight rollover read (R4.8, the app
foreground through 00:00 Europe/London), the 3T punctuality capture at 01:53 (the staged script
`~/athan-gitree/sessions/111/3t/logs/capture-punctuality-0153.sh` self-locks), the lock-screen
widget read after midnight, and the Sunrise delivery window 07:15 to 07:30 (R4.2, R4.7). The
daytime checks are green and merged (see the step 3 entry below). Then step 4's records, then the
audit and DONE.

### Step 3 — IN PROGRESS (the XS loop, daytime checks green; overnight windows staged)

- Precondition: row 124's fix holds. `xcrun devicectl device info lockState --device IPHONE_UDID`
  answers (`unlockedSinceBoot: true`), and `AGENT_DEVICE_IOS_TEAM_ID=$TEAM_ID agent-device prepare
  ios-runner --udid IPHONE_UDID` prepared the runner. XS device lock named by UDID, released
  between contact phases so sibling lanes interleave.
- Build (main tree, uat 2.0.924 content, node_modules at the re-pin set): prebuild plus `expo
  run:ios --configuration Release --device` under build.lock, 20:54 to 21:02, `Build Succeeded`,
  Athan.app and the ExpoWidgetsTarget appex installed and launched. Generated Info.plist
  re-verified: UIBackgroundModes fetch+processing, the backgroundtask registration present, no
  `remote-notification` entry. Captures: `xs/build2-prebuild.log`, `xs/build2-runios.log`.
- R4.1 GREEN (clean second open after the throwaway first launch): fresh PID alive, the schedule
  renders "London, UK / Sat, 17 Oct 2026 / Fajr 8h 46m" with rows Fajr 05:52 (off), Sunrise 07:25
  (silent), Dhuhr 12:51 (silent), Asr 15:30 (sound), Magrib 18:06 (silent), Isha 19:29 (silent);
  no overlay, no crash; the countdown ticks between reads. Captures: `xs/21-r1-coldstart.png`,
  `xs/21-r1b-secondopen.png`.
- R4.3 GREEN (compass stream at the new pin set): qibla sheet opened via taps (Settings, Qibla
  row at (187,370)pt); a bounded 40 s unified-log window measured 8,346 locationd
  `kCLConnectionMessageHeading` messages and 4,196 `Athan{CoreLocation}` delegate invocations,
  about 105 a second, the unfiltered rate the location patch's `kCLHeadingFilterNone` buys and the
  same rate the first attempt measured. Captures: `xs/21-r3-qibla-sheet.png`,
  `xs/21-r3-syslog.txt`.
- R4.4 GREEN both directions: to العربية the relaunched schedule renders Arabic RTL from frame
  one with the real times unchanged; back to English a screenshot burst on the tap caught the
  loader: full-screen purple, centred spinner, the target's own words `Setting English language`
  from its first frame, then the blank relaunch window, then the English schedule. No crash.
  Captures: `xs/21-r4-languagesheet.png`, `xs/21-r4-arabic.png`, `xs/21-r4-ar-languagesheet.png`,
  `xs/21-r4-back-burst-0..6.png`.
- R4.5 GREEN (D111.17's observable): the switch's relaunch window carries the
  `BGProcessingTaskRequest com.expo.modules.backgroundtask.processing` re-submission beside the
  live native trace `Got 64 pending notification`; the two Pino lines stay unreachable by design
  on a prod build.
- R4.6 home-screen half NOT REACHABLE, the wall the first attempt measured: every switcher
  dismissal and wallpaper tap lands back in the session app (three routes tried). The lock-screen
  half follows the midnight read. Captures: `xs/21-r6-home.png`, `xs/21-r6-switcher.png`,
  `xs/21-r6-home2..4.png`.
- R4.2 and R4.7 staged: her configuration leaves Fajr OFF, so the next armed delivery is Sunrise
  07:25 (silent); the window 07:15 to 07:30 captures it, with a reminder before it closing R4.7 if
  her config arms one (else not-exercised per the step's rule). R4.8 staged: the app foreground
  through midnight, read at 00:00.
- Tooling note: the agent-device MCP daemon lacks the team env (the recorded trap); all driving
  went through the CLI with the team env exported.

session: ses_eb9bcd72effe5IZ6n6qJftXcb6
