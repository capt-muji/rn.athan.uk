Read ai/AGENTS.md, then fix this defect end-to-end. This prompt contains everything the 2026-09-08 chaos + fix sessions learned; do not relearn it. Ask me ONLY for physical actions you cannot perform.

# Alert Sheet First-Frame Selection — Dedicated Fix Session

## The defect (owner-reported, twice confirmed on camera)

Opening the alerts bottom sheet (bell/speaker icon on any prayer row) briefly renders the Athan segmented control as `Off` regardless of the persisted selection, then snaps to the real value (observed 0.4s to 2s). Same for the Reminder controls. Both pages, both schedules. Screenshots that caught it: `sheet_dhuhr_fast.png` vs `sheet_dhuhr_slow.png` and `verify6/b_reopen_fast.png` vs `b_reopen_slow.png` (pill on Off, frame otherwise pixel-identical; labels sometimes already correct while the pill lags).

## Root cause (settled, do not re-investigate)

`components/sheets/screens/Alert.tsx` holds the draft in local `useState` initialized to `Off` defaults, and loads the real values in a post-paint `useEffect` on `sheetState`. The sheet content mounts at `present()` with the defaults, and the effect corrects them after paint. This code is IDENTICAL from 1.21.6 through HEAD: the flash was always there, hidden inside the ~300ms sheet entrance animation. The 1.22.0 perf22 commit (`metro.config.js` `inlineRequires: true`, module eval moved to first touch) stretched the first-open snapshot latency until the flash became visible in normal use. Do not chase the perf22 diff; fix the architecture.

## The fix to build (correct by construction, "the original states before any lazy timing")

Extract the sheet body into a keyed child component whose state is initialized AT MOUNT from the synchronous store getters. Values are then correct in the same render that mounts the content; nothing timing-dependent.

1. Parent `BottomSheetAlert` keeps: `sheetState` atom subscription, `Sheet` wrapper (unchanged props), and the dismiss commit.
2. New `AlertSheetBody` child, rendered as `{sheetState && <AlertSheetBody key={`${sheetState.type}:${sheetState.index}`} ref={bodyRef} sheetState={sheetState} ensurePermissions={ensurePermissions} />}`:
   - All five draft states become lazy `useState(() => ...)` initializers reading `getPrayerAlertType` / `getReminderAlertType` / `getReminderInterval` (synchronous MMKV-backed getters, safe in render).
   - Snapshot the original values into a `useRef` at mount for the change-detection commit.
   - Expose `getCurrentState()` via `forwardRef` + `useImperativeHandle` (the pre-refactor `AlertMenu.tsx` pattern, documented in ai/AGENTS.md §Component Communication). This is the AGENTS-sanctioned pattern for exactly this deferred-commit-on-close need.
   - All handlers (`handleAlertSelect` incl. permissions, reminder toggle, reminder type, stepper) move into the body unchanged.
3. `handleDismiss` in the parent reads `bodyRef.current?.getCurrentState()` and commits only when `current` differs from `original` (preserve the existing no-change skip semantics and the rollback path in `hooks/useNotification.ts`).
4. `stores/ui.ts` `showAlertSheet` stays EXACTLY as HEAD (mark + atom set + synchronous `present()`). The body's lazy initializers read the STORE, not the parent draft, so present-before-commit cannot leak defaults anymore.
5. Content remounts on every open anyway (@gorhom unmounts modal content on dismiss), so the lazy initializers re-run per open; the `key` handles prayer changes.

## The ONE design risk to verify first (dev build, before writing the production fix)

Confirm `Sheet`'s `onDismiss` still sees a live `bodyRef` (that @gorhom fires `onDismiss` before the content unmounts, so `getCurrentState()` is readable). The original `AlertMenu.tsx` pattern is the historical proof this ordering works, but verify on this @gorhom version in a dev build before committing to the shape. Fallback if the ref is dead at dismiss: read the draft at close-START via the `onAnimate` close hook (`Sheet.tsx` `handleAnimate` already fires there) and stash it for `onDismiss`.

## Hard bans (each one crashed or regressed on device on 2026-09-08; evidence in the crash logcat and REPORT.md)

- NO `useLayoutEffect` snapshot (setStates pre-paint on this subtree): crashes `BottomSheetModalComponent` at mount with an empty `AggregateError`, kills the worklets `v_native` thread, blank screen, surface teardown.
- NO presenting from any component effect (layout or passive): same crash.
- NO `requestAnimationFrame` present in `showAlertSheet`: crash-safe but races React's commit flush because the call site runs from an async continuation (`await ensurePermissions()` in the row's press handler), so the modal can mount last-session children.
- NO render-time adjust-state snapshot with a sheetKey guard: crash-free but the key skip leaves the draft stale on reopen-same-prayer.
- Do not add virtualization, remove rows, or touch the sound sheet.

## Build and verify protocol

- Dev build FIRST (instrumentation: React DevTools + Reanimated logger on the content mount path), verify the ref ordering risk above, then the release fleettest build:
  `rm -rf node_modules/.cache/metro android/app/build/generated/assets/react/release/index.android.bundle` then
  `EXPO_PUBLIC_PERF_MONITOR=1 EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest npx expo run:android --variant release`
- After killing the CLI at "Installing", poll `adb shell dumpsys package com.mugtaba.athan.fleettest | grep lastUpdateTime` until it settles BEFORE `am start` (a late gradle install silently kills the just-launched process; empty crash buffer, launcher screenshots).
- Version bump fires the What's New modal on first launch: dismiss it (tap its Continue button) before any scripted taps, or every tap is swallowed and a later BACK exits the app (BACK with nothing open exits).
- Screenshot battery, EVERY pair must show the SAME correct segment in the early (~0.2s) and late (~2s) frames, and it must match the row icon's ground truth (speaker=Sound, bell=Silent, bell-slash=Off):
  1. Cold launch, first open (Dhuhr)
  2. Close, reopen same prayer, no changes
  3. Select a different segment, close (verify "Committed alert menu changes" in logcat), reopen
  4. Open a different prayer (Standard and Extras pages)
  5. Repeat 2 and 3 at least three times each (the flash was racy; two-frame single-open samples produced false PASSes before)
- Verify zero `AggregateError` / `handleHostException` in logcat across the whole battery.
- `yarn validate` green (typecheck + biome + 931 tests). Update `stores/__tests__/ui.test.ts` only if behavior contracts change (none expected: `showAlertSheet` stays HEAD).
- Owner eyeball is the arbiter: hand the phone over for the reopen-and-change flow before declaring done.
- NEVER commit; I commit manually.

## Evidence and context files

- Chaos report with the full post-mortems: `/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/chaos-20260908/REPORT.md` (copy any durable notes into `ai/` before that temp dir is cleaned)
- The stale-frame screenshots listed above (same directory)
- `components/sheets/parts/Sheet.tsx` (present/dismiss/onAnimate choreography), `components/sheets/parts/SegmentedControl.tsx` (first-eval pill snap; its geometry-unknown pre-layout state renders the pill at the Off slot at `translateX 0`), `hooks/useNotification.ts` (`commitAlertMenuChanges` contract), `components/prayer/Alert.tsx` (the press path with the `await ensurePermissions()` continuation)
- Known capture hazards: screencap latency swallows sub-200ms states, vision prompts need a clean reference frame, Hermes release bundles contain no local identifiers as strings (behavioral verification only)
