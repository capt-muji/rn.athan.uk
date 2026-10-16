# Audit 123

Range audited: `8a44f0ab..a72eacb6` (the lane's whole range: skeleton, READY, three docs steps),
docs-only, no code changed. Two passes, both dispatched cold over the diff and the lane
worktree: one plan-conformance (the plan folder plus the diff) and one blind (the diff plus
`ai/AGENTS.md`, never the plan). Both reproduced the numbers and the anchors; every finding was
adjudicated from the code myself before any fix.

| # | Pass | Finding | Verdict | Fix |
| --- | --- | --- | --- | --- |
| 1 | blind, plan-conformance | FINDINGS 1.5 cited `WidgetRefreshModule.kt:17-20` for the watchdog force-stop comment; the comment is `:21-24` | confirmed | cite corrected to `:21-24` |
| 2 | blind | FINDINGS 2.1 and 2.2 labelled the plus 8 then plus 47 reading "force-stop"; the cited lines are a backgrounded controlled experiment and the 1.28.20 before column, and the record names no force-stop for it | confirmed | row relabelled "label frozen", cause stated as unnamed; 2.2 attributes the force-stop's own magnitude (plus 3 over three edges) separately |
| 3 | blind | FINDINGS 2.2's "reached, and exceeded, only by the artificial force-stop" did not hold for the same reason | confirmed | rewritten to the frozen label, with the force-stop's own reading named |
| 4 | blind | FINDINGS 2 section header dated the deep clean `eb86b063` 2026-10-08; both its timestamps read 2026-10-07 | confirmed | date corrected |
| 5 | blind | FINDINGS 1.3 listed `stores/widget.ts:335` as a call of `refreshPrayerWidgets`; that line calls `pushScheduleAndroid`, and the module's own call is `:135` | confirmed | the flip chain is now described as re-pushing through `pushScheduleAndroid`, "twice" dropped |
| 6 | blind | FINDINGS 3.3 attributed two strip classes to the 3T atlas; the atlas names `OverwritingInputMerger` alone and 58.0.16's entry carries the `RoomDatabase` case, with no 3T record | confirmed | each class attributed to its own source |
| 7 | blind, plan-conformance | all three LOG step headings read `IN PROGRESS` after their commits merged | confirmed | headings set to `DONE (version, commit, merged)` |
| 8 | plan-conformance | step 2's commit did not set the queue row to step 2; the row read step 1 until step 3 set EXECUTED | confirmed | recorded in the step 2 ledger entry; the row carries the final text at DONE |
| 9 | blind | FINDINGS 1.1 put `onReceive` at `WidgetRefreshReceiver.kt:12`; `:12` is the class | confirmed | cite corrected to `:13` |
| 10 | blind | FINDINGS 1.1 and the 1.2 table stated a plain exact alarm; the code falls back to `setAndAllowWhileIdle` when exact scheduling is denied | confirmed | the fallback and its range named in 1.1 |
| 11 | blind | FINDINGS 1.5 omitted the 2500 ms gap that R1.3 names | confirmed | `COMPOSE_PASS_DELAY_MS` and its line added |
| 12 | plan-conformance | FINDINGS 1.4 cited `WidgetRefreshScheduler.kt:139-152` where the ledger says `:138-152` | confirmed | one range throughout: `:138-152` |
| 13 | blind | FINDINGS 1.4's "`updateSnapshot` is Android-only in effect" ignored the non-Android arm | confirmed | rewritten: the app rides the Android arm; the other arm maps onto a one-entry `updateTimeline` |
| 14 | blind | FINDINGS 3.4 said the locale hunks touch "all four runtime files"; they touch the cpp file plus three | confirmed | the three files named |
| 15 | blind | PLAN section 1 quoted `ai/AGENTS.md:107` and `:144`; the sentences open at `:106` and `:143` | confirmed | ranges corrected |
| 16 | plan-conformance | the row at EXECUTED carried no recommendation, rivals or threshold, so R4.1 read as unmet | rejected as a defect, accepted as sequencing | R4.1 is written "WHEN the queue row is updated at DONE"; the plan's section 8 cell is applied in the DONE commit, which is this audit's own step |
| 17 | plan-conformance | the step 1 commit rewrote one PLAN ledger-contract line unrecorded | confirmed | recorded in the step 1 ledger entry |
| 18 | plan-conformance | the lane's merge commits repeat the step subject instead of the repo's `merge <branch>: ...` form | confirmed | the DONE merge uses the branch form |

Nothing in either pass contradicted the investigation's substance: the refresh-path inventory,
the layer table, the cited-versus-recollected split, the pin table, the changelog delta, the two
stale shipped reasons, the eight residual gaps, the three options and the recommendation all
reproduced from the sources, the commit shas and the recovered record. The gate prints
`PLAN OK` after every fix above.

The audit fixes are docs-only and land on `docs/audit-123-20261016`. The plan folder, this file
and the queue row's final text die or land in the DONE merge per the records rule.
