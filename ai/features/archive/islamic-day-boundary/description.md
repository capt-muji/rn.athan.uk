# Feature: Islamic Day Boundary

**Status:** Approved
**Author:** muji
**Date:** 2026-01-16
**Specialist:** Architect
**Reviewed by:** RepoMapper, ReviewerQA

---

## Overview

Change the day boundary from English midnight (00:00) to prayer-based boundaries. Each schedule resets after its final prayer passes, immediately showing tomorrow's date and schedule. Timer/countdown/progressbar always display continuously - no "All prayers finished" state ever.

## Goals

- [ ] Remove "All prayers finished" state permanently
- [ ] Standard schedule resets after Isha passes → shows tomorrow's date + Fajr countdown
- [ ] Extras schedule resets after Duha/Istijaba passes → shows tomorrow's date + Last Third countdown
- [ ] Each schedule displays its own date independently
- [ ] Timer always shows countdown to next prayer (continuous, never hidden)
- [ ] ProgressBar always visible and animating

## Non-Goals

- Not implementing traditional Islamic day (starting at Maghrib)
- Not syncing both schedules to same date
- Not changing notification logic (uses prayer times, not display date)

## User Stories

### Story 1: Continuous Countdown
**As a** user
**I want** to always see a countdown to the next prayer
**So that** I never see a "waiting" or "finished" state

**Acceptance Criteria:**
- [ ] After Isha passes, timer shows "Fajr in Xh Xm" (tomorrow's Fajr)
- [ ] After Duha/Istijaba passes, timer shows "Last Third in Xh Xm"
- [ ] ProgressBar continues animating to next prayer
- [ ] No "All prayers finished" message ever displays

### Story 2: Immediate Schedule Transition
**As a** user
**I want** the date and prayer list to update immediately after the last prayer
**So that** I see tomorrow's schedule without waiting for midnight

**Acceptance Criteria:**
- [ ] After Isha passes, Standard tab shows tomorrow's date immediately
- [ ] After Duha/Istijaba passes, Extras tab shows tomorrow's date immediately
- [ ] Prayer list shows tomorrow's times (fresh, no checkmarks)
- [ ] Cascade animations trigger on schedule transition

---

## Technical Design

### Architecture Decision

**Day Boundary:** After final prayer of each schedule (not midnight)
- Standard: After Isha → advance to tomorrow
- Extras: After Duha (or Istijaba on Friday) → advance to tomorrow

**This supersedes ADR-002** (English Midnight Day Boundary)

### Data Flow

```
Last prayer timer reaches 0
→ clearTimer(timerKey)
→ incrementNextIndex(type) → wraps to 0
→ advanceScheduleToTomorrow(type) [ASYNC with error handling]
  → Close overlay if open (prevent stale state)
  → Fetch day-after-tomorrow data (with retry on failure)
  → Shift tomorrow → today atomically (only after fetch succeeds)
  → Update schedule-specific date atom
  → Recalculate timer name/timeLeft
→ startTimerSchedule(type) continues with new schedule
```

### Components Affected

#### CRITICAL - Core Logic (3 files)

| Component | Change Type | Description |
|-----------|-------------|-------------|
| `stores/sync.ts` | Modified | Split `dateAtom` into `standardDateAtom` + `extraDateAtom`. Add `getDateAtom(type)`, `setScheduleDate(type, date)` |
| `stores/schedule.ts` | Modified | Add `advanceScheduleToTomorrow(type)` with async error handling, atomic shift, retry logic |
| `stores/timer.ts` | Modified | Replace `startTimerMidnight()` call with `advanceScheduleToTomorrow()`. Recalculate timer after advancement |

#### MEDIUM - Display/Animation (7 files)

| Component | Change Type | Description |
|-----------|-------------|-------------|
| `components/Timer.tsx` | Modified | Remove "All prayers finished" conditional entirely |
| `components/Day.tsx` | Modified | Use schedule-specific date atom via `getDateAtom(type)` |
| `components/ActiveBackground.tsx` | Modified | Use schedule-specific date atom, update hide logic |
| `components/Alert.tsx` | Modified | Use schedule-specific date atom for cascade trigger |
| `components/Prayer.tsx` | Modified | Use schedule-specific date atom for cascade trigger |
| `components/PrayerTime.tsx` | Modified | Use schedule-specific date atom for cascade trigger |
| `components/List.tsx` | Modified | Subscribe to schedule-specific date atom |

#### LOW - State/Overlay (2 files)

| Component | Change Type | Description |
|-----------|-------------|-------------|
| `stores/overlay.ts` | Modified | Auto-close overlay during schedule advancement |
| `components/ProgressBar.tsx` | Verify | Verify continuous display after advancement (likely no changes) |

#### VERIFY - Notifications (2 files)

| Component | Change Type | Description |
|-----------|-------------|-------------|
| `shared/notifications.ts` | Verify | Ensure date handling unaffected |
| `stores/notifications.ts` | Verify | Ensure scheduling unaffected |

### State Changes

**New atoms:**
- `standardDateAtom` - date for Standard schedule
- `extraDateAtom` - date for Extras schedule

**Removed:**
- `dateAtom` (replaced by above)

**New functions:**
- `getDateAtom(type: ScheduleType)` - returns appropriate date atom
- `setScheduleDate(type: ScheduleType, date: string)` - updates schedule's date
- `advanceScheduleToTomorrow(type: ScheduleType)` - async schedule advancement

**Modified functions:**
- `setDate()` - sets both date atoms
- `startTimerSchedule()` - calls advanceScheduleToTomorrow on wrap
- `startTimers()` - always starts both schedule timers (no finished check)

---

## Critical Mitigations (from ReviewerQA)

### 1. Race Condition Prevention

**Problem:** Async fetch during advancement could fail/slow, leaving timer in bad state.

**Solution:**
```typescript
const advanceScheduleToTomorrow = async (type: ScheduleType): Promise<void> => {
  // 1. Close overlay first (prevent stale state)
  const overlay = store.get(overlayAtom);
  if (overlay.isOn && overlay.scheduleType === type) {
    store.set(overlayAtom, { ...overlay, isOn: false });
  }

  // 2. Fetch new data BEFORE shifting (atomic operation)
  const schedule = getSchedule(type);
  const tomorrowDate = schedule.tomorrow[0].date;
  const dayAfterTomorrow = addDays(new Date(tomorrowDate), 1);

  let newTomorrowData = Database.getPrayerByDate(dayAfterTomorrow);

  // 3. Retry on missing data
  if (!newTomorrowData) {
    logger.warn('advanceSchedule: Missing day-after-tomorrow, triggering sync');
    await sync();
    newTomorrowData = Database.getPrayerByDate(dayAfterTomorrow);

    if (!newTomorrowData) {
      logger.error('advanceSchedule: Still missing data after sync');
      return; // Keep current schedule, don't break app
    }
  }

  // 4. Only shift AFTER successful fetch
  const newTomorrow = PrayerUtils.createSchedule(newTomorrowData, type);
  store.set(scheduleAtom, {
    ...schedule,
    today: schedule.tomorrow,
    tomorrow: newTomorrow,
    nextIndex: 0,
  });

  // 5. Update date atom
  setScheduleDate(type, tomorrowDate);
};
```

### 2. Timer Name Recalculation

**Problem:** After advancement, timer might show old prayer name.

**Solution:** Recalculate timer immediately after advancement in `startTimerSchedule()`:
```typescript
if (nextIndex === 0) {
  await advanceScheduleToTomorrow(type);
  // Timer restarts with fresh schedule data automatically
}
return startTimerSchedule(type);
```

### 3. Cascade Animation Isolation

**Problem:** With split atoms, animations might trigger incorrectly.

**Solution:** Each component receives `type` prop and uses `getDateAtom(type)`:
```typescript
// In Prayer.tsx, Alert.tsx, PrayerTime.tsx
const dateAtom = getDateAtom(type);
const date = useAtomValue(dateAtom);

useEffect(() => {
  // Cascade only triggers when THIS schedule's date changes
}, [date]);
```

### 4. Overlay Auto-Close

**Problem:** Overlay open during advancement shows stale data.

**Solution:** Close overlay at start of `advanceScheduleToTomorrow()` (see mitigation #1).

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Isha at 22:00 (normal) | Timer shows "Fajr in 7h", date changes to tomorrow |
| Isha after midnight (00:30) | Timer counts down correctly; date advances when Isha passes |
| Last Third before midnight (23:45) | Works normally; Extras advances after Duha/Istijaba |
| App opened after all prayers passed | `initializeAppState()` → both schedules immediately advance |
| Different dates on tabs | Intentional - each schedule independent |
| Friday vs non-Friday | Istijaba excluded on non-Fridays; last prayer index adjusts |
| Year boundary (Dec 31 → Jan 2) | Sync triggered to fetch next year data if missing |
| Day-after-tomorrow data missing | Retry via sync(); if still missing, keep current schedule |
| Overlay open during advancement | Auto-closed to prevent stale state |
| Both schedules advance same second | Each advances independently, no race condition |

---

## Testing Plan

### Manual Tests
- [ ] Open app before Fajr → shows today's date, countdown to Fajr
- [ ] Wait for Isha to pass → Standard date changes to tomorrow, timer shows Fajr
- [ ] Check Extra tab after Duha → Extra date shows tomorrow, timer shows Last Third
- [ ] Verify Friday Istijaba triggers schedule advance
- [ ] Verify ProgressBar continues animating after advancement
- [ ] Verify cascade animations trigger once per schedule transition
- [ ] Test with overlay open during advancement → should auto-close

### Edge Case Tests
- [ ] Simulate summer schedule (late Isha ~23:00+)
- [ ] Simulate winter schedule (early Isha ~17:00)
- [ ] Open app at 2am when both schedules should have advanced
- [ ] Test year boundary (if possible to simulate)
- [ ] Test with missing day-after-tomorrow data

### Regression Tests
- [ ] Notifications still fire at correct times
- [ ] Alert preferences still work
- [ ] Sound selection still works

---

## Rollout Plan

### Phase 1: Foundation
- [ ] Split `dateAtom` into `standardDateAtom` and `extraDateAtom`
- [ ] Add `getDateAtom(type)` helper
- [ ] Add `setScheduleDate(type, date)` function
- [ ] Update `setDate()` to set both atoms

### Phase 2: Schedule Advancement
- [ ] Add `advanceScheduleToTomorrow(type)` in schedule.ts
- [ ] Include async error handling and retry logic
- [ ] Include overlay auto-close
- [ ] Include atomic shift (fetch before shift)

### Phase 3: Timer Integration
- [ ] Update `startTimerSchedule()` to call `advanceScheduleToTomorrow` on wrap
- [ ] Update `startTimers()` to always start both timers (remove finished check)
- [ ] Keep `startTimerMidnight()` for API data freshness only

### Phase 4: UI Updates
- [ ] Remove "All prayers finished" from Timer.tsx
- [ ] Update Day.tsx to use schedule-specific date atom
- [ ] Update ActiveBackground.tsx
- [ ] Update Alert.tsx cascade trigger
- [ ] Update Prayer.tsx cascade trigger
- [ ] Update PrayerTime.tsx cascade trigger
- [ ] Update List.tsx reactivity

### Phase 5: Verification
- [ ] Run `tsc --noEmit`
- [ ] Full manual test cycle
- [ ] Edge case testing

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Race condition during advancement | Medium | High | Async fence, fetch before shift |
| Missing day-after-tomorrow data | Low | Medium | Retry via sync(), graceful fallback |
| Cascade animations double-trigger | Medium | Low | Schedule-specific date atoms |
| Timer shows wrong prayer name | Medium | Medium | Recalculate after advancement |
| Overlay shows stale data | Low | Low | Auto-close during advancement |
| Date mismatch with phone clock | High | Low | Documented behavior, user accepted |

---

## Open Questions

- [x] When should Extras reset? → After its own final prayer (Duha/Istijaba)
- [x] What date to show after Isha? → Tomorrow's date immediately
- [x] What happens to prayer list? → Switch to tomorrow's schedule
- [x] Keep "All prayers finished"? → NO, remove permanently
- [x] Timer behavior after last prayer? → Shows countdown to next prayer continuously

---

## Approval

- [x] Architect: Approved design
- [x] RepoMapper: Verified all affected files
- [x] ReviewerQA: Audited for risks, mitigations added
- [ ] Implementer: Ready to build

---

## Related

- **Supersedes:** ADR-002 (English Midnight Day Boundary)
- **Create:** ADR-003 (Prayer-Based Day Boundary) after implementation
