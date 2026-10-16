# LOG.md - ticket 122

## Planning (2026-10-16)

Frontier worked agent-ruled per the standing hands-off order; decisions D122.1 to D122.6 in
PLAN.md section 2. Facts measured directly from the installed `@expo/cli` 58.1.10 source and
its own help surfaces, the SDK 58 changelog entry and its pull request, the repo's harness
files, and the local Android toolchain.

## Ticket 122

Planning skeleton landed; the draft, grill, gate and READY follow.

DRAFT (2026-10-16): the full plan drafted - four docs steps, thirteen anchors verified at
`cf754b25` (2.0.886), the pre-flight script written, `scripts/check-plan.sh ai/plans/122-avd-adb`
printing `PLAN OK`, and FINDINGS.md sections 1 to 3 drafted to land with the READY commit.

Grill round 1 (2026-10-16): fifteen findings. Two musts applied - the pre-flight's uat check
(the merge base of `lane/122` and local `uat` is the skeleton commit, whose child is
`cf754b25`, so the ancestor test on the merge base could never pass; the check now asserts
local `uat` contains `cf754b25`), and step 2's predicted build-script count (each script
prints one `grep -n adb` hit, the comment naming `adb install -r`, not zero). Thirteen shoulds
and nices applied: the sweep scoped to `git grep -nw adb -- e2e` with its measured 36 hits
across 10 files and the phantom flow and atlas rows corrected, R1.4 split into the two greps
that actually differ (kill-server prints nothing; start-server/stop-server prints the removal
comment), D122.3 and the row cell carrying both logcat facts (no handling, one hazard
removed), three cites corrected to the ranges that hold the quoted lines, "the two tracked
version files (package.json, app.json)" named, R1.5 reworded to the planning-measured sources
with their URLs, four shell scripts where five were named, R4.1's experiment and unverified
sentences expanded to E1 to E5 and U1 to U6, the three agent-command names, the four build
scripts named as four, and the anchor-check, review and merge lines added to steps 2 to 4.

### Step 1 — DONE (the CLI facts verified at 58.1.10)

Branch `docs/122-1-cli-facts` off `lane/122` at `d5e3834f`. Pre-flight `PREFLIGHT OK`, run cold
from `$TMPDIR` before the branch. Verification script
`$HOME/athan-gitree/sessions/122/verify-cli.sh`, output `verify-cli.out`, exit 0; every claim in
FINDINGS sections 1 and 2 reproduced:

- versions: `@expo/cli` 58.1.10, `expo` 58.0.12, `npx expo --version` 58.1.10.
- the four added modules present, with their exports: `adbProcess` (nine exports, including
  `runBoundedAdbDeviceQueryAsync` and `AdbProcessWaitError`), `adbDeviceList`
  (`parseAdbDeviceList`, `isAdbDeviceStateUsable`), `adbEndpoint` (four), `adbDiagnostics`
  (five). The six rewritten modules present.
- `grep -rni logcat node_modules/@expo/cli/build` (maps excluded): 0.
- `kill-server`: 0 matches. `start-server`/`stop-server`: 1 match, `ADBServer.js:35`, the
  removal comment. R1.4's two greps confirmed to differ.
- serial before name: `AndroidDeviceManager.js:89`, `device.pid === query` first.
- `ADBServer.js:18-19` the two 10 s limits, `:33` the bounded query default, `:47` and `:59`
  the mutation and host forms; `adbProcess.js:81` the 2 s cleanup limit, `:135` the wait
  signal, `:155` the wait message, `:158` the unknown-completion marker (cite corrected from
  `:157-158`).
- `adb.js:178-180` the wait limit, delay and window; `:383` the retry predicate; `:254` the
  install argv `install -r -d --user <EXPO_ADB_USER>`; `env.js:205` the user default `0`.
- `getDevices.js:32` the AVD listing inside the try, `:39` the merge, `:55-56` the name dedup.
- `emulator.js:111` the 180 s ceiling, `:120` the AVD list, `:143` the detached spawn.
- `adbEndpoint.js:56` the 4 s probe limit, `:73` the endpoint resolution, `:182` the
  `host:version` request.
- `adbDiagnostics.js` seven advice cases, including `unauthorized` at `:97` and
  `no permissions` at `:99`.
- `AndroidDeviceManager.js:150` the transport-id check, `:155` the unauthorized refusal,
  `:163` the state guard.
- `runAndroidAsync.js:127` the bundler start, `:132` headless, `:143` the binary install,
  `:172` the stop.
- the harness sweep: `git grep -nw adb -- e2e` prints 36 hits across 10 files; each of the four
  build scripts prints 1 hit, the `adb install -r` comment.
- `npx expo --help`: the twelve command names plus the three agent-command names, no device or
  emulator command; `run:android --help` prints `-d, --device [device]`.
- the toolchain: adb 1.0.41 / 37.0.1-15733141, emulator 37.1.11.0, `-list-avds` empty exit 0,
  `system-images/` empty, platforms android-35/36/37.0, host arm64, RN manifest
  `minSdkVersion 24` / `targetSdkVersion 36`, build scripts arm64-v8a.
session: lane-122 in-lane execution (D122.8; no executor worker dispatched)

### Step 2 — DONE (the harness inventory verified)

Branch `docs/122-2-harness` off `lane/122` at `b18d75aa`. Pre-flight `PREFLIGHT OK`, run cold
from `$TMPDIR` before the branch. The sweep `git grep -nw adb -- e2e` printed 36 hits across 10
files (the same numbers as the draft); FINDINGS section 3's table now lists every hit as an
exact line list per file, and the totals reconcile: baseline-compare.sh 4, device-checks.sh 5,
frame-audit.sh 9, idle-cpu.sh 3, idle_cpu.py 2, README.md 4, AGENTS.md 1, atlas-oneplus3t 3,
atlas-oppo-findx8 3, atlas-sm-s911b 2. The seven `e2e/flows/*.yaml` files call adb nowhere and
`e2e/device-atlas-iphone-xs.md` names none. Each of the four build scripts prints exactly one
`grep -n adb` hit, the comment naming `adb install -r`, and no invocation. `npx expo --help`
prints the twelve command names plus the three agent-command names and no device or emulator
command; `npx expo run:android --help` prints `-d, --device [device]`. The toolchain line in
the section stands as the step 1 verification recorded it.
session: lane-122 in-lane execution (D122.8; no executor worker dispatched)

### Step 3 — DONE (the two questions, the experiments, the unverified list)

Branch `docs/122-3-questions` off `lane/122` at `5815a3b0`. Pre-flight `PREFLIGHT OK`, run cold
from `$TMPDIR` before the branch. FINDINGS sections 4 and 5 refined: every rejected option now
carries the measured fact that rejects it (question 1: the CLI's absent logcat, dumpsys,
screenrecord and SurfaceFlinger surfaces, the Metro start and stop per call, the atlas-recorded
per-device handling; question 2: the doubled API 36 coverage and the absent coverage gap), each
recommendation carries its challenge and an explicit flip-check on its strongest rival (C for
question 1, A for question 2), and each unverified claim names the step that settles it - U1 an
older CLI, U2 `sdkmanager --list` before the install she authorises, U3 E1 and E2, U4 E1 and
E2 on the fleet's two slowest installs, U5 E2 and E5, U6 `adb -s 8T_SERIAL shell getprop
ro.build.version.release` at the next device wave. The five named experiments stand with their
commands and waiting conditions, and two cites were corrected to the ranges that hold the
quoted lines (`runAndroidAsync.js:127-133`, `:172`).
session: lane-122 in-lane execution (D122.8; no executor worker dispatched)
