# Feature: Timing System Overhaul

**Status:** Ready for Implementation (QA Approved)
**Author:** muji
**Date:** 2026-01-18
**Specialist:** Architect
**ADR:** ai/adr/005-timing-system-overhaul.md

---

## Overview

Replace the date-centric timing system with a prayer-centric model to eliminate recurring bugs with date display, countdown countdown, and schedule advancement.

## Problem Statement

The current timing system organizes prayers by calendar date (`yesterday`, `today`, `tomorrow`), but the domain is about prayer sequence. This mismatch causes:

1. **Semantic confusion**: `schedule.today` contains tomorrow's data after advancement
2. **Yesterday fallback hack**: Complex logic to handle Extras schedule
3. **Manual synchronization**: 6+ atoms must stay in sync
4. **Recurring bugs**: Date display, countdown, advancement issues

## Goals

- [ ] Replace date-centric model with prayer-centric model
- [ ] Eliminate yesterday fallback hack
- [ ] Derive state instead of storing it (nextPrayer, isPassed, countdown)
- [ ] Single list of prayers instead of yesterday/today/tomorrow
- [ ] Display date derived from current prayer
- [ ] All existing functionality preserved

## Non-Goals

- No changes to notification system (will adapt to new model)
- No changes to UI appearance
- No changes to MMKV prayer data storage format
- No new features (this is a refactor)

## Technical Design

### Current Model (Date-Centric)

```typescript
interface ScheduleStore {
  yesterday: IScheduleNow;   // Prayers keyed by index
  today: IScheduleNow;       // Prayers keyed by index
  tomorrow: IScheduleNow;    // Prayers keyed by index
  nextIndex: number;         // Manually incremented
}
```

### New Model (Prayer-Centric)

```typescript
interface Prayer {
  id: string;                    // "standard_fajr_2026-01-18"
  type: ScheduleType;
  english: string;
  arabic: string;
  datetime: Date;                // Full datetime
  belongsToDate: string;         // Islamic date this prayer belongs to
}

interface PrayerSequence {
  type: ScheduleType;
  prayers: Prayer[];             // Sorted by datetime, next 48 hours
}

// DERIVED:
// nextPrayer = prayers.find(p => p.datetime > now)
// isPassed = prayer.datetime < now
// countdown = nextPrayer.datetime - now
// displayDate = nextPrayer.belongsToDate
```

### Key Changes

| Aspect | Current | New |
|--------|---------|-----|
| Prayer storage | Three maps (yesterday/today/tomorrow) | Single sorted array |
| Next prayer | Stored `nextIndex`, manually incremented | Derived: first prayer > now |
| isPassed | Stored check with date verification | Derived: `prayer.datetime < now` |
| Countdown | `calculateCountdown()` with fallback | Simple: `nextPrayer.datetime - now` |
| Display date | Stored atom, synced on advancement | Derived from current prayer |

### Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `shared/types.ts` | Add | New `Prayer`, `PrayerSequence` interfaces |
| `shared/prayer.ts` | Modify | Add `createPrayerSequence()` function |
| `shared/time.ts` | Modify | Simplify `calculateCountdown()` |
| `stores/schedule.ts` | Rewrite | Replace `ScheduleStore` with `PrayerSequence` |
| `stores/sync.ts` | Modify | Update initialization to use sequence |
| `stores/countdown.ts` | Modify | Use derived next prayer |
| `hooks/usePrayer.ts` | Modify | Derive isPassed/isNext from sequence |
| `hooks/useSchedule.ts` | Modify | Return sequence instead of store |
| `components/ProgressBar.tsx` | Modify | Use adjacent prayers in sequence |
| `components/Countdown.tsx` | Modify | Use derived countdown |
| `components/Prayer.tsx` | Modify | Use derived state |
| `components/Day.tsx` | Modify | Use derived display date |

## Implementation Phases

### Phase 1: Foundation
- Add new types to `shared/types.ts`
- Create `createPrayerSequence()` in `shared/prayer.ts`
- Add datetime parsing/formatting utilities

### Phase 2: State Layer
- Create `prayerSequenceAtom` (parallel to existing atoms)
- Create derived selectors for nextPrayer, isPassed, countdown
- Update `stores/schedule.ts` to build sequences

### Phase 3: Hooks Layer
- Update `useSchedule.ts` to expose sequence
- Update `usePrayer.ts` to use derived state
- Create `useNextPrayer()` hook

### Phase 4: UI Components
- Update Countdown.tsx to use derived countdown
- Update Prayer.tsx to use derived isPassed
- Update ProgressBar.tsx to use adjacent prayers
- Update Day.tsx to use derived display date

### Phase 5: Cleanup
- Remove yesterday/today/tomorrow structure
- Remove nextIndex manual management
- Remove yesterday fallback from calculateCountdown()
- Remove redundant date atoms

## Edge Cases

| Scenario | How New Model Handles It |
|----------|-------------------------|
| Extras inverted schedule | Previous prayer is `prayers[i-1]`, no fallback needed |
| Isha after midnight | Prayer datetime includes date, comparison is simple |
| Both schedules different dates | Each sequence independent, displayDate derived |
| App opened late | Sequence filtered to future prayers, no advancement needed |
| January 1st | Sequence includes Dec 31 prayers with correct datetime |

## Testing Plan

### Manual Tests
- [ ] Standard schedule advances after Isha
- [ ] Extras schedule advances after Duha (or Istijaba on Friday)
- [ ] Countdown always shows correct countdown
- [ ] Date display matches current prayer's belongsToDate
- [ ] ProgressBar shows correct progress
- [ ] isPassed styling correct after advancement
- [ ] Both schedules can show different dates

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality | Medium | High | Parallel atoms during migration |
| Performance regression | Low | Medium | Profile before/after |
| Migration bugs | Medium | Medium | Feature flag, gradual rollout |

## Open Questions

- [x] Should we keep MMKV prayer data format? **Yes - no change needed**
- [x] How to handle notification system? **Will adapt to new model, no changes to notification logic**
- [ ] Should we add unit tests for new model? **Decision: Manual testing only**

---

## Approval

- [ ] Architect: Design approved
- [ ] ReviewerQA: Risk assessment complete
- [ ] Implementer: Ready to build
