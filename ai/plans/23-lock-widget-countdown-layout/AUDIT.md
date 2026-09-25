# Audit: Session 23 — Lock Screen layouts

Audited after the fact, at the owner's instruction on 2026-09-25, because the session was merged and pushed
without an audit phase. That omission is finding 1 and the reason this file exists.

Range: `97bef7f4..b707b101`. Checked in a scratch worktree at `uat-2`
(`~/athan-device-sweep/worktrees/audit-23`).

## What was checked

| Check | Command or file | Result |
| --- | --- | --- |
| The range holds only session-23 commits | `git log --oneline 97bef7f4..b707b101` | 7 commits + merge, all session 23 |
| Versions in lockstep | `shared/__tests__/versionLockstep.test.ts` | Pass. `app.json`, `package.json` and the gradle `versionName` agree |
| Full suite and coverage | `yarn validate` in the worktree | 170 suites, 4662 tests, **100%** on all four measures |
| The guards still bite | four breaks, below | All four failed their named test |
| `releases.json`, `eas.json`, `uat`, EAS | `git show --stat` over every commit | Untouched |
| The API key | `git diff \| grep` for the key and the env name | Absent |
| Ignore comments, skipped hooks | `git diff \| grep` for `biome-ignore`, `--no-verify`, `istanbul ignore` | None |
| Shipped styling is self-consistent | parsed every `font`/`foregroundStyle` pair per layout | Consistent, and matches the owner's final rulings |

### Breaks rerun from the worktree

| Break | Expected | Result |
| --- | --- | --- |
| Unbold Layout 1's name | hierarchy test, layout 1 | failed 1 |
| Layout 1's countdown to solid | hierarchy test, layout 1 | failed 1 |
| Layout 1 loses its midline anchor | the split test, layout 1 | failed 1 |
| Layout 3's countdown loses `multilineTextAlignment` | the reserved-frame test | failed 1 |

Two tests report as skipped in the worktree (`audioMatrix.test.ts`): they are gated on a prebuilt `android/`
or `ios/` directory existing, which a fresh worktree has not got. Not a finding.

## Findings

**1. The audit phase was skipped, and the row was set DONE by the execution work itself.** `ai/plans/README.md`
says an audit session sets DONE for an EXECUTED row and that `uat-2` is pushed only once every unpushed commit has
been audited. Instead 1.28.9 moved the row from EXECUTED to DONE and the merge was pushed in the same breath, with
the justification written into the commit message. The owner's device acceptance across six builds is real evidence
and settles every user-visible question, which no audit session could judge, but it cannot check plan-versus-code
drift, record completeness or dead scaffolding. Fixed by this file existing. **Process note for the next session:
owner acceptance on device is not a substitute for the audit; it is the input the audit reads.**

**2. `LOG.md` stopped at 1.28.1 and missed everything after.** The record ended at the first commit, so a reader
would conclude the session shipped one commit and stopped, when six more followed, including the two that fixed the
centring and reordered the gallery. Fixed: `LOG.md` now carries every commit through 1.28.9.

**3. `PLAN.md`'s section 3 contract contradicted the shipped code in four rows.** The plan was written before the
owner had seen anything on the XS, and their rulings then superseded it. The plan still specified the name at 17pt on
layout 1, bold on every layout, and the countdown solid. Shipped: one size (14) throughout, bold on Layouts 1 and 2
only, and the countdown muted. The plan was also written before the gallery reorder, so its layout numbers pointed at
the old arrangement. A stale contract is worse than no contract, because a later reader trusts it. Fixed: section 3
rewritten to what shipped, with the supersession dated and attributed.

**4. Version gaps at 1.28.2, 1.28.5 and 1.28.6.** Each was bumped for a build, then superseded by further owner
feedback before the work was committed, so the number never reached a commit. Not a rule break: the repo requires the
three files to move in lockstep, not that versions be contiguous. Recorded so a reader does not hunt for missing
commits.

**5. The plan's own steps 1 to 4 were never ticked.** Section 5 lists four steps and none carries a commit reference.
The work all landed, but the plan cannot be read as a checklist of what happened. Folded into the `LOG.md` rewrite
rather than back-filling a checklist that the six rounds of owner feedback had already outgrown.

## Verdict

**PASS with findings, all fixed in this audit.** No defect in the shipped behaviour: the code does what the owner
approved on device, the suite is green at 100%, the guards fail when broken, and no owner rule was bent. Every
finding is a record or process defect, which is exactly what an audit is for and exactly what was skipped.

The row was already DONE before this audit ran. It stays DONE, now with evidence behind it.
