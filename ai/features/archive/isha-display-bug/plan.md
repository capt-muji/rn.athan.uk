# Investigation Plan: Isha Display Bug

**Created:** 2026-01-19
**Status:** Ready for Investigation
**Branch:** `refactor_time_from_cleanup_prayer`
**Bug Report:** ai/features/isha-display-bug/description.md
**Parent Feature:** ai/features/timing-system-overhaul/progress.md (Phase 10)

---

## Investigation Strategy

This bug requires systematic tracing of data through the system. We'll use a "breadcrumb" approach: add logging at each step, run with mock data, and trace where the data diverges from expectations.

---

## Phase 1: Data Collection (Diagnostic Logging)

### Task 1.1: Add logging to createPrayer()

**File:** `shared/prayer.ts`
**Location:** `createPrayer()` function

```typescript
export const createPrayer = (params: CreatePrayerParams): Prayer => {
  const { type, english, arabic, date, time } = params;
  const datetime = createPrayerDatetime(date, time);
  const belongsToDate = calculateBelongsToDate(type, english, date, datetime);

  // DIAGNOSTIC: Log prayer creation
  logger.info('PRAYER_CREATE', {
    english,
    inputDate: date,
    inputTime: time,
    datetime: datetime.toISOString(),
    datetimeLocal: datetime.toString(),
    belongsToDate,
    type,
  });

  return {
    id: generatePrayerId(type, english, date),
    type,
    english,
    arabic,
    datetime,
    time,
    belongsToDate,
  };
};
```

**Purpose:** Verify what `belongsToDate` is being assigned to each prayer.

---

### Task 1.2: Add logging to calculateBelongsToDate()

**File:** `shared/prayer.ts`
**Location:** `calculateBelongsToDate()` function

```typescript
export const calculateBelongsToDate = (
  type: ScheduleType,
  prayerEnglish: string,
  calendarDate: string,
  prayerDateTime: Date
): string => {
  const hours = getLondonHours(prayerDateTime);

  // DIAGNOSTIC: Log hour calculation
  logger.info('BELONGS_TO_DATE_CALC', {
    prayer: prayerEnglish,
    type,
    calendarDate,
    prayerDateTime: prayerDateTime.toISOString(),
    londonHours: hours,
  });

  // ... rest of function
};
```

**Purpose:** Verify that `getLondonHours()` returns the expected value.

---

### Task 1.3: Add logging to createDisplayDateAtom()

**File:** `stores/schedule.ts`
**Location:** `createDisplayDateAtom()` function

```typescript
export const createDisplayDateAtom = (type: ScheduleType) => {
  return atom((get) => {
    const sequence = get(getSequenceAtom(type));
    if (!sequence || sequence.prayers.length === 0) return null;

    const now = TimeUtils.createLondonDate();
    const nextPrayer = sequence.prayers.find((p) => p.datetime > now);

    // DIAGNOSTIC: Log displayDate derivation
    logger.info('DISPLAY_DATE_DERIVE', {
      type,
      now: now.toISOString(),
      nextPrayer: nextPrayer ? {
        english: nextPrayer.english,
        datetime: nextPrayer.datetime.toISOString(),
        belongsToDate: nextPrayer.belongsToDate,
      } : null,
      result: nextPrayer?.belongsToDate ?? sequence.prayers[sequence.prayers.length - 1].belongsToDate,
    });

    return nextPrayer?.belongsToDate ?? sequence.prayers[sequence.prayers.length - 1].belongsToDate;
  });
};
```

**Purpose:** See what `displayDate` is being derived and from which prayer.

---

### Task 1.4: Add logging to useSchedule filter

**File:** `hooks/useSchedule.ts`
**Location:** After the filter

```typescript
export const useSchedule = (type: ScheduleType) => {
  // ...
  const { prayers, displayDate, isReady } = usePrayerSequence(type);

  // Filter to today's prayers
  const todayPrayers = prayers.filter((p) => p.belongsToDate === displayDate);

  // DIAGNOSTIC: Log filter results
  logger.info('SCHEDULE_FILTER', {
    type,
    displayDate,
    totalPrayers: prayers.length,
    filteredCount: todayPrayers.length,
    allBelongsToDates: prayers.map(p => ({ english: p.english, belongsToDate: p.belongsToDate })),
    filteredPrayers: todayPrayers.map(p => p.english),
  });

  // ...
};
```

**Purpose:** See exactly which prayers are being filtered out and why.

---

### Task 1.5: Add logging to refreshSequence()

**File:** `stores/schedule.ts`
**Location:** In `refreshSequence()` function

```typescript
export const refreshSequence = (type: ScheduleType): void => {
  const sequenceAtom = getSequenceAtom(type);
  const sequence = store.get(sequenceAtom);

  if (!sequence) return;

  const now = TimeUtils.createLondonDate();
  const nextFuturePrayer = sequence.prayers.find((p) => p.datetime > now);
  const currentDisplayDate = nextFuturePrayer?.belongsToDate ?? null;

  // DIAGNOSTIC: Log before filter
  logger.info('REFRESH_SEQUENCE_BEFORE', {
    type,
    now: now.toISOString(),
    totalPrayers: sequence.prayers.length,
    nextFuturePrayer: nextFuturePrayer?.english,
    currentDisplayDate,
    prayers: sequence.prayers.map(p => ({
      english: p.english,
      datetime: p.datetime.toISOString(),
      belongsToDate: p.belongsToDate,
      isFuture: p.datetime > now,
    })),
  });

  // ... filter logic ...

  // DIAGNOSTIC: Log after filter
  logger.info('REFRESH_SEQUENCE_AFTER', {
    type,
    relevantPrayerCount: relevantPrayers.length,
    relevantPrayers: relevantPrayers.map(p => p.english),
  });
};
```

**Purpose:** See what prayers are kept/removed during refresh.

---

## Phase 2: Create Minimal Reproduction

### Task 2.1: Create mock data file for Isha-next scenario

**File:** `mocks/isha-bug.ts` (new)

```typescript
import { addMinutes } from 'date-fns';

/**
 * Mock data that reproduces the Isha display bug
 * All prayers passed except Isha (1 min in future)
 */
export const createIshaNextMock = () => {
  const now = new Date();

  return {
    fajr: formatTime(addMinutes(now, -360)),    // 6 hours ago
    sunrise: formatTime(addMinutes(now, -300)), // 5 hours ago
    dhuhr: formatTime(addMinutes(now, -180)),   // 3 hours ago
    asr: formatTime(addMinutes(now, -90)),      // 1.5 hours ago
    magrib: formatTime(addMinutes(now, -30)),   // 30 min ago
    isha: formatTime(addMinutes(now, 1)),       // 1 min in future
  };
};

const formatTime = (date: Date): string => {
  return date.toTimeString().slice(0, 5); // "HH:mm"
};
```

**Purpose:** Consistent reproduction of the bug scenario.

---

### Task 2.2: Create test harness for isolated debugging

**File:** `mocks/test-isha-bug.ts` (new)

```typescript
import { createPrayer, createPrayerSequence, calculateBelongsToDate } from '@/shared/prayer';
import { createPrayerDatetime, createLondonDate, formatDateShort } from '@/shared/time';
import { ScheduleType } from '@/shared/types';
import logger from '@/shared/logger';

/**
 * Run this to trace the bug
 * import and call from app startup temporarily
 */
export const debugIshaBug = () => {
  const now = createLondonDate();
  const today = formatDateShort(now);

  logger.info('=== ISHA BUG DEBUG START ===');
  logger.info('Current time', { now: now.toISOString(), today });

  // Test createPrayerDatetime for different times
  const testTimes = ['06:30', '12:30', '18:30', '23:30'];
  testTimes.forEach(time => {
    const result = createPrayerDatetime(today, time);
    logger.info('createPrayerDatetime', {
      input: `${today} ${time}`,
      outputISO: result.toISOString(),
      outputLocal: result.toString(),
      hours: result.getHours(),
    });
  });

  // Test belongsToDate calculation for Isha at different times
  const ishaTestTimes = ['17:30', '18:30', '19:30', '00:30', '01:30'];
  ishaTestTimes.forEach(time => {
    const datetime = createPrayerDatetime(today, time);
    const belongsToDate = calculateBelongsToDate(
      ScheduleType.Standard,
      'Isha',
      today,
      datetime
    );
    logger.info('Isha belongsToDate', {
      time,
      datetime: datetime.toISOString(),
      belongsToDate,
      matchesToday: belongsToDate === today,
    });
  });

  // Create a full prayer and check its belongsToDate
  const ishaPrayer = createPrayer({
    type: ScheduleType.Standard,
    english: 'Isha',
    arabic: 'العشاء',
    date: today,
    time: '18:30',
  });

  logger.info('Full Isha prayer', {
    ...ishaPrayer,
    datetime: ishaPrayer.datetime.toISOString(),
  });

  logger.info('=== ISHA BUG DEBUG END ===');
};
```

**Purpose:** Isolate and test specific functions without running the full app.

---

## Phase 3: Hypothesis Testing

### Task 3.1: Test Hypothesis - Isha belongsToDate mismatch

**Test:** Compare `belongsToDate` of all 6 Standard prayers for the same calendar date.

**Expected:** All 6 should have the same `belongsToDate` (assuming winter time, no midnight crossing).

**Steps:**
1. Enable logging from Tasks 1.1-1.2
2. Run app with mock data (Isha next)
3. Check logs for `PRAYER_CREATE` entries
4. Verify all 6 prayers have matching `belongsToDate`

**If mismatch found:** The bug is in `calculateBelongsToDate()` - the hour detection is wrong.

---

### Task 3.2: Test Hypothesis - displayDate derivation error

**Test:** Verify `displayDate` is derived from Isha's `belongsToDate` when Isha is next.

**Steps:**
1. Enable logging from Task 1.3
2. Run app with mock data
3. Check `DISPLAY_DATE_DERIVE` log
4. Verify `displayDate` matches Isha's `belongsToDate`

**If displayDate is wrong:** The bug is in how `nextPrayer` is found or how `belongsToDate` is accessed.

---

### Task 3.3: Test Hypothesis - Filter excludes prayers incorrectly

**Test:** Verify the filter in `useSchedule()` is working as expected.

**Steps:**
1. Enable logging from Task 1.4
2. Run app with mock data
3. Check `SCHEDULE_FILTER` log
4. Verify `displayDate` matches prayers' `belongsToDate`

**If filter excludes prayers with matching belongsToDate:** Bug is in the filter or data comparison.

**If prayers have mismatched belongsToDate:** Bug is upstream in prayer creation.

---

### Task 3.4: Test Hypothesis - refreshSequence removes prayers

**Test:** Check if `refreshSequence()` is incorrectly removing passed prayers.

**Steps:**
1. Enable logging from Task 1.5
2. Run app, wait for a prayer to pass
3. Check `REFRESH_SEQUENCE_BEFORE` and `REFRESH_SEQUENCE_AFTER` logs
4. Verify passed prayers with current `displayDate` are kept

**If passed prayers are removed:** Bug is in the refresh filter logic.

---

### Task 3.5: Test Hypothesis - Timezone double-conversion

**Test:** Create prayers with known times and verify datetime is correct.

**Steps:**
1. Run `debugIshaBug()` from Task 2.2
2. Check `createPrayerDatetime` outputs
3. For time "18:30", verify:
   - ISO string shows correct UTC equivalent
   - Local hours show 18 (not 19 or 17)

**If time is off by 1 hour:** Bug is in `createPrayerDatetime()` or timezone handling.

---

## Phase 4: Fix Implementation

Based on the investigation, implement the appropriate fix. **Try in order of priority.**

### Potential Fix A: Correct timezone handling in createPrayerDatetime()

**Priority:** 1 (Try first) - Addresses +1 hour symptom directly
**Pros:** Single point of change, affects all datetime creation consistently
**Cons:** May have downstream effects on notifications if times change

If investigation reveals timezone double-conversion:

```typescript
export const createPrayerDatetime = (date: string, time: string): Date => {
  // Prayer times from API are in London timezone
  // Create a Date that represents that moment in London time

  // Option 1: Use formatInTimeZone (if fromZonedTime isn't working)
  // Option 2: Manually construct with timezone offset
  // Option 3: Use a different date-fns-tz function

  // Implementation depends on what investigation reveals
};
```

---

### Potential Fix B: Correct hour detection in calculateBelongsToDate()

**Priority:** 2 (Try if Fix A doesn't resolve)
**Pros:** Isolated to belongsToDate logic, minimal blast radius
**Cons:** Treats symptom not root cause if datetime is actually wrong

If investigation reveals incorrect hour detection:

```typescript
export const calculateBelongsToDate = (...) => {
  // May need to use different hour extraction method
  // Or fix the input datetime first

  // Implementation depends on what investigation reveals
};
```

---

### Potential Fix C: Fix displayDate derivation

**Priority:** 3 (Try if belongsToDate is confirmed correct)
**Pros:** Quick fix at the point where display date is determined
**Cons:** Doesn't fix underlying datetime/belongsToDate issues

If investigation reveals displayDate is derived incorrectly:

```typescript
export const createDisplayDateAtom = (type: ScheduleType) => {
  return atom((get) => {
    // May need to handle edge cases differently
    // Or use a different strategy for finding displayDate

    // Implementation depends on what investigation reveals
  });
};
```

---

### Potential Fix D: Fix filter logic in useSchedule()

**Priority:** 4 (Last resort)
**Pros:** Direct fix at manifestation point, immediately visible
**Cons:** May mask deeper issues, could introduce inconsistencies

If investigation reveals filter is too strict:

```typescript
const todayPrayers = prayers.filter((p) => {
  // May need additional conditions
  // Or different comparison logic

  // Implementation depends on what investigation reveals
});
```

---

## Phase 5: Verification

### Task 5.1: Test with mock data - Isha next scenario

1. All 6 prayers render
2. First 5 shown as passed
3. Isha highlighted as next
4. Date shows correctly

### Task 5.2: Test with mock data - Maghrib next scenario

1. All 6 prayers render
2. First 4 shown as passed
3. Maghrib highlighted as next
4. No regression from fix

### Task 5.3: Test with mock data - After Isha passes

1. All 6 prayers render (all passed)
2. Next day's prayers show correctly
3. Date updates to tomorrow

### Task 5.4: Test summer time (Isha after midnight)

1. Create mock with Isha at 01:00
2. Verify belongsToDate is previous day
3. Verify list renders correctly

### Task 5.5: Test timezone edge cases

1. Set device to non-London timezone
2. Verify prayers display correctly
3. Verify countdown is accurate

---

## Files to Modify

| File | Phase | Purpose |
|------|-------|---------|
| `shared/prayer.ts` | 1, 4 | Diagnostic logging, potential fix |
| `shared/time.ts` | 1, 4 | Diagnostic logging, potential fix |
| `stores/schedule.ts` | 1, 4 | Diagnostic logging, potential fix |
| `hooks/useSchedule.ts` | 1, 4 | Diagnostic logging, potential fix |
| `mocks/isha-bug.ts` | 2 | Reproduction data (new file) |
| `mocks/test-isha-bug.ts` | 2 | Debug harness (new file) |

---

## Estimated Timeline

| Phase | Time | Output |
|-------|------|--------|
| Phase 1: Diagnostic Logging | 30 min | Logs added to key functions |
| Phase 2: Reproduction Setup | 20 min | Mock data and test harness |
| Phase 3: Hypothesis Testing | 1-2 hours | Root cause identified |
| Phase 4: Fix Implementation | 30-60 min | Bug fixed |
| Phase 5: Verification | 30 min | All scenarios tested |

**Total: 3-4 hours**

---

## Success Criteria

1. All 6 Standard prayers render when Isha is next
2. All 6 Standard prayers render when any prayer is next
3. Isha time displays correctly (no +1 hour offset)
4. Prayer list updates correctly when prayers pass
5. No regressions in Extras schedule
6. Works with device set to non-London timezone

---

## Notes

- Keep diagnostic logging minimal and remove after fix
- Test with both mock data and real data
- Verify fix doesn't break the 5 bugs already fixed in timing-system-bugfixes
- Update progress.md as investigation progresses
