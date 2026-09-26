# Audit: Session 19. Widget polish, the horizon, and the iOS flag

| Field | Value |
| --- | --- |
| Audited | 2026-09-24 |
| Range | `5926e35f..uat-2`, 23 commits, tip 1.27.371 |
| Worktree | `~/athan-device-sweep/worktrees/audit-19` at `uat-2`, `node_modules` symlinked, removed at the end |
| Verdict | **PASS**, after two repairs the audit made itself |
| Row | DONE for the plan's steps 1, 2, 3 and 5a. Step 4 (the iOS flag) did not run and is re-queued as its own row, see below |

Subagents were unavailable for the whole session (the harness answered `Model unavailable` on every
spawn) and the owner directed the work to run without them, so the planning review, every step
review and this audit are the session's own, against each brief's checklist.

## 1. The range

`git log --oneline origin/uat-2..uat-2` listed nothing: everything was already pushed, so the range
audited is `5926e35f..uat-2`. All 23 commits belong to session 19: one planning commit, two planning
review/decision commits, seven step or owner-requested commits with their merges, two reverts with
their merges, and two docs commits. Nothing unrelated rode along.

## 2. Plan against commits

| Plan step | Commit | Verdict |
| --- | --- | --- |
| 1. The pill wraps its row text | `e58c4363`, merged `7bbff7b0` | Built as specified. `PILL_LEAD`, `ROWS_LEAD`, the clamped `gutter` and `ROW_GUTTER` all carry the plan's names and contracts; the pill column keeps its owner-tuned 1dp drop |
| 2. The Android dark card matches iOS | `b9b66457`, merged `173ca58f` | Built as specified, then superseded by the owner's softening (1.27.369). The finding it closes is closed either way |
| 3. The horizon drops to 7 days | `8d2621c8`, merged `068d85d7` | Built as specified. The constant is 7, both volume bounds are literals at 60, the 200KB payload budget is untouched |
| 4. The iOS widgets flag ships on | not run | Correctly NOT run: its part 0 gate is the G.1 acceptance protocol, which needs the owner to place eight widgets on the XS. `shared/flags.ts` and `.env.example` are untouched, which is what the plan requires when the gate is unmet |
| 5a. The 3T proof | evidence under `~/athan-device-sweep/session19/` | Ran, and measured rather than eyeballed because the `vision` subagent was unavailable. Stronger evidence than the plan asked for |
| 5b. The XS protocol | not run | Blocked on the owner's hands. The build IS installed and the baseline IS recorded, so the next session runs it without rebuilding |

The owner-requested tail (1.27.364 through 1.27.371) sits outside the plan by construction: the
owner raised it mid-execution. Each piece is version-bumped, reviewed and merged to the same
standard, and the two reverts returned to the tagged checkpoint, the second byte for byte.

## 3. The tests still guard

Break scripts run from the scratch worktree's root, after retargeting their `cd` line (they hardcode
the main checkout, see finding 1):

| Script | Result |
| --- | --- |
| `breaks-step1.sh` | `caught 4 of 4`, `ALL AS EXPECTED: 1` |
| `breaks-step2.sh` | **FAILED at first: 2 of 3 printed `BREAK NOT APPLIED`.** Finding 2, repaired, then `caught 3 of 3` |
| `breaks-step3.sh` | `caught 3 of 3`, `ALL AS EXPECTED: 1` |

The red check was re-run for the riskiest change, the medium's centring: reverting the
`fillMaxWidth()` in the scratch tree fails
`splits the medium in half and centres the trio in its own half, both themes`, and restoring it
passes. That test did not exist in the plan; the execution added it for the owner-requested fix, and
it is the guard that would catch the bug returning.

## 4. The whole suite

`npx jest --watchman=false --coverage` in the scratch worktree:

```
Statements   : 100% ( 4202/4202 )
Branches     : 100% ( 1876/1876 )
Functions    : 100% ( 853/853 )
Lines        : 100% ( 3793/3793 )
Test Suites: 170 passed, 170 total
Tests:       2 skipped, 4645 passed, 4647 total
```

`npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0.

## 5. Reviews

`LOG.md` records a verdict for every step commit. Each review was the session's own, one round, and
each one's checklist is the plan's review prompt for that step. No commit merged without one.

## 6. Device evidence

Every claim in the records is backed by a file under `~/athan-device-sweep/session19/`, and the
numbers were re-read during this audit rather than trusted:

| Claim | Evidence |
| --- | --- |
| The pill is symmetric | `checkpoint-1-3t-widgets.png`: pill x 566..974, active text x 600..940, so 34px each side at 420dpi, which is the 12dp gutter plus antialiasing |
| The dark card shipped | `3t-soft2.png`: 780,540 pixels of `rgb(9,20,45)`, zero of the old `rgb(2,12,36)` |
| The softened text colours shipped | `3t-soft2.png`: the new pink at 3,800px and the new hero at 6,768px, both old values at zero |
| The trio is centred | `3t-371.png`: trio centre 305px against its half's centre at 297px, a 3dp residual that is the glyph's own side bearing |
| The phone was left correctly | `adb shell settings get global auto_time` prints `1`, and the 3T runs 1.27.371 |
| No clock was changed | `alarms-before.txt` was read before any device work and no clock command was issued all session |

The owner received no screenshots; the measurements above are how the pixels were judged.

## 7. The owner's rules

No visual change beyond the ones the owner asked for and approved on device. No prayer time copied,
averaged or invented. `releases.json`, `uat` and EAS untouched. No API key committed (the one diff
line matching a key pattern is the literal placeholder `key` inside the plan's own build command).
No `istanbul`/`c8`/`v8` ignore comment. No `console.log`. No hook skipped: every commit ran the full
suite and the coverage gate, and the one commit the hook rejected (an unused constant after the
centring fix) was fixed and re-committed rather than forced.

Versions run 1.27.358 to 1.27.371 with no gap or repeat, and all three files are in lockstep at the
tip.

## 8. Findings, and the repairs this audit made

**Finding 1 (noted, not repaired): the plan's break scripts hardcode the main checkout.** Each one
starts `cd /Users/muji/repos/rn.athan.uk`, so running them from an audit worktree silently tests the
wrong tree. `AUDITOR-BRIEF.md` section 3 item 3 anticipates this by asking for
`grep -n /Users/muji/repos/rn.athan.uk <script>` to print nothing, which it does not. Repairing it
would mean editing three scripts whose content the plan carries verbatim, so it is recorded here
for the next planner instead: a break script should `cd` to the repository root relative to itself,
not to an absolute path.

**Finding 2 (REPAIRED): step 2's break script was stale and no longer guarded.** Its two card breaks
substitute `CARD_DARK = css("#020c24")`, the colour step 2 shipped, but the owner's softening
(1.27.369) moved it to `#09142d`. Both breaks printed `BREAK NOT APPLIED`, which by both briefs
counts as not caught, so the step's guard had quietly stopped working. Repaired by updating the two
substitutions to the colour that actually shipped; the script then prints `caught 3 of 3` and
`ALL AS EXPECTED: 1`. This is exactly the failure mode the `BREAK NOT APPLIED` string exists to
surface.

**Finding 3 (REPAIRED): a stale comment and a stale claim.** The `HERO_WIDTH` comment still
explained the old 170/347 proportion at length after the value became `floor(innerWidth / 2)`, and
the `REFERENCE_*` comment claimed all of them were proportions when only the row boxes still scale
from them. Both tightened to say why, compactly.

**Finding 4 (REPAIRED): the executor never applied the plan's section 8 records.** No
`AUDIT-FINDINGS.md` entry, no ISSUES closure, no `ai/AGENTS.md` update. The audit wrote all of them:
the session 19 findings text, findings 39 and 40 closed with their fixes and the open-issues index
trimmed, the horizon invariant rewritten from 30 days to 7 with this session's measurements, and
three new Android widget invariants carrying the session's durable lessons.

**Finding 5 (REPAIRED): `ai/prompts/README.md` named models.** Its programme paragraph still said
every job "runs in OpenCode" and described model routing, which the owner's
2026-09-24 rule forbids because it dates the page. Rewritten to name the job, not the model. No
document in the session now names one.

## 9. What is NOT done, and why that is correct

Step 4, the iOS widgets flag, did not run, and the plan is explicit that it must not without its
gate. The gate is the G.1 acceptance protocol: eight widgets placed on the XS by hand, left ten
minutes, then the syslog read for watchdog lines and the crash counter compared. The owner was
willing; the session ran out of room before the protocol could be held.

State the next session inherits, so nothing is repeated:
- the Release build IS installed on the XS at 1.27.369 with `ExpoWidgetsTarget.appex` in the bundle,
  which proves `EXPO_PUBLIC_WIDGETS=1` reached the build;
- the crash baseline IS recorded: 15 `ExpoWidgetsTarget.cpu_resource` files, newest 2026-09-20;
- `pymobiledevice3` reaches the phone over USB, verified;
- `shared/flags.ts` and `.env.example` are untouched, so the flip is a clean two-file change once the
  protocol passes.

The row therefore goes DONE for what the plan delivered, and the flag flip is re-queued as its own
row beside G.2, which reads the same code.

## 10. Verdict

**PASS.** The three code jobs are built as specified, guarded by tests that fail without them,
proven on the device by measurement, and the records are now complete. Two of the session's guards
had decayed and both were repaired here rather than handed back. The iOS flag is the one piece of
the plan still owed, it is correctly unstarted, and its groundwork is banked.

---

# Audit addendum: step 5b and step 4, run 2026-09-25

Session 19 left step 4 unrun because its gate, the G.1 acceptance protocol, needed the owner to place
eight widgets and leave them ten minutes. The owner did that on 2026-09-25 and the remaining two steps
ran in that session. This addendum audits them.

| Item | How | Result |
| --- | --- | --- |
| The protocol's three readings | `LOG.md` step 5b, against the evidence files | All three PASS. Owner: eight kinds still showing prayer times after the watch. Watchdog: 0 across 346,199 lines. Crash reports: 15 before, 15 after, none dated 2026-09-25. |
| The evidence exists and says what is claimed | `~/athan-device-sweep/session19b/crash-before.txt`, `crash-after.txt`, `xs-syslog.txt`, `widget-render-evidence.txt` | Read directly. The baseline of 15 matches what this file's section 9 recorded on 2026-09-24. The render log independently names all eight home kinds plus both Lock kinds. |
| Step 4's gate was respected | Commit order | `ce3b3029` was made after the protocol passed, not before. |
| Step 4 changed only what it may | `git show ce3b3029 --stat` | Six files: `shared/flags.ts`, `.env.example`, the two version files, `ai/plans/README.md`, `LOG.md`. Nothing else. |
| The parse was NOT inverted (decision 6) | `git show ce3b3029 -- shared/flags.ts \| grep process.env` | The parse line is absent from the diff, so `=== '1'` stands. The fail direction "mistakes disable, never enable" is intact. |
| `androidWidgets` untouched | Same diff | Unchanged, as the step requires: its flip condition is a separate owner judgement. |
| The JSDoc drops every false claim | Read | No "Flip condition" paragraph, no 57.0.x history, no unreleased claim. |
| The flag suites still pass | `npx jest shared/__tests__/flags.test.ts shared/__tests__/flagDefaults.test.ts` | `Tests: 32 passed, 32 total`, the same before and after. The parity check reports `20 skipped, 3 passed, 23 total`, exactly as step 4 predicts. |
| The whole suite | The commit hook | `Tests: 4647 passed, 4647 total`, 170 suites, 100% on all four measures. |
| Versions | `package.json` per commit | 1.27.378, one patch above the audit commit before it. `app.json` in lockstep. |
| The owner's rules | The diff | No pixel changed, no prayer time touched, `releases.json`, `uat` and EAS untouched, no ignore comment, no hook skipped. |

## Findings

**None.** Step 5b was run exactly as written, its three readings are each backed by a file, and step 4
changed only the catalog line and the documentation its contract allows.

One methodological note worth carrying: the session's first `jetsam` grep returned 13 hits and every
one was routine `runningboardd` bookkeeping for Reminders, Siri, Find My and SpringBoard. It was
filtered to real terminations before being reported, which is the right order. A future protocol run
should filter first rather than counting raw matches.

## Verdict

**PASS.** Row 16 is DONE, ISSUES G.1 is CLOSED, and the iOS widgets ship on.
