# Feature: Prayer Component Measurement System Improvements

**Status:** Approved
**Author:** Claude (AI Assistant)
**Date:** 2026-01-17
**Specialist:** Architect

---

## Overview

Fix font scaling issues on Android devices (OnePlus 8T) and remove over-engineered persistence from the measurement system. The measurement system ensures prayer rows are vertically aligned and the overlay feature displays correctly.

---

## Problem Statement

1. **Font Scaling Bug**: `allowFontScaling: false` is set globally but OnePlus 8T (and some Android devices) ignore this setting, causing misaligned text
2. **Over-Engineering**: Position measurements are persisted to MMKV database but don't need to be - they're only used after user interaction
3. **Dead Code**: Unused `hiddenText` style definition in List.tsx

---

## Goals

- [x] Fix font scaling on Android devices that ignore `allowFontScaling`
- [x] Remove unnecessary persistence from position measurement atoms
- [x] Remove dead code (unused style)
- [x] Clean up related cache clear logic

## Non-Goals

- Changing the English width measurement system (must stay persistent)
- Modifying how measurements are used in Prayer.tsx or Overlay.tsx
- Changing the visual appearance of prayer rows

---

## Technical Background

### How the Measurement System Works

1. **English Width Measurement** (at app startup):
   - `InitialWidthMeasurement.tsx` renders hidden `<Text>` with longest prayer name
   - `onLayout` callback captures the rendered width
   - Width is stored in `englishWidthStandardAtom` / `englishWidthExtraAtom`
   - `Prayer.tsx` uses this width to set a fixed column width for English names
   - **MUST stay persistent** - used during splash screen before render

2. **Position Measurement** (on first layout):
   - `List.tsx` calls `measureInWindow()` on the list container
   - `Day.tsx` calls `measureInWindow()` on the date element
   - Results stored in `measurementsListAtom` / `measurementsDateAtom`
   - `Overlay.tsx` uses these coordinates for absolute positioning
   - **Can be memory-only** - overlay only shows after user tap (~50ms measurement is negligible)

### Why OnePlus Ignores allowFontScaling

Some Android OEMs (OnePlus, Xiaomi) have custom implementations that bypass React Native's font scaling flags at the native Android level. The `maxFontSizeMultiplier` property works differently - it caps the multiplier value directly rather than relying on the Android framework to respect a boolean flag.

---

## Technical Design

### Task 1: Add `maxFontSizeMultiplier` to Fix Font Scaling

**File:** `/app/_layout.tsx`

**Current Code (lines 22-28)**:
```tsx
// Set default props for all Text components
// @ts-expect-error silent
Text.defaultProps = {
  // @ts-expect-error silent
  ...Text.defaultProps,
  allowFontScaling: false,
};
```

**Change to**:
```tsx
// Set default props for all Text components
// @ts-expect-error silent
Text.defaultProps = {
  // @ts-expect-error silent
  ...Text.defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};
```

**Explanation**: `maxFontSizeMultiplier: 1` ensures text never scales beyond 100% even on devices that ignore `allowFontScaling`. This is a belt-and-suspenders approach.

---

### Task 2: Convert Position Measurement Atoms to Memory-Only

**File:** `/stores/ui.ts`

**Current Code (lines 25-26)**:
```tsx
export const measurementsListAtom = atomWithStorageObject<PageCoordinates>('measurements_list', emptyCoordinates);
export const measurementsDateAtom = atomWithStorageObject<PageCoordinates>('measurements_date', emptyCoordinates);
```

**Change to**:
```tsx
export const measurementsListAtom = atom<PageCoordinates>(emptyCoordinates);
export const measurementsDateAtom = atom<PageCoordinates>(emptyCoordinates);
```

**Why**:
- These atoms use `atomWithStorageObject` which persists to MMKV database
- The overlay only becomes visible after a user tap, at which point components are already rendered
- Measuring on-demand takes ~50ms which is negligible
- Removing persistence eliminates stale cache issues

**Note**: The `atom` import already exists at line 2: `import { atom, getDefaultStore } from 'jotai';`

---

### Task 3: Remove Measurements from Cache Clear Logic

**File:** `/stores/version.ts`

**Delete lines 132-134**:
```tsx
    // UI measurements - may change with UI updates
    Database.clearPrefix('measurements_');
    logger.info('VERSION: Cleared measurements_*');
```

**Why**: Since measurements are no longer persisted (after Task 2), there's nothing to clear.

---

### Task 4: Remove Unused `hiddenText` Style

**File:** `/components/List.tsx`

**Delete lines 56-64**:
```tsx
  hiddenText: {
    position: 'absolute',
    pointerEvents: 'none',
    opacity: 0,
    zIndex: -1000,
    fontFamily: TEXT.family.regular,
    fontSize: TEXT.size,
    backgroundColor: 'green',
  },
```

**Why**: This style is defined but never referenced anywhere in the codebase.

---

## Files Summary

| File | Action |
|------|--------|
| `/app/_layout.tsx` | Add `maxFontSizeMultiplier: 1` to Text.defaultProps |
| `/stores/ui.ts` | Change `atomWithStorageObject` to `atom` for 2 measurement atoms |
| `/stores/version.ts` | Remove `measurements_*` cache clear (3 lines) |
| `/components/List.tsx` | Remove unused `hiddenText` style (9 lines) |

---

## DO NOT Modify

These files/atoms should NOT be changed:

1. **`/components/InitialWidthMeasurement.tsx`** - English width measurement runs during splash screen, needs persistence
2. **`englishWidthStandardAtom` and `englishWidthExtraAtom` in `/stores/ui.ts`** - These MUST stay persistent (used for column alignment)
3. **`/components/Prayer.tsx`** - Uses measurements correctly
4. **`/components/Overlay.tsx`** - Uses measurements correctly

---

## Verification Steps

After implementation:

1. **Build the app**: `yarn ios` or `yarn android`

2. **Test font scaling**:
   - Go to device Settings → Accessibility → Font size
   - Set to maximum
   - Open app
   - Verify all prayer text is the same size (not scaled)

3. **Test overlay alignment**:
   - Tap any prayer row
   - Verify overlay appears exactly aligned with the row
   - Close overlay, tap a different prayer
   - Verify alignment is correct

4. **Test after app restart**:
   - Force close app
   - Reopen app
   - Tap a prayer row
   - Verify overlay still aligns correctly (measurements recalculate on-demand)

5. **Test version upgrade**:
   - The measurement cache clear in version.ts should no longer appear in logs

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Font scaling fix doesn't work on all devices | Low | Medium | Both flags (`allowFontScaling` + `maxFontSizeMultiplier`) provide redundancy |
| Overlay misaligned on first tap | Low | Low | Measurement happens synchronously before overlay shows |
| Breaking existing functionality | Low | Medium | No changes to measurement consumers (Prayer.tsx, Overlay.tsx) |

---

## Approval

- [x] Architect: Plan approved
- [ ] Implementer: Ready to build
- [ ] ReviewerQA: Changes verified
