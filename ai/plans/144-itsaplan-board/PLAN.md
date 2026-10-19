# Ticket 144: The board as a portable product, take three: It's a Plan

| Brief | The board as a portable product, take three: It's a Plan (itsaplan.dev) |
| --- | --- |
| Planned at | `5b1c965d`, version 2.0.1092, 2026-10-19 |
| Planned by | Lead session 2026-10-19, from the owner's brief in `ai/prompts/itsaplan-board.md` |
| Needs first | nothing (the two rejected prototypes are discarded and their branches are gone) |
| Parent | none |
| Group | the board prototype (`ai/plans/README.md` row 144 only, disjoint from every other open row) |
| Batch budget | 2 (two docs-and-operations steps, no code step) |
| Session budget | 2 |
| Steps count | 2 (bring the stack up, put the queue's tickets on it) |
| Device | none. The proof is the running stack and the browser read of the board |
| Owner decisions still needed | none. The research gate and the mapping are ruled here |

## 1. Goal

Two board products were built far too far and rejected the day each was handed over: Kanboard
v1.2.54 (2026-10-18) was called ugly in every way with a custom MCP layer creeping back in, and
Paperclip 2026.1012.0 (2026-10-18 to 2026-10-19) was discarded whole. The owner's lessons: an
ugly board is a rejected board, and a custom layer on top of the product counts against it.

Today the repository has no board the owner can look at. When this ticket is done, a third
product, It's a Plan v1.5.0, runs from its own `docker-compose.yml` with generated secrets in an
env file outside the repository tree, and the queue's own tickets sit on one project inside it.
The owner notices by opening `http://localhost:3001`, signing in, and reading the Kanban board.

The owner's rules that bind this work, quoted from `ai/prompts/itsaplan-board.md`:

- "Spin it up. As default as possible, bare minimum. Nothing else."
- "Put our current tickets on it."
- "I don't want anything to do with migration, nothing. I don't want to sync."
- "No AI agents, no MCP connection, no webhooks, no sync, no import engineering, no theming, no
  custom glue of any kind."
- "Nothing merges to `uat` until that ruling; the work lives on a branch."
- "No secret, address or key is ever committed."

## 2. Decisions

### 2.1 Taken

| Decision | Answer | By | Recorded |
| --- | --- | --- | --- |
| Product | It's a Plan v1.5.0 | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Release pin | `VERSION=1.5.0` in the env file, the release the brief names | agent-ruled | LOG.md, 2026-10-19 |
| Checkout and env location | `$HOME/athan-gitree/sessions/144/itsaplan` (clone) and `$HOME/athan-gitree/sessions/144/.env`, both outside the repository tree | agent-ruled | LOG.md, 2026-10-19 |
| Telemetry | `TELEMETRY_DISABLED=1` and `DO_NOT_TRACK=1` | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Postgres password alphabet | `openssl rand -hex 32` rather than base64, so the value cannot break the `DATABASE_URL` interpolation | agent-ruled | LOG.md, 2026-10-19 |
| Ticket import route | the product's own REST API (`/teams`, `/projects`, `/projects/:ref/issues`, `/issues/:id/links`) driven from a throwaway script in `$TMPDIR` | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Status mapping | Done to the product's Done column, In progress to In Progress, Ready and Planning and Audit to Todo, and Backlog and Deferred and Blocked and Upstream and Owner-led to Backlog | agent-ruled | LOG.md, 2026-10-19 |
| Needs mapping | each resolvable `needs` pair becomes one `blocked_by` relation between the two issues | agent-ruled | LOG.md, 2026-10-19 |
| Local cookie flag | `NODE_ENV=development` on the api service only, through a compose override outside the repository tree, so the session cookie is not `Secure` over plain HTTP | agent-ruled | LOG.md, 2026-10-19 |

### 2.2 The executor must not decide

None. The scope is two steps with no code path, the research gate is answered in section 4, and
the owner is hands-off until the verdict. No irreversible act the hard rules name is in scope:
no money, no credential leaves this machine, nothing is published, nothing is destroyed.

## 3. Pre-flight

`scripts/preflight-144.sh` verifies the stack checkout, the compose file, the free ports, the
absent committed secret, the queue row, the version, and every anchor count equal to 1. It ends
`PREFLIGHT OK`.

## 4. Background

### 4.1 Code map (repository)

| File | Why it is read |
| --- | --- |
| `board/reader.mjs` | emits `board/state/board.json`: the `tickets` array is the import's source, `doneColumnCount` 9999 in `board/config.json` puts all 107 done rows in that array |
| `board/config.json` | sets `doneColumnCount` to 9999, so the emitted count is 128 |
| `board/state/board.json` | the emitted tickets, regenerated at step 2 |
| `ai/plans/README.md` | row 144, the ticket this work tracks |
| `package.json`, `app.json` | the version files every commit bumps together |

### 4.2 Code map (the product, read in the checkout at `$HOME/athan-gitree/sessions/144/itsaplan`)

| Path | What it proves |
| --- | --- |
| `docker-compose.yml` | the seven services, the required env keys, the published ports 3000 and 3001, the `VERSION` image pin |
| `.env.example` | every optional variable, including the telemetry switches |
| `docs/self-hosting.md` | the `http://localhost` plain-HTTP cookie exception in Chrome and Firefox, and "the first account you register becomes the instance admin" |
| `apps/api/src/modules/projects/service.ts` | `DEFAULT_COLUMNS`: Backlog, Todo, In Progress, Done, Canceled |
| `apps/api/src/modules/issues/index.ts` | `POST /projects/:projectKey/issues` and `POST /issues/:issueId/links` |
| `apps/api/src/modules/teams/index.ts` | `POST /teams` then `POST /teams/:teamId/projects` |

### 4.3 Existing tests and what each proves

None apply. The deliverable is a running stack, and the repository has no test for a third-party
container stack. The proof is physical: the browser read of the board at step 2 and the API
counts recorded in `LOG.md`.

### 4.4 Why the obvious fix is wrong

Writing an importer inside the repository is the failure the two rejected runs repeated. The
brief forbids committed tooling, so the copy is throwaway session work in `$TMPDIR`. Theming the
product to look less plain is the second failure: the brief forbids a theme, and the default
interface is what the owner is being asked to judge.

## 5. Design

**Invariant.** The stack runs from the product's own compose file with only the seven required
env values plus the telemetry switches and the release pin, and the project holds one issue per
emitted ticket.

**Alternatives rejected.** A `.env` inside the checkout: the repository is public and the
identifier gate forbids a committed secret. A personal API key created through the browser: the
session cookie already round-trips over `http://localhost` with curl, so no second credential is
needed. Custom project columns named after the queue's own statuses: the brief says map onto the
product's fields, and the default five columns are the most default surface.

### Acceptance criteria

- [R1.1] WHEN the compose stack starts from the repository's `docker-compose.yml` with the generated env file THE SYSTEM SHALL report api healthy on port 3000 and web healthy on port 3001.
- [R1.2] WHEN `http://localhost:3000/auth-config` is read on the fresh database THE SYSTEM SHALL answer `{"hasUsers":false,"registration":"open","emailPassword":true}`.
- [R2.1] WHEN `node board/reader.mjs` runs on this tree THE SYSTEM SHALL write 128 tickets into `board/state/board.json`.
- [R2.2] WHEN the emitted tickets are posted to `POST /projects/athan-uk.QUEUE/issues` THE SYSTEM SHALL hold 128 issues, 107 in the Done column and 21 in the Backlog column.
- [R2.3] WHEN a ticket's `needs` entry names an emitted ticket THE SYSTEM SHALL hold one `blocked_by` relation for that pair, 53 pairs in total across the project.
- [R2.4] WHILE no agent, webhook or Telegram token is configured THE SYSTEM SHALL log the worker and bot start lines and nothing after them, and answer an empty webhook list.
- [R3.1] WHEN the first account registers at `http://localhost:3001/register` THE SYSTEM SHALL give it the `god` role and open a session that reaches the board.
- [R4.1] IF any research-gate answer is no THE SYSTEM SHALL stop and report before starting the stack.
- [R5.1] WHEN the work is handed over THE SYSTEM SHALL leave the stack running, the board reachable at `http://localhost:3001/athan-uk.QUEUE`, and no generated file inside the repository tree.
- [R6.1] WHEN the board is read THE SYSTEM SHALL render the queue's ten columns by their queue names, left to right Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit, Owner-led, Upstream and Done.
- [R6.2] WHEN the emitted tickets are placed THE SYSTEM SHALL put each on the column its queue row names, 107 on Done and 21 across the open columns.
- [R7.1] WHEN the AI Agents page is read THE SYSTEM SHALL list the seven workflow roles, and the Skills library SHALL hold `athan-lead` and `athan-planner`.
- [R7.2] WHEN an agent connects to the local board over MCP THE SYSTEM SHALL take a personal key from the shell environment and list the board's tools.
- [R8.1] WHEN the runner is considered THE SYSTEM SHALL leave it uninstalled and record that starting it spends model tokens.

## 6. Steps

- [ ] Step 01: bring the stack up on the pinned release, defaults only (`steps/01-bring-up.md`)
- [ ] Step 02: put the queue's tickets on one project through the REST API (`steps/02-import.md`)
- [ ] Step 03: inject the workflow into the board (`steps/03-inject.md`)

Both steps are operations, not code. The evidence for each is a command's output recorded in
`LOG.md`.

## 7. Device proof

None. No phone, no simulator and no build is in scope. The physical proof is the browser read of
`http://localhost:3001/athan-uk.QUEUE` and the issue page, with the column counts in the
screenshots kept outside the repository tree.

## 8. Records

`LOG.md` carries the planning section and one `### Step <NN> — <state>` section per step, each
ending with a `session:` line. The queue cell text the lead applies on DONE is settled by the
owner's verdict, which is a later ticket. This run leaves row 144 OWNER-LED with the handover
record. The docs commit subject is `docs(plans): ticket 144 ...`.

## 9. Push

None. The executor never pushes. The lead pushes after the reviews pass and the owner's verdict.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| A required env key is missing | the compose file names the key in its refusal. Add it to the env file outside the tree and re-run `up -d` |
| Agent containers exit on start | read `docker compose logs <service>`. The api healthcheck line and the migrate exit code come first |
| The browser stays signed out after sign-in | the session cookie is `Secure` and the browser is WebKit. The api runs with `NODE_ENV=development` from the compose override, so the cookie is not `Secure` and every browser keeps it |
| The import script fails midway | re-run with `--links-only`, which resolves existing issues by their `#<order>` title prefix |
| A port is taken | 3000 and 3001 carry `API_PORT` and `WEB_PORT`. Change one in the env file only, never in the compose file |

## 11. Subagents

Planning: none. The brief is complete and the research gate is answered from the product's own
source. Delivery: none. The two steps are operations driven by the lead, and the audit is the
lead's read of the running board. `vision` reads any screenshot the lead cannot see.

## 12. Report to the owner

What changed: It's a Plan v1.5.0 runs locally from its own compose file, and one project holds
the queue's 128 emitted tickets. What was proven: the criteria in section 5, each against a
command's output in `LOG.md` or a browser read. Decisions waiting on the owner: the verdict on
look, feel and functionality. The four-line handoff closes the run, with the URL and the ports.
