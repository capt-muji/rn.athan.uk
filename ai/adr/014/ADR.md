# ADR-014: Overlay Re-Architecture — In-Place Highlight with Veil-with-Holes

**Status:** Superseded by [ADR-015](../015/ADR.md) (2026-09-10). The in-place concept is retained; the animation/lifecycle mechanism was replaced after a tail of resume and boundary bugs traced to effect-driven animation state. The text below is kept for history.

**Original status:** Implemented — per the **per-element variant** (see [Implementation Outcome](#implementation-outcome)); the bands/veilGeometry design below was superseded mid-build after owner review. The decision STRUCTURE (in-place content, lock removal, selection-follows-next-prayer, VeilBackdrop, hit-test matrix, parity checklist) shipped as designed.
**Date:** 2026-09-06
**Decision Makers:** <user> (owner directive #20), performance campaign session 8 (planning)
**Input:** `ai/features/performance/overlay-rearchitecture-brief.md`, #19 vision-audited evidence (`perf12/x19`)
**Builds on:** ADR-013 (pre-mount + `display:none` latch pattern — RETAINED verbatim)

---

## Context

The overlay duplicates the selected prayer row, hero countdown, and date as absolutely-positioned COPIES over a single fading stack. Session 7's vision-audited evidence (#19) proved the structural defect: mid-fade the semi-transparent veil dims the still-bright original row to ~75% while the copy on top is also semi-transparent (the crossover: bluish veil, Arabic/bell re-rasterization crawl, symmetric dip on close), and the settled copy renders a subtly different shade than the original. A single fade opacity over a duplicated tree cannot avoid the dip; tearing the underlay down mid-fade would violate the underlay-liveness constraint.

The owner directed: eliminate the duplicated tree, highlight IN PLACE using the original components (top-left glow + fully dark background stay), keep z-order/hit-testing 1:1, keep the underlay live during fades, and REMOVE the 2s pre-boundary lock (the ONE sanctioned behavior deviation) so the UI stays fully consistent with the overlay open through countdown-finish → cascade → next-prayer transitions.

Platform research (verified this session):

- RN `zIndex`/`elevation` reorder **siblings only** — the row (nested in `PagerView > Screen > List`) cannot be lifted above a root-level scrim without re-parenting/portal tricks, which is the duplication the owner rejected.
- Scrim-with-cutout option space: MaskedView (perf-heavy; animating the mask is compositor-hostile), `react-native-hole-view` (new native dependency — violates zero-new-patterns), or **sibling rect composition** (pure Views + one opacity — Reanimated-cheap, zero deps). Rect composition is chosen.
- The overlay gradient is OPAQUE (`COLORS.gradient.overlay`: `#110022` → `#000000`) — the settled underlay is invisible today; "underlay stays live" is a fade-window constraint, which the in-place design satisfies trivially.

## Candidates evaluated

1. **Per-element dimming** — fade `BackgroundGradients` out + dark gradient in *behind* content; every non-selected element animates its own dim (~10 components: 12 rows × 3 sub-components, ActiveBackground special-case, location label, Masjid, dots, settings button). REJECTED: diffuse touch surface (miss one element = settled-state inconsistency), approximate look (per-element transparency ≠ uniform veil), more per-element render work per toggle, pill needs a new derived atom.
2. **Veil-with-holes (CHOSEN)** — one root layer keeps the veil look; static holes reveal the in-place content.
3. **Composite-fix the duplicate** (matched crossfade / hide-underlay-at-crossover). REJECTED by #19 evidence: either the dip remains or the underlay tears down mid-fade (Rule 4/5 violation).

## Decision

### 1. Architecture — veil-with-holes

`components/overlay/Overlay.tsx` keeps its exact deployment: root sibling after `Navigation`, `zIndex: OVERLAY.zindexes.overlay` (2, below sheets' popup z 1000), pre-mounted subtree + `display:none`-while-closed latch + deferred hide past the close fade (ADR-013, unchanged). What changes is its CONTENT — no duplicated content components. The layer renders only:

1. **Banded veil** — the SAME `LinearGradient` (`COLORS.gradient.overlay`, opaque) decomposed into ≤6 maximal rects with three static holes:
   - **HERO hole**: full-width, `y ∈ [0, heroBottom + pad]`. `heroBottom = insets.top + SCREEN.paddingTop + STYLES.countdown.height` + margins + a scale-1.5 bleed pad — all constants; identical to the old copy's anchor math.
   - **DATE hole**: `measurementsDate` rect + pad (existing one-shot `measureInWindow`). Reveals ONLY the date text — the location label ("London, UK") and Masjid icon stay veiled (today they sit under the opaque gradient too).
   - **ROW hole**: `measurementsList.pageY + selectedPrayerIndex · STYLES.prayer.height(57)`, width = `measurementsList.width` + pad — EXACTLY the old copy's positioning math and numbers.

   Each rect renders its slice of the gradient via `locations` mapped to the rect's global y-fraction — the composite is one continuous ramp, no seams. Geometry is computed synchronously in render (Rule 2: static-in-render), swaps instantly on selection change (matches today's instant copy move), never animates position (Rule 6). Pure helper `buildVeilRects(...)` — unit-testable.

2. **Glow** — unchanged (top-left, window-anchored, above the bands).

3. **PrayerExplanation** (extras info box) — unchanged code and positioning; it is overlay-ONLY UI like the veil itself, not duplication.

4. **Press-catcher** — replaces the `flex:1` Pressable with 4 regions around the row rect (top band / bottom band / left sliver / right sliver — same geometry source as the row hole): press → haptic + `toggleOverlay()`. The row rect itself is NOT covered.

All visible content is the REAL in-place tree, which is ALREADY overlay-aware:

- **Prayer/Time/Alert** brighten via `getOverlaySelectedAtom` (s7) — untouched.
- **ActiveBackground pill**: revealed free when the selected row IS the next prayer (it lives inside the row's hole); veiled otherwise — no new code.
- **Countdown hero**: already swaps to `overlayCountdown*` atoms + scales 1.5/translates when `overlayIsOn` — untouched.
- **Bar / Ago**: already fade out on `overlayIsOn` — untouched.
- **Day date**: NEW overlay-awareness — content = (overlay on && `overlay.scheduleType === type`) ? selected prayer's date (next-occurrence semantics, `usePrayer(type, index, true)`) : `displayDate`; color animates `text.primary → text.secondary` on the existing `durationVeryFast` overlay pattern. The real date replaces the old date copy (which also removes the date's own double-exposure).
- **Time**: NEW passed-selection semantics — when its row is overlay-selected AND passed, display the next occurrence's time (what the old copy showed via `usePrayer(isOverlay)`). Implement as a second `usePrayer(type, index, true)` call and pick by state (hooks stay unconditional).

### 2. Animation choreography (open/close)

- **OPEN on an already-bright (active/next) row**: layer opacity 0→1 (200ms, one opacity for veil+glow+explanation — the existing `backgroundOpacity`), hero scales 1→1.5 + swaps atoms, date swaps/colors, Bar/Ago fade out. The row is NEVER veiled (hole) → **bright-row-stays-bright is structural; the #19 dip signature cannot occur**.
- **OPEN on a dim (upcoming) row**: identical, plus the row's existing `AnimColor.animate(1)` (`durationVeryFast`) → monotonic rise matching x19's clean 87→254 shape (the owner already approves this path's feel).
- **CLOSE**: layer opacity 1→0 + latch-hide after `ANIMATION.duration`; row deselects to natural color, hero descales, date reverts, Bar/Ago return. Hole areas are untouched by the fade → **no close dip** (today's symmetric ~80% dip is gone).
- **Underlay liveness**: nothing below the layer unmounts, re-layouts, or tears down at any point (Rules 4/5) — the in-place tree merely re-colors. First-open layout (`display:none → flex`) lands in the tap→commit window before any visible frame, per ADR-013.

### 3. Boundary crossing (the 2s-lock removal — the sanctioned deviation)

- DELETE `canShowOverlay`'s `timeLeft > 2` check (and the guard calls in `toggleOverlay`/`setSelectedPrayerIndex`) → no open-refusal.
- DELETE the sequence-ticker auto-close block (`stores/countdown.ts` `overlayMsLeft <= 3000`).
- REPLACE with **selection-follows-next-prayer**: in the sequence ticker's boundary branch (after `refreshSequence` + restart), if the overlay is open on this schedule AND `selectedPrayerIndex ===` the index of the prayer that just passed → advance the selection to the new next prayer's index (direct `overlayAtom` write + `startCountdownOverlay()` — both already importable in `countdown.ts`; no new import cycles). Consequences, all consistent:
  - The veil's row hole jumps to the next row; that row rises bright (the dim-row-rises path replaying); the just-passed row de-selects to its natural passed-bright state.
  - The pill performs its normal elastic cascade (veiled mid-travel — CLOSER to today's overlay-open look, where it is fully hidden under the opaque gradient).
  - The overlay countdown retargets to the new next prayer ≡ the sequence countdown; the transient hold-at-1s (≤1 tick) matches the sequence countdown's own boundary hold (display contract preserved).
  - Overlay open on a DIFFERENT prayer when the boundary passes: nothing changes (it keeps counting its own target — existing semantics).
  - Date rolls with the new next prayer's `belongsToDate` (normal rollover logic).
- REJECTED alternative — selection sticks + retargets to tomorrow's occurrence: swaps the row time, date, AND countdown to tomorrow exactly at the cascade instant, fighting the "normal list animation" directive. (Opening on an ALREADY-passed prayer still shows tomorrow's semantics — preserved via the Time/Day changes above.)

### 4. Hit-testing / z-order (1:1 matrix — today's behavior code-verified, preserved)

| Interaction | Today (copy) | New (in-place) |
| --- | --- | --- |
| Tap veil / hero / date / any non-selected row | Pressable → close | catcher regions → close |
| Tap selected row body | copy's `handlePress` → toggle close | real row `handlePress` → toggle close |
| Tap bell on selected row | copy's Alert → alert sheet over overlay (z 1000) | real Alert → same sheet |
| Swipe pager while open | blocked (layer covers) | blocked (catcher covers) |
| BACK while open (no sheet) | unhandled → exits app | unchanged (no handler) |
| Sheets / popups over overlay | z 1000 / native above z 2 | same (layer keeps the zIndex 2 slot) |
| Settings button while open | under layer, unpressable | under catcher, unpressable |
| Tap a dim row while open | veil → close (no reselect) | catcher → close (no reselect) |

### 5. measureInWindow

Survives unchanged: `List.tsx` / `Day.tsx` one-shot load-time measurements + the countdownBar-shown re-measure now feed the row hole / date hole instead of copy positioning — the exact same numbers and math. One NEW static input: the hero-hole bottom (constants only). No new measurements, no press-time re-measure (owner s6 rule). The brief's "need it less = a plus" is not achieved, but the accuracy envelope is identical to today's copy positioning.

### 6. Diff plan (file-by-file)

1. `components/overlay/Overlay.tsx` — rewrite per architecture: remove Countdown/Prayer/date copies and their imports; add `buildVeilRects` + ≤6 gradient rects + 4 catcher Pressables; keep container, latch, marks, haptic, Glow, Explanation. Optionally extract `components/overlay/veilGeometry.ts` (pure, unit-testable).
2. `components/day/Day.tsx` — overlay-aware date (content + color swap; gate on `overlay.scheduleType === type`).
3. `components/prayer/Time.tsx` — passed-selection next-occurrence time (dual `usePrayer`, pick by state).
4. `components/prayer/Prayer.tsx` + `components/prayer/Alert.tsx` — remove now-dead `isOverlay` prop plumbing.
5. `stores/overlay.ts` — delete `canShowOverlay` + both guard calls.
6. `stores/countdown.ts` — delete the auto-close block; add the boundary selection-advance.
7. `stores/__tests__/overlay.test.ts` — delete the refusal specs (toggle: "prevents opening ≤2s", "prevents opening 1s", "allows opening >2s"; selection: "prevents selection ≤2s"); retained specs still pass (closing-always-allowed, all-passed-opens — for new reasons; rename describes accordingly).
8. `stores/__tests__/countdown.test.ts` — add advance specs (advance-when-selected-passes, untouched-when-other-selection, retargeted overlay countdown values); the hold-at-1s spec stays (now the pre-advance transient).
9. `ai/features/performance/progress.md` — #20 milestone tracking.

No changes: `Countdown.tsx`, `Bar.tsx`, `Ago.tsx`, Prayer's selection effects, `app/index.tsx`, `stores/atoms/overlay.ts`, `shared/constants.ts` (OVERLAY z-indexes reused), List/Day measurement code.

### 7. Parity verification checklist (build session — 3T-only, Release, gate-ON)

1. jest green (updated suites); `tsc --noEmit` + biome clean.
2. Marks: `overlay_open` stays in the 61-89ms family (open commit ≈ layer + Day + row selection renders — compare against today's copy render).
3. Frames + vision (`e2e/scripts/frame-audit.sh` + vision subagent): open on ACTIVE row — row text/active-bg NEVER below pre-tap brightness in any frame (#19 signature absent); open on DIM row — monotonic rise (x19 shape); close — no dip; all at the 30fps floor.
4. **Boundary recording** (mock offsets ~2min before a boundary): overlay open on the next prayer, record THROUGH countdown-finish → advance (hole jump + row rise) → pill cascade → countdown retarget; vision-audit for consistency; repeat for the Isha→Fajr date-roll case.
5. Hit-test matrix (§4) executed on-device.
6. Idle gate: overlay closed → zero overlay-driven renders/traversals in atrace; overlay ticker off when closed (#3/#11 win preserved).
7. Lock gone: opening at 1-2s pre-boundary succeeds; no auto-close through the boundary.
8. Gradient seam audit (bands compose to one continuous ramp); hole padding vision-tuned.
9. iOS: owner eyeball (same code paths; the 3T is the bar).

## Consequences

- The #19 crossover class is structurally eliminated (no duplicated content; holes never veil the row) — including the close-side dip and the settled "different shade" artifact.
- Overlay code shrinks: the copies and their positioning go away; overlay-specific passed-prayer semantics move into Time/Day where the data already lives.
- The 2s lock is gone; the overlay rides the cascade (selection-follows-next-prayer is the normative boundary semantic — reuse for any future overlay-like surface).
- Band geometry depends on the existing one-shot measurements (accepted; accuracy envelope identical to today's copy positioning).
- ADR-013's Overlay pattern (pre-mount + `display:none` + deferred hide) continues unchanged — now with near-zero content of its own.

---

## Implementation Outcome

**Shipped 2026-09-06, sessions 9-11 (1.19.0 baseline + s10 queue; owner-confirmed smooth + pixel-parity).**

**Architecture pivot (session 9→10):** build 14 shipped the bands-with-holes variant; the owner
rejected ANY cutout mechanism ("still uses a cutout approach"). The pivot: **per-element fades** —
no layer over content at all. Non-selected rows fade via schedule-gated
`getOverlayHiddenAtom(type,index)` (module-cached; the off-screen page stays cold; the selected
row's hidden state never flips), the ActiveBackground pill fades when its row ≠ selected, and
dots+settings+RamadanDecorations fade via one chrome opacity; Day's Masjid fades.
**VeilBackdrop STAYS unchanged** (it is what puts surviving content on the veil gradient in
BOTH designs), as do the box-none catcher (4 regions, row-exempt — catcherGeometry.ts) and the
pager `scrollEnabled` gate. The bands/veilGeometry hole logic was deleted.

**Boundary semantics (as designed):** the ≤2s lock is gone; selection-follows-next-prayer rides
the cascade. Session 10 additionally landed the **countdown merge**: the sequence ticker writes
`overlay-open ? selectedTarget : next` directly into the page countdown atom
(`writeDisplayCountdown` — instant writes on open/selection/advance/close; hold-at-1s via the
ceil clamp; boundary detection always on the true next prayer); the `overlayCountdownAtom`
family and Countdown.tsx's dual subscription are deleted — exactly **2 countdown timers** in
the app, open or closed.

**Parity verification (3T, Release, gate-ON; §7 checklist):**
1. jest 931/931, tsc + biome clean. ✅
2. Marks in the post-s9 band (open 183-215ms / close 254ms) — mark semantics = commit-time
   instrument; frame evidence is the arbiter (session 9 lesson, holds). ✅
3. Frames + vision: #19 dip ABSENT (row 255 every frame on active-row open); open/close 60fps
   cadence (15-18ms); settled-frame side-by-side vs the ORIGINAL = parity achieved
   (hero XOR 0.19%, pill/veil/glow identical; the only deltas are the three owner-sanctioned:
   location added, date white, date position unchanged). ✅
4. Boundary recordings (s10.2): mid-day Dhuhr→Asr (atomic hero swap, single-pill 150px slide,
   0.87s at 60fps, 1s hold never 0s); open-tween/cascade collision (tap at ~1.3s pre-boundary —
   no refusal — boundary 0.33s later mid-tween: all 121 frames one coherent state); Isha→Fajr
   date-roll (hero+date atomic same-frame swap, pill flight row 6→row 1, 0.82s). ✅
5. Hit-test matrix executed on-device (session 10). ✅
6. Idle gate: overlay closed = zero overlay-driven renders (0 measure/layout; traversals only
   the per-second countdown-text family); overlay OPEN ≡ closed cadence — the merge adds no
   timer. ✅
7. Lock gone: verified in 4 above (no auto-close, no open-refusal). ✅
8. Superseded with the bands (no gradient seams exist in the per-element design). n/a
9. iOS rebuilt (Release, gate-ON, 2026-09-06); owner eyeball = acceptance gate (row-shadow
   question pre-answered in code: `ActiveBackground` carries `SHADOW.prayer`/`COLORS.shadow.*`
   natively). ⏳ owner pass pending at time of writing.
