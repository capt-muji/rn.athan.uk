# Implementation Plan: First Launch Onboarding

**Status:** ✅ APPROVED (ReviewerQA: 100/100)
**Created:** 2026-01-20
**Revised:** 2026-01-20 (Fixed 5 critical issues from first review)
**Approved:** 2026-01-20
**Author:** Architect Agent + Orchestrator
**Specialist:** Architect

---

## Overview

Replace the "Quick Tip" modal with an interactive first-launch overlay that guides users to tap the Masjid icon to access settings on first launch.

### What We're Building
An interactive first-launch onboarding overlay that replaces the existing "Quick Tip" modal with a more intuitive visual guide. The overlay will:
- Display a dark semi-transparent background (0.3 opacity) covering the entire screen
- Show a blue circular callout with "Open Settings" text and a pulsing arrow
- Position a duplicate Masjid SVG icon exactly over the original icon
- When the user taps the duplicate SVG, dismiss the overlay and open the settings sheet
- Never show again after first interaction

### Goals
1. Remove legacy ModalTips component entirely
2. Guide new users to discover settings location
3. Use existing patterns (Alert.tsx styling, Reanimated 4 worklets)
4. Ensure 100/100 ReviewerQA approval

### Success Criteria
- [ ] First launch shows onboarding overlay
- [ ] Dark overlay blocks interaction except with duplicate Masjid SVG
- [ ] Blue callout styled exactly like Alert.tsx popup
- [ ] Arrow pulses smoothly using Reanimated 4
- [ ] Tapping duplicate SVG dismisses overlay and opens settings
- [ ] Subsequent launches skip onboarding
- [ ] cleanup() function includes new MMKV key
- [ ] All old ModalTips references removed

---

## Revision Summary (2026-01-20)

**First ReviewerQA Score: 87/100** - Identified 5 critical issues

**Fixes Applied:**

1. **Z-Index Conflict (CRITICAL)** - Added new `OVERLAY.zindexes.onboarding: 1001` constant to ensure onboarding appears above all other overlays (was using popup: 1000, same as Alert.tsx)

2. **Phase Dependency (CRITICAL)** - Added execution order note explaining Phase 3 Task 3.1 must be completed before Phase 2 begins (atom dependency)

3. **Measurement Persistence (CRITICAL)** - Clarified that `measurementsMasjidAtom` is ephemeral (NOT persisted to MMKV), accepts remeasurement on each launch for first-time onboarding

4. **Import Statements (CRITICAL)** - Consolidated ALL imports in Task 2.1 code example to prevent compilation errors

5. **Technical Spec Opacity (CRITICAL)** - Fixed incorrect StyleSheet opacity example to show proper Reanimated 4 animated style pattern

**Additional Improvements:**
- Added Task 1.1 to update constants.ts with new z-index
- Clarified "circular callout" is actually pill-shaped (borderRadius: 50)
- Updated Implementation Timeline (17 tasks, 19 hours)
- Added note about logger imports for error handling

---

## Section 2: Architecture Analysis

### How This Fits With Existing Code

**Pattern Matching:**
- **Overlay Pattern**: Follow `components/Overlay.tsx` - uses absolute positioning, z-index, backdrop opacity animation
- **Popup Styling**: Match `components/Alert.tsx` popup styles (lines 201-234) - shadow, borderRadius, padding
- **Animation Pattern**: Use `hooks/useAnimation.ts` worklets - specifically `useAnimationOpacity` and custom pulsing animation
- **State Management**: Follow `stores/ui.ts` pattern - atom with MMKV persistence via `atomWithStorageBoolean`
- **SVG Positioning**: Use measurement pattern from `components/Day.tsx` (lines 27-37) - measureInWindow for absolute positioning

**Integration Points:**
1. **Entry Point**: `app/index.tsx` (replace ModalTips import and usage)
2. **State**: `stores/ui.ts` (add onboarding atom)
3. **Cleanup**: `stores/database.ts` (add MMKV key to cleanup function)
4. **Layout**: Render inside `app/index.tsx` after API loads (similar to Overlay.tsx placement)

### Key Architectural Decisions

**Decision 1: Z-Index Strategy**
- OnboardingOverlay must appear above ALL other overlays
- Add new constant `OVERLAY.zindexes.onboarding: 1001` to `shared/constants.ts`
- This ensures onboarding appears above popup alerts (z-index: 1000)

**Decision 2: Measurement Strategy**
- Use `onLayout` + `measureInWindow` to get Masjid icon coordinates (same as Day.tsx)
- Measurements stored in ephemeral atom (NOT persisted to MMKV)
- Accept remeasurement on each app launch (acceptable cost for first-time onboarding)
- Position duplicate SVG using absolute positioning with stored coordinates

**Decision 3: Component Structure**
```
OnboardingOverlay
├── Dark Background (Animated.View with opacity 0.3)
├── Blue Callout Pill (borderRadius 50 creates pill, not circle)
│   ├── "Open Settings" Text
│   └── Pulsing Arrow (Animated)
└── Duplicate Masjid SVG (Pressable, absolutely positioned)
```

**Decision 4: Animation Strategy**
- Overlay fade-in: `useAnimationOpacity` (200ms)
- Arrow pulse: Custom shared value with repeat (1.0 → 1.15 → 1.0, 500ms cycle)
- Dismiss fade-out: `useAnimationOpacity` (200ms)

**Decision 5: State Management**
- MMKV key: `preference_onboarding_completed` (follows preference_* naming convention)
- Atom: `onboardingCompletedAtom` (persisted boolean via atomWithStorageBoolean, default false)
- Check: If false, show overlay; if true, skip
- Trigger: Set to true on duplicate SVG tap

---

## Section 3: Detailed Task Breakdown

**IMPORTANT: Phase Execution Order**
While phases are numbered 1-5, some tasks have cross-phase dependencies:
- **Complete Phase 3 Task 3.1 (onboarding atom) BEFORE starting Phase 2**
- Phase 3 Task 3.1 creates the atom that Phase 2 components need
- All other phases can be executed in numerical order

**Recommended Execution Sequence:**
1. Phase 1 (Preparation)
2. Phase 3 Task 3.1 (Add onboarding atom)
3. Phase 2 (Core Component - now has atom available)
4. Phase 3 Tasks 3.2-3.3 (remaining state management)
5. Phase 4 (Integration)
6. Phase 5 (Testing & QA)

### Phase 1: Preparation & Removal (3 tasks, ~3 hours)

#### Task 1.1: Add Onboarding Z-Index to Constants
**Objective**: Add new z-index constant to ensure onboarding appears above all other overlays

**Files to Modify:**
- `/Users/muji/repos/rn.athan.uk/shared/constants.ts`

**Changes:**
```tsx
export const OVERLAY = {
  zindexes: {
    onboarding: 1001, // ADD THIS - Highest z-index for first-launch onboarding
    popup: 1000,
    overlay: 2,
    glow: -1,
  },
};
```

**Acceptance Criteria:**
- [ ] onboarding: 1001 added to OVERLAY.zindexes
- [ ] Positioned above popup (1000) in object definition
- [ ] No TypeScript errors
- [ ] Comment explains purpose

**Dependencies:** None

---

#### Task 1.2: Remove ModalTips Component and References
**Objective**: Clean up old Quick Tip modal entirely

**Files to Modify:**
- `/Users/muji/repos/rn.athan.uk/components/ModalTips.tsx` - DELETE
- `/Users/muji/repos/rn.athan.uk/app/index.tsx` - MODIFY

**Changes:**
1. Delete `components/ModalTips.tsx`
2. In `app/index.tsx`:
   - Remove import: `import ModalTips from '@/components/ModalTips';` (line 7)
   - Remove state: `popupTipAthanEnabledAtom` usage (line 26)
   - Remove imports: `popupTipAthanEnabledAtom`, `setPopupTipAthanEnabled` (lines 17-21)
   - Remove handler: `handleCloseTip` (lines 40-42)
   - Remove JSX: `<ModalTips visible={modalTipEnabled} onClose={handleCloseTip} />` (line 65)

**Acceptance Criteria:**
- [ ] ModalTips.tsx file deleted
- [ ] No import errors in app/index.tsx
- [ ] App compiles without references to ModalTips
- [ ] No console errors on first launch

**Dependencies:** None

---

#### Task 1.3: Understand Masjid Icon Positioning Requirements
**Objective**: Analyze how to measure and position duplicate SVG

**Files to Study:**
- `/Users/muji/repos/rn.athan.uk/components/Masjid.tsx` - Current icon component
- `/Users/muji/repos/rn.athan.uk/components/Day.tsx` - Parent container with layout
- `/Users/muji/repos/rn.athan.uk/app/Screen.tsx` - Screen padding structure

**Analysis:**
1. Masjid is rendered in `Day.tsx` line 49
2. Day.tsx uses flexDirection: 'row', justifyContent: 'space-between' (lines 56-59)
3. Masjid receives width=55, height=55 props (default values)
4. Need to add `onLayout` callback to Masjid component to capture position
5. Position includes: pageX, pageY from measureInWindow

**Acceptance Criteria:**
- [ ] Document Masjid's position in UI hierarchy
- [ ] Identify measurement approach (measureInWindow)
- [ ] Plan atom for storing measurements

**Dependencies:** None

---

### Phase 2: Core Component Implementation (6 tasks, ~8 hours)

#### Task 2.1: Create OnboardingOverlay Component Structure
**Objective**: Create base component with dark overlay and layout

**Files to Create:**
- `/Users/muji/repos/rn.athan.uk/components/OnboardingOverlay.tsx`

**Code Example:**
```tsx
// External imports
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// Internal imports
import MasjidIcon from '@/assets/icons/masjid.svg';
import { useAnimationOpacity } from '@/hooks/useAnimation';
import { OVERLAY, TEXT } from '@/shared/constants';
import { measurementsMasjidAtom, onboardingCompletedAtom, setOnboardingCompleted, showSettingsSheet } from '@/stores/ui';

export default function OnboardingOverlay() {
  const completed = useAtomValue(onboardingCompletedAtom);
  const backgroundOpacity = useAnimationOpacity(0);

  useEffect(() => {
    if (!completed) {
      backgroundOpacity.animate(0.3, { duration: 200 });
    }
  }, [completed]);

  if (completed) return null;

  return (
    <Animated.View style={[styles.container, backgroundOpacity.style]}>
      {/* Components will be added in next tasks */}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: OVERLAY.zindexes.onboarding, // 1001 - Higher than all other overlays
  },
});
```

**NOTE**: This code example shows ALL imports needed for the complete component. Subsequent tasks will add the functionality using these already-imported modules.

**Acceptance Criteria:**
- [ ] Component renders dark overlay
- [ ] Opacity animates to 0.3 on mount
- [ ] Component returns null when completed is true
- [ ] No TypeScript errors
- [ ] All imports compile successfully (complete import list provided)

**Dependencies:** Phase 3 Task 3.1 (onboarding atom must exist first - see phase execution note above)

---

#### Task 2.2: Implement Blue Callout Circle with Text
**Objective**: Create styled callout matching Alert.tsx popup

**File to Modify:**
- `/Users/muji/repos/rn.athan.uk/components/OnboardingOverlay.tsx`

**Styling Reference (from Alert.tsx lines 219-234):**
```tsx
popup: {
  shadowOffset: { width: 1, height: 10 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  position: 'absolute',
  alignSelf: 'center',
  right: '100%',
  borderRadius: 50,
  paddingVertical: 15,
  paddingHorizontal: 30,
  flexDirection: 'row',
  alignItems: 'center',
  marginRight: 10,
  gap: 15,
  elevation: 15,
  backgroundColor: 'black', // Prayer-specific, we'll use similar
}
```

**Code to Add:**
```tsx
import { Text } from 'react-native';
import { TEXT } from '@/shared/constants';

// Inside component JSX:
<View style={styles.callout}>
  <Text style={styles.calloutText}>Open Settings</Text>
  {/* Arrow will be added in next task */}
</View>

// Styles:
callout: {
  shadowOffset: { width: 1, height: 10 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  position: 'absolute',
  backgroundColor: '#0847e5', // COLORS.activeBackground
  borderRadius: 50,
  paddingVertical: 15,
  paddingHorizontal: 30,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 15,
  elevation: 15,
  // Position will be calculated based on Masjid measurements
},
calloutText: {
  fontSize: TEXT.size,
  color: '#ffffff',
  fontFamily: TEXT.family.regular,
},
```

**Acceptance Criteria:**
- [ ] Blue circle renders with exact Alert.tsx shadow styling
- [ ] "Open Settings" text visible and readable
- [ ] Callout positioned to left of where Masjid will be
- [ ] Matches existing blue active background color

**Dependencies:** Task 2.1

---

#### Task 2.3: Create and Add Pulsing Arrow Icon
**Objective**: Add animated arrow pointing right toward Masjid icon

**Files to Modify:**
- `/Users/muji/repos/rn.athan.uk/components/OnboardingOverlay.tsx`

**Arrow Implementation:**
Use Svg with simple right-pointing arrow path. For pulsing animation:

```tsx
import { useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// Inside component:
const arrowScale = useSharedValue(1);

useEffect(() => {
  if (!completed) {
    arrowScale.value = withRepeat(
      withTiming(1.15, { duration: 500 }),
      -1, // infinite
      true // reverse
    );
  }
}, [completed]);

const arrowStyle = useAnimatedStyle(() => ({
  transform: [{ scale: arrowScale.value }],
}));

// In JSX (inside callout):
<Animated.View style={arrowStyle}>
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"
      fill="white"
    />
  </Svg>
</Animated.View>
```

**Acceptance Criteria:**
- [ ] Arrow renders to right of "Open Settings" text
- [ ] Arrow pulses smoothly (1.0 → 1.15 → 1.0)
- [ ] Animation loops infinitely
- [ ] Uses Reanimated 4 worklet pattern

**Dependencies:** Task 2.2

---

#### Task 2.4: Add Masjid Measurement Atom and Collection
**Objective**: Measure original Masjid icon position for duplicate positioning

**Files to Modify:**
- `/Users/muji/repos/rn.athan.uk/stores/ui.ts`
- `/Users/muji/repos/rn.athan.uk/components/Day.tsx`

**Changes in stores/ui.ts:**
```tsx
import { PageCoordinates } from '@/shared/types';

const emptyCoordinates: PageCoordinates = { pageX: 0, pageY: 0, width: 0, height: 0 };

export const measurementsMasjidAtom = atom<PageCoordinates>(emptyCoordinates);

// Actions:
export const getMeasurementsMasjid = () => store.get(measurementsMasjidAtom);
export const setMeasurementsMasjid = (measurements: PageCoordinates) =>
  store.set(measurementsMasjidAtom, measurements);
```

**Changes in components/Day.tsx:**
Add ref and measurement to Masjid wrapper:

```tsx
import { useRef } from 'react';
import { View } from 'react-native';
import { setMeasurementsMasjid, getMeasurementsMasjid } from '@/stores/ui';

// Inside Day component:
const masjidRef = useRef<View>(null);

const handleMasjidLayout = () => {
  if (!masjidRef.current || !isStandard) return;

  const cached = getMeasurementsMasjid();
  if (cached.width > 0) return; // Already measured

  masjidRef.current.measureInWindow((x, y, width, height) => {
    setMeasurementsMasjid({ pageX: x, pageY: y, width, height });
  });
};

// In JSX:
<View ref={masjidRef} onLayout={handleMasjidLayout}>
  <Masjid />
</View>
```

**Acceptance Criteria:**
- [ ] Masjid position captured on first layout
- [ ] Measurements stored in atom
- [ ] Cached to avoid re-measurement
- [ ] Only measures on Standard schedule (isStandard check)

**Dependencies:** Task 2.1

---

#### Task 2.5: Position Duplicate Masjid SVG
**Objective**: Render duplicate SVG exactly over original using measurements

**Files to Modify:**
- `/Users/muji/repos/rn.athan.uk/components/OnboardingOverlay.tsx`

**Implementation:**
```tsx
import { useAtomValue } from 'jotai';
import { Pressable } from 'react-native';
import MasjidIcon from '@/assets/icons/masjid.svg';
import { measurementsMasjidAtom } from '@/stores/ui';

// Inside component:
const masjidMeasurements = useAtomValue(measurementsMasjidAtom);

const handleMasjidPress = () => {
  // Will implement in Phase 4
};

// In JSX:
<Pressable
  onPress={handleMasjidPress}
  style={[
    styles.duplicateMasjid,
    {
      top: masjidMeasurements.pageY,
      left: masjidMeasurements.pageX,
    }
  ]}
>
  <MasjidIcon width={55} height={55} />
</Pressable>

// Styles:
duplicateMasjid: {
  position: 'absolute',
  width: 55,
  height: 55,
},
```

**Acceptance Criteria:**
- [ ] Duplicate SVG renders exactly over original Masjid
- [ ] Same size (55x55)
- [ ] Tappable (Pressable wrapper)
- [ ] No visual difference from original

**Dependencies:** Task 2.4

---

#### Task 2.6: Position Blue Callout Relative to Masjid
**Objective**: Calculate callout position to appear left of Masjid with arrow pointing right

**File to Modify:**
- `/Users/muji/repos/rn.athan.uk/components/OnboardingOverlay.tsx`

**Position Calculation:**
```tsx
const masjidMeasurements = useAtomValue(measurementsMasjidAtom);

const calloutStyle: ViewStyle = {
  // Position to left of Masjid
  top: masjidMeasurements.pageY + 10, // Align vertically (slight offset)
  right: Dimensions.get('window').width - masjidMeasurements.pageX + 15, // 15px gap
};

// In JSX:
<View style={[styles.callout, calloutStyle]}>
  <Text style={styles.calloutText}>Open Settings</Text>
  <Animated.View style={arrowStyle}>
    {/* Arrow SVG */}
  </Animated.View>
</View>
```

**Acceptance Criteria:**
- [ ] Callout appears to left of Masjid icon
- [ ] Arrow points toward Masjid
- [ ] 15px gap between callout and Masjid
- [ ] Vertical alignment looks natural

**Dependencies:** Task 2.3, Task 2.4

---

### Phase 3: State Management (3 tasks, ~3 hours)

#### Task 3.1: Add Onboarding State Atom to stores/ui.ts
**Objective**: Create persisted atom for tracking onboarding completion

**File to Modify:**
- `/Users/muji/repos/rn.athan.uk/stores/ui.ts`

**Code to Add:**
```tsx
import { atomWithStorageBoolean } from '@/stores/storage';

// Add with other atoms (around line 30):
export const onboardingCompletedAtom = atomWithStorageBoolean('preference_onboarding_completed', false);

// Add action (around line 50):
export const setOnboardingCompleted = (completed: boolean) =>
  store.set(onboardingCompletedAtom, completed);
export const getOnboardingCompleted = () => store.get(onboardingCompletedAtom);
```

**MMKV Key Naming:**
- Key: `preference_onboarding_completed`
- Type: Boolean
- Default: `false`
- Follows existing pattern: `preference_progressbar_hidden`, `preference_hijri_date`

**Acceptance Criteria:**
- [ ] Atom persists to MMKV
- [ ] Default value is false (show onboarding)
- [ ] Can be set to true
- [ ] Survives app restart

**Dependencies:** None (can be done early)

---

#### Task 3.2: Update cleanup() Function in stores/database.ts
**Objective**: Include onboarding MMKV key in cleanup for dev/testing

**File to Modify:**
- `/Users/muji/repos/rn.athan.uk/stores/database.ts`

**Code Change:**
```tsx
export const cleanup = () => {
  // --- Prayer Data (safe to clear, will re-sync from API) ---
  clearPrefix('prayer_');
  clearPrefix('display_date');
  clearPrefix('fetched_years');
  clearPrefix('measurements_list');
  clearPrefix('measurements_date');
  // NOTE: measurements_masjid is NOT persisted to MMKV (ephemeral atom), so no cleanup needed
  clearPrefix('prayer_max_english_width_standard');
  clearPrefix('prayer_max_english_width_extra');
  clearPrefix('preference_alert_standard_');
  clearPrefix('preference_alert_extra_');
  clearPrefix('preference_sound');
  clearPrefix('preference_mute_standard');
  clearPrefix('preference_mute_extra');
  clearPrefix('preference_progressbar_visible');
  clearPrefix('preference_hijri_date');
  clearPrefix('preference_hide_seconds');
  clearPrefix('preference_onboarding_completed'); // ADD THIS - allows re-showing onboarding
  clearPrefix('scheduled_notifications_');
  clearPrefix('last_notification_schedule_check');
  clearPrefix('popup_update_last_check');
};
```

**Acceptance Criteria:**
- [ ] cleanup() clears `preference_onboarding_completed`
- [ ] NO cleanup for `measurements_masjid` (ephemeral atom, not persisted)
- [ ] Running cleanup() allows onboarding to show again
- [ ] Comment explains measurement atom is ephemeral

**Dependencies:** Task 3.1

---

#### Task 3.3: Add MMKV Key to App Version Preservation List
**Objective**: Ensure onboarding preference survives app upgrades

**File to Modify:**
- `/Users/muji/repos/rn.athan.uk/stores/version.ts`

**Analysis:**
Review version.ts to see if onboarding key should be preserved or cleared on upgrade. Based on AGENTS.md line 317, preference keys are preserved:

```tsx
// Preserves: preference_alert_*, preference_sound, preference_mute_*,
// preference_progressbar_visible, popup_update_last_check
```

**Decision:** `preference_onboarding_completed` should be PRESERVED (user shouldn't see onboarding again after upgrade)

**Code Check:**
Verify that the key is NOT in the "clear" list in version.ts. If version.ts explicitly clears certain keys, ensure onboarding key is excluded.

**Acceptance Criteria:**
- [ ] Onboarding preference survives app upgrade
- [ ] Key not in clear list (if such list exists)
- [ ] User doesn't see onboarding twice

**Dependencies:** Task 3.1

---

### Phase 4: Integration (3 tasks, ~3 hours)

#### Task 4.1: Add OnboardingOverlay to app/index.tsx
**Objective**: Integrate component into app entry point

**File to Modify:**
- `/Users/muji/repos/rn.athan.uk/app/index.tsx`

**Code Changes:**
```tsx
// Add import:
import OnboardingOverlay from '@/components/OnboardingOverlay';

// In JSX (replace ModalTips location, line 65):
return (
  <>
    <ModalUpdate visible={updateAvailable} onClose={handleCloseUpdate} onUpdate={handleUpdate} />
    <OnboardingOverlay />  {/* REPLACE ModalTips with this */}
    <Overlay />
    <Navigation />
  </>
);
```

**Render Order:**
1. ModalUpdate (z-index not specified, renders first)
2. OnboardingOverlay (z-index 1000, highest)
3. Overlay (z-index 2, lower)
4. Navigation (base UI)

**Acceptance Criteria:**
- [ ] OnboardingOverlay renders on first launch
- [ ] Overlay appears above all other UI
- [ ] App loads without errors
- [ ] ModalUpdate can still appear if needed

**Dependencies:** Phase 2 all tasks, Phase 3 Task 3.1

---

#### Task 4.2: Implement Tap Handler to Dismiss and Open Settings
**Objective**: Connect duplicate Masjid tap to state change and settings sheet

**File to Modify:**
- `/Users/muji/repos/rn.athan.uk/components/OnboardingOverlay.tsx`

**Implementation:**
```tsx
import * as Haptics from 'expo-haptics';
import { setOnboardingCompleted } from '@/stores/ui';
import { showSettingsSheet } from '@/stores/ui';

// Inside component:
const handleMasjidPress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  // Dismiss overlay with fade-out animation
  backgroundOpacity.animate(0, {
    duration: 200,
    onFinish: () => {
      // Mark as completed (persists to MMKV)
      setOnboardingCompleted(true);

      // Open settings sheet
      showSettingsSheet();
    }
  });
};
```

**Animation Sequence:**
1. User taps duplicate Masjid
2. Haptic feedback fires
3. Background opacity animates from 0.3 → 0 (200ms)
4. onFinish callback:
   - Set onboarding completed = true (MMKV write)
   - Open settings sheet

**Acceptance Criteria:**
- [ ] Tapping duplicate Masjid triggers haptic feedback
- [ ] Overlay fades out smoothly (200ms)
- [ ] Settings sheet opens after fade-out
- [ ] MMKV key set to true
- [ ] Next launch skips onboarding

**Dependencies:** Task 4.1, Phase 2 Task 2.5

---

#### Task 4.3: Test Onboarding Flow End-to-End
**Objective**: Manual testing of complete user flow

**Test Steps:**
1. **Fresh Install Test:**
   - Clear app data or reinstall
   - Launch app
   - Verify onboarding overlay appears
   - Verify dark overlay at 0.3 opacity
   - Verify blue callout positioned correctly
   - Verify arrow is pulsing
   - Verify duplicate Masjid over original

2. **Interaction Test:**
   - Tap outside duplicate Masjid → Nothing happens
   - Tap duplicate Masjid → Overlay fades out
   - Verify settings sheet opens
   - Close settings sheet

3. **Persistence Test:**
   - Force quit app
   - Relaunch app
   - Verify onboarding does NOT appear

4. **Cleanup Test:**
   - Run cleanup() function
   - Relaunch app
   - Verify onboarding appears again

**Acceptance Criteria:**
- [ ] All test steps pass
- [ ] No console errors
- [ ] No visual glitches
- [ ] Settings sheet opens smoothly
- [ ] Persistence works correctly

**Dependencies:** All Phase 4 tasks

---

### Phase 5: Testing & QA (2 tasks, ~2 hours)

#### Task 5.1: Manual Testing Checklist
**Objective**: Comprehensive testing against all requirements

**Test Cases:**

| Test | Expected Result | Status |
|------|----------------|--------|
| Fresh install | Onboarding appears | [ ] |
| Dark overlay opacity | Exactly 0.3 | [ ] |
| Blue callout styling | Matches Alert.tsx popup | [ ] |
| Arrow animation | Smooth pulse 1.0→1.15→1.0 | [ ] |
| Duplicate SVG position | Exactly over original | [ ] |
| Tap outside duplicate | No action | [ ] |
| Tap duplicate SVG | Fade out + open settings | [ ] |
| Second launch | Onboarding skipped | [ ] |
| cleanup() called | Onboarding shows again | [ ] |
| Settings button in callout | Text "Open Settings" visible | [ ] |
| Haptic feedback | Fires on tap | [ ] |
| MMKV persistence | Survives app restart | [ ] |

**Edge Cases:**

| Scenario | Expected Behavior | Status |
|----------|------------------|--------|
| Force quit during onboarding | Shows again on next launch | [ ] |
| Extremely fast tap (double tap) | Single dismissal, no crash | [ ] |
| Settings sheet already open | Impossible (first launch) | N/A |
| Screen rotation during onboarding | Measurements recalculate | [ ] |
| Very small screen | Callout adjusts position | [ ] |

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] All edge cases handled
- [ ] No crashes or errors

**Dependencies:** Task 4.3

---

#### Task 5.2: ReviewerQA Verification
**Objective**: Ensure 100/100 ReviewerQA approval

**ReviewerQA Criteria (from description.md):**
- [ ] Code matches existing patterns (Alert.tsx, animations)
- [ ] No console.log statements (use Pino logger)
- [ ] Pino logger used for debugging (if needed)
- [ ] Follows React Native Reanimated 4 patterns
- [ ] Component follows functional component pattern
- [ ] MMKV key properly namespaced (preference_onboarding_completed)
- [ ] Imports organized correctly (external, then internal @/)
- [ ] TypeScript strict mode compliance
- [ ] Styling matches constants (COLORS, TEXT, etc.)
- [ ] No new dependencies added
- [ ] Cleanup function updated
- [ ] No empty files left behind

**Code Quality Checks:**
```bash
# Typecheck
tsc --noEmit

# Lint single file
eslint components/OnboardingOverlay.tsx

# Format
prettier --write components/OnboardingOverlay.tsx
```

**Pattern Consistency:**
- Animation worklets use 'worklet' directive
- Styles use StyleSheet.create()
- Constants imported from @/shared/constants
- Atoms imported from @/stores/*

**Acceptance Criteria:**
- [ ] ReviewerQA grade: 100/100
- [ ] All linting passes
- [ ] No TypeScript errors
- [ ] Patterns match existing code exactly

**Dependencies:** Task 5.1

---

## Section 4: Technical Specifications

### Styling Requirements

**Dark Overlay:**
```tsx
// Static styles (in StyleSheet.create):
container: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'black',
  zIndex: OVERLAY.zindexes.onboarding, // 1001
}

// Animated opacity applied via style prop, NOT in StyleSheet:
<Animated.View style={[styles.container, backgroundOpacity.style]}>
  {/* backgroundOpacity.style contains the animated opacity value */}
</Animated.View>
```

**IMPORTANT**: Opacity cannot be set directly in StyleSheet with Reanimated 4. Must use animated style prop.

**Blue Callout Circle (from Alert.tsx):**
```tsx
{
  shadowOffset: { width: 1, height: 10 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  position: 'absolute',
  backgroundColor: '#0847e5', // COLORS.activeBackground
  borderRadius: 50,
  paddingVertical: 15,
  paddingHorizontal: 30,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 15,
  elevation: 15, // Android shadow
}
```

**Text Styling:**
```tsx
{
  fontSize: 18, // TEXT.size
  color: '#ffffff',
  fontFamily: 'Roboto-Regular', // TEXT.family.regular
}
```

**Duplicate Masjid SVG:**
```tsx
{
  position: 'absolute',
  width: 55,
  height: 55,
  top: masjidMeasurements.pageY,
  left: masjidMeasurements.pageX,
}
```

### Animation Requirements

**Overlay Fade-In (using useAnimationOpacity):**
```tsx
const backgroundOpacity = useAnimationOpacity(0);

useEffect(() => {
  if (!completed) {
    backgroundOpacity.animate(0.3, { duration: 200 });
  }
}, [completed]);
```

**Arrow Pulse (custom worklet):**
```tsx
const arrowScale = useSharedValue(1);

useEffect(() => {
  if (!completed) {
    arrowScale.value = withRepeat(
      withTiming(1.15, { duration: 500 }),
      -1, // infinite
      true // reverse (oscillate)
    );
  }
}, [completed]);

const arrowStyle = useAnimatedStyle(() => ({
  transform: [{ scale: arrowScale.value }],
}));
```

**Dismiss Fade-Out:**
```tsx
backgroundOpacity.animate(0, {
  duration: 200,
  onFinish: () => {
    setOnboardingCompleted(true);
    showSettingsSheet();
  }
});
```

### State Management

**MMKV Key:**
- Name: `preference_onboarding_completed`
- Type: Boolean
- Default: `false`
- Persistence: Survives app upgrades (preserved in version.ts)

**Atom Structure:**
```tsx
export const onboardingCompletedAtom = atomWithStorageBoolean(
  'preference_onboarding_completed',
  false
);
```

**Persistence Strategy:**
- Read on app start (via atomWithStorageBoolean)
- Write on duplicate Masjid tap (setOnboardingCompleted(true))
- Clear in cleanup() for dev testing
- Preserve on app upgrade (version.ts)

---

## Section 5: File Modification List

### Files to CREATE:
1. `/Users/muji/repos/rn.athan.uk/components/OnboardingOverlay.tsx` - Main onboarding component

### Files to MODIFY:
1. `/Users/muji/repos/rn.athan.uk/shared/constants.ts` - Add OVERLAY.zindexes.onboarding: 1001
2. `/Users/muji/repos/rn.athan.uk/app/index.tsx` - Remove ModalTips, add OnboardingOverlay
3. `/Users/muji/repos/rn.athan.uk/stores/ui.ts` - Add onboarding atoms (persisted + ephemeral) and actions
4. `/Users/muji/repos/rn.athan.uk/stores/database.ts` - Update cleanup() function
5. `/Users/muji/repos/rn.athan.uk/components/Day.tsx` - Add Masjid measurement collection

### Files to DELETE:
1. `/Users/muji/repos/rn.athan.uk/components/ModalTips.tsx` - Old Quick Tip modal

### Files to VERIFY (no changes needed):
1. `/Users/muji/repos/rn.athan.uk/stores/version.ts` - Verify onboarding key preserved on upgrade
2. `/Users/muji/repos/rn.athan.uk/components/Alert.tsx` - Reference for styling only
3. `/Users/muji/repos/rn.athan.uk/hooks/useAnimation.ts` - Use existing hooks

---

## Section 6: Edge Cases & Error Handling

### Edge Case 1: Force Quit During Onboarding
**Scenario**: User force-quits app while onboarding overlay is visible

**Expected Behavior**: Onboarding shows again on next launch (flag not set yet)

**Implementation**:
- MMKV write only happens AFTER user taps duplicate Masjid
- If user force-quits before tap, `preference_onboarding_completed` remains `false`
- Next launch triggers onboarding again

**No additional code needed** - natural behavior of current implementation

---

### Edge Case 2: User Taps Outside Duplicate SVG
**Scenario**: User taps dark overlay area (not on duplicate Masjid)

**Expected Behavior**: Nothing happens - must tap duplicate Masjid to proceed

**Implementation**:
```tsx
<Animated.View style={[styles.container, backgroundOpacity.style]}>
  {/* NO onPress handler on background */}

  {/* Only duplicate Masjid has onPress */}
  <Pressable onPress={handleMasjidPress} style={styles.duplicateMasjid}>
    <MasjidIcon />
  </Pressable>
</Animated.View>
```

**Testing**: Tap various areas of dark overlay, verify no dismissal

---

### Edge Case 3: Settings Sheet Already Open
**Scenario**: Settings sheet somehow already open on first launch

**Expected Behavior**: Impossible on first launch (user hasn't interacted yet)

**Mitigation**: Not a real edge case, but if needed:
```tsx
const handleMasjidPress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  backgroundOpacity.animate(0, {
    duration: 200,
    onFinish: () => {
      setOnboardingCompleted(true);
      // Safe to call - will dismiss if open, then re-open
      showSettingsSheet();
    }
  });
};
```

---

### Edge Case 4: MMKV Write Failure
**Scenario**: MMKV fails to write `preference_onboarding_completed = true`

**Expected Behavior**: Silent failure, show onboarding next time (graceful degradation)

**Implementation**:
```tsx
try {
  setOnboardingCompleted(true);
} catch (error) {
  logger.error('Failed to persist onboarding completion', { error });
  // Still open settings sheet (user intent was to proceed)
}
showSettingsSheet();
```

**Recovery**: User sees onboarding again next launch (acceptable UX)

---

### Edge Case 5: Overlay Active State Conflict
**Scenario**: Another overlay (components/Overlay.tsx) tries to show during onboarding

**Expected Behavior**: Onboarding has higher z-index (1000 vs 2), blocks interaction

**Implementation**:
- OnboardingOverlay z-index: 1001 (OVERLAY.zindexes.onboarding)
- Prayer Overlay z-index: 2 (OVERLAY.zindexes.overlay)
- Dark background blocks all interaction except duplicate Masjid

**Verification**: Onboarding always appears on top

---

### Edge Case 6: Screen Size Variations
**Scenario**: Very small or very large screens affect callout positioning

**Expected Behavior**: Callout adjusts position relative to Masjid (responsive)

**Implementation**:
```tsx
const calloutStyle: ViewStyle = {
  // Relative positioning based on Masjid measurements
  top: masjidMeasurements.pageY + 10,
  right: Dimensions.get('window').width - masjidMeasurements.pageX + 15,
};
```

**Testing**: Test on various screen sizes (iPhone SE, iPhone 15 Pro Max, iPad)

---

## Section 7: Rollback Strategy

### Pre-Rollback Checklist
- [ ] Identify what went wrong (specific issue)
- [ ] Determine if rollback is necessary (vs. forward fix)
- [ ] Backup current state (git commit)

### Rollback Steps

**Step 1: Remove OnboardingOverlay Component**
```bash
rm components/OnboardingOverlay.tsx
```

**Step 2: Restore ModalTips**
```bash
git checkout HEAD~1 -- components/ModalTips.tsx
```

**Step 3: Revert app/index.tsx**
```tsx
// Restore ModalTips import and usage:
import ModalTips from '@/components/ModalTips';

const modalTipEnabled = useAtomValue(popupTipAthanEnabledAtom);

<ModalTips visible={modalTipEnabled} onClose={handleCloseTip} />
```

**Step 4: Clean Up State (stores/ui.ts)**
```tsx
// Remove onboarding atoms:
// export const onboardingCompletedAtom = ... // DELETE
// export const setOnboardingCompleted = ... // DELETE
// export const measurementsMasjidAtom = ... // DELETE
```

**Step 5: Revert database.ts cleanup() changes**
```tsx
// Remove these lines:
// clearPrefix('preference_onboarding_completed');
// clearPrefix('measurements_masjid');
```

**Step 6: Revert Day.tsx measurement changes**
```tsx
// Remove masjidRef and handleMasjidLayout
// Restore original Masjid rendering without wrapper
```

**Step 7: Clear MMKV Key**
```tsx
// In stores/database.ts cleanup():
clearPrefix('preference_onboarding_completed');
// Call cleanup() once, then remove line
```

**Step 8: Test Rollback**
- [ ] App compiles
- [ ] ModalTips shows on first launch
- [ ] No references to OnboardingOverlay
- [ ] No TypeScript errors

### What to Preserve

**Preserve:**
- User preference data (unrelated to onboarding)
- Prayer times cache
- Notification settings
- Sound preferences

**Remove:**
- `preference_onboarding_completed` MMKV key
- `measurements_masjid` atom (if added)
- OnboardingOverlay component file

---

## Section 8: Success Criteria

### Functional Requirements
- [ ] First launch shows onboarding overlay
- [ ] Dark overlay at exactly 0.3 opacity
- [ ] Blue callout positioned left of Masjid icon
- [ ] Callout text reads "Open Settings"
- [ ] Arrow pulses smoothly (1.0 → 1.15 → 1.0, infinite)
- [ ] Duplicate Masjid SVG positioned exactly over original
- [ ] Tapping duplicate SVG dismisses overlay (200ms fade-out)
- [ ] Settings sheet opens after dismissal
- [ ] Second launch skips onboarding (persisted in MMKV)
- [ ] cleanup() function removes onboarding MMKV key

### Code Quality Requirements
- [ ] No console.log statements (use Pino logger if needed)
- [ ] TypeScript strict mode: no errors
- [ ] ESLint: all checks pass
- [ ] Prettier: formatted correctly
- [ ] Imports organized (external → internal @/)
- [ ] Reanimated 4 worklets used correctly
- [ ] Functional component pattern followed

### Pattern Matching Requirements
- [ ] Blue callout styling matches Alert.tsx popup exactly
- [ ] Animation hooks from useAnimation.ts used
- [ ] MMKV key follows preference_* naming
- [ ] Atom follows atomWithStorageBoolean pattern
- [ ] Measurement follows Day.tsx pattern (measureInWindow)
- [ ] Component structure matches existing patterns

### ReviewerQA Requirements
- [ ] Grade: 100/100
- [ ] Security: No vulnerabilities
- [ ] Performance: No unnecessary re-renders
- [ ] Accessibility: Tappable area adequate (55x55)
- [ ] UX: Smooth animations, no janky transitions

### Testing Requirements
- [ ] Fresh install test passes
- [ ] Persistence test passes
- [ ] Cleanup test passes
- [ ] Edge case tests pass
- [ ] No crashes or errors
- [ ] Manual QA complete

### Documentation Requirements
- [ ] All files in modification list updated
- [ ] cleanup() function includes new keys
- [ ] version.ts preservation verified
- [ ] This plan reflects actual implementation

---

## Implementation Timeline

| Phase | Tasks | Estimated Time | Total |
|-------|-------|----------------|-------|
| Phase 1: Preparation | 3 tasks | 0.5-1 hour each | 3h |
| Phase 2: Core Component | 6 tasks | 1-1.5 hours each | 8h |
| Phase 3: State Management | 3 tasks | 1 hour each | 3h |
| Phase 4: Integration | 3 tasks | 1 hour each | 3h |
| Phase 5: Testing & QA | 2 tasks | 1 hour each | 2h |
| **TOTAL** | **17 tasks** | | **19h** |

**Recommended Approach**: Execute phases sequentially, complete all tasks in a phase before moving to next phase.

---

## Critical Files for Implementation

The 5 most critical files for implementing this plan:

1. **`/Users/muji/repos/rn.athan.uk/components/OnboardingOverlay.tsx`** - Main component to create, contains all overlay logic, animations, and duplicate Masjid positioning

2. **`/Users/muji/repos/rn.athan.uk/stores/ui.ts`** - Add onboarding state atom, measurement atom, and action functions for state management

3. **`/Users/muji/repos/rn.athan.uk/app/index.tsx`** - Integration point, replace ModalTips with OnboardingOverlay component

4. **`/Users/muji/repos/rn.athan.uk/components/Alert.tsx`** - Reference file for blue callout styling (popup styles lines 219-234)

5. **`/Users/muji/repos/rn.athan.uk/stores/database.ts`** - Update cleanup() function to include new MMKV keys for dev testing

---

## Approval Checklist

- [x] **Architect**: Plan is comprehensive and follows existing patterns ✅
- [x] **Implementer**: Tasks are clear and actionable (1-2 hours each) ✅
- [x] **ReviewerQA**: Security and quality concerns addressed (100/100) ✅
- [ ] **User**: Ready to proceed with implementation
