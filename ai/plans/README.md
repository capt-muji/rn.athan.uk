# Plans: Claude plans and audits every queued session, GLM executes the plans

**Why this exists.** On 2026-09-15 the owner's Claude allowance was running low. The owner split the work:

1. **Planning (Claude).** One planning session per queued session writes one extremely detailed plan. Every judgement
   call, owner decision, design choice and design review happens here.
2. **Execution (GLM in Claude Code).** One execution session per plan carries it out exactly as written, including a
   code review of every commit by a GLM subagent. It never pushes.
3. **Audit (Claude).** One short audit session per executed plan checks the whole result against the plan, fixes or
   sends back what is wrong, and pushes `uat-2`.

A plan is good when an executor that cannot make judgement calls never has to make one.

## What the owner types

**One command, every time: `athan-next`.** It reads the table below, picks the next step (plan, execute or audit), shows
which model it chose, and starts that session with its prompt as the first message. When the session ends, press
Enter for the next step, or Ctrl+C to stop. `athan-next --dry-run` only prints the next step. The command lives in the
owner's Claude Code setup on this Mac, outside the repository.

What `athan-next` runs, for reference or for starting a step by hand in a fresh session. For an execution step it
names the row's plan file in place of "the next plan", as that plan folder's `PROMPT.md` does:

| Phase | Start with | Paste |
| --- | --- | --- |
| Plan | `claude-plan` | `Planning session. Read ai/plans/PLANNER-BRIEF.md and plan the next session in ai/plans/README.md.` |
| Execute | `claude-glm` | `Execution session. Read ai/plans/EXECUTOR-BRIEF.md and execute the next plan in ai/plans/README.md.` |
| Audit | `claude-plan` | `Audit session. Read ai/plans/AUDITOR-BRIEF.md and audit the next plan in ai/plans/README.md.` |

- `claude-plan` starts Claude Code on the owner's Claude subscription with Claude Opus 5 (`claude-opus-5`) at xhigh
  effort.
- `claude-glm` starts Claude Code on GLM 5.3 through the owner's own LLM gateway, at max effort, which its subagents
  inherit (proven 2026-09-15). The session is locked to the two GLM models: every model alias maps to GLM 5.3, and
  asking for any other model falls back to GLM 5.3, so nothing in it can spend the Claude allowance. The haiku alias
  maps to GLM 5.3 Flash, which the `vision` subagent uses at max effort to read images.
- Both launchers and the `vision` subagent live in the owner's Claude Code setup on this Mac, outside the repository.
  No gateway address, domain or key is ever written into this repository, and nothing of OpenCode's is changed.

**Order.**
1. Run the planning prompt once per row, until every row is READY, OWNER-LED or BLOCKED.
2. Then, for each row in the order column, run the execution prompt and then the audit prompt. The next execution
   waits until the audit has set DONE.

The planning prompt resumes a plan left at PLANNING and refreshes one at NEEDS REPLAN, before it starts a new one.
The execution prompt resumes a plan left at IN PROGRESS, before it starts a new one.

## Status

A plan moves through NOT PLANNED, then PLANNING, then READY, then IN PROGRESS, then EXECUTED, then DONE.

Off that path:
- **NEEDS REPLAN:** the code a plan anchors on has changed, or the owner's answer changed a step. The next planning
  session refreshes it.
- **BLOCKED:** waiting on the owner. The reason is written in the row.
- **OWNER-LED:** the owner's own reading or decisions. There is nothing for an executor to run.

| Order | Session | Brief | Plan | Status | Planned at | Needs first |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 6. An alert always does what its bell shows (findings 79 to 82) | `ai/prompts/alert-integrity.md` | `ai/plans/06-alert-integrity/PLAN.md` | PLANNING | | nothing |
| 2 | 7. Android: each notification replaces the one before it | `ai/prompts/replace-previous-notification.md` | `ai/plans/07-replace-previous-notification/PLAN.md` | NOT PLANNED | | set when planned |
| 3 | 8. iOS: a way for each notification to replace the one before it | `ai/prompts/ios-replace-previous-notification.md` | `ai/plans/08-ios-replace-previous-notification/PLAN.md` | NOT PLANNED | | set when planned |
| 4 | 9. Keep yesterday's still-due rows after 00:00 | `ai/prompts/keep-still-due-rows-after-midnight.md` | `ai/plans/09-keep-still-due-rows-after-midnight/PLAN.md` | NOT PLANNED | | set when planned |
| 5 | 11. Moonsighting research, session 2 | `ai/prompts/moonsighting-research-2.md` | `ai/plans/11-moonsighting-research-2/PLAN.md` | NOT PLANNED | | set when planned |

- "Planned at" is the `uat-2` commit the plan's anchors were verified against.
- "Needs first" lists the order numbers of the rows that must be DONE before this plan is executed, such as `1`, or
  `nothing`. A planning session replaces "set when planned".

## Waiting on the owner, not yet sessions

A planning session may turn one of these into a plan only after the owner approves it in that session; it then adds a
row above.
- The accessibility fixes listed in "Session 5 of the queue" in `ai/features/uat-2/AUDIT-FINDINGS.md`.
- `shared/__tests__/audioMatrix.test.ts` timing out under load: a longer timeout, or running it outside the hook.
- The dashes approval page's open choices C2, C5 to C10 and C13 (session 3).
- Finding 74: a Suhoor wrapped onto the evening before loses a day of buffer.
- Leftover notification channels on the OnePlus 3T (cosmetic).
- The athan sound change: a failed re-arm shows the old sound in Settings while some alarms keep the new one. On
  2026-09-15 the owner approved it as its own session. Its brief, its row and its place in the order are still to be
  written.

## Files here

- `PLANNER-BRIEF.md`: the whole job of a planning session.
- `EXECUTOR-BRIEF.md`: the whole job of an execution session: precedence, rules, traps, the step loop.
- `AUDITOR-BRIEF.md`: the whole job of an audit session.
- `TEMPLATE.md`: the fixed shape of every plan, so every plan reads the same way.
- `NN-<session>/`: one folder per session, holding everything for that session:
  - `PLAN.md`: the plan, with `steps/`, `scripts/` and `scripts/anchors/` beside it;
  - `PROMPT.md`: the prompts that execute, audit or replan exactly this session, for running one out of order;
  - `LOG.md`: written by the executor as it works: each step's commit, the outputs it compared, and any stop with its
    reason;
  - `AUDIT.md`: written by the auditor: what it checked, what it found, and its verdict.

## Who changes a status, and who pushes

- **A planning session** sets PLANNING, READY, OWNER-LED, BLOCKED or NOT PLANNED, and fills "Planned at" and
  "Needs first".
- **An execution session** sets IN PROGRESS, EXECUTED, NEEDS REPLAN or BLOCKED. It commits and merges into `uat-2` on
  this Mac, and never pushes.
- **An audit session** sets DONE for an EXECUTED row, or READY again with audit-fix steps added to the plan. Auditing
  an unfinished plan leaves its status as it is.
- **Pushing.** Only planning and audit sessions push `uat-2`, and only when every commit on `uat-2` that is not yet on
  `origin/uat-2` has been audited. A planning session that finds unaudited commits asks the owner to run the audit
  prompt first, unless it is replanning a NEEDS REPLAN row, which it does without pushing.

## State of the phone when this programme started

On 2026-09-15 the OnePlus 3T (`8f7ada76`) was left running the mock build of 1.27.159 at the owner's request. Any plan
that needs real prayer times or real alarms on the phone starts by installing a local production build.
