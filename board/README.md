# The board

The board: a self-hosted It's a Plan instance. It holds the tickets, their columns,
their relations, their history and the plan documents. This folder is the whole deployment.

## What is here

| Path | What it is |
| --- | --- |
| `docker-compose.yml` | the stack, pinned by `VERSION` in `env` |
| `env` | the values the stack needs. Ignored by git |
| `.env.example` | the same keys with no values that matter |
| `data/postgres` | the database files |
| `data/rustfs` | attachments |
| `data/backups` | the dump the migrate service takes before an upgrade |
| `snapshot/board.sql` | the committed snapshot. This is what git holds |
| `snapshot.sh` | writes the snapshot |

## The containers

Six run: `postgres`, `minio`, `migrate`, `minio-init`, `api`, `web`. Two are one-shot setup
steps that exit, `migrate` and `minio-init`. Two are listed but never start, `worker` and `bot`,
because they carry a profile the stack does not enable. They serve webhooks, notifications and
Telegram, none of which this board uses.

## Start and stop

```bash
cd board
docker compose --env-file env up -d
docker compose --env-file env down
```

The board is at `http://localhost:3001`. The API is at `http://localhost:3000`. RustFS and
Postgres stay inside the compose network.

## First run on a new machine

```bash
cp .env.example env      # then fill in the secrets: openssl rand -base64 32
docker compose --env-file env up -d
```

That gives an empty board. To get the tickets back, restore the snapshot:

```bash
board/restore.sh
```

## The snapshot

`snapshot/board.sql` is the committed copy of the board. It is what survives a wiped disk, and
it is what makes the repository the readable roadmap.

```bash
board/snapshot.sh          # dump the board into snapshot/board.sql
board/restore.sh           # load snapshot/board.sql into a running board
```

The dump writes one row per line, so a ticket changing column shows as a one-line diff. The
credential and session tables (session, account, apikey, jwks, oauth_resource) are left out:
they hold nothing worth committing, and a restored board issues fresh ones through its own
setup instead of restoring secrets from git.

A snapshot is taken at the end of a run, in the same commit as the run's work. It is only as
fresh as the last one, which is why the run close-out refreshes it.

## What was changed from upstream

The compose file is the released v1.5.0 file with four local edits, all marked in this list:

1. The postgres, RustFS and backup volumes are bind mounts under `data/`, so the data lives in
   this folder and survives the containers.
2. `worker` and `bot` carry `profiles: ["unused"]`, so the stock file stays close to upstream
   and they simply never start.
3. The api runs with `NODE_ENV: development`. That is the one lever that keeps the session
   cookie off the `Secure` flag, so a browser holds a session over plain HTTP on localhost.
   Nothing else in the api reads it.
4. The top-level named volumes are removed, since nothing uses them.

Everything else is upstream's file. Upgrading means replacing the file and re-applying these
four edits, then `docker compose --env-file env pull && docker compose --env-file env up -d`.

## Losing the data

`data/` is ignored by git. It is the live copy and the only copy on this machine. The
snapshot, a Time Machine copy, or a copy to another machine is what makes it recoverable. A
backup that has never been restored is not a backup, so the drill in the ticket is part of the
setup, not an extra.
