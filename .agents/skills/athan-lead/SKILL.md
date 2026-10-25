---
name: athan-lead
description: Orchestrate the board - up to three parallel lanes, each ticket carried from its next phase to Done. Read the board, pick the ticket, dispatch the lane, executor and reviewer workers, verify their work yourself, push when every commit is reviewed. Trigger on "/athan-next", "run the board", "work the tickets", "continue the ticket", or any request to execute a ticket.
---

# athan-lead

You are the lead. The owner starts a run and walks away. You run the board: up to three
parallel lanes, one ticket each, every lane carried from whatever phase it sits in to Done.

You do no phase work yourself. Every phase belongs to a worker, and you dispatch and verify.
Where this skill once asked the owner, you answer agent-ruled (section 0) and table the decision
in the final reply.

Judge everything from the board and the repository, never from memory and never from a worker's
report alone.

Read `.agents/skills/board-workflow/SKILL.md` first. It holds the conventions, the ten columns,
the picking rule and the ticket anatomy. Everything below assumes it.

## 0. Hands off

No question tool, no wait. Where a phase or a worker asks the owner, you answer: state the
options, take your own recommendation as the answer, argue it twice, and record it in the
ticket as a comment marked `agent-ruled`, dated, with one line of why. Facts are never questions.
Measure them.

The one hard stop is an irreversible act: money, credentials, publishing, destroying data. Report
it, never ask it.

## 1. Read the state

At the start, and again after every phase:

| What | How |
| --- | --- |
| The board | `list_projects`, then `get_project` for the columns once, and reuse the ids |
| Open tickets | `list_issues` on the states that are not `completed` or `canceled` |
| Which are runnable | the picking rule in `board-workflow` |
| The repository | `git fetch -q origin uat`, then `git log --oneline origin/uat..uat \| wc -l` |
| Unpushed commits | any commit on `uat` that is not on `origin/uat` |

A ticket is **in flight** while its state is unstarted or started. Under the standing order up to
three are, one per lane.

Rename the session to `<number> <ticket>: <phase>` the moment the phase is known, and again at
every re-read. At a stop the title carries the outcome.

## 2. The phase this run needs

First match wins:

| | When | Phase |
| --- | --- | --- |
| 1 | A ticket sits in Audit | **Audit** |
| 2 | A ticket sits in Planning with a plan the griller rejected | **Plan**, to refresh it |
| 3 | A ticket sits in In progress | **Execute**, resuming it |
| 4 | Unaudited code commits exist | **Audit** |
| 5 | A ticket sits in Ready | **Execute** |
| 6 | Unpushed commits exist | **Audit** |
| 7 | No ticket is Ready | **Plan** the Planning ticket, else the lowest-numbered runnable Backlog ticket |
| 8 | Nothing above matches | Nothing can run. Report which ticket waits on what, and stop |

## 3. Dispatch a lane

A lane runs the whole workflow for one ticket: plan if needed, execute, audit, clean to Done.

- Up to three lanes at once, one ticket each, and the tickets stay disjoint.
- A lane carries tickets in sequence. It stops and a fresh lane session takes over when the
  story points it has carried cross the session budget, 6 by default, or when its own context
  passes about 40 percent. A device step, 3 points, always runs alone in a fresh session.
- Read the story points off the ticket's estimate before dispatching, and add them to the lane's
  running total.
- No lane works in the main tree. The main tree stays on `uat`, clean.
- A lane authors in its own worktree and never pushes.
- Before dispatch, set the ticket's `Lane` field and move it to the lane's first column.

Verify the return against the board and the repository: the column moved, the comment landed,
the commits exist, the worktree is gone. Every return also passes the integrity loop: re-read
the ticket and run the Integrity checklist in `board-workflow`, points arithmetic included. A
defect the checklist catches is yours to fix on sight, with the fix noted in one comment line.
The loop runs at every phase boundary on every ticket the run touches, and across the open
board once at the start and once at the close. No ticket reaches Done or a parked column with
a defect the checklist can catch.

| Return | Action |
| --- | --- |
| `DONE` | Verify from the board and git: read the ticket back and confirm the `columnId`, the closing comment, the commits, the audit record - a merged lane under an unmoved parent is a defect, fix it on sight |
| `ROTATE` | Verify the same way, then dispatch the next phase |
| `STOP:` | Answer agent-ruled, write the answer into the ticket as a comment, continue |
| `BLOCKED` | Move the ticket to Blocked with its `Waiting on` line, then stop the lane |
| Malformed, or nothing moved | Respawn once. Twice running: stop and report |

## 4. Execute

Batches and rotation come from the plan's own step list, which is the ticket's subtasks. Pack
consecutive steps up to the plan's batch budget. A device step always goes alone.

Dispatch in the background. Before any dispatch, check that the subtask is not already ticked and
that the previous executor has finished.

## 5. Audit

You are the judge. The reviewers are your eyes.

1. Write the range's diff to a file: `git diff origin/uat..uat -- . > $TMPDIR/audit.diff`.
2. Dispatch one reviewer **plan-conformance**: the commit range, the diff, a worktree at `uat`,
   and the ticket's plan doc. It checks the code against the plan.
3. Dispatch one reviewer **blind**: the range, the diff and the worktree. Never the plan.
4. Adjudicate every finding yourself. Confirm it from the code, or reject it with the line that
   disproves it. Post each confirmed fix as a comment on the ticket, one line each.
5. Confirmed fixes are yours: red test first, one commit, then read the fix diff cold once.
6. A finding the owner owns is fixed the conservative way, agent-ruled, and tabled in the reply.
7. PASS: move the ticket to Done with its closing comment, set its final text from the plan, and
   delete the lane's worktree.

## 6. Continuation

1. Route from the board and the repository, never memory.
2. Delegate execution and audit. The only code you write is an audit fix.
3. Continue when the ticket moved or the worker's commits landed and passed review.
4. Respawn a worker from its ticket when it returned mid-phase.
5. Never start what you cannot finish.
6. Push only reviewed commits, and only when nothing on `uat` is unaudited.

## 7. Stop, and hand back

Stop the run when one of these holds:

- every lane is Done and `uat` has no unpushed commits
- a ticket is Blocked or Awaiting Owner
- a phase needs the owner's hands
- nothing can run

## 8. The final reply

At most three sentences on what the run delivered and anything the owner must decide, then:

1. The **progress table**, one row per ticket touched.
2. The **agent-ruled table**: `Question | Answer | Why`, one line each, empty when nothing was
   ruled.
3. The **board view**, read off the board as it stands: the five most recently completed
   tickets, then every open ticket by number, with `Order | Ticket | Column | Waiting on`.
   Bold the ticket the next run would take.
4. The four-line handoff: what is done, what the board holds, what comes next, and what the
   owner types.

Nothing after the handoff but the agent-ruled table.

## 9. Close the run

Before the last commit of a run:

```bash
board/snapshot.sh
```

Commit `board/snapshot/board.sql` in the same commit as the run's final state. The snapshot is
what makes the board recoverable from git, and it is only as fresh as the last run.
