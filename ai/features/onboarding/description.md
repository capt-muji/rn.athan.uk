# Feature: First Launch Onboarding

**Status:** Draft
**Author:** muji
**Date:** 2026-01-20
**Specialist:** Architect

---

## Overview

Replace the "Quick Tip" modal with an interactive onboarding overlay that guides users to tap the Masjid icon to access settings on first launch.

## Goals

- [ ] Remove the existing "Quick Tip" modal
- [ ] Implement interactive first-launch overlay guiding user to settings
- [ ] Dark overlay (0.3 opacity) covering entire screen
- [ ] Blue circular callout with pulsing arrow pointing to Masjid icon
- [ ] Duplicate Masjid SVG on overlay for interaction
- [ ] Clean dismissal when user taps the SVG
- [ ] Update cleanup() function to include new MMKV keys

## Non-Goals

- Multi-step onboarding tutorial
- Additional tips or modal popups
- Changes to settings sheet functionality

## User Stories

### Story 1: First Launch Guidance
**As a** new user
**I want** clear visual guidance to open settings
**So that** I discover how to customize the app

**Acceptance Criteria:**
- [ ] On first launch, dark overlay appears covering entire screen
- [ ] Blue circle with "Open Settings" text and pulsing arrow points to Masjid icon
- [ ] Duplicate Masjid SVG is positioned exactly over original icon
- [ ] Tapping the duplicate SVG dismisses overlay and opens settings
- [ ] Onboarding never shows again after first interaction
- [ ] Old "Quick Tip" modal is completely removed

## Technical Design

### Visual Requirements

**Dark Overlay:**
- Full screen coverage
- 0.3 opacity
- Blocks interaction with underlying UI

**Blue Callout Circle:**
- Same style as existing alert popup overlay
- Contains text: "Open Settings"
- Includes blue mini arrow pointing right toward Masjid icon
- Arrow should pulse for attention

**Duplicate Masjid SVG:**
- Positioned exactly on top of original Masjid icon
- Interactive (tappable)
- Appears as if it's the original icon

### Data Flow

1. App launches → Check MMKV for onboarding completion flag
2. If not completed → Show overlay with callout + duplicate SVG
3. User taps duplicate SVG → Set completion flag in MMKV
4. Dismiss overlay → Open settings sheet (existing behavior)
5. Future launches → Skip onboarding (flag exists)

### Components Affected

| Component | Change Type | Description |
|-----------|-------------|-------------|
| `components/ModalTips.tsx` | Remove | Delete Quick Tip modal component |
| `components/OnboardingOverlay.tsx` | New | First launch overlay with callout + duplicate SVG |
| `app/_layout.tsx` or relevant entry | Modified | Replace ModalTips with OnboardingOverlay |
| `stores/ui.ts` | Modified | Add onboarding completion state |
| `stores/database.ts` | Modified | Update cleanup() to include onboarding MMKV key |

### State Changes

**New MMKV Keys:**
- `onboarding_completed` (boolean) - Tracks if user has seen onboarding
  - Must be added to cleanup() function for dev/testing

**New Atoms:**
- `onboardingCompletedAtom` - Persisted state for onboarding completion

### Animation Requirements

- Pulsing arrow animation on blue callout
- Should use React Native Reanimated (existing pattern)
- Smooth fade-in/fade-out for overlay appearance/dismissal

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| User force-quits during onboarding | Onboarding shows again on next launch (flag not set) |
| User taps outside duplicate SVG | Nothing happens - must tap SVG to proceed |
| Settings sheet already open | Don't show onboarding (impossible on first launch) |
| Overlay active state | Ensure only duplicate SVG is tappable, not original |

## Error Handling

| Error Condition | User Message | Recovery |
|----------------|--------------|----------|
| MMKV write failure | Silent failure, show onboarding next time | Graceful degradation |

## Testing Plan

### Manual Tests
- [ ] Fresh install shows onboarding overlay
- [ ] Dark overlay at 0.3 opacity covers entire screen
- [ ] Blue callout positioned correctly relative to Masjid icon
- [ ] Arrow pulses smoothly
- [ ] Duplicate SVG positioned exactly over original
- [ ] Tapping duplicate SVG dismisses overlay
- [ ] Settings sheet opens after dismissal
- [ ] Second launch skips onboarding
- [ ] cleanup() function removes onboarding MMKV key

### ReviewerQA Criteria
- Code matches existing patterns (Alert.tsx, animations)
- No console.log statements
- Pino logger used for debugging
- Follows React Native Reanimated 4 patterns
- Component follows functional component pattern
- MMKV key properly namespaced (e.g., `preference_onboarding_completed`)

## Rollout Plan

### Phase 1: Architecture & Planning
- [ ] Create detailed implementation plan
- [ ] ReviewerQA approval (100/100)

### Phase 2: Implementation
- [ ] Remove ModalTips component and references
- [ ] Create OnboardingOverlay component
- [ ] Add MMKV state management
- [ ] Implement pulsing arrow animation
- [ ] Position duplicate SVG
- [ ] Update cleanup() function

### Phase 3: Review & QA
- [ ] Code review for consistency
- [ ] ReviewerQA 100/100 approval
- [ ] Manual testing on fresh install

### Phase 4: Cleanup
- [ ] Remove any debug logging
- [ ] Clean up unused imports
- [ ] Update documentation if needed

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SVG positioning incorrect on different screen sizes | Medium | High | Use absolute positioning with layout measurements |
| Animation performance issues | Low | Medium | Use worklets, profile with Reanimated profiler |
| Overlay blocks emergency app interaction | Low | Low | Ensure overlay can be dismissed easily |

## Open Questions

- [ ] Should we use existing Alert.tsx component as base for callout?
- [ ] Should arrow pulse continuously or limited cycles?
- [ ] Exact positioning strategy for duplicate SVG (useLayout, absolute positioning)?
- [ ] Should we add analytics/logging for onboarding completion?

---

## Approval

- [ ] Architect: Approved design
- [ ] Implementer: Ready to build
- [ ] ReviewerQA: Security/quality concerns addressed
