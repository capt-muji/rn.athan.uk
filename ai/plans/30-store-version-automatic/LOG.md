# Execution log: Session 30

## Step 1: Android reads its own Play listing, and `releases.json` is read by nothing

- Branch: `fix/30-store-version-from-stores`
- Pre-flight: `PREFLIGHT OK`, both anchors counted 1 against `uat-2` at `0a581943`.
- Red: 10 failed, 16 passed, 26 total. The four `readPlayListingVersion` tests failed with
  `TypeError: (0 , _updates.readPlayListingVersion) is not a function`, and the URL tests failed naming
  `https://raw.githubusercontent.com/capt-muji/rn.athan.uk/main/releases.json` as received, exactly as the plan
  predicted.
- Green: `26 passed, 26 total`. `npx tsc --noEmit` exit 0. `npx biome check . --error-on-warnings`:
  `Checked 349 files in 242ms. No fixes applied.`
- Breaks: `BREAK CAUGHT` for dropGbCountry, shapeOnlyParse, acceptAnyVersion, noGitHubUrl and dropNoCache, then
  `ALL AS EXPECTED: 1`.

## Step 2: a failed check costs an hour, not a day, and no fetch can hang

- Branch: `fix/30-failed-check-keeps-its-window`
- Pre-flight: `PREFLIGHT OK`, the `stores/ui.ts` anchor counted 1.
- Red: 6 failed, 77 passed, 83 total. The stamp tests failed with `Received: 1700000000000`, the constants test with
  `Received has value: undefined`, both as the plan predicted.
- Green: `83 passed, 83 total`, `tsc` exit 0, Biome exit 0.
- **Biome asked for one formatting change** to `stampFailure`, which is work still to do rather than a finding
  (`EXECUTOR-BRIEF.md` section 7): the arrow body fits one line at width 120.
- **The plan's `timeoutNeverFires` break was WRONG and this step corrected it in the plan.** It substituted
  `Number.MAX_SAFE_INTEGER` for the delay, and `setTimeout` clamps any delay above 2^31-1 to 1 ms, so the timeout fired
  SOONER instead of never, node warned `Timeout duration was set to 1`, and the break printed `BREAK NOT CAUGHT`.
  Measured directly with node: `MAX_SAFE_INTEGER fired after 2 ms`. The break is now `timerNeverAborts`, which replaces
  `controller.abort()` with `undefined` in the timer callback, and it is caught.
- Breaks: `BREAK CAUGHT` for failureBurnsTheDay, retryLongerThanWindow, noAbortSignal, timerNeverAborts and
  successStampsRetry, then `ALL AS EXPECTED: 1`.
- **The commit hook caught a flaky test of my own making**, which is exactly what it is for. `logs error when outer
  catch is triggered` ran on the real clock and asserted `Date.now() - ONE_DAY_MS + RETRY_MS`, so the code's own
  `Date.now()` and the expectation's landed 2 ms apart: `Expected: 1790416458406, Received: 1790416458404`. It passed
  three times when I ran the suite and failed inside the hook. Fixed by pinning the clock with the same `PINNED_NOW`
  the other stamp tests use, which is a change to the test's inputs only, never to what it proves. Verified stable
  over three consecutive runs, and the break script re-run afterwards still ends `ALL AS EXPECTED: 1`.

## Step 3: the Android store button resolves without a Play client

- Branch: `fix/30-play-store-web-fallback`
- Pre-flight: `PREFLIGHT OK` (this step has no anchor: step 1 rewrote the function it changes, so an anchor taken at
  "Planned at" could not have been verified).
- Red: 2 failed, 31 passed, 33 total, both failing with `Received number of calls: 1`, as the plan predicted.
- Green: `33 passed, 33 total`, `tsc` exit 0, Biome exit 0.
- Breaks: `BREAK CAUGHT` for noWebFallbackUrl, webUrlFirst and iosAlsoFallsBack, then `ALL AS EXPECTED: 1`.
- Step 2's commit was AMENDED to `bb281574` to carry the plan's own step-1 tick, which had been left uncommitted when
  the merge was first attempted. `89f28ce3` is the pre-amend sha and is not on `uat-2`.

## Device proof

- **Live endpoints, from this Mac** (`~/athan-device-sweep/session30/live-endpoints.txt`): iTunes answered
  `resultCount 1 version 1.5.1`, the Play listing `key141 1.5.2`. Both carry a dotted version; neither said `None`.
- **The SHIPPED parser against the live page** (`parse-live.txt`): a throwaway suite ran `readPlayListingVersion`
  over the 1.14 MB listing as served and reported `1 passed, 1 total`. The test file was deleted by the same command
  and never committed.
- **Android**: `build-mock.zsh uat-2 mocks/simple.ts` ended `BUILD-MOCK OK` in 504 s at `versionName 1.29.19`, from
  `182a3e32`. Installed with `adb install -r`; the phone reads `versionName=1.29.19`,
  `lastUpdateTime=2026-09-27 10:25:48`. Launched by the HOME / `am kill` / doubled-start ritual, and
  `dumpsys window` confirmed `com.mugtaba.athan/.MainActivity` in focus. Logcat holds **0** lines matching
  `Failed to fetch store version` or `Failed to check for updates`, so the Play listing was fetched and parsed on the
  device. It also shows `MMKV DELETE: popup_update_last_check`, which is the upgrade path correctly reopening the
  check after a version bump.
- **iOS**: built and launched on the booted `iPhone XS replica (18)` simulator through xcodebuildmcp,
  `status SUCCEEDED` in 44.8 s. The simulator log holds **0** lines matching either error string.
- **Six screenshots** in `~/athan-store-update-shots/`, read by this session: three per platform (Standard list,
  Extras list, Settings sheet). Every one shows a healthy app, a full prayer list, a live countdown, no error screen
  and no modal. The folder was opened for the owner.
- **The prompt itself was NOT photographed, and cannot be**: the live store version is 1.5.x and the installed build
  is 1.29.19, so the real comparison correctly answers "no update" and shows nothing. The prompt's behaviour is
  covered by the seven tests in `__tests__/app/index.test.tsx`, which render the real modal against a mocked checker.
- **An OEM dialog blocked the first install for 10 minutes**, and it is the session-18 pattern the atlas already
  names: Play Protect's `PlayProtectDialogsActivity` took focus and `adb install` hung with no staging directory ever
  created, while `verifier_verify_adb_installs` read `1`. Setting it to `0`, force-stopping `com.android.vending` and
  retrying gave `Performing Streamed Install / Success` immediately. **The setting was restored to `1` afterwards**,
  and `auto_time` was never touched and reads `1`.
- **The phone is left on this session's mock build at 1.29.19**, which is what the owner asked for.

## One honest limit on the iOS device proof, found after the push

The iOS simulator app is stamped **1.28.52**, not 1.29.19: `ios/` is a gitignored prebuild artifact and
`ios/Athan/Info.plist` still carries the version from the last prebuild, which `ai/AGENTS.md` already documents under
"Native Version Sync". The build was Debug and carries **no `main.jsbundle`**, so it loaded its JavaScript from Metro
(ports 8081 and 8603 were serving), which means it DID run this session's `device/updates.ts`. What it could not
exercise is `getInstalledVersion()` returning 1.29.19, because that reads the native plist.

This does not weaken what the iOS run proves, and it does narrow it. **Proven on iOS:** the new fetch and parse code
loads and runs on a real iOS runtime with zero `Failed to fetch store version` or `Failed to check for updates` lines,
and all three screens render correctly. **Not proven on iOS:** the specific installed-version string the comparison
uses. The Android run covers that end, because `build-mock.zsh` prebuilds fresh and the phone reads
`versionName=1.29.19`.

Not fixed here, deliberately: syncing the plist means a prebuild, and `app.json` is otherwise unchanged by this
session, so a prebuild would rewrite native folders for a cosmetic stamp on a simulator. The remedy, when a later
session needs an iOS device proof with a true version, is the documented ritual: bump `app.json` FIRST, then
`npx expo prebuild -p ios --no-install`, then build.
