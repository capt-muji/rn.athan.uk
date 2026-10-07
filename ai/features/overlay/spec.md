# Overlay: behaviour and architecture spec

The contract the overlay follows. Business logic and visuals are fixed. The implementation may
change. Architecture decision: `ai/adr/015/ADR.md`.

## 0. Purpose

The overlay is the large display view for visually impaired users. It shows one prayer, as large and
legible as possible, with everything else removed.

## 1. List without the overlay

| Prayer state | Colour | Active pill |
| --- | --- | --- |
| Passed | Bright | No |
| Next | Bright | Yes |
| Upcoming | Dim | No |

At a prayer boundary the next prayer advances and the list plays its cascade.

## 2. Overlay open

The prayer item is the unit: English name, Arabic name, alert icon, time.

| Element | Rule |
| --- | --- |
| Selected item | always bright white, whatever its state in the list |
| Active pill | on the selected item only when it is the next prayer |
| Every other row | fully hidden, and hidden from the screen reader |
| Chrome that stays | the hero countdown at scale 1.5 showing the selected prayer, the date, the gradient, the glow, and the explanation box on Extras |
| Passed selection | the hero countdown and the time column show its next occurrence |

## 3. Close contract

`isOn` changes on these triggers and nothing else.

| # | Trigger |
| --- | --- |
| 1 | A tap anywhere except the bell. A tap on the selected row also closes |
| 2 | The Android back press. It closes the overlay and does not leave the app |
| 3 | The app is closed. The state is in memory only, so a cold start is closed |
| 4 | The 2 second rule |
| 5 | Self-heal: a pager swipe that settles on the other schedule while the overlay is open |

### 3.1 The 2 second rule

- The overlay closes when its schedule's next boundary is within 2 seconds or has passed.
- The boundary is that schedule's next readable prayer, or 00:00 London ending a list on screen that
  waits for its day to end (`getNextBoundary`). The list never changes day under an open overlay.
- The rule is scoped to the schedule the overlay opened on. Standard and Extras never close each
  other.
- The target is the soonest boundary on that page, not the selected row.
- The rule is enforced by wall clock. It wins after a background or a locked screen: the resume path
  evaluates it first.

## 4. Resume contract

| Case | Result |
| --- | --- |
| Return with the deadline not elapsed | the overlay stays open, the selection and the pill stay, nothing moves |
| Return with the deadline elapsed | the overlay closes |
| Any resume | nothing re-selects, re-measures or animates a state change; a value caught up on foreground snaps |

JS timers and Reanimated's mapper loop stop in the background on both platforms. The design is
instant catch up on foreground, never background ticking. On `active` the foreground handler runs,
in this order:

1. `checkOverlayBoundary` (the 2 second rule).
2. `resyncCountdowns` (recompute the countdown atoms and catch up a boundary crossed while suspended).
3. `bumpResync` (every derived animation re-runs and snaps).

Continuous background ticking is ruled out for good. A foreground service or a background audio
keep-alive with no matching feature breaks store policy on both platforms. Revisit only if the
platform constraints change.

## 5. Hit testing

| Region | Behaviour |
| --- | --- |
| Whole screen except the selected row | the press catcher closes the overlay |
| Selected row | tappable; a tap closes the overlay |
| Bell | opens the alert sheet and does not close the overlay |
| Pager | disabled while the overlay is open (`scrollEnabled={!overlayIsOn}`) |

## 6. Visual and animation spec

Pixel parity with the shipped overlay is required. A rewrite may change who owns animation state.
It reproduces these values exactly.

| Transition | Duration and easing |
| --- | --- |
| Overlay layer and veil fade | `ANIMATION.duration` (200ms) |
| Row selection colour | `ANIMATION.durationFade` (150ms) |
| Row veil fade | `ANIMATION.duration` (200ms) |
| Hero scale and translate | Reanimated default timing |
| Pill slide | `ANIMATION.durationSlow` (1000ms), `Easing.elastic(0.5)` |
| Chrome and Masjid veil | `ANIMATION.duration` (200ms) |
| Countdown bar fade | `ANIMATION.duration` (200ms), `Easing.linear` |
| Ago fade | `ANIMATION.durationFade` (150ms) |
| Row colour on next-prayer advance | `ANIMATION.durationSlow` (1000ms) |
| Date roll cascade | `ANIMATION.durationSlow` (1000ms), delayed by `getCascadeDelay(index, type)` per row |

Platform styling differs on purpose. iOS uses the view shadow. Android API 29 and above uses
`boxShadow` on the pill view. API 28 and below has none. Do not unify them.

## 7. Architecture

| # | Rule | Where |
| --- | --- | --- |
| 7.1 | One source of truth: `overlayAtom { isOn, selectedPrayerIndex, scheduleType }`, in memory. Derived atoms expose primitives, so a toggle re-renders only the rows whose state flipped | `stores/atoms/overlay.ts` |
| 7.2 | Pixels are a function of state. Every overlay-visible attribute derives in render from atoms through the `useDerived*` hooks. Animation owns no lasting state | `hooks/useAnimation.ts` |
| 7.3 | The close deadline is absolute: the boundary in milliseconds, captured at open and refreshed on every tick, enforced when `Date.now() >= boundaryMs - OVERLAY.closeWindowMs` | `stores/countdown.ts` |
| 7.4 | `isOn` is written by `openOverlay`, `closeOverlay` and `checkOverlayBoundary` only. The open guard refuses when the true remaining milliseconds to the boundary are 2000 or fewer, never the coarse displayed atom | `stores/overlay.ts`, `stores/countdown.ts` |
| 7.5 | `resyncAtom` bumps on every foreground transition. `useDerivedProgress` reads it inside its worklet, so a value caught up on foreground snaps instead of animating | `stores/ui.ts` |
| 7.6 | The overlay layer keeps the ADR-013 pre-mount and `display:none` latch. The latch reconciles to `isOn` on resume | `components/overlay/Overlay.tsx` |

`checkOverlayBoundary` lives in the countdown store to avoid a store cycle. Open with
`openOverlay(type, index)` and an index chosen at the call site: `toggleOverlay(true)` would reuse a
stale row.

## 8. Rules that came out of the failures

The earlier effect-driven model kept animation state in shared values written by `useEffect`. A
write dropped during a suspend never fired again. Every rule below closes that class.

| Rule | Symptom it prevents |
| --- | --- |
| Animation never holds state that can outlive its trigger | stranded veils, rows hidden while the overlay is closed, an empty pill |
| One derived target per row, and it includes selection | two bright rows, a just-passed row going dim |
| Any clock read that feeds a `<` or `>` prayer comparison keeps sub-second precision | a just-passed row going dim |
| The open guard reads true remaining milliseconds | open, then an instant close |
| The display latch reconciles on resume | the overlay vanishing on return |
| Recompute and snap on foreground; never rely on background ticking | the countdown bar animating a slow catch up |
| Merge into the existing write path before adding a second atom or timer that mirrors one | two timers that disagree |
| Never pass `easing: undefined` to `withTiming`; omit the key | "undefined is not a function" on the first non-snap evaluation |
| Reanimated pushes a style or prop only when its mapper computes a changed value | nothing in app code re-applies an unchanged value |
| On native, `useAnimatedStyle` and `useAnimatedProps` ignore their dependency argument | a dependency array that does nothing |
| `SharedValue.modify()` fires the mapper chain but does not guarantee `updateProps` | treat it as necessary and not sufficient |
| Keep Reanimated at 4.5.3 or later | a stale settled-props snapshot committed after resume on Android (upstream reanimated#9574, fixed by its pull request 9527) |

## 9. Verification

- `yarn validate` passes.
- Functional, on a Release build: open a non-next row, background and return; lock and unlock; cross
  a boundary on Standard, then on Extras; an open refused inside 2 seconds; rapid toggle; the bell
  opens the sheet; back closes; process kill.
- Visual: settled frames side by side against the previous build, then the owner's eye on the
  physical phone. Diff settled frames only.
