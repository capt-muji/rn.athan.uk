# MIGRATION: expo-av → expo-audio (SDK 54)

**Status**: ✅ COMPLETED (Jan 2026)
**Files Modified**: `components/BottomSheetSoundItem.tsx`
**Related Issue**: Notification sound field fix in `shared/notifications.ts`

---

## BEFORE (expo-av)

```typescript
import { Audio, AVPlaybackSource } from 'expo-av';

const [sound, setSound] = useState<Audio.Sound | null>(null);

const playSound = async () => {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  const { sound: playbackObject } = await Audio.Sound.createAsync(audio, {
    shouldPlay: true,
  });
  setSound(playbackObject);

  playbackObject.setOnPlaybackStatusUpdate((status) => {
    if (status.didJustFinish) {
      setPlayingSoundIndex(null);
    }
  });
};

useEffect(() => {
  return () => {
    if (sound) sound.unloadAsync();
  };
}, [sound]);
```

---

## AFTER (expo-audio)

```typescript
import { useAudioPlayer, useAudioPlayerStatus, AudioSource } from 'expo-audio';

interface Props {
  index: number;
  audio: AudioSource;
  onSelect: (index: number) => void;
  tempSelection: number | null;
}

export default function BottomSheetSoundItem({ index, audio, onSelect, tempSelection }: Props) {
  const playingIndex = useAtomValue(playingSoundIndexAtom);

  // Create player instance for this audio
  const player = useAudioPlayer(audio);

  // Get real-time status updates
  const status = useAudioPlayerStatus(player);

  const isPlaying = playingIndex === index;

  // Stop playing when another sound is selected
  useEffect(() => {
    if (playingIndex !== index && status.playing) {
      player.pause();
    }
  }, [playingIndex, index, status.playing]);

  // Detect when playback finishes
  useEffect(() => {
    if (isPlaying && !status.playing && status.currentTime > 0 && status.duration > 0) {
      if (status.currentTime >= status.duration - 0.1) {
        setPlayingSoundIndex(null);
      }
    }
  }, [isPlaying, status.playing, status.currentTime, status.duration]);

  const playSound = () => {
    if (isPlaying) {
      player.pause();
      setPlayingSoundIndex(null);
      return;
    }

    player.seekTo(0);
    player.play();
    setPlayingSoundIndex(index);
  };

  return (
    <AnimatedPressable style={[...]} onPress={handlePress}>
      {/* Component JSX */}
    </AnimatedPressable>
  );
}
```

---

## PACKAGE CHANGES

```bash
yarn remove expo-av
npx expo install expo-audio react-native-nitro-modules
```

---

## KEY DIFFERENCES

### 1. Hook-Based API (Simpler)
- **Before**: `Audio.Sound.createAsync()` (complex, async)
- **After**: `useAudioPlayer(source)` (simple, synchronous)

### 2. Status Tracking (NEW)
- **Before**: Manual `setOnPlaybackStatusUpdate()` callback
- **After**: `useAudioPlayerStatus(player)` hook with reactive updates
  ```typescript
  const status = useAudioPlayerStatus(player);
  // status.playing, status.currentTime, status.duration automatically update
  ```

### 3. Automatic Cleanup
- **Before**: Manual `unloadAsync()` in useEffect cleanup
- **After**: Hook handles lifecycle automatically

### 4. Type System
- **Before**: `AVPlaybackSource`
- **After**: `AudioSource` (cleaner)

### 5. Player Methods
| Method | expo-av | expo-audio |
|--------|---------|-----------|
| Play | `sound.playAsync()` | `player.play()` |
| Pause | `sound.pauseAsync()` | `player.pause()` |
| Seek | `sound.setPositionAsync()` | `player.seekTo()` |
| Get status | `sound.getStatusAsync()` | `useAudioPlayerStatus(player)` |

---

## Critical Gotchas

### 1. Status Updates Are Reactive
Use `useAudioPlayerStatus()` in effects to track changes:
```typescript
// ❌ DON'T: This won't work reliably
if (player.playing) { ... }

// ✅ DO: Use status from hook
const status = useAudioPlayerStatus(player);
if (status.playing) { ... }
```

### 2. Silent Mode iOS
Unlike expo-av's `setAudioModeAsync()`, expo-audio respects system settings by default. For notifications that must play in silent mode, use `expo-notifications` with proper channel configuration.

### 3. Notification Sound Field (SDK 54 Issue)
When scheduling notifications with audio:
```typescript
// ❌ WRONG: null/undefined causes "Cannot cast 'nil'" error
sound: null  // ERROR in SDK 54

// ✅ CORRECT: false for silent, string for audio
sound: false           // Silent
sound: "athan.wav"     // With audio
```

See `shared/notifications.ts` for the fix.

---

## Migration Checklist

- [x] Replace `Audio.Sound.createAsync()` with `useAudioPlayer()`
- [x] Add `useAudioPlayerStatus()` for status tracking
- [x] Remove manual `unloadAsync()` cleanup
- [x] Update type: `AVPlaybackSource` → `AudioSource`
- [x] Fix notification sound field to use `false` instead of `null`
- [x] Test audio playback on iOS
- [x] Test audio playback on Android
- [x] Test silent mode handling
- [x] Test multiple sounds don't overlap

---

## Testing

```bash
# Run on iOS simulator
yarn ios

# Run on Android emulator
yarn android

# Test:
# 1. Open settings
# 2. Select different Athan sounds
# 3. Click play icon - audio should play
# 4. Click another sound - first should stop
# 5. Let sound finish - should auto-stop UI
# 6. Select "Silent" alert type - no sound, just notification
```

---

## See Also

- `SDK-54-BREAKING-CHANGES.md` - Full migration context
- `DEPENDENCY-PINNING-STRATEGY.md` - Version management
- `components/BottomSheetSoundItem.tsx` - Implementation
- `shared/notifications.ts` - Notification sound fix
