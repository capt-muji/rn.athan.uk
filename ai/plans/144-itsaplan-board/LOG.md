# Ticket 144 log: the It's a Plan board

## Planning (2026-10-19)

Brief: `ai/prompts/itsaplan-board.md`. Planned at `5b1c965d`, version 2.0.1092. The owner's
brief carries the whole scope: two steps, spin the product up on its own compose path and copy
the queue's emitted tickets onto one project through the REST API, then stop for the verdict.

### Research gate, answered from the product's own source

Read against the v1.5.0 checkout (`6e0dc0b`, 2026-10-13). Every answer is yes.

1. **Runs locally through its own Docker path, viewable at `http://localhost:3001`.** The
   compose file publishes `api` on 3000 and `web` on 3001 and keeps RustFS internal.
   `docs/self-hosting.md` states that `http://localhost` is the one plain-HTTP exception for the
   `Secure` session cookie, in Chrome and Firefox, and that WebKit refuses it. Verified live:
   both containers report healthy and the board renders in Chromium.
2. **Genuinely free and self-hostable with no cloud dependency.** `LICENSE` is the full AGPL v3
   text. No license key, licence server or paid tier appears anywhere in the tree. Every service
   in the compose file runs locally, and the images are public GHCR tags.
3. **The default stack shows the board with agents, MCP, webhooks and the Telegram bot inert.**
   The bot starts and re-reads its config from the database. With no token it logs its start line
   and idles. The worker logs its start line and finds no webhook delivery and no agent run to
   claim. The project starts with no webhook (`GET /projects/athan-uk.QUEUE/webhooks` answers
   `[]`) and no agent attached. MCP is a team switch, off until an operator turns it on.
4. **Tickets arrive through the product's own API with no committed tooling.** `POST /teams`,
   `POST /projects`, `POST /projects/:projectKey/issues` and `POST /issues/:issueId/links`. The
   brief forbids committed tooling, so the copy is a throwaway script in `$TMPDIR` authenticated
   with the session cookie from first registration.
5. **First open.** `http://localhost:3001/register` shows the first-run sign-up form. The first
   account registered becomes the instance admin (`role: "god"`), owns the instance workspace,
   and the session lands on the project board at `/athan-uk/QUEUE`.

### Decisions taken (agent-ruled)

- **Release pin `VERSION=1.5.0`**: the brief names v1.5.0 as the verified release, and pinning
  keeps the run on a version whose docs were read.
- **Checkout and env outside the repository tree**: `$HOME/athan-gitree/sessions/144/itsaplan`
  and `$HOME/athan-gitree/sessions/144/.env`. The repository is public and the identifier gate
  forbids a committed secret.
- **Postgres password from `openssl rand -hex 32`**: a base64 value can contain `/`, which
  breaks the `postgres://user:pass@host` interpolation the compose file builds. Hex is the same
  strength and URL-safe. The other secrets stay on the documented `openssl rand -base64 32`.
- **Status mapping onto the product's default columns**: the project's own five columns are
  Backlog, Todo, In Progress, Done and Canceled. Done maps to Done, In progress to In Progress,
  and Ready, Planning and Audit to Todo. Backlog, Deferred, Blocked, Upstream and Owner-led map
  to Backlog. Canceled stays unused. The emitted run holds 107 Done and 21 open, so the board
  reads Backlog 21, Todo 0, In Progress 0, Done 107, Canceled 0.
- **Local cookie flag, added after the first sign-in attempt failed in the owner's browser**:
  a `docker-compose.override.yml` in the checkout, outside the repository tree, sets
  `NODE_ENV=development` on the api service only. The product's auth reads
  `secure: hostPrefixedCookies || NODE_ENV === "production"`, so this is the one lever that
  stops the session cookie carrying `Secure` over plain HTTP. Every browser then keeps the
  session on localhost, not only Chrome and Firefox. The web and worker containers are
  untouched.
- **Needs as `blocked_by` relations**: each `needs` entry that names an emitted ticket becomes
  one relation between the two issues. Of 69 needs entries, 53 resolve: 14 name a row that is
  cancelled or superseded and is not emitted, one is a self-reference (row 59 names itself), and
  one pair appears twice.

### Pre-flight

`scripts/preflight-144.sh` copied to `$TMPDIR` and run from the repository root printed
`PREFLIGHT OK`.

## Phase 2, after the owner's approval (2026-10-19)

The owner read the board, approved the prototype, and asked for the queue's workflow to be
injected into it: the queue's own columns, its agents, its skills and its docs, with the styling
untouched and the repository queue still the source of truth. The branch was pushed and not
merged to `uat`.

### Step 03 — done

**Columns.** The product's five defaults became the queue's own ten, in the reader's own words:
Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit, Owner-led, Upstream, Done.
`In progress` carries a soft WIP limit of three, which is the standing parallel order turned
into the board's own control. The product orders columns by state category and then by position,
so the rendered order is Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit,
Owner-led, Upstream, Done. The reader's order could not be reproduced exactly because the
product groups by state category, and Deferred is a backlog state while Upstream is a started
one.

**Tickets.** All 128 moved to the column their queue row names: Done 107, Deferred 11,
Backlog 6, Owner-led 2, Blocked 1, Upstream 1, and Planning, Ready, In progress and Audit empty.
That is the reader's own distribution.

**Workflow data.** `Queue order` is a number field carrying each ticket's number in the queue,
so any view can sort the way the queue does.

**Agents.** The seven workflow roles are on the project as external agents: lane-lead, planner,
executor, plan-griller, reviewer, explorer and vision. Each carries its one-line mandate. The
AI Agents page lists them with "No runner yet".

**Skills.** `athan-lead` and `athan-planner` are in the team library, read from the repository's
own skill files.

**Docs.** Five pages: The queue, The agents, Working the board, The board itself, and Running
the agents from the board.

**MCP.** `itsaplan` is a remote server in `opencode.json` at the API origin's `/mcp`, with
`oauth` off and the key read from `{env:ITSAPLAN_API_KEY}`. The personal key was created on the
owner account and written to the shell environment and to
`$HOME/athan-gitree/sessions/144/mcp-key.txt`, never into the repository. An `initialize` with
the key answers 200 and `tools/list` returns the board's tools. Without a key the endpoint
answers 401.

### Decisions taken (agent-ruled, phase 2)

- **The runner is not installed.** `@itsaplan/runner` would claim runs for the agents on this
  board and start a coding agent CLI on every one. That spends model tokens on each run, so it
  is written up as a Docs page and left for the owner's order. The agents exist and are inert.
- **Column state categories keep their real meanings.** Deferred stays a backlog state and
  Upstream a started state, so the board's analytics stay honest. The cost is that the rendered
  order is the product's grouping rather than the reader's exact order.
- **No styling touched.** No theme, no stylesheet, no colour scheme. The only colours set are
  the new columns' state colours, which the product requires.
- **The repository queue stays the source of truth.** The board mirrors it. No sync service and
  no importer is committed, so nothing writes back to the repository from the board.

### Verified after phase 2

The board renders the ten columns with the reader's distribution. `In progress` shows `0 / 3`.
The AI Agents page lists seven roles. The Skills library lists two. Docs lists five pages. The
MCP endpoint takes the personal key and refuses a keyless call.

The three throwaway scripts live in `$TMPDIR` and die with the session.

## Ticket 144

### Step 01 — done

Stack brought up. `docker compose pull` then `docker compose up -d` from the v1.5.0 checkout
with `--env-file $HOME/athan-gitree/sessions/144/.env`. `docker compose ps` reads:

```
itsaplan-api-1       Up (healthy)   0.0.0.0:3000->3000/tcp
itsaplan-bot-1       Up
itsaplan-minio-1     Up (healthy)   9000-9001/tcp (internal)
itsaplan-postgres-1  Up (healthy)   5432/tcp (internal)
itsaplan-web-1       Up (healthy)   0.0.0.0:3001->3001/tcp
itsaplan-worker-1    Up
```

`curl http://localhost:3000/` answers 200 and `curl http://localhost:3001/login` answers 200.
`curl http://localhost:3000/auth-config` answers
`{"registration":"open","magicLink":false,"requireEmailVerification":false,"emailEnabled":false,"emailPassword":true,"google":false,"oidc":false,"oidcLabel":"","hasUsers":false}`.
R1.1 and R1.2 hold. R4.1 holds: every gate answer is yes.

### Step 02 — done

`node board/reader.mjs` wrote 128 tickets into `board/state/board.json` (107 done rows, all of
them emitted because `board/config.json` sets `doneColumnCount` to 9999).

The admin account was registered through the product's own sign-up endpoint at
`http://localhost:3001/register` and the API reported `role: "god"`. `POST /teams` made
`Athan.uk` (slug `athan-uk`), `POST /projects` made `QUEUE`, and the throwaway script posted 128
issues. The API then read 128 issues, 107 on `columnId` 4 (Done) and 21 on `columnId` 1
(Backlog). The second pass created the `blocked_by` relations. `psql -tAc "select count(*) from
issue_link"` answers 53, matching the resolvable needs.

The board renders at `http://localhost:3001/athan-uk.QUEUE` with the five columns and the ticket
cards, each title carrying its `#<order>` prefix. An issue page shows the description carrying
the queue status and the relations panel carrying the `blocked_by` pairs. R2.1, R2.2, R2.3,
R3.1 and R5.1 hold.

R2.4 holds: `docker compose logs worker` reads one line, `[worker] worker starting`, and
`docker compose logs bot` reads one line, `[bot] bot service starting`. `GET
/projects/athan-uk.QUEUE/webhooks` answers `[]`.

session: ses_eaea5deecffeZq7TThCzVL0d8R

### Handover (2026-10-19)

Stack left running, and the board is open in the owner's browser. Board at the documented web
port on path `/athan-uk.QUEUE`, sign-up at `/register`. The first sign-in attempt failed in the
owner's browser, so the api was restarted with the cookie override above and the password was
changed through `/api/auth/change-password` to a typeable value. Both were verified by a fresh
browser sign-in that landed on the board. Credentials are in
`$HOME/athan-gitree/sessions/144/credentials.txt`, outside the repository tree. Nothing merges
to `uat` until the owner rules. The throwaway import script lived in `$TMPDIR` and is deleted.

Row 144 was set OWNER-LED after the copy, so the reader was re-run and the single issue this
ticket tracks (`QUEUE-21`) had its description refreshed to the new row. The other 127 issues
stay the snapshot they were posted as. The needs cell for row 144 carries no digits, so the
reader's number scan finds no dependency there.

`yarn validate` passes on the branch: tsc clean, Biome clean, Jest 5785 tests in 223 suites,
coverage 100 percent. Only `package.json` and `app.json` are version files in git. `android/`
is ignored, and its `versionName` was moved with the pair.
