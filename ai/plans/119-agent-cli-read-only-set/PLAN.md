# Ticket 119 - The agent CLI: the read-only set lands in ai/AGENTS.md

## Header

| | |
| --- | --- |
| Brief | row 119 in `ai/plans/README.md` (the owner's order and her option-B ruling); this folder |
| Planned at | `uat` `d1ce39d9` (2.0.924), 2026-10-16 |
| Planned by | lane 119 (athan-lane), from the owner's option-B ruling taken 2026-10-16 |
| Needs first | nothing (her ruling is taken) |
| Parent | none |
| Group | none open: `ai/AGENTS.md` is disjoint from lane 111 (`ai/plans/111-sdk58-stable-repin/`, `e2e/README.md`, devices) and lane 120 (`shared/notifications.ts`, `hooks/`, its plan folder). The queue row and the version files serialize under their locks and never count as overlap. |
| Batch budget | 1 |
| Session budget | 2 |
| Steps | 1 (step 1 the `ai/AGENTS.md` landing) |
| Device | none. No device contact, no builds, nothing installed. |
| Owner decisions still needed | none. The option-B ruling is taken; every remaining question is agent-ruled in section 2. |

## 1. Goal

The investigation (folded into row 119) measured the whole `@expo/agent-cli` surface at 1.0.19
and the owner ruled option B: the read-only set. Today `ai/AGENTS.md` routes only `status` and
`smoke --ios`, and its `@expo/agent-cli` bullet bans five things (`--eas`, `deploy`,
`agents:setup`, `skills:sync`, `smoke --android` while a phone is connected) while the
investigation measured a wider banned set.

When DONE, `ai/AGENTS.md` routes four more measured reads (doctor, typecheck, `docs:sync` and
`docs:search`, `npx expo command:ps` and `command:events`) and the `@expo/agent-cli` bullet
opens with the routed-reads allowlist and names every measured ban: the five above plus
`skills:clean`, `install`, `new`, `feedback`, `login`, `logout`, `register`, `whoami`,
`status --explain` and `--device`. The owner notices the next session routing a health check
or a docs lookup from the table alone.

The owner's rules that apply: EAS is read-only (hard rule); never `npx expo install --fix`
(hard rule); installing dependencies is ask-first (hard rule) and this ticket installs
nothing; the version trio bumps on every commit, `app.json` first (hard rule); the ticket's
documentation dies with its merge (hard rule).

## 2. Decisions

### 2.1 Taken

| What | Who | When | Recorded |
| --- | --- | --- | --- |
| Option B, the read-only set: four routing rows and one widened ban line in `ai/AGENTS.md`, nothing installed | the owner | 2026-10-16 | row 119's status cell |
| D1 The typecheck row names the gate in its Task cell (`tsc only, not the gate`) | agent-ruled | 2026-10-16 | this section |
| D2 The four rows sit directly under the existing agent-cli status row | agent-ruled | 2026-10-16 | this section |
| D3 The ban paragraph carries an explicit allowlist naming the six routed reads, not a reference to the table | agent-ruled | 2026-10-16 | this section |
| D4 `install` is banned wholesale, no carve-out for `install --check` | agent-ruled | 2026-10-16 | this section |
| D5 No frozen counts in the landed wording (no check tally, no millisecond figure) | agent-ruled | 2026-10-16 | this section |
| D6 Grounds ride only the two invisible dangers (`--eas`, and the parentheticals on `status --explain` and `--device`); every other ban stands bare | agent-ruled | 2026-10-16 | this section |
| D7 One docs step lands rows and ban together | agent-ruled | 2026-10-16 | this section |

D1: options were the Task cell carrying `(tsc only, not the gate)` against a bare
`Quick type check`. Took the first. For: a passing typecheck read as the gate erodes
`yarn validate`, the one gate the file names. Against: the gate keeps its own row, so the
clause repeats it. Challenged once: the repetition costs one line of law text and the
failure mode is real, so it survives.

D2: options were family adjacency under the status row against appending at the table's end.
Took adjacency. For: the table is a routing map and the Expo family belongs in one block.
Against: `command:ps` is Expo CLI, not agent-cli, so the block mixes two tools. Challenged
once: the row's Tool cell names `npx expo`, which removes the ambiguity, so adjacency
survives.

D3: options were naming the six reads in the bullet against writing `the routing table's
reads only`. Took the names. For: the law text survives a future table reflow, and today's
bullet already names its allowed commands. Against: duplication. Challenged once: law that
points at another table to know what it permits breaks when the table is edited, so the names
survive.

D4: options were the wholesale ban against a carve-out for `install --check`. Took the
wholesale ban. For: the command's family writes `package.json` and `yarn.lock` and forwards
every `expo install` flag including `--fix`, which the repo hard-bans; doctor's third check
already reports the pin mismatch a `--check` run would find. Against: `--check` itself
installs nothing. Challenged once: no route needs the read, and a carve-out is a second law
to maintain, so the wholesale ban survives.

D5: options were wording free of frozen counts against carrying the investigation's tallies.
Takes the count-free wording. For: the counts drift (16 of 20 checks green at the
investigation, 17 of 20 today; typecheck 738 ms then, 1241 ms now) and law text must not go
stale. The measured grounds live in row 119 and in section 4 here. Uncontested.

D6: options were grounds on the two invisible dangers against grounds on every name. Took the
two. For: the existing bans stand bare, and twelve grounded names would double the paragraph.
Against: grounds teach. Challenged once: the queue row and this plan carry every ground, so
the file stays terse, and the two survive.

D7: options were one docs step against splitting rows and ban into two steps. Took one. For:
one file, one commit, one reviewable diff; the ruling names one landing. Uncontested.

### 2.2 The executor must not decide

- Any red or break count that differs from this plan's expected value: STOP and return both
  numbers.
- Any hook failure, missing `Tests:` line, or `node_modules` damage in the worktree: STOP.
- Any merge conflict into `lane/119`: `git merge --abort`, then STOP and name both sides.
- Any temptation to touch a file the step does not list, to run a write command of the CLI,
  or to install anything: the plan already decided all three (no, never, nothing).

## 3. Pre-flight

`scripts/preflight-119.sh`, committed in this folder. The executor saves a copy to `$TMPDIR`
and runs it from the worktree root. It checks the `lane/119` checkout, the clean tree, `uat`
contained in `HEAD`, the jest binary (the unhooked-commit defect of row 125), the version
floor 2.0.924, and both anchors counting exactly 1 in `ai/AGENTS.md`. It ends
`PREFLIGHT OK`. Before the dispatch the lane lands this plan's docs commit on `lane/119`,
merges it into `uat` under `uat.lock`, and rebases `lane/119` onto the new `uat`, so the
executor's first preflight run starts from a clean tree that contains `uat`.

## 4. Background the executor needs

### Code map

- `ai/AGENTS.md` `## Tool routing`: an 11-line table (header, separator, 9 rows). The step
  inserts 4 rows under the `Expo project status and smoke` row; the table becomes 15 lines.
  Anchor: `scripts/anchors/routing-table.md`.
- `ai/AGENTS.md` `## Device testing`, third bullet: the `@expo/agent-cli` law, 2 lines. The
  step replaces those 2 lines with 5. Anchor: `scripts/anchors/agent-cli-ban-paragraph.md`
  (its last two lines are the replaced text).
- `ai/plans/README.md` row 119: the status cell the step moves to `IN PROGRESS, step 1`.
- `app.json` (`expo.version`), `package.json` (`version`): the bump pair tracked in the
  worktree. The gitignored `android/app/build.gradle` `versionName` (main tree, line 96) is
  the lane's to sync after the merge, never the executor's.

### The measurements (re-derived live 2026-10-16, this machine, against `uat` `d1ce39d9`)

Engine versions: `npm view @expo/agent-cli version` and `dist-tags.latest` both printed
`1.0.19`; the three npx cache copies hold 1.0.19; `npx expo --version` in the repo printed
`58.1.10`; `package.json` carries no `@expo/agent-cli` dependency (nothing is installed).

1. Census: `npx @expo/agent-cli --help` prints 35 command names; `stop` is documented as an
   alias of `dev:stop`; 34 distinct.
2. `doctor` (`doctor:check`): "Run expo-doctor and normalize its report", exit 20 while any
   check fails, `--json` keys `passed, failed, checks, parse, projectRoot, exitCode, raw,
   followups`. Live run: exit 20, `Checks 17/20 passed`, `Failed 3`, every failure advisory
   in substance: the husky script conflict with `node_modules/.bin`, the app.json next to
   app.config.ts notice, and the pin class (jest 30.5.2 over ~29.7.0, @types/jest 30.0.0 over
   29.5.14, typescript 7.0.2 over ~6.0.3) that the repo runs ahead on purpose. The engine
   arrives through the npx cache (the run printed `will be installed: expo-doctor@1.21.5`);
   nothing enters `package.json`.
3. `typecheck`: the help text says "Read-only. It runs the project's own
   node_modules/.bin/tsc --noEmit and reports its diagnostics as data. No compiler is ever
   fetched." Exit codes 0, 20, 1. Live run: exit 0, `no type errors`, `Took 1241ms`.
4. `docs:sync` / `docs:search`: the cache sits at `~/.expo/agent-cli/docs`, measured 9.9M,
   SDK-matched (a live search walked `versions/v58.0.0/`). `docs:sync` downloads only
   changed bundles and defaults to the project's SDK (`--sdk <N>` overrides).
   `docs:search <query>` prints ranked hits with file and line; it syncs first when the cache
   is missing unless `EXPO_OFFLINE` is set. Live run (`docs:search layoutDirection --limit 4`):
   four ranked hits, each with an absolute path and line.
5. `npx expo command:ps` / `command:events` (@expo/cli 58.1.10): `command:ps` "Lists running
   and stopped sessions, newest first, with their command, project, and process status";
   `--json` prints a JSON array. Live run: the array held a live `expo run:ios` session in
   this repository. `command:events` "Replays retained events from running or stopped
   sessions as JSONL to stdout, oldest first"; `--tail` follows live events. Both are reads.
6. Ban grounds, each from the command's own `--help` on this machine:
   `--eas` on `smoke`: "Drive this project's EAS Simulator session; start one when none is
   up"; on `dev`: "Where it all runs: on EAS (build, EAS Simulator session, tunnel) or here";
   `navigate`, `runtime:stop` and `runtime:reload` carry the same flag. EAS Simulator is a
   paid EAS service, so the flag family is the money class.
   `deploy`: `--web` runs `eas deploy` to EAS Hosting (an EAS write); `--native` stops at a
   launch.expo.dev URL with the store steps in the browser.
   `agents:setup`: installs plugins and skills into a project or the user home and creates or
   updates `AGENTS.md` or `CLAUDE.md` - the governed `.agents/skills/` and this repository's
   own law file.
   `skills:sync`: "Link the installed packages' skills" into the agent directories (a no-op
   today: no installed package ships skills).
   `skills:clean`: "Remove the managed skill links".
   `install`: installs packages and forwards every `expo install` flag including `--fix`
   (hard-banned here); `add` is an alias.
   `new`: creates a new Expo project.
   `feedback`: "Send feedback to the Expo team" - outbound.
   `login`, `logout`, `register`, `whoami`: forwarded to `npx expo login`, acting on the
   `~/.expo` session the expo and eas CLIs share.
   `status --explain`: "a fresh answer from EAS about builds for this fingerprint" - an EAS
   service query.
   `status --device`: "For a physical iPhone this is the consent to launch the app on it";
   `dev --device` binds a simulator or an Android device by serial - both are phone contact
   outside the routed set and the device-lock family.
   `smoke --android`: boots and binds a local Android device; the existing ban (while a phone
   is connected) keeps its ground.

### Existing tests

None read `ai/AGENTS.md`; it is law text, not code. The pre-commit hook (lint-staged, jest,
coverage) runs on the step's commit and its `Tests:` line is the gate evidence.

### Why the obvious fix is wrong

Routing the whole surface, or copying the CLI's help into the file, would freeze a 1.0.x
experimental surface into law; the help itself marks commands experimental and free to
vanish. The generated `AGENTS.md` block (the investigation's option C) is worse: its own text
routes `install --fix`, `deploy` and lint, breaking three hard rules at once. The read-only
set plus the named bans is the measured minimum the owner ruled.

## 5. Design

The invariant, one sentence a script can check: after the step, `ai/AGENTS.md` contains the
four rows and the twelve ban names at their exact expected line counts and nothing else
moved - `scripts/break-1.sh` is that script.

Alternatives rejected: A, the status quo (the owner ruled against it); C, the generated
`AGENTS.md` block (breaks hard rules); naming all 34 commands in the bullet (law bloat, and
the allowlist already covers the unnamed rest).

Concurrency trace: none. One text file edited in one worktree; no runtime, no device, no
server.

Design review: the wording keeps every count out of the file (D5), keeps the allowlist
explicit (D3), and grounds only the two invisible dangers (D6). The table gains four rows and
loses none; the status row and the gate row stay byte-identical, which the break script
proves.

**Acceptance criteria:**

- [R1.1] WHEN a session reads the tool routing table in `ai/AGENTS.md` THE SYSTEM SHALL carry four new rows under the status row routing doctor, typecheck, `docs:sync`/`docs:search`, and `npx expo command:ps`/`command:events` at the exact texts the step's contracts give.
- [R2.1] WHEN a session reads the `@expo/agent-cli` bullet under Device testing in `ai/AGENTS.md` THE SYSTEM SHALL open with the routed-reads allowlist and name every ban in the step's contract: `--eas`, `deploy`, `agents:setup`, `skills:sync`, `skills:clean`, `install`, `new`, `feedback`, `login`, `logout`, `register`, `whoami`, `status --explain`, `--device`, and `smoke --android` while a phone is connected.
- [R3.1] WHEN the step's commit lands THE SYSTEM SHALL carry the next patch version off `uat` in `app.json` (`expo.version`) and `package.json` (`version`) alike, with the commit message starting `<VERSION> - `.
- [R4.1] WHEN `scripts/break-1.sh` runs from the worktree root after the change THE SYSTEM SHALL print `ALL AS EXPECTED: 1` with every row, name and table-line count at its expected value.
- [R5.1] WHEN the step's diff is read THE SYSTEM SHALL touch only `ai/AGENTS.md`, the row 119 cell of `ai/plans/README.md`, `app.json`, `package.json` and this plan folder, with `package.json` changed in its `version` field alone and nothing installed.

## 6. Steps

- [ ] Step 1 done: the `ai/AGENTS.md` landing (four routing rows, the widened ban paragraph),
      committed, merged to `lane/119` (`steps/1-agents-md-landing.md`, Weight 1; satisfies
      R1.1, R2.1, R3.1, R4.1, R5.1)

## 7. Device proof

None. The dispatch's scope fence forbids device contact and builds; the landing is text-only
and its proof is the break script plus the hook gates.

## 8. Records

The `LOG.md` entry the executor appends (values filled at run time):

```
### Step 01 — done
Branch docs/119-agents-md-rows, commit <sha>, version <VERSION>, merge <sha> on lane/119.
Hook: <the last Tests: line and the four coverage lines>.
Break: ALL AS EXPECTED: 1 (<the counts line count>).
Review: <verdict one line>.
session: <ses_id>
```

The queue cell the lead applies on DONE:

```
DONE 2026-10-16, audited: option B landed at <version> - ai/AGENTS.md routes the four
measured reads (doctor the advisory health check, typecheck the quick tsc read that is not
the gate, docs:sync/docs:search the SDK-matched docs lookup, npx expo command:ps and
command:events the dev-server session tables) and the @expo/agent-cli bullet opens with the
routed-reads allowlist and bans the measured set (--eas with its paid EAS Simulator ground,
deploy, agents:setup, skills:sync, skills:clean, install, new, feedback, login, logout,
register, whoami, status --explain, --device, and smoke --android while a phone is
connected); nothing installed, no other file moved; every read-only claim re-measured live at
@expo/agent-cli 1.0.19 and @expo/cli 58.1.10 before the wording was pinned (doctor 17/20
green today against 16/20 at the investigation; typecheck 1241 ms against 738 ms; the counts
stay out of the file)
```

The docs commit message: `<VERSION> - docs(plans): ticket 119 planned: the option-B landing, four routing rows and the widened ban set`.

## 9. Push

None. The executor and this lane never push. The orchestrator pushes `uat` when every
unpushed commit is audited.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| A red grep prints nonzero | The wording landed before this plan, or the file moved | STOP with both numbers; the lead decides replan or repair |
| A break count differs | The edit mangled a row or left a name out | Executor re-reads the two contracts, fixes the diff to byte-match, reruns the break |
| The hook prints no `Tests:` line | The worktree committed unhooked (row 125's defect) | Run `yarn validate` and the coverage check by hand, record both, then continue |
| A merge into `lane/119` conflicts | Two edits reached one file | `git merge --abort`, STOP, name both sides |
| A merge into `uat` conflicts on the queue or the version files | Lane weather | The lane aborts, rebases `lane/119` onto `uat`, keeps both rows and the higher version, retries once, then stops if it still conflicts |
| `npx @expo/agent-cli <read>` fails or writes into the repo | Version drift past 1.0.19 | STOP; the lane re-measures and replans the wording |

Anticipated review fixes, word for word: none. A reviewer finding a wording defect names the
line; the lane repairs it in the audit fix commit.

## 11. Subagents

Planning: `explore` for fact questions (none were needed; the lane measured directly); the
`athan-plan-griller` grills this draft. Delivery: the lead dispatches one `athan-executor`
for step 1 in the lane worktree, then two `athan-reviewer` passes (blind and
plan-conformance). Every worker may call `vision` for an image it cannot see; none applies
here.

## 12. Report to the owner

The ticket lands her option-B ruling: `ai/AGENTS.md` routes the four measured reads and the
`@expo/agent-cli` bullet names the full measured ban set. Nothing was installed and no other
file moved. Every claim was re-measured live at `@expo/agent-cli` 1.0.19 and `@expo/cli`
58.1.10 before the wording was pinned. The agent-ruled decisions ride in section 2.1 and the
lane's final report.
