# ADR-002: English Midnight Day Boundary

**Status:** Superseded by ADR-004
**Date:** 2026-01-15
**Decision Makers:** muji

---

## Context

The Athan app displays prayer schedules for a given date. The app needs a consistent point at which:

- The displayed date updates to the next day
- Prayer schedules refresh from the database
- UI elements reset (countdown, active prayer indicator)

Several factors complicate this decision:

1. **User expectations**: Users expect the displayed date to match their phone's clock and calendar
2. **Islamic day boundary**: Traditionally, the Islamic day begins at Maghrib (sunset), not midnight
3. **Variable prayer times**: Prayer times shift throughout the year—Isha can occur before or after 00:00 depending on location and season
4. **Two schedule screens**: The app has both Standard prayers (Fajr through Isha) and Extra prayers (Last Third, Suhoor, Duha, Istijaba)
5. **London-specific**: The app currently targets London only, where prayer times can vary significantly by season

### Current UI Behavior

- **Date display**: Shows the current schedule date (e.g., "17th April")
- **Prayer list**: Ordered by time of day (Fajr first on Standard, Last Third first on Extras)
- **Countdown countdown**: Shows time until next prayer
- **Blue active bar**: Highlights the current/next prayer
- **Today/Tomorrow overlay**: Indicates which day the prayer belongs to
- **Post-last-prayer**: Countdown is hidden after the last prayer until midnight (reduces UI clutter)

### The Happy Path (Current State)

Currently, this works because:

- Isha is always before 00:00 in London
- Last Third is always after 00:00 in London

Prayers are ordered by earliest time, and date association is straightforward.

### Known Future Problems

Prayer times change throughout the year. Edge cases will emerge:

1. **Isha after English midnight**: Isha at 00:15 on the 18th still belongs to the 17th's schedule
2. **Last Third before English midnight**: Last Third at 23:45 on the 17th should belong to the 17th's schedule
3. **Middle of the Night prayer** (planned): A new Extra prayer at the halfway point between Maghrib and Fajr—usually around 23:00 but sometimes after 00:00

These edge cases will break:

- Countdown visibility logic
- Date display accuracy
- Today/Tomorrow overlay correctness
- Blue active bar behavior

## Decision

Use **English midnight (00:00)** as the day boundary for both Standard and Extra schedules.

1. **Date reset**: At 00:00, the displayed date increments and prayers refresh from the database
2. **Countdown behavior**: Hidden after the last prayer of the day, returns at 00:00
3. **Blue active bar**: Hidden after the last prayer, returns at 00:00
4. **Consistent across schedules**: Both Standard and Extra screens reset at the same time
5. **Accept limitations**: Known edge cases are documented but not yet handled

### Rationale

User familiarity and predictability outweigh technical correctness. Users expect:

- The date shown to match their phone's clock
- Consistent, predictable behavior they can learn once

## Consequences

### Positive

- Familiar behavior: date matches user's clock/calendar
- Predictable: users learn the pattern once
- Simple mental model: "the app resets at midnight"
- Consistent: both schedules behave identically

### Negative

- **Edge case: Isha after midnight** — Isha belongs to previous day but appears on next day's schedule
- **Edge case: Last Third before midnight** — Last Third belongs to current day but countdown/UI may behave incorrectly
- **Future: Middle of the Night prayer** — Will require careful handling as it straddles the boundary
- Technical debt: edge cases deferred rather than solved

### Neutral

- London-only scope limits the frequency of edge cases (but doesn't eliminate them)
- Seasonal variation means edge cases are predictable and can be monitored

## Alternatives Considered

### Alternative 1: After-Isha Boundary

**Description:** Reset the day after Isha completes, aligning with the Islamic day concept.

**Pros:**

- Aligns with Islamic tradition (day starts at Maghrib/after Isha)
- Prayers always belong to the correct Islamic date
- No edge cases for Isha timing

**Cons:**

- User confusion: displayed date wouldn't match phone/calendar
- Users would need to learn a new mental model
- "What day is it?" becomes ambiguous

**Why Rejected:** User confusion. Users expect the displayed date to match their device's clock and calendar. Introducing a different day boundary creates cognitive overhead.

### Alternative 2: Dynamic/Contextual Boundary

**Description:** Use different reset times for different prayers or contexts—e.g., Standard resets at midnight, Extras reset after Isha.

**Pros:**

- Each prayer type could use its optimal boundary
- Potentially handles edge cases better

**Cons:**

- Inconsistent behavior across the app
- Users can't form a single mental model
- "When does the date change?" has no simple answer
- Significantly increases implementation complexity

**Why Rejected:** Too confusing. Inconsistent behavior makes the app harder to understand and use. Simplicity and predictability are more valuable than technical correctness.

## Implementation Notes

- Day boundary logic likely in schedule/countdown stores
- Countdown visibility controlled by comparing current time to last prayer time and midnight
- Blue active bar follows similar logic
- Both Standard and Extra screens share the same boundary logic
- **Future work needed**: Handle edge cases when Isha > 00:00 or Last Third < 00:00
- **Future work needed**: Middle of the Night prayer date association

## Related Decisions

- ADR-001: Rolling Notification Buffer (notifications also respect day boundaries)

---

## Revision History

| Date       | Author | Change                                            |
| ---------- | ------ | ------------------------------------------------- |
| 2026-01-15 | muji   | Initial draft                                     |
| 2026-01-18 | muji   | Superseded by ADR-004 (Prayer-Based Day Boundary) |
