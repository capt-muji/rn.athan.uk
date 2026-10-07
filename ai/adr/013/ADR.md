# ADR-013: Performance architecture

**Status:** Accepted
**Current as of:** 2026-10-07 (1.29.265)

These decisions back the Performance Design Rules in `ai/AGENTS.md`. The rules themselves are stated there.

## Decisions

1. **Instrumentation is gated at build time.** `EXPO_PUBLIC_PERF_MONITOR=1`, outside production, enables `shared/perf.ts`. A build without the gate pays nothing.
2. **The overlay layer is mounted once and hidden with `display: none` while closed.** A latch keeps it displayable through the close fade. Its first layout lands between the tap and the commit, before any visible frame.
3. **An animation's first frame is already settled.** Geometry an animation will own exists in the synchronous style at mount, or snaps on the derived value's first evaluation.
4. **Tick consolidation.** Exactly two per-second timers run, the two countdown tickers. Every other per-second consumer subscribes to a countdown atom and re-renders only when a displayed value changes.

## Alternatives rejected

| Alternative | Why it lost |
| --- | --- |
| Unmount the overlay while closed | Re-mounting during the open starved the frames the animation played in. It measured as a 113 ms freeze mid-animation on the slowest test phone. |
| Keep the overlay rendered and transparent | It costs idle CPU for a surface nobody sees. |
| Apply animated geometry from a worklet or a post-paint effect | The first frames show intrinsic values. A selection indicator drew about 2 px wide for 3 to 5 frames. |
