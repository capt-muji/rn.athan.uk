---
name: athan-next
description: Carry one queued session in ai/plans/README.md from planning through execution to audit, each phase in its own subagent, and stop when that session is DONE and pushed. Trigger on "athan-next", "what is the next step", "next session", "continue the queue", or any request to plan, execute or audit a session listed in ai/plans/README.md.
version: 2.0.0
---

# athan-next

The owner types one prompt and walks away. This skill carries ONE queued session from planning through execution to
audit, each phase in a subagent of its own, and stops when that session is DONE and pushed, or the moment it needs the
owner.

**You are the orchestrator. You do none of the programme's work yourself.** You never read a plan, a brief, a log,
a diff or any app code. You never write code, never commit, never push. You spawn a subagent for a phase, check the
state it left in the repository, and spawn the next one. Your context has to last all three phases, so every token you
spend on the work itself is a token the run may die of.

## 1. Read the state

The only reading you do, and you repeat exactly this after each phase:

| What | How |
| --- | --- |
| Refresh `origin` | `git fetch -q origin uat-2` |
| Unpushed commits | `git log --oneline origin/uat-2..uat-2 \| wc -l` |
| Unaudited code commits | `git log --oneline origin/uat-2..uat-2 -- . ':(exclude)ai/plans' ':(exclude)app.json' ':(exclude)package.json' \| wc -l` |
| The queue | `grep -n '^| [0-9]' ai/plans/README.md` |

That grep gives every row with its order number, session, plan path and status. It is enough. Never read the rest of
`ai/plans/README.md`, and never open a plan folder.

A row is in flight while its status is PLANNING, READY, IN PROGRESS or EXECUTED. At most one row is in flight.

## 2. The phase this session needs now

First match wins:

| | When | Phase |
| --- | --- | --- |
| 1 | A row is EXECUTED | **Audit** |
| 2 | A row is NEEDS REPLAN | **Plan**, to refresh it |
| 3 | A row is IN PROGRESS | **Execute**, resuming it |
| 4 | Unaudited code commits exist | **Audit** |
| 5 | A READY row has every "Needs first" row DONE | **Execute** |
| 6 | Unpushed commits exist | **Audit** |
| 7 | No row is READY | **Plan** the first PLANNING row, else the first NOT PLANNED row |
| 8 | Nothing above matches | Nothing can run. Report which row waits on what, and stop |

A READY row whose "Needs first" rows are not all DONE is still the row in flight, so nothing else is planned around
it (`ai/plans/README.md`, "Order").

## 3. Spawn the phase

One `general` subagent per phase, always a fresh one: a phase that stopped part way is resumed by a new subagent
reading the "Resume from" note its predecessor left, never by continuing the old subagent's session.

Send exactly the phase prompt, then the three orchestration lines:

| Phase | Prompt |
| --- | --- |
| Plan | `Planning session. Read ai/plans/PLANNER-BRIEF.md and plan the next session in ai/plans/README.md.` |
| Execute | `Execution session. Read ai/plans/EXECUTOR-BRIEF.md and execute <the row's plan path>.` |
| Audit | `Audit session. Read ai/plans/AUDITOR-BRIEF.md and audit the next plan in ai/plans/README.md.` |

```
Do the whole job the brief describes, end to end, and stop only when it is finished or the brief tells you to stop.
Write your record in the plan folder as the brief says, because your reply is thrown away.
Reply with the brief's four-line handoff and nothing else: no report, no summary, no diffs, no file listings.
```

Never let a subagent load this skill: it does a phase, not the queue.

## 4. Judge the phase from the repository, never from its reply

Re-read section 1. The subagent's four lines are a courtesy; the table and git are the truth.

| What you find | What you do |
| --- | --- |
| The phase moved the row on (PLANNING or NEEDS REPLAN became READY, READY became IN PROGRESS then EXECUTED, EXECUTED became DONE) | Spawn the next phase from section 2 |
| The row is unchanged but the phase committed to `uat-2` | Spawn the same phase again: it is getting somewhere and left a "Resume from" note |
| The row is unchanged and nothing was committed | Stop. Two of these in a row means the phase cannot finish by itself |
| The subagent says it needs an owner decision, or a row went BLOCKED or OWNER-LED | Stop and report it |

## 5. Budgets, because nobody is watching

Per run: **plan 2, execute 6, audit 3**, and **twelve subagents in total**, which nothing resets. Execution gets the
most because it legitimately resumes itself across context limits. Exceed any of them and stop, reporting the count.

## 6. Stop, and hand back

Stop as soon as one of these is true, and never start another phase after it:

- the row is DONE and `uat-2` has no unpushed commits: the session is finished, which is where this skill stops;
- a phase needs an owner decision, a device the owner must hold, or a row is BLOCKED or OWNER-LED;
- section 4 or section 5 says stop;
- a subagent fails outright.

One session per run. Never carry on into the next row: the owner starts that with `athan-next` again.

## 7. Your final reply: the handoff, four lines, nothing after it

```
**Just done:** <Planning, Execution and Audit | the phases that ran>, session <n>, GLM 5.3. <one clause on what moved>
**Row:** <status now>, `uat-2` <pushed | holds N unpushed commits>
**Up next:** <the phase or session that comes next, or what it is waiting on>
**You type:** `athan-next`
```

Above those four lines, at most three sentences: what the session delivered, and anything the owner must decide or
hold. Nothing else. The detail lives in the plan folder's `LOG.md` and `AUDIT.md`, which is where the owner reads it.

## 8. Running one phase only

If the owner names a phase ("just plan it", "audit only"), spawn that one subagent, then stop at section 7. Everything
else in this skill is unchanged.

## 9. This harness

OpenCode on GLM 5.3, with GLM 5.3 Flash for reading images (2026-09-17). Where a brief names Claude Code, a launcher
or an Opus model, this section replaces it:

- Never pass a model to a subagent. Subagents inherit GLM 5.3.
- Images go to the `vision` subagent, which reads them on GLM 5.3 Flash. Never guess what an image shows.
- `claude-plan`, `claude-glm` and the `athan-next` command no longer exist. Never tell the owner to run them.
- Never read or write anything under `~/.claude/` or `~/.config/opencode/`.
- A subagent that needs an isolated tree makes a scratch worktree with `git worktree add` under
  `~/athan-device-sweep/worktrees/<name>`, and removes it once its verdict is in.
