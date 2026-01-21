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

> **Archive:** Detailed entries moved to `ai/memory-archive.md`. This section contains only high-level summaries.

### System Complete (2026-01-21)

All 11 features completed and archived to `ai/features/archive/`:

| Category | Features |
|----------|----------|
| Core Timing | timing-system-overhaul, timing-system-bugfixes, isha-display-bug, islamic-day-boundary, progressbar-midnight-fix |
| Prayer Features | midnight-prayer, prayer-explanations |
| UI Improvements | overlay-date-display, measurement-system-improvements |
| User Experience | onboarding |
| Code Quality | codebase-cleanup-2026-01-20 |

**Key Principles Established:**
- NO FALLBACKS: Fix root cause, don't mask problems
- Prayer-centric model: Full DateTime objects, no midnight-crossing bugs
- Schedule independence: Standard/Extras can show different dates
- Timer always visible: No "All prayers finished" state

**See Also:**
- `ai/memory-archive.md` - Detailed historical entries
- `ai/features/archive/` - All completed feature documentation
- `ai/adr/` - Architectural decision records

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
