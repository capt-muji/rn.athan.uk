# Step 03: inject the workflow into the board

Requirements: R6.1, R6.2, R7.1, R7.2, R8.1
Weight: 1

## Goal

The board stops being a copy of the queue and becomes the queue's own surface: the queue's ten
columns, its tickets on them, its agents, its skills, its docs, and a reachable MCP endpoint.

## Branch

`board/144-itsaplan`, after the owner approved the prototype on 2026-10-19.

## Files

Changed inside the repository: `opencode.json` (the `itsaplan` MCP server), `AGENTS.md` and
`ai/AGENTS.md` (the routing notes).
Written outside the repository tree: `$TMPDIR/itsaplan-integrate.mjs`, `$TMPDIR/fix-order.mjs`,
and the personal key at `$HOME/athan-gitree/sessions/144/mcp-key.txt`. The key also lives in the
shell environment as `ITSAPLAN_API_KEY`.

## Red test

None. The failing state is the board holding the product's five default columns and no agents,
proven by the project read before this step.

## Change contract

Ten columns carry the queue's own words. The product orders columns by state category and then
by position, so Deferred sits beside Backlog and Done sits last. Each issue moves to the column
its queue row names. `Queue order` is a number field on every issue. Seven agents, two skills
and five Docs pages are created. The MCP entry takes `x-api-key` from `{env:ITSAPLAN_API_KEY}`
and no key is written into the repository.

## Green run

The project read lists the ten columns in the order above with 107 tickets on Done and 21 spread
across the open columns. The AI Agents page lists seven roles. The Skills library lists
`athan-lead` and `athan-planner`. An MCP `initialize` with the personal key answers 200 and
`tools/list` returns the board's tools.

## Break script

`scripts/break-step3.sh`: read the MCP endpoint with no key and record the refusal.

## Version and commit

2.0.1095, `chore(board)`.

## Review

Read `opencode.json` once for a key written into the file, and read the project's column list
once for a queue column with no counterpart.

## Merge

`git merge --no-ff board/144-itsaplan` only after the owner's ruling.

## Done when

`R6.1`, `R6.2`, `R7.1`, `R7.2` and `R8.1` hold.
