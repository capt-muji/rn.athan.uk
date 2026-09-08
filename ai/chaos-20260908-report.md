# Chaos Session Report - 2026-09-08

Branch `perf/chaos` @ 1.22.3, gate-ON fleettest release, OnePlus 3T (3T_SERIAL).
Chaos window 04:09:37 to 04:19:38 device time (owner mayhem 04:10 to 04:19:30, DONE ~04:19:30).
Rig: streaming logcat, 5x150s screenrecord segments, 5x150s atrace, 30s meminfo sampler, crash-buffer + ANR watch.
Artifacts: `/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/chaos-20260908/`

## Input volume (marks census)

| Mark | Count | Notes |
| --- | --- | --- |
| `overlay_open_start` / `overlay_open` | 137 / 112 | 25 opens interrupted by the next toggle |
| `pager_swipe_start` / `pager_page` | 259 / 88 | 34 swipes and 10 page settles INSIDE overlay-open intervals |
| `sheet_alert_open` cycles | 45 | 04:11 to 04:15 machine-gun era |
| `sheet_settings_*` / `sheet_sound_*` | 5-6 / 1-3 | |
| `sound_select_tap` / `sound_play_tap` / `sound_commit` | 24 / 23 / 1 | exactly 1 commit for 1 sound change |
| `sched_updatePrayerNotifications` | 22 | max 1155ms, queue_wait max 3ms |
| launches | 2 | BACK-exit mid-window, relaunch-clean |

## Findings table

| # | What happened | Evidence | Expected | Severity | Suspected component | Fix sketch |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Alert sheet opens showing `Off` on the Athan (and Reminder) controls regardless of the real selection, then snaps to the true value 0.4 to 2s later. Both pages. | `sheet_dhuhr_fast.png` pill on Off, `sheet_dhuhr_slow.png` pill on Silent, rest of frame pixel-identical. Owner report. | First frame shows the persisted selection | HIGH (visible on every sheet open) | `components/sheets/screens/Alert.tsx:30-56` | Local `useState` defaults load real values in a post-paint `useEffect` (Performance Design Rule 3 violation). Remount the sheet BODY keyed by `${type}-${index}` with lazy `useState` initializers reading `getPrayerAlertType` etc. No effect needed, first frame correct. |
| 2 | Overlay stays open while the pager settles a different page: Extras tooltip ("Suhoor / 20 mins before Fajr") floats over the full Standard list, chrome hidden, veil behind content, hero shows the Standard target. | Live capture `bug_state_1/2.png` (04:19:58); 10 `pager_page` settles inside overlay-open intervals (04:15:16 to 04:18:11); owner report + tap-to-close recovery `probe_after_tap.png`. | Overlay open pins the page: no swipe, no cross-page elements | HIGH (marquee defect, abuse-triggered) | `app/Navigation.tsx:81` gate + ViewPager2 native gesture | A native drag begun during a momentary overlay-closed instant of a spam-toggle sequence cannot be cancelled by the later `scrollEnabled=false` flip. (a) MUST: self-heal in `handlePageSelected`: if overlay is on and the settled page differs from `overlay.scheduleType`, force-close the overlay. (b) Gate on the settled-closed state (past the close fade + hide latch), not the instant atom, to shrink the race window. |
| 3 | Mid-input stalls: 76 gaps of 100ms to 2s bracketed by marks. Worst: 1540ms at 04:17:56 (overlay close frozen mid-fade, then pager frozen at a non-snap swipe offset), 1323ms at 04:14:16, 973ms at 04:13:47 (sheet frozen 57px into close), 873ms at 04:15:01 (segmented pill mid-slide + card mid-fade exactly when `sched_updatePrayerNotifications` ran, max 1155ms). | pts gap analysis + `w_04*/sheet.png` vision verdicts (4 STALL, 1 NORMAL); atrace_1 dense span shows real 302-486ms doFrame stalls | Animations hold the 30fps floor | MODERATE (abuse-only, all recovered) | Notification reschedule on the sheet-close critical path; overlay spam re-render churn | Defer the alert-commit notification work past the sheet close animation (the campaign's sheet-dismiss widget-push deferral pattern: `InteractionManager.runAfterInteractions`). Keeps `queue_wait` serialization. |
| 4 | `overlay_open` measure 202ms avg / 380ms max vs the 80ms 1.22.2 band (2.5x avg, 4.75x max). All other marks in band (`overlay_close` 198 vs 190, `sheet_alert_open` 441 avg vs 456, `sheet_sound_open` 838 vs 807, `js_to_content` 1085 vs 1076). | marks census vs `e2e/baselines/android-3t.json` | within 2x band | LOW (explained by spam interleaving + the finding-3 stalls inflating the open-to-commit span) | same as #3 | Re-measure after fixes 1 to 3 land; treat as a symptom, not a defect. |
| 5 | Duha row absent from the settled Extras page at 04:14:16 while present at 04:13:47, 04:15:01, 04:17:56. | `w_041416/sheet.png` vision cross-sheet flag | row set is date-stable | LOW (unexplained, transient, self-corrected) | overlay row-churn interaction | Watch during round 2; no fix without a repro. |

## Crashes

None. Zero crash-buffer entries and zero `FATAL`/`ANR`/`am_anr` matches across the whole window including probes. BACK-exit and relaunch behaved per the known-hazards note.

## State integrity (checked live, pre force-stop)

- Bugged overlay state recovered with ONE tap (catcher worked, chrome restored, tooltip gone): `probe_after_tap.png`.
- Post-chaos pages render clean, one prayer per row, countdown correct, no duplicate rows, no ghost sheets, pager swipes normal.
- Notifications: exactly 1 `sched_rescheduleAllNotifications` (191ms) for the 1 sound change; 22 targeted `sched_updatePrayerNotifications` for alert changes; `queue_wait` max 3ms (the scheduling lock serialized everything, no storm); "No changes detected, skipping commit" dedup guard fired; 12 notification records in `dumpsys notification` for the package.
- 2 cold launches logged, both clean.

## Memory

PASS. PSS 200MB young process, ~299MB peak during the heaviest sheet/overlay churn (04:14 to 04:15), plateau ~278MB for the remaining 20 minutes, 100MB at the relaunch, plateau again ~274-278MB. Bounded, no monotonic growth through mount/unmount spam, no growth surviving the process restart.

## Harness lessons (apply before round 2)

- The atrace chain drifted ~80s per segment behind the video chain (buffer dump happens after each 150s capture) and the 8192KB buffer saturates at ~52s under mayhem. Round 2: one long `atrace` with a 32-64MB buffer, plus a sync marker (brief white flash + `PERF_MARK` at rig start and at each segment boundary).
- `dumpsys activity anomalies` does not exist on this Android 9 build; the crash-buffer + logcat grep watch is the working substitute.
- Quiescence vs freeze discrimination: the marks-bracket test (marks within 600ms on both sides of a 100ms-2s video gap) cleanly separated real stalls from static screens. Keep it.
- Vision prompts need a CLEAN Standard-page reference frame: future rows are dimmed by normal styling (Extras had no future rows, which caused a false "dimmed rows = overlay residue" read in two reviews).
- Probe recorders must be armed immediately before scripted repros; vision-subagent latency (up to 6 min) otherwise lets segments expire unwritten.

## Ranked fixes

1. Alert sheet first-frame selection (`Alert.tsx` keyed-body lazy init). HIGH, small, every-user visible.
2. Overlay page-change self-heal (`handlePageSelected` force-close) plus settled-closed gate. HIGH, one line plus a gate change.
3. Sheet-close notification deferral off the animation path. MODERATE.
4. Round-2 rig improvements above. PROCESS.

## UAT promotion verdict

BLOCKED on findings 1 and 2. Finding 1 is visible in normal use on every alert-sheet open. Finding 2 is abuse-triggered but produces a badly broken screen and was hit repeatedly in one session. Both fixes are small; clear them, then run the verification chaos round (rig improved) before promotion.

---

# Fix session addendum (same day, 1.22.4)

## Landed fixes (uncommitted, branch `perf/chaos`)

| Fix | Change | Verification |
| --- | --- | --- |
| 1. Stale selection | `stores/ui.ts`: `showAlertSheet` presents via `requestAnimationFrame` (after the snapshot commit, so the modal mounts corrected children). `Alert.tsx`: snapshot effect unchanged (passive), commit deferred | Cold first open PASS on device (first frame shows real selection, no Off flash, zero exceptions); commits and no-change skips flow through the deferred path |
| 2. Overlay contamination | `app/Navigation.tsx`: `handlePageSelected` force-closes the overlay when the settled page differs from `overlay.scheduleType` | Both scripted race directions PASS (proper takeover pinned to the settled page, no cross-page tooltip, no mixed state); gate also held a swipe during an open overlay |
| 3. Close-path stalls | `Alert.tsx` `handleDismiss`: commit deferred past the close reveal (`requestAnimationFrame` + `setTimeout`, the widget-push pattern) | Commit logs correct through the deferral |
| Tests | `stores/__tests__/ui.test.ts` updated to the new `showAlertSheet` contract | biome, `tsc --noEmit`, 931/931 tests green |

## Post-mortem: two crashed approaches (documented in code comments, do not relearn)

- Snapshotting in a `useLayoutEffect` (pre-paint setState) crashes `BottomSheetModalComponent` at mount with an empty `AggregateError` and kills the worklets `v_native` thread (blank screen, surface teardown). The passive effect variant is device-proven safe.
- Presenting from a component effect (layout or passive) crashes the same way. Presenting from a frame callback (`requestAnimationFrame` in the store action) is device-proven safe.
- Killing the `expo run:android` CLI mid-install lets gradle finish the `adb install -r` afterwards, which silently kills the just-launched app process (empty crash buffer, launcher screenshots). After killing the CLI, wait for `dumpsys package ... lastUpdateTime` to settle before `am start`.

## Residual (owner eyeball requested)

Reopen-after-change showed the selection PILL at Off for one frame while the segment LABELS were already correct (value, labels, and commits all correct; cosmetic only, observed once, racy). The `SegmentedControl` pill mount path (`useDerivedValue` first-eval snap gated on `onLayout`) needs focused dev-build instrumentation if it reproduces in round 2. Data integrity: none affected.

## Fix session outcome (final, owner decision)

Kept in the tree (uncommitted, `1.22.4`):
- **Finding 2 (overlay contamination)**: `app/Navigation.tsx` self-heal in `handlePageSelected`. Owner-confirmed fixed on the first fix build and re-verified on the final reverted build (proper takeover on the settled page, gate holds swipes).
- Version bumps in `app.json` / `package.json`.

Reverted to HEAD (owner call, after three failed fix-forward approaches):
- `components/sheets/screens/Alert.tsx`, `stores/ui.ts`, `stores/__tests__/ui.test.ts` restored byte-for-byte to the pre-session original. **Finding 1 (stale selection) is OPEN** at its original severity (defaults flash hidden inside the entrance animation in normal use; visible under load). **Finding 3 (close-path stalls) is also dropped with the revert** (the deferral lived in the reverted `handleDismiss`); abuse-load only, cosmetic.

## Why fix-forward failed (do not relearn)

- `useLayoutEffect` snapshot: crashes `BottomSheetModalComponent` at mount, empty `AggregateError`, worklets `v_native` thread death, blank screen.
- Presenting from a component effect (layout or passive): same crash.
- `requestAnimationFrame` present in the store action: crash-safe, but races React's commit flush when `showAlertSheet` runs from an async continuation (`await ensurePermissions()`), so the modal can still mount last-session children.
- Render-time snapshot with a `sheetKey` guard: crash-free, but the key skip leaves the draft stale on reopen-same-prayer, and the commit-vs-rAF race above still leaks a first-frame flash.
- Verdict: the stale-selection defect is not fixable from the timing side alone. The next attempt needs dev-build instrumentation (React DevTools + Reanimated logger on the content mount path) and most likely the keyed-body remount with lazy `useState` initializers (values read at content mount, the original architecture's property, by construction), with the `forwardRef getCurrentState` deferred-commit pattern from the pre-refactor `AlertMenu.tsx`.

## Process lessons

- Killing the `expo run:android` CLI at "Installing" lets gradle finish the `adb install -r` afterwards, silently killing the just-launched app process (empty crash buffer). Poll `dumpsys package ... lastUpdateTime` to settle before `am start`.
- Hermes release bundles do not contain local identifiers as strings; grep-based fix-presence checks on bundles are meaningless. Verify behaviorally.
- Small-sample screenshot verification of racy timing (2 frames, one open) produces false PASSes; the owner eyeball is the arbiter for jank-class fixes.

## Round 2 checklist (unchanged plus)

Improved rig (single long atrace with 32-64MB buffer, sync markers, clean-reference vision prompts, pre-armed probe recorders), re-audit finding 2's fix in real mayhem, and treat finding 1 as the primary target of a dedicated instrumented session before attempting another fix.


