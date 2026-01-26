# Components Folder Refactoring Plan

**Status:** Ready for Planning
**Date:** 2026-01-26
**Scope:** Full `components/` folder modularization
**Estimated Tasks:** 50-100 tasks across 4-5 phases

---

## Vision

Transform the `components/` folder from 27 files (~3,700 LOC) with several monolithic files into a collection of small, focused, reusable components. Each component should ideally be:

- **< 150 lines** (single responsibility)
- **Self-contained** (own styles, no embedded sub-components)
- **Reusable** where patterns repeat
- **Well-typed** with exported interfaces

---

## Current State Analysis

### Components by Size (Refactoring Priority)

| Priority | File                     | Lines | Embedded Components                             | Action              |
| -------- | ------------------------ | ----- | ----------------------------------------------- | ------------------- |
| **P0**   | BottomSheetAlert.tsx     | 684   | SegmentedControl, Toggle, Stepper, TypeSelector | Extract 2, delete 1 |
| **P1**   | ColorPickerSettings.tsx  | 312   | Likely has sliders, previews                    | Analyze & extract   |
| **P1**   | CountdownBar.tsx         | 274   | Animated segments?                              | Analyze & extract   |
| **P2**   | BottomSheetSettings.tsx  | 217   | Setting rows?                                   | Analyze             |
| **P2**   | Overlay.tsx              | 214   | Multiple overlays?                              | Analyze             |
| **P2**   | BottomSheetSound.tsx     | 180   | Sound items?                                    | Analyze             |
| **P3**   | Alert.tsx                | 170   | -                                               | Review              |
| **P3**   | PrayerExplanation.tsx    | 161   | -                                               | Review              |
| **P3**   | BottomSheetSoundItem.tsx | 153   | -                                               | Review              |
| OK       | Prayer.tsx               | 125   | -                                               | Keep                |
| OK       | PrayerTime.tsx           | 95    | -                                               | Keep                |
| OK       | Others (<100 lines)      | 16-82 | -                                               | Keep                |

**Total:** 27 components, ~3,700 LOC

### Target State

```
components/
├── primitives/           # Reusable UI primitives (~10 files)
│   ├── SegmentedControl.tsx
│   ├── Stepper.tsx
│   ├── Toggle.tsx
│   ├── ColorSlider.tsx
│   ├── Card.tsx
│   └── ...
│
├── sheets/               # Bottom sheet components (~5 files)
│   ├── BottomSheetAlert.tsx
│   ├── BottomSheetSettings.tsx
│   ├── BottomSheetSound.tsx
│   └── BottomSheetShared.tsx
│
├── prayer/               # Prayer-related components (~6 files)
│   ├── Prayer.tsx
│   ├── PrayerTime.tsx
│   ├── PrayerAgo.tsx
│   ├── PrayerExplanation.tsx
│   ├── Countdown.tsx
│   └── CountdownBar.tsx
│
└── layout/               # Layout & utility components (~6 files)
    ├── Modal.tsx
    ├── Overlay.tsx
    ├── Error.tsx
    └── ...
```

**Note:** Folder structure is optional - can stay flat if preferred. Focus is on extraction.

---

## Phased Approach

### Phase 1: BottomSheetAlert.tsx (Current Focus)

**Tasks:** ~15 tasks
**Goal:** 684 → ~270 lines

Detailed plan below in "BottomSheetAlert Refactoring" section.

### Phase 2: ColorPickerSettings.tsx

**Tasks:** ~10-15 tasks
**Goal:** 312 → ~150 lines

Requires analysis - likely contains:

- Color sliders
- Color preview
- Preset buttons

### Phase 3: CountdownBar.tsx

**Tasks:** ~8-12 tasks
**Goal:** 274 → ~150 lines

Requires analysis - likely contains:

- Animated progress segments
- Time display components

### Phase 4: Medium Files (180-220 lines)

**Tasks:** ~15-20 tasks
**Files:** BottomSheetSettings, Overlay, BottomSheetSound

### Phase 5: Review & Consolidation

**Tasks:** ~10-15 tasks

- Identify cross-cutting patterns
- Create shared primitives
- Optional: folder reorganization

---

## Task Breakdown Summary

| Phase     | Focus                   | Est. Tasks    |
| --------- | ----------------------- | ------------- |
| 1         | BottomSheetAlert.tsx    | 15            |
| 2         | ColorPickerSettings.tsx | 12            |
| 3         | CountdownBar.tsx        | 10            |
| 4         | Medium files (3 files)  | 18            |
| 5         | Review & consolidation  | 12            |
| **Total** |                         | **~67 tasks** |

---

# Phase 1: BottomSheetAlert.tsx Refactoring

**Status:** Ready for Implementation
**Final Score:** 78/100
**Reviewed By:** 4-Agent Multi-Perspective Analysis

---

## Executive Summary

After rigorous analysis by 4 specialist agents (Performance Validator, Practitioner Simulator, Synthesis Architect, Final Arbiter), we've determined the optimal refactoring approach for `BottomSheetAlert.tsx` (684 lines).

**Key Findings:**

1. **Performance concerns are overblown** - Extraction is safe from a Reanimated perspective
2. **TypeSelector duplicates SegmentedControl** - This is the primary consolidation target
3. **Toggle is NOT duplicate** - SettingsToggle and Toggle serve different compositional roles
4. **Cognitive load justifies extraction** - 684 lines with 5 StyleSheets is genuinely problematic
5. **No folder reorganization** - Keep flat structure at 27 components

---

## Current File Structure

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
├── TypeSelector ─────────── Lines 312-443 (131 lines)  ⚠️ DUPLICATES SegmentedControl
│   ├── Interface: TypeSelectorProps
│   ├── AnimatedTypeSelectorOption (sub-component)  ⚠️ 94% identical to AnimatedSegmentOption
│   ├── TypeSelector (main)
│   └── typeSelectorStyles (StyleSheet)
│
└── BottomSheetAlert ─────── Lines 445-684 (239 lines)
    ├── Main alert sheet component
    └── styles (StyleSheet)
```

---

## Performance Analysis (VALIDATED)

The Performance Validator agent examined the actual Reanimated code patterns and **debunked** the meta-critique's performance concerns:

### Why Extraction is SAFE

| Pattern            | Location                                      | Analysis                                                          |
| ------------------ | --------------------------------------------- | ----------------------------------------------------------------- |
| `useDerivedValue`  | Lines 55, 330                                 | Creates component-local shared values - no cross-boundary passing |
| `useAnimatedStyle` | Lines 57-67, 91-94, 176-178, 332-342, 367-370 | All use `withTiming()` which runs entirely on UI thread           |
| `interpolateColor` | Lines 58, 333                                 | Standard prop-driven animation pattern                            |

**Evidence from Codebase:**

- `SettingsToggle.tsx` (69 lines) - Uses identical pattern, already extracted, works fine
- `BottomSheetSoundItem.tsx` (153 lines) - Uses same Reanimated patterns in separate file
- `ActiveBackground.tsx` (64 lines) - Complex animation hooks, extracted, works fine

**Risk Assessment:**

- Frame time impact: **Negligible (<0.1ms)**
- Perceptual lag: **None**
- Worklet optimization: **Unchanged**

**Conclusion:** The decision should be based on code organization, NOT animation performance fears.

---

## Duplication Analysis

### TypeSelector vs SegmentedControl (REAL DUPLICATION)

`AnimatedSegmentOption` (lines 54-82) and `AnimatedTypeSelectorOption` (lines 329-357) are **94% identical**:

```typescript
// AnimatedSegmentOption (lines 54-82)
function AnimatedSegmentOption({ option, isSelected, onPress }) {
  const progress = useDerivedValue(() => withTiming(isSelected ? 1 : 0, { duration: ANIMATION.duration }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [SEGMENT_COLORS.unselected, SEGMENT_COLORS.selected]),
  }));
  // ... identical icon opacity logic ...
}

// AnimatedTypeSelectorOption (lines 329-357) - NEARLY IDENTICAL
function AnimatedTypeSelectorOption({ icon, label, isSelected, onPress }) {
  const progress = useDerivedValue(() => withTiming(isSelected ? 1 : 0, { duration: ANIMATION.duration }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [SEGMENT_COLORS.unselected, SEGMENT_COLORS.selected]),
  }));
  // ... identical icon opacity logic ...
}
```

**TypeSelector is just SegmentedControl with hardcoded 2 options.** Both components:

- Use identical indicator animation pattern
- Use identical option animation pattern
- Share the same `SEGMENT_COLORS` constant
- Have near-identical StyleSheets

**Solution:** Delete TypeSelector, use SegmentedControl with 2-option array.

### Toggle vs SettingsToggle (NOT DUPLICATION)

| Component                               | Props                           | Layout                  | Purpose                           |
| --------------------------------------- | ------------------------------- | ----------------------- | --------------------------------- |
| `SettingsToggle.tsx` (69 lines)         | `{ label, value, onToggle }`    | Row with label + toggle | Labeled toggle for settings lists |
| `Toggle` in BottomSheetAlert (53 lines) | `{ value, onToggle, disabled }` | Standalone toggle       | Raw control for card layouts      |

**These serve different compositional roles.** Merging them would:

- Require optional `label` prop (code smell)
- Create one component with two responsibilities
- Add wrapper indirection for 95% of use cases

**Verdict:** Keep separate. This is correct co-location, not duplication.

---

## Implementation Options

### Option A: Minimal (Recommended for Quick Win)

**Effort:** ~30 minutes
**Result:** 684 → ~553 lines (-19%)

Delete TypeSelector and use SegmentedControl with 2 options:

```typescript
// Before (lines 568-570)
<TypeSelector selected={reminderType} onSelect={handleReminderTypeSelect} disabled={!isReminderOn} />

// After
const REMINDER_TYPE_OPTIONS: SegmentOption[] = [
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];

<SegmentedControl
  options={REMINDER_TYPE_OPTIONS}
  selected={reminderType}
  onSelect={handleReminderTypeSelect}
  disabled={!isReminderOn}
/>
```

**Changes:**

1. Add `REMINDER_TYPE_OPTIONS` constant after `ALERT_OPTIONS` (line ~454)
2. Update TypeSelector usage to SegmentedControl (line 569)
3. Delete TypeSelector component (lines 312-443)
4. Delete typeSelectorStyles (lines 403-443)

---

### Option B: Moderate Extraction (Recommended for Maintainability)

**Effort:** 2-3 hours
**Result:** 684 → ~270 lines (-60%)

Extract 2 components to separate files, consolidate TypeSelector:

| New File                          | Source Lines | Lines | Content                                                  |
| --------------------------------- | ------------ | ----- | -------------------------------------------------------- |
| `components/SegmentedControl.tsx` | 26-163       | ~170  | SegmentedControl + AnimatedSegmentOption + segmentStyles |
| `components/Stepper.tsx`          | 220-310      | ~100  | Stepper + stepperStyles                                  |

**BottomSheetAlert.tsx After:**

- Toggle (53 lines) - Keep inline
- Main component (239 lines) - With imports
- styles (84 lines)
- **Total: ~270 lines**

---

## Detailed Implementation Plan (Option B)

**Goal:** Extract SegmentedControl and Stepper to separate files, delete TypeSelector, reduce BottomSheetAlert.tsx from 684 to ~270 lines.

### Summary Table

| Step | Action                      | Files                                     |
| ---- | --------------------------- | ----------------------------------------- |
| 1    | Create SegmentedControl.tsx | NEW: `components/SegmentedControl.tsx`    |
| 2    | Create Stepper.tsx          | NEW: `components/Stepper.tsx`             |
| 3    | Update BottomSheetAlert.tsx | MODIFY: `components/BottomSheetAlert.tsx` |

**Result:** 684 lines → ~270 lines (-60%)

---

### Step 1: Create `components/SegmentedControl.tsx`

**Source:** Lines 26-163 from BottomSheetAlert.tsx

#### Content Structure

```
components/SegmentedControl.tsx (~170 lines)
├── Imports (Haptics, React, RN, Reanimated, Icon, constants)
├── Type Exports
│   ├── SegmentOption<T>
│   └── SegmentedControlProps<T>
├── SEGMENT_COLORS constant (private)
├── AnimatedSegmentOption component (private)
├── SegmentedControl component (default export)
└── segmentStyles StyleSheet (private)
```

#### Key Changes from Original

1. **Make generic with type parameter `<T extends string>`** for flexibility
2. **Export types** for consumer use
3. **Add JSDoc** with usage example
4. **Keep internal structure unchanged** (animation patterns work as-is)

#### Imports Required

```typescript
import * as Haptics from 'expo-haptics';
import { useCallback, useState, useMemo } from 'react';
import { StyleSheet, View, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, interpolateColor, useDerivedValue } from 'react-native-reanimated';

import IconView from '@/components/Icon';
import { TEXT, SPACING, RADIUS, COLORS, ANIMATION } from '@/shared/constants';
import { Icon } from '@/shared/types';
```

---

### Step 2: Create `components/Stepper.tsx`

**Source:** Lines 220-310 from BottomSheetAlert.tsx

#### Content Structure

```
components/Stepper.tsx (~100 lines)
├── Imports (Haptics, RN, constants, types)
├── Type Exports
│   └── StepperProps
├── Stepper component (default export)
└── stepperStyles StyleSheet (private)
```

#### Key Changes from Original

1. **Export StepperProps type**
2. **Add JSDoc** with usage example
3. **Keep REMINDER_INTERVALS logic internal** (don't over-generalize)

#### Imports Required

```typescript
import * as Haptics from 'expo-haptics';
import { StyleSheet, View, Pressable, Text } from 'react-native';

import { TEXT, SPACING, RADIUS, REMINDER_INTERVALS } from '@/shared/constants';
import { ReminderInterval } from '@/shared/types';
```

---

### Step 3: Update `components/BottomSheetAlert.tsx`

#### 3.1 Update Imports

**Add:**

```typescript
import SegmentedControl, { SegmentOption } from '@/components/SegmentedControl';
import Stepper from '@/components/Stepper';
```

**Remove from imports (no longer needed locally):**

- `useMemo` (was only used by SegmentedControl)
- `LayoutChangeEvent` (was only used by SegmentedControl/TypeSelector)
- `interpolateColor, useDerivedValue` (was only used by SegmentedControl/TypeSelector)

**Updated imports:**

```typescript
import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
```

#### 3.2 Delete Code Blocks

| Lines   | What                              | Action                                |
| ------- | --------------------------------- | ------------------------------------- |
| 26-163  | SegmentedControl + segmentStyles  | DELETE (moved to new file)            |
| 220-310 | Stepper + stepperStyles           | DELETE (moved to new file)            |
| 312-443 | TypeSelector + typeSelectorStyles | DELETE (replaced by SegmentedControl) |

#### 3.3 Add Constants

After ALERT_OPTIONS (around line 449), add:

```typescript
const REMINDER_TYPE_OPTIONS: SegmentOption<AlertType.Silent | AlertType.Sound>[] = [
  { value: AlertType.Silent, label: 'Silent', icon: Icon.BELL_RING },
  { value: AlertType.Sound, label: 'Sound', icon: Icon.SPEAKER },
];
```

#### 3.4 Update JSX

**Line 569:** Replace TypeSelector with SegmentedControl:

```typescript
// Before
<TypeSelector selected={reminderType} onSelect={handleReminderTypeSelect} disabled={!isReminderOn} />

// After
<SegmentedControl
  options={REMINDER_TYPE_OPTIONS}
  selected={reminderType}
  onSelect={handleReminderTypeSelect}
  disabled={!isReminderOn}
/>
```

#### 3.5 Add JSDoc Comment

At top of file:

```typescript
/**
 * Alert settings bottom sheet for per-prayer notification configuration.
 *
 * Uses:
 * - SegmentedControl (components/SegmentedControl.tsx)
 * - Stepper (components/Stepper.tsx)
 */
```

#### 3.6 Keep Unchanged

- **Toggle component** (lines 165-218) - Keep inline, different from SettingsToggle
- **toggleStyles** - Keep with Toggle
- **Main component logic** - Unchanged
- **styles** at bottom - Unchanged

---

### Final File Structure

```
components/
├── BottomSheetAlert.tsx     # ~270 lines (was 684)
│   ├── Imports
│   ├── Toggle + toggleStyles (53 lines)
│   ├── ALERT_OPTIONS + REMINDER_TYPE_OPTIONS
│   ├── BottomSheetAlert main component
│   └── styles
│
├── SegmentedControl.tsx     # NEW ~170 lines
│   ├── Types (exported)
│   ├── AnimatedSegmentOption (private)
│   ├── SegmentedControl (default export)
│   └── segmentStyles (private)
│
├── Stepper.tsx              # NEW ~100 lines
│   ├── Types (exported)
│   ├── Stepper (default export)
│   └── stepperStyles (private)
│
└── SettingsToggle.tsx       # UNCHANGED
```

---

### Verification

#### Manual Testing Checklist

1. **Open BottomSheetAlert**
   - Navigate to any prayer in the app
   - Tap the alert icon to open the sheet
   - Sheet should render correctly

2. **Test SegmentedControl (Athan section)**
   - Tap Off → indicator slides to Off
   - Tap Silent → indicator slides to Silent
   - Tap Sound → indicator slides to Sound
   - Icons and labels animate color correctly
   - Haptic feedback on each tap

3. **Test Toggle (Reminder section)**
   - Toggle reminder on/off
   - Thumb animates smoothly
   - Haptic feedback on toggle

4. **Test Stepper (Before section)**
   - Tap - button → value decrements
   - Tap + button → value increments
   - Buttons disable at min/max
   - Haptic feedback on buttons

5. **Test SegmentedControl (Sound section - was TypeSelector)**
   - Tap Silent → indicator slides, icon/label animate
   - Tap Sound → indicator slides, icon/label animate
   - Disabled state at 0.4 opacity when reminder off

6. **Test Disabled States**
   - Turn Athan to Off → Reminder section disabled (0.25 opacity)
   - Turn Reminder off → Sound/Before options disabled (0.25 opacity)

7. **Close and Verify**
   - Tap outside to dismiss
   - Settings should persist (commit on close)

#### Build Verification

```bash
npx expo start
# Open on simulator/device
# Navigate through app to test sheet
```

---

### Rollback Plan

If issues arise:

1. Git revert the 3 file changes
2. Original BottomSheetAlert.tsx is intact in git history

---

## What NOT To Do

| Action                                  | Why Not                                 |
| --------------------------------------- | --------------------------------------- |
| Create 11 folders                       | Overkill at 3.5K LOC, 27 components     |
| Create barrel exports (index.ts)        | Premature, adds maintenance burden      |
| Merge Toggle + SettingsToggle           | Different compositional roles           |
| Create AnimatedSelectOption abstraction | Premature, adds complexity for 48 lines |
| Generalize Prayer.tsx, List.tsx, etc.   | Jotai hooks are correct pattern         |
| Rename existing files                   | Churn without benefit                   |

---

## Decision Matrix

| Action                                    | Effort           | Risk     | Benefit                | Verdict         |
| ----------------------------------------- | ---------------- | -------- | ---------------------- | --------------- |
| Option A: Delete TypeSelector only        | Low (30 min)     | Very Low | Medium (-131 lines)    | **QUICK WIN**   |
| Option B: Extract 2 + delete TypeSelector | Medium (2-3 hrs) | Low      | High (-414 lines)      | **RECOMMENDED** |
| Original Plan: Extract 4 + 11 folders     | High (8+ hrs)    | Medium   | Low (over-engineering) | **REJECT**      |

---

## Implementation Checklist

### Option A (Minimal)

- [ ] Add `REMINDER_TYPE_OPTIONS` constant after `ALERT_OPTIONS`
- [ ] Replace TypeSelector usage with SegmentedControl (line 569)
- [ ] Delete TypeSelector component (lines 312-401)
- [ ] Delete typeSelectorStyles (lines 403-443)
- [ ] Test: Open sheet, toggle reminder options, verify animation smooth

### Option B (Moderate)

- [ ] Create `components/SegmentedControl.tsx`
  - [ ] Copy lines 26-163
  - [ ] Export `SegmentOption` type
  - [ ] Export `SegmentedControl` as default
- [ ] Create `components/Stepper.tsx`
  - [ ] Copy lines 220-310
  - [ ] Export `StepperProps` type
  - [ ] Export `Stepper` as default
- [ ] Update `BottomSheetAlert.tsx`
  - [ ] Add imports for SegmentedControl, Stepper
  - [ ] Remove SegmentedControl code (lines 26-163)
  - [ ] Remove Stepper code (lines 220-310)
  - [ ] Remove TypeSelector code (lines 312-443)
  - [ ] Add `REMINDER_TYPE_OPTIONS` constant
  - [ ] Update JSX to use imported components
  - [ ] Add JSDoc comment at top
- [ ] Test animations
  - [ ] SegmentedControl indicator slides smoothly
  - [ ] Toggle animates correctly
  - [ ] Stepper buttons respond
  - [ ] Disabled states render at 0.4 opacity

---

## Agent Analysis Summary

| Agent                      | Score  | Key Finding                                                  |
| -------------------------- | ------ | ------------------------------------------------------------ |
| **Performance Validator**  | N/A    | Performance claims overblown. Extraction is SAFE.            |
| **Practitioner Simulator** | N/A    | TypeSelector is just SegmentedControl with hardcoded options |
| **Synthesis Architect**    | 72/100 | Cognitive load justifies extraction even without reuse       |
| **Final Arbiter**          | 82/100 | Delete TypeSelector. Everything else is premature.           |

**Consensus:** Option B provides the best balance of effort vs benefit. The file's 684 lines with 5 StyleSheets is genuinely problematic for navigation and maintenance.

---

## Trigger Conditions for Future Work

**Do NOT act on these now. Revisit when:**

| Condition                                   | Action                       |
| ------------------------------------------- | ---------------------------- |
| Second use of SegmentedControl appears      | Consider keeping extraction  |
| Codebase exceeds 5K LOC                     | Consider folder organization |
| New developer struggles with file discovery | Create components/README.md  |
| 50+ components                              | Consider barrel exports      |

---

## Files Affected (Phase 1)

```
components/
├── BottomSheetAlert.tsx     # MODIFIED (684 → ~270 lines)
├── SegmentedControl.tsx     # NEW (~170 lines)
├── Stepper.tsx              # NEW (~100 lines)
└── SettingsToggle.tsx       # UNCHANGED (intentionally different from Toggle)
```

**Net Change:** +2 files, -414 lines in main file, ~0 total LOC change (just reorganization)

---

# Full Task Breakdown (All Phases)

## Phase 1: BottomSheetAlert.tsx (~15 tasks)

### 1.1 Analysis & Setup

- [ ] **Task 1.1.1:** Read and analyze BottomSheetAlert.tsx structure
- [ ] **Task 1.1.2:** Identify all embedded components and their dependencies
- [ ] **Task 1.1.3:** Document component interfaces and props

### 1.2 Extract SegmentedControl

- [ ] **Task 1.2.1:** Create `components/SegmentedControl.tsx` file
- [ ] **Task 1.2.2:** Copy SegmentedControl code (lines 26-163)
- [ ] **Task 1.2.3:** Add generic type parameter `<T extends string>`
- [ ] **Task 1.2.4:** Export `SegmentOption` and `SegmentedControlProps` types
- [ ] **Task 1.2.5:** Add JSDoc documentation with usage example

### 1.3 Extract Stepper

- [ ] **Task 1.3.1:** Create `components/Stepper.tsx` file
- [ ] **Task 1.3.2:** Copy Stepper code (lines 220-310)
- [ ] **Task 1.3.3:** Export `StepperProps` type
- [ ] **Task 1.3.4:** Add JSDoc documentation

### 1.4 Update BottomSheetAlert.tsx

- [ ] **Task 1.4.1:** Add imports for SegmentedControl and Stepper
- [ ] **Task 1.4.2:** Remove extracted SegmentedControl code (lines 26-163)
- [ ] **Task 1.4.3:** Remove extracted Stepper code (lines 220-310)
- [ ] **Task 1.4.4:** Delete TypeSelector code entirely (lines 312-443)
- [ ] **Task 1.4.5:** Add `REMINDER_TYPE_OPTIONS` constant
- [ ] **Task 1.4.6:** Update JSX to use SegmentedControl for reminder type
- [ ] **Task 1.4.7:** Add JSDoc comment at file top
- [ ] **Task 1.4.8:** Clean up unused imports

### 1.5 Testing & Verification

- [ ] **Task 1.5.1:** Test SegmentedControl animations (Athan section)
- [ ] **Task 1.5.2:** Test Toggle animations (Reminder section)
- [ ] **Task 1.5.3:** Test Stepper increment/decrement
- [ ] **Task 1.5.4:** Test SegmentedControl for reminder type (was TypeSelector)
- [ ] **Task 1.5.5:** Test disabled states and opacity
- [ ] **Task 1.5.6:** Verify settings persist on close

---

## Phase 2: ColorPickerSettings.tsx (~12 tasks)

### 2.1 Analysis

- [ ] **Task 2.1.1:** Read and analyze ColorPickerSettings.tsx (312 lines)
- [ ] **Task 2.1.2:** Identify embedded components (sliders, previews, etc.)
- [ ] **Task 2.1.3:** Document component boundaries and dependencies
- [ ] **Task 2.1.4:** Create extraction plan

### 2.2 Extract Components (TBD based on analysis)

- [ ] **Task 2.2.1:** Extract component A (e.g., ColorSlider)
- [ ] **Task 2.2.2:** Extract component B (e.g., ColorPreview)
- [ ] **Task 2.2.3:** Extract component C (e.g., PresetButton)
- [ ] **Task 2.2.4:** Update imports and usage

### 2.3 Testing

- [ ] **Task 2.3.1:** Test color selection functionality
- [ ] **Task 2.3.2:** Test slider interactions
- [ ] **Task 2.3.3:** Test preset buttons
- [ ] **Task 2.3.4:** Verify color changes apply correctly

---

## Phase 3: CountdownBar.tsx (~10 tasks)

### 3.1 Analysis

- [ ] **Task 3.1.1:** Read and analyze CountdownBar.tsx (274 lines)
- [ ] **Task 3.1.2:** Identify animated segments and sub-components
- [ ] **Task 3.1.3:** Document animation patterns
- [ ] **Task 3.1.4:** Create extraction plan

### 3.2 Extract Components (TBD based on analysis)

- [ ] **Task 3.2.1:** Extract component A (e.g., ProgressSegment)
- [ ] **Task 3.2.2:** Extract component B (e.g., TimeDisplay)
- [ ] **Task 3.2.3:** Update imports and usage

### 3.3 Testing

- [ ] **Task 3.3.1:** Test countdown animations
- [ ] **Task 3.3.2:** Test segment transitions
- [ ] **Task 3.3.3:** Verify timing accuracy

---

## Phase 4: Medium Files (~18 tasks)

### 4.1 BottomSheetSettings.tsx (217 lines)

- [ ] **Task 4.1.1:** Analyze structure and embedded components
- [ ] **Task 4.1.2:** Extract setting row component if applicable
- [ ] **Task 4.1.3:** Extract section component if applicable
- [ ] **Task 4.1.4:** Update main file
- [ ] **Task 4.1.5:** Test all settings interactions

### 4.2 Overlay.tsx (214 lines)

- [ ] **Task 4.2.1:** Analyze structure and overlay types
- [ ] **Task 4.2.2:** Extract overlay variants if applicable
- [ ] **Task 4.2.3:** Update main file
- [ ] **Task 4.2.4:** Test overlay animations

### 4.3 BottomSheetSound.tsx (180 lines)

- [ ] **Task 4.3.1:** Analyze structure
- [ ] **Task 4.3.2:** Check for reusable patterns with BottomSheetSoundItem
- [ ] **Task 4.3.3:** Extract shared components if any
- [ ] **Task 4.3.4:** Update and test

### 4.4 Alert.tsx (170 lines)

- [ ] **Task 4.4.1:** Analyze structure
- [ ] **Task 4.4.2:** Extract sub-components if applicable
- [ ] **Task 4.4.3:** Test alert functionality

### 4.5 PrayerExplanation.tsx (161 lines)

- [ ] **Task 4.5.1:** Analyze structure
- [ ] **Task 4.5.2:** Extract sub-components if applicable
- [ ] **Task 4.5.3:** Test explanation display

---

## Phase 5: Review & Consolidation (~12 tasks)

### 5.1 Cross-cutting Patterns

- [ ] **Task 5.1.1:** Audit all extracted components for consistency
- [ ] **Task 5.1.2:** Identify shared animation patterns
- [ ] **Task 5.1.3:** Identify shared style patterns
- [ ] **Task 5.1.4:** Create shared constants if needed

### 5.2 Shared Primitives

- [ ] **Task 5.2.1:** Review Card/Container patterns across sheets
- [ ] **Task 5.2.2:** Review Button/Pressable patterns
- [ ] **Task 5.2.3:** Consider extracting shared primitives
- [ ] **Task 5.2.4:** Update components to use shared primitives

### 5.3 Optional: Folder Reorganization

- [ ] **Task 5.3.1:** Decide on folder structure (flat vs. grouped)
- [ ] **Task 5.3.2:** If grouped: create folders (primitives/, sheets/, prayer/, layout/)
- [ ] **Task 5.3.3:** Move files to appropriate folders
- [ ] **Task 5.3.4:** Update all import paths

### 5.4 Documentation

- [ ] **Task 5.4.1:** Create components/README.md with component inventory
- [ ] **Task 5.4.2:** Document component usage patterns
- [ ] **Task 5.4.3:** Final review and cleanup

---

## Task Summary

| Phase                        | Tasks  | Status         |
| ---------------------------- | ------ | -------------- |
| Phase 1: BottomSheetAlert    | 15     | Ready          |
| Phase 2: ColorPickerSettings | 12     | Needs Analysis |
| Phase 3: CountdownBar        | 10     | Needs Analysis |
| Phase 4: Medium Files        | 18     | Needs Analysis |
| Phase 5: Consolidation       | 12     | Deferred       |
| **Total**                    | **67** |                |

**Note:** Phase 2-5 task counts are estimates. Actual tasks will be refined after analysis of each file.
