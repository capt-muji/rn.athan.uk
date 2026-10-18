# LOG - ticket 70, the Kanboard prototype

## Planning (2026-10-18)

The owner's voice order amends row 70 from research-only to research plus a working
prototype on Kanboard, self-hosted, agent-driven, styled like the current board, side
by side with it, with a one-switch cutover. The owner is hands-off for the whole run.

### Research record

Three parallel research workers plus direct source reads (opensrc cache of
kanboard/kanboard at main, v1.2.54 tag verified 2026-08-29 via the GitHub releases
API) plus the docs index (docs.kanboard.org scraped at version 1.2.54 and confirmed
with content queries for moveTaskPosition and API_AUTHENTICATION_TOKEN).

Deployment facts (worker one, all source-linked in its report):

- Official image `kanboard/kanboard:v1.2.54`: Alpine 3.24, nginx, PHP 8.4 FPM, s6,
  built-in healthcheck at /healthcheck.php, ports 80 and 443, about 33 MB compressed.
- Volumes: /var/www/app/data (SQLite db.sqlite lives there), /var/www/app/plugins,
  /etc/nginx/ssl. A data-volume copy is the documented backup, restore and
  machine-migration story.
- Every config constant is an env var; API_AUTHENTICATION_TOKEN overrides the stored
  app token (source: app/Api/Middleware/AuthenticationMiddleware.php reads
  getenv directly). The admin password has no env provisioning; the CLI reset is
  TTY-interactive (source: app/Console/ResetPasswordCommand.php), so provision uses
  one `docker compose exec -T app php -r` call through the app container instead.
- The image ships its own config.php enabling URL rewrite; nginx passes the request
  host through, so LAN access by IP works with no base-URL setting.
- Built-in cron runs the daily background job; mail transports are unusable without
  SMTP; upload cap 32 MB; PHP timezone hardcoded UTC.
- The requirements page cautions SQLite under Docker, the official compose examples
  default to it anyway; the sync is a single writer on a 15-second cadence, the
  documented small-concurrency case. Postgres stays the documented upgrade path.

MCP landscape (worker two): nine candidates audited. The two complete ones
(bivex/kanboard-mcp, its fork glani/kanboard-heretic-mcp) are Go, stdio-centric,
ship no packages, and carry 137 to 150 tools plus their own RBAC layer. The one
serious Node candidate (@ernestocorona/kanboard-mcp) lacks search, task links, tags
and comment reads, the four hardest-working groups of a ticket workflow. The
kanboard.io hosted MCP cannot reach a self-hosted instance. No generic kanban MCP
supports Kanboard's API. Build recommendation taken twice: the API is one frozen
JSON-RPC endpoint with a uniform envelope, so a purpose-built zero-dependency
wrapper with a workflow-shaped tool list beats maintaining a fork or paying the
context tax of 150 tools every session.

Customization (worker three): the first-party Custom Stylesheet setting
(application_stylesheet) is the clean CSS path: database-persisted, rendered after
every core stylesheet, no plugin, no upgrade coupling. Kanboard ships a per-user
dark theme since 1.2.29 (users.theme column, no API parameter, set at provision
through the same php -r path). Cards carry color slots through inline CSS on
.task-board.color-X selectors that the custom stylesheet overrides by loading later.
updateTask takes no column_id: column changes go through moveTaskPosition only.
The 17-color palette includes the slots this plan maps (grey, blue, cyan, amber,
orange, red, teal, purple, yellow, dark_grey, deep_orange).

### Kanboard API table the executor codes against

Verified in source (app/Api/Procedure/*.php) and the scraped docs; ids and positions
come back as strings.

| Purpose | Procedure | Parameters |
| --- | --- | --- |
| Auth | HTTP Basic on POST /jsonrpc.php | username `jsonrpc`, password the app token |
| Project | getProjectByName | name |
| Project | createProject | name, description, identifier |
| Columns | getColumns | project_id |
| Columns | addColumn | project_id, title, task_limit, description |
| Columns | changeColumnPosition | project_id, column_id, position |
| Tasks | getAllTasks | project_id, status_id (1 open, 2 closed) |
| Tasks | getTaskByReference | project_id, reference |
| Tasks | createTask | title, project_id, color_id, column_id, description, priority, reference, tags |
| Tasks | updateTask | id, title, color_id, description, priority, reference, tags |
| Tasks | moveTaskPosition | project_id, task_id, column_id, position, swimlane_id |
| Tasks | openTask / closeTask / removeTask | task_id |
| Tasks | searchTasks | project_id, query |
| Links | getAllTaskLinks | task_id |
| Links | createTaskLink | task_id, opposite_task_id, link_id |
| Links | removeTaskLink | task_id, task_link_id |
| Links | getLinkByLabel | label (ids: relates to 1, blocks 2, is blocked by 3, duplicates 4, is duplicated by 5, is a child of 6, is a parent of 7) |
| Subtasks | getAllSubtasks | task_id |
| Subtasks | createSubtask | task_id, title, status |
| Subtasks | updateSubtask | id, title, status |
| Subtasks | removeSubtask | subtask_id |
| Comments | createComment / getAllComments | task_id, content / task_id |
| App | getVersion | none |

### Decisions argued twice

- D5 build-versus-adopt the MCP server: argued in the worker-two report and again
  here against the repo's own precedent (board/server.mjs is a dependency-free
  stdlib service). Both point the same way.
- D3 SQLite versus Postgres: Postgres wins on the requirements page's caution;
  SQLite wins on the documented default compose shape, the single-writer load, the
  volume-copy portability the owner's home-server move needs, and the
  do-not-over-engineer order. Postgres remains a compose file swap later.
- D6 one-way sync: two-way was rejected because two writers with no conflict rule
  recreates the drift class the owner is escaping; the markdown stays the single
  truth until the owner rules the cutover ticket.

### Step ledger

#### Step 1 - DONE 2026-10-18

Red first: `node --test "kanboard/tests/*.test.mjs"` failed with
`ERR_MODULE_NOT_FOUND: Cannot find module '.../kanboard/mapping.mjs'`.

Green: `node --test "kanboard/tests/*.test.mjs"` 2 pass, 0 fail;
`node --test "board/tests/*.test.mjs"` 10 pass, 0 fail.

Regression R6.1: the old reader (from `uat`) and the new reader run against the same
tree each wrote 127 tickets; with `generatedAt`, `activeNow` and every context
`ageMs` zeroed the two board.json files are byte-identical.

Break script: renaming the Blocked column in `mapping.mjs` failed the golden test
(two assertion failures counted), revert restored 2 pass.

Found and fixed on the way: commit `659a7627` left an unescaped apostrophe inside a
single-quoted fixture line in `board/tests/reader.test.mjs`, a syntax error that had
silently broken the board's own suite since 2026-10-13, because no gate runs
`node --test board/tests/`. The line is escaped now and the suite runs green again.
Reported to the owner in the run's final reply.

#### Step 2 - DONE 2026-10-18

Red first: `node --test "kanboard/tests/*.test.mjs"` failed with
`ERR_MODULE_NOT_FOUND: Cannot find module '.../kanboard/client.mjs'` (the client test
was written before the module, as the plan orders).

Green: 17 pass, 0 fail across mapping, client and MCP suites. A manual pipe
`echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node kanboard/mcp-server.mjs`
returns the twenty tools; `{"bad json"` answers a -32700 parse error on one line.

Plan repair (agent-ruled): the plan claimed `moveTaskPosition` with position 0 appends;
Kanboard's `TaskPositionModel::movePosition` refuses positions below 1 (verified in
source). `ticket_move` without a position now reads the board and appends at
column-count-plus-one; the plan line is corrected.

Break script: flipping the Basic-auth username in client.mjs failed the wire test's
header assertion; revert restored 2 pass.

session: ses_eaf625a99ffecJEKX3gHmF8r8O
