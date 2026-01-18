# Feature: Measurement System Improvements

**Status:** Ready for Implementation
**Created:** 2026-01-17

---

## Tasks

### Task 1: Fix Font Scaling on Android

**File:** `app/_layout.tsx`

- [x] Open `app/_layout.tsx`
- [x] Locate Text.defaultProps block (lines 22-28)
- [x] Add `maxFontSizeMultiplier: 1` after `allowFontScaling: false`
- [x] Verify no TypeScript errors

**Code Change:**

```tsx
// Before
allowFontScaling: false,

// After
allowFontScaling: false,
maxFontSizeMultiplier: 1,
```

---

### Task 2: Convert Measurement Atoms to Memory-Only

**File:** `stores/ui.ts`

#### Task 2.1: Update measurementsListAtom

- [x] Locate `measurementsListAtom` (line 25)
- [x] Change from `atomWithStorageObject<PageCoordinates>('measurements_list', emptyCoordinates)`
- [x] Change to `atom<PageCoordinates>(emptyCoordinates)`

#### Task 2.2: Update measurementsDateAtom

- [x] Locate `measurementsDateAtom` (line 26)
- [x] Change from `atomWithStorageObject<PageCoordinates>('measurements_date', emptyCoordinates)`
- [x] Change to `atom<PageCoordinates>(emptyCoordinates)`

#### Task 2.3: Verify Import

- [x] Confirm `atom` is already imported from 'jotai' (line 2)
- [x] No new imports needed

**Code Change:**

```tsx
// Before
export const measurementsListAtom = atomWithStorageObject<PageCoordinates>('measurements_list', emptyCoordinates);
export const measurementsDateAtom = atomWithStorageObject<PageCoordinates>('measurements_date', emptyCoordinates);

// After
export const measurementsListAtom = atom<PageCoordinates>(emptyCoordinates);
export const measurementsDateAtom = atom<PageCoordinates>(emptyCoordinates);
```

---

### Task 3: Remove Measurement Cache Clear

**File:** `stores/version.ts`

- [x] Locate `clearUpgradeCache()` function
- [x] Find the measurements cache clear block (lines 132-134)
- [x] Delete the 3 lines:
- [x] Verify surrounding code still makes sense (no orphaned comments)

---

### Task 4: Remove Unused hiddenText Style

**File:** `components/List.tsx`

- [x] Locate `styles` StyleSheet at bottom of file
- [x] Find `hiddenText` style (lines 56-64)
- [x] Delete the entire style block (9 lines):
- [x] Verify no remaining references to `styles.hiddenText`

---

### Task 5: Verification

#### Task 5.1: Build Verification

- [ ] Run `yarn ios` or `yarn android`
- [ ] Verify app builds without errors
- [ ] Verify no TypeScript errors

#### Task 5.2: Font Scaling Test (Android)

- [ ] Open device Settings → Accessibility → Font size
- [ ] Set font size to maximum
- [ ] Open app
- [ ] Verify all prayer text remains the same size (not scaled)

#### Task 5.3: Overlay Alignment Test

- [ ] Open app fresh
- [ ] Tap any prayer row
- [ ] Verify overlay appears exactly aligned with the row
- [ ] Close overlay
- [ ] Tap a different prayer row
- [ ] Verify alignment is still correct

#### Task 5.4: App Restart Test

- [ ] Force close app
- [ ] Reopen app
- [ ] Tap a prayer row immediately
- [ ] Verify overlay still aligns correctly (measurements recalculate)

---

## Files Modified

| File                  | Status | Changes                        |
| --------------------- | ------ | ------------------------------ |
| `app/_layout.tsx`     | [x]    | Add `maxFontSizeMultiplier: 1` |
| `stores/ui.ts`        | [x]    | Convert 2 atoms to memory-only |
| `stores/version.ts`   | [x]    | Remove 3 lines (cache clear)   |
| `components/List.tsx` | [x]    | Remove 9 lines (unused style)  |

---

## DO NOT Modify (Reference)

- `components/InitialWidthMeasurement.tsx` - Needs persistence
- `englishWidthStandardAtom` in `stores/ui.ts` - Must stay persistent
- `englishWidthExtraAtom` in `stores/ui.ts` - Must stay persistent
- `components/Prayer.tsx` - Uses measurements correctly
- `components/Overlay.tsx` - Uses measurements correctly

---

## Notes

- Task 2 depends on Task 3 being done (or vice versa) - they're related
- Task 1 and Task 4 are independent and can be done in any order
- Verification (Task 5) should be done after all other tasks
