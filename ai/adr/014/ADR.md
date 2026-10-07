# ADR-014: In-place overlay

**Status:** Superseded by ADR-015 (2026-09-10) for animation and lifecycle. The in-place structure below still ships.
**Current as of:** 2026-10-07 (1.29.265)

## What it decided (2026-09-06)

The overlay stops drawing copies of the selected row, the countdown and the date over the page. It highlights the real components in place. That removed the brightness dip two cross-fading copies produced.

The terms the source comments use:

| Term | Meaning |
| --- | --- |
| Per-element veil | No layer sits over the content. Each non-selected row, the active pill, the page chrome and the Masjid fade themselves. |
| Veil backdrop | `VeilBackdrop`: the overlay gradient and glow, drawn behind the content. |
| Press-catcher | Four regions around the selected row that close the overlay. The row itself stays tappable (`catcherGeometry.ts`). |
| Overlay-aware date and time | A passed selection shows its next occurrence in `Day` and `Time`. |
| Countdown merge | While the overlay is open, the schedule's own countdown atom carries the selected prayer's countdown. No overlay timer or overlay countdown atom exists. |

## What replaced the rest

| Part of this ADR | What happened to it |
| --- | --- |
| A veil cut into bands with holes | The owner rejected any cutout during the build. The per-element veil shipped instead. |
| Effect-driven animation state | Replaced by derived state (ADR-015). |
| No 2 second lock, with the selection following the next prayer | The 2 second rule returned with ADR-015. The overlay closes at the boundary. |
| Back press left unhandled | Back closes the overlay. |

The current contract is `ai/features/overlay/spec.md`.
