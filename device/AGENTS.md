# DEVICE - NATIVE PLATFORM INTEGRATIONS

## OVERVIEW

Platform-specific native integrations for iOS/Android notifications, app state listeners, update checking, and background task cleanup.

## WHERE TO LOOK

| Module               | Purpose                                    | Key Functions                                                                                                                                       |
| -------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **notifications.ts** | Expo-notifications scheduling/cancellation | `updateAndroidChannel()`, `addOneScheduledNotificationForPrayer()`, `cancelScheduledNotificationById()`, `clearAllScheduledNotificationForPrayer()` |
| **listeners.ts**     | AppState change handlers                   | `initializeListeners()` - triggers notifications & sync on foreground                                                                               |
| **updates.ts**       | GitHub releases version checking           | `checkForUpdates()`, `openStore()` - 24hr rate limit, platform store URLs                                                                           |
| **tasks.ts**         | Deprecated background task                 | `deregisterBackgroundFetchAsync()` - being removed                                                                                                  |

## CONVENTIONS

### Platform Detection

```typescript
import { Platform } from 'react-native';
const IS_IOS = Platform.OS === 'ios';

// Always guard Android-specific code
if (Platform.OS !== 'android') return;
```

### Platform-Specific Store URLs

- **iOS**: `itms-apps://apps.apple.com/app/id{APP_ID}` (native scheme)
- **Android**: `market://details?id={PACKAGE}` (native scheme)
- **Fallbacks**: Web URLs if native schemes fail
- **Environment**: `EXPO_PUBLIC_IOS_APP_ID`, `EXPO_PUBLIC_ANDROID_PACKAGE`

### Android Notification Channels

- 16 channels for 16 Athan sounds: `athan_1` through `athan_16`
- MAX importance, vibration pattern `[0, 250, 250, 250]`
- Only assign `channelId` when `alertType === AlertType.Sound`

### No-Cache Fetching

```typescript
fetch(GITHUB_RAW_URL, { headers: { 'Cache-Control': 'no-cache' } });
```

## ANTI-PATTERNS

### Deprecated Background Task (tasks.ts)

- **File only contains deregistration code** - background task logic already removed
- **Action Required**: Delete `tasks.ts` and remove import from `app/index.tsx` line 35
- **Reference**: See README completed features - "Remove redundant background task logic"
