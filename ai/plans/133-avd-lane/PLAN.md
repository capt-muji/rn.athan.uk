# Ticket 133: adopt one bounded AVD lane for the Android harness

| Field | Value |
| --- | --- |
| Brief | Queue row 133 (order 133). Her ruling, taken 2026-10-16 and written into the row: ADOPT one bounded AVD lane for the Android harness, smoke and disposable destructive checks only, never a measurement witness; the system-image install is agent-ruled lawful under the ask-first rule. |
| Planned at | `39812f50`, version 2.0.979, date 2026-10-17 |
| Needs first | nothing |
| Parent | none |
| Group | e2e/README.md and e2e/AGENTS.md, shared with open lane 122 until its DONE: this lane's docs step runs strictly after 122's DONE merge (gate inside step 5); every other step touches no repo file the sibling holds |
| Batch budget | 3 |
| Session budget | 13 |
| Steps count | 5 |
| Device | the AVD `athan-smoke-28` (created by step 1) and the OnePlus 3T (`3T_SERIAL`), Android 9, `com.mugtaba.athan` 2.0.908 installed |
| Owner decisions still needed | none (the ruling is taken in the row) |

## 1. Goal

What is wrong today: the Android harness drives a physical fleet only. Row 122's
evaluation named five experiments (E1 the serial install path, E2 the AVD boot
end to end, E3 the device-free failure text, E4 the logcat stream against a CLI
shutdown, E5 the flow replay) that wait on hardware, and her ruling adopts one
bounded AVD lane whose rules exist nowhere in the harness docs.

What is true when DONE: one AVD (`athan-smoke-28`, an Android 9 image at the
3T's measured panel class 1080x1920 at 420 density) exists on this host, boots
end to end, replays `e2e/flows/smoke.yaml`, and dies and reinstalls cleanly;
the CLI's serial install path is proven on the 3T with the 2.0.908 install and
its armed alarms untouched; the failure texts and the logcat-stream survival
are captured; and the lane's rules (smoke and disposable checks only, excluded
from every measurement claim, the image install ask-first) are written into
`e2e/README.md` and `e2e/AGENTS.md` after lane 122's DONE merge. The owner
notices the rules the next time any session needs an Android smoke check
without occupying a phone.

The owner's rules that apply, from queue row 133:

> HER RULING TAKEN: ADOPT one bounded AVD lane for the Android harness
> (smoke and disposable checks only, never a measurement witness; the
> system-image install agent-ruled under the ask-first rule)

and from row 122's record, the recommendation she accepted: one bounded AVD
lane at the 3T's panel for flow smoke and disposable destructive checks,
excluded from every measurement claim. `ai/AGENTS.md` binds the writing style,
the placeholders (`3T_SERIAL`), and the ask-first list (installing
dependencies, which the ruling makes lawful for this one image).

## 2. Decisions

### 2.1 Taken

| # | Decision | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D1 | The image is `system-images;android-28;google_apis;arm64-v8a`: the 3T runs API 28, so the AVD shares the floor device's OS class (the same Android 9 dialog and AX behaviour the harness habits already describe), google_apis keeps the Play services framework closest to the fleet, and arm64-v8a runs native on this host and matches the arm64-only APK. Challenge: a newer API (33) image buys a newer OS for free. Answer: rejected, the fleet already covers API 36 twice (row 122's option C) and the harness's gotchas are written for the Android 9 class; matching the floor keeps every habit transferable. | agent-ruled | 2026-10-17 | this section |
| D2 | The AVD is `athan-smoke-28`, panel 1080x1920, density 420, matching the 3T's measured panel (`wm size` and `wm density` read 2026-10-17), so the flow files in `e2e/flows/`, whose tap points are 3T panel coordinates, replay unchanged. | agent-ruled | 2026-10-17 | this section |
| D3 | No new atlas file: the atlas holds what the automation cannot reach, and the AVD is driven by the same automation (agent-device, mobile-mcp, Maestro); its identity, boot command and rules live in one `e2e/README.md` section. Challenge: the repo pattern is one atlas file per device. Answer: the pattern serves tap coordinates, and an empty atlas file is stale-file bloat the records rule kills; the 3T atlas's OEM rows (launcher, widget picker) are OxygenOS and never transfer to the emulator anyway. | agent-ruled | 2026-10-17 | this section |
| D4 | E1's vehicle is the existing prod APK at `$HOME/athan-gitree/worktrees/prod-build/android/app/build/outputs/apk/release/app-release.apk` (measured 2026-10-17: `com.mugtaba.athan`, `versionCode='1000000'`, `versionName='2.0.908'`, native-code arm64-v8a): reinstalling the same versionCode through the CLI's `adb install -r -d --user 0` keeps the owner's data and armed alarms and leaves `versionName=2.0.908` unchanged, honouring the dispatch's "its 2.0.908 install stays". | agent-ruled | 2026-10-17 | this section |
| D5 | E3 runs with a bogus serial on the live adb server plus an isolated adb server on port 5038 holding zero devices; the 3T is never unplugged (the agent has no hands) and the main server on 5037 is never killed. If the CLI ignores `ANDROID_ADB_SERVER_PORT`, the zero-device variant is recorded VOID with the observed output, not retried against the main server. | agent-ruled | 2026-10-17 | this section |
| D6 | E4 is proven on the 3T inside step 4 (the harness's real measurement streams are 3T logcat streams): the stream opens before the CLI install and must keep appending after it, with the adb transport id unchanged proving no server restart. | agent-ruled | 2026-10-17 | this section |
| D7 | E5's gate is `smoke.yaml` passing on the AVD after one throwaway launch; the disposability demonstration is an `adb uninstall` plus fresh install plus a second `smoke.yaml` pass, all on the emulator. The stale mock APK (2.0.215-era, `$HOME/athan-gitree/builds/63-step3-mock.apk`) is rejected: the 2.0.908 prod APK is current, serves the real London timetable over the emulator's NAT, and `smoke.yaml` waits for `London, UK`, which the first sync renders. | agent-ruled | 2026-10-17 | this section |
| D8 | The lane executes steps 1 to 4 itself instead of dispatching executors: every step is exclusive machine-state work (locks, the emulator lifecycle, the phone, isolated adb servers) whose waits run in 15-second cycles inside one turn, and a worker session boundary that parks a lock or a live emulator violates the lane return rules. The reviewer dispatch at audit is unaffected. Challenge: the protocol prefers dispatching. Answer: dispatch buys parallelism and fresh context, and this work has neither to buy: the steps serialize on hardware the lock family already serializes. | agent-ruled | 2026-10-17 | this section, LOG.md |
| D9 | The docs step (5) carries a hard gate: it runs only after lane 122's DONE merge is on `uat`, verified by reading row 122's status cell from `uat` in the main tree (`git -C <main tree> show uat:ai/plans/README.md`); once the gate passes, the step merges `uat` into `lane/133` so the worktree carries 122's landed text, then re-anchors both files at the merged sha before editing (recorded in LOG.md); if 122's landed text contradicts this plan's rules, the step returns `STOP:` for replan. | agent-ruled | 2026-10-17 | this section, step 5 |
| D10 | Every version bump takes union max plus 1 across `origin/uat..uat` non-merge commits and every live lane branch (the lane 125 gate), and `node scripts/check-version-uniqueness.js` runs after the fetch and before every merge. | agent-ruled | 2026-10-17 | this section |
| D11 | Heavy emulator work (image install, boot, flow replay) checks for a sibling's build first (`pgrep -f "gradle|xcod?ebuild"` plus the lock directory listing) and defers in 15-second cycles while one runs; the emulator is killed the moment its step ends, so the lane never leaves resident CPU load. | agent-ruled | 2026-10-17 | this section |

### 2.2 The executor must not decide

- The image id, the AVD name or its panel numbers: D1 and D2 fix them. A
  different image (another API level) is ask-first ground and a `STOP:` return.
- The docs wording: step 5 gives it verbatim. A wording that reads wrong at
  execution is a `STOP:` return, never a local edit.
- Any measurement claim naming the emulator: the ruling excludes the AVD from
  every measurement claim; a result that looks like a perf number from the
  emulator is a `STOP:` return.
- Writing `e2e/README.md` or `e2e/AGENTS.md` before lane 122's DONE merge is
  on `uat`: `STOP:` return (D9).
- Killing the main adb server (port 5037) or unplugging any phone: hard no;
  the isolated server on port 5038 is the only extra server this lane starts.
- Uninstalling, resetting or wiping anything on the 3T beyond the same-version
  APK reinstall of D4: hard no.

## 3. Pre-flight

Committed at `scripts/preflight-133.sh` in this folder. The executor saves a
copy to `$TMPDIR` and runs it from there with the worktree path as the only
argument. It checks the worktree is on `lane/133` at or past `39812f50`, the
tree is clean (a LOG.md entry written mid-phase rides its own next commit
before the pre-flight runs), `origin` is fetched and contained in the lane
branch, the version in `app.json` is not lower than 2.0.979, the installed
`@expo/cli` is 58.1.10 in both this worktree and the main tree (a different
version in either is a `STOP:` return: the CLI claims were measured at this
version), `emulator` 37.1.11.0 or newer is on PATH, no AVD named
`athan-smoke-28` exists yet, each anchor counts exactly 1, and the queue's
row 133 is not DONE. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map, one line per file (all at `39812f50` unless named):

- `e2e/README.md` - the harness manual; step 5 adds one section after the
  `## Run` block, before `## The 30fps floor` (anchor
  `scripts/anchors/readme-30fps-heading.md`). Lane 122 corrects the two
  `--device` passages in the same file before this lane's step runs.
- `e2e/AGENTS.md` - the rules file loaded on touching e2e files; step 5 adds
  one bullet after the bullet lane 122 lands (the `--binary` line), before the
  atlas bullet (anchor `scripts/anchors/agents-atlas-bullet.md`).
- `e2e/flows/smoke.yaml` - the E5 flow: `launchApp` plus an
  `extendedWaitUntil` for the text `London, UK`, timeout 15000 (anchor
  `scripts/anchors/smoke-flow.md`).
- `ai/plans/README.md` row 133 - the ticket row; each phase edits its status
  cell only.
- `node_modules/@expo/cli` at 58.1.10 - not tracked, pinned by the pre-flight:
  the device manager matches `pid === query` (the adb serial) before the name
  fallback; a serial miss prints the device list and `Pass a device serial
  from \`adb devices\` or a name from the list above to --device.`; the install
  path is `adb install -r -d --user 0`; `--no-bundler` skips Metro; the build
  ships no `kill-server` (row 122 read all of this from the build tree).
- `$HOME/athan-gitree/worktrees/prod-build/android/app/build/outputs/apk/release/app-release.apk`
  - not tracked: the E1 and E5 vehicle, measured 2026-10-17
  (`com.mugtaba.athan`, versionCode 1000000, versionName 2.0.908, arm64-v8a).
- The 3T, measured 2026-10-17 under `device-<SERIAL>.lock`: `wm size` 1080x1920,
  `wm density` 420, `ro.build.version.sdk` 28, model ONEPLUS A3003,
  `com.mugtaba.athan` at `versionName=2.0.908`.
- The host toolchain, measured 2026-10-17: adb 37.0.1, emulator 37.1.11.0,
  `emulator -list-avds` empty, `system-images/` empty, platforms android-35,
  android-36, android-37.0, arm64 host, `sdkmanager` and `avdmanager` at
  `/opt/homebrew/bin`.

How the pieces interact: nothing in the repo executes the AVD; it is host
state the harness docs license. The five experiments are the ruling's evidence
burden: E2 and E5 prove the lane works, E1 proves the documented install path
on a real phone, E3 captures what an agent sees when no device matches, E4
proves a CLI install cannot kill a running measurement stream. The existing
tests: none cover markdown docs or host state; `yarn validate` gates every
commit (tsc, Biome, Jest; the version lockstep test reads `app.json` and
`package.json`, and the worktree carries no `android/` directory so the
lockstep test takes its absent-file branch there; the main tree's gitignored
`android/app/build.gradle` is synced by the lane after each merge under the
build lock).

Why the obvious fix is wrong: adopting the lane without the five experiments
would write rules no run has proven (the row's recommendation is evidence
first); routing the harness scripts through the emulator for measurement is
the failure the ruling names (the emulator is never a witness); and deferring
the docs to a fresh ticket leaves the adopted lane unruled in the docs, which
is the exact gap this ticket closes.

## 5. Design

The approach and its invariant, one sentence a test can check: the AVD
`athan-smoke-28` boots to `sys.boot_completed=1` at the 3T's measured panel
class and replays `e2e/flows/smoke.yaml`, and no script or doc names the
emulator as a measurement witness.

The alternatives rejected: a multi-API AVD matrix (row 122's option C,
rejected there: two fleet phones already run API 36, no measured coverage
gap); an x86_64 image on Rosetta (wrong ABI: the fleet APK is arm64-v8a
only, so it cannot install); the mock APK for E5 (D7, stale by 800 versions);
documenting the boot path without creating the lane (row 122's option D,
rejected there: the lane needs the image either way); a new atlas file for
the AVD (D3).

The concurrency trace: the image install and the boot take no lock the family
names (they touch no phone, no build script, no repo file), but D11's
sibling-build check runs first; every contact with the 3T holds
`$HOME/athan-gitree/device-<SERIAL>.lock`; every commit and every yarn install
holds `$HOME/athan-gitree/commit.lock`; every version bump holds
`$HOME/athan-gitree/version.lock`; every merge into `uat` holds
`$HOME/athan-gitree/uat.lock` in the main tree with the uniqueness gate first;
the isolated adb server lives on port 5038 only and dies before the step ends;
the emulator process dies before its step ends (`adb -s emulator-5554 emu
kill`, waited in 15-second cycles, then `pkill -f "qemu-system.*athan-smoke-28"`
only if the graceful kill fails, never touching any other emulator).

The design review: the lane reads the ruling narrowly (smoke plus disposable
destructive checks, one AVD, one image), the evidence burden is the five named
experiments plus the disposability demonstration, and the docs are the
deliberate last step so the two e2e files never see two writers.

**Acceptance criteria:**

- [R1.1] WHEN `emulator -list-avds` runs after step 1 THE SYSTEM SHALL list `athan-smoke-28`.
- [R1.2] WHEN `athan-smoke-28` boots THE SYSTEM SHALL reach `sys.boot_completed=1` within 180 seconds of the emulator process appearing in `adb devices`, with the elapsed seconds recorded in `sessions/133/e2-boot.txt`.
- [R1.3] WHEN `adb -s emulator-5554 shell wm size` and `adb -s emulator-5554 shell wm density` run on the booted AVD THE SYSTEM SHALL print `Physical size: 1080x1920` and `Physical density: 420`, equal to the 3T's measured panel.
- [R2.1] WHEN `npx expo run:android --binary <apk> --device bogus-serial-1234 --no-bundler` runs from the main tree THE SYSTEM SHALL exit the command non-zero with output containing the CLI's advice to pass a serial from `adb devices`, captured verbatim in `sessions/133/e3a-serial-miss.txt`.
- [R2.2] WHEN the same command runs against an isolated adb server on port 5038 holding zero devices THE SYSTEM SHALL name the zero-device state or the unmatched device in the captured output `sessions/133/e3b-zero-devices.txt`; WHEN the CLI ignores `ANDROID_ADB_SERVER_PORT` (the output still names the attached phone) THE SYSTEM SHALL record the variant VOID in the same file with the observed output, and that record satisfies this criterion.
- [R3.1] WHILE a `logcat` stream writes to `sessions/133/e4-logcat-3t.txt` from the 3T THE SYSTEM SHALL keep the stream process alive through the step-4 CLI install-and-launch, appending lines timestamped after the install, with the 3T's adb transport id unchanged.
- [R4.1] WHEN `e2e/flows/smoke.yaml` runs on the booted AVD with the 2.0.908 APK installed after one throwaway launch THE SYSTEM SHALL report the Maestro flow passed, saved in `sessions/133/e5-smoke.txt`.
- [R4.2] WHEN the app is uninstalled from the AVD, reinstalled from the same APK, and `smoke.yaml` runs again THE SYSTEM SHALL report the second Maestro flow passed, saved in `sessions/133/e5-disposable.txt`.
- [R5.1] WHEN `npx expo run:android --binary <the 2.0.908 apk> --device 3T_SERIAL --no-bundler` runs from the main tree THE SYSTEM SHALL exit the command 0, print no prebuild or gradle line, and leave the main tree's `git status` clean.
- [R5.2] WHEN the step-4 install completes THE SYSTEM SHALL report on the 3T `versionName=2.0.908` unchanged and the same number of `com.mugtaba.athan` alarm batches in `dumpsys alarm` as before the install.
- [R5.3] WHEN the step-4 command exits THE SYSTEM SHALL run no Metro process for this repo (`pgrep -fl "node.*metro"` prints no new line against the pre-command record).
- [R6.1] WHEN the harness docs are read after step 5 THE SYSTEM SHALL carry in `e2e/README.md` an AVD lane section naming the AVD's identity (Android 9 image, 1080x1920 panel, 420 density), its boot command, its serial form, the smoke-and-disposable-only scope, the never-a-witness rule with the named exclusions (baseline-compare, frame-audit, every perf number), and the ask-first rule for further system images, and in `e2e/AGENTS.md` one bullet binding the same rules.

## 6. Steps

Checklist (each step is its own branch commit on `lane/133`, its own version,
its LOG.md entry, and its evidence under `$HOME/athan-gitree/sessions/133/`):

1. `steps/1-avd-create-boot.md` - the image, the AVD, the boot, the panel read (E2). Weight 3.
2. `steps/2-failure-texts.md` - the serial-miss and zero-device failure texts (E3). Weight 3.
3. `steps/3-flow-replay.md` - the install, the throwaway launch, `smoke.yaml`, the uninstall-reinstall replay (E5). Weight 3.
4. `steps/4-serial-install-3t.md` - the logcat stream, the CLI serial install, the unchanged phone (E1, E4). Weight 3.
5. `steps/5-harness-docs.md` - the lane's rules into the two docs files, gated on lane 122's DONE. Weight 1.

Steps 1 to 4 change no repo file outside the plan folder, the queue row and
the version files; step 5 is the only harness-docs commit. Step files carry
the full contracts.

## 7. Device proof

The build: none. The APK is prebuilt (D4), and no build script runs in this
ticket. The AVD: created by `avdmanager`, booted headless
(`emulator -avd athan-smoke-28 -no-window -no-audio -no-boot-anim -gpu
swiftshader_indirect`), panel verified by `wm size` and `wm density`,
destroyed per step by `adb -s emulator-5554 emu kill` before the step ends
(the AVD definition itself stays, recreated by two commands if ever wiped).
The 3T: contacted only inside `device-<SERIAL>.lock`; before the install,
`adb -s 3T_SERIAL shell dumpsys package com.mugtaba.athan | grep versionName`
prints 2.0.908 and `adb -s 3T_SERIAL shell dumpsys alarm | grep -c
"com.mugtaba.athan"` records the armed count (the expected-alarm list rule:
the count, not the times, is the unchanged claim; no clock is ever changed on
the 3T); after the install, both read the same. Evidence lands under
`$HOME/athan-gitree/sessions/133/`, never committed.

## 8. Records

The LOG.md ledger: every step entry opens `### Step <NN> — <state>` and ends
`session: <ses_id>`; planning sections use `## Planning (<date>)`. The queue
DONE cell text (the lead applies it at DONE):

`DONE 2026-10-17, audited: one bounded AVD lane adopted and proven - athan-smoke-28 (android-28 google_apis arm64-v8a, 1080x1920 at 420, the 3T's measured panel class) boots to sys.boot_completed=1, replays e2e/flows/smoke.yaml and reinstalls clean; the CLI serial install path proven on the 3T at 2.0.908 with data and alarms untouched and a logcat stream surviving it (E1, E4); the serial-miss and zero-device failure texts captured (E3); the lane's rules written into e2e/README.md and e2e/AGENTS.md behind lane 122's DONE (smoke and disposable destructive checks only, never a measurement witness, further system images ask-first)`

The docs commit message (step 5): `<VERSION> - docs(e2e): the AVD lane rules (133): smoke and disposable checks only, never a measurement witness`. The DONE commit deletes this plan folder and `$HOME/athan-gitree/sessions/133/`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `sdkmanager` reports licences not accepted | the licences dir predates this image | run `yes | sdkmanager --licenses`, retry once; a second refusal is a `STOP:` return |
| `avdmanager create` prompts interactively | no piped answer to the custom-hardware question | rerun with the piped `no` of contract 3; the config.ini write supplies the panel |
| boot passes 180 seconds without `sys.boot_completed=1` | cold first boot of a fresh image | `adb -s emulator-5554 emu kill`, boot once more (cold boots cache); a second overrun is a `STOP:` return with the logcat tail |
| `adb devices` shows the emulator `offline` | the emulator is still booting | poll in 15-second cycles against `getprop sys.boot_completed`; never restart the adb server |
| Maestro cannot find the device | two devices attached (phone plus emulator) | name the emulator's adb serial on Maestro's `--device` flag exactly as `adb devices` prints it |
| `smoke.yaml` times out on `London, UK` | first sync slow or the permission dialog overlays | read one screenshot of the emulator, dismiss the dialog at its measured button, force-stop the app, rerun the flow once; a second timeout is a `STOP:` return |
| the CLI install on the 3T exits non-zero | the phone re-authorized or a transient adb message | read the captured output; retry once after `adb devices` shows the serial `device`; a second failure is a `STOP:` return with the text |
| lane 122 has not merged its DONE when step 5 is ready | sibling lane in flight | hold in 15-second cycles re-reading `uat`; after each merge, re-check the gate grep; if 122's landed text contradicts this plan's rules, `STOP:` for replan |
| a version collision at merge | a sibling bumped the same number | recompute union max plus 1, re-run the uniqueness gate, bump again; never merge past the gate |
| a lock directory exists with no live sibling | a parked lock from a dead session | name it in the LOG and the final reply; take the lock only after `ls` of the holder shows it ended, else defer |

Anticipated review fixes, word for word: "the AVD section names the emulator
serial generically; write `emulator-5554` with the caveat that the port
increments per instance" (fix: add the caveat sentence); "the AGENTS.md bullet
duplicates the README section verbatim" (fix: shorten the bullet to the rule
plus a pointer); "the boot command misses `-port 5554`" (fix: add the flag or
record why the default port suffices, it does: the first emulator instance
takes 5554).

Per-step restore lists: step 1 leaves the image and the AVD definition (the
adopted lane's assets); a failed step 1 deletes the AVD
(`avdmanager delete avd -n athan-smoke-28`) and leaves the image (the
ask-first ruling covers it); step 2 leaves nothing host-side beyond its
capture files and kills the port-5038 server; step 3 kills the emulator and
can uninstall the app from the AVD (it is disposable by design); step 4
leaves the 3T exactly as found (the same-version reinstall keeps data; the
capture files die with the evidence rule); step 5 reverts as one docs commit.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller`
grills the draft. Delivery: this lane executes steps 1 to 4 itself under D8
(recorded in LOG.md), and dispatches one `athan-reviewer` (blind) for the
audit of the docs range; the lane's own plan-conformance read is recorded
beside it. Every worker may call `vision` for an image it cannot see; the
lane reads its own emulator screenshots itself.

## 12. Report to the owner

Plain sentences at DONE: the lane is adopted (one AVD at the 3T's panel
class), the five experiments ran with their evidence, the 3T kept its 2.0.908
install and alarms, the rules landed in the two harness docs behind lane 122,
and the queue row is DONE. The progress table and the four-line handoff close
the lane's final reply; the agent-ruled table lists D1 to D11.
