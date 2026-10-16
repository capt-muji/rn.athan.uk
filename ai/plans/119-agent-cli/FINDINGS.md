# FINDINGS - ticket 119: the agent CLI at 1.0.19

Version investigated: `@expo/agent-cli` 1.0.19, npm `dist-tags.latest` 2026-10-16 (canary
`1.0.18-canary.0`). The package is not a repo dependency; every `npx @expo/agent-cli` run
fetches `latest`. Expo CLI facts measured against the installed `@expo/cli` 58.1.10.
Help text for 29 commands plus the `stop` alias captured under
`~/athan-gitree/sessions/119/cli-help/` (evidence, dies at DONE); `inspect:build-log`,
`inspect:config-plugins`, `help`, `logout` and `register` rest on their top-level help
lines. Source citations point into the npx cache at
`~/.npm/_npx/5dd0285af1583b84/node_modules/@expo/agent-cli` (the cache the pinned version
runs from).

## Section 1 - the command census

Verified live at execution (step 1, 2026-10-16): `npx --yes @expo/agent-cli@1.0.19 --help`
prints the 35 command names this table covers - the six Develop rows, the four Understand
rows, the nine Debug rows, Create, Deployment, the five Agent-setup rows, the three Learn
rows, Feedback, and the four Account commands - with `stop` printed as `dev:stop`'s alias;
no name the help prints is missing from the table, and the table names nothing the help
omits. The Expo CLI fallback row covers the eleven commands the help lists in prose.

`--help` prints nine group headings plus an Expo CLI fallback list: 35 command names,
of which `stop` is printed as an alias of `dev:stop`, so 34 distinct commands. The workflow
contract (from `help workflow`): exit codes 0 (success), 1 (the tool failed, change the
line), 7 (a person must finish the step), 20 (the outcome failed), 22 (inconclusive, a wait
expired); every report command takes `--json` (one object on stdout, progress on stderr);
every failure prints a recovery line (`Try:`, `Ask the user`, or `Suggested next:`); no
command opens a prompt.

| Command | Group | Writes | Needs device or build | Repo-owned path today | Verdict |
| --- | --- | --- | --- | --- | --- |
| `status` | Understand | own caches under `.expo` (gitignored) | no | routed (`ai/AGENTS.md:27`) | routed today, keep |
| `doctor` | Understand | nothing (spawns expo-doctor; `npx expo-doctor` fallback when the repo has none, cache `build/cli/5565.index.js` comment at `resolveTypeScriptCli`) | no | none (re-pin lanes re-derive checks by hand) | earns a place |
| `inspect:build-log` | Understand | nothing | reads a log file | none | unrouted, no use this wave |
| `inspect:config-plugins` | Understand | nothing (experimental) | no | prebuild flows through the build scripts | unrouted, experimental |
| `typecheck` | Develop | nothing (runs the project's own `tsc --noEmit --pretty false`) | no | `yarn validate` (tsc + Biome + Jest, the gate before done) | earns a place, subordinate to validate |
| `dev` (its `dev:run` action, named by `dev --help`, not by top-level help) | Develop | dev server, prebuild and native build when the plan says | yes (builds) | `build-prod.zsh` / `build-mock.zsh` own device builds; `--plan` variant is read-only | unrouted this wave; `--eas` form banned |
| `dev:logs`, `dev:stop`, `stop` | Develop | stops the project's own dev server | no | lane-local Metro management | unrouted this wave |
| `start` | Develop | dev server plus a skills sync | yes (server) | plain `expo start` exists | unrouted; the skills-sync side effect writes `.agents/skills` |
| `smoke` | Debug | dev server, device boot, dev build when missing, screenshot under `.expo` | yes | routed `smoke --ios` (`ai/AGENTS.md:159`) | routed today; `--eas` banned; `--android` banned while a phone is connected |
| `navigate` | Debug | opens the app on a device | yes | agent-device MCP owns device driving | unrouted |
| `runtime:tree` / `runtime:tap` / `runtime:type` | Debug | nothing (reads the DevTools hook; tap acts on the device) | yes (connected app) | agent-device MCP owns taps and reads | unrouted |
| `runtime:eval` / `runtime:errors` / `runtime:reload` / `runtime:stop` | Debug | reload or stop the app | yes | agent-device, Maestro | unrouted |
| `install` | Develop | package.json, yarn.lock, links skills | no | ask-first rule (`ai/AGENTS.md` Hard rules); `install --fix` is a hard ban | stays out |
| `new` | Create | a new project directory | no | none needed | stays out, no use |
| `deploy` | Deployment | EAS Hosting (web) or the launch.expo.dev store flow | no | none - publishing | banned (EAS write / publishing) |
| `agents:setup` | Agent setup | see section 2 | no | the harness files are owner-governed | banned, grounds in section 2 |
| `skills:sync` | Agent setup | symlinks into `.agents/skills`, refreshes an AGENTS.md index | no | `.agents/skills` is curated, 157 tracked files | banned; a no-op today (section 2) |
| `skills:list` / `skills:show` | Agent setup | nothing | no | none | read-only, available; nothing to list today |
| `skills:clean` | Agent setup | removes the symlinks it created | no | same directory | stays out with sync |
| `help` | Learn | nothing | no | the captured help files | unrouted, read-only |
| `docs:sync` / `docs:search` | Learn | `~/.expo/agent-cli/docs` (user home, never the repo) | no | docs MCP server (scrape-based) | earns a place, SDK-matched |
| `feedback` | Feedback | sends a message to Expo | no | none | stays out (outbound, publishing-adjacent) |
| `login` / `logout` / `register` / `whoami` | Account | the `~/.expo` session shared with expo and eas CLIs | no | EAS read-only rule; `status` already reports auth | stays out |
| `run`, `run:ios`, `run:android`, `prebuild`, `config`, `export`, `export:web`, `export:embed`, `serve`, `customize`, `lint` | Expo CLI fallback | the underlying Expo CLI command | varies | build scripts own prebuild and run; Biome owns lint | unrouted; the fallback adds nothing over `npx expo` |

## Section 2 - what `agents:setup` and `skills:sync` would change in this harness

Pins verified at execution (step 2, 2026-10-16), quoted from the npx cache at
`~/.npm/_npx/5dd0285af1583b84/node_modules/@expo/agent-cli/build/cli`:

- `2461.index.js:1352-1356`, the AGENTS array's opencode entry: `id: 'opencode'`,
  `skillsDir: '.agents/skills'`, `projectMarkers: ['.opencode']`,
  `homeMarkers: ['.config/opencode']`. This repo matches both markers: `.opencode/` sits at
  the root and `~/.config/opencode` exists on this machine.
- `271.index.js:620`, the managed block's opening marker: `<!-- Generated by
  \`npx @expo/agent-cli agents:setup\`. Everything inside the markers is overwritten on the
  next run. -->`.
- `271.index.js:632`, the redirect sentence: "For the operations listed below, use
  `@expo/agent-cli` in place of the equivalent commands elsewhere in this file or in loaded
  skills."
- `271.index.js:643`, `` `install --fix` — fix incompatible package versions using Expo's
  SDK-compatible version resolution ``; `:644` `` `lint` — run the project's Expo lint
  command ``; `:654` `` `new <dir>` / `deploy` — create a project headlessly / deploy web
  and native ``. The first and third collide with this repo's hard rules (`ai/AGENTS.md`
  bans `npx expo install --fix` outright and bans `deploy`); the second names a command this
  repo never uses, Biome owning lint.
- `271.index.js:145-179` (buildInstallerPlans): claude-code gets `claude plugin install
  expo@claude-plugins-official`; user-scope codex gets the codex plugin marketplace; every
  other agent, opencode included, gets `npx --yes skills add expo/skills --skill '*'
  --agent <id> --yes` (bunx replaces npx when on PATH; this machine has none).
- `5565.index.js:316-321`, the resolution comment: "there is deliberately no `npx
  typescript` fallback the way `doctor:check` falls back to `npx expo-doctor`" - and the
  repo's `node_modules/.bin` carries no expo-doctor, so doctor fetches it per run;
  `5565.index.js:322` (`resolveTypeScriptCli`) plus `:307` (`TSC_ARGS`) run the project's
  own `tsc` with `['--noEmit', '--pretty', 'false']` and never fetch a compiler.

The detector (`agent-cli-detector@0.1.7`, transitive in this repo's yarn.lock) officially
detects OpenCode: README table row `opencode`; "OpenCode 1.0.19 and later is detected from
environment variables by default".

`agents:setup` for this repo would, in order (from the setup plan lines and
`buildInstallerPlans`, `build/cli/271.index.js`):

1. Run the installer `npx --yes skills add expo/skills --skill '*' --agent opencode --yes`
   (the vercel-labs `skills` CLI writing the expo/skills repository into `.agents/skills` -
   the directory `ai/AGENTS.md:12` names as this repo's governed skill set, 157 tracked
   files across 22 folders).
2. Write a managed block into the root `AGENTS.md` (the file that today only redirects to
   `ai/AGENTS.md`): the `generateAgentsMdBlock` body wrapped in
   `<!-- Generated by \`npx @expo/agent-cli agents:setup\`. Everything inside the markers is
   overwritten on the next run. -->`. The block's Commands section instructs: "For the
   operations listed below, use `@expo/agent-cli` in place of the equivalent commands
   elsewhere in this file or in loaded skills", and lists `install --fix`, `deploy` and
   `lint` among its commands - this repo hard-bans `npx expo install --fix` (it rolls back
   jest and typescript pins), bans `deploy`, and never uses expo lint (Biome owns lint).
   Setup also "rewrite[s] supported Expo CLI and expo-doctor commands to agent-cli" in the
   target instruction file.
3. Sync package skills into `.agents/skills` (same target as 1).
4. Download the SDK 58 docs to `~/.expo/agent-cli/docs` (user home; this part is harmless
   and is what `docs:sync` does standalone).

`skills:sync` alone links the installed packages' skills into `.agents/skills` and refreshes
an AGENTS.md skill index. Measured today: `npx @expo/agent-cli skills:list` prints "No agent
skills found in the project dependencies." - the sync is a no-op with the current dependency
set, but the moment any installed package ships skills it writes into the governed
directory. `skills:clean` removes only symlinks into node_modules; the committed skill
folders are files, not symlinks, so the ban on `skills:sync` is directory governance, not
cleanup risk.

## Section 3 - live read-only runs (recorded at execution)

All seven allowlist commands run in the worktree on 2026-10-16, working tree at `189a870e`
(2.0.881); exit codes and load-bearing lines recorded verbatim.

| Command | Exit | Observed |
| --- | --- | --- |
| `npx --yes @expo/agent-cli@1.0.19 status` | 0 | `project athan · SDK 58.0.12 · CNG · dev client · no web`; `expo go not compatible (15 reasons)`; `freshness ios local stale · eas unknown / android local stale · eas unknown / no recorded build`; `dev server not running (http://127.0.0.1:8081)`; `device none · iOS: no simulator is bound to this worktree; Android: no emulator instance is bound to this worktree`; `auth mugtaba · per expo whoami`; `next npx @expo/agent-cli dev --ios --detach --wait-ready · No ios device is bound to this worktree.`; `build local · this machine has Xcode — Xcode 27.0` |
| `npx --yes @expo/agent-cli@1.0.19 doctor --json` | 20 | `parse: full`, 16 passed, 4 failed of 20 checks; expo-doctor v1.21.4 fetched per run (the repo carries no expo-doctor binary). The four failures: package.json common issues; "Remove the static app.json, or use its values in your dynamic app.config.js"; the app config schema; packages matching the installed SDK's required versions (this repo runs jest, @types/jest and typescript ahead of Expo's pins on purpose, the class doctor cannot know). One advice line names `npx expo install --check`; the hard rule banning `npx expo install --fix` overrides any advice doctor prints |
| `npx --yes @expo/agent-cli@1.0.19 typecheck` | 0 | `Typecheck no type errors`, `Took 738ms` - the project's own tsc, seconds against `yarn validate`'s minutes |
| `npx --yes @expo/agent-cli@1.0.19 skills:list` | 0 | `No agent skills found in the project dependencies.` |
| `npx --yes @expo/agent-cli@1.0.19 docs:search widget` | 0 | first run auto-synced two bundles (`docs-shared.jsonl.gz`, `docs-v58.0.0.jsonl.gz`) into `~/.expo/agent-cli/docs` (9.9M, user home, nothing inside the repo); ranked hits with file and line, top: `AccessoryWidgetBackground .../v58.0.0/sdk/ui/swift-ui/accessorywidgetbackground.md:10`, `Widgets .../v58.0.0/sdk/widgets.md:11` |
| `npx expo command:ps` | 0 | TSV header `PID STATUS STARTED COMMAND PROJECT PORT URL`, then session rows naming other lanes' worktrees and their commands (cross-lane visibility: it lists every Expo CLI session on the machine) |
| `npx expo command:events --help` | 0 | "Replays retained events from running or stopped sessions as JSONL to stdout, oldest first." |

## Section 4 - options, bans, unverified

### The options for her ruling

- **Option A, status quo.** Route `status` and `smoke --ios`, nothing else. Cost: nothing.
  Gain: nothing. The bans keep their release-note grounds instead of the measured ones.
- **Option B, the read-only set (RECOMMENDED).** Add to the routing table: `doctor`
  (expo-doctor's normalized report, exit-coded, 16-of-20 green today with the four failures
  all advisory and one naming the ahead-of-pin class this repo runs on purpose),
  `typecheck` (the project's own tsc, 738ms today, subordinate to `yarn validate`, which
  stays the gate before done), `docs:sync` / `docs:search` (SDK-matched Expo docs, 9.9M in
  the user-home cache, ranked hits with file and line - beside the docs MCP server, whose
  Expo coverage is scrape-scheduled and version-blind), and `npx expo command:ps` /
  `command:events` (machine-readable session tables that already showed lane 117's
  export:embed runs and a live run:server in the main tree - the orchestrator's and the
  lanes' cross-worktree visibility). All read-only against the repo; all reversible by
  deleting a routing row.
- **Option C, the generated AGENTS.md block.** `agents:setup --project --no-plugins
  --no-agent-skills` writes only the managed block and the docs cache. Rejected: the
  block's own text (section 2's pins) routes `install --fix` and `deploy` against the hard
  rules and points every Expo CLI call at the agent CLI in the one file every session
  loads first. A generated block that contradicts the owner's rules is worse than no
  block; the harness files stay owner-governed per row 107's precedent.

### The bans table (each with its measured ground)

| Banned | Ground |
| --- | --- |
| `deploy` (both forms) | `--web` runs `eas deploy` to EAS Hosting, an EAS write the hard rule forbids; `--native` opens the launch.expo.dev store flow, publishing |
| every `--eas` flag form (`smoke --eas`, `dev --eas`, `navigate --eas`, `runtime:stop --eas`, `runtime:reload --eas`, `dev:stop --eas` and its `stop` alias) | each drives or ends an EAS Simulator session that "bills until stopped" - a money act, the irreversible class |
| `agents:setup` | installs `expo/skills` into `.agents/skills` (the governed directory, 157 tracked files in 22 folders) and writes an AGENTS.md managed block whose text routes `install --fix`, `deploy` and `lint` against the hard rules (section 2's pins) |
| `skills:sync` | same target directory; a no-op today (no installed package ships skills, measured) but writes symlinks and an AGENTS.md index the moment one does |
| `skills:clean` | the counterpart of sync; same directory |
| `smoke --android` while a phone is connected | smoke "boots a device when there is none" and binds what it finds; the fleet phones are device-locked surface |
| `status --explain` | asks the EAS service (network query with credentials) and, with `--device`, launches the app on a phone; the row needs neither |
| `install` | acts on package.json and yarn.lock (ask-first rule); `install --fix` is a hard ban - it rolls back jest, @types/jest and typescript, which this repo runs ahead of Expo's pins on purpose; doctor's advice line naming `npx expo install --check` is data, never a command to run |
| `new`, `feedback`, `login` / `logout` / `register` / `whoami` | no use here; feedback is outbound publishing-adjacent; the account commands touch the `~/.expo` session shared with the EAS CLI, and `status` already reports the auth identity read-only |

### The unverified list

- The EAS CLI dependency: `deploy`'s help names the `eas deploy` subprocess and the account
  commands share the `~/.expo` session, but which eas-cli version the agent CLI bundles or
  fetches is not visible in its help or bundled source. Nothing in the recommendation
  depends on it (deploy stays banned either way).
- "Experimental" as a whole-CLI label: the help marks `inspect:config-plugins`
  `[experimental]` alone; the broader framing comes from the SDK 58 release notes.
- Everything else the ticket's fact list named is verified above: `dev` plans then
  prebuilds, builds or serves (`dev --help`); `smoke`'s nine phases ending in a stop of
  what it started (`smoke --help`); `command:ps` and `command:events` machine-readable in
  the installed `@expo/cli` 58.1.10 (source plus live run).

### What changes in this harness when she says go to option B

Four rows in the `ai/AGENTS.md` routing table and one widened ban line; nothing else. No
package is installed (npx fetches per run), no file outside `ai/AGENTS.md` moves, and the
existing `status` / `smoke --ios` routing keeps its wording.
