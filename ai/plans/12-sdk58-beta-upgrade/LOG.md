# Execution log: Session 12

Planning-session record, 2026-09-18 (GLM 5.3), for the auditor:

- **Design review** (required by `PLANNER-BRIEF.md` section 3 item 5; the delivery change touches
  notification behaviour): Software Architect (GLM 5.3), read-only, attacked the design. Verdict
  "design sound", 13 findings, all folded into the plan: iOS ignores the `delivery` key
  (`DateTriggerRecord` declares no field; records ignore undeclared keys); the alarm-count residual
  (no AOSP cap; `serialVersionUID` pinned so install-over deserializes; fleet already ran the full
  ~44-arm set) became proof row 7.3's count check; the status-bar alarm icon moved from
  "disclose after build" to an owner decision BEFORE execution (taken: all alerts anyway, icon
  accepted, cannot be hidden); nothing in the app benefits from alarm deferral; same-second
  collisions converge on the session-7 behaviour; the shade before/after proof pair was added (the
  seeded parity check cannot see the shade); bottom-sheet-on-gesture-handler-3 became a device check
  and a section 2.2 stop; the jest mapper must target file paths; `@react-native/jest-preset` must
  ride the wave (it is in step 1's table); `requestIdleCallback` is a semantic change (covered by
  proof 7.7); the 3T dumpsys baseline was corrected to `flg=0x5` → `flg=0x9`, `window=0` unchanged
  (the brief's "was windowed +1h" described the 8T/Find X8, not the 3T, per ISSUES #17's bare-expo
  control); the shared `ALARM_CLOCK_DELIVERY` constant; the `USE_EXACT_ALARM` Play-policy note
  carried to the records.
- **Spike** (scratch worktree `~/athan-device-sweep/worktrees/plan-12`, removed after planning): the
  whole wave plus every step's change was built and validated; `npx tsc --noEmit` 0 errors, `npx
  biome check . --error-on-warnings` clean, full suite 160 suites / 4533 passed + 2
  prebuild-dir-conditional skips (4535 of 4535 in a checkout holding `android/` and `ios/`),
  `TZ=America/New_York` green. The spike's patch is saved at
  `~/athan-device-sweep/session12/spike-wave.patch`; the worktree itself is deleted.
- **Owner decisions** (2026-09-18, recorded in `ai/prompts/README.md`): alarm-clock delivery for
  every notification; the status-bar icon cannot be hidden and stands; `largeIcon` is
  `icon-ios.png` with a before/after pair for the owner's own eyes; edge-to-edge kept at 1.8.2 with
  the built-in switch as its own later session; dependency scope strictly the SDK wave, the
  everything-to-latest sweep its own later session.
- **Environment refresh** (the row's old "Needs first"): macOS 27 and Xcode 27.0 were already the
  owner's; this session upgraded the `android-studio` cask 2024.3.1.13 → 2026.1.4.7 (the stale
  Caskroom copy blocked the upgrade; the old `/Applications` bundle went to the Trash via Finder
  after TCC refused the terminal an unlink) and verified build-tools 37.0.0, platform android-37.0
  and the commandlinetools cask current. The pre-flight checks all of it.

Execution-session record, 2026-09-18 (GLM 5.3):

- Pre-flight `bash $TMPDIR/preflight-12.sh 1`: `version 1.27.221`, `PREFLIGHT OK`. Row 6 set IN
  PROGRESS; branch `upgrade/sdk-58-beta` off `uat-2`.
- Step 1 red: the appended idle-callback test failed as the plan describes (`1 failed, 10 passed,
  11 total`, failing at `jest.spyOn(globalThis, 'requestIdleCallback')` because no idle pair exists
  on the SDK 57 tree). Jest 30.5.1's exact message is ``Property `requestIdleCallback` does not
  exist in the provided object`` rather than the plan's quoted "is not a function; undefined given
  instead"; same line, same cause (jest-mock words an absent property differently from a
  non-function one).
- Step 1 `yarn install` (after the package.json wave): exit 0, `Done in 22.49s`, lockfile saved.
  It printed unmet/incorrect peer warnings the plan's tables do not name (verified by grep over
  the plan folder). Installed versions checked one by one: every package resolves to exactly the
  plan's table (`expo` 58.0.0-preview.3, `expo-router` 58.0.4, RN 0.88.0-rc.0, reanimated 4.6.0,
  worklets 0.12.2, `jest-expo` 58.0.2, gesture-handler 3.2.1, pager-view 9.0.4, safe-area 5.9.1,
  screens 4.27.0, svg 15.15.5, performance 7.0.0, edge-to-edge 1.8.2, dev-client 58.0.3, audio
  58.0.0, widgets 58.0.3, @expo/ui 58.0.3, updates 58.0.5, task-manager 58.0.4, notifications
  58.0.3, jest-preset 0.88.0-rc.0). No wave drift. STOPPED per PLAN.md 2.2 ("yarn install warns of
  an unmet peer dependency the plan's table does not name. Ask with the warning's text") and asked
  the owner with the warning text.
- Owner ruling on the peer warnings (2026-09-18, via the question channel): packages that depend
  on each other move in sync; when an updated package has a peer that also needs updating, update
  it. Applied: `@expo/log-box@~58.0.3` and `@expo/metro-runtime@~58.0.3` (expo-router 58's direct
  peers), `@expo/dom-webview@~58.0.0` (@expo/log-box's peer), `react-dom@19.2.3` (exact match to
  the unchanged react 19.2.3; silences expo-router's radix-ui tab peers), all as dependencies, and
  `@react-native/metro-config@0.88.0-rc.0` (worklets' peer, exact match to RN) as a devDependency.
  Versions resolved from the registry with `npm view`. Final `yarn install`: exit 0, `Done in
  2.48s`, and the only remaining warnings are the three with no in-sync release to move to:
  reanimated 4.6.0 and worklets 0.12.2 declare `react-native@0.83 - 0.87` (they are SDK 58's own
  pins; no 0.88-aware release exists), and jest-expo's nested jest-watch-typeahead wants jest ≤ 29
  (jest 30 stays deliberately ahead per the plan). These five package.json rows go beyond step 1's
  table by the owner's ruling, recorded here for the auditor.
- Owner re-confirmed the five peer packages on 2026-09-18 via the orchestrator's question channel:
  KEEP ALL FIVE. Not revisited.
- Step 1 green: full suite `159 passed / 4531 passed, 4531 total` with four 100% coverage lines
  (exactly the plan's numbers); biome exit 0. `npx tsc --noEmit` FAILED with 8 errors in 5 files
  step 1's migrations do not cover: app/Screen.tsx(36), components/overlay/Overlay.tsx(119) x2,
  components/prayer/ActiveBackground.tsx(72) x3, components/prayer/Explanation.tsx(44),
  components/ui/Glow.tsx(27). Root cause isolated: the gitignored, generated `expo-env.d.ts`
  (present in this checkout, absent in the spike's bare worktree) references `expo/types`, whose
  SDK 58 `react-native-web.d.ts` unconditionally merges web CSS properties into RN's ViewStyle
  (`position` gains 'fixed'/'sticky'), so ViewStyle stops being assignable to View's style prop.
  Proven: `mv expo-env.d.ts expo-env.d.ts.hold && npx tsc --noEmit` exits 0 with 0 errors;
  restored afterwards. This is PLAN.md 2.2's "tsc error the plan's migrations do not cover" stop:
  asked the owner "The plan does not say what to do with a strict-types error in these files. What
  should it be?" with the findings. Owner ruling: DELETE `expo-env.d.ts` (gitignored, generated;
  not a committed change). Deleted; `npx tsc --noEmit` now exits 0. If an Expo command recreates
  it during the device proof, delete it again and note it here.
- Step 1 gates, in order: `yarn test:tz` four zones each `Tests: 4531 passed, 4531 total`, exit 0
  (run on the branch pre-commit; the version bump after it changes no test behaviour);
  `bash $TMPDIR/breaks-12-1.sh` printed `caught: idle scheduler`, `caught: cancel stops nothing`,
  `caught: mapper to nowhere`, `caught=3 missed=0`, `ALL AS EXPECTED: 1`; tree clean of break-bak
  files afterwards. Version 1.27.222 set in app.json, package.json, android/app/build.gradle.
- Step 1 DONE: branch `upgrade/sdk-58-beta`, commit `a7cad721` (1.27.222). Hook's last line:
  `Tests: 4531 passed, 4531 total` with `Statements 100% (3968/3968)`, `Branches 100% (1712/1712)`,
  `Functions 100% (826/826)`, `Lines 100% (3565/3565)`. Break script last line `ALL AS EXPECTED: 1`.
  Review verdict MERGE, Code Reviewer (GLM 5.3), one round, no findings (the five owner-ruled peer
  packages were checked against the committed LOG record and accepted as the plan's own escalation
  path working). Reviewer also re-ran the two List breaks and tsc/biome on the detached commit:
  all as specified. Post-merge on uat-2: tsc exit 0, biome exit 0, full suite 4531 passed. Merge
  sha `736da06d`.
- Step 2 red: both new delivery tests failed `Expected: "alarmClock" / Received: undefined`
  (`2 failed, 23 passed, 25 total`). Green: `25 passed, 25 total`; full suite
  `4533 passed, 4533 total` (the plan's number); tsc exit 0. Biome flagged one trailing blank
  line my appended block left at the end of the test file; removed (formatting only, code I wrote
  from the contract), biome then exit 0. Breaks `bash $TMPDIR/breaks-12-2.sh`: `caught: constant
  becomes bestEffort`, `caught: at-time delivery dropped`, `caught: reminder delivery dropped`,
  `caught=3 missed=0`, `ALL AS EXPECTED: 1`. Version 1.27.223 in the three files.
- Step 2 DONE: branch `feat/alarm-clock-delivery`, commit `3b7ebefd` (1.27.223). Hook's last line:
  `Tests: 4533 passed, 4533 total` with `Statements 100% (3969/3969)`, `Branches 100% (1712/1712)`,
  `Functions 100% (826/826)`, `Lines 100% (3566/3566)`. Break script last line `ALL AS EXPECTED: 1`.
  Review verdict MERGE, Code Reviewer (GLM 5.3), one round, no findings. Merge sha `a8ae4d70`.
- Step 3 red: the new suite failed exactly as predicted (`Expected: "./assets/icons/config/
  icon-ios.png" / Received: undefined`). After adding the largeIcon line, the suite passes
  (1/1) and tsc exits 0, but Biome rejects the line shape of ONE expression in
  `shared/__tests__/nativeConfig.test.ts`, whose content the plan gives verbatim: the plan wraps
  `const entry = (loadAppConfigFresh().plugins ?? []).find(` across three lines; Biome 2.5.13
  wants the find on one line with the cast wrapped (quoted in the question). The spike's own saved
  copy, `~/athan-device-sweep/session12/spike-nativeConfig.test.ts` (the version that passed every
  gate while planning), formats it exactly as Biome wants — the plan's transcription reflowed it.
  EXECUTOR-BRIEF section 7 ("tsc or Biome errors in code the plan gave verbatim: STOP and ask"):
  asked the owner. Owner ruling: APPLY BIOME'S LINE SHAPE to that one expression, tokens unchanged,
  the rest byte-identical to the plan. Applied; recorded for the auditor.
- Step 3 green: suite `1 passed, 1 total`; full suite `Test Suites: 160 passed, 160 total`,
  `Tests: 4534 passed, 4534 total` (the plan's numbers, the new suite is the 160th); tsc 0;
  biome 0 after the ruling. Breaks `bash $TMPDIR/breaks-12-3.sh`: `caught: largeIcon swapped`,
  `caught: largeIcon dropped`, `caught=2 missed=0`, `ALL AS EXPECTED: 1`. Version 1.27.224 in
  the three files.
- Step 3 DONE: branch `feat/notification-large-icon`, commit `ae92414d` (1.27.224). Hook's last
  line: `Tests: 4534 passed, 4534 total` with `Statements 100% (3969/3969)`,
  `Branches 100% (1712/1712)`, `Functions 100% (826/826)`, `Lines 100% (3566/3566)`. Break
  script last line `ALL AS EXPECTED: 1`. Review verdict MERGE, Code Reviewer (GLM 5.3), one
  round, no findings (it mechanically verified the sanctioned line-shape deviation is
  token-identical). Merge sha `e60532db`.
- Step 4 red: the new widgets test failed `Expected: true / Received: false` at
  `Array.isArray(nested(widget)?.supportedFamilies)`, step 3's test still passing (`1 failed,
  1 passed, 2 total`). Green: `2 passed, 2 total`; full suite `Test Suites: 160 passed`,
  `Tests: 4535 passed, 4535 total` (the plan's number); tsc 0; biome 0. Breaks
  `bash $TMPDIR/breaks-12-4.sh`: `caught: lock widget un-nested`, `caught: margins alias
  returns`, `caught=2 missed=0`, `ALL AS EXPECTED: 1`. Version 1.27.225 in the three files.
- Step 4 DONE: branch `chore/widgets-nested-ios-config`, commit `2d257511` (1.27.225). Hook's
  last line: `Tests: 4535 passed, 4535 total` with `Statements 100% (3969/3969)`,
  `Branches 100% (1712/1712)`, `Functions 100% (826/826)`, `Lines 100% (3566/3566)`. Break
  script last line `ALL AS EXPECTED: 1`. Review verdict MERGE, Code Reviewer (GLM 5.3), one
  round, no findings. Merge sha `d3405d4f`.
- Step 5 (docs-only, red skipped by design): the whole table was read back against package.json
  after the edits, every row agrees. Breaks `bash $TMPDIR/breaks-12-5.sh` printed exactly
  `caught=0 missed=0` and `ALL AS EXPECTED: 1`. Green: tsc 0, biome 0, full suite
  `Tests: 4535 passed, 4535 total`. Version 1.27.226 in the three files.
- Step 5 DONE: branch `docs/agent-md-sdk58-stack`, commit `b69db171` (1.27.226). Hook's last
  line: `Tests: 4535 passed, 4535 total` with `Statements 100% (3969/3969)`,
  `Branches 100% (1712/1712)`, `Functions 100% (826/826)`, `Lines 100% (3566/3566)`. Review
  verdict MERGE, Code Reviewer (GLM 5.3), one round, no findings. Merge sha `de7e8bb8`.

Device proof (section 7), 2026-09-18:

- 7.0 `yarn install` in the main checkout: `Done in 0.33s` (node_modules already matched the
  merged lock). Fingerprint policy: `npx expo config --type prebuild` exit 0, grep -i
  runtimeversion finds nothing (grep exit 1) — no runtimeVersion policy, as the plan predicts.
  `expo-env.d.ts` not recreated by the config read.
- 7.1 cold launch of the mock build at 13:41:30 (devcheck `cold`; its uiautomator read failed on
  the known countdown-animation limitation, irrelevant here). Shade opened and both before
  screenshots taken (shade-before.png 13:42:27, shade-before-open.png 13:42:28). vision
  (GLM 5.3 Flash) on shade-before-open.png: "No: the Athan notification's title 'Isha now' sits
  alone at the left margin with no square image or thumbnail beside it (unlike the WhatsApp
  notification above, which has a circular avatar). The only graphic is the small ~39×39 px app
  icon in the header row: a hollow, vivid-purple outline shape (RGB 90, 58, 247) resembling a
  badge/shield with a dome-like bump on top and a downward point at the bottom, placed left of
  the 'Athan • 4h' label." Expected baseline confirmed: no large square image, only the small
  glyph.
- 7.2 production build FAILED (the plan's section 10 row): `zsh
  ~/athan-device-sweep/session3/bin/build-prod.zsh uat-2
  ~/athan-device-sweep/session12/athan-sdk58-prod.apk` exited 1 after `BUILD FAILED in 4m 45s`
  (728 tasks executed). Quoted lines from
  `~/athan-device-sweep/session12/logs/athan-sdk58-prod.gradle.log`: "Execution failed for task
  ':tls13:checkReleaseAarMetadata' ... 1. Dependency ':expo-modules-core' requires libraries and
  applications that depend on it to compile against version 37 or later of the Android APIs.
  :tls13 is currently compiled against android-36. ... 2. Dependency ':react-native-worklets'
  requires libraries and applications that depend on it to compile against version 37 or later of
  the Android APIs." Root cause: this repo's own local Expo module
  `modules/tls13/android/build.gradle` line 10 hardcodes `compileSdk 36`; no plan step lists that
  file (the module's own modernisation is session 14, per SDK58-PROGRAMME.md). STOPPED and asked
  the owner, quoting the lines. Owner ruling (2026-09-18, via the question channel): "Bump tls13
  to compileSdk 37" — change the one token, commit it as its own version-bumped, reviewed commit
  on uat-2, and rerun the production build. Applied as commit `8c00a19a` (1.27.227, branch
  `fix/tls13-compilesdk-37`): `modules/tls13/android/build.gradle` line 10 `compileSdk 36` →
  `compileSdk 37`, nothing else in the module. Review round 1 returned "fix first: LOG.md does
  not record the owner ruling the commit message cites"; the fix was applied as an amended commit
  `8ecc2e35` (same change plus this ruling record in LOG.md), which round 2 approved with MERGE.
  MISHAP, disclosed for the auditor: the reviewer's `git checkout --detach` left the shared
  checkout on a detached HEAD, so the amend created `8ecc2e35` OUTSIDE the branch;
  `fix/tls13-compilesdk-37` still pointed at `8c00a19a`, and the merge into uat-2 (`d394faf9`)
  therefore carried `8c00a19a` — the compileSdk change and version bump, but not the amended
  LOG record. The ruling text was then restored into this LOG.md by hand (this paragraph), so
  uat-2's ledger carries everything `8ecc2e35` carried; `8ecc2e35` itself dangles unreferenced.
  Nothing else differs between the two commits (verified by `git show --stat` and the reviewer's
  own delta check).
- tls13 fix DONE (out-of-plan, owner-ruled): commit `8c00a19a` merged as `d394faf9`; review took
  two rounds as above. Hook: `Tests: 4535 passed, 4535 total` with all four 100% coverage lines.
- 7.2 rerun: `BUILD-PROD OK` on `d394faf9`, built 2026-09-18 14:32:04 BST in 328s, APK
  68,210,641 bytes at ~/athan-device-sweep/session12/athan-sdk58-prod.apk. R8 missing-class
  warnings: 0 (`grep -c "Missing class"` on the build log).
- 7.2 install: `adb -s 8f7ada76 install -r` of the 68MB APK hung TWICE (first attempt exceeded
  the 5-minute command timeout with the phone still on versionName 1.27.216; second attempt ran
  14+ minutes with an empty log while `adb shell` stayed responsive; process killed, log empty).
  The phone was NOT rebooted by the executor. Per EXECUTOR-BRIEF section 5/7 ("adb hangs twice:
  STOP and ask the owner to reboot the phone"): STOPPED and asked the owner. Owner rebooted the
  3T; on return the install HAD landed (the wedge flushed by the reboot): versionName 1.27.227,
  targetSdk 36 (recorded, not compared, per the plan), auto_time 1. Two throwaway cold launches
  followed; the first read shows REAL London data for 18 Sep (Fajr 05:06 ... Isha 20:26) with the
  owner's preferences (Fajr Sound, Asr Silent) — the release TLS fetch works with compileSdk 37.
  A stale uiautomator tree mid-proof claimed package com.mugtaba.athan.fleettest; dumpsys proves
  fleettest is NOT installed and the foreground app is com.mugtaba.athan 1.27.227 (the stale-tree
  trap from ai/AGENTS.md, met again).
- 7.3 first reading STOP (PLAN.md 2.2: "the dumpsys reading after adoption is not window=0 with
  flg=0x9"): our rows read `window=0 flags=0x3`, not 0x9. Investigated before asking: (a) the
  pre-existing alarms were persisted from the 1.27.216-era build, so I armed a FRESH one through
  the new build (Magrib's bell, at-time Silent, sheet close-to-save; the commit landed: "Magrib
  notification: silent"); the new rows (Magrib 19:11 today, 19:09 tomorrow) ALSO read flags=0x3.
  (b) The library path is intact (JS forwards delivery — scheduleNotificationAsync.ts:191;
  native parses it — NotificationScheduler.kt:180; ExpoSchedulingDelegate.kt:121 calls
  alarmManager.setAlarmClock). (c) The decisive evidence: EVERY armed notification alarm of ours
  (all 6 NOTIFICATION_EVENT entries) carries the dedicated `Alarm clock:` sub-block
  (triggerTime + showIntent into com.mugtaba.athan — the exact AlarmClockInfo the delegate
  passes), `window=0`, and the system's "Next alarm clock information" slot is our 16:18 alarm.
  On this Android 9 / OxygenOS dump, alarm-clock class shows as that sub-block and the
  next-alarm-clock slot; the `flags=` field carries no 0x8 bit (the plan's `flg=0x9` prediction
  came from ISSUES #17's Android-12-class dumps). Asked the owner with the finding. Owner ruling
  (2026-09-18): ACCEPT the `Alarm clock:` sub-block + next-alarm-clock slot as the alarm-clock
  proof on this phone, continue the proof. alarms-after.txt re-saved from the post-commit dump.
- 7.3 counts: the app's armament is 5 notification alarms (Asr 16:18, Magrib 19:11, Fajr
  05:09 tomorrow, Asr 16:16 tomorrow, Magrib 19:09 tomorrow — the 2-day rolling buffer for Fajr
  Sound, Asr Silent, Magrib Silent) plus the expected year-2036 FORCE_STOP_RESCHEDULE row (ours
  reads when 2105099857150 = 2036-09-15; the plan quoted 2104803640505 — same class, the
  timestamp depends on when it was set). The plan's logcat cross-count
  (`logcat -d -s ReactNativeJS | grep -c "Scheduled:"`) reads 0: the production build's Pino
  logger emits no ReactNativeJS lines at all (only "Running main" from Metro); the check is not
  measurable in a release build, recorded as such. grep -c "com.mugtaba.athan" on the raw dump
  counts 20 because the `Alarm clock:` sub-block lines and "Next wake from idle" repeat the
  package name; the row count above is from the per-block awk.
- 7.4 fire at the minute: clock ritual run (auto_time 0, `service call alarm 2 i64
  1789744640000` = 40s before Asr 16:18, app foreground). My first wait loop wrongly keyed on
  host time (device and host clocks differ), so the fire happened before the capture; the
  notification was still posted and captured at device 16:20. Shade expanded, fire-foreground.png
  taken. vision (GLM 5.3 Flash): "On the left side of the Athan notification there is no square
  image beside the title — 'Asr now' starts flush at the left margin, and the only square image
  (a mosque illustration on a purple gradient) sits on the notification's RIGHT side... the small
  icon... is a small hollow purple/indigo outline glyph shaped like a mosque silhouette inside a
  hexagonal badge." Title correct ("Asr now"), the mosque art square present (92×92px, measured
  x933-1025). Android 9 places the large icon on the right; the app only supplies the asset (the
  plan's "on the left" is iOS's convention). Logcat held only Telegram's NotificationsService
  lines; nothing of ours (release logger, as above). Clock restored: auto_time 1, device back at
  real time.
- 7.5 shade AFTER: shade-after-open.png captured with the Asr notification still posted. vision:
  same reading as 7.4 — mosque square present on the right, absent in the BEFORE pair. The
  before/after pair for the owner's own eyes:
  /Users/muji/athan-device-sweep/session12/shade-before-open.png and
  /Users/muji/athan-device-sweep/session12/shade-after-open.png — the owner looks at these two
  files and may order the large icon reverted (the icon sits where Android puts it; the ASSET is
  what the owner chose).
- 7.6 status-bar alarm icon: first shot caught the shade still open (retaken after collapse).
  vision on the clean shot (app visible, alarms armed): "Left cluster: time text, WhatsApp icon,
  badge/seal icon, bold 'P'. Right cluster: Wi-Fi fan, battery with lightning bolt. Alarm-clock
  icon anywhere in the status bar: NO." The 3T's OxygenOS does not surface the AlarmManager
  next-alarm-clock as a status-bar icon. A disclosure, not a gate (decision 2); recorded for the
  records text.
- 7.7 sheets and the re-measure: Settings sheet opens (the Masjid entry is the gear at bottom
  centre; the first shot hit the wrong icon and was retaken), renders correctly — vision: "a
  solid dark-navy sheet with a drag handle, 'Settings' title plus 'Set your preferences'
  subtitle and a gear icon, a Sound card ('Change athan' row...) and a Display card with four
  rows... No visual glitches." The sound selector opens ("Select Athan", Athan 1..6+ rows). The
  Asr alert sheet opens (Off/Silent/Sound + Reminder). All three under gesture-handler 3.2.1.
  Countdown-bar toggle: toggled off in Settings (verified off: the bar's accessibility node
  disappeared from the tree and vision found no bar between hero and "London, UK"), overlay
  opened on the Isha row, overlay-after-toggle.png captured. Pixel comparison: main list with
  bar off renders the Isha row at y 1403-1443; the overlay screenshot renders it at y 1402-1444 —
  the overlay points exactly at the tapped row's post-toggle position, so the idle-callback
  re-measure ran. The bar was toggled back ON afterwards and verified (green progress bar
  visible again at y298-304). No clock change in any of 7.7.
- 7.8 mock build: `BUILD-MOCK OK` (built 16:01:54 BST in 312s, APK at
  ~/athan-device-sweep/session12/athan-sdk58-mock.apk; the production APK also stays there for
  the audit). The first `install -r` wedged 21 minutes with an empty log and no lastUpdateTime
  movement; killed and retried once — the retry landed once the owner dismissed the Play Protect
  "Send app for a security check" dialog ("Don't send"; our own APK — that dialog was the wedge
  behind the earlier prod-install stall too). lastUpdateTime 16:38:08, versionName 1.27.227.
  One throwaway cold launch; vision on the final screen: the mock schedule is live (prayers a
  minute apart, Asr next at 1m 29s, blue highlight on Asr), no dialog or error in the way.
  Left behind: automatic time ON (settings get global auto_time prints 1), phone unlocked,
  Athan open on the mock build of the merged uat-2 head, Asr next at every opening.
- Records applied per section 8 with measured values and the two owner-ruled phrase adjustments
  (the `Alarm clock:` sub-block wording; the large icon "where Android places it (the right on
  the 3T)"). The row set to EXECUTED. `ai/prompts/README.md` untouched (the audit session owns
  it).
- Records wording STOP, in full: the plan's findings text is fixed prose with placeholders,
  but two measured facts contradict it: (a) it says "every armed alarm reads `window=0 flg=0x9`
  (was `flg=0x5`: exact before, alarm-clock class now)" — measured on the 3T: `window=0
  flags=0x3` with the `Alarm clock:` sub-block (the owner-accepted proof; the 0x9/0x5 flag
  readings are Android-12-class dump format); (b) it says "the mosque large icon on the
  notification's left" — Android 9 places the large icon on the right (92×92 square, measured).
  Writing the text as-is would be false. Asked the owner how to word the records. Owner ruling
  (2026-09-18): ADJUST BOTH PHRASES to the measured form, everything else verbatim; both changes
  recorded here for the auditor.
