# ADR-004: Prayer-based day boundary

**Status:** Accepted. It replaced a 00:00 boundary for both lists. The Extras night rule dates from 2026-09-11 (issue #29).
**Current as of:** 2026-10-07 (1.29.265)
**Related:** ADR-005 (the data model that implements this)

## Decision

Each list moves to its next day after its own last prayer, not at 00:00.

1. Every row belongs to one list day, `belongsToDate`, fixed when the row is built. It can differ from the calendar date of the row's instant.
2. A Standard list day runs from Fajr to Isha.
3. An Extras list day opens with the night leading into it (Midnight, Last Third), then Suhoor, Duha and, on a Friday, Istijaba.
4. The two lists are independent and can show different dates at the same moment.
5. The UI trusts the data layer. It never invents or substitutes a time.

One case does change at 00:00 in the prayer timezone: a list day with no readable row comes on screen at its own 00:00 and leaves at the next, and the day before it holds until then (`ai/features/uat-2/DASHES-DESIGN.md`).

## Which day a row belongs to

| Row | Instant | List day |
| --- | --- | --- |
| Isha or Magrib with a clock time before 06:00 | The next calendar day | The day it is filed under |
| Midnight, Last Third | Midpoint and two-thirds point of the night from the previous day's Magrib to this day's Fajr | The day the night leads into |
| Suhoor that wraps into the evening before | The previous calendar day | The day of its Fajr |
| Every other row | Its own calendar day | That day |

The rules live in `calculateBelongsToDate` and `getNightTimesForDay` (`shared/prayer.ts`).

## Alternatives rejected

| Alternative | Why it lost |
| --- | --- |
| Reset both lists at 00:00 | The countdown had nothing to show from the last prayer until 00:00, and a prayer after 00:00 landed on the wrong day. |
| One shared boundary for both lists | The lists end at different prayers, so one would move early or late. |
| Roll the displayed date at Magrib | The date on screen would stop matching the phone's calendar every evening. |
