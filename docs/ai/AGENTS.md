# AGENTS.md - Athan Prayer Times App

> Single source of truth for AI agents. Tool-agnostic. Subdirectory AGENTS.md overrides root for that folder.

---

## 0. Scope & Discovery

- **Recursive Logic**: Subdirectory `AGENTS.md` overrides root for that folder.
- **Tool Compatibility**: This file is tool-agnostic. Pointers (CLAUDE.md, .cursorrules) redirect here.
- **Risk Profile**: Aggressive (fix and report).

---

## 1. Project North Star

**What We're Building**: A React Native/Expo prayer times app for London Muslims with real-time countdown timers, offline support, and customizable athan notifications.

**Core Features**:

- Real-time prayer countdown with 4 concurrent timers (Standard, Extra, Overlay, Midnight)
- 6-day rolling notification buffer with 16 athan sounds
- Offline-first with MMKV local caching
- Two schedule types: Standard (5 prayers) and Extra (Suhoor/Ishraq/Duha/etc.)

**Non-Goals**:

- Multiple city support (London only)
- User accounts or cloud sync
- Social features

**Invariants**:

- Prayer times sourced from London Prayer Times API
- Offline functionality must always work
- Notifications must be reliable across app restarts

---

## 2. Stack & Versions

| Category        | Technology   | Version        |
| --------------- | ------------ | -------------- |
| Framework       | React Native | 0.81.5         |
| Platform        | Expo         | 54.0.31        |
| UI Library      | React        | 19.1.0         |
| Language        | TypeScript   | 5.9.3 (strict) |
| State           | Jotai        | 2.16.1         |
| Storage         | MMKV         | 4.1.1          |
| Navigation      | Expo Router  | 6.0.21         |
| Animations      | Reanimated   | 4.1.6          |
| Package Manager | Yarn         | -              |
| Linter          | ESLint       | 9.39.2         |
| Formatter       | Prettier     | 3.7.4          |
| Git Hooks       | Husky        | 8.0.3          |

---

## 3. Repo Map & Entry Points

```
app/                    # Expo Router pages
├── _layout.tsx        # Root layout (GestureHandler, BottomSheet)
├── index.tsx          # Main entry (state loading, modals)
├── Navigation.tsx     # PagerView with 2 pages
└── Screen.tsx         # Individual prayer list

components/            # UI components (25+ files)
├── List.tsx, Day.tsx  # Prayer list
├── Modal*.tsx         # Modal dialogs
├── Alert.tsx          # Overlay alerts
└── BottomSheet*.tsx   # Sound picker

hooks/                 # Custom React hooks
├── useAnimation.ts    # Reanimated animations
├── useNotification.ts # Notification handling
└── usePrayer.ts       # Prayer data

stores/                # Jotai atoms
├── ui.ts              # UI state
├── notifications.ts   # Notification prefs
├── schedule.ts        # Prayer data
├── timer.ts           # Timer management
├── storage.ts         # MMKV persistence
└── sync.ts            # Data fetching

shared/                # Utilities & constants
├── types.ts           # TypeScript interfaces
├── constants.ts       # App constants
├── notifications.ts   # Notification logic
├── database.ts        # MMKV init
└── time.ts, prayer.ts # Time utilities

device/                # Native integrations
├── notifications.ts   # Background scheduling
├── listeners.ts       # App state listeners
└── updates.ts         # App updates

api/                   # API client
├── client.ts          # HTTP fetch
└── config.ts          # API config
```

**Key Flows**:

1. App Start → `app/_layout.tsx` → `app/index.tsx` → `triggerSyncLoadable()`
2. Data Fetch → `stores/sync.ts` → `api/client.ts` → Cache to MMKV
3. Timer Update → `stores/timer.ts` → `hooks/useAnimation.ts` → UI render

---

## 4. Golden Paths

### State Management (Jotai + MMKV)

```typescript
// Define atoms with persistence (stores/storage.ts)
const myBoolAtom = atomWithStorageBoolean('key', false);
const myNumAtom = atomWithStorageNumber('key', 0);
const myObjAtom = atomWithStorageObject<T>('key', defaultValue);

// Read in components
const value = useAtomValue(myAtom);

// Write from anywhere
store.set(myAtom, newValue);
```

### Imports

```typescript
// Order: external → expo/rn → internal (alphabetical within groups)
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAtomValue } from 'jotai';
import Animated from 'react-native-reanimated';

import { Alert } from '@/components/Alert';
import { ANIMATION } from '@/shared/constants';
import { store } from '@/stores';
```

### Components

```typescript
// Functional components with hooks, PascalCase naming
export function MyComponent({ prop }: Props) {
  // Hooks at top
  const value = useAtomValue(someAtom);

  // Handlers
  const handlePress = useCallback(() => {
    // ...
  }, []);

  return (
    <View style={styles.container}>
      {/* ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Use StyleSheet.create for performance
  },
});
```

### Animations (Reanimated 4)

```typescript
// Use custom hooks from hooks/useAnimation.ts
const animation = useAnimationOpacity(1);

// Animate
animation.animate(0, { duration: ANIMATION.duration });

// Apply to view
<Animated.View style={animation.style}>
```

### Error Handling

```typescript
import { logger } from '@/shared/logger';

try {
  await riskyOperation();
} catch (error) {
  logger.error(error, 'Context message');
  return false;
}
return true;
```

### Types

```typescript
// Use enums for fixed values (shared/types.ts)
enum ScheduleType {
  Standard = 'standard',
  Extra = 'extra',
}
enum AlertType {
  Off = 0,
  Silent = 1,
  Sound = 2,
}

// Interfaces for objects
interface ITransformedPrayer {
  name: string;
  time: string;
  // ...
}
```

---

## 5. File Types & Locations

| Type       | Location          | Pattern                |
| ---------- | ----------------- | ---------------------- |
| Pages      | `app/`            | Expo Router file-based |
| Components | `components/`     | PascalCase.tsx         |
| Hooks      | `hooks/`          | use\*.ts               |
| Stores     | `stores/`         | camelCase.ts           |
| Utils      | `shared/`         | camelCase.ts           |
| Types      | `shared/types.ts` | Centralized            |
| Tests      | Not configured    | -                      |
| Migrations | N/A               | -                      |
| Specs      | `docs/ai/specs/`  | \*.md                  |
| ADRs       | `docs/ai/adr/`    | ADR-NNN.md             |

---

## 6. Commands

### File-Scoped (Fast)

```bash
# Lint single file
npx eslint src/path/to/file.ts

# Format single file
npx prettier --write src/path/to/file.ts

# Typecheck (project-wide only)
npx tsc --noEmit
```

### Full Suite

```bash
# Start dev server (clears cache)
yarn start

# iOS simulator
yarn ios

# Android emulator
yarn android

# Full reset (nuclear option)
yarn reset
```

### Package Management

```bash
# Non-Expo packages
yarn add <package>

# Expo/RN packages (ensures compatibility)
npx expo install <package>
```

---

## 7. Boundaries & Permissions

### Always Do

- Read files, list files
- Run file-scoped lint/typecheck
- Clean up empty files/folders created this session
- Match existing code patterns

### Ask First

- Install dependencies
- Delete non-empty files
- Modify schema/types
- Environment changes

### Never Do

- Commit secrets/API keys
- Edit node_modules
- Remove failing tests
- Modify CI/CD
- Run destructive commands (rm -rf, git push -f, etc.)
- Create shell script workarounds for blocked commands

---

## 8. Consistency & Best Practices

### Prime Directive: Match Existing Patterns

1. **Read Before Writing**: Examine 2-3 similar files before creating new code
2. **Pattern Matching**: Code should be indistinguishable from existing codebase
3. **Zero New Patterns**: No new libraries/frameworks without approval
4. **Consistency > Cleverness**: Use existing approach even if you "know better"

### This Codebase Conventions

- **No console.log**: ESLint enforces `no-console: 'error'` - use `logger` instead
- **Absolute imports**: Always use `@/` alias, never relative imports
- **Single quotes**: Prettier enforces single quotes
- **Semicolons**: Required
- **120 char width**: Prettier enforces
- **Trailing commas**: ES5 style

### Anti-Pattern Detection

Before submitting code, verify:

- No new dependencies without approval
- No different naming conventions
- No different file structure
- No new error handling patterns
- No skipped Golden Paths
- No empty files or folders left behind

---

## 9. Agentic Protocol (Loop Discipline)

- **Plan First**: Outline steps in `<thinking>` tags.
- **Track Session Changes**: Maintain internal list of files/folders created this session.
- **Minimal Diffs**: Small, focused changes only.
- **Test-First Mode**: For new features/regressions, write tests FIRST, then code to green.
- **Documentation First**: Before implementing: Update or create relevant docs. While coding: Add JSDoc/TSDoc. For complex logic: Add inline comments explaining WHY.
- **Consistency Check**: Before writing code, examine 2-3 similar files and match their patterns.
- **Run Checks**: After every edit, run relevant file-scoped checks.
- **Loop Awareness**: If stuck after 2 failed attempts, STOP. Ask for missing info or propose alternate.
- **Report Evidence**: Summarize commands run + outputs.
- **Context Management**: If session exceeds 50+ messages, summarize progress and reference AGENTS.md.
- **Cleanup Before Exit**: Before ending session, check for empty files/folders created this session and remove them.

---

## 10. Orchestrator + Specialists

### Specialist Roles & Decision Tree

- **Mapping new repo?** → RepoMapper (discover structure)
- **Planning new feature?** → Architect (creates spec + updates README)
- **Implementing a spec?** → Implementer (code + tests + inline docs + consistency check)
- **Bug with no error message?** → Architect (logic analysis)
- **Bug with error message?** → Implementer (fix) + TestWriter (repro)
- **Refactoring code?** → ReviewerQA (first, assess risks) → Implementer (refactor + update docs)
- **Deploying/migrating?** → DevOpsRelease (updates runbooks/migrations)
- **Security concern?** → ReviewerQA (SecurityAudit skill)
- **Docs out of sync?** → ReviewerQA (audit) + Implementer (fix)
- **Code review needed?** → ReviewerQA (consistency audit + best practices check + empty file check)

---

## 11. Memory / Lessons Learned

> Append-only log of learnings. Format: `[YYYY-MM-DD] [Topic]: [Rule/Gotcha]`

- [2026-01-14] Init: Repository initialized with centralized AI memory system
- [2026-01-14] Logging: Use `logger` from `@/shared/logger`, never `console.log`
- [2026-01-14] Imports: Always use `@/` alias, never relative imports
- [2026-01-14] State: Jotai atoms with MMKV persistence via `atomWithStorage*` helpers

---

## 12. Change / PR Checklist

- [ ] Diff is small and focused
- [ ] File-scoped checks green (lint/typecheck)
- [ ] Consistency verified: matches existing patterns
- [ ] No new dependencies without approval
- [ ] No empty files/folders left behind
- [ ] Tests added/updated (when test framework exists)
- [ ] No secrets, API keys, or console.logs
- [ ] Brief summary + how to verify

---

## 13. Session Lifecycle

### Start Ritual

1. Load this file fully
2. Initialize session artifact tracker
3. Acknowledge: "Context loaded. Safety constraints active. Ready."
4. Ask: "What's the goal for this session?"

### End Ritual

1. Cleanup empty files/folders created
2. Summarize what was done
3. Check: Did we learn something? Draft Memory entry
4. Confirm: "Ready to append to AGENTS.md?"
