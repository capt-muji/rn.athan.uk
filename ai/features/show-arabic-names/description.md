# Feature: Show Arabic Names

**Status:** Draft
**Author:** User
**Date:** 2026-01-23
**Specialist:** Architect

---

## Overview

Add a settings toggle "Show arabic names" that controls whether Arabic prayer names are displayed in the prayer list. Default: ON (enabled).

## Goals

- [ ] Add "Show arabic names" toggle to settings
- [ ] Toggle is ON by default
- [ ] When OFF, Arabic names are hidden from prayer list
- [ ] Overlay recalculates/re-renders when setting changes

## Non-Goals

- Not changing the Arabic data storage (constants stay the same)
- Not affecting notification text (only visual display)

## User Stories

### Story 1: Hide Arabic Names

**As a** user who prefers English-only display
**I want** to hide Arabic prayer names
**So that** I can have a cleaner, simpler interface

**Acceptance Criteria:**

- [ ] Toggle appears in settings as "Show arabic names"
- [ ] Toggle is ON by default
- [ ] When OFF, Arabic text is hidden in both Standard and Extra prayer lists
- [ ] Setting persists across app restarts

### Story 2: Overlay Synchronization

**As a** user viewing the overlay
**I want** the overlay to match the main list display
**So that** there's no visual inconsistency

**Acceptance Criteria:**

- [ ] Overlay respects the "Show arabic names" setting
- [ ] When setting changes, overlay re-renders immediately
- [ ] No misalignment between overlay and non-overlay items
- [ ] Measurements are recalculated when setting changes

## Technical Design

### Data Flow

User toggles setting → Atom updates → Components re-render → Measurements recalculate → Overlay re-positions

### Components Affected

| Component                            | Change Type | Description                          |
| ------------------------------------ | ----------- | ------------------------------------ |
| `stores/ui.ts`                       | Modified    | Add showArabicNamesAtom              |
| `components/Prayer.tsx`              | Modified    | Conditionally render Arabic text     |
| `components/BottomSheetSettings.tsx` | Modified    | Add toggle for setting               |
| `components/Overlay.tsx`             | Modified    | Force re-render when setting changes |
| `components/List.tsx`                | Modified    | Re-measure when setting changes      |

### State Changes

- New state/atoms: `showArabicNamesAtom` (boolean, default: true)
- Storage key: `preference_show_arabic_names`

### API Changes

- None (UI-only feature)

## Edge Cases

| Scenario                  | Expected Behavior                                 |
| ------------------------- | ------------------------------------------------- |
| Toggle while overlay open | Overlay re-renders immediately with new layout    |
| App restart               | Setting persists, Arabic hidden/shown accordingly |
| Toggle rapidly            | No visual glitches or stale measurements          |

## Error Handling

| Error Condition | User Message | Recovery |
| --------------- | ------------ | -------- |
| None expected   | N/A          | N/A      |

## Testing Plan

### Unit Tests

- [ ] Atom default value is true
- [ ] Atom persists to MMKV storage

### Manual Tests

- [ ] Toggle ON: Arabic names visible in both lists
- [ ] Toggle OFF: Arabic names hidden in both lists
- [ ] Overlay: Matches main list display
- [ ] No misalignment when toggling
- [ ] Setting persists after app restart

## Rollout Plan

### Phase 1: Development

- [ ] Add atom to stores/ui.ts
- [ ] Update Prayer.tsx to conditionally render
- [ ] Add toggle to BottomSheetSettings.tsx
- [ ] Handle overlay measurement recalculation
- [ ] Manual testing

### Phase 2: Review

- [ ] Code review
- [ ] Verify no regressions

## Risks & Mitigations

| Risk                       | Likelihood | Impact | Mitigation                                |
| -------------------------- | ---------- | ------ | ----------------------------------------- |
| Overlay misalignment       | Medium     | High   | Force measurement recalculation on toggle |
| Layout shift during toggle | Low        | Medium | Ensure smooth transition                  |

## Open Questions

- [x] Where should toggle appear in settings? → After "Show time passed"

---

## Approval

- [ ] Architect: Approved design
- [ ] Implementer: Ready to build
- [ ] ReviewerQA: Security/quality concerns addressed
