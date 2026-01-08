---
name: rn-jotai-state
description: Jotai state management patterns with MMKV integration for React Native prayer times app
license: MIT
compatibility: opencode
metadata:
  audience: developers
  tech: "jotai, mmkv, react-native"
---

# Jotai State Management with MMKV

## What I do

I guide you through the unique Jotai + MMKV architecture used in this React Native prayer times app. This project uses **no React Context** - instead, vanilla Jotai store access with custom MMKV storage adapters.

## Core Patterns

### 1. Vanilla Store Access

**Never use React Context** - All state accessed via `getDefaultStore()`:

```typescript
import { getDefaultStore } from 'jotai/vanilla';
import { someAtom } from '@/stores/ui';

const store = getDefaultStore();

// Read atom
const value = store.get(someAtom);

// Write atom
store.set(someAtom, newValue);
```

### 2. Custom MMKV Storage Adapters

**Never use AsyncStorage** - All persistence via custom atoms in `stores/storage.ts`:

```typescript
import { atom } from 'jotai';
import { atomWithStorageString } from '@/stores/storage';

// Persistent string atom
export const dateAtom = atomWithStorageString('display_date', '');

// Persistent number atom
export const soundAtom = atomWithStorageNumber('preference_sound', 0);

// Persistent array atom
export const notificationsAtom = atomWithStorageArray('scheduled_notifications', []);
```

**Storage Adapters Available:**
- `atomWithStorageString(key, default)`
- `atomWithStorageNumber(key, default)`
- `atomWithStorageBoolean(key, default)`
- `atomWithStorageArray(key, default)`
- `atomWithStorageObject(key, default)`

### 3. Named Exports Only

**All stores use named exports** - No default exports:

```typescript
// ✅ CORRECT
export const syncLoadable = loadable(atom(async () => sync()));
export const dateAtom = atomWithStorageString('display_date', '');
export const triggerSyncLoadable = () => store.get(syncLoadable);

// ❌ WRONG - never default export from stores
export default store;
```

### 4. Action Functions Pattern

**Export imperative action functions** for external updates:

```typescript
// stores/schedule.ts
export const getSchedule = (type: ScheduleType): ScheduleStore => store.get(getScheduleAtom(type));

export const setSchedule = (type: ScheduleType, date: Date): void => {
  const scheduleAtom = getScheduleAtom(type);
  const currentSchedule = store.get(scheduleAtom);
  
  const { today, tomorrow } = buildDailySchedules(type, date);
  const nextIndex = PrayerUtils.findNextPrayerIndex(today);
  
  store.set(scheduleAtom, { ...currentSchedule, type, today, tomorrow, nextIndex });
};
```

## Storage Key Naming Convention

### Prayer Data
- `prayer_YYYY-MM-DD` - Daily prayer times (e.g., `prayer_2026-01-08`)
- `fetched_years` - Record of fetched years: `{[year]: boolean}`
- `display_date` - Currently displayed date

### Notifications
- `scheduled_notifications_standard_{index}_{id}` - Standard prayer notification
- `scheduled_notifications_extra_{index}_{id}` - Extra prayer notification
- `last_notification_schedule_check` - Timestamp of last refresh
- `preference_mute_standard` - Standard prayers mute state
- `preference_mute_extra` - Extra prayers mute state
- `preference_sound` - Selected Athan sound (0-15)

### Alert Preferences
- `preference_alert_standard_{0-5}` - Fajr to Isha alert types
- `preference_alert_extra_{0-3}` - Last Third, Suhoor, Duha, Istijaba

### UI Cache
- `prayer_max_english_width_standard` - Cached prayer name width
- `prayer_max_english_width_extra` - Cached extra prayer width
- `measurements_list` - Cached list positioning
- `measurements_date` - Cached date positioning

### Database Cleanup Exclusions (DO NOT DELETE)
```
popup_update_last_check
popup_tip_athan_enabled
popup_times_explained_enabled
prayer_max_english_width_*
scheduled_notifications_*
preference_*
last_notification_schedule_check
```

## Loadable Pattern for Async Data

**Use `loadable` utility** for async atom initialization:

```typescript
import { atom } from 'jotai';
import { loadable } from 'jotai/utils';
import { getDefaultStore } from 'jotai/vanilla';

const store = getDefaultStore();

// Create loadable atom for async operation
export const syncLoadable = loadable(atom(async () => sync()));

// Trigger load
export const triggerSyncLoadable = () => store.get(syncLoadable);
```

**In components:**
```typescript
import { useAtomValue } from 'jotai/utils';
import { syncLoadable } from '@/stores/sync';

const syncState = useAtomValue(syncLoadable); // 'loading' | 'hasData' | 'hasError'
```

## Anti-Patterns to Avoid

### 1. React Context
```typescript
// ❌ WRONG - never use Context
<ScheduleContext.Provider value={schedule}>
  <Child />
</ScheduleContext.Provider>

// ✅ CORRECT - use vanilla store access
const store = getDefaultStore();
const schedule = store.get(scheduleAtom);
```

### 2. Default Exports from Stores
```typescript
// ❌ WRONG
export default store;

// ✅ CORRECT
export const syncLoadable = loadable(atom(async () => sync()));
export const dateAtom = atomWithStorageString('display_date', '');
```

### 3. JSON.parse Without Validation
```typescript
// ⚠️ RISKY - type coercion
const value = JSON.parse(mmkv.getString(key)) as T[];

// ✅ CORRECT - add validation
try {
  const value = JSON.parse(mmkv.getString(key));
  if (!Array.isArray(value)) throw new Error('Invalid data');
  return value as T[];
} catch (error) {
  return defaultValue;
}
```

## When to Use Me

Use this skill when:
- Creating new state atoms in `stores/`
- Adding new storage keys to MMKV
- Refactoring existing state management
- Debugging state-related issues
- Implementing new features requiring persistent storage

## File Locations

| Purpose | File | Notes |
|---------|-------|-------|
| Storage adapters | `stores/storage.ts` | atomWithStorage* implementations |
| MMKV wrapper | `stores/database.ts` | get/set/removeItem functions |
| Schedule state | `stores/schedule.ts` | Standard/Extra schedule atoms |
| UI state | `stores/ui.ts` | Modals, overlay, measurements |
| Timer state | `stores/timer.ts` | 4 concurrent timer atoms |
| Sync orchestration | `stores/sync.ts` | syncLoadable, data fetch |
| Notification state | `stores/notifications.ts` | Alert preferences, scheduling |

## Common Operations

### Create Persistent Atom
```typescript
import { atomWithStorageString } from '@/stores/storage';

export const myAtom = atomWithStorageString('my_key', 'default_value');
```

### Imperative Store Update
```typescript
import { getDefaultStore } from 'jotai/vanilla';

const store = getDefaultStore();
store.set(myAtom, newValue);
```

### Read Atom from Store
```typescript
const store = getDefaultStore();
const value = store.get(myAtom);
```

## Notes

- This project uses **Jotai v2.16.1**
- **MMKV v3.3.3** for persistent storage
- No React Context anywhere in codebase
- All state atoms use named exports
- Custom storage adapters bridge MMKV to Jotai
