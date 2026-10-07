# Audit findings ledger

Code and tests cite these findings by number, as in "finding 74". This table resolves each number.
A version in the State column names the commit that closed it: `git log --grep "^1.25.35 - "`.

## Findings

| # | Finding | State |
| --- | --- | --- |
| 1 | `releases.json` still said 1.0.0 | Closed. Both stores answer for themselves (ISSUES #35, 1.29.19) and the file is deleted |
| 2 | `forceNotificationReschedule()` could not reopen the refresh gate | Fixed 1.25.18 (`resetStoredAtom`). Never write MMKV behind a persisted atom |
| 3 | The Extras preference migration landed on the wrong prayers | Fixed 1.25.25 |
| 4 | Migration writes were invisible to the reminder atoms in the same launch | Fixed 1.25.23 |
| 5 | Android athan channels were not created at schedule time | Closed 1.25.35. A missing channel posts on expo's fallback channel with the default tone |
| 6 | The error screen's Refresh wipes the prayer cache | Withdrawn. The owner ruled that the wipe stays. It runs through `clearUpgradeCache` (1.25.33) |
| 7 | No error boundary, and the display-date atom threw with nothing in the future | Fixed 1.25.27 |
| 8 | A malformed API day crashed the pipeline | Closed 1.25.37 and 1.25.59, then replaced by 71 |
| 9 | The repository did not record its build environment contract | Closed. `eas.json` carries the `env` blocks and `app.config.ts` fails at config time |
| 10 | `AlertType` integers are a storage contract that nothing pinned | Closed 1.25.39 |
| 11 | The notifications mock did not echo the identifier | Closed 1.25.40 |
| 12 | Extras night rows got less buffer than other rows | Closed 1.25.85. The buffer is now a request budget |
| 13 | `setSequence` skipped a correction in the middle of its window | Closed 1.25.54 |
| 14 | The two cache keep-lists disagreed on `cache_schema_version` | Closed 1.25.52 |
| 15 | The AppState listener registered 1500 ms late | Closed 1.25.84 |
| 16 | The warm-cache bootstrap was skipped on every version bump | Closed 1.25.82 |
| 17 | The buffer horizon was documented as 48 hours | Closed 1.25.95 |
| 18 | `compareVersions` inverted on a `v` prefix | Closed 1.25.55. A prerelease suffix still compares equal to its release, so never ship one |
| 19 | What's New headed another release's notes | Closed 1.25.90. The owner moves the stamp by hand, and no test may enforce it |
| 20 | The background interval override had no ceiling | Closed 1.25.51 and 1.25.61 |
| 21 | Nothing guarded the iOS limit of 64 pending notifications | Closed 1.25.41 |
| 22 | `cacheSchemaChanged` had no tests | Closed 1.25.42 |
| 23 | `atomWithStorageNumber` returned NaN for a corrupt value | Fixed 1.25.24 |
| 24 | No test made `scheduleNotificationAsync` reject | Closed 1.25.43 |
| 25 | Mock prayer times outlived the build that wrote them | Closed 1.25.83. Mock builds use their own MMKV store |
| 26 | Nothing guarded the 99-file audio matrix | Closed 1.25.44. A file of the right length that holds silence is still not caught |
| 27 | A merge could duplicate a prayer whose time changed | Closed 1.25.81 |
| 28 | `frame-audit.sh` could not fail on its SurfaceFlinger path | Fixed 1.25.14 and 1.25.92 |
| 29 | `device-checks.sh` did not read the permission grant | Fixed 1.25.12 |
| 30 | `device_checks.py` counted a restatement line as an armed alarm | Fixed 1.25.8 |
| 31 | `device_checks.py` flagged every reminder as a stray alert | Fixed 1.25.10 |
| 32 | `device_checks.py` matched the package by substring | Fixed 1.25.7 |
| 33 | `baseline-compare.sh` reported medians from a failed flow | Fixed 1.25.13 |
| 34 | `idle-cpu.sh` reported 0.0% when the app had two processes | Closed 1.26.15 |
| 35 | `device-checks.sh` printed PASS for a check it did not perform | Fixed 1.25.16 |
| 36 | The perf ring's `ts` axis doubled every mark to mark span | Closed 1.26.14 |
| 37 | The widget countdown froze beyond 24 hours | Closed 1.25.86 |
| 38 | The widget label over-read close to a boundary | Closed 1.26.10 |
| 39 | One native throw killed the widget's re-push chain | Closed 1.26.13 |
| 40 | No widget suite could catch 37 or 38 | Closed 1.26.12 |
| 41 | `widgetSettingsSync` pinned the calendar date, not `belongsToDate` | Closed. The fixture holds a 01:05 Isha |
| 42 | A cache gap made the widget show the next day's prayer all day | Replaced by 71. A missing day is listed as unreadable rows |
| 43 | The API endpoint serves London only | Open by design until the app goes worldwide |
| 44 | Magrib had no midnight-crossing rule | Closed 1.25.49 and 1.25.53 |
| 45 | Asr school selection | Withdrawn. The API is the source of truth and the app never changes a time it returns |
| 46 | Test oracles pinned the London zone name | Closed 1.25.48. 62 tests still hold London clock values |
| 47 | High latitude crashed on a missing Sunrise | Closed by 8 and 71. Polar-day modelling is not built |
| 48 | The Extras bell resolved its preference through two index spaces | Closed 1.25.80 |
| 49 | The sound sheet saved the athan before a reschedule that can throw | Closed 1.25.79, finished by 49b |
| 49b | The sound commit was not atomic | Closed 1.29.40. Write, channel, re-arm and undo run inside one lock |
| 50 | The alert sheet ignored the permission result | Closed 1.25.78 |
| 51 | `Day.tsx` threw on a null display date | Fixed 1.25.28 |
| 52 | The quality gate was a hook that a fresh clone did not get | Closed 1.25.64 |
| 53 | `pino` was a devDependency that ships | Closed 1.25.62 |
| 54 | Four debug variables could change a production build | Closed 1.25.76 |
| 55 | The suite ran with the widgets flag on | Closed 1.25.63 |
| 56 | Nothing tested that production logging is off | Closed 1.25.75 |
| 57 | A candidate cause for ISSUES #27 | Refuted. ISSUES #27 has its own record |
| 58 | `device_checks.py` crashed when two alarms shared a minute | Fixed 1.25.9 |
| 59 | A force-stop disarmed every alert and the gate blocked the restore | Fixed 1.25.30 (`reopenRefreshGateOnColdLaunch`) |
| 60 | `metro.config.js` called `inlineRequires` a throwaway experiment | Fixed 1.25.22. The transform is load-bearing |
| 61 | The pre-commit hook could not commit a config change | Fixed 1.25.21 |
| 62 | An armed alert with no alarm, seen once | Mechanism fixed 1.25.91. Never reproduced |
| 63 | Silent alerts might ring on the fallback channel | Refuted on the 3T. Do not add a silent channel |
| 64 | `athan15.mp3` might exceed the iOS 30 second limit | Resolved by a phone test. `athanDurations.test.ts` guards it |
| 65 | A mutation sweep found a branch no test witnessed | Closed 1.26.20 |
| 66 | The audio format identifies what played | Reference. Athans are 44100 Hz mono, reminders 22050 Hz stereo, `reminder.mp3` 48000 Hz stereo. A 44100 Hz stereo track is the system or fallback tone |
| 67 | The cache was wiped before the fetch that replaces it | Closed 1.26.33 and 1.26.35 |
| 68 | Istijaba across midnight | Closed 1.26.23 |
| 69 | A "broken day" is a shape check only | Reference. Replaced by 71 |
| 70 | Never substitute a prayer time | Owner ruling, permanent. No copy, average or synthesised value. A plausibility check is not built, and one may only fail honestly |
| 71 | Unreadable times render `--:--` | Closed 1.27.0 to 1.27.14. Design in `DASHES-DESIGN.md`. Its section 14 holds the choices the owner has not ruled on |
| 72 | A substituted Magrib built the first stored day's night rows | Closed 1.27.0 |
| 73 | Android refuses an app's 51st showing notification | Accepted by the owner. 78 keeps the app under the cap |
| 74 | Yesterday's still-due rows lost their place and their alarms after 00:00 | Closed 1.27.216 |
| 75 | Eight client tests failed between 00:00 and 00:59 BST | Closed 1.27.0 |
| 76 | Wrong comments | Part open. See the open items |
| 77 | The unit suite could not see the midnight, clock-change and unreadable cases. Tests cite its list as "gap map item N" | Closed. Each citing test is its item |
| 78 | Each notification replaces the one before it | Android built (`plugins/replacePreviousNotification.js`). iOS studied, and the owner declined every option |
| 79 | `ensurePermissions` never settled when Settings could not open | Closed 1.27.179 |
| 80 | In Ramadan a start-up error left the splash over the error screen | Closed 1.27.179 |
| 81 | A refused cancel during an Off commit lost alarms | Closed 1.27.190 (`commitPrayerAlertChange`) |
| 82 | A refused cancel released the scheduling lock early | Closed 1.27.179 |

## Open items

| Item | Detail |
| --- | --- |
| 76 | `shared/types.ts` labels `asr` Hanafi and `asr_2` Shafi. The payload's `asr_2` is the later one on every day, and the later Asr is the Hanafi one. `stores/notifications.ts` documents the athan index as 0-15, and 32 athans ship |
| `frame-audit.sh` output | The script writes its recording and frames under `e2e/evidence/`, inside the working tree, untracked and not ignored |
| `frame-audit.sh` contact sheet | It indexes the timestamp list by frame number with no length check, so more frames than timestamps raises IndexError |
| `noUncheckedIndexedAccess` | Off in `tsconfig.json`. The owner decides: the error count is the cost |
| Resource shrinking | Never enable it. Sounds are resolved by name at runtime, so shrinking would strip every athan with no error |

## Session 5 of the queue

The test harness and the commit gate came from this session. Their rules live where they are used.

| Rule | Where |
| --- | --- |
| How a suite is written | `__tests__/README.md` |
| The gate on every commit and push | `scripts/check-changed-coverage.js`, run by `yarn validate` and the hooks |
| What the gate cannot see | It catches a deleted or weakened test only when coverage drops. A redundant test's loss is caught by review and by the break scripts |

## Session records

A session whose plan gives findings text adds it below, under the plan's exact heading.

## Evidence-grade glossary (added 2026-10-07)

This ledger had no evidence-grade section before this line; the grades live in the test
comments that cite findings. K1: a test may cite a source file by bare filename, recorded
against the live instance `device/notifications.ts:105`.
