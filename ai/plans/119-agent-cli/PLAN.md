# Ticket 119: The agent CLI: introduce @expo/agent-cli into the repository

| Field | Value |
| --- | --- |
| Brief | Queue row 119: investigate which @expo/agent-cli commands earn their place, which bans hold, and what agents:setup would change in this harness; she rules before any repo change |
| Planned at | `1ea6ceff` 2.0.875, 2026-10-16 |
| Planned by | lane 119 (agent-ruled frontier, standing hands-off order 2026-10-16) |
| Needs first | nothing |
| Parent | nothing |
| Group | none (docs-only; the queue row and the three version files serialize as lane weather) |
| Batch budget | 4 weight units |
| Session budget | 4 weight units (one lane session carries all four docs steps) |
| Steps count | 4 (all weight 1, docs) |
| Device | none (the row's own constraint: no device contact, no builds) |
| Owner decisions still needed | her ruling on the three options in section 5 (the row ends with her ruling; no repo change before it) |

## 1. Goal

Today the repo routes two commands of a CLI whose full surface nobody has measured:
`ai/AGENTS.md:27` routes `npx @expo/agent-cli status` / `smoke --ios`, and `ai/AGENTS.md:159`
bans `--eas`, `deploy`, `agents:setup`, `skills:sync` and `smoke --android` while a phone is
connected. Those bans were read from the SDK 58 release notes at planning 111, not measured
against the CLI itself.

When DONE, the queue row carries: the full command census at the pinned version, each command
classified (routed today, earns a place, banned with measured grounds), the bans re-derived
from the CLI's own help text and bundled source rather than release notes, the exact writes
`agents:setup` would make in this harness, three options with one recommendation for her
ruling, and the unverified list. No repo file outside `ai/plans/` changes before her word.

The owner's rules that govern, quoted:

- `ai/AGENTS.md:159`: "- `@expo/agent-cli`: `status` and `smoke --ios` only. Never `--eas`,
  `deploy`, `agents:setup` or `skills:sync`, and never `smoke --android` while a phone is
  connected."
- `ai/AGENTS.md:76`: "- EAS is read-only. Never build on EAS, never push to it. Reading
  configuration (`EXPO_PUBLIC_ENV`, `EXPO_PUBLIC_API_KEY`) is the whole permitted use. Builds
  happen locally on the OnePlus 3T and nowhere else."
- `ai/AGENTS.md:12`: ".agents/skills/ (repo root): the official Expo and EAS skills, and this
  repo's own workflow skills" - the directory `agents:setup` and `skills:sync` would write
  into is governed harness surface.
- Row 107's precedent: harness wiring (routing paragraphs, MCP flips, skill folders) lands by
  the owner's order, never by a lane's initiative.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who | When | Recorded |
| --- | --- | --- | --- | --- |
| D119.1 | Investigate version 1.0.19, npm `dist-tags.latest` at 2026-10-16; every claim verified against that version's `--help` output and its bundled source in the npx cache (`~/.npm/_npx/5dd0285af1583b84/node_modules/@expo/agent-cli`), with the installed `@expo/cli` 58.1.10 for the Expo CLI facts | agent-ruled | 2026-10-16 | here, FINDINGS sections 1 to 3 |
| D119.2 | Live-run allowlist for the whole row: `--help` on every command, `status`, `doctor`, `typecheck`, `skills:list`, `skills:show`, `docs:search`, `npx expo command:ps`, `npx expo command:events --help`. Never run: `dev`, `start`, `smoke`, `navigate`, any `runtime:*`, `install`, `deploy`, `agents:setup`, `skills:sync`, `skills:clean`, `new`, `login`, `logout`, `register`, `whoami`, `feedback`, any `--eas` flag, `status --explain` | agent-ruled | 2026-10-16 | here; why: no device contact and no builds this wave, the mutating and harness-writing commands are banned by the row and `ai/AGENTS.md`, and the EAS-service queries are not needed to answer the row's three questions |
| D119.3 | Evidence hierarchy: the CLI's own help text first, its bundled source second, the SDK 58 release notes last; anything only the release notes claim is marked unverified | agent-ruled | 2026-10-16 | here; why: the ticket demands verification against the installed CLI |
| D119.4 | The deliverable folds into the queue row; no findings file survives DONE (nothing in shipped code or config will cite it). Precedent: rows 65, 66, 118 | agent-ruled | 2026-10-16 | here, section 8 |
| D119.5 | The recommendation to her is option B (section 5), argued twice below | agent-ruled | 2026-10-16 | here, section 5 |
| D119.6 | Execution runs in the lane, no executor worker dispatched; the grill and both audit reviewers are dispatched as workers | agent-ruled | 2026-10-16 | LOG.md; why: all four steps are docs-weight measurement and writing with no red-green code loop, while the grill and the blind audit are exactly the worker jobs that add rigor |

### 2.2 The executor must not decide

- A `npm view @expo/agent-cli version` answer other than 1.0.19 at any step: STOP, the CLI
  moved under the row; the lead re-pins the plan to the new version before any further step.
- A live command printing something FINDINGS.md does not predict: STOP and report the exact
  divergence; never widen the allowlist to investigate it.

## 3. Pre-flight

`scripts/preflight-119.sh`, saved to `$TMPDIR` and run from there. It checks: the worktree is
on `lane/119` with a clean tree, `origin/uat` is fetched and the branch's merge base is at or
past `1ea6ceff`, the version in `package.json` is not lower than 2.0.875, every anchor under
`scripts/anchors/` counts exactly 1 in its source file, and `npm view @expo/agent-cli version`
prints 1.0.19. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Files this row reads (none changes outside the plan folder):

- `ai/AGENTS.md` - the routing table line 27 and the device-testing ban lines 158 to 160; the
  EAS hard rule lines 76 to 78; the `.agents/skills/` governance lines 11 to 17.
- `ai/plans/README.md` - row 119, the standing parallel order, the status law.
- `AGENTS.md` (root) - the redirect to `ai/AGENTS.md`; the file a managed block would land in.
- `.agents/skills/` - 157 git-tracked files across 23 skill folders (measured:
  `git ls-files .agents/skills/ | wc -l`); the collision target for `skills:sync` and the
  `expo/skills` installer.
- `package.json` line 43 - `"expo": "~58.0.12"`; the SDK the docs commands would target.
- `.opencode/agents/` - the four harness worker files; what "this harness" means here.

Facts planning already measured (evidence under `~/athan-gitree/sessions/119/cli-help/`, one
help file per command; dies at DONE):

- Version: 1.0.19 (`npm view @expo/agent-cli version`; dist-tags canary 1.0.18-canary.0).
  The package is not a repo dependency; `npx` fetches it per run.
- The census: 34 commands in six groups plus an Expo CLI fallback list (Develop, Understand,
  Debug, Create, Deployment, Agent setup, Learn, Feedback, Account).
- The workflow contract: exit codes 0 / 1 / 7 (needs a human) / 20 (outcome failed) /
  22 (inconclusive); every report command takes `--json` printing one object on stdout with
  progress on stderr; every help block names its JSON keys; errors carry a recovery line.
- `status` is read-only, "like git status; the only writes are this command's own caches under
  `.expo`" (gitignored, `.gitignore` line 1). `--explain` "asks the service" (EAS) and
  `--explain --device <phone>` launches the app on that phone.
- `smoke` runs nine phases: it starts a dev server and boots a device when there is none,
  builds the development build when the project has none, reloads, evaluates, collects errors,
  photographs, and "stops exactly what it started". `--eas` drives an EAS Simulator session
  and "start[s] one when none is up".
- `dev` plans then runs prebuild / build / serve; a cloud build (`eas build`) is picked when
  this machine cannot build; `--eas` is "build, EAS Simulator session, tunnel... bills until
  stopped"; the project can pin `package.json` `expo.agent-cli.buildBackend` (local or eas).
- `deploy` is `expo export --platform web` then `eas deploy` (EAS Hosting), or `--native` a
  launch.expo.dev store flow that exits 7 for a person.
- `doctor` "runs expo-doctor --verbose as a subprocess and normalizes what it printed"; the
  source confirms a fallback to `npx expo-doctor` (`build/cli/5565.index.js` comment at the
  `resolveTypeScriptCli` function); the repo has no expo-doctor binary in `node_modules/.bin`.
- `typecheck` runs "the project's own node_modules/.bin/tsc --noEmit" with `--pretty false`,
  one line per diagnostic; "No compiler is ever fetched".
- The detector package `agent-cli-detector@0.1.7` (transitive in this repo's yarn.lock)
  officially detects OpenCode (README table: `opencode`; "OpenCode 1.0.19 and later is
  detected from environment variables by default").
- The CLI's own agent table (`build/cli/2461.index.js`, the `AGENTS` array): the opencode entry
  is `skillsDir: '.agents/skills'`, `projectMarkers: ['.opencode']`,
  `homeMarkers: ['.config/opencode']` - this repo matches on the project marker and the home
  marker.
- The `agents:setup` installer for every agent except claude-code and user-scope codex is
  `npx skills add expo/skills --skill '*' --agent <id> --yes` (the `buildInstallerPlans`
  function in `build/cli/271.index.js`), i.e. the vercel-labs `skills` CLI writing the
  expo/skills repository into `.agents/skills`.
- The `agents:setup` managed block (the `generateAgentsMdBlock` function in
  `build/cli/271.index.js`): wrapped in `<!-- Generated by `npx @expo/agent-cli agents:setup`.
  ... -->` markers, its Commands section instructs "use `@expo/agent-cli` in place of the
  equivalent commands elsewhere in this file or in loaded skills" and lists, among others,
  `install --fix`, `deploy` and `lint` - two of which this repo hard-bans and one it never
  uses (Biome owns lint). Setup also rewrites "supported Expo CLI and expo-doctor commands to
  agent-cli" in the target instruction file and downloads the SDK docs.
- `skills:sync` links only symlinks it created, skips a file of your own with the same name,
  and refreshes an AGENTS.md skill index. `skills:list` in this repo today prints "No agent
  skills found in the project dependencies." (measured in the main tree 2026-10-16).
- Expo CLI 58.1.10 (installed in this repo): `npx expo command:ps` prints a TSV of every
  Expo CLI session on the machine with PID, status, command, project path, port, URL
  (measured: it listed lane 117's export:embed sessions and a live run:ios); `npx expo
  command:events` "replays retained events from running or stopped sessions as JSONL".

How the pieces interact: the CLI is a wrapper that resolves, plans and drives the same Expo
toolchain this repo already runs (`expo start`, `expo run:*`, expo-doctor, EAS CLI), adding
the agent-facing contract (exit codes, JSON, recovery lines) on top. Nothing in it replaces
this repo's owned paths: `yarn validate` remains the gate, `build-prod.zsh` / `build-mock.zsh`
remain the device builds, agent-device and Maestro remain the device drivers, `.agents/skills`
remains the curated skill set.

Why the obvious adoption is wrong: running `agents:setup --project` looks like the intended
one-command adoption, but it writes into the two files this repo governs hardest - the
instruction file every session loads first and the skill directory `ai/AGENTS.md:12` names -
and the generated text routes commands the owner has banned. The measurement above is the
grounds the row asked for.

## 5. Design

The classification frame, one row per command in FINDINGS.md: (a) what it writes (repo,
user home, device, EAS service), (b) whether it needs a device or a build, (c) whether this
repo already owns a better path, (d) whether a hard rule or ban touches it. The options for
her ruling:

- **Option A, status quo.** Route `status` and `smoke --ios` as today. Nothing else. Cheapest,
  gains nothing.
- **Option B, the read-only set (recommended).** Route beside `status`: `doctor` (the re-pin
  and dependency-sweep lanes get expo-doctor's normalized report with exit codes),
  `typecheck` (a fast tsc gate subordinate to `yarn validate`, which stays the gate before
  done), `docs:sync` / `docs:search` (SDK-matched Expo docs grep, user-home cache, beside the
  docs MCP server), and the Expo CLI pair `npx expo command:ps` / `command:events` (lane
  coordination: which dev servers and builds run in which worktree). Bans re-derived and
  widened to the whole `--eas` flag family wherever it appears (`smoke`, `dev`, `navigate`,
  `runtime:stop`, `dev:stop`): the EAS Simulator bills until stopped, a money act. `deploy`,
  `agents:setup`, `skills:sync`, `install`, `new`, `login` / `logout` / `register`,
  `feedback`, `status --explain`, and `smoke --android` while a phone is connected all stay
  out, each with its measured ground (FINDINGS section 4).
- **Option C, generated adoption.** `agents:setup --project --no-plugins --no-agent-skills`
  writes only the AGENTS.md managed block and the docs cache. Rejected: the block's own text
  routes `install --fix` and `deploy` against the hard rules and points every Expo CLI call at
  the agent CLI in the one file every session loads first; a generated block that contradicts
  the owner's rules is worse than no block.

The recommendation argued twice. For B: every added command is read-only against the repo,
needs no device, contradicts no rule, and fills a measured gap (doctor's normalized report at
re-pins; a tsc probe that costs seconds against validate's minutes; SDK-matched docs this
repo currently scrapes or guesses; session visibility across three parallel lanes). Challenge:
does routing four more commands into `ai/AGENTS.md` grow the harness surface she governs?
It does, by four table rows, all read-only, all reversible by deleting a row; against that,
the row's own framing ("which commands earn their place") asks exactly for this
classification, and the bans table lands harder with the flags named per command. B survives.
Flipped-argument check on the strongest rival, C: the block is regenerated by its own tool
and self-documenting, but it is also unpinnable text that contradicts three hard rules at
once; no argument makes a governed instruction file the right place for generated
contradictions. B stands.

**Acceptance criteria:**

- [R1.1] WHEN `npx --yes @expo/agent-cli@1.0.19 --help` runs THE SYSTEM SHALL print every command name FINDINGS.md section 1 lists, and no command name the census omits.
- [R2.1] WHEN the executor reads the CLI source AGENTS array entry for the opencode agent THE SYSTEM SHALL show `skillsDir: '.agents/skills'` with projectMarkers containing `.opencode`, cited by cache path and line.
- [R2.2] WHEN the executor reads the `generateAgentsMdBlock` function THE SYSTEM SHALL show `install --fix`, `deploy` and `lint` among its command lines, cited by cache path and line.
- [R2.3] WHEN the executor reads the `buildInstallerPlans` function THE SYSTEM SHALL show the `skills add expo/skills` command as the installer for the opencode agent, cited by cache path and line.
- [R3.1] WHEN `npx --yes @expo/agent-cli@1.0.19 status` runs in the worktree THE SYSTEM SHALL exit 0 and print lines beginning `project`, `freshness`, `dev server`, `auth` and `next`.
- [R3.2] WHEN `npx --yes @expo/agent-cli@1.0.19 doctor` runs THE SYSTEM SHALL exit 0 or 20 and print the normalized expo-doctor checks with a parse result.
- [R3.3] WHEN `npx --yes @expo/agent-cli@1.0.19 typecheck` runs in the worktree THE SYSTEM SHALL exit 0 with zero diagnostics at the planned uat.
- [R3.4] WHEN `npx expo command:ps` runs THE SYSTEM SHALL print the header row `PID STATUS STARTED COMMAND PROJECT PORT URL` followed by session rows.
- [R3.5] WHEN `npx expo command:events --help` runs THE SYSTEM SHALL print the JSONL replay description beginning "Replays retained events".
- [R3.6] WHEN `npx --yes @expo/agent-cli@1.0.19 docs:search widget` runs THE SYSTEM SHALL print ranked hits, each naming a file path under the local docs cache and a line number, with the cache under `~/.expo/agent-cli/docs` and never inside the repo.
- [R4.1] WHEN the queue row is updated at DONE THE SYSTEM SHALL carry the three options, the recommendation, the bans table with per-ban grounds, and the unverified list.

## 6. Steps

Checklist (all four in this file, inline; the ledger in `LOG.md`):

- [ ] Step 1 census verification (R1.1)
- [ ] Step 2 source pins (R2.1, R2.2, R2.3)
- [ ] Step 3 live read-only runs (R3.1 to R3.6)
- [ ] Step 4 the ruling pack (R4.1)

### Step 1 - census verification

Requirements: R1.1
Weight: 1
Anchor check: all six anchors count 1 (the pre-flight covers them). Goal: the command census at 1.0.19 filed as FINDINGS.md section 1, verified live.
Branch: `docs/119-1-census` off `lane/119`. Files: `ai/plans/119-agent-cli/FINDINGS.md` (new),
`ai/plans/119-agent-cli/LOG.md`, `ai/plans/README.md` (status IN PROGRESS, step 1).
Red tests: none, a docs step; the check is the criterion below. Change contract: run
`npx --yes @expo/agent-cli@1.0.19 --help`, diff its command list against planning's census in
`PLAN.md` section 4; write FINDINGS section 1 as a table with one row per command: name,
group, what it writes, device or build needed, repo-owned path that already covers it, ban
status. Green run: the table covers every command the help prints. Break script: none, a docs
step with no code to break; the done-when gate is the criterion. Version and commit: next
patch after uat's `package.json` under the version lock, message
`<VERSION> - docs(plans): ticket 119 step 1, the 1.0.19 command census`. Review: read the
diff cold against the help output. Merge: `--no-ff` into `uat` under the uat lock. Done when:
R1.1 holds against a fresh `--help` run, the census table complete.

### Step 2 - source pins

Requirements: R2.1, R2.2, R2.3
Weight: 1
Goal: the four load-bearing source facts cited by file and line. Branch: `docs/119-2-source-pins` off `lane/119`. Files: FINDINGS.md section 2,
LOG.md, `ai/plans/README.md` (step 2). Change contract: pin each fact to the cached source:
the opencode `AGENTS` entry (`skillsDir`, markers), the `generateAgentsMdBlock` command list
(`install --fix`, `deploy`, `lint`), the `buildInstallerPlans` installer for opencode, and the
`doctor` `npx expo-doctor` fallback plus `typecheck`'s project-tsc-only resolution; quote each
line verbatim in FINDINGS with the cache path and line number. Green run: every quoted line
greps back from the cache at its cited line. Done when: R2.1 to R2.3 hold. Version and commit
as step 1, message `<VERSION> - docs(plans): ticket 119 step 2, the source pins`.

### Step 3 - live read-only runs

Requirements: R3.1, R3.2, R3.3, R3.4, R3.5, R3.6
Weight: 1
Goal: each allowed live command run once in the worktree, its observed output recorded. Branch: `docs/119-3-live-runs` off `lane/119`. Files:
FINDINGS.md section 3, LOG.md, `ai/plans/README.md` (step 3). Change contract: run the seven
commands of D119.2's allowlist that produce reports (`status`, `doctor`, `typecheck`,
`skills:list`, `docs:search widget`, `npx expo command:ps`, `npx expo command:events
--help`), record each exit code and the load-bearing output lines; never widen the allowlist.
Expected outputs: section 5's criteria carry them. Green run: all seven recorded. Done when:
R3.1 to R3.6 hold, or a divergence is recorded under STOP rules in section 10. Version and
commit as step 1, message `<VERSION> - docs(plans): ticket 119 step 3, the live read-only
runs`.

### Step 4 - the ruling pack

Requirements: R4.1
Weight: 1
Goal: FINDINGS.md section 4 (options, recommendation, bans table with per-ban grounds, unverified list) and the queue row's outcome text applied.
Branch: `docs/119-4-ruling-pack` off `lane/119`. Files: FINDINGS.md section 4, LOG.md,
`ai/plans/README.md` (EXECUTED, the outcome text). Change contract: the bans table names
every command FINDINGS section 1 classifies as out, each with its one-line measured ground;
the unverified list names every release-note claim neither help nor source confirmed. Green
run: the row text carries options A, B, C with B marked recommended. Done when: R4.1 holds.
Version and commit as step 1, message `<VERSION> - docs(plans): ticket 119 executed: the
ruling pack`. Finishing: set EXECUTED, the executed docs commit, merge `--no-ff`, no push.

## 7. Device proof

None. The row's constraint is no device contact and no builds this wave; every command in the
allowlist is read-only against the repo, the user home cache or the npm registry.

## 8. Records

- `LOG.md`: every step entry opens `### Step <NN> — <state>` and ends `session: <id>`;
  planning sections use `## Planning (2026-10-16)` and `## Ticket 119`.
- The queue cell the lead applies on DONE (draft, refined by what execution measured):
  `DONE 2026-10-16, audited: the agent-CLI investigation answers at 1.0.19 (npm latest,
  verified against its own help and bundled source; @expo/cli 58.1.10 for the Expo CLI
  pair): 34 commands classified - status and smoke --ios routed today; the read-only set
  earns a place (doctor's normalized expo-doctor report, typecheck subordinate to yarn
  validate, docs:sync/docs:search SDK-matched in the user-home cache, expo command:ps and
  command:events for lane coordination); every ban re-derived with measured grounds - the
  --eas family (EAS Simulator bills until stopped), deploy (EAS Hosting write and the store
  flow), agents:setup (installs expo/skills into the governed .agents/skills and writes an
  AGENTS.md managed block whose text routes install --fix and deploy against the hard
  rules), skills:sync (same target; a no-op today, no installed package ships skills),
  smoke --android with a phone connected (the device-lock rule), install (ask-first plus the
  install --fix hard ban), status --explain (an EAS service query the row does not need).
  Options for her ruling: A status quo, B the read-only set (recommended), C the generated
  AGENTS.md block (rejected on the measured contradiction). No repo change before her word.`
- Docs commit messages: per step, `<VERSION> - docs(plans): ticket 119 ...` as section 6
  gives them.

## 9. Push

None. The lane never pushes; the orchestrator pushes `uat` when every unpushed commit is
audited.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| `npm view @expo/agent-cli version` answers other than 1.0.19 | STOP, report; the plan re-pins to the new version before any further step |
| `typecheck` exits nonzero with real diagnostics | STOP, report the diagnostics; another lane's landing is mid-flight, never fix it here |
| `doctor` exits 1 (expo-doctor could not run) | Record the failure as a finding, continue; the recommendation degrades to unrouted |
| `docs:search` fails (network or cache) | Record the failure, continue; the docs MCP server stays the Expo docs fallback |
| A live command's output diverges from FINDINGS | STOP per 2.2, report the exact divergence |
| Merge conflict on `ai/plans/README.md` or the three version files | Lane weather: abort, rebase onto uat, keep both lanes' rows and the higher version, retry once, then STOP if it still conflicts |
| The pre-commit hook's `Tests:` line missing or coverage below 100 | Never commit; investigate the hook log first |

Anticipated review fixes, word for word: none expected beyond records wording; any finding
lands in `AUDIT.md` with its verdict.

Restore lists: every step's diff touches only `FINDINGS.md`, `LOG.md` and the queue row on
its own branch; `git checkout lane/119 -- .` inside the worktree restores the prior state,
and an unmerged branch deletes with `git branch -D`.

## 11. Subagents

Planning: fact questions were measured directly by the lane (the CLI's own output is the
primary source); `athan-plan-griller` grills this draft cold. Delivery: the lane executes
all four docs steps itself (D119.6), recorded in LOG.md; the audit dispatches one
`athan-reviewer` blind (the diff plus `ai/AGENTS.md`, re-running the allowlist to reproduce
every number) and one `athan-reviewer` plan-conformance (this folder plus the diff).
`vision` is not needed; no image arises.

## 12. Report to the owner

Plain sentences: the investigation measured the CLI at 1.0.19 and classified every command;
the recommendation is option B, the read-only set; the bans hold with measured grounds and
one widening (the whole `--eas` flag family); agents:setup and skills:sync would write into
the repo's governed `.agents/skills/` and instruction file, and the generated block routes
banned commands, so both stay banned; nothing changes until her word. Then the progress
table, then the handoff block the lane's final return carries.
