# LOG: ticket 133, the AVD lane

## Planning (2026-10-17)

Frontier worked agent-ruled per the planner skill; decisions D1 to D11 sit in
PLAN.md section 2. Facts measured before drafting: the 3T (1080x1920, density
420, API 28, `com.mugtaba.athan` 2.0.908 installed), the host toolchain
(emulator 37.1.11.0, no AVDs, empty system-images, platforms 35/36/37.0,
arm64), the prod APK (2.0.908, arm64-v8a, versionCode 1000000), the available
image list (`system-images;android-28;google_apis;arm64-v8a` present in the
repository listing).

Execution-mode decision D8 recorded: this lane runs steps 1 to 4 itself (no
executor dispatches) because every step is exclusive machine-state work
serialized by the lock family; the reviewer dispatch at audit is unaffected.

Lane mechanics facts: worktree `$HOME/athan-gitree/worktrees/lane-133` on
`lane/133` from `uat` at `39812f50` (2.0.979, after lane 120's audit-fix
merge); node_modules installed under commit.lock (plain `yarn install`,
@expo/cli 58.1.10 confirmed, hooks pinned by prepare).

## Ticket 133

(sessions below are this lane's own session; worker dispatches would append
theirs)

session: ses_eb7817971ffeXixIUgY3P9mVsC

## Planning (2026-10-17), continued

PLANNING commit 05dbafad (2.0.983) merged as 66708172. Lane weather: lane
120's DONE landed 2.0.982 mid-merge, conflicting package.json and app.json;
resolved keeping 2.0.983 (the higher), merge retried once, hook green
(Tests: 5739 passed, VERSIONS OK). The main tree's gitignored
android/app/build.gradle synced 2.0.982 to 2.0.983 under build.lock before
the merge commit (the lockstep test fails in the main tree otherwise).

## Planning (2026-10-17), grill round 1

One athan-plan-griller dispatch (session ses_eb7724218ffeGUr4JC95unmqpt):
20 findings (4 must, 10 should, 6 nice). 19 applied: the lane-122 gate
rewritten to row 122's DONE cell read from uat in the main tree plus a
uat-into-lane merge before editing (the old --binary grep could never gate:
122's text landed at b275374f after this branch forked); step-5 grep counts
corrected (3 and 1); the passage wrapper fence made four backticks; the
clean-tree note for mid-phase LOG entries; pre-flight hardening (HEAD
ancestor, emulator version compare, both trees' CLI); the avdmanager piped
`no`; the lsof command; D6's opportunistic-stream clause deleted; the
mCurrentFocus foreground check; R1.2's start event; the pkill pattern; and
the nices (three lines, full path, backtick, Maestro citation, anchors in
the Files line). Rejected finding 18: the LOG heading's em dash is
TEMPLATE.md's ledger contract from ticket 56, not agent prose.

### Step 01 — done

E2 proven: image `system-images;android-28;google_apis;arm64-v8a` (2.6G,
row 122's U2 closed) installed through the SDK's own cmdline-tools with
`--sdk_root` (the Homebrew shim at `/opt/homebrew/bin/sdkmanager` installs
into its own root: its first run "succeeded" in 15 s installing nothing,
caught by the empty-dir check); `athan-smoke-28` created with the piped `no`
plus a line-based config.ini write (a configparser rewrite silently dropped
keys and was replaced by delete-and-recreate); boot to
`sys.boot_completed=1` in 29 s (ceiling 180); `wm size` 1080x1920, `wm
density` 420, sdk 28, arm64-v8a: the 3T's measured panel class exactly.
Emulator killed gracefully (`emu kill`, dead in one cycle, no qemu process).
Evidence: `sessions/133/e2-boot.txt` plus the two install logs and the AVD
creation log. R1.1, R1.2, R1.3 hold.

session: ses_eb7817971ffeXixIUgY3P9mVsC

### Step 02 — done

E3 proven, both variants genuine. e3a (live server, bogus serial
`bogus-serial-1234`): exit 1, `No connected Android device or emulator
matched "bogus-serial-1234" by serial or name.`, the device list (the 3T by
placeholder in committed text, plus `athan-smoke-28 (not attached,
emulator)`), and the advice line `Pass a device serial from `adb devices` or
a name from the list above to --device.` e3b (isolated adb server on port
5038, zero devices attached): the CLI respected ANDROID_ADB_SERVER_PORT
(the 3T is absent from its list, proving it read the isolated server),
exit 1, the same advice line with only the not-attached AVD listed. The
isolated server was killed and `lsof -nP -iTCP:5038 -sTCP:LISTEN` prints
nothing; the main server on 5037 was never touched. One operational note
captured in the evidence: the CLI's device list names a not-attached AVD as
a launchable candidate, so `--device athan-smoke-28` is a name-based boot
path this harness does not use (the raw-adb ruling stands). Evidence:
`sessions/133/e3a-serial-miss.txt`, `sessions/133/e3b-zero-devices.txt`.
R2.1, R2.2 hold.

session: ses_eb7817971ffeXixIUgY3P9mVsC

### Step 03 — done

E5 proven on the AVD. Snapshot boot to `sys.boot_completed=1` in 15 s
(first-ever boot was 29 s in step 1). The 2.0.908 prod APK installed
(`Success`, pm list 0 to 1). The throwaway launch rendered the full London
dashboard with NO permission dialog (the screenshot vision-read: `London,
UK` at (115,446), the date line, the countdown, six prayer rows, the
settings gear at (540,1642) on the 1080x1920 panel): the app's one measured
AVD point recorded here is the floating settings gear at (540,1642).
`maestro --device emulator-5554 test e2e/flows/smoke.yaml` passed both
assertions (launch, `London, UK` visible), exit 0. The disposability leg:
uninstall `Success`, reinstall `Success`, throwaway launch, force-stop,
replay passed again, exit 0. Emulator killed gracefully (dead in one cycle,
no qemu process). Evidence: `sessions/133/e5-smoke.txt`,
`sessions/133/e5-disposable.txt`, `sessions/133/e5-first-launch.png`
(uncommitted, dies with the evidence rule). R4.1, R4.2 hold.

session: ses_eb7817971ffeXixIUgY3P9mVsC

### Step 04 — done

E1 and E4 proven on the 3T under `device-<SERIAL>.lock`. Baseline:
transport_id 1, `versionName=2.0.908`, 122 alarm-batch lines, no Metro.
The logcat stream (pid recorded) ran through the CLI
`npx expo run:android --binary <2.0.908 apk> --device 3T_SERIAL
--no-bundler`: exit 0, an install line then an open line, no prebuild or
gradle line, the main tree clean after. After: the stream process alive at
16095 lines with lines timestamped past the install's completion, the
transport id unchanged (no adb server restart), `versionName=2.0.908`
unchanged, the alarm count 122 unchanged, `mCurrentFocus`
`com.mugtaba.athan/.MainActivity`, and no Metro process (`pgrep -fl
"node.*metro"` empty). The stream was stopped politely (`kill <pid>`), the
phone HOME-pressed (never force-stopped), the lock released. Two
observations recorded in the evidence: the CLI prints one `Waiting on
http://localhost:8081` dev-runtime probe line before installing (no bundler
started, none survived: `--no-bundler` holds), and the launch intent carries
a dev URL that a production build ignores beyond the deep link. Evidence:
`sessions/133/e1-baseline.txt`, `e1-after.txt`, `e1-install.txt`,
`e4-logcat-3t.txt` (16095 lines, uncommitted). R3.1, R5.1, R5.2, R5.3 hold.

session: ses_eb7817971ffeXixIUgY3P9mVsC

### Step 05 — done

Gate verified (row 122 DONE on uat), `uat` merged into `lane/133`
(fef9b483), both files re-anchored at that sha (fresh excerpts beside the
originals, each counting 1). Red greps 0, 0, 0 before the edit; after: 3
(athan-smoke-28 in the README), 1 (`never a measurement witness`, the
case-insensitive grep: the passage opens the bullet with capital Never, a
one-word correction to the plan's grep), 1 (the AGENTS bullet). The README
section landed between the Run block and The 30fps floor; the AGENTS bullet
landed directly after 122's `--binary` bullet, before the force-stop bullet.
Biome clean, no em dash in the new text, no serials beyond the placeholder
rule. R6.1 holds.

session: ses_eb7817971ffeXixIUgY3P9mVsC
