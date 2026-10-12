# LOG

## Planning (2026-10-12)

Planned at `uat` `665c8926` (2.0.67). Scratch proof (all 2026-10-12, this machine):
node:24-alpine ships no git; node:sqlite readOnly opens the live WAL database through a ro
bind mount (1531 sessions, directory filter, ExperimentalWarning only); refs read as files
(uat 665c8926 vs origin 3b2ec6cb); SSE answered text/event-stream on 127.0.0.1:8788; queue
tables split clean on pipes. Interview round 1: D62 board/ at root, D63 fully outside the
gates, D64 README.md carries the section, D65 the LOG contract is pinned in this job. Grill
round 1: 21 findings, all applied. Grill round 2: 14 findings, all applied.
`bash scripts/check-plan.sh ai/plans/56-ticket-board` prints PLAN OK. Row set READY.

session: ses_ed210257dffeRIqhnEt98ldG4O

## Plan repair (2026-10-12)

Lead, answering an executor STOP. preflight-56.sh read the row status from awk
field 4, which is the brief cell in the 7-field open queue table; the status
sits in field 5 (PLAN.md section 4 records the field counts). Index corrected,
one character. Verified PREFLIGHT OK on the fixed script, steps 1 and 2
re-dispatched to the same executor session.

### Step 01 — merged (2026-10-12, executor ses_ed1bffd31ffe3iLQJUCpPzdQOU)

- Branch: `docs/56-01-log-contract` off `uat`. Preflight copy run from `$TMPDIR`
  per PLAN.md section 3: `PREFLIGHT OK`. Anchor check: 6 anchors, each count 1.
- Red: `grep -Fc '### Step <NN> — ' ai/plans/TEMPLATE.md
  .opencode/agents/athan-executor.md` printed `0` and `0`, as the step predicts.
- Change: the ledger-contract bullet inserted in `ai/plans/TEMPLATE.md` directly
  after bullet 8 and before the Push bullet; the contract sentence appended to
  the `.opencode/agents/athan-executor.md` Ledger paragraph ending "respawns you
  from that note.". Nothing else in either file.
- Green: both grep counts `1`; `bash scripts/check-plan.sh ai/plans/56-ticket-board`
  printed `PLAN OK`. No Jest suite covers this step: the touched files are docs
  and agent config (D63 adds no board Jest suite; nothing else changed).
- Break: `ALL AS EXPECTED: 1`; the opens-to-begins substitution was rejected by
  the grep guard and the backup restore verified count 1. Tree after the break:
  only the step's two files modified.
- Version: 2.0.73 (origin fetched under the version lock at 2.0.72; app.json,
  package.json, android/app/build.gradle all set, app.json first).
- Commit: `812e15d4` (2.0.73), hook green: `Tests: 5463 passed, 5463 total`;
  Statements 100% (5211/5211), Branches 100% (2246/2246), Functions 100%
  (1082/1082), Lines 100% (4667/4667).
- Review: read `git show 812e15d4` cold. The heading is byte-identical in both
  files (grep count 1 each, em dash present); only the sanctioned sentences
  landed, everything else in the commit is ledger, tick, cursor and version;
  this LOG's own entries follow the pinned shape. No findings.
- Merge: `2c8b4f17` ("Merge docs/56-01-log-contract into uat: job 56 step 1,
  LOG contract pinned"), no conflict. Step branch deleted after the merge.

session: ses_ed1bffd31ffe3iLQJUCpPzdQOU

### Step 02 — merged (2026-10-12, executor ses_ed1bffd31ffe3iLQJUCpPzdQOU)

- Branch: `feat/56-02-board-scaffold` off `uat` (step 1 merged at `2c8b4f17`,
  branch `docs/56-01-log-contract` deleted). Anchors 6/6 at 1.
- Red: validate exit 0; the coverage gate exit 1 naming `board/probe.mjs: not
  measured. Add its folder to collectCoverageFrom, or to UNMEASURED with a
  reason`; biome on the probe exit 1. Probe and the empty `board/` removed
  after, tree clean.
- Change: `board/config.json` created with the contract's exact bytes; the
  `board/` UNMEASURED entry added directly after the `ai/plans/` entry;
  `"!**/board"` added as the last `files.includes` entry. The step's snippet
  shows a trailing comma after `"!**/board"`, but the same step's review
  checklist requires `python3 -m json.tool biome.json` exit 0, and a trailing
  comma on the last array entry is invalid JSON; the entry landed comma-free,
  the only reading that passes the checklist. `python3 -m json.tool biome.json`
  exits 0.
- Green: validate exit 0; gate exit 0 with the probe staged under the new
  UNMEASURED entry; `npx biome check . --error-on-warnings` exit 0 with the
  unformatted probe present. The three step files stay staged.
- Break: `ALL AS EXPECTED: 1` (the `board/` entry renamed to `board-gone/`, the
  gate refused the staged probe, restore re-staged, no residue).
- Version: 2.0.74 (origin fetched under the held version lock at 2.0.73;
  app.json, package.json, android/app/build.gradle all set, app.json first).
- Commit: `b97edf14` (2.0.74), hook green: `Tests: 5463 passed, 5463 total`;
  Statements 100% (5211/5211), Branches 100% (2246/2246), Functions 100%
  (1082/1082), Lines 100% (4667/4667).
- Review: read `git show b97edf14` cold. The UNMEASURED reason is one quoted
  string laid out like its neighbours, no template literals; `python3 -m
  json.tool biome.json` exit 0 on the committed tree; `board/config.json`
  byte-identical to the contract (90 bytes, cmp). No findings.
- Merge: `3a213c9b` ("Merge feat/56-02-board-scaffold into uat: job 56 step 2,
  board scaffold and gate exemptions"), no conflict. Step branch deleted after
  the merge.

session: ses_ed1bffd31ffe3iLQJUCpPzdQOU

## Plan repair 2 (2026-10-12)

Lead, answering the step 3 executor STOP. Anchor A2 pinned the planning-time
biome.json includes block, whose last line carried no trailing comma; step 2's
mandated append of "!**/board" gave that line a comma, so the pinned bytes
disappeared and A2 counted 0 from step 3 onward. A2 rewritten against the
landed block (comma plus the board line); nothing after step 2 touches
biome.json, so it holds. A5 and A6 verified against step 6's contract and left
unchanged: both edits are insertions outside the pinned bytes (A5 pins the
paragraph the Board section follows, A6 pins the closing fence and the
paragraph after the layout block, not the e2e/ line). Step 3 re-dispatched to
the same executor session.

### Step 03 — merged (2026-10-12, executor ses_ed1bffd31ffe3iLQJUCpPzdQOU)

- Branch: `feat/56-03-reader` off `uat` (re-opened after plan repair 2,
  `fb8edc5e`; the first opening STOPped on anchor A2 and touched nothing).
  Anchors 6/6 at 1.
- Red: `Error: Cannot find module
  '$HOME/repos/rn.athan.uk/board/reader.mjs'`, exit 1.
- Change: `board/reader.mjs`, one file, `node:` builtins only
  (`node:sqlite`, `node:fs`, `node:path`), every contracted function with its
  contracted answer. Two defects caught before any run: argv parsed as an
  object from array entries (flags never resolved) and a NaN leak through `??`
  in the Parent parse. The node:sqlite import alone prints ExperimentalWarning
  on stderr; stdout stays the single summary line.
- Green: `board.json written: 20 tickets, 47 done, generatedAt <ISO>`;
  `reader assertions passed`; `deterministic: identical bytes` (generatedAt,
  ageMs, activeNow masked); `state ignored` (`git check-ignore` answered).
  Fixture context: `fixture context read: 55.5` over the first LOG session
  `ses_ed210257dffeRIqhnEt98ldG4O`; the final run restored the real board.json.
  Real handoff cache answers nothing for this plan's sessions, so 56 renders
  context null (the R4.1 negative branch, live).
- Three literal-contract behaviours, verified against the queue before commit:
  the Done column is 57, 55, 53, 52, 50 (the five highest DONE orders across
  both tables: 57 and 55 full open rows, 53, 52, 50 first-table stubs, the two
  cases PLAN section 5 names; the step file's 18, 38, 39, 55, 57 are the five
  open-table DONE rows, all in doneOrders); statusText keeps its leading comma
  on IN PROGRESS cells (", step 3. Planned at ..." is the cell after the
  matched status, collapsed, 140 chars); ticket 55 carries cursor 2 because its
  DONE cell contains "step 2 as `fc568fa7`" and the contract takes the first
  `step (\d+)` capture wherever it sits.
- Break: `sub-checks passed: 3`, `ALL AS EXPECTED: 1` (WIBBLE rendered one
  Unmapped ticket; `board/state/.gitignore` recreated after rm; empty
  REPO_DIR_IN_DB exited 0). The sed target `| NOT PLANNED | nothing |`
  verified count 1 before the break. Tree after: only the step's files.
- Version: 2.0.76 (origin fetched under the version lock at 2.0.75; app.json,
  package.json, android/app/build.gradle all set, app.json first).
- Commit: `aa97b091` (2.0.76; the first attempt was refused by the identifier
  gate because the recorded red line carried the home path verbatim; the line
  now reads `$HOME/repos/rn.athan.uk/board/reader.mjs` and the commit passed),
  hook green: `Tests: 5463 passed, 5463 total`; Statements 100% (5211/5211),
  Branches 100% (2246/2246), Functions 100% (1082/1082), Lines 100%
  (4667/4667).
- Review: read `git show aa97b091` cold. Imports are `node:sqlite`, `node:fs`,
  `node:path` only; stdout is the single summary write, stderr the single
  failure line; the db handle closes in a finally on every path including the
  constructor throw; the only writes sit under `board/state/`; every
  degradation path (config, plan folder, PLAN.md, steps, LOG, refs, handoffs,
  db, package.json) answers and continues. No findings.
- Merge: `db61b95e` ("Merge feat/56-03-reader into uat: job 56 step 3, the
  reader"), no conflict. Step branch deleted after the merge.

session: ses_ed1bffd31ffe3iLQJUCpPzdQOU

### Step 04 — merged (2026-10-12, executor ses_ed1bffd31ffe3iLQJUCpPzdQOU)

- Branch: `feat/56-04-server-compose` off `uat`. Anchors 6/6 at 1.
- Red (script in `$TMPDIR/red-56-04.sh`): node exit 1, first line
  `node:internal/modules/cjs/loader`, `Error: Cannot find module` naming
  server.mjs; compose exit 1. Evidence `sessions/56/red-04.txt`.
- Change: `board/server.mjs` at 60 lines (R5.3; a first write of 73 and a
  second of 59 were reworked to the cap, and the SSE route gained
  `res.flushHeaders()` because writeHead alone never puts headers on the wire
  for a stream that has not written a body byte, so the 5-second header probe
  saw nothing), and `board/docker-compose.yml` byte-identical to the contract.
  Flags, routes, one in-flight reader spawn every reconcileMs, byte-compare
  watch on the state directory, `data: rev` to every open socket, failures one
  stderr line and nonzero exit.
- Green: `{"schemaVersion": 1` prefix; `"activeNow": true` (the live database
  mounted, REPO_DIR_IN_DB naming this directory; `time_updated` verified
  milliseconds, my session row 2.6 s old at the pre-check);
  `content-type: text/event-stream`; `404` on `/`; `wc -l` 60. Evidence
  `sessions/56/green-04-routes.txt`.
- Push proof: 2 `data:` lines captured over 25 s; the served board.json
  carried the mutated row name (content check silent); the queue restored
  byte-identical; `docker compose down` exit 0. Evidence
  `sessions/56/push-04.txt` and `sessions/56/sse-capture.txt`.
- Break: `sub-checks passed: 3`, `ALL AS EXPECTED: 1` (cap 60; the stopped
  stack stopped answering; the corrupted state file was already replaced by
  the reader's next tick, served bytes `{"sc`). Evidence
  `sessions/56/break-04.txt`. Tree after: only the two step files.
- Version: 2.0.77 (origin fetched under the version lock at 2.0.76; app.json,
  package.json, android/app/build.gradle all set, app.json first).
- Commit: (filled in the step 5 commit, with the hook line)
- Review: (filled in the step 5 commit)
- Merge: (filled in the step 5 commit)

session: ses_ed1bffd31ffe3iLQJUCpPzdQOU
