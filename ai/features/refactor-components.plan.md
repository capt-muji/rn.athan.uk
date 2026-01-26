# Components Folder Refactoring - Complete Implementation Plan

**Version:** 1.0
**Created:** 2026-01-26
**Status:** Ready for Implementation
**Estimated Tasks:** 67 tasks across 5 phases

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Context](#project-context)
3. [File Inventory](#file-inventory)
4. [Phase 1: BottomSheetAlert.tsx](#phase-1-bottomsheetalerttsx)
5. [Phase 2: ColorPickerSettings.tsx](#phase-2-colorpickersettingstsx)
6. [Phase 3: CountdownBar.tsx](#phase-3-countdownbartsx)
7. [Phase 4: Medium Files](#phase-4-medium-files)
8. [Phase 5: Consolidation](#phase-5-consolidation)
9. [Implementation Order](#implementation-order)
10. [Verification Plan](#verification-plan)

---

## Executive Summary

Transform the `components/` folder from 27 files (~3,700 LOC) with several monolithic files into a collection of small, focused, reusable components. Each component should ideally be:

- **< 150 lines** (single responsibility)
- **Self-contained** (own styles, no embedded sub-components)
- **Reusable** where patterns repeat
- **Well-typed** with exported interfaces

### Key Outcomes

| Phase | File                    | Before | After | Change |
| ----- | ----------------------- | ------ | ----- | ------ |
| 1     | BottomSheetAlert.tsx    | 684    | ~270  | -60%   |
| 2     | ColorPickerSettings.tsx | 312    | ~200  | -36%   |
| 3     | CountdownBar.tsx        | 274    | ~180  | -34%   |
| 4     | BottomSheetSettings.tsx | 217    | ~150  | -31%   |
| 4     | Overlay.tsx             | 214    | ~150  | -30%   |
| 4     | BottomSheetSound.tsx    | 180    | ~130  | -28%   |

### New Files Created

| File                       | Lines | Source                          |
| -------------------------- | ----- | ------------------------------- |
| `SegmentedControl.tsx`     | ~170  | Phase 1 - from BottomSheetAlert |
| `Stepper.tsx`              | ~100  | Phase 1 - from BottomSheetAlert |
| `BottomSheetHeader.tsx`    | ~80   | Phase 4 - shared across sheets  |
| `useOverlayPositioning.ts` | ~60   | Phase 4 - from Overlay          |

---

## Project Context

### Technology Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Reanimated 3** for animations
- **Jotai** for state management
- **@gorhom/bottom-sheet** for bottom sheets
- **MMKV** for persistent storage

### Code Conventions

- Functional components with hooks only
- Default exports for components
- Named exports for types/interfaces
- StyleSheet.create() for styles (co-located with component)
- `@/` path alias for imports
- JSDoc comments for public components

### Critical Files Reference

```
/Users/muji/repos/rn.athan.uk/
├── components/                    # Target directory
│   ├── BottomSheetAlert.tsx      # 684 lines - Phase 1
│   ├── ColorPickerSettings.tsx   # 312 lines - Phase 2
│   ├── CountdownBar.tsx          # 274 lines - Phase 3
│   ├── BottomSheetSettings.tsx   # 217 lines - Phase 4
│   ├── Overlay.tsx               # 214 lines - Phase 4
│   ├── BottomSheetSound.tsx      # 180 lines - Phase 4
│   ├── SettingsToggle.tsx        # 69 lines - Reference pattern
│   └── BottomSheetShared.tsx     # 49 lines - Shared utilities
├── shared/
│   ├── constants.ts              # ANIMATION, COLORS, SPACING, etc.
│   └── types.ts                  # AlertType, Icon, ReminderInterval
└── hooks/
    └── useCountdownBar.ts        # Progress calculation
```

---

## File Inventory

### Current State (27 components, ~3,700 LOC)

| Priority | File                     | Lines | Embedded Components                             | Phase  |
| -------- | ------------------------ | ----- | ----------------------------------------------- | ------ |
| **P0**   | BottomSheetAlert.tsx     | 684   | SegmentedControl, Toggle, Stepper, TypeSelector | 1      |
| **P1**   | ColorPickerSettings.tsx  | 312   | ColorSwatches, ModalHeader                      | 2      |
| **P1**   | CountdownBar.tsx         | 274   | TipIndicator, ProgressBar                       | 3      |
| **P2**   | BottomSheetSettings.tsx  | 217   | Header (duplicated)                             | 4      |
| **P2**   | Overlay.tsx              | 214   | Positioning logic                               | 4      |
| **P2**   | BottomSheetSound.tsx     | 180   | Header (duplicated)                             | 4      |
| **P3**   | Alert.tsx                | 170   | -                                               | Review |
| **P3**   | PrayerExplanation.tsx    | 161   | -                                               | Review |
| **P3**   | BottomSheetSoundItem.tsx | 153   | -                                               | Keep   |
| OK       | Prayer.tsx               | 125   | -                                               | Keep   |
| OK       | PrayerTime.tsx           | 95    | -                                               | Keep   |
| OK       | Others (<100 lines)      | 16-82 | -                                               | Keep   |

---

## Phase 1: BottomSheetAlert.tsx

### Current Analysis

**File:** `/Users/muji/repos/rn.athan.uk/components/BottomSheetAlert.tsx`
**Lines:** 684
**Embedded Components:** 4 (with 5 StyleSheets)

```
BottomSheetAlert.tsx (684 lines)
│
├── SegmentedControl ─────── Lines 26-163 (137 lines)
│   ├── Interface: SegmentOption, SegmentedControlProps
│   ├── AnimatedSegmentOption (sub-component)
│   ├── SegmentedControl (main)
│   └── segmentStyles (StyleSheet)
│
├── Toggle ───────────────── Lines 165-218 (53 lines)
│   ├── Interface: ToggleProps
│   ├── Toggle component
│   └── toggleStyles (StyleSheet)
│
├── Stepper ──────────────── Lines 220-310 (90 lines)
│   ├── Interface: StepperProps
│   ├── Stepper component
│   └── stepperStyles (StyleSheet)
│
├── TypeSelector ─────────── Lines 312-443 (131 lines)  ⚠️ DUPLICATE
│   ├── Interface: TypeSelectorProps
│   ├── AnimatedTypeSelectorOption (94% identical to AnimatedSegmentOption)
│   ├── TypeSelector (main)
│   └── typeSelectorStyles (StyleSheet)
│
└── BottomSheetAlert ─────── Lines 445-684 (239 lines)
    ├── Main alert sheet component
    └── styles (StyleSheet)
```

### Key Finding: TypeSelector is 94% Duplicate

TypeSelector (lines 312-443) is nearly identical to SegmentedControl:

- Same animation patterns (`useDerivedValue`, `withTiming`, `interpolateColor`)
- Same `SEGMENT_COLORS` constant
- Same indicator animation logic
- Only difference: hardcoded 2 options vs. dynamic array

**Solution:** Delete TypeSelector entirely, use SegmentedControl with 2-option array.

### Task 1.1: Create SegmentedControl.tsx

**File:** `/Users/muji/repos/rn.athan.uk/components/SegmentedControl.tsx`

```typescript
import * as Haptics from 'expo-haptics';
import { useCallback, useState, useMemo } from 'react';
import { StyleSheet, View, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';

import IconView from '@/components/Icon';
import { TEXT, SPACING, RADIUS, COLORS, ANIMATION } from '@/shared/constants';
import { AlertType, Icon } from '@/shared/types';

// =============================================================================
// TYPES
// =============================================================================

export interface SegmentOption {
  value: AlertType;
  label: string;
  icon: Icon;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  selected: AlertType;
  onSelect: (value: AlertType) => void;
  disabled?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SEGMENT_COLORS = {
  selected: '#fff',
  unselected: 'rgb(95, 133, 177)',
};

// =============================================================================
// ANIMATED SEGMENT OPTION
// =============================================================================

interface AnimatedSegmentOptionProps {
  option: SegmentOption;
  isSelected: boolean;
  onPress: () => void;
}

function AnimatedSegmentOption({ option, isSelected, onPress }: AnimatedSegmentOptionProps) {
  const progress = useDerivedValue(() => withTiming(isSelected ? 1 : 0, { duration: ANIMATION.duration }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [SEGMENT_COLORS.unselected, SEGMENT_COLORS.selected]),
  }));

  const selectedIconOpacity = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const unselectedIconOpacity = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  return (
    <Pressable style={styles.option} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.iconLayer, unselectedIconOpacity]}>
          <IconView type={option.icon} size={13} color={SEGMENT_COLORS.unselected} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, selectedIconOpacity]}>
          <IconView type={option.icon} size={13} color={SEGMENT_COLORS.selected} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.label, labelStyle]}>{option.label}</Animated.Text>
    </Pressable>
  );
}

// =============================================================================
// SEGMENTED CONTROL
// =============================================================================

/**
 * Animated segmented control for selecting alert types.
 * Features smooth indicator sliding and icon/label color transitions.
 *
 * @example
 * const ALERT_OPTIONS: SegmentOption[] = [
 *   { value: AlertType.Off, label: 'Off', icon: Icon.BELL_SLASH },
 *   { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
 *   { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
 * ];
 *
 * <SegmentedControl
 *   options={ALERT_OPTIONS}
 *   selected={currentAlert}
 *   onSelect={setAlert}
 * />
 */
export default function SegmentedControl({ options, selected, onSelect, disabled }: SegmentedControlProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const padding = 3;

  const selectedIndex = useMemo(() => options.findIndex((o) => o.value === selected), [options, selected]);
  const optionWidth = containerWidth > 0 ? (containerWidth - padding * 2) / options.length : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(selectedIndex * optionWidth, { duration: ANIMATION.duration }) }],
    width: optionWidth,
  }));

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={[styles.container, disabled && styles.disabled]} onLayout={handleLayout}>
      {containerWidth > 0 && <Animated.View style={[styles.indicator, indicatorStyle]} />}
      {options.map((option) => (
        <AnimatedSegmentOption
          key={option.value}
          option={option}
          isSelected={selected === option.value}
          onPress={() => {
            if (!disabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option.value);
            }
          }}
        />
      ))}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: RADIUS.md,
    padding: 3,
    marginTop: SPACING.md,
  },
  disabled: {
    opacity: 0.4,
  },
  indicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    bottom: 3,
    backgroundColor: COLORS.interactive.active,
    borderRadius: RADIUS.md - 2,
    borderWidth: 1,
    borderColor: COLORS.interactive.activeBorder,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.smd,
    borderRadius: RADIUS.md - 2,
  },
  iconContainer: {
    width: 13,
    height: 13,
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  label: {
    fontSize: TEXT.sizeDetail - 1,
    fontFamily: TEXT.family.regular,
  },
});
```

### Task 1.2: Create Stepper.tsx

**File:** `/Users/muji/repos/rn.athan.uk/components/Stepper.tsx`

```typescript
import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { TEXT, SPACING, RADIUS, REMINDER_INTERVALS } from '@/shared/constants';
import { ReminderInterval } from '@/shared/types';

// =============================================================================
// TYPES
// =============================================================================

export interface StepperProps {
  value: ReminderInterval;
  onDecrement: () => void;
  onIncrement: () => void;
  disabled?: boolean;
}

// =============================================================================
// STEPPER
// =============================================================================

/**
 * Increment/decrement stepper for reminder intervals.
 * Buttons automatically disable at boundary values (5min and 30min).
 *
 * @example
 * <Stepper
 *   value={reminderInterval}
 *   onDecrement={handleDecrement}
 *   onIncrement={handleIncrement}
 *   disabled={!isReminderOn}
 * />
 */
export default function Stepper({ value, onDecrement, onIncrement, disabled }: StepperProps) {
  const currentIndex = REMINDER_INTERVALS.indexOf(value);
  const canDecrement = currentIndex > 0 && !disabled;
  const canIncrement = currentIndex < REMINDER_INTERVALS.length - 1 && !disabled;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
        onPress={() => {
          if (canDecrement) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDecrement();
          }
        }}>
        <Text style={[styles.buttonText, !canDecrement && styles.buttonTextDisabled]}>−</Text>
      </Pressable>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>min</Text>
      </View>
      <Pressable
        style={[styles.button, !canIncrement && styles.buttonDisabled]}
        onPress={() => {
          if (canIncrement) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onIncrement();
          }
        }}>
        <Text style={[styles.buttonText, !canIncrement && styles.buttonTextDisabled]}>+</Text>
      </Pressable>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: RADIUS.md,
    padding: 3,
  },
  button: {
    paddingVertical: SPACING.smd,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md - 2,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.medium,
    color: 'rgb(234, 242, 250)',
  },
  buttonTextDisabled: {
    color: 'rgb(50, 98, 150)',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  value: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.medium,
    color: '#fff',
  },
  unit: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgb(95, 133, 177)',
    marginLeft: 3,
  },
});
```

### Task 1.3: Update BottomSheetAlert.tsx

**File:** `/Users/muji/repos/rn.athan.uk/components/BottomSheetAlert.tsx`

#### 1.3.1 Update Imports (lines 1-25)

**REPLACE** the entire import section with:

```typescript
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAtomValue } from 'jotai';
import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { renderSheetBackground, renderBackdrop, bottomSheetStyles } from '@/components/BottomSheetShared';
import IconView from '@/components/Icon';
import SegmentedControl, { SegmentOption } from '@/components/SegmentedControl';
import Stepper from '@/components/Stepper';
import { useNotification } from '@/hooks/useNotification';
import {
  TEXT,
  SPACING,
  RADIUS,
  REMINDER_INTERVALS,
  DEFAULT_REMINDER_INTERVAL,
  COLORS,
  SIZE,
  ANIMATION,
} from '@/shared/constants';
import { AlertType, Icon, ReminderInterval } from '@/shared/types';
import { getPrayerAlertType, getReminderAlertType, getReminderInterval } from '@/stores/notifications';
import { alertSheetStateAtom, setAlertSheetModal } from '@/stores/ui';
```

#### 1.3.2 Delete Extracted Components

**DELETE** the following sections entirely:

- Lines 26-163: SegmentedControl section (moved to new file)
- Lines 220-310: Stepper section (moved to new file)
- Lines 312-443: TypeSelector section (deleted - replaced by SegmentedControl)

#### 1.3.3 Keep Toggle Component Inline

**KEEP** the Toggle component (lines 165-218) - it has a different compositional role than SettingsToggle:

- `Toggle` = raw animated switch without label (used in card layouts)
- `SettingsToggle` = toggle with label row (used in settings lists)

#### 1.3.4 Add REMINDER_TYPE_OPTIONS Constant

After the `ALERT_OPTIONS` constant (around line 449), **ADD**:

```typescript
const REMINDER_TYPE_OPTIONS: SegmentOption[] = [
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];
```

#### 1.3.5 Update TypeSelector Usage (line 569)

**REPLACE**:

```typescript
<TypeSelector selected={reminderType} onSelect={handleReminderTypeSelect} disabled={!isReminderOn} />
```

**WITH**:

```typescript
<SegmentedControl
  options={REMINDER_TYPE_OPTIONS}
  selected={reminderType}
  onSelect={handleReminderTypeSelect}
  disabled={!isReminderOn}
/>
```

#### 1.3.6 Update Stepper Usage (lines 574-587)

**REPLACE**:

```typescript
<Stepper
  value={reminderInterval}
  onDecrement={() => {
    if (!isReminderOn) return;
    const idx = REMINDER_INTERVALS.indexOf(reminderInterval);
    if (idx > 0) setReminderInterval(REMINDER_INTERVALS[idx - 1] as ReminderInterval);
  }}
  onIncrement={() => {
    if (!isReminderOn) return;
    const idx = REMINDER_INTERVALS.indexOf(reminderInterval);
    if (idx < REMINDER_INTERVALS.length - 1)
      setReminderInterval(REMINDER_INTERVALS[idx + 1] as ReminderInterval);
  }}
/>
```

**WITH**:

```typescript
<Stepper
  value={reminderInterval}
  onDecrement={() => {
    const idx = REMINDER_INTERVALS.indexOf(reminderInterval);
    if (idx > 0) setReminderInterval(REMINDER_INTERVALS[idx - 1] as ReminderInterval);
  }}
  onIncrement={() => {
    const idx = REMINDER_INTERVALS.indexOf(reminderInterval);
    if (idx < REMINDER_INTERVALS.length - 1)
      setReminderInterval(REMINDER_INTERVALS[idx + 1] as ReminderInterval);
  }}
  disabled={!isReminderOn}
/>
```

#### 1.3.7 Handle marginTop Difference

The first SegmentedControl (Athan section) needs `marginTop: SPACING.md`, but the second one (Sound section) does not. The style is already in the SegmentedControl component, so no change needed for the first usage. For the second usage, wrap in a View to override:

**REPLACE** (line 569 area):

```typescript
<SegmentedControl
  options={REMINDER_TYPE_OPTIONS}
  selected={reminderType}
  onSelect={handleReminderTypeSelect}
  disabled={!isReminderOn}
/>
```

**WITH**:

```typescript
<View style={{ marginTop: 0 }}>
  <SegmentedControl
    options={REMINDER_TYPE_OPTIONS}
    selected={reminderType}
    onSelect={handleReminderTypeSelect}
    disabled={!isReminderOn}
  />
</View>
```

### Task 1.4: Phase 1 Verification

#### Build Verification

```bash
yarn validate    # typecheck + lint + format + tests
yarn ios         # test on iOS simulator
```

#### Manual Testing Checklist

- [ ] **Open Alert Sheet:** Navigate to any prayer, tap alert icon
- [ ] **SegmentedControl (Athan):** Indicator slides, colors animate
- [ ] **Toggle (Reminder):** Thumb animates, enables/disables options below
- [ ] **SegmentedControl (Sound):** Indicator slides between Silent/Sound
- [ ] **Stepper (Before):** Increment/decrement work, buttons disable at boundaries
- [ ] **Disabled States:** Correct opacity (0.4) when disabled
- [ ] **Haptic Feedback:** Each tap triggers haptic
- [ ] **Settings Persist:** Close and reopen - settings saved

---

## Phase 2: ColorPickerSettings.tsx

### Current Analysis

**File:** `/Users/muji/repos/rn.athan.uk/components/ColorPickerSettings.tsx`
**Lines:** 312
**Structure:**

- Imports: 13 lines
- Constants: 27 lines
- Component: 106 lines
- StyleSheet: 135 lines

### Assessment: Minimal Extraction Needed

After analysis, ColorPickerSettings.tsx is **well-structured** with clear separation:

- No embedded sub-components (uses external `CountdownBar`, `ColorPicker`)
- Clean handler organization
- Appropriate file size for complexity

### Task 2.1: Extract Swatch Constants

**MOVE** the swatch color constants to `/shared/constants.ts`:

**ADD** to `/Users/muji/repos/rn.athan.uk/shared/constants.ts`:

```typescript
// =============================================================================
// COLOR PICKER
// =============================================================================

/** Primary swatch colors for countdown bar customization (first is default) */
export const COUNTDOWN_BAR_SWATCH_COLORS = [
  '#00ffea', // cyan (default)
  '#ff3366', // hot pink
  '#00ff88', // mint green
  '#ff9500', // orange
  '#ffee00', // yellow
  '#7b68ee', // medium purple
] as const;

/** Secondary swatch colors for additional options */
export const COUNTDOWN_BAR_SWATCH_COLORS_2 = [
  '#ff2d2d', // red
  '#00bfff', // deep sky blue
  '#ff69b4', // pink
  '#32cd32', // lime green
  '#dc2eff', // gold
  '#1f8bff', // medium orchid
] as const;

/** Default countdown bar color */
export const DEFAULT_COUNTDOWN_BAR_COLOR = COUNTDOWN_BAR_SWATCH_COLORS[0];
```

### Task 2.2: Update ColorPickerSettings.tsx

**File:** `/Users/muji/repos/rn.athan.uk/components/ColorPickerSettings.tsx`

#### 2.2.1 Update Imports

**REPLACE** line 11:

```typescript
import { TEXT, STYLES, COLORS, SPACING, RADIUS, SHADOW, SIZE, ELEVATION, HIT_SLOP } from '@/shared/constants';
```

**WITH**:

```typescript
import {
  TEXT,
  STYLES,
  COLORS,
  SPACING,
  RADIUS,
  SHADOW,
  SIZE,
  ELEVATION,
  HIT_SLOP,
  COUNTDOWN_BAR_SWATCH_COLORS,
  COUNTDOWN_BAR_SWATCH_COLORS_2,
  DEFAULT_COUNTDOWN_BAR_COLOR,
} from '@/shared/constants';
```

#### 2.2.2 Delete Local Constants

**DELETE** lines 15-40 (the local constant definitions):

```typescript
/** Primary swatch colors for quick selection (first is default) */
const SWATCH_COLORS = [
  // ... entire block
];

/** Secondary swatch colors for additional options */
const SWATCH_COLORS_2 = [
  // ... entire block
];

/** Default color when reset is pressed */
const DEFAULT_COLOR = SWATCH_COLORS[0];
```

#### 2.2.3 Update References

**REPLACE** all occurrences:

- `SWATCH_COLORS` → `COUNTDOWN_BAR_SWATCH_COLORS`
- `SWATCH_COLORS_2` → `COUNTDOWN_BAR_SWATCH_COLORS_2`
- `DEFAULT_COLOR` → `DEFAULT_COUNTDOWN_BAR_COLOR`

Specifically:

- Line 103: `setCountdownBarColor(DEFAULT_COLOR)` → `setCountdownBarColor(DEFAULT_COUNTDOWN_BAR_COLOR)`
- Line 116: `countdownBarColor !== DEFAULT_COLOR` → `countdownBarColor !== DEFAULT_COUNTDOWN_BAR_COLOR`
- Line 163: `<Swatches colors={SWATCH_COLORS}` → `<Swatches colors={[...COUNTDOWN_BAR_SWATCH_COLORS]}`
- Line 164: `<Swatches colors={SWATCH_COLORS_2}` → `<Swatches colors={[...COUNTDOWN_BAR_SWATCH_COLORS_2]}`

### Task 2.3: Phase 2 Verification

```bash
yarn validate
```

- [ ] Color picker opens correctly
- [ ] Swatch selection works
- [ ] Reset button resets to cyan default
- [ ] Preview updates with selected color

---

## Phase 3: CountdownBar.tsx

### Current Analysis

**File:** `/Users/muji/repos/rn.athan.uk/components/CountdownBar.tsx`
**Lines:** 274
**Structure:**

- Imports: 19 lines
- Constants: 29 lines
- Component: 131 lines
- StyleSheet: 67 lines

### Assessment: Well-Structured, Minimal Changes

CountdownBar is a complex animation component that is **already well-organized**:

- Clear constant definitions at top
- Three well-separated useEffect hooks
- Logical animated style grouping
- Appropriate JSX structure

### Task 3.1: Move Constants to Shared

**MOVE** animation constants to `/shared/constants.ts`:

**ADD** to `/Users/muji/repos/rn.athan.uk/shared/constants.ts`:

```typescript
// =============================================================================
// COUNTDOWN BAR ANIMATION
// =============================================================================

/** Countdown bar dimensions */
export const COUNTDOWN_BAR = {
  /** Progress bar width in pixels */
  WIDTH: 100,
  /** Progress bar height in pixels */
  HEIGHT: 2,
  /** Gloss highlight height */
  GLOSS_HEIGHT: 0.75,
  /** Track background color */
  TRACK_COLOR: '#153569',
} as const;

/** Countdown bar tip indicator */
export const COUNTDOWN_BAR_TIP = {
  /** Tip width in pixels */
  WIDTH: 2,
  /** Position offset from bar edge */
  OFFSET: 0.9,
  /** Tint amount for tip color (0 = bar color, 1 = white) */
  TINT_AMOUNT: 0.15,
  /** Pulse animation duration in ms */
  PULSE_DURATION: 2500,
} as const;

/** Warning state threshold (triggers in final 10%) */
export const COUNTDOWN_WARNING_THRESHOLD = 10;
```

### Task 3.2: Update CountdownBar.tsx

**File:** `/Users/muji/repos/rn.athan.uk/components/CountdownBar.tsx`

#### 3.2.1 Update Imports

**REPLACE** line 16:

```typescript
import { ANIMATION, COLORS } from '@/shared/constants';
```

**WITH**:

```typescript
import { ANIMATION, COLORS, COUNTDOWN_BAR, COUNTDOWN_BAR_TIP, COUNTDOWN_WARNING_THRESHOLD } from '@/shared/constants';
```

#### 3.2.2 Delete Local Constants

**DELETE** lines 21-37 (local constants):

```typescript
/** Bar dimensions */
const BAR_WIDTH = 100;
const BAR_HEIGHT = 2;
const GLOSS_HEIGHT = 0.75;

/** Pulsing tip indicator */
const TIP_WIDTH = 2;
const TIP_OFFSET = 0.9;
const TIP_TINT_AMOUNT = 0.15;
const TIP_PULSE_DURATION = 2500;

/** Warning state triggers in final 10% */
const WARNING_THRESHOLD = 10;

const TRACK_COLOR = '#153569';
```

#### 3.2.3 Update References

Replace all constant references:

- `BAR_WIDTH` → `COUNTDOWN_BAR.WIDTH`
- `BAR_HEIGHT` → `COUNTDOWN_BAR.HEIGHT`
- `GLOSS_HEIGHT` → `COUNTDOWN_BAR.GLOSS_HEIGHT`
- `TRACK_COLOR` → `COUNTDOWN_BAR.TRACK_COLOR`
- `TIP_WIDTH` → `COUNTDOWN_BAR_TIP.WIDTH`
- `TIP_OFFSET` → `COUNTDOWN_BAR_TIP.OFFSET`
- `TIP_TINT_AMOUNT` → `COUNTDOWN_BAR_TIP.TINT_AMOUNT`
- `TIP_PULSE_DURATION` → `COUNTDOWN_BAR_TIP.PULSE_DURATION`
- `WARNING_THRESHOLD` → `COUNTDOWN_WARNING_THRESHOLD`

### Task 3.3: Phase 3 Verification

```bash
yarn validate
```

- [ ] Countdown bar renders correctly
- [ ] Progress animation is smooth
- [ ] Warning color transition at 10%
- [ ] Tip indicator pulses
- [ ] Reduced motion is respected

---

## Phase 4: Medium Files

### Analysis Summary

| File                    | Lines | Duplicated Pattern               | Action                |
| ----------------------- | ----- | -------------------------------- | --------------------- |
| BottomSheetSettings.tsx | 217   | Header (lines 56-64)             | Extract shared header |
| BottomSheetSound.tsx    | 180   | Header (lines 79-87)             | Extract shared header |
| Overlay.tsx             | 214   | Positioning logic (lines 75-125) | Extract to hook       |

### Task 4.1: Create BottomSheetHeader.tsx

**File:** `/Users/muji/repos/rn.athan.uk/components/BottomSheetHeader.tsx`

```typescript
import { StyleSheet, Text, View } from 'react-native';
import { SvgProps } from 'react-native-svg';

import { TEXT, SPACING, RADIUS } from '@/shared/constants';

// =============================================================================
// TYPES
// =============================================================================

export interface BottomSheetHeaderProps {
  title: string;
  subtitle: string;
  icon: React.FC<SvgProps>;
}

// =============================================================================
// BOTTOM SHEET HEADER
// =============================================================================

/**
 * Shared header component for bottom sheets.
 * Displays title, subtitle, and icon in consistent layout.
 *
 * @example
 * import SettingsIcon from '@/assets/icons/svg/settings.svg';
 *
 * <BottomSheetHeader
 *   title="Settings"
 *   subtitle="Set your preferences"
 *   icon={SettingsIcon}
 * />
 */
export default function BottomSheetHeader({ title, subtitle, icon: Icon }: BottomSheetHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.headerIcon}>
        <Icon width={16} height={16} color="rgba(165, 180, 252, 0.8)" />
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxxl,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: TEXT.family.medium,
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: SPACING.xxs,
  },
  subtitle: {
    fontSize: TEXT.sizeDetail,
    fontFamily: TEXT.family.regular,
    color: 'rgba(86, 134, 189, 0.725)',
    marginTop: SPACING.xs,
  },
});
```

### Task 4.2: Update BottomSheetSettings.tsx

**File:** `/Users/muji/repos/rn.athan.uk/components/BottomSheetSettings.tsx`

#### 4.2.1 Update Imports

**ADD** import:

```typescript
import BottomSheetHeader from '@/components/BottomSheetHeader';
```

#### 4.2.2 Replace Header JSX

**REPLACE** lines 55-64:

```typescript
{/* Header */}
<View style={styles.header}>
  <View>
    <Text style={styles.title}>Settings</Text>
    <Text style={styles.subtitle}>Set your preferences</Text>
  </View>
  <View style={styles.headerIcon}>
    <SettingsIcon width={16} height={16} color="rgba(165, 180, 252, 0.8)" />
  </View>
</View>
```

**WITH**:

```typescript
{/* Header */}
<BottomSheetHeader
  title="Settings"
  subtitle="Set your preferences"
  icon={SettingsIcon}
/>
```

#### 4.2.3 Delete Unused Styles

**DELETE** from StyleSheet (lines 128-157):

- `header`
- `headerIcon`
- `title`
- `subtitle`

### Task 4.3: Update BottomSheetSound.tsx

**File:** `/Users/muji/repos/rn.athan.uk/components/BottomSheetSound.tsx`

#### 4.3.1 Update Imports

**ADD** import:

```typescript
import BottomSheetHeader from '@/components/BottomSheetHeader';
```

**REMOVE** IconView import (no longer needed for header):

```typescript
// Remove: import IconView from '@/components/Icon';
```

Create a speaker icon component for the header:

**ADD** after imports:

```typescript
import SpeakerIcon from '@/assets/icons/svg/speaker.svg';
```

Note: You may need to verify the exact path to the speaker SVG icon.

#### 4.3.2 Replace Header JSX

**REPLACE** lines 79-87:

```typescript
{/* Header */}
<View style={styles.header}>
  <View>
    <Text style={styles.title}>Select Athan</Text>
    <Text style={styles.subtitle}>Close to save</Text>
  </View>
  <View style={styles.headerIcon}>
    <IconView type={Icon.SPEAKER} size={16} color="rgba(165, 180, 252, 0.8)" />
  </View>
</View>
```

**WITH**:

```typescript
{/* Header */}
<BottomSheetHeader
  title="Select Athan"
  subtitle="Close to save"
  icon={SpeakerIcon}
/>
```

#### 4.3.3 Delete Unused Styles

**DELETE** from StyleSheet (lines 120-149):

- `header`
- `headerIcon`
- `title`
- `subtitle`

### Task 4.4: Create useOverlayPositioning.ts

**File:** `/Users/muji/repos/rn.athan.uk/hooks/useOverlayPositioning.ts`

```typescript
import { Platform, ViewStyle } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';

import { SCREEN, STYLES, SPACING, COLORS, SHADOW } from '@/shared/constants';
import { OverlayStore } from '@/shared/types';

// =============================================================================
// TYPES
// =============================================================================

interface PageCoordinates {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

interface OverlayPositioningParams {
  overlay: OverlayStore;
  listMeasurements: PageCoordinates | null;
  dateMeasurements: PageCoordinates | null;
  insets: EdgeInsets;
  windowHeight: number;
  isActivePrayer: boolean;
}

interface OverlayPositioningResult {
  containerStyle: ViewStyle;
  countdownStyle: ViewStyle;
  dateStyle: ViewStyle;
  prayerStyle: ViewStyle;
  infoBoxStyle: ViewStyle;
  showInfoBoxAbove: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Calculates positioning styles for the Overlay component.
 * Handles platform-specific adjustments and info box placement.
 *
 * @example
 * const positioning = useOverlayPositioning({
 *   overlay,
 *   listMeasurements,
 *   dateMeasurements,
 *   insets,
 *   windowHeight: window.height,
 *   isActivePrayer: selectedPrayer.isNext,
 * });
 */
export function useOverlayPositioning({
  overlay,
  listMeasurements,
  dateMeasurements,
  insets,
  windowHeight,
  isActivePrayer,
}: OverlayPositioningParams): OverlayPositioningResult {
  const androidOffset = Platform.OS === 'android' ? insets.top : 0;

  const containerStyle: ViewStyle = {
    pointerEvents: overlay.isOn ? 'auto' : 'none',
  };

  const countdownStyle: ViewStyle = {
    top: insets.top + SCREEN.paddingTop,
  };

  const dateStyle: ViewStyle = {
    top: (dateMeasurements?.pageY ?? 0) + androidOffset,
    left: dateMeasurements?.pageX ?? 0,
  };

  const prayerBaseStyle: ViewStyle = {
    top: (listMeasurements?.pageY ?? 0) + androidOffset + overlay.selectedPrayerIndex * STYLES.prayer.height,
    left: listMeasurements?.pageX ?? 0,
    width: listMeasurements?.width ?? 0,
  };

  const prayerStyle: ViewStyle = isActivePrayer
    ? { ...prayerBaseStyle, backgroundColor: COLORS.prayer.activeBackground }
    : prayerBaseStyle;

  // First 3 items (indices 0, 1, 2) show info box below, rest show above
  const showInfoBoxAbove = overlay.selectedPrayerIndex >= 3;

  const infoBoxBelow: ViewStyle = {
    top:
      (listMeasurements?.pageY ?? 0) +
      androidOffset +
      overlay.selectedPrayerIndex * STYLES.prayer.height +
      STYLES.prayer.height +
      SPACING.sm,
    left: listMeasurements?.pageX ?? 0,
    width: listMeasurements?.width ?? 0,
  };

  const infoBoxAbove: ViewStyle = {
    bottom:
      windowHeight -
      (listMeasurements?.pageY ?? 0) -
      androidOffset -
      overlay.selectedPrayerIndex * STYLES.prayer.height +
      SPACING.sm,
    left: listMeasurements?.pageX ?? 0,
    width: listMeasurements?.width ?? 0,
  };

  const infoBoxStyle = showInfoBoxAbove ? infoBoxAbove : infoBoxBelow;

  return {
    containerStyle,
    countdownStyle,
    dateStyle,
    prayerStyle,
    infoBoxStyle,
    showInfoBoxAbove,
  };
}
```

### Task 4.5: Update Overlay.tsx

**File:** `/Users/muji/repos/rn.athan.uk/components/Overlay.tsx`

#### 4.5.1 Update Imports

**ADD**:

```typescript
import { useOverlayPositioning } from '@/hooks/useOverlayPositioning';
```

#### 4.5.2 Replace Computed Styles

**REPLACE** lines 75-125 (all computed style definitions) with:

```typescript
const positioning = useOverlayPositioning({
  overlay,
  listMeasurements,
  dateMeasurements,
  insets,
  windowHeight: window.height,
  isActivePrayer: selectedPrayer.isNext,
});
```

#### 4.5.3 Update JSX References

**REPLACE** style references:

- `computedStyleContainer` → `positioning.containerStyle`
- `computedStyleCountdown` → `positioning.countdownStyle`
- `computedStyleDate` → `positioning.dateStyle`
- `computedStylePrayer` → `positioning.prayerStyle`
- `computedStyleInfoBox` → `positioning.infoBoxStyle`
- `showInfoBoxAbove` → `positioning.showInfoBoxAbove`

#### 4.5.4 Delete Unused Style

**DELETE** from StyleSheet:

- `activeBackground` (now handled in hook)

### Task 4.6: Phase 4 Verification

```bash
yarn validate
```

- [ ] BottomSheetSettings header renders correctly
- [ ] BottomSheetSound header renders correctly
- [ ] BottomSheetAlert header unchanged (uses different pattern)
- [ ] Overlay positions prayer row correctly
- [ ] Overlay info box appears above/below correctly
- [ ] All animations still work

---

## Phase 5: Consolidation

### Task 5.1: Audit Extracted Components

Review all extracted components for consistency:

- [ ] All use default exports
- [ ] All have JSDoc comments
- [ ] All follow naming conventions
- [ ] All use `@/` import aliases
- [ ] All styles are co-located

### Task 5.2: Update Component Index (Optional)

If the team prefers barrel exports, create `/Users/muji/repos/rn.athan.uk/components/index.ts`:

```typescript
// Primitives
export { default as SegmentedControl } from './SegmentedControl';
export { default as Stepper } from './Stepper';
export { default as BottomSheetHeader } from './BottomSheetHeader';

// Types
export type { SegmentOption, SegmentedControlProps } from './SegmentedControl';
export type { StepperProps } from './Stepper';
export type { BottomSheetHeaderProps } from './BottomSheetHeader';
```

**Note:** Only create if explicitly requested. Barrel exports add maintenance overhead.

### Task 5.3: Documentation

Create `/Users/muji/repos/rn.athan.uk/components/README.md` (only if explicitly requested):

```markdown
# Components

This folder contains reusable UI components for the Athan app.

## Primitives

| Component           | Description                 | Props                                             |
| ------------------- | --------------------------- | ------------------------------------------------- |
| `SegmentedControl`  | Animated segmented control  | `options`, `selected`, `onSelect`, `disabled`     |
| `Stepper`           | Increment/decrement control | `value`, `onDecrement`, `onIncrement`, `disabled` |
| `BottomSheetHeader` | Shared header for sheets    | `title`, `subtitle`, `icon`                       |

## Bottom Sheets

| Component             | Description                      |
| --------------------- | -------------------------------- |
| `BottomSheetAlert`    | Per-prayer notification settings |
| `BottomSheetSettings` | App preferences                  |
| `BottomSheetSound`    | Athan sound selection            |

## Conventions

- Default exports for components
- Named exports for types
- Co-located StyleSheets
- JSDoc comments for public APIs
```

---

## Implementation Order

Execute phases sequentially. Each phase should be completed and verified before moving to the next.

### Phase 1 (Priority: HIGH)

1. Create `SegmentedControl.tsx`
2. Create `Stepper.tsx`
3. Update `BottomSheetAlert.tsx`
4. Verify Phase 1

### Phase 2 (Priority: MEDIUM)

5. Add constants to `shared/constants.ts`
6. Update `ColorPickerSettings.tsx`
7. Verify Phase 2

### Phase 3 (Priority: MEDIUM)

8. Add constants to `shared/constants.ts`
9. Update `CountdownBar.tsx`
10. Verify Phase 3

### Phase 4 (Priority: MEDIUM)

11. Create `BottomSheetHeader.tsx`
12. Update `BottomSheetSettings.tsx`
13. Update `BottomSheetSound.tsx`
14. Create `useOverlayPositioning.ts`
15. Update `Overlay.tsx`
16. Verify Phase 4

### Phase 5 (Priority: LOW)

17. Audit all components
18. Optional: Create barrel exports
19. Optional: Create README
20. Final verification

---

## Verification Plan

### After Each Phase

```bash
# Type checking
yarn typecheck

# Linting
yarn lint

# Full validation
yarn validate

# Build test
yarn ios
```

### Manual Testing Checklist

#### Phase 1: BottomSheetAlert

- [ ] Open alert sheet for any prayer
- [ ] SegmentedControl (Athan): indicator slides smoothly
- [ ] SegmentedControl (Athan): icon/label colors animate
- [ ] Toggle (Reminder): thumb animates
- [ ] Toggle (Reminder): enables/disables options below
- [ ] SegmentedControl (Sound): works same as Athan
- [ ] Stepper: increment/decrement work
- [ ] Stepper: buttons disable at boundaries (5, 30)
- [ ] All: haptic feedback fires
- [ ] Settings persist on close

#### Phase 2: ColorPickerSettings

- [ ] Color picker opens
- [ ] Swatches render correctly
- [ ] Color selection works
- [ ] Reset returns to cyan default
- [ ] Preview updates live

#### Phase 3: CountdownBar

- [ ] Bar renders at correct width
- [ ] Progress animates smoothly
- [ ] Warning color at 10%
- [ ] Tip indicator pulses
- [ ] Respects reduced motion

#### Phase 4: Medium Files

- [ ] BottomSheetSettings header renders
- [ ] BottomSheetSound header renders
- [ ] Overlay positions prayer correctly
- [ ] Info box above/below works
- [ ] All animations preserved

### Rollback Plan

If issues arise in any phase:

```bash
# Revert specific files
git checkout -- components/BottomSheetAlert.tsx
git checkout -- components/SegmentedControl.tsx
git checkout -- components/Stepper.tsx

# Or revert entire phase
git revert HEAD~N  # where N is number of commits in phase
```

---

## Appendix: File Checksums

For verification that correct files are being modified:

| File                    | Lines | First Line                     |
| ----------------------- | ----- | ------------------------------ |
| BottomSheetAlert.tsx    | 684   | `import { BottomSheetModal`    |
| ColorPickerSettings.tsx | 312   | `import * as Haptics`          |
| CountdownBar.tsx        | 274   | `import { useAtomValue }`      |
| BottomSheetSettings.tsx | 217   | `import { BottomSheetModal`    |
| Overlay.tsx             | 214   | `import * as Haptics`          |
| BottomSheetSound.tsx    | 180   | `import { BottomSheetModal`    |
| SettingsToggle.tsx      | 69    | `import * as Haptics`          |
| BottomSheetShared.tsx   | 49    | `import { BottomSheetBackdrop` |

---

## Appendix: Complete New File List

After all phases, these new files will exist:

```
/Users/muji/repos/rn.athan.uk/
├── components/
│   ├── SegmentedControl.tsx     # NEW (~170 lines)
│   ├── Stepper.tsx              # NEW (~100 lines)
│   └── BottomSheetHeader.tsx    # NEW (~80 lines)
└── hooks/
    └── useOverlayPositioning.ts # NEW (~60 lines)
```

Total new lines: ~410
Total lines removed from existing files: ~500
Net change: -90 lines with significantly improved organization

---

**End of Plan**
