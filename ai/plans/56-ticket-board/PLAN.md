# Job 56: Ticket board, a read-only local mirror of the queue and its runs

| Field | Value |
| --- | --- |
| Brief | `ai/plans/README.md` row 56. The queue cell is the brief: the elected design, the three amended rulings, the determinism and portability rules, the deploy shape and the trajectory, all decided by the owner 2026-10-10 |
| Planned at | `uat` `665c8926`, version 2.0.67, 2026-10-12 |
| Planned by | Planning session 2026-10-12 (skeleton `babe3827`, merged `665c8926`) |
| Needs first | nothing |
| Parent | none |
| Group | none. `board/`, `scripts/check-changed-coverage.js`, `biome.json`, `README.md`, `ai/plans/TEMPLATE.md`, `.opencode/agents/athan-executor.md` are disjoint from every other open row |
| Batch budget | 4 weight units (a single step of weight 2 plus one of weight 1, or two of weight 2 never with the compose step) |
| Session budget | 10 weight units (one executor session can finish all six steps; the lead rotates earlier at its discretion) |
| Steps count | 6 |
| Device | none. Every proof is local node, docker compose and a browser on this machine. No phone, no `adb`, no build scripts |
| Owner decisions still needed | none. Round 1 (2026-10-12) closed the frontier; see section 2.1 D62 to D65 |

## 1. Goal

What is wrong today: the queue is a markdown table the owner reads as text, and run state (which
step runs, how far each session got, context pressure, whether `uat` is pushed) lives scattered
across `LOG.md` files, git refs and the opencode database. Seeing the state of the work means
opening four things.

What is true when DONE: one local web board at `http://127.0.0.1:8788` mirrors the queue and its
runs live. It recomputes from committed state plus machine-local caches every 15 seconds, pushes
updates over SSE without a page refresh, renders the elected A5 design on desktop and a composed
390px phone page, and never writes anything except its own state file. The owner opens one URL
and reads the whole workflow.

How the owner notices: `docker compose up` inside `board/`, one URL, columns that move a card the
moment a queue row or a LOG entry lands.

The owner's rules that apply, quoted from row 56 and `ai/AGENTS.md`:

- "An owned generator, never a product." "The board is derived, disposable, never a source of
  truth."
- "No database, no editing, no drag, no token: the pusher is the only writer and the human only
  watches."
- "a reconciling timer, never git hooks; full recompute from committed state; idempotent;
  staleness stamped on the board; `yarn validate` gates nothing."
- "a per-project config file with defaults when absent and an unmapped-status bucket;
  machine-local state isolated so a cloner degrades gracefully."
- `ai/AGENTS.md`: "Never write a gateway address, domain or key into any file." The board reads
  only this repository and this machine's opencode state; nothing it reads is written anywhere.

## 2. Decisions

### 2.1 Taken

From the owner, 2026-10-10, recorded in row 56 (never re-asked): the elected A5 design (flat
solid surfaces, aurora as one horizon line, a single glow on the running step, rounded pale
pastel tags, equal 280px columns, one identical card template on an 8px grid, a genuinely
composed 390px phone page at one column per swipe and 88vw), the column order (Backlog,
Planning, Ready, In progress, Audit, Done, then Blocked and Owner-led), per-ticket task states
(Pending, Running, Merged; middle sub-states cut), needs chip, parent rollup, dotted group
border plus mono label, blocked order list at the foot, context percentage as telemetry reusing
`oc-handoff` `contextPct` with runtime-sourced limits, the deploy shape (reader emits
`board.json`, one self-contained HTML template, a Node-stdlib SSE server under 60 lines, one
`docker-compose` service on pinned `node:24-alpine` with the board directory mounted read-only),
and the trajectory (iterations are queue rows; no separate board skill until a second project
adopts it).

From the owner, 2026-10-10, the three amended rulings: every card carries a platform tag
computed by the reader from the plan's own file list, nobody ever types a platform; the
dependency list at the foot is titled "Run order", each entry carrying its reason inline, hidden
entirely when nothing waits on anything; one ticket in progress is the rule, two in-flight
tickets with disjoint code files are the exception shown as two hero cards with the counter
"2 in flight", the In progress column turns red only for two cards sharing a group.

From the owner, 2026-10-12, planning interview round 1 (this session):

- **D62:** the board's code lives in `board/` at the repository root.
- **D63:** board code sits fully outside the gates, per the recorded "yarn validate gates
  nothing" ruling: board code is `.mjs` (which `tsconfig.json`'s `include` never reads), biome
  skips the folder via a `files.includes` negation, and `scripts/check-changed-coverage.js`
  gains a `board/` UNMEASURED entry with its reason. No Jest suite covers board code. The proof
  of board code is running it against this repository.
- **D64:** the repository `README.md` carries the board section: deploy, access, reading the
  board, vocabulary.
- **D65:** this job pins the LOG.md ledger contract: the step heading and session-line shapes
  the reader parses become contractual in `ai/plans/TEMPLATE.md` and the executor agent file.

Planner-taken mechanics, each the settled consequence of a recorded ruling (override at audit
costs nothing):

- Default config: port 8788, host 127.0.0.1, reconcile every 15000 ms, Done column shows the
  5 highest-order DONE rows. All four sit in `board/config.json` with these values and can be
  changed per project ("a per-project config file with defaults when absent").
- The reader takes `--db <path>` (default: `$HOME/.local/share/opencode/opencode.db` when it
  exists, else skipped) and `--handoffs <dir>` (default `<repo>/.local-handoffs`). The compose
  command passes `--db /opencode/opencode.db`, which the ruled degradation path answers with
  `activeNow: false` when the mount is empty.
- Committed-state reading without a git binary: `node:24-alpine` ships no git (verified
  2026-10-12: `git: not found`, node v24.21.0), so the reader compares
  `.git/refs/heads/uat` against `.git/refs/remotes/origin/uat` as files, falling back to
  `.git/packed-refs`, and reads the version from `package.json`. Unpushed is a boolean plus the
  short local sha; no commit counting.
- Context telemetry reads the handoff cache only: `.local-handoffs/index.json` plus the newest
  document frontmatter per session (`context_pct`, `updatedMs`). Absent or differently shaped:
  skip silently, per the portability ruling. The opencode database supplies one boolean,
  `activeNow`: a session row with this repository as directory updated within 5 minutes. The
  database is opened with `node:sqlite` `readOnly: true` and answers false when the mount is
  absent (verified read-only in-container against the live WAL database 2026-10-12).
- A plan whose step file lists touch none of `android/`, `ios/`, `shared/` renders no platform
  pill, same as a row without a plan folder. The ruling names three cases; the fourth is this.
- `board/state/` is machine-local: the reader creates it on first run with an untracked
  `.gitignore` holding `*`, copying the `.local-handoffs/` pattern exactly. Nothing under
  `board/state/` is ever committed.
- NEEDS REPLAN maps to the Planning column with its own tag; CANCELLED and SUPERSEDED rows are
  closed and render nowhere.

### 2.2 The executor must not decide

- Anything visual beyond the elected words in section 1. Step 5 is excepted: its contract is
  the elected words, and the executor realises them with its own exact values (hex colours,
  the red, the pastels), recording each chosen value in LOG.md; the owner approves the face at
  audit. Outside step 5, a colour, size or layout question the plan does not answer stops work
  and asks: "the elected design says `<quote>`; what exact value should `<property>` take?"
- Any new input source. A field the reader wants that this plan does not name (an API, a
  network call, a second database) stops work and asks.
- Any change outside the files step lists. In particular: no `app.json` beyond the version bump,
  no `package.json` scripts, no `ai/AGENTS.md`, no `opencode.json`.
- If `docker compose up` cannot listen on 127.0.0.1:8788 because the port is taken, stop and
  ask; do not pick another port.
- If the live `opencode.db` is absent or unreadable in the mount, that is the ruled degradation
  path (`activeNow: false`), not a stop. If it is present and the query fails for another
  reason, stop and report the error text.

## 3. Pre-flight

`scripts/preflight-56.sh` in this folder. The executor saves a copy to `$TMPDIR` and runs the
saved copy with the repository as the working directory. It checks: checkout on `uat`, clean tree, `origin` fetched and merged in, version at
least 2.0.67, every Needs-first row DONE (none), every anchor count exactly 1, `node` 24+, and
`docker compose version` answering. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

### Code map (every file read or changed)

Changed:

| File | Role in this job |
| --- | --- |
| `ai/plans/TEMPLATE.md` | gains the LOG.md ledger contract line (D65), step 1 |
| `.opencode/agents/athan-executor.md` | gains the same contract sentence in its Ledger section, step 1 |
| `scripts/check-changed-coverage.js` | gains the `board/` UNMEASURED entry, step 2 |
| `biome.json` | gains `!**/board` in `files.includes`, step 2 |
| `board/config.json` | committed defaults (port, host, reconcile, Done count), step 2 |
| `board/reader.mjs` | the generator: committed state plus local caches to `board/state/board.json`, step 3 |
| `board/server.mjs` | the under-60-line SSE server plus reconciling timer, step 4 |
| `board/docker-compose.yml` | the one ruled service, step 4 |
| `board/index.html` | the self-contained template rendering board.json, step 5 |
| `README.md` | the Board section and the layout line, step 6 |

Read by `board/reader.mjs`, never changed:

| Input | What it yields |
| --- | --- |
| `ai/plans/README.md` | both tables: order, name, brief cell, status cell, needs cell. Verified 2026-10-12: no escaped pipes, every DONE-table row splits to 5 pipe-fields, every open-table row to 7 |
| `ai/plans/<N>-*/PLAN.md` | header row (Parent, Group, Batch budget, Session budget, Steps count) and the section 6 checklist `- [ ]` / `- [x]` |
| `ai/plans/<N>-*/steps/*.md` | `Weight:` lines and `files:` lists (platform computation) |
| `ai/plans/<N>-*/LOG.md` | `### Step <NN> — ` headings, `session: ses_…` lines (the contract step 1 pins) |
| `.git/refs/heads/uat`, `.git/refs/remotes/origin/uat`, `.git/packed-refs`, `package.json` | uat sha, origin sha, unpushed, version |
| `.local-handoffs/index.json` + document frontmatter | context_pct and age per session |
| `~/.local/share/opencode/opencode.db` (read-only) | `activeNow` via `session_v2` (directory, time_updated) |

### How the pieces interact

The compose service runs one Node process, `board/server.mjs`. On start it spawns
`board/reader.mjs`, which writes `board/state/board.json` and exits; the server then serves
three routes: `/` (the committed template), `/board.json` (the state file), `/events` (SSE). A
reconciling timer re-spawns the reader every 15000 ms; when the freshly written `board.json`
differs by bytes from the previous one, the server pushes one SSE event and every open page
refetches. No other write path exists. The board directory, the repository and the opencode
directory are mounted read-only into the container; only `board/state/` is writable.

### Existing tests and what each proves

None cover this job: `board/` is new and every other touched file is configuration or
documentation. Per D63 no Jest suite is added. Each step's red check is a command that fails
before the step and passes after it; each break script is the mutation pass for the logic the
step adds.

### Why the obvious fix is wrong

- "Run the reader with the git binary" fails: `node:24-alpine` ships no git (verified), and
  installing at container start needs network on every boot, which the ruled pinned image
  forbids in spirit and offline use forbids in fact.
- "Read the opencode database for context percentage" fails: `session_v2` token columns are
  session cost totals, not the current context watermark; `oc-handoff` computes `contextPct =
  watermark / window * 100` from model-step usage (`~/.config/opencode/plugins/oc-handoff/lib.js:163`,
  `watermarkOf` line 155) and writes the result into the handoff frontmatter. Re-deriving it
  from totals would be a wrong number, so the board reads the computed value from the cache.
- "Commit a generated index.html" violates "derived, disposable, never a source of truth". The
  template is committed, the data never.

### Verified facts this plan stands on (all measured 2026-10-12, this machine)

- `node:24-alpine` image: `git: not found`, node v24.21.0 (docker pull, `docker run`).
- `node:sqlite` `DatabaseSync(..., { readOnly: true })` opens the live WAL database through a
  read-only bind mount inside the container: `db: ro-ok`, 1531 sessions, directory-filtered
  rows returned; ExperimentalWarning on stderr only.
- Refs read as files inside the same container: `refs/heads/uat` `665c89265b0e` versus
  `refs/remotes/origin/uat` `3b2ec6cbc3ac`, version 2.0.67 from `package.json`.
- The SSE route answered `HTTP/1.1 200`, `content-type: text/event-stream`, on the published
  `127.0.0.1:8788`.
- The queue tables split cleanly on `|` (0 escaped pipes; 5 and 7 pipe-fields only).
- `.local-handoffs/` self-ignores with an untracked `.gitignore` holding `*` (verified:
  `git ls-files .local-handoffs` is empty).

## 5. Design

One sentence a check can verify: **the board is a pure function of committed repository state
plus two machine-local caches, recomputed idempotently on a timer, pushed over SSE, and rendered
by one template; change nothing but the inputs and the output bytes are identical except
`generatedAt` and `context.ageMs`.**

### Alternatives rejected

- Git hooks recomputing the board: rejected by the determinism ruling (a reconciling timer,
  never git hooks; hooks miss in-container writes anyway).
- A watcher on every repository file: rejected; the timer is the reconciler, the watcher watches
  only the state directory so a reader crash cannot loop.
- Reading refs through a `git` subprocess on the host and a container file for the rest: two
  code paths for one fact; rejected.
- `isomorphic-git` for real log parsing: a dependency in a Node-stdlib design; rejected.
- Rendering HTML server-side: makes the server stateful and breaks "self-contained template";
  rejected.

### Concurrency trace

One server process. The timer and the change-detector share one promise chain: a reader spawn
already running means the timer tick is skipped (no pile-up). The reader is a separate process
by design: a parse crash cannot take the server down, and the previous `board.json` keeps
serving (that is the staleness story: the stamp says how old the served state is). SSE writes
are fire-and-forget per response object; a closed socket raises and the socket is dropped from
the set. No locks, no shared mutable state between processes.

### board.json schema (version 1)

The example shows the planning-time row for ticket 56; during execution its status cell reads
`IN PROGRESS, step k`, the column becomes `In progress` and `cursor` fills.

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-10-12T12:00:00.000Z",
  "reconcileMs": 15000,
  "repo": { "version": "2.0.67", "uat": "665c8926", "originUat": "3b2ec6cb", "unpushed": true },
  "activeNow": true,
  "doneCount": 47,
  "tickets": [
    {
      "order": 56,
      "name": "Ticket board: a read-only local mirror of the queue and its runs",
      "status": "PLANNING",
      "statusText": "since 2026-10-12, plan folder …",
      "column": "Planning",
      "needs": [],
      "needsMet": [],
      "parent": null,
      "group": null,
      "platform": null,
      "cursor": null,
      "steps": [{ "n": 1, "weight": 1, "state": "Pending" }],
      "context": { "pct": 72.2, "ageMs": 3600000 }
    }
  ]
}
```

`column` is one of `Backlog, Planning, Ready, In progress, Audit, Done, Blocked, Owner-led,
Unmapped`. `steps` is empty for rows without a plan folder. `context` is null when no handoff
document answers for the sessions in the ticket's LOG.md. Status mapping, in match order on the
status cell's leading text: `IN PROGRESS` to In progress (with `cursor` from the first
`step (\d+)` match), `NEEDS REPLAN` to Planning, `NOT PLANNED` to Backlog, `PLANNING` to
Planning, `READY` to Ready, `EXECUTED` to Audit, `DONE` to Done, `BLOCKED` to Blocked,
`OWNER-LED` to Owner-led, `CANCELLED` and `SUPERSEDED` to not rendered, anything else to
Unmapped. Platform computation per the amended ruling: only `android/` paths is Android, only
`ios/` is iOS, `android/` plus `ios/`, or any `shared/` path, is Both, none of them is null.
Done emission: the 5 highest-order DONE orders each yield a ticket. A DONE row of the open
table parses like any open row. A DONE row of the first table, whose row carries only order,
name and status, yields `{ order, name, needs: [], needsMet: [], parent: null, group: null,
platform: null, cursor: null, steps: [], context: null, statusText: "" }` with `column: "Done"`.
`doneCount` carries the total DONE count across both tables.

### Acceptance criteria

- [R1.1] WHEN `node board/reader.mjs` runs against the repository root THE SYSTEM SHALL exit 0,
  print `board.json written: <N> tickets, <M> done, generatedAt <ISO>` and write
  `board/state/board.json` matching the schema above.
- [R1.2] WHEN a queue row's status cell has a leading status this plan maps THE SYSTEM SHALL place that ticket in the mapped column with the remaining cell text as `statusText`.
- [R1.3] WHEN a queue row's status cell starts with a word this plan does not map THE SYSTEM SHALL place the ticket in `Unmapped`, and WHEN every ticket maps THE SYSTEM SHALL omit the Unmapped column from the page entirely.
- [R2.1] WHEN a ticket's needs cell references an order whose row is DONE THE SYSTEM SHALL mark
  that need met, and WHEN the referenced row is not DONE THE SYSTEM SHALL mark it unmet.
- [R2.2] WHEN a plan folder `ai/plans/<N>-*` exists for a row THE SYSTEM SHALL derive
  `steps` from its section 6 checklist and `Weight:` lines, with state Merged for ticked,
  Running for the checklist entry whose number equals `cursor`, Pending for the rest.
- [R2.3] WHEN the plan's step file lists touch only `android/` paths THE SYSTEM SHALL set
  platform Android; only `ios/`, iOS; both, or any `shared/` path, Both; none of the three,
  null; and WHEN no plan folder exists THE SYSTEM SHALL set platform null.
- [R3.1] WHEN `.git/refs/heads/uat` differs from `.git/refs/remotes/origin/uat`, on either side falling back to packed-refs, THE SYSTEM SHALL set `unpushed: true` with the short local sha in `repo.uat`.
- [R3.2] WHEN the reader runs twice with no input change THE SYSTEM SHALL produce byte-identical `board.json` except `generatedAt` and `context.ageMs`.
- [R4.1] WHEN a session id in a ticket's LOG.md has a newest handoff document carrying numeric `context_pct` THE SYSTEM SHALL set the ticket's `context` with that value and its age from `updated_at`, and WHEN no document answers or a field is shaped differently THE SYSTEM SHALL set `context: null` and continue.
- [R4.2] WHEN the opencode database is absent or unreadable THE SYSTEM SHALL set `activeNow:
  false` and exit 0, and WHEN it answers and a session row for this repository directory was
  updated within 5 minutes THE SYSTEM SHALL set `activeNow: true`.
- [R5.1] WHEN `board.json` changes while `board/server.mjs` runs THE SYSTEM SHALL push one SSE
  event on `/events` and no other route, and an open page shall refetch without reload.
- [R5.2] WHEN the reconciling timer fires every 15000 ms THE SYSTEM SHALL re-spawn the reader (a spawn still running skips its tick, by the design's one in-flight flag).
- [R5.3] WHEN `board/server.mjs` is measured THE SYSTEM SHALL hold 60 lines or fewer
  (`wc -l board/server.mjs`).
- [R6.1] WHEN two in-flight tickets share a group THE SYSTEM SHALL render the In progress
  column red, and WHEN two in-flight tickets have disjoint groups THE SYSTEM SHALL render two
  hero cards, each with its steps rail, and the counter "2 in flight".
- [R6.2] WHEN nothing waits on anything THE SYSTEM SHALL hide the Run order list entirely, and
  WHEN something waits THE SYSTEM SHALL list it under "Run order" with its reason inline.
- [R6.3] WHEN the viewport is at most 430px wide THE SYSTEM SHALL compose the phone page: one
  column per swipe at 88vw.
- [R6.4] WHEN `generatedAt` is older than twice the reconcile interval THE SYSTEM SHALL stamp
  the board stale.
- [R7.1] WHEN a board `.mjs` file is staged THE SYSTEM SHALL pass `node scripts/check-changed-coverage.js --staged` through the `board/` UNMEASURED entry, and `npx biome check . --error-on-warnings` SHALL exit 0 with unformatted board files present, their exclusion keeping them unchecked.
- [R7.2] WHEN `yarn validate` runs with board code present THE SYSTEM SHALL produce the same
  result as before this job (board code invisible to tsc, biome and Jest).
- [R8.1] WHEN an executor appends a LOG.md entry after step 1 THE SYSTEM SHALL parse its
  `### Step <NN> — ` heading and its `session: ses_…` line by the pinned contract.

## 6. Steps

Checklist (ticked in each step's own commit):

- [x] Step 1: pin the LOG.md ledger contract (docs, weight 1)
- [x] Step 2: board scaffold and gate exemptions (code, weight 2)
- [x] Step 3: the reader (code, weight 2)
- [ ] Step 4: the server and the compose service (code, weight 2)
- [ ] Step 5: the template (code, weight 2)
- [ ] Step 6: README and records (docs, weight 1)

One subsection per step in `steps/<k>-<name>.md`. Every step's commit also stages, by name,
`app.json`, `package.json` and `ai/plans/README.md` (the row cursor `IN PROGRESS, step k` moves
inside each step's own commit); `android/app/build.gradle` is gitignored and never added.

## 7. Device proof

None: no phone work. The local proof is per step; the end-to-end proof in step 4 and step 5
runs `docker compose up`, curls the three routes, asserts the SSE push after a queue-file
touch, and tears the stack down. Evidence lands under `$HOME/athan-gitree/sessions/56/` as
text: command, exit code, output. No screenshots are committed; the owner reads the board
herself at `http://127.0.0.1:8788` during audit.

## 8. Records

The findings text below is written into `LOG.md` under `## Job 56` (the executor appends each
step's own entry above it, per the pinned contract):

```markdown
## Planning (2026-10-12)

Planned at `uat` `665c8926` (2.0.67). Scratch proof (all 2026-10-12, this machine):
node:24-alpine ships no git; node:sqlite readOnly opens the live WAL database through a ro
bind mount (1531 sessions, directory filter, ExperimentalWarning only); refs read as files
(uat 665c8926 vs origin 3b2ec6cb); SSE answered text/event-stream on 127.0.0.1:8788; queue
tables split clean on pipes. Interview round 1: D62 board/ at root, D63 fully outside the
gates, D64 README.md carries the section, D65 the LOG contract is pinned in this job. Grill
round 1: 21 findings, all applied. Grill round 2: 14 findings, all applied.
`bash scripts/check-plan.sh ai/plans/56-ticket-board`
prints PLAN OK. Row set READY.
```

The queue-row cell text the lead applies on DONE:

```markdown
DONE <date>, audited and pushed: the ticket board serves at 127.0.0.1:8788 (docker compose up in board/) - reader recomputes board.json from committed state every 15s, SSE pushes without refresh, the A5 design and the 390px phone page render the eight columns, platform pills are computed from plan file lists (D62-D65; board code outside the validate gates per the owner's ruling). LOG.md ledger contract pinned (step 1) so the step rail reads a contract, not a habit. The board is derived and disposable; iterations are queue rows
```

The lead's DONE-time docs commit message: `<VERSION> - docs(board): job 56 ticket board, deploy and vocabulary`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| `docker compose up` prints a port bind error | something else listens on 8788 | stop and ask the owner; do not pick a port |
| `db: fail: … unable to open database file` in reader output | the opencode mount is missing or the WAL files are absent | the ruled degradation: `activeNow: false`, exit 0; any other sqlite error text is a STOP |
| `board.json` written but page blank | template JS error | open the page with the browser console, record the error line, fix the template, rerun the step 5 checks |
| SSE connects but no updates arrive | reader spawn failing every tick | run `node board/reader.mjs` by hand, read its stderr; a reader crash is a reader bug, step 3 |
| `git check-ignore board/state/board.json` prints nothing | the runtime `.gitignore` was not written | the reader writes it on every run; if the check still fails, the reader's ensure-state path is broken (break script B3 covers it) |
| `check-changed-coverage.js --staged` refuses a board file | the UNMEASURED entry was edited or the file sits outside `board/` | restore the entry from the step 2 commit; never list the file elsewhere |

Anticipated review fixes, word for word:

- Reviewer: "the reader prints to stdout with console.log". Fix: `process.stdout.write` of the
  single summary line only; stderr for failures. The no-console rule is biome's; board code is
  outside biome (D63), but the repo's writing standard still holds.
- Reviewer: "server.mjs is 62 lines". Fix: move the MIME map to a two-entry ternary; the
  under-60 ruling is a hard cap (R5.3).
- Reviewer: "the template fetches a font". Fix: system font stack only; self-contained means no
  network.
- Reviewer: "compose mounts the whole home directory". Fix: only the three mounts exist
  (`/repo` read-only, which contains `board/`, the opencode dir read-only, and the state
  volume).

Restore lists per step sit in each step file.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills the draft.
Delivery: the lead dispatches the `athan-executor` and `athan-reviewer` workers; every worker
may call `vision` for an image it cannot see. Nothing else, ever.

## 12. Report to the owner

Plain sentences on what changed and what was proven, the progress table, any decisions waiting
(the frontier is empty), and the four-line handoff.
