---
name: board-workflow
description: How every agent reads and writes the queue's board. Use when a session picks a ticket, moves one between columns, writes a plan, comments, or closes a ticket. It defines the ten columns, the label vocabulary, the Lane and Waiting on fields, the picking rule, and what a ticket must carry before it is Ready.
---

# The board workflow

The board is the queue. The repository queue file is gone. Everything a ticket is, and every
stage it passes through, lives on the board.

Instance: `itsaplan`, the MCP server wired in `opencode.json`. Project: `athan-uk.QUEUE`. The
team is `Athan.uk`. There is one project and one board.

## The ten columns

Pick and move a column by its `stateType`, never by its name. The names are ours and can change.
The state kinds cannot.

| Column | stateType | What it means |
| --- | --- | --- |
| Backlog | backlog | Queued, not planned |
| Deferred | backlog | Parked behind a later version |
| Planning | unstarted | A planner is writing the plan |
| Ready | unstarted | Plan passed its gate, waiting for execution |
| In progress | started | A lane is executing it |
| Blocked | started | It cannot move until something outside changes |
| Audit | started | Execution done, under review |
| Owner-led | started | The deliverable is something the owner must rule on |
| Upstream | started | Waiting on a party outside the repository |
| Done | completed | Merged to `uat`, with its records |

## Picking the next ticket

A ticket is runnable when all of these hold:

- its column's stateType is not `completed` and not `canceled`
- it is not a subtask (`parentId` is null)
- every issue that blocks it is in a `completed` column
- it is not already in a `started` column

Among the runnable ones, the lowest `Queue order` goes first. `Queue order` is a number field
holding the ticket's number. A ticket with no number yet goes last.

A subtask is a plan step. It never gets a lane of its own. It is finished by whoever works its
parent.

## What a ticket carries

| Field | When it is filled | Who fills it |
| --- | --- | --- |
| Title | At creation | Intake |
| Description | At creation, sharpened at planning | Intake, then the planner |
| Column | At every stage | Whoever moves it |
| Queue order | At creation | Intake |
| Labels | At planning | The planner |
| Lane | Before dispatch | The lead |
| Waiting on | On entering Blocked, Upstream or Owner-led | Whoever moves it there |
| Subtasks | At planning, one per step | The planner |
| Comments | As the work happens | Whoever has something to report |

### The description

Three parts, in this order:

```
Goal: one sentence on what is wanted.

Where: the files or surfaces it applies to.

Acceptance:
- [ ] one observable outcome
- [ ] another observable outcome
```

If a criterion cannot be seen by a test, a command's output or a log line, it is not a
criterion. Rewrite it until it can.

### The labels

Surface, one of: `iOS`, `Android`, `Both`.
Area, one or more of: `widgets`, `notifications`, `prayer-times`, `qibla`, `board`, `docs`,
`research`.
Flags, only when true: `needs-owner`, `upstream`.

A ticket with no honest surface label gets none. Do not guess.

### The plan

The plan is a Docs page on the issue, titled with the ticket's identifier. It holds the design,
the alternatives rejected, the risks and the step list. The description stays short.

The step list also becomes one subtask per step, titled `Step N: <what it produces>`.

## Moving a ticket

`update_issue` with the `columnId` of the target column. Read the columns once with `get_project`
and reuse the ids.

- Entering `In progress` is the claim. Do it first, before any other work.
- Entering `Blocked`, `Upstream` or `Owner-led`: set `Waiting on` in the same breath, naming what
  it is waiting for. It takes one line.
- Entering `Done`: the change is merged, the audit passed, and the closing comment is written.

Never move a ticket that is not yours to move. One ticket per agent per turn.

## Commenting

A comment is for a person reading the board. Keep it to a line or two, in plain sentences.

- Say what happened or what is left. Not what files changed.
- Never paste a diff, a log or a stack trace.
- When everything asked for is done, say so in one line.
- When part of it is not done, say what is left and why.
- Answer a question in the thread with `replyToId` set to the comment that asked it.

## Working an issue

1. Read it with `get_issue_by_number`. The identifier is `QUEUE-42`, so the key is `QUEUE` and
   the number is `42`.
2. Move it to a `started` column.
3. Do the work in the repository.
4. Move it to `completed`, or `canceled` if it is abandoned. Never leave it `started`.
5. Comment once, then stop.

## Failure

If a write fails, stop and report. Do not retry blindly, and do not work around it by moving a
different ticket. A board that disagrees with the work is worse than a stopped run.
