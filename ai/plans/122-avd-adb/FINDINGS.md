# FINDINGS - ticket 122

Every claim below was measured on 2026-10-16 against the installed `@expo/cli` 58.1.10
(`node_modules/@expo/cli/package.json`, the version this checkout's `npx expo` runs:
`npx expo --version` printed `58.1.10`), the installed `expo` 58.0.12, the repository at
`cf754b25` (2.0.886), and the local Android toolchain. Nothing was run against a phone,
nothing was built, no emulator was booted, and no code or configuration changed.

## 1. What the rewrite is, at the installed version

The changelog entry the ticket's order rests on, and its scope:

- `@expo/cli` 58.0.0 (2026-09-10), bug fixes: "Make Android tooling (avd and adb) handling
  safer, more reliable, and cancellable ([#49258](https://github.com/expo/expo/pull/49258) by
  [@kitten](https://github.com/kitten))". Source: the package changelog, fetched
  2026-10-16; the installed build carries the result.
- The pull request's own file list (GitHub API, 2026-10-16): 28 files. Four modules are new -
  `adbProcess.ts`, `adbDeviceList.ts`, `adbEndpoint.ts`, `adbDiagnostics.ts` - and six are
  rewritten - `ADBServer.ts` (+86/-63), `AndroidDeviceManager.ts` (+143/-27), `adb.ts`
  (+298/-117), `adbReverse.ts` (+43/-13), `emulator.ts` (+81/-71), `getDevices.ts`
  (+35/-25). Twelve test files and fixtures land with them, including `adb-hang.js`,
  `adb-cold-start.js` and `adb-long-command.js`.
- The stated intent (pull request body, quoted as the author's own record): cancellation
  signals from top to bottom on every adb operation; `start-server` and `kill-server`
  lifecycle calls removed; timeouts scoped per operation; devices parsed without AVD being
  available; emulator polling and name lookups improved; "Stop device being identified by
  `name` instead of `serial`, and use name only as a fallback"; error handling made
  actionable; races and loops that ignored a hanging command fixed.

All four added modules and all six rewritten modules are present in the installed build tree
`node_modules/@expo/cli/build/src/start/platforms/android/`, and the behaviour below is
quoted from that build, not from the changelog.

The two external sources, fetched 2026-10-16 and not re-fetched by any step:
`https://raw.githubusercontent.com/expo/expo/main/packages/%40expo/cli/CHANGELOG.md` for the
58.0.0 entry, and `https://api.github.com/repos/expo/expo/pulls/49258/files` for the file
list with its per-file line counts. The package ships no `CHANGELOG.md` of its own
(verified absent under `node_modules/@expo/cli`), so these two URLs are the only witness for
the scope line, and the installed build is the witness for every behaviour.

## 2. What changes in practice, one row per axis

| Axis | Installed behaviour at 58.1.10 | The file and line |
| --- | --- | --- |
| Device discovery | `adb devices -l` is retried inside a 10 s deadline for the transient server messages (`cannot connect`, `connection refused`, `server didn't ACK`, `daemon not running`, `smartsocket`), with a 2 s retry window and a 200 ms delay between attempts. The AVD inventory is merged after the attached devices, deduplicated by name against the attached set. A failed AVD listing is tolerated while an attached device exists, and the failure text is folded into the "no devices" message instead of thrown. | `adb.js:178-180`, `adb.js:277-343`, `adb.js:383-385`, `getDevices.js:26-44`, `getDevices.js:54-57` |
| Device naming and selection | A device is matched by `pid` (the adb serial) first and by `name` only as a fallback, and an unmatched query throws `BAD_ARGS` listing every available device with its serial, name and type. | `AndroidDeviceManager.js:87-103` |
| Device state | Every operation re-checks the device after discovery: a `transport_id` change between discovery and use throws `ADB_DEVICE_STATE` naming both transports, an unauthorized device is refused with the authorization link, and a state other than `device` is refused with the state named. | `AndroidDeviceManager.js:133-172` |
| Timeouts and cancellation | Query operations are bounded (10 s for a device query, 10 s for a property read, 4 s for the adb host probe) while mutation operations are not: `runDeviceMutationAsync` calls the unbounded form whenever no limit is passed, which is how install and uninstall run. On expiry the adb client is SIGTERMed, then SIGKILLed after a bounded cleanup window, and the failure reads "Expo stopped waiting for the ADB <operation> operation to finish." A cancelled mutation is marked `remoteCompletionUnknown` and the error says "The operation may have completed on the device. Check before trying again." | `ADBServer.js:18-19`, `ADBServer.js:33-58`, `adbProcess.js:81-163` (the wait message at `:155`, the marker at `:158`), `adbDiagnostics.js:43-45`, `adb.js:246-255` |
| Server lifecycle | No `start-server` and no `kill-server` anywhere in the installed build. The one match for either string is the comment recording their removal. The CLI no longer starts or stops a shared adb server. | `ADBServer.js:33-36` |
| Diagnostics | A failed discovery probes the configured adb endpoint directly over its socket with a `host:version` request and separates "not responding", "connection refused", "rejected the health check", "not an adb server" and "direct probe unsupported", each with its own advice line. Device-state failures add advice for offline, unauthorized, `no permissions` and not-ready. | `adbEndpoint.js:56-83`, `adbEndpoint.js:135-233`, `adbDiagnostics.js:38-108` |
| Emulator boot | The AVD list is `emulator -list-avds` filtered to names without spaces, each entry marked launchable. Boot spawns `emulator @<name>` detached, polls `adb devices` every second without overlapping polls, waits for `init.svc.bootanim` to report `stopped`, tolerates a transient boot-property error, and fails at 180 s with the manual command printed. | `emulator.js:111-208` |
| Install | `adb install -r -d --user 0 <apk>`, unbounded, with `EXPO_ADB_USER` overridable and both a pre-check and a post-check that turn a bad user number into `EXPO_ADB_USER`. An uninstall is skipped when the package is absent. | `adb.js:246-255`, `ADBServer.js:89-111`, `env.js:204-205` |
| Logcat | Nothing. `grep -rni logcat node_modules/@expo/cli/build` (source maps excluded) prints zero matches. The rewrite carries no logcat handling of any kind, so no logcat stability changes with it. | measured 2026-10-16 |

Two consequences follow for this repository, both independent of any routing decision:

1. The rewrite already reaches the harness through the one Expo CLI path the harness owns:
   the gate-ON measurement build `EXPO_PUBLIC_PERF_MONITOR=1 npx expo run:android --variant
   release` (`e2e/README.md:43`) resolves a device, installs and launches through this code.
   The re-pin to SDK 58 stable delivers the improved selection, state checks and errors
   there without any change to the repository.
2. The `kill-server` removal protects the harness's long-lived logcat streams. The
   measurement scripts stream `adb logcat` for the length of a flow
   (`e2e/scripts/baseline-compare.sh:21`) while a lane's build shells `npx expo prebuild`,
   and the previous CLI could stop the shared adb server on its own shutdown. Source-verified
   from the pull request body and the removal comment; not reproduced live (section 5).

## 3. The harness as it stands

Every `adb` word hit under `e2e/` (the sweep: `git grep -nw adb -- e2e`, 36 hits across 10
files, measured 2026-10-16):

| File | Lines | What it does |
| --- | --- | --- |
| `e2e/scripts/baseline-compare.sh` | 6, 14, 20, 21 | Requires adb, defaults the serial to the first attached device (`adb devices \| awk 'NR>1 && $2=="device"{print $1; exit}'`), clears logcat, then streams `logcat -s ReactNativeJS -v threadtime` into the run's log |
| `e2e/scripts/device-checks.sh` | 24, 30, 40, 45, 135 | The same serial default, then `a() { adb -s "$SERIAL" "$@"; }` over the alarm, channel and permission checks, with the unreachable-device failure and the transport-problem comment |
| `e2e/scripts/frame-audit.sh` | 26, 31, 32, 36, 38, 75, 76, 79, 81 | The same serial default, `am force-stop`, `am start -W`, `input tap`, `dumpsys SurfaceFlinger --latency`, `screenrecord`, `pull` |
| `e2e/scripts/idle-cpu.sh` | 7, 12, 15 | Requires adb, the same serial default, then per-thread `/proc` deltas |
| `e2e/scripts/idle_cpu.py` | 11, 73 | Two message strings naming an adb failure; the helper runs no adb command |
| `e2e/README.md` | 50, 128, 130, 139 | The manual marks stream, the `--device` gotcha, the build-then-install advice, and the zsh word-splitting trap |
| `e2e/AGENTS.md` | 18 | The `--device` gotcha restated, with the build-then-install advice |
| `e2e/device-atlas-oneplus3t.md` | 4, 63, 102 | The tap driver, the Play Protect settings that make `adb install` unattended, and the widget diagnostics |
| `e2e/device-atlas-oppo-findx8.md` | 12, 13, 14 | The verifier settings, the 60 to 90 s install window with its `dumpsys package` poll, and the double `monkey` launch |
| `e2e/device-atlas-sm-s911b.md` | 41, 42 | The unattended install and the `monkey` launch |

The seven `e2e/flows/*.yaml` files call adb nowhere: Maestro drives them by device id
(`maestro --device "$SERIAL" test`). `e2e/device-atlas-iphone-xs.md` names no adb command.

The four build scripts (`$HOME/athan-gitree/bin/build-prod.zsh`, `build-mock.zsh`,
`build-mock-ramadan.zsh`, `build-mock-variant.zsh`) run no adb command at all: they resolve a
ref, create a detached build worktree, link or install `node_modules`, run
`npx expo prebuild -p android --no-install [--clean]`, run `./gradlew assembleRelease
--no-daemon -PreactNativeArchitectures=arm64-v8a`, then verify the artefact (package,
versionCode, versionName, signer, Hermes bytecode, mock dates, key absence). Each carries
exactly one `grep -n adb` hit, a comment naming `adb install -r` as what the install on a
phone will be. Their only Expo CLI surface is `prebuild`, which no part of this rewrite
touches. Nothing in them can route through AVD or adb management.

The CLI's own command surface, live at 58.1.10: `npx expo --help` lists `start`, `export`,
`run:ios`, `run:android`, `prebuild`, `install`, `customize`, `config`, `serve`, the account
commands and the three agent-command names (`command`, `command:ps`, `command:events`). There
is no device-inventory command, no emulator command, and no adb passthrough.
`npx expo run:android --help` is the only surface that reaches the rewrite, with
`-d, --device [device]` documented as "Device name to run the app on". The device management
is a side effect of running the app, not a service the harness can call.

The rules that govern any routing choice, quoted from `ai/AGENTS.md`: the EAS rule with
"Builds happen locally on the OnePlus 3T and nowhere else" (lines 76 to 78), the device
testing rules ("A screenshot reaches a screen. It never proves what is on one. A records
claim needs a logcat line or a dump."), and the `@expo/agent-cli` ban with its
`smoke --android` clause.

The local toolchain, measured 2026-10-16 (`~/Library/Android/sdk`): `platform-tools` adb
1.0.41 / 37.0.1-15733141; emulator 37.1.11.0; `emulator -list-avds` prints nothing and exits
0; `system-images/` is empty; `platforms/` holds android-35, android-36 and android-37.0;
the host is arm64. The app's floor is API 24
(`node_modules/react-native/ReactAndroid/src/main/AndroidManifest.xml:11`) against
`targetSdkVersion 36` (line 12), and both Android build scripts cut arm64-v8a only.

The fleet today: the 3T on Android 9 (API 28), the Find X8 and the S23 on Android 16
(API 36), the 8T carried in `ai/AGENTS.md`:57 with no atlas file in the repository. No
emulator exists anywhere in the harness.

## 4. The two questions, each with options and one recommendation

### Question 1: should the e2e harness and the build scripts route through the CLI's AVD and adb management?

- **Option A, status quo.** Change nothing. The harness keeps raw adb in every script, and
  its one CLI path (the measurement build) picks up the rewrite's improvements for free at
  the re-pin.
- **Option B, status quo plus two documented corrections and one documented install path
  (recommended).** Keep every script on raw adb. Correct the stale `--device` gotcha
  (`e2e/README.md:128-131`, restated in `e2e/AGENTS.md:18`): at 58.1.10 the serial resolves
  first, so the failure the line records is cured. Record
  `npx expo run:android --binary <apk> --device <serial> --no-bundler` in the device-testing
  routing as the way to put an already-built APK on a phone and open it, because the CLI
  refuses an unauthorized or replaced device with a named cause, checks the package is
  installed before launching, and launches the activity deterministically instead of the
  `monkey ... LAUNCHER` pair the Find X8 needs twice.
- **Option C, route the scripts through the CLI.** Build the harness's device work on
  `npx expo run:android`. Rejected: the CLI implements none of the operations the scripts
  exist for (logcat streams, `dumpsys alarm`, SurfaceFlinger latency, screenrecord, `input
  tap`, per-thread CPU reads - section 2, logcat row, is the whole of its logcat handling),
  every call would start and stop a Metro server (`runAndroidAsync.js:127-133`, `:172`), and
  the atlas-recorded per-device handling (the Find X8's 60 to 90 s install, the verifier
  settings, the double `monkey`) would be replaced by behaviour with no device witness.
- **Option D, copy the rewrite's resilience into an in-repo adb helper.** Rejected: no
  recorded incident in the harness asks for it (the executor rule already answers the hang
  class: "If adb hangs twice, STOP and report"), and a parallel adb wrapper is new surface
  with no owner and no test.

Argued twice. For B: the only measurable losses the rewrite cures for this repo are the
serial-selection failure, which is a documentation line, and an install-and-launch path that
is one shell call today and would become one CLI call with better failure text. The
measurement scripts get nothing because the CLI measures nothing. Challenge: is B worth
writing down at all, or is A the honest answer? The doc line is actively wrong at the
installed version, which is a defect in the harness's own instructions, and the X8's
`monkey` twice is a recorded wart; against that, a stale line costs one line to fix and the
install path is already unattended on all four phones. B survives as A plus the line, and
the line is the load-bearing half. Flip-check on the strongest rival, C: the CLI's device
layer is genuinely better engineered than the scripts' raw adb, so "use it everywhere" has
surface appeal; it fails on scope, because the scripts are measurement instruments whose
first requirement is a raw logcat and a raw SurfaceFlinger dump, and the CLI exposes
neither. B stands.

### Question 2: does an AVD lane belong in the device matrix beside the phones?

- **Option A, no emulator (status quo).** The matrix stays the four phones.
- **Option B, one bounded AVD lane (recommended).** One arm64-v8a AVD configured at the 3T's
  panel and density so the seven existing flows' coordinates replay, used for flow smoke and
  UI regression on mock builds, and for the disposable destructive checks the executor rules
  forbid on owner phones (`pm clear`, uninstall). Its results prove that a flow ran and a
  layout held; performance baselines, alarm-time checks, OEM widget behaviour, sensor
  claims and notification fidelity stay on the phones, and no baseline file, atlas
  coordinate or measurement verdict may cite it.
- **Option C, a multi-API AVD matrix.** Rejected: two of the four phones already run API 36,
  the fleet has no measured coverage gap to close, and each image is a separate install.
- **Option D, no lane, but document the CLI's boot path.** Rejected as a separate answer: an
  AVD lane needs the image either way, and the boot path is one detail inside B.

Argued twice. For B: the matrix's real shortage is availability and exclusivity, not
fidelity - a lane that needs a phone waits for the owner's access (row 54 is blocked on
exactly that) and every device step serializes on `device-<SERIAL>.lock`, while the fleet's
coverage of API 36 is already doubled and no gate in the repo depends on a level the phones
lack. An AVD at the 3T's panel gives every lane a device-free smoke target and a disposable
target for destructive checks, with the existing automation (Maestro flows by device id,
agent-device whose command card carries fold and shutdown for Android emulators). Challenge:
does a device-free lane tempt a lane into reporting an emulator run as a device proof? That
risk is real and is answered by writing the exclusion into the same paragraph that creates
the lane, not by refusing the lane; the repo's own rule already requires a logcat line or a
dump for a records claim, and an AVD produces both. Second challenge, cost: no system image
is installed (measured), so B opens with an ask-first install of a system image and an AVD
definition, and the image's size is unverified (section 5). Against that stand a
device-free lane and the owner's own standing difficulty reaching the phones. Flip-check on
the strongest rival, A: leaving the matrix alone costs nothing and keeps one interpretation
of "device proof" in the repository, which is a genuine discipline argument; it fails on the
measured shortage, because A leaves every flow smoke blocked while the phones are away or
busy, and B's exclusion paragraph - written at the same time as the lane - keeps the one
interpretation intact. B survives as a bounded addition whose first act is hers to
authorise.

## 5. The named experiments, and what stays unverified

Each waits for the condition named; none can run in this wave.

| # | Experiment | Command (after the condition) | What it settles | Waits on |
| --- | --- | --- | --- | --- |
| E1 | Serial resolution, live | `npx expo run:android --binary <mock.apk> --device <3T_SERIAL> --no-bundler` in a lane whose APK already exists | That `--device <serial>` resolves at the installed version, the Metro start/stop cost of the binary path, and whether the deterministic activity launch replaces the `monkey` pair | a phone, an existing APK, `build.lock` |
| E2 | AVD boot end to end | `npx expo run:android --device <AVD name> --binary <mock.apk> --no-bundler` | That the emulator boot path (detached spawn, 1 s poll, bootanim gate, 180 s ceiling) works on this Mac, and that install and launch follow | the system-image install (ask-first), an AVD definition, an APK, `build.lock` |
| E3 | The device-free failure text | `npx expo run:android` with no `--device` | That the `ANDROID_NO_DEVICES` message and the AVD-discovery cause print as the source says | a moment with no phone attached |
| E4 | The logcat stream against a CLI shutdown | stream `adb logcat`, run an `npx expo` command, end it | That no CLI shutdown stops the shared adb server | an `@expo/cli` below 58.0.0, which is not installed here |
| E5 | Flow replay on the AVD | `maestro --device emulator-5554 test e2e/flows/smoke.yaml` after E2 | That the 3T-panel AVD replays the existing flow coordinates | E2 |

Unverified at planning, each with the step that would verify it:

- U1: the exact failure the old CLI produced for `--device <serial>`. The repository's own
  line is the witness for the failure, and the pull request body is the witness for
  name-only matching; the old build is not installed, so the mechanical cause was not
  reproduced. E1 shows only that it works now; the old behaviour would need an `@expo/cli`
  below 58.0.0 installed.
- U2: the system image's download size and the AVD lane's disk cost. `system-images/` is
  empty, and the size follows from the image chosen. Verify with `sdkmanager --list` before
  the install she authorises, which prints each package's size.
- U3: that the binary install path leaves no Metro process behind. The source calls
  `manager.stopAsync()` when the bundler was not requested
  (`runAndroidAsync.js:127-133`, `:172`); nothing measured it. E1 and E2 would.
- U4: whether the 10 s bounded query limit ever trips on the fleet's slowest device. Only
  the CLI's own queries are bounded and its install and mutation calls are not. E1 and E2
  would show it on the 3T and the Find X8, the two slowest installs in the atlases.
- U5: Android emulator support in the automation beyond its own documentation. The
  agent-device command card names Android emulators (fold, shutdown) and the Maestro server
  takes an emulator device id; no emulator exists on this machine to prove either. E2 and E5
  would.
- U6: the 8T's Android version. No atlas file for it exists in the repository. Verify with
  `adb -s 8T_SERIAL shell getprop ro.build.version.release` at the next device wave.

## 6. What changes if she rules for the options recommended

Question 1, option B: two documentation lines (`e2e/README.md:128-131`,
`e2e/AGENTS.md:18`) replaced by the serial-first behaviour, and one line added to the
device-testing routing naming the `--binary --device <serial> --no-bundler` install path.
No script changes, no build script changes, no new dependency.

Question 2, option B: an AVD definition at the 3T's panel on API 36 (ask-first system image
install), a routing paragraph in `ai/AGENTS.md` naming the lane and its exclusions, an
`e2e/device-atlas-avd-*.md` entry for what the automation cannot reach, and a lock name for
it in the lane protocol (`device-emulator-5554`). No baseline file, no measurement verdict.

Neither option changes a pixel, a prayer time, a notification path or the EAS posture. If
she takes both, the work is two small tickets: a documentation correction for question 1, and the
system-image install plus the lane's routing paragraph and atlas entry for question 2. Each is
planned after her word, and no part of either is written before it.
