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
│   ├── PrayerWidget.tsx   # Home screen widget (systemSmall + systemMedium)
│   └── LockPrayerWidget.tsx # Lock Screen widget (accessoryCircular/Rectangular/Inline)
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

**Recent Decisions:**

- [2026-01-26] Background Task Notification Refresh: Dual-layer refresh with 4-hour foreground and 3-hour background task using expo-background-task (see ai/adr/007-background-task-notification-refresh.md)
- [2026-08-29] iOS Widgets: Home screen + Lock Screen widgets via expo-widgets@~57.0.15. `stores/widget.ts` pushes a 14-day timeline (prayer boundaries + midnight rollovers) from `refreshPrayerWidgets()`, called from `sync()` and `_rescheduleAllNotifications()`. Live ticking between boundaries via SwiftUI `timerInterval` (Text + ProgressView). Widget layouts live in `widgets/` and are registered via the expo-widgets config plugin in app.json (widget kinds: `PrayerWidget`, `PrayerLockWidget`; app group `group.com.mugtaba.athan`). Terminal stale-guard entry at the final prayer (`stale: true` props) renders an "open Athan to refresh" card once the timeline runs dry — deliberate re-engagement guard given the 2-day notification window (background task keeps notifications alive independently).
- [2026-08-29] Widget architecture revision (1.7.2–1.8.0): pure builder extracted to `shared/widgetTimeline.ts` (types in `shared/widgetTypes.ts`); `stores/widget.ts` is the thin IO layer. Widgets have NO configuration of their own — they mirror the app via `PrayerWidgetSettings` (`readWidgetSettings()` reads the three widget-visible preference atoms; `initWidgetSettingsSync()` re-pushes debounced on change). Props carry a schema version (`v`) and layouts guard `props == null` (the gallery/placeholder path renders with no props), catch render errors to a neutral card, and default every field defensively. Adjacent timeline entries enforce WidgetKit's ~5-minute minimum spacing (first entry backdated, imminent midnights skipped). `formatDateShort` now resolves London wall time (was device-local — wrong cache keys/belongsToDate off-UK). Automated guard suites: `widgetContract.test.ts` (AST: no module-scope refs, palette ≡ COLORS, static imports only) and `widgetSimulation.test.ts` (virtual-week model test: ~4,000 instants across DST + early-Isha fixtures assert the active entry at every instant).

**Widget architecture invariants (expo-widgets):**

- The `'widget'` directive makes Babel serialize ONLY the function body into a string; the widget extension evaluates it in a separate JS runtime where `@expo/ui` components/modifiers are globals. Never reference module-scope values inside a widget function; helpers must live inside the function body. (Enforced by `widgetContract.test.ts`.)
- Widget props are JSON-only — pass epoch ms, never Date objects; rebuild Dates inside the widget. Every entry carries `v` (schema version); layouts must tolerate older/missing fields with defensive defaults and treat missing epoch bounds as the refresh card.
- iOS renders the gallery/jiggle placeholder with NO props (57.0.15 stores no initial props) — every widget layout must guard `props == null`.
- Widget modules MUST be statically imported (dynamic `import()` creates lazy Metro bundles where the widget transform does not apply, and the native constructor then throws `ERR_ARGUMENT_CAST`).
- `updateTimeline` requires the layout to be registered first (a side effect of importing the widget module). It writes the whole entry array into the app-group UserDefaults and reloads; the extension serves it with a hardcoded `.atEnd` policy — after the last entry the LAST entry re-renders forever, which is why the terminal stale guard exists.
- Keep entries ≥5 min apart (WidgetKit rule) and sorted chronologically; `buildPrayerWidgetTimeline` handles both, including backdating the first entry and skipping midnights that cannot keep spacing.
- Settings flow one way: app preference atoms → `readWidgetSettings()` → props field → layout conditional. Adding a widget-visible setting = one atom read + one `PrayerWidgetSettings` field + one prop + one conditional. Never add widget-side configuration.

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
