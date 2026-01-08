## OVERVIEW

21 React Native UI components for prayer time display with Reanimated v4 animations, Jotai state, and custom hooks.

---

## WHERE TO LOOK

| Component                                     | Purpose                   | Notes                              |
| --------------------------------------------- | ------------------------- | ---------------------------------- |
| **Prayer/PrayerTime**                         | Prayer row display        | English/Arabic, time, alert        |
| **List/Day/Timer**                            | Core UI components        | Container, date, countdown         |
| **Overlay**                                   | Full-screen prayer detail | Uses cached measurements           |
| **InitialWidthMeasurement**                   | Width calculation         | Runs once during splash            |
| **Modal + variants**                          | Popups                    | Base, Tips, Update, TimesExplained |
| **Alert/Mute**                                | Notification controls     | Toggle + mute per schedule         |
| **BottomSheetSound**                          | Sound selection           | Preview before commit              |
| **Glow/ActiveBackground/BackgroundGradients** | Background styling        | Gradients, highlights              |
| **Icon/Masjid/Error**                         | Utility components        | Icons, decorative, fallback        |

---

## CONVENTIONS

- **Default exports only**: `export default function Component()`
- **Type-first**: Props interface at top of file
- **No memo pattern**: No useMemo/useCallback (except Alert/BottomSheetSound for debouncing)
- **Animations**: All via `hooks/useAnimation*` (Color, Scale, Opacity, Bounce)
- **Haptics**: All interactions use `expo-haptics`

---

## ANTI-PATTERNS

- **Alert.tsx**: useCallback for debounced notification updates
- **BottomSheetSound.tsx**: useCallback for BottomSheet optimization
- **Debounced updates**: Immediate UI state → debounced persist (Alert, Mute)
- **Measurement races**: List/Day check `cachedMeasurements.width > 0` before capturing
