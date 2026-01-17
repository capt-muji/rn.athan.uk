# Feature: Contextual Prayer Explanations

**Status:** In Progress  
**Started:** 2026-01-17  
**Specialist:** Implementer

---

## Tasks

### Phase 1: Add Explanation Constants

- [ ] **Task 1.1:** Add PRAYER_EXPLANATIONS constant to shared/constants.ts
  - Create constant object keyed by schedule type and prayer index
  - Use exact text from ModalTimesExplained.tsx
  - Add TypeScript type for the constant

### Phase 2: Modify Overlay Component

- [ ] **Task 2.1:** Read and understand Overlay.tsx structure
  - Note: Uses cached listMeasurements for absolute positioning
  - Prayer row positioned at computedStylePrayer
  - Timer and date at top of overlay

- [ ] **Task 2.2:** Add explanation text rendering to Overlay.tsx
  - Create new View below prayer row
  - Use conditional rendering (only for Extra prayers)
  - Position: marginTop 8px from prayer row
  - Style: COLORS.textSecondary, TEXT.sizeSmall
  - Add accessibilityLabel for screen readers

- [ ] **Task 2.3:** Test manually - verify explanations appear correctly
  - Test all 5 Extra prayers
  - Verify Standard prayers show no explanation
  - Check overlay animations still work

### Phase 3: Remove Modal

- [ ] **Task 3.1:** Remove ModalTimesExplained trigger from Navigation.tsx
  - Locate trigger around line 31 in handlePageSelected
  - Remove: `if (position === 1 && getPopupTimesExplained() === 0) { setPopupTimesExplained(1); }`
  - Keep the modal import/usage for now (comment out)

- [ ] **Task 3.2:** Delete ModalTimesExplained.tsx component
  - Remove file entirely
  - Remove from any imports

- [ ] **Task 3.3:** Clean up Navigation.tsx imports
  - Remove ModalTimesExplained import

### Phase 4: Cleanup State

- [ ] **Task 4.1:** Review stores/ui.ts for popupTimesExplainedAtom
  - Keep the atom (backward compatibility with existing installs)
  - Add comment marking as deprecated
  - Don't use it in any new code

### Phase 5: Final Review

- [ ] **Task 5.1:** Run lint and format checks
  - eslint passes
  - prettier formatted

- [ ] **Task 5.2:** Manual QA verification
  - Full user flow: tap Extra prayer → see explanation → close overlay
  - Full user flow: tap Standard prayer → see overlay → no explanation
  - Verify no modal appears on Page 2 visit
  - Verify timer countdown works in overlay

- [ ] **Task 5.3:** Update AGENTS.md lessons learned
  - Add entry about feature: modal removal replaced with contextual overlay

- [ ] **Task 5.4:** Move to archive
  - Move entire folder to ai/features/archive/prayer-explanations/

---

## Notes

- **Reference:** ModalTimesExplained.tsx has exact explanation text
- **Color:** Use COLORS.textSecondary for consistency
- **Font:** Use TEXT.sizeSmall (~16px)
- **Positioning:** Explanation goes below prayer row in overlay
- **Accessibility:** Add accessibilityLabel to explanation text

## Checklist

- [x] Feature spec approved by user
- [x] ADR-003 created and accepted
- [ ] Implementation tasks defined
- [ ] Phase 1 complete
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Phase 4 complete
- [ ] Phase 5 complete
- [ ] Feature moved to archive
