# Feature: Contextual Prayer Explanations

**Status:** Approved  
**Author:** User (product owner)  
**Date:** 2026-01-17  
**Specialist:** Architect  
**Related ADR:** ADR-003 (Prayer Explanation Modal Removal)

---

## Overview

Replace the `ModalTimesExplained` modal (which shows all prayer explanations at once) with contextual text that appears in the **Overlay** when a user taps on a specific prayer. This provides one-at-a-time explanations that users are more likely to read.

## Goals

- [x] Users can access prayer explanations by tapping on the prayer
- [x] Explanations appear contextually, one at a time
- [x] Existing overlay behavior is preserved (timer, countdown, etc.)
- [x] Modal is fully removed (no modal state persistence)
- [x] No regression in Standard prayer behavior

## Non-Goals

- Does NOT add inline expandable text within prayer rows
- Does NOT add new screens or navigation patterns
- Does NOT change notification behavior
- Does NOT modify prayer data or calculations

## User Stories

### Story 1: Extra Prayer Explanation
**As a** user viewing Page 2 (Extras)  
**I want** to tap on a prayer and see what it means  
**So that** I understand the special prayer times

**Acceptance Criteria:**
- [x] Tapping any Extra prayer (Midnight, Last Third, Suhoor, Duha, Istijaba) opens the Overlay
- [x] Overlay displays explanation text below the prayer row
- [x] Explanation text matches the existing modal exactly
- [x] Tapping outside overlay closes it (existing behavior)

### Story 2: Standard Prayer Behavior
**As a** user viewing Page 1 (Standard)  
**I want** to tap on prayers and see the countdown timer  
**So that** I can check prayer times without interruptions

**Acceptance Criteria:**
- [x] Tapping Standard prayers (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) opens the Overlay
- [x] Overlay shows timer countdown (existing behavior)
- [x] No explanation text appears for Standard prayers

### Story 3: Modal Removal
**As a** user  
**I want** the modal to never appear again  
**So that** I'm not interrupted with information I don't read

**Acceptance Criteria:**
- [x] Modal is removed from the app
- [x] No popup state is persisted to storage
- [x] No modal trigger exists in Navigation.tsx

## Technical Design

### Data Flow

```
User taps prayer
    ↓
Prayer.handlePress() [existing]
    ↓
overlayAtom updates (selectedPrayerIndex, scheduleType)
    ↓
Overlay.tsx renders
    ├─ Timer (existing)
    ├─ Prayer row (existing)
    └─ ExplanationText (NEW - conditional on Extra prayers)
```

### Components Affected

| Component | Change Type | Description |
|-----------|-------------|-------------|
| `components/Overlay.tsx` | Modified | Add explanation text rendering |
| `components/Prayer.tsx` | No change | Tap handler already opens overlay |
| `app/Navigation.tsx` | Modified | Remove ModalTimesExplained trigger |
| `components/ModalTimesExplained.tsx` | Deleted | Remove modal component |
| `stores/ui.ts` | Modified | Keep popupTimesExplainedAtom (deprecated) |
| `shared/constants.ts` | Modified | Add PRAYER_EXPLANATIONS constant |

### State Changes

- **New state:** None (reuse existing overlay state)
- **Modified state:** None (overlay already tracks selected prayer)
- **Storage keys to remove:** `popup_times_explained_enabled` (eventually, or mark deprecated)

### Explanation Text

| Prayer | Explanation |
|--------|-------------|
| Midnight | Midpoint between Magrib and Fajr |
| Last Third | 5 mins after the last third of the night begins |
| Duha | 20 mins after Sunrise |
| Suhoor | 40 mins before Fajr |
| Istijaba | 59 mins before Magrib (Fridays) |

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Tapping Sunrise | Opens overlay, no explanation text |
| Tapping passed Istijaba | Overlay doesn't open (existing behavior) |
| Tapping prayers on "Tomorrow" page | Explanation shows for that prayer's tomorrow time |
| Screen reader users | Explanation has accessibilityLabel announcing text |
| Small screen devices | Text wraps, overlay maintains touch target |

## Testing Plan

### Unit Tests
- [ ] Explanation lookup returns correct text for each Extra prayer index
- [ ] Standard prayers return null for explanation

### Integration Tests
- [ ] Tapping Extra prayer shows explanation in overlay
- [ ] Tapping Standard prayer shows no explanation
- [ ] Modal trigger no longer fires on Page 2 visit

### Manual Tests
- [ ] All 5 Extra prayers show correct explanations
- [ ] All 6 Standard prayers show no explanations
- [ ] Overlay opens/closes correctly for all prayers
- [ ] Timer countdown works correctly in overlay
- [ ] Visual design matches app's text hierarchy

## Files Reference

### To Modify
- `components/Overlay.tsx` - Add explanation text rendering
- `app/Navigation.tsx` - Remove modal trigger (line ~31)
- `shared/constants.ts` - Add PRAYER_EXPLANATIONS

### To Delete
- `components/ModalTimesExplained.tsx` - Modal component

### To Deprecate (keep but unused)
- `stores/ui.ts` - popupTimesExplainedAtom

## Open Questions (Resolved)

- **Sunrise explanation?** User confirmed no text needed
- **Modal fate?** Full removal approved
- **Standard prayers?** Show overlay, no explanation text
- **Explanation text?** Match existing modal exactly

## Approval

- [x] Architect: Approved design
- [x] ReviewerQA: QA review completed, concerns addressed
- [x] ADR: ADR-003 created and accepted
