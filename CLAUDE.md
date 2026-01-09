# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native mobile app for Muslim prayer times in London, UK. Built with Expo SDK 54, React Native 0.81.5, React 19.1, TypeScript strict mode. Displays daily prayer times with real-time countdown, custom notifications with 16 Athan sounds, and offline support via MMKV caching.

## Commands

```bash
yarn reset        # Clean install + start (removes ios/android/node_modules, reinstalls, starts server)
yarn start        # Start Expo dev server with cache clear
yarn ios          # Build and run on iOS simulator
yarn android      # Build and run on Android emulator
yarn clean        # Remove generated dirs and caches

npx expo install <package>  # Install Expo/RN packages (preferred)
yarn add <package>          # Install other packages
```

EAS builds (for native module changes):
```bash
eas build --profile development --platform ios
eas build --profile preview --platform android
```

## Architecture

### Entry Flow
```
expo-router/entry → _layout.tsx (providers, sync trigger) → index.tsx (wait for sync) → Navigation → Screen
```

### Data Flow
```
API Client → shared/prayer (transform) → stores/database (MMKV) → stores/schedule (atoms) → components
```

### State Management
- **Jotai atoms** for all state (no React Context providers)
- **MMKV** for persistence via custom `atomWithStorage*` helpers in `stores/storage.ts`
- **Vanilla store access**: `getDefaultStore().get/set()` for imperative updates outside React
- **Loadable pattern**: `syncLoadable` in `stores/sync.ts` for async initialization

### Navigation
- **PagerView** (NOT Expo Router tabs) for horizontal swipe between 2 pages
- Standard schedule (page 1) and Extra schedule (page 2)
- Page position tracked in `pagePositionAtom`

### Timer System (4 concurrent timers in `stores/timer.ts`)
1. `standard` - Countdown to next standard prayer
2. `extra` - Countdown to next extra prayer
3. `overlay` - Countdown for overlay-selected prayer
4. `midnight` - Watches for date change to trigger sync

### Notification System
- 6-day rolling buffer scheduled ahead
- 16 Android notification channels (one per Athan sound)
- Refresh every 24 hours
- Three alert types: Off, Silent, Sound
- Android uses SCHEDULE_EXACT_ALARM

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Expo Router pages (4 files) |
| `stores/` | Jotai atoms + MMKV storage (8 files) |
| `components/` | UI components (21 files) |
| `hooks/` | Custom hooks: useSchedule, usePrayer, useNotification, useAnimation |
| `shared/` | Types, constants, utilities |
| `device/` | Native integrations: notifications, listeners, updates |
| `api/` | London Prayer Times API client |
| `assets/audio/` | 16 Athan sound files |

## Conventions

### Imports (ESLint enforced)
```typescript
// external
import { View } from 'react-native';
import { atom } from 'jotai';

// internal (@/* alias)
import * as Database from '@/stores/database';

// relative
import { Prayer } from './Prayer';
```

### State Pattern
- NO React Context - use Jotai atoms
- Direct store: `const store = getDefaultStore(); store.get(atom)`
- Persistence: `atomWithStorageString/Number/Boolean/Array/Object`

### Component Pattern
- Default exports for components
- Named exports for utilities/stores
- Interfaces at file top

### TypeScript
- Strict mode enabled
- All shared types in `shared/types.ts`
- Key enums: `ScheduleType`, `AlertType`, `DaySelection`

## MMKV Storage Keys

- `prayer_YYYY-MM-DD` - Daily prayer data
- `fetched_years` - `{[year]: boolean}` tracking
- `preference_alert_{standard|extra}_{index}` - Alert type per prayer
- `preference_sound` - Selected Athan (0-15)
- `scheduled_notifications_{type}_{index}_{id}` - Notification tracking

## Known Issues

- **BUG-2**: Double notifications on iOS & Android
- **BUG-3**: Android delayed notifications (±1-3 mins) on some devices

## Configuration

| File | Purpose |
|------|---------|
| `app.json` | Expo config (new architecture enabled, notification sounds, permissions) |
| `eas.json` | Build profiles |
| `tsconfig.json` | TypeScript strict, `@/*` path alias |
| `eslint.config.mjs` | Flat config, import ordering |

## Recent Migration (SDK 54)

**Completed:** Expo SDK 52 → 54, React 18.3 → 19.1, RN 0.76 → 0.81

**Key Changes:**
- **Audio**: Migrated from `expo-av` to `expo-audio` (uses `useAudioPlayer` + `useAudioPlayerStatus` hooks)
- **MMKV v4**: Now a Nitro Module - use `createMMKV()` instead of `new MMKV()`, `.remove()` instead of `.delete()`
- **Edge-to-edge**: Removed `react-native-edge-to-edge`, using `expo-status-bar` instead
- **Background fetch**: Removed deprecated `expo-background-fetch` and `device/tasks.ts`
- **Notifications**: New behavior requires `shouldShowBanner` and `shouldShowList` in handler
