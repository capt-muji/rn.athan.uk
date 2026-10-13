# Ticket 71 audit (2026-10-13)

Range: `origin/uat..uat` at `e3ec0c8b` (READY `118fb30e`/`98c948ff` 2.0.188, grill
`730a3756` 2.0.189, step 1 `2d27c05b`/`63dbb429` 2.0.190, replan D91 `daa30fec` 2.0.191,
step 2 `a7820211`/`c2133285` 2.0.192, ledger `e3ec0c8b` 2.0.193). Docs-only ticket: no
code file touched anywhere in the range. Two reviewers (plan-conformance, blind) ran in
parallel over FINDINGS.md, the ledger and the captured evidence under `sessions/71/`.

## Verified clean

- R1.1 to R1.3 answered with 24 citations re-read by the conformance reviewer, all true;
  all 19 anchors count exactly 1 at the tip; the verdict and sections 3 to 5
  byte-identical to their plan sources (the one deliberate post-audit deviation is
  finding B3 below, recorded there).
- R2.1/R2.2 hold as D91 scoped them: section 7's block byte-identical to
  `logcat-drive1-full.txt:7737-7765`, one block with the `AppStateModule.onHostPause`
  frame, span 1.397 s, pid unchanged; R2.3 holds (zero FATAL, evidence saved, English
  face).
- Section 8's table byte-identical to NOTES.md, no rate or cause claimed. The blind
  reviewer independently confirmed the silent signature against both starved raw logs.
- The verdict survives a hostile read: no repo-side change can suppress a native-to-JS
  emit; the starvation question is correctly row 78's.
- No real serial or model identifier anywhere in the repo (both reviewers grepped; the
  pre-commit gate caught and this audit fixed the one leak the first device worker left
  in the ledger).

## Findings and verdicts (all confirmed, all fixed in this audit)

1. [should, conformance] The ledger commit's subject claimed 2.0.192 while bumping the
   version files to 2.0.193, and duplicated step 2's subject. Fixed by amending the
   commit (`e3ec0c8b`).
2. [should, conformance] A stray duplicated session line after the contracted one.
   Deleted; the contracted line stands alone.
3. [should, conformance] The ledger cited `7cce6f1e`, the step-1 worker's pre-amend sha;
   the merged commit is `2d27c05b`. Repointed.
4. [should, blind] FINDINGS.md:72 cited a section name that does not exist; the
   suppression argument is section 3. Fixed.
5. [should, blind] FINDINGS.md:78 cited "the traced chain of section 4"; the chain is
   section 2. Fixed.
6. [should, blind] The section 6 cost sentence ("one non-fatal log line per RTL boundary
   crossing") is contradicted by the document's own section 8 (fired on 3 of 6
   crossings). Fixed to "one logged exception block whenever the reload fires". The same
   unqualified phrase sits in the plan's step-1 source; the plan folder dies at the DONE
   merge, so the fix applies to the deliverable and this record.
7. [should, blind] Two "row 68 record" attributions carry the 1.5 s span and the
   onHostPause frames; both belong to row 71's cell. Fixed in both places.
8. [nice, blind] "A tree that dies about 1.5 s later" misdates the teardown (1.5 s is
   the exception-to-marker span). Fixed to "a tree the reload tears down" in both
   places.

## Verdict

PASS. Eight findings, all confirmed, all fixed in this audit; the D88 verdict stands,
and the starvation carries to row 78 with the evidence preserved under `sessions/71/`.
