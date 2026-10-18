# AUDIT 137

Two reviewer passes per D137.9, each re-deriving every number computationally.
The lead adjudicated every finding against the record before this file was
written; confirmed fixes landed in this same audit commit.

## Pass 1 - plan-conformance

Range: 7aeaa85a^..uat (every 137 commit from READY through the step-4 merge)
Findings: findings-plan-137.md

Verified by the pass: the table script reruns byte-identical against both
EXPECTATIONS.md blocks; all seventeen em ratios, pins and distances recompute;
every nearest-candidate cell matches the table; the DIFFER verdict applies the
step-4 rule surface by surface; every step contract discharged in its LOG entry
and findings file; R1.1 through R5.1 hold including both PENDING pins closed
through VISION-137.md; hygiene clean (no code, no screenshot, no serial, no
UDID, versions paired on every non-merge commit, messages carry versions).

Adjudication of its four findings:

1. SHOULD, Help answer em 1.554 against the true 1.553 (53 / (13 x 2.625) =
   1.5531), three sites. CONFIRMED, fixed in all three (FINDINGS-3T.md twice,
   FINDINGS.md once).
2. NICE, colon corroboration bounds subtract to 71px, recorded 70px. CONFIRMED,
   fixed to 71px.
3. NICE, the two HOME findings' body cells still read PENDING although
   VISION-137.md closes them. CONFIRMED, both cells and both pin-note
   paragraphs closed at their measured values citing VISION-137.md.
4. NICE, steps/3-iphone-xs.md names `xs-sheet.png` where the executor wrote
   `xs-02-settings.png`. CONFIRMED, the contract now names the real file.

## Pass 2 - blind

Range: 7aeaa85a^..uat
Findings: findings-blind-137.md

Verified by the pass: independent fontTools reads confirm every metric-set
ratio of the three TTFs including fsSelection bit 7; every surface's size,
face and pin matches the code at uat; the evidence JSONs carry every recorded
bound verbatim and the capture pairs agree; no MUST finding; nothing changes
the DIFFER verdict, the pin closings or the voids.

Adjudication of its seven findings:

1. SHOULD, "63px against its 62.625 pin" wrong (24 x 2.625 = 63.0). CONFIRMED,
   fixed to "against its 63 pin, exact".
2. SHOULD, the 1.554/1.553 em slip. CONFIRMED (same as pass 1 finding 1),
   fixed.
3. SHOULD, the residual sentence miscounts. SPLIT: "75 vs 73 at 18, four
   surfaces" is wrong (date, name, time: three surfaces) and is fixed;
   "five new unpinned points read +2" is correct as written (location, date,
   name, time and the 18 Medium title all read +2; the word scatters and is
   named separately in the same sentence), corroborated by FINDINGS.md's
   seven-at-+2 total across both measurement steps - that half is rejected
   with that line.
4. SHOULD, "nine screenshots" overstates: eight transcribed of ten on disk
   (the check-duplicate and restore shots sat unread, no surface rides on
   them). CONFIRMED, VISION-137.md and LOG.md now say eight.
5. NICE, the colon 70px/71px bound. CONFIRMED (same as pass 1 finding 2),
   fixed.
6. NICE, the row's problem cell names the FleetTest mock 2.0.996 while the
   measurement drove 2.0.908 under the recorded vehicle ruling. CONFIRMED as
   a real confusion for a row-only reader; her problem text stays untouched
   as history, and the OWNER-LED cell the close applies names the true
   vehicles (3T 2.0.908, XS 2.0.939, both Rubik-era).
7. NICE, rows 136 and 117 carry pipe damage from interleaved foreign commits
   inside the audit range. REJECTED as a 137 action: those rows belong to
   lanes 135/136 and the orchestrator's push gate; reported onward in the
   lane's return.

Both passes noted the worktree sat on `step-137/verdict` rather than
`lane/137` (content identical to uat): the step-4 executor's cut, switched
back at this audit commit.
