# Session Prompt: alarmClock Backport (#49687) — throwaway branch, daily-use verification, dies at SDK 58

Owner-sequenced: runs on a fresh branch cut from uat; the branch is NEVER merged to uat or
main. Read `ai/AGENTS.md` first, act as Orchestrator.

## Owner's plan (2026-09-09, authoritative)

Patch the merged upstream fix into `node_modules/expo-notifications` via patch-package,
build ONE Android preview APK, install it on all four Android phones, and use it in daily
life. The codebase is then untouched until SDK 58 ships, at which point the patch and the
branch are deleted and the real release carries the fix. Nothing on the branch may leak
into uat/main; the branch is frozen at cut time and never rebased.

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
5. Build config (branch-only, never merges): add a temporary env block to the eas.json
   `preview` profile so the APK installs side-by-side with the Play app (all four phones
   have the Play app; a differently-signed same-id APK cannot install over it):
   `"env": {"EXPO_ANDROID_SUFFIX": "alarmtest", "EXPO_NAME_SUFFIX": "AlarmTest"}`.
   Do NOT pin `EXPO_PUBLIC_BG_INTERVAL_MINUTES` (ship default 360) and do NOT put the
   API key in eas.json — the EAS server `preview` environment already provides it
   (profile env > server env > .env).
6. `yarn validate` green; version bump (patch from current uat); commit; push branch.
7. Build: `eas build --platform android --profile preview --non-interactive --no-wait`
   (GLOBAL eas CLI only — `npx eas-cli` inside the repo crashes on minimatch). The
   postinstall hook applies the patch inside the EAS build automatically; native Kotlin
   means a real build, never OTA.
8. Owner installs `com.mugtaba.athan.alarmtest` on 3T (`3T_SERIAL`), 5T (`a2b9dbf`),
   8T (`8T_SERIAL`), Find X8 (`X8_SERIAL`) and switches daily use to it.
   One objective confirmation per device after the first schedule:
   `adb shell dumpsys alarm | grep -A2 mugtaba` — athan entries must show
   `window=0` (alarm-clock class; was `window=+1h0m0s0ms` windowed). After that,
   verification is daily use: prayers land at the minute, no 60s-to-minutes drift.
9. **Deletion day (SDK 58 or a 57.x patch carrying #49687)**: delete the branch and the
   patch, remove the postinstall script and devDep, upgrade, port the step-4 usage diff
   verbatim. Watch: expo-notifications CHANGELOG on the sdk-57 branch + npm.

## Constraints

- Branch never merges to uat/main; frozen at cut; never rebased onto later uat.
- `releases.json` untouched. Version bump every commit on the branch.
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
| B5 eas.json preview env suffix (branch-only) added | not started |
| B6 validate green, committed, pushed | not started |
| B7 EAS preview APK built; owner installed on 3T/5T/8T/Find X8; dumpsys `window=0` confirmed per device | not started |
| B8 Daily-use verdict (delivery punctuality on OEM phones) | pending owner use |
| B9 Real release carries #49687; branch + patch deleted; usage diff ported | waiting on SDK 58 |
| B10 ISSUES #22 addendum | SKIPPED per owner 2026-09-09 (fixed 1.22.19; rides daily use if ever revisited) |
