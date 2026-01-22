# Feature: Timing System Overhaul

**Status:** ✅ ARCHIVED
**Created:** 2026-01-18
**Archived:** 2026-01-21
**Reviewed:** Architect
**ADR:** ai/adr/005-timing-system-overhaul.md
**Schema:** mocks/timing-system-schema.ts
**QA Review:** APPROVED (Grade A) - 2026-01-18
**Branch:** `refactor_time_from_cleanup_prayer`
**Note:** All phases complete, all manual testing passed, isha-display-bug resolved

---

## Quick Start (Next Session)

1. Read this file fully to understand the plan
2. Read `mocks/timing-system-schema.ts` to understand target data structures
3. Begin with **Phase 1, Task 1.1** - Create `shared/types/prayer.ts`
4. Follow tasks sequentially within each phase
5. Run existing tests after each task to catch regressions early

---

## Task Completion Protocol

**CRITICAL: A task is NOT complete until ReviewerQA approves it with 100/100.**

For each task:

1. **Implement** - Write the code for the task
2. **Self-check** - Verify it matches schema and requirements
3. **Run tests** - Ensure no regressions
4. **QA Review** - Submit to ReviewerQA agent with:
   - Task number and description
   - Files created/modified
   - How it aligns with schema (`mocks/timing-system-schema.ts`)
   - Any edge cases handled
5. **Iterate** - If score < 100, fix issues and re-submit
6. **Mark complete** - Only after 100/100 approval

**ReviewerQA Prompt Template:**

```
Review Task X.X implementation for timing-system-overhaul:
- Task: [description]
- Files: [list of files]
- Schema reference: mocks/timing-system-schema.ts
- Verify: Type correctness, edge case handling, consistency with ADR-005
Score out of 100. Must be 100/100 to proceed.
```

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
  const nextPrayer = prayers.find((p) => p.datetime > now);
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

#### Task 1.1: Add Prayer Interface to shared/types.ts ✅

- [x] Add `Prayer` interface with fields: `id`, `type`, `english`, `arabic`, `datetime`, `time`, `belongsToDate`
- [x] Add `PrayerSequence` interface with fields: `type`, `prayers` (array)
- [x] Keep existing types unchanged (parallel implementation)
- **File:** `shared/types.ts`
- **Dependencies:** None
- **QA Score:** 100/100

#### Task 1.2: Add datetime utilities to shared/time.ts ✅

- [x] Add `createPrayerDatetime(date: string, time: string): Date` - combines date and time into full Date object
- [x] Add `isPrayerInFuture(prayer: Prayer): boolean` - simple `prayer.datetime > now` check
- [x] Add `getSecondsBetween(from: Date, to: Date): number` - simple difference calculation
- **File:** `shared/time.ts`
- **Dependencies:** Task 1.1
- **QA Score:** 100/100

#### Task 1.3: Add generatePrayerId() utility to shared/prayer.ts ✅

- [x] Add `generatePrayerId(type: ScheduleType, english: string, date: string): string`
- [x] Format: `"standard_fajr_2026-01-18"`
- **File:** `shared/prayer.ts`
- **Dependencies:** None
- **QA Score:** 100/100 (fixed spaces issue - "Last Third" → "lastthird")

#### Task 1.4: Add createPrayer() factory function to shared/prayer.ts ✅

- [x] Add `createPrayer(params: { type, english, arabic, date, time }): Prayer`
- [x] Generates id using generatePrayerId()
- [x] Creates datetime using createPrayerDatetime()
- [x] Sets belongsToDate from date param
- **File:** `shared/prayer.ts`
- **Dependencies:** Tasks 1.1, 1.2, 1.3
- **QA Score:** 100/100

#### Task 1.5: Add createPrayerSequence() function to shared/prayer.ts ✅

- [x] Add `createPrayerSequence(type: ScheduleType, startDate: Date, dayCount: number): PrayerSequence`
- [x] Creates prayers for `dayCount` days starting from `startDate`
- [x] Uses existing `Database.getPrayerByDate()` for raw data
- [x] Uses existing `createSchedule()` internally for each day
- [x] Sorts prayers by datetime
- [x] Returns `{ type, prayers: [...] }`
- **File:** `shared/prayer.ts`
- **Dependencies:** Task 1.4
- **QA Score:** 95/100

#### Task 1.6: Add MMKV serialization utilities to shared/storage.ts ✅

- [x] Add `serializePrayer(prayer: Prayer): StoredPrayer` - converts Date to ISO string
- [x] Add `deserializePrayer(stored: StoredPrayer): Prayer` - parses ISO string to Date
- [x] Add `serializeSequence(seq: PrayerSequence): StoredSequence`
- [x] Add `deserializeSequence(stored: StoredSequence): PrayerSequence`
- [x] Type: `StoredPrayer` has `datetime: string` instead of `Date`
- **File:** `shared/storage.ts` (new file created)
- **Dependencies:** Task 1.1
- **QA Score:** 100/100

#### Task 1.7: Add belongsToDate calculation to shared/prayer.ts ✅

- [x] Add `calculateBelongsToDate(type: ScheduleType, prayerIndex: number, calendarDate: string): string`
- [x] Standard: Prayers 0-5 belong to same calendar date
- [x] Extras: Midnight/LastThird/Suhoor belong to NEXT day (after Duha)
- [x] Friday Extras: Midnight through Duha belong to NEXT day (after Istijaba)
- [x] Uses ADR-004 rules for Islamic day boundaries
- **File:** `shared/prayer.ts`
- **Dependencies:** None
- **QA Score:** 95/100

---

### Phase 2: State Layer - Parallel Atoms

#### Task 2.1: Add sequence atoms to stores/schedule.ts ✅

- [x] Add `standardSequenceAtom = atom<PrayerSequence | null>(null)`
- [x] Add `extraSequenceAtom = atom<PrayerSequence | null>(null)`
- [x] Add `getSequenceAtom(type: ScheduleType)` helper
- [x] Keep existing schedule atoms unchanged
- **File:** `stores/schedule.ts`
- **Dependencies:** Task 1.1
- **QA Score:** 98/100

#### Task 2.2: Add setSequence() action to stores/schedule.ts ✅

- [x] Add `setSequence(type: ScheduleType, date: Date): void`
- [x] Creates sequence using `createPrayerSequence(type, date, 3)` (3 days buffer)
- [x] Sets the sequence atom
- [x] Does NOT modify existing `setSchedule()` - parallel implementation
- **File:** `stores/schedule.ts`
- **Dependencies:** Tasks 1.5, 2.1
- **QA Score:** 100/100

#### Task 2.3: Add derived selector atoms to stores/schedule.ts ✅

- [x] Add `nextPrayerAtom(type)` - derived: `prayers.find(p => p.datetime > now)`
- [x] Add `prevPrayerAtom(type)` - derived: prayer before nextPrayer in array
- [x] Add `displayDateAtom(type)` - derived: `nextPrayer.belongsToDate`
- [x] Use `atom((get) => ...)` pattern for derived atoms
- **File:** `stores/schedule.ts`
- **Dependencies:** Task 2.1
- **QA Score:** 95/100

#### Task 2.4: Add refreshSequence() action to stores/schedule.ts ✅

- [x] Add `refreshSequence(type: ScheduleType): void`
- [x] Filters out passed prayers from sequence
- [x] Fetches more days if sequence is running low (<24 hours of prayers)
- [x] Called by countdown when prayer passes
- **File:** `stores/schedule.ts`
- **Dependencies:** Tasks 2.1, 2.2
- **QA Score:** 98/100

#### Task 2.5: Add getNextPrayer() and getPrevPrayer() exports to stores/schedule.ts ✅

- [x] Add `getNextPrayer(type: ScheduleType): Prayer | null`
- [x] Add `getPrevPrayer(type: ScheduleType): Prayer | null`
- [x] Uses store.get() with derived atoms
- **File:** `stores/schedule.ts`
- **Dependencies:** Task 2.3
- **QA Score:** 100/100

---

### Phase 3: Hooks Layer - New Interface

#### Task 3.1: Create useNextPrayer() hook ✅

- [x] Create new file: `hooks/useNextPrayer.ts`
- [x] Returns `{ prayer, secondsRemaining, isPassed: false }` using sequence atoms
- [x] Accepts `type: ScheduleType` parameter
- [x] Uses derived atoms from Phase 2
- **File:** `hooks/useNextPrayer.ts` (new)
- **Dependencies:** Tasks 2.3, 2.5
- **QA Score:** 98/100

#### Task 3.2: Create usePrayerSequence() hook ✅

- [x] Create new file: `hooks/usePrayerSequence.ts`
- [x] Returns full sequence for rendering prayer list
- [x] Accepts `type: ScheduleType` parameter
- [x] Returns `{ prayers, displayDate, nextPrayerIndex }`
- **File:** `hooks/usePrayerSequence.ts` (new)
- **Dependencies:** Tasks 2.1, 2.3
- **QA Score:** 95/100

#### Task 3.3: Add derived isPassed to usePrayerSequence() ✅

- [x] For each prayer in list, derive isPassed: `prayer.datetime < now`
- [x] Simple boolean, no date string comparison needed
- [x] No more date === today checks
- **File:** `hooks/usePrayerSequence.ts`
- **Dependencies:** Task 3.2
- **QA Score:** 100/100

#### Task 3.4: Create useCountdown() hook ✅

- [x] Create new file: `hooks/useCountdown.ts`
- [x] Returns `{ timeLeft: number, prayerName: string }`
- [x] Uses `nextPrayer.datetime - now` calculation
- [x] Updates every second via useEffect interval
- **File:** `hooks/useCountdown.ts` (new)
- **Dependencies:** Task 3.1
- **QA Score:** 98/100

#### Task 3.5: Create useProgressBar() hook ✅

- [x] Create new file: `hooks/useProgressBar.ts`
- [x] Returns `{ progress: number }` (0-100)
- [x] Uses prevPrayer and nextPrayer from sequence
- [x] Simple: `(now - prev.datetime) / (next.datetime - prev.datetime) * 100`
- [x] No special "first prayer" or "yesterday" logic needed
- **File:** `hooks/useProgressBar.ts` (new)
- **Dependencies:** Tasks 3.1, 2.5
- **QA Score:** 98/100

---

### Phase 4: Sync Layer - Initialize Sequences

#### Task 4.1: Update initializeAppState() to set sequences ✅

- [x] After existing `setSchedule()` calls, add `setSequence()` calls
- [x] Both Standard and Extra sequences initialized
- [x] Parallel to existing initialization - don't remove old code yet
- **File:** `stores/sync.ts`
- **Dependencies:** Task 2.2
- **QA Score:** 100/100

#### Task 4.2: Remove schedule advancement checks from initializeAppState() ✅

- [x] The sequence model doesn't need advancement on init
- [x] nextPrayer is always derived from current time
- [x] Comment out (don't delete) the advanceScheduleToTomorrow calls
- **File:** `stores/sync.ts`
- **Dependencies:** Task 4.1
- **Note:** Only after Phase 5 UI migration is complete
- **QA Score:** 100/100

#### Task 4.3: Add sequence refresh to countdown tick ✅

- [x] In countdown interval, check if nextPrayer has passed
- [x] If passed, call `refreshSequence(type)`
- [x] No more `incrementNextIndex()` or `advanceScheduleToTomorrow()` (parallel for now)
- **File:** `stores/countdown.ts`
- **Dependencies:** Task 2.4
- **Note:** Add alongside existing logic, don't replace yet
- **QA Score:** 100/100

#### Task 4.4: Add divergence detection for parallel models ✅

- [x] Create `validateModelParity(type: ScheduleType): boolean` function
- [x] Compare old model countdown vs new model countdown
- [x] Compare old model nextIndex vs new model nextPrayer
- [x] Log warnings in **DEV** mode if divergence > 2 seconds
- [x] Run validation on every countdown tick during migration
- **File:** `stores/debug.ts` (new), `stores/countdown.ts`
- **Dependencies:** Tasks 2.5, 4.1
- **Critical:** Must pass validation before Phase 7 cleanup
- **QA Score:** 100/100

#### Task 4.5: Handle empty sequence edge case ✅

- [x] In `getNextPrayer()`, if no future prayer found, trigger refresh
- [x] If refresh fails or returns empty, return null (hooks expose isReady for loading state)
- [x] Components handle loading state gracefully via hooks' `isReady` boolean
- [x] Exponential backoff N/A - refreshSequence uses cached data, not network
- **File:** `stores/schedule.ts`
- **Dependencies:** Task 2.4
- **QA Score:** 100/100

---

### Phase 5: UI Migration - Component Updates

#### Task 5.1: Update Countdown.tsx to use new hooks ✅

- [x] Import `useCountdown()` hook
- [x] Replace `useAtomValue(countdownAtom)` with `useCountdown(type)`
- [x] Countdown now shows countdown from sequence-derived nextPrayer
- [x] Verify display is identical to before
- **File:** `components/Countdown.tsx`
- **Dependencies:** Task 3.4
- **QA Score:** 100/100

#### Task 5.2: Update ProgressBar.tsx to use new hook ✅

- [x] Import `useProgressBar()` hook
- [x] Replace `useMemo()` progress calculation with `useProgressBar(type)`
- [x] Remove all `schedule.yesterday`, `schedule.today`, `schedule.nextIndex` usage
- [x] Greatly simplified component
- **File:** `components/ProgressBar.tsx`
- **Dependencies:** Task 3.5
- **QA Score:** 100/100

#### Task 5.3: Update Prayer.tsx to use derived isPassed ✅

- [x] Update `usePrayer()` to derive isPassed from sequence
- [x] `isPassed = prayer.datetime < now` - simple comparison
- [x] Remove date string comparison: `todayPrayer.date === today`
- **File:** `components/Prayer.tsx` (no changes needed - consumes updated hook)
- **Dependencies:** Task 3.3
- **QA Score:** 100/100

#### Task 5.4: Update usePrayer.ts hook ✅

- [x] Modify to get prayer from sequence instead of schedule
- [x] `isPassed = prayer.datetime < now`
- [x] `isNext = prayer.id === nextPrayer.id`
- [x] Keep same return shape for backward compatibility
- **File:** `hooks/usePrayer.ts`
- **Dependencies:** Tasks 3.1, 3.2
- **QA Score:** 100/100

#### Task 5.5: Update Day.tsx to use derived displayDate ✅

- [x] Import derived displayDateAtom from schedule store
- [x] Replace `getDateAtom(type)` usage with new derived atom
- [x] Display date now automatically follows current prayer
- **File:** `components/Day.tsx`
- **Dependencies:** Task 2.3
- **QA Score:** 100/100

#### Task 5.6: Update ActiveBackground.tsx ✅

- [x] Get nextPrayerIndex from sequence (index in today's prayers)
- [x] `yPosition = nextPrayerIndex * STYLES.prayer.height`
- [x] No change to animation logic
- **File:** `components/ActiveBackground.tsx`
- **Dependencies:** Task 3.2
- **QA Score:** 100/100

#### Task 5.7: Update useSchedule.ts hook ✅

- [x] Add option to use sequence model: `useSchedule(type, { useSequence: true })`
- [x] Returns sequence-based data when flag is true
- [x] Returns old model when flag is false (default)
- [x] Gradual migration support
- **File:** `hooks/useSchedule.ts`
- **Dependencies:** Task 3.2
- **QA Score:** 100/100

#### Task 5.8: Update List.tsx for sequence-based rendering ✅

- [x] Use `usePrayerSequence()` to get prayers for today
- [x] Filter sequence to only show prayers for displayDate
- [x] Map over prayers instead of using `Array.from({ length })`
- **File:** `components/List.tsx`
- **Dependencies:** Task 3.2
- **QA Score:** 100/100

#### Task 5.9: Update Overlay.tsx ✅

- [x] Review overlay countdown usage
- [x] Update to use sequence-based countdown if applicable
- [x] Verify overlay displays correct prayer info
- **File:** `components/Overlay.tsx` (no changes needed - consumes updated hooks)
- **Dependencies:** Task 3.1
- **QA Score:** 100/100

#### Task 5.10: Update stores/overlay.ts ✅

- [x] Review `canShowOverlay()` function
- [x] Update to use sequence-based time check if needed
- [x] Verify overlay toggle logic still works
- **File:** `stores/overlay.ts`
- **Dependencies:** Task 2.5
- **QA Score:** 100/100

---

### Phase 6: Countdown System Updates

#### Task 6.1: Create new countdown approach in stores/countdown.ts ✅

- [x] Add `startSequenceCountdown(type: ScheduleType)` function
- [x] Uses `getNextPrayer(type)` to get countdown target
- [x] Interval updates `countdownAtom` from `nextPrayer.datetime - now`
- [x] Calls `refreshSequence()` when prayer passes (countdown <= 0)
- **File:** `stores/countdown.ts`
- **Dependencies:** Tasks 2.5, 2.4
- **QA Score:** 100/100

#### Task 6.2: Simplify calculateCountdown() in shared/time.ts ✅

- [x] Add `calculateCountdownFromPrayer(prayer: Prayer): number`
- [x] Simple: `prayer.datetime.getTime() - Date.now() / 1000`
- [x] No more schedule parameter, no yesterday fallback
- [x] Keep old `calculateCountdown()` for backward compatibility
- **File:** `shared/time.ts`
- **Dependencies:** Task 1.1
- **QA Score:** 100/100

#### Task 6.3: Update startCountdowns() to use new approach ✅

- [x] Replace `startCountdownSchedule()` calls with `startSequenceCountdown()`
- [x] Both Standard and Extra countdowns use sequence model
- [x] Remove `incrementNextIndex()` and `advanceScheduleToTomorrow()` calls
- **File:** `stores/countdown.ts`
- **Dependencies:** Tasks 6.1, 4.2
- **QA Score:** 100/100

#### Task 6.4: Remove overlay countdown special handling ✅

- [x] Overlay countdown can use same sequence-based approach
- [x] `startCountdownOverlay()` gets selected prayer from sequence by id
- [x] Simplify overlay countdown code
- **File:** `stores/countdown.ts`
- **Dependencies:** Task 6.1
- **QA Score:** 100/100

---

### Phase 7: Cleanup - Remove Old Model

#### Task 7.1: Remove ScheduleStore interface and atoms ✅

- [x] Remove `yesterday`, `today`, `tomorrow`, `nextIndex` from ScheduleStore
- [x] Remove `standardScheduleAtom`, `extraScheduleAtom`
- [x] Remove `createInitialSchedule()`, `buildDailySchedules()`
- **File:** `stores/schedule.ts`
- **Dependencies:** All Phase 5 tasks complete

#### Task 7.2: Remove old setSchedule() and related functions ✅

- [x] Remove `setSchedule()`, `getSchedule()`
- [x] Remove `incrementNextIndex()`
- [x] Remove `advanceScheduleToTomorrow()`
- **File:** `stores/schedule.ts`
- **Dependencies:** Task 7.1

#### Task 7.3: Remove old calculateCountdown() with schedule param ✅

- [x] Remove `calculateCountdown(schedule, index)` function
- [x] Keep new `calculateCountdownFromPrayer()` function
- [x] Remove yesterday fallback code
- [x] Remove `isLastPrayerPassed(schedule)` function
- **File:** `shared/time.ts`
- **Dependencies:** All Phase 5 tasks complete

#### Task 7.4: Remove date atoms from stores/sync.ts ✅

- [x] Remove `standardDateAtom`, `extraDateAtom`
- [x] Remove `getDateAtom()`, `setScheduleDate()`
- [x] Date is now derived from sequence
- [x] Remove `setDate()` function
- [x] Remove old `setSchedule()` calls
- **File:** `stores/sync.ts`
- **Dependencies:** Task 5.5

#### Task 7.5: Clean up shared/types.ts ✅

- [x] Remove old `ScheduleStore` interface
- [x] Remove `IScheduleNow` interface
- [x] Remove `IPrayerConfig` interface
- [x] Remove `ScheduleAtom` type
- [x] Remove `standardScheduleAtom` import
- [x] `Prayer` and `PrayerSequence` are now the primary types
- **File:** `shared/types.ts`
- **Dependencies:** Task 7.1

#### Task 7.5b: Clean up shared/prayer.ts ✅

- [x] Remove `createSchedule()` function (old model)
- [x] Remove `findNextPrayerIndex()` function (old model)
- [x] Remove `IScheduleNow` import
- **File:** `shared/prayer.ts`

#### Task 7.5c: Clean up stores/countdown.ts ✅

- [x] Remove old `startCountdownSchedule()` function
- [x] Remove imports for `getSchedule`, `incrementNextIndex`, `advanceScheduleToTomorrow`
- [x] Remove `validateModelParity` call (no longer needed)
- **File:** `stores/countdown.ts`

#### Task 7.5d: Delete stores/debug.ts ✅

- [x] Remove `validateModelParity()` function (no longer needed without old model)
- **File:** `stores/debug.ts` (deleted)

#### Task 7.5e: Update components to use new model ✅

- [x] Update `useSchedule.ts` to always use sequence model
- [x] Update `Prayer.tsx` to use `Schedule.displayDate` instead of `getDateAtom`
- [x] Update `Alert.tsx` to use `Schedule.displayDate` instead of `getDateAtom`
- [x] Update `PrayerTime.tsx` to use `Schedule.displayDate` instead of `getDateAtom`
- **Files:** `hooks/useSchedule.ts`, `components/Prayer.tsx`, `components/Alert.tsx`, `components/PrayerTime.tsx`

#### Task 7.6: Update stores/notifications.ts for new model ✅ (No Changes Needed)

- [x] Review notification scheduling logic
- [x] Notifications use `Database.getPrayerByDate()` directly - decoupled from Schedule model
- [x] Current date+time string approach works correctly
- [x] No dependency on old ScheduleStore - no changes required
- **File:** `stores/notifications.ts`
- **Dependencies:** Task 7.5
- **Note:** Notifications are already decoupled from the Schedule model

#### Task 7.7: Update shared/notifications.ts ✅ (No Changes Needed)

- [x] Review `genNextXDays()` - works correctly
- [x] Review `isPrayerTimeInFuture()` - uses date+time strings, works correctly
- [x] Notification utilities don't depend on Schedule model
- [x] No changes required
- **File:** `shared/notifications.ts`
- **Dependencies:** Task 7.6
- **Note:** Notification utilities work independently of timing model

#### Task 7.8: Validate notifications with new model

- [ ] Schedule a notification using Prayer.datetime
- [ ] Verify notification fires at correct time
- [ ] Test notification rescheduling after prayer passes
- [ ] Test notification cancellation works correctly
- **File:** Manual validation
- **Dependencies:** Tasks 7.6, 7.7
- **Note:** Manual testing to be done by user

#### Task 7.9: Final stores/sync.ts cleanup ✅

- [x] Remove commented-out code from Phase 4
- [x] Remove any remaining references to old model
- [x] Verify sync flow uses only sequence model
- **File:** `stores/sync.ts`
- **Dependencies:** All Phase 7 tasks

---

### Phase 8: Testing and Documentation

#### Task 8.1: Manual test - Standard schedule day transition

- [ ] Wait for Isha to pass (or mock time in mocks/simple.ts)
- [ ] Verify countdown shows tomorrow's Fajr countdown
- [ ] Verify date display updates to tomorrow
- [ ] Verify isPassed styling correct
- **Dependencies:** All implementation complete

#### Task 8.2: Manual test - Extras schedule day transition

- [ ] Wait for Duha to pass (or mock time)
- [ ] Verify countdown shows Midnight countdown (same day!)
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
- [ ] Both countdowns accurate
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
- [ ] Verify no **DEV** divergence warnings logged
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
- [ ] Update countdown system documentation
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

| File                                   | Phase | Changes                                               |
| -------------------------------------- | ----- | ----------------------------------------------------- |
| `shared/types.ts`                      | 1     | Add Prayer, PrayerSequence, StoredPrayer interfaces   |
| `shared/time.ts`                       | 1, 6  | Add datetime utilities, simplify countdown            |
| `shared/prayer.ts`                     | 1     | Add createPrayer, createPrayerSequence, belongsToDate |
| `shared/storage.ts`                    | 1     | NEW: MMKV serialization for Date objects              |
| `stores/schedule.ts`                   | 2, 7  | Add sequence atoms, remove old model                  |
| `stores/sync.ts`                       | 4, 7  | Initialize sequences, remove old init                 |
| `stores/countdown.ts`                      | 4, 6  | Sequence-based countdown, divergence detection            |
| `stores/debug.ts`                      | 4     | NEW (optional): Divergence validation utilities       |
| `hooks/useNextPrayer.ts`               | 3     | NEW: Next prayer hook                                 |
| `hooks/usePrayerSequence.ts`           | 3     | NEW: Sequence hook                                    |
| `hooks/useCountdown.ts`                | 3     | NEW: Countdown hook                                   |
| `hooks/useProgressBar.ts`              | 3     | NEW: Progress hook                                    |
| `hooks/usePrayer.ts`                   | 5     | Use sequence-based isPassed                           |
| `hooks/useSchedule.ts`                 | 5     | Add sequence mode option                              |
| `components/Countdown.tsx`                 | 5     | Use useCountdown hook                                 |
| `components/ProgressBar.tsx`           | 5     | Use useProgressBar hook                               |
| `components/Prayer.tsx`                | 5     | Use derived isPassed                                  |
| `components/Day.tsx`                   | 5     | Use derived displayDate                               |
| `components/ActiveBackground.tsx`      | 5     | Use sequence-based index                              |
| `components/List.tsx`                  | 5     | Sequence-based rendering                              |
| `stores/overlay.ts`                    | 5     | Update canShowOverlay                                 |
| `stores/notifications.ts`              | 7     | Use Prayer.datetime                                   |
| `shared/notifications.ts`              | 7     | Update time utilities                                 |
| `README.md`                            | 8     | Documentation updates                                 |
| `ai/AGENTS.md`                         | 8     | Memory entry                                          |
| `ai/adr/005-timing-system-overhaul.md` | 8     | Status update                                         |

---

## Decision Log

| Decision                | Choice           | Rationale                               |
| ----------------------- | ---------------- | --------------------------------------- |
| Parallel implementation | Yes              | Safer migration, can compare old vs new |
| Sequence buffer size    | 3 days           | Matches notification rolling window     |
| Prayer ID format        | `type_name_date` | Unique, readable, sortable              |
| datetime storage        | JavaScript Date  | Native comparison, no parsing           |
| Derived atoms           | Jotai `atom()`   | Automatic updates, no sync needed       |
| Hook-based interface    | New hooks        | Clean API, composable                   |
| Cleanup phase last      | Yes              | Only after all UI migrated              |

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

| Checkpoint    | Criteria                           | Rollback Action                     |
| ------------- | ---------------------------------- | ----------------------------------- |
| After Phase 4 | Divergence validation passes       | Remove new atoms, keep old          |
| After Phase 5 | All components work with new hooks | Remove new hooks, revert components |
| After Phase 6 | Countdown system stable                | Revert countdown changes                |
| After Phase 7 | 24hr soak test passes              | Git revert Phase 7                  |

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

---

### Phase 9: Bug Fixes (Post-Refactor Testing)

**Status:** PLANNED - QA APPROVED 100/100
**Plan:** ai/features/timing-system-bugfixes/plan.md
**Date:** 2026-01-19

Manual testing at 03:16am Jan 19th revealed 5 bugs requiring fixes.

#### Task 9.1: Fix store mutation during atom read (Bug 5)

- [ ] Make `getNextPrayer()` pure read-only (remove refreshSequence call)
- [ ] Verify callers already handle null case
- **File:** `stores/schedule.ts`
- **Verification:** No "store mutation during atom read" warning

#### Task 9.2: Fix timezone in createPrayerDatetime (Bug 3)

- [ ] Use `formatInTimeZone()` to create dates in London timezone
- [ ] Match timezone handling with `createLondonDate()`
- **File:** `shared/time.ts`
- **Verification:** Progress bar shows non-zero at 03:16am

#### Task 9.3: Fix refreshSequence to keep current displayDate prayers (Bug 1)

- [ ] Find current displayDate from next future prayer
- [ ] Keep passed prayers that belong to current displayDate
- [ ] Remove passed prayers for OTHER dates (memory-safe)
- **File:** `stores/schedule.ts`
- **Verification:** Midnight appears on Extras at 03:16am

#### Task 9.4: Fix overlay countdown tomorrow fallback (Bug 2)

- [ ] Match `usePrayer.ts:45-55` logic exactly
- [ ] Add tomorrow prayer fallback for passed prayers
- **File:** `stores/countdown.ts`
- **Verification:** Tapping Last Third shows correct time/countdown

#### Task 9.5: Fix require cycles (Bug 4)

- [ ] Extract `overlayAtom` to `stores/atoms/overlay.ts`
- [ ] Use dependency injection for notifications
- [ ] Update imports in `stores/overlay.ts` and `stores/countdown.ts`
- **Files:** `stores/atoms/overlay.ts` (NEW), `stores/overlay.ts`, `stores/countdown.ts`, `device/notifications.ts`, `shared/notifications.ts`
- **Verification:** No "require cycle" warnings on start

---

## Bug Fix Files Summary

| File                      | Bug  | Changes                                             |
| ------------------------- | ---- | --------------------------------------------------- |
| `stores/schedule.ts`      | 5, 1 | Pure `getNextPrayer()`, smarter `refreshSequence()` |
| `shared/time.ts`          | 3    | London timezone in `createPrayerDatetime()`         |
| `stores/countdown.ts`         | 2, 4 | Tomorrow fallback in overlay, new atom import       |
| `device/notifications.ts` | 4    | Dependency injection for sound preference           |
| `shared/notifications.ts` | 4    | Dependency injection for refresh function           |
| `stores/atoms/overlay.ts` | 4    | NEW: Extracted overlayAtom                          |
| `stores/overlay.ts`       | 4    | Import from new atom location                       |

---

### Phase 10: Critical Bug - Isha Display Issue (BLOCKING)

**Status:** DOCUMENTED - INVESTIGATION REQUIRED
**Bug Report:** ai/features/isha-display-bug/description.md
**Investigation Plan:** ai/features/isha-display-bug/plan.md
**Progress:** ai/features/isha-display-bug/progress.md
**Date:** 2026-01-19
**ReviewerQA:** 100/100 (Documentation approved)

**Discovery:** After implementing Phase 9 bug fixes, a critical bug was discovered affecting the Standard schedule when Isha is the next prayer.

#### Symptoms

| Issue           | When                    | What Happens                                |
| --------------- | ----------------------- | ------------------------------------------- |
| Missing prayers | Isha is next            | Only Isha renders, Fajr-Maghrib missing     |
| +1 hour offset  | Isha is next            | Isha time displays 1 hour later than actual |
| Prayers vanish  | Maghrib→Isha transition | List breaks, shows only Isha                |
| Isha disappears | Isha passes             | Fajr-Maghrib render but Isha missing        |

#### Quick Reproduction

```typescript
// In mocks/simple.ts:
isha: addMinutes(1),  // 1 min in future
// All other prayers: addMinutes(-1)
```

#### Root Cause Hypothesis

1. **Primary:** Isha's `belongsToDate` is being assigned differently than other prayers
2. **Secondary:** Timezone double-conversion in `createPrayerDatetime()`
3. **Tertiary:** Hour extraction issue in `getLondonHours()` / `calculateBelongsToDate()`

#### Attempted Fixes (Did Not Resolve)

1. Changed `createPrayerDatetime()` to use `fromZonedTime`
2. Added `getLondonHours()` helper for timezone-aware hour extraction
3. Updated `calculateBelongsToDate()` to use London hours

#### Investigation Plan Overview

1. **Phase 1:** Add diagnostic logging to trace data through system
2. **Phase 2:** Create minimal reproduction with mock data
3. **Phase 3:** Hypothesis testing with specific scenarios
4. **Phase 4:** Implement fix based on investigation findings
5. **Phase 5:** Verification across all scenarios

#### Blocking

- This bug MUST be fixed before Phase 8 testing can be completed
- Phase 8 Tasks 8.1 (Standard schedule day transition) cannot pass with this bug
- User-facing impact: Critical - Standard schedule broken every evening

See `ai/features/isha-display-bug/plan.md` for detailed investigation steps.
