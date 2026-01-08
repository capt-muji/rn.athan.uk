# STORES - JOTAI STATE MANAGEMENT

## OVERVIEW

Jotai atom-based state with MMKV persistence, vanilla store access, no React Context.

## WHERE TO LOOK

| File                 | Purpose                 | Key Features                                                       |
| -------------------- | ----------------------- | ------------------------------------------------------------------ |
| **sync.ts**          | Main orchestration      | `syncLoadable`, data fetch, timer initialization                   |
| **schedule.ts**      | Prayer schedules        | Standard/Extra atoms, `setSchedule()`, `incrementNextIndex()`      |
| **timer.ts**         | Countdown timers        | 4 concurrent (standard, extra, overlay, midnight), `startTimers()` |
| **notifications.ts** | Notification scheduling | 6-day rolling buffer, alert preferences, `refreshNotifications()`  |
| **database.ts**      | MMKV wrapper            | Prayer CRUD, notification tracking, `cleanup()`                    |
| **ui.ts**            | UI state                | Modals, overlay, page position, cached measurements                |
| **storage.ts**       | Jotai-MMKV adapters     | `atomWithStorageString/Number/Boolean/Array/Object`                |
| **overlay.ts**       | Overlay state           | Large font mode, prayer selection timer                            |

## CONVENTIONS

### Export Pattern

- **ALL named exports** - No default exports
- Store access: `getDefaultStore().get/set(atom)` for imperative updates
- Action functions: `setSchedule()`, `getSchedule()`, `incrementNextIndex()`

### Storage Keys (MMKV)

- Prayers: `prayer_YYYY-MM-DD`
- Notifications: `scheduled_notifications_{type}_{index}_{id}`
- Preferences: `preference_alert_{type}_{index}`, `preference_mute_{type}`
- UI cache: `prayer_max_english_width_{type}`, `measurements_*`

## ANTI-PATTERNS

### Type Coercion Risk

- **storage.ts:59, 74**: `JSON.parse(value) as T[]` without validation
- **database.ts:14**: `JSON.parse(value)` without try-catch
- **Action Required**: Add validation + error handling

### Storage Cleanup

- Intentionally excludes preferences, notifications, cached measurements
- See `cleanup()` for preservation rules (lines 139-150)
