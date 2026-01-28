# Implementation Plan: Settings - Show Time Passed

**Feature:** settings-time-passed
**Created:** 2026-01-23
**Status:** Ready for Implementation

---

## Overview

Add a toggle setting to show/hide the "time passed" indicator (PrayerAgo component).

## File Modification List

| File                                 | Action | Description                    |
| ------------------------------------ | ------ | ------------------------------ |
| `stores/ui.ts`                       | Modify | Add `showTimePassedAtom`       |
| `components/BottomSheetSettings.tsx` | Modify | Add SettingsToggle             |
| `app/Screen.tsx`                     | Modify | Conditionally render PrayerAgo |
| `stores/__tests__/ui.test.ts`        | Create | Unit tests for the atom        |

---

## Phase 1: Add Atom

### Task 1.1: Add showTimePassedAtom to stores/ui.ts

**Objective:** Create the persisted boolean atom

**Acceptance Criteria:**

- Atom named `showTimePassedAtom`
- Uses `atomWithStorageBoolean`
- Storage key: `preference_show_time_passed`
- Default value: `true`
- Exported for use in components

**Files:**

- `stores/ui.ts`

**Complexity:** Small

---

## Phase 2: Add Settings UI

### Task 2.1: Add SettingsToggle to BottomSheetSettings.tsx

**Objective:** Add the toggle to the settings sheet

**Acceptance Criteria:**

- Import `showTimePassedAtom` from `@/stores/ui`
- Add `useAtom` hook for the atom
- Add `SettingsToggle` component after "Show seconds"
- Label: "Show time passed"

**Files:**

- `components/BottomSheetSettings.tsx`

**Complexity:** Small

**Dependencies:** Task 1.1

---

## Phase 3: Implement Functionality

### Task 3.1: Conditionally render PrayerAgo in Screen.tsx

**Objective:** Remove PrayerAgo from DOM when setting is disabled

**Acceptance Criteria:**

- Import `showTimePassedAtom` from `@/stores/ui`
- Use `useAtomValue` to read the setting
- Conditionally render `<PrayerAgo>` based on setting value
- No opacity-based hiding, complete DOM removal

**Files:**

- `app/Screen.tsx`

**Complexity:** Small

**Dependencies:** Task 1.1

---

## Phase 4: Unit Tests

### Task 4.1: Create unit tests for showTimePassedAtom

**Objective:** 100% test coverage for the atom

**Acceptance Criteria:**

- Test default value is `true`
- Test persistence of `true` value
- Test persistence of `false` value
- Test correct storage key
- Follow existing test patterns in `shared/__tests__/`

**Files:**

- `stores/__tests__/ui.test.ts` (new file)

**Complexity:** Small

**Dependencies:** Task 1.1

---

## Risk Analysis

| Risk                       | Likelihood | Impact | Mitigation                    |
| -------------------------- | ---------- | ------ | ----------------------------- |
| Layout shift when toggling | Low        | Low    | PrayerAgo is last in DOM      |
| Test environment setup     | Low        | Medium | Follow existing mock patterns |

## Rollback Strategy

1. Remove the atom from `stores/ui.ts`
2. Remove toggle from `BottomSheetSettings.tsx`
3. Remove conditional rendering from `Screen.tsx`
4. Delete test file

## Success Criteria

- [x] Toggle appears in Settings after "Show seconds"
- [x] Default state is ON
- [x] PrayerAgo hidden when toggle is OFF
- [x] Setting persists across app restarts
- [x] 100% unit test coverage
- [x] All existing tests pass
- [x] `yarn validate` passes
