# SHARED - ATHAN.UK REACT NATIVE PROJECT

**Generated:** 2025-01-08  
**Purpose:** Pure utilities and types shared across the app (686 lines, 6 files)

---

## OVERVIEW

Pure utility functions and TypeScript types for prayer times, notifications, and time management.

---

## WHERE TO LOOK

| Task                       | Location           | Notes                                                                                 |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------- |
| **Type definitions**       | `types.ts`         | 26 interfaces, 4 enums (IApiSingleTime, ITransformedPrayer, ScheduleStore, AlertType) |
| **App constants**          | `constants.ts`     | Prayer names (EN/AR), colors, animations, time adjustments                            |
| **Prayer data transform**  | `prayer.ts`        | filterApiData, transformApiData, createSchedule, findNextPrayerIndex                  |
| **Time utilities**         | `time.ts`          | createLondonDate, secondsRemainingUntil, formatTime, calculateCountdown, timer        |
| **Notification utilities** | `notifications.ts` | genTriggerDate, genNotificationContent, initializeNotifications                       |

---

## CONVENTIONS

### Export Pattern

- **NAMED EXPORTS ONLY** - No default exports in any file
- Import: `import * as TimeUtils from '@/shared/time'` or `import { createLondonDate } from '@/shared/time'`

### Type-First Design

- All interfaces defined at top of `types.ts` (shared across codebase)
- Enums for fixed values: `ScheduleType`, `AlertType`, `AlertIcon`, `DaySelection`
- All functions fully typed with TypeScript

### Time Zone Handling

- **London timezone hardcoded** - All dates via `createLondonDate()` using `date-fns-tz`
- Consistent date format: `YYYY-MM-DD`
- Time format: `HH:mm` (24-hour)

---

## ANTI-PATTERNS

### Production Logging Disabled

**File:** `logger.ts`  
**Issue:** Pino logger disabled in `prod` and `preview` environments  
**Trade-off:** Performance vs observability - no production error tracking  
**Recommendation:** Add error tracking service (Sentry, Crashlytics)

### Type Coercion Risk

**File:** See `stores/storage.ts` (not in this dir)  
**Issue:** `JSON.parse(value) as T[]` without validation  
**Action Required:** Add try-catch + validation when using these types with storage

---

## TIME ADJUSTMENTS (from constants.ts)

| Prayer     | Adjustment | Notes                            |
| ---------- | ---------- | -------------------------------- |
| Last Third | +5 min     | After last third of night begins |
| Suhoor     | -40 min    | Before Fajr                      |
| Duha       | +20 min    | After Sunrise                    |
| Istijaba   | -59 min    | Before Magrib (Fridays only)     |
