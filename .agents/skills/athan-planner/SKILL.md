---
name: athan-planner
description: Plan one ticket on the board. Read it from the board, answer the frontier agent-ruled, write the plan as a Docs page on the issue, set the labels and the dependencies, lay the steps out as subtasks, pass the gate, and leave the ticket Ready. Use when a ticket sits in Planning, or when the owner asks to plan one.
---

# athan-planner

You plan one ticket. You read it from the board, decide everything it leaves open, write the
plan, and leave the ticket Ready.

Read `.agents/skills/board-workflow/SKILL.md` first. It holds the conventions.

## 1. Read the ticket

`get_issue_by_number` with the key and the number. If the owner's ask names no ticket, search the
board first with `search_issues`. A second ticket for the same work is a defect, not diligence.

## 2. Answer the frontier, agent-ruled

A question the ticket leaves open is never asked of the owner. State the options, take your own
recommendation, argue it twice (challenge it once, and if it flips, argue it once more and
commit), and record it:

- as one line in the plan doc under **Decisions taken**
- with the date and one line of why

Facts are never questions. Measure them: read the code, run the command, check the docs.

The one hard stop is an irreversible act: money, credentials, publishing, destroying data.
Report it in the ticket as a comment and leave the ticket in Planning.

## 3. Write the plan

Create a Docs page on the issue, titled with the ticket's identifier, and link it to the issue.
It carries, in this order:

1. **Goal**: what is wrong today, and what is true when this is done.
2. **Decisions taken**: one line each, dated, with the why.
3. **Files**: every file this will read or change, one line each.
4. **Design**: the approach, the invariant, and the alternatives rejected with the reason.
5. **Steps**: a numbered list. Each step names what it produces and its weight, 1 for docs, 2
   for code, 3 for a device.
6. **Risks**: what could go wrong and what would show it.
7. **Proof**: the exact commands or reads that will show each acceptance criterion met.

The plan is concrete enough that two competent implementers do the same thing. Hedge words are
banned: say the exact condition and the exact action. The list is: as appropriate, as
needed, as necessary, if needed, if applicable, if relevant, where appropriate, where needed,
where applicable, as per, accordingly, etc., and so on, and/or, TBD, for example, e.g., i.e.,
various, several, some, appropriate, reasonable, properly, correctly.

## 4. Write the ticket itself

- **Description**: rewrite it to the three parts. Goal, where, and the acceptance criteria as a
  `- [ ]` list. Every criterion observable by a test, a command's output or a log line.
- **Labels**: the surface and the area, from the vocabulary in `board-workflow`. Only what is
  honestly true.
- **Type**: exactly one, and it is never left unset. Bug fixes something broken. Feature adds an
  ability. Investigation answers how something works or why it fails. Research reads sources
  outside the code. Chore is upkeep. Refactor restructures without changing behaviour. Docs
  writes prose. Design decides a look. Testing is a test, a suite, or a run on a real device.
  Release is a build, a version or a ship.
- **Weight**: the sum of the step weights, set in both places and equal by arithmetic: the
  estimate field and the `N pts` label. Re-add the steps before saving; a number that
  disagrees with the steps is a defect.
- **Subtasks**: one per step, titled `Step N: <what it produces>`. Create each with the parent
  set to this ticket, in the Backlog column so they do not count as ready.
- **Relations**: for each thing this waits on, a `blocked_by` relation to that ticket.
- **Ticket number**: already set at intake. Leave it.

## 5. The gate

The ticket is Ready only when all of these hold. Check each one, do not assume:

| Check | How |
| --- | --- |
| The description has Goal, Where and Acceptance | read it back |
| Every criterion is observable | each one names a test, a command or a log line |
| The plan doc exists and is linked | `list_documents`, then the issue's linked docs |
| Every plan step has a subtask | compare the doc's step list to the issue's subtasks |
| The weight is one number in three equal places | estimate field, `N pts` label, sum of step weights |
| Every dependency is a relation | `get_issue` and read its links |
| Nothing is left as a question | the plan's Decisions taken has no open item |

A failed check is fixed, not reported. The one exception is an irreversible act, which stops the
work and stays in Planning.

## 6. Leave it Ready

Move the ticket to Ready with `update_issue`, comment one line naming the plan doc and the step
count, and stop. Do not start executing.

## 7. When the plan is rejected

The griller returns findings. Answer each one: fix the plan and the ticket, or record why not, in
one line, in the plan doc. Then re-run the gate and move it back to Ready. A plan that fails the
gate twice on the same finding is a stop, reported to the lead.
