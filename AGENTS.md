# AGENTS.md - Athan.uk

Rules for this repository. The global AGENTS.md owns writing, comments, evidence, delegation
and session hygiene. This file carries only what is specific to Athan.uk.

## Load at the start of every session

1. This file.
2. `opencode.json` (repo root): which MCP servers are wired and enabled.
3. `.agents/skills/`: the Expo and EAS skills, this repo's workflow skills
   (`board-workflow`, `athan-planner`, `athan-lead`), and for React Native code work
   `react-native-best-practices` with the performance rules in `react-native-skills`. The
   delivery workers (`athan-lane`, `athan-executor`, `athan-reviewer`, `athan-plan-griller`)
   are agent files under `.opencode/agents/`, dispatched by the lead or a lane, never loaded
   into the main session. Load the matching skill instead of working from memory.

## Tool routing

Reach for these without being asked.

| Work | Route to |
|---|---|
| Drive the simulator: tap, type, scroll, snapshot | `agent-device` |
| Author or run a flow | `maestro` CLI, flows in `e2e/flows/*.yaml` (the scripts and flows drive, the maestro server is the interactive fallback) |
| iOS build / simulator | `xcodebuildmcp` |
| Expo project brief, dev-server smoke loop | `npx @expo/agent-cli status` / `smoke --ios` |
| Expo dev-server session tables | `npx expo command:ps` / `command:events` |
| Expo/EAS API question | the matching `expo-*` / `eas-*` skill |
| Code structure query | `codegraph` (see the block at the end) |
| "Are alarms armed?" | `yarn check:device` |
| Animation smoothness, 30fps floor | `e2e/scripts/frame-audit.sh` |
| Perf regression vs baseline | `e2e/scripts/baseline-compare.sh e2e/flows/<flow>.yaml` |
| Read or move a ticket on the board | `itsaplan` MCP (see Workflow) |

Scripts measure. The `vision` subagent interprets.

## Workflow

The board is the tickets: a local It's a Plan instance reached through the `itsaplan` MCP,
whose personal key comes from `ITSAPLAN_API_KEY` in the shell and whose deployment lives in
`board/`. Read `.agents/skills/board-workflow/SKILL.md` before touching it: it holds the
columns, the picking rule and the ticket anatomy. Entry to a run is `/athan-next`. The run
closes with `board/snapshot.sh` in the run's last commit.

## Product

Athan.uk: Muslim prayer times for London with a real-time countdown, offline support,
customisable athan notifications, home-screen and lock-screen widgets, and a qibla finder.
London-only, no accounts, no cloud sync. Invariants: the API is the source of truth for
prayer times, the app works fully offline after first sync, and notifications fire on time
while backgrounded.

**Alarm times read what the build carries.** A production build (local or store) serves the
real API's times. A mock build serves the mock data, whose prayers sit either side of launch.
The owner installs both kinds on the phones, so read an alarm reading against the build that
produced it. Everything else in `check:device` is build-agnostic.

## The repository is public to the whole world

- Placeholders for every person- or device-specific value: `3T_SERIAL`, `X8_SERIAL`,
  `S23_SERIAL`, `8T_SERIAL`, `IPHONE_UDID`, `SIMULATOR_UDID`, `TEAM_ID`, `CERT_TEAM_ID`,
  `PHONE_ADDRESS`, `WIFI_NAME`, and `$HOME/...` for home paths. A shortened identifier is
  still an identifier.
- Never write a position, an address or a place name a phone or geocoder reported. Use the
  fixture positions the tests carry. Describe a measurement as indoors, outdoors, one room,
  another room.
- Never commit a device screenshot or recording. Transcribe what was read.
- Write what the owner decided, not how the owner said it. Quote the owner only where the
  exact words are the specification.
- The owner is the owner: never a gendered pronoun for the owner in any record, prose,
  comment, ticket, plan or log.
- A session that finds a file breaking these rules fixes it and tells the owner.

## Hard rules

- Posture is aggressive: fix and report. Update the README when a change adds a user-facing
  feature.
- EAS is read-only: never build on it, never push to it. Reading `EXPO_PUBLIC_ENV` and
  `EXPO_PUBLIC_API_KEY` is the whole permitted use. Builds happen locally.
- Never recreate `releases.json` or any hand-edited release file. Store versions come from
  iTunes Lookup (iOS) and the in-app updates API (Android).
- Code is the documentation: MD files go stale and history lives in git. Only an artefact
  still cited by shipped code or config survives, named in its ticket.
- Version bump on every commit: `package.json`, `app.json` and `android/app/build.gradle`
  together, patch by default, minor when the commit subject is typed `feat`, patch resets at
  a minor. Majors are the owner's alone, behind a recorded order and an entry in
  `scripts/version-major-allowlist.json`. Fetch `origin` first: concurrent sessions have
  taken the same number twice. Bump `app.json` first, then prebuild, then build.
- Qibla is locked: never draw a heading the phone has not vouched for. Android draws only
  Google's fused sensor behind a forced wave, iPhone inside its reported accuracy cone. No
  invented constant, no tuned offset, no per-location calibration, ever.
- Never substitute prayer times: no copying yesterday or tomorrow, no averaging, no
  synthesised value.
- Visuals are settled: fixes change behaviour only. Touch no pixel without the owner's say.
- Animated components first-frame in their settled state. Only value changes animate.
- Tests never read the real clock: mock time before building any seed.
- Full unit coverage of every line a change touches, red before green, mutation pass on
  guarded logic.
- No `npx expo install --fix`: it would roll back the packages this repo runs ahead of
  Expo's pins on purpose. Name every package when upgrading.
- No `console.log` (use the Pino logger), no secrets in git, no edits to `node_modules`, no
  removing failing tests, no CI changes, no shell-script workarounds for blocked commands.
- Upstream posts carry strict anonymity and the PR shape What, Why, How, Testing, with
  intent labels (`suggestion:`, `question:`, `nitpick:`) in review.
- Ask first: installing dependencies, deleting non-empty files, MMKV schema keys,
  notification scheduling logic, `app.json` and `eas.json`.
- Before measuring anything, read `e2e/README.md`: its Gotchas section documents Metro's
  env-blindness and the dev-env confound, and each one cost real time.

## Invariants

- Stack: Jotai state, MMKV storage, Reanimated animation, Expo Router. `@expo/ui` stays
  inside widget layouts. No nested calls as parameters. `useExhaustiveDependencies` is
  disabled only per line, with a reason.
- Prayer times: true UTC instants. Calendar days follow `PRAYER_TIMEZONE`
  (`Europe/London`). A prayer's moment is its row's `datetime`. Extras night times are
  computed from Maghrib and Fajr, never stored. The countdown rounds up (0 seconds never
  displays) and carries no `Platform` check. The Extras order is canonical.
- Notifications: candidates arm whole, in time order, against the 64-request budget, never
  a day count. A reminder never outruns its athan. Channel sound, audio attributes and
  importance are frozen at creation: a new generation means new channel ids and one-time
  legacy deletion. Never: microphone permission, in-app alarm observability
  (`yarn check:device` is it), notification library swap.
- Widgets: the runtime is not React. Modules are statically imported, props are JSON-only
  with a schema version and a `props == null` guard, timeline entries stay within the iOS
  budget. `expo-widgets` and `@expo/ui` are pinned exact. Run the widget runtime load suite
  after any install.

## Commands

- `yarn validate` before calling anything done. `yarn format` for fixes. `yarn test:tz` for
  date work.
- Device builds go through `$HOME/athan-gitree/bin/build-prod.zsh` and
  `$HOME/athan-gitree/bin/build-mock.zsh`, never two at once. Before any install to a phone
  the owner uses, run `aapt2 dump badging <apk> | grep "^package"` and stop if it is not the
  fleettest id (aapt2, never aapt, and check the tool exists first). A genuine `.fleettest`
  install needs the suffix exported inside its own prebuild and build, never passed to it.
  After any install, assert the app is installed for User 0 alone:
  `adb -s <serial> shell dumpsys package <pkg> | grep '^    User '` - Samsung's Dual Messenger
  user (95 on the S23) takes a parallel copy that reads as a second app; strip it with
  `adb -s <serial> shell pm uninstall --user <n> <pkg>` until exactly one user carries the app.
- Maestro needs `export PATH="$HOME/.maestro/bin:$PATH"`.

## Device testing

- Read the device atlas (`e2e/device-atlas-<model>.md`) before driving a phone: measure a
  screen once, write it back, replay after.
- A screenshot reaches a screen. It never proves what is on one: a records claim needs a
  logcat line or a dump.
- `@expo/agent-cli`: the routed reads only: `status`, `smoke --ios`, `doctor`, `typecheck`,
  `docs:sync`, `docs:search`. Never `--eas` (it starts a paid simulator session), `deploy`,
  `agents:setup`, `skills:sync`, `skills:clean`, `install`, `new`, `feedback`,
  `login`/`logout`/`register`/`whoami`, `status --explain` (an EAS service query),
  `--device` (it launches or binds a phone), and never `smoke --android` while a phone is
  connected.

## Worktrees

Verify a leftover branch is merged before deleting it. The build worktrees under
`$HOME/athan-gitree/worktrees/` are Gradle caches, detached and branchless. They stay.

<!-- CODEGRAPH_START -->
## CodeGraph

Reach for `codegraph_explore` (or `codegraph explore "<query>"` in the shell) before grep,
find or file reads when locating or understanding code in this indexed repository.
<!-- CODEGRAPH_END -->
