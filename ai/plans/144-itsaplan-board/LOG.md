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
