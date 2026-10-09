---
name: athan-next
description: Carry one queued session in ai/plans/README.md from planning through execution to audit, all three phases yourself in this one session, and stop when that session is DONE and pushed. Trigger on "what is the next step", "next session", "continue the queue", or any request to plan, execute or audit a session listed in ai/plans/README.md.
version: 4.1.0
---

# athan-next

The owner resumes with /go and walks away. This skill carries ONE queued session from planning through execution to audit and stops when that session is DONE and pushed, or the moment it needs the owner.

**You do every phase yourself, in this session.** Subagents are banned, with two exceptions. The audit's **cold review**, because a reviewer that never saw the session catches what its author cannot: `athan-auditor` says when and how. And `vision`, because seeing images is a capability, not a preference. If you can see images, read them yourself. If you cannot, call the `vision` subagent with the file path and one exact question, and rely on its report. Never guess what an image shows, and never claim to have checked one you did not.

Sight is also a way to REACH a screen: when the automation tools cannot see a control, an OEM dialog outside the app's hierarchy, a surface `uiautomator dump` will not serve, screenshot the phone, read the one control's coordinates, tap it, and screenshot again to confirm the tap landed.

Tool routing, comment rules, writing style and the hard rules live in `ai/AGENTS.md`. Reach for them there, never re-derive them here.

## 1. Read the state

Repeat exactly this at the start, and again after each phase:

| What | How |
| --- | --- |
| Refresh `origin` | `git fetch -q origin uat` |
| Unpushed commits | `git log --oneline origin/uat..uat \| wc -l` |
| Unaudited code commits | `git log --oneline origin/uat..uat -- . ':(exclude)ai/plans' ':(exclude)app.json' ':(exclude)package.json' \| wc -l` |
| The queue | `grep -n '^| [0-9]' ai/plans/README.md` |

That grep gives every row with its order number, session, plan path and status.

A row is **in flight** while its status is PLANNING, READY, IN PROGRESS or EXECUTED. At most one row is in flight.

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

A READY row whose "Needs first" rows are not all DONE is still the row in flight, so nothing else is planned around it (`ai/plans/README.md`, "Order").

## 3. Run the phase yourself

Call the Skill tool for the phase, then do what it says, end to end:

| Phase | Skill |
| --- | --- |
| Plan | `athan-planner`, planning the row section 2 chose |
| Execute | `athan-executor`, executing that row's plan |
| Audit | `athan-auditor`, auditing that row's plan |

Carry straight on into the next phase when the row moves: plan it, execute it, audit it, all here. Write the phase's record in the plan folder (`PLAN.md`, `LOG.md`, `AUDIT.md`) exactly as the skill says, because that is where the owner reads the detail.

**An owner decision is asked with the `question` tool, and you wait for the answer.** Never guess a decision the owner owns. Give every option both a `label` and a `description`, or the call fails validation.

**Loop on your own work until it is right.** A skill that says a reviewer checks a commit means YOU review that commit: read the diff back with fresh eyes, attack it from a different angle, and fix what you find before merging. The audit phase is the gate, and it is also yours, with its one cold review as the only eyes that never saw the work being written.

## 4. Judge each phase from the repository, never from memory

Re-read section 1 after every phase. The table and git are the truth.

| What you find | What you do |
| --- | --- |
| The phase moved the row on (PLANNING or NEEDS REPLAN became READY, READY became IN PROGRESS then EXECUTED, EXECUTED became DONE) | Go on to the next phase from section 2 |
| The row is unchanged but you committed to `uat` | Carry on with the same phase: it is getting somewhere |
| The row is unchanged and nothing was committed, twice running | Stop. The phase cannot finish as specified |
| A row went BLOCKED or OWNER-LED, or the owner must hold a device | Stop and report it |

**If your context runs low,** write the "Resume from" note the phase's skill specifies, commit and merge what is finished, and ask the owner for the /handoff document. The next session resumes from it.

## 5. Stop, and hand back

Stop as soon as one of these is true, and never start another phase after it:

- the row is DONE and `uat` has no unpushed commits: the session is finished, which is where this skill stops;
- a row is BLOCKED or OWNER-LED, or a phase needs the owner's hands, such as holding a device or tapping a screen. An owner decision is not one of these: ask it with the `question` tool and carry on;
- section 4 says stop.

One session per run. Never carry on into the next row: the owner starts that with `/go` or `/athan-next`.

## 6. Your final reply: the handoff, four lines, nothing after it

```
**Just done:** <Planning, Execution and Audit | the phases that ran>, session <n>. <one clause on what moved>
**Row:** <status now>, `uat` <pushed | holds N unpushed commits>
**Up next:** <the phase or session that comes next, or what it is waiting on>
**You type:** `/go` to continue, or `/athan-next` for the next queued session
```

Above those four lines, at most three sentences: what the session delivered, and anything the owner must decide or hold. Nothing else. The detail lives in the plan folder's `LOG.md` and `AUDIT.md`.

## 7. Running one phase only

If the owner names a phase ("just plan it", "audit only"), call that one phase's skill yourself, run it end to end, then stop at section 6.
