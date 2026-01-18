# Feature: Timing System Overhaul

**Status:** Ready for Implementation
**Created:** 2026-01-18
**Reviewed:** Architect
**ADR:** ai/adr/005-timing-system-overhaul.md
**Schema:** mocks/timing-system-schema.ts (data structures, examples, edge cases)
**QA Review:** APPROVED (Grade A) - 2026-01-18

---

## Overview

Replace the date-centric timing system (`yesterday`/`today`/`tomorrow` with `nextIndex`) with a prayer-centric model (single sorted array with derived state). This eliminates the "yesterday fallback hack" and semantic confusion where `schedule.today` can contain tomorrow's data.

---

## Core Principles

1. **No Fallbacks** - If data is missing, throw error (don't approximate)
2. **Derived State** - `nextPrayer`, `isPassed`, `countdown` computed from sequence
3. **Single List** - Prayers sorted by datetime, no yesterday/today/tomorrow split
4. **Backward Compatible** - Run old and new models in parallel during migration

---

## Key Clarifications (Addressing QA Gaps)

### belongsToDate - Islamic Day Assignment

The `belongsToDate` field represents which Islamic calendar day a prayer belongs to, following ADR-004:

- **Standard schedule**: Day starts after Isha passes. Fajr at 05:30 on Jan 18 belongs to Jan 18.
- **Extras schedule**: Day starts after Duha/Istijaba passes. Midnight at 23:00 on Jan 17 belongs to Jan **18** (the Islamic day starting after Duha).

This is NOT the system calendar date - it's the prayer-based day per ADR-004.

### displayDate Derivation for Multi-Day Sequences

When the sequence contains prayers spanning multiple calendar dates:

```typescript
// The displayDate is the belongsToDate of the FIRST UNPASSED prayer
const displayDate = useMemo(() => {
  const nextPrayer = prayers.find(p => p.datetime > now);
  return nextPrayer?.belongsToDate ?? prayers[prayers.length - 1].belongsToDate;
}, [prayers, now]);
```

This ensures the UI shows the Islamic day we're "in" - not the system date.

### DST / Timezone Handling

All `datetime` values use **local device timezone** via JavaScript Date:

```typescript
// createPrayerDatetime always creates local time
const createPrayerDatetime = (date: string, time: string): Date => {
  // "2026-01-18" + "06:12" → local timezone Date
  return new Date(`${date}T${time}:00`);
};
```

**DST edge case**: When DST transitions, the device's local time handles it. Prayers are fetched by API with correct times for that date. No additional DST logic needed.

### MMKV Storage - Date Serialization

JavaScript `Date` objects cannot be stored directly in MMKV. Strategy:

- **Store**: Convert `datetime` to ISO string before MMKV write
- **Load**: Parse ISO string back to Date on read
- **Cache key**: Keep existing `prayer_YYYY-MM-DD` format (unchanged)

The `Prayer` interface's `datetime` is a runtime Date object; storage uses ISO strings.

### Parallel Model Divergence Detection

During migration, both models run simultaneously. Divergence detection:

```typescript
// In debug/dev mode, compare old vs new
if (__DEV__) {
  const oldCountdown = calculateCountdown(oldSchedule, nextIndex);
  const newCountdown = nextPrayer.datetime.getTime() - Date.now();
  if (Math.abs(oldCountdown.timeLeft - newCountdown / 1000) > 2) {
    console.warn('MODEL DIVERGENCE', { old: oldCountdown, new: newCountdown });
  }
}
```

This ensures the new model produces identical results before removing the old one.

### Empty Sequence Edge Case

If `prayers.find(p => p.datetime > now)` returns undefined (all prayers passed):

1. Call `refreshSequence()` to fetch more days
2. If still empty after fetch, show "Loading..." state
3. Never show stale/wrong data

---

## Tasks

### Phase 1: Foundation - Types and Utilities

#### Task 1.1: Add Prayer Interface to shared/types.ts
- [ ] Add `Prayer` interface with fields: `id`, `type`, `english`, `arabic`, `datetime`, `time`, `belongsToDate`
- [ ] Add `PrayerSequence` interface with fields: `type`, `prayers` (array)
- [ ] Keep existing types unchanged (parallel implementation)
- **File:** `shared/types.ts`
- **Dependencies:** None

#### Task 1.2: Add datetime utilities to shared/time.ts
- [ ] Add `createPrayerDatetime(date: string, time: string): Date` - combines date and time into full Date object
- [ ] Add `isPrayerInFuture(prayer: Prayer): boolean` - simple `prayer.datetime > now` check
- [ ] Add `getSecondsBetween(from: Date, to: Date): number` - simple difference calculation
- **File:** `shared/time.ts`
- **Dependencies:** Task 1.1

#### Task 1.3: Add generatePrayerId() utility to shared/prayer.ts
- [ ] Add `generatePrayerId(type: ScheduleType, english: string, date: string): string`
- [ ] Format: `"standard_fajr_2026-01-18"`
- **File:** `shared/prayer.ts`
- **Dependencies:** None

#### Task 1.4: Add createPrayer() factory function to shared/prayer.ts
- [ ] Add `createPrayer(params: { type, english, arabic, date, time }): Prayer`
- [ ] Generates id using generatePrayerId()
- [ ] Creates datetime using createPrayerDatetime()
- [ ] Sets belongsToDate from date param
- **File:** `shared/prayer.ts`
- **Dependencies:** Tasks 1.1, 1.2, 1.3

#### Task 1.5: Add createPrayerSequence() function to shared/prayer.ts
- [ ] Add `createPrayerSequence(type: ScheduleType, startDate: Date, dayCount: number): PrayerSequence`
- [ ] Creates prayers for `dayCount` days starting from `startDate`
- [ ] Uses existing `Database.getPrayerByDate()` for raw data
- [ ] Uses existing `createSchedule()` internally for each day
- [ ] Sorts prayers by datetime
- [ ] Returns `{ type, prayers: [...] }`
- **File:** `shared/prayer.ts`
- **Dependencies:** Task 1.4

#### Task 1.6: Add MMKV serialization utilities to shared/storage.ts
- [ ] Add `serializePrayer(prayer: Prayer): StoredPrayer` - converts Date to ISO string
- [ ] Add `deserializePrayer(stored: StoredPrayer): Prayer` - parses ISO string to Date
- [ ] Add `serializeSequence(seq: PrayerSequence): StoredSequence`
- [ ] Add `deserializeSequence(stored: StoredSequence): PrayerSequence`
- [ ] Type: `StoredPrayer` has `datetime: string` instead of `Date`
- **File:** `shared/storage.ts` (new or add to existing)
- **Dependencies:** Task 1.1

#### Task 1.7: Add belongsToDate calculation to shared/prayer.ts
- [ ] Add `calculateBelongsToDate(type: ScheduleType, prayerIndex: number, calendarDate: string): string`
- [ ] Standard: Prayers 0-5 belong to same calendar date
- [ ] Extras: Midnight/LastThird/Suhoor belong to NEXT day (after Duha)
- [ ] Friday Extras: Midnight through Duha belong to NEXT day (after Istijaba)
- [ ] Uses ADR-004 rules for Islamic day boundaries
- **File:** `shared/prayer.ts`
- **Dependencies:** None

---

### Phase 2: State Layer - Parallel Atoms

#### Task 2.1: Add sequence atoms to stores/schedule.ts
- [ ] Add `standardSequenceAtom = atom<PrayerSequence | null>(null)`
- [ ] Add `extraSequenceAtom = atom<PrayerSequence | null>(null)`
- [ ] Add `getSequenceAtom(type: ScheduleType)` helper
- [ ] Keep existing schedule atoms unchanged
- **File:** `stores/schedule.ts`
- **Dependencies:** Task 1.1

#### Task 2.2: Add setSequence() action to stores/schedule.ts
- [ ] Add `setSequence(type: ScheduleType, date: Date): void`
- [ ] Creates sequence using `createPrayerSequence(type, date, 3)` (3 days buffer)
- [ ] Sets the sequence atom
- [ ] Does NOT modify existing `setSchedule()` - parallel implementation
- **File:** `stores/schedule.ts`
- **Dependencies:** Tasks 1.5, 2.1

#### Task 2.3: Add derived selector atoms to stores/schedule.ts
- [ ] Add `nextPrayerAtom(type)` - derived: `prayers.find(p => p.datetime > now)`
- [ ] Add `prevPrayerAtom(type)` - derived: prayer before nextPrayer in array
- [ ] Add `displayDateAtom(type)` - derived: `nextPrayer.belongsToDate`
- [ ] Use `atom((get) => ...)` pattern for derived atoms
- **File:** `stores/schedule.ts`
- **Dependencies:** Task 2.1

#### Task 2.4: Add refreshSequence() action to stores/schedule.ts
- [ ] Add `refreshSequence(type: ScheduleType): void`
- [ ] Filters out passed prayers from sequence
- [ ] Fetches more days if sequence is running low (<24 hours of prayers)
- [ ] Called by timer when prayer passes
- **File:** `stores/schedule.ts`
- **Dependencies:** Tasks 2.1, 2.2

#### Task 2.5: Add getNextPrayer() and getPrevPrayer() exports to stores/schedule.ts
- [ ] Add `getNextPrayer(type: ScheduleType): Prayer | null`
- [ ] Add `getPrevPrayer(type: ScheduleType): Prayer | null`
- [ ] Uses store.get() with derived atoms
- **File:** `stores/schedule.ts`
- **Dependencies:** Task 2.3

---

### Phase 3: Hooks Layer - New Interface

#### Task 3.1: Create useNextPrayer() hook
- [ ] Create new file: `hooks/useNextPrayer.ts`
- [ ] Returns `{ prayer, secondsRemaining, isPassed: false }` using sequence atoms
- [ ] Accepts `type: ScheduleType` parameter
- [ ] Uses derived atoms from Phase 2
- **File:** `hooks/useNextPrayer.ts` (new)
- **Dependencies:** Tasks 2.3, 2.5

#### Task 3.2: Create usePrayerSequence() hook
- [ ] Create new file: `hooks/usePrayerSequence.ts`
- [ ] Returns full sequence for rendering prayer list
- [ ] Accepts `type: ScheduleType` parameter
- [ ] Returns `{ prayers, displayDate, nextPrayerIndex }`
- **File:** `hooks/usePrayerSequence.ts` (new)
- **Dependencies:** Tasks 2.1, 2.3

#### Task 3.3: Add derived isPassed to usePrayerSequence()
- [ ] For each prayer in list, derive isPassed: `prayer.datetime < now`
- [ ] Simple boolean, no date string comparison needed
- [ ] No more date === today checks
- **File:** `hooks/usePrayerSequence.ts`
- **Dependencies:** Task 3.2

#### Task 3.4: Create useCountdown() hook
- [ ] Create new file: `hooks/useCountdown.ts`
- [ ] Returns `{ timeLeft: number, prayerName: string }`
- [ ] Uses `nextPrayer.datetime - now` calculation
- [ ] Updates every second via useEffect interval
- **File:** `hooks/useCountdown.ts` (new)
- **Dependencies:** Task 3.1

#### Task 3.5: Create useProgressBar() hook
- [ ] Create new file: `hooks/useProgressBar.ts`
- [ ] Returns `{ progress: number }` (0-100)
- [ ] Uses prevPrayer and nextPrayer from sequence
- [ ] Simple: `(now - prev.datetime) / (next.datetime - prev.datetime) * 100`
- [ ] No special "first prayer" or "yesterday" logic needed
- **File:** `hooks/useProgressBar.ts` (new)
- **Dependencies:** Tasks 3.1, 2.5

---

### Phase 4: Sync Layer - Initialize Sequences

#### Task 4.1: Update initializeAppState() to set sequences
- [ ] After existing `setSchedule()` calls, add `setSequence()` calls
- [ ] Both Standard and Extra sequences initialized
- [ ] Parallel to existing initialization - don't remove old code yet
- **File:** `stores/sync.ts`
- **Dependencies:** Task 2.2

#### Task 4.2: Remove schedule advancement checks from initializeAppState()
- [ ] The sequence model doesn't need advancement on init
- [ ] nextPrayer is always derived from current time
- [ ] Comment out (don't delete) the advanceScheduleToTomorrow calls
- **File:** `stores/sync.ts`
- **Dependencies:** Task 4.1
- **Note:** Only after Phase 5 UI migration is complete

#### Task 4.3: Add sequence refresh to timer tick
- [ ] In timer interval, check if nextPrayer has passed
- [ ] If passed, call `refreshSequence(type)`
- [ ] No more `incrementNextIndex()` or `advanceScheduleToTomorrow()`
- **File:** `stores/timer.ts`
- **Dependencies:** Task 2.4
- **Note:** Add alongside existing logic, don't replace yet

#### Task 4.4: Add divergence detection for parallel models
- [ ] Create `validateModelParity(type: ScheduleType): boolean` function
- [ ] Compare old model countdown vs new model countdown
- [ ] Compare old model nextIndex vs new model nextPrayer
- [ ] Log warnings in __DEV__ mode if divergence > 2 seconds
- [ ] Run validation on every timer tick during migration
- **File:** `stores/timer.ts` or `stores/debug.ts` (new)
- **Dependencies:** Tasks 2.5, 4.1
- **Critical:** Must pass validation before Phase 7 cleanup

#### Task 4.5: Handle empty sequence edge case
- [ ] In `getNextPrayer()`, if no future prayer found, trigger refresh
- [ ] If refresh fails or returns empty, return special "loading" state
- [ ] Components handle loading state gracefully (show spinner, not crash)
- [ ] Add retry logic with exponential backoff
- **File:** `stores/schedule.ts`
- **Dependencies:** Task 2.4

---

### Phase 5: UI Migration - Component Updates

#### Task 5.1: Update Timer.tsx to use new hooks
- [ ] Import `useCountdown()` hook
- [ ] Replace `useAtomValue(timerAtom)` with `useCountdown(type)`
- [ ] Timer now shows countdown from sequence-derived nextPrayer
- [ ] Verify display is identical to before
- **File:** `components/Timer.tsx`
- **Dependencies:** Task 3.4

#### Task 5.2: Update ProgressBar.tsx to use new hook
- [ ] Import `useProgressBar()` hook
- [ ] Replace `useMemo()` progress calculation with `useProgressBar(type)`
- [ ] Remove all `schedule.yesterday`, `schedule.today`, `schedule.nextIndex` usage
- [ ] Greatly simplified component
- **File:** `components/ProgressBar.tsx`
- **Dependencies:** Task 3.5

#### Task 5.3: Update Prayer.tsx to use derived isPassed
- [ ] Update `usePrayer()` to derive isPassed from sequence
- [ ] `isPassed = prayer.datetime < now` - simple comparison
- [ ] Remove date string comparison: `todayPrayer.date === today`
- **File:** `components/Prayer.tsx`
- **Dependencies:** Task 3.3

#### Task 5.4: Update usePrayer.ts hook
- [ ] Modify to get prayer from sequence instead of schedule
- [ ] `isPassed = prayer.datetime < now`
- [ ] `isNext = prayer.id === nextPrayer.id`
- [ ] Keep same return shape for backward compatibility
- **File:** `hooks/usePrayer.ts`
- **Dependencies:** Tasks 3.1, 3.2

#### Task 5.5: Update Day.tsx to use derived displayDate
- [ ] Import derived displayDateAtom from schedule store
- [ ] Replace `getDateAtom(type)` usage with new derived atom
- [ ] Display date now automatically follows current prayer
- **File:** `components/Day.tsx`
- **Dependencies:** Task 2.3

#### Task 5.6: Update ActiveBackground.tsx
- [ ] Get nextPrayerIndex from sequence (index in today's prayers)
- [ ] `yPosition = nextPrayerIndex * STYLES.prayer.height`
- [ ] No change to animation logic
- **File:** `components/ActiveBackground.tsx`
- **Dependencies:** Task 3.2

#### Task 5.7: Update useSchedule.ts hook
- [ ] Add option to use sequence model: `useSchedule(type, { useSequence: true })`
- [ ] Returns sequence-based data when flag is true
- [ ] Returns old model when flag is false (default)
- [ ] Gradual migration support
- **File:** `hooks/useSchedule.ts`
- **Dependencies:** Task 3.2

#### Task 5.8: Update List.tsx for sequence-based rendering
- [ ] Use `usePrayerSequence()` to get prayers for today
- [ ] Filter sequence to only show prayers for displayDate
- [ ] Map over prayers instead of using `Array.from({ length })`
- **File:** `components/List.tsx`
- **Dependencies:** Task 3.2

#### Task 5.9: Update Overlay.tsx
- [ ] Review overlay timer usage
- [ ] Update to use sequence-based countdown if applicable
- [ ] Verify overlay displays correct prayer info
- **File:** `components/Overlay.tsx`
- **Dependencies:** Task 3.1

#### Task 5.10: Update stores/overlay.ts
- [ ] Review `canShowOverlay()` function
- [ ] Update to use sequence-based time check if needed
- [ ] Verify overlay toggle logic still works
- **File:** `stores/overlay.ts`
- **Dependencies:** Task 2.5

---

### Phase 6: Timer System Updates

#### Task 6.1: Create new timer approach in stores/timer.ts
- [ ] Add `startSequenceTimer(type: ScheduleType)` function
- [ ] Uses `getNextPrayer(type)` to get countdown target
- [ ] Interval updates `timerAtom` from `nextPrayer.datetime - now`
- [ ] Calls `refreshSequence()` when prayer passes (countdown <= 0)
- **File:** `stores/timer.ts`
- **Dependencies:** Tasks 2.5, 2.4

#### Task 6.2: Simplify calculateCountdown() in shared/time.ts
- [ ] Add `calculateCountdownFromPrayer(prayer: Prayer): number`
- [ ] Simple: `prayer.datetime.getTime() - Date.now() / 1000`
- [ ] No more schedule parameter, no yesterday fallback
- [ ] Keep old `calculateCountdown()` for backward compatibility
- **File:** `shared/time.ts`
- **Dependencies:** Task 1.1

#### Task 6.3: Update startTimers() to use new approach
- [ ] Replace `startTimerSchedule()` calls with `startSequenceTimer()`
- [ ] Both Standard and Extra timers use sequence model
- [ ] Remove `incrementNextIndex()` and `advanceScheduleToTomorrow()` calls
- **File:** `stores/timer.ts`
- **Dependencies:** Tasks 6.1, 4.2

#### Task 6.4: Remove overlay timer special handling
- [ ] Overlay timer can use same sequence-based approach
- [ ] `startTimerOverlay()` gets selected prayer from sequence by id
- [ ] Simplify overlay timer code
- **File:** `stores/timer.ts`
- **Dependencies:** Task 6.1

---

### Phase 7: Cleanup - Remove Old Model

#### Task 7.1: Remove ScheduleStore interface and atoms
- [ ] Remove `yesterday`, `today`, `tomorrow`, `nextIndex` from ScheduleStore
- [ ] Remove `standardScheduleAtom`, `extraScheduleAtom`
- [ ] Remove `createInitialSchedule()`, `buildDailySchedules()`
- **File:** `stores/schedule.ts`
- **Dependencies:** All Phase 5 tasks complete

#### Task 7.2: Remove old setSchedule() and related functions
- [ ] Remove `setSchedule()`, `getSchedule()`
- [ ] Remove `incrementNextIndex()`
- [ ] Remove `advanceScheduleToTomorrow()`
- **File:** `stores/schedule.ts`
- **Dependencies:** Task 7.1

#### Task 7.3: Remove old calculateCountdown() with schedule param
- [ ] Remove `calculateCountdown(schedule, index)` function
- [ ] Keep new `calculateCountdownFromPrayer()` function
- [ ] Remove yesterday fallback code
- **File:** `shared/time.ts`
- **Dependencies:** All Phase 5 tasks complete

#### Task 7.4: Remove date atoms from stores/sync.ts
- [ ] Remove `standardDateAtom`, `extraDateAtom`
- [ ] Remove `getDateAtom()`, `setScheduleDate()`
- [ ] Date is now derived from sequence
- **File:** `stores/sync.ts`
- **Dependencies:** Task 5.5

#### Task 7.5: Clean up shared/types.ts
- [ ] Remove old `ScheduleStore` interface (or rename to `LegacyScheduleStore`)
- [ ] Remove `IScheduleNow` if no longer needed
- [ ] Ensure `Prayer` and `PrayerSequence` are the primary types
- **File:** `shared/types.ts`
- **Dependencies:** Task 7.1

#### Task 7.6: Update stores/notifications.ts for new model
- [ ] Review notification scheduling logic
- [ ] Update to use `Prayer.datetime` instead of date + time strings
- [ ] Simplify `isPrayerTimeInFuture()` checks
- [ ] Update `rescheduleNotifications()` to use sequence model
- [ ] Ensure notification trigger time = `prayer.datetime.getTime()`
- **File:** `stores/notifications.ts`
- **Dependencies:** Task 7.5

#### Task 7.7: Update shared/notifications.ts
- [ ] Update `genNextXDays()` if needed
- [ ] Update `isPrayerTimeInFuture()` to use datetime: `prayer.datetime > now`
- [ ] Verify notification utilities work with new model
- [ ] Update `buildNotification()` to accept Prayer object
- **File:** `shared/notifications.ts`
- **Dependencies:** Task 7.6

#### Task 7.8: Validate notifications with new model
- [ ] Schedule a notification using new Prayer.datetime
- [ ] Verify notification fires at correct time
- [ ] Test notification rescheduling after prayer passes
- [ ] Test notification cancellation works correctly
- [ ] Ensure no duplicate notifications during parallel model phase
- **File:** Manual validation
- **Dependencies:** Tasks 7.6, 7.7
- **Critical:** Must verify before removing old model

#### Task 7.9: Final stores/sync.ts cleanup
- [ ] Remove commented-out code from Phase 4
- [ ] Remove any remaining references to old model
- [ ] Verify sync flow uses only sequence model
- **File:** `stores/sync.ts`
- **Dependencies:** All Phase 7 tasks

---

### Phase 8: Testing and Documentation

#### Task 8.1: Manual test - Standard schedule day transition
- [ ] Wait for Isha to pass (or mock time in mocks/simple.ts)
- [ ] Verify timer shows tomorrow's Fajr countdown
- [ ] Verify date display updates to tomorrow
- [ ] Verify isPassed styling correct
- **Dependencies:** All implementation complete

#### Task 8.2: Manual test - Extras schedule day transition
- [ ] Wait for Duha to pass (or mock time)
- [ ] Verify timer shows Midnight countdown (same day!)
- [ ] Verify date display updates correctly
- [ ] No "yesterday fallback" behavior
- **Dependencies:** All implementation complete

#### Task 8.3: Manual test - Progress bar accuracy
- [ ] Check progress bar at various times
- [ ] Verify progress is accurate with new calculation
- [ ] No special handling for first prayer needed
- **Dependencies:** All implementation complete

#### Task 8.4: Manual test - Both schedules different dates
- [ ] After Isha but before midnight
- [ ] Standard shows tomorrow, Extras shows today
- [ ] Both timers accurate
- **Dependencies:** All implementation complete

#### Task 8.5: Manual test - App resume scenarios
- [ ] Close app, wait for prayer to pass, reopen
- [ ] Verify schedule refreshes correctly
- [ ] No stale data displayed
- **Dependencies:** All implementation complete

#### Task 8.6: Manual test - January 1st edge case
- [ ] Mock date to Jan 1
- [ ] Verify Dec 31 prayers in sequence
- [ ] Progress bar works correctly
- **Dependencies:** All implementation complete

#### Task 8.7: Manual test - DST transition edge case
- [ ] Mock date to DST transition day (March/November depending on locale)
- [ ] Verify prayer times display correctly
- [ ] Verify countdown handles the time shift
- [ ] Verify no duplicate or missing prayers
- **Dependencies:** All implementation complete

#### Task 8.8: Manual test - Divergence validation passed
- [ ] Run app with parallel models for 24+ hours
- [ ] Verify no __DEV__ divergence warnings logged
- [ ] Verify old and new models produce identical countdowns
- [ ] Sign-off: Safe to remove old model
- **Dependencies:** Task 4.4

#### Task 8.9: Manual test - Notification timing
- [ ] Schedule notifications for next prayer
- [ ] Verify notification fires at exactly prayer.datetime
- [ ] Verify notification content is correct
- **Dependencies:** Task 7.8

#### Task 8.10: Update README.md documentation
- [ ] Document new timing system
- [ ] Update data flow diagram
- [ ] Update timer system documentation
- **File:** `README.md`
- **Dependencies:** All tests pass

#### Task 8.11: Update AGENTS.md memory section
- [ ] Add memory entry for timing system overhaul
- [ ] Document lessons learned
- [ ] Reference ADR-005
- **File:** `ai/AGENTS.md`
- **Dependencies:** Task 8.10

#### Task 8.12: Update ADR-005 status to Accepted
- [ ] Change status from "Proposed" to "Accepted"
- [ ] Add implementation notes
- [ ] Document any deviations from original plan
- **File:** `ai/adr/005-timing-system-overhaul.md`
- **Dependencies:** All tests pass

---

## Files Modified

| File | Phase | Changes |
|------|-------|---------|
| `shared/types.ts` | 1 | Add Prayer, PrayerSequence, StoredPrayer interfaces |
| `shared/time.ts` | 1, 6 | Add datetime utilities, simplify countdown |
| `shared/prayer.ts` | 1 | Add createPrayer, createPrayerSequence, belongsToDate |
| `shared/storage.ts` | 1 | NEW: MMKV serialization for Date objects |
| `stores/schedule.ts` | 2, 7 | Add sequence atoms, remove old model |
| `stores/sync.ts` | 4, 7 | Initialize sequences, remove old init |
| `stores/timer.ts` | 4, 6 | Sequence-based timer, divergence detection |
| `stores/debug.ts` | 4 | NEW (optional): Divergence validation utilities |
| `hooks/useNextPrayer.ts` | 3 | NEW: Next prayer hook |
| `hooks/usePrayerSequence.ts` | 3 | NEW: Sequence hook |
| `hooks/useCountdown.ts` | 3 | NEW: Countdown hook |
| `hooks/useProgressBar.ts` | 3 | NEW: Progress hook |
| `hooks/usePrayer.ts` | 5 | Use sequence-based isPassed |
| `hooks/useSchedule.ts` | 5 | Add sequence mode option |
| `components/Timer.tsx` | 5 | Use useCountdown hook |
| `components/ProgressBar.tsx` | 5 | Use useProgressBar hook |
| `components/Prayer.tsx` | 5 | Use derived isPassed |
| `components/Day.tsx` | 5 | Use derived displayDate |
| `components/ActiveBackground.tsx` | 5 | Use sequence-based index |
| `components/List.tsx` | 5 | Sequence-based rendering |
| `stores/overlay.ts` | 5 | Update canShowOverlay |
| `stores/notifications.ts` | 7 | Use Prayer.datetime |
| `shared/notifications.ts` | 7 | Update time utilities |
| `README.md` | 8 | Documentation updates |
| `ai/AGENTS.md` | 8 | Memory entry |
| `ai/adr/005-timing-system-overhaul.md` | 8 | Status update |

---

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Parallel implementation | Yes | Safer migration, can compare old vs new |
| Sequence buffer size | 3 days | Matches notification rolling window |
| Prayer ID format | `type_name_date` | Unique, readable, sortable |
| datetime storage | JavaScript Date | Native comparison, no parsing |
| Derived atoms | Jotai `atom()` | Automatic updates, no sync needed |
| Hook-based interface | New hooks | Clean API, composable |
| Cleanup phase last | Yes | Only after all UI migrated |

---

## Risk Mitigations

1. **Parallel atoms** - Run old and new models simultaneously during migration
2. **Same return shapes** - Hooks return compatible data structures
3. **Feature flag** - Can toggle between models via `useSequence: true`
4. **Incremental UI migration** - Update one component at a time
5. **Manual testing** - Verify each phase before proceeding

---

## Rollback Strategy

### During Migration (Phases 1-6)

If issues discovered during parallel model phase:

1. **Immediate rollback**: Remove `useSequence: true` flags from components
2. **Components revert** to using old model automatically
3. **No data loss**: Old atoms still populated and functioning
4. **Investigation**: Use divergence logs to identify the discrepancy

### After Cleanup (Phase 7)

If issues discovered after old model removed:

1. **Git revert**: Revert Phase 7 commits to restore old model
2. **Data intact**: MMKV prayer data format unchanged, still compatible
3. **Sequence atoms**: Can coexist with restored old atoms

### Critical Checkpoints

| Checkpoint | Criteria | Rollback Action |
|------------|----------|-----------------|
| After Phase 4 | Divergence validation passes | Remove new atoms, keep old |
| After Phase 5 | All components work with new hooks | Remove new hooks, revert components |
| After Phase 6 | Timer system stable | Revert timer changes |
| After Phase 7 | 24hr soak test passes | Git revert Phase 7 |

### No-Rollback Point

Phase 7 cleanup is the point of no return. Before starting Phase 7:
- [ ] Divergence validation passed (Task 8.8)
- [ ] All manual tests passed (Tasks 8.1-8.9)
- [ ] Notification validation passed (Task 7.8)

---

## Notes

**Key Behavior Changes:**
- OLD: `schedule.today` can contain tomorrow's data after advancement
- NEW: `nextPrayer` always means the next prayer chronologically

- OLD: `calculateCountdown()` needs yesterday fallback for Extras
- NEW: `nextPrayer.datetime - now` is always correct

- OLD: Manual `nextIndex` increment and `advanceScheduleToTomorrow()`
- NEW: Derived from current time, automatic

**What Gets Removed:**
- `advanceScheduleToTomorrow()` function
- `incrementNextIndex()` function
- `yesterday/today/tomorrow` schedule structure
- `standardDateAtom`, `extraDateAtom` (derived instead)
- Yesterday fallback in `calculateCountdown()`
- Date string comparisons for isPassed

**What Gets Simplified:**
- ProgressBar: `progress = (now - prev.datetime) / (next.datetime - prev.datetime)`
- isPassed: `prayer.datetime < now`
- countdown: `nextPrayer.datetime - now`
- displayDate: `nextPrayer.belongsToDate`
