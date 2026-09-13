# Session: keep yesterday's still-due rows after 00:00

**Status: NOT STARTED. Queued on 2026-09-13 as session 8, from session 1's finding 74. It must land
before v2.0 adds any city where Magrib or Isha can fall after 00:00.**

## The problem

A Magrib or Isha after 00:00, or a Friday Istijaba when Magrib is 01:00 or later, stays on the list
of the date its record carries, which is correct. Midnight and Last Third follow a different rule,
and this session must not change it: a night belongs to the day it leads into (ISSUES #29,
`shared/prayer.ts:131`). Two parts of the app use the calendar date instead:

- **The screen.** When the list is rebuilt after 00:00, it starts from the new date, so yesterday's
  rows that are still due leave the screen.
- **The alarms.** The window of days to keep alarms for also starts from the new date. The next
  reschedule then treats yesterday's still-due alarms as stale and cancels them.

Anything that reschedules between 00:00 and those rows silences them: a cold launch, a return to
the app once the 12-hour refresh gate has reopened, changing a setting, or the background task.

## Proven on the 3T (finding 74)

On the high-latitude mock, Friday 25 September has Magrib at 00:40 and Isha at 01:30. Both fall on
Saturday morning, and both belong to Friday's list.
- Returning to the app at 00:00:40 showed Saturday's list. Both rows had gone.
- A reschedule then cancelled both alarms, and nothing fired at 00:40 or 01:30.

London is not affected: the 2026 payload never puts Magrib or Isha after 00:00.

## Where it lives

- The alarm window starts at the calendar day (`shared/notifications.ts:157-161`).
- The reschedule cancels every recorded identifier it did not re-attempt
  (`stores/notifications.ts:625-643`, `:769-795`).
- The list is built from the calendar day (`shared/prayer.ts:419-439`), on every cold launch and
  foreground sync (`stores/sync.ts:82-83`).
- Same root: `getYesterdayFinalPrayer` rebuilds yesterday's last row without the midnight shift, so
  the progress bar gets a post-midnight Isha 24 hours early (`stores/schedule.ts:82-92`, traced from
  the code, not run).

## The direction, confirmed by the owner on 2026-09-13

> *"A day stays current until its last prayer has passed, not until 00 for both the screen and the
> alarms. Exactly, exactly, exactly."*

- The screen keeps yesterday's list while it still has a row due.
- The alarm window starts from the earliest list day that still has a row due, so a reschedule
  re-attempts those alarms instead of cancelling them.

The owner asked whether the alarms already fire at the right moment. They do: Friday's 01:30 Isha
is armed for Saturday 01:30. The defect is the next reschedule after 00:00, which no longer counts
Friday's list and cancels that alarm.

## Tests first

Write the failing tests before the fix, from `ai/features/uat-2/UNIT-TEST-GAPS-2026-09-13.md`: item
6 (a reschedule between 00:00 and a 00:01 Isha) and item 17 (the list and the progress bar at
00:00:30). Both fail against today's code by design.

## How to run it

- The standing rules in `README.md` apply.
- Session 1's mock is not in the repo. Rebuild it the same way: a local non-prod build serves
  `mocks/simple.ts` instead of the API (`api/client.ts:88`), with these days, launched with the
  device clock on Friday 25 September.

  | Day | Fajr | Sunrise | Dhuhr | Asr | Magrib | Isha |
  | --- | --- | --- | --- | --- | --- | --- |
  | Thu 24 Sep 2026 | 03:00 | 05:00 | 13:00 | 17:00 | 22:30 | 23:40 |
  | Fri 25 Sep 2026 | 02:30 | 04:30 | 13:00 | 17:30 | 00:40 | 01:30 |
  | Sat 26 Sep 2026 | 02:00 | 04:00 | 13:00 | 17:30 | 22:00 | 23:30 |
  | Sun 27 Sep 2026 | 00:10 | 03:00 | 13:00 | 17:00 | 21:00 | 22:30 |
  | Mon 28 Sep 2026 | 03:00 | 05:00 | 13:00 | 17:00 | 20:58 | 22:30 |

- Prove it on the 3T with that mock, as session 1 did: return to the app after 00:00, reschedule,
  then drive the clock to each post-midnight row and check it fires under its own list day. Silent
  alerts, so the phone stays quiet.
- London must not change: every 2026 London row and alarm is the same before and after the fix.
