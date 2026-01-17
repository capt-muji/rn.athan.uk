# ADR-003: Prayer Explanation Modal Removal

**Status:** Accepted  
**Date:** 2026-01-17  
**Decision Makers:** User (product owner)

---

## Context

The app currently includes a modal (`ModalTimesExplained.tsx`) that displays explanations for all 5 Extra prayers (Midnight, Last Third, Suhoor, Duha, Istijaba) when the user first visits Page 2 (Extras). The modal:

1. Triggers automatically on first visit to Page 2
2. Displays all 5 explanations in a list
3. Has a 5-second enforced reading period (close button disabled)
4. Persists state `popup_times_explained_enabled` in MMKV (0=never shown, 1=show, 2=closed forever)
5. Once closed (state 2), can never be reopened

**Problem Identified:**
- User research/observation shows users immediately close the modal without reading
- The modal interrupts the user experience
- No way to reopen it means users who accidentally closed it are stuck
- Showing all explanations at once is overwhelming

## Decision

**Remove the ModalTimesExplained modal entirely and replace it with contextual explanations shown one-at-a-time in the Overlay when a user taps on a specific prayer.**

Implementation approach:
1. When user taps an Extra prayer, open the Overlay (existing behavior)
2. Add explanation text below the prayer row in the Overlay
3. Explanation appears only for the tapped prayer
4. Standard prayers (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) show no explanation text
5. Delete ModalTimesExplained component and remove its trigger from Navigation.tsx
6. Remove or deprecate `popup_times_explained_enabled` MMKV storage key

## Consequences

### Positive
- Users see explanations contextually, one at a time
- No modal interrupting the experience
- Users can access explanations for any prayer, any time
- Simpler codebase (one less modal component)
- Removes persistent state that served no purpose

### Negative
- Users must tap on a prayer to see its explanation
- No way to see all explanations at once (some discoverability loss)
- First-time users won't see explanations unless they tap prayers

### Neutral
- MMKV key `popup_times_explained_enabled` will exist but be unused (or removed)
- Prayer row becomes slightly more complex in the Overlay
- Users who expected the modal may be confused initially

## Alternatives Considered

### Alternative 1: Keep Modal + Add Info Icon
**Description:** Add an info icon on Page 2 that reopens the modal on demand.

**Pros:**
- Users can see all explanations at once if they want
- No loss of discoverability
- Modal serves as reference

**Cons:**
- Still shows overwhelming list of 5 explanations
- Users still likely ignore/close it immediately
- More UI elements to maintain

**Why Rejected:** Doesn't solve the core problem—users don't read modal content.

### Alternative 2: Expandable Prayer Rows
**Description:** Make prayer rows expandable (tap to expand, showing explanation inline).

**Pros:**
- Explanations visible in context
- No full-screen overlay needed
- Can see multiple explanations at once

**Cons:**
- Significant UI refactor to prayer rows
- More complex touch interactions
- May clutter the prayer list view
- Inconsistent with existing tap behavior (which opens overlay)

**Why Rejected:** Too invasive—would require changing the prayer row component and existing tap patterns.

### Alternative 3: Help/FAQ Section
**Description:** Add a dedicated help section or FAQ screen with all explanations.

**Pros:**
- Comprehensive reference available
- Can include more detailed information

**Cons:**
- Requires new screen navigation
- Users unlikely to seek out help sections
- Same discoverability problem as modal

**Why Rejected:** Out of scope—adds complexity for marginal benefit.

## Implementation Notes

- Add `PRAYER_EXPLANATIONS` constant to `shared/constants.ts`
- Modify `Overlay.tsx` to conditionally render explanation text:
  - Only for Extra prayers (scheduleType === Extra)
  - Use index-based lookup: `PRAYER_EXPLANATIONS[scheduleType][prayerIndex]`
  - Position below prayer row with `marginTop: 8`
  - Use `COLORS.textSecondary` for color
  - Use `TEXT.sizeSmall` for font size
- Remove modal trigger from `Navigation.tsx` (line ~31)
- Delete `ModalTimesExplained.tsx` component
- Keep `popupTimesExplainedAtom` in `stores/ui.ts` but don't use it (backward compatibility)
- Add accessibility label to explanation text for screen readers

## Related Decisions

- ADR-002: English midnight day boundary (superseded by prayer-based boundary)
- ADR-001: Rolling notification buffer

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-17 | User | Accepted - Replace modal with contextual overlay explanations |
