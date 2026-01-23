# Show Arabic Names - Progress

## Status: Complete

Created: 2026-01-23
Completed: 2026-01-23

## Reference

- [Plan](./plan.md)
- [Description](./description.md)

## Tasks

- [x] **Task 1:** Add showArabicNamesAtom to stores/ui.ts
- [x] **Task 2:** Update Prayer.tsx to conditionally display Arabic
- [x] **Task 3:** Add toggle to BottomSheetSettings.tsx
- [x] **Task 4:** Unit tests for showArabicNamesAtom
- [x] **Task 5:** Specialist reviews (3x 100/100)
- [x] **Task 6:** Manual testing & verification

## Detailed Checklist

### Task 1: Add Atom

- [x] Atom added with correct name: `showArabicNamesAtom`
- [x] Storage key: `preference_show_arabic_names`
- [x] Default value: `true`
- [x] Placed after `showTimePassedAtom`

### Task 2: Prayer.tsx Update

- [x] Import `showArabicNamesAtom`
- [x] Use `useAtomValue` hook
- [x] Conditionally render element (removed from DOM when OFF)
- [x] Works in overlay mode
- [x] Works in non-overlay mode
- [x] Times shift and center when Arabic hidden
- [x] Times remain vertically aligned

### Task 3: Settings Toggle

- [x] Import atom from stores/ui
- [x] Add `useAtom` hook
- [x] Add SettingsToggle component
- [x] Correct label: "Show arabic names"
- [x] Placed after "Show time passed"

### Task 4: Unit Tests

- [x] Test: exports the atom
- [x] Test: has correct default value of true
- [x] Test: can be set to false
- [x] Test: can be set back to true
- [x] Test: can toggle between true and false
- [x] Test: included in settings defaults summary

### Task 5: Reviews

- [x] ReviewerQA: 100/100 (after adding tests)
- [x] Architect: 100/100 (patterns validated)
- [x] Consistency: 100/100 (all patterns match)

### Task 6: Manual Testing

- [x] Standard list: Arabic visible when ON
- [x] Standard list: Arabic hidden when OFF
- [x] Extra list: Arabic visible when ON
- [x] Extra list: Arabic hidden when OFF
- [x] Overlay updates immediately on toggle
- [x] No layout shift - times center and align
- [x] Setting persists after restart

## Implementation Summary

**Files modified:**

- `stores/ui.ts:34` - Added `showArabicNamesAtom`
- `components/Prayer.tsx:16,26,88-90` - Conditional rendering of Arabic
- `components/BottomSheetSettings.tsx:16,29,79-83` - Settings toggle
- `stores/__tests__/ui.test.ts` - Added 5 unit tests

**Key design decisions:**

1. Arabic element is **removed from DOM** when setting is OFF (not hidden with empty text)
2. PrayerTime's existing `flex: 1` expands to fill space when Arabic removed
3. Times center-align automatically due to `textAlign: 'center'` in PrayerTime
4. Vertical alignment maintained by existing `maxEnglishWidth` system

**Test coverage:** 170 tests pass (5 new tests added)
