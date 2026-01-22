# Feature: Progress Bar Toggle

**Status:** Complete
**Date:** 2026-01-16

---

## Overview

Allow users to tap the countdown countdown to toggle the progress bar visibility with a smooth fade animation. Progress bar is visible by default and preference persists across app restarts.

## Goals

- [x] Tap countdown to toggle progress bar visibility
- [x] Smooth 250ms fade animation
- [x] Persist preference across app restarts
- [x] No layout shift when hidden (use opacity, not DOM removal)
- [x] Medium haptic feedback (matches alert icons)
- [x] Overlay countdown behavior unchanged (no toggle)

## Non-Goals

- Settings menu toggle (tap-only interaction)
- Different animation styles
- Per-schedule visibility preferences

## Technical Design

### Tappable Area
- Entire Countdown component (prayer name label, time display, progress bar)
- Disabled when overlay is active

### State Management
- `progressBarVisibleAtom` (boolean) - stored in MMKV as `preference_progressbar_visible`
- Default: `true` (visible)
- Location: `stores/ui.ts` (with other UI preferences)

### Animation
- **Duration:** 250ms (ANIMATION.durationMedium)
- **Method:** Opacity fade (0 ↔ 1)
- **First render:** No animation (prevents flash on app load)
- **Subsequent taps:** Smooth fade with Linear easing

### Components Modified

| File | Changes |
|------|---------|
| `stores/ui.ts` | Added `progressBarVisibleAtom` |
| `components/Countdown.tsx` | Wrapped in Pressable, added tap handler with Medium haptic |
| `components/ProgressBar.tsx` | Animate opacity based on atom, skip animation on first render |
| `shared/constants.ts` | Added `durationMedium: 250` |
| `stores/database.ts` | Added to cleanup function (commented) |

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| App restart with bar hidden | Loads hidden (opacity: 0), no flash |
| Overlay open | Tap disabled, progress bar hidden per existing logic |
| Rapid tapping | Each tap toggles state, animation interrupted smoothly |

## Verification

- [x] Default state: Visible on fresh install
- [x] Tap to hide: Fades out over 250ms
- [x] Tap to show: Fades in over 250ms
- [x] Layout stable: No shift when toggling
- [x] Persistence: Preference survives app restart
- [x] Overlay: Countdown tap disabled, overlay behavior unchanged
- [x] Haptic: Medium impact on tap
- [x] No flash: Hidden state loads instantly on restart

## Implementation Notes

- Uses `isFirstOpacityRender` ref to skip animation on initial mount
- `opacityValue` initialized based on both overlay state and preference
- Preference atom follows existing pattern (`atomWithStorageBoolean`)
- Added to README (progress bar section, MMKV table, features list)
- Added to AGENTS.md memory log
