# Session Prompt: alarmClock Backport (#49687) — throwaway branch, daily-use verification, dies at SDK 58

Owner-sequenced: runs on a fresh branch cut from uat; the branch is NEVER merged to uat or
main. Read `ai/AGENTS.md` first, act as Orchestrator.

## Owner's plan (2026-09-09, authoritative)

Patch the merged upstream fix into `node_modules/expo-notifications` via patch-package,
build ONE real Android APK (`com.mugtaba.athan`, Release compilation, exactly what would
ship to production — just hand-distributed), uninstall the Play Store app on all phones
first, install this as the one true app, and use it in daily life. The codebase is then
untouched until SDK 58 ships, at which point the patch and the branch are deleted and the
real release carries the fix. Nothing on the branch may leak into uat/main; the branch is
frozen at cut time and never rebased.

## Facts

- #49687 merged to expo/expo `main` 2026-09-08 by vonovak, merge commit `257006e`
  (maintainer pre-merge adjustments included — use THIS state, never an older draft).
  Rides the SDK-58 line; no 57.x backport release exists. First action of the session:
  re-check the npm 57.x line — if a 57.x patch already carries it, the whole session
  collapses to deletion day (below).
- Shipped API: `delivery: 'bestEffort' | 'alarmClock'` on `DateTriggerInput` and the
  repeating wall-clock triggers. Android-only, default `'bestEffort'`, degrades to
  best-effort without the exact-alarm permission.
- Files to backport from the diff: `NotificationScheduler.kt`, `NotificationTriggers.kt`,
  `ExpoSchedulingDelegate.kt` (android), `NotificationScheduler.types.ts`,
  `Notifications.types.ts`, `scheduleNotificationAsync.ts`, `parseTrigger-test.ts`.
  Ignore docs/CHANGELOG/bare-expo/native-component-list.
- Precedent: patch-package backports of MERGED code are sanctioned (G.1 fallback plan),
  deleted when the real release ships.

## Procedure

1. `git checkout uat && git pull && git checkout -b experiment/alarmclock-backport`
   (branch name fixed; never merge, never rebase).
2. Extract the merged diff: `curl -s https://github.com/expo/expo/commit/257006e.diff`,
   keep only the files above. Apply onto `node_modules/expo-notifications@<installed>`
   (re-check installed version at session start). Expect drift between `main` and 57.x in
   surrounding code — reconcile manually against the 57.x sources; the alarmClock hunks
   are additive (new enum, new trigger field, `setAlarmClock()` branch).
3. `yarn add -D patch-package`, add `"postinstall": "patch-package"` to package.json
   scripts (branch-only; the sanctioned exception to no-new-deps). `npx patch-package
   expo-notifications` and verify `patches/expo-notifications+<version>.patch` contains
   exactly the backport.
4. Usage diff (the ONLY app-code change, written to port verbatim to SDK 58):
   `delivery: 'alarmClock'` on the `DateTriggerInput`s for Athan and reminder
   notifications in `stores/notifications.ts`.
5. Build config (branch-only, never merges): the APK must carry the real package id and
   REAL data. First verify the EAS `preview` environment:
   `eas env:vars --environment preview` — it must contain `EXPO_PUBLIC_API_KEY` and a
   non-local `EXPO_PUBLIC_ENV` (unset `EXPO_PUBLIC_ENV` means mock data — a daily-use
   build must not ship mock). If `EXPO_PUBLIC_ENV` is missing there, pin
   `"EXPO_PUBLIC_ENV": "preview"` in the profile env. Then add
   `"environment": "preview"` to the eas.json `preview` profile (Release compilation,
   internal distribution = directly installable APK; no app-id suffix, no name suffix).
   NEVER put the API key itself in eas.json.
6. `yarn validate` green; MINOR version bump (1.24.0 — feature grade, distinguishes the
   daily-use build from the 1.23.x line); commit; push branch.
7. Build on EAS CLOUD ONLY — no local compilation ever on this branch (no
   `expo run:android`, no gradle, no local EAS builds):
   `eas build --platform android --profile preview --non-interactive --no-wait`
   (GLOBAL eas CLI only — `npx eas-cli` inside the repo crashes on minimatch). Expo's
   build server runs yarn install → the postinstall hook applies the patch → the patched
   Kotlin compiles into the Release APK. Native Kotlin means a real build, never OTA.
8. Owner UNINSTALLS the existing Play Store app on every phone FIRST (same package id;
   signature differs from a store install), then installs the APK on 3T (`3T_SERIAL`),
   5T (`a2b9dbf`), 8T (`8T_SERIAL`), Find X8 (`X8_SERIAL`) as the one true app.
   One objective confirmation per device after the first schedule:
   `adb shell dumpsys alarm | grep -A2 mugtaba` — athan entries must show
   `window=0` (alarm-clock class; was `window=+1h0m0s0ms` windowed). After that,
   verification is daily use: prayers land at the minute, no 60s-to-minutes drift.
9. **Deletion day (SDK 58 or a 57.x patch carrying #49687)**: delete the branch and the
   patch, remove the postinstall script and devDep, upgrade, port the step-4 usage diff
   verbatim. Watch: expo-notifications CHANGELOG on the sdk-57 branch + npm. When the
   next store release goes out, verify the Play install replaces the side-loaded APK
   (if the EAS keystore differs from the Play upload key, uninstall-first once more).

## Constraints

- Branch never merges to uat/main; frozen at cut; never rebased onto later uat.
- ALL compilation on EAS cloud. No local builds of any kind on this branch.
- `releases.json` untouched. Version: minor bump 1.24.0 on the branch.
- Phone quirks stand: doubled `am start` on the 3T; 8T Auto-launch re-enable after
  reinstall (#19 mitigated); 8T USB re-enumeration after reboots; Play Protect blocks
  sideloads on ColorOS 16 (`settings put global package_verifier_enable 0` +
  `verifier_verify_adb_installs 0`, restore after).

## TRACKER — update at every session end

| Step | Status |
| --- | --- |
| B1 Branch created from uat | not started |
| B2 Diff extracted + drift reconciled onto installed 57.x | not started |
| B3 patch-package patch generated + postinstall wired | not started |
| B4 `delivery: 'alarmClock'` adopted in `stores/notifications.ts` | not started |
| B5 eas.json preview profile wired to the `preview` EAS environment (real key, non-local env; branch-only) | not started |
| B6 validate green, committed, pushed | not started |
| B7 EAS APK built; Play app uninstalled on each phone; APK installed on 3T/5T/8T/Find X8 as the one true app; dumpsys `window=0` confirmed per device | not started |
| B8 Daily-use verdict (delivery punctuality on OEM phones) | pending owner use |
| B9 Real release carries #49687; branch + patch deleted; usage diff ported | waiting on SDK 58 |
| B10 ISSUES #22 addendum | SKIPPED per owner 2026-09-09 (fixed 1.22.19; rides daily use if ever revisited) |
