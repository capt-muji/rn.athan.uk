# Session Brief: Presentation-Layer Re-Architecture (Prayer List, Countdown, Overlay)

**Purpose:** The single source of truth for a dedicated deep-dive session. This
is a NEW session. Do not assume prior chat context. Read this file top to
bottom, then do the work described in it.

**Two-line session starter (paste this):**

```
Read ai/AGENTS.md and begin as Orchestrator. Then read ai/features/presentation-rearchitecture/BRIEF.md in full and execute it. This is a research-and-design-first session: no implementation until the owner approves a direction.
```

**Last Updated:** 2026-09-10
**Owner:** <user>
**Status:** Ready for a new session
**Decision already made:** Option E. Keep the current tree and re-architect the
animation, presentation, and state internals on top of it. Do not revert whole
branches.

---

## 1. Why this session exists (the honest context)

We have spent roughly twelve hours chasing visual and synchronization bugs that
keep recurring in new forms. Each fix works for a day and then the next resume,
lock, or boundary surfaces a new variation. The owner's words: "we are so close
to completion, yet so far, and with every band-aid we make the codebase
messier." The owner has lost confidence in the current structure and correctly
observes that we have been treating symptoms.

This session steps back. It is a deep-dive brainstorm and re-architecture of
the presentation internals, with the business logic and the visuals preserved.
It includes the background-ticking investigation in the same session, because
it is part of the same disease.

Do not start coding until the owner approves a direction. The deliverable is a
written comparison, a recommendation, and a concrete plan.

---

## 2. The decision and the scope

**Option E (chosen):** Keep the current tree. Re-architect the internals of the
presentation and animation layer on top of it. Do not wholesale-revert the
performance branches or the overlay branch.

**Scope (owner-confirmed):**

- The prayer list (rows, veils, colors, the active pill, the date, chrome).
- The countdown (hero text, the countdown bar, the "ago" badge).
- The overlay (open, close, boundary, resume, hit testing, the veil backdrop).
- The animation and state model that ties them together.
- The background and foreground clock behavior.

**Preserved:**

- All business logic: prayer ordering, Islamic day boundaries, extra-times
  order, notifications, the 2 second overlay close rule, schedule scoping.
- All visuals and styling: pixel parity, the exact durations and easings, the
  iOS shadow and the Android API 29 `boxShadow` split.

**Out of scope unless the owner says otherwise:**

- Notifications, widgets, audio, large-screen layout, sync/API.

---

## 3. The owner's goal

1. **The UI must never be wrong on return.** Foreground must be exact in the
   first visible frame: no stale rows, no slow catch-up, no leftover veil.
2. **No band-aids.** Fix the class, not the instance. One coherent model.
3. **Ideally, never stop ticking.** The owner wants the clock and countdown to
   keep updating across background and foreground, and accepts any battery
   cost. True background ticking is likely impossible, so this session must
   research it properly and deliver the closest correct design. See section 10.
4. **Clean code.** The band-aid stack must be removed as part of the
   re-architecture, not layered on.

---

## 4. Current architecture map (so you do not rediscover it)

State and logic:

- `stores/atoms/overlay.ts`: `overlayAtom` `{ isOn, selectedPrayerIndex,
  scheduleType }` plus derived `overlayIsOnAtom`, per-type active and selected
  index, and per-row `getOverlaySelectedAtom` and `getOverlayHiddenAtom` (all
  module-cached).
- `stores/overlay.ts`: `openOverlay`, `closeOverlay`, `toggleOverlay`, the
  exact-millisecond open guard, and the arming of the overlay close deadline.
- `stores/countdown.ts`: two wall-clock tickers (Standard, Extra).
  `writeDisplayCountdown` writes `overlay-open ? selectedTarget : next` into the
  page countdown atom (the "countdown merge"). `armOverlayBoundary`,
  `clearOverlayBoundary`, `checkOverlayBoundary` own the wall-clock 2 second
  close deadline. `resyncCountdowns` catches up on foreground.
- `stores/schedule.ts`: sequence atoms, `refreshSequence`, `setSequence`,
  `getNextPrayer`, display-date and prev/next atoms.
- `stores/ui.ts`: `resyncAtom` (the resume counter) and `bumpResync`.
- `hooks/useAnimation.ts`: the derived hooks (`useDerivedProgress`,
  `useDerivedOpacity`, `useDerivedColor`, `useDerivedBackgroundColor`,
  `useDerivedTranslateY`, `useDerivedFill`) and the remaining imperative hooks
  (`useAnimationOpacity`, `useAnimationScale`).
- `hooks/usePrevious.ts`: previous-render value, used for the date-roll stagger.

View:

- `components/prayer/Prayer.tsx`: row veil (`useDerivedOpacity`) and name color
  (`useDerivedColor`), the press handler (`openOverlay`/`closeOverlay`), and the
  screen-reader hiding while the overlay is open.
- `components/prayer/Time.tsx`, `Alert.tsx`: time color and the SVG bell fill.
- `components/prayer/ActiveBackground.tsx`: the pill slide and its veil.
- `components/prayer/Ago.tsx`: the "Xm ago" badge and its overlay fade.
- `components/countdown/Countdown.tsx`: hero name and countdown, scale 1.5 in
  overlay.
- `components/countdown/Bar.tsx`: the width, warning color, tip, and the
  overlay fade.
- `components/day/Day.tsx`: the date and the Masjid fade.
- `components/overlay/Overlay.tsx`: the press-catcher layer and the extras
  explanation box (no content of its own).
- `components/overlay/VeilBackdrop.tsx`: the overlay gradient and glow, drawn
  BEHIND the content inside `Navigation`.
- `app/Navigation.tsx`: `BackgroundGradients`, `VeilBackdrop`, the `PagerView`
  (`scrollEnabled={!overlayIsOn}`), the chrome fade, and the pager self-heal.
- `device/listeners.ts`: the foreground handler (`checkOverlayBoundary`,
  `resyncCountdowns`, `bumpResync`, then `sync`).

---

## 5. The root cause, confirmed from source

This is the most important technical finding and it must anchor the design.

Reanimated applies an animated style or prop only when its mapper runs AND the
value actually changed. In `node_modules/react-native-reanimated/src/hook/useAnimatedStyle.ts`,
`styleUpdater` ends with:

```
if (!shallowEqual(oldValues, newValues) || forceUpdate) {
  updateProps(viewDescriptors, newValues, isAnimatedProps);
}
```

Consequences, all confirmed:

1. A plain React re-render does not re-apply an animated value.
   `createAnimatedComponent`'s `componentDidUpdate` only attaches newly
   registered style handles, and our handles are stable.
2. Restarting a mapper (which is what the `[resync]` dependency on the consumer
   hooks does) runs the updater with `forceUpdate` unset, so an unchanged value
   is still skipped. The 1.24.1 "re-apply on resume" change is therefore
   incomplete: it helps only when the value happens to change.
3. Once a native value goes stale (for example a row settled at opacity 0 while
   it should be 1) and its target does not change again, nothing ever
   re-asserts it. A stranded value can persist indefinitely.

This is the disease behind the "stranded veil", "resume pill", "stale bar",
"invisible row", and "dim alert icon" bugs. The band-aids worked around it
(some by forcing a value change, some by re-fitting effects), which is why they
keep reappearing in new places.

Two more platform facts:

4. An explicit `easing: undefined` passed to `withTiming` overrides the default
   and aborts with "undefined is not a function" on the first non-snap
   evaluation. It crashed the app on Android bring-up. Omit the key.
5. JS timers are frozen while the app is backgrounded. iOS suspends the
   process; Android freezes cached processes. No per-second loop runs in the
   background without a foreground service and a persistent notification.

---

## 6. The symptom catalog (every known problem)

This is the full history. Address the class, not each line.

### Overlay and rows

- **S1. Old double-exposure (#19).** The pre-ADR-014 overlay duplicated the row
  and painted a semi-transparent gradient over the still-bright underlay and a
  semi-transparent copy on top. Result: a dip to about 75 percent, a bluish
  veil, and a text/icon re-rasterization crawl mid-fade. Fixed structurally by
  the in-place design.
- **S2. Overlay vanished on return, no user action.** Causes seen: the display
  latch desyncing, the coarse displayed-atom guard letting opens slip into the
  final 2 seconds, and the pager self-heal. Mitigated, but the class is the
  model's lack of a re-assert.
- **S3. Stranded veils.** Non-selected rows stayed hidden after the overlay
  closed (opacity stuck at 0). The current Android reproduction.
- **S4. Two bright rows, or a bright non-selected row.** An old row's color
  shared value never animated down.
- **S5. Empty pill.** The pill's opacity or position diverged from the atoms.
- **S6. Selected row invisible while the overlay is open.** Newest Android
  reproduction (see section 7). The selected row's veil is stuck at 0 while the
  empty pill shows.
- **S7. Row invisible after the boundary closes the overlay.** The row that was
  selected and then passed stays at opacity 0 (the blank gap in the list).

### Resume and boundary

- **S8. Just-passed row went dim after the boundary.** A second-truncated clock
  made `datetime < now` false in the boundary second, and effects wrote
  `initialColorPos` while ignoring selection. Keep millisecond precision in
  `createLondonDate`.
- **S9. Resume pill slide stranded on the old row.** `yPosition` never changes
  again, so an effect never refires.
- **S10. Countdown bar width stale after resume.** A dropped width write stayed
  stale until the next tick.
- **S11. Countdown bar animates a slow catch-up on resume.** The owner wants it
  to snap to the correct width instantly. Partially fixed in 1.24.1, but the
  model is still wrong.
- **S12. Alert icon fades bright to dim on resume** while the name and time
  stay bright. The SVG fill exists only through `animatedProps` and is not
  re-asserted (the re-assert gap). Partially mitigated, not solved.
- **S13. Boundary straddle.** Selection-follows-next-prayer allowed the overlay
  to straddle a boundary and strand state. Replaced by the 2 second close rule
  and a wall-clock deadline.
- **S14. Open then instantly close.** The open guard read the coarse displayed
  atom. Fixed by reading true remaining milliseconds.
- **S15. Suspended boundary.** The overlay must close even if the 2 second rule
  elapsed while the host was suspended or locked. Handled by the stored
  deadline, but it depends on the fragile stored-deadline module state.

### Countdown and other

- **S16. Countdown bar tip versus body color mismatch** after the default bar
  color changed. Likely the warning interpolation versus the tip tint constant.
  Verify separately, probably unrelated to the animation model.
- **S17. `easing: undefined` crash** on Android bring-up. See section 5.
- **S18. Android-only divergence.** Every strand above reproduces on Android
  and not on iOS. The working theory: the re-assert gap plus Fabric platform
  differences. The new session must confirm the platform-specific mechanism on
  the device, not assume.

---

## 7. The current Android reproduction (evidence)

Owner steps: open the overlay on an upcoming prayer, minimize, lock the screen,
unlock, reopen the app, close the overlay. Repeated, intermittent, Android only.

Two screenshots captured this (Samsung S23, 13:12 and 13:14):

- Overlay open: gradient, hero "Magrib 1m 3s", location, date all render. The
  prayer list is completely absent. An empty blue pill (the active background)
  shows with no row inside it.
- Overlay closed: the list is back, but the Magrib row is a blank gap and Isha
  is the highlighted next prayer.

Conclusion: a row's veil is stranded at opacity 0, and because its target
afterward stays at 1 (it is selected), no value change re-asserts it. This is
the re-assert gap from section 5, made visible.

The new session must reproduce this and confirm the exact native mechanism
(whether the native value drifts, whether the mapper stops, whether the
view descriptor detaches) before designing the fix. Do not guess.

---

## 8. Durable lessons (do not relearn these)

1. Animation must never hold state that can outlive its trigger.
2. A value that derives from state cannot strand by itself; a value written by
   an effect can. But deriving alone is not enough, because Reanimated does not
   re-assert an unchanged value.
3. Any clock read that feeds a `<` or `>` prayer comparison keeps sub-second
   precision.
4. Never pass `easing: undefined` explicitly to `withTiming`.
5. A prop that exists only through `animatedProps` (the SVG `fill`) needs an
   explicit re-assert story.
6. JS timers are frozen in the background. Recompute and snap on foreground, or
   keep the process alive with a supported mechanism.
7. `resync` is for host resumes only, never for genuine state transitions such
   as a date roll.
8. Before adding a second atom or timer that mirrors an existing one, merge
   into the existing write path.
9. One-shot `measureInWindow` at load is the settled approach; the owner
   rejected press-time re-measure.
10. No mount-time visual settling: components must first-frame in their settled
    state.
11. The `@expo/ui` native pager must never be used in app UI (F.9 coordinate
    space regression). The app uses `react-native-pager-view`.
12. `createLondonDate` keeps millisecond precision; do not "clean it up".

---

## 9. Target architecture direction (leading candidate, validate it)

Do not treat this as decided. It is the direction the evidence points to.

**Principle: the settled visual state must be re-assertable by construction, and
animation must be a transition, never the owner of the settled value.**

Concrete ideas to evaluate:

1. **Settled state in ordinary React props.** For every animated property, the
   resting value is written as a plain (non-animated) style or prop derived from
   the atoms, so any React re-render re-asserts it. Animation (a `withTiming`
   overlay or a transition) is applied only while a transition is in flight, and
   releases ownership at settle. This removes the re-assert gap entirely.
2. **One guaranteed re-assert path on foreground.** Whatever the animation
   mechanism, foreground must force every native value back to its settled
   state. Evaluate Reanimated's `forceUpdate` path (the `styleUpdaterContainer`
   in `useAnimatedStyle`), a version-counter perturbation, a keyed remount, or
   `setNativeProps`.
3. **One wall-clock source.** A single clock abstraction that recomputes all
   time-derived values from `Date.now()` and re-derives the whole UI on
   foreground, so nothing depends on a background tick having run.
4. **No per-component effect writes to animation targets.** Any remaining
   effect-driven animation (`Bar` width and warning, `Ago` recent color, the
   `Navigation` dots, press and bounce interactions) either becomes derived
   with a real re-assert, or stays as a user-driven transition that is not
   subject to resume.
5. **A single presentation contract.** A small shared module that every
   animated surface uses, so there is one place to reason about settled versus
   transitioning, and one place to force a re-assert.

The candidate must preserve the exact visuals and timings listed in
`ai/features/overlay/spec.md` section 6, and the platform shadow split.

---

## 10. Research mandate (included in this session)

Do heavy, sourced research. Verify against real documentation and source, never
training data. Use TinyFish for web search and page reads, docs-mcp-server for
library docs (resolve the exact installed versions first), and `opensrc` or
`node_modules` for React Native, Expo, and Reanimated source. Consult official
Apple, Android, and store policy pages.

### Background ticking
1. Exactly what happens to a React Native app when backgrounded on iOS (process
   suspension timing, `beginBackgroundTask` finite window) and on Android
   (background execution limits, Android 12 and newer cached-process freezer,
   Doze, App Standby). For how long does the JS thread run? Do `setTimeout` and
   `setInterval` fire? Does Reanimated's mapper loop run?
2. Supported continuations: `expo-background-task` and `expo-task-manager`
   (what they can and cannot do, minimum intervals, headless JS), iOS background
   modes (audio, location, voip, fetch, processing, bluetooth) and what Apple
   rejects under App Review 2.5.4 and 3.2.1, and Android foreground services
   (Android 14+ typed services, persistent notification, Google Play policy).
3. Libraries: `react-native-background-actions`, `notifee`, community
   foreground-service plugins, their maintenance and Expo SDK 57 compatibility,
   and whether a config plugin can add one without ejecting.
4. Background audio with `expo-audio`: can it keep the app alive enough to tick,
   and is that acceptable or abusive.

### Reanimated re-assert semantics
5. Confirm the exact behavior of `styleUpdater`, `forceUpdate`, and
   `styleUpdaterContainer` in the installed Reanimated version, and the correct,
   supported way to force a re-apply of an unchanged animated value. Check
   whether a newer Reanimated release changes this. Check the official docs and
   issues for "useAnimatedStyle re-render apply" and "forceUpdate".
6. Whether Reanimated pauses its mapper loop when the app is backgrounded and
   what it does on resume.

### Platform
7. Why an animated value would drift on Android Fabric but not iOS, and the
   supported way to make native props deterministic across suspend and resume.

---

## 11. Phases and deliverables

**Phase 1: Archaeology (read only).**
Enumerate every merge and commit since the last pre-performance release.
Classify each as performance-only, behavior, visual, or infrastructure, and
produce an exact map of what the current tree depends on. The point is to know
what a revert WOULD have done, and to confirm option E is safe.

**Phase 2: Reproduce and confirm the root cause.**
Build and install the current `feat/overlay-rewrite` (1.24.1) Release on both
phones with the mock minute rig. Reproduce the Android strand from section 7.
Confirm the native mechanism (section 5) with logs and, where possible, source
inspection. No fixes yet.

**Phase 3: Design.**
Produce three to five candidate architectures for the presentation layer,
including the leading direction in section 9. For each: pros, cons, risk,
effort, and how it guarantees the re-assert and the resume correctness. Include
the background-ticking outcome as part of the clock design.

**Phase 4: Recommendation and plan.**
Pick one, with a file-by-file implementation plan and a test and device
verification protocol. STOP. Present to the owner. No implementation until the
owner approves.

**Phase 5 (after approval): Implement.**
Small, reversible steps. Keep `yarn validate` green at every step. Remove the
band-aids as the new model lands.

**Deliverables:** a written comparison, a recommendation, an implementation plan,
and an updated `ai/AGENTS.md` memory entry. The final design becomes the new
`ai/features/presentation-rearchitecture/` spec.

---

## 12. Acceptance criteria

- The in-app UI is exact in the first visible frame after any foreground,
  lock/unlock, or app switch.
- No stranded veils, no invisible rows, no empty pills, no stale bar, no dim
  alert icon, on either platform.
- The overlay opens and closes only as specified (tap, app close, the 2 second
  schedule rule, the defensive pager self-heal). Nothing else moves it.
- Pixel parity with the current visuals and timings, and the platform shadow
  split preserved.
- The band-aid stack is removed, not extended.
- `yarn validate` green (tsc, biome, jest). New tests cover the re-assert model.
- The background/foreground decision is documented with sources, and either
  continuous ticking is implemented where the platform allows, or the instant
  catch-up is proven sufficient and stated as the design.

---

## 13. Constraints

- Repo rules: `ai/AGENTS.md` is authoritative. Never use `console.log`; use
  `@/shared/logging`. No `Platform` checks in the countdown pipeline unless the
  owner sanctions an exception. Version bump in both `app.json` and
  `package.json`. Never touch `releases.json`. Owner performs all git writes.
- Branch: create a new branch from `uat` (for example
  `experiment/presentation-rearchitecture`). The overlay work is on
  `feat/overlay-rewrite` (1.24.0 committed, 1.24.1 uncommitted).
- No new dependencies without owner approval.
- Devices: iPhone XS `IPHONE_UDID` (iOS 18.7.10, no passcode), and
  Samsung Galaxy S23 Android 16, adb `S23_SERIAL`. Physical-device tooling is
  documented in `ai/AGENTS.md` (AI Tooling section): `xcrun devicectl`,
  `pymobiledevice3`, `adb`. Touch automation on a physical iPhone is not
  available; Android supports `adb shell input tap`. The owner is the final
  visual confirmer.
- Mock minute rig: `mocks/simple.ts` `[today]` is `addMinutes(-3..+3)` and is
  kept on purpose. It reseeds at each process start.
- No sleep longer than 15 seconds; poll in short cycles.

---

## 14. Required reading (in order)

1. `ai/AGENTS.md` (repo rules, all Performance Design Rules, the 2026-09-10
   Recent Decisions, the key principles).
2. `ai/features/overlay/spec.md` (the current contract and the durable lessons).
3. `ai/adr/015/ADR.md` and `ai/adr/014/ADR.md` and `ai/adr/013/ADR.md`.
4. `ai/features/performance/description.md` and `ai/features/performance/progress.md`
   (what the performance campaign did and why).
5. The files listed in section 4.
6. `node_modules/react-native-reanimated/src/hook/useAnimatedStyle.ts` (the
   re-assert semantics) and `src/mappers.ts`.

---

## 15. Start here

Read the required reading, then do Phase 1 and Phase 2. Bring evidence, not
opinions. Then design (Phase 3), recommend (Phase 4), and stop for the owner.

The owner may run this session on a different model. This file is self-contained
on purpose. If anything here contradicts live code, the live code wins, and note
the discrepancy in the report.
