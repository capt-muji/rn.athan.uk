# Overlay Re-Architecture — Planning Brief (input for a dedicated design session)

> Written at the end of session 7 of the performance campaign. The owner directed
> (2026-09-06) that the re-architecture gets its OWN planning session (deep-dive,
> brainstorm, self-questioning, architectural research, bigger context window)
> and then its OWN build session — both resume from
> `ai/features/performance/progress.md` (#20). This brief is the complete input:
> goal, evidence, architecture map, constraints, and open questions. Do NOT
> implement from this file — design first, write the ADR, then build.

## 1. The owner's goal (verbatim intent, s7)

- **Eliminate the duplicated overlay tree.** Today the overlay is a full-screen
  absolutely-positioned surface that DUPLICATES the selected prayer row, the
  countdown, and the date (positioned via one-shot `measureInWindow`). The owner:
  "the crossover effect only happens because we have an overlay that sits on top…
  if we re-architected this so that we can reuse the original mainscreen with an
  overlay somehow without having to paste it on top of all the other components,
  then this issue won't happen again."
- **In-place highlight instead:** dim everything else and highlight the selected
  prayer + date + countdown IN PLACE using the existing components. The top-left
  glow + fully dark background STAY.
- **The ONE sanctioned behavior change — REMOVE THE 2s PRE-BOUNDARY LOCK** (the
  only deliberate deviation from behavior-1:1): today the overlay auto-closes
  ~2-3s before the prayer (`stores/countdown.ts` tick: `overlayMsLeft <= 3000`
  → `overlayAtom.isOn = false`) and `canShowOverlay` refuses to open inside that
  window (`timeLeft > 2`). The lock exists ONLY because animating the
  active-background move to the next prayer INSIDE the duplicated overlay tree
  was hard. With in-place components, the cascade/next-prayer transition is just
  the normal list animation the app already does. GOAL: UI stays fully consistent
  with the overlay OPEN through countdown-finish → cascade → next-prayer
  transitions: no auto-close, no open-refusal.

## 2. Parity requirements (owner, non-negotiable)

1. **1:1 behavior before/after INCLUDING performance** (3T floor device, 30fps
   floor for big animations, marks + frames + vision verification).
2. Tapping an **UPCOMING (dim) prayer** must still animate it from its dim value
   to bright white — smoothly, no jitter. (This path already exists in-place:
   `Prayer.tsx`/`Time.tsx`/`Alert.tsx` `isSelectedForOverlay` → `AnimColor.animate(1)`;
   the owner says it already feels right — generalize it.)
3. The **overlay countdown on the selected prayer at scale 1.5** survives
   (currently `Countdown.tsx` scales up 1.5 + translateY 5 when overlay is on,
   and swaps to the selected prayer's name/countdown).
4. **Z-order / hit-testing 1:1**: overlay open = full-screen press-to-close
   surface over everything except… same hierarchy as today (`OVERLAY.zindexes.overlay`,
   below popups/sheets).
5. **The underlay stays live during the fade** — no teardown jitter, no instant
   teardown during fade-in (Performance Design Rule 4: everything computed
   BEFORE an animation begins; the underlay must not visibly change state when
   the overlay opens over it).
6. Tapping an already-bright (active/next) prayer row: **it must STAY 100%** —
   no dim-to-75%-and-back crossover (the #19 defect).

## 3. Evidence — what exactly is wrong today (#19, vision-audited on the 3T)

Recording `perf12/x19/` (74 frames, open on active row → close → open on dim row).
Vision audit conclusion (crops `x19/crop_*.png`):

- **The crossover is a temporal tone change, not a visible double image.** At
  every sampled instant exactly ONE render of the row is visible, aligned (0,0).
- **Open on the active row:** at ~100ms the whole row (text + active pill +
  bell) dims uniformly to **~75%** (no pixel ≥ 200/255); at ~150ms it reads as
  *white at ~80% alpha* — bluish-lavender tint, soft halo edges, no full-white
  pixel; then it settles full-bright. Net perception: the row blinks down and
  back up with a desaturated veil — "the 100% kind of dims to 50% and then the
  overlay prayer comes in."
- **Mechanism:** the overlay's root `Reanimated.View` animates ONE opacity
  (0→1, 200ms) for the whole stack — gradient + scrim + row COPY. Mid-fade, the
  semi-transparent dark layers sit ON TOP of the still-bright original (dimming
  it) while the copy on top is also semi-transparent → the veil composite. At
  settle, the visible row is the overlay's own re-render: **pixel-identical for
  Latin text, but the Arabic re-rasterizes ~1.5px shifted and the bell icon 1px
  wider** — a faint "crawl"/flicker on those elements.
- **Close:** symmetric dip (~80%) then pixel-perfect return of the original
  (XOR 3-19px — the original was never unmounted).
- **Dim-row open (Asr):** smooth monotonic text rise 87→254 over ~150ms, NO dip
  — the in-place `AnimColor` path is already correct. (Numbers: `x19` Dhuhr band
  mean 74.2→55.7→72.1 on open; text max 255→190→254; settled overlay differs
  from pre-tap: 72.1/254 vs 74.2/255 — the "different shade".)

Supporting campaign numbers: overlay JS commit now **61-89ms** after #17's
derived-atom fix (was 168-203); first-open animation 60fps after #11's
pre-mounted subtree + display:none latch; `measureInWindow` one-shot at load
(List.tsx:38, Day.tsx:33 — owner REJECTED press-time re-measure, s6 lesson).

## 4. Current architecture map (everything the overlay touches)

### Store / logic
- `stores/atoms/overlay.ts` — `overlayAtom {isOn, selectedPrayerIndex, scheduleType}`;
  s7 added derived `overlayIsOnAtom` + `getOverlaySelectedAtom(type,index)` (module-cached).
- `stores/overlay.ts` — `toggleOverlay(force?)` (perf marks overlay_open_start/close_start;
  guards via `canShowOverlay`: `timeLeft > 2` — **THE OPEN-REFUSAL HALF OF THE LOCK**),
  `setSelectedPrayerIndex(type, index)` (also guarded by canShowOverlay).
- `stores/countdown.ts` — overlay countdown atom (on-demand ticker started on
  open / reset on close), `overlayCountdownNameAtom`/`overlayCountdownDisplayAtom`
  derived display atoms; sequence-ticker tick() **auto-closes** when
  `overlayMsLeft <= 3000` (`stores/countdown.ts:218-224`) — **THE AUTO-CLOSE HALF
  OF THE LOCK**.
- `stores/ui.ts` — `measurementsListAtom` / `measurementsDateAtom` (PageCoordinates
  from one-shot measureInWindow), sheet/haptic wiring n/a.

### Components
- `components/overlay/Overlay.tsx` — THE DUPLICATED TREE: full-screen absolute
  container, one fade opacity for everything; pre-mounted + `display:none` while
  closed (#11 pattern — keep the warm-but-idle-cheap principle in whatever
  replaces it); positions: countdown at `insets.top + SCREEN.paddingTop`, date at
  `measurementsDate` (top/left), prayer row COPY at
  `measurementsList.pageY + index*STYLES.prayer.height`, width `measurementsList.width`;
  extras info box (`PrayerExplanation`) below/above the row; LinearGradient
  (zIndex −1) + `Glow` (top-left, window-anchored).
- `components/prayer/Prayer.tsx`, `Time.tsx`, `Alert.tsx` — each takes `isOverlay`
  prop (overlay copy renders with next-occurrence semantics for passed prayers
  via `usePrayer(..., true)`); each ALSO subscribes to the derived
  selected-atom to animate bright in the MAIN list when tapped.
- `components/countdown/Countdown.tsx` — swaps name/display to the overlay
  countdown atoms + scales 1.5/translates when `overlayIsOn` (the scale-1.5 hero).
- `components/countdown/Bar.tsx` + `components/prayer/Ago.tsx` — fade OUT when
  overlayIsOn (opacity → 0).
- `components/prayer/List.tsx:38` + `components/day/Day.tsx:33` — the one-shot
  measureInWindow feeds the overlay's absolute positioning.
- `app/index.tsx` — renders `<Overlay />` after `<Navigation />`.

### Tests
- `stores/__tests__/overlay.test.ts`, `stores/__tests__/countdown.test.ts`
  (auto-close + on-demand ticker behavior — WILL CHANGE with the lock removal),
  `shared/__tests__` countdown display contract.

## 5. Hard constraints (campaign rules, all device-verified)

- **3T-only testing** (3T_SERIAL); Release builds gate-ON; Metro is env-blind
  (cache + generated bundle delete on toggles); first post-install launch
  discarded (dexopt); jest 928+/928 + biome + tsc green every iteration.
- **Performance Design Rules** (ai/AGENTS.md §Performance): 30fps floor; animated
  geometry static-in-render or first-eval-snapped (the Toggle/SegmentedControl
  pattern); NO post-paint initialization of visible state (no mount-time visual
  settling — owner rule 2026-09-02); everything an animation reveals pre-mounted
  and pre-computed BEFORE the animation begins; render-granular primitive
  subscriptions; never animate Yoga layout props per frame for sub-pixel deltas;
  gate invisible work.
- **MeasureInWindow is one-shot load-time only** (owner-rejected press-time
  re-measure — s6). An in-place design should need it LESS or not at all — a
  plus, not a requirement.
- **No @expo/ui in app UI** (F.9); Reanimated 4.5.1 idioms; jotai derived atoms
  for any new overlay-dependent render state (see #17's win).
- iOS: same code paths; owner eyeballs smoothness (3T is the verification bar).

## 6. Design directions to explore (not exhaustive — the planning session's job)

- **Scrim + in-place highlight**: a full-screen press-to-close scrim (dark,
  animatable opacity) UNDER/over the content EXCEPT the selected row; the
  selected row (Prayer/Time/Alert already animate to bright via
  `isSelectedForOverlay`) stays live in the list. Countdown hero + date animate
  in place (scale/brightness) rather than being duplicated. Key trick to design:
  how to dim "everything else" without covering the selected row — options:
  per-row dimming driven by a derived atom (each row knows if it is NOT selected
  while overlay is on), scrim with a cutout (hard on Android), or dimming at the
  container level with the selected row re-rendered above the scrim via z-order
  elevation (Native hierarchy, not a duplicate tree).
- **Cascade-through-open**: with the lock removed, the countdown-finish →
  next-prayer transition must run its normal list animation WHILE the overlay is
  open: the highlight moves to the next row (the dim→bright path), the countdown
  retargets, the date rolls. Design how `nextPrayerIndex` changes propagate
  through the in-place highlight + what the scrim does during the swap.
- **The scale-1.5 countdown**: today the hero Countdown transforms itself —
  decide whether the in-place countdown keeps a transform-based emphasis or
  re-lays-out larger (transform preferred — no Yoga churn; Rule 6).
- **Overlay countdown semantics**: today the overlay shows the SELECTED prayer's
  countdown (own ticker/atoms) while the main hero shows the NEXT prayer's —
  with an open overlay these differ. Preserve: selected-prayer countdown while
  open; on close return to next-prayer hero. At the boundary (lock removed):
  the selected prayer BECOMES the next prayer — the swap must be seamless.
- **Hit-testing**: press-anywhere-to-close over everything except the selected
  row (tapping the selected row itself — what does it do today? verify; probably
  also closes via the backdrop behind it — preserve exact behavior).
- **Underlay liveness**: rule 5 — during open fade, the underlying list must not
  re-layout or teardown. An in-place design satisfies this by construction, but
  VERIFY the fade doesn't trigger list re-renders that shift anything.

## 7. Verification protocol for the build session (parity bar)

1. jest suite green (update overlay/countdown tests for the lock removal —
   auto-close and open-refusal tests must be REMOVED/inverted deliberately).
2. Marks: overlay_open/overlay_open_start/overlay_close stay; overlay_open
   should stay in the 61-89ms family or better.
3. Frames on the 3T (screenrecord pts + vision): open on ACTIVE row — the row's
   text/active-bg must NOT dip below its pre-tap brightness at ANY frame (the
   #19 crossover signature must be ABSENT); open on DIM row — smooth monotonic
   rise (match x19 evidence shape); close — no dip; all at the 30fps floor.
4. **Boundary crossing with the overlay open** (owner-required): with mock data
   ~2min before a prayer boundary (resting state Dhuhr +157m; use
   `mocks/simple.ts` offsets), overlay open on the upcoming prayer, record
   THROUGH the boundary: countdown finish → highlight cascade to next prayer →
   date roll, all with the overlay still open, vision-audited for consistency.
5. Z-order/hit-testing parity: sheets/popups over overlay; press-to-close
   everywhere; BACK behavior unchanged (BACK with overlay open closes the
   overlay? verify current behavior and preserve).
6. Idle cost with overlay closed: zero overlay-driven renders (the #3/#11 idle
   win must survive — pre-mount or equivalent).
7. The 2s lock: gone (no auto-close, no open-refusal inside the window).

## 8. Session logistics

- Planning session: read this file + `ai/features/performance/progress.md` +
  `ai/AGENTS.md` §Performance Design Rules + ADR-013; research (Reanimated
  z-order/elevation patterns, scrim-with-hole precedents, RN Android elevation
  behavior); write the ADR draft (ai/adr/0NN-overlay-in-place.md); enumerate the
  diff plan file-by-file; define the parity test list. NO implementation.
- Build session: implement per ADR, iterate with the §7 protocol, update
  progress.md #20 at every milestone. Performance testing CONTINUES DURING the
  re-architecture (owner directive — perf-test as you build).
