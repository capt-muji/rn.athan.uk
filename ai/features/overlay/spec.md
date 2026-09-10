# Overlay Behaviour & Architecture Spec

> Canonical source of truth for the Athan overlay. Written from the owner's own
> words (2026-09 session) so a future re-architecture starts here instead of
> re-deriving the contract. Business logic and visuals are fixed; the
> implementation may change.
>
> Architecture decision: `ai/adr/015/ADR.md`. Supersedes the implementation
> notes in `ai/adr/014/ADR.md`.

## 0. Purpose

The overlay is the large-display accessibility view for visually impaired
users. Every rule below serves that: one prayer, made as large and legible as
possible, with everything else removed.

## 1. Non-overlay list (unchanged)

| Prayer state | Colour | Active pill |
| --- | --- | --- |
| Passed | Bright | No |
| Next | Bright | Yes |
| Upcoming | Dim | No |

At a prayer boundary the next prayer advances and the list plays its normal
cascade animation.

## 2. Overlay open (the row the user tapped, on the page they are on)

- The selected prayer item is always bright white, whatever its non-overlay
  state. A passed selection is bright. An upcoming selection rises from dim to
  bright.
- The selected item carries the active pill only when it is the next prayer.
- Every other prayer row is fully hidden. The user sees only the selected row.
- The overlay chrome remains: the hero countdown at scale 1.5 showing the
  selected prayer, the date, the gradient, the glow, and (for extras) the
  explanation box.
- A passed selection shows its next occurrence in the hero countdown and in
  the time column.

The prayer item is the unit: English name, Arabic name, alert icon, time.

## 3. Close contract

The overlay's open state changes on exactly these triggers, and nothing else,
anywhere in the app:

1. The user taps the overlay anywhere except the bell (tapping the selected row
   also closes it).
2. The app is closed. The state is in memory only, so a cold start is closed.
3. The 2 second rule.

A defensive self-heal (section 5) also closes the overlay if a pager swipe ever
settles on the other schedule while it is open. The `scrollEnabled` gate makes
this unreachable in normal use; it exists only to prevent an overlay over the
wrong page.

### 3.1 The 2 second rule

- While the overlay is open on a schedule, it closes when that schedule's NEXT
  prayer is within 2 seconds of arriving or has already passed.
- The rule is schedule scoped. The Standard countdown closes an overlay opened
  on the Standard page. The Extras countdown closes an overlay opened on the
  Extras page. They never cross-close.
- The rule is the soonest prayer on that page, not the selected row. Selecting
  a later prayer does not change the close target.
- The rule has top priority and is enforced by wall clock, so it wins even if
  the app was backgrounded or the screen was locked when it elapsed. On resume
  the app evaluates it and closes then if it already elapsed.

## 4. Resume contract

- Foreground return with the 2 second deadline not elapsed: the overlay stays
  open, the selection stays, the pill stays correct, and nothing moves.
- Foreground return with the deadline elapsed: the overlay closes.
- No resume path re-selects, re-measures, or animates a state change.
- A write that was stranded (see section 8) snaps to the correct state in the
  first visible frame.

This holds for: minimise and return, switch away and return, lock and unlock,
and any combination.

## 5. Hit testing

- The press catcher covers the whole screen except the selected row rect. Taps
  on it close the overlay.
- The selected row is directly tappable. Tapping it closes the overlay.
- The bell opens the alert sheet and does not close the overlay.
- The pager is disabled while the overlay is open.
- Self-heal both ways: if a swipe ever settles on the other schedule page while
  the overlay is open, the overlay closes rather than rendering over the wrong
  page.

## 6. Visual and animation spec

Pixel parity with the pre-rewrite overlay is required. The rewrite may change
ownership of animation state but must reproduce these values exactly.

| Transition | Duration / easing |
| --- | --- |
| Overlay layer and veil fade | `ANIMATION.duration` (200ms) |
| Row selection colour | `ANIMATION.durationFade` (150ms) |
| Row veil fade | `ANIMATION.duration` (200ms) |
| Hero scale and translate | Reanimated default timing |
| Pill slide | `ANIMATION.durationSlow` (1000ms), `Easing.elastic(0.5)` |
| Chrome and Masjid veil | `ANIMATION.duration` (200ms) |
| Countdown bar fade | `ANIMATION.duration` (200ms) |
| Ago fade | `ANIMATION.durationFade` (150ms) |
| Date roll cascade | `getCascadeDelay(index, type)` per row |

Platform styling is intentionally different and stays: iOS uses the view
shadow; Android API 29 and above uses the `boxShadow` on the pill view, API 28
and below has none. Do not unify them.

## 7. Architecture

### 7.1 One source of truth

`overlayAtom { isOn, selectedPrayerIndex, scheduleType }` is in-memory. It is
the only overlay state. Derived atoms expose primitives (is-open, per-type
active and selected index, per-row selected and hidden) so a toggle re-renders
only the rows whose state flipped.

### 7.2 Pixels are a function of state

Every overlay-visible attribute derives in render from atoms. Animation is a
derived presentation effect and owns no lasting state. There is no shared
value that can outlive its trigger and disagree with the atoms.

Implemented with `useDerivedValue` plus `useAnimatedStyle` (the pattern already
used by `Toggle` and `SegmentedControl`), with first-evaluation snap and
snap-on-resume.

### 7.3 Wall-clock close deadline

The old design detected a suspended boundary by relying on the Jotai
next-prayer atom being stale. The rewrite uses an absolute deadline:
`boundaryMs = getNextPrayer(type).datetime.getTime()` captured at open and
refreshed from the live next prayer each foreground tick. It is enforced when
`Date.now() >= boundaryMs - 2000`, in the ticker and as the first action of the
foreground handler before `sync()`. This is deterministic across suspension and
data refreshes.

### 7.4 Open and close are explicit

`isOn` is written by `openOverlay`, `closeOverlay`, and the boundary check
`checkOverlayBoundary` (which lives in the countdown store to avoid a store
cycle). Nothing else writes it. The open guard refuses when the true remaining
milliseconds to the next prayer are 2000 or fewer (not the coarse displayed
atom).

### 7.5 Resume counter

`resyncAtom` (`stores/ui.ts`) bumps on every foreground transition. Derived
worklets take it as a dependency so they re-run and snap on resume even when
the target is unchanged.

### 7.6 Display latch

The overlay layer keeps the ADR-013 pre-mount plus `display:none` latch. The
latch reconciles to `isOn` on resume so it can never desync.

## 8. Failure history and durable lessons

The previous effect-driven model failed because animation state lived in
mutable shared values written by `useEffect`. A write dropped during a suspend
never re-fired when its boolean dependency did not change again. Every bug
below is that class.

| Symptom | Cause | Rule |
| --- | --- | --- |
| Stranded veils, rows hidden while the overlay is closed | Veil shared value stuck, one-shot effect never refired | Pixels derive from atoms, no animation state |
| Two bright rows, or a bright non-selected row | Old row colour never animated down | One derived target per row |
| Empty pill | Pill opacity or position diverged from atoms | Derived opacity and position |
| Just-passed row went dim | Second-truncated clock, and effects writing `initialColorPos` that ignored selection | Keep millisecond precision; one derived target that includes selection |
| Resume slider or bar stranded | Dropped write with no later trigger | Resume counter re-runs derived worklets |
| Overlay vanished on return | Display latch desync, or the atom-guard race | Latch reconciles; guard reads true milliseconds |
| Open then instantly close | Guard read the coarse displayed atom, up to one second stale | Guard reads true remaining milliseconds |

Durable lessons:

- Animation must never hold state that can outlive its trigger.
- Any clock read that feeds a `<` or `>` prayer comparison keeps sub-second
  precision.
- Before adding a second atom or timer that mirrors an existing one, merge into
  the existing write path.
- A component that derives its style from the atom cannot strand; a component
  that writes it from an effect can.
- Never pass `easing: undefined` explicitly to `withTiming`. It overrides
  Reanimated's default easing and aborts with "undefined is not a function" on
  the first non-snap evaluation (the mount snap hides it). Omit the key.

## 9. Verification

- `yarn validate` green.
- iPhone XS, Release, widgets flag off.
- Functional: open a non-next row then background and return; lock and unlock;
  cross a boundary on Standard then Extras; open refused inside 2 seconds; rapid
  toggle; bell opens the sheet; process kill.
- Visual: settled-frame side by side against the pre-rewrite build, plus the
  owner's final eyeball on the physical device.
- Evidence under `evidence/` until the owner reviews, then deleted.

## 10. Decision log

| Date | Decision |
| --- | --- |
| 2026-09 | Full gut and rewrite on a new branch, keeping business logic and visuals identical |
| 2026-09 | Close follows the same schedule's next prayer, not the selected row |
| 2026-09 | 2 second guard kept, tightened to true milliseconds |
| 2026-09 | Non-selected rows hidden from the screen reader while open |
| 2026-09 | Minor version bump |
| 2026-09 | Snap on resume, no movement |
