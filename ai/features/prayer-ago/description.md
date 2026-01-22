# Feature: prayer-ago

**Status:** In Review
**Author:** User
**Date:** 2026-01-22
**Specialist:** Architect → Implementer
**Testing:** Manual only (user will verify visually)
**Visual Design:** Delegated to Sisyphus (frontend-ui-ux-engineer as needed)

---

## Overview

Display a relative time indicator showing how long ago a prayer passed (e.g., "Asr 4m ago"). This provides quick context for users viewing prayer times after a prayer has completed.

## Goals

- [x] Show "X ago" text for prayers that have passed
- [x] Display in the countdown component area
- [x] Update in real-time as time elapses
- [x] Visually integrate with existing countdown design
- [x] Handle edge cases (midnight boundary, day change)

## Non-Goals

- No notifications for passed prayers
- No historical prayer tracking beyond "X ago" display
- No user settings for this feature (always visible when applicable)

## User Stories

### Story 1: View Time Since Last Prayer

**As a** user who just opened the app  
**I want** to see how long ago the last prayer was  
**So that** I know if I'm catching up or missed it

**Acceptance Criteria:**

- [ ] For passed prayers, display "PrayerName Xm ago" (e.g., "Asr 4m ago")
- [ ] For upcoming prayers, show standard countdown
- [ ] "Xm ago" updates in real-time as minutes pass

### Story 2: Visual Integration

**As a** user  
**I want** the "X ago" indicator to blend with the existing countdown design  
**So that** the UI remains clean and readable

**Acceptance Criteria:**

- [ ] Visual style matches existing countdown component
- [ ] Placed logically in the prayer row or countdown area
- [ ] No clutter or visual noise

---

## Technical Design

### Data Flow

```
Prayer Time (stored) → Current Time → Calculate Difference → Display "X ago"
```

### Components Affected

| Component                  | Change Type | Description                          |
| -------------------------- | ----------- | ------------------------------------ |
| `components/Prayer.tsx`    | Modified    | Add "ago" display for passed prayers |
| `components/Countdown.tsx` | Modified    | Integrate "ago" visual               |
| `shared/time.ts`           | Modified    | Add relative time formatting utility |

### State Changes

- No new atoms needed - computed from existing prayer times
- Time calculation runs on each render/tick

### API Changes

- None

---

## Edge Cases

| Scenario                    | Expected Behavior                |
| --------------------------- | -------------------------------- |
| Prayer passed 1+ hours ago  | Show "1h ago" or "2h ago" format |
| Midnight boundary crossing  | Still calculates correctly       |
| Day change (after Isha)     | Shows correct time since prayer  |
| Very recent prayer (<1 min) | Show "Just now" or "0m ago"      |

---

## Error Handling

| Error Condition          | User Message                    | Recovery         |
| ------------------------ | ------------------------------- | ---------------- |
| Invalid time calculation | Fall back to standard countdown | No visible error |

---

## Testing Plan

**Testing Strategy:** Manual verification only

- [ ] User verifies "X ago" displays correctly after prayer passes
- [ ] User verifies formatting (minutes vs hours)
- [ ] User verifies visual integration
- [ ] User verifies no performance impact on countdown

---

## Rollout Plan

### Phase 1: Development

- [ ] Implement relative time calculation utility
- [ ] Add "ago" display to Prayer component
- [ ] Integrate visual design

### Phase 2: Review

- [ ] Code review
- [ ] User manual verification
- [ ] Visual review

### Phase 3: Release

- [ ] Deploy to staging (if applicable)
- [ ] Deploy to production

---

## Risks & Mitigations

| Risk                                 | Likelihood | Impact | Mitigation                       |
| ------------------------------------ | ---------- | ------ | -------------------------------- |
| Performance impact on countdown tick | Low        | Medium | Memoize calculation, use useMemo |
| Edge case with time formatting       | Low        | Low    | Comprehensive format function    |

---

## Open Questions

- [ ] None - visual design delegated to implementer

---

## Approval

- [ ] Architect: Pending plan approval
- [ ] Implementer: Ready to build
- [ ] ReviewerQA: Pending
