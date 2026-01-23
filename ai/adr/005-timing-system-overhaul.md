# ADR-005: Timing System Overhaul

**Status:** Proposed
**Date:** 2026-01-18
**Decision Makers:** muji
**Supersedes:** None (complements ADR-004)

---

## Context

### The Problem

The current timing system implements prayer-based day boundaries (ADR-004) but has accumulated complexity that causes recurring bugs:

1. **Date display issues** - Dates shown incorrectly in edge cases
2. **Countdown/countdown bugs** - Wrong prayer or wrong time displayed
3. **Schedule advancement bugs** - Schedule doesn't advance when expected

### Root Cause Analysis

After deep analysis, the root cause is **the data model doesn't fit the domain**.

#### Current Model: Date-Centric

```typescript
interface ScheduleStore {
  yesterday: IScheduleNow;   // Map of prayers for yesterday
  today: IScheduleNow;       // Map of prayers for "today" (but may be tomorrow!)
  tomorrow: IScheduleNow;    // Map of prayers for day after "today"
  nextIndex: number;         // Which prayer we're counting to
}
```

**Problems with this model:**

| Issue | Description | Impact |
|-------|-------------|--------|
| Semantic confusion | `schedule.today` contains tomorrow's data after advancement | Bugs in date display, isPassed calculation |
| Yesterday fallback hack | `calculateCountdown()` needs special case to use yesterday's prayer when today's is actually tomorrow's | Complex, error-prone, hard to understand |
| Manual synchronization | Must keep `yesterday`, `today`, `tomorrow`, `nextIndex`, `standardDateAtom`, `extraDateAtom` in sync | Race conditions, stale state |
| Scattered logic | Date comparisons in 6+ files | Hard to maintain, easy to introduce bugs |
| "Date" ambiguity | Same word means: calendar date, prayer date, schedule date, display date | Confusion in code and bugs |

#### The Yesterday Fallback: A Symptom

The existence of this code proves the model is wrong:

```typescript
// In calculateCountdown() - shared/time.ts
if (todayPrayer.date !== today) {
  // Schedule advanced, but we might need yesterday's prayer
  if (isNextPrayer) {
    const yesterdayTimeLeft = secondsRemainingUntil(yesterdayPrayer.time, yesterdayPrayer.date);
    if (yesterdayTimeLeft > 0) {
      return { timeLeft: yesterdayTimeLeft, name: yesterdayPrayer.english };
    }
  }
}
```

**Why this exists:** After Duha passes at 09:00, Extras advances to "tomorrow", but the next prayer (Midnight at 23:00) is still on "yesterday" (tonight). The model forces us to look backwards.

### The Inverted Schedule Problem

The Extras schedule has prayers in reverse chronological order within a 24-hour period:

```
Midnight  23:23 (tonight)
Last Third 02:40 (tomorrow morning)
Suhoor    05:32 (tomorrow morning)
Duha      08:08 (tomorrow morning)
[ADVANCE HERE]
```

When Duha passes at 08:08, the schedule advances to "tomorrow", but the very first prayer (Midnight) is still 15 hours away on "today" (tonight). This creates the need for the yesterday fallback.

## Decision

**Redesign the timing system with a Prayer-Centric model instead of a Date-Centric model.**

### Core Principle Change

| Current (Date-Centric) | Proposed (Prayer-Centric) |
|------------------------|---------------------------|
| Prayers organized by calendar date | Prayers organized by sequence |
| "Next prayer" = `schedule.today[nextIndex]` | "Next prayer" = first prayer after now |
| Manual advancement at day boundary | Automatic - always derived from current time |
| `schedule.today` can mean tomorrow | `nextPrayer` always means next prayer |

### New Data Model

```typescript
// PROPOSED: Prayer-Centric Model
interface Prayer {
  id: string;                    // Unique: "standard_fajr_2026-01-18"
  type: ScheduleType;            // 'standard' | 'extra'
  english: string;               // "Fajr"
  arabic: string;                // "الفجر"
  datetime: Date;                // Full datetime (not just time string)
  belongsToDate: string;         // YYYY-MM-DD - the Islamic date this prayer belongs to
}

interface ScheduleState {
  type: ScheduleType;
  prayers: Prayer[];             // Next 48 hours of prayers, sorted by datetime
  displayDate: string;           // Derived from current prayer's belongsToDate
}

// DERIVED (not stored):
// nextPrayer = prayers.find(p => p.datetime > now)
// isPassed(prayer) = prayer.datetime < now
// countdown = nextPrayer.datetime - now
```

### Key Changes

#### 1. Absolute Datetimes Instead of Time Strings

**Current:**
```typescript
{ date: "2026-01-18", time: "06:12" }  // Must combine for comparison
```

**Proposed:**
```typescript
{ datetime: new Date("2026-01-18T06:12:00+00:00") }  // Direct comparison
```

**Benefit:** No string parsing, no timezone confusion, simple `prayer.datetime > now`.

#### 2. Derived State Instead of Stored State

**Current:**
```typescript
// Stored in atom, manually incremented
nextIndex: 3

// When Asr passes:
incrementNextIndex();  // nextIndex = 4
```

**Proposed:**
```typescript
// Computed on demand
const nextPrayer = useMemo(() =>
  prayers.find(p => p.datetime > now),
  [prayers, now]
);
```

**Benefit:** No synchronization bugs, always correct.

#### 3. Single List Instead of Yesterday/Today/Tomorrow

**Current:**
```typescript
{
  yesterday: { 0: Fajr, 1: Sunrise, ..., 5: Isha },
  today: { 0: Fajr, 1: Sunrise, ..., 5: Isha },
  tomorrow: { 0: Fajr, 1: Sunrise, ..., 5: Isha },
}
```

**Proposed:**
```typescript
{
  prayers: [
    { datetime: "2026-01-17T18:15", english: "Isha", belongsToDate: "2026-01-17" },
    { datetime: "2026-01-18T06:12", english: "Fajr", belongsToDate: "2026-01-18" },
    { datetime: "2026-01-18T07:48", english: "Sunrise", belongsToDate: "2026-01-18" },
    // ... next 48 hours
  ]
}
```

**Benefit:** No yesterday fallback needed. Previous prayer is just `prayers[currentIndex - 1]`.

#### 4. Display Date Derived from Current Prayer

**Current:**
```typescript
// Stored separately, must sync after advancement
display_date_standard: "2026-01-18"
```

**Proposed:**
```typescript
// Derived from the schedule's prayers
const displayDate = useMemo(() => {
  const current = prayers.find(p => p.datetime > now);
  return current?.belongsToDate ?? prayers[0].belongsToDate;
}, [prayers, now]);
```

**Benefit:** Always correct, no synchronization.

### Implementation Approach

#### Phase 1: Data Layer Refactor
1. Add `datetime` field to prayer transformation
2. Create new `PrayerSequence` type with sorted prayer list
3. Keep old model temporarily for backwards compatibility

#### Phase 2: State Layer Refactor
1. Create new `prayerSequenceAtom` alongside existing atoms
2. Derive `nextPrayer`, `isPassed`, `countdown` from sequence
3. Remove `nextIndex` manual management

#### Phase 3: UI Layer Migration
1. Update components to use derived state
2. Remove yesterday fallback logic from `calculateCountdown()`
3. Simplify `CountdownBar` to use adjacent prayers in sequence

#### Phase 4: Cleanup
1. Remove old `yesterday/today/tomorrow` structure
2. Remove manual `nextIndex` increment
3. Update notifications to use new model

## Consequences

### Positive

1. **Simpler mental model** - "Next prayer" always means next prayer
2. **No yesterday fallback** - Previous prayer is always `prayers[i-1]`
3. **Derived state** - No synchronization bugs
4. **Easier testing** - Pure functions, no implicit state
5. **Better TypeScript** - Branded types prevent date confusion

### Negative

1. **Breaking change** - Requires updating all consumers
2. **Migration complexity** - Must support both models during transition
3. **Storage change** - May need to re-fetch data on upgrade
4. **Learning curve** - Team must understand new model

### Neutral

1. **Performance** - Similar (may be slightly better due to fewer atoms)
2. **Storage size** - Similar (list vs three maps)
3. **Notification system** - Needs update but logic unchanged

## Alternatives Considered

### Alternative 1: Fix Bugs in Current Model

**Description:** Keep date-centric model, fix each bug individually.

**Pros:**
- No breaking changes
- Incremental fixes

**Cons:**
- Treats symptoms, not cause
- Yesterday fallback remains
- Semantic confusion remains
- Will have more bugs

**Why Rejected:** The model is fundamentally misaligned with the domain. Bug fixes are temporary.

### Alternative 2: Event-Driven Architecture

**Description:** Use event emitters instead of state. "Prayer passed" event triggers updates.

**Pros:**
- Clear causality
- Loosely coupled

**Cons:**
- Major architectural change
- Harder to debug
- Overkill for this problem

**Why Rejected:** Too much change for the benefit. The problem is the data model, not the state management approach.

### Alternative 3: Keep Date-Centric, Add Explicit "Active Date"

**Description:** Add `activeDate` field separate from prayer dates.

**Pros:**
- Smaller change
- Clearer than current

**Cons:**
- Still need yesterday fallback
- Still have synchronization
- Doesn't solve root cause

**Why Rejected:** Partial fix. The inverted schedule problem remains.

## Implementation Notes

### Files Affected

| File | Change |
|------|--------|
| `shared/types.ts` | Add `Prayer`, `PrayerSequence` types |
| `shared/prayer.ts` | Add `createPrayerSequence()` |
| `shared/time.ts` | Simplify `calculateCountdown()` |
| `stores/schedule.ts` | Replace `ScheduleStore` with `PrayerSequence` |
| `stores/sync.ts` | Update initialization |
| `stores/countdown.ts` | Use derived next prayer |
| `hooks/usePrayer.ts` | Derive from sequence |
| `hooks/useSchedule.ts` | Return sequence instead of store |
| `components/CountdownBar.tsx` | Use adjacent prayers |
| `components/Countdown.tsx` | Use derived countdown |
| `components/Prayer.tsx` | Use derived isPassed |

### Migration Strategy

1. **Feature flag** - New model behind flag initially
2. **Parallel atoms** - Run old and new simultaneously
3. **Gradual migration** - Move components one at a time
4. **Verification** - Compare old vs new output
5. **Cleanup** - Remove old model after verification

### Backwards Compatibility

- MMKV keys unchanged for preferences
- Prayer data keys unchanged (`prayer_YYYY-MM-DD`)
- Notifications unchanged (use datetime from prayer)
- Version bump triggers cache clear (existing behavior)

## Related Decisions

- ADR-001: Rolling Notification Buffer (unchanged)
- ADR-002: English Midnight Day Boundary (superseded by ADR-004)
- ADR-003: Prayer Explanation Modal Removal (unchanged)
- ADR-004: Prayer-Based Day Boundary (complemented - defines WHAT, this defines HOW)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-18 | muji | Initial proposal |
