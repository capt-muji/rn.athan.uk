# Step 03: the reader

Requirements: R1.1, R1.2, R1.3, R2.1, R2.2, R2.3, R3.1, R3.2, R4.1, R4.2, R8.1
Weight: 2 (code)

## Anchor check

```bash
bash ai/plans/56-ticket-board/scripts/anchor-check.sh
```

Every anchor count must be 1. Any other count is STOP.

## Goal

`board/reader.mjs` turns committed repository state plus the two machine-local caches into
`board/state/board.json`, deterministically, degrading silently on every absent input except
the queue itself.

## Branch

```bash
git checkout -b feat/56-03-reader uat
```

## Files

- `board/reader.mjs` (new)

## Red check

```bash
node board/reader.mjs --repo . 2>&1; echo "exit: $?"
```

Expected today: node exits 1 with `Cannot find module` naming the file. Record the exact first
line. Any other outcome is STOP.

## Change contract

One file, `board/reader.mjs`, plain Node 24 modules, no imports outside `node:` builtins. These
functions, these names, these answers:

- `main(argv)`: parses `--repo <path>` (default `process.cwd()`), `--state <dir>` (default
  `<repo>/board/state`), `--config <file>` (default `<repo>/board/config.json`),
  `--db <path>` (default `$HOME/.local/share/opencode/opencode.db` when that file exists, else
  null: skipped), `--handoffs <dir>` (default `<repo>/.local-handoffs`). Orchestrates
  the functions below, writes the output, prints one stdout line, exits 0. Exit 1 with stderr
  `board-reader: cannot read <path>` only when `ai/plans/README.md` is unreadable. Every other
  missing input degrades per its function.
- `readConfig(file)`: JSON parse; missing file or missing keys answer the defaults from step 2
  (`port 8788, host 127.0.0.1, reconcileMs 15000, doneColumnCount 5`). The reader itself uses
  only `doneColumnCount`.
- `parseQueue(markdown)`: returns `{ open: [...], doneRows: [...], doneOrders: [...] }`.
  Table 1 rows split to 5 pipe-fields, table 2 rows to 7. A row of either table whose status
  field starts with `DONE` contributes `{ order, name }` to `doneRows` and its integer order
  to `doneOrders` (table 2 holds five DONE rows today: 18, 38, 39, 55, 57). Table 2 rows not
  DONE yield `{ order, name, brief, statusCell, needsCell }` (integer order, trimmed
  strings).
- `mapStatus(statusCell)`: returns `{ status, column, cursor, statusText, rendered }`.
  `rendered: false` for leading `CANCELLED` and `SUPERSEDED`. `cursor` is the first
  `step (\d+)` capture in the cell, else null. Column mapping in this match order on leading
  text: `IN PROGRESS` to In progress, `NEEDS REPLAN` to Planning, `NOT PLANNED` to Backlog,
  `PLANNING` to Planning, `READY` to Ready, `EXECUTED` to Audit, `DONE` to Done, `BLOCKED` to
  Blocked, `OWNER-LED` to Owner-led, anything else to Unmapped. `statusText` is the cell after
  the matched status, first 140 characters, collapsed whitespace.
- `parseNeeds(needsCell)`: every `\d+` in the cell, deduped, ascending. The word `nothing`
  yields `[]`.
- `isMet(order, tickets, doneOrders)`: true when the referenced order appears in `doneOrders`
  or its row maps CANCELLED or SUPERSEDED (closed needs are met).
- `findPlanFolder(repo, order)`: first directory matching `ai/plans/<order>-*`, else null.
- `parsePlan(planPath)`: from `PLAN.md` returns `{ parent, group, steps }`. `parent` is the
  integer in the header table row `| Parent | <n> |` (null for `none`). `group` is the
  `| Group |` cell text (null for `none`). `steps` comes from the section 6 checklist lines
  `- [x] Step 3:` / `- [ ] Step 1:` (pattern `- \[([ x])\] Step (\d+):`), each
  `{ n, weight, ticked }` where `weight` is the `Weight: <n>` value from
  `steps/<k>-*.md` matched by the same step number (weight 1 when a step file is missing).
- `platformOf(planPath)`: reads every `steps/*.md`, but only the backticked path tokens in
  each step's `## Files` section (the lines between `## Files` and the next `##` heading),
  collecting tokens starting with `android/`, `ios/`, `shared/`. Only android: Android. Only
  ios: iOS. Both, or any shared: Both. None: null.
- `parseLogSessions(logPath)`: every line matching `^session: (ses_\S+)`, in file order, when
  `LOG.md` exists, else `[]`.
- `readRefs(repo)`: `{ uat, originUat }`, 12-character short shas. Read
  `.git/refs/heads/uat` and `.git/refs/remotes/origin/uat`; a missing side falls back to
  scanning `.git/packed-refs` for the same ref names; a side still missing is null.
- `readContext(handoffDir, sessionIds)`: reads `index.json` (absent: null). Schema check: the
  parse yields an array whose entries carry string `file` and `sourceSession` and number
  `updatedMs`; anything else answers null silently. Picks the newest entry per given session,
  reads that document, parses its frontmatter for numeric `context_pct` and ISO `updated_at`.
  Answers `{ pct, ageMs }` for the newest across the given sessions, `ageMs` measured from
  `Date.now()` at run time. Any miss anywhere: null.
- `activeNow(dbPath, repoDirectoryInDb, now)`: opens the database with
  `new DatabaseSync(dbPath, { readOnly: true })`, queries
  `SELECT 1 FROM session_v2 WHERE directory = ? AND time_updated >= ? LIMIT 1` with
  `now - 300000`. Any error, absent file, or empty `repoDirectoryInDb`: false, and the db
  handle is closed on every path. `repoDirectoryInDb` comes from the environment variable
  `REPO_DIR_IN_DB` (empty means skip: false).
- `ensureState(stateDir)`: `mkdirSync(recursive)`, then writes `.gitignore` holding exactly `*`
  plus a newline when that file does not exist. The state file write is temp file plus rename,
  so a served read never sees a torn file.
- Output assembly: the exact schema of PLAN.md section 5, `tickets` in queue table order
  followed by the Done-column tickets, `steps` empty when no plan folder, `context` from
  `readContext` over `parseLogSessions`, `doneCount` from `doneOrders.length`, `generatedAt` a
  fresh ISO string. Done emission per PLAN.md section 5: the `doneColumnCount` (config)
  highest-order DONE orders yield tickets; an open-table DONE row parses like any open row, a
  first-table DONE row yields the stub with empty `needs`, `steps`, `statusText: ""` and
  `column: "Done"`. JSON with 2-space
  indent, trailing newline, fixed key order as written in the schema.
- The stdout summary line, exactly:
  `board.json written: <N> tickets, <M> done, generatedAt <ISO>`.

## Green run

```bash
node board/reader.mjs --repo . --state board/state
node - <<'EOF'
const b = JSON.parse(require('node:fs').readFileSync('board/state/board.json','utf8'));
const orders = b.tickets.map(t => t.order);
if (!orders.includes(56)) throw new Error('row 56 missing');
const t56 = b.tickets.find(t => t.order === 56);
if (t56.column !== 'Planning') throw new Error('56 not Planning: ' + t56.column);
if (t56.needs.length !== 0) throw new Error('56 needs not empty');
if (typeof b.repo.unpushed !== 'boolean') throw new Error('unpushed not boolean');
if (typeof b.activeNow !== 'boolean') throw new Error('activeNow not boolean');
if (!Number.isInteger(b.doneCount) || b.doneCount < 40) throw new Error('doneCount wrong: ' + b.doneCount);
console.log('reader assertions passed');
EOF
node board/reader.mjs --repo . --state board/state >/dev/null
sed 's/"generatedAt": "[^"]*"/"generatedAt": "X"/; s/"ageMs": [0-9]*/"ageMs": 0/' board/state/board.json > "$TMPDIR/b1.json"
node board/reader.mjs --repo . --state board/state >/dev/null
sed 's/"generatedAt": "[^"]*"/"generatedAt": "X"/; s/"ageMs": [0-9]*/"ageMs": 0/' board/state/board.json > "$TMPDIR/b2.json"
cmp "$TMPDIR/b1.json" "$TMPDIR/b2.json" && echo 'deterministic: identical bytes'
git check-ignore board/state/board.json && echo 'state ignored'
```

Expected: `reader assertions passed`, `deterministic: identical bytes`, `state ignored`, and
the reader's own summary line on each run. Record all four. Then the context fixture, proving
the positive branch of R4.1 without touching the repository's real handoff cache:

```bash
mkdir -p "$TMPDIR/fixture-handoffs"
FIRST_SESSION=$(grep -oE 'session: ses_\S+' ai/plans/56-ticket-board/LOG.md | head -1 | cut -d' ' -f2)
cat > "$TMPDIR/fixture-handoffs/index.json" <<EOF
[{"file":"f.md","title":"fixture","sourceSession":"$FIRST_SESSION","createdMs":1,"updatedMs":2,"nextAction":"x","status":"in-progress","branch":"uat","scope":"x","words":10}]
EOF
cat > "$TMPDIR/fixture-handoffs/f.md" <<EOF
---
context_pct: 55.5
updated_at: "2026-10-12T10:00:00.000Z"
---
EOF
node board/reader.mjs --repo . --state board/state --handoffs "$TMPDIR/fixture-handoffs" >/dev/null
node -e "const b=JSON.parse(require('node:fs').readFileSync('board/state/board.json','utf8'));const t=b.tickets.find(x=>x.order===56);if(!t.context||t.context.pct!==55.5){console.error('fixture context not read: '+JSON.stringify(t.context));process.exit(1)}console.log('fixture context read: 55.5')"
node board/reader.mjs --repo . --state board/state >/dev/null
```

Expected: `fixture context read: 55.5`. The final run restores the real `board.json`. LOG.md
holds the step 1 and step 2 session lines when this step runs; if the grep finds no session
line, STOP: the ledger contract pinned in step 1 is not being written.

## Break script

Save as `$TMPDIR/break-56-03.sh`, run with `bash`:

```bash
#!/usr/bin/env bash
set -u
cp ai/plans/README.md "$TMPDIR/queue-backup.md"
sed -i '' 's/| NOT PLANNED | nothing |/| WIBBLE | nothing |/' ai/plans/README.md
node board/reader.mjs --repo . --state board/state >/dev/null
node -e "const b=JSON.parse(require('node:fs').readFileSync('board/state/board.json','utf8'));const w=b.tickets.filter(t=>t.column==='Unmapped');if(w.length<1){console.error('no unmapped ticket');process.exit(1)}console.log('unmapped count: '+w.length)"
code=$?
cp "$TMPDIR/queue-backup.md" ai/plans/README.md
[ "$code" -eq 0 ] || { echo 'BREAK NOT APPLIED'; exit 1 }
rm board/state/.gitignore
node board/reader.mjs --repo . --state board/state >/dev/null
git check-ignore board/state/board.json || { echo 'gitignore not recreated'; exit 1 }
REPO_DIR_IN_DB= node board/reader.mjs --repo . --state board/state >/dev/null || { echo 'empty db var must not fail'; exit 1 }
echo 'ALL AS EXPECTED: 3'
```

Note: the sed matches the first `| NOT PLANNED | nothing |` row cell, which is row 65's
(`| NOT PLANNED | nothing |`). Verify with `grep -c '| NOT PLANNED | nothing |' ai/plans/README.md`
before the break; a count other than 1 means STOP (the queue changed; read the queue and adapt
only the sed target, recording the adaptation in LOG.md).
Expected last line: `ALL AS EXPECTED: 3`. `git status --porcelain` then lists only this plan
folder's files.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the version lock. Set it in
the three files, `app.json` first. Add `board/reader.mjs` by name plus this plan folder's
changed files. Commit message:

```
<VERSION> - feat(board): the reader, committed state to board.json (job 56 step 3)
```

## Review checklist

- No import outside `node:` builtins. No `console.log` (stdout via `process.stdout.write`).
- Every degradation path answers and continues; only the unreadable queue exits 1.
- The db handle closes on every path, including the error path.
- The stdout line matches the contract byte for byte.
- No path outside `board/` is written; `board/state/.gitignore` is the only non-state file
  created.

## Merge

```bash
git checkout uat && git merge --no-ff feat/56-03-reader -m "Merge feat/56-03-reader into uat: job 56 step 3, the reader"
```

A conflict is `git merge --abort`, then STOP.

## Done when

Checklist box 3 ticked, LOG.md entry appended, merged.
