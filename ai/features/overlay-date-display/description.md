# Feature: Overlay Date Display

**Status:** Approved
**Author:** muji
**Date:** 2026-01-17
**Specialist:** Architect

---

## Overview

Change the overlay date display from "Today/Tomorrow" text to actual formatted date (e.g., "Sat, 17 Jan 2026"). The date should follow the prayer-based day boundary (advances after Isha/Duha/Istijaba), not midnight reset.

## Goals

- [x] Replace "Today/Tomorrow" text with formatted date
- [x] Use `formatDateLong()` to match Day.tsx date format
- [x] Date follows prayer-based day boundary (not midnight)
- [x] Midnight/Last Third show "today's date" (Fajr's day)

## Non-Goals

- Not changing the timer behavior
- Not changing the prayer list display
- Not changing notification logic
- Not changing when the schedule advances (already handles prayer-based boundary)

## User Stories

### Story 1: Show actual date instead of Today/Tomorrow

**As a** user viewing the overlay
**I want** to see the actual date for the prayer I'm viewing
**So that** I know exactly which day the prayer belongs to

**Acceptance Criteria:**

- [x] Overlay shows formatted date (e.g., "Sat, 17 Jan 2026")
- [x] Date format matches Day.tsx (EEE, d MMM yyyy)
- [x] Date reflects prayer's schedule date (today/tomorrow based on prayer-based boundary)
- [x] Midnight prayer shows today's date (Fajr's day)
- [x] Last Third shows today's date (Fajr's day)

### Story 2: Consistent with prayer-based boundary

**As a** user who understands the prayer-based day boundary
**I want** the overlay date to match the main screen date behavior
**So that** there's no confusion about which day I'm viewing

**Acceptance Criteria:**

- [x] Date advances after Isha passes (Standard schedule)
- [x] Date advances after Duha/Istijaba passes (Extras schedule)
- [x] Date does NOT change at midnight (00:00)

---

## Technical Design

### Current Implementation

In `components/Overlay.tsx` line 80:

```typescript
{
  selectedPrayer.isPassed ? 'Tomorrow' : 'Today';
}
```

This logic:

- Shows "Today" if prayer hasn't passed yet
- Shows "Tomorrow" if prayer has passed
- Uses current time to determine, not the schedule's date

### Desired Implementation

In `components/Overlay.tsx` line 80:

```typescript
{
  formatDateLong(selectedPrayer.date);
}
```

This will:

- Show the actual date from the prayer's schedule data
- Automatically respects prayer-based day boundary
- Midnight/Last Third show correct "today" date

### Data Flow

```
selectedPrayer.date → formatDateLong() → Display string
```

The `selectedPrayer.date` is already correctly set:

- If prayer is from `schedule.today` → shows today's date
- If prayer is from `schedule.tomorrow` → shows tomorrow's date
- Midnight/Last Third are in `schedule.today` → show today's date

### Components Affected

| Component                | Change Type | Description                                  |
| ------------------------ | ----------- | -------------------------------------------- |
| `components/Overlay.tsx` | Modified    | Replace Today/Tomorrow text with date format |

### State Changes

No state changes - using existing `selectedPrayer.date` property.

### API Changes

No API changes - using existing schedule data.

---

## Edge Cases

| Scenario                       | Time                   | Expected Date Display                    |
| ------------------------------ | ---------------------- | ---------------------------------------- |
| Isha before it passes          | 20:00 (Isha at 20:30)  | Today's date                             |
| Isha after it passes           | 22:00 (Isha was 20:30) | Tomorrow's date (schedule advanced)      |
| Midnight, before Fajr          | 00:05 (Fajr at 05:30)  | Today's date                             |
| Late evening, before next Isha | 23:00 (Isha at 20:30)  | Today's date (schedule already advanced) |
| Midnight prayer                | 02:00                  | Today's date (Fajr's day)                |
| Last Third                     | 01:00                  | Today's date (Fajr's day)                |
| Morning, before Isha           | 10:00 (Isha at 20:30)  | Today's date                             |

---

## Error Handling

No error handling needed - `selectedPrayer.date` is always defined.

---

## Testing Plan

### Manual Tests

- [ ] Tap prayer before it passes → shows correct date
- [ ] Tap prayer after it passes → shows correct date
- [ ] Verify Midnight shows today's date
- [ ] Verify Last Third shows today's date
- [ ] Verify date changes after Isha passes (prayer-based boundary)
- [ ] Verify date does NOT change at midnight (00:00)

---

## Risks & Mitigations

| Risk                 | Likelihood | Impact | Mitigation                               |
| -------------------- | ---------- | ------ | ---------------------------------------- |
| Date format mismatch | Low        | Low    | Use existing `formatDateLong()` function |

---

## Open Questions

- [x] Date format? → Use `formatDateLong()` (EEE, d MMM yyyy)
- [x] Midnight prayer date? → Today's date (Fajr's day)
- [x] Last Third date? → Today's date (Fajr's day)
- [x] Midnight boundary? → Prayer-based (after Isha/Duha/Istijaba), NOT midnight 00:00

---

## Approval

- [x] Architect: Approved design
- [x] ReviewerQA: Ready for implementation
