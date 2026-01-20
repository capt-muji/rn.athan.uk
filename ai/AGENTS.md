# AGENTS.md - Athan.uk AI Agent Memory

## 0. Scope & Discovery

- **Recursive Logic**: Subdirectory `AGENTS.md` overrides root for that folder
- **Tool Compatibility**: This file is tool-agnostic. Pointers (CLAUDE.md, .cursorrules) redirect here
- **Risk Profile**: Aggressive (fix and report)

## 1. Project North Star

**What we're building:** Athan.uk - A Muslim prayer times app for London with real-time countdown, offline support, and customizable notifications.

**Core Features:**

- Real-time prayer countdown with sub-millisecond precision
- 2-day rolling notification buffer with custom Athan sounds
- Full offline support via MMKV caching
- Large overlay display for visually impaired users
- Year-boundary detection and automatic data refresh

**Non-Goals:**

- Multi-city support (London-only for now)
- User accounts or cloud sync
- Social features

**Invariants:**

- Prayer times must always be accurate (API is source of truth)
- App must work fully offline after first sync
- Notifications must fire on time, even if app is backgrounded

## 2. Stack & Versions

| Category        | Technology              | Version        |
| --------------- | ----------------------- | -------------- |
| Framework       | React Native            | 0.81.5         |
| Platform        | Expo                    | 54.0.31        |
| UI Library      | React                   | 19.1.0         |
| Language        | TypeScript              | 5.9.3 (strict) |
| Routing         | Expo Router             | 6.0.21         |
| State           | Jotai                   | 2.16.1         |
| Storage         | React Native MMKV       | 4.1.1          |
| Animation       | React Native Reanimated | 4.1.6          |
| Audio           | Expo Audio              | 1.1.1          |
| Notifications   | Expo Notifications      | 0.32.16        |
| Dates           | date-fns / date-fns-tz  | 4.1.0 / 3.2.0  |
| Logging         | Pino                    | 9.14.0         |
| Package Manager | Yarn                    | 1.x            |

## 3. Repo Map & Entry Points

```
/
├── app/                    # Expo Router (file-based routing)
│   ├── _layout.tsx        # Root layout - GestureHandler, StatusBar, BottomSheet provider
│   ├── index.tsx          # Home screen
│   ├── Navigation.tsx     # Tab navigation
│   └── Screen.tsx         # Screen wrapper
├── components/            # Reusable UI components
│   ├── Prayer.tsx         # Prayer time display row
│   ├── ProgressBar.tsx    # Countdown progress bar
│   ├── Overlay.tsx        # Large text overlay (accessibility)
│   ├── BottomSheetShared.tsx # Shared bottom sheet utilities (background, backdrop, styles)
│   ├── BottomSheetSettings.tsx # Settings bottom sheet (Masjid icon tap)
│   ├── BottomSheetSound.tsx # Athan sound selector
│   ├── SettingsToggle.tsx # Reusable toggle component for settings
│   ├── Alert.tsx          # Alert component
│   └── Modal*.tsx         # Modal popups (Tips, Times, Update)
├── stores/                # Jotai atoms & state management
│   ├── database.ts        # MMKV storage interface
│   ├── notifications.ts   # Notification scheduling (2-day buffer)
│   ├── sync.ts            # API sync logic
│   ├── timer.ts           # Timer state atoms
│   ├── schedule.ts        # Schedule atoms
│   ├── overlay.ts         # Overlay state
│   ├── version.ts         # App version detection & cache clearing
│   └── ui.ts              # UI state (date, settings)
├── hooks/                 # Custom React hooks
│   ├── useAnimation.ts    # Reanimated animation hook
│   ├── useNotification.ts # Notification management
│   ├── usePrayer.ts       # Prayer data hook
│   └── useSchedule.ts     # Schedule hook
├── shared/                # Utility functions
│   ├── logger.ts          # Pino logger instance
│   ├── time.ts            # Time calculations
│   ├── notifications.ts   # Notification utilities
│   └── types.ts           # TypeScript interfaces
├── device/                # Platform-specific code
├── mocks/                 # Test fixtures & schema documentation
│   ├── simple.ts          # Mock API data for development testing
│   ├── full.ts            # Full year mock data
│   └── timing-system-schema.ts  # NEW: Data structure reference for timing overhaul
├── assets/                # Icons, images, audio (16 Athan sounds)
└── ai/               # AI agent documentation
```

**Key Entry Points:**

- App entry: `expo-router/entry` (auto-generated)
- Root layout: `app/_layout.tsx` (initializes providers, triggers sync)
- State entry: `stores/` (Jotai atoms)
- Database: `stores/database.ts` (MMKV wrapper)

**Key Data Flow:**

```
API Fetch → Process (strip old dates, add derived prayers) → Cache in MMKV → Display with Reanimated timers → Schedule notifications
```

## 4. Golden Paths (How We Do X)

### State Management (Jotai)

- Atoms defined in `stores/*.ts`
- Use `atomWithStorage` for persisted state
- Use `createJSONStorage` with MMKV backend
- Example: `stores/ui.ts`, `stores/timer.ts`

### Storage (MMKV)

- Use wrapper in `stores/database.ts`
- Keys: `prayer_YYYY-MM-DD`, `scheduled_notifications_*`, `preference_*`
- Always use structured keys with prefixes

### Logging (Pino)

- Import from `shared/logger.ts`
- Never use `console.log` (ESLint forbids it)
- Use structured logging: `logger.info({ context }, 'message')`

### Animation (Reanimated 4)

- Use worklets for performance
- Example: `hooks/useAnimation.ts`
- Shared values with `useSharedValue`

### Components

- Functional components only (no class components)
- Use hooks for logic extraction
- Follow Expo Router file-based routing conventions

### Error Handling

- Use `try/catch` for async operations
- Display errors via `components/Alert.tsx`
- Log errors with Pino before displaying

### Imports

```typescript
// 1. External (React, libraries)
import { useState } from 'react';
import { useAtom } from 'jotai';

// 2. Internal (@/ alias)
import { logger } from '@/shared/logger';
import { Prayer } from '@/components/Prayer';
```

## 5. File Types & Locations

| Type         | Location                            | Naming                        |
| ------------ | ----------------------------------- | ----------------------------- |
| Components   | `components/`                       | PascalCase.tsx                |
| Hooks        | `hooks/`                            | useCamelCase.ts               |
| Stores       | `stores/`                           | camelCase.ts                  |
| Utilities    | `shared/`                           | camelCase.ts                  |
| Types        | `shared/types.ts`                   | Centralized                   |
| Tests        | Co-located                          | `*.test.ts`                   |
| **Features** | `ai/features/[name]/description.md` | **User-written requirements** |
| **Progress** | `ai/features/[name]/progress.md`    | **AI-generated task tracker** |
| **Archive**  | `ai/features/archive/[name]/`       | **Completed features**        |
| ADRs         | `ai/adr/`                           | NNN-title.md                  |

## 6. Commands (Copy/Paste Ready)

### Development

```bash
yarn start              # Start Expo dev server (clears cache)
yarn ios               # Build and run on iOS simulator
yarn android           # Build and run on Android emulator
yarn reset             # Full clean: rm builds, reinstall, start fresh
yarn clean             # Clear cache and node_modules
```

### File-Scoped (Fast)

```bash
eslint src/foo.ts                    # Lint single file
prettier --write src/foo.ts          # Format single file
tsc --noEmit                         # Typecheck project
```

### Pre-commit (Automatic)

- Husky + lint-staged runs Prettier and ESLint on staged files

## 7. Boundaries & Permissions (Three-Tier)

### Always Do

- Read files, list files
- Run file-scoped lint/test/typecheck
- Clean up empty files/folders created this session
- Match existing code patterns

### Ask First

- Install dependencies
- Delete non-empty files
- Modify MMKV schema keys
- Change notification scheduling logic
- Modify app.json or eas.json

### Never Do

- Commit secrets/keys
- Edit node_modules
- Remove failing tests
- Modify CI configuration
- Run blocked commands (see Safety section in init.md)
- Create shell script workarounds
- Use `console.log` (use Pino logger)

## 8. Consistency & Best Practices

### Prime Directive: Match Existing Patterns

1. **Read Before Writing**: Examine 2-3 similar files first
2. **Pattern Matching**: Code must be indistinguishable from existing codebase
3. **Zero New Patterns**: No new libraries without approval
4. **Consistency > Cleverness**: Use existing approach even if you know a "better way"

### React Native / Expo Patterns

- Functional components with hooks
- Jotai for state (not Redux, not Context for global state)
- MMKV for storage (not AsyncStorage)
- Reanimated for animations (not Animated API)
- Expo Router for navigation (file-based)

### TypeScript

- Strict mode enabled
- Path alias: `@/*` maps to project root
- Types centralized in `shared/types.ts`

### Formatting (Prettier)

- Print width: 120
- Tab width: 2 spaces
- Single quotes
- Semicolons required
- Trailing commas (es5)

## 9. Agentic Protocol (Loop Discipline)

1. **Plan First**: Outline steps before executing
2. **Track Session Changes**: Maintain list of files created
3. **Minimal Diffs**: Small, focused changes only
4. **Test After Edit**: Run relevant checks after each change
5. **Loop Awareness**: 2 failed attempts → STOP and ask
6. **Report Evidence**: Show commands run + outputs
7. **Cleanup Before Exit**: Remove empty files/folders

## 10. Orchestrator + Specialists + Skills

### Orchestrator Responsibilities

- Decompose work into tasks
- Route to appropriate specialist
- Guide user through proper workflow
- Verify outputs against criteria
- Enforce consistency
- Track session artifacts
- Pre-exit cleanup

### Specialist Roles

**CRITICAL: Implementer Workflow**

- NEVER run compile/typecheck commands (tsc, yarn tsc, etc.)
- After implementation, swap to ReviewerQA to verify code consistency
- Always ask user to test manually when 100% confident code works

| Specialist  | Responsibility              | When to Use              |
| ----------- | --------------------------- | ------------------------ |
| RepoMapper  | Discover codebase structure | New repo, onboarding     |
| Architect   | Plan features, draft specs  | New feature, complex bug |
| Implementer | Write production code       | After spec approved      |
| TestWriter  | Create test coverage        | After implementation     |
| ReviewerQA  | Security/quality review     | Before merge             |

### Decision Tree

- **New feature?** → Architect (spec) → Implementer → TestWriter
- **Bug with error?** → Implementer + TestWriter
- **Bug without error?** → Architect (trace logic)
- **Refactor?** → ReviewerQA (risks) → Implementer

### Skills

- APIContract, SecurityAudit, PerformanceProfile, DocumentationAudit, ConsistencyAudit, CleanupAudit

## 11. Memory / Lessons Learned (Append-Only)

> **Archive:** Older entries (pre-2026-01-17) moved to `ai/memory-archive.md`

- [2026-01-17] Midnight Prayer Feature: Added "Midnight" as first extra prayer (midpoint between Maghrib and Fajr). Follows same pattern as Last Third calculation: uses yesterday's Maghrib + today's Fajr. No time adjustment applied (pure midpoint). Updated EXTRAS_ENGLISH/ARABIC arrays (now 5 prayers), ISTIJABA_INDEX from 3→4. Added getMidnightTime() in shared/time.ts, integrated in transformApiData() pipeline. Updated ModalTimesExplained.tsx with description, README documentation (5 extra prayers), and mocks/simple.ts with testing comments. Order: Midnight, Last Third, Suhoor, Duha, Istijaba. ReviewerQA grade: A- (93%) - zero breaking changes, seamless integration with notifications/schedule/timer systems. Ready for manual test.
- [2026-01-17] Notification Rolling Window: Reduced NOTIFICATION_ROLLING_DAYS from 3 to 2 and NOTIFICATION_REFRESH_HOURS from 24 to 12 to minimize scheduled notifications and improve app responsiveness. Updated: shared/constants.ts (NOTIFICATION_ROLLING_DAYS = 2, NOTIFICATION_REFRESH_HOURS = 12), ai/adr/001-rolling-notification-buffer.md (status and math tables), AGENTS.md (Core Features and repo map), README.md (notification system docs). User benefit: fewer scheduled notifications, better app performance, faster refresh cycle. (see ai/adr/001-rolling-notification-buffer.md)
- [2026-01-17] Overlay Date Display: Changed from "Today/Tomorrow" text to formatted date (EEE, d MMM yyyy) to match Day.tsx. Single file change in components/Overlay.tsx - added formatDateLong import and replaced conditional text with {formatDateLong(selectedPrayer.date)}. Date follows prayer-based day boundary automatically (no additional logic needed). QA reviewed and approved.
- [2026-01-17] Prayer Explanations: Replaced ModalTimesExplained modal (all at once) with contextual explanations in Overlay (one at a time). Users now tap on Extra prayers to see their explanations. Removed ModalTimesExplained component, modal trigger from Navigation.tsx, and related state from stores/ui.ts. Added EXTRAS_EXPLANATIONS constant. Explanations: Midnight (midpoint Magrib-Fajr), Last Third (5 mins after last third begins), Suhoor (40 mins before Fajr), Duha (20 mins after Sunrise), Istijaba (59 mins before Magrib on Fridays). Created ADR-003 for architectural decision. (see ai/adr/003-prayer-explanation-modal-removal.md)
- [2026-01-17] ProgressBar: Added three-color stoplight system (green/orange/red) with discrete color changes at 20% and 10% thresholds. Warning glow now covers entire warning period (≤20%). Uses discrete color state (0=green, 1=orange, 2=red) with 500ms transitions for instant color swaps at thresholds, not smooth gradients.
- [2026-01-17] App Version-Based Cache Clearing: Implemented automatic cache clearing on app upgrades while preserving user preferences. Created stores/version.ts with handleAppUpgrade() entry point (race condition guard, semver comparison, first install detection). Clears cache on version increase only (not downgrades). Clears: prayer**, display_date*, fetched_years, scheduled_notifications*_, measurements\__, prayer*max_english_width*_, popup*update_last_check. Preserves: preference_alert*_, preference*sound, preference_mute*\*, preference_progressbar_visible, popup_tip_athan_enabled. New MMKV key: app_installed_version (tracks current version). Modified stores/sync.ts to call handleAppUpgrade() at start of sync(). Updated README with upgrade behavior documentation. Solves issue where users had to uninstall/reinstall app after updates to get clean cache. Ready for manual testing (fresh install, upgrade test, no-change test).
- [2026-01-17] Prayer Time Display Bug Fixes: Fixed 4 critical bugs related to prayer-based day boundary implementation: (1) Schedule advancement on app load - initializeAppState() now checks if last prayer has passed and advances schedules before starting timers (handles app opened after Isha/Duha), (2) ActiveBackground visibility - removed shouldHide logic that incorrectly hid blue background when nextIndex === 0 after schedule advancement, (3) isPassed calculation - fixed to check BOTH date AND time (todayPrayer.date === today && isTimePassed(time)) preventing false positives when schedule has advanced, (4) Countdown calculation - added yesterdayPrayer fallback for advanced schedules (handles Extras where Midnight is still upcoming after Duha passes). Core principle: Schedule advancement changes dates, so all time-based checks must verify date matches current day. Modified: stores/sync.ts, components/ActiveBackground.tsx, hooks/usePrayer.ts, shared/time.ts.
- [2026-01-18] Day Boundary ADR-004: Comprehensive prayer-based timing documentation superseding ADR-002. Documents 14 scenarios including critical edge cases: Isha after system midnight, Midnight prayer timing, both schedules on different dates, yesterday fallback for Extras, isPassed calculation after advancement. Key files: shared/time.ts (calculateCountdown), stores/schedule.ts (advanceScheduleToTomorrow), stores/sync.ts (initializeAppState), stores/timer.ts. Core principles: NO 00:00 reset, prayer times are immutable, schedules are independent, timer always visible. (see ai/adr/004-prayer-based-day-boundary.md)
- [2026-01-18] Timing System Overhaul (PLANNED - QA APPROVED): Major architectural refactor from date-centric to prayer-centric model. **Root cause identified**: The old system stored prayers as `{ date: "2026-06-21", time: "01:00" }` and `isTimePassed("01:00")` at 11pm returned TRUE because it compared times without dates. This caused: (1) Isha at 1am incorrectly marked "passed" at 11pm, (2) Midnight prayer wrong countdown, (3) Active background highlighting wrong prayer. **Solution**: New system uses full DateTime objects: `{ datetime: new Date("2026-06-22T01:00:00"), belongsToDate: "2026-06-21" }`. Now `datetime > now` is unambiguous—no midnight-crossing bugs possible. **Key changes**: Single sorted prayer array replaces yesterday/today/tomorrow maps; derived state replaces manual nextIndex; 1-line countdown vs 40+ lines with fallback; `isPassed = datetime < now` vs date+time string comparison. **Migration**: Parallel models with divergence detection (warns if >2s difference). **Implementation**: 72 tasks across 8 phases, rollback strategy defined, critical checkpoints before cleanup. (see ai/adr/005-timing-system-overhaul.md, ai/features/timing-system-overhaul/)
- [2026-01-19] Timing System Bugfixes (PLANNED - QA APPROVED 100/100): Post-refactor testing revealed 5 bugs. **Bug 1 - Midnight not showing**: refreshSequence() removed ALL passed prayers, but Midnight has belongsToDate for current Islamic day. Fix: Keep passed prayers for current displayDate (memory-safe). **Bug 2 - Overlay wrong prayer**: startTimerOverlay() didn't have tomorrow prayer fallback like usePrayer.ts. Fix: Match usePrayer.ts logic exactly. **Bug 3 - Progress bar 0%**: createPrayerDatetime() used system-local timezone but createLondonDate() used London timezone. Fix: Use formatInTimeZone for London timezone consistency. **Bug 4 - Require cycles**: 3 circular dependencies (2 notification, 1 overlay/timer). Fix: Dependency injection for notifications, extract overlayAtom to separate file. **Bug 5 - Store mutation warning**: getNextPrayer() called refreshSequence() during atom read. Fix: Make getNextPrayer() pure read-only. **Key lessons**: (1) Timezone consistency is critical, (2) belongsToDate (Islamic day) can differ from datetime (actual time), (3) Don't remove passed prayers that belong to current display date, (4) Avoid store mutations in atom reads, (5) Store functions must match hook fallback logic. (see ai/features/timing-system-bugfixes/plan.md)
- [2026-01-19] **Isha Display Bug (OPEN - Under Investigation)**: Critical bug discovered during post-refactor testing. **Symptoms**: When Isha is next prayer, only Isha renders - Fajr through Maghrib missing. Also: Isha shows +1 hour offset, prayers vanish on Maghrib→Isha transition, Isha disappears after its countdown finishes. **Root cause hypotheses**: (1) Isha's `belongsToDate` mismatch causing filter `p.belongsToDate === displayDate` to exclude other prayers, (2) Timezone double-conversion in `createPrayerDatetime()` causing +1 hour offset. **Attempted fixes that didn't work**: Changed to `fromZonedTime()`, added `getLondonHours()` helper, updated `calculateBelongsToDate()` to use London hours. **Key files**: shared/prayer.ts (calculateBelongsToDate), shared/time.ts (createPrayerDatetime), stores/schedule.ts (createDisplayDateAtom), hooks/useSchedule.ts (filter). **Next steps**: Add diagnostic logging to trace exact values, create minimal reproduction, test timezone handling. (see ai/features/isha-display-bug/)
- [2026-01-20] **Settings Bottom Sheet Feature**: Added settings accessible via Masjid icon tap. **Components**: BottomSheetSettings.tsx (main settings sheet), SettingsToggle.tsx (reusable toggle), BottomSheetShared.tsx (shared utilities extracted from BottomSheetSound.tsx - renderSheetBackground, renderBackdrop, bottomSheetStyles). **Features**: Progress bar toggle (uses existing progressBarVisibleAtom), Hijri date toggle (hijriDateEnabledAtom persisted to MMKV), "Change Athan Sound" button (opens BottomSheetSound). **Hijri formatting**: Uses native Intl.DateTimeFormat with 'en-US-u-ca-islamic-umalqura' calendar, removes "AH" suffix via regex. **MMKV keys**: preference_progressbar_visible, preference_hijri_date (both preserved on app upgrade). **Entry point**: Masjid.tsx wraps SVG in Pressable, disabled when overlay active. **Registration**: app/\_layout.tsx registers BottomSheetSettings in BottomSheetModalProvider. **Refactoring**: Extracted shared bottom sheet code to reduce duplication between BottomSheetSettings and BottomSheetSound. **Removed redundant interactions**: Timer tap-to-toggle progress bar (now in Settings), Alert long-press to open sound sheet (now "Change Athan Sound" button in Settings).

## 12. Change / PR Checklist

- [ ] Diff is small and focused
- [ ] File-scoped checks green (lint/format/typecheck)
- [ ] Consistency verified: Code matches existing patterns
- [ ] No new dependencies without approval
- [ ] No empty files/folders left behind
- [ ] Tests added/updated for new behavior
- [ ] Inline docs added (JSDoc for public functions)
- [ ] README updated if feature/API changed
- [ ] No secrets, API keys, or verbose logging committed
- [ ] No blocked commands in code or scripts
- [ ] Brief summary + how to verify

## 13. Session Lifecycle

### Session Start

1. Load this file (ai/AGENTS.md)
2. Initialize session artifact tracker
3. Acknowledge: "Context loaded. Operating as Orchestrator. Ready."
4. Ask: "What's the goal for this session?"

### Session End

1. Cleanup: Remove empty files/folders created this session
2. Summary: What was done, verification steps, what's next
3. Documentation check: Did we update README if needed?
4. Memory check: Did we learn something new?
5. Git reminder: User handles commits manually

## 14. Anti-Patterns (What NOT To Do)

- Do not explain the entire codebase every message
- Do not run full build for small changes
- Do not loop endlessly (2 attempts → stop)
- Do not commit console.logs or commented code
- Do not create new patterns without updating this file
- Do not use console.log (use Pino logger)
- Do not leave empty files or folders behind
- Do not assume user knows the workflow

## 15. Documentation Standards

### When to Document

- **Always**: Public APIs, exported functions, complex algorithms
- **Usually**: Internal functions with side effects
- **Never**: Self-explanatory code, simple getters/setters

### Comment Quality

```typescript
// Good: Explains WHY
// Safari doesn't support lookbehind regex, using workaround
const result = safariCompatibleRegex(input);

// Bad: Explains WHAT (obvious from code)
// Loop through users
for (const user of users) { ... }
```

### README Update Triggers

- Adding user-facing feature
- Changing installation/setup
- Modifying environment variables
- Updating CLI commands
