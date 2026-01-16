# Feature: Islamic Day Boundary

**Status:** 📋 Ready for Implementation
**Created:** 2026-01-16
**Reviewed:** RepoMapper ✓, ReviewerQA ✓

---

## Tasks

### Phase 1: Foundation (stores/sync.ts)
- [ ] Task 1.1: Split `dateAtom` into `standardDateAtom` and `extraDateAtom`
- [ ] Task 1.2: Add `getDateAtom(type: ScheduleType)` helper function
- [ ] Task 1.3: Add `setScheduleDate(type: ScheduleType, date: string)` export
- [ ] Task 1.4: Update `setDate()` to set both atoms from respective schedules

### Phase 2: Schedule Advancement (stores/schedule.ts)
- [ ] Task 2.1: Add `advanceScheduleToTomorrow(type: ScheduleType)` async function
- [ ] Task 2.2: Implement overlay auto-close at start of advancement
- [ ] Task 2.3: Implement day-after-tomorrow fetch with retry logic
- [ ] Task 2.4: Implement atomic shift (only after fetch succeeds)
- [ ] Task 2.5: Call `setScheduleDate()` after successful shift

### Phase 3: Timer Integration (stores/timer.ts)
- [ ] Task 3.1: Update `startTimerSchedule()` to call `advanceScheduleToTomorrow` when `nextIndex === 0`
- [ ] Task 3.2: Make timer restart async-aware (await advancement before continuing)
- [ ] Task 3.3: Update `startTimers()` to always start both schedule timers (remove `isLastPrayerPassed` checks)
- [ ] Task 3.4: Keep `startTimerMidnight()` for API data freshness only

### Phase 4: UI Updates - Critical
- [ ] Task 4.1: Remove "All prayers finished" conditional from `components/Timer.tsx`
- [ ] Task 4.2: Update `components/Day.tsx` to use `getDateAtom(type)`

### Phase 4: UI Updates - Animation Components
- [ ] Task 4.3: Update `components/ActiveBackground.tsx` to use schedule-specific date atom
- [ ] Task 4.4: Update `components/Alert.tsx` cascade trigger to use schedule-specific date atom
- [ ] Task 4.5: Update `components/Prayer.tsx` cascade trigger to use schedule-specific date atom
- [ ] Task 4.6: Update `components/PrayerTime.tsx` cascade trigger to use schedule-specific date atom
- [ ] Task 4.7: Update `components/List.tsx` to subscribe to schedule-specific date atom

### Phase 4: UI Updates - Verify Only
- [ ] Task 4.8: Verify `components/ProgressBar.tsx` works correctly (likely no changes)
- [ ] Task 4.9: Verify `stores/overlay.ts` behavior (auto-close handled in Phase 2)

### Phase 5: Verification
- [ ] Task 5.1: Run `tsc --noEmit` - fix any type errors
- [ ] Task 5.2: Run ESLint on modified files
- [ ] Task 5.3: Manual test: Standard schedule transition after Isha
- [ ] Task 5.4: Manual test: Extras schedule transition after Duha
- [ ] Task 5.5: Manual test: Both schedules show different dates correctly
- [ ] Task 5.6: Manual test: Overlay auto-closes during advancement
- [ ] Task 5.7: Manual test: Notifications still fire correctly
- [ ] Task 5.8: Manual test: Cascade animations trigger correctly

### Phase 6: Documentation
- [ ] Task 6.1: Update ADR-002 status to "Superseded"
- [ ] Task 6.2: Create ADR-003 documenting prayer-based day boundary
- [ ] Task 6.3: Update AGENTS.md memory section

---

## Files to Modify

| File | Phase | Status | Changes |
|------|-------|--------|---------|
| `stores/sync.ts` | 1 | 🔲 | Split dateAtom, add helpers |
| `stores/schedule.ts` | 2 | 🔲 | Add advanceScheduleToTomorrow() |
| `stores/timer.ts` | 3 | 🔲 | Update wrap behavior, async handling |
| `components/Timer.tsx` | 4 | 🔲 | Remove "All prayers finished" |
| `components/Day.tsx` | 4 | 🔲 | Use schedule-specific date atom |
| `components/ActiveBackground.tsx` | 4 | 🔲 | Use schedule-specific date atom |
| `components/Alert.tsx` | 4 | 🔲 | Update cascade trigger |
| `components/Prayer.tsx` | 4 | 🔲 | Update cascade trigger |
| `components/PrayerTime.tsx` | 4 | 🔲 | Update cascade trigger |
| `components/List.tsx` | 4 | 🔲 | Update reactivity |
| `components/ProgressBar.tsx` | 4 | 🔲 | Verify only |
| `stores/overlay.ts` | 4 | 🔲 | Verify only |
| `shared/notifications.ts` | 5 | 🔲 | Verify only |
| `stores/notifications.ts` | 5 | 🔲 | Verify only |

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
