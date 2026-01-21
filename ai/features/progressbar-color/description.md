# Feature: progressbar-color

**Status:** Draft  
**Author:** User  
**Date:** 2026-01-21  
**Specialist:** Architect

---

## Overview

Allow users to customize the color of the countdown progress bar via a full color picker in the settings bottom sheet. Currently the progress bar color is hardcoded to cyan, so this feature adds user preference for personalization.

## Goals

- [ ] Add color picker option in settings bottom sheet
- [ ] Persist color preference to MMKV (key: `preference_progressbar_color`)
- [ ] Apply selected color to ALL progress bars (both Standard and Extra schedules)
- [ ] Add reset button to restore default cyan color
- [ ] Install necessary color picker package

## Non-Goals

- Different colors for Standard vs Extra schedules
- Opacity/transparency controls
- Multiple progress bar colors per prayer
- Gradient or multi-color progress bars

## User Stories

### Story 1: Change Progress Bar Color
**As a** user who wants to customize the app appearance  
**I want** to select a custom color for the progress bar  
**So that** the app matches my personal style preferences

**Acceptance Criteria:**
- [ ] Color picker is accessible from settings bottom sheet
- [ ] Selecting a color immediately updates the progress bar color
- [ ] Color preference persists across app restarts
- [ ] Default color is cyan

### Story 2: Reset to Default
**As a** user who changed the progress bar color  
**I want** to reset the color back to default  
**So that** I can easily restore the original cyan color

**Acceptance Criteria:**
- [ ] Reset button/icon appears near the color picker
- [ ] Tapping reset restores cyan color
- [ ] Reset works immediately without app restart

## Technical Design

### Data Flow

User taps settings → Opens settings bottom sheet → Taps color option → Opens color picker → Selects color → Color saved to MMKV → ProgressBar components read preference and apply color

### Components Affected
| Component | Change Type | Description |
|-----------|-------------|-------------|
| `components/ProgressBar.tsx` | Modified | Accept color prop from preference |
| `components/BottomSheetSettings.tsx` | Modified | Add color picker option |
| New: ColorPicker component | New | Wrapper for color picker package |
| `stores/ui.ts` | Modified | Add progressbarColor atom with atomWithStorage |
| MMKV database | Modified | New key: `preference_progressbar_color` |

### State Changes
- New state/atoms: `progressbarColor` atom (string - hex color)
- Modified state: None
- Storage keys: `preference_progressbar_color` (string, default: cyan)

### API Changes
- No API changes - all local storage

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| App first launch | Progress bar uses default cyan (no preference saved yet) |
| Invalid color value in storage | Fallback to default cyan |
| User cancels color picker | Previous color remains unchanged |
| Color picker package fails to load | Show error, progress bar uses last valid color or default |

## Error Handling

| Error Condition | User Message | Recovery |
|----------------|--------------|----------|
| Color picker not available | "Color picker unavailable. Using default color." | Progress bar shows cyan |
| Invalid color in storage | None (silent recovery) | Use default cyan |

## Testing Plan

### Unit Tests
- [ ] Color atom saves and retrieves correctly
- [ ] Reset function restores default

### Integration Tests
- [ ] Color picker UI appears and is functional
- [ ] Progress bar updates immediately on color change
- [ ] Color persists after app restart

### E2E Tests
- [ ] User flow: Open settings → Change color → Verify change → Reset → Verify reset

## Rollout Plan

### Phase 1: Development
- [ ] Install color picker package
- [ ] Add progressbarColor atom to stores/ui.ts
- [ ] Create ColorPicker component or integrate into settings
- [ ] Update ProgressBar.tsx to use color preference
- [ ] Update BottomSheetSettings.tsx with color option and reset button
- [ ] Test all edge cases

### Phase 2: Review
- [ ] Code review
- [ ] QA verification
- [ ] Test on iOS and Android

### Phase 3: Release
- [ ] Deploy to staging
- [ ] Deploy to production

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Color picker package has issues | Low | Medium | Test thoroughly, have fallback UI |
| Performance impact from color state | Low | Low | Use Jotai atoms, minimal re-renders |

## Open Questions

- [ ] Which color picker package to use? (User approved installing packages)

---

## Approval

- [ ] Architect: Approved design
- [ ] Implementer: Ready to build
- [ ] ReviewerQA: Security/quality concerns addressed
