# The It's a Plan board: full handoff brief for the next session (ticket 144)

Copy-paste everything below this line into the fresh session.

---

Begin ticket 144: the board as a portable product, take three. Read `ai/AGENTS.md`
first, then this brief in full. The owner is hands-off for the whole run: no
questions reach the owner, everything is ruled agent-side (own recommendation
argued twice, recorded with a date and one line why, tabled in the final reply),
and the only stops are the irreversible acts the hard rules name.

## What happened before (so the same ground is not walked again)

Two products were tried, built far too far, and rejected outright.

- **Kanboard v1.2.54, 2026-10-18, one day.** Docker Compose, dark theme through
  its Custom Stylesheet, all 127 queue tickets imported, an existing MCP server
  adopted, twelve physical checks passed. The owner rejected it the same day:
  the interface is ugly in every way, and custom glue kept creeping back in (a
  self-built MCP server was written before the owner stopped it, then a sync
  service, then an import tool, each deleted in turn).
- **Paperclip 2026.1012.0, 2026-10-18 to 2026-10-19, one day.** Passwordless
  local_trusted mode through the product's own CLI, its shipped MCP server
  wired, the queue copied in, eleven checks passed (lifecycle, blockers,
  concurrency, a 409 checkout conflict, one-second live DOM updates). The owner
  rejected it the same day it was handed over, ordered the whole thing discarded:
  branch deleted, instance and CLI removed, `uat` restored byte-for-byte to
  `80e86428`.

Both decommissions are in git history. Treat them as warnings, not references.
The lessons the owner stated: an ugly board is a rejected board, and any custom
layer on top of the product is a mark against the product, never a reason to
write the layer.

## The goal (the owner's words, simplified to the bone)

1. **Spin it up.** As default as possible, bare minimum. Nothing else.
2. **Put our current tickets on it.** Add the tickets the queue already holds to
   the new board.
3. **Show the owner the board.** The owner looks at the look and feel and the
   functionality and rules. Only after approval does anything else happen.

Explicitly out of scope for this ticket, in the owner's words: "I don't want
anything to do with migration, nothing. I don't want to sync." No AI agents, no
MCP connection, no webhooks, no sync, no import engineering, no theming, no
custom glue of any kind. Agents and MCP are the stage after approval.

## The product

It's a Plan: `https://itsaplan.dev/`, `https://github.com/croffasia/itsaplan`.
Verified 2026-10-19 by reading the site, the README, the repository tree, the
compose file, `.env.example`, the license and the docs folder through opensrc
and the GitHub API. Re-verify everything yourself; none of the below is a
substitute for reading its docs and source.

- **What it is.** A self-hosted issue tracker (Kanban, table, timeline,
  calendar; cycles, custom fields, dashboards, docs, notes boards), pitched as
  the open-source alternative to Linear, Jira and Plane. Its differentiator is
  AI agents as teammates, but the README states plainly it is a full tracker on
  its own and can be used "without turning on a single agent", which is exactly
  this ticket's scope.
- **License.** AGPL-3.0 (`LICENSE` is the full AGPL v3 text). No per-seat fees,
  no cloud dependency; everything runs on your server and database.
- **Stack.** Bun, Elysia, Next.js, Drizzle, PostgreSQL 17, RustFS (S3-compatible
  object store for attachments), Docker. Repository version `1.5.0`; latest
  release `v1.5.0`, 2026-10-13. The project warns it is under active development
  and expects breaking changes before its first stable release.
- **Official deployment.** `docker-compose.yml` at the repo root starts the whole
  stack: `postgres`, `minio` (RustFS), `minio-init`, `migrate`, `api`, `worker`,
  `bot`, `web`. Images are published per release as
  `ghcr.io/croffasia/itsaplan-{api,worker,bot,web}:<VERSION>`; `VERSION` in
  `.env` pins a release (defaults to `latest`). `docker compose pull && docker
  compose up -d` is the documented update path; `--build` builds from the
  checkout instead.
- **Required `.env` values** (the stack refuses to start without them):
  `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`,
  `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `API_URL`, `APP_URL`. Each secret
  is `openssl rand -base64 32`; `.env.example` documents every variable.
- **Ports.** API `3000` (`API_PORT`), web `3001` (`WEB_PORT`); Postgres
  `5432` (`POSTGRES_PORT`) for local dev. RustFS keeps both its ports internal.
  Port 8788 on this machine carries the owner's existing reader board and must
  stay untouched; 3100 is free again after the Paperclip removal.
- **Auth.** Better Auth. The first account registered becomes the instance
  admin; passkeys (WebAuthn) are supported and Google sign-in is optional.
  There is no passwordless "no login" mode. Views and issues can be shared as
  read-only public links without sign-in. The owner's earlier hard requirement
  of no login friction is therefore a question for the verdict, not something
  to solve in this ticket.
- **TLS.** Self-hosting documentation requires a domain behind a
  TLS-terminating reverse proxy in production, because the session cookie is
  `Secure`. `http://localhost` is the one plain-HTTP exception (Chrome and
  Firefox keep the cookie there; WebKit does not). A local prototype viewed at
  `http://localhost:3001` is the documented exception path; verify it live
  before promising anything.
- **Getting tickets in.** The product ships REST API with OpenAPI, an MCP
  server, webhooks, and built-in importers for Plane and Linear
  (`docs/importing-from-plane.md`, `docs/importing-from-linear.md`). Our source
  is a markdown queue, not Plane or Linear, so the importer path does not fit;
  the one-time copy rides the product's own REST API as throwaway session work
  that dies with the session, exactly like the two rejected runs' copies. Do
  not write or commit an import tool.
- **Telemetry.** Anonymous telemetry exists (`TELEMETRY.md`); `TELEMETRY_DISABLED`
  or `DO_NOT_TRACK` turns it off. Turn it off.
- **Other docs present:** `docs/self-hosting.md`, `docs/helm.md`,
  `docs/coolify.md`, `docs/railway.md`, `docs/mcp-results.md`, `docs/runner.md`,
  `docs/development.md`.

## Scope, exactly two steps

1. **Bring the stack up locally, defaults only.** The pinned release through the
   repository's own `docker-compose.yml`, secrets generated into a gitignored
   `itsaplan/.env` outside the repository tree (or an ignored directory the plan
   names), telemetry off, ports as documented. No theme, no configuration
   beyond the required variables. Record the exact `.env` keys used (never the
   values) in the plan's LOG.
2. **Put the 127 tickets on it.** Run `node board/reader.mjs` on the same tree
   and copy the emitted tickets (the `tickets` array of
   `board/state/board.json`; the two rejected runs saw 127 on their tree, and
   this ticket's own row makes it 128 here, so use the fresh run's number, not
   the number written in this brief) onto one project through the product's
   REST API, as throwaway session work. Titles carry the ticket number prefix.
   Queue statuses and needs map onto the product's own fields; the plan decides
   the mapping from the product's real vocabulary, not from imagination. Then
   stop.

The owner then opens the board, looks at it, and rules. Nothing merges to `uat`
until that ruling; the work lives on a branch. The home-server move waits for
the same approval.

## The research gate (before any building)

Answer these first, with sources, and stop and report if any answer is no:

1. Does it run locally, bare minimum, on this machine, through its own
   documented Docker path, with `http://localhost:3001` usable for viewing
   (the plain-HTTP cookie exception)?
2. Is it genuinely free and self-hostable with no cloud dependency (AGPL, no
   license key, no paid tier gating the board)?
3. Does the default stack satisfy "see the board and its tickets" without
   turning on agents, MCP, webhooks or the Telegram bot? The compose file runs
   them by default; confirm they are inert with zero configuration.
4. How do 127 tickets get in through the product's own API (or any built-in
   surface), with no committed tooling?
5. What does the owner actually see on first open: sign-up (first account is
   admin), then which navigation reaches the board with the imported tickets?

## Repo rules that bind this work

- No secret, address or key is ever committed; the identifier gate enforces
  this, private-network literals included. `.env` values live outside the tree.
- Every commit bumps `package.json` and `app.json` together, one patch, subjects
  typed `chore(board)` or `docs(plans)`.
- One branch; the owner tests before anything merges; nothing pushes without
  review.
- Deep-clean as you go: no dead code, no leftover files, no scratch, no
  worktrees left behind.
- `board/` and the queue markdown are not touched by this ticket's work beyond
  the queue row that tracks this ticket itself.
- Physical testing, not unit tests: bring the board up, import, drive it with
  the owner's real tickets, then stop for the verdict. Clean up any dummy data.

## Where things stand right now

- `uat` is clean at `80e86428` (2.0.1091). Both rejected prototypes are fully
  discarded: no branches, no files, no running services, no CLI, no shell
  wiring. Ports 8788 (the reader board) and 3001 are free; 3100 too.
- The queue holds 142 numbered rows, 127 emitted tickets (107 done, 20 open).
- Docker on this machine is OrbStack; it was restarted during the last handoff
  and is running.
- This brief is the entry point. The ticket row is 144 in `ai/plans/README.md`.

## Deliverable and stop condition

Bring the board up and the tickets in, then hand the owner the URL, the port
numbers, and one honest paragraph on what the board looks like and how the
import landed. Stop there. The verdict, the agents, the MCP wiring, the theming
and the home-server move are all later tickets, none of them started here.
