# AUDIT 104

Range: `00c63936` (2.0.792, the marks) and `ae25187f` (2.0.798, the deferral fix) plus their
merges; audit fixes at 2.0.810. Three reviewers dispatched in parallel worktrees:
plan-conformance, blind, and a threading-and-lifecycle blind (the change rides a dismiss-time
async path). The owner's acceptance read landed at 2.0.811: "at the close, both times".

Verdict: PASS. Both code steps conform on every criterion, contract line and recorded claim;
the verdict trail (simulator provisional T, XS confirmed T) reproduced verbatim from the
captures by the plan-conformance reviewer.

| Finding | Source | Verdict |
| --- | --- | --- |
| Backgrounding inside the dismiss-to-frame window parks the commit; process death during the park loses the pick while the subtitle promises close-to-save | threading, should | RISK CONFIRMED, FIX REJECTED: the proposed dismiss-tick persistence breaks the store's rollback invariant (preference write and scheduling share one lock so a failed re-arm can never leave the displayed athan disagreeing with the armed one). Carried to row 108 for the owner's call |
| The no-perf-name test never fires dismiss, so its named guarantee is false on device | blind, should | FIXED at 2.0.810: the close fires, the haptic marks asserted as the only ones |
| The deferral test survives removal of the rAF hop (a bare 0ms timer mutant passes) | blind, should | FIXED at 2.0.810: the 0ms-advance assertion kills the mutant |
| The marks test leaks its mockImplementations into later tests | blind, nice | FIXED at 2.0.810: both restored at test end |
| The settle-mark then-callback leaves a rejection unhandled | threading, nice | REJECTED: the blind reviewer verified the exposure identical before and after the change; a swallowing catch adds nothing |
| Pre-existing second-dismiss race beside the deferral (the running first commit's clear can null a second draft) | threading, nice | CARRIED to row 108 (pre-existing, out of the diff's scope) |
| Fourth copy of the rAF-then-setTimeout deferral idiom | blind + threading, nice | CARRIED to row 108 as a refactor candidate |
| The preflight's six-anchor gate is stale after step 1 by the plan's own design | plan, nice | NOTED: plan-writing defect (also hit by row 106's plan); future plans give each step's preflight only that step's anchors |

The owner's first-read anomaly (the buzz landing at the close on the 2.0.794 build, before the
fix) is explained by the capture: that build's commit window ran 1.7-1.9s while the settle
displacement was only ~0.2s, imperceptible against the close; the mechanism was present and is
what the fix removed. Evidence under `$HOME/athan-gitree/sessions/104/` died with this merge.
