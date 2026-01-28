<br/>
<br/>
<br/>

<div align="center">
  <img src="./assets/icons/masjid.svg" width="100" height="100" alt="Mosque icon" />
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
- [x] Customizable notifications with multiple alert modes
- [x] Over 10 selectable Athan audio notification options
- [x] View tomorrow's prayer times
- [x] Automatic yearly data refresh
- [x] Multipage with special times (Midnight, Third of night, Duha, Suhoor, Istijaba)
- [x] Large overlay font overlay for visually impaired
- [x] Fix UI countdown drift when app in background
- [x] Settings bottom sheet with progress bar toggle, Hijri date, Athan sound selector
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
- ⚙️ **Settings**: Tap Masjid icon for progress bar, Hijri date, Athan sound
- 🗓️ **Hijri Date**: Optional Islamic calendar format

### Notifications & Alerts

- 🔔 **Customizable Alerts**: Off / Silent / Sound per prayer
- 📢 **16 Selectable Athan Sounds**: Multiple Islamic audio options
- 📅 **Smart Notification Buffer**: 2-day rolling schedule
- 🛡️ **Duplicate Prevention**: Concurrent scheduling protection

### Data & Offline Support

- 💾 **Local Data Caching**: Entire year stored in MMKV v4
- 🔄 **Automatic Yearly Refresh**: Detects year transition, fetches new data
- 📱 **Full Offline Support**: Works after initial sync
- 🎯 **Precise Synchronization**: Countdown countdowns sync with system clock
- ⬆️ **Smart App Upgrades**: Clears stale cache, preserves preferences

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
| **Last Third of Night** | 5 minutes after last third begins       |
| **Suhoor**              | 40 minutes before Fajr                  |
| **Duha**                | 20 minutes after Sunrise                |
| **Istijaba**            | 59 minutes before Magrib (Fridays only) |

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
├── Notifications: scheduled_notifications_*
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
├── components/            # UI components (presentational)
│   ├── Prayer.tsx         # Prayer row display
│   ├── Countdown.tsx          # Countdown countdown
│   ├── Alert.tsx          # Alert notification icon
│   ├── Overlay.tsx        # Full-screen overlay
│   ├── CountdownBar.tsx  # Progress indicator
│   └── ...                # Other UI components
│
├── hooks/                 # Custom React hooks (logic extraction)
│   ├── usePrayer.ts       # Prayer state and actions
│   ├── useSchedule.ts     # Schedule management
│   ├── useNotification.ts # Notification handling
│   ├── useAnimation.ts    # Animation utilities
│   └── ...                # Other hooks
│
├── stores/                # State management (Jotai atoms)
│   ├── schedule.ts        # Prayer sequence state
│   ├── notifications.ts   # Notification state
│   ├── countdown.ts           # Countdown state
│   ├── overlay.ts         # Overlay state
│   ├── sync.ts            # Data sync and initialization
│   ├── database.ts        # MMKV storage wrapper
│   └── ...                # Other stores
│
├── shared/                # Shared utilities and constants
│   ├── constants.ts       # App constants (colors, timings, etc.)
│   ├── types.ts           # TypeScript type definitions
│   ├── time.ts            # Time manipulation utilities
│   ├── prayer.ts          # Prayer creation and calculations
│   ├── notifications.ts   # Notification utilities
│   └── logger.ts          # Logging wrapper (Pino)
│
├── api/                   # API client
│   └── client.ts          # Prayer times API fetch/transform
│
├── device/                # Device-specific code
│   ├── notifications.ts   # Platform notification handlers
│   ├── listeners.ts       # App state listeners
│   └── updates.ts         # App update handling
│
├── mocks/                 # Mock data for development
│   ├── simple.ts          # Simplified mock data
│   └── timing-system-schema.ts  # Type schema for mocks
│
└── ai/                    # AI agent instructions and ADRs
    ├── AGENTS.md          # Agent behavior instructions
    ├── prompts/           # AI prompt templates
    ├── adr/               # Architecture Decision Records
    └── memory-archive.md  # AI context archive
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

4. **Scheduling Lock Pattern**: Concurrent operation protection
   - Example: `withSchedulingLock()` in notifications.ts

See `ai/adr/` for Architecture Decision Records.

## 🎨 Tech Stack

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)
![Pino](https://img.shields.io/badge/Pino-FFF000?style=for-the-badge&logo=pino&logoColor=black)
![Skia](https://img.shields.io/badge/Skia-0D1117?style=for-the-badge&logo=skia&logoColor=white)
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

The notification system maintains a **2-day rolling buffer** of scheduled notifications that refreshes every 12 hours. This ensures users always have notifications queued ahead while preventing duplication and keeping the system efficient.

**Key Features:**

- 2 days of notifications scheduled ahead for each enabled prayer
- 11 prayers total: 6 Standard (Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha) + 5 Extra (Midnight, Last Third, Suhoor, Duha, Istijaba)
- Concurrent scheduling protection with global `isScheduling` guard
- Maintains consistency even when app is closed or backgrounded
- Persists through app restarts and offline usage

#### Notification Rescheduling Scenarios

Notifications are rescheduled in the following scenarios:

| Scenario                        | Function                                      | When                          | Scope                           | Trigger                                                                                                       |
| ------------------------------- | --------------------------------------------- | ----------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **User Changes Audio**          | `rescheduleAllNotifications()`                | Immediately                   | Both schedules (all 11 prayers) | When user closes audio selection bottom sheet with new selection                                              |
| **User Toggles Prayer Alert**   | `addMultipleScheduleNotificationsForPrayer()` | Immediately                   | Single prayer only              | When user taps alert icon on a prayer                                                                         |
| **App Launch**                  | `refreshNotifications()`                      | If ≥12hrs since last schedule | Both schedules (all 11 prayers) | When app starts - only reschedules if never scheduled before OR last schedule was ≥12 hours ago               |
| **App Resumes from Background** | `refreshNotifications()`                      | If ≥12hrs since last schedule | Both schedules (all 11 prayers) | When app returns to foreground after being backgrounded - only reschedules if last schedule was ≥12 hours ago |

#### How It Works

**User-Triggered Scenarios (3):**

- When user makes a change (audio or individual prayer alert), notifications are immediately rescheduled
- Bypasses the 12-hour check for responsive updates
- The `isScheduling` guard prevents concurrent operations during these user actions

**Automatic Refresh Scenarios (2):**

- Triggered at app launch and when resuming from background
- Uses 12-hour refresh interval to avoid unnecessary rescheduling
- Checks `shouldRescheduleNotifications()` which returns `true` only if:
  - First time ever (no previous schedule timestamp), OR
  - ≥12 hours elapsed since `last_notification_schedule_check` timestamp
- If criteria not met, logs skip and returns early
- When rescheduling happens:
  1. Cancels ALL existing notifications (Expo API + database)
  2. Reschedules 2 days ahead for all enabled prayers in both schedules
  3. Updates `last_notification_schedule_check` timestamp

#### Concurrent Scheduling Protection

All 4 entry points are protected by a single global `isScheduling` flag wrapped in `withSchedulingLock()`:

- When any scheduling operation starts, `isScheduling` is set to `true`
- If another operation tries to start while `isScheduling` is true, it returns early
- After operation completes (success or error), `isScheduling` is reset to `false` in finally block
- Prevents double notifications even if user rapidly clicks multiple UI elements or if background refresh coincides with user action

**Protected against:**

- Spam clicking alert icons while previous alert is scheduling
- Rapidly switching audio selections
- Background refresh colliding with user actions
- Any combination of the above

#### Constants

| Constant                     | Value | Description                            |
| ---------------------------- | ----- | -------------------------------------- |
| `NOTIFICATION_ROLLING_DAYS`  | 2     | Days ahead to schedule notifications   |
| `NOTIFICATION_REFRESH_HOURS` | 12    | Hours between automatic refresh cycles |
