# Feature: ProgressBar Midnight Bug Fix

**Status:** Draft
**Author:** Claude (AI Assistant)
**Date:** 2026-01-16
**Specialist:** Architect
**Reviewed by:** RepoMapper, Librarian, Explore (×3)
**Confirmed:** December end-of-year handling already implemented, January beginning-of-year needs fix

---

## Overview

Fix a critical bug where the ProgressBar component shows empty when user opens the app after midnight (00:00) and before Fajr. The ProgressBar needs yesterday's Isha prayer time to calculate elapsed time, but this data is unavailable on January 1st (no Dec 31 of previous year).

## ⚠️ CRITICAL RULE: NO FALLBACKS ALLOWED

**Fall back = Mask the real problem = User gets inaccurate data**

The ProgressBar MUST always show accurate progress. If yesterday's data is missing:
- **DO NOT** show approximate/fallback progress
- **DO NOT** silently fail
- **DO** throw an error so we can fix the root cause

The solution is to ensure yesterday's data is ALWAYS available at the data layer, not to add fallbacks in the UI.

---

## Problem Statement

**Current Behavior:**
- User opens app at 03:30 AM (after midnight, before Fajr)
- Progress bar shows empty (0% width)
- No error message, no fallback, no logging
- Silent failure that confuses users

**Root Cause:**
The ProgressBar calculates progress using:
```
progress = (timeElapsed / totalDuration) * 100
```

For the first prayer (Fajr) at midnight:
- `timeElapsed` = current time - yesterday's Isha time
- `totalDuration` = today's Fajr time - yesterday's Isha time (with 24h wrap)

When yesterday's data is unavailable:
```typescript
if (!yesterdayData) return null;  // Line 43 in original ProgressBar.tsx
// Result: ProgressBar renders with null, shows empty bar
```

---

## Context - Year Boundary Handling (INVESTIGATED)

### December (End of Year): ✅ ALREADY HANDLED
- `stores/sync.ts:49-53` has `shouldFetchNextYear()` function
- When user opens app in December, it fetches current year + next year data
- Dec 31 → Jan 1 transition is covered by this logic

### January (Beginning of Year): ❌ NOT HANDLED
- No code to check if it's January 1st
- No code to fetch previous year's Dec 31 data
- When app opens on Jan 1, it needs Dec 31 of previous year for ProgressBar

**Evidence:**
- `stores/sync.ts` has `shouldFetchNextYear()` but no `shouldFetchPreviousYear()`
- The `initializeAppState()` function (line 59) doesn't check for January 1st
- No API call exists to fetch previous year's data

---

## Requirements

### Functional Requirements

1. **FR-1**: ProgressBar must show accurate progress for Fajr prayer at midnight (00:00-05:00)
2. **FR-2**: ProgressBar must have access to 3 schedules:
   - Yesterday's schedule (for elapsed time calculation after midnight)
   - Today's schedule (for normal progress calculation)
   - Tomorrow's schedule (for elapsed time after Isha today and tomorrow's Fajr)
3. **FR-3**: **NO FALLBACKS** - If data is missing, throw error (fix the root cause, not the symptom)
4. **FR-4**: Error logging for debugging when data is missing
5. **FR-5**: Offline support must continue to work

### Non-Functional Requirements

1. **NFR-1**: No performance regression (ProgressBar is rendered on every timer tick)
2. **NFR-2**: Memory usage must not increase significantly
3. **NFR-3**: Backward compatibility with existing schedule structure
4. **NFR-4**: Follow existing code patterns and conventions

### Out of Scope

- Changes to notification system
- Changes to timer system (except data access)
- UI/UX changes to ProgressBar appearance
- Multi-city support (London-only for now)

---

## Technical Analysis

### Current Data Flow

```
App Launch at Midnight (00:00-05:00)
  → triggerSyncLoadable() [async]
  → sync() → needsDataUpdate()
  → If Jan 1: needsDataUpdate() returns FALSE (today's data exists from Dec)
  → If Jan 1 AND cache cleared: cleanup() deletes all prayer_* keys
  → ProgressBar renders [SYNCHRONOUS]
  → Database.getPrayerByDate(yesterday) [returns null - Dec 31 missing!]
  → ProgressBar returns null → Empty bar
  → User confused
```

### Root Causes Identified

1. **January 1st Edge Case (HIGH)**
   - No code to fetch previous year's Dec 31 data
   - User opens app on Jan 1, ProgressBar needs Dec 31 Isha time
   - Dec 31 data doesn't exist → empty progress bar

2. **Race Condition (MEDIUM)**
   - ProgressBar renders before async sync completes
   - Yesterday's data deleted by `cleanup()` and not yet refetched
   - Impact: Empty progress bar on first launch at midnight

3. **Silent Failure (LOW)**
   - No error logging when yesterday's data is missing
   - No user notification
   - Impact: Poor debuggability, user confusion

### Affected Code Paths

| File | Lines | Issue |
|------|-------|-------|
| `stores/sync.ts` | 59-66 | No Jan 1 detection, no fetch previous year |
| `components/ProgressBar.tsx` | 37-51 | Missing yesterday's data → returns null |
| `components/ProgressBar.tsx` | 138 | Skips animation when progress is null |
| `stores/database.ts` | 93 | `cleanup()` deletes yesterday before refetch |
| `shared/prayer.ts` | 18-33 | Filter includes yesterday (correct) |

---

## Design Decisions

### Decision 1: Where to Store Yesterday's Data?

**Options:**
- A. Add `yesterday` property to ScheduleStore (like `today` and `tomorrow`)
- B. Keep on-demand fetching with better error handling
- C. Modify sync to always fetch yesterday in background

**Chosen:** **Option A** - Add `yesterday` to ScheduleStore

**Rationale:**
- Consistent with existing architecture (today + tomorrow pattern)
- Single source of truth for all schedule data
- Timer system can access yesterday's data without extra fetches
- Enables schedule-based day boundary for progress calculation
- Memory overhead is negligible (~1KB per schedule)

**Implementation:**
```typescript
interface ScheduleStore {
  type: ScheduleType;
  yesterday: IScheduleNow;    // NEW: Yesterday's schedule
  today: IScheduleNow;        // Existing
  tomorrow: IScheduleNow;     // Existing
  nextIndex: number;          // Existing
}
```

### Decision 2: How to Handle Missing Yesterday's Data (Jan 1 Edge Case)?

**CRITICAL: NO FALLBACKS ALLOWED**

**Options:**
- A. ❌ Fallback: Calculate from midnight (approximate but better than empty)
- B. ❌ Show empty but log warning
- C. ✅ Fetch previous year on Jan 1 in sync (MANDATORY)
- D. ❌ Loading state: Don't render ProgressBar until data available

**Chosen:** **Option C** - Fetch previous year on Jan 1, throw if fails

**Rationale:**
- **No fallbacks** - user must see accurate progress
- **Data layer fix** - ensure data exists before UI renders
- **Error on failure** - if API fails, throw error (easier to debug than silent failure)
- User always sees accurate progress bar

**Implementation:**
```typescript
// On January 1st, we MUST fetch previous year's Dec 31 data for ProgressBar
// This is a critical dependency - no fallback allowed
if (isJanuaryFirst(date)) {
  const prevYearLastDate = new Date(date.getFullYear() - 1, 11, 31);
  const prevYearData = Database.getPrayerByDate(prevYearLastDate);

  if (!prevYearData) {
    logger.info('SYNC: Jan 1 detected, fetching previous year Dec 31 data');
    
    // MANDATORY: Fetch previous year data - throw on failure
    const { currentYearData } = await Api.fetchPrayerData(false, date.getFullYear() - 1);
    Database.saveAllPrayers(currentYearData);
    logger.info('SYNC: Previous year data fetched successfully');
  }
}
```

### Decision 3: No Defensive Code

**Principle:** No error checks, no defensive code, no fallback

**Rationale:**
- Yesterday's data is **always available** (ensured by sync layer)
- ProgressBar is a **pure UI component** - it trusts the data layer
- If sync layer works correctly, this code **never fails**
- Clean, simple code is better than defensive code

**Implementation:**
```typescript
// Special case: First prayer (Fajr) - use yesterday's last prayer (Isha)
// Yesterday's data is always available - ensured by sync layer (Jan 1 fetch)
if (schedule.nextIndex === 0) {
  const yesterdaySchedule = schedule.yesterday;
  const lastIndex = Object.keys(yesterdaySchedule).length - 1;
  prevPrayer = yesterdaySchedule[lastIndex];
} else {
  prevPrayer = schedule.today[schedule.nextIndex - 1];
}
```

**Trust Model:**
- Sync layer → MANDATORILY fetches yesterday's data
- ProgressBar → TRUSTS the data layer, no checks needed
- If sync layer fails → Error during sync, not in ProgressBar


---

## Implementation Plan

### Phase 1: Data Structure Changes

#### Task 1.1: Update ScheduleStore Interface
**File:** `shared/types.ts`

Add `yesterday` property to ScheduleStore interface:
```typescript
export interface ScheduleStore {
  type: ScheduleType;
  yesterday: IScheduleNow;    // NEW: Yesterday's schedule
  today: IScheduleNow;
  tomorrow: IScheduleNow;
  nextIndex: number;
}
```

#### Task 1.2: Update buildDailySchedules
**File:** `stores/schedule.ts`

Modify to fetch yesterday's data:
```typescript
const buildDailySchedules = (type: ScheduleType, date: Date) => {
  const yesterdayDate = TimeUtils.createLondonDate(date);
  yesterdayDate.setDate(date.getDate() - 1);

  const todayData = Database.getPrayerByDate(date);
  const tomorrowDate = TimeUtils.createLondonDate(date);
  tomorrowDate.setDate(date.getDate() + 1);
  const tomorrowData = Database.getPrayerByDate(tomorrowDate);

  const yesterdayData = Database.getPrayerByDate(yesterdayDate);  // NEW

  if (!todayData || !tomorrowData) throw new Error('Missing prayer data');

  return {
    yesterday: yesterdayData ? PrayerUtils.createSchedule(yesterdayData, type) : {},  // NEW
    today: PrayerUtils.createSchedule(todayData, type),
    tomorrow: PrayerUtils.createSchedule(tomorrowData, type),
  };
};
```

#### Task 1.3: Update setSchedule Function
**File:** `stores/schedule.ts`

Update to include yesterday in state.

### Phase 2: ProgressBar Implementation

#### Task 2.1: Update ProgressBar to Use Yesterday from Schedule
**File:** `components/ProgressBar.tsx`

Clean, simple progress calculation:
```typescript
const progress = useMemo(() => {
  const nextPrayer = schedule.today[schedule.nextIndex];
  let prevPrayer;

  // Special case: First prayer (Fajr) - use yesterday's last prayer (Isha)
  // Yesterday's data is always available - ensured by sync layer (Jan 1 fetch)
  if (schedule.nextIndex === 0) {
    const yesterdaySchedule = schedule.yesterday;
    const lastIndex = Object.keys(yesterdaySchedule).length - 1;
    prevPrayer = yesterdaySchedule[lastIndex];
  } else {
    prevPrayer = schedule.today[schedule.nextIndex - 1];
  }

  // ... pure progress calculation
}, [schedule, timer.timeLeft, type]);
```

**No defensive code.** ProgressBar trusts the data layer.

### Phase 3: January 1st Edge Case

#### Task 3.1: Detect January 1st and Fetch Previous Year (MANDATORY)
**File:** `stores/sync.ts`

Update `initializeAppState()` to fetch previous year on Jan 1:
```typescript
// On January 1st, we MUST fetch previous year's Dec 31 data for ProgressBar
// This is a critical dependency - no fallback allowed
if (isJanuaryFirst(date)) {
  const prevYearLastDate = new Date(date.getFullYear() - 1, 11, 31);
  const prevYearData = Database.getPrayerByDate(prevYearLastDate);

  if (!prevYearData) {
    logger.info('SYNC: Jan 1 detected, fetching previous year Dec 31 data');
    
    // MANDATORY: Fetch previous year data - throw on failure
    const { currentYearData } = await Api.fetchPrayerData(false, date.getFullYear() - 1);
    Database.saveAllPrayers(currentYearData);
    logger.info('SYNC: Previous year data fetched successfully');
  }
}
```

**Key:** No try-catch fallback. If API fails, throw error.

#### Task 3.2: Refactor API Client - 3 Explicit Functions
**File:** `api/client.ts`

Replaced confusing boolean parameter with 3 explicit functions:

```typescript
// SCENARIO 1: Fetch previous year (Jan 1 edge case) - MANDATORY
export const fetchPreviousYear = async (targetYear: number): Promise<ISingleApiResponseTransformed[]>

// SCENARIO 2: Fetch current year (standard sync)
export const fetchCurrentYear = async (year?: number): Promise<{
  data: ISingleApiResponseTransformed[];
  year: number;
}>

// SCENARIO 3: Fetch current + next year (December proactive)
export const fetchCurrentAndNextYear = async (currentYear?: number): Promise<{
  currentYearData: ISingleApiResponseTransformed[];
  nextYearData: ISingleApiResponseTransformed[];
  currentYear: number;
  nextYear: number;
}>
```

**Benefits:**
- Clear intent (function names describe the scenario)
- Type-safe (no boolean trap)
- Parallel fetch for December scenario (Promise.all)
- Old `fetchPrayerData()` marked `@deprecated` for backward compatibility


### Phase 4: Testing

#### Task 4.1: Unit Tests
- Progress calculation with yesterday's data
- Error thrown when yesterday is missing
- January 1st year boundary handling

#### Task 4.2: Integration Tests
- First launch at midnight (00:30)
- App opened after cache clear at midnight
- Continuous countdown across midnight

#### Task 4.3: Manual Testing
- Open app at 02:00 AM → verify progress bar shows
- Open app at 00:01 AM → verify progress bar shows
- January 1st at 00:30 AM → verify progress bar shows

---

## Files Modified

| File | Phase | Change Type | Description |
|------|-------|-------------|-------------|
| `shared/types.ts` | 1 | Modified | Add `yesterday` to ScheduleStore |
| `stores/schedule.ts` | 1 | Modified | Update buildDailySchedules, throw if yesterday missing |
| `components/ProgressBar.tsx` | 2 | Modified | Clean progress calculation, no defensive code |
| `stores/sync.ts` | 3 | Modified | Use new 3 explicit API functions |
| `api/client.ts` | 3 | **REFACTORED** | 3 explicit functions replace boolean param |

---

## Edge Cases Covered

| Scenario | Solution |
|----------|----------|
| Jan 1 first launch (no Dec 31 data) | Fetch previous year on Jan 1 (MANDATORY) |
| Normal operation (yesterday exists) | Use yesterday from ScheduleStore |
| Dec 31 → Jan 1 transition | Already handled by December fetch |
| API failure on Jan 1 | **THROW ERROR** (no fallback) |
| Cache clear at midnight | Error thrown (fix root cause) |

---

## ⚠️ IMPORTANT: NO FALLBACKS RULE

**Why Fallbacks Are Wrong:**
1. Fallbacks provide **inaccurate data** to users
2. Fallbacks **mask the real problem** (missing data)
3. Fallbacks make it **impossible to debug** the root cause
4. Users deserve **accurate information**, not approximations

**The Correct Approach:**
1. **Data Layer** (sync.ts): Ensure yesterday's data is ALWAYS available
2. **UI Layer** (ProgressBar.tsx): Use data with confidence, throw if missing
3. **Error Handling**: If data is missing, throw error (easier to debug)

**What Fallbacks Were Removed:**
- ❌ Midnight fallback calculation (removed from ProgressBar.tsx)
- ❌ Try-catch with warning on Jan 1 API failure (removed from sync.ts)
- ❌ Empty state with "loading" (not needed if data is always available)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Memory usage increase | Low | Low | Yesterday is only 1 prayer (~100 bytes) |
| Performance regression | Low | Medium | Schedule data already in memory |
| ScheduleStore structure change | Medium | Low | Backward compatible (optional property) |
| Jan 1 API failure | Low | High | **THROW ERROR** - forces fix, no silent failure |
| Sync race condition | Low | Medium | Schedule data loaded synchronously first |

---

## Rollout Plan

### Phase 1: Data Structure (Day 1)
- [ ] Update ScheduleStore interface
- [ ] Update initial schedule creation
- [ ] Update buildDailySchedules
- [ ] Update setSchedule function

### Phase 2: ProgressBar Implementation (Day 2)
- [ ] Update ProgressBar to use yesterday from schedule
- [ ] Add error logging
- [ ] **REMOVE all fallbacks**

### Phase 3: January Edge Case (Day 3)
- [ ] Handle Jan 1 year boundary in sync (MANDATORY fetch)
- [ ] Update API client for previous year fetch
- [ ] Add unit tests

### Phase 4: Verification (Day 4)
- [ ] Manual testing at midnight
- [ ] Error logging verification
- [ ] Documentation update

---

## Open Questions

- [ ] Do we need to update the progress.md for the Islamic day boundary feature?
- [ ] Should we add monitoring/analytics for Jan 1 API failures?

---

## Approval

- [ ] Architect: Plan created
- [ ] RepoMapper: Files identified
- [ ] Librarian: Patterns researched
- [ ] ReviewerQA: Review pending
- [ ] Implementer: Ready to build

---

## Related

- **Related Issue**: ProgressBar empty at midnight (00:00-05:00) before Fajr
- **Related Files**: components/ProgressBar.tsx, stores/schedule.ts, stores/sync.ts, api/client.ts
- **Dependencies**: None (self-contained fix)
- **Supersedes**: None
- **Related Memory**: AGENTS.md - Islamic Day Boundary feature
