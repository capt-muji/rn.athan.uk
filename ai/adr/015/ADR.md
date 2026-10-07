# ADR-015: Overlay animation from derived state

**Status:** Accepted
**Current as of:** 2026-10-07 (1.29.265)
**Contract:** `ai/features/overlay/spec.md` is the source of truth for behaviour, timings, failure history and lessons. This file records the decision and what it rejected.

## Decision

Keep the in-place overlay of ADR-014. Replace how it animates and how it opens and closes.

1. Every overlay-visible attribute derives in render from atoms, through the `useDerived*` hooks in `hooks/useAnimation.ts`. The hooks snap on mount and on return to the foreground. No effect writes an animation target on the overlay path.
2. Only `openOverlay`, `closeOverlay` and `checkOverlayBoundary` write `isOn`.
3. The overlay closes at a wall-clock deadline, 2 seconds before its schedule's next boundary. Opening is refused inside that window.
4. Visuals do not change. The durations from before this ADR stay: 150 ms for a selection, 1000 ms for the next-prayer advance and the date-roll cascade.

## Alternatives rejected

| Alternative | Why it lost |
| --- | --- |
| Return to the duplicated overlay drawn on top | It brings back the brightness dip and a third timer. |
| A root overlay that renders the content once and hides the pager | Still two instances, and hiding the pager breaks the live underlay during the fade. |
| Keep the effects and re-issue them on resume | It fixes the instance, not the class. |
| A separate overlay route | It rebuilds transitions, back handling and positioning for no gain in correctness. |

## Not converted

The countdown bar's width and warning colour still animate from an effect (`components/countdown/Bar.tsx`). They are not overlay-visible, and every tick re-issues them.
