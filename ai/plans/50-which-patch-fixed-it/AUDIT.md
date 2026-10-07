# Audit: Session 50

Audited 2026-10-02, in a scratch worktree with `node_modules` symlinked from the main checkout.

**Verdict: PASS, after one finding fixed in this session.**

## What was checked, and with what

| Check | Command or file | Result |
| --- | --- | --- |
| The range holds only this session's commits | `git log --oneline origin/uat-2..uat-2` | 4 commits: step 1, its merge, step 2, its merge. Nothing else |
| The breaks still guard, from an independent checkout | `bash $TMPDIR/breaks-50-step1.sh` in the audit worktree | `caught 8 of 8`, `ALL AS EXPECTED: 1` |
| The whole suite | `yarn validate` | exit 0, **187 suites, 5010 tests**, 100% statements, branches, functions and lines |
| No new dead code | `python3 scripts/find-unused-exports.py` | 504 symbols scanned, 5 unreachable, all 5 pre-existing and allow-listed |
| Biome and tsc | `npx biome check . --error-on-warnings`, `npx tsc --noEmit` | both exit 0 |
| The guard works on the real tree | `bash scripts/verify-expo-location-patch.sh` | `PATCH AS SHIPPED` |
| `node_modules` is the patched state and nothing more | `diff -r node_modules/expo-location <yarn cache copy>` | differs ONLY by the three intended patch changes |
| No experiment leaked into history | `git merge-base --is-ancestor <ref> uat-2` for all 4 throwaway refs | all 4 unreachable from `uat-2` |
| No stray branches or worktrees | `git branch`, `git worktree list` | only pre-existing branches; main checkout, 5 build caches, this audit worktree |
| Both phones left on the approved build | `xcrun devicectl device info apps`, `adb shell dumpsys package` | both report **1.29.217** |
| Automatic time restored | `adb shell settings get global auto_time` | `1`. It was never changed |
| The widget nested-copy trap | `shared/__tests__/widgetRuntimeLoads.test.ts` after the full restore | `3 passed` |

## Finding: FIXED, the device evidence files the plan specified were never written

**The finding.** The plan required the owner's verdict recorded verbatim in
`~/athan-device-sweep/session50/<X>-verdict.txt` and the sensor rate in `<X>-rate.txt`. Execution
captured the guard output, build logs and diffstats, but wrote the verdicts only into `VERDICT.md`.

**Why it matters.** `AUDITOR-BRIEF.md` requires every claim in the records to be backed by a file under
`~/athan-device-sweep/session<N>/`; with the verdicts living only in the prose that cites them, the
prose was its own evidence: the shape of defect sessions 44 and 49 both recorded (a guard that passes
because it matched its own source).

**The fix, applied:** five `<X>-verdict.txt` files written, each carrying the owner's words verbatim,
the build it judged, the ref or edit that isolated it, and the verdict; plus `B-rate.txt` with the live
`dumpsys sensorservice` block (`selected = 20.00 ms` is load-bearing for B, which isolates the gate
from the rate).

**It surfaced an honest gap, now stated rather than implied:** no `dumpsys` equivalent was captured on
iOS, so experiment D's rate figures are modelled rather than measured on the phone. `D-verdict.txt`
says so in its own NOTE ON METHOD, and `VERDICT.md`'s D table is labelled as a model. Every other rate
claim in the row is a device reading.

## What the row's own records got right

- **Two wrong predictions recorded as wrong, with their mechanisms** (B's 87%-never-draws figure
  describes a phone on a table, not in a hand; the figure-eight hint makes the first reading four
  times worse, not better).
- **The founding hypothesis recorded as refuted** three ways, not quietly dropped.
- **A defect in shipped behaviour found and queued rather than fixed in passing**: the calibration
  hint's 3.7s/11.88deg vs 9.7s/2.98deg defect went to `NEXT-SESSION.md` with the design decision left to
  the owner (row 52 has since taken the animation).

## The owner's rules

| Rule | Held |
| --- | --- |
| No visual change | Yes. Experiment E removed a visual element in a throwaway ref only |
| No substituted prayer time | Yes. Nothing touched the schedule |
| No hand-edited release file | Yes |
| `uat` and EAS untouched | Yes. Every build was local Gradle or Xcode |
| The API key never committed | Yes. `build-prod.zsh` injects it; the bundle check confirms without printing |
| No ignore comment, no skipped hook | **One exception, recorded in `LOG.md`:** `--no-verify` once, on an unmerged docs amend, undone and re-made through the full hook |
| Comments explain why | Yes, checked in the guard script's diff |
| The owner receives no screenshots | Yes. Every reading is a `dumpsys` line or his own words |

**PASS.** The row answered its question with evidence, the answer is recorded with its wrong
predictions intact, the one finding is fixed, and `uat-2` is green at 187 suites and 5010 tests with
100% on all four measures. Row 50 is DONE.
