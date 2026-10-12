# Ticket 65 audit record

| Field | Value |
| --- | --- |
| Range | `origin/uat..uat` at `20baf58a` (steps `1fbf8d07` 2.0.115, `1677a180` 2.0.116, `5ce5d7cf` 2.0.117, executed docs `bbeded33` 2.0.118, merges `85c2142e`, `a05ce676`, `7373483a`, `20baf58a`) |
| Diff outside `ai/plans` | Version files only (docs-only invariant held) |
| Date | 2026-10-12 |
| Reviewers | Two: plan-conformance and blind, dispatched in parallel, both aimed at the findings' accuracy per PLAN section 11 |

## Plan-conformance review

Verdict: conforms on every contract point; one `should` finding.

- Docs-only invariant held across the range; the gitignored gradle file carries 2.0.118.
- All 191 inventory rows scripted against the worktree with zero mismatches; the six greps, the seven flows, the clean frame-audit, the three baseline-compare lines and the seven baselines keys reproduce.
- The probe's arithmetic reconciles (the `Sheet.tsx:153` Biome line is the edited file's numbering; 16 of 19 suites pass); versions 115 to 118 in sequence; D80, D81, D82 observed; probe worktree gone.

Finding 1 (should): 16 em dashes in FINDINGS.md and 3 in LOG.md break the `ai/AGENTS.md` writing style that sibling deliverables obey.

## Blind review

Verdict: the document's fabric verifies (both grep total sets, all 191 rows both directions, the e2e paragraph, the baselines values, every static corollary of the probe), with four claims that do not hold:

- Finding 1 (must): the sweep's directory list skips the jest-run repo-root `__tests__/` tree; `__tests__/app/Navigation.test.tsx:9,48,57,66` imports and asserts `perfMark`/`perfMeasure` (mock at `:17`), so the true surface is 196 hits on 178 lines across 31 files with a 7th suite, and section 3's full-cleanup list omits it.
- Finding 2 (should): the measurement describe holds six tests, not five, so "nine tests deleted or rewritten" undercounts at ten.
- Finding 3 (should): the orphaning tally is eight keys, not seven: the probe also kills `toggle_tap` (`LabeledToggle.tsx:22`) whose `toggle_tap_ms` sits at `e2e/baselines/android-3t.json:9`, already unmatchable through its `_ms` suffix.
- Finding 4 (nice): the "both scripts' headers state the split" claim is true only of `baseline-compare.sh:8-9`.

## Adjudication

All five findings confirmed from the code by the lead before fixing:

- Finding blind-1: confirmed by grep. `__tests__/app/Navigation.test.tsx` carries 5 symbol hits on 4 lines; totals become 196/178/31 with a 7th suite (`perfMark` 77 to 80, `perfMeasure` 37 to 39; the non-test count stays 24). The plan's own grep contract omitted the directory, so the executor followed a defective plan faithfully: the plan is wrong, the defect is real.
- Finding blind-2: confirmed by reading `Sheet.test.tsx` (an `it.each` of three rows plus three `it`s inside the describe).
- Finding blind-3: confirmed at `LabeledToggle.tsx:22` and `android-3t.json:9`.
- Finding blind-4: confirmed: `frame-audit.sh`'s header has zero matches for the split sentence; `baseline-compare.sh:6-9` carries it.
- Finding plan-1: confirmed against the explicit `ai/AGENTS.md` writing-style rule.

## Fixes applied

One branch `fix/audit-65-findings-corrections`, one version 2.0.119, one commit `e7753c30`, merged `f741347f`: FINDINGS.md corrected to the 196/178/31 surface with the `__tests__/` re-sweep recorded in the method paragraph and five Navigation rows added to the observers group (retitled five UI suites, count 37); the describe counted at six and the deleted tests at ten; the orphaning tally at eight keys with the `toggle_tap_ms` note; the split sentence attributed to `baseline-compare.sh` alone; section 3's full-cleanup list now names the observer suites and the Navigation suite; every em dash in both files replaced (zero remain outside the template-mandated `### Step 0N — done` headings). LOG.md's measured counts are left as the executor recorded them: the executor measured the plan's scope, the audit widened it, and this file records the difference.

## Ruling

PASS after fixes. Queue cell applied with the corrected summary folded per D82; plan folder closes in the DONE commit; no session evidence exists to delete (no device step, probe worktree deleted before step 2 merged).
