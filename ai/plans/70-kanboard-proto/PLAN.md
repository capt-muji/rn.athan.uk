# Ticket 70 - The board and workflow as a portable system: the Kanboard prototype

| Field | Value |
| --- | --- |
| Brief | The owner's voice order, 2026-10-18: heavy research on Kanboard (self-hosted kanban), then a working prototype of the whole ticket workflow on it, side by side with the existing board, agent-driven through MCP, styled like the existing board, self-hosted through Docker Compose, movable to the home server, multiple projects, with a one-switch migration path. Do not break the current workflow. |
| Planned at | `uat` `9b89e0e`, 2.0.1086, 2026-10-18 (the gendered-pronoun purge commit that precedes the plan folder; planned against `9056833ef8d71b27900f348c4a478543664aaa84` 2.0.1085 before it) |
| Planned by | The lead session (research: three parallel research workers plus source and docs reads, recorded in LOG.md) |
| Needs first | None. Ticket 70 was DEFERRED; the owner's 2026-10-18 order is the go and amends the brief from research-only to research plus prototype. |
| Parent | None |
| Group | Board infrastructure, disjoint from all app-code tickets. Shares `board/reader.mjs` (exports added, behavior-neutral) with no other open ticket. |
| Batch budget | 4 code steps, one commit each, all executable in one session |
| Session budget | One session holds the research context; execution may split after step 2 |
| Steps count | 4 |
| Device | None. No app code changes. The live proof is the Docker stack on this machine. |
| Owner decisions still needed | None. The owner ruled hands-off, agent-ruled throughout. |

## 1. Goal

What is wrong today: the queue board is a custom read-only renderer over `ai/plans/README.md`. When the markdown is edited badly, tickets vanish or land in wrong columns (the owner's lived cases: blocked tickets that should not be blocked, references to tickets that do not exist, missing references, duplicates). Worst, every subagent carries its own git workflow and its own view of the board, so there is no single shared state outside the repository that all agents can read and write.

What is true when DONE: a self-hosted Kanboard v1.2.54 instance runs beside the existing board through Docker Compose, reachable on the LAN-bound port, carrying the full current queue as a project with the ten canonical columns, restyled dark to the existing board's palette through Kanboard's own Custom Stylesheet setting. A sync service mirrors the queue markdown into Kanboard on a 15-second reconcile pass, idempotently, so both boards always agree. A zero-dependency MCP server exposes ticket create, read, update, move, close, open, delete, comment, link, subtask, search, project, and sync-status operations to every agent and subagent in this harness, and the existing board on port 8788 is untouched in behavior.

How the owner notices: `docker compose up -d` in `kanboard/` followed by `node provision.mjs` gives a dark board at `http://127.0.0.1:8789` carrying every rendered queue ticket (the count a fresh `node board/reader.mjs` reports), and any agent session can call the `kanboard` MCP tools.

The owner's rules that apply, from the voice order of 2026-10-18:

- "Kanboard... it's self-hostable. We want to self-host it locally here."
- "Don't we want to run both boards side by side. This is a prototype."
- "All agents, subagents, grandchild agents can interact with this board through the MCP server... update tickets, create tickets, edit tickets, delete tickets, move tickets... basically the entire workflow that we currently have."
- "I love the absolute styling of our board... it accepts custom CSS. We can create our own columns."
- "I would prefer Docker Compose... I would love to, in fact, move this board onto my home server... I can have multiple projects."
- "The board is not for me as a human. It's literally for the AI agents."
- "Don't break our current workflow... I want this new board working alongside it. So they should be in sync essentially."
- "I would love to be able to make just a flip of a switch... after I do like a whole migration... the migration to be extremely simple... do not over-engineer."

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Where recorded |
| --- | --- | --- | --- |
| D1 | Kanboard over Paperclip and over building a new custom board | The owner, 2026-10-18, voice order | Queue row 70 brief, this plan |
| D2 | Kanboard pinned at `kanboard/kanboard:v1.2.54` | The lead, 2026-10-18; latest release verified from the GitHub releases API the same day | LOG.md research section |
| D3 | SQLite storage with named Docker volumes; Postgres stays the documented upgrade path | The lead, 2026-10-18; the sync service is the only writer and the human only reads, the exact small-concurrency case the official docs allow | LOG.md research section |
| D4 | Application-token API auth: username `jsonrpc`, token from the `API_AUTHENTICATION_TOKEN` env var, no per-user tokens | The lead, 2026-10-18; verified in `app/Api/Middleware/AuthenticationMiddleware.php` in the Kanboard source | LOG.md research section |
| D5 | The MCP server is built here, zero npm dependencies, stdio transport, wrapped over Kanboard's JSON-RPC API | The lead, 2026-10-18, argued twice in LOG.md research section against adopting an existing server | LOG.md research section |
| D6 | The queue markdown stays the source of truth in the prototype; the sync is one-way markdown to Kanboard; agent-created tasks (non-numeric or absent reference) and all comments are agent-writable and never touched by the sync | The lead, 2026-10-18; this is what "side by side, in sync, do not break" means operationally | This plan, section 5 |
| D7 | Column set and order mirror the existing board exactly: Backlog, Planning, Ready, In progress, Blocked, Audit, Owner-led, Deferred, Upstream, Done | The lead, 2026-10-18 | This plan, section 5 |
| D8 | Port 8789 bound to 127.0.0.1 by default; `KANBOARD_BIND` and `KANBOARD_PORT` env vars rebind it for the home server; no address or secret is committed | The lead, 2026-10-18; repo rule "No gateway address, domain or key is ever written into this repository" | `kanboard/.env.example` |
| D9 | Unmapped status words keep the existing board's behavior (rendered, Deferred column) plus a visible `unmapped-status` tag; ghost references get a `dangling-need` tag instead of a silent link skip | The lead, 2026-10-18; the owner's complaint class made visible, not silently normalized | This plan, section 5 |
| D10 | Every commit takes exactly one patch bump in package.json and app.json, with build.gradle's versionName kept in step, subjects typed `chore(kanboard)` or `fix(kanboard)`, because the discipline gate reserves minors for feat subjects and this work ships no app capability; the board-infra precedent is `d0250b2a` (2.0.81, fix(board)) and `b4b51f86` (2.0.977) | The lead, 2026-10-18; `scripts/check-version-discipline.js` refuses feat-with-patch | LOG.md |
| D11 | Kanboard's dark theme is set for the admin user at provision and the Custom Stylesheet carries the exact existing palette on top | The lead, 2026-10-18; load order verified: the Custom Stylesheet renders after every core stylesheet | LOG.md research section |
| D12 | The lead session executes the steps itself; the `athan-executor` dispatch is waived because the research context in this session is load-bearing, and `athan-reviewer` stays blind on the full diff at audit | The lead, 2026-10-18 | This section |

### 2.2 The executor must not decide

- If a live Kanboard response contradicts the procedure shape documented in this plan (parameter names or result shapes differ), stop and report the exact request and response. Do not guess a workaround.
- If the Docker daemon is unavailable or the image cannot be pulled, land steps 1 and 2 (unit-tested logic) and report the live proof BLOCKED with the daemon error text. Do not fake evidence.
- If `yarn validate` fails for a reason the step cannot fix within its own files, stop and report. Never widen biome, jest, or tsconfig exclusions to make a check pass.

## 3. Pre-flight

`scripts/preflight-70.sh` in this folder. It checks: checkout on `uat`, clean tree, `origin/uat` merged in, version at least 2.0.1085, the anchor files each matching their source exactly once, and Docker CLI present (warn-only, because the live proof in step 4 needs it but steps 1 to 3 do not). Ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map, every file read or changed:

- `board/reader.mjs` (read, changed): the queue parser. `parseQueue` splits markdown table rows into open rows, done rows, and settled (CANCELLED, SUPERSEDED) orders. `mapStatus` maps a status cell to status, column, cursor, statusText. `parseNeeds` reads the needs cell. `closedStatus` decides a settled cell. `isMet` decides a met need (done or settled, or sitting on an unrendered row). `findPlanFolder`, `parsePlan`, `platformOf` read plan folders. The change adds `export` keywords to these pure functions so `kanboard/mapping.mjs` can import them; no line of logic moves or changes. Anchor: `scripts/anchors/reader-statusmap.txt`.
- `board/index.html` (read only): the current board's columns and palette, the visual contract the theme reproduces. Anchors: `scripts/anchors/board-columns.txt`, `scripts/anchors/board-palette.txt`.
- `board/docker-compose.yml` (read only): the existing board stack on port 8788, mounts the repo read-only. The Kanboard stack copies its shape. Anchor: `scripts/anchors/board-compose.txt`.
- `ai/plans/README.md` (read only, after the purge commit): the queue, the sync's input. Anchors: `scripts/anchors/queue-header.txt`, `scripts/anchors/queue-rows.txt`. The purge commit before this plan replaced sixteen gendered pronouns for the owner across its rows and `board/index.html`'s waiting line, per the repo rule; the regenerated `queue-rows.txt` anchor pins the corrected rows.
- `opencode.json` (changed): one new `kanboard` MCP entry under `mcp`, mirroring the existing local-server entries. Anchor: `scripts/anchors/opencode-mcp.txt`.
- `package.json` (changed): one new script `test:kanboard`. Anchor: `scripts/anchors/package-scripts.txt`.
- New files, all under `kanboard/`: `docker-compose.yml`, `.env.example`, `.gitignore`, `provision.mjs`, `sync.mjs`, `mapping.mjs`, `client.mjs`, `mcp-tools.mjs`, `mcp-server.mjs`, `theme.css`, `README.md`, `tests/mapping.test.mjs`, `tests/client.test.mjs`, `tests/mcp.test.mjs`, `tests/sync.test.mjs`.

How the pieces interact: the compose file runs two services. `app` is Kanboard v1.2.54 with SQLite in a named volume, the API token in its environment, and its port published to the host. `sync` runs `node sync.mjs` from a read-only mount of this repository, reading `ai/plans/README.md` through the same parser the 8788 board uses, and reconciling Kanboard over the container network through `client.mjs`. On the host, `opencode.json` starts `node kanboard/mcp-server.mjs` as an MCP server for every session in this harness; it speaks the same client to the same API. Provision runs once from the host to set the admin password, the dark theme, the stylesheet, the project, and the columns, then hands off to the sync.

The existing tests and what each proves: `board/tests/reader.test.mjs` pins the parser's behavior; the reader export change must leave it green byte-for-byte. The new `kanboard/tests/` suite pins the mapping golden, the reconcile idempotence, the MCP dispatch, and the wire format. `yarn validate` (tsc, Biome, Jest) gates the repo: jest only matches `**/__tests__/**/*.test.ts(x)` so the `.mjs` tests stay outside it, tsc only includes `**/*.ts`/`**/*.tsx` so the new files are invisible to it, Biome checks `kanboard/` because only `**/board` is excluded, so every new file must be format- and lint-clean.

Why the obvious fix is wrong: wiring agents straight to Kanboard's web UI is wrong because the interface for agents is the JSON-RPC API, and the MCP server is the workflow-shaped door to it. Adopting an existing MCP server is wrong per the research in LOG.md: the two complete ones are Go binaries with 137 to 150 tools and their own RBAC layer, the one serious Node candidate lacks search, links, tags, and comment reads, which are the core loop of a ticket workflow. Two-way sync is wrong for the prototype: two writers to one state with no conflict rule is how the current board's drift class is reborn; the markdown stays the single writer's truth until the owner rules the cutover.

## 5. Design

The system in one sentence: Kanboard is the shared board state, the queue markdown remains its seed, and one idempotent reconciler keeps the copy honest while agents read and write Kanboard freely outside the reconciled fields.

### Composition

```
opencode session (lead, lanes, executors, reviewers, grandchildren)
  └─ MCP stdio: node kanboard/mcp-server.mjs   (zero deps, lazy client)
        └─ HTTP JSON-RPC: POST /jsonrpc.php, Basic jsonrpc:<token>
              └─ kanboard app (kanboard/kanboard:v1.2.54, SQLite volume, port 8789)
                    ↑ container network
              kanboard sync (node:24-alpine, repo mounted ro, 15 s reconcile)
                    └─ kanboard/mapping.mjs → imports board/reader.mjs parsers
```

### The mapping (kanboard/mapping.mjs, pure)

Input: the queue markdown text plus the repository path (for plan folders). Output: a desired-state object with fixed key order:

- `columns`: the ten canonical names in board order (D7).
- `tasks`: one per rendered ticket. The mirrored set is a stated rule: every open row the reader renders, plus the done rows capped by `board/config.json`'s `doneColumnCount` read at mapping time (9999 today, so every done ticket; the code default of 5 is never read, the config is). CANCELLED and SUPERSEDED rows render nothing, same as the current board. Unparseable table rows are never skipped silently: the mapping counts queue table rows against parsed rows and reports the difference, and the sync surfaces it in its state file and stderr, per the SECOND GAP recorded in row 70.
  - `reference`: the ticket order number as a string. This is the upsert key; tasks without a numeric reference are agent territory the sync never touches.
  - `title`: `#<order> <name>`, newlines collapsed, trimmed at 120 characters.
  - `columnName`: the mapped column, with the current board's blocked-override reproduced exactly: a ticket that is not DONE and not OWNER-LED and has at least one unmet need lands in Blocked.
  - `colorId`: status to color slot: NOT PLANNED grey, PLANNING and NEEDS REPLAN blue, READY cyan, IN PROGRESS amber, EXECUTED orange, DONE dark_grey, BLOCKED and OWNER-BLOCKED red, UPSTREAM teal, OWNER-LED purple, DEFERRED and every unmapped word yellow.
  - `description`: a fixed-order header block (status line, needs line with met flags, waiting-on line, group, parent, platform, plan folder pointer) followed by the brief cell verbatim.
  - `tags`: the exact status phrase from the markdown cell, then `group:<group>` when a group exists, `platform:<iOS, Android, Both>` when a platform exists, `unmet-needs` when the blocked-override fired, `dangling-need` when an unmet need's order matches no mirrored ticket, `unmapped-status` when the status phrase matched no STATUS_MAP entry.
  - `links`: one `is blocked by` (link id 3) per unmet need whose target ticket is mirrored, plus one `is a child of` (link id 6) when a parent exists and is mirrored.
  - `subtasks`: one per plan step, title `Step <n>: <the plan checklist line's text>`, status done when ticked, in progress when the step number equals the cursor, todo otherwise.
- Determinism: no timestamps, no random ids, sorted iteration everywhere; the same markdown produces a byte-identical desired-state JSON. This is testable and tested.

### The reconcile (kanboard/sync.mjs)

One pass, in order: ensure project (by name) and columns (add missing canonical names, move each into board position, never remove a column a human added); read actual tasks through `getAllTasks` for open and closed states; index by reference; create missing tasks, update changed fields (title, description, color, tags), move tasks whose column or within-column position differs (desired position: order-sorted index inside the column, so the board reads in queue order), reopen mirrored tasks a human closed; delete mirrored tasks the queue no longer renders; converge links among mirrored tasks with managed labels (`blocks`, `is blocked by`, `is a child of`, `is a parent of`) by set difference, leaving every other link alone; converge subtasks on mirrored tasks by exact title, updating status, removing extras; write the state file to `/state/sync.json` (the sync service bind-mounts `./state:/state` read-write, its only writable path; host path `kanboard/state/sync.json`) carrying last run, counts, queue-rows-parsed versus queue-rows-seen, and errors. While `KANBOARD_SYNC_ENABLED` is `false` the service reads nothing, mutates nothing, and writes one `sync disabled: KANBOARD_SYNC_ENABLED=false` line to stderr per interval: that env var is the switch the owner asked for, carried into the service environment from `.env`, and the cutover documentation lives in `kanboard/README.md`. All logging in every new process goes through `process.stderr.write`, the `board/reader.mjs` pattern, which also keeps the stdio MCP server's stdout clean.

### The MCP server (kanboard/mcp-server.mjs, kanboard/mcp-tools.mjs, kanboard/client.mjs)

Stdio, newline-delimited JSON-RPC 2.0, no dependencies. Methods: `initialize` (echo the client's protocolVersion, default `2025-06-18`, capabilities tools, serverInfo `kanboard-board`), `notifications/initialized` (absorbed), `ping`, `tools/list`, `tools/call`. The client lazily constructs from env: `KANBOARD_URL` (default `http://127.0.0.1:8789`), `KANBOARD_API_TOKEN`, `KANBOARD_PROJECT` (default `rn.athan.uk`), falling back to `kanboard/.env` beside the server file. Tools, twenty: `board_get`, `ticket_get`, `ticket_create`, `ticket_update`, `ticket_move`, `ticket_open`, `ticket_close`, `ticket_delete`, `tickets_search`, `ticket_comment`, `ticket_comments`, `link_tickets`, `unlink_tickets`, `subtask_list`, `subtask_update`, `subtask_create`, `subtask_delete`, `project_list`, `project_create`, `sync_status`. A `ticket` argument resolves as a task id when numeric, as a queue order when `#N` or the plain number matches a task reference. `link` names are the seven label strings, mapped to ids 1 to 7 read from `getLinkByLabel` at call time, never hardcoded in the tool. Every tool returns text content; an API error returns `isError: true` with the Kanboard message. A `ticket_move` without a position computes the append position itself: Kanboard's `moveTaskPosition` refuses any position below 1 (source: `app/Model/TaskPositionModel.php`), so the tool reads the board once and passes the target column's task count plus one.

### The theme (kanboard/theme.css)

Seeded into the `application_stylesheet` setting at provision (D11). It sets Kanboard's documented CSS custom properties to the existing board's tokens (`--body-background-color: #151a22`, cards `#1f2430`, lines `#262d3a`, text `#e0e4ee`, muted `#8b92a6`, violet `#8b7cf7`), declares `color-scheme: dark`, restyles the board table, column headers, cards and tags, remaps the status color slots to the board's status palette (grey to `#7d8db0`, blue to `#62a0ff`, cyan to `#3fb9c8`, amber to `#f0b26b`, orange to `#e8965a`, red to `#f0718c`, teal to `#5ac8f0`, purple to `#8b7cf7`, yellow to `#dfa544`, dark grey to `#4cc38a` dimmed for done cards), gives meta text the mono stack, and carries the marker comment `/* athan board theme v1 */` so the provision proof can assert its presence in served HTML.

### Portability and the switch

`kanboard/README.md` documents the whole life: bring-up (`docker compose up -d`, `node provision.mjs`), agent wiring (the opencode entry plus the env), the move to the home server (copy the project directory, the two named volumes, and `.env`; `KANBOARD_BIND=0.0.0.0 docker compose up -d`), the backup (volume copy is the documented Kanboard migration), and the cutover: stop the sync with `KANBOARD_SYNC_ENABLED=false` and the markdown queue retires at the owner's word in a later ticket. Multiple projects: Kanboard carries them natively; `project_create` exists in the toolset; the sync owns exactly one project by name.

### The concurrency trace

Two writers exist: the sync service and the agents. They never fight over the same rows, because the sync only ever touches tasks with numeric references and only the fields the mapping owns, while the agents' writes land on comments, agent-created tasks, and any mirrored field they choose to change knowing the next reconcile pass will restore the queue's truth. SQLite serializes the writers; a pass that collides with an agent write retries on the next 15-second tick with no partial state, because every operation is a single API call and the pass recomputes from scratch each time.

### The design review

Rejected: storing tickets in Postgres behind a bespoke API (rebuilds the broken custom board with a database badge), driving Kanboard's database directly (couples to schema, loses the API's integrity rules), an HTTP MCP transport (the shared network thing is Kanboard's API, not the MCP server; stdio servers run wherever the agent runs), two-way sync (two writers, no conflict rule), a full Kanboard plugin for the theme (the Custom Stylesheet setting is first-party, database-persisted, and upgrade-safe). Kept deliberately small: one project, one swimlane, no automatic actions configured, no user management beyond the admin.

**Acceptance criteria:**

- [R1.1] WHEN `docker compose -f kanboard/docker-compose.yml up -d` runs on a host with a working Docker daemon THE SYSTEM SHALL report the app container healthy within 120 seconds, where healthy means `curl -f http://127.0.0.1:${KANBOARD_PORT:-8789}/healthcheck.php` exits 0.
- [R2.1] WHEN `node kanboard/provision.mjs` runs against a healthy stack with no `kanboard/.env` THE SYSTEM SHALL generate the token and admin password into `.env`, recreate the app container through `docker compose up -d` so the container carries the token, set the admin password and dark theme, seed the stylesheet, create the project and the ten canonical columns in board order, and import every rendered queue ticket, where the ticket count equals a fresh `node board/reader.mjs` run's count on the same tree, never the stale `board/state/board.json`.
- [R2.2] WHEN `node kanboard/provision.mjs` runs a second time with no queue change THE SYSTEM SHALL issue no create, update, move, link or subtask call.
- [R3.1] WHEN one reconcile pass runs after the queue markdown changes THE SYSTEM SHALL converge every mirrored task's title, description, color, tags, column, within-column position, managed links and subtasks to the mapping output.
- [R3.2] WHEN a reconcile pass runs with no queue change THE SYSTEM SHALL issue zero mutating API calls.
- [R3.3] WHEN a Kanboard task carries a numeric reference the queue no longer renders THE SYSTEM SHALL remove it; WHEN a task carries no numeric reference THE SYSTEM SHALL leave it and its links and subtasks untouched.
- [R3.4] WHEN an unmet need's order matches no mirrored ticket THE SYSTEM SHALL create no link for it and the task SHALL carry the `dangling-need` tag.
- [R4.1] WHEN an agent calls any MCP tool while the stack is up THE SYSTEM SHALL return the Kanboard result as tool text content; WHEN the API returns an error THE SYSTEM SHALL return `isError: true` with the message.
- [R4.2] WHEN the MCP server starts THE SYSTEM SHALL answer `initialize`, `ping`, `tools/list` and `tools/call` per the MCP JSON-RPC shape using only the Node standard library.
- [R5.1] WHEN the board page HTML is fetched after provisioning THE SYSTEM SHALL contain the marker comment `/* athan board theme v1 */` in the served page.
- [R6.1] WHEN `board/tests/reader.test.mjs` runs after the export change THE SYSTEM SHALL pass unchanged, and `node board/reader.mjs` output for the same tree SHALL differ from `9056833e` only in `generatedAt`, `activeNow` and the context `ageMs` fields.
- [R7.1] WHEN the compose project directory, both named volumes (`<project>_kanboard-data` and `<project>_kanboard-plugins`) and `.env` are copied to another Docker host and `docker compose up -d` runs THE SYSTEM SHALL serve the same projects and tasks; this is proven on this machine by copying each volume with `docker run --rm -v <project>_kanboard-data:/from -v <second>_kanboard-data:/to alpine sh -c 'cd /from && tar cf - . | (cd /to && tar xf -)'` (the same pipe for the plugins volume), then `docker compose -p <second> up -d` with the same `.env`, and reading the same task count and project name through the API.
- [R8.1] WHEN `yarn validate` runs at the repository root THE SYSTEM SHALL pass with every new file included in Biome's scope and none of them in tsc's or Jest's.
- [R9.1] WHILE the sync service environment carries `KANBOARD_SYNC_ENABLED=false` THE SYSTEM SHALL make zero queue reads and zero API calls per interval and log one disabled line.

## 6. Steps

- [ ] Step 1: the mapping layer and the reader exports
- [ ] Step 2: the JSON-RPC client and the MCP server
- [ ] Step 3: the sync, the stack, the provision, the theme
- [ ] Step 4: the wiring and the live proof

### Step 1: the mapping layer and the reader exports

Requirements: R3.1, R3.4, R6.1
Weight: 2
Anchor check: `reader-statusmap.txt` matches `board/reader.mjs` exactly once at the planned sha.
Goal: the pure functions that turn queue markdown into the desired Kanboard state, with the parser exports the mapping imports, and the golden test that pins the mapping.
Branch: `board/kanboard-mapping` off `uat`.
Files: `board/reader.mjs` (export keywords only, on `parseQueue`, `mapStatus`, `parseNeeds`, `closedStatus`, `isMet`, `findPlanFolder`, `parsePlan`, `platformOf`), `kanboard/mapping.mjs`, `kanboard/tests/mapping.test.mjs`, `scripts/check-changed-coverage.js` (one UNMEASURED entry appended: `{ path: 'kanboard/', reason: 'local-only agent board (MCP server and queue mirror), never imported by the app; proven by node --test and the live proof, the board/ precedent' }`, matching the `board/` entry's ruling).
Red tests: `node --test kanboard/tests/` fails: mapping module not found. Record the failing line.
Change contracts: reader.mjs diff touches only `export` additions on existing declarations. mapping.mjs exports `desiredState(markdown, repoRoot)` returning the object from section 5 plus `STATUS_TO_COLUMN` and `STATUS_TO_COLOR` tables, and reads `board/config.json`'s `doneColumnCount` itself. The golden test builds a fixture queue with every status word, an unmet need, a met need, a ghost need, a parent, a group, a plan folder with three steps (one ticked, one the cursor), a done-row set larger than a `doneColumnCount` fixture of 2 to pin the cap rule, and asserts the exact desired-state JSON.
Green run: `node --test kanboard/tests/` green, `node --test board/tests/` green, plus the reader regression from R6.1 (run the reader on this tree before and after, diff only the three volatile fields).
Break script: rename one canonical column in `mapping.mjs`, watch the golden test fail with the diff, revert.
Version and commit: next patch after `uat`, message `<VERSION> - chore(kanboard): the queue-to-kanboard mapping, pure and golden-tested (70)`.
Review: self-review the diff against section 5's mapping table line by line.
Done when: tests green, reader regression byte-check passes, commit merged to `uat`.

### Step 2: the JSON-RPC client and the MCP server

Requirements: R4.1, R4.2
Weight: 2
Anchor check: none (new files).
Goal: the wire client and the stdio MCP server with its twenty tools, unit-tested against a fake client and a real localhost HTTP stub.
Branch: `board/kanboard-mcp` off `uat` after step 1 merges.
Files: `kanboard/client.mjs`, `kanboard/mcp-tools.mjs`, `kanboard/mcp-server.mjs`, `kanboard/tests/client.test.mjs`, `kanboard/tests/mcp.test.mjs`.
Red tests: both new test files fail on missing modules. Record the failing lines.
Change contracts: client.mjs exports `createClient({ baseUrl, token, username, fetchImpl })` with a `call(method, params)` that posts JSON-RPC 2.0 with Basic auth, a 15-second abort timeout, a monotonically increasing request id, and error unwrapping that throws `Error` carrying the Kanboard error message. mcp-tools.mjs exports `TOOLS` (name, description, inputSchema, handler) and `resolveTicket`. mcp-server.mjs reads stdin lines, writes single-line responses, never logs to stdout, and exits clean on stdin end. The client test runs a real `node:http` server and asserts the Authorization header, the JSON-RPC envelope and the error path. The MCP test drives the dispatcher with recorded requests against a fake client and asserts every tool's happy path, the `#N` reference resolution, the link label-to-id lookup, and the error-to-isError path.
Green run: `node --test kanboard/tests/` green.
Break script: flip the Basic auth username in client.mjs, watch the client test fail on the header assertion, revert.
Version and commit: `<VERSION> - chore(kanboard): the JSON-RPC client and the stdio MCP server, zero dependencies (70)`.
Review: self-review the tool schemas against the Kanboard procedure parameters in LOG.md's research table.
Done when: tests green, a manual echo pipe through the server returns a tools list, commit merged.

### Step 3: the sync, the stack, the provision, the theme

Requirements: R1.1, R2.1, R2.2, R3.1, R3.2, R3.3, R3.4, R5.1, R9.1
Weight: 2
Anchor check: `board-compose.txt` matches `board/docker-compose.yml` once (the shape being copied, not changed).
Goal: the reconciler, the compose stack, the provision script and the theme, with idempotence proven in unit tests.
Branch: `board/kanboard-stack` off `uat` after step 2 merges.
Files: `kanboard/sync.mjs`, `kanboard/provision.mjs`, `kanboard/docker-compose.yml`, `kanboard/.env.example`, `kanboard/.gitignore`, `kanboard/theme.css`, `kanboard/tests/sync.test.mjs`, `package.json` (script `"test:kanboard": "node --test kanboard/tests/"`).
Red tests: the sync test fails on missing module. Record the failing line.
Change contracts: sync.mjs runs one pass with `--once` and a loop with `--interval-ms` (default 15000); a pass that throws logs to stderr and continues; the state file carries fixed key order at `/state/sync.json`. The sync test uses a fake client recording every mutating call: converge from empty, assert the call log; run the pass again over the converged fake state, assert zero mutating calls (R3.2); delete a queue ticket, assert the orphan removal and that an agent task survives (R3.3); assert the ghost-need tag (R3.4); assert the disabled flag makes zero calls (R9.1). The compose file pins the image, sets `API_AUTHENTICATION_TOKEN` from `.env` interpolation on the app service, `LOG_DRIVER=stderr`, `DEBUG=false`, publishes `${KANBOARD_BIND:-127.0.0.1}:${KANBOARD_PORT:-8789}:80`, mounts the repo read-only plus `./state:/state` read-write into the sync service, sets the sync service's `KANBOARD_URL=http://app:80`, `KANBOARD_API_TOKEN` and `KANBOARD_SYNC_ENABLED=${KANBOARD_SYNC_ENABLED:-true}` from `.env`, and defines the named volumes `kanboard-data` (/var/www/app/data) and `kanboard-plugins` (/var/www/app/plugins). `kanboard/.gitignore` carries exactly two lines, `.env` and `state/`, so no root `.gitignore` edit is needed (the bare `.env` pattern there matches at any depth only by luck, the local file makes it deliberate). provision.mjs: generates `.env` with `crypto.randomBytes` values when absent, runs `docker compose up -d` to (re)create the app container with the token in its environment before the first API call, waits for health with 2-second polls up to 120 seconds, applies password, theme and stylesheet through one `docker compose exec -T app php -r` call per concern, each snippet bootstrapping the app with `require '/var/www/app/app/common.php';` then using `$container['configModel']->save()` for the stylesheet and `$container['userModel']->update()` for password and theme, values passed base64-encoded through `-e` flags and decoded inside, then runs the sync once and prints the board URL and the credential file path.
Green run: `node --test kanboard/tests/` green; `yarn validate` green.
Break script: drop the position convergence from the reconcile, watch the idempotence test fail on the second-pass move call, revert.
Version and commit: `<VERSION> - chore(kanboard): the idempotent queue-to-kanboard sync, the compose stack, provision and the dark theme (70)`.
Review: self-review the reconcile order against section 5 and the compose against the official shape in LOG.md.
Done when: tests green, `yarn validate` green, commit merged.

### Step 4: the wiring and the live proof

Requirements: R1.1, R2.1, R2.2, R4.1, R5.1, R7.1, R8.1
Weight: 2
Anchor check: `opencode-mcp.txt` matches `opencode.json` once; `package-scripts.txt` matches `package.json` once.
Goal: the MCP entry wired into the harness, the READMEs, and the whole thing proven alive on this machine.
Branch: `board/kanboard-live` off `uat` after step 3 merges.
Files: `opencode.json`, `kanboard/README.md`, `README.md` (one paragraph under the existing `## Ticket board` heading).
Change contracts: the opencode entry is `{"type": "local", "command": ["node", "kanboard/mcp-server.mjs"], "enabled": true}`; the README documents bring-up, wiring, the switch (flipping `KANBOARD_SYNC_ENABLED` in `.env` then `docker compose up -d` to recreate the sync container), backup, the home-server move, multiple projects, the card-render honesty rule from row 70's FIFTH GAP (a Kanboard card shows exactly the fields that exist: steps appear as subtasks only where a plan folder exists, the platform tag only where the steps' file list names it), and the planning-column gap (an agent may move a ticket to Planning through MCP the moment planning starts; the markdown flow writes no mid-plan status, row 70's first gap).
Live proof, recorded command by command in LOG.md: `docker compose up -d`, healthcheck timing (R1.1); `node kanboard/provision.mjs`, the import counts against a fresh `node board/reader.mjs` run's count (R2.1); provision rerun, zero mutations in its log (R2.2); an MCP session over stdio: initialize, tools/list, board_get, ticket_create into Backlog, ticket_move to Ready, ticket_delete (R4.1); the served board HTML containing the theme marker (R5.1); the volume tar-pipe copies from R7.1 into a second compose project, task count equal through the API (R7.1); `yarn validate` (R8.1); the sync double-run determinism: capture the task list JSON after pass one and after pass two, byte-compare (R3.2 on the live instance).
Version and commit: `<VERSION> - chore(kanboard): the harness wiring, the docs, and the live proof recorded (70)`.
Review: self-review, then the reviewer worker audits blind.
Done when: every proof line is in LOG.md with its command output, `yarn validate` green, commit merged.

## 7. Device proof

None. No app code, no device build, no alarm surface. The live proof in step 4 replaces it, and its evidence lives in LOG.md.

## 8. Records

The findings text written into `LOG.md` under `## Planning (2026-10-18)`: the research summary with the three workers' key facts, the decisions D1 to D12 with their one-line whys, and the Kanboard API parameter table the executor codes against. Each step appends `### Step <NN> - <state>` entries ending with `session: <ses_id>`. The DONE cell also answers row 70's recorded plan-flow question with this run's evidence: the grill pass caught twenty findings, seven of them commit-refusing, on a plan that had already passed the structural gate, so the grill is the blind review for plans and a second plan-review pass would repeat its catch at double the cost; no workflow change follows. The queue cell the lead applies on DONE: `DONE 2026-10-18, audited: the Kanboard prototype runs the whole workflow side by side with the markdown board - self-hosted v1.2.54 through compose, the queue mirrored by an idempotent sync whose column population is a stated rule, twenty MCP tools for every agent, the dark theme seeded through the first-party stylesheet setting, the home-server move and the one-switch cutover documented in kanboard/README.md, unparseable queue rows surfaced never skipped, and the plan-flow question answered from this run's grill evidence: the grill is the blind review, no second plan gate`. The docs commit message: `<VERSION> - docs: ticket 70 DONE, the plan folder dies in this merge`.

## 9. Push

None. The executor never pushes. The lead pushes `uat` after the reviewer passes.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `healthcheck.php` never returns 200 | Image pull slow, or volume permissions | `docker compose logs app`; if pull, wait within the 120-second budget; if permissions, `docker compose down` and remove the data volume to retry fresh (the prototype has no data to lose before first provision) |
| `401` on the first API call | Token mismatch between `.env` and the running container | `docker compose up -d` again after `.env` changes; the token is read from env at request time |
| `getProjectByName` returns nothing after creation | Wrong project name between sync and provision | Both read `KANBOARD_PROJECT` with the same default; assert the state file's project id matches |
| Link creation returns false | The opposite task is missing | That is the dangling-need path: the mapping already excludes it; if it happens in a test, the fixture's need target is not mirrored |
| MCP server exits immediately under opencode | stdin closed or node path | Run `echo '{}' | node kanboard/mcp-server.mjs` locally; check the opencode log; the server must never throw on unparseable input |
| Biome fails on generated JSON in tests | Fixture files inside `kanboard/tests/` | Keep fixtures as template literals in the test files, not as separate JSON files |
| Second sync pass mutates | A field comparison reads a number as a string | Kanboard returns ids and positions as strings; every comparison normalizes through `String()` or `Number()` explicitly |
| The sync cannot write its state file | The `./state` bind mount is missing or owned root | `mkdir -p kanboard/state` on the host before `up -d`; the file itself is disposable, only `sync_status` reads it |

## 11. Subagents

Planning: three `general` research workers (deployment, MCP landscape, customization) already ran; `athan-plan-griller` grilled the draft and its twenty findings are folded in. Delivery: per D12 the lead session executes the steps itself because the research context is load-bearing, and dispatches `athan-reviewer` blind on the full diff at audit; `vision` reads the themed-board screenshot if the lead cannot. Nothing else, ever.

## 12. Report to the owner

Plain sentences on what changed and what was proven: the prototype stack, the mirror, the MCP surface, the theme, the switch, the home-server move. The progress table. The agent-ruled decisions table (D2 to D11 argued twice in LOG.md). The four-line handoff: phases completed, tickets moved, what runs next, what the owner types next.
