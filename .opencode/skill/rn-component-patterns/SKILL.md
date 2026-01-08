---
name: rn-component-patterns
description: React Native component patterns for prayer times app (no-memo, default exports, type-first)
license: MIT
compatibility: opencode
metadata:
  audience: developers
  tech: "react-native, expo, reanimated, jotai"
---

# React Native Component Patterns

## What I do

I guide you through the unique component patterns used in this prayer times app. This project **intentionally avoids useMemo/useCallback** and follows specific conventions for consistency.

## Core Patterns

### 1. Default Exports Only
**All components use default exports:**
```typescript
// ✅ CORRECT
export default function Component() {
  return <View>Your UI</View>;
}

// ❌ WRONG - named exports for components
export function Component() {
  return <View>Your UI</View>;
}
```

### 2. Type-First Design
**Props interface declared at top:**
```typescript
// ✅ CORRECT
interface ComponentProps {
  type: ScheduleType;
  onPress: () => void;
}

export default function Component({ type, onPress }: ComponentProps) {
  return <Button onPress={onPress}>{type}</Button>;
}
```

### 3. No Memo Pattern
**Intentionally NO useMemo/useCallback** (verified across 21 components):
```typescript
// ❌ WRONG - don't use memo in this project
export default function Component({ data }) {
  const memoizedValue = useMemo(() => process(data), [data]);
  return <Display value={memoizedValue} />;
}

// ✅ CORRECT - no memoization
export default function Component({ data }) {
  const value = process(data);
  return <Display value={value} />;
}
```

**Exceptions (documented):**
- `Alert.tsx` - useCallback for debounced notification updates
- `BottomSheetSound.tsx` - useCallback for BottomSheet optimization

### 4. Haptics Integration
**All interactions use expo-haptics:**
```typescript
import * as Haptics from 'expo-haptics';

const handlePress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  // ... your logic
};
```

### 5. Animation Hooks
**All animations via custom hooks:**
```typescript
import { useAnimationColor, useAnimationScale } from '@/hooks/useAnimation';

export default function Component() {
  const colorStyle = useAnimationColor(active ? COLORS.active : COLORS.inactive);
  const scaleStyle = useAnimationScale(pressed ? 1.05 : 1);
  
  return <Animated.View style={[colorStyle, scaleStyle]} />;
}
```

**Available hooks:**
- `useAnimationColor`
- `useAnimationOpacity`
- `useAnimationScale`
- `useAnimationBounce`
- `useAnimationTranslateY`
- `useAnimationWidth`
- `useAnimationHeight`

## Component Architecture

### Layering Pattern
```
BottomSheetModalProvider (root layout)
  └── GestureHandlerRootView (root layout)
        └── Overlay (z-index: 2, glow: -1)
        └── ModalUpdate/ModalTips/ModalTimesExplained
        └── Navigation
              └── PagerView
                    └── Screen
                          ├── Timer
                          ├── Day
                          ├── List
                          │     └── Prayer/PrayerTime
                          └── Mute
```

### Data Flow
```
Jotai Atoms (stores/)
  └── useAtomValue() in components
        └── Direct render (no Context)
```

### Measurement Caching Pattern
**Avoid layout thrashing by caching measurements:**
```typescript
// ✅ CORRECT - check cache before capturing
if (cachedMeasurements.width > 0) return;

const onLayout = (event) => {
  const { width } = event.nativeEvent.layout;
  setCachedMeasurements({ ...cachedMeasurements, width });
};
```

## Common Component Patterns

### Prayer Item
```typescript
export default function Prayer({ prayer, onPress }: { prayer: ITransformedPrayer, onPress: () => void }) {
  const isNext = usePrayer(prayer);
  
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{prayer.english}</Text>
      <Text>{prayer.time}</Text>
      {isNext && <ActiveBackground />}
    </TouchableOpacity>
  );
}
```

### Modal Base
```typescript
export default function Modal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const animatedStyle = useAnimationOpacity(visible ? 1 : 0);
  
  return (
    <Animated.View style={[styles.modal, animatedStyle]}>
      <View style={styles.content}>
        {/* Modal content */}
      </View>
    </Animated.View>
  );
}
```

### Toggle Button
```typescript
export default function Toggle({ value, onToggle }: { value: boolean, onToggle: () => void }) {
  const scaleStyle = useAnimationScale(value ? 0.95 : 1);
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };
  
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={scaleStyle}>
        <Icon name={value ? 'ON' : 'OFF'} />
      </Animated.View>
    </TouchableOpacity>
  );
}
```

## When to Use Me

Use this skill when:
- Creating new components
- Understanding existing component structure
- Debugging component behavior
- Adding animations
- Implementing haptic feedback

## File Locations

| Component Type | Directory | Examples |
|-------------|-----------|-----------|
| Core UI | `components/` | Timer, Day, List, Mute |
| Prayer items | `components/` | Prayer, PrayerTime |
| Modals | `components/` | Modal, ModalUpdate, ModalTips, ModalTimesExplained |
| Overlays | `components/` | Overlay, BottomSheetSound |
| Background | `components/` | ActiveBackground, BackgroundGradients, Glow |
| Utility | `components/` | Icon, Masjid, Error |

## Anti-Patterns to Avoid

### 1. Named Exports for Components
```typescript
// ❌ WRONG
export function Component() { return <View />; }

// ✅ CORRECT
export default function Component() { return <View />; }
```

### 2. useMemo/useCallback Without Reason
```typescript
// ❌ WRONG - project intentionally avoids memo
export default function Component({ data }) {
  const memoized = useMemo(() => data.map(...), [data]);
  return <List data={memoized} />;
}

// ✅ CORRECT
export default function Component({ data }) {
  const mapped = data.map(...);
  return <List data={mapped} />;
}
```

### 3. Missing Haptic Feedback
```typescript
// ❌ WRONG - no haptic feedback
const handlePress = () => {
  onToggle();
};

// ✅ CORRECT
const handlePress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  onToggle();
};
```

### 4. Direct Style Objects
```typescript
// ❌ WRONG - use StyleSheet.create
const styles = {
  container: { padding: 10 },
};

// ✅ CORRECT - use StyleSheet.create
const styles = StyleSheet.create({
  container: { padding: 10 },
});
```

## Common Operations

### Create New Component
```typescript
interface NewComponentProps {
  title: string;
  onPress: () => void;
}

export default function NewComponent({ title, onPress }: NewComponentProps) {
  const scaleStyle = useAnimationScale(1);
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };
  
  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Animated.View style={scaleStyle}>
        <Text>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}
```

### Add Animation to Existing Component
```typescript
import { useAnimationColor } from '@/hooks/useAnimation';

export default function ExistingComponent() {
  const animatedStyle = useAnimationColor(isActive ? COLORS.active : COLORS.inactive);
  
  return <Animated.View style={animatedStyle}>...</Animated.View>;
}
```

## Notes

- All 21 components follow default export pattern
- No memoization used except for documented debouncing cases
- All interactions include haptic feedback
- Animations centralized in `hooks/useAnimation.ts`
- Measurement caching prevents layout thrashing
- Props interfaces declared at top of files
- StyleSheet.create used for performance
