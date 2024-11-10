<br/>
<br/>
<br/>

<div align="center">
  <img src="./assets/icons/masjid.svg" width="100" height="100" alt="Mosque icon" />
</div>
<br/>

<div align="center">
  
# Athan.uk

<!-- TODO: derive the date from the prayer data, not from today -->

[![Platform - Android](https://img.shields.io/badge/Platform-Android-3DDC84?style=flat&logo=android&logoColor=white)](https://athan.uk)
[![Platform - iOS](https://img.shields.io/badge/Platform-iOS-000000?style=flat&logo=apple&logoColor=white)](https://athan.uk)

A beautiful React Native mobile app for Muslim prayer times in London, UK

[🌐 Web Version Available](https://athan.uk)

</div>

<br/>
<br/>
<br/>

<div align="center">
  <img src="./assets/screenshots/screen1.png" height="750" alt="Prayer Details" style="margin: 0 20px"/>
  <img src="./assets/screenshots/screen2.png" height="750" alt="Prayer Details" style="margin: 0 20px" />
  <img src="./assets/screenshots/screen3.png" height="750" alt="Prayer Details" style="margin: 0 20px" />
</div>

<br/>
<br/>
<br/>

## ⚡ Features

- 📅 Displays daily prayer times including Fajr, Sunrise, Duha, Dhuhr, Asr, Magrib, and Isha
- ⏰ Real-time countdown timer until next prayer
- 🔄 View tomorrow's prayer times
- 🔔 Customizable prayer notifications with multiple alert modes:
  - Off (no notifications)
  - Notification (silent banner)
  - Vibrate (vibration + notification banner)
  - Sound (athan + vibration + notification banner)
- 🌙 Smart prayer tracking system
- 💾 Efficient data management with yearly prayer times cached locally
- 🔄 Automatic yearly data refresh
- 🎯 Precise timing synchronization with system clock
- 📱 Full offline support after initial data download

## 🛠 Technical Implementation

### Data Flow

1. First Launch:
   - Fetch entire year's prayer times from API
   - Strip historical dates (before today)
   - Add Duha prayer (20 mins after sunrise)
   - Cache processed data in MMKV storage

2. Daily Operations:
   - Load current day's prayers from cache
   - Track prayer states (passed/next/upcoming)
   - Manage notifications based on user preferences
   - Reset at midnight for new day

3. Year Transition:
   - Detect last prayer (Isha) of year
   - Automatically fetch next year's data

### Timer System

- Main timer: Counts down to next prayer
- Overlay timer: Shows time until selected prayer
- Both timers sync with system clock
- Notification scheduling based on prayer times

### Notification System

Notifications are scheduled:
- For each prayer time
- Maintains consistency even when app is closed
- Automatically schedules next day's Fajr after Isha
- Persists through app restarts

## 🚀 Development

### Prerequisites

- Node.js
- React Native development environment
- Expo CLI

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

   # Build for iOS
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

## 🎨 Tech Stack

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![MMKV Storage](https://img.shields.io/badge/MMKV-2C4F7C?style=for-the-badge)
![Jotai](https://img.shields.io/badge/Jotai-FF4154?style=for-the-badge)
![Reanimated](https://img.shields.io/badge/Reanimated_3-6B52AE?style=for-the-badge)
![Offline Support](https://img.shields.io/badge/Offline_Support-4CAF50?style=for-the-badge)


## Icons Used

- Masjid icon by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>