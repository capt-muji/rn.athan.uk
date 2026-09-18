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
