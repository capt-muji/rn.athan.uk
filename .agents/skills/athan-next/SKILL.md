---
name: athan-next
description: Carry one queued session in ai/plans/README.md from planning through execution to audit, all three phases yourself in this one session, and stop when that session is DONE and pushed. Trigger on "what is the next step", "next session", "continue the queue", or any request to plan, execute or audit a session listed in ai/plans/README.md.
version: 5.0.0
---

# athan-next

The owner resumes with /go and walks away. This skill carries ONE queued session from planning through execution to audit and stops when that session is DONE and pushed, or the moment it needs the owner.

**You do every phase yourself, in this session.** There are no phase skills and no
worker agents: the contracts below are the whole process. Subagents are banned, with
two exceptions. The audit's **cold review**: reread your own diff as a stranger who
never saw the session, and attack it. And `vision`, because seeing images is a
capability, not a preference. If you can see images, read them yourself. If you
cannot, call the `vision` subagent with the file path and one exact question, and rely
on its report. Never guess what an image shows, and never claim to have checked one
you did not.

Sight is also a way to REACH a screen: when the automation tools cannot see a control, an OEM dialog outside the app's hierarchy, a surface `uiautomator dump` will not serve, screenshot the phone, read the one control's coordinates, tap it, and screenshot again to confirm the tap landed.

Tool routing, comment rules, writing style and the hard rules live in the root `AGENTS.md`. Reach for them there, never re-derive them here. Board reads and writes go through the `multica-cli` skill with `BOARD-ATHAN.md` for this board's columns and keys.

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

**Plan.** Read the row's links (the work, the frontier it touches, the tickets it
cites). Write `PLAN.md` in the plan folder: the goal in one paragraph, the steps in
order, each step's acceptance criteria, the risks with their falsifiers. Then grill
it as a hostile stranger who must build it without being able to ask a question:
every gap you find, fix in the plan. The row becomes READY only when a stranger
could execute the plan without guessing.

**Execute.** Work the steps in order, one at a time, each to its acceptance criteria
before the next begins. `yarn validate` before anything is called done; full unit
coverage of every line a change touches, red before green; the version bump rides
every commit. Record what ran and what moved in `LOG.md` as you go. The row goes
IN PROGRESS when execution starts and EXECUTED when the last step's criteria hold.

**Audit.** Read the complete diff cold: against the plan (did it build what was
ordered), against the repository (does it fit the surrounding code), and against a
stranger's eyes (would this be understood in a year). Run `yarn validate` yourself.
Fix what you find and re-audit the fix. The row becomes DONE, the branch pushes,
and the audit's verdict and findings are recorded in `AUDIT.md`.

If the row maps to a Multica ticket, move it as you go: Planning while planning,
In Progress while executing, In Review for the audit, Done when it lands. Use
`--no-start` for every move; work is already running here.

Carry straight on into the next phase when the row moves: plan it, execute it, audit it, all here.

**An owner decision is asked with the `question` tool, and you wait for the answer.** Never guess a decision the owner owns. Give every option both a `label` and a `description`, or the call fails validation.

## 4. Judge each phase from the repository, never from memory

Re-read section 1 after every phase. The table and git are the truth.

| What you find | What you do |
| --- | --- |
| The phase moved the row on (PLANNING or NEEDS REPLAN became READY, READY became IN PROGRESS then EXECUTED, EXECUTED became DONE) | Go on to the next phase from section 2 |
| The row is unchanged but you committed to `uat` | Carry on with the same phase: it is getting somewhere |
| The row is unchanged and nothing was committed, twice running | Stop. The phase cannot finish as specified |
| A row went BLOCKED or OWNER-LED, or the owner must hold a device | Stop and report it |

**If your context runs low,** write the "Resume from" note in `LOG.md`, commit and merge what is finished, and ask the owner for the /handoff document. The next session resumes from it.

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

If the owner names a phase ("just plan it", "audit only"), run that one phase end to end by section 3's contract, then stop at section 6.
