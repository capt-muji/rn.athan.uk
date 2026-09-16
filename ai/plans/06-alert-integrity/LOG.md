# Execution log: Session 6

## Step 1: Open Settings always answers (finding 79)

- Branch: `fix/audit-79-open-settings-answers`, off `uat-2`.
- Commit: `bf42c705`, version 1.27.177. Merge: `3499b765`.
- Pre-flight: VERSION 1.27.176, all 18 anchors count 1, PREFLIGHT OK (row set IN PROGRESS, committed with this step).
- Red: `Tests: 10 failed, 87 passed, 97 total`, every named test failing; the permission-read failure listed twice, as the plan says.
- Green: `Tests: 97 passed, 97 total`; coverage run `Tests: 98 passed, 98 total` with `useNotification.ts | 100 | 100 | 100 | 100`; tsc exit 0; Biome `No fixes applied.`
- Breaks: 10 lines `BREAK 1 AS EXPECTED`, last line `ALL AS EXPECTED: 1`.
- Hook: last `Tests:` line `Tests:       4485 passed, 4485 total`; `Statements   : 100% ( 3789/3789 )`, `Branches     : 100% ( 1644/1644 )`, `Functions    : 100% ( 781/781 )`, `Lines        : 100% ( 3405/3405 )`; no `Coverage gate:` line.
- Review: Code Reviewer (GLM 5.3), verdict `merge`, 1 round, no findings.

## Step 2: A start-up error lifts the splash (finding 80)

- Branch: `fix/audit-80-error-screen-lifts-splash`, off `uat-2`.
- Commit: `582ec838`, version 1.27.178. Merge: `b6e2bf26`.
- Red: `Tests: 2 failed, 35 passed, 37 total`, both named tests failing; `Expected number of calls: 1` / `Received number of calls: 0` in the first, `-   "afterIcon": 1,` / `+   "afterIcon": 0,` in the second, as the plan says.
- Green: `Tests: 37 passed, 37 total`; coverage run `Tests: 37 passed, 37 total` with `index.tsx | 100 | 100 | 100 | 100` and the expected `at Index (app/index.tsx:57:33)` jotai lines; tsc exit 0; Biome `No fixes applied.`
- Breaks: 2 lines `BREAK 2 AS EXPECTED`, last line `ALL AS EXPECTED: 1`.
- Hook: last `Tests:` line `Tests:       4487 passed, 4487 total`; `Statements   : 100% ( 3789/3789 )`, `Branches     : 100% ( 1645/1645 )`, `Functions    : 100% ( 781/781 )`, `Lines        : 100% ( 3405/3405 )`; no `Coverage gate:` line.
- Review: Code Reviewer (GLM 5.3), verdict `merge`, 1 round, no findings.

## Step 3: The scheduling lock waits for every piece of work (finding 82)

- Branch: `fix/audit-82-lock-waits-for-every-piece`, off `uat-2`.
- Commit: `c57b5721`, version 1.27.179. Merge: `5881b9f2`.
- Red: `Tests: 7 failed, 7 total`, every named test failing; the first failure showed `"dhuhr": Array [` with `"athan_standard_dhuhr_2026-08-29",` and `"athan_standard_dhuhr_2026-08-30",`, as the plan says.
- Green: `Tests: 7 passed, 7 total`; coverage run `Test Suites: 47 passed, 47 total`, `Tests: 959 passed, 959 total`, two rows `notifications.ts | 100 | 100 | 100 | 100`; tsc exit 0; Biome `No fixes applied.`
- Breaks: 8 lines `BREAK 3 AS EXPECTED`, last line `ALL AS EXPECTED: 1`.
- Hook: last `Tests:` line `Tests:       4494 passed, 4494 total`; `Statements   : 100% ( 3801/3801 )`, `Branches     : 100% ( 1649/1649 )`, `Functions    : 100% ( 785/785 )`, `Lines        : 100% ( 3412/3412 )`; no `Coverage gate:` line.
- Review: Code Reviewer (GLM 5.3), verdict `merge`, 1 round; one cosmetic note (a trailing blank line at LOG.md's end), fix none required before merge. Contrary to what this record first claimed, the blank line was not removed then; the audit session removed it on 2026-09-16.

## Device proof (section 7)

- FINAL=5881b9f223db6b6d782813e3288ca265440ebc09
- 7.0: device `device`, auto_time `1`, `showing=true` count 0; stayon usb set; alarms-start holds exactly the 2036 WorkManager alarm (`when=2036-09-12 04:40:40.505`) and one NOTIFICATION_EVENT alarm (Asr 2026-09-16 16:21).
- 7.1: BUILD-MOCK OK, versionName 1.27.164; install Success; `LAUNCH80 seed before-seed ... forced-throw-lines 0 fatal 0`; `LAUNCH80 throw before-throw ... forced-throw-lines 4 fatal 0`; vision read 80-before-throw.png: SPLASH. BEFORE_PNG=80-before-throw.png
- 7.2: BUILD-MOCK OK, versionName 1.27.179 (package.json 1.27.179); install Success; `LAUNCH80 seed after-seed ... forced-throw-lines 0 fatal 0`; `LAUNCH80 throw after-throw ... forced-throw-lines 4 fatal 0`; vision read 80-after-throw.png: ERROR. AFTER_PNG=80-after-throw.png
- 7.3: BUILD-PROD OK, `package com.mugtaba.athan, versionCode 1000000, versionName 1.27.179`; install Success; cold prod-cold (screen read may have printed DUMP FAILED); two `waited 15s`; alarms-prod-cold: `ISHA ALARMS AS EXPECTED (off): 3 app alarms` (Asr 16:21 today, Fajr 05:05 and Asr 16:20 tomorrow); Athan notification settings page opened with the APP_PACKAGE extra.
- 7.3 item 8: `AppSettings: com.mugtaba.athan (10186) importance=NONE showBadge=true` (the owner turned Show notifications off).
- 7.3 items 9–12: Athan relaunched (`Warning: Activity not started, its current task has been brought to the front`); the owner did the steps: Isha bell with a slash, Cancel on the dialog, the sheet opened, Silent tapped, the dialog again, Open Settings, Show notifications turned ON, Back to the app. Vision read 79-back-from-settings.png: `SILENT 5`. M=5.
- 7.3 items 13–15: the owner turned the Reminder switch ON and closed the sheet; after `waited 15s`, alarms-isha-on: `ISHA ALARMS AS EXPECTED (on): 7 app alarms` — Isha at-time 20:31 today and 20:29 tomorrow, reminders 20:26 and 20:24, plus the owner's three kept alarms.
- 7.3 items 16–18: the owner tapped Isha Off and closed the sheet; after `waited 15s`, alarms-isha-off: `ISHA ALARMS AS EXPECTED (off): 3 app alarms` — every Isha alarm and reminder cancelled, the owner's three alarms kept.
- 7.4: BUILD-MOCK OK, versionName 1.27.179; install Success; home, am kill, relaunch (`Starting: Intent`), waited 10s; vision read mock-final.png: YES (Asr highlighted, countdown 1m 3s).
- 7.5: stayon false; auto_time `1`; versionName=1.27.179; alarms-end holds the 2036 WorkManager alarm and 3 NOTIFICATION_EVENT alarms; `copied 0` devcheck prod-cold files (the cold screen read printed `DUMP FAILED` while the countdown ran, as the plan allows).
- Reality Checker (GLM 5.3): every claim this session's evidence owns is PROVEN (including independent re-runs of isha_alarms.py against the saved dumps, which printed AS EXPECTED again); the one NOT PROVEN line is the planning-time observation "the 3T closed that settings page at once (checked while planning)", which section 8.1 itself labels as checked while planning and no session-6 file could bear on. Final line: `evidence holds`.
