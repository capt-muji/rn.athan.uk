# Bug: Standard Schedule Display Issues When Isha is Next Prayer

**Created:** 2026-01-19
**Status:** Under Investigation
**Priority:** Critical
**Affects:** Standard Schedule only
**Branch:** `refactor_time_from_cleanup_prayer`
**Related:** ADR-005 (Timing System Overhaul), timing-system-bugfixes (5 bugs fixed prior)
**Parent Feature:** ai/features/timing-system-overhaul/progress.md (Phase 10)

---

## Quick Reproduction

1. Open `mocks/simple.ts` and set times so Isha is 1 min in future, all others passed:
   ```typescript
   isha: addMinutes(1),  // 1 min in future
   // All other prayers: addMinutes(-1)
   ```
2. Run app: `yarn start --clear`
3. Open Standard schedule tab
4. **Observe:** Only Isha renders at top, Fajr-Maghrib missing

---

## Executive Summary

When Isha is the next upcoming prayer in the Standard schedule, all previous prayers (Fajr through Maghrib) fail to render. Only Isha appears at the top of the list. This is a critical display bug that breaks the core functionality of showing the daily prayer schedule.

---

## Symptoms

### Primary Issue: Missing Prayers When Isha is Next

**Mock Data Used for Testing:**
```typescript
{
  fajr: addMinutes(-1),      // 1 min ago - PASSED
  sunrise: addMinutes(-1),   // 1 min ago - PASSED
  dhuhr: addMinutes(-1),     // 1 min ago - PASSED
  asr: addMinutes(-1),       // 1 min ago - PASSED
  magrib: addMinutes(-1),    // 1 min ago - PASSED
  isha: addMinutes(1),       // 1 min in future - NEXT
}
```

**Expected Behavior:**
- All 6 prayers render (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha)
- First 5 prayers shown as "passed" (grayed out)
- Isha highlighted as "next"
- Date displays today's date

**Actual Behavior:**
- Only Isha renders at top of list
- Fajr through Maghrib completely missing
- List appears to have only 1 prayer

### Secondary Issues

| Issue | When | What Happens |
|-------|------|--------------|
| Isha +1 hour offset | When Isha is next | Isha time displays 1 hour later than actual |
| Prayers vanish on transition | Maghrib countdown finishes | All non-Isha prayers disappear, only Isha shows (now correct time) |
| Isha disappears at end | Isha countdown finishes | Fajr-Maghrib render but Isha does not |

### Pattern Analysis

1. **Maghrib or earlier is next**: Full list renders correctly
2. **Isha becomes next**: List breaks - only shows Isha
3. **Isha countdown finishes**: List shows Fajr-Maghrib but missing Isha

---

## Technical Analysis

### Data Flow Overview

```
createPrayerSequence() → stores/schedule.ts (sequenceAtom)
                              ↓
            usePrayerSequence() derives displayDate, isPassed, isNext
                              ↓
                    useSchedule() filters by belongsToDate
                              ↓
                        List.tsx renders
```

### Key Functions and Their Roles

#### 1. `createPrayerSequence()` (shared/prayer.ts)

Creates a 3-day buffer of Prayer objects. Each prayer has:
- `datetime`: Full Date object for actual time
- `belongsToDate`: The Islamic calendar day this prayer belongs to

#### 2. `calculateBelongsToDate()` (shared/prayer.ts:175-221)

Determines which Islamic day a prayer belongs to:

```typescript
// For Standard schedule:
if (type === ScheduleType.Standard) {
  // If Isha is after midnight (e.g., 01:00), it belongs to YESTERDAY
  if (prayerEnglish === 'Isha' && hours < 12) {
    const prevDate = new Date(prayerDateTime);
    prevDate.setDate(prevDate.getDate() - 1);
    return TimeUtils.formatDateShort(prevDate);
  }
  return calendarDate;
}
```

**Critical Observation:** This function uses `getLondonHours()` to extract the hour. If the datetime is incorrectly calculated (e.g., off by timezone), this could assign Isha to the wrong day.

#### 3. `createDisplayDateAtom()` (stores/schedule.ts:79-90)

Derives the display date from the sequence:

```typescript
export const createDisplayDateAtom = (type: ScheduleType) => {
  return atom((get) => {
    const sequence = get(getSequenceAtom(type));
    if (!sequence || sequence.prayers.length === 0) return null;

    const now = TimeUtils.createLondonDate();
    const nextPrayer = sequence.prayers.find((p) => p.datetime > now);

    // If no next prayer, use the last prayer's belongsToDate
    return nextPrayer?.belongsToDate ?? sequence.prayers[sequence.prayers.length - 1].belongsToDate;
  });
};
```

**Key Point:** `displayDate` is derived from `nextPrayer.belongsToDate`. If Isha's `belongsToDate` is wrong, the display date will be wrong.

#### 4. `useSchedule()` (hooks/useSchedule.ts:28)

Filters prayers for rendering:

```typescript
const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
```

**This is where the bug manifests:** If `displayDate` changes (due to Isha having a different `belongsToDate`), the filter excludes all other prayers.

---

## Root Cause Hypothesis

### Primary Hypothesis: Isha's `belongsToDate` Mismatch

When Isha becomes the next prayer:

1. `createDisplayDateAtom()` finds Isha as the next prayer
2. It sets `displayDate = isha.belongsToDate`
3. If Isha's `belongsToDate` is **different** from Fajr-Maghrib's `belongsToDate`, the filter excludes all other prayers

**Why would Isha have a different belongsToDate?**

Looking at `calculateBelongsToDate()`:
- Normal prayers: `belongsToDate = calendarDate`
- Isha after midnight: `belongsToDate = calendarDate - 1` (previous day)

**But there's also the timezone/hour extraction issue:**

```typescript
const getLondonHours = (date: Date): number => {
  const londonDate = toZonedTime(date, 'Europe/London');
  return getHours(londonDate);
};
```

If `prayerDateTime` is created incorrectly (timezone mismatch in `createPrayerDatetime()`), the hour extraction could be wrong, causing Isha to be assigned to the wrong day.

### Secondary Hypothesis: Timezone Double-Conversion

The bug may involve a timezone double-conversion:

1. `createPrayerDatetime()` uses `fromZonedTime()` which says "this string IS in London timezone, give me UTC"
2. But if the input date/time is already being interpreted as UTC, we get a double-offset
3. This would explain the "+1 hour offset" symptom

```typescript
// Current implementation (shared/time.ts:278-282)
export const createPrayerDatetime = (date: string, time: string): Date => {
  const isoString = `${date}T${time}:00`;
  return fromZonedTime(isoString, 'Europe/London');
};
```

**Issue:** `fromZonedTime` interprets the input as being IN the specified timezone. But JavaScript's `Date` constructor with ISO string (without 'Z') is interpreted as **local time**, not UTC. This could cause confusion.

---

## Code Path Walkthrough

### Scenario: All prayers passed except Isha (1 min in future)

**Step 1: Sequence Creation**

```typescript
// createPrayerSequence() creates prayers for 3 days
// For today (2026-01-19), assuming Isha is at 18:30:

Prayer {
  english: "Isha",
  datetime: Date("2026-01-19T18:30:00"), // Winter - Isha in evening
  belongsToDate: "2026-01-19" // Normal - same day
}
```

**Step 2: displayDate Derivation**

```typescript
// createDisplayDateAtom() runs:
const nextPrayer = sequence.prayers.find((p) => p.datetime > now);
// nextPrayer = Isha (only future prayer)
return nextPrayer?.belongsToDate; // "2026-01-19"
```

**Step 3: Filter in useSchedule()**

```typescript
const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);
// displayDate = "2026-01-19"
// All 6 prayers should have belongsToDate = "2026-01-19"
// Filter should return all 6
```

**Where is the bug?**

The logic SHOULD work. Let me trace what could go wrong:

### Potential Bug Location 1: refreshSequence()

When a prayer passes, `refreshSequence()` is called:

```typescript
export const refreshSequence = (type: ScheduleType): void => {
  // ...
  const nextFuturePrayer = sequence.prayers.find((p) => p.datetime > now);
  const currentDisplayDate = nextFuturePrayer?.belongsToDate ?? null;

  // Filter: keep future prayers OR passed prayers for current display date
  const relevantPrayers = sequence.prayers.filter((p) => {
    if (p.datetime > now) return true;
    if (currentDisplayDate && p.belongsToDate === currentDisplayDate) return true;
    return false;
  });
  // ...
}
```

**This looks correct.** Passed prayers with matching `belongsToDate` should be kept.

### Potential Bug Location 2: createPrayerDatetime() Timezone Issue

If the +1 hour offset symptom is real, it suggests `createPrayerDatetime()` is adding an hour somewhere:

```typescript
// If time is "18:30" and we're in GMT+0 (winter):
fromZonedTime("2026-01-19T18:30:00", 'Europe/London')
// Should return a Date representing 18:30 London time

// But if there's a DST issue or system timezone issue,
// it might return 19:30 instead
```

### Potential Bug Location 3: Summer vs Winter Isha

In **summer**, London has BST (UTC+1) and Isha can be as late as 01:00 the next calendar day.

In **winter** (current testing scenario based on Jan 19), London is on GMT (UTC+0) and Isha is typically around 17:00-19:00.

**If the code is treating winter Isha as if it crosses midnight (like summer Isha):**

```typescript
if (prayerEnglish === 'Isha' && hours < 12) {
  // If hours is being misread as 5 or 6 instead of 17 or 18...
  // This condition would trigger incorrectly!
  return previous day;
}
```

---

## Questions to Investigate

### Q1: What is Isha's actual `belongsToDate` when this bug occurs?

Add logging in `createPrayer()`:
```typescript
logger.info('CREATE_PRAYER', {
  english,
  datetime: datetime.toISOString(),
  belongsToDate,
  hours: datetime.getHours()
});
```

### Q2: What is the sequence contents when Isha is next?

Add logging in `refreshSequence()`:
```typescript
logger.info('REFRESH_SEQUENCE', {
  type,
  prayerCount: relevantPrayers.length,
  prayers: relevantPrayers.map(p => ({
    english: p.english,
    belongsToDate: p.belongsToDate
  }))
});
```

### Q3: Is `getLondonHours()` returning correct values?

Add logging:
```typescript
const hours = getLondonHours(prayerDateTime);
logger.info('LONDON_HOURS', {
  prayerDateTime: prayerDateTime.toISOString(),
  hours
});
```

### Q4: Is `createPrayerDatetime()` creating correct Date objects?

Test with known values:
```typescript
const result = createPrayerDatetime("2026-01-19", "18:30");
logger.info('PRAYER_DATETIME', {
  input: "2026-01-19 18:30",
  output: result.toISOString(),
  localHours: result.getHours()
});
```

---

## Previously Attempted Fixes (Did Not Resolve)

### Fix 1: Changed `createPrayerDatetime` to use `fromZonedTime`

```typescript
// Before:
return new Date(`${date}T${time}:00`);

// After:
const isoString = `${date}T${time}:00`;
return fromZonedTime(isoString, 'Europe/London');
```

**Result:** Did not fix the display issue.

### Fix 2: Added `getLondonHours()` helper

```typescript
const getLondonHours = (date: Date): number => {
  const londonDate = toZonedTime(date, 'Europe/London');
  return getHours(londonDate);
};
```

**Result:** Used in `calculateBelongsToDate()` but did not fix the issue.

### Fix 3: Updated `calculateBelongsToDate` to use London hours

Changed from `getHours(prayerDateTime)` to `getLondonHours(prayerDateTime)`.

**Result:** Did not fix the display issue.

---

## Files Involved

| File | Role | Relevance |
|------|------|-----------|
| `shared/prayer.ts` | Creates Prayer objects, calculates belongsToDate | High - belongsToDate logic |
| `shared/time.ts` | Creates datetime objects, London date utilities | High - timezone handling |
| `stores/schedule.ts` | Stores sequence, derives displayDate | High - displayDate derivation |
| `hooks/usePrayerSequence.ts` | Provides prayers with isPassed/isNext | Medium - adds derived state |
| `hooks/useSchedule.ts` | Filters prayers by belongsToDate | High - filter that excludes prayers |
| `components/List.tsx` | Renders filtered prayers | Low - just displays |

---

## Impact Assessment

### User Impact
- **Severity:** Critical
- **Scope:** Affects Standard schedule every day when Isha is next
- **Frequency:** Occurs every evening for multiple hours

### Technical Impact
- Core prayer list display is broken
- Users cannot see their completed prayers for the day
- May lose trust in the app's accuracy

---

## Next Steps

1. Add comprehensive logging to trace the exact values at each step
2. Create a minimal reproduction with mock data
3. Verify timezone handling in all datetime creation paths
4. Test with different system timezones to isolate the issue
5. Review the interaction between `displayDate` derivation and `belongsToDate` assignment
