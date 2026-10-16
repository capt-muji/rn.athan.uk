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

The detector (`agent-cli-detector@0.1.7`, transitive in this repo's yarn.lock) officially
detects OpenCode: README table row `opencode`; "OpenCode 1.0.19 and later is detected from
environment variables by default". The CLI's own agent table (`build/cli/2461.index.js`,
the `AGENTS` array) gives the opencode entry `skillsDir: '.agents/skills'`,
`projectMarkers: ['.opencode']`, `homeMarkers: ['.config/opencode']`. This repo matches both
markers: `.opencode/` exists at the root and `~/.config/opencode` exists on this machine.

`agents:setup` for this repo would, in order (from the setup plan lines and
`buildInstallerPlans`, `build/cli/271.index.js`):

1. Run the installer `npx --yes skills add expo/skills --skill '*' --agent opencode --yes`
   (bunx replaces npx when it is on PATH; this machine has none)
   (claude-code gets a Claude plugin and user-scope codex a codex plugin; every other agent,
   opencode included, gets the vercel-labs `skills` CLI writing the expo/skills repository
   into `.agents/skills` - the directory `ai/AGENTS.md:12` names as this repo's governed
   skill set, 157 tracked files across 22 folders).
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

Filled by step 3.

## Section 4 - options, bans, unverified

Filled by step 4.
