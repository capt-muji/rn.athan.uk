# Step 04: the server and the compose service

Requirements: R5.1, R5.2, R5.3, R4.2
Weight: 2 (code)

## Anchor check

```bash
bash ai/plans/56-ticket-board/scripts/anchor-check.sh
```

Every anchor count must be 1. Any other count is STOP.

## Goal

`board/server.mjs` serves the template, the state file and an SSE stream, re-spawns the reader
on a reconciling timer, and holds 60 lines or fewer. `board/docker-compose.yml` runs it as the
one ruled service on pinned `node:24-alpine` with read-only mounts and one writable named
volume for state.

## Branch

```bash
git checkout -b feat/56-04-server-compose uat
```

## Files

- `board/server.mjs` (new)
- `board/docker-compose.yml` (new)

## Red check

```bash
node board/server.mjs 2>&1 | head -1; echo "exit: ${PIPESTATUS[0]:-$?}"
docker compose --project-directory board config >/dev/null 2>&1; echo "compose exit: $?"
```

Expected today: node exits nonzero (`Cannot find module`), compose exits 1 (no compose file).
Record both. Any other outcome is STOP.

## Change contract

`board/server.mjs`, at most 60 lines (`wc -l` proves R5.3), plain `node:` imports only:

- Parses the same `--repo`, `--state`, `--config` flags as the reader, same defaults.
- Three routes: `/` serves `<repo>/board/index.html` when it exists (404 before step 5
  lands), `/board.json` serves the state file, `/events` answers
  `content-type: text/event-stream` and stays open.
- Spawns `node <repo>/board/reader.mjs` with the same flags once at start, then every
  `reconcileMs` from the config; a spawn still running means the tick is skipped (one
  in-flight flag).
- On the state file's bytes changing (watch the state directory, compare bytes), writes
  `data: rev\n\n` to every open `/events` socket and drops closed sockets from the set.
- Listens on the config's `host` and `port`.
- No other route, no request body parsing, no file serving outside the two named files.

`board/docker-compose.yml`, exactly:

```yaml
services:
  board:
    image: node:24-alpine
    user: "${DOCKER_UID:-1000}:${DOCKER_GID:-100}"
    working_dir: /repo/board
    command: node /repo/board/server.mjs --repo /repo --state /state
    ports:
      - "127.0.0.1:${BOARD_PORT:-8788}:8788"
    environment:
      - REPO_DIR_IN_DB=${REPO_DIR_IN_DB:-}
    volumes:
      - ..:/repo:ro
      - ${OPENCODE_DIR:-/var/empty}:/opencode:ro
      - board-state:/state
volumes:
  board-state:
```

The reader resolves the database path itself: `REPO_DIR_IN_DB` non-empty makes it read
`${OPENCODE_DIR}/opencode.db` when that file exists; the exact wiring is the reader's
`activeNow` contract from step 3 with the container path `/opencode/opencode.db` passed by
`server.mjs` as the db path whenever `/opencode/opencode.db` exists. Nothing in this step
changes `board/reader.mjs`.

## Green run

```bash
REPO_DIR_IN_DB=$(cd . && pwd) docker compose --project-directory board up -d
sleep 6
curl -s --max-time 5 http://127.0.0.1:8788/board.json | head -c 120; echo
curl -s --max-time 5 -D - -o /dev/null http://127.0.0.1:8788/events | grep -i 'text/event-stream'
curl -s --max-time 5 -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8788/
wc -l board/server.mjs
```

Expected: a `board.json` prefix beginning `{ "schemaVersion": 1`, the SSE content type line,
`404` (the template is step 5), and `60` or fewer lines. Record all four. Then the push proof:

```bash
cp ai/plans/README.md "$TMPDIR/queue-push-backup.md"
( curl -sN --max-time 25 http://127.0.0.1:8788/events > "$TMPDIR/sse-capture.txt" ) &
SSE_PID=$!
sleep 2
sed -i '' 's/| PLANNING since 2026-10-12/| PLANNING since 2026-10-13/' ai/plans/README.md
sleep 20
cp "$TMPDIR/queue-push-backup.md" ai/plans/README.md
wait $SSE_PID
grep -c '^data:' "$TMPDIR/sse-capture.txt"
```

Expected: 1 or more `data:` lines captured (the timer recomputed, the bytes changed, the event
fired), and the queue restored byte-identical
(`git diff --stat ai/plans/README.md` empty). Record the count. Save the capture under
`$HOME/athan-gitree/sessions/56/`.

```bash
docker compose --project-directory board down
```

Expected: the stack tears down, exit 0.

## Break script

Save as `$TMPDIR/break-56-04.sh`, run with `bash`:

```bash
#!/usr/bin/env bash
set -u
lines=$(wc -l < board/server.mjs)
[ "$lines" -le 60 ] || { echo "server is $lines lines, cap is 60"; exit 1 }
docker compose --project-directory board up -d >/dev/null 2>&1
sleep 5
curl -s --max-time 3 http://127.0.0.1:8788/board.json >/dev/null && ok=1
docker compose --project-directory board stop >/dev/null 2>&1
sleep 2
if curl -s --max-time 3 http://127.0.0.1:8788/board.json >/dev/null 2>&1; then
  echo 'server still answering after stop'; exit 1
fi
docker run --rm -v board_board-state:/state node:24-alpine sh -c 'echo garbage > /state/board.json'
docker compose --project-directory board up -d >/dev/null 2>&1
sleep 5
curl -s --max-time 3 http://127.0.0.1:8788/board.json | head -c 7
echo
docker compose --project-directory board down >/dev/null 2>&1
[ "${ok:-0}" -eq 1 ] || { echo 'BREAK NOT APPLIED'; exit 1 }
echo 'ALL AS EXPECTED: 3'
```

Expected last line: `ALL AS EXPECTED: 3`: the line cap holds, the served stack stops answering,
and a corrupted state file is served (or the reader has already replaced it on the next tick;
either answer passes, record which). `git status --porcelain` then lists only this plan
folder's files.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version lock. Set it in
the three files, `app.json` first. Add the two files by name plus this plan folder's changed
files. Commit message:

```
<VERSION> - feat(board): SSE server, reconciling timer, the compose service (job 56 step 4)
```

## Review checklist

- `wc -l board/server.mjs` is 60 or fewer in the committed file.
- The compose file matches the contract byte for byte; only the three mounts exist, two
  read-only, one named volume.
- The port publishes on 127.0.0.1 only, never 0.0.0.0.
- No console logging in the server; failures exit nonzero with a stderr line.

## Merge

```bash
git checkout uat && git merge --no-ff feat/56-04-server-compose -m "Merge feat/56-04-server-compose into uat: job 56 step 4, server and compose service"
```

A conflict is `git merge --abort`, then STOP.

## Done when

Checklist box 4 ticked, LOG.md entry appended, the stack is down, merged.
