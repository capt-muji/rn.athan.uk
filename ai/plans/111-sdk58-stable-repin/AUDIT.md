# AUDIT 111 (the doctrine run's audit)

Range under review: the re-pin commit `0118393a` (merge `9dd4eb6a`, 2.0.908) and the records
commit `a1b95ef2` (2.0.958, merge `7e029a34`). The step-2 3T gates and the step-3 device proofs
changed no repository code. The diff derives from those two commits (the convenience file
provided to the reviewers was a pre-rebase snapshot; all three reviewers derived from git).

Passes: plan-conformance, blind, threading/lifecycle (the re-pin touches notifications and
schedules). Verdicts: threading PASS (0 must), blind PASS (0 must), plan-conformance FAIL
(2 musts, both records-accuracy, no code defect). Every confirmed finding is fixed in the
audit-fix commit.

| # | Pass | Finding | Verdict | Action |
| --- | --- | --- | --- | --- |
| 1 | threading | `backgroundTaskPatch.test.ts` never guards that Gradle compiles the patched Kotlin rather than resolving the shipped prebuilt AAR (the session-49 silent-unpatched mode; `expo-location` has that guard, `expo-background-task` does not) | CONFIRMED (should) | Fixed: the suite now asserts the installed `expo-module.config.json` carries no `publication` block |
| 2 | threading | `ai/UPSTREAM-PRS.md` says "Published builds to 58.0.10 still hardcode both constraints" - stale, 58.0.11 is current and still hardcodes (its own pristine source) | CONFIRMED (nice) | Fixed: the row reads "to 58.0.11" |
| 3 | threading | `scripts/verify-expo-location-patch.sh`'s comment claims "a shipped package carries no copy a check could look for" - false: `expo-location@58.0.17` ships `local-maven-repo` at the package root; the deleted check was vacuous only because it looked under `android/` | CONFIRMED (nice) | Fixed: the comment states the repo's true location |
| 4 | blind | `SDK58-PROGRAMME.md` "two transitive followed" undercounts: three transitive moved (`babel-preset-expo`, `expo-application` 58.1.1 to 58.1.2, `expo-modules-core`), verified in the re-pin commit's lock hunks | CONFIRMED (should) | Fixed: all three named |
| 5 | blind | `e2e/README.md` names "(metro-config 0.88.0)", a pin the tree does not carry (`metro-config` resolves 0.87.1; `@expo/metro-config` 58.0.14; `@react-native/metro-config` 0.88.0) | CONFIRMED (should) | Fixed: the sentence names `@react-native/metro-config` 0.88.0 beside `@expo/metro-config` 58.0.14 |
| 6 | blind | = finding 2 above (58.0.10 bound) | CONFIRMED (should) | Fixed with finding 2 |
| 7 | blind | `SDK58-PROGRAMME.md` section 16's A3/A4 cite preview-state pins (`expo@58.0.6`, RN 0.88.0-rc.3, `@expo/ui`/`expo-widgets` "no longer exact-pinned" at 58.0.14, log-box `~58.0.5`) under "proof that still stands" | CONFIRMED (should) | Fixed: A3/A4 re-pinned to the current tree (expo 58.0.13, RN 0.88.0 stable, both exact at 58.0.20, log-box `~58.0.12`) |
| 8 | blind | `ai/ISSUES.md` row 37 names `patches/expo-background-task+58.0.7.patch`, dead since the re-pin | CONFIRMED (should) | Fixed: `+58.0.11.patch` |
| 9 | blind | doubled blank line after the UPSTREAM-PRS patch table | CONFIRMED (nice) | Fixed |
| 10 | blind | eight added LOG lines carry em dashes against the style ban | CONFIRMED (nice) | Fixed: prose rewritten; step-heading dashes keep the file's own established convention |
| 11 | plan | the LOG says the rollover capture "NEVER RAN ... no -pre/-post screenshots exist" while `00-rollover.log` records `lock held 02:25:48` / `done 02:25:53` and the three screenshots plus syslog exist (the unbounded mkdir retry succeeded once the lane's lock dropped; the capture ran 3h25m past midnight, all its gates long passed) | CONFIRMED (must, records accuracy) | Fixed: the LOG's error paragraph and the queue row carry the bounded truth (starved through the window; degenerate five-second run at 02:25; the flip unobserved; the R4.8 close unchanged) |
| 12 | plan | the R4.8 cascade and R4.2 cover-sheet entries cite screenshots that existed only in the session temp, not the evidence store | CONFIRMED (must, records accuracy) | Fixed: the eight night captures copied into `sessions/111/xs/`, the LOG names their storage; the cover-sheet read recorded as the AX-tree transcription it is |
| 13 | plan | AUDIT.md named the records commit as the soft-reset-away `1ec23b37` | CONFIRMED (should) | Fixed: `a1b95ef2` / `7e029a34` / 2.0.958 |
| 14 | plan | the records commit carried no recorded review verdict | CONFIRMED (should) | Fixed: the verdict recorded in LOG (clean in all three passes bar the findings above) |
| 15 | plan | the 2.2 npm-drift STOP was live at step 3's start (58.0.14 published 19:51Z, step 3 began ~19:54Z) and no step-start check ran | CONFIRMED (should) | Fixed: the omission recorded in LOG's npm note, subsumed by the close-at-58.0.13 ruling |
| 16 | plan | step 4's session line was a placeholder with no state word | CONFIRMED (nice) | Fixed: the state and the in-session limitation recorded |
| 17 | plan | PLAN.md R1.9's literal wording is unsatisfiable for a regeneration patch (removal hunks quote the removed symbol) | CONFIRMED (nice) | Fixed: R1.9 aligned to the LOG's restated reading |

