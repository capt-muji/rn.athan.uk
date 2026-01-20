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
- [x] Fix UI timer drift when app in background
- [x] Add a "Tips" popup on first ever open
- [x] Change app name on homescreen to 'Athan'
- [x] Refactor English width calculation to run once
- [x] Only check for update every 24hrs
- [x] Do not cache app version URL check
- [x] Only show "Information" popup on 2nd page
- [x] Create Android notification outline icon
- [x] Swap from Skia background to expo-linear-gradient (better android performance)
- [x] Optimise app to be iPad friendly
- [x] Replace Skia with expo-linear-gradient
- [x] Upgrade to Expo SDK v52+ (new architecture)
- [x] Upgrade to Reanimated v4 (needs new architecture)
- [x] Timer on popup
- [x] Enable IOS 'active' alert for notifications
- [x] Remove redundant background task logic
- [x] Upgrade to Expo SDK 54 with React 19 & React Native 0.81
- [x] Migrate from expo-av to expo-audio (SDK 54 requirement)
- [x] Upgrade MMKV to v4 (Nitro Module)
- [x] Pin all package versions (prevent breaking upgrades)
- [x] Settings bottom sheet: Access via Masjid icon tap with progress bar toggle, Hijri date toggle, and Athan sound selector

### Immediate Improvements

- [x] BUG-2: Fix double notifications on IOS & Android:
      The app currently send two notifications at the exact same time for each notification enabled.
      We dont know if this happens when the user does not change athan selection (athan audio selection deals with modifying channels etc).
      It could also not be related to channels because IOS also gets duplicate notifications.

- [ ] BUG-3 (this bug is unfixable. it only happens on SOME android devices): Fix Android delayed notifcations on some devices:
      All IOS devices correctly time the notifications. But on some android devices, the notifications are not exact.
      Some notifications appear almost an entire 1-3mins before the athan time or sometimes even 1-3mins after.
      Sometimes 1-3mins before and after.
      Solutions tried and not worked:
  1.  Battery optimisation
  1.  Exact alarm permissions
  1.  Different native notifications library (all use the same native APIs under the hood, so no difference)

### Upcoming Improvements

- [ ] Fix building locally on my device (mac mini m1) instead of having to build on expo (which uses up monthly 15 builds)
- [ ] Handle different versions of android for critical notifications (Alarms & Reminders)
- [ ] Add widget support
- [ ] Add Qibla direction finder
- [ ] Support for locations outside London (will be an open source standalone project)

## 📡 Data source

Prayer times data sourced from [London Prayer Times](https://www.londonprayertimes.com/)

## ⚡ Features

### Display & User Interface

- 📅 **Daily Prayer Times**: View all 5 standard prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) plus 5 special prayers
- ⏰ **Real-time Countdown**: Live timer showing exact time remaining until next prayer
- 🔄 **Tomorrow's Prayer Times**: Swipe between today and tomorrow's schedule with PagerView
- 🔍 **Large Overlay Font**: Accessible mode for visually impaired users with jumbo text display
- 🌙 **Smart Prayer Tracking**: Automatically tracks which prayers have passed, which is next, and upcoming prayers
- ⚙️ **Settings**: Tap Masjid icon to access settings (progress bar toggle, Hijri date toggle, Athan sound selector)
- 🗓️ **Hijri Date Display**: Optional Islamic calendar date format (e.g., "Rajab 1, 1447")

### Notifications & Alerts

- 🔔 **Customizable Alerts** with three modes per prayer:
  - **Off**: No notifications
  - **Silent**: Banner only (no sound)
  - **Sound**: Athan audio + vibration + notification banner
- 📢 **16 Selectable Athan Sounds**: Choose from multiple Islamic call-to-prayer audio options
- 📅 **Smart Notification Buffer**: 2-day rolling schedule that auto-refreshes every 12 hours
- 🔒 **Dual Mute Controls**: Separately enable/disable Standard (5 prayers) and Extra (5 prayers) schedules
- 🛡️ **Duplicate Prevention**: Concurrent scheduling protection prevents double notifications even with rapid user interactions

### Data & Offline Support

- 💾 **Local Data Caching**: Entire year's prayer times stored locally using MMKV v4 (Nitro Module)
- 🔄 **Automatic Yearly Refresh**: Detects year transition and fetches next year's data automatically
- 📱 **Full Offline Support**: Works completely offline after initial data sync
- 🎯 **Precise Synchronization**: Countdown timers sync with system clock to eliminate drift
- ⬆️ **Smart App Upgrades**: Detects version changes and clears stale cache while preserving user preferences (notification settings, Athan sound, mute states)

### Performance & Reliability

- ⚡ **Lightweight**: Optimized for low-end devices and minimal battery impact
- 🔐 **Persistent Storage**: Prayer preferences and schedules survive app restarts
- 🌍 **Background Stability**: Maintains notification accuracy when app is backgrounded or device is locked

## 🕌 Prayer Times

### Standard Prayers (6)

| Prayer      |
| ----------- |
| **Fajr**    |
| **Sunrise** |
| **Dhuhr**   |
| **Asr**     |
| **Maghrib** |
| **Isha**    |

### Extra Prayers (5)

| Prayer                  | Time                                     |
| ----------------------- | ---------------------------------------- |
| **Midnight**            | Midpoint between Maghrib and Fajr        |
| **Last Third of Night** | 5 minutes after last third begins        |
| **Suhoor**              | 40 minutes before Fajr                   |
| **Duha**                | 20 minutes after Sunrise                 |
| **Istijaba**            | 59 minutes before Maghrib (Fridays only) |

## 🛠 Technical Implementation

### Recent Upgrades (SDK 54 Migration)

**Completed**: Expo SDK 52 → 54, React 18.3 → 19.1, React Native 0.76 → 0.81

**Major Changes:**

- **Audio System**: Migrated from `expo-av` (deprecated) to `expo-audio` with new `useAudioPlayer` + `useAudioPlayerStatus` hooks
- **Storage**: Upgraded MMKV to v4 (now a Nitro Module) - uses `createMMKV()` and `.remove()` methods
- **Edge-to-edge**: Removed deprecated `react-native-edge-to-edge`, now using `expo-status-bar`
- **Background Tasks**: Removed deprecated `expo-background-fetch` and `device/tasks.ts`
- **Notifications**: Updated to handle `shouldShowBanner` and `shouldShowList` required in SDK 54
- **Version Pinning**: All dependencies pinned to exact versions to prevent breaking changes

### Data Flow

The app follows a three-phase lifecycle for prayer time data management:

**1. First Launch - Data Initialization**

- Fetch entire year's prayer times from London Prayer Times API
- Process & transform: Strip historical dates (before today), calculate special prayer times
- Add derived prayers: Duha (20 mins after Sunrise), Suhoor (40 mins before Fajr), Istijaba (59 mins before Maghrib on Fridays)
- Cache to MMKV: Store processed data locally with key format `prayer_YYYY-MM-DD`
- Track fetched years: Record `{year: boolean}` in MMKV to avoid re-fetching
- Result: App now works completely offline

**2. Daily Operations - State Management**

- Load today's prayers from MMKV cache (key: `prayer_YYYY-MM-DD`)
- Calculate prayer states: Identify which have passed, which is next, which are upcoming
- Manage notifications: Apply user's alert preferences per prayer (Off/Silent/Sound)
- Sync with clock: Timer system counts down to next prayer with microsecond precision
- Prayer-based day boundary: When final prayer passes (Isha for Standard, Duha/Istijaba for Extras), schedule advances to tomorrow
- User changes: When user toggles alerts or changes audio, reschedule notifications immediately (protected by concurrent guard)

**3. Year Transition - Automatic Renewal**

- Detect boundary: When user reaches last prayer of year (Isha on Dec 31)
- Fetch next year: Automatically trigger API call for new year's data
- Seamless transition: No manual intervention needed; new year's data automatically cached and available

**Storage Architecture:**

```
MMKV (Fast encrypted local storage)
├── Prayer Data
│   ├── prayer_2025-01-10 → {fajr, dhuhr, asr, maghrib, isha, ...}
│   └── fetched_years → {2024: true, 2025: true}
├── Notification Schedule
│   ├── scheduled_notifications_standard_[0-5]_[id]
│   ├── last_notification_schedule_check → timestamp
│   └── preference_mute_standard/extra → boolean
└── User Preferences
    ├── preference_alert_standard_[0-5] → AlertType
    ├── preference_sound → number (0-15 for 16 Athan sounds)
    └── preference_mute_standard/extra → boolean
```

### Timer System

The app runs **3 concurrent timers** simultaneously, each with a specific responsibility:

#### Timer Types & Functions

| Timer        | Purpose                                                                   | Updates         | Trigger          |
| ------------ | ------------------------------------------------------------------------- | --------------- | ---------------- |
| **Standard** | Countdown to next Standard prayer (Fajr/Dhuhr/Asr/Maghrib/Isha)           | Main display    | Prayer queue     |
| **Extra**    | Countdown to next Extra prayer (Midnight/Suhoor/Duha/Last Third/Istijaba) | Page 2 display  | Prayer queue     |
| **Overlay**  | Countdown to user-selected prayer from overlay modal                      | Overlay display | Manual selection |

#### How They Work

**Synchronization with System Clock:**

- Timers sync with system clock to eliminate drift (avoids "stale" countdowns when app is backgrounded)
- Sub-millisecond precision via `useAnimationTimer` hook with Reanimated 4
- Automatic recovery if app resumes after time jump (e.g., device hibernation)

**Independent & Concurrent:**

- All 3 timers run independently without blocking each other
- Standard & Extra timers can countdown simultaneously to different prayers
- Overlay timer updates in real-time while user is viewing modal

**Automatic State Transitions:**

- When a prayer time arrives, active timer:
  1. Cancels current countdown
  2. Moves to next prayer in queue
  3. Starts new countdown
  4. Triggers notification if enabled

**App Load Recovery:**

- When the app is opened after being closed or backgrounded for extended periods:
  1. Checks if the last prayer of each schedule has already passed
  2. Automatically advances affected schedules to tomorrow before starting timers
  3. Ensures timer always shows accurate countdown to next prayer
  4. Handles scenarios like: opening app at 11pm (after Isha), opening app after days of not using

**Prayer-Based Day Boundary (Islamic Midnight):**

Each schedule operates independently with its own day boundary:

- **Standard Schedule**: Advances after Isha passes
  - Tomorrow's schedule becomes today
  - New tomorrow fetched from database
  - Date display updates to tomorrow
  - Timer immediately shows countdown to Fajr

- **Extras Schedule**: Advances after final Extra prayer passes
  - After Duha on non-Fridays
  - After Istijaba on Fridays
  - Independent from Standard schedule
  - Can show different date than Standard tab

- **Continuous Countdown**: No "All prayers finished" state
  - Timer always shows next prayer countdown
  - ProgressBar always visible
  - Seamless transition across prayer boundaries

### Timing System Architecture

The timing system is the core of the app, responsible for determining which prayer is next, calculating countdowns, and managing schedule advancement.

#### 24-Hour Prayer Cycles

Each schedule operates on a prayer-based day boundary (not 00:00 midnight):

```
STANDARD SCHEDULE (6 prayers):
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   05:30    07:00    12:15    15:30    17:45    19:15                       │
│     ↓        ↓        ↓        ↓        ↓        ↓                         │
│   Fajr → Sunrise → Dhuhr → Asr → Maghrib → Isha ─┐                         │
│                                                   │                         │
│                                          [ADVANCE DAY]                      │
│                                                   │                         │
│   Timer shows tomorrow's Fajr ←──────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

EXTRAS SCHEDULE (Non-Friday, 4 prayers):
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   23:00      02:30      04:50      07:45                                   │
│     ↓          ↓          ↓          ↓                                     │
│  Midnight → Last Third → Suhoor → Duha ─────────┐                          │
│                                                  │                          │
│                                         [ADVANCE DAY]                       │
│                                                  │                          │
│   Timer shows tonight's Midnight ←──────────────┘                          │
│   (still 14+ hours away!)                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

EXTRAS SCHEDULE (Friday, 5 prayers):
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  23:00      02:30      04:50      07:45      12:30                         │
│    ↓          ↓          ↓          ↓          ↓                           │
│ Midnight → Last Third → Suhoor → Duha → Istijaba ─┐                        │
│                                                    │                        │
│                                           [ADVANCE DAY]                     │
│                                                    │                        │
│   Timer shows tonight's Midnight ←────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### The Midnight-Crossing Problem

**The Critical Bug (Current System)**

In London summer, Isha can be at 1am. The current system stores:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CURRENT DATA MODEL:                                                        │
│  { date: "2026-06-21", time: "01:00", english: "Isha" }                    │
│                                                                             │
│  At 11pm (23:00) on June 21:                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  isTimePassed("01:00")                                              │    │
│  │  → Compares: 23:00 vs 01:00 (IGNORES DATE!)                        │    │
│  │  → 23:00 > 01:00 = TRUE                                            │    │
│  │  → Isha marked as PASSED ❌ (WRONG - it's still 2 hours away!)     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  RESULT:                                                                    │
│  • Active background highlights WRONG prayer                               │
│  • Countdown shows WRONG time                                              │
│  • isPassed styling is WRONG                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**The Fix (New System)**

The new system stores full datetime objects:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NEW DATA MODEL:                                                            │
│  {                                                                          │
│    datetime: new Date("2026-06-22T01:00:00"),  // Actual moment            │
│    belongsToDate: "2026-06-21",                // Islamic day              │
│    english: "Isha"                                                         │
│  }                                                                          │
│                                                                             │
│  At 11pm (23:00) on June 21:                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  datetime > now                                                     │    │
│  │  → 2026-06-22T01:00 > 2026-06-21T23:00                             │    │
│  │  → TRUE ✓ (Isha is in the future)                                  │    │
│  │                                                                     │    │
│  │  countdown = datetime - now                                         │    │
│  │  → 2 hours ✓                                                       │    │
│  │                                                                     │    │
│  │  isPassed = datetime < now                                          │    │
│  │  → FALSE ✓                                                         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Data Flow: Schedule Advancement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT SYSTEM FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Timer hits 0                                                              │
│        │                                                                    │
│        ▼                                                                    │
│   incrementNextIndex(type)                                                  │
│        │                                                                    │
│        ▼                                                                    │
│   Is nextIndex === 0? (wrapped around)                                      │
│        │                                                                    │
│   ┌────┴────┐                                                               │
│   │ NO      │ YES                                                           │
│   ▼         ▼                                                               │
│ Continue   advanceScheduleToTomorrow(type)                                  │
│            │                                                                │
│            ├─► Close overlay (prevent stale state)                          │
│            ├─► Fetch dayAfterTomorrow data                                  │
│            ├─► Shift: yesterday←today, today←tomorrow, tomorrow←new         │
│            ├─► Reset nextIndex to 0                                         │
│            └─► Update date atom                                             │
│                     │                                                       │
│                     ▼                                                       │
│            startTimerSchedule(type)                                         │
│                     │                                                       │
│                     ▼                                                       │
│            calculateCountdown() ◄─── Uses "yesterday fallback" for Extras   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          NEW SYSTEM FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Timer tick (every second)                                                 │
│        │                                                                    │
│        ▼                                                                    │
│   nextPrayer = prayers.find(p => p.datetime > now)                         │
│        │                                                                    │
│        ▼                                                                    │
│   Has nextPrayer changed since last tick?                                   │
│        │                                                                    │
│   ┌────┴────┐                                                               │
│   │ NO      │ YES                                                           │
│   ▼         ▼                                                               │
│ Continue   refreshSequence() ◄─── Fetch more prayers if running low        │
│            │                                                                │
│            └─► UI auto-updates (derived state)                              │
│                                                                             │
│   countdown = nextPrayer.datetime - now  ◄─── Always 1 line, always correct │
│   isPassed = prayer.datetime < now       ◄─── No date string comparison     │
│   displayDate = nextPrayer.belongsToDate ◄─── Automatically derived         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Critical Edge Case Scenarios

**Scenario 1: Isha at 11pm vs 1am**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WINTER (Isha at 6pm) - Works fine in both systems                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Timeline:     ... 17:00 ─── 18:00 ─── 19:00 ─── 20:00 ...               │
│                        │         │                                          │
│                    Maghrib     Isha                                         │
│                                  │                                          │
│   At 17:30:  isTimePassed("18:00") = FALSE ✓ (both systems correct)        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  SUMMER (Isha at 1am) - BUG in current system!                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Timeline:     ... 22:00 ─── 23:00 ─── 00:00 ─── 01:00 ...               │
│                                  │                   │                      │
│                               NOW (11pm)           Isha                     │
│                                                                             │
│   CURRENT SYSTEM:                                                           │
│   isTimePassed("01:00") at 23:00                                           │
│   → Compares 23:00 vs 01:00 (same day assumed)                             │
│   → 23 > 1 = TRUE ❌                                                        │
│   → Isha incorrectly marked as passed!                                     │
│                                                                             │
│   NEW SYSTEM:                                                               │
│   datetime = 2026-06-22T01:00:00                                           │
│   now = 2026-06-21T23:00:00                                                │
│   → datetime > now = TRUE ✓                                                │
│   → Isha correctly shown as upcoming                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Scenario 2: Midnight Prayer at 11pm vs 1am**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WINTER (Midnight prayer at 11pm)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Maghrib: 16:00   Fajr: 06:30   Midpoint: 23:15                           │
│                                                                             │
│   Timeline:     ... 22:00 ─── 23:15 ─── 00:00 ─── 02:30 ...               │
│                        │         │                   │                      │
│                      NOW     Midnight            Last Third                 │
│                                                                             │
│   Both systems: Midnight at 23:15 today - no midnight crossing             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  SUMMER (Midnight prayer at 12:30am)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Maghrib: 21:00   Fajr: 04:00   Midpoint: 00:30                           │
│                                                                             │
│   Timeline:     ... 22:00 ─── 23:30 ─── 00:30 ─── 02:00 ...               │
│                        │         │         │         │                      │
│                       NOW    system     Midnight  Last Third                │
│                            midnight                                         │
│                                                                             │
│   CURRENT SYSTEM:                                                           │
│   isTimePassed("00:30") at 23:30                                           │
│   → 23 > 0 = TRUE ❌ (Wrong! Midnight is 1 hour away)                      │
│                                                                             │
│   NEW SYSTEM:                                                               │
│   datetime = 2026-06-22T00:30:00                                           │
│   now = 2026-06-21T23:30:00                                                │
│   → datetime > now = TRUE ✓                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Scenario 3: Both Schedules on Different Dates**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Time: 10:00am on January 18 (Saturday)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   STANDARD SCHEDULE:                                                        │
│   • Isha (18:15) has NOT passed                                            │
│   • Schedule date: January 18                                              │
│   • Waiting for: Dhuhr → Asr → Maghrib → Isha                              │
│                                                                             │
│   EXTRAS SCHEDULE:                                                          │
│   • Duha (08:08) has PASSED at 08:08                                       │
│   • Schedule ADVANCED to: January 19                                        │
│   • Waiting for: Midnight (tonight at 23:23)                               │
│                                                                             │
│   ┌──────────────────────┬──────────────────────┐                          │
│   │   STANDARD TAB       │   EXTRAS TAB         │                          │
│   ├──────────────────────┼──────────────────────┤                          │
│   │   Date: Jan 18       │   Date: Jan 19       │  ◄── Different dates!   │
│   │   Next: Dhuhr        │   Next: Midnight     │                          │
│   │   Countdown: 2h 14m  │   Countdown: 13h 23m │                          │
│   └──────────────────────┴──────────────────────┘                          │
│                                                                             │
│   THIS IS CORRECT BEHAVIOR - each schedule is independent                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Data Model Comparison

| Aspect                | Current (Date-Centric)                   | New (Prayer-Centric)                           |
| --------------------- | ---------------------------------------- | ---------------------------------------------- |
| **Storage**           | 3 maps: yesterday/today/tomorrow         | 1 sorted array: prayers[]                      |
| **Next Prayer**       | Stored `nextIndex`, manually incremented | Derived: `prayers.find(p => p.datetime > now)` |
| **isPassed**          | `date === today && isTimePassed(time)`   | `prayer.datetime < now`                        |
| **Countdown**         | 40+ lines with yesterday fallback        | 1 line: `datetime - now`                       |
| **Display Date**      | Separate atom, manually synced           | Derived: `nextPrayer.belongsToDate`            |
| **Previous Prayer**   | Access `schedule.yesterday[5]`           | Access `prayers[currentIndex - 1]`             |
| **Midnight Crossing** | Bug: times compared without dates        | Works: datetime is unambiguous                 |

#### PrayerSequence Data Structure (New System)

```typescript
// Single sorted array replaces yesterday/today/tomorrow maps
interface PrayerSequence {
  type: ScheduleType;
  prayers: Prayer[]; // Sorted by datetime, next 48-72 hours
}

interface Prayer {
  id: string; // "standard_fajr_2026-01-18"
  datetime: Date; // Full moment in time (NOT separate date/time strings)
  belongsToDate: string; // Islamic day this prayer belongs to (per ADR-004)
  english: string;
  arabic: string;
  type: ScheduleType;
}

// Everything is DERIVED from the sequence:
const nextPrayer = prayers.find((p) => p.datetime > now);
const countdown = nextPrayer.datetime.getTime() - Date.now();
const isPassed = prayer.datetime < now;
const prevPrayer = prayers[currentIndex - 1];
const displayDate = nextPrayer.belongsToDate;
const progress = (now - prev.datetime) / (next.datetime - prev.datetime);
```

#### Migration Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PARALLEL MODEL MIGRATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PHASE 1-4: Both models run simultaneously                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │   Current Model (Date-Centric)    New Model (Prayer-Centric)       │  │
│   │   ┌─────────────────────────┐    ┌─────────────────────────┐       │  │
│   │   │ yesterday/today/tomorrow│    │ PrayerSequence[]        │       │  │
│   │   │ nextIndex               │    │ derived nextPrayer      │       │  │
│   │   │ calculateCountdown()    │    │ datetime - now          │       │  │
│   │   └───────────┬─────────────┘    └───────────┬─────────────┘       │  │
│   │               │                              │                     │  │
│   │               └──────────┬───────────────────┘                     │  │
│   │                          ▼                                         │  │
│   │               ┌─────────────────────┐                              │  │
│   │               │ DIVERGENCE CHECK    │                              │  │
│   │               │ (in __DEV__ mode)   │                              │  │
│   │               │                     │                              │  │
│   │               │ if (|old - new| > 2s)│                              │  │
│   │               │   console.warn()    │                              │  │
│   │               └─────────────────────┘                              │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   PHASE 5-6: UI components migrate to new hooks                            │
│                                                                             │
│   PHASE 7: Old model removed (ONLY after divergence validation passes)     │
│                                                                             │
│   ROLLBACK: If issues found, remove useSequence flags → instant rollback   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**See Also:**

- [ADR-004: Prayer-Based Day Boundary](/ai/adr/004-prayer-based-day-boundary.md)
- [ADR-005: Timing System Overhaul](/ai/adr/005-timing-system-overhaul.md)
- [Feature: Timing System Overhaul](/ai/features/timing-system-overhaul/)
- [Data Schema Reference](/mocks/timing-system-schema.ts) - Complete examples of Prayer, PrayerSequence, edge cases

### Progress Bar

The progress bar provides a real-time visual representation of the countdown timer displayed above it. It shows how much time has elapsed between the previous prayer and the next prayer.

#### Visual Behavior

**Width Animation:**

- The bar's width represents the percentage of time elapsed in the current prayer window
- 0% width = Just passed previous prayer (100% time remaining)
- 100% width = About to reach next prayer (0% time remaining)
- Formula: `progress = (timeElapsed / totalDuration) * 100`
- Smooth animations with platform-specific easing (950ms for large jumps, 1000ms for normal countdown)

**Color System:**

- Three-color stoplight system that changes at discrete thresholds:
  - Green (`#d3ff8b`): Above 20% time remaining
  - Orange (`#ff8c00`): 20% down to 10% time remaining
  - Red (`#d63384`): Below 10% time remaining
- Colors change instantly at thresholds (500ms transition) for clear visual urgency

**Glow Effects:**

- **Platform-specific rendering:**
  - iOS: Uses `shadowRadius` (15px → 8px) and `shadowOpacity` (0.9 → 1.0)
  - Android: Uses `elevation` (15 → 10) for shadow spread
- **Warning state** (≤20% time remaining):
  - Activates intense neon glow effect
  - Additional glow layer with 500ms fade-in animation
  - Covers entire warning period (both orange and red zones)
  - Glow intensity is consistent throughout (binary on/off, not graduated)

**State Management:**

- **Toggle Visibility**: Tap the countdown timer to hide/show the progress bar
  - Tappable area includes prayer name label, time display, and progress bar
  - 250ms fade animation (opacity transition)
  - Haptic feedback (medium impact) on tap
  - Preference persists across app restarts via MMKV storage
  - Disabled when overlay is active (overlay timer behavior unchanged)
- Automatically hides (opacity: 0) when overlay display is active
- Container always reserves 3px height to prevent layout shifts
- Uses Reanimated 4 shared values for high-performance animations
- Supports both Standard and Extra prayer schedules

#### Progress Bar Scenarios

**Scenario 1: Normal Day Operation (06:00 - 23:59)**

- User opens app at any time during the day
- ProgressBar shows elapsed time from previous prayer to next prayer
- Example: At 14:00, shows progress from Dhuhr (12:00) to Asr (15:00)
- Works normally for all prayers throughout the day

**Scenario 2: After Midnight Before Fajr (00:00 - Fajr time)**

- User opens app at 02:00 AM (after midnight, before Fajr)
- ProgressBar shows elapsed time from **yesterday's Isha** to **today's Fajr**
- Uses `schedule.yesterday` data (always available, ensured by sync layer)
- Handles 24-hour wrap-around seamlessly
- Example: Yesterday's Isha at 20:00 → Today's Fajr at 05:30 → At 02:00, shows ~6h elapsed of 9.5h total window

**Scenario 3: Prayer-Based Day Boundary (After Final Prayer)**

**Standard Schedule (After Isha):**

- Isha passes at 20:30
- Schedule advances: tomorrow → today, today → yesterday
- Timer shows countdown to tomorrow's Fajr
- ProgressBar shows elapsed time from today's Isha (now "yesterday") to tomorrow's Fajr (now "today")
- Date display updates to tomorrow

**Extras Schedule (After Duha/Istijaba):**

- Duha passes at 07:45 (or Istijaba on Friday)
- Extras schedule advances independently
- Can show different date than Standard tab
- ProgressBar for Extras uses Extras schedule's yesterday data

**Scenario 4: January 1st Edge Case**

- User downloads app fresh on January 1st at 02:00 AM
- App needs December 31st data for ProgressBar (yesterday's Isha)
- Sync layer MANDATORILY fetches previous year's data
- Previous year data saved to database before schedule builds
- ProgressBar works correctly with Dec 31 Isha → Jan 1 Fajr

**Scenario 5: December 31st to January 1st Transition**

- User uses app on December 31st
- December proactive fetch already downloaded January 1st data
- After Isha on Dec 31, schedule advances to Jan 1
- Yesterday shifts: Dec 30 → Dec 31
- ProgressBar continues working with Dec 31 Isha → Jan 1 Fajr

**Timer Synchronization:**

- Progress bar syncs with the active timer type (Standard/Extra/Overlay)
- Recalculates on every timer tick for precise visual feedback
- Prevents drift by using same time calculation as countdown timer
- Always uses yesterday's final prayer for post-midnight calculations

### Notification System

#### Overview

The notification system maintains a **2-day rolling buffer** of scheduled notifications that refreshes every 12 hours. This ensures users always have notifications queued ahead while preventing duplication and keeping the system efficient.

**Key Features:**

- 2 days of notifications scheduled ahead for each enabled prayer
- Concurrent scheduling protection with global `isScheduling` guard
- Maintains consistency even when app is closed or backgrounded
- Persists through app restarts and offline usage
- Separate mute controls for Standard (5 prayers) and Extra (5 prayers) schedules

#### Notification Rescheduling Scenarios

Notifications are rescheduled in the following scenarios:

| Scenario                        | Function                                      | Time-Based   | Scope                            | Trigger                                                                                                       |
| ------------------------------- | --------------------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **User Changes Audio**          | `rescheduleAllNotifications()`                | ❌ Immediate | Both schedules (all 9 prayers)   | When user closes audio selection bottom sheet with new selection                                              |
| **User Toggles Prayer Alert**   | `addMultipleScheduleNotificationsForPrayer()` | ❌ Immediate | Single prayer only               | When user taps alert icon on a prayer (450ms debounce)                                                        |
| **User Mutes/Unmutes**          | `addAllScheduleNotificationsForSchedule()`    | ❌ Immediate | One schedule (Standard or Extra) | When user clicks "Enable all" / "Disable all" button (450ms debounce)                                         |
| **App Launch**                  | `refreshNotifications()`                      | ✅ ≥12 hours | Both schedules (all 9 prayers)   | When app starts - only reschedules if never scheduled before OR last schedule was ≥12 hours ago               |
| **App Resumes from Background** | `refreshNotifications()`                      | ✅ ≥12 hours | Both schedules (all 9 prayers)   | When app returns to foreground after being backgrounded - only reschedules if last schedule was ≥12 hours ago |

#### How It Works

**User-Triggered Scenarios (3):**

- When user makes a change (audio, individual prayer alert, or mute toggle), notifications are immediately rescheduled
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
  1. Cancels ALL existing notifications (global + per-prayer)
  2. Reschedules 2 days ahead for all enabled prayers
  3. Updates `last_notification_schedule_check` timestamp

#### Concurrent Scheduling Protection

All 5 entry points are protected by a single global `isScheduling` flag:

- When any scheduling operation starts, `isScheduling` is set to `true`
- If another operation tries to start while `isScheduling` is true, it returns early
- After operation completes (success or error), `isScheduling` is reset to `false` in finally block
- Prevents double notifications even if user rapidly clicks multiple UI elements or if background refresh coincides with user action

**Protected against:**

- Spam clicking alert icons while previous alert is scheduling
- Rapidly switching audio selections
- Mute/unmute toggle spam
- Background refresh colliding with user actions
- Any combination of the above

#### Constants

- `NOTIFICATION_ROLLING_DAYS = 2`: How many days ahead to schedule
- `NOTIFICATION_REFRESH_HOURS = 12`: How often to refresh the rolling buffer

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
- Expo Go

### Code Quality

The project uses ESLint and Prettier for code consistency and quality:

- Prettier maintains consistent code formatting
- ESLint enforces code quality rules
- Pre-commit hooks automatically format and lint code
- VS Code `Prettier` and `ESLint` extensions recommended for real-time formatting and linting

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

## 🗄️ MMKV Storage Keys

MMKV provides encrypted, fast local storage. Below is a complete reference of all keys, their purpose, and lifecycle.

### Prayer Data

| Key                     | Type   | Purpose                                                          | Lifetime                         | Set When                                          |
| ----------------------- | ------ | ---------------------------------------------------------------- | -------------------------------- | ------------------------------------------------- |
| `prayer_YYYY-MM-DD`     | Object | Daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha + extras)    | End of day                       | First launch or year transition                   |
| `fetched_years`         | Object | Track which years have been fetched (`{2024: true, 2025: true}`) | Indefinite (prevents re-fetches) | After fetching a year's data                      |
| `display_date_standard` | String | Currently displayed date for Standard schedule                   | Indefinite                       | When Standard schedule advances after Isha passes |
| `display_date_extra`    | String | Currently displayed date for Extras schedule                     | Indefinite                       | When Extras schedule advances after Duha/Istijaba |
| `app_installed_version` | String | Current app version for upgrade detection (e.g. "1.0.34")        | Indefinite                       | After every app launch (updated on upgrade)       |

**Cache Behavior:** Prayer data never expires—persists until device cache clears or app uninstalled. Year transition automatically fetches new year when needed.

**App Upgrades:** When the app version increases (e.g., 1.0.33 → 1.0.34), the upgrade handler automatically clears potentially incompatible cache data (prayer times, notifications, UI measurements) while preserving user preferences (alert settings, sound selection, mute states). Downgrades do not trigger cache clearing to protect user data.

### Notifications

| Key                                             | Type    | Purpose                                                   | Lifetime            | Set When                                                 |
| ----------------------------------------------- | ------- | --------------------------------------------------------- | ------------------- | -------------------------------------------------------- |
| `scheduled_notifications_standard_[index]_[id]` | String  | Unique ID tracking Standard prayer notification scheduled | Until prayer passes | When scheduling Standard prayer notification (index 0-5) |
| `scheduled_notifications_extra_[index]_[id]`    | String  | Unique ID tracking Extra prayer notification scheduled    | Until prayer passes | When scheduling Extra prayer notification (index 0-4)    |
| `last_notification_schedule_check`              | Number  | Timestamp of last notification refresh                    | Indefinite          | After every `refreshNotifications()` call (24h check)    |
| `preference_mute_standard`                      | Boolean | Whether Standard prayers (5 main) notifications are muted | Indefinite          | User taps mute/unmute button                             |
| `preference_mute_extra`                         | Boolean | Whether Extra prayers (5 special) notifications are muted | Indefinite          | User taps mute/unmute button                             |
| `preference_sound`                              | Number  | Index of selected Athan sound (0-15 for 16 sounds)        | Indefinite          | User selects audio from BottomSheetSound                 |

**Notification Refresh:** Every 24 hours OR on app resume after backgrounding, notifications are re-evaluated. Old past-prayer entries are cleaned up automatically.

### Prayer Alert Preferences

| Key                               | Type   | Purpose                                                                                   | Values                     | Set When                                |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------- |
| `preference_alert_standard_[0-5]` | Number | Alert type for each Standard prayer (Fajr=0, Dhuhr=1, Asr=2, Maghrib=3, Isha=4)           | `0=Off, 1=Silent, 2=Sound` | User taps alert icon on Standard prayer |
| `preference_alert_extra_[0-4]`    | Number | Alert type for each Extra prayer (Midnight=0, Last Third=1, Suhoor=2, Duha=3, Istijaba=4) | `0=Off, 1=Silent, 2=Sound` | User taps alert icon on Extra prayer    |

**Behavior:** When preference changes, notifications for that specific prayer are immediately rescheduled (protected by `isScheduling` guard).

### UI State & Caching

| Key                                 | Type    | Purpose                                              | Lifetime   | Set When                              | Impact                                               |
| ----------------------------------- | ------- | ---------------------------------------------------- | ---------- | ------------------------------------- | ---------------------------------------------------- |
| `prayer_max_english_width_standard` | Number  | Cached max width of Standard prayer names for layout | Session    | First render of prayer list           | Prevents repeated measurements, improves performance |
| `prayer_max_english_width_extra`    | Number  | Cached max width of Extra prayer names for layout    | Session    | First render of extra prayer list     | Used for responsive text sizing                      |
| `measurements_list`                 | Object  | Cached measurements for prayer list item positioning | Session    | Component mount                       | Optimizes layout calculations, prevents jank         |
| `measurements_date`                 | Object  | Cached measurements for date display area            | Session    | Component mount                       | Improves date bar rendering performance              |
| `preference_progressbar_hidden`     | Boolean | Progress bar hidden state (default: false = visible) | Indefinite | User toggles in Settings bottom sheet | Controls progress bar opacity with 250ms fade        |
| `preference_hijri_date`             | Boolean | Hijri date display preference (Hijri/Gregorian)      | Indefinite | User toggles in Settings bottom sheet | Controls date format on main screen and overlay      |
| `popup_tip_athan_enabled`           | Boolean | Whether "First Time Tips" popup has been shown       | Indefinite | App first launch                      | Only shows once in user's lifetime                   |
| `popup_update_last_check`           | Number  | Timestamp of last app update check                   | Indefinite | After checking GitHub for new version | Only checks once per 24h (avoids API spam)           |

**UI Cache Lifetime:** Measurement caches are cleared on app restart (session-based). Popup states persist indefinitely unless user manually clears app data.

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

## Icons

- Masjid icon by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>
