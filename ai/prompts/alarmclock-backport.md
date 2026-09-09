# Session Prompt: alarmClock Backport (#49687) — RUNS LAST, after the large-screen feature is merged to uat

Owner-sequenced 2026-09-08: this session happens ONLY after `ai/prompts/large-screen-adaptation.md` is completed AND merged to uat. It is the last item on the owner's list. Read `ai/AGENTS.md` first, act as Orchestrator.

## Goal

The owner wants weeks/months of real-device testing of exact alarm delivery BEFORE SDK 58 exists. Backport the MERGED upstream fix expo/expo#49687 ("[android][notifications] Add opt-in alarmClock delivery to scheduled triggers", ISSUES #17's fix) into our build on a throwaway branch that is NEVER merged to uat or main.

## Facts (verified 2026-09-08)

- #49687 merged to expo/expo `main` at 2026-09-08T13:10Z by vonovak. **Merge commit: `257006e`** — this includes the maintainer's pre-merge adjustments; use THIS state, never our original draft.
- It rides the SDK-58 line (changelog "Unpublished" block); latest 57.x (`57.0.17`, 2026-09-04) predates it. No backport release exists. Watch confirms status if stale: `curl -s https://api.github.com/repos/expo/expo/pulls/49687 | jq '.state, .merged_at'` plus the npm 57.x line.
- Shipped API: `delivery: 'bestEffort' | 'alarmClock'` on `DateTriggerInput` and the repeating wall-clock triggers (`Notifications.types.ts`), Android-only, default `'bestEffort'`, degrades to best-effort without the exact-alarm permission.
- Files in the merged PR (the ones we backport): `NotificationScheduler.kt`, `NotificationTriggers.kt`, `ExpoSchedulingDelegate.kt` (android), `NotificationScheduler.types.ts`, `Notifications.types.ts`, `scheduleNotificationAsync.ts`, `parseTrigger-test.ts`. Ignore docs/CHANGELOG/bare-expo/native-component-list.
- Precedent: the G.1 fallback plan (ISSUES.md) sanctions patch-package backports of MERGED code, deleted when the real release ships.

## Procedure

1. `git checkout uat && git pull`, then `git checkout -b experiment/alarmclock-backport` (branch name fixed; never merge).
2. Extract the merged diff: `curl -s https://github.com/expo/expo/commit/257006e.diff` (or the compare API) and keep only the files listed above.
3. Apply hunks onto `node_modules/expo-notifications@<installed>` (57.0.17 at session-start; re-check). Expect drift between `main` and the 57.x branch in surrounding code (the same Unpublished block carries #49072 and others) — reconcile manually against the 57.x sources; the alarmClock hunks themselves are additive (new enum, new trigger field, `setAlarmClock()` branch).
4. `yarn add -D patch-package` and add `"postinstall": "patch-package"` to package.json scripts (branch-only; this is the sanctioned exception to no-new-deps, owner-ordered).
5. `npx patch-package expo-notifications` — verify `patches/expo-notifications+<version>.patch` contains exactly the backport.
6. Adopt the API on this branch only: `delivery: 'alarmClock'` on our `DateTriggerInput`s for Athan/reminder notifications in `stores/notifications.ts` (the real adoption diff, reusable verbatim when SDK 58 lands).
7. `yarn validate` green; version bump (silent What's New); commit; push branch.
8. Build: `eas build --platform android --profile preview --non-interactive --no-wait` (global `eas` CLI; never `npx eas-cli` inside the repo — minimatch crash). Owner installs the APK on the bench phones and verifies per the #10/#17 protocol (8T/Find X8 alarms store `window=0 flags=0x9`, same-minute delivery +0ms).
9. **Deletion day**: the moment an SDK-57.x patch or SDK 58 release carries #49687 (watch: expo-notifications CHANGELOG on the sdk-57 branch + npm), delete the branch and patch, install the real release, port the usage diff from step 6.

## Constraints

- Branch never merges to uat/main. No speculative SDK 58 upgrade. `releases.json` untouched. Version bump every commit.
- Phone quirks stand: doubled `am start` on the 3T, 8T Auto-launch re-enable after reinstall (#19), Maestro server dies across Mac reboots.

## TRACKER — update at every session end

| Step | Status |
| --- | --- |
| B1 Branch created from uat (post-widescreen merge) | not started |
| B2 Diff extracted + drift reconciled onto installed 57.x | not started |
| B3 patch-package patch generated + postinstall wired | not started |
| B4 `delivery: 'alarmClock'` adopted in our triggers | not started |
| B5 validate green, committed, pushed | not started |
| B6 EAS preview built; owner installed on bench phones | not started |
| B7 Device verification per #10/#17 protocol (results) | not started |
| B8 Real release carries fix; branch + patch deleted; usage diff ported | not started |
