# Session Handoff: First Launch Onboarding

**Purpose:** Use this prompt to start a new session to work on this feature.

**Last Updated:** 2026-01-20

---

## Quick Start

Read ai/AGENTS.md and begin as Orchestrator.

Replace the "Quick Tip" modal with an interactive first-launch overlay that guides users to tap the Masjid icon.

---

## Context

**Feature Name:** First Launch Onboarding
**Location:** ai/features/onboarding/
**Status:** Draft
**Priority:** Medium
**Type:** Feature

---

## Required Reading (In Order)

1. **ai/features/onboarding/description.md**
   - Complete feature requirements and technical design

2. **ai/features/onboarding/plan.md**
   - Detailed implementation plan (to be created by Architect)

3. **ai/features/onboarding/progress.md**
   - Current status and completed tasks

4. **ai/AGENTS.md section 11 (Memory)**
   - Entry [2026-01-20] Settings Bottom Sheet Feature (related work)
   - Look for modal/overlay patterns

5. **Relevant Components:**
   - `components/Alert.tsx` - Reference for overlay styling
   - `components/ModalTips.tsx` - Component to be removed
   - `components/Masjid.tsx` - Icon to point to
   - `hooks/useAnimation.ts` - Animation patterns

---

## Summary (Quick Reference)

**What We're Building:**
- Dark 0.3 opacity overlay on first launch
- Blue callout circle with "Open Settings" text
- Pulsing arrow pointing right toward Masjid icon
- Duplicate Masjid SVG positioned over original (tappable)
- Remove old "Quick Tip" modal

**Key Requirements:**
- Style must match existing Alert.tsx overlay pattern
- Arrow must pulse using React Native Reanimated
- Duplicate SVG must align exactly with original
- MMKV flag prevents re-showing on subsequent launches
- cleanup() function must include new MMKV key

---

## Key Files Involved

- `components/ModalTips.tsx` - Remove this component
- `components/OnboardingOverlay.tsx` - New component to create
- `components/Alert.tsx` - Reference for overlay styling
- `components/Masjid.tsx` - Target icon for guidance
- `stores/ui.ts` - Add onboarding state atom
- `stores/database.ts` - Update cleanup() function
- `app/_layout.tsx` - Replace ModalTips with OnboardingOverlay

---

## Implementation Plan Overview

**To be created by Architect agent**

---

## What I Need You To Do

**Step 1: Use Architect Agent**
- Read all documentation listed above
- Study existing Alert.tsx and ModalTips.tsx patterns
- Create detailed implementation plan in plan.md
- Break down into small tasks with clear acceptance criteria
- Include ReviewerQA checkpoints

**Step 2: Get ReviewerQA Approval**
- Submit plan to ReviewerQA
- **ONLY proceed if ReviewerQA gives 100/100**
- Fix any issues and re-submit until 100/100

**Step 3: Execute Implementation**
- Follow plan.md phases sequentially
- Update progress.md after each task
- Use Implementer specialist for code changes
- Match existing code patterns exactly

**Step 4: ReviewerQA Approval After Implementation**
- After completing implementation, switch to ReviewerQA
- Verify code consistency, quality, security
- **ONLY mark complete if ReviewerQA gives 100/100**

**Step 5: Update Documentation**
- Update progress.md with completion status
- Update ai/AGENTS.md Memory with lessons learned
- Update this handoff.md with any new findings

---

## Critical Constraints

1. **Must match existing patterns** - Study Alert.tsx, BottomSheetSettings.tsx
2. **Must use Reanimated 4** - No Animated API
3. **Must use Pino logger** - No console.log
4. **Must update cleanup()** - Include onboarding MMKV key
5. **Must use ReviewerQA 100/100 approval** after plan and implementation
6. **Must work on branch:** onboarding_from_settings_page

---

## Expected Outcome

**Success Criteria:**
- [ ] Old "Quick Tip" modal completely removed
- [ ] Onboarding overlay shows on first launch only
- [ ] Dark overlay at 0.3 opacity
- [ ] Blue callout with pulsing arrow
- [ ] Duplicate SVG positioned exactly over original
- [ ] Tapping SVG dismisses overlay and opens settings
- [ ] cleanup() includes onboarding MMKV key
- [ ] Code matches existing patterns
- [ ] ReviewerQA 100/100 approval

---

## Start Here

Begin by reading the documentation above, then use the Architect agent to create a detailed implementation plan. Proceed systematically with ReviewerQA approval.

Let me know when you've read the context and are ready to begin.

---

## Update Log

**2026-01-20:** Initial feature structure created
