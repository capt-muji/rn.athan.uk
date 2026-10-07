# ADR-005: Prayer-centric timing model

**Status:** Accepted and implemented
**Current as of:** 2026-10-07 (1.29.265)
**Related:** ADR-004 (which list day a row belongs to)

## Decision

Each schedule holds one sequence of prayers. Everything on screen derives from that sequence and the clock. No next index and no display date is stored.

- A `Prayer` carries its list day (`belongsToDate`) and, when readable, a true instant (`datetime`). A row with no readable time has `null` there and is drawn as `--:--`.
- A `PrayerSequence` holds the rows in list order: list day, then position on the list.

| Question | Answer | Where |
| --- | --- | --- |
| Which row is next? | The readable row with the earliest instant after now | `findNextReadable` |
| Has a row passed? | A readable row passes at its instant | `isRowPassed` |
| Which list day is on screen? | The earliest list day with a readable row still to come | `resolveDisplayDate` |
| What does the bar measure from? | The row just above next, or the last row of the list before | `findPreviousRow` |
| When does the screen next change? | At the next readable prayer, or at the 00:00 that ends a held list day (ADR-004) | `getNextBoundary` |
| How long is left? | `next.datetime - Date.now()` | `getSecondsRemaining` (`shared/time.ts`) |

The rules are pure. They live in `shared/sequence.ts` unless the table names another file. `stores/schedule.ts` holds the sequence, and `stores/countdown.ts` runs one wall-clock ticker per schedule that calls `refreshSequence` at each boundary. The rules for rows with no readable time are in `ai/features/uat-2/DASHES-DESIGN.md`.

## What forced it

The earlier model kept three date-keyed maps (yesterday, today, tomorrow), a stored next index and a stored display date: six values kept in step by hand, with date display, countdown target and advancement bugs returning until the model was replaced.

## Alternatives rejected

| Alternative | Why it lost |
| --- | --- |
| Keep the date-keyed model and fix each bug | The fallback and the stored index remain, so the bugs return. |
| Add an explicit active date to that model | It still needs the fallback and the hand synchronisation. |
| Event-driven "prayer passed" events | A larger change that leaves the data model as it was. |
