# The Paperclip board: full handoff brief for the next session

Copy-paste everything below this line into the fresh session.

---

Begin ticket 70: the board and workflow as a portable system, now on Paperclip. Read
`ai/AGENTS.md` first, then this brief in full. The owner is hands-off for the whole run:
no questions reach the owner, everything is ruled agent-side (own recommendation argued
twice, recorded with a date and one line why, tabled in the final reply), and the only
stops are the irreversible acts the hard rules name.

## What happened before (the Kanboard run, 2026-10-18, one day, decommissioned same day)

Kanboard v1.2.54 was deployed through Docker Compose, themed dark through its own Custom
Stylesheet setting, all 127 queue tickets imported once, an existing MCP server adopted
for agents, and the whole thing physically proven end to end (twelve checks: create,
update, move through every column, close, subtasks, comments, links, two agents writing
concurrently, batch creation, cleanup). The owner rejected it outright: the interface is
ugly in every way, and despite the rules, custom glue kept creeping back in (a self-built
MCP server was written before the owner stopped it, then a sync service, then an import
tool - each deleted in turn). The decommission commit removed every file; the branch was
discarded; `board/` and the markdown queue stand untouched as before. Git history keeps
the record if ever needed; treat it as a warning, not a reference.

## The goal

A board the owner WATCHES: agents and subagents running live - which tickets each picks
up, which lanes are free, tickets progressing column by column. The board is AI-first:
the agents are the primary users and writers, the owner is the audience. The product is
Paperclip: `paperclip.ing`, `paperclip.inc`, `github.com/paperclipai/paperclip`.
Verified 2026-10-18 by search: MIT-licensed, self-hosted, no account required, a Node.js
server and React UI built for orchestrating teams of AI agents. Re-verify everything
yourself; nothing below is a substitute for reading its docs and source.

## Hard requirements, the owner's own words and rulings

- Self-hosted and completely free, running locally, deployed through Docker onto the
  owner's home server (a different machine on the network).
- Single project or multiple projects; the owner wants multiple eventually.
- Use everything that is built in. NOTHING CUSTOM: no self-built MCP servers, no sync
  services, no import scripts committed to the repo, no custom code layers on top. If
  the product needs glue, that is a mark against the product, not a reason to write the
  glue. Configuration files and one-shot provisioning through documented surfaces are
  acceptable; code libraries in this repository are not.
- Agents and subagents drive the board through the product's own interfaces (its API,
  its MCP server if it ships one, its CLI). Find out what exists before building
  anything.
- The interface must look good. The owner rejected Kanboard primarily on looks. Judge
  Paperclip's real UI (screenshots, the live app, its gallery) BEFORE deep work, and say
  plainly whether it clears the bar. Styling only through the product's native theming
  mechanisms, if needed at all.
- No login friction for the owner's browser viewing: no password, no username. If the
  product supports passwordless or token-link access, use it as designed.
- The markdown queue (`ai/plans/README.md`) and the read-only board in `board/` stay
  untouched and working until the owner rules the cutover. Nothing merges to `uat`
  until the owner has tested and approved the prototype: the work lives on a branch.
- Physical testing, not unit tests: the next session drives the real product end to end
  with dummy data (create, move through columns, link, update, delete, two concurrent
  agents), watches it live, then cleans up after itself.

## How to run the research (heavy, before any code)

- Docs through the docs MCP server (scrape Paperclip's documentation at its verified
  current version), source through the opensrc CLI (`paperclipai/paperclip`), web
  through tinyfish. Parallel research agents for: deployment (Docker image, compose,
  volumes, ports, home-server move, backup), the agent interface (API, MCP server,
  CLI, auth - what an agent actually calls), and the customization surface (theming,
  columns/lanes, multi-project, webhooks, live views of running agents).
- Answer first: does it do the WATCH job natively (seeing agents pick up and progress
  tickets)? Does it ship or document an MCP server? Is it truly free and self-hostable
  with no cloud dependency? Is the UI good enough that the owner will not reject it on
  sight? If any answer is no, stop and report with the evidence before building.
- The Kanboard session's research method worked well: three parallel research workers
  (deployment, agent interface, customization), source read directly, docs scraped and
  verified. Reuse the method, not the conclusions.

## Repo rules that bind this work

- No secret, address, or key is ever committed; local values live in gitignored files
  (the identifier gate enforces this, including private-network literals).
- Every commit bumps the version files; non-feat subjects take exactly one patch.
- Work on one branch; the owner tests before anything merges; nothing pushes without
  review.
- Deep-clean as you go: no dead code, no leftover files, no scratch.
- The old board in `board/` and the queue markdown are not touched by this ticket.

## Where things stand right now

- The Kanboard stack is torn down (containers and volumes deleted); no trace runs on
  this machine.
- `uat` carries the decommission: every kanboard file gone, `board/reader.mjs` restored,
  ticket 70 rewritten to this brief (queue row 70 in `ai/plans/README.md`).
- The 127 tickets and their statuses live in the markdown queue as they always have.
  Paperclip gets the tickets through whatever built-in path it offers (if its only path
  is manual or API-driven one-time copy, that copy runs as throwaway session work and
  dies with the session, exactly like the Kanboard import did).

Start with the research, then plan in `ai/plans/70-paperclip/` following the repo's plan
template, then build on a branch, then test physically, then stop and hand the board to
the owner for the verdict.
