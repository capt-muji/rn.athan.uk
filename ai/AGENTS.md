# AGENTS.md - Athan.uk AI Agent Memory

## 0. Scope & Discovery

- **Recursive Logic**: Subdirectory `AGENTS.md` overrides root for that folder
- **Tool Compatibility**: This file is tool-agnostic. Pointers (root AGENTS.md, .cursorrules) redirect here
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

| Category        | Technology              | Version         |
| --------------- | ----------------------- | --------------- |
| Framework       | React Native            | 0.86.3          |
| Platform        | Expo                    | 57.0.17         |
| UI Library      | React                   | 19.2.3          |
| Language        | TypeScript              | 7.0.2 (strict)  |
| Routing         | Expo Router             | ~57.0.17        |
| State           | Jotai                   | 2.20.3          |
| Storage         | React Native MMKV       | 4.3.2           |
| Animation       | React Native Reanimated | 4.5.1           |
| Audio           | Expo Audio              | ~57.0.4         |
| Notifications   | Expo Notifications      | ~57.0.15        |
| Dates           | date-fns / date-fns-tz  | 4.4.0 / 3.2.0   |
| Widgets         | expo-widgets            | ~57.0.15        |
| Widget UI       | @expo/ui (SwiftUI)      | ~57.0.14        |
| Logging         | Pino                    | 9.14.0          |
| Lint + Format   | Biome                   | 2.5.11          |
| Package Manager | Yarn                    | 1.x             |

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
│   ├── CountdownBar.tsx    # Countdown progress bar
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
│   ├── countdown.ts           # Countdown state atoms
│   ├── schedule.ts        # Schedule atoms
│   ├── overlay.ts         # Overlay state
│   ├── version.ts         # App version detection & cache clearing
│   ├── ui.ts              # UI state (date, settings)
│   └── widget.ts          # Widget IO layer: reads cache + prefs, pushes timelines (iOS)
├── widgets/               # iOS widget LAYOUTS only ('widget'-directive functions, serialized at build)
│   ├── PrayerWidget.tsx   # Home screen widget (systemSmall trio; systemMedium adds the day's six prayers with the active pill)
│   └── LockPrayerWidget.tsx # Lock Screen widget (accessoryRectangular/Inline; circular registered but renders blank)
├── hooks/                 # Custom React hooks
│   ├── useAnimation.ts    # Reanimated animation hook
│   ├── useNotification.ts # Notification management
│   ├── usePrayer.ts       # Prayer data hook
│   └── useSchedule.ts     # Schedule hook
├── shared/                # Utility functions
│   ├── logger.ts          # Pino logger instance
│   ├── time.ts            # Time calculations (parseNightBoundaries helper)
│   ├── notifications.ts   # Notification utilities
│   ├── types.ts           # TypeScript interfaces
│   ├── widgetTimeline.ts  # PURE widget timeline builder (no RN imports)
│   ├── widgetTypes.ts     # Widget props contract + settings snapshot types
│   ├── __tests__/         # Unit tests (Jest) incl. widget contract & simulation suites
│   └── __mocks__/         # Module mocks for testing
├── device/                # Platform-specific code
├── mocks/                 # Test fixtures
│   ├── simple.ts          # Launch-relative mock API data (dev mode)
│   ├── full.ts            # Full-year reference dataset (structure reference, unused)
│   └── timing-system-schema.ts  # Timing system type reference (unused)
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
API Fetch → Process (strip old dates, add derived prayers) → Cache in MMKV → Display with Reanimated countdowns → Schedule notifications
```

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   APP                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Screens   │    │ Components  │    │   Hooks     │    │   Stores    │  │
│  │  app/*.tsx  │───▶│ components/ │◀───│  hooks/     │◀───│  stores/    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘  │
│                                                                   │         │
│  ┌────────────────────────────────────────────────────────────────┼───────┐ │
│  │                         SHARED LAYER                           │       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │       │ │
│  │  │ time.ts  │  │prayer.ts │  │  types   │  │constants │       │       │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │       │ │
│  └────────────────────────────────────────────────────────────────┼───────┘ │
│                                                                   │         │
│  ┌────────────────────────────────────────────────────────────────▼───────┐ │
│  │                         DEVICE LAYER                                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │ MMKV Storage │  │ Notifications│  │   Updates    │                 │ │
│  │  │  database.ts │  │   device/    │  │   device/    │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**File Dependency Map:**

```
Prayer Display Flow:
  stores/schedule.ts (atoms)
    └─▶ hooks/useSchedule.ts
         └─▶ hooks/usePrayer.ts
              └─▶ components/Prayer.tsx
                   └─▶ components/PrayerTime.tsx, PrayerAgo.tsx, Alert.tsx

Countdown Flow:
  stores/countdown.ts (atoms)
    └─▶ hooks/useCountdown.ts
         └─▶ components/Countdown.tsx
    └─▶ hooks/useCountdownBar.ts
         └─▶ components/CountdownBar.tsx

Notification Flow:
  shared/notifications.ts (utilities)
    └─▶ stores/notifications.ts (scheduling logic)
         └─▶ hooks/useNotification.ts
              └─▶ components/Alert.tsx

Settings Flow:
  stores/ui.ts (preference atoms)
    └─▶ components/BottomSheetSettings.tsx
         └─▶ components/SettingsToggle.tsx, ColorPickerSettings.tsx

Data Sync Flow:
  api/client.ts
    └─▶ stores/sync.ts
         └─▶ stores/database.ts (MMKV)
              └─▶ stores/schedule.ts
```

## 4. Golden Paths (How We Do X)

### State Management (Jotai)

- Atoms defined in `stores/*.ts`
- Use `atomWithStorage` for persisted state
- Use `createJSONStorage` with MMKV backend
- Example: `stores/ui.ts`, `stores/countdown.ts`

### Storage (MMKV)

- Use wrapper in `stores/database.ts`
- Keys: `prayer_YYYY-MM-DD`, `scheduled_notifications_*`, `preference_*`
- Always use structured keys with prefixes

### Logging (Pino)

- Import from `shared/logger.ts`
- Never use `console.log` (Biome `noConsole` forbids it)
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

### Testing (Jest)

- Use Jest with babel-jest + @babel/preset-typescript (transform-only; typecheck lives in `tsc --noEmit`)
- Tests in `__tests__/` subdirectories
- Run: `yarn test` or `yarn test:watch`
- Mock RN modules in `shared/__mocks__/`
- Babel hoists ESM imports above `jest.mock` factories: reference mock variables only via `mock`-prefixed
  names, and `require()` the module under test after mock declarations when the factory closes over them### Component Communication Patterns

**forwardRef + useImperativeHandle (Child exposes state to parent):**

Use when a parent component needs to read internal state from a child component (e.g., for deferred commit on modal close). This is a new pattern for this codebase - use sparingly.

```typescript
// Child component (AlertMenu.tsx)
import { forwardRef, useImperativeHandle, useState } from 'react';

export interface AlertMenuRef {
  getCurrentState: () => AlertMenuState;
}

export const AlertMenu = forwardRef<AlertMenuRef, Props>(({ type, index }, ref) => {
  const [atTimeAlert, setAtTimeAlert] = useState<AlertType>(AlertType.Off);
  const [reminderAlert, setReminderAlert] = useState<AlertType>(AlertType.Off);

  useImperativeHandle(ref, () => ({
    getCurrentState: () => ({ atTimeAlert, reminderAlert }),
  }));

  return <View>...</View>;
});

// Parent component (Alert.tsx)
import { useRef } from 'react';
import { AlertMenu, AlertMenuRef } from './AlertMenu';

const alertMenuRef = useRef<AlertMenuRef>(null);

const handleClose = () => {
  const state = alertMenuRef.current?.getCurrentState();
  // Compare with original state and commit if changed
};

return <AlertMenu ref={alertMenuRef} type={type} index={index} />;
```

### Refactoring Patterns

**Helper Function Extraction:**

- Extract duplicated logic into named helper functions
- Keep helpers private (not exported) when used in one file
- Add JSDoc with `@example` for reusable helpers
- Example: `parseNightBoundaries()` in `shared/time.ts`

**Section Comments:**

```typescript
// =============================================================================
// SECTION NAME
// =============================================================================
```

**Animation Hook Extraction:**

- Complex animation logic goes in dedicated hooks
- Hooks return animation values + control functions
- Example: `useAlertAnimations.ts`, `useAlertPopupState.ts`

**Concurrent Operation Protection:**

- Use lock patterns for scheduling/async operations
- Example: `withSchedulingLock()` in `stores/notifications.ts`

### Task Recipes

#### Add a New Setting Toggle

1. **Add atom** in `stores/ui.ts`:

   ```typescript
   export const mySettingAtom = atomWithStorage('preference_my_setting', false, storage);
   ```

2. **Add to BottomSheetSettings.tsx**:

   ```typescript
   const [mySetting, setMySetting] = useAtom(mySettingAtom);
   // Add SettingsToggle component in JSX
   <SettingsToggle
     icon={<MyIcon />}
     label="My Setting"
     value={mySetting}
     onValueChange={setMySetting}
   />
   ```

3. **Use in components** via `useAtomValue(mySettingAtom)`

#### Add a New Notification Type

1. **Add alert atom** in `stores/notifications.ts`:

   ```typescript
   // Follow existing pattern for prayer alerts
   export const myAlertAtom = atomWithStorage('alert_my_type', AlertType.Off, storage);
   ```

2. **Add scheduling logic** in `stores/notifications.ts`:
   - Add to `_addMultipleScheduleNotificationsForPrayer` or create new function
   - Follow `scheduleNotificationForDate` pattern

3. **Add UI control** in relevant component using `Alert.tsx` pattern

4. **Add tests** in `shared/__tests__/notifications.test.ts`

#### Add a New Utility Function

1. **Add function** to appropriate file in `shared/`:

   ```typescript
   /**
    * Description of what it does
    * @param input - Description
    * @returns Description
    */
   export const myFunction = (input: string): string => {
     // Implementation
   };
   ```

2. **Add tests** in `shared/__tests__/[filename].test.ts`:
   - Copy from `_template.test.ts`
   - Test happy path, edge cases, errors

3. **Run validation**: `yarn validate`

#### Add a New Hook

1. **Create file** `hooks/useMyHook.ts`:

   ```typescript
   /**
    * Hook description
    * @returns What it returns
    */
   export const useMyHook = () => {
     // Use existing hooks as reference (useSchedule.ts, usePrayer.ts)
   };
   ```

2. **Export pattern**: Use `export const` (not `export function`)

3. **If uses animations**: Follow `useAlertAnimations.ts` pattern

4. **If uses popups/timers**: Follow `useAlertPopupState.ts` pattern

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
| ADRs         | `ai/adr/`                           | NNN-title.md                  |

## 6. Commands (Copy/Paste Ready)

### Development

```bash
yarn start              # Start Expo dev server (clears cache)
yarn ios               # Build and run on iOS simulator
yarn android           # Build and run on Android emulator
yarn reset             # Full clean: rm builds, reinstall, start fresh
yarn clean             # Clear cache and node_modules
yarn validate          # Run typecheck + biome (lint/format) + tests (use before commits)
yarn format            # Biome: format + safe lint fixes + organize imports
yarn format:check      # Check formatting/lint without changing files
```

### Versioning (bump on EVERY commit)

**The rule:** every commit, no matter how small, ships with a version bump in **BOTH `app.json` (`expo.version`) AND `package.json` (`version`)** — always kept in sync:

| Change type | Bump | Example |
| --- | --- | --- |
| Any small tweak, fix, docs/code change (every commit) | **Patch** (3rd segment +1) | `1.7.0` → `1.7.1` → `1.7.2` |
| Completed feature / big task / whole plan | **Minor** (2nd segment +1, patch reset) | `1.6.x` → `1.7.0` (the iOS widgets plan) |
| Breaking change | **Major** (1st segment +1) | `1.x` → `2.0.0` |

- **Format: strict `MAJOR.MINOR.PATCH`** — plain integers, no leading zeros, no `v` prefix, no `-beta`/`-rc` suffixes. Write `1.7.1`, never `1.7.01` / `v1.7.1` / `1.7.1-beta`.
- **Why this format:** the update popup (`device/updates.ts`) compares the installed version (`Constants.expoConfig.version` ← `app.json`) against the remote version using `compareVersions` in `shared/versionUtils.ts` — numeric, per-segment, dot-separated (`"1.7.10" > "1.7.1"`, missing segments = 0). Leading zeros happen to parse (`"1.7.01"` reads as `1.7.1`) but are forbidden anyway: Apple/Google stores and iTunes Lookup require plain numeric dotted versions, and consistency avoids ever having two spellings of the same version in the wild.
- **Side effect (intended):** a version increase triggers `handleAppUpgrade()` on first launch after update — prayer cache wipe + refetch, preference migration. Never "skip" the bump to avoid this.
- **NEVER touch `releases.json` from a feature branch or session** — the owner updates it manually on `main` after each store release. It drives the update popup for Android + UAT iOS (production iOS reads the live App Store version via iTunes Lookup automatically).
- Commit messages are prefixed with the new version (repo convention): `1.7.1 - fix: ...`.

### File-Scoped (Fast)

```bash
npx biome check src/foo.ts            # Lint + format-check single file
npx biome check --write src/foo.ts    # Fix single file
npx tsc --noEmit                      # Typecheck project
```

### Pre-commit (Automatic)

- Husky + lint-staged runs Biome and tests on staged files

### AI Session Prompts

Use these prompts to start specialized sessions:

| Task                 | Prompt File                    | Description                         |
| -------------------- | ------------------------------ | ----------------------------------- |
| **Cleanup/Refactor** | `ai/prompts/cleanup.md`        | DRY, simplify, document, format     |
| **Documentation**    | `ai/prompts/document.md`       | Add JSDoc, comments, README updates |
| **New Feature**      | `ai/prompts/feature-init.md`   | Initialize feature with plan        |
| **New ADR**          | `ai/prompts/architect-init.md` | Create architecture decision record |

**Quick Start Examples:**

```
# Cleanup session
Read ai/prompts/cleanup.md

# Add docs to a file
Read ai/prompts/document.md
```

### AI Tooling (project-scoped)

- **Skills**: `.agents/skills/` — 24 official Expo skills (`expo-*`, `eas-*`). Auto-loaded natively by opencode; `.agents/skills/` is also the cross-harness standard (Codex, Cursor, Gemini CLI, amp, cline). Load via the skill tool when a task matches (e.g., `expo-upgrade` for SDK upgrades).
- **Expo MCP**: `https://mcp.expo.dev/mcp` (remote) — configured in `opencode.json`. If switching harnesses, add this endpoint to the new harness's MCP config.
- **Mobile MCP**: `@mobilenext/mobile-mcp` (local, via npx) — configured in `opencode.json`. Controls iOS Simulator / Android emulator: launch app, tap, swipe, list UI elements, screenshot, read crash reports. Requires a booted simulator (`xcrun simctl boot "iPhone 16"`) or running emulator. Use for post-change smoke testing. For ANIMATION verification (Reanimated): record video (`mobile_start_screen_recording`/`mobile_stop_screen_recording`, or `xcrun simctl io booted recordVideo out.mp4`), extract frames with `ffmpeg -i out.mp4 -vf fps=8 frames/f_%03d.png`, then read frames as images — opencode cannot send video files directly (text+image attachments only).
- **Expo docs**: docs-mcp-server has the project's current Expo SDK version indexed (library: `expo`).

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

- **Git write operations** - NEVER run `git add`, `git commit`, `git push`, `git pull`, `git merge`, `git rebase`. User handles all git operations manually.
- **Sleep > 15 seconds** - NEVER sleep longer than 15 seconds in any shell command, for any reason. For long-running work (builds, emulators, installs), poll in a loop of ≤15-second cycles, checking status every cycle. Do not circumvent this rule (no longer sleeps, no sparse far-apart checks).
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

### Code Style Rules

- **No nested function calls as parameters**: Each function call must be stored in a variable, then passed to other functions

  ```typescript
  // BAD - nested function calls
  const result = setHours(setMinutes(createDate(), minutes), hours);

  // GOOD - each call in its own variable
  const baseDate = createDate();
  const dateWithMinutes = setMinutes(baseDate, minutes);
  const result = setHours(dateWithMinutes, hours);
  ```

### Formatting (Biome)

- Config: `biome.json` (line width: 120, 2 spaces, single quotes, es5 trailing commas)
- Import order enforced by `organizeImports`: external → `@/` internal → relative, blank line between groups
- `yarn format` applies formatting + safe lint fixes + import organization

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
| RepoMapper  | Discover codebase structure | New repo                 |
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

## 11. Memory / Lessons Learned

**Key Principles:**

- **NO FALLBACKS** - Fix root cause, don't mask problems. If data is missing, throw error.
- **Prayer-centric model** - Use full DateTime objects, not separate date/time strings. Prevents midnight-crossing bugs.
- **Schedule independence** - Standard and Extras schedules can show different dates.
- **Countdown always visible** - No "All prayers finished" state.
- **No nested function calls** - Each function call stored in variable, then passed to other functions.
- **Tests before refactoring** - Capture current behavior with tests before making changes.
- **Countdown display contract** - Ceil rounding: `0s` never displays anywhere (whole values read "1m"/"1h") and the swap to the next prayer happens at the boundary (`getSecondsRemaining`/`getWallSecondDelay` in shared/time.ts).
- **Timezone model is settled** - Prayer datetimes are true UTC instants (`createPrayerDatetime` = `fromZonedTime(..., 'Europe/London')`); per-tick diffs are `target.getTime() − Date.now()`. Never reintroduce per-tick `createLondonDate()` — it lives only in sequence/display logic.
- **No `Platform` checks in the countdown path** - The countdown pipeline is platform-agnostic by mandate.
- **Extras display order invariant (owner)** - Midnight 1st, Last Third 2nd, Suhoor 3rd, Duha 4th, Istijaba 5th (Friday-only, always last). Enforced by `canonicalDisplayOrder` + `EXTRAS_ENGLISH`; never re-litigate.
- **Overlay measurement** - One-shot load-time `measureInWindow` (List/Day/Overlay); owner rejected press-time re-measure.
- **Biome `useExhaustiveDependencies` is never disabled** - Not globally, not per-file in biome.json; use `// biome-ignore lint/correctness/useExhaustiveDependencies: <why>` directly above the diagnostic line (between JSX attribute lines for JSX attributes).
- **@expo/ui is allowed ONLY inside widget layouts** (`widgets/*.tsx`, evaluated in the widget extension's JS runtime) - never in app UI: its native pager's shifted coordinate space caused the F.9 overlay regression and was removed from app screens (see ISSUES.md F.2/F.9).

**Recent Decisions:**

- [2026-01-26] Background Task Notification Refresh: Dual-layer refresh with 4-hour foreground and 3-hour background task using expo-background-task (see ai/adr/007-background-task-notification-refresh.md)
- [2026-08-29] iOS Widgets: Home screen + Lock Screen widgets via expo-widgets@~57.0.15. `stores/widget.ts` pushes a 14-day timeline (prayer boundaries + midnight rollovers) from `refreshPrayerWidgets()`, called from `sync()` and `_rescheduleAllNotifications()`. Live ticking between boundaries via SwiftUI `timerInterval` (Text + ProgressView). Widget layouts live in `widgets/` and are registered via the expo-widgets config plugin in app.json (widget kinds: `PrayerWidget`, `PrayerLockWidget`; app group `group.com.mugtaba.athan`). Terminal stale-guard entry at the final prayer (`stale: true` props) renders an "open Athan to refresh" card once the timeline runs dry — deliberate re-engagement guard given the 2-day notification window (background task keeps notifications alive independently).
- [2026-08-29] Widget architecture revision (1.7.2–1.8.0): pure builder extracted to `shared/widgetTimeline.ts` (types in `shared/widgetTypes.ts`); `stores/widget.ts` is the thin IO layer. Widgets have NO configuration of their own — they mirror the app via `PrayerWidgetSettings` (`readWidgetSettings()` reads the three widget-visible preference atoms; `initWidgetSettingsSync()` re-pushes debounced on change). Props carry a schema version (`v`) and layouts guard `props == null` (the gallery/placeholder path renders with no props), catch render errors to a neutral card, and default every field defensively. Adjacent timeline entries enforce WidgetKit's ~5-minute minimum spacing (first entry backdated, imminent midnights skipped). `formatDateShort` now resolves London wall time (was device-local — wrong cache keys/belongsToDate off-UK). Automated guard suites: `widgetContract.test.ts` (AST: no module-scope refs, palette ≡ COLORS, static imports only) and `widgetSimulation.test.ts` (virtual-week model test: ~4,000 instants across DST + early-Isha fixtures assert the active entry at every instant).

- [2026-08-29] Widget redesign (1.8.1): home screen widget is systemSmall only and shows ONLY the next prayer, laid out like the app's own composition — a header row (location "London, UK" left, date right at 10pt + `minimumScaleFactor(0.6)` so long dates never truncate; Hijri replaces Gregorian per `preference_hijri_date`) over the Countdown component copy: name (16 secondary) → countdown (26 medium white, app's EXACT `formatTime`) → absolute HH:mm below the timer. NO icons, NO countdown bar, NO Arabic names in widgets. Because WidgetKit cannot tick custom-format text, `countdownLabel` is precomputed by the pure builder (ceil rounding like `getSecondsRemaining`) and refreshed by stepped entries every 5 min (WidgetKit minimum spacing) for 24h from push; beyond the horizon entries flip at prayer boundaries only. Midnight rollover entries removed (date label follows the next prayer's `belongsToDate`, which flips at Isha). Lock Screen widgets show the same precomputed label; all placeholder/stale states are text-only. Widget settings mirror ONLY `preference_show_seconds` + `preference_hijri_date` (Arabic/bar/accent mirrors removed). Jotai fires no notification on same-value atom sets — settings-sync tests must toggle values, not re-set them. Widget layout iterations need only a JS reload (app relaunch re-registers layouts + re-pushes) — native prebuild is required only when app.json widget config changes (families/name). The 1.8.1 visual design was rejected and fully superseded by the 2026-08-30 redesign below.

- [2026-08-30] Widget redesign complete (1.9.0, see ADR-011): the "Flat royal" design won the owner's review — solid `COLORS.navigation.rootBackground` card, centered trio (name 13 secondary / hero 26 bold `#e6f0ff` / absolute HH:mm 13 secondary), faded `Sat · London` footer (`COLORS.text.muted`; day = `dateLabel.split(',')[0].slice(0,3)`, Hijri yields the 3-letter month). Countdown labels are MINUTE-CEIL only (`formatCountdownMinutes` in shared/time.ts: `1h 59m 01s`→`2h`, `59s`→`1m`, final minute holds `1m` until the boundary flip) — seconds NEVER render and `timerInterval` is removed from every layout (Apple only ticks its own colon format; `@expo/ui` TextView.swift passes straight through — no custom-format ticking exists). Backdated first entries label the PUSH instant, not their backdated date (no phantom `5m`). `stores/widget.ts` runs a label-flip scheduler: after each push, the next push is scheduled at the next countdown minute flip + 250ms — the widget re-renders within a quarter second of every minute change while the app runs (foreground reloads are budget-free per Apple); backgrounded timers coalesce on foreground. `PrayerWidgetSettings` is `hijriDate` ONLY (showSeconds mirror removed). Roboto is not embeddable in the widget extension (system weights only). Mock data (`mocks/simple.ts`) is launch-relative: today's entry seeds prayers at addMinutes offsets (resting state: Maghrib +2m, Isha +4m, next-day Fajr +6m — every transition is a 2-minute wait, prayer→prayer and day→day); relaunch the app to rerun; all other days carry realistic London times with autumn drift. mobile-mcp can die (mobilecli binary lost); the binaries live in the npm package — `npm i @mobilenext/mobile-mcp` then call `node_modules/mobilecli/bin/mobilecli-darwin-arm64 io swipe|button|screenshot --device <udid>` directly. WidgetKit reload latency under push barrages grows to ~60s+ — space verification pushes ≥60s apart or verify renders before trusting them.

- [2026-08-30] Widget visual polish (1.9.1, refines the 1.9.0 design): home widget's prayer name is an uppercase eyebrow — 11pt semibold, `textCase('uppercase')`, `kerning(1.2)`, widget-only periwinkle `rgba(163, 185, 252, 0.62)` (owner walked the hue: active-blue pill `#0847e5` rejected outright, sky-blue `rgba(146,211,255,0.65)` too blue, lavender `rgba(180,165,248,0.62)` too purple — periwinkle between them fades into the purple card). Footer = widget-only `rgba(157, 188, 246, 0.48)` (owner: "closer to the HH:mm secondary"). Lock rectangular swapped: header `name · countdownLabel`, absolute `HH:mm` below. Circular face RETIRED but kept in `supportedFamilies` with a blank render (opacity(0) 44×44 Text, checked before the props==null guard) — KEY LESSON: iOS keeps user-placed accessory instances alive after their family leaves `supportedFamilies` and freezes them on their last render (WidgetKit has NO API to delete a placement); re-registering the family + blanking the layout is the only clean kill. Second KEY LESSON: `expo run:ios` on an existing `ios/` dir does NOT re-run prebuild — an app.json `supportedFamilies` change silently no-ops until `npx expo prebuild -p ios --no-install` runs (verify the generated Swift in `ios/ExpoWidgetsTarget/`).

- [2026-08-30] Medium home screen widget (1.10.0): systemMedium added to PrayerWidget — the layout branches on `environment.widgetFamily` (one timeline per widget kind serves both sizes). Left half repeats the small trio verbatim; right half is the app's Standard page list: the day's six prayers (`prayers` + `activeIndex` on a v3 props contract, built per entry from `next.belongsToDate` — the list rolls to the next day exactly when the countdown target does), 22pt fixed rows, 12pt text, passed/active rows white + upcoming muted (the app's `isPassed || isNext → primary` rule), and a floating `RoundedRectangle` pill (`#1157e6` — the app's `#0847e5` with the smallest lift toward sky; radius 4 keeps the app's pill-to-row proportion) behind the active row via `offset`. KEY LESSONS: (1) an empty stack whose width comes from `frame({maxWidth: Infinity})` collapses to zero width in the widget runtime — a Spacer-only VStack with a background modifier renders invisible; the pill must be a shape view (`RoundedRectangle` + `foregroundStyle`), which fills the width its stack proposes. (2) SwiftUI animation is architecturally impossible in expo-widgets 57.0.15: every view renders through `ForEach(children, id: \.id)` with a random UUID regenerated per render, so entry flips tear down and rebuild the whole tree — `.animation(_, value:)` can never fire (owner accepted snapping; do not reintroduce animation modifiers in widget layouts). (3) Mock launch-relative days must keep EVERY day's sunrise launch-relative too — a fixed sunrise clock time can precede the re-seeded Fajr and put Sunrise first in the day list. The demo resting state: Isha next (+2m), day1 Fajr +4/Sunrise +6 (Isha→Fajr rollover with footer day flip). Payload guard raised to 200KB (the day list grew entries ~30%). Palette guard: the pill fill is a documented widget-specific color; `COLORS.text.muted`/`primary` anchor the rows.

- [2026-08-30] Widget design arc, post-medium (1.10.2–1.12.1): the eyebrow prayer name became a **pill badge** — lowercase 11pt semibold, periwinkle-white text `rgba(190, 205, 252, 0.9)` over a single capsule of sky-blue whisper `rgba(90, 160, 245, 0.08)` (a hint of the active-prayer blue; the design was chosen from ~30 owner-reviewed screenshot variants across badge placement, shape, fill, hue and font families — evidence sessions iterate on live simulator screenshots saved to `evidence/`, cleared after each decision). Uppercase `textCase` was REMOVED (owner: normal letters). The **stale card** was redesigned (1.12.0): the 1.7.0 `moon.stars.fill` mark (`#a5b4fc`, via `Image systemName`) above an "Out of date" title with a plain-text "Open Athan / to refresh" call (two lines on small, one line on medium; a black ErrorScreen-style refresh button was tried and REJECTED). Lock rectangular stale mirrors the mark in vibrant monochrome. Mock resting state is now the **Dhuhr-next cascade** (1.12.1): Fajr −2m, Sunrise 0, then every prayer +2m apart (Dhuhr next, rollover to day1 Fajr +10/Sunrise +12). Palette guard anchors now include the badge pair; `NAME_COLOR` periwinkle was removed with the uppercase eyebrow.

- [2026-08-31] Widget redesign COMPLETE (1.13.1, "Cotton Candy" — supersedes every 1.8–1.12 design): 50-design evidence session (owner-reviewed live on simulator) landed on a translucent-light family. FINAL design in `widgets/PrayerWidget.tsx`: `containerBackground` **translucent** `rgba(255, 250, 253, 0.55)` (owner: solid cards "feel Android — not iOS"); pastel **blob lighting** behind content — 3 blurred Circles (frame 170/160/130, blur 40–45, offsets from card center, alphas 0.4–0.5 pink/blue/lilac `BLOB_A/B/C`); bare rose prayer name `#db2777` (12 semibold, kerning 0.5, NO pill — pill treatments tried in 20+ variants, owner prefers none); hero + list ink `#1e1b2e` (gradient-on-text BANNED, white-bg+black-border BANNED, retro/90s-neon BANNED — "modern 2026 clean only"); absolute time + footer blue-tinted `rgba(42, 68, 130, 0.42/0.34)`; medium active row = solid indigo pill `#4f46e5` (matches the app's sound-picker selection), pale pink text `#fce7f3`, subtle indigo stroke `rgba(79, 70, 229, 0.35)`, **elevated** depth shadow `rgba(30, 27, 75, 0.45)` (owner loves the lifted look; red-tinted shadows rejected); passed rows soft blackish-blue `#2f3d5c` (hard black rejected); upcoming rows `rgba(42, 68, 130, 0.32)`. KEY LESSONS (expensive to relearn): (1) **Widget render pipeline**: the extension caches the layout per process — after a layout edit: relaunch app → `pkill -f ExpoWidgetsTarget` → cold-relaunch app ×2 → terminate → screenshot; stale renders are common, retry once. `EntryView.swift` re-reads `__expo_widgets_<name>_layout` from the app group per render, but reload delivery after extension respawn is flaky. (2) **glassEffect modifier is UNSUPPORTED in the widget runtime** — silently blanks its host view's children; fake glass with `background(rgba-white, roundedRectangle)`. (3) **Fixed-size orbs inflate the card ZStack** — a 210pt Circle inside the card ZStack grows the widget's layout height past the system slot and clips the FOOTER away; if blobs return, pin the blob layer to a fixed card-size frame + `clipped()`. (4) Widget `containerBackground` accepts rgba() translucent colors — true see-through-over-wallpaper works. (5) `foregroundStyle` accepts gradient objects on shapes; contract test now anchors the Cotton Candy palette (all literals widget-specific; `COLORS.*` anchors removed). Evidence workflow: 30–40s design cycles against the live simulator, screenshot → `evidence/NN-name.png` → owner review; folder deleted at session end.

- [2026-08-31] Bold-weight + glow decisions, What's New polish (1.13.2): medium widget list — EVERY time bold, EVERY name regular (owner rule: weight changes are all-or-nothing across all six rows; per-state variants like passed-only or active-only bold were reviewed and REJECTED). Indigo blob-glow variant rejected — rose `rgba(249, 168, 212, 0.5)` stays. What's New modal: `v`-prefixed version line (`v1.13.2`), pulled closer to the title (marginTop −SPACING.sm), de-emphasized in faint blue `rgba(42, 68, 130, 0.32)` (not grey — "a hint of blue"); Home/Lock widget entries merged into one "Home & Lock widgets" item whose body appends a `(iOS only)` suffix (same faint blue) derived from the item's `platform` field. Process lesson: for screenshot evidence sessions, the owner prefers taking screenshots HIMSELF (simulator UI) while the agent makes single-file minimal edits — automated push/pkill/screenshot cycles stall on WidgetKit reload latency.

- [2026-08-31] Mock resting state revised (1.13.3): mocks/simple.ts days are realistic values copied verbatim from mocks/full.ts (2024-08-28 → 09-09, autumn drift); TODAY stays launch-relative for widget testing — Fajr −2m, Sunrise 0, Dhuhr next at +157m (2h 37m), Asr +180/Maghrib +240/Isha +300, day1 Fajr/Sunrise +310/+312 close the rollover chain. `addMinutes` is exported and kept for future cascades. Owner preference: no narrative comments in mocks/simple.ts — the offsets are churned constantly, comments rot. The uppercase-eyebrow trial was reverted same-session (owner: normal letters, again).

- [2026-08-31] Glow geometry fix (1.13.4): the rose orb anchors to the medium card's ABSOLUTE x (~114pt from the left edge) on both families (`roseOrbX` = +35 small / −55 medium) — center-relative offsets dropped it into the small card's top-left corner instead of topping the hero where the medium places it. KEY LESSON: blob orbs must anchor to absolute card coordinates, not center-relative offsets, whenever the two families share a composition.

**Widget architecture invariants (expo-widgets):**

- The `'widget'` directive makes Babel serialize ONLY the function body into a string; the widget extension evaluates it in a separate JS runtime where `@expo/ui` components/modifiers are globals. Never reference module-scope values inside a widget function; helpers must live inside the function body. (Enforced by `widgetContract.test.ts`.)
- Widget props are JSON-only — pass epoch ms, never Date objects; rebuild Dates inside the widget. Every entry carries `v` (schema version); layouts must tolerate older/missing fields with defensive defaults and treat missing epoch bounds as the refresh card.
- iOS renders the gallery/jiggle placeholder with NO props (57.0.15 stores no initial props) — every widget layout must guard `props == null`.
- Widget modules MUST be statically imported (dynamic `import()` creates lazy Metro bundles where the widget transform does not apply, and the native constructor then throws `ERR_ARGUMENT_CAST`).
- `updateTimeline` requires the layout to be registered first (a side effect of importing the widget module). It writes the whole entry array into the app-group UserDefaults and reloads; the extension serves it with a hardcoded `.atEnd` policy — after the last entry the LAST entry re-renders forever, which is why the terminal stale guard exists.
- Keep entries ≥5 min apart (WidgetKit rule) and sorted chronologically; `buildPrayerWidgetTimeline` handles both, including backdating the first entry. The 5-min floor is also the countdown-step cadence — nothing may step faster.
- Countdown labels: `countdownLabel` must always come from `formatCountdownMinutes` (ceil to the next minute, seconds never render) evaluated at the entry date — or at the push instant for a backdated first entry — never hand-formatted in a layout or builder branch. `timerInterval` is banned in layouts: it renders Apple's colon clock, not our format.
- Settings flow one way: app preference atoms → `readWidgetSettings()` → props field → layout conditional. Today that is `hijriDate` only. Adding a widget-visible setting = one atom read + one `PrayerWidgetSettings` field + one prop + one conditional. Never add widget-side configuration.

**See Also:** `ai/adr/` for architectural decision records.

## 12. Change / PR Checklist

- [ ] Version bumped per Versioning policy (§6): patch in `app.json` + `package.json` for every commit; minor for a completed feature/plan; `releases.json` untouched
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
