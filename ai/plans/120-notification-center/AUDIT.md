# AUDIT: ticket 120, the iOS delivered-notification stack

Range audited: `9dd4eb6a..uat` at the audit's start, i.e. the ten commits of ticket 120: the
planning pair (skeleton, READY), the three step commits and their merges. Code-side diff: the two
tracked version files only (2.0.908 to 2.0.912), which is the correct shape for a docs-only
investigation. Docs diff: the plan folder and the queue row.

Passes: one blind reviewer (the findings document plus `ai/AGENTS.md`, every number re-measured
against the repository) and one plan-conformance reviewer (the plan folder, the ledger and the
diff). A third pass is not owed: no code touches notifications, data or the schedule.

## Adjudication

Findings and verdicts are recorded below as each reviewer returns. A confirmed finding is fixed by
the audit itself, red-first where a test applies (none applies here: no code ships), and every fix
lands in one named commit before DONE.

## Pass 1, blind (FINDINGS.md plus `ai/AGENTS.md`, every number re-measured)

The reviewer reproduced the sweep (empty at the cited directories, and empty across the other app
directories too), every app-code citation, every installed-package citation at 58.1.5, the ledger
recovery route, the volume arithmetic (with `Off` costing zero and Silent or Sound costing one),
the two init call sites, the delivered-only scope of the dismissal, and the Android one-visible
mechanism (the delegate rewrites the tag and the library derives the id from the constant zero).
Eight text findings, all confirmed; none rejected.

| # | Verdict | Fix |
| --- | --- | --- |
| 1 the ledger records one Magrib reminder, so the second is derived | confirmed | FINDINGS section 2.1 now says the ledger records the five-minute reminder only and the second slot is derived from the armed time |
| 2 `categorySummaryFormat` is an input-side header lever, so "app code cannot name a thread's header" is false | confirmed by source (`Notifications.types.d.ts:754`, `TriggerRecords.swift:366,376`) and fixed in FINDINGS, PLAN (D120.4, section 4, section 8's draft, section 12) and the queue row | the rejection now reads: the content input carries no summary field, a category's `categorySummaryFormat` names the group, and naming the group removes nothing |
| 3 the iOS grouping semantics are platform-documented, not confirmed on her phone | confirmed | the row is labelled "platform-documented, not confirmed on her phone" |
| 4 the retention claim is a device claim | confirmed | tagged `UNMEASURED` beside the rendering, with the API pointer kept |
| 5 "every call is bounded at 15 s" is false app-wide | confirmed | the row now names what is bounded (this module's arming, cancelling and channel calls) and what is not (the permission calls) |
| 6 the open moment does not clear a notification that fires while the app stays open | confirmed | the lever row now says a later foreground delivery waits for the next open |
| 7 the header sentence contradicts section 4 | confirmed | the clause is deleted |
| 8 the locked state is inherited, not measured here | confirmed | the record now dates the state 18:22 on 2026-10-16 and names it inherited |

One finding of the plan grill (finding 10, the read-side type range) had been lost in the rebase's
conflict resolution and was restored by the same edit set, which the reviewer's finding 2 covers:
the range now reads `Notifications.types.d.ts:450-480` with `summaryArgument` at `:466`.

## Pass 2, plan-conformance (the plan folder, the ledger, the diff)

The reviewer regenerated both diffs, counted every anchor independently of the pre-flight (all
eight count 1), traced each criterion to evidence, checked the three step commits and their
merges (files, messages, versions in sequence), checked the queue cell line by line against the
pinned sources, and confirmed that the range touches only `ai/plans/**`, `app.json` and
`package.json`. Eight findings.

| # | Verdict | Fix |
| --- | --- | --- |
| 1 the read-side range stands wrong in FINDINGS | confirmed, and already fixed by pass 1's finding 2; the range `:450-480` is right, `NotificationContentIos` closing at the `};` on line 480 | no further change |
| 2 the step-1 ledger credits an edit made in the READY amendment and omits the edit its own commit carries | confirmed | LOG's step-1 entry now names its one FINDINGS edit (`12-42` to `12-39`) and says the changelog re-measure rode the READY amendment; the grill record now states where the correction was still outstanding |
| 3 the retention claim is untagged in section 2.2 | confirmed, fixed by pass 1's finding 4 | no further change |
| 4 the queue cell does not name the option set, which dies with the folder | confirmed | the cell now names all five options and marks the recommendation |
| 5 the READY commit carries no version bump of its own, so two commits and two merges in the range read 2.0.909 | confirmed against `ai/AGENTS.md:89`. `uat` history is never rewritten, so the fix is this record: the rebase onto `uat` re-applied the version hunk to the first commit and the conflict resolution consumed the second's, leaving both at 2.0.909; the three step commits each bump one patch (2.0.910, 2.0.911, 2.0.912) and the versions are unique and above the base | recorded here, no history rewrite |
| 6 the ledger's opening says the lane is branched from `b329d543` after the rebase | confirmed | the opening now gives both the cut sha and the rebased base with the reason |
| 7 the step-1 evidence header still reads 58.1.4 | confirmed | the evidence header now reads 58.1.5 (the directory dies with the DONE merge, so the correction is recorded here) |
| 8 the shipped checklist is unticked | confirmed | ticked; the tick lands in this audit's commit |

Nothing was rejected. No finding required a code change, because no code ships with this ticket.
