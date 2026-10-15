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
