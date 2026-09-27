# Plan: Session 28. D3. The rolling buffer becomes a request budget, plus a second reminder

| Field | Value |
| --- | --- |
| Brief | `ai/plans/SDK58-PROGRAMME.md` D3 + `ai/plans/28-d3-rolling-buffer/INVESTIGATION.md` |
| Planned at | `43f8983a`, the tip of `design/d3-reminder-explorations`, 2026-09-27 |
| Planned by | Planning session on 2026-09-27 |
| Needs first | 27 (DONE) |
| Steps | 4, each one branch, one commit, one version |
| Device | none for steps 1 to 3; the owner's own phones judge the sheet after the merge |
| Owner decisions still needed | None (all five taken while planning; see section 2.1) |

**Where this plan's work lives.** The slot model, the sheet and the slot-aware store path are on
`design/d3-reminder-explorations` and are NOT on `uat-2`, which still reads
`NOTIFICATION_ROLLING_DAYS = 2` with no `ReminderSlot` at all. Every anchor and line number here is
against that branch, so its steps branch off IT and not off `uat-2`, and the whole feature reaches
`uat-2` as one merge at the end. Branching a step off `uat-2` would find neither the slot model nor
the code the anchors name.

## 1. Goal

Today a prayer's alarms are chosen by DAY: the app arms "today's list", and at
`NOTIFICATION_ROLLING_DAYS = 1` that is today alone. A day is an arbitrary box around a prayer
schedule, and the box leaks: once today's Fajr has passed it is neither future nor in range, so
**the next Fajr is unarmed for 79.9% of the year** and the horizon collapses to 2.3 hours at its
worst. That window was set so three alerts per prayer would fit iOS's 64-request ceiling, which
means the arithmetic that protects the ceiling is also what breaks the coverage.

When this plan is DONE the app chooses by REQUEST BUDGET instead. It walks upcoming prayer rows in
time order and arms each row completely, all of its alerts together, while the remaining budget can
hold it. There is no day count anywhere in the decision. The owner would notice three things: a
second reminder exists on every prayer, each with its own toggle, sound and interval; the next Fajr
is always armed; and a phone left shut stays covered for far longer than before, dramatically so for
the typical user who arms five prayers and no reminders.

Measured against the real London year in `mocks/full.ts`, worst case across every sampled minute:

| User has armed | Requests used | Coverage today | Coverage after |
| --- | --- | --- | --- |
| 1 prayer, no reminders | 64 | 23h | **63 days** |
| 5 daily, no reminders | 64 | 23h | **12 days** |
| 5 daily, 1 reminder | 63 | 23h | **6 days** |
| Standard 6, 2 reminders | 62 | n/a | **3 days** |
| All 11, 2 reminders (worst case) | 62 | 23h | **2 days** |

The owner's rules that govern this plan, quoted with their source:

🐋  "I want to completely ban using subagents, and I want you to do all the work yourself every
single time. So everything in one session, the planning, the execution and the audits." (owner,
2026-09-26, `ai/AGENTS.md` section 0)

🐋  "the comments should be extremely compact, and they should only explain the why, and they should
never explain the how or the what, because those two should be self-explanatory from your code. If
it's not self-explanatory, then it's not clean enough, it's not good enough, it's not refactored
enough." (owner, 2026-09-26, `ai/AGENTS.md` section 15)

An alert does exactly what its bell shows: Off fires nothing, Silent fires silently, Sound fires
with sound, and it is never out of step "until the next refresh" (`EXECUTOR-BRIEF.md` section 2,
finding 81 and session 6b). This plan extends that rule from two alerts to three.

## 2. Decisions

### 2.1 Taken

1. **The window becomes a request budget, not a day count** (owner, 2026-09-27, this session).
   The owner ruled out both the 1-day window (breaks Fajr 79.9% of the year) and the 2-day window
   (cannot carry a second reminder: 72 > 64). Recorded in `INVESTIGATION.md` and in section 5 here.
2. **The budget is spent a whole ROW at a time, never a request at a time** (owner, 2026-09-27).
   A row is armed completely or not at all. Sorting individual requests by fire time orphans
   reminders, because a reminder fires before the athan it warns about: measured at **98.0% of
   samples** for a two-reminder user, where the phone warns about an athan it then never plays.
   Row-by-row makes that impossible by construction, and it is what finding 81's all-or-nothing rule
   requires.
3. **There is no day cap on the candidate walk** (owner, 2026-09-27). 🐋  "instead of capping us or
   capping at 7 days or 14 days or whatever days, we should just always try and keep 64 notifications
   scheduled... it depends on what the user actually has scheduled. So, yeah, we'll do it on the, if
   the user only has 1 prayer, For notification, 1 prayer, then that means we can do it for 60 days
   or 63 days." The walk stops on the budget or on the end of cached data, whichever comes first.
4. **The budget is filled to 64, stopping at the last row that fits** (owner, 2026-09-27). No spare
   slots are held back: nothing else in this app schedules notifications. The worst case lands on 63,
   because the 22nd row would need slots 64 to 66 and is dropped whole.
5. **Design 1 of five for the sheet: two separate reminder cards**, each with its own toggle, sound
   and interval (owner, 2026-09-26, chosen on screenshots). Already built on
   `design/d3-reminder-explorations`; this plan keeps it unchanged.
6. **The conflict rule: the stepper SKIPS the other reminder's minute and greys out at the ends**
   (owner, 2026-09-26). A clash cannot be expressed, so no error is ever shown. Already built and
   green.
7. **Slot 0 keeps the single-reminder MMKV keys**, slot 1 takes a `_2` suffix, so no migration
   exists and every existing user's reminder survives (planner, 2026-09-26). Already built.
8. **`SCHEDULE_CANDIDATE_DAYS = 60` is a loop guard, not a policy** (planner, 2026-09-27). The walk
   needs a stopping condition when the cache is thin, or it scans forever for a candidate that does
   not exist. 60 is above the 1-prayer user's measured 65-day reach only in the sense that it bounds
   the scan; the budget or the cache stops the walk first in every measured profile. It is named for
   what it guards, never used as a coverage number, and `constants.test.ts` pins that it is never the
   binding limit for the worst-case user.

### 2.2 The executor must not decide

STOP and ask the owner when any of these happens. The general rules are in `EXECUTOR-BRIEF.md`
section 2; these are this plan's own.

1. Any anchor count other than 1. Question: "Anchor `<name>` counted `<n>`, not 1. The code has moved
   since the plan was written. Replan?"
2. A test fails that this plan does not name as expected-red. Question: "`<test name>` failed and the
   plan does not predict it. Expected `<X>`, saw `<Y>`. What should it be?"
3. A break script prints `BREAK NOT APPLIED`. Question: "Break `<label>` did not apply, so the
   substitution no longer matches the code. Replan?"
4. The worst-case request count measured in step 2 is above 64. Question: "The budget arithmetic gives
   `<n>` requests in the worst case, above the 64 ceiling. The plan expects 63. How should the budget
   be reduced?"
5. Coverage is below 100% at commit. Never add an ignore comment.
6. Anything touching visuals, prayer times, `releases.json`, `uat` or EAS.
7. Anything a step does not answer that the executor would otherwise decide. Question: "The plan does
   not say `<X>`. What should it be?"

## 3. Pre-flight

Save as `$TMPDIR/preflight-28.sh`, run as `bash $TMPDIR/preflight-28.sh <k>`.

```bash
#!/usr/bin/env bash
set -euo pipefail

STEP="${1:-1}"
REPO=/Users/muji/repos/rn.athan.uk
cd "$REPO"

[ "$(pwd)" = "$REPO" ] || { echo "WRONG CHECKOUT: $(pwd)"; exit 1; }

BRANCH=$(git branch --show-current)
[ "$BRANCH" = "design/d3-reminder-explorations" ] || { echo "WRONG BRANCH: $BRANCH"; exit 1; }

DIRTY=$(git status --porcelain | grep -v -E 'ai/plans/README.md|ai/plans/28-d3-rolling-buffer/' || true)
[ -z "$DIRTY" ] || { echo "DIRTY TREE:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "uat-2 IS BEHIND origin"; exit 1; }

echo "package.json version: $(node -p "require('./package.json').version")"

grep -q '^| 27 | D1\..*| DONE' ai/plans/README.md || { echo "ROW 27 IS NOT DONE"; exit 1; }

count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}

ANCHORS="ai/plans/28-d3-rolling-buffer/scripts/anchors"
if [ "$STEP" -le 1 ]; then
  echo "step1-1 $(count_anchor $ANCHORS/step1-1.txt shared/notifications.ts)"
  echo "step1-2 $(count_anchor $ANCHORS/step1-2.txt shared/constants.ts)"
fi
if [ "$STEP" -le 2 ]; then
  echo "step2-1 $(count_anchor $ANCHORS/step2-1.txt stores/notifications.ts)"
fi

node -p "require('./package.json').version" > /dev/null
ls node_modules/.bin/jest > /dev/null || { echo "JEST MISSING"; exit 1; }

echo "PREFLIGHT OK"
```

Every anchor line must print `1`. Any other count is NEEDS REPLAN.

## 4. Background the executor needs

### Code map

| File | What it does |
| --- | --- |
| `shared/constants.ts` | `NOTIFICATION_ROLLING_DAYS = 1` and the reminder constants. The day count this plan deletes |
| `shared/notifications.ts` | `genNextXDays`, `rollingDaysForPrayer`, `genScheduleDatesForPrayer`: the window rule, and the only place that decides which days a prayer arms |
| `shared/prayer.ts` | `firstStillDueListDayForPrayer`: the earliest list day a prayer's window starts from, so a row after midnight is not cancelled as stale (finding 74). Unchanged by this plan |
| `stores/notifications.ts` | `_addMultipleScheduleNotificationsForPrayer` and `_addMultipleScheduleRemindersForPrayer` call `genScheduleDatesForPrayer` and arm each day. `_rescheduleAllNotifications` orchestrates both schedules |
| `shared/types.ts` | `ReminderSlot`, `REMINDER_SLOTS`, `ReminderSetting`. Already built |
| `components/sheets/screens/ReminderCard.tsx` | One reminder's card, Design 1. Already built |

### How the pieces interact

`genScheduleDatesForPrayer(scheduleType, englishName)` answers a `string[]` of list days, and it is
the single source BOTH schedule paths read, so the at-time and reminder windows cannot drift apart.
Its two callers are `stores/notifications.ts:880` and `:1063`. Both map the array to one
`scheduleNotificationForDate` or `scheduleReminderNotificationForDate` call per day, in parallel,
then compute the stale set from what was attempted.

That per-prayer independence is what makes the row-by-row budget straightforward: **the budget must
be decided before the per-prayer arming runs**, because a per-prayer function cannot know what the
other ten prayers have spent. This plan therefore computes the whole plan of armed rows once, in a
pure function, and has each prayer read its own days out of it.

| Caller | Before | After |
| --- | --- | --- |
| `_addMultipleScheduleNotificationsForPrayer` | `genScheduleDatesForPrayer(type, name)` | same signature, budget-aware result |
| `_addMultipleScheduleRemindersForPrayer` | same | same |
| `_rescheduleAllNotifications` | reads `genNextXDays(NOTIFICATION_ROLLING_DAYS)` for its empty-cache bail | reads `genNextXDays(1)`: the bail asks whether ANY data exists, which one day answers |

### Existing tests

| File | What it proves |
| --- | --- |
| `shared/__tests__/constants.test.ts` | The worst case fits 64, computed from `rollingDaysForPrayer` itself rather than restated. Lines 325-399 |
| `shared/__tests__/notifications.test.ts` | `genNextXDays`, `rollingDaysForPrayer`, `genScheduleDatesForPrayer` shapes. Lines 47-132 |
| `shared/__tests__/prayer.test.ts` | `firstStillDueListDayForPrayer`, lines 1409-1465. Must not change |
| 13 suites under `stores/__tests__/` | 113 tests currently failing, all asserting a two-day identifier set. They are reporting correctly |

### Why the obvious simple fix is wrong

Raising `NOTIFICATION_ROLLING_DAYS` back to 2 fixes Fajr and breaks the ceiling: 24 list days x 3
alerts = 72 > 64, and iOS drops the excess silently, so the app would believe it armed what the phone
discarded. Dropping the second reminder fixes the ceiling and abandons the feature. The day count
cannot satisfy both, which is why the unit changes.

## 5. Design

**The invariant, in one sentence a test can check:** the app arms whole rows in time order until the
next row will not fit in the 64-request budget, so the next occurrence of every armed prayer is
always armed, and no row is ever armed in part.

Three properties follow, and each is pinned by a test rather than a count:

1. **The next Fajr is always armed.** A count drifts; this does not.
2. **No row is half armed.** Its at-time alert and its reminders are all present or all absent.
3. **The worst-case request total never exceeds 64.**

### The chosen approach

A pure function plans the whole schedule, and the per-prayer paths read their days out of it.

```
buildSchedulePlan(rows, budget) -> Map<prayerKey, string[]>
```

`rows` is every candidate row in time order, each carrying its prayer, its list day and its request
cost. The function walks them in order, accumulating cost, and stops at the first row whose cost
would take the running total past `budget`. It stops the whole walk there, rather than skipping that
row and continuing, because arming a later row while an earlier one is unarmed would put a gap in
the middle of the covered span and make "covered until X" untrue.

### Alternatives rejected

| Alternative | Why rejected |
| --- | --- |
| Keep 2 list days, one reminder | Abandons the feature. 47h coverage for every user, however little they arm |
| Keep 1 list day, two reminders | Next Fajr unarmed 79.9% of the year; 2.3h worst-case horizon |
| Next N occurrences per prayer | Peaks at 66 requests, over the ceiling, because Istijaba is Friday-only and its 2nd occurrence is 14 days out. Bounding the walk fixes that but caps every user at ~47h regardless of what they armed |
| Taper (3 requests for the next row, 1 for later rows) | Measured 95h of athan coverage at 63 requests, better than the occurrence model. Rejected by the owner in favour of the budget, which beats it for every profile except the absolute worst case and needs no new concept of a partial row |
| Sort individual REQUESTS by fire time | Orphans reminders in 98.0% of samples for a two-reminder user: the phone warns about an athan it never plays. Breaks finding 81 |
| Adaptive depth from the armed count | A dud, measured. The worst case is all 11 rows armed, which forces depth back to 1, the broken option. It helps only users who need no help |

### The concurrency trace

Nothing changes in the concurrency model. `withSchedulingLock` still serialises every pass;
`_rescheduleAllNotifications` still starts the four per-schedule passes together; each prayer still
arms its days in parallel and computes its own stale set from what it attempted. The budget is
computed once per pass, before any arming, from data the pass already reads, so no new await, no new
shared mutable state, and no new ordering constraint enters the system.

### Design review

Reviewed by this session on 2026-09-27, before any code was written. Three findings, all applied:

1. **The first draft sorted requests, not rows.** Measuring it found the orphaned-reminder bug at
   98.0% of samples for a two-reminder user. Changed to row-by-row, which makes it impossible.
2. **The first draft carried a 7-day candidate cap.** The owner identified it as an arbitrary knob
   that stops light users from spending the budget they are entitled to. Removed; the walk now stops
   on the budget or on the data.
3. **The walk needed a termination condition when the cache is thin.** Added
   `SCHEDULE_CANDIDATE_DAYS` as an explicit loop guard, documented as a guard and pinned by a test
   that it is never the binding limit for the worst-case user.

## 6. Steps

- [x] Step 1: The budget replaces the day window in `shared/` (specified)
- [x] Step 2: The store arms from the budget, and the 13 suites are repaired (specified; folded into step 1's commit, see `LOG.md`)
- [x] Step 3: The alert sheet's second card, tested (specified; folded into step 1's commit, see `LOG.md`)
- [ ] Step 4: What's New, both platforms (specified)

### Step 1: The budget replaces the day window in `shared/`

0. **Anchor check:** `bash $TMPDIR/preflight-28.sh 1`. `step1-1` and `step1-2` must each print `1`.
1. **Goal:** `genScheduleDatesForPrayer` answers the days a prayer arms under the request budget,
   and the day-count constant is gone.
2. **Branch:** `git checkout -b feat/28-request-budget uat-2`.
3. **Files:** `shared/constants.ts`, `shared/notifications.ts`, `shared/__tests__/constants.test.ts`,
   `shared/__tests__/notifications.test.ts`, plus `ai/plans/README.md` and this folder's `PLAN.md`
   and `LOG.md`.
4. **Tests first (red).** In `shared/__tests__/notifications.test.ts`, under a new describe
   `the request budget`:

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `arms whole rows in time order until the budget is full` | The walk is row-ordered and stops on the budget | The full mock year, every prayer armed, both reminders | Every armed row is earlier than every unarmed row |
   | `never arms a row in part` | Property 2 | Same | For every armed row, its at-time day and its reminder days are the same set |
   | `always arms the next Fajr` | Property 1 | Every sampled minute of the mock year | The next Fajr's list day is in Fajr's armed days |
   | `never exceeds the request ceiling` | Property 3 | Worst-case user | Total requests <= 64 |
   | `gives a light user far more days than a heavy one` | The budget adapts to what is armed | 1 prayer vs all 11 | The 1-prayer user's furthest armed day is later |
   | `stops when the cache runs out of days` | The data bound, not an error | A cache holding 3 days | Armed days are within those 3, and nothing throws |

   In `shared/__tests__/constants.test.ts`, the describe at line 325 (`the rolling buffer fits inside
   the iOS pending-request ceiling`) is REPLACED, because the arithmetic it pins no longer exists.
   Its replacement, `the request budget fits inside the iOS pending-request ceiling`, keeps
   `IOS_PENDING_REQUEST_CEILING = 64` and proves the worst case through the new function. The
   describe at line 411 (`the rolling horizon is one list day`) is DELETED: it pins the shrinking
   horizon this step removes. The `rollingDaysForPrayer` describe in `notifications.test.ts`
   (lines 100-124) is DELETED with the function.

   `shared/__tests__/prayer.test.ts` must NOT change.

   Command: `npx jest shared/__tests__/notifications.test.ts shared/__tests__/constants.test.ts --watchman=false --selectProjects=unit`

   Expected red: the six new tests fail with `buildSchedulePlan is not a function`, and the replaced
   constants describe fails on the missing export. If any test in `prayer.test.ts` fails, STOP.

5. **Change.** This is a `(specified)` step: build it from these contracts.

   **`shared/constants.ts`**
   - DELETE `NOTIFICATION_ROLLING_DAYS` and its JSDoc block entirely.
   - ADD `NOTIFICATION_REQUEST_BUDGET = 64`. Its JSDoc says WHY only: iOS keeps the 64
     soonest-firing pending requests per app and silently discards the rest, so this is a platform
     ceiling and not a tuning knob.
   - ADD `SCHEDULE_CANDIDATE_DAYS = 60`. Its JSDoc says WHY only: it bounds the candidate walk so a
     thin cache cannot make it scan forever, and it is never what limits coverage.

   **`shared/notifications.ts`**
   - DELETE `rollingDaysForPrayer` and the `EVENING_BEFORE_ROWS` set it reads. The budget has no day
     count to extend, and a night row is simply a row whose instant falls where it falls.
   - KEEP `genNextXDays` unchanged: `_rescheduleAllNotifications` still uses it for its empty-cache
     bail.
   - ADD `type CandidateRow = { scheduleType: ScheduleType; englishName: string; date: string;
     instant: Date; requestCost: number }`.
   - ADD `buildSchedulePlan(rows: CandidateRow[], budget: number): Map<string, string[]>`.
     - What it answers: for each prayer, keyed `${scheduleType}_${englishName}`, the list days that
       prayer arms.
     - Behaviour: sorts `rows` ascending by `instant`; walks them accumulating `requestCost`; stops
       the walk at the first row whose cost would take the total past `budget`; every row before
       that point contributes its `date` to its prayer's array.
     - What it must never do: skip a row and continue past it, or include a row whose cost was not
       counted.
     - It is pure: no clock read, no storage read, no logging.
   - CHANGE `genScheduleDatesForPrayer(scheduleType, englishName): string[]` to keep its exact
     signature and return type, and answer from the plan. It builds candidates from
     `firstStillDueListDayForPrayer` for each prayer out to `SCHEDULE_CANDIDATE_DAYS`, keeps rows
     that are readable and still future, costs each row as 1 plus one per reminder slot that is on
     for that prayer, calls `buildSchedulePlan` with `NOTIFICATION_REQUEST_BUDGET`, and reads its own
     prayer's days out of the result.
   - Its JSDoc keeps the existing sentence about being the single source both schedule paths read,
     so the at-time and reminder windows cannot drift apart.

   Comments explain why, never what. No comment restates a line of code.

6. **Green.** Same command. All six new tests pass, the replaced describes pass, `prayer.test.ts` is
   untouched and green. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both
   exit 0.
7. **Breaks.** Save as `$TMPDIR/breaks-28-1.sh`, run with `bash` from the repository root.

```bash
#!/usr/bin/env bash
set -uo pipefail
cd /Users/muji/repos/rn.athan.uk

CAUGHT=0
TOTAL=0
SRC=shared/notifications.ts
CMD="npx jest shared/__tests__/notifications.test.ts shared/__tests__/constants.test.ts --watchman=false --selectProjects=unit --coverage=false"

run_break() {
  LABEL="$1"; PERL="$2"
  TOTAL=$((TOTAL+1))
  cp "$SRC" "$SRC.bak"
  perl -0pi -e "$PERL" "$SRC"
  if cmp -s "$SRC" "$SRC.bak"; then
    echo "BREAK NOT APPLIED: $LABEL"
    mv "$SRC.bak" "$SRC"
    return
  fi
  if $CMD > /dev/null 2>&1; then
    echo "NOT CAUGHT: $LABEL"
  else
    echo "caught: $LABEL"
    CAUGHT=$((CAUGHT+1))
  fi
  mv "$SRC.bak" "$SRC"
}

# The budget stops being a ceiling: the worst case must breach 64
run_break "budget ignored" 's/if \(used \+ row\.requestCost > budget\) break;/if (false) break;/'

# The walk skips a row that does not fit and carries on, leaving a gap mid-span
run_break "skip instead of stop" 's/if \(used \+ row\.requestCost > budget\) break;/if (used + row.requestCost > budget) continue;/'

echo "ALL AS EXPECTED: $((CAUGHT == TOTAL ? 1 : 0))"
```

   Both breaks must be caught, so the script ends `ALL AS EXPECTED: 1`. A `BREAK NOT APPLIED` line
   means the substitution does not match the code written: STOP (section 2.2, item 3).

8. **Version and commit.** Version: `node -p "String(require('./package.json').version).replace(/(\d+)$/, (m) => Number(m) + 1)"`.
   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`); all three
   match, and the gradle file is never added.

   Add by name: `shared/constants.ts`, `shared/notifications.ts`,
   `shared/__tests__/constants.test.ts`, `shared/__tests__/notifications.test.ts`, `app.json`,
   `package.json`, `ai/plans/README.md`, `ai/plans/28-d3-rolling-buffer/PLAN.md`,
   `ai/plans/28-d3-rolling-buffer/LOG.md`.

   Message, to `$TMPDIR/msg-1.txt`:

```
<VERSION> - feat(notifications): the rolling buffer becomes a request budget

The window counted LIST DAYS, so once today's Fajr passed it was neither future
nor in range: measured against the real London year, the next Fajr was unarmed
79.9% of the time and the horizon collapsed to 2.3 hours.

Rows are now armed in time order, each one whole, until the next will not fit in
the iOS 64-request budget. A day count no longer appears in the decision, so the
window adapts to what the user actually armed: a phone with one prayer armed is
covered for 63 days, and the worst-case user for two.
```

9. **Review.** Read `git show <sha>` back cold, as a stranger. Check: `NOTIFICATION_ROLLING_DAYS`
   and `rollingDaysForPrayer` are gone with no caller left behind; `genScheduleDatesForPrayer` keeps
   its exact signature; `buildSchedulePlan` is pure, with no clock or storage read; every comment
   explains why and none explains what; `prayer.test.ts` is untouched; nothing beyond the step's
   files changed. A clean read is all of those true. Handle a finding by `EXECUTOR-BRIEF.md`
   section 4, item 8.
10. **Merge.** `git checkout uat-2 && git merge --no-ff feat/28-request-budget -m "Merge feat/28-request-budget into uat-2: session 28 step 1, reviewed"`
11. **Done when:** the command in part 6 is green, both breaks are caught, and
    `grep -rn NOTIFICATION_ROLLING_DAYS shared stores hooks device components app` prints nothing.

### Step 2: The store arms from the budget, and the 13 suites are repaired

0. **Anchor check:** `bash $TMPDIR/preflight-28.sh 2`. `step2-1` must print `1`.
1. **Goal:** both scheduling paths arm from the budget, and the 113 failing tests assert the new
   shape.
2. **Branch:** `git checkout -b feat/28-store-budget uat-2`.
3. **Files:** `stores/notifications.ts`, `stores/__tests__/alarmHarness.ts`, and the 13 failing
   suites listed in part 4, plus the three plan files.
4. **Tests first (red).** The 113 failures already exist and are reporting correctly: they assert a
   two-day identifier set that the budget replaces. They are repaired against the settled window, not
   "fixed" by pasting in whatever the code now prints. For each suite, the repair is to derive the
   expected identifiers from the production function rather than from a literal list, so the
   assertion cannot drift with the window again.

   The 13 suites: `notificationSchedulingLock`, `notificationsAroundMidnight`,
   `notificationsOctober18Midnight`, `notificationsClockChange`, `notificationsFridayIstijaba`,
   `notificationAlertCommit`, `notificationOffCancelFailure`, `notificationRefreshGate`,
   `notificationStaleCancelFailure`, `notificationsMidnightWindow`, `notificationSinglePrayerUpdate`,
   `notifications`, `notificationGateRace`.

   `stores/__tests__/alarmHarness.ts` line 61's `const WINDOW = [TODAY, TOMORROW].slice(0,
   NOTIFICATION_ROLLING_DAYS)` is the shared expectation every suite reads. It becomes the days the
   production function answers for that prayer, so one change repairs most of the 113.

   Three tests are ADDED to `stores/__tests__/notificationAlertCommit.test.ts`, under the existing
   describe for a prayer's three alerts:

   | Test name | What it proves | Asserts |
   | --- | --- | --- |
   | `arms a prayer's three alerts on the same days` | No row is half armed, end to end | The at-time identifier set and each reminder's set cover the same list days |
   | `arms nothing for a row the budget cannot reach` | The walk stops rather than skipping | No identifier exists for a day past the budget's last armed row |
   | `covers the next occurrence of every armed prayer` | Property 1, through the store | Every armed prayer has at least one future identifier |

   Command: `npx jest stores/__tests__ --watchman=false --selectProjects=unit`

   Expected red before the change: 113 failing in 13 suites, plus the three new ones failing.

5. **Change.** `_addMultipleScheduleNotificationsForPrayer` and
   `_addMultipleScheduleRemindersForPrayer` keep their signatures and their stale-set logic exactly;
   they read days from `genScheduleDatesForPrayer` as they already do, so the budget reaches them
   without either function changing shape. In `_rescheduleAllNotifications`, the empty-cache bail's
   `genNextXDays(NOTIFICATION_ROLLING_DAYS)` becomes `genNextXDays(1)`: the bail asks whether ANY
   prayer data exists, which one day answers, and the comment above it keeps its existing reasoning
   with the day-count sentence removed.

   The import of `NOTIFICATION_ROLLING_DAYS` is deleted from `stores/notifications.ts`.

6. **Green.** Same command: 0 failures across `stores/__tests__`. Then
   `npx jest --watchman=false --selectProjects=unit` green, `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings` both exit 0.
7. **Breaks.** Save as `$TMPDIR/breaks-28-2.sh`:

```bash
#!/usr/bin/env bash
set -uo pipefail
cd /Users/muji/repos/rn.athan.uk

CAUGHT=0
TOTAL=0
SRC=stores/notifications.ts
CMD="npx jest stores/__tests__/notificationAlertCommit.test.ts --watchman=false --selectProjects=unit --coverage=false"

run_break() {
  LABEL="$1"; PERL="$2"
  TOTAL=$((TOTAL+1))
  cp "$SRC" "$SRC.bak"
  perl -0pi -e "$PERL" "$SRC"
  if cmp -s "$SRC" "$SRC.bak"; then
    echo "BREAK NOT APPLIED: $LABEL"
    mv "$SRC.bak" "$SRC"
    return
  fi
  if $CMD > /dev/null 2>&1; then
    echo "NOT CAUGHT: $LABEL"
  else
    echo "caught: $LABEL"
    CAUGHT=$((CAUGHT+1))
  fi
  mv "$SRC.bak" "$SRC"
}

# Only the first reminder slot is armed, so a row is armed in part
run_break "one slot only" 's/reminders\.flatMap\(/[reminders[0]].flatMap(/'

echo "ALL AS EXPECTED: $((CAUGHT == TOTAL ? 1 : 0))"
```

8. **Version and commit.** As step 1's part 8, with these files. Message:

```
<VERSION> - feat(notifications): both schedule paths arm from the request budget

The store's two arming paths keep their shape and their stale-set logic; the
budget reaches them through genScheduleDatesForPrayer, which is still the single
source both read. The empty-cache bail asks only whether any data exists.

The 13 suites asserted a two-day identifier set. They now derive what they expect
from the production function, so a future change to the window cannot leave them
asserting a shape the app has left behind.
```

9. **Review.** As step 1's part 9. Additionally: the stale-set logic is byte-for-byte unchanged in
   both paths; no suite was repaired by pasting in what the code prints; no test was deleted that the
   plan does not name.
10. **Merge.** `git checkout uat-2 && git merge --no-ff feat/28-store-budget -m "Merge feat/28-store-budget into uat-2: session 28 step 2, reviewed"`
11. **Done when:** `npx jest --watchman=false --selectProjects=unit` reports 0 failures.

### Step 3: The alert sheet's second card, tested

0. **Anchor check:** none; this step adds tests to files it also owns.
1. **Goal:** the second reminder card is covered by tests, and coverage returns to 100%.
2. **Branch:** `git checkout -b test/28-alert-sheet uat-2`.
3. **Files:** `components/sheets/screens/__tests__/Alert.test.tsx`, a new
   `components/sheets/screens/__tests__/ReminderCard.test.tsx`, plus the three plan files.
4. **Tests first (red).** In the new `ReminderCard.test.tsx`:

   | Test name | What it proves | Asserts |
   | --- | --- | --- |
   | `renders its own toggle, sound and interval` | Design 1's shape | All three controls are present for the slot given |
   | `is locked until the first reminder is on` | The owner's rule | Slot 1's controls are disabled while slot 0 is Off |
   | `keeps each slot's sound separate` | Slots do not share state | Changing slot 0's sound leaves slot 1's unchanged |

   In `Alert.test.tsx`, three tests are added for the end-to-end behaviour: both cards render, the
   skip rule holds through the sheet, and turning the at-time alert Off turns both reminders Off.

   Command: `npx jest components/sheets/screens/__tests__ --watchman=false --selectProjects=components`
5. **Change.** Tests only. No production file changes in this step. If a test cannot pass without a
   production change, STOP and ask (section 2.2, item 7).
6. **Green.** Same command, all green. Then the full suite, `tsc` and Biome as in step 1.
7. **Breaks.** None: a test-only step has no production substitution to make. The coverage gate in
   part 8 is what proves these tests reach the code.
8. **Version and commit.** As step 1's part 8. The hook's four `100%` coverage lines are the
   acceptance criterion for this step. Message:

```
<VERSION> - test(sheets): cover the second reminder card

ReminderCard had no test of its own, and the sheet's tests predated the second
slot. These cover what the owner specified: each card owning its toggle, sound
and interval, the second locked until the first is on, and the skip rule holding
end to end.
```

9. **Review.** As step 1's part 9, plus: no production file is in the diff.
10. **Merge.** `git checkout uat-2 && git merge --no-ff test/28-alert-sheet -m "Merge test/28-alert-sheet into uat-2: session 28 step 3, reviewed"`
11. **Done when:** the hook reports four `100%` coverage lines.

### Step 4: What's New, both platforms

0. **Anchor check:** none.
1. **Goal:** the release tells users the second reminder exists.
2. **Branch:** `git checkout -b feat/28-whats-new uat-2`.
3. **Files:** the What's New data file, its suite, plus the three plan files.
4. **Tests first (red).** One test: the new entry is present and carries no flag, so it shows on both
   platforms. The existing What's New suite's count assertion moves by one.
5. **Change.** One entry, following the existing pattern in the file exactly. Its text says a second
   reminder can now be set for each prayer, each with its own sound and timing. No flag, because the
   feature ships on both platforms at once.
6. **Green.** The What's New suite, then the full suite, `tsc` and Biome.
7. **Breaks.** None: a data entry has no behaviour to break beyond the test that pins it.
8. **Version and commit.** This is the last step of a completed feature, so the version is a MINOR
   bump, not a patch (`ai/AGENTS.md` section 6: "Completed feature / big task / whole plan").
   Message:

```
<VERSION> - feat(whats-new): announce the second reminder

Completes D3. Each prayer now carries two reminders, each with its own toggle,
sound and interval, and the alarm window is a request budget rather than a day
count.
```

9. **Review.** As step 1's part 9.
10. **Merge.** `git checkout uat-2 && git merge --no-ff feat/28-whats-new -m "Merge feat/28-whats-new into uat-2: session 28 step 4, reviewed"`
11. **Done when:** `yarn validate` is green.

## 7. Device proof

None in steps 1 to 3. The behaviour this plan changes is which alarms are armed, and that is proven
against the real London year by the suites in step 1, at a resolution no device session could reach:
every sampled minute of 366 days, against five user profiles.

The owner judges the sheet on their own phones after the merge, as they did for sessions 22 and 23.
The phone is left as it is: this session installs nothing and changes no clock.

## 8. Records

**Findings text**, appended to `ai/features/uat-2/AUDIT-FINDINGS.md` under the heading
`## D3: the rolling buffer becomes a request budget (session 28)`:

```
The window counted LIST DAYS, and at one day that was today alone, so once today's Fajr had passed
it was neither future nor in range: measured against the real London year, the next Fajr was
unarmed 79.9% of the year and the worst-case horizon was 2.3 hours. The day count existed to keep
three alerts per prayer inside the iOS 64-request ceiling, so the arithmetic protecting the ceiling
was also what broke the coverage.

Rows are now armed in time order, each one whole, until the next will not fit in the budget. Coverage
measured worst-case across the year: <COVERAGE_TABLE>. No row is ever armed in part, which is what
sorting individual REQUESTS by fire time would have broken: a reminder fires before the athan it
warns about, so the cut orphaned a reminder in 98.0% of samples for a two-reminder user, leaving the
phone to warn about an athan it never plays.

DURABLE LESSON: a day is the wrong unit for a prayer schedule. Counting days makes the app arm rows
it may not need while refusing the one row it does need, purely because that row sits after
midnight. The unit that matches the constraint is the request, because the constraint iOS imposes is
counted in requests.
```

`<COVERAGE_TABLE>` is the executor's measured figures from step 1's tests.

**Table rows.** The executor sets the `ai/plans/README.md` row 28 to EXECUTED. The auditor applies
the `ai/prompts/README.md` row on PASS.

**Docs commit:** `<VERSION> - docs(plans): session 28 executed: the rolling buffer is a request budget`

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session
pushes `uat-2` after a PASS verdict.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts other than 1 | The code moved since planning | NEEDS REPLAN (section 2.2, item 1) |
| The worst case measures above 64 | The cost function counts a request the plan did not anticipate | STOP and ask (section 2.2, item 4) |
| A `stores/__tests__` suite still fails after the harness repair | That suite asserts something beyond the window | Read what it proves before touching it; if it is a real defect in the budget, STOP and ask |
| `BREAK NOT APPLIED` | The substitution does not match the code written | STOP (section 2.2, item 3). Never reshape code to fit a break |
| Coverage below 100% | A new branch is untested | Add the test. Never add an ignore comment |
| Anything else | | The general table in `EXECUTOR-BRIEF.md` section 7 |

**Anticipated review fixes.** None are pre-authorised beyond `EXECUTOR-BRIEF.md` section 4, item 8,
whose three conditions govern: a fix touching only code the plan did not give verbatim, changing no
name, signature, log line, behaviour or test the plan specified, and leaving every acceptance
criterion met. Anything else is a STOP.

**Stopping part-way.**

| Step | Restore | Delete |
| --- | --- | --- |
| 1 | `shared/constants.ts`, `shared/notifications.ts`, `shared/__tests__/constants.test.ts`, `shared/__tests__/notifications.test.ts`, `app.json`, `package.json` | nothing |
| 2 | `stores/notifications.ts`, `stores/__tests__/alarmHarness.ts`, the 13 suites, `app.json`, `package.json` | nothing |
| 3 | `components/sheets/screens/__tests__/Alert.test.tsx`, `app.json`, `package.json` | `components/sheets/screens/__tests__/ReminderCard.test.tsx` |
| 4 | the What's New file and its suite, `app.json`, `package.json` | nothing |

## 11. Subagents in this plan

None. This session does its own planning, execution, review and audit (owner, 2026-09-26). No image
needs reading, so `vision` is not called either.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from
`date '+%H:%M:%S %d.%m.%Y'`, then:
- a few plain sentences on what changed and what was measured, with the coverage table;
- the progress table (format in `EXECUTOR-BRIEF.md` section 6);
- the note that the owner judges the sheet on their own phones;
- the four-line handoff from the `athan-next` skill, section 8.
