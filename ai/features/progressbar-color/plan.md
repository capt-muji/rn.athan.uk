# Implementation Plan: countdownbar-color

**Status:** Architect Approved  
**Created:** 2026-01-21  
**Specialist:** Architect

---

## Overview

Allow users to customize the color of the countdown progress bar via a full color picker in the settings bottom sheet. Currently the progress bar color is hardcoded to cyan (`#00ffea`), so this feature adds user preference for personalization.

## Key Findings

### Current Implementation
- `CountdownBar.tsx` uses `interpolateColor` with hardcoded colors: cyan (`#00ffea`) for normal, red (`#ff0080`) for warning
- `colorValue` shared value controls color state (0 = normal, 1 = warning)
- Color is applied to both `colorStyle`, `glowStyle`, `warningGlowStyle`

### Storage Pattern
- `stores/storage.ts` has `atomWithStorageBoolean` and `atomWithStorageNumber`
- **Gap**: No `atomWithStorageString` - need to create for color storage

### Settings Pattern  
- `BottomSheetSettings.tsx` uses `SettingsToggle` for booleans, `Pressable` for buttons
- Color picker needs new UI component (not a toggle)

---

## Phases

### Phase 1: Storage Foundation
### Phase 2: Color Picker UI
### Phase 3: CountdownBar Integration
### Phase 4: Settings Integration
### Phase 5: Testing & Verification

---

## Task Breakdown

### Phase 1: Storage Foundation (1-2 hours)

**Task 1.1: Add atomWithStorageString helper**
- **File:** `stores/storage.ts`
- **Change Type:** Modified
- **Description:** Add `atomWithStorageString` function following the existing pattern from `atomWithStorageBoolean`
- **Complexity:** Small
- **Acceptance Criteria:**
  - [ ] New function `atomWithStorageString(key, initialValue)` added
  - [ ] Follows same pattern as existing helpers
  - [ ] Uses MMKV `getString` / `set` methods
  - [ ] Works with `getOnInit: true` option

**Task 1.2: Add countdownbarColorAtom to stores/ui.ts**
- **File:** `stores/ui.ts`
- **Change Type:** Modified
- **Description:** Add new atom for progress bar color preference using the new helper
- **Complexity:** Small
- **Dependencies:** Task 1.1
- **Acceptance Criteria:**
  - [ ] New atom `countdownbarColorAtom` added
  - [ ] Key: `preference_countdownbar_color`
  - [ ] Default value: `#00ffea` (cyan)
  - [ ] Exported from stores/ui.ts

---

### Phase 2: Color Picker UI (2-3 hours)

**Task 2.1: Research and install color picker package**
- **Action:** Research best React Native color picker package
- **Recommended:** `react-native-color-picker` (well-maintained, supports hex)
- **Alternative:** `react-native-hue-color-picker`
- **Complexity:** Small
- **Acceptance Criteria:**
  - [ ] Package installed via `npx expo install`
  - [ ] Works on both iOS and Android
  - [ ] Supports hex color input/output

**Task 2.2: Create ColorPickerSettings component**
- **New File:** `components/ColorPickerSettings.tsx`
- **Change Type:** New
- **Description:** Create reusable color picker component for settings sheet
- **Complexity:** Medium
- **Dependencies:** Task 2.1
- **Acceptance Criteria:**
  - [ ] Component created in `components/`
  - [ ] Uses installed color picker package
  - [ ] Shows current color as preview
  - [ ] Shows color as button/row in settings style
  - [ ] Follows existing component patterns (imports, types, styles)

**Task 2.3: Add reset functionality to ColorPickerSettings**
- **File:** `components/ColorPickerSettings.tsx` (from Task 2.2)
- **Change Type:** Modified
- **Description:** Add reset button/icon to restore default cyan color
- **Complexity:** Small
- **Dependencies:** Task 2.2
- **Acceptance Criteria:**
  - [ ] Reset button appears near color picker
  - [ ] Tapping reset restores `#00ffea`
  - [ ] Reset provides haptic feedback
  - [ ] Visual indication when custom color is selected (vs default)

---

### Phase 3: CountdownBar Integration (1-2 hours)

**Task 3.1: Modify CountdownBar.tsx to use color preference**
- **File:** `components/CountdownBar.tsx`
- **Change Type:** Modified
- **Description:** Update CountdownBar to read and apply user's color preference
- **Complexity:** Medium
- **Dependencies:** Task 1.2
- **Acceptance Criteria:**
  - [ ] CountdownBar reads `countdownbarColorAtom`
  - [ ] User's color is used instead of hardcoded cyan for normal state
  - [ ] Warning state still uses red (`#ff0080`) for visibility
  - [ ] Smooth color transitions still work
  - [ ] No regressions in animation behavior

**Task 3.2: Handle first-render color setup**
- **File:** `components/CountdownBar.tsx`
- **Change Type:** Modified
- **Description:** Ensure color preference is applied correctly on first app launch
- **Complexity:** Small
- **Dependencies:** Task 3.1
- **Acceptance Criteria:**
  - [ ] On first launch, uses default cyan
  - [ ] After user selection, uses user's color
  - [ ] No flash or incorrect colors during app load

---

### Phase 4: Settings Integration (1-2 hours)

**Task 4.1: Add ColorPickerSettings to BottomSheetSettings.tsx**
- **File:** `components/BottomSheetSettings.tsx`
- **Change Type:** Modified
- **Description:** Add color picker row to settings sheet between existing toggles
- **Complexity:** Small
- **Dependencies:** Tasks 2.2, 2.3, 3.1
- **Acceptance Criteria:**
  - [ ] Color picker option added to settings sheet
  - [ ] Placed logically (near "Hide countdown bar" toggle)
  - [ ] Opens color picker on tap
  - [ ] Shows current color preview
  - [ ] Reset button visible when custom color selected

**Task 4.2: Verify bottom sheet sizing**
- **File:** `components/BottomSheetSettings.tsx`
- **Change Type:** Modified
- **Description:** Update bottom sheet snap points if needed to accommodate new option
- **Complexity:** Small
- **Dependencies:** Task 4.1
- **Acceptance Criteria:**
  - [ ] Bottom sheet snap point updated from `55%` to `60%` (or appropriate)
  - [ ] All content scrollable if needed
  - [ ] No visual cutoff of options

---

### Phase 5: Testing & Verification (1-2 hours)

**Task 5.1: Manual testing on iOS simulator**
- **Action:** Test feature on iOS
- **Complexity:** Small
- **Acceptance Criteria:**
  - [ ] Color picker opens correctly
  - [ ] Can select any color
  - [ ] Progress bar updates immediately
  - [ ] Color persists after app restart
  - [ ] Reset button works
  - [ ] No visual regressions

**Task 5.2: Manual testing on Android emulator**
- **Action:** Test feature on Android
- **Complexity:** Small
- **Acceptance Criteria:**
  - [ ] All functionality from Task 5.1 works
  - [ ] Platform-specific styling looks correct
  - [ ] No Android-specific bugs

**Task 5.3: TypeScript compilation check**
- **Action:** Run typecheck
- **Complexity:** Small
- **Acceptance Criteria:**
  - [ ] `yarn tsc` passes with no errors

**Task 5.4: Linting check**
- **Action:** Run ESLint
- **Complexity:** Small
- **Acceptance Criteria:**
  - [ ] ESLint passes with no warnings

---

## File Modifications

| File | Change Type | Description |
|------|-------------|-------------|
| `stores/storage.ts` | Modified | Add `atomWithStorageString` helper |
| `stores/ui.ts` | Modified | Add `countdownbarColorAtom` |
| `components/ColorPickerSettings.tsx` | **New** | Color picker UI component |
| `components/CountdownBar.tsx` | Modified | Use color preference instead of hardcoded cyan |
| `components/BottomSheetSettings.tsx` | Modified | Add color picker option to settings |

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Color picker package has issues on some Android devices | Low | Medium | Test on both platforms, have fallback message |
| Color state conflicts with warning red color | Low | Medium | Keep warning state as red (`#ff0080`), only override normal state |
| Performance impact from color state updates | Low | Low | Use Jotai atoms, minimal re-renders |
| Bottom sheet resize causes UI issues | Low | Low | Test with updated snap points, ensure scrollable |

---

## Rollback Strategy

If issues arise:

1. **Remove color picker package**: Uninstall via Yarn, revert settings UI
2. **Rollback storage**: Remove `countdownbarColorAtom`, color persists in MMKV but unused
3. **CountdownBar revert**: Revert to hardcoded cyan in `interpolateColor`
4. **Settings revert**: Remove color picker row from BottomSheetSettings

All changes are localized to 5 files. Rollback can be done by reverting those files.

---

## Success Criteria

- [ ] Users can select any color for the progress bar
- [ ] Color applies to all progress bars (Standard and Extra schedules)
- [ ] Color preference persists across app restarts
- [ ] Reset button restores default cyan
- [ ] No regressions in existing progress bar functionality
- [ ] Works on both iOS and Android
- [ ] TypeScript compilation passes
- [ ] ESLint passes with no warnings

---

## Open Questions (Resolved)

- **Color picker package:** Will research and install best option (approved to install packages)
- **Warning state:** Keep red (`#ff0080`) for visibility - only override normal state with user's color
- **Reset behavior:** Reset button always visible when custom color is selected

---

## Approval

- [x] Architect: Plan approved
- [ ] ReviewerQA: Pending (100/100 required)

