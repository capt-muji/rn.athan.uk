# ADR-013: Performance Architecture — Env-Gated Instrumentation, Pre-Mounted Overlay, First-Frame-Settled Animation

**Status:** Accepted
**Date:** 2026-09-06
**Decision Makers:** <user>

---

## Context

The performance campaign (`ai/features/performance/`) measured and fixed the app's render/animation behavior on the OnePlus 3T (the floor device — oldest/worst; smooth there means smooth everywhere). Three architectural decisions emerged from device-verified evidence, each preventing a class of regression:

1. **Instrumentation must be zero-cost in production** but rich enough to attribute jank (marks, measures, ring buffer) — without shipping a logging burden.
2. **The overlay (#11 regression)**: unmounting a closed subtree saved idle CPU (#3) but re-mounting it during open starved the same frames the open animation played in (113ms mid-animation freeze on the 3T). The naive fixes — always-mounted (wastes idle CPU) or fresh-mount (janky open) — form a false dichotomy.
3. **First-frame geometry (#12 pill squash, the Toggle snap rule)**: animated geometry applied only by worklets or post-paint effects first-frames at intrinsic/wrong values and visibly pops (the alert sheet's selection indicator first-frames ~2px wide for 3-5 frames on the 3T).

## Decision

### 1. Env-gated instrumentation (`shared/perf.ts`)

`EXPO_PUBLIC_PERF_MONITOR=1` gates every mark/measure call site. The gate folds statically: with the env unset the calls compile to dead code (`void 0==="1"`), so gate-OFF Release builds carry zero runtime cost and identical cold-start (verified: parity medians). With the gate on, marks flow to a 600-entry ring buffer on a dedicated `perf-monitor` MMKV instance plus single-line `PERF_MARK`/`PERF_MEASURE` pino output — the app schema is untouched. Builds are made with the env in the bundle step's environment; **Metro's transform cache is env-blind**, so toggling the env requires clearing the metro cache AND deleting the generated Android bundle (see `e2e/README.md`).

Marks measure JS-commit phases (store→effect), NOT animation quality — `overlay_open` duration and on-screen smoothness are independent axes. Frame-quality audits are the separate `e2e/scripts/frame-audit.sh` discipline (compositor timestamps + vision interpretation).

### 2. Pre-mounted, `display:none`-while-closed overlay (`components/overlay/Overlay.tsx`)

The overlay subtree (glow SVG + gradient + Countdown) stays mounted for the app's lifetime; while closed it is `display: none` (no draw, no layout, no hit-testing on both platforms) and the overlay countdown ticker stays off (on-demand since #4). A visibility latch holds the subtree displayable through the close fade-out (`setTimeout(ANIMATION.duration)`) so open/close animations stay 1:1.

This keeps BOTH wins: idle stays cold (#3's unmount-level idle CPU — the subtree is display-none, not merely transparent) AND open animations always play on an existing tree (#11's fix — verified on the 3T: first-open, first-close, steady-open, steady-close all at 60fps cadence, vision-confirmed smooth scale+fade). The one cost is first-open-in-process layout (`display:none→flex` first layout) — it lands in the tap→commit window BEFORE any visible animation frame, where the user cannot see it.

Generalized rule (owner directive): **everything an animation will reveal must already be computed and mounted before the animation begins** — warm but idle-cheap. State/subscription stays live; rendering stays silent.

### 3. First-frame-settled animation rules

- **Animated geometry must be static-in-render or first-eval-snapped — never worklet-applied-only.** Widths/positions that an animation will eventually own must exist in the synchronous style array at mount (static `width` style) or snap on the derived value's first evaluation (`useDerivedValue` returning the target without animating — the Toggle pattern). A worklet that applies the geometry asynchronously first-frames at intrinsic values and pops.
- **No post-paint initialization of visible state.** A `useEffect` setting shared values after the first paint is one frame late by construction.
- **Render-granular subscriptions (#10)**: components re-render only when a *displayed* value changes. Store tickers keep second resolution for boundary correctness, but consumers subscribe to primitive-valued derived atoms (formatted strings, quantized bar steps, boolean warning flips) — not to the per-second object atoms. An off-screen/hidden component must not re-render per second.

## Consequences

- Production carries instrumentation call sites at zero runtime cost; any future perf question is one env-flagged build away from full marks.
- The overlay pattern is the template for any future heavy always-available surface (pre-mount + display:none + deferred hide past the fade).
- SegmentedControl/Toggle/Bar/Countdown all comply with the snap rules; `SegmentedControl` keeps a `key`-driven remount per prayer so the snap re-fires when selection context changes.
- The 30fps floor for big animations (overlay, sheets, cascade, segmented selection, prayer-transition UI) is the enforcement bar; 60fps is a bonus, never required; per-second countdown text updates are exempt.
