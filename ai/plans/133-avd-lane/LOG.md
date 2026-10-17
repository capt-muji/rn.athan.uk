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
