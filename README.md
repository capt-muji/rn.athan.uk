<br/>
<br/>
<br/>

<div align="center">
  <img src="./assets/icons/svg/masjid.svg" width="100" height="100" alt="Mosque icon" />
</div>
<br/>

<div align="center">
  
# Athan.uk

<br/>

[![Platform - Web](https://img.shields.io/badge/Platform-Web-0078D4?style=flat&logo=google-chrome&logoColor=white)](https://athan.uk)
[![Platform - Android](https://img.shields.io/badge/Platform-Android-3DDC84?style=flat&logo=android&logoColor=white)](https://athan.uk)
[![Platform - iOS](https://img.shields.io/badge/Platform-iOS-000000?style=flat&logo=apple&logoColor=white)](https://ios.athan.uk)

A React Native mobile app for Muslim prayer times in London, UK

</div>

<br/>
<br/>
<br/>

## 🎯 Marketing

<br/>

<div align="center">
  <img src="./assets/marketing/ios/ios-marketing-shot1.png" height="500" alt="Prayer Details" style="margin: 0 20px"/>
  <img src="./assets/marketing/ios/ios-marketing-shot9.png" height="500" alt="Prayer Details" style="margin: 0 20px"/>
  <img src="./assets/marketing/ios/ios-marketing-shot2.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/ios/ios-marketing-shot3.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/ios/ios-marketing-shot4.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/ios/ios-marketing-shot5.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/ios/ios-marketing-shot6.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/ios/ios-marketing-shot7.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/ios/ios-marketing-shot8.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/ios/ipad-marketing-shot1.png" height="860" alt="Prayer Details" style="margin: 0 20px" />
</div>

<br/>
<br/>

### Resources

**[Figma Designs: Marketing](https://www.figma.com/design/FMGlFD7Xz2OUFeGOihFZfO/Untitled?node-id=0-1&t=5PtfJiMrg2OVm1AQ-1)**

**[Figma Designs: App Icon](https://www.figma.com/design/WqP1Vd0aVmyxNuuac4aukJ/Athan-app-icon?node-id=0-1&t=W7KZBNNLhm2vxUgt-1)**

<br/>
<br/>

## 📝 Recent Updates

### All Features Complete (2026-01-21)

All 11 development features have been completed, tested, and archived:

- ✅ **Timing System Overhaul**: Major refactor to prayer-centric model (ADR-005)
- ✅ **Timing System Bugfixes**: 5 post-refactor bugs resolved
- ✅ **Isha Display Bug**: Critical Standard schedule fix
- ✅ **Islamic Day Boundary**: Prayer-based day advancement
- ✅ **CountdownBar Midnight Fix**: Accurate midnight progress display
- ✅ **Midnight Prayer**: New Extra prayer (midpoint Magrib-Fajr)
- ✅ **Prayer Explanations**: Contextual overlay help text
- ✅ **Overlay Date Display**: Formatted date in overlay
- ✅ **Measurement Improvements**: Android font scaling fix
- ✅ **Codebase Cleanup**: ~100 lines duplication eliminated

<br/>
<br/>

## 🗺 Roadmap

### Completed Features

- [x] Prayer times display with real-time countdown
- [x] Prayer-based day boundary with smooth animations (Islamic midnight)
- [x] Offline support with local data caching
- [x] Customizable notifications with multiple alert modes (at-time + reminder)
- [x] 16 selectable Athan audio notification options
- [x] View tomorrow's prayer times
- [x] Automatic yearly data refresh
- [x] Multipage with special times (Midnight, Third of night, Duha, Suhoor, Istijaba)
- [x] Large overlay font overlay for visually impaired
- [x] Fix UI countdown drift when app in background
- [x] Settings bottom sheet (countdown bar, Hijri date, seconds, time passed, Arabic names, decorations, color picker)
- [x] Alert menu with per-prayer at-time and reminder notification controls
- [x] Background notification refresh task (~3 hour intervals)
- [x] SDK 54 upgrade (React 19, RN 0.81, Expo 54)

### Known Limitations

- BUG-3: Some Android devices may receive notifications 1-3 minutes off (hardware/driver issue, unfixable in app)

### Upcoming Improvements

- [ ] Building locally (mac mini m1)
- [ ] Widget support
- [ ] Qibla direction finder
- [ ] Multi-location support (separate open source project)

<br/>
<br/>

## 📡 Data Source

Prayer times data sourced from [London Prayer Times](https://www.londonprayertimes.com/)

<br/>

## ⚡ Features

### Display & User Interface

- 📅 **Daily Prayer Times**: View all 5 standard prayers plus 5 special prayers
- ⏰ **Real-time Countdown**: Live countdown showing exact time remaining
- 🔄 **Tomorrow's Prayer Times**: Swipe between today and tomorrow
- 🔍 **Large Overlay Font**: Accessible mode for visually impaired
- 🌙 **Smart Prayer Tracking**: Automatically tracks passed/next/upcoming prayers
- ⚙️ **Settings**: Countdown bar toggle + color picker, Hijri date, show seconds, time passed, Arabic names, seasonal decorations
- 🗓️ **Hijri Date**: Optional Islamic calendar format
- 🕌 **Arabic Prayer Names**: Optional dual-language display

### Notifications & Alerts

- 🔔 **Customizable Alerts**: Off / Silent / Sound per prayer (at-time and reminder)
- ⏰ **Configurable Reminders**: 5-30 minute pre-prayer reminders with adjustable interval
- 📢 **16 Selectable Athan Sounds**: Multiple Islamic audio options
- 📅 **Smart Notification Buffer**: 2-day rolling schedule
- 🛡️ **Sequential Scheduling Queue**: Operations queued and executed in order, never dropped

### Data & Offline Support

- 💾 **Local Data Caching**: Entire year stored in MMKV v4
- 🔄 **Automatic Yearly Refresh**: Detects year transition, fetches new data
- 📱 **Full Offline Support**: Works after initial sync
- 🎯 **Precise Synchronization**: Countdown countdowns sync with system clock
- ⬆️ **Smart App Upgrades**: Clears stale cache, preserves preferences

<br/>

## 🔄 Update Popup

The app checks for new versions once every 24 hours on launch (`device/updates.ts`). The installed version is compared against the store/remote version using semantic versioning (`shared/versionUtils.ts`):

| Scenario                                          | Result                                                                                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Remote version greater than installed version** | User sees a dismissible update popup with "Later" and "Update" buttons. "Update" opens the platform's app store. "Later" dismisses the popup. The popup will reappear on the next launch after 24 hours. |
| **Remote version equal to installed version**     | Nothing happens. No popup shown. The user is on the latest version.                                                                                                                                      |
| **Remote version less than installed version**    | Nothing happens. No popup shown. The user has a newer version than what is listed remotely (e.g., the remote config hasn't been updated yet after a release).                                            |
| **Remote version is `null` or fetch fails**       | Nothing happens. No popup shown. The check is silently skipped and retried after 24 hours. The app never crashes from a failed update check.                                                             |

The popup modal is implemented in `components/modals/Update.tsx` and its state is managed by `popupUpdateEnabledAtom` in `stores/ui.ts`.

### Version Sources

Environment is determined by `EXPO_PUBLIC_ENV` via `isProd()` in `shared/config.ts`. When set to `prod`, the production path is used; all other values (`preview`, `local`, unset) use the UAT path.

| Environment    | iOS                                                                   | Android                                                    |
| -------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Production** | iTunes Lookup API (`itunes.apple.com/lookup?bundleId=...&country=gb`) | `releases.json` → `production.updatePopup.android.version` |
| **UAT**        | `releases.json` → `uat.updatePopup.ios.version`                       | `releases.json` → `uat.updatePopup.android.version`        |

Production iOS uses the iTunes API for automatic detection. All other combinations read from `releases.json` at the repository root on the `main` branch (fetched via `raw.githubusercontent.com`). Changes to `releases.json` on other branches have no effect.

> **Note:** `production.updatePopup.ios.version` is set to `null` by design — production iOS version detection is fully automatic via the iTunes API, so this field is never read. Setting it to any value has no effect. It exists for structural consistency.

Each entry in `releases.json` has a `_comment` field explaining its purpose, the version comparison behavior, and when to update it.

### Release Workflow

1. Push new app update to stores
2. Wait for store release
3. Update the appropriate version in `releases.json` on `main` branch
4. Users on outdated versions see the update popup on next launch (within 24 hours)

### Throttle & Failure Behavior

The 24-hour throttle timer is always set regardless of whether the check succeeds or fails. This means:

- On success: the next check occurs no sooner than 24 hours later
- On failure (network error, malformed response, etc.): the check is silently skipped and the next retry occurs no sooner than 24 hours later
- The app never shows an error to the user for a failed update check

<br/>

## 🕌 Prayer Times

### Standard Prayers (6)

| Prayer      |
| ----------- |
| **Fajr**    |
| **Sunrise** |
| **Dhuhr**   |
| **Asr**     |
| **Magrib**  |
| **Isha**    |

### Extra Prayers (5)

| Prayer                  | Time                                    |
| ----------------------- | --------------------------------------- |
| **Midnight**            | Midpoint between Magrib and Fajr        |
| **Last Third of Night** | Start of last third of night            |
| **Suhoor**              | 20 minutes before Fajr                  |
| **Duha**                | 20 minutes after Sunrise                |
| **Istijaba**            | 60 minutes before Magrib (Fridays only) |

<br/>

## 🛠 Technical Overview

### Architecture

- **Framework**: React Native 0.81.5, Expo 54.0.31
- **State**: Jotai atoms (no Redux/Context)
- **Storage**: MMKV v4 (Nitro Module)
- **Animation**: Reanimated 4 (worklets)
- **Notifications**: Expo Notifications
- **Dates**: date-fns / date-fns-tz (London timezone)

### Key Design Decisions

1. **Prayer-Centric Timing**: Full DateTime objects, not date+time strings (avoids midnight-crossing bugs)
2. **Prayer-Based Day Boundary**: Schedule advances after final prayer, not midnight
3. **Independent Schedules**: Standard and Extras can show different dates
4. **NO FALLBACKS**: Data layer always provides complete data, UI layer trusts the data

### Data Flow

```
API → Process (strip old dates, calculate special prayers) → Cache MMKV → Display → Schedule notifications
```

### Storage (MMKV)

```
MMKV
├── Prayer Data: prayer_YYYY-MM-DD
├── Fetched Years: fetched_years
├── Notifications: scheduled_notifications_*, scheduled_reminders_*
└── Preferences: preference_*
```

### Codebase Organization

The codebase follows a clean architecture pattern with clear separation of concerns:

```
├── app/                    # App entry points and navigation
│   ├── index.tsx          # Root component, initialization
│   ├── _layout.tsx        # App layout wrapper
│   ├── Navigation.tsx     # Tab navigation (Standard/Extra)
│   └── Screen.tsx         # Screen wrapper
│
├── components/            # UI components (organized by feature)
│   ├── prayer/            # Prayer display (Prayer, Alert, Time, Ago, etc.)
│   ├── countdown/         # Countdown timer (Countdown, Bar)
│   ├── overlay/           # Full-screen overlay
│   ├── sheets/            # Bottom sheets (screens/, parts/)
│   ├── modals/            # Modal dialogs (Modal, Update)
│   ├── ui/                # Shared UI (Icon, Masjid, Glow, Error, etc.)
│   └── day/               # Day component
│
├── hooks/                 # Custom React hooks (logic extraction)
│   ├── useAlertAnimations.ts  # Alert icon animations
│   ├── useAnimation.ts        # Animation utilities
│   ├── useCountdown.ts        # Countdown state hook
│   ├── useCountdownBar.ts     # Progress bar hook
│   ├── useNotification.ts     # Notification handling
│   ├── usePrayer.ts           # Prayer state and actions
│   ├── usePrayerAgo.ts        # Time-ago display
│   ├── usePrayerSequence.ts   # Prayer sequence logic
│   ├── useSchedule.ts         # Schedule management
│   └── useWindowDimensions.ts # Screen dimension hook
│
├── stores/                # State management (Jotai atoms)
│   ├── atoms/
│   │   └── overlay.ts     # Overlay atom (state)
│   ├── schedule.ts        # Prayer sequence state
│   ├── notifications.ts   # Notification state
│   ├── countdown.ts       # Countdown state
│   ├── overlay.ts         # Overlay actions
│   ├── sync.ts            # Data sync and initialization
│   ├── database.ts        # MMKV storage wrapper
│   ├── storage.ts         # MMKV instance setup
│   ├── ui.ts              # UI state atoms
│   └── version.ts         # App version management
│
├── shared/                # Shared utilities and constants
│   ├── config.ts          # App configuration
│   ├── constants.ts       # App constants (colors, timings, etc.)
│   ├── logger.ts          # Logging wrapper (Pino)
│   ├── notifications.ts   # Notification utilities
│   ├── prayer.ts          # Prayer creation and calculations
│   ├── text.ts            # Text formatting utilities
│   ├── time.ts            # Time manipulation utilities
│   ├── types.ts           # TypeScript type definitions
│   └── versionUtils.ts    # Version comparison utilities
│
├── api/                   # API client
│   ├── client.ts          # Prayer times API fetch/transform
│   └── config.ts          # API configuration
│
├── device/                # Device-specific code
│   ├── notifications.ts   # Platform notification handlers
│   ├── listeners.ts       # App state listeners
│   ├── updates.ts         # App update handling
│   └── tasks.ts           # Background task management
│
├── mocks/                 # Mock data for development and testing
│   ├── full.ts            # Full API response mock dataset
│   ├── simple.ts          # Simplified mock data (used in dev mode)
│   └── timing-system-schema.ts  # Timing system type reference and examples
│
└── ai/                    # AI agent instructions and ADRs
    ├── AGENTS.md          # Agent behavior instructions
    ├── USAGE.md           # AI usage guide
    ├── prompts/           # AI prompt templates
    ├── adr/               # Architecture Decision Records
    └── features/          # Feature specifications
```

### Key Patterns

1. **Data Flow**: Components → Hooks → Stores → Shared/Api → MMKV
2. **State Management**: Jotai atoms with derived atoms for computed values
3. **Animations**: Reanimated worklets with custom hooks
4. **Date Handling**: All dates in London timezone using date-fns-tz

### Code Quality

- **Testing**: Jest with ts-jest for unit tests (`yarn test`)
- **Type Safety**: Full TypeScript coverage with strict mode
- **Linting**: ESLint + Prettier (120 char lines, 2 spaces, single quotes)
- **Logging**: Pino logger (no console.log statements)
- **JSDoc**: All public functions documented with examples

### Architecture Patterns

The codebase follows established patterns for consistency:

1. **Helper Function Extraction**: Complex logic extracted into named functions
   - Example: `parseNightBoundaries()` in time.ts
   - Example: `getYesterdayFinalPrayer()` in schedule.ts

2. **Section Comments**: Files organized with clear section headers

   ```typescript
   // =============================================================================
   // SECTION NAME
   // =============================================================================
   ```

3. **Animation Hook Extraction**: Component animations encapsulated in hooks
   - Example: `useAlertAnimations.ts` for Alert component

4. **Sequential Queue Pattern**: Queue-based scheduling lock for notification operations
   - Example: `withSchedulingLock()` in notifications.ts

See `ai/adr/` for Architecture Decision Records.

## 🎨 Tech Stack

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)
![Pino](https://img.shields.io/badge/Pino-FFF000?style=for-the-badge&logo=pino&logoColor=black)
![MMKV Storage](https://img.shields.io/badge/MMKV-2C4F7C?style=for-the-badge)
![Jotai](https://img.shields.io/badge/Jotai-FF4154?style=for-the-badge)
![Reanimated](https://img.shields.io/badge/Reanimated_4-6B52AE?style=for-the-badge)
![Offline Support](https://img.shields.io/badge/Offline_Support-4CAF50?style=for-the-badge)

<br/>

## 🚀 Development

### Prerequisites

- Node.js 16+
- Expo CLI (v54+)
- iOS: Xcode 15+ (for iOS simulator/device builds)
- Android: Android Studio with NDK (for native module builds)

### Installation

1. Start the app (this will clear cache, install dependencies and start the server)

   ```bash
   # Clears cache, installs packages and starts server
   yarn reset
   ```

2. How to install new dependencies

   ```bash
   # Install package
   npx expo install <package-name>
   ```

3. When installing new dependencies that require native modules

   ```bash
   # Install package
   npx expo install <package-name>

   # Development build for iOS
   eas build --profile development --platform ios

   # For physical device:
   # 1. After build success, scan QR code from expo website to install on device
   # 2. Start server
   yarn reset
   # 3. Open installed app that was installed from the QR code

   # For iOS simulator:
   yarn ios # builds native modules for simulator
   yarn reset
   ```

In the output, you'll find options to open the app in a:

- Development build
- Android emulator
- iOS simulator

<br/>

## Athans

- Athan 1: https://www.youtube.com/watch?v=oV-ZRQjgCSk
- Athan 2: Unspecified
- Athan 3: https://www.youtube.com/watch?v=tulY0QvKy_o
- Athan 4: https://www.dailymotion.com/video/x8g7yz2
- Athan 5: https://www.dailymotion.com/video/x8gmb7b
- Athan 6: https://www.youtube.com/watch?v=vS0zBleiJuk
- Athan 7: https://www.youtube.com/watch?v=G96FEkkFCzg
- Athan 8: https://www.youtube.com/watch?v=iaWZ_3D6vOQ
- Athan 9: https://www.youtube.com/watch?v=4_LN0hznp-A
- Athan 10: https://www.youtube.com/watch?v=LHu2NbbZ0i0
- Athan 11: https://www.youtube.com/watch?v=j-G8vgDpxiI
- Athan 12: https://www.youtube.com/watch?v=9Y-8AtTDx20
- Athan 13: https://www.youtube.com/watch?v=qijUyKRiaHw
- Athan 14: Unspecified
- Athan 15: https://www.youtube.com/watch?v=CxI53S_otJA
- Athan 16: Unspecified

<br/>

### Screenshots

<div align="center">
  <img src="./assets/marketing/screenshots/app-shot1.png" height="500" alt="Prayer Details" style="margin: 0 20px"/>
  <img src="./assets/marketing/screenshots/app-shot2.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot3.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot4.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot5.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot10.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot6.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot7.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot8.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot9.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot11.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot13.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/marketing/screenshots/app-shot12.png" height="500" alt="Prayer Details" style="margin: 0 20px" />
</div>

<br/>

### Notification System

#### Overview

The notification system maintains a **2-day rolling buffer** of scheduled notifications that refreshes every 4 hours. This ensures users always have notifications queued ahead while preventing duplication and keeping the system efficient.

**Key Features:**

- 2 days of notifications scheduled ahead for each enabled prayer
- 11 prayers total: 6 Standard (Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha) + 5 Extra (Midnight, Last Third, Suhoor, Duha, Istijaba)
- Sequential scheduling queue (operations chained, never dropped)
- Maintains consistency even when app is closed or backgrounded
- Persists through app restarts and offline usage

#### Notification Rescheduling Scenarios

All 14 scenarios grouped by behaviour:

**Global Reschedule (scenarios 1–4)**

| #   | Trigger           | Entry Point                    | What it does                                       | When                                          |
| --- | ----------------- | ------------------------------ | -------------------------------------------------- | --------------------------------------------- |
| 1   | App launch        | `refreshNotifications()`       | Checks staleness, then full cancel + reschedule    | If ≥4 hrs since last schedule (or first time) |
| 2   | Foreground resume | `refreshNotifications()`       | Same staleness check as app launch                 | If ≥4 hrs since last schedule                 |
| 3   | Background task   | `refreshNotifications()`       | Unconditional full cancel + reschedule             | Always (~3 hr OS-controlled intervals)        |
| 4   | Sound change      | `rescheduleAllNotifications()` | Full cancel + reschedule, bypasses staleness check | Immediately when audio sheet closes           |

Steps:

1. `Notifications.cancelAllScheduledNotificationsAsync()` — cancels ALL OS-level notifications
2. `Database.clearAllScheduledNotificationsForSchedule()` × 2 — deletes `scheduled_notifications_*` MMKV keys for Standard + Extra
3. `Database.clearAllScheduledRemindersForSchedule()` × 2 — deletes `scheduled_reminders_*` MMKV keys for Standard + Extra
4. For each enabled prayer: `Device.addOneScheduledNotificationForPrayer()` + `Database.addOneScheduledNotificationForPrayer()` × NOTIFICATION_ROLLING_DAYS
5. For each enabled reminder: `Device.addOneScheduledReminderForPrayer()` + `Database.addOneScheduledReminderForPrayer()` × NOTIFICATION_ROLLING_DAYS
6. Updates `preference_last_notification_schedule_check` timestamp

**Per-Prayer Update (scenarios 5–11)**

| #   | Trigger                  | Entry Point                   | What it does                                           | When                                      |
| --- | ------------------------ | ----------------------------- | ------------------------------------------------------ | ----------------------------------------- |
| 5   | Enable at-time alert     | `updatePrayerNotifications()` | Clears + schedules at-time for one prayer              | Sheet closes via `commitAlertMenuChanges` |
| 6   | Disable at-time alert    | `updatePrayerNotifications()` | Clears at-time for one prayer, schedules nothing       | Sheet closes via `commitAlertMenuChanges` |
| 7   | Change at-time sound     | `updatePrayerNotifications()` | Clears + re-schedules at-time with new sound           | Sheet closes via `commitAlertMenuChanges` |
| 8   | Enable reminder          | `updatePrayerNotifications()` | Clears + schedules reminder for one prayer             | Sheet closes via `commitAlertMenuChanges` |
| 9   | Disable reminder         | `updatePrayerNotifications()` | Clears reminder for one prayer, schedules nothing      | Sheet closes via `commitAlertMenuChanges` |
| 10  | Change reminder sound    | `updatePrayerNotifications()` | Clears + re-schedules reminder with new sound          | Sheet closes via `commitAlertMenuChanges` |
| 11  | Change reminder interval | `updatePrayerNotifications()` | Clears + re-schedules reminder with new minutes offset | Sheet closes via `commitAlertMenuChanges` |

Steps:

1. `Device.clearAllScheduledNotificationForPrayer()` — cancels OS notifications matching this prayer's stored IDs
2. `Database.clearAllScheduledNotificationsForPrayer()` — deletes MMKV keys for this prayer
3. Same for reminders if reminder changed
4. Schedule new notifications/reminders for this prayer × NOTIFICATION_ROLLING_DAYS
5. At-time + reminder run in parallel within single lock acquisition

**Cache Clear (scenarios 12–14)** — wipe only, reschedule happens on next app launch/resume

| #   | Trigger        | Entry Point           | What it does                             | When                          |
| --- | -------------- | --------------------- | ---------------------------------------- | ----------------------------- |
| 12  | App upgrade    | `clearUpgradeCache()` | Wipes all non-preference MMKV keys       | On version mismatch at launch |
| 13  | Error boundary | `clearUpgradeCache()` | Same wipe, recovers from corrupt state   | On unrecoverable error        |
| 14  | Concurrent ops | `clearUpgradeCache()` | Same wipe, recovers from lock contention | On lock contention recovery   |

Steps:

1. `Database.clearAllExcept(['app_installed_version', 'preference_'])` — deletes all non-preference MMKV keys
2. `Database.database.remove('preference_last_notification_schedule_check')` — forces next `shouldRescheduleNotifications()` to return true
3. Actual rescheduling happens on next `refreshNotifications()` call (app launch or foreground resume)

#### Sequential Scheduling Queue

All entry points are protected by `withSchedulingLock()`, a queue-based concurrency mechanism:

- Operations are chained onto a `Promise` queue and execute sequentially
- Unlike a skip-based lock, **no operations are ever dropped** — every request runs in order
- Prevents double notifications from concurrent scheduling while ensuring all user actions complete
- `updatePrayerNotifications()` runs clear+schedule atomically within a single lock acquisition — at-time and reminder operations execute in parallel (independent MMKV keys and OS notification IDs)

#### Constants

| Constant                         | Value | Description                              |
| -------------------------------- | ----- | ---------------------------------------- |
| `NOTIFICATION_ROLLING_DAYS`      | 2     | Days ahead to schedule notifications     |
| `NOTIFICATION_REFRESH_HOURS`     | 4     | Hours between foreground refresh cycles  |
| `BACKGROUND_TASK_INTERVAL_HOURS` | 3     | Hours between background task executions |
