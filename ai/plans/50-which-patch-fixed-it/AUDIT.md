# Audit: Session 50

Audited 2026-10-02, in a scratch worktree at `~/athan-device-sweep/worktrees/audit-50` with
`node_modules` symlinked from the main checkout.

**Verdict: PASS, after one finding fixed in this session.**

## What was checked, and with what

| Check | Command or file | Result |
| --- | --- | --- |
| The range holds only this session's commits | `git log --oneline origin/uat-2..uat-2` | 4 commits: step 1, its merge, step 2, its merge. Nothing else |
| The breaks still guard, from an independent checkout | `bash $TMPDIR/breaks-50-step1.sh` in the audit worktree, after `grep -n /Users/muji/repos/rn.athan.uk` printed nothing | `caught 8 of 8`, `ALL AS EXPECTED: 1` |
| The whole suite | `yarn validate` in the audit worktree | exit 0, **187 suites, 5010 tests**, 100% statements, branches, functions and lines |
| No new dead code | `python3 scripts/find-unused-exports.py` | 504 symbols scanned, 5 unreachable, all 5 pre-existing and allow-listed |
| Biome and tsc | `npx biome check . --error-on-warnings`, `npx tsc --noEmit` | both exit 0 |
| The guard works on the real tree | `bash scripts/verify-expo-location-patch.sh` | `PATCH AS SHIPPED` |
| `node_modules` is the patched state and nothing more | `diff -r node_modules/expo-location <yarn cache copy>` | differs ONLY by the three intended patch changes |
| No experiment leaked into history | `git merge-base --is-ancestor <ref> uat-2` for all 4 throwaway refs | all 4 unreachable from `uat-2` |
| No stray branches or worktrees | `git branch`, `git worktree list` | only pre-existing branches; only the main checkout and the 5 build caches, plus this audit worktree |
| Both phones left on the approved build | `xcrun devicectl device info apps`, `adb shell dumpsys package` | both report **1.29.217** |
| Automatic time restored | `adb shell settings get global auto_time` | `1`. It was never changed: no clock change in this proof |
| The widget nested-copy trap | `shared/__tests__/widgetRuntimeLoads.test.ts` after the full `node_modules` restore | `3 passed` |

## Findings

### 1. FIXED: the device evidence files the plan specified were never written

**The finding.** The plan's section 7 requires the owner's verdict recorded verbatim in
`~/athan-device-sweep/session50/<X>-verdict.txt` and the sensor rate in `<X>-rate.txt`. The execution
captured the before/after guard output, the build logs, the applied diffstats and the throwaway-ref
diffstats, but wrote the verdicts only into `VERDICT.md` and not into the per-experiment files.

**Why it matters rather than being bookkeeping.** `AUDITOR-BRIEF.md` section 3 item 6 requires every
claim in the records to be backed by a file under `~/athan-device-sweep/session<N>/`. With the verdicts
living only in the prose that cites them, the prose was its own evidence, which is the shape of defect
sessions 44 and 49 both recorded: a guard that passes because it matched its own source.

**The fix, applied in this session.** Five `<X>-verdict.txt` files written, each carrying the owner's
words verbatim, the build it judged, the ref or edit that isolated it, and the verdict. Plus
`B-rate.txt` with the live `dumpsys sensorservice` block, since B is the one experiment whose
conclusion depends on a measured rate (it isolates the gate from the rate, so `selected = 20.00 ms` is
load-bearing).

**It also surfaced an honest gap that is now stated rather than implied.** No `dumpsys` equivalent was
captured on iOS, so experiment D's rate figures are modelled rather than measured on the phone.
`D-verdict.txt` says so in its own NOTE ON METHOD, and `VERDICT.md`'s D table is labelled as a model.
This matters because every other rate claim in the row is a device reading.

## What the row's own records got right, and it is worth saying

**Two wrong predictions are recorded as wrong, with their mechanisms**, in `LOG.md`, `VERDICT.md`,
`AUDIT-FINDINGS.md` and the `README.md` row alike:

- Experiment B was predicted never to draw a compass in 87% of still runs, and drew every time. The
  records state why: the simulation held the phone still to within 0.5 degrees of jitter where a hand
  moves several, so the figure describes a phone on a table rather than in a hand.
- The figure-eight hint was assumed to help the first reading, and makes it four times worse.

**The row's own founding hypothesis is recorded as refuted**, three ways, rather than quietly dropped.

**A defect in shipped behaviour was found and queued rather than fixed in passing.** The calibration
hint opens the settling gate at 3.7s and 11.88 degrees of error against a still phone's 9.7s and 2.98.
That is a real defect, it is outside this row's scope, and `NEXT-SESSION.md` carries it with the design
decision left to the owner, which is correct: the owner has already said the animation needs its own
session.

## The owner's rules

| Rule | Held |
| --- | --- |
| No visual change | Yes. Experiment E removed a visual element in a throwaway ref only; nothing visual is committed |
| No substituted prayer time | Yes. Nothing touched the schedule |
| No hand-edited release file | Yes |
| `uat` and EAS untouched | Yes. Every build was local Gradle or Xcode |
| The API key never committed | Yes. `build-prod.zsh` injects it from `~/.config/athan/.api_key` and the bundle check confirms it without printing it |
| No ignore comment, no skipped hook | **One exception, recorded in `LOG.md`:** `--no-verify` was used once on an unmerged docs amend and then undone, with the commit re-made through the full hook. Stated rather than hidden |
| Comments explain why | Yes, checked in the guard script's diff |
| The owner receives no screenshots | Yes. Every reading is a `dumpsys` line or his own words |

## Verdict

**PASS.** The row answered its question with evidence, the answer is recorded with its own wrong
predictions intact, the one finding is fixed, and `uat-2` is green at 187 suites and 5010 tests with
100% on all four measures. Row 50 is DONE.
