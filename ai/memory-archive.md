# Memory Archive - Athan.uk

Archived memory entries from ai/AGENTS.md. These are older lessons learned that remain valid but were moved to reduce main file length.

---

## 2026-01-15: Project Initialization

- **Init**: Repository initialized with AI agent workflow system

- **Notifications**: Use rolling window, not background refresh—both iOS and Android throttle background tasks unreliably (see ai/adr/001-rolling-notification-buffer.md)

- **Day Boundary (Superseded)**: Use English midnight (00:00) for date reset—user familiarity over Islamic day boundary; known edge cases deferred (see ai/adr/002-english-midnight-day-boundary.md). **Note: Superseded by ADR-004 prayer-based day boundary.**

- **Notifications**: Reminder feature will require reducing rolling window to 3 days (IMPLEMENTED 2026-01-17) (see ai/adr/001-rolling-notification-buffer.md)

---

## 2026-01-16: Islamic Day Boundary & Environment

- **Day Boundary**: SUPERSEDING ADR-002—switching to prayer-based day boundary (after Isha for Standard, after Duha/Istijaba for Extras). Timer/countdown always visible, no "All prayers finished" state. Each schedule has independent date atom. (see ai/features/islamic-day-boundary/description.md)

- **Planning**: Use RepoMapper before ReviewerQA—verify all affected files before auditing plan for risks. Found 14 files vs original 5 in islamic-day-boundary feature.

- **Islamic Day Boundary**: IMPLEMENTATION COMPLETE, awaiting manual test. Modified 10 files: stores/sync.ts (split dateAtom), stores/schedule.ts (advanceScheduleToTomorrow), stores/timer.ts (wrap behavior), components/Timer.tsx (removed finished state), Day/ActiveBackground/Alert/Prayer/PrayerTime/List.tsx (schedule-specific date atoms). Next: manual test, then create ADR-003. (see ai/features/islamic-day-boundary/progress.md)

- **Environment Config**: Centralized ALL environment variables into shared/config.ts. All process.env access now in one file: APP_CONFIG (isDev, env, apiKey, iosAppId, androidPackage) and helpers (isProd, isPreview, isLocal). Updated: shared/logger.ts, api/config.ts, device/updates.ts, stores/sync.ts.

- **Development Workflow**: NEVER compile/typecheck during implementation—always ask user to test manually. Updated instructions in AGENTS.md specialist section.

- **ProgressBar Midnight Bug**: Fixed empty progress bar at midnight (00:00-05:00). CRITICAL: NO FALLBACKS, NO DEFENSIVE CODE - data layer ALWAYS provides yesterday data, UI layer trusts the data. Added `yesterday` to ScheduleStore, MANDATORY fetch of previous year on Jan 1, ProgressBar is now clean (no checks, no throws, no fallback). Modified 5 files: shared/types.ts (added yesterday), stores/schedule.ts (buildDailySchedules), components/ProgressBar.tsx (clean pure calculation), stores/sync.ts (Jan 1 MANDATORY fetch), api/client.ts (specificYear param). Awaiting manual test. (see ai/features/progressbar-midnight-fix/progress.md)

- **NO FALLBACKS Rule**: When data is missing, throw error (fix root cause) - do not approximate or fallback. Fallbacks mask real problems, provide inaccurate data to users, and make debugging impossible. Correct approach: Ensure data layer always has required data, UI layer trusts the data layer. (see ai/features/progressbar-midnight-fix/description.md)

- **ProgressBar Bug Fixes**: QA review found 2 CRITICAL bugs in initial implementation: (1) sync.ts Jan 1 fetch discarded data without saving to database, (2) schedule.ts advanceScheduleToTomorrow() didn't shift yesterday. Both fixed. Refactoring applied: variable naming consistency (dataToday → todayData), logger prefix consistency (SCHEDULE:), removed circular import in types.ts. Implementation grade: A- (95%). Ready for manual test.

- **Code Simplification Refactoring**: (1) Consolidated 3 API functions (fetchPreviousYear, fetchCurrentYear, fetchCurrentAndNextYear) into 1 flexible fetchYear() function. Trade-off: lost explicit scenario docs for simpler API surface. (2) Removed deprecated fetchPrayerData function (zero usage). (3) Extracted parseTimeToSeconds to shared/time.ts from ProgressBar.tsx for reusability. (4) Removed error checking in buildDailySchedules (trust data layer always has data). Modified: api/client.ts, stores/sync.ts (3 callers updated), shared/time.ts, components/ProgressBar.tsx, stores/schedule.ts. QA grade: A- (94%) after fixing import ordering. Prioritized simplicity over type safety/explicitness per user request.

- **README Update**: Documented prayer-based day boundary and ProgressBar scenarios comprehensively. Added 5 ProgressBar scenarios: (1) Normal day operation, (2) After midnight before Fajr using yesterday's data, (3) Prayer-based day boundary for Standard/Extras schedules, (4) January 1st edge case with mandatory previous year fetch, (5) December 31st to January 1st transition. Updated features list, data flow, timer system, and MMKV storage keys (display_date split into display_date_standard/extra). Removed outdated midnight reset references, replaced with Islamic midnight (prayer-based) documentation.

- **Midnight Timer Removal**: Removed redundant midnight timer that ran every second checking for date changes. The timer called sync() at 00:00 but sync() already checks needsDataUpdate() and only fetches when needed. Other triggers (app launch, resume, schedule advancement) cover all data freshness scenarios. Removed startTimerMidnight(), removed 'midnight' from TimerKey type, updated README timer section from 4 to 3 timers. Slight battery improvement from fewer intervals running.

- **Retry Logic Removal**: Removed defensive retry logic in advanceScheduleToTomorrow() that called sync() if dayAfterTomorrow data was missing. With prayer-based day boundary, data should always be available (entire year cached). If missing, let it throw - the app's "refresh me" button handles cache issues. Follows NO FALLBACKS rule: fix root cause, don't mask problems.

- **Progress Bar Toggle**: Implemented tap-to-toggle visibility for progress bar. Tap anywhere on timer component (prayer name, time, or bar) to hide/show progress bar with 250ms fade animation. Medium haptic feedback on tap (matches alert icons). Default visible, persisted via progressBarVisibleAtom (preference_progressbar_visible in MMKV). Opacity initializes to correct state on app load (no flash). Only active on main screen (overlay timer unchanged). Modified: stores/ui.ts (added atom), components/Timer.tsx (Pressable wrapper + Medium haptic), components/ProgressBar.tsx (opacity with first-render skip), stores/database.ts (added to cleanup function). Uses opacity (not DOM removal) to maintain layout alignment.

---

## 2026-01-17: Core Features & UI Updates

### Midnight Prayer Feature
- Added "Midnight" as first extra prayer (midpoint between Maghrib and Fajr)
- Follows same pattern as Last Third calculation
- Updated EXTRAS_ENGLISH/ARABIC arrays (now 5 prayers)
- ISTIJABA_INDEX from 3→4
- Added getMidnightTime() in shared/time.ts
- ReviewerQA grade: A- (93%)

### Notification Rolling Window
- Reduced NOTIFICATION_ROLLING_DAYS from 3 to 2
- Reduced NOTIFICATION_REFRESH_HOURS from 24 to 12
- Fewer scheduled notifications, better app performance

### Overlay Date Display
- Changed from "Today/Tomorrow" to formatted date (EEE, d MMM yyyy)
- Single file change in components/Overlay.tsx
- QA reviewed and approved

### Prayer Explanations
- Replaced ModalTimesExplained modal with contextual overlay explanations
- Users tap Extra prayers to see explanations
- Added EXTRAS_EXPLANATIONS constant
- Created ADR-003 for architectural decision

### ProgressBar Three-Color System
- Added green/orange/red stoplight with discrete color changes at 20%/10%
- Warning glow covers entire warning period (≤20%)

### App Version-Based Cache Clearing
- Created stores/version.ts with handleAppUpgrade()
- Clears cache on version increase, preserves user preferences
- New MMKV key: app_installed_version

### Prayer Time Display Bug Fixes
- Fixed 4 critical bugs: schedule advancement, ActiveBackground visibility, isPassed calculation, countdown calculation
- Core principle: Schedule advancement changes dates, verify date matches current day

---

## 2026-01-18: Day Boundary & Timing System

### Day Boundary ADR-004
- Comprehensive prayer-based timing documentation
- Supersedes ADR-002 (English midnight)
- 14 documented edge scenarios
- Core principles: NO 00:00 reset, prayer times immutable, schedules independent, timer always visible

### Timing System Overhaul (PLANNED)
- Major architectural refactor from date-centric to prayer-centric model
- Root cause: Time-only comparison bug caused midnight-crossing issues
- Solution: Full DateTime objects with belongsToDate for Islamic day
- 72 tasks across 8 phases with parallel migration strategy
- ADR-005 documentation created

---

## 2026-01-19: Bug Fixes & Critical Issues

### Timing System Bugfixes
- Post-refactor testing revealed 5 bugs
- Bug 1: Midnight not showing (refreshSequence removed passed prayers)
- Bug 2: Overlay wrong prayer (missing tomorrow fallback)
- Bug 3: Progress bar 0% (timezone inconsistency)
- Bug 4: Require cycles (circular dependencies)
- Bug 5: Store mutation warning (getNextPrayer not pure)
- ReviewerQA score: 100/100

### Isha Display Bug (UNDER INVESTIGATION)
- Critical: Standard schedule only shows Isha when next
- Symptoms: Missing prayers, +1 hour offset, prayers vanish on transition
- Root cause hypotheses: belongsToDate mismatch, timezone double-conversion
- Attempted fixes didn't resolve - investigation ongoing

---

## 2026-01-20: Settings & Code Quality

### Settings Bottom Sheet Feature
- Added settings accessible via Masjid icon tap
- Components: BottomSheetSettings.tsx, SettingsToggle.tsx, BottomSheetShared.tsx
- Features: Progress bar toggle, Hijri date toggle, Athan sound selector
- Hijri formatting using Intl.DateTimeFormat
- Removed redundant timer tap-to-toggle, Alert long-press

### Codebase Cleanup & Optimization
- Phase 1 SKIPPED: Original cleanup plan outdated (code was in use)
- Phase 2: Refactored 6 animation hooks, eliminated 80+ lines duplication
- Phase 3: Added TIME_CONSTANTS, ISLAMIC_DAY, extracted notification lock pattern
- Phase 4: Broke down createPrayerSequence() and refreshSequence()
- Phase 5: Added comprehensive JSDoc to time utility functions
- Results: ~100 lines duplication eliminated, +150 lines documentation, zero errors
