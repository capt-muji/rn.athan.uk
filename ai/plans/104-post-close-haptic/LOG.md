# LOG

## Planning (2026-10-15)

## Ticket 104

Frontier taken in two interview rounds with the owner:

- D104.1 the one-to-two-second-late buzz is a defect (round 1). Her working theory, recorded:
  the scheduling commit finishing, then a haptic. The code carries no completion haptic, so the
  late buzz is the close haptic itself arriving late.
- D104.2 one Light close buzz, immediate, on every close path; the unchanged-close buzz stays;
  no confirmation haptic; no second buzz (round 1, confirmed as the assembled target in round 2).
- D104.3 no notification banner shows at the buzz moment (her words: "this has absolutely
  nothing to do with the notification banners at all"); if a capture shows one anyway, the lane
  stops and investigates with her (round 1).
- D104.4 she reproduces on demand on the XS dev build, phone connectable (round 1).
- D104.5 owner moments run batched, collected passes (round 2).

Facts (explore worker, verified against the code at `f8884324` by the planner):

- The immediate unchanged-close buzz is the app's own unified close haptic
  (`Sheet.tsx:173-182`, owner rule 2026-09-08). The ticket row's "no haptic on the close path"
  verification had missed the shared Sheet layer.
- No haptic exists anywhere on the commit path; the error-revert path deliberately plays none.
- The commit the dismiss awaits is four parallel schedule passes plus the stale sweep
  (`notifications.ts:1587-1599`), and the code's own comment records the saturation: "the
  timeline build saturates the JS thread ~0.5s per schedule on the A12 and used to land exactly
  on the sheet-dismiss home reveal" - the same window the late buzz lands in, with the repo's
  deferral idiom (rAF, then setTimeout) already in use beside it.
- `perfMark`/`perfMeasure` are gated on `EXPO_PUBLIC_PERF_MONITOR`; `sound_commit` marks the
  commit window already.

## Planning (2026-10-15), second entry

Plan drafted through the gate: 4 steps (instrument and diagnose on the simulator; the XS
reproduction with the owner, weight 3, alone; the fix gated on verdict T or T2; the owner's
read), 6 anchors, preflight and break script committed. The grill ran cold
(athan-plan-griller) and its findings are adjudicated in the READY commit message.

### Step 1 — DONE (branch `diag/close-haptic-timing` off `540a8813`, version 2.0.792)

Preflight: `PREFLIGHT OK` (clean tree on `uat`, origin merged in, all 6 anchors count 1).

Red: `marks the close haptic dispatch and settle on dismiss` first failed at
`components/sheets/parts/__tests__/Sheet.test.tsx:179` —
`expect(calls).toEqual(['sheet_close_haptic', 'onDismiss'])` received `["onDismiss"]`: the
marks were never called. The other 26 tests in the Sheet suite passed.

Change (`components/sheets/parts/Sheet.tsx`, `handleDismiss` only): `perfMark('sheet_close_haptic')`
on the line above the impact; the impact stored in `const impact`; 
`void impact.then(() => perfMark('sheet_close_haptic_settled'));`; then `onDismiss?.();`. Call
order unchanged (haptic first, `onDismiss` same tick); the comment block above untouched.

Green: Sheet suite 27/27. `yarn validate` exit 0 (tsc, biome, jest 5677 passed, 5677 total).

Break: `bash $TMPDIR/break-104.sh marks` from the repository root — last line `BREAK OK`
(both perfMark lines commented, the new case red with the marks never called, file restored;
`git status --porcelain` then listed only the two step files).

Simulator diagnosis (Athan-77, iOS sim, dev bundle from Metro with
`EXPO_PUBLIC_PERF_MONITOR=1` on the serve command, port 8082; the 8081 Metro belongs to
another lane and was never touched — the sim's dev-launcher build was pointed at 8082 with
the `athan://expo-development-client?url=` deep link):

Changed-pick close (opened from Settings > Change athan, picked Athan 2 over Athan 1, closed
on the backdrop):

- `sheet_sound_close_start` ts 1792098906473 (close animation 230 ms)
- `sheet_close_haptic` ts 1792098906703 (dismiss complete, haptic dispatched)
- `sound_commit_start` ts 1792098906705 (+2 ms after the dispatch mark)
- `sheet_close_haptic_settled` ts 1792098906970 (+267 ms after the dispatch mark)
- `sound_commit` measure duration 271 ms, window [1792098906705, 1792098906976]

The settle lands after `sound_commit_start`, inside the `sound_commit` window.

Unchanged close (opened the sheet, closed it without picking):

- `sheet_sound_close_start` ts 1792098951922 (232 ms)
- `sheet_close_haptic` ts 1792098952153
- `sheet_close_haptic_settled` ts 1792098952301 (+148 ms)
- no commit marks at all.

No banner or delivery line appeared at either settle (the sim runs with notifications
disabled), so verdict N is excluded on this capture by construction.

Provisional verdict: **T (dispatch-side)** — per PLAN section 5, the settle mark landing
inside the `sound_commit` window means the scheduling prefix took the thread before the
impact's native ack returned. Step 2 (the XS capture) decides finally.

Evidence: `~/athan-gitree/sessions/104/metro-104.log` (the PERF lines), `app-console-104.log`.
The serve Metro on 8082 was stopped and the sim app terminated after the drive; the sim's
dev-launcher gained a `localhost:8082` recently-opened entry (harmless, it falls back to the
launcher home when 8082 is down).

Commit `00c63936` (2.0.792), merged into `uat` as `1aa9d21f` (no-ff). Hook:
`Tests: 5677 passed, 5677 total` (suites 215 passed, 215 total); coverage: Statements 100%
(5351/5351), Branches 100% (2312/2312), Functions 100% (1113/1113), Lines 100% (4792/4792).

Review (cold read of `git show 00c63936`): clean. The diff is the contract verbatim — two
marks and the promise variable around an unchanged call order, the comment block untouched;
the settle `.then` writes only module-level state (no lifecycle, thread, residue or rule
exposure). The anticipated "name the mark constants" fix deliberately not applied: the step
reserves it for after the break run, and `break-104.sh marks` matches the literals.

session: ses_ebeae1d28ffeM2fSqV8jHnW0WN

### Step 2 — DONE (branch `build/haptic-xs-capture` off `a5f9995c`, stayed empty and was deleted; no commit)

Preflight: `PREFLIGHT FAILED` on one anchor, adjudicated benign: `sheet-close-haptic.anchor`
holds the pre-step-1 `handleDismiss` text, and step 1's contract inserted exactly the lines that
break the verbatim match (`git show 00c63936`: the bare `Haptics.impactAsync` line became
`perfMark('sheet_close_haptic')` + `const impact =` + the settle `.then`). Proof nothing else
moved: `git diff 1aa9d21f..HEAD -- components/sheets/parts/Sheet.tsx` empty. The other 5 anchors
and every state check (uat, clean, origin merged, 2.0.794 >= floor) passed. Step 2's own anchor
check is "none (no code changes)".

Build (atlas `e2e/device-atlas-iphone-xs.md` recipe): prebuild `--clean` with
`EXPO_PUBLIC_IOS_WIDGETS=1` (the checkout's `ios/` was 2.0.254-era residue), plist 2.0.794, ids
`com.mugtaba.athan` + `com.mugtaba.athan.ExpoWidgetsTarget` in the pbxproj (the plist carries
`$(PRODUCT_BUNDLE_IDENTIFIER)`; an earlier "FAIL: bundle id" was my check reading the plist
literal, not a prebuild defect), `node_modules/.cache/metro` cleared (env-blind), then Release
xcodebuild with `EXPO_PUBLIC_PERF_MONITOR=1` + `EXPO_PUBLIC_IOS_WIDGETS=1` in the build env and
the cached team inline. `BUILD SUCCEEDED`, installed on the XS through devicectl (bundleID
`com.mugtaba.athan`). Team and UDID resolved at runtime from the cached profile and
`devicectl list devices`; written nowhere.

Capture: `pymobiledevice3 syslog live` unfiltered, started 22:37:53 (pid in
`~/athan-gitree/sessions/104/xs-capture.pid`), writing to
`~/athan-gitree/sessions/104/xs-capture.log`. Unfiltered on purpose: verdict N needs delivery
lines from system processes (`SpringBoard`, `usernoted`), which any `--process-name`/`--match`
filter would drop; the full stream is a strict superset of the app's tag, grepped at read time.
Throwaway launch 22:38:01 (What's New rule); 499 PERF lines verified in the capture within 12s
(including `perf_monitor_init`) BEFORE any owner moment, so the gate provably reached the device
bundle. The dev logger runs at `debug` (env unset), so PERF_MARK and PERF_MEASURE both stream.

Owner pass (batched pass one, 23:08:07-23:08:32 local; capture stopped cleanly after it at
2,266,316 lines). Her answers, verbatim: (1) unchanged close: "Immediate, as always".
(2) changed close: "Immediately at close" — the buzz landed at the close on this build, not
one-to-two seconds late. (3) the pager read belongs to row 103, not this ticket.

Unchanged close (23:08:07; a second at 23:08:16 identical in shape):

- `2026-10-15 23:08:07.239377 Athan{React}[91052] <DEBUG>: PERF_MARK {"seq":37,"ts":1792102087224,"name":"sheet_sound_close_start",...}`
- `2026-10-15 23:08:07.490488 Athan{React}[91052] <DEBUG>: PERF_MARK {"seq":39,"ts":1792102087448,"name":"sheet_close_haptic",...}` (+224 ms, the close animation; second close +240 ms)
- `2026-10-15 23:08:07.490595 Athan{React}[91052] <DEBUG>: PERF_MARK {"seq":40,"ts":1792102087489,"name":"sheet_close_haptic_settled",...}` (+41 ms after the dispatch; second close +21 ms)
- no `sound_commit_start`, no `sound_commit` measure — no commit on the unchanged path.

Changed closes (four, 23:08:17 / 23:08:20 / 23:08:24 / 23:08:30; identical shape every time).
Close #1 in full:

- `2026-10-15 23:08:17.465876 Athan{React}[91052] <DEBUG>: PERF_MARK {"seq":57,"ts":1792102097131,"name":"sheet_close_haptic","type":"mark","duration":0}`
- `2026-10-15 23:08:17.465930 Athan{React}[91052] <DEBUG>: PERF_MARK {"seq":58,"ts":1792102097131,"name":"sound_commit_start","type":"mark","duration":0}`
- `2026-10-15 23:08:17.466167 Athan{React}[91052] <DEBUG>: PERF_MARK {"seq":61,"ts":1792102097335,"name":"sheet_close_haptic_settled","type":"mark","duration":0}`
- `2026-10-15 23:08:18.910644 Athan{React}[91052] <INFO>: PERF_MEASURE {"seq":66,"ts":1792102097131,"name":"sound_commit","type":"measure","duration":1767}`
- preceding `sheet_sound_close_start` ts 1792102096910 (+221 ms to the dispatch).

Deltas, close #1: the dispatch and `sound_commit_start` share the same millisecond
(1792102097131); settle +204 ms after both; commit window [1792102097131, 1792102098898]
(1767 ms), settle 204 ms INTO it. Closes #2-4: dispatch = commit_start at 1792102100922 /
1792102104190 / 1792102110827, settles +219 / +226 / +211 ms, windows 1870 / 1835 / 1734 ms —
every settle after `sound_commit_start` and inside its window.

Native corroboration (CoreHaptics, same capture): unchanged close engine chain 23:08:07.4859 →
engine start 23:08:07.5037 (~56 ms after the dispatch epoch); changed close #1 engine chain
23:08:17.4625 → engine start 23:08:17.4797 (~349 ms after the dispatch epoch) — the native side
displaced with the ack.

Delivery check (verdict N): zero `usernoted` lines in 23:08:05-23:08:40; no SpringBoard banner
presentation lines (the only "banner" hits are trait-participant plumbing); the only "notif"
lines beside the settles are the app's own CoreHaptics `notifyWhenPlayersFinished`. Nothing
delivered at any buzz moment; N excluded, consistent with D104.3.

Confirmed verdict: **T (dispatch-side)** — the settle lands after `sound_commit_start`, inside
the `sound_commit` window, on all four changed closes; the unchanged close settles in +21-41 ms
with no commit marks. Today's displacement into the window was ~0.2 s (engine start ~0.35 s
after the close moment), imperceptible on glass — her answer "Immediately at close" — while the
window itself measured 1734-1870 ms, the same one-to-two-second scale as her original report.
The mechanism (the commit prefix taking the thread before the impact's native ack returns)
stands, matching the simulator's provisional T (settle +267 ms inside a 271 ms window). Step 3
(the sheet-side deferral) proceeds per PLAN D104.6.

Evidence: `~/athan-gitree/sessions/104/xs-capture.log` (2,266,316 lines) and `xs-capture.pid`;
build log `build-104-xs-part2.log` under $TMPDIR. The XS keeps the 2.0.794 instrumented dev
build. Nothing committed; the branch stayed empty and was deleted per the step's merge section.

session: ses_ebe8e2154ffeKuWtE6knZ3y0jo

### Step 3 — DONE (branch `fix/close-haptic-on-time` off `fdc542e0`, version 2.0.798)

Preflight: the one adjudicated failure only — `sheet-close-haptic.anchor` counts 0, the benign
case step 2's entry records (step 1's own contract changed the anchor text; proof unchanged:
`git diff 1aa9d21f..HEAD -- components/sheets/parts/Sheet.tsx` empty). Every other check green
(uat, clean tree, origin merged in, 2.0.797 >= floor, the other 5 anchors count 1). Step 3's own
anchors: `sound-handleDismiss` = 1, `saturation-comment` = 1.

Red: `defers the commit start past the next paint when a draft exists` first failed at
`components/sheets/screens/__tests__/Sound.test.tsx:317` —
`expect(commit).not.toHaveBeenCalled()` received 1 call `(6, 5, [Function updateAndroidChannel])`:
the commit was called synchronously in the dismiss tick. The other 22 tests in the Sound suite
passed.

Change (`components/sheets/screens/Sound.tsx`, `handleDismiss` only): module-scope
`deferPastNextPaint` (rAF, then setTimeout, the repo's idiom from the deferred widget push) beside
`SHEET_PERF_NAME`; `await deferPastNextPaint();` after the no-draft early return, before the
commit. Nothing else moved. Suite furniture: the store import became the namespace import the
spy needs (`jest.spyOn(NotificationStore, 'commitSoundSelection').mockResolvedValueOnce(true)`),
six call sites qualified.

Green: Sound suite 23/23, Sheet suite 27/27 (step 1's marks intact). `yarn validate` exit 0
after one Biome import-sort fix on the new import: jest 5678 passed, 5678 total.

Break: `bash $TMPDIR/104-scripts/break-104.sh defer` from the repository root — last line
`BREAK OK` (the await commented out, the new case red with the commit called before the frame,
file restored; `git status --porcelain` then listed only the step's files). Run a second time
after the review fix, same `BREAK OK`.

Version: 2.0.798 (next patch after uat's 2.0.797) in `app.json`, `package.json` and
`android/app/build.gradle`, app.json first.

Commit `ae25187f` (2.0.798), merged into `uat` as `0e5cd839` (no-ff). Hook:
`Tests: 5678 passed, 5678 total` (suites 215 passed, 215 total); coverage: Statements 100%
(5356/5356), Branches 100% (2312/2312), Functions 100% (1116/1116), Lines 100% (4797/4797).

Review (cold read of `git show ae25187f`): one finding, fixed and amended — the helper's comment
carried "(verdict T)", planning-lane provenance the repo bans in comments; trimmed to the why
(the verdict stays in the commit message, per the plan's own anticipated fix). Checklist clean:
code diff is the sound sheet and its test only, the deferral sits after the early return, the
verdict is in the commit message. Shipped classes: no lifecycle leak (the deferred chain is
one-shot and the commit was already designed to outlive the sheet), no worklet involvement, no
residue, no rule touched — the one-Light-at-completion rule is asserted by the new guard.

session: ses_ebe5bd031ffere1bI6gDHW4pKs

### Step 4 - build ready

Release dev build 2.0.811 (uat `f3d5015a`) on the XS, per the `e2e/device-atlas-iphone-xs.md` recipe: prebuild `--clean` with `EXPO_PUBLIC_IOS_WIDGETS=1`, plist 2.0.811 with both bundle ids checked, metro cache cleared, Release xcodebuild with `EXPO_PUBLIC_PERF_MONITOR=1` in the build env and the cached team inline (`BUILD SUCCEEDED`, artifact verified 2.0.811 before install), installed through devicectl as `com.mugtaba.athan` (the device's app list reads 2.0.811), one throwaway launch so the What's New sheet marks itself shown and her read starts clean. A first 2.0.809 build went stale before install (the 2.0.811 audit fix landed first) and never reached the phone; this 2.0.811 rebuild supersedes it. Marks stay baked on, no syslog capture this pass. session: ses_ebe230fc5ffeppyXZJv9k510Uw

### Step 4 - DONE (the owner's read)

Build: the pass-two Release dev build at 2.0.811 on the XS (the rebuild after the audit fixes;
the first attempt's 2.0.809 artifact went stale when the arrow's overlap moved to 7).

Her read, batched pass two, 2026-10-16: "At the close, both times" - the unchanged close and the
changed close both buzz immediately at the close, never twice, never late. R3.1 is met by her own
words; no defect named.

Ticket 104 moves to EXECUTED-complete; the lead's audit (three reviewers, findings at 2.0.810)
takes it to DONE.

session: ses_ebe230fc5ffeppyXZJv9k510Uw
