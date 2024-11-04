<br/>
<br/>
<br/>

<div align="center">
  <img src="./assets/masjid.svg" width="100" height="100" alt="Mosque icon" />
</div>

<br/>
<br/>
<br/>

# Athan.uk

A React Native IOS and Android mobile application for Muslim prayer times in the London, UK.

For web version, visit https://athan.uk.

## Features

- 📅 Displays daily prayer times including Fajr, Sunrise, Duha, Dhuhr, Asr, Magrib, and Isha
- ⏰ Real-time countdown timer until next prayer
- 🔔 Customizable prayer notifications with multiple alert modes:
  - Off (no notifications)
  - Notification only (silent banner)
  - Vibration + notification
  - Sound (athan) + vibration + notification
- 🌙 Smart prayer tracking system
- 💾 Efficient data management with yearly prayer times cached locally
- 🔄 Automatic yearly data refresh
- 🎯 Precise timing synchronization with system clock
- 📱 Full offline support after initial data download

## Technical Implementation

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

## Development

### Prerequisites

- Node.js
- React Native development environment
- Expo CLI

### Installation

1. Install dependencies

   ```bash
   yarn
   ```

2. Start the app

   ```bash
   npx expo start -c
   ```

In the output, you'll find options to open the app in a:
- Development build
- Android emulator
- iOS simulator
- Expo Go

You can start developing by editing the files inside the **app** directory. This project uses file-based routing.

## Icons Used

- Masjid icon by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>

## Tech Stack

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![MMKV Storage](https://img.shields.io/badge/MMKV-2C4F7C?style=for-the-badge)
![Jotai](https://img.shields.io/badge/Jotai-000000?style=for-the-badge)