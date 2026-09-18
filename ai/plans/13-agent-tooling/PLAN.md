# Plan: Session 13. Agent tooling: @expo/agent-cli, dev-launcher niceties, Device Hub

| Field | Value |
| --- | --- |
| Brief | `ai/plans/SDK58-PROGRAMME.md` §13 |
| Planned at | `423e2db1` (version 1.27.234), 2026-09-18 |
| Planned by | Planning session on 2026-09-18, GLM 5.3 |
| Needs first | 6 |
| Steps | 3, each one branch, one commit, one version, in `steps/` |
| Device | none on the OnePlus 3T; iOS simulator `AB4F4466-05CC-4C7F-A451-187E1DC6C6A0` (iPhone 17 Pro Max) only |
| Owner decisions still needed | None. The owner was away for the whole of this planning session; every decision the brief leaves to the owner was taken as an AUTONOMOUS RULING, recorded in section 2.1, in the FINDINGS file step 1 writes, and in `ai/prompts/README.md` by the auditor, so the owner can revisit each one. |

## 1. Goal

`ai/plans/SDK58-PROGRAMME.md` §13 asks three things: investigate `@expo/agent-cli` and record honest
results of `status` and `smoke` against this repository; decide adopt or shelve and write that
decision down, with a devDependency decision either way; and document the `expo-dev-launcher`
launch URL (verified on a dev build) and the Device Hub location in the tooling guidance. Today
none of that exists: the changelog line that announced `@expo/agent-cli` is unverified here, the
dev-launcher's `disableFab` and `disableAutoLaunch` params (present in the installed
`expo-dev-launcher` 58.0.3 source) are written nowhere a future session would find them, and
Device Hub is only a note inside a long memory entry. When this plan is DONE, `AGENTS.md` and
`ai/AGENTS.md` §6 carry the guidance, `ai/features/agent-tooling/FINDINGS.md` holds the measured
results and the rulings, and the app's code, tests and behaviour are untouched.

The owner's rules that apply, quoted:

- 🐋  "Install nothing permanently unless it proves useful; run via npx first. `status` and
  `smoke` against this repo; record honest results (beta software)." (brief §13, Scope 1)
- 🐋  "Decision: adopt or shelve, with reasons. If adopt: npx-based usage documented in
  `ai/AGENTS.md` Tool Routing (it must sit alongside the existing MCPs and CLIs, discoverable by
  any future session), plus a devDep decision documented either way." (brief §13, Scope 2)
- 🐋  "Document the dev-launcher URL params (exact launch URL shape, verified on a dev build) in
  the same Tool Routing section, and the Device Hub location and caveat." (brief §13, Scope 3)
- 🐋  "AGENTS.md carries the guidance; `smoke` result recorded; zero app-code changes." (brief
  §13, Acceptance seeds)
- 🐋  "Never build on EAS and never push anything to it." (`ai/AGENTS.md`, EAS is read-only)

This is a documentation-and-investigation session. Every step writes markdown only. No file under
`app/`, `components/`, `stores/`, `shared/`, `hooks/`, `device/`, `widgets/`, `modules/`, `mocks/`
or `e2e/` changes, no dependency is installed, and the OnePlus 3T is not touched.

## 2. Decisions

### 2.1 Taken

The owner was AWAY and unreachable for the whole of this planning session (2026-09-18), and the
run's instructions forbade questions. Every decision the brief marks as the owner's was therefore
taken by the planner as an **AUTONOMOUS RULING**, recorded here and in the FINDINGS file step 1
writes; the auditor also records them in `ai/prompts/README.md` under "Decided autonomously by the
planner", so the owner can revisit any of them. Where this plan or the brief says "ask the owner",
the ruling stands and the session continues.

1. **AUTONOMOUS RULING: adopt `@expo/agent-cli`, narrowly.** The planner measured both commands
   against this repository on 2026-09-18: `status` exits 0 and answers in one screen what this
   programme otherwise assembles by hand (project shape, Expo Go compatibility, connected device,
   local build ability, next command); `smoke --ios` exits 0 after building the iOS dev client
   locally and reports zero runtime errors (planner baseline: 450.7 s end to end, the build phase
   413.8 s). The adoption is the documentation itself: three bullets in `ai/AGENTS.md` §6 "AI
   Tooling (project-scoped)" and one row in the root `AGENTS.md` "Tool Routing" table. Nothing is
   installed and nothing is wired into hooks or CI, and four commands are forbidden in sessions
   (`agents:setup`, `skills:sync`, `deploy`, every `--eas` flag) because they write agent and
   harness configuration or spend EAS credits. Revisit at session 16 (SDK 58 stable re-pin), when
   the package may have left beta.
2. **AUTONOMOUS RULING: no devDependency.** The brief's own scope rule is "install nothing
   permanently unless it proves useful; run via npx first". A pinned devDependency would drift
   behind `@latest` and put an experimental CLI into every `yarn install`; npx keeps it opt-in per
   session. Documented either way in the FINDINGS and in the `ai/AGENTS.md` entry. Revisit at
   session 16.
3. **AUTONOMOUS RULING: the dev build for the URL verification runs on the iOS simulator, not on
   the OnePlus 3T and not on the Android emulator.** The 3T holds the owner's installed app (mock
   1.27.227) and `smoke --android` would target it; the Android emulator path was attempted by
   the planner and is currently blocked (ruling 5), so it could not have served as proof anyway.
   The step 1 smoke run builds and installs the iOS dev client on the simulator, and step 2 reuses
   it. The Android form of the URL is source-verified (`DevLauncherController.kt` parses the same
   flags; the generated manifest registers `athan` and `exp+athan` on Android too) and is
   documented as source-verified, not device-verified.
4. **AUTONOMOUS RULING: the results live in `ai/features/agent-tooling/FINDINGS.md`.** The repo's
   precedent for research deliverables is `ai/features/<name>/` (moonsighting's
   `RESEARCH-FINDINGS.md`). The acceptance seed says "`smoke` result recorded"; this is the
   durable, audit-checkable place. The plan folder's `LOG.md` carries the execution log only.
5. **AUTONOMOUS RULING: out of scope, forbidden in this session:** `agents:setup` (writes
   user-home and project instruction files; `EXECUTOR-BRIEF.md` forbids touching OpenCode's or
   Claude's configuration, and a managed block in `AGENTS.md` is the owner's domain),
   `skills:sync` (creates symlinks under `.agents/skills/`, repo content beyond this session's
   scope), `status --explain`, `--build` and `--assert` (they ask EAS; EAS stays read-only and
   unbothered), every `--eas` flag (EAS Simulator sessions bill until stopped), `deploy` (EAS
   Hosting), `smoke --android` (the connected 3T would be the target), and `new`, `install`,
   `doctor`, `typecheck`, `runtime:*`, `navigate` and `dev` (the brief's two commands are `status`
   and `smoke`). The planner also measured that the local Android debug-build path is currently
   broken (`npx expo run:android --variant debug` fails twice over: the generated wrapper pins
   Gradle 9.3.1 while AGP's version-check demands 9.4.1, and with the wrapper moved to 9.4.1 the
   Kotlin plugin fails with "Cannot add extension with name 'kotlin', as there is an extension
   already registered with that name"); this is recorded in the FINDINGS as a machine note for the
   programme, is NOT fixed by this session, and is why no Android dev build is attempted.

### 2.2 The executor must not decide

STOP and ask the owner when:

- any anchor count is not 1;
- a check fails that the plan does not predict (the grep assertions in part 6, `tsc`, Biome, or
  the commit hook);
- a break prints `BREAK NOT APPLIED`;
- a reviewer finding that section 10 does not answer and that does not meet all three conditions
  in `EXECUTOR-BRIEF.md` section 4, item 8;
- `status` or `smoke` prints a line the plan's expected output does not list under "fixed lines"
  or "varying lines", or exits with a code the plan does not give;
- the simulator `AB4F4466-05CC-4C7F-A451-187E1DC6C6A0` is missing from `xcrun simctl list
  devices`;
- after step 1's smoke and the fallback build command in step 2, `com.mugtaba.athan` is still not
  installed on the simulator;
- the `vision` subagent answers anything other than the answer the plan predicts for a screenshot
  (the exact question is in step 2; ask once more before STOPping if the answer is a near miss);
- anything wants to touch the OnePlus 3T: the only permitted 3T commands in this whole plan are
  the read-only checks in section 7;
- any command asks for EAS credentials, proposes an EAS build or simulator session, or prints a
  suggestion containing `--eas`;
- anything the step does not answer that the executor would otherwise have to decide, with the
  question "The plan does not say `<X>`. What should it be?";
- anything touching visuals, prayer times, `releases.json`, `uat` or EAS.

## 3. Pre-flight

Saved to `$TMPDIR/preflight-13.sh` and run as `bash $TMPDIR/preflight-13.sh <k>`, where `<k>` is
the first step in section 6's checklist not ticked DONE (1 for a new plan). Expected end:
`PREFLIGHT OK`.

```bash
#!/bin/bash
# Pre-flight for session 13. Usage: bash preflight-13.sh <first-unticked-step>
set -u
k="${1:-1}"
fail() { echo "PREFLIGHT FAILED: $1"; exit 1; }

[ "$(pwd)" = "/Users/muji/repos/rn.athan.uk" ] || fail "not in /Users/muji/repos/rn.athan.uk"
branch="$(git branch --show-current)"
[ "$branch" = "uat-2" ] || fail "on branch $branch, not uat-2"

status="$(git status --porcelain)"
allowed="$(printf '%s' "$status" | grep -v -E '^( M|\?\?) (ai/plans/(README\.md|13-agent-tooling/(PLAN|LOG)\.md)|ai/plans/13-agent-tooling/scripts/)' || true)"
[ -z "$allowed" ] || { printf 'unexpected dirty files:\n%s\n' "$allowed"; fail "tree not clean"; }

git fetch -q origin uat-2 || fail "fetch failed"
git merge-base --is-ancestor origin/uat-2 uat-2 || fail "origin/uat-2 is not an ancestor of uat-2"

version="$(node -p "require('./package.json').version")"
echo "version: $version"
node -e "const a='1.27.235'.split('.').map(Number),b=process.argv[1].split('.').map(Number);process.exit(b>=a?0:1)" "$version" || fail "version $version is lower than the planning version 1.27.235"

row6="$(grep -c '| 6 | 12\. SDK 58 beta upgrade + alarmClock.*| DONE |' ai/plans/README.md)"
[ "$row6" = "1" ] || fail "needs-first row 6 is not DONE"

if [ "$k" -le 1 ]; then
  [ ! -e ai/features/agent-tooling/FINDINGS.md ] || fail "ai/features/agent-tooling/FINDINGS.md already exists"
fi
if [ "$k" -le 3 ]; then
  count1="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/13-agent-tooling/scripts/anchors/3-1.txt AGENTS.md)"
  [ "$count1" = "1" ] || fail "anchor 3-1 counts $count1 in AGENTS.md"
  count2="$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/13-agent-tooling/scripts/anchors/3-2.txt ai/AGENTS.md)"
  [ "$count2" = "1" ] || fail "anchor 3-2 counts $count2 in ai/AGENTS.md"
fi

simcount="$(xcrun simctl list devices 2>/dev/null | grep -c 'AB4F4466-05CC-4C7F-A451-187E1DC6C6A0')"
[ "$simcount" = "1" ] || fail "simulator AB4F4466-05CC-4C7F-A451-187E1DC6C6A0 not found"
pod --version >/dev/null 2>&1 || fail "CocoaPods missing"
node -v >/dev/null 2>&1 || fail "node missing"

echo "PREFLIGHT OK"
```

Any anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it is | This session |
| --- | --- | --- |
| `AGENTS.md` (repo root) | The harness-agnostic entry instruction file: critical rules, Quick Start, the "Tool Routing" table every session reads first | step 3 adds one row to the table |
| `ai/AGENTS.md` | The project memory. §6 "AI Tooling (project-scoped)" lists the project's MCPs and CLIs (skills, Expo MCP, Mobile MCP, Expo docs, Maestro, Flashlight, physical iPhone XS) | step 3 adds three bullets at the end of that list |
| `ai/features/agent-tooling/FINDINGS.md` | Does not exist | step 1 creates it, step 2 appends its section |
| `ai/plans/SDK58-PROGRAMME.md` §13 | This session's brief | read only |
| `node_modules/expo-dev-launcher` 58.0.3 | The dev launcher, a dependency of `expo-dev-client` 58.0.3 (a devDependency). Android `DevLauncherController.kt:144-151` parses `disableFab`, `disableAutoLaunch` and `disableOnboarding` from the deep-link URI via `hasEnabledFlag` (the value must be exactly `1`) and writes the dev-menu preferences. iOS `EXDevLauncherURLHelper.swift` parses the same flags, called from `EXDevLauncherController.m:426` on every app load; the package's own tests pin the URL shape `scheme://expo-development-client/?url=<encoded>&disableFab=1` with the flag on the OUTER link | read only; source of the documented facts |
| `node_modules/expo-dev-menu` 58.0.3 | The dev menu. iOS stores `EXDevMenuShowFloatingActionButton`, `EXDevMenuShowsAtLaunch`, `EXDevMenuIsOnboardingFinished` in the app's `UserDefaults` (visible as `com.mugtaba.athan.plist` in the simulator app container). The iOS FAB (`DevMenuFABView.swift`) is an opaque `Color.blue` circle with a white `gearshape.fill` glyph | read only; the plist is how step 2 proves the flags |
| `components/ui/SettingsButton.tsx` + `assets/icons/svg/settings.svg` | The app's OWN settings button: a translucent dark-purple circle with a hexagon-nut glyph, bottom-centre above the pager dots, in every build. It is NOT the dev-menu FAB, and the vision questions in step 2 say so, because the planner's first read of the screenshots mistook one for the other | read only |
| `android/app/src/main/AndroidManifest.xml` | Generated prebuild artifact (gitignored). Registers `athan` and `exp+athan` VIEW schemes on `MainActivity` | read only; proof the same URL works on Android |
| `.expo/` | Expo CLI's untracked state directory. agent-cli records its dev-server socket, its screenshots and `agent-cli-last-build.json` (the build record `status` reads) here | written by the tools the steps run; never committed |

### How the pieces interact

- `@expo/agent-cli` 1.0.16 (npm `latest` on 2026-09-18) wraps `expo`, `eas-cli` and `expo-doctor`
  as subprocesses. `status` probes locally (manifest, fingerprint record, `expo whoami`); it
  starts nothing. `smoke --ios` brings its own environment: it starts a dev server when none
  runs, builds the iOS dev client with `pod install` + `xcodebuild -configuration Debug` when no
  build is recorded for the current fingerprint (the planner's first run took 6.9 minutes; pods
  and build artifacts now exist on this machine, so later builds are incremental and faster), then
  opens the app on the simulator via the `athan://` deep link, reloads it onto the code on disk,
  collects runtime errors over a 3-second window, takes one screenshot under `.expo/agent-cli/`,
  and undoes what it started (dev server stopped; simulator left booted, app left installed).
- The dev client on the simulator is a debug build of this app plus `expo-dev-launcher`. Opened
  through `athan://expo-development-client/?url=<URL-encoded Metro URL>`, it loads the bundle
  from the dev server and the app's dev-mode mock data re-seeds on every load (Asr becomes the
  first whole minute at least 60 seconds after the download), which is how step 2 proves each
  link loaded the app from a fresh bundle. The flags persist device-side in the dev menu's `UserDefaults`.
- Metro serves on 8081. On the iOS simulator the Mac's loopback is the simulator's loopback:
  `127.0.0.1:8081`. On an Android emulator it would be `10.0.2.2:8081` (documented, not
  exercised; see section 2.1 ruling 5).
- A fresh dev install raises the app's notification-permission alert, which sits unanswered over
  the middle of the prayer list in every screenshot until someone taps it. Step 2's vision
  questions name it so it is never read as a dev-menu overlay.
- The OnePlus 3T (`8f7ada76`) is connected and `status` reports it. Nothing in this session
  writes to it; `smoke --android` is forbidden for exactly that reason.

### Concurrency table

| Caller | Before | After |
| --- | --- | --- |
| `npx @expo/agent-cli status` (step 1) | no dev server on 8081 | unchanged; the command starts nothing |
| `npx @expo/agent-cli smoke --ios` (step 1) | no dev server, dev client state as the planner left it (none recorded, none installed) | by end: dev server stopped again, dev client INSTALLED on the simulator, `.expo/agent-cli/` and `agent-cli-last-build.json` written |
| `npx expo start --port 8081` (step 2, background) | port 8081 free | serving during the step; stopped at its end |
| `xcrun simctl boot/openurl/launch/io screenshot/spawn defaults/shutdown` (step 2) | simulator shut, app absent | booted during the step; at its end the dev client is uninstalled and the simulator shut down again |
| adb (section 7 only) | 3T idle on mock 1.27.227, `auto_time 1` | identical; read-only commands only |

### Existing tests that cover this code

None apply: no code under test changes. The pre-commit hook still runs the full suite
(`jest --coverage` at 100% thresholds) and `scripts/check-changed-coverage.js --staged`, which is
why every step's commit must change exactly the files its part 3 lists.

### Why the obvious simple fix is wrong

- Adding `@expo/agent-cli` as a devDependency to "adopt" it properly: an experimental CLI's output
  format may change at any minor; pinning it into `yarn install` buys nothing npx does not give,
  and the brief's own scope rule forbids permanent installs.
- Running `agents:setup` to "wire it in": it writes managed blocks into `AGENTS.md`, creates
  `CLAUDE.md`, and installs plugins into the user home. That is the owner's and the harness's
  territory, and the standing rules forbid it.
- Fixing the Android Gradle wrapper while here: the wrapper lives in the gitignored `android/`
  prebuild output, both Gradle versions fail differently, and the fix belongs to whatever session
  owns the local Android build path (record the facts, change nothing).

## 5. Design

None. This plan changes no behaviour: no app code, no tests, no notification, data or schedule
logic. Its documentation-only invariant, stated for the audit: after the last step, a session that
reads `AGENTS.md` then `ai/AGENTS.md` §6 can run `npx @expo/agent-cli@latest status` and
`smoke --ios` correctly, knows the four forbidden commands, knows the dev-launcher launch URL with
its flags and what is and is not verified about them, and knows where Device Hub lives; and
`ai/features/agent-tooling/FINDINGS.md` holds the measured outputs that back every claim. A
design review is therefore not required (`PLANNER-BRIEF.md` §3 item 5 applies to behaviour
changes).

## 6. Steps

- [x] Step 1: `@expo/agent-cli` status and smoke against this repo, findings and rulings recorded (specified), step file `steps/1-agent-cli-findings.md` — DONE in `9836dac5`
- [x] Step 2: dev-launcher launch URL verified on the iOS simulator dev build, recorded (specified), step file `steps/2-devlauncher-url.md` — DONE in `006a574a`
- [x] Step 3: the guidance wired into `AGENTS.md` and `ai/AGENTS.md` (specified), step file `steps/3-tool-routing-docs.md` — DONE in `58839b07`

Each step is `(specified)`: the executor builds it from the contracts and verbatim texts the step
file carries. Read the step file in full before starting it.

## 7. Device proof

**The OnePlus 3T (`8f7ada76`) is not touched by this session.** No build is installed on it, no
clock change happens anywhere (so no `dumpsys alarm` safety read is needed), no taps, no
screenshots of it. At the end, confirm it is as the session found it, read-only:

```bash
adb -s 8f7ada76 get-state                                            # device
adb -s 8f7ada76 shell settings get global auto_time                  # 1
adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan | grep -m1 versionName   # versionName=1.27.227
```

The 3T being disconnected is fine: note it and continue. A different `versionName` means
something else changed the phone: STOP and ask. The phone stays on the mock build of 1.27.227,
which is the newest `uat-2` build (every commit since is documentation); no reinstall is needed
and none is run.

The simulator proof is step 2: every command, screenshot and `vision` read is specified there,
and its artifacts live under `~/athan-device-sweep/session13/`. At the end of step 2 the dev
client is uninstalled from the simulator and the simulator is shut down.

The owner receives no screenshots.

## 8. Records

- **Findings text.** Under the heading `# Session 13 of the queue: agent tooling, 2026-09-18` in
  `ai/features/uat-2/AUDIT-FINDINGS.md`, exactly this text, with the placeholders filled from the
  measured values:

  ```markdown
  # Session 13 of the queue: agent tooling, 2026-09-18

  The brief is `ai/plans/SDK58-PROGRAMME.md` §13. `@expo/agent-cli` 1.0.16 was investigated
  against this repository: `status` exits 0 with the project brief (SDK 58.0.0-preview.3, CNG,
  dev client, Expo Go not compatible, 14 reasons), and `smoke --ios` exits 0: it built the iOS
  development client locally (pod install plus xcodebuild Debug), booted the iPhone 17 Pro Max
  simulator, opened the app through the `athan://` deep link and reported zero runtime errors
  (planner baseline 450.7 s; the executor's run is in `~/athan-device-sweep/session13/`). The
  dev-launcher launch URL `athan://expo-development-client/?url=<URL-encoded Metro URL>` was
  verified on that dev build: each link loads the app from Metro (the dev mock re-seeds on every
  load) and the flags `disableFab=1` and `disableAutoLaunch=1` write the dev menu's persisted
  preferences exactly (`EXDevMenuShowFloatingActionButton`, `EXDevMenuShowsAtLaunch`,
  `EXDevMenuIsOnboardingFinished` read back from the app's plist). On iOS 26.5 scene-life-cycle
  builds the dev-menu FAB never renders at all, proven with the preference forced on, so
  `disableFab`'s visible effect there is nothing to hide; the Android form is source-verified
  only, because the local Android debug-build path currently fails (Gradle wrapper 9.3.1 against
  AGP's 9.4.1 floor; with 9.4.1 the Kotlin plugin double-applies), recorded as a machine note.
  The rulings (all autonomous; the owner was away): adopt narrowly with four forbidden commands,
  no devDependency, iOS simulator as the verification platform, findings in
  `ai/features/agent-tooling/FINDINGS.md`, the not-run list. The guidance landed in the root
  `AGENTS.md` routing table and `ai/AGENTS.md` §6, including the Device Hub location. Zero
  app-code changes; the 3T untouched, still on the mock build of 1.27.227.
  ```

- **Table rows.** The executor sets the `ai/plans/README.md` row to EXECUTED. The auditor, on
  PASS, sets the `ai/prompts/README.md` row 13 to:

  ```
  **DONE** 18 September 2026, <FIRST_VER> to <LAST_VER>: `@expo/agent-cli` 1.0.16 investigated (status exit 0; smoke --ios builds and gates the local dev loop with zero runtime errors), the dev-launcher launch URL verified on the simulator dev build (loads from Metro; flags write the persisted prefs exactly; the iOS 26.5 FAB never renders, proven with the pref forced on; Android source-verified, its debug build currently blocked by a Gradle/AGP mismatch), Device Hub documented; guidance in AGENTS.md + ai/AGENTS.md §6, findings in ai/features/agent-tooling/FINDINGS.md, zero app-code changes, five autonomous rulings recorded for the owner
  ```

  and the planning session already added the autonomous-rulings block to `ai/prompts/README.md`
  (under "Decided autonomously by the planner, 2026-09-18"): the auditor verifies it against the
  FINDINGS and fixes any drift, and adds nothing new.

- **Docs commit.** The executor's `executed` docs commit (section 4b of the brief) uses the
  message `<VERSION> - docs(plans): session 13 executed: agent tooling investigated, documented, rulings recorded`.

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session
pushes `uat-2` after a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `status` or `smoke` exits non-zero, or prints a line outside the plan's fixed/varying lists | beta software changed, or the machine state differs | copy the output into the FINDINGS verbatim, STOP and ask |
| `smoke` says it needs `--eas` | the machine lost local build ability (Xcode moved) | STOP; never pass `--eas` |
| `xcodebuild` fails inside smoke | first iOS build of the SDK 58 tree on a clean machine | copy the failing lines, STOP and ask |
| the simulator UDID is missing | simulators were pruned | STOP (section 2.2) |
| `simctl openurl` errors | the URL is malformed or the app cannot handle it | check the URL against step 2 verbatim; if it matches, STOP |
| the app does not re-seed after a link (step 2's plist or screenshot evidence contradicts a fresh load) | the link did not reach the dev launcher | STOP with the evidence |
| vision answers off-prediction | the screen differs from what the plan measured | re-ask once with the same question; still off: STOP with vision's exact words |
| Metro never prints its waiting line | port 8081 busy or the dev server failed | read `~/athan-device-sweep/session13/metro.log`; if another server owns 8081, STOP and ask |
| `grep -c '```'` in step 1 part 6 prints other than 4 | a pasted output contains a stray fence | fix the paste so the FINDINGS has exactly two fenced blocks; if a command's own output contains a fence, replace that line in the paste with the word `fence` and note it under the block |
| `tsc` fails with `position: "fixed"` errors in `Screen.tsx`, `Overlay.tsx`, `ActiveBackground.tsx`, `Explanation.tsx`, `Glow.tsx` | an Expo command (Metro, `run:ios`) regenerated the gitignored `expo-env.d.ts`, which pulls web CSS types into `ViewStyle` | `rm -f expo-env.d.ts` and run `tsc` again; the owner ruled the file stays deleted (session 12). Step 2 part 5 item 10 already does this |
| Biome or `tsc` fails | the docs edit touched something measured | STOP and ask; do not edit measured files to please a linter |
| anything else | see the general table in `EXECUTOR-BRIEF.md` section 7 | that table's action |

**Anticipated review fixes, word for word.** These are the only fixes the executor may make to
what the plan fixed, beyond those `EXECUTOR-BRIEF.md` section 4, item 8 allows:

1. Reviewer: "the FINDINGS output block does not match the log file." Fix: re-paste the block
   from `~/athan-device-sweep/session13/agent-cli-*.txt` so it is byte-identical (minus the
   `EXIT:` lines), changing no fixed wording around it.
2. Reviewer: "a placeholder survived (`<STATUS_OUTPUT>` and friends)." Fix: fill it from the
   measured values; if a measured value is unavailable, STOP instead.
3. Reviewer: "the inserted row or bullet has a typo against the plan's text." Fix: restore the
   exact text from step 3 part 5.

**Stopping part-way.** Per step:

- Step 1: delete `ai/features/agent-tooling/FINDINGS.md` and `rmdir ai/features/agent-tooling`
  when empty; `git checkout -- app.json package.json`; leave `~/athan-device-sweep/session13/` and
  `.expo/` as they are.
- Step 2: `git checkout -- ai/features/agent-tooling/FINDINGS.md`, `git checkout -- app.json
  package.json`; stop Metro if running; shut the simulator down if booted; screenshots stay in
  `~/athan-device-sweep/session13/`.
- Step 3: `git checkout -- AGENTS.md ai/AGENTS.md app.json package.json`.

`EXECUTOR-BRIEF.md` section 4a restores `app.json` and `package.json` in every case, and the
unfinished patch is saved first.

## 11. Subagents in this plan

| Step | Agent type | Model | Isolation | Why | Prompt |
| --- | --- | --- | --- | --- | --- |
| 1 | `Code Reviewer` | GLM 5.3 | worktree | every commit, before its merge | step 1 file, part 9, with the sha filled in |
| 2 | `Code Reviewer` | GLM 5.3 | worktree | every commit, before its merge | step 2 file, part 9, with the sha filled in |
| 2 | `vision` | GLM 5.3 Flash | none (reads files) | the executor cannot see images; four screenshots | the exact questions in step 2 part 5 item 9 |
| 3 | `Code Reviewer` | GLM 5.3 | worktree | every commit, before its merge | step 3 file, part 9, with the sha filled in |
| finish | `Reality Checker` | GLM 5.3 | worktree | does the evidence prove each claim in the records text? | "Run git checkout --detach <merge sha of step 3>. Read ai/plans/13-agent-tooling/PLAN.md sections 7 and 8, ai/features/agent-tooling/FINDINGS.md, and the files under ~/athan-device-sweep/session13/. For each claim in the section 8 findings text, name the file and line that proves it. List any claim with no proof. That list is the whole reply." |
| any step | `Test Results Analyzer` | GLM 5.3 | none | only if a full-suite run fails in a way section 10 does not cover; the executor then STOPs | the failing log path |

Only the agents listed may be used. No `model` override: every subagent inherits GLM 5.3 except
`vision`, which runs on GLM 5.3 Flash. Where the harness offers no agent literally named
`Code Reviewer`, the `general` agent given the prompt above IS the Code Reviewer; that
substitution is the harness mapping, not a decision.

The `Reality Checker` runs once, after step 3's merge and before the `executed` docs commit
(`EXECUTOR-BRIEF.md` section 8): its list of unproven claims decides the records text. An empty
list: carry on to the docs commit with section 8's text as written. A non-empty list: STOP and
give the owner the list; the records text is not applied until every claim on it has its
evidence.

## 12. Report to the owner

The final message starts with `🤖  Model: GLM 5.3 (execution session)` and a `Time:` line from
`date '+%H:%M:%S %d.%m.%Y'`, then:

- a few plain sentences: `@expo/agent-cli` status and smoke measured, the dev-launcher launch URL
  verified on the simulator dev build, the guidance wired into both instruction files, zero
  app-code changes, the 3T untouched;
- the five autonomous rulings, each one line, flagged for the owner to revisit, and the Android
  debug-build blockage recorded as a machine note;
- the progress table:

| Task | Model | What it checks | Why it matters | Outcome | Status |
| --- | --- | --- | --- | --- | --- |
| Step 1: agent-cli findings | GLM 5.3 | status + smoke outputs recorded verbatim | the adoption ruling stands on measurements | <result, version> | ✅ done / 🔀 merged / 🚧 branch / ⏳ waiting / ❌ stopped |
| Step 2: dev-launcher proof | GLM 5.3 + vision (GLM 5.3 Flash) | the link loads; the flags write the prefs; the FAB control | the documented URL is verified, not copied | <result> | … |
| Step 3: routing docs | GLM 5.3 | both instruction files carry the guidance | future sessions find the tools | <result> | … |

- any decision now waiting on the owner (the five rulings);
- the four-line handoff from the `athan-next` skill, section 5.
