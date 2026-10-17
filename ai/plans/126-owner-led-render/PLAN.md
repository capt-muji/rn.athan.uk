# Job 126: Board mirror, an OWNER-LED row must read as awaiting the owner

| Field | Value |
| --- | --- |
| Brief | `ai/plans/README.md` row 126. The queue cell is the brief: the owner's 2026-10-16 status-model ruling, the recommendation to extend generator and template, the fixture row in the generator's tests, and the never-counted-as-done pin |
| Planned at | `uat` `7e029a34`, version 2.0.958, 2026-10-17 |
| Planned by | Lane 126 planning session 2026-10-17 (skeleton committed at the PLANNING merge) |
| Needs first | nothing |
| Parent | none |
| Group | none. `board/` and this plan folder are disjoint from lane 111 (`ai/plans/111-*`, `e2e/README.md`, `ai/UPSTREAM-PRS.md`, `SDK58-PROGRAMME.md`, both phones), lane 125 (`.husky/`, `scripts/` guard files, protocol files) and lane 120 (`ai/plans/120-*`, the notification-center code). `ai/plans/README.md` is shared queue weather, resolved per the lane rules keeping both lanes' rows |
| Batch budget | 2 weight units (the single code step) |
| Session budget | 4 weight units (one executor session runs the step and Finishing) |
| Steps count | 1 |
| Device | none. Local node only: no phone, no adb, no build scripts, no docker required |
| Owner decisions still needed | none at planning. Her live read of the board is the acceptance for the card face (section 8 records what she sees) |

## 1. Goal

What is wrong today, measured 2026-10-17 against `uat` `7e029a34` by running `node board/reader.mjs` on a scratch queue fixture holding an OWNER-LED row landed the way a planning session lands it (recommendation in the Status cell, waiting-on line in the Needs-first cell):

- The reader discards the waiting-on line: `parseNeeds` keeps digits only, so the cell `her ruling on option B` reaches `board.json` as `needs: []` and the card cannot name what she rules on.
- The template badges the row `Owner steered` (`stateWord`), a past-tense phrase that reads finished, and renders the whole Status cell as one `reason` line, so the recommendation and the wait share one undifferentiated string.
- Nothing pins the new status model: no test asserts that an OWNER-LED row stays out of `doneCount`, so a future edit to the DONE branch of `parseQueue` (a change from `startsWith('DONE')` to `includes('DONE')` is the live hazard, because a landed OWNER-LED cell names DONE inside its prose) would count a ruling-awaited row as finished.
- `displayColumn` in the template sends every non-DONE row with unmet needs to the Blocked column, so an OWNER-LED row whose Needs-first cell carries an order number renders beside genuinely blocked work instead of staying visible in her column.

What is true when DONE: an OWNER-LED row on the live board carries the badge `Awaiting owner`, its recommendation as the reason line, and a distinct violet waiting-on line naming what she rules on (her own words from the Needs-first cell, or `her ruling` when the cell carries nothing). The row sits in the Owner-led column whatever its needs say, it never enters `doneCount`, and the generator's test suite pins all of this red-first with a fixture row, holding row 56's discipline: full recompute from committed state, idempotent, read-only against the stores, `yarn validate` gating nothing of the board's.

How the owner notices: she opens `http://127.0.0.1:8788`, and a row awaiting her decision reads as awaiting her at first glance, without opening the queue file.

The owner's rules that apply, quoted:

- Row 126: "an audited investigation whose deliverable is a recommendation she must rule on is OWNER-LED, never DONE, so it stays visible in her column with the recommendation inside" and "extend the board generator and its template so an OWNER-LED row renders its recommendation and its waiting-on line distinctly, add a fixture row to the generator's tests, and pin in the reader that an OWNER-LED row is never counted as done."
- `ai/plans/README.md` Status section: "**OWNER-LED:** the owner's own reading or decisions. Nothing for an executor to run. A finished investigation whose deliverable is a recommendation she must rule on lands HERE, never DONE: DONE means no action remains anywhere. Her ruling moves the row to its next state, a code ticket or DONE."
- Row 56, portability and gates: "`yarn validate` gates nothing" of the board's; "a per-project config file with defaults when absent and an unmapped-status bucket"; determinism: "full recompute from committed state; idempotent".

## 2. Decisions

### 2.1 Taken

- **D126.1 (agent-ruled, 2026-10-17): the waiting-on line comes from the Needs-first cell.** That cell is this queue's established waiting-on carrier (live rows carry `owner says go`, `her read on glass`, `the build phone's return (her access)`), so the reader surfaces its text for OWNER-LED rows instead of inventing a marker inside the Status cell. A `Waiting on:` prose marker split was rejected: the Status cell truncates at 140 characters in `statusText`, so a marker late in a long cell is chopped, and every future landing session would have to learn new syntax. The Status cell keeps carrying the landing date and the recommendation.
- **D126.2 (agent-ruled, 2026-10-17): the badge text is `Awaiting owner`.** It replaces `Owner steered` for OWNER-LED rows only. The ruled shape says the row must read as awaiting her; a past-tense badge contradicts it. The column keeps its elected name `Owner-led` (row 56's design); the badge is the per-card affordance the row names.
- **D126.3 (agent-ruled, 2026-10-17): the waiting-on line is `waiting on <text>`, `waiting on her ruling` when the cell is empty, `nothing` or digits-only.** The reader emits `waitingOn: string | null` (null in those three cases and for every non-OWNER-LED ticket); the template renders the line from it, styled with the existing `--violet` token in the board's mono face. No new colour token and no new layout element beyond the one line.
- **D126.4 (agent-ruled, 2026-10-17): `displayColumn` never diverts an OWNER-LED row to Blocked.** The ruled shape pins the row's place ("it stays visible in her column"); an unmet need chip still renders on the card, so the need is not hidden, only the placement is corrected.
- **D126.5 (agent-ruled, 2026-10-17): the never-counted-as-done pin is a red-first fixture row whose Status cell prose contains the word DONE.** A landed cell reads like `the work is DONE pending her word`, so the fixture hardens the pin against the `includes('DONE')` mutant, and the mutation pass reddens that mutant on record.
- **D126.6 (agent-ruled, 2026-10-17): the generator's tests are a `node --test` suite at `board/tests/reader.test.mjs`, born in this ticket.** Row 56's D63 ruled no Jest suite and `yarn validate` gating nothing; that ruling stands (biome skips `board/`, jest never matches `.mjs` under `board/`, `scripts/check-changed-coverage.js` keeps the `board/` UNMEASURED entry). The suite runs by its own command, in this plan's steps and its break script. `reader.mjs` gains `export` on the pure functions plus a symlink-safe script guard so the suite can import it without running `main`, and `main` is exported and called in-process with a stubbed `process.exit`, which keeps every touched line coverable by `node --test --experimental-test-coverage`. A spawn check stays in the suite as the running-it proof of D63.
- **D126.7 (agent-ruled, 2026-10-17): `schemaVersion` stays 1.** The new ticket fields (`awaitingOwner` on every ticket, `waitingOn` where it applies) are additive; the only consumers are the in-tree template (truthiness-guarded, degrades to today's rendering on an old board.json) and the new suite. An old template on a new board.json ignores the fields. A bump was rejected because nothing breaks across the mix.
- **D126.8 (agent-ruled, 2026-10-17): every ticket carries `awaitingOwner: boolean`, and `waitingOn: string | null`.** A uniform shape beats OWNER-LED-only fields: the template branches on a boolean that always exists, and the emitted key order stays fixed per the reader's determinism rule.
- **D126.9 (agent-ruled, 2026-10-17): the two live confusions she reported (a machine wait reading as Blocked with no distinction, and a ruled-but-unstarted row under a stale badge) are outside this ticket.** The ruled deliverable is the OWNER-LED rendering rule; a badge-semantics overhaul for other statuses is named in the lane's report as its own candidate row and is not built and not queued here.

Planner-taken mechanics, each the settled consequence of a recorded ruling: the reader's stdout line stays byte-identical; `waitingLine` bounds its text at 140 characters like `statusText`; the five-field DONE-table branch in `main` gains the two new fields on its literal ticket object so the shape stays uniform; tests never assert the real `generatedAt` value (the board stamps it live by design) and never pin `activeNow` (the fixture passes `--db` to a nonexistent path so it answers false deterministically).

### 2.2 The executor must not decide

- The badge wording, the waiting-on line wording, or any styling value beyond the one `.waiting` class this plan gives verbatim. A wording or face question stops work with the quote from section 1.
- Any file outside `board/reader.mjs`, `board/index.html`, `board/tests/reader.test.mjs`, the plan folder, the queue row's Status cell, and the three version files.
- Any new dependency, any package.json script, any change to `board/server.mjs`, `board/config.json`, `board/docker-compose.yml`, `biome.json`, `scripts/check-changed-coverage.js`, or the jest configuration. The board's outside-the-gates ruling is not the executor's to revisit.
- If `node --test --experimental-test-coverage` prints a table shaped other than `file | line % | branch % | funcs % | uncovered lines`, stop and report the printed table.

## 3. Pre-flight

`scripts/preflight-126.sh` in this folder. The executor saves a copy to `$TMPDIR` and runs the saved copy with the lane worktree as the working directory. It checks: the worktree on `lane/126` off a `uat` at or past `7e029a34`, a clean tree, `origin` fetched, the version at least 2.0.958, every anchor count exactly 1, node 24+, and the suite's baseline command failing on today's tree (the suite does not exist yet). It ends `PREFLIGHT OK`.

## 4. Background the executor needs

### Code map (every file read or changed)

Changed:

- `board/reader.mjs` (393 lines). The generator. `parseQueue` splits queue rows and counts `doneOrders` from cells that start with `DONE`; `mapStatus` maps a Status cell to status, column and `statusText` (collapsed, 140 characters); `parseNeeds` keeps digits only; `ticketFromOpenRow` builds one ticket; `main` reads the queue file, emits `board.json` and exits. Anchored at `scripts/anchors/`.
- `board/index.html` (307 lines). The template. `displayColumn` places a ticket (Blocked diversion for unmet needs), `stateWord` words the badge, `reasonOf` renders `statusText`, `cardEl` assembles the card. Anchored at `scripts/anchors/`.
- `board/tests/reader.test.mjs` (new). The generator's test suite: fixture row, reader field tests, done-count pin, determinism check, template parse and wording checks, in-process `main` runs, and the spawn check.

Read, unchanged:

- `board/server.mjs`. Spawns `node board/reader.mjs` per reconcile tick and streams state bytes; the guard must keep that spawn running `main` exactly once.
- `board/config.json`. Defaults for port, host, reconcile cadence, Done column count. Not touched.
- `scripts/check-changed-coverage.js`. Its `board/` UNMEASURED entry is the confirmation the new suite stays outside the validate gates.
- `biome.json`. Its `!**/board` skip is why the suite's `.mjs` needs no lint wiring.
- `ai/plans/README.md`. The queue the reader parses; only row 126's Status cell changes, at Finishing.

### How the pieces interact

The server spawns the reader; the reader rewrites `board/state/board.json` from the committed queue, plan folders and two machine-local caches; the template fetches it and renders columns. The template is the only `board.json` consumer. Additive fields flow reader to template only.

### Existing tests and what each proves

None for the board: row 56's D63 ruled the proof of board code is running it against this repository, and no suite exists anywhere for `board/`. This ticket births the suite; the fixture row named in the row's recommendation lives in it.

### Why the obvious fix is wrong

- A template-only fix (a fixed `awaiting her ruling` string) leaves the reader discarding her own waiting-on words, so the card cannot name the decision, and it satisfies neither the fixture row nor the done-count pin, both of which are generator-side by the row's wording.
- Parsing a `Waiting on:` marker out of the Status cell puts the payload inside the 140-character `statusText` truncation and invents syntax every landing session must repeat without a guard.
- Moving the waiting-on into a new queue column changes the queue's table shape, which every workflow file and the reader's 5-or-7 field split already depend on. Out of proportion to the ruled need.

## 5. Design

The approach in one sentence a test can check: a ticket whose Status cell starts with `OWNER-LED` always renders in the Owner-led column carrying `awaitingOwner: true`, its recommendation as `statusText`, its Needs-first cell text as `waitingOn` (null when that cell is empty, `nothing` or digits-only), never enters `doneCount`, and the template words its badge `Awaiting owner` with a distinct waiting-on line under the recommendation.

Alternatives rejected: D126.1's marker split, D126.6's Jest-inside-the-gates harness (breaks the owner's gates-nothing ruling), a `board/` split into `lib.mjs` plus a CLI shell (a bigger restructure than the ruled need; the export-plus-guard keeps one file and the spawn proof).

Concurrency: none. One reader process per reconcile tick, idempotent full recompute; the suite's determinism test runs `main` twice in-process and asserts the `tickets` arrays deep-equal.

Design review: the additive fields cannot change any other row's rendering (every other status maps `awaitingOwner` false, `waitingOn` null); the Blocked diversion change is guarded to OWNER-LED alone, so Blocked and Deferred placements are untouched; the fixture's DONE-bearing prose is the only place the pin could be weakened, and the mutation pass covers it.

**Acceptance criteria:**

- [R1.1] WHEN the reader runs on a queue whose OWNER-LED row carries a recommendation in its Status cell and a waiting-on line in its Needs-first cell THE SYSTEM SHALL emit that ticket with column `Owner-led`, `awaitingOwner` true, `statusText` holding the collapsed cell text after the phrase, and `waitingOn` holding the collapsed Needs-first cell text bounded at 140 characters.
- [R1.2] WHEN an OWNER-LED row's Needs-first cell is empty, `nothing`, or digits-only THE SYSTEM SHALL emit `waitingOn` null for that ticket.
- [R1.3] WHEN the reader computes `doneCount` THE SYSTEM SHALL count only rows whose Status cell starts with `DONE`, so an OWNER-LED row whose cell prose contains the word DONE is never counted and never lands in the Done column.
- [R1.4] WHEN the template places an OWNER-LED ticket with unmet needs THE SYSTEM SHALL keep it in the Owner-led column and still render its unmet needs chips.
- [R1.5] WHEN the template renders an OWNER-LED ticket THE SYSTEM SHALL show the badge `Awaiting owner`, the recommendation as the reason line, and a distinct waiting-on line `waiting on <waitingOn>`, or `waiting on her ruling` when `waitingOn` is null.
- [R1.6] WHILE `mapStatus` maps every Status phrase THE SYSTEM SHALL place OWNER-LED rows exactly as before this change (status `OWNER-LED`, column `Owner-led`, `statusText` from the cell remainder), changing nothing for any other status.
- [R2.1] WHEN the break script applies its named mutants to `board/reader.mjs` and `board/index.html` THE SYSTEM SHALL fail the suite under every mutant and pass again after each restore.
- [R2.2] WHEN the suite parses `board/index.html` THE SYSTEM SHALL compile its inline script with `node:vm` without syntax error.
- [R2.3] WHEN the suite asserts the template's ruled wording THE SYSTEM SHALL find `Awaiting owner` present and `Owner steered` absent in `board/index.html`.

## 6. Steps

Checklist:

- [x] Step 1: the OWNER-LED render through generator, template and suite ( Weight: 2 )

### Step 1: the OWNER-LED render through generator, template and suite

**Requirements:** R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R2.1, R2.2, R2.3

**Weight:** 2

Anchor check: every file under `scripts/anchors/` counts exactly 1 in its source file by the plan's count command.

Goal: an OWNER-LED row reads as awaiting her on the board, and the generator's suite pins it.

Branch: `feat/126-owner-led-render` off `uat`.

Files: `board/reader.mjs`, `board/index.html`, `board/tests/reader.test.mjs` (new), plus this plan folder's `PLAN.md` and `LOG.md`, the queue row's Status cell set verbatim to `IN PROGRESS, step 1 (plan at ai/plans/126-owner-led-render)`, and the three version files.

Red: write `board/tests/reader.test.mjs` with the tests below, run `node --test 'board/tests/*.test.mjs'` from the worktree root (quote the glob; a bare directory form misruns on node 24), and record every failing name. The suite does not import cleanly today (the reader exports nothing and `main` runs at import), which is itself the first red: the runner reports the import error and every test in the file fails.

The suite's shape: one fixture builder writes a scratch repository (a temp directory holding `ai/plans/README.md` with the fixture queue, `package.json` with `9.9.9`, an empty state directory and an empty handoffs directory); the fixture queue carries four rows verbatim:

```
| 901 | Fixture investigation | The full brief sits in history | DONE 2026-10-16, audited: the answer landed and shipped | nothing |
| 902 | Fixture owner ruling | The full brief sits in history | OWNER-LED 2026-10-17: the investigation answers, the recommendation is adopt option B; the work is DONE pending her word | her ruling on option B |
| 903 | Fixture plain row | The full brief sits in history | NOT PLANNED 2026-10-17 | nothing |
| 904 | Fixture waiting silent | The full brief sits in history | OWNER-LED 2026-10-17: the recommendation is keep the current design; nothing further to measure | nothing |
```

plus one five-field DONE row `| 905 | Fixture archived | DONE 2026-10-15 |` (three cells, the DONE-archive table's shape; the double-empty-cell form splits into seven fields and never reaches the five-field branch), so the DONE-table branch of `main` covers the uniform-shape change. The fixture's done count is 2: rows 901 and 905.

The tests, each with what it proves and its red failure:

1. `owner-led row carries awaitingOwner, column and waiting text` (R1.1): run `main` in-process on the fixture with `--db <nonexistent>`, stubbed `process.exit` capturing the code; read the emitted `board.json`; assert ticket 902 has `status 'OWNER-LED'`, `column 'Owner-led'`, `awaitingOwner === true`, `statusText` starting `2026-10-17: the investigation answers, the recommendation is adopt option B`, `waitingOn === 'her ruling on option B'`, `needs []`. Red today: the import fails before any assertion.
2. `owner-led row with silent needs cell answers waitingOn null` (R1.2): ticket 904 asserts `waitingOn === null` and `awaitingOwner === true`, and the suite imports `waitingLine` and unit-asserts its three null answers: `waitingLine('')`, `waitingLine('nothing')` and `waitingLine('118')` each return null while `waitingLine('her ruling on option B')` returns the text. Red today: import failure.
3. `owner-led row never counts as done though its prose names DONE` (R1.3): assert `doneCount === 2` (rows 901 and 905, never 902) and ticket 902 exists in `tickets` with column `Owner-led`. Red today: import failure; the mutant form of this test is the never-counted pin.
4. `every ticket carries the uniform owner fields and no other status moves` (R1.1, R1.6, D126.8): each of the emitted tickets, the five-field 905 included, has `awaitingOwner` boolean and `waitingOn` null-or-string; 901, 903 and 905 carry `awaitingOwner === false` and `waitingOn === null`; and the three keep their today mapping: 901 status `DONE` column `Done`, 903 status `NOT PLANNED` column `Backlog`, 905 status `DONE` column `Done`. Red today: import failure.
5. `recompute is idempotent` (row 56's determinism rule): run `main` twice on the same fixture; the two `tickets` arrays deep-equal and the second run's stdout line matches `board.json written: 5 tickets, 2 done, generatedAt `. Red today: import failure.
6. `unreadable queue exits 1 with the stderr line` (covers `main`'s failure branch): run `main` in-process with `--repo <empty temp dir>`; the exit stub records code 1 then throws (`process.exit = (code) => { exitCode = code; throw new Error('exit ' + code); }`, the test catching that throw, because a record-only stub lets `main` continue into `parseQueue(undefined)` and crash elsewhere), and `process.stderr.write` is stubbed to capture the line, restored after; assert the captured line contains `board-reader: cannot read`. Red today: import failure.
7. `spawned reader writes the same board` (D63's running-it proof): spawn `node board/reader.mjs --repo <fixture> --state <tmp> --handoffs <tmp> --db <nonexistent>`, assert exit 0 and the stdout line, then assert the spawned `board.json` deep-equals the in-process run's `tickets`. Red today: import failure.
8. `template script parses` (R2.2): read `board/index.html`, slice between the last `<script>` and `</script>`, `new vm.Script(slice)` compiles. Red today: passes; it guards the edit that follows, so record it green-before-edit only when the runner reaches it, and its mutant form reddens in the break script. If the red run cannot reach it (import failure first), record the import failure as its red line.
9. `template words the badge and the waiting line` (R1.5 wording, R2.3): the template source contains `Awaiting owner`, contains `waiting on `, no longer contains `Owner steered`, and still carries the wiring line verbatim: `if (ticket.awaitingOwner) card.append(waitingEl(ticket));`. Red today: `Awaiting owner` is absent, `Owner steered` is present.
10. `displayColumn never blocks an owner-led row` (R1.4, proven at the generator boundary because the placement rule lives in template code): the template source's `displayColumn` expression contains an OWNER-LED exclusion beside the DONE exclusion. Red today: the expression excludes DONE only. This is a source assertion because the template has no DOM harness; the running-it proof covers the render.

Change contracts, verbatim:

In `board/reader.mjs`:

- Add `export` to `parseQueue`, `mapStatus`, `parseNeeds`, `ticketFromOpenRow`, `waitingLine`, and `main` (the function declarations only; no behaviour change).
- Add this helper under `parseNeeds`:

```js
function waitingLine(needsCell) {
  const text = collapse(needsCell);
  if (text === '' || /^nothing\.?$/i.test(text) || /^\d+(,\s*\d+)*$/.test(text)) return null;
  return text.slice(0, 140);
}
```

- In `ticketFromOpenRow`, add one local and two fields to the returned object, `column` first, then the new pair, then `needs`:

```js
  const awaitingOwner = mapped.status === 'OWNER-LED';
```

```js
    column: mapped.column,
    awaitingOwner,
    waitingOn: awaitingOwner ? waitingLine(row.needsCell) : null,
```

- In `main`'s five-field DONE branch, extend the literal ticket object with `awaitingOwner: false,` and `waitingOn: null,` after its `column: 'Done',` line.
- Replace the file's last line `main(process.argv.slice(2));` with:

```js
const invokedAsScript =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
if (invokedAsScript) main(process.argv.slice(2));
```

- Extend the `node:fs` import list with `realpathSync` and the `node:path` import with a `node:url` import for `pathToFileURL`, both beside the existing imports. `server.mjs` spawns the reader by absolute path, so the spawn path keeps running `main` exactly once.

In `board/index.html`:

- `displayColumn` becomes:

```js
  const displayColumn = (ticket) =>
    ticket.status !== 'DONE' && ticket.status !== 'OWNER-LED' && unmetOf(ticket).length > 0 ? 'Blocked' : ticket.column;
```

- In `stateWord`, replace the `Owner steered` return with `if (ticket.status === 'OWNER-LED') return 'Awaiting owner';`.
- Beside `reasonOf`, add:

```js
  function waitingEl(ticket) {
    const line = ticket.waitingOn === null ? 'her ruling' : ticket.waitingOn;
    return el('div', 'waiting', 'waiting on ' + line);
  }
```

- In `cardEl`, after the reason line append and before the needs chips block, add:

```js
    if (ticket.awaitingOwner) card.append(waitingEl(ticket));
```

- In the stylesheet, beside the `.context` rule, add:

```css
  .waiting { font-family: var(--mono); font-size: 10.5px; line-height: 1.5; color: var(--violet); }
```

Green: `node --test --experimental-test-coverage 'board/tests/*.test.mjs'` passes every test; the coverage table's `reader.mjs` row lists uncovered line numbers, and none of them falls inside the ranges this step touched (the exported declarations, `waitingLine`'s body, the two ticket fields, the five-field branch's two new lines, and the guard block at the file foot). Record the table in `LOG.md`. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0 (the board sits outside both; the check confirms the step changed nothing they read).

Break script: `scripts/break-126.sh` in this plan folder. It applies six mutants to the working tree one at a time, runs `node --test 'board/tests/*.test.mjs'` after each expecting a failed run, and restores the file before the next. Each mutant's substitutions run as one perl program against one pristine backup, so a multi-substitution mutant never overwrites its own backup. It ends `ALL AS EXPECTED: 6`.

- M1, `board/reader.mjs`: in one perl program, `statusCell.startsWith('DONE')` becomes `statusCell.includes('DONE')` and `status.startsWith('DONE')` becomes `status.includes('DONE')`. Tests 3 and 5 redden.
- M2, `board/reader.mjs`: the STATUS_MAP line `['OWNER-LED', 'Owner-led'],` becomes `['OWNER-LED', 'Blocked'],`. Tests 1 and 3 redden.
- M3, `board/reader.mjs`: in `waitingLine`, the final `return text.slice(0, 140);` becomes `return null;`. Test 1 reddens (902 loses its waiting text; test 2 stays green by construction, its own assertion being null).
- M4, `board/reader.mjs`: `const awaitingOwner = mapped.status === 'OWNER-LED';` becomes `const awaitingOwner = false;`. Tests 1 and 2 redden (the uniform-shape test 4 and the spawn-parity test 7 stay green under M4 by construction).
- M5, `board/index.html`: `Awaiting owner` becomes `Owner steered`. Test 9 reddens (test 10's displayColumn exclusion survives M5 by design).
- M6, `board/index.html`: the wiring line `if (ticket.awaitingOwner) card.append(waitingEl(ticket));` becomes `if (false) card.append(waitingEl(ticket));`. Test 9 reddens on its verbatim wiring assertion.

After the last restore, `git status --porcelain` lists only this step's files and the plan files, and `node --test 'board/tests/*.test.mjs'` passes clean.

Version and commit: fetch `origin` under the version lock, take the next patch after `uat`'s `package.json`, set it in `app.json` first, then `package.json` (the worktree carries no `android/`; the lockstep test takes its absent-file branch there, and the main tree's `android/app/build.gradle` syncs at the merge). Commit message: `<VERSION> - feat(board): an OWNER-LED row reads as awaiting the owner (126)`. The hook's `Tests:` line ends `passed, <n> total` and the four `100%` coverage lines are present.

Review: read `git show <sha>` cold against this checklist: the reader's stdout line is byte-identical; `statusText`, `needs`, `needsMet` and every other field of every other status are unchanged (the fixture's 901, 903 and 905 prove it); the template renders no waiting line for any non-OWNER-LED ticket; no dead code and no comment explaining what.

Merge: `git checkout uat` in the worktree is not the lane shape; merge per the lane rules into `uat` in the main tree under `uat.lock`, `--no-ff`, message `<VERSION> - merge feat/126-owner-led-render: ticket 126 step 1`, then sync the main tree's `android/app/build.gradle` `versionName` under the build lock.

Done when: the checklist box is ticked, `LOG.md` carries the step entry with the hook lines and the break script's last line, and the ticket reads `EXECUTED` in the queue.

## 7. Device proof

None. No device, no build. The running-it proof is the suite's spawn test plus the owner reading the live board at `http://127.0.0.1:8788` after the merge.

## 8. Records

The `LOG.md` step entry per the ledger contract in `ai/plans/TEMPLATE.md` (heading `### Step 01 — executed`, closing `session: <ses_id>` line), with the measured values: the red lines recorded per test, the coverage table's `reader.mjs` row, the break script's `ALL AS EXPECTED: 6`, and the merge sha.

The queue cell the lead applies on DONE, for row 126's Status column:

`DONE 2026-10-17, audited: the board's OWNER-LED rows read as awaiting her - the badge words Awaiting owner, the recommendation stays the reason line, the Needs-first cell's own words render as a distinct violet waiting-on line (her ruling when the cell is silent), the row keeps its Owner-led column whatever its needs say, and the never-counted-as-done rule is pinned red-first in the generator's new node:test suite (board/tests/reader.test.mjs, born here) whose fixture row's prose names DONE so the includes mutant reddens; six mutants in the break script, all red`

The docs commit message: `<VERSION> - docs(plans): ticket 126 executed: the OWNER-LED render and its suite`.

What the owner sees on the live board for an OWNER-LED row after this lands: the violet badge `Awaiting owner`, the recommendation sentence as the card's reason, and under it a violet mono line `waiting on her ruling on option B` shaped from the row's own Needs-first words.

## 9. Push

None. The executor never pushes; the orchestrator pushes `uat` after the audit.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| The runner reports every test failed with an import error at red time | expected: the reader exports nothing today | that import failure is the recorded red; the green run lands after the export contract |
| The coverage table prints no `reader.mjs` row | the suite imported nothing from it | confirm the `export` keywords landed; the guard must not wrap the exports |
| A mutant stays green | the break's substitution missed the line (whitespace drift) | STOP: the plan's substitution does not match the code; return `NEEDS_CONTEXT: NEEDS REPLAN` with the sed output |
| The pre-commit hook prints no `Tests:` line | the worktree's husky shim is absent | run `yarn install` in the worktree under `commit.lock`, then commit again; never commit unhooked |
| `main` runs during import in the suite | the guard's realpath comparison failed (symlinked worktree) | compare `realpathSync(process.argv[1])` against `realpathSync(fileURLToPath(import.meta.url))`, never the raw strings |

Anticipated review fixes, word for word: none named. A reviewer finding the `.waiting` class line-height or colour off the board's token ladder: that is the owner's face call, recorded for her read, not a code fix.

## 11. Subagents

Planning: this session. Delivery: the lead dispatches `athan-executor` for step 1 and the `athan-reviewer` pair (plan-conformance and blind) for the audit. Every worker may call `vision` for an image it cannot see. Nothing else.

## 12. Report to the owner

The board now renders an OWNER-LED row as her decision to make: badge `Awaiting owner`, the recommendation, and the waiting-on line in her own words from the row, pinned by the generator's first test suite with a mutation pass on the never-counted-as-done rule. Two live confusions she reported sit outside this row and are named in the lane report: the machine-wait row that reads as Blocked with no distinction, and the ruled-but-unstarted row under a stale badge; a badge-semantics pass for the other statuses is its own candidate row. No device, no build; her read of the live board is the face acceptance.
