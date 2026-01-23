# Feature: Settings - Show Time Passed

**Status:** Approved
**Author:** User
**Date:** 2026-01-23
**Specialist:** Architect

---

## Overview

Add a new toggle setting "Show time passed" that controls visibility of the PrayerAgo component. When disabled, the PrayerAgo component is removed from the DOM entirely (not hidden via opacity).

## Goals

- [x] Add persistent toggle setting for "Show time passed"
- [x] Default value: enabled (true)
- [x] Remove PrayerAgo from DOM when disabled (not opacity-based hiding)
- [x] 100% unit test coverage for the feature

## Non-Goals

- Opacity-based hiding (unlike CountdownBar which uses opacity to prevent layout shift)
- Animation when toggling (PrayerAgo is last in DOM, no layout shift concerns)

## User Stories

### Story 1: Toggle Time Passed Display

**As a** user
**I want** to hide the "time passed" indicator
**So that** I have a cleaner interface if I don't need this information

**Acceptance Criteria:**

- [x] Toggle appears in Settings after "Show seconds"
- [x] Toggle is ON by default
- [x] When OFF, PrayerAgo component is not rendered
- [x] Setting persists across app restarts

## Technical Design

### Data Flow

User toggles setting → Jotai atom updates → MMKV persists → PrayerAgo conditionally renders

### Components Affected

| Component                            | Change Type | Description                               |
| ------------------------------------ | ----------- | ----------------------------------------- |
| `stores/ui.ts`                       | Modified    | Add `showTimePassedAtom`                  |
| `components/BottomSheetSettings.tsx` | Modified    | Add SettingsToggle for "Show time passed" |
| `app/Screen.tsx`                     | Modified    | Conditionally render PrayerAgo            |

### State Changes

- New atom: `showTimePassedAtom` (boolean, default: true)
- Storage key: `preference_show_time_passed`

### API Changes

- None

## Edge Cases

| Scenario                    | Expected Behavior                    |
| --------------------------- | ------------------------------------ |
| Fresh install               | Toggle ON, PrayerAgo visible         |
| Toggle OFF then restart app | Toggle remains OFF, PrayerAgo hidden |

## Testing Plan

### Unit Tests

- [x] `showTimePassedAtom` defaults to `true`
- [x] `showTimePassedAtom` persists `true` value
- [x] `showTimePassedAtom` persists `false` value
- [x] Storage key is correct (`preference_show_time_passed`)

---

## Approval

- [x] Architect: Approved design
- [x] Implementer: Ready to build
- [x] ReviewerQA: Security/quality concerns addressed
