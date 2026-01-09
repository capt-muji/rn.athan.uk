# Expo SDK 54 Breaking Changes & Fixes

**Migration Date**: Jan 2026
**From**: Expo SDK 52, React 18.3, RN 0.76.9, MMKV 3.3.3
**To**: Expo SDK 54, React 19.1, RN 0.81.5, MMKV 4.1.1

---

## Overview

This document captures all breaking changes encountered during SDK 54 migration and the fixes applied.

---

## 1. MMKV v4 (Nitro Module) Migration

### Breaking Change
MMKV v4 is now a Nitro Module and requires a different API.

### Error
```
Cannot call methods on old MMKV instance
```

### Files Affected
- `stores/database.ts` - Primary storage instance
- `stores/storage.ts` - Storage helpers

### Fix Applied

**Before (MMKV v3)**:
```typescript
import { MMKV } from 'react-native-mmkv';
export const database = new MMKV();
database.delete(key);
```

**After (MMKV v4)**:
```typescript
import { createMMKV } from 'react-native-mmkv';
export const database = createMMKV();
database.remove(key);  // delete() → remove()
```

### Key Changes
| Change | Old | New |
|--------|-----|-----|
| Constructor | `new MMKV()` | `createMMKV()` |
| Delete method | `.delete()` | `.remove()` |
| Peer deps | - | `react-native-nitro-modules@^0.32.1` |

---

## 2. Notification Sound Field (SDK 54)

### Breaking Change
Notification `sound` field cannot be `null` or `undefined` - must be `false` (boolean) or a string.

### Error
```
Failed to schedule notification, Cannot cast 'nil' for field 'sound'
of type Optional<Either<Bool, String>>
→ Caused by: Type must be either: Bool or String
```

**When it occurs**: Selecting "Silent" alert type for any prayer

### Files Affected
- `shared/notifications.ts` - Notification content generation

### Fix Applied

**Before**:
```typescript
export const getNotificationSound = (alertType: AlertType, soundIndex: number): string | null => {
  if (alertType !== AlertType.Sound) return null;  // ❌ WRONG
  return `athan${soundIndex + 1}.wav`;
};

export const genNotificationContent = (...): Notifications.NotificationContentInput => {
  return {
    // ...
    sound: getNotificationSound(alertType, soundIndex) || undefined,  // ❌ WRONG
  };
};
```

**After**:
```typescript
export const getNotificationSound = (alertType: AlertType, soundIndex: number): string | false => {
  if (alertType !== AlertType.Sound) return false;  // ✅ Use false, not null
  return `athan${soundIndex + 1}.wav`;
};

export const genNotificationContent = (...): Notifications.NotificationContentInput => {
  return {
    // ...
    sound: getNotificationSound(alertType, soundIndex),  // ✅ Always returns false or string
  };
};
```

### Key Changes
| Alert Type | Value |
|-----------|-------|
| Off (no notification) | N/A |
| Silent (banner only) | `false` |
| Sound (with audio) | `"athan1.wav"` |

---

## 3. Notification Handler Requirements

### Breaking Change
Notification handler must explicitly return `shouldShowBanner` and `shouldShowList` properties.

### Error
```
iOS: Notifications not showing banners
Android: Notifications not showing in list
```

### Files Affected
- `hooks/useNotification.ts` - Notification handler setup

### Fix Applied

**Before**:
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Missing shouldShowBanner and shouldShowList
  }),
});
```

**After**:
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,  // ✅ NEW (SDK 54)
    shouldShowList: true,     // ✅ NEW (SDK 54)
  }),
});
```

---

## 4. expo-av → expo-audio Migration

### Breaking Change
expo-av is deprecated. SDK 54+ requires migration to expo-audio with new hook-based API.

### Error
```
expo-av is not receiving patches and will be removed in SDK 55
```

### Files Affected
- `components/BottomSheetSoundItem.tsx` - Audio player component

### Fix Applied

**Before (expo-av)**:
```typescript
import { Audio } from 'expo-av';

const [sound, setSound] = useState<Audio.Sound | null>(null);

const playSound = async () => {
  const { sound } = await Audio.Sound.createAsync(audio);
  await sound.playAsync();
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.didJustFinish) setPlayingSoundIndex(null);
  });
  setSound(sound);
};
```

**After (expo-audio)**:
```typescript
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

const player = useAudioPlayer(audio);
const status = useAudioPlayerStatus(player);

const playSound = () => {
  player.seekTo(0);
  player.play();
};

useEffect(() => {
  if (isPlaying && !status.playing && status.currentTime >= status.duration - 0.1) {
    setPlayingSoundIndex(null);
  }
}, [isPlaying, status.playing, status.currentTime, status.duration]);
```

### Key Changes
| Change | expo-av | expo-audio |
|--------|---------|-----------|
| Import | `Audio.Sound.createAsync()` | `useAudioPlayer()` + `useAudioPlayerStatus()` |
| Lifecycle | Manual `unloadAsync()` | Automatic hook cleanup |
| Status | Callback-based | Hook-based reactive |
| Type | `AVPlaybackSource` | `AudioSource` |

**Critical**: Must use `useAudioPlayerStatus(player)` to track playback, not `player.playing` directly.

---

## 5. React 19 Type Changes

### Breaking Change
React 19 has stricter event types and removed deprecated patterns.

### Error
```
Type 'number' is not assignable to type 'Timeout'
```

### Files Affected
- `components/Alert.tsx` - Timer ref types
- `components/Mute.tsx` - Timer ref types

### Fix Applied

**Before**:
```typescript
const timeoutRef = useRef<NodeJS.Timeout>();
const timeoutRef.current = setTimeout(...);
```

**After**:
```typescript
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const timeoutRef.current = setTimeout(...);
```

### Reason
React 19 uses more precise native types instead of Node-specific types.

---

## 6. react-native-edge-to-edge Removal

### Breaking Change
react-native-edge-to-edge is no longer needed - edge-to-edge is built into SDK 54.

### Files Affected
- `app/_layout.tsx` - Layout configuration

### Fix Applied

**Before**:
```typescript
import { SystemBars } from 'react-native-edge-to-edge';

return (
  <GestureHandlerRootView>
    <SystemBars style="light" />
    {/* ... */}
  </GestureHandlerRootView>
);
```

**After**:
```typescript
import { StatusBar } from 'expo-status-bar';

return (
  <GestureHandlerRootView>
    <StatusBar style="light" />
    {/* ... */}
  </GestureHandlerRootView>
);
```

---

## 7. expo-background-fetch Deprecation

### Breaking Change
expo-background-fetch is deprecated and removed in SDK 54.

### Files Affected
- `device/tasks.ts` - **DELETED** entirely
- `app/index.tsx` - Import removed

### Fix Applied
```typescript
// Removed from app/index.tsx
- import { deregisterBackgroundFetchAsync } from '@/device/tasks';

// Deleted file
- device/tasks.ts (entire file removed)
```

**Reason**: Background notification scheduling now handled entirely by expo-notifications.

---

## 8. Pino Logger Typing

### Breaking Change
Pino's logger typing is stricter with object parameters.

### Error
```
Argument of type 'unknown' is not assignable to parameter of type 'undefined'
```

### Files Affected
- `shared/logger.ts` - Logger wrapper

### Fix Applied

**Before**:
```typescript
const logger = pino(...);

// Call: logger.error('message', unknownData)
// Problem: pino doesn't accept second param of type unknown
```

**After**:
```typescript
const logger = {
  info: (msg: string, data?: unknown) => {
    if (data !== undefined) {
      if (typeof data === 'object' && data !== null) {
        pinoLogger.info(data, msg);
      } else {
        pinoLogger.info({ data }, msg);
      }
    } else {
      pinoLogger.info(msg);
    }
  },
  // Same pattern for error, warn, debug
};
```

**Reason**: Wrapper normalizes data before passing to pino.

---

## 9. Reanimated ViewStyle Typing

### Breaking Change
Reanimated v4 has stricter style prop typing.

### Error
```
Type 'ViewStyle' is not assignable to type 'AnimatedStyleProp'
```

### Files Affected
- `components/Overlay.tsx` - Date overlay styling

### Fix Applied

**Before**:
```typescript
<Reanimated.Text style={[styles.date, computedStyleDate, dateOpacity.style]}>
```

**After**:
```typescript
<Reanimated.Text style={[styles.date, computedStyleDate as object, dateOpacity.style]}>
```

**Reason**: Reanimated styles and React Native ViewStyles have incompatible type definitions.

---

## 10. TypeScript Strict Mode Issues

### Breaking Change
TypeScript flags more implicit `any` types and type mismatches.

### Errors Fixed

| File | Issue | Fix |
|------|-------|-----|
| `components/BottomSheetSound.tsx` | `ListRenderItemInfo` typing | Add generic type parameter |
| `shared/time.ts` | Timer return type | Use `ReturnType<typeof setInterval>` |
| `shared/notifications.ts` | Sound field type | Changed to `string \| false` |

---

## Testing Checklist

After any future SDK upgrades, verify:

- [x] All TypeScript errors cleared
- [x] App starts without build errors
- [x] Prayer times display correctly
- [x] Timer counts down properly
- [x] Notifications schedule without errors
- [x] Audio plays on iOS simulator
- [x] Audio plays on Android emulator
- [x] Silent alert type works (no audio, just banner)
- [x] Sound alert type works (audio + banner)
- [x] Athan audio preview works in settings
- [x] Multiple sounds don't overlap
- [x] No console errors when interacting with app

---

## Package Versions (Locked)

All versions are pinned to prevent future breaking changes:

```json
{
  "expo": "54.0.31",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-mmkv": "4.1.1",
  "react-native-nitro-modules": "0.32.1",
  "expo-audio": "1.1.1",
  "react-native-reanimated": "4.1.6"
}
```

---

## Related Documentation

- `MIGRATION-EXPO-AUDIO.md` - Detailed audio migration guide
- `DEPENDENCY-PINNING-STRATEGY.md` - Version management strategy
- `CLAUDE.md` - Current architecture overview
- `README.md` - Project overview

---

## Key Learnings

1. **Expo deprecates quickly** - expo-av removal came with SDK 54
2. **TypeScript gets stricter** - React 19 + strict mode caught many issues
3. **MMKV v4 is a major change** - Nitro Module integration changed API significantly
4. **Notification schema matters** - SDK 54 validates notification fields strictly
5. **Hook-based APIs are better** - expo-audio hooks are more testable and composable
6. **Version pinning saves time** - Exact versions prevent surprise breaking changes

