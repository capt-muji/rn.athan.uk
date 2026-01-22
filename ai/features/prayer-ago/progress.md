# Feature: prayer-ago

**Status:** 📝 Ready for Implementation
**Created:** 2026-01-22
**Specialist:** Architect → Implementer

---

## Links

- **Description:** [description.md](./description.md)
- **Plan:** [plan.md](./plan.md)
- **Handoff:** [handoff.md](./handoff.md)

---

## Progress

### Phase 1: Planning

- [x] Feature structure created
- [x] Plan.md created by Architect
- [x] Plan reviewed by 5 perspectives (Security 24/25, Performance 15/25, Accessibility 14/25, Edge Cases 14/25, Maintainability 19/25)
- [x] Plan updated with user feedback:
  - Format: "Just now" (<1min), "Xm ago" (1-59min), "Xh Ym ago" (1+ hours)
  - Update interval: 60 seconds (matches minute boundaries)
  - Added accessibility attributes (aria-live, accessibilityLabel)
  - No explicit guards needed (correct logic handles edge cases)
- [x] ReviewerQA approval: **100/100**

### Phase 2: Implementation

- [ ] Task 1: Add `formatTimeAgo` utility to shared/time.ts
- [ ] Task 2: Create `usePrayerAgo` hook (60s interval)
- [ ] Task 3: Modify PrayerTime to show "ago" for passed prayers + accessibility
- [ ] Task 4: Visual verification

### Phase 3: Verification

- [ ] All tests pass (manual only per spec)
- [ ] No lint/type errors
- [ ] Feature reviewed by ReviewerQA

---

## Notes

**Display format:** "Just now" (<1min) → "Xm ago" (1-59min) → "Xh Ym ago" (1+ hours)
**Update interval:** 60 seconds (text only changes at minute boundaries)
**Accessibility:** aria-live="polite", accessibilityLabel (invisible, no visual change)
