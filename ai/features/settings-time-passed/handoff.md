# Session Handoff: Settings - Show Time Passed

**Purpose:** Use this prompt to start a new session to work on this feature.

**Last Updated:** 2026-01-23

---

## Quick Start

Read ai/AGENTS.md and begin as Orchestrator.

Add a "Show time passed" toggle to Settings that controls PrayerAgo component visibility.

---

## Context

**Feature Name:** settings-time-passed
**Location:** ai/features/settings-time-passed/
**Status:** Ready for Implementation
**Priority:** Medium
**Type:** Feature

---

## Required Reading (In Order)

1. **ai/features/settings-time-passed/description.md**
   - Feature requirements and acceptance criteria

2. **ai/features/settings-time-passed/plan.md**
   - Detailed implementation tasks

3. **ai/features/settings-time-passed/progress.md**
   - Current status and task checklist

4. **ai/AGENTS.md section 4 (Task Recipes)**
   - "Add a New Setting Toggle" recipe

---

## Summary (Quick Reference)

**What We're Building:**

- New toggle: "Show time passed" in Settings
- Controls visibility of PrayerAgo component
- Enabled by default, persisted via MMKV
- 100% unit test coverage

**Key Implementation Details:**

- Use `atomWithStorageBoolean` pattern from existing atoms
- Add toggle after "Show seconds" in BottomSheetSettings
- Remove from DOM (not opacity) since PrayerAgo is last in layout

---

## Key Files Involved

- `stores/ui.ts` - Add new atom
- `components/BottomSheetSettings.tsx` - Add toggle UI
- `app/Screen.tsx` - Conditional rendering
- `stores/__tests__/ui.test.ts` - New test file

---

## Implementation Plan Overview

**Phase 1:** Add `showTimePassedAtom` to stores/ui.ts

**Phase 2:** Add SettingsToggle to BottomSheetSettings.tsx

**Phase 3:** Conditionally render PrayerAgo in Screen.tsx

**Phase 4:** Create unit tests with 100% coverage

---

## What I Need You To Do

**Step 1:** Implement all 4 phases sequentially

**Step 2:** Run `yarn validate` after implementation

**Step 3:** Update progress.md with completed tasks

---

## Expected Outcome

**Success Criteria:**

- [ ] Toggle appears in Settings after "Show seconds"
- [ ] Default state is ON (enabled)
- [ ] PrayerAgo hidden when toggle is OFF
- [ ] Setting persists across app restarts
- [ ] 100% unit test coverage
- [ ] `yarn validate` passes

---

## Start Here

Follow the plan.md phases. Use the "Add a New Setting Toggle" recipe in AGENTS.md section 4 as reference.

---

## Update Log

**2026-01-23:** Feature initialized, ready for implementation
