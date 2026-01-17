# Feature: Islamic Day Boundary

**Status:** ✅ Implementation Complete - Awaiting Manual Test
**Created:** 2026-01-16
**Reviewed:** RepoMapper ✓, ReviewerQA ✓

---

## Tasks

### Phase 1: Foundation (stores/sync.ts)
- [x] Task 1.1: Split `dateAtom` into `standardDateAtom` and `extraDateAtom`
- [x] Task 1.2: Add `getDateAtom(type: ScheduleType)` helper function
- [x] Task 1.3: Add `setScheduleDate(type: ScheduleType, date: string)` export
- [x] Task 1.4: Update `setDate()` to set both atoms from respective schedules

### Phase 2: Schedule Advancement (stores/schedule.ts)
- [x] Task 2.1: Add `advanceScheduleToTomorrow(type: ScheduleType)` async function
- [x] Task 2.2: Implement overlay auto-close at start of advancement
- [x] Task 2.3: Implement day-after-tomorrow fetch with retry logic
- [x] Task 2.4: Implement atomic shift (only after fetch succeeds)
- [x] Task 2.5: Call `setScheduleDate()` after successful shift

### Phase 3: Timer Integration (stores/timer.ts)
- [x] Task 3.1: Update `startTimerSchedule()` to call `advanceScheduleToTomorrow` when `nextIndex === 0`
- [x] Task 3.2: Make timer restart async-aware (await advancement before continuing)
- [x] Task 3.3: Update `startTimers()` to always start both schedule timers (remove `isLastPrayerPassed` checks)
- [x] Task 3.4: Keep `startTimerMidnight()` for API data freshness only

### Phase 4: UI Updates - Critical
- [x] Task 4.1: Remove "All prayers finished" conditional from `components/Timer.tsx`
- [x] Task 4.2: Update `components/Day.tsx` to use `getDateAtom(type)`

### Phase 4: UI Updates - Animation Components
- [x] Task 4.3: Update `components/ActiveBackground.tsx` to use schedule-specific date atom
- [x] Task 4.4: Update `components/Alert.tsx` cascade trigger to use schedule-specific date atom
- [x] Task 4.5: Update `components/Prayer.tsx` cascade trigger to use schedule-specific date atom
- [x] Task 4.6: Update `components/PrayerTime.tsx` cascade trigger to use schedule-specific date atom
- [x] Task 4.7: Update `components/List.tsx` to subscribe to schedule-specific date atom

### Phase 4: UI Updates - Verify Only
- [x] Task 4.8: Verify `components/ProgressBar.tsx` works correctly (no changes needed)
- [x] Task 4.9: Verify `stores/overlay.ts` behavior (auto-close handled in Phase 2)

### Phase 5: Verification
- [ ] ~~Task 5.1: Run `tsc --noEmit`~~ (user will test manually)
- [ ] ~~Task 5.2: Run ESLint on modified files~~ (user will test manually)
- [ ] Task 5.3: Manual test: Standard schedule transition after Isha
- [ ] Task 5.4: Manual test: Extras schedule transition after Duha
- [ ] Task 5.5: Manual test: Both schedules show different dates correctly
- [ ] Task 5.6: Manual test: Overlay auto-closes during advancement
- [ ] Task 5.7: Manual test: Notifications still fire correctly
- [ ] Task 5.8: Manual test: Cascade animations trigger correctly

### Phase 6: Documentation
- [ ] Task 6.1: Update ADR-002 status to "Superseded"
- [ ] Task 6.2: Create ADR-003 documenting prayer-based day boundary
- [x] Task 6.3: Update AGENTS.md memory section

---

## Files Modified

| File | Phase | Status | Changes |
|------|-------|--------|---------|
| `stores/sync.ts` | 1 | ✅ | Split dateAtom, add helpers |
| `stores/schedule.ts` | 2 | ✅ | Add advanceScheduleToTomorrow() |
| `stores/timer.ts` | 3 | ✅ | Update wrap behavior, async handling |
| `components/Timer.tsx` | 4 | ✅ | Remove "All prayers finished" |
| `components/Day.tsx` | 4 | ✅ | Use schedule-specific date atom |
| `components/ActiveBackground.tsx` | 4 | ✅ | Use schedule-specific date atom |
| `components/Alert.tsx` | 4 | ✅ | Update cascade trigger |
| `components/Prayer.tsx` | 4 | ✅ | Update cascade trigger |
| `components/PrayerTime.tsx` | 4 | ✅ | Update cascade trigger |
| `components/List.tsx` | 4 | ✅ | Update reactivity |
| `components/ProgressBar.tsx` | 4 | ✅ | No changes needed |
| `stores/overlay.ts` | 4 | ✅ | No changes (auto-close in schedule.ts) |
| `shared/notifications.ts` | 5 | ✅ | No changes needed |
| `stores/notifications.ts` | 5 | ✅ | No changes needed |

---

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Day boundary trigger | After final prayer | Continuous UX, no waiting state |
| "All prayers finished" | Remove permanently | Timer always shows next countdown |
| Schedule sync | Independent | Each resets after own final prayer |
| Date display | Per-schedule | Standard/Extras can show different dates |
| Overlay during advance | Auto-close | Prevent stale data display |
| Missing data handling | Retry via sync() | Graceful fallback |

---

## Notes

**Key Behavior Change:**
- OLD: After Isha → "All prayers finished" → wait for midnight → new day
- NEW: After Isha → immediately show tomorrow's date + Fajr countdown

**Risk Mitigations Applied:**
1. Async fence around schedule advancement
2. Fetch before shift (atomic operation)
3. Retry on missing data
4. Overlay auto-close
5. Schedule-specific cascade triggers

**Supersedes:** ADR-002 (English Midnight Day Boundary)

---

## Post-Implementation Bug Fixes (2026-01-17)

After initial implementation and testing, 4 critical bugs were discovered and fixed related to edge cases in the prayer-based day boundary system:

### Bug 1: Missing Schedule Advancement on App Load
**Problem:** When app was opened after the last prayer had already passed (e.g., opening at 11pm after Isha at 8pm), schedules were not advanced to tomorrow. Timer showed negative countdown or stale data.

**Root Cause:** `initializeAppState()` only called `setDate()` and `startTimers()` but never checked if last prayer had already passed.

**Fix:** Added schedule advancement check in `stores/sync.ts:initializeAppState()`:
```typescript
// Check if last prayer has already passed and advance if needed
const standardLast = standardSchedule.today[Object.keys(standardSchedule.today).length - 1];
const extraLast = extraSchedule.today[Object.keys(extraSchedule.today).length - 1];

if (TimeUtils.isTimePassed(standardLast.time)) {
  await ScheduleStore.advanceScheduleToTomorrow(ScheduleType.Standard);
}
if (TimeUtils.isTimePassed(extraLast.time)) {
  await ScheduleStore.advanceScheduleToTomorrow(ScheduleType.Extra);
}
```

### Bug 2: ActiveBackground Incorrectly Hidden After Advancement
**Problem:** Blue active background disappeared when `nextIndex === 0` after schedule advanced (e.g., after Isha passed, showing tomorrow's Fajr). This made it unclear which prayer was next.

**Root Cause:** `shouldHide` logic in `components/ActiveBackground.tsx` checked `nextIndex === 0 && date === today && isLastPrayerPassed`, but after advancement, date is tomorrow while "today" is still today, causing incorrect hide.

**Fix:** Removed entire `shouldHide` logic. Active background should ALWAYS show on the next prayer after advancement is complete.

### Bug 3: isPassed Incorrectly True After Schedule Advancement
**Problem:** After schedule advanced, all prayers showed as "passed" (checkmarks) even though they were tomorrow's prayers and hadn't occurred yet.

**Root Cause:** `hooks/usePrayer.ts` only checked `isTimePassed(todayPrayer.time)` without verifying the date. After advancement, `todayPrayer` contains tomorrow's data with tomorrow's date, but time comparison alone would return true if comparing "05:30" (Fajr tomorrow) to current time "23:00" (tonight).

**Fix:** Added date verification:
```typescript
const today = TimeUtils.formatDateShort(TimeUtils.createLondonDate());
const isPassed = todayPrayer.date === today && TimeUtils.isTimePassed(todayPrayer.time);
```

### Bug 4: Countdown Shows Wrong Prayer After Extras Advancement
**Problem:** After Duha passed (9am) on Extras schedule, timer countdown showed Midnight (11:23pm same day) but `calculateCountdown()` was trying to use "today's Midnight" which is actually tomorrow chronologically, resulting in negative countdown.

**Root Cause:** `shared/time.ts:calculateCountdown()` didn't handle the case where schedule has advanced (todayPrayer.date !== actual today) but yesterdayPrayer is still in the future (Extras edge case: Midnight at 23:23 is still upcoming after Duha at 9am).

**Fix:** Added advanced schedule handling with yesterdayPrayer fallback:
```typescript
if (todayPrayer.date !== today) {
  // For next prayer, check if yesterday's prayer is still upcoming
  const isNextPrayer = index === schedule.nextIndex;
  if (isNextPrayer) {
    const yesterdayTimeLeft = secondsRemainingUntil(yesterdayPrayer.time, yesterdayPrayer.date);
    if (yesterdayTimeLeft > 0) {
      return { timeLeft: yesterdayTimeLeft, name: yesterdayPrayer.english };
    }
  }
  // Otherwise use today's prayer (chronologically tomorrow)
  const timeLeft = secondsRemainingUntil(todayPrayer.time, todayPrayer.date);
  return { timeLeft, name: todayPrayer.english };
}
```

**Core Principle Learned:**
> Schedule advancement changes the meaning of "today" in the data layer (todayPrayer.date becomes tomorrow), so ALL time-based checks in the UI layer must verify the date matches the actual current day before making time comparisons.

**Files Modified:**
- `stores/sync.ts` (Bug 1)
- `components/ActiveBackground.tsx` (Bug 2)
- `hooks/usePrayer.ts` (Bug 3)
- `shared/time.ts` (Bug 4)
