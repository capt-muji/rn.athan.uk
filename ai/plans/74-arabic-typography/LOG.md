# LOG 74

## Planning (2026-10-13)

## Ticket 74

Planned on lane/74 off uat line `cfb9b837` (2.0.201). The owner is away; her 2026-10-13 RTL-test
rulings are the brief. Facts measured at plan time: the token layer (`shared/constants.ts:292-323`),
the two Roboto faces' metrics, the candidate Noto Sans Arabic v2.013 metrics and digests, today's
fallback face for the record, the relaunch path (`stores/language.ts:77-89`), the per-locale width
keys (`stores/ui.ts:113-131`). Decisions D74.1 to D74.8 in PLAN.md section 2.

Grill round one found 16 defects (9 must, 4 should, 3 nice); all applied — the jest project name,
the preflight Needs-first check, two inventory weights (Qibla action, Update cancelText), the
Countdown.text unset-family contract via `ty.arabic`, the guard exception for D74.6 styles, the
D74.3 seven-site enumeration, R1.8/R1.9 as live-resolution clauses, the red-build sha and red-en
baseline in step 3, the 1.142 rounding rule, the 25-file counts, the FONT-MEASUREMENTS.md
survival line, preflight copy-out paths, the uat-tip wording, per-file sxHeight.

Grill round two found 7 (2 must, 5 should); all applied — the preflight expected-drift argument
schedule (this plan's own merges drift anchors 04 and 05-10 on a known schedule), the
unused-exports gate allow-list entry that step 2 removes, the Countdown ternary source
assertion and its break target, the 10-to-12 first-failure line, the RNTL-inside-isolateModules
sentence, the R1.2-to-digests tie, step 1's drift clause.

Gate `PLAN OK` after both rounds.

### Step 1 — pending

session: pending

### Step 2 — pending

session: pending

### Step 3 — pending

session: pending
