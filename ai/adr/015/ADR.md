# ADR-015: Overlay Re-Architecture — Derived State, Wall-Clock Close, No Lasting Animation State

**Status:** Accepted
**Date:** 2026-09-10
**Decision Makers:** <user> (owner), build session
**Supersedes:** ADR-014 implementation (in-place concept retained; animation mechanism replaced)
**Source of truth:** `ai/features/overlay/spec.md`

---

## Context

ADR-014 replaced the duplicated on-top overlay with an in-place highlight
(per-element veils, one merged countdown). It eliminated the #19 crossover and
cut render cost, but it produced a three-session tail of resume and boundary
visual bugs: stranded veils, a bright non-selected row, two bright rows, an
empty pill, a dim just-passed row, a stranded pill slide, and a stale countdown
bar.

Each was patched with another band-aid: `refreshUI` re-fire effects, a
per-second bar re-issue, selection-aware colour writes, and a reintroduced 2
second lock. The owner lost confidence in the structure and granted a full gut
and rewrite.

The root cause is not the in-place geometry. It is that animation state lives
in Reanimated shared values written imperatively from `useEffect`. A write
dropped during a suspend never re-fires when its boolean dependency does not
change again. The two overlay-path components that derive their style from
atoms instead (`Countdown` scale, `Ago` fade) never appeared in the bug list.
The codebase already ships the correct pattern in `Toggle` and
`SegmentedControl`: a derived value that re-runs on every relevant render and
converges on the current target.

## Decision

Keep the in-place concept. Replace the entire animation and lifecycle
mechanism.

1. **Pixels are a function of state.** Every overlay-visible attribute derives
   in render from atoms. Animation is a derived effect that owns no lasting
   state, implemented with `useDerivedValue` plus `useAnimatedStyle`, first-eval
   snap, and snap-on-resume. All effect-driven animation writes on the overlay
   path are deleted.
2. **Explicit lifecycle.** `isOn` is written by `openOverlay`, `closeOverlay`,
   and the boundary check `checkOverlayBoundary`. Nothing else writes it. The
   open state changes on the owner's tap, app close, and the 2 second rule only,
   plus a defensive pager-settle self-heal that the `scrollEnabled` gate makes
   unreachable in normal use.
3. **Wall-clock close deadline.** `boundaryMs` is the schedule's next-prayer
   instant captured at open and refreshed each foreground tick. The overlay
   closes when `Date.now() >= boundaryMs - 2000`. It is enforced in the ticker
   and as the first action of the foreground handler before `sync()`, so a
   suspended crossing is caught deterministically instead of relying on a stale
   derived atom. The rule is schedule scoped (Standard to Standard, Extras to
   Extras).
4. **Exact-millisecond open guard.** Opening is refused when the true remaining
   milliseconds to the next prayer are 2000 or fewer, replacing the coarse
   displayed-atom read that could allow an open inside the final 2 seconds.
5. **Resume counter.** A monotonic counter bumps on every foreground transition
   and is a dependency of every derived worklet, so each re-runs and snaps on
   resume even when its target is unchanged.
6. **Pixel parity is a hard requirement.** Business logic and styling stay
   identical, including the platform-specific shadows. Only the mechanism
   changes.
7. **Accessibility.** Non-selected rows are hidden from the screen reader while
   the overlay is open.

The full contract and visual spec live in `ai/features/overlay/spec.md`.

## Consequences

### Positive

- The dropped-write and stranded-state class is removed by construction: there
  is no animation state to strand.
- Resume from background, lock, or app switch is inert unless the boundary
  elapsed.
- The overlay open state has one documented set of writers and one documented
  set of triggers.
- The perf campaign's wins are retained (in-place, two countdown timers,
  render-granular atoms, idle gate).
- The pattern is already proven in the repo, so no new architecture is
  introduced.

### Negative

- Every animated element subscribes to the resume counter and re-renders once
  per foreground.
- The rewrite touches roughly a dozen files and needs full device
  re-verification.
- A genuinely stranded value visibly converges once, though the model aims to
  make that impossible.

### Neutral

- ADR-013's pre-mount plus `display:none` latch is retained, with a resume
  reconciliation.
- The countdown merge (page atom carries the selected target while open) is
  retained for the hero display; the close uses its own deadline.

## Alternatives Considered

### Alternative 1: Revert to the pre-ADR-014 on-top duplicated overlay

**Description:** Restore the copy tree, the separate `overlayCountdownAtom`, and
the third timer.
**Pros:** The owner trusts the old look. Fewer moving parts.
**Cons:** Reintroduces the #19 crossover. Brings back the third timer and
reverts validated pixel parity and the countdown merge. A large surgical revert
across many later commits.
**Why Rejected:** It restores a known visual defect and loses the perf work,
while the current defects are sync defects, not geometry defects.

### Alternative 2: Root-level on-top overlay rendering the content once

**Description:** A root overlay renders the real components; the pager hides
while open.
**Pros:** No crossover by construction.
**Cons:** Still two component instances. Hiding the pager breaks the
"underlay stays live during the fade" rule. The list-to-overlay swap at open
and close is where #19 lives.
**Why Rejected:** Not actually free of duplication, and its hard part is the
part that previously failed.

### Alternative 3: Keep effects, add one resync version atom

**Description:** Keep the effect-driven writes and re-issue them on AppState
active.
**Pros:** Smallest diff.
**Cons:** A band-aid on the same failing class. Does not fix one-shot effects
outside resume. Invites a fourth patch session.
**Why Rejected:** Fixing the instance, not the class.

### Alternative 4: Dedicated overlay route

**Description:** An Expo Router modal sharing the prayer atoms.
**Pros:** No in-place mutation.
**Cons:** Rebuilds transition choreography, back semantics, and positioning.
No perf gain. Largest change.
**Why Rejected:** High risk for no correctness advantage over derived in-place.

## Implementation Notes

- Derived helpers live in `hooks/useAnimation.ts`.
- Store changes: `stores/overlay.ts`, `stores/countdown.ts`,
  `stores/atoms/overlay.ts`, `stores/ui.ts`, `device/listeners.ts`.
- Component changes: `components/prayer/*`, `components/overlay/*`,
  `components/day/Day.tsx`, `components/countdown/*`, `app/Navigation.tsx`.
- `isOn` writers: `openOverlay`, `closeOverlay`, and `checkOverlayBoundary`
  (`stores/countdown.ts`, kept there to avoid the store cycle). Nothing else.
- Preserve the exact animation durations and the platform shadow split.
- Version bump: minor.

## Related Decisions

- ADR-013: pre-mounted overlay, first-frame-settled animation (retained).
- ADR-014: in-place overlay (concept retained, mechanism superseded).

---

## Implementation Outcome

**Shipped 2026-09-10 on `feat/overlay-rewrite`, version 1.24.0.**

- Derived hooks added to `hooks/useAnimation.ts`; the legacy effect-driven
  colour/fill/background/translate/bounce hooks were removed.
- `stores/overlay.ts` rewritten around `openOverlay`/`closeOverlay` with the
  exact-millisecond guard. `stores/countdown.ts` owns the wall-clock deadline
  (`armOverlayBoundary`/`clearOverlayBoundary`/`checkOverlayBoundary`).
  `stores/ui.ts` exposes the `resyncAtom` counter; `device/listeners.ts`
  enforces the boundary and bumps the counter before `sync()`.
- Every overlay-path animator converted: `Prayer`, `Time`, `Alert`,
  `ActiveBackground`, `Day`, `VeilBackdrop`, `Overlay`, `Navigation` chrome,
  `Countdown` hero, `Bar` visibility, `Ago` overlay fade. Non-selected rows
  hide from the screen reader while open.
- `yarn validate` green (964 tests). Owner approved the iPhone XS build.
- Bring-up lesson: the first device build aborted at the first target change
  because the derived worklet passed an explicit `easing: undefined` to
  `withTiming`. Omitted-key fix, rebuild, then stable. See the spec's durable
  lessons.
- Deliberately deferred to a follow-up (separate branch): convert the Bar's
  width/warning, Ago's recent colour, and the Navigation dots to the derived
  model, and review the `resyncAtom` name and scope. They are not
  overlay-visible and self-heal per tick or are user-driven, so they do not
  block this ADR.

---

## Revision History

| Date | Author | Change |
| --- | --- | --- |
| 2026-09-10 | build session | Initial draft, accepted |
