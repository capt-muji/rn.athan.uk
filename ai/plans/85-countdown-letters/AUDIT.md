# AUDIT — ticket 85

Range: `git diff origin/uat..uat` at `d9a4408a` (884 lines, `ai/plans` excluded):
one code commit `5e15fe15` (2.0.733) plus the version bumps. Two reviewers ran in
parallel over the diff and a worktree at `uat`: plan-conformance and blind. No
third pass: the change touches no notifications, data or schedule.

Both passes verified behaviour independently: the handed files landed byte for
byte, every rewritten test's arithmetic holds against `formatTime`, the
empty-row edge is unreachable (a compact `00:00` needs 600 s or more with zero
hours and minutes, which the 599 s seconds window forbids), no caller of any
deleted export remains (`tsc --noEmit` clean), the sweep grep prints nothing,
and the named suites pass under the reviewers' own runs. No behavioral defect
was found by either pass.

| # | Pass | Severity | Finding | Verdict |
| --- | --- | --- | --- | --- |
| 1 | plan | should | `Countdown.test.tsx:3` header says "the capital unit letters"; the ruled design and every assertion is lowercase | Confirmed, fixed. The owner's ruling is lowercase h m s (PLAN 2.1, the queue row); the prose is the defect, carried in by the handed file, so the plan was wrong on that byte |
| 2 | blind | should | `Countdown.test.tsx:77,89,124` test names read "1H alone", "1H 5S", "0S alone" against rendered `1 h`, `5 s`, `0 s` | Confirmed, fixed. Same defect class as 1: prose contradicting the ruled lowercase letters |
| 3 | plan | should | `constants.test.ts:381-382` title and comment name "the dim digit colour" / "the track matches the dim digits exactly"; the dim-digit design died in this ticket | Confirmed, fixed. Reworded to the track's own ink |
| 4 | blind | should | Same as 3, found independently | Merged into 3 |
| 5 | plan | nice | PLAN.md 231/237 and the queue's READY cell still describe a two-step structure the plan collapsed into one | Rejected as a fix: the plan folder and the READY cell die in the DONE docs commit, which replaces the cell text. Nothing a future reader reads changes |
| 6 | blind | nice | `Countdown.tsx:28` letter ink is a component-local literal; move it to `COLORS.countdown` | Rejected: `COLORS.countdown` holds the prayer-row colon inks (`timeColon` and family), not the display's palette, and the bar's track ink already lives as its own literal (`COUNTDOWN_BAR.TRACK_COLOR`), so component-adjacent ink literals are the pattern here. The test pins a copied literal, which fails on any drift in the source value; through a shared key it would pass silently. The handed file is the owner-approved implementation, bound byte for byte by the plan |

Fix: branch `85/audit-fixes`, one commit, 2.0.735, prose only (the suite header,
three test names, one title, one comment). No behaviour changes, so no red test
can exist for it; the pre-commit hook's gates re-ran green on the commit. The
executor's break-1 concern (its final `git diff --quiet` compares worktree to
index) was adjudicated at execution return: both mutations were caught and the
restore was byte-identical, the script dies with this folder, no fix owed.
