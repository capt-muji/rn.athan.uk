# Session 28 (D3) execution log

## Session of 2026-09-27

This session did the planning, the execution and the audit itself, in one session, as the owner's
2026-09-26 ruling requires. No subagent was used; no image needed reading.

### The five owner decisions taken while planning

1. The window becomes a request budget, not a day count.
2. The budget is spent a whole ROW at a time. Measured: sorting individual requests by fire time
   orphans a reminder in 98.0% of samples for a two-reminder user, because a reminder fires before
   the athan it warns about.
3. No day cap on the candidate walk. 🐋  "we should just always try and keep 64 notifications
   scheduled... if the user only has 1 prayer, For notification, 1 prayer, then that means we can do
   it for 60 days or 63 days."
4. Fill to 64, stopping at the last row that fits. Worst case lands on 63.
5. Design 1's two reminder cards, already built, kept unchanged.

### Measurements that drove the design

All against `mocks/full.ts`, the real London 2024 timetable, every sampled minute of the year.

| Model | Worst coverage | Max requests | Next Fajr unarmed |
| --- | --- | --- | --- |
| 2 list days, 1 reminder (ships on `uat-2`) | 26.3h | 46 | 0.0% |
| 1 list day, 2 reminders (the branch's code) | 2.3h | 38 | **79.9%** |
| Next 2 occurrences, uncapped | 47.0h | **66, over the ceiling** | 0.0% |
| Taper 3,1,1,1 | 95h athan, 23h reminder | 63 | 0.0% |
| **Request budget, row by row** | **see profile table** | **62 to 64** | **0.0%** |

The budget by profile, which is what settled it:

| User has armed | Requests used | Coverage |
| --- | --- | --- |
| 1 prayer, no reminders | 64 | 63 days |
| 5 daily, no reminders | 64 | 12 days |
| 5 daily, 1 reminder | 63 | 6 days |
| Standard 6, 2 reminders | 62 | 3 days |
| All 11, 2 reminders | 62 | 2 days |

### Findings recorded before any code changed

**The occurrence model peaks at 66 requests, over the 64 ceiling.** Istijaba is Friday-only, so its
second occurrence is up to 14 days out: 10 daily rows x 2 occurrences + 2 Istijaba = 22 rows x 3
alerts = 66. Bounding the walk to 2 days fixes it, but caps every user at ~47h whatever they armed.
This is why the occurrence model was put aside after being recommended.

**The work is on `design/d3-reminder-explorations`, not on `uat-2`.** `uat-2` still reads
`NOTIFICATION_ROLLING_DAYS = 2` and has no `ReminderSlot` at all. Every anchor is against the branch
tip `43f8983a`, so the plan's steps branch off the design branch and the feature reaches `uat-2` as
one merge at the end. Caught by the pre-flight's branch check before step 1 wrote anything.

### Baseline before step 1

`npx jest --selectProjects=unit`: 113 failed, 4214 passed, 4327 total; 13 failed suites, 118 passed.
Every failure asserts the two-day identifier set, exactly as `RESUME.md` recorded.

## Step 1: the budget replaces the day window

Branch `feat/28-request-budget`, off `design/d3-reminder-explorations`, version 1.28.60.

**Red:** the six `buildSchedulePlan` tests failed with `buildSchedulePlan is not a function`, as predicted.

**Built:**
- `shared/constants.ts`: `NOTIFICATION_ROLLING_DAYS` deleted; `NOTIFICATION_REQUEST_BUDGET = 64` and
  `SCHEDULE_CANDIDATE_DAYS = 60` added.
- `shared/notifications.ts`: `rollingDaysForPrayer` and `EVENING_BEFORE_ROWS` deleted;
  `CandidateRow`, `RequestCostReader`, `schedulePlanKey`, `buildSchedulePlan`, `collectCandidateRows`
  and `candidateListDays` added; `genScheduleDatesForPrayer` answers from the plan.
- `stores/notifications.ts`: `requestCostForPrayer` reads each prayer's armed state; both arming
  paths pass it; the empty-cache bail asks `candidateListDays()`.

**Breaks:** 7 of 7 caught, `ALL AS EXPECTED: 1`.

**Suite:** 113 failures in 13 suites at the start, 2 at the end. `tsc` and Biome both clean.

### Deviations from the plan, and why

1. **The cost reader is injected rather than read in `shared/`.** The plan said
   `genScheduleDatesForPrayer` would read each prayer's reminder settings to cost a row. Those
   settings live in `stores/notifications.ts`, which imports `shared/notifications.ts`, so reading
   them there would close an import cycle. The plan's contract is kept by passing a
   `RequestCostReader`; the store owns the preference read, as it already does everywhere else.
2. **The empty-cache bail reads `candidateListDays()`, not `genNextXDays(1)`.** The plan's
   `genNextXDays(1)` broke two finding-74 tests: with only a later day stored it bailed although
   that day's rows were armable. The walk already answers the exact question the guard asks, so the
   guard now asks it instead of restating it as a day count.

### Findings, kept for the audit

**Two `notificationAlertCommit` tests and eight `Alert.test.tsx` tests were already failing on the
branch tip `43f8983a`, before this step.** Measured by checking out that commit and running them:
`notificationAlertCommit` failed 5, now fails 2; components failed 9, now 8. They are the unfinished
sheet work the plan assigns to step 3, not regressions from the budget.

**A real test-isolation defect, fixed:** the `beforeEach` in `notificationAlertCommit.test.ts` reset
`standardReminderAlertAtoms` but never `extraReminderAlertAtoms`, so an Extras reminder stayed on
between tests. The reminder atom arrays are indexed `[slot][prayer]`, and three places iterated them
one level short, which surfaced as `atom.write is not a function`.

**A test that was wrong before this session:** `arms an Extras prayer from its own list` passed index
`3` with the name `'Last Third'`, whose canonical index is `1` (3 is Duha). The old code never read
the name, so the mismatch was invisible; the budget's cost reader resolves by name, which exposed it.

**DURABLE LESSON: `null <= now` is `true`, so a null datetime is dropped by the past-row check.**
Removing the `isReadable` guard alone changed no test, because `prayer.datetime <= now` coerces
`null` to `0`. The guard is still correct to keep, since relying on that coercion is accidental, but
a break that removes only the guard proves nothing: it has to remove both, which is what the break
script now does. This is why the sixth break was reported `NOT CAUGHT` until it was rewritten.

### Steps 2 and 3 folded into this commit, on the owner's ruling

The hook runs the whole suite, and 10 tests were failing on the branch tip before this session: 2 in
`notificationAlertCommit.test.ts` and 8 in `components/sheets/screens/__tests__/Alert.test.tsx`. They
are the plan's steps 2 and 3. The owner was asked and chose to fix them now rather than commit
against a red suite or use `--no-verify`, which `EXECUTOR-BRIEF.md` forbids outright.

**The two store failures were a REAL DEFECT in this step's own design, not stale assertions.**
`commitPrayerAlertChange` writes a prayer's preferences synchronously, BEFORE it takes the scheduling
lock. With two sheet closes queued, the second has already written `Off` by the time the first runs,
so `requestCostForPrayer` read 0 for the prayer the first change was arming and planned it zero days:
the first change armed nothing, and the test that needs its alarms to exist could not refuse a cancel.
Measured directly, `getPrayerAlertType` read 0 while the first change was still in flight.

Fixed by `requestCostReader({ scheduleType, englishName, cost })`: the prayer being armed this instant
is costed from the settings the CALLER was given, and every other prayer from storage. Both arming
paths already receive their own alert and reminders as arguments, so the caller's intent is available
and authoritative. The alternative, moving the preference write inside the lock, would have changed
the commit ordering that finding 81's all-or-nothing rule depends on, so it was not taken.

**The eight sheet failures were the second card's arrival.** Every `getByRole('switch')` and
`getByRole('button', { name: 'Decrease' })` now matches two elements. Replaced with slot-named
helpers beside the existing `athanOption`/`reminderOption` pair: `reminderSwitch`,
`secondReminderSwitch` and `secondReminderOption`.

**Four tests added for the second card**, which had none of its own: both cards drawn with a switch
each, the second locked until the first is on, each slot saving its own sound and minutes with the
defaults keeping them off one minute, and the athan going Off taking both reminders with it.

### Final state of this commit

- `npx jest` across both projects: **171 suites, 4711 tests, 0 failures.**
- Coverage on the changed files: statements, branches, functions and lines all **100%**.
- `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0.
- Break script: **7 of 7 caught, `ALL AS EXPECTED: 1`.**

### Found by reading the commit back cold, and fixed before the merge

The first version of the fix had each arming path work out the prayer's cost for itself: the at-time
path counted the reminder slots from STORAGE while the reminder path counted the array it was handed.
During a commit those two can disagree, which is the very divergence the fix existed to close, so the
at-time half could plan a different number of days from the reminder half for one prayer in one pass.

`applyPrayerAlerts` is the only function that sees both halves, and it already computes `armed` for
the at-time-off constraint. It now computes `requestCost` once beside it and passes it to both, so
the two cannot disagree by construction. The parameter is optional, and a full reschedule omits it,
because that path reads every prayer from storage anyway and no commit is in flight.

## Step 4: What's New

Version 1.29.0, a MINOR bump because this completes the feature (`ai/AGENTS.md` section 6).

One item added to `shared/whatsNew.ts`, parked at `version: null` as that file's ritual requires:
whether a release shows the modal is the owner's editorial call, made by stamping the version at the
store release. No flag, because the feature ships on both platforms at once. Title 17 characters and
body 75, inside the 32 and 96 limits `whatsNew.test.ts` enforces.

## Status at the end of this session

Row 28 is EXECUTED. Nothing is merged into `uat-2` yet and nothing is pushed: the audit does that.

| Check | Result |
| --- | --- |
| Whole suite, both projects | 171 suites, 4718 tests, 0 failures |
| Coverage | statements, branches, functions and lines all 100% |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check . --error-on-warnings` | exit 0 |
| Break script | 7 of 7 caught, `ALL AS EXPECTED: 1` |
| Device proof | none needed for steps 1 to 3; the owner judges the sheet on their own phones |

### What the audit should look at first

1. **`requestCostReader`'s `armingNow` parameter.** It exists because a commit's stored preferences
   can belong to a later change. Check that the only callers passing it are the two arming paths,
   and that a full reschedule still omits it.
2. **The repaired suites.** Several assertions grew a third list day because the budget reaches every
   stored day. Each one was checked against what the test stores, not pasted from what the code
   printed; the audit should confirm that judgement on a sample.
3. **`SCHEDULE_CANDIDATE_DAYS = 60`.** A loop guard, never a coverage number, pinned by
   `constants.test.ts` as never being the binding limit for the worst-case user.
