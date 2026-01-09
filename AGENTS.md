# ATHAN.UK REACT NATIVE PROJECT - AGENTIC KNOWLEDGE BASE

**Generated:** 2026-01-08  
**Commit:** 24ca5b5  
**Branch:** agents_skills_init_BUG1  
**Project:** React Native prayer times app for London, UK  

---

## OVERVIEW
React Native mobile app for Muslim prayer times using Expo SDK 54, React 19.1, React Native 0.81.5, TypeScript strict mode. Displays daily prayer times with real-time countdown, custom notifications with 16 Athan sounds, offline support with MMKV v4 caching. No tests configured. Uses PagerView navigation, Jotai state, Reanimated v4 stable. All dependencies pinned to exact versions.

---

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| **Entry point** | `app/index.tsx` | Main app after Expo Router loads |
| **Root layout** | `app/_layout.tsx` | GestureHandler, splash screen, sync trigger |
| **Navigation** | `app/Navigation.tsx` | PagerView-based 2-page system (Standard/Extra) |
| **Screen** | `app/Screen.tsx` | Individual page component |
| **State architecture** | `stores/` | Jotai atoms + MMKV storage |
| **API layer** | `api/client.ts` | London Prayer Times API with mock support |
| **Types** | `shared/types.ts` | 190 lines, 26 interfaces |
| **Constants** | `shared/constants.ts` | All app-wide constants |
| **Native integrations** | `device/` | Notifications, listeners, updates |
| **UI components** | `components/` | 21 reusable components |
| **Custom hooks** | `hooks/` | useSchedule, usePrayer, useNotification, useAnimation |

---

## CRITICAL BUGS (README documented)

**BUG-1:** ✅ **RESOLVED** - iOS simulator startup (react-native-screens@4.10.0 now working)  
**BUG-2:** Double notifications on iOS & Android - sends 2 identical notifications  
**BUG-3:** Android delayed notifications - ±60 seconds timing on some devices  

---

## ARCHITECTURE PATTERNS

### Entry Point Flow
```
expo-router/entry → _layout.tsx (providers, sync trigger) → index.tsx (wait for sync) → Navigation → Screen
```

### Data Flow
```
API Client → shared/prayer (transform) → stores/database (MMKV) → stores/schedule (atoms) → components
```

### State Management
- **Jotai atoms** for all state (no React Context)
- **MMKV** for persistent storage via custom `atomWithStorage*` helpers
- **Vanilla store access**: `getDefaultStore().get/set()` for imperative updates
- **Loadable pattern**: `syncLoadable` for async data initialization

### Navigation
- **PagerView** (NOT Expo Router tabs) for horizontal swipe
- 2 pages: Standard schedule, Extra schedule
- Page position tracked in Jotai atom `pagePositionAtom`

### Timer System (4 concurrent timers)
1. **standard** - Counts to next standard prayer
2. **extra** - Counts to next extra prayer
3. **overlay** - Counts to overlay-selected prayer
4. **midnight** - Watches for date change to trigger sync

### Notification System
- 6-day rolling buffer (schedules 6 days ahead)
- 16 Android notification channels (one per Athan sound)
- Refresh every 24 hours
- Three alert types: Off, Silent, Sound
- Android uses SCHEDULE_EXACT_ALARM

---

## CONVENTIONS (Deviations from Standard)

### Import Order (Enforced by ESLint)
```typescript
// [builtin, external]
import { View } from 'react-native';
import { atom } from 'jotai';

// internal
import * as Database from '@/stores/database';

// [parent, sibling]
import { Prayer } from './Prayer';

// index
```
- **Path alias**: `@/*` for root imports
- **Alphabetized**: Within each group
- **Blank lines**: Between groups

### State Pattern
- **NO React Context** - Use Jotai atoms
- **Direct store access**: `const store = getDefaultStore(); store.get(atom)`
- **Custom storage**: `atomWithStorageString/Number/Boolean/Array/Object` for MMKV

### Component Pattern
- **Default exports** for all components
- **Named exports** for utilities/stores
- **NO useMemo/useCallback** (verified pattern)
- **Type-first**: Interfaces at top, props typed

### TypeScript
- **Strict mode** enabled
- **Shared types**: All in `shared/types.ts`
- **Enums**: `ScheduleType`, `AlertType`, `AlertIcon`, `DaySelection`

---

## ANTI-PATTERNS (This Project)

### Temporary Workarounds (Must Remove)
- **Lines 23-26 in `app/_layout.tsx`**: `@ts-expect-error` suppressing Text.defaultProps mutation (consider alternative approach)

### Type Coercion Risk
- **stores/storage.ts**: `JSON.parse(value) as T[]` without validation
- **Action Required**: Add try-catch + validation

### Production Logging
- **shared/logger.ts**: Disabled in prod/preview
- **Trade-off**: Performance vs observability
- **Recommendation**: Add error tracking service

### Production Dependencies
- ✅ All dependencies now pinned to exact versions (no breaking patch updates)

---

## STORAGE KEYS (MMKV Naming Convention)

### Prayer Data
- `prayer_YYYY-MM-DD` - Daily prayer times
- `fetched_years` - `{[year]: boolean}` record
- `display_date` - Currently displayed date

### Notifications
- `scheduled_notifications_standard_[index]_[id]` - Standard prayer notification
- `scheduled_notifications_extra_[index]_[id]` - Extra prayer notification
- `last_notification_schedule_check` - Timestamp of last refresh
- `preference_mute_standard/extra` - Mute state atoms
- `preference_sound` - Selected Athan sound index (0-15)

### Alert Preferences
- `preference_alert_standard_[0-5]` - Alert type per prayer (Fajr to Isha)
- `preference_alert_extra_[0-3]` - Alert type per extra prayer

### UI State (Cached)
- `prayer_max_english_width_standard/extra` - Longest prayer name width
- `measurements_list/date` - Cached layout measurements
- `popup_tip_athan_enabled` - First-time tips state
- `popup_times_explained_enabled` - Prayer info popup state
- `popup_update_last_check` - App update check timestamp

### Database Cleanup Exclusions (Intentional - DO NOT DELETE)
- `popup_*` - Popup states
- `preference_*` - User preferences
- `scheduled_notifications` - Notification tracking
- `last_notification_schedule_check` - Refresh tracking
- `prayer_max_english_width*` - Cached measurements

---

## COMMANDS

### Development
```bash
yarn reset           # Clean install + start (clears cache)
yarn start           # Start Expo dev server
yarn ios             # Run on iOS simulator
yarn android         # Run on Android emulator
yarn clean           # Remove ios, android, node_modules, caches
```

### Building with EAS
```bash
eas build --profile development --platform ios
eas build --profile preview --platform android
eas build --profile production --platform ios
```

### Dependencies
```bash
npx expo install <package>  # For Expo/RN packages
yarn add <package>           # For other packages
```

---

## CONFIGURATION FILES

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts (yarn reset, clean, husky) |
| `app.json` | Expo config (new architecture, sounds, fonts, permissions) |
| `eas.json` | Build profiles (dev, preview, production) |
| `tsconfig.json` | TypeScript strict mode, @/* path alias |
| `eslint.config.mjs` | Flat config, no-console error, import ordering |
| `.prettierrc.yml` | 120 char width, 2 spaces, single quotes |
| `metro.config.js` | SVG transformer configuration |
| `.env` | Environment variables (API key, app IDs) |

---

## TECH STACK

**Core**: React Native 0.81.5, React 19.1.0, Expo SDK 54.0.31, TypeScript 5.9.3 strict
**State**: Jotai 2.16.1 (atomic), MMKV 4.1.1 (Nitro Module), Reanimated 4.1.6 (stable)
**UI**: PagerView 6.9.1 (nav), GestureHandler 2.28.0, BottomSheet 5.2.8, Linear Gradients
**Platform**: Expo-notifications, expo-audio (hook-based), expo-haptics, react-native-permissions
**Build**: EAS (Expo Application Services), no CI/CD configured
**Logging**: Pino 9.14.0 (disabled in prod), Husky pre-commit (lint-staged)
**All versions**: Pinned to exact versions for stability  

---

## TESTING STATUS
**NO TESTS CONFIGURED** - No Jest, no test files, no test scripts

---

## DEPENDENCIES TO WATCH

All dependencies are pinned to exact versions. When upgrading:
- Test thoroughly on iOS simulator and Android emulator
- Check SDK 54 changelog for breaking changes
- Follow DEPENDENCY-PINNING-STRATEGY.md for upgrade process
- See SDK-54-BREAKING-CHANGES.md for notification/audio migration learnings

---

## PROJECT STRUCTURE

```
.
├── app/               # Expo Router pages (4 files)
│   ├── _layout.tsx    # Root layout, providers, sync trigger
│   ├── index.tsx      # Main entry, modal rendering
│   ├── Navigation.tsx  # PagerView 2-page system
│   └── Screen.tsx     # Individual page component
├── components/        # 21 UI components
├── hooks/            # 4 custom hooks
├── stores/           # Jotai state (8 files)
├── shared/           # Utilities & types (6 files)
├── device/           # Native integrations (4 files)
├── api/              # API client + config (2 files)
├── assets/           # Audio (16), fonts (2), icons, marketing
├── mocks/            # Mock data for dev
├── ios/              # Generated native code
├── android/          # Generated native code
└── .opencode/        # OpenCode skills (3 SKILL.md files)
```

---

## NOTES

- **No Context Providers** - Uses vanilla Jotai store access
- **Annual data caching** - Fetches entire year, stores in MMKV v4 (Nitro Module)
- **Midnight timer** - Separate timer watching for date changes
- **Background tasks removed** - expo-background-fetch removed, device/tasks.ts deleted (SDK 54)
- **Audio system** - Uses expo-audio hooks (useAudioPlayer + useAudioPlayerStatus)
- **Notification sounds** - MUST use `false` (boolean) for silent, not `null`/`undefined` (SDK 54 requirement)
- **Web deployment** - Static HTML only (index.html, CNAME)
- **Version tracking** - Manual releases.json updates required
- **EAS build limit** - 15 builds/month (pain point documented in README)
- **Recent migration** - SDK 52→54, React 18→19, RN 0.76→0.81 (Jan 2026)
