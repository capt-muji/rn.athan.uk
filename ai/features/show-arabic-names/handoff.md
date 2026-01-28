# Session Handoff: Show Arabic Names

**Purpose:** Use this prompt to start a new session to work on this feature.

**Last Updated:** 2026-01-23

---

## Quick Start

Read ai/AGENTS.md and begin as Orchestrator.

Add a settings toggle "Show arabic names" (default ON) to control Arabic prayer name visibility.

---

## Context

**Feature Name:** Show Arabic Names
**Location:** ai/features/show-arabic-names/
**Status:** Ready for Implementation
**Priority:** Medium
**Type:** Feature

---

## Required Reading (In Order)

1. **ai/features/show-arabic-names/description.md**
   - User requirements and acceptance criteria

2. **ai/features/show-arabic-names/plan.md**
   - Implementation approach with 4 tasks

3. **ai/features/show-arabic-names/progress.md**
   - Current status and task checklist

4. **ai/AGENTS.md section 4 (Golden Paths)**
   - Task recipe: "Add a New Setting Toggle"

---

## Summary (Quick Reference)

**What We're Building:**

- Settings toggle: "Show arabic names"
- Default: ON (enabled)
- Hides Arabic names in prayer lists when OFF
- Must work in both main list and overlay

**Key Implementation Detail:**

- Use empty string, NOT conditional rendering
- This preserves `flex: 1` layout and prevents misalignment

---

## Key Files Involved

- `stores/ui.ts` - Add atom
- `components/Prayer.tsx` - Conditionally show Arabic
- `components/BottomSheetSettings.tsx` - Add toggle

---

## Implementation Plan Overview

**Task 1:** Add `showArabicNamesAtom` to stores/ui.ts

**Task 2:** Update Prayer.tsx to use atom

**Task 3:** Add toggle to BottomSheetSettings.tsx

**Task 4:** Manual testing

---

## What I Need You To Do

**Step 1:** Read plan.md and progress.md

**Step 2:** Execute tasks sequentially (1 through 4)

**Step 3:** Update progress.md after each task

**Step 4:** Run `yarn validate` after code changes

---

## Critical Constraints

1. **Use empty string, not conditional rendering** - Preserves layout
2. **Default must be true** - Arabic visible by default
3. **Must work on branch:** unit_testing_from_settings_athan

---

## Expected Outcome

**Success Criteria:**

- [ ] Toggle appears in settings after "Show time passed"
- [ ] Default is ON
- [ ] Toggle OFF hides Arabic in all lists
- [ ] Overlay respects setting immediately
- [ ] No layout shift or misalignment
- [ ] Setting persists

---

## Start Here

Begin by reading plan.md, then execute tasks 1-4 sequentially.

---

## Update Log

**2026-01-23:** Feature initialized, plan created
