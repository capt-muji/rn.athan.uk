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
