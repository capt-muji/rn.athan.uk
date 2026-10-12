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

Save as `$TMPDIR/red-56-04.sh`, run with `bash` (never inline: the executor's shell is zsh and
pipe status differs):

```bash
#!/usr/bin/env bash
set -u
node board/server.mjs --repo . --state board/state > "$TMPDIR/red-56-04.out" 2>&1
echo "node exit: $?"
head -1 "$TMPDIR/red-56-04.out"
docker compose --project-directory board config >/dev/null 2>&1
echo "compose exit: $?"
```

Expected today: `node exit: 1`, a first line beginning `node:internal/modules/cjs/loader`
(`Cannot find module` naming server.mjs), `compose exit: 1` (no compose file). Record all
three. Any other outcome is STOP.

## Change contract

`board/server.mjs`, at most 60 lines (`wc -l` proves R5.3), plain `node:` imports only:

- Parses the same `--repo`, `--state`, `--config`, `--db`, `--handoffs` flags as the reader,
  same defaults, plus `--host <addr>` (default: the config's host). The compose command passes
  `--host 0.0.0.0`, because a container loopback bind is unreachable through a published port;
  the published `ports:` line is what keeps the board host-local.
- Three routes: `/` serves `<repo>/board/index.html` when it exists (404 before step 5
  lands), `/board.json` serves the state file, `/events` answers
  `content-type: text/event-stream` and stays open.
- Spawns `node <repo>/board/reader.mjs` with the same `--repo`, `--state`, `--db`,
  `--handoffs` flags once at start, then every `reconcileMs` from the config; a spawn still
  running means the tick is skipped (one in-flight flag).
- On the state file's bytes changing (watch the state directory, compare bytes), writes
  `data: rev\n\n` to every open `/events` socket and drops closed sockets from the set.
- Listens on the resolved host and the config's `port`.
- No other route, no request body parsing, no file serving outside the two named files.

`board/docker-compose.yml`, exactly:

```yaml
services:
  board:
    image: node:24-alpine
    working_dir: /repo/board
    command: node /repo/board/server.mjs --repo /repo --state /state --host 0.0.0.0 --db /opencode/opencode.db
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

No `user:` line: a fresh named volume is root-owned and a non-root container user cannot write
it. The service runs as the image default, which is root inside the container only; the
published address stays 127.0.0.1 on the host. Nothing in this step changes
`board/reader.mjs`: the reader's `--db` contract from step 3 already answers false when
`/opencode/opencode.db` is absent.

## Green run

```bash
REPO_DIR_IN_DB=$(pwd) OPENCODE_DIR=$HOME/.local/share/opencode docker compose --project-directory board up -d
sleep 6
curl -s --max-time 5 http://127.0.0.1:8788/board.json | head -c 40; echo
curl -s --max-time 5 http://127.0.0.1:8788/board.json | grep -o '"activeNow": true' || echo 'ACTIVE CHECK FAILED'
curl -s --max-time 5 -D - -o /dev/null http://127.0.0.1:8788/events | grep -i 'text/event-stream'
curl -s --max-time 5 -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8788/
wc -l board/server.mjs
```

Expected: the board.json prefix reads `{
  "schemaVersion": 1` (2-space indent), the active check prints `"activeNow": true` (the
database is mounted and `REPO_DIR_IN_DB` names this directory; this is the positive branch of
R4.2), the SSE content type line, `404` (the template is step 5), and 60 or fewer lines.
Record all five. Then the push proof:

```bash
cp ai/plans/README.md "$TMPDIR/queue-push-backup.md"
( curl -sN --max-time 25 http://127.0.0.1:8788/events > "$TMPDIR/sse-capture.txt" ) &
SSE_PID=$!
sleep 2
sed -i '' 's/| Ticket board: a read-only local mirror/| Ticket board: a read only local mirror/' ai/plans/README.md
for i in 1 2 3 4 5; do
  sleep 4
  if grep -q '^data:' "$TMPDIR/sse-capture.txt" 2>/dev/null; then break; fi
done
curl -s --max-time 5 http://127.0.0.1:8788/board.json | grep -Fq 'read only local mirror' || echo 'CONTENT CHECK FAILED'
cp "$TMPDIR/queue-push-backup.md" ai/plans/README.md
wait $SSE_PID
grep -c '^data:' "$TMPDIR/sse-capture.txt"
```

Expected: 1 or more `data:` lines captured (the timer recomputed, the bytes changed, the event
fired), the content check silent (the served board.json carries the mutated row name, proving
the propagation and not just a `generatedAt` tick), and the queue restored byte-identical
(`git diff --stat ai/plans/README.md` empty). Record both. Save the capture under
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
echo 'sub-checks passed: 3'
echo 'ALL AS EXPECTED: 1'
```

Expected last line: `ALL AS EXPECTED: 1` (with `sub-checks passed: 3` on the line before): the line cap holds, the served stack stops answering,
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
- The published address is `127.0.0.1` only (the in-container bind is `0.0.0.0` by
  necessity; the `ports:` line is what keeps the board host-local).
- No console logging in the server; failures exit nonzero with a stderr line.

## Merge

```bash
git checkout uat && git merge --no-ff feat/56-04-server-compose -m "Merge feat/56-04-server-compose into uat: job 56 step 4, server and compose service"
```

A conflict is `git merge --abort`, then STOP.

## Done when

Checklist box 4 ticked, LOG.md entry appended, the stack is down, merged.
