# Session Prompt: alarmClock Backport (#49687) — throwaway branch, daily-use verification, dies at SDK 58

Owner-sequenced: runs on a fresh branch cut from uat; the branch is NEVER merged to uat or
main. Read `ai/AGENTS.md` first, act as Orchestrator.

## Owner's plan (2026-09-09, authoritative)

Patch the merged upstream fix into `node_modules/expo-notifications` via patch-package,
then submit TWO EAS cloud builds at the same version: the real Android APK
(`com.mugtaba.athan`, Release compilation, exactly what would ship to production) and an
iOS IPA purely for version parity (#49687 is Android-only — iOS gets no functional
change). The owner installs the Android APK on all phones DIRECTLY from the EAS build
page (no Mac/adb connection needed — the phones are already clean of every previous
install) and uses it as the one true app in daily life. The codebase is then untouched
until SDK 58 ships, at which point the patch and the branch are deleted and the real
release carries the fix. Nothing on the branch may leak into uat/main; the branch is
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
4. Usage diff (the ONLY functional app-code change, written to port verbatim to SDK 58):
   `delivery: 'alarmClock'` on the `DateTriggerInput`s for Athan and reminder
   notifications in `stores/notifications.ts`.
5. What's New re-stamp (branch-only, rides the 1.24.0 bump): in `shared/whatsNew.ts` set
   `WHATS_NEW.version` AND the three shipped items (Tablet support, Athan sounds,
   Reminder sounds) from `'1.23.1'` to `'1.24.0'` — identical content, so the 1.24.0
   popup presents the same three items. The parked widgets item stays `version: null`.
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
   `expo run:android`, no gradle, no local EAS builds). Submit BOTH platforms at 1.24.0:
   `eas build --platform android --profile preview --non-interactive --no-wait` and
   `eas build --platform ios --profile preview --non-interactive --no-wait`
   (GLOBAL eas CLI only — `npx eas-cli` inside the repo crashes on minimatch). Expo's
   build server runs yarn install → the postinstall hook applies the patch → the patched
   Kotlin compiles into the Release APK. Native Kotlin means a real build, never OTA.
8. Owner installs EVERYTHING personally from the EAS build page in each device's browser
   (both platforms, no exceptions — no adb, no devicectl, every device is already clean):
   the APK on 3T, 5T, 8T, Find X8 and the IPA on the XS (registered for internal
   provisioning — campaign precedent 1.18.1 ship360 IPA).

   iOS INSTALL PATH (owner question 2026-09-09 — discuss and verify in this session, no
   TestFlight/ASC detour): the internal-distribution IPA installs straight from the EAS
   build page in Safari, like Android — ad-hoc/development signed (paid account = 1-year
   profile). BEFORE building, verify the XS is registered: `eas device:list` must show
   UDID IPHONE_UDID; if absent, `eas device:create` walks the owner through
   registration on the phone, then build. After install, one-time trust step on the
   phone: Settings → General → VPN & Device Management → trust the developer cert.
   FALLBACK (owner-sanctioned exception if the link route fails): the agent installs the
   IPA over USB: `xcrun devicectl device install app --device IPHONE_UDID
   <path.ipa>`. Same result; the owner just does not tap the button personally.
   Objective confirmation ONLY on the connected 3T after its first schedule:
   `adb -s 3T_SERIAL shell dumpsys alarm | grep -A2 mugtaba` — athan entries must show
   `window=0` (alarm-clock class; was `window=+1h0m0s0ms` windowed). All other devices:
   verification is daily use — prayers land at the minute, no 60s-to-minutes drift.
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
| B4b What's New re-stamped to 1.24.0 (same three items, parked widgets item untouched) | not started |
| B5 eas.json preview profile wired to the `preview` EAS environment (real key, non-local env; branch-only) | not started |
| B6 validate green, committed, pushed | not started |
| B7 EAS APK + parity IPA built at 1.24.0; owner installs BOTH personally via the EAS link (APK on 3T/5T/8T/Find X8, IPA on the XS; devices already clean); dumpsys `window=0` confirmed on the connected 3T | not started |
| B8 Daily-use verdict (delivery punctuality on OEM phones) | pending owner use |
| B9 Real release carries #49687; branch + patch deleted; usage diff ported | waiting on SDK 58 |
| B10 ISSUES #22 addendum | SKIPPED per owner 2026-09-09 (fixed 1.22.19; rides daily use if ever revisited) |
