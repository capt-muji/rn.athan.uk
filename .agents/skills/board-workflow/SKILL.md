---
name: board-workflow
description: How every agent reads and writes the board. Use when a session picks a ticket, moves one between columns, writes a plan, comments, or closes a ticket. It defines the ten columns, the label vocabulary, the Lane and Waiting on fields, the picking rule, and what a ticket must carry before it is Ready.
---

# The board workflow

The board is the tickets. There is no file. Everything a ticket is, and every stage it passes
through, lives on the board.

Instance: `itsaplan`, the MCP server wired in `opencode.json`. There is one project, so
`list_projects` gives its ref and `get_project` gives every id. The team is `Athan`.

## The ticket's number

A ticket is its number, written `#42`. The number is the one a person says, and the ticket
carries a label of the same name, so a card shows it as a chip.

The product also builds an identifier for every ticket: the project's key, a dash, and the number.
The key here is `T`, so ticket `#42` is `T-42` to the tools and in any link. The number is what a
person says. The key is plumbing, and the two now agree.

## The ten columns

The product renders columns grouped by state kind, so the kind decides where a column sits and
only the position decides the order inside a group.

| Column | Kind | What it means |
| --- | --- | --- |
| Backlog | backlog | Waiting, not planned |
| Planning | unstarted | A planner is writing the plan |
| Ready | unstarted | Plan passed its gate, waiting for execution |
| In progress | started | A lane is executing it |
| Blocked | started | It cannot move until something outside changes |
| Audit | started | Execution done, under review |
| Awaiting Owner | started | Parked until the owner rules; the Waiting on field carries the question |
| Deferred | started | Parked behind a later version |
| Upstream | started | Waiting on a party outside the repository |
| Done | completed | Merged to `uat`, with its records |

Deferred and Upstream carry the `started` kind only so they sort after Awaiting Owner. They
are parked states, they count as started in the project's analytics, and they are never picked.

## Picking the next ticket

A ticket is runnable when all of these hold:

- its column is **Backlog** or **Ready**, and nothing else
- it is not a subtask (`parentId` is null)
- every issue that blocks it is in a `completed` column

Among the runnable ones, the lowest `Ticket number` goes first. That field holds the number a
person says. A ticket with no number yet goes last.

A subtask is a plan step. It never gets a lane of its own. It is finished by whoever works its
parent.

## What a ticket carries

| Field | When it is filled | Who fills it |
| --- | --- | --- |
| Title | At creation | Intake |
| Type | At planning, one of Bug, Feature, Investigation, Research, Chore, Refactor, Docs, Design, Testing, Release | The planner |
| Story points | At planning, the sum of its step points, on the ticket's estimate field | The planner |
| Description | At creation, sharpened at planning | Intake, then the planner |
| Column | At every stage | Whoever moves it |
| Ticket number | At creation | Intake |
| Labels | At planning | The planner |
| Lane | Before dispatch | The lead |
| Waiting on | On entering Blocked, Upstream or Awaiting Owner | Whoever moves it there |
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

### The title

The title is the work, never its state. No column word appears in it: Backlog, Planning, Ready,
In progress, Blocked, Audit, Awaiting Owner, Deferred, Upstream, Done. A ticket moves between
columns and the title does not follow it, so a title that names its column goes stale at the next
move.

An upstream ticket's description carries its PR URL as a clickable link on the first line, so a
tap opens the pull request itself.

### The labels

A card shows labels and nothing else, so the labels carry everything, in a fixed order:

1. The number, `#42`. Set at intake and never moved.
2. The kind, one of `Bug`, `Feature`, `Investigation`, `Research`, `Chore`, `Refactor`, `Docs`, `Design`, `Testing`, `Release`. It matches the ticket's type field.
3. The surface, one of `iOS`, `Android`, `Both`.
4. The area, one or more of `widgets`, `notifications`, `prayer-times`, `qibla`, `board`, `docs`, `research`.
5. The flags, `needs-owner` or `upstream`, only when true.

A number never rides a label. The story points live on the ticket's estimate, which the card
shows on its own.

`labelIds` replaces the whole set, so send every label the ticket keeps, in that order.

The order is the point. A person reads a card the same way every time, so the number is always
first and the kind always second. Never append a label out of this order.

A ticket with no honest surface or area label gets none. Do not guess.

### Story points

A step is 1 point for docs, 2 for code, and 3 for a device. A ticket's story points are the sum of
its steps, and they are the one number that says how much session a ticket will eat.

The board's story-point estimate is the only place the number lives: the ticket's estimate holds
the ticket's points, and each step's own estimate holds that step's points. No label carries a
number.

The lead uses it. A lane carries tickets in sequence and stops when the story points it has
carried cross the session budget, which is 6 by default, or when its own context passes about 40
percent. A device step, 3 points, always runs alone in a fresh session.

### Integrity

A ticket is well-formed when every one of these holds. Any agent that finds a defect fixes it on
sight and notes the fix in one comment line. A defect is never reported and left standing.

1. The description carries Goal, Where and Acceptance, every criterion observable.
2. The type is set and matches the kind label.
3. Story points in two places, all equal: the ticket's estimate and the sum of its steps'
   estimates. Verify the arithmetic before saving. A number that disagrees is a defect.
4. Labels in the fixed order, number first, and no surface or area label that is not honestly
   true. Creation sorts labels by id, so after `create_issue` read the card back and re-send
   the order through `update_issue`, which keeps it. The stored order is what the card shows.
   A new label is created only when the vocabulary lacks the name, and it must match its set:
   a number is white in the number group, kinds, surfaces and areas carry their own
   group's colors.
5. `Lane` is set the moment a lane takes the ticket.
6. `Waiting on` is set in the same breath as entering Blocked, Upstream or Awaiting Owner.
7. Every plan step has its subtask, and every subtask is ticked before Done.
8. A plan doc exists and is linked before Ready, and a closing comment exists at Done.
9. Nothing parked reads active, and nothing active reads parked.
10. The title carries no column word, and an upstream ticket's description carries its PR link.
11. No relation outlives its blocker. The agent that moves a ticket to Done removes every
    relation that has it blocking another, and any agent that finds a blocks-relation whose
    blocking issue sits in a completed column removes it on sight, noting the fix in one
    comment line. A card renders red off the relation, so one left standing shows a block
    that no longer exists.

The lead re-runs this list on every ticket the run touches at every phase boundary, and across
the open board once at the start and once at the close of a run. That loop is the workflow:
every ticket that passes, and every change, gets read again.

## The plan

The plan is a Docs page on the issue, titled with the ticket's identifier. It holds the design,
the alternatives rejected, the risks and the step list. The description stays short.

The step list also becomes one subtask per step, titled `Step N: <what it produces>`.

## Moving a ticket

`update_issue` with the `columnId` of the target column. Read the columns once with `get_project`
and reuse the ids. A column is chosen by its name here, because the kinds are not unique: Planning
and Ready share one, and every parked state carries `started`.

- Entering `In progress` is the claim. Do it first, before any other work.
- Entering `Blocked`, `Upstream` or `Awaiting Owner`: set `Waiting on` in the same breath,
  naming what it is waiting for. It takes one line.
- Entering `Done`: the change is merged, the audit passed, and the closing comment is written.
  The same move removes every relation that has this ticket blocking another: a completed
  ticket blocks nothing.

Never move a ticket that is not yours to move. One ticket per agent per turn.

## Commenting

A comment is for a person reading the board. Keep it to a line or two, in plain sentences.

- Say what happened or what is left. Not what files changed.
- Never paste a diff, a log or a stack trace.
- When everything asked for is done, say so in one line.
- When part of it is not done, say what is left and why.
- Answer a question in the thread with `replyToId` set to the comment that asked it.

## Working an issue

1. Read it with `get_issue_by_number`, passing `T` and the ticket's number. The number in the
   title is the number the tool takes.
2. Move it to `In progress`.
3. Do the work in the repository.
4. Move it to `Done`, or to `Deferred` if it is parked.
5. Comment once, then stop.

## Failure

If a write fails, stop and report. Do not retry blindly, and do not work around it by moving a
different ticket. A board that disagrees with the work is worse than a stopped run.
