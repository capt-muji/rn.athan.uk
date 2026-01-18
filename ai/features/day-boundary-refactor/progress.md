# Feature: Day Boundary Refactor - Bug Fixes

**Status:** Planning
**Created:** 2026-01-18
**Spec:** ai/adr/004-prayer-based-day-boundary.md
**QA Review:** Completed (Grade B+, 3 CRITICAL issues addressed)

---

## Tasks

### Phase 1: Audit & Verification - Core Logic

#### 1.1 Verify calculateCountdown() behavior

- [ ] Task 1.1.1: Map happy path flow in shared/time.ts:calculateCountdown()
- [ ] Task 1.1.2: Map advanced schedule branch (todayPrayer.date !== today)
- [ ] Task 1.1.3: Map yesterday fallback branch for Extras Midnight
- [ ] Task 1.1.4: Verify secondsRemainingUntil() works with dates in the past (returns negative)
- [ ] Task 1.1.5: Test calculateCountdown() with mock data for ADR-004 Scenario 12
- [ ] Task 1.1.6: Verify behavior when calculateCountdown() returns negative timeLeft

#### 1.2 Verify isTimePassed() behavior

- [ ] Task 1.2.1: Verify isTimePassed() compares against London timezone
- [ ] Task 1.2.2: Test isTimePassed() at multiple times (23:30 for "00:15", 00:30 for "00:15")

#### 1.3 Verify isPassed in usePrayer.ts

- [ ] Task 1.3.1: Verify isPassed requires BOTH date match AND time passed
- [ ] Task 1.3.2: Test isPassed when schedule advanced (todayPrayer.date is tomorrow)
- [ ] Task 1.3.3: Verify isPassed returns false for all prayers after schedule advancement

#### 1.4 Verify schedule advancement timing

- [ ] Task 1.4.1: Verify advanceScheduleToTomorrow() is only called when nextIndex wraps to 0
- [ ] Task 1.4.2: Verify advanceScheduleToTomorrow() shifts yesterday correctly
- [ ] Task 1.4.3: Verify advanceScheduleToTomorrow() fetches dayAfterTomorrow before shifting
- [ ] Task 1.4.4: Verify setScheduleDate() is called with correct date after advancement
- [ ] Task 1.4.5: Verify nextIndex is set to 0 in the store.set() call (already implemented)

#### 1.5 Verify initializeAppState() on app open

- [ ] Task 1.5.1: Verify app checks if last prayer passed on open
- [ ] Task 1.5.2: Verify both schedules are checked independently
- [ ] Task 1.5.3: Verify timers start AFTER schedule advancement (if needed)

---

### Phase 2: Audit & Verification - ADR-004 Scenarios

#### 2.1 Scenario 1-3: Normal Day Operations

- [ ] Task 2.1.1: Manual test Scenario 1 (Standard schedule normal day at 14:30) - verify against ADR-004
- [ ] Task 2.1.2: Manual test Scenario 2 (Extras schedule normal day at 14:30) - verify against ADR-004
- [ ] Task 2.1.3: Manual test Scenario 3 (Isha before system midnight - winter) - verify against ADR-004

#### 2.2 Scenario 4: Isha After System Midnight (CRITICAL)

- [ ] Task 2.2.1: Verify schedule does NOT advance at 00:00
- [ ] Task 2.2.2: Verify Isha at 00:45 still shows June 21's date until it passes
- [ ] Task 2.2.3: Verify schedule advances only after Isha passes at 00:45
- [ ] Task 2.2.4a: Create mock data structure for London summer with Isha at 00:45
- [ ] Task 2.2.4b: Seed database with test data
- [ ] Task 2.2.4c: Verify data appears correctly in app

#### 2.3 Scenario 5-6: Midnight Prayer Timing

- [ ] Task 2.3.1: Manual test Scenario 5 (Midnight prayer before system midnight - winter)
- [ ] Task 2.3.2: Manual test Scenario 6 (Midnight prayer after system midnight - summer)
- [ ] Task 2.3.3: Verify Midnight at 00:15 belongs to yesterday's Extras schedule

#### 2.4 Scenario 7: App Opened After Last Prayer

- [ ] Task 2.4.1: Open app at 22:00 when Isha was at 18:15
- [ ] Task 2.4.2: Verify Standard shows tomorrow's date
- [ ] Task 2.4.3: Verify Extras shows tomorrow's date (Duha passed in morning)
- [ ] Task 2.4.4: Verify both timers show countdown to next prayer

#### 2.5 Scenario 8: Year Boundary (Dec 31 → Jan 1)

- [ ] Task 2.5.1: Verify December triggers next year data fetch
- [ ] Task 2.5.2: Verify Jan 1 fetches previous year Dec 31 data
- [ ] Task 2.5.3: Verify ProgressBar has yesterday's Isha on Jan 1

#### 2.6 Scenario 9: Friday with Istijaba

- [ ] Task 2.6.1: Verify Extras has 5 prayers on Friday
- [ ] Task 2.6.2: Verify Extras advances after Istijaba (not Duha) on Friday
- [ ] Task 2.6.3: Verify ISTIJABA_INDEX is 4 (5th prayer)
- [ ] Task 2.6.4: Verify isFriday() uses correct date (schedule date, not current date)

#### 2.7 Scenario 10: Both Schedules Different Dates (CRITICAL)

- [ ] Task 2.7.1: At 09:30 Saturday, verify Standard shows today (Isha not passed)
- [ ] Task 2.7.2: At 09:30 Saturday, verify Extras shows tomorrow (Duha passed at 08:08)
- [ ] Task 2.7.3: Verify Day.tsx shows correct date for each schedule independently

#### 2.8 Scenario 11-14: Edge Cases

- [ ] Task 2.8.1: Verify countdown wraps to tomorrow when today's prayer passed (Scenario 11)
- [ ] Task 2.8.2: Verify Extras Midnight countdown uses yesterday's data after Duha (Scenario 12)
- [ ] Task 2.8.3: Verify isPassed calculation after schedule advancement (Scenario 13)
- [ ] Task 2.8.4: Verify ProgressBar has yesterday's Isha at 03:00 for Fajr progress (Scenario 14)

#### 2.9 App Resume From Background (NEW - from QA review)

- [ ] Task 2.9.1: Verify behavior when app resumes after 6+ hours backgrounded
- [ ] Task 2.9.2: Check if schedules refresh on app resume (if implemented)
- [ ] Task 2.9.3: Document expected behavior for background resume

---

### Phase 3: Core Logic Fixes (if bugs found)

#### 3.1 calculateCountdown() fixes

- [ ] Task 3.1.1: Fix edge case where yesterdayPrayer is undefined
- [ ] Task 3.1.2: Fix edge case where schedule.nextIndex is out of bounds
- [ ] Task 3.1.3: Add validation for negative timeLeft return values

#### 3.2 isPassed calculation fixes

- [ ] Task 3.2.1: Ensure todayPrayer.date comparison uses formatted date string
- [ ] Task 3.2.2: Handle timezone edge case at midnight boundary

#### 3.3 Schedule advancement fixes

- [ ] Task 3.3.1: Add guard for missing dayAfterTomorrow data
- [ ] Task 3.3.2: Verify findNextPrayerIndex() returns 0 when called after advancement
- [ ] Task 3.3.3: Ensure date atom is updated synchronously after shift

#### 3.4 initializeAppState() fixes

- [ ] Task 3.4.1: Ensure await on advanceScheduleToTomorrow calls
- [ ] Task 3.4.2: Ensure timers start only after all advancements complete

---

### Phase 4: UI/Display Fixes (if bugs found)

#### 4.1 Date display (Day.tsx)

- [ ] Task 4.1.1: Verify formatDateLong handles empty string date
- [ ] Task 4.1.2: Verify date updates immediately after schedule advancement

#### 4.2 Timer display (Timer.tsx)

- [ ] Task 4.2.1: Verify timer.name shows correct prayer after advancement
- [ ] Task 4.2.2: Verify timer.timeLeft is positive after advancement

#### 4.3 ActiveBackground visibility

- [ ] Task 4.3.1: Verify blue highlight always visible on next prayer
- [ ] Task 4.3.2: Verify yPosition calculation after nextIndex changes

#### 4.4 ProgressBar calculation

- [ ] Task 4.4.1: Verify progress calculation when nextIndex is 0
- [ ] Task 4.4.2: Verify lastIndex calculation matches schedule length
- [ ] Task 4.4.3: Verify schedule.yesterday is always populated (never undefined)
- [ ] Task 4.4.4: Handle edge case: totalDuration is 0 or negative

#### 4.5 Prayer row display

- [ ] Task 4.5.1: Verify isPassed styling after schedule advancement
- [ ] Task 4.5.2: Verify isNext highlight after schedule advancement

#### 4.6 Overlay Index Validity (NEW - from QA review)

- [ ] Task 4.6.1: Verify overlay.selectedPrayerIndex is valid after schedule advancement
- [ ] Task 4.6.2: Verify overlay displays correct prayer after schedule shift

---

### Phase 5: Edge Case Handling

#### 5.1 Year boundary specific

- [ ] Task 5.1.1: Test Dec 31 23:00 → Jan 1 00:30 transition
- [ ] Task 5.1.2: Verify previous year fetch on Jan 1 is synchronous
- [ ] Task 5.1.3: Handle case where previous year data is corrupted

#### 5.2 Summer time transitions

- [ ] Task 5.2.1: Test BST → GMT transition (clocks go back)
- [ ] Task 5.2.2: Test GMT → BST transition (clocks go forward)
- [ ] Task 5.2.3: Verify createLondonDate handles DST correctly

#### 5.3 Race conditions - General

- [ ] Task 5.3.1: Verify overlay closes before schedule shift
- [ ] Task 5.3.2: Verify no double-advancement if timer fires twice rapidly

#### 5.4 Timer-Schedule Race Conditions (NEW - from QA review)

- [ ] Task 5.4.1: Verify timer interval is cleared before advanceScheduleToTomorrow() starts
- [ ] Task 5.4.2: Verify startTimerSchedule() waits for advanceScheduleToTomorrow() to complete

---

### Phase 6: Testing & Verification

#### 6.1 Unit test scenarios (LARGER TASKS - 30+ minutes each)

- [ ] Task 6.1.1: Create test file structure for time.ts tests
- [ ] Task 6.1.2: Implement test for calculateCountdown with normal day data
- [ ] Task 6.1.3: Implement test for calculateCountdown with advanced schedule
- [ ] Task 6.1.4: Implement test for calculateCountdown with yesterday fallback
- [ ] Task 6.1.5: Implement test for isTimePassed at various times
- [ ] Task 6.1.6: Implement test for isPassed with date verification

#### 6.2 Manual test checklist (Final Verification)

- [ ] Task 6.2.1: Standard schedule: timer counts down, advances after Isha
- [ ] Task 6.2.2: Extras schedule: timer counts down, advances after Duha
- [ ] Task 6.2.3: Friday: Extras advances after Istijaba
- [ ] Task 6.2.4: Both schedules can show different dates
- [ ] Task 6.2.5: App open after Isha: shows tomorrow immediately
- [ ] Task 6.2.6: ProgressBar works at 03:00 (uses yesterday's Isha)
- [ ] Task 6.2.7: ActiveBackground highlights correct prayer after advancement
- [ ] Task 6.2.8: Overlay closes during advancement, reopens with fresh data

---

## Files To Review

| File                              | Phase   | Concern                                                       |
| --------------------------------- | ------- | ------------------------------------------------------------- |
| `shared/time.ts`                  | 1, 3    | calculateCountdown(), isTimePassed(), secondsRemainingUntil() |
| `stores/schedule.ts`              | 1, 3    | advanceScheduleToTomorrow(), incrementNextIndex()             |
| `stores/sync.ts`                  | 1, 3    | initializeAppState(), setScheduleDate()                       |
| `stores/timer.ts`                 | 1, 3, 5 | startTimerSchedule() advancement trigger                      |
| `stores/overlay.ts`               | 3, 4    | Overlay close during advancement                              |
| `stores/version.ts`               | 5       | Cache clearing impact on schedule data                        |
| `hooks/usePrayer.ts`              | 1, 3, 4 | isPassed calculation                                          |
| `hooks/useSchedule.ts`            | 1, 4    | Schedule data retrieval hook                                  |
| `components/ActiveBackground.tsx` | 4       | yPosition calculation, visibility                             |
| `components/Timer.tsx`            | 4       | timer display                                                 |
| `components/Day.tsx`              | 4       | date display per schedule                                     |
| `components/ProgressBar.tsx`      | 4       | yesterday data access                                         |
| `shared/prayer.ts`                | 2       | findNextPrayerIndex(), createSchedule(), isFriday()           |
| `shared/constants.ts`             | 2       | ISTIJABA_INDEX value                                          |

---

## Potential Issues from RepoMapper

| Issue                                       | Location                    | Description                                     | Priority |
| ------------------------------------------- | --------------------------- | ----------------------------------------------- | -------- |
| Date comparison requires both date AND time | usePrayer.ts                | isPassed = date === today && isTimePassed(time) | HIGH     |
| Yesterday data dependency                   | ProgressBar.tsx             | Requires schedule.yesterday[lastIndex]          | HIGH     |
| Race condition window                       | advanceScheduleToTomorrow() | Between fetch and shift                         | MEDIUM   |
| nextIndex state after advancement           | schedule.ts                 | Already set to 0 (verified)                     | VERIFIED |
| Timezone edge cases                         | time.ts                     | createLondonDate at DST boundaries              | MEDIUM   |
| isFriday() uses current date                | prayer.ts                   | May not use schedule date                       | LOW      |
| App resume from background                  | Not implemented             | Schedules may be stale                          | MEDIUM   |

---

## Decision Log

| Decision                 | Choice        | Rationale                                            |
| ------------------------ | ------------- | ---------------------------------------------------- |
| Audit before fix         | Yes           | Verify bugs exist before changing code               |
| ADR-004 is authoritative | Yes           | Spec defines correct behavior                        |
| Small atomic tasks       | Yes           | Each task < 15 minutes, one concern                  |
| Phase 3-4 conditional    | If bugs found | Don't fix what isn't broken                          |
| Rollback strategy        | Git revert    | If Phase 3-4 fixes cause regressions, revert commits |

---

## QA Review Summary

**Grade: B+** (85/100)

**Critical Issues Addressed:**

1. Added missing files: `stores/overlay.ts`, `hooks/useSchedule.ts`, `stores/version.ts`
2. Fixed Task 3.3.2 - nextIndex is already set to 0, changed to verify findNextPrayerIndex()
3. Added Section 2.9 - App Resume From Background scenario

**Medium Issues Addressed:**

1. Marked Phase 6.1 as LARGER TASKS (30+ min each)
2. Added Phase 4.6 - Overlay Index Validity
3. Added Phase 5.4 - Timer-Schedule Race Conditions
4. Split Task 4.4.2 into 4.4.2/4.4.3 for specificity
5. Removed redundant Phase 6.3 (merged into Phase 2)
6. Added Task 1.1.6 for negative timeLeft handling
7. Added Task 2.6.4 for isFriday() verification

---

## Notes

**Core Principles from ADR-004:**

1. NO 00:00 reset - app never uses system midnight as trigger
2. Prayer times are immutable - belong to their fetched date
3. Each schedule is independent - Standard and Extras advance separately
4. Timer always visible - never "finished" state
5. Trust the data layer - UI never has fallbacks

**The Yesterday Fallback (CRITICAL for Extras):**
After Duha passes (~9am), Extras advances to tomorrow but Midnight (~23:00) is still hours away. The yesterday fallback in calculateCountdown() handles this by checking if yesterdayPrayer's time is still in the future.

**Files Modified in Previous Bug Fixes:**

- stores/sync.ts (initializeAppState advancement check)
- components/ActiveBackground.tsx (removed shouldHide logic)
- hooks/usePrayer.ts (added date verification to isPassed)
- shared/time.ts (added yesterday fallback to calculateCountdown)
