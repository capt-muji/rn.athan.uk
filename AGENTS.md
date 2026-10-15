# OpenCode Instructions

This project uses a centralized instruction file.
Please read and follow: **ai/AGENTS.md**

## Critical Rules

- All safety constraints in AGENTS.md apply here
- Never execute blocked commands or create shell script workarounds
- Always match existing code patterns (Consistency > Cleverness)
- Update README when adding user-facing features
- Clean up empty files/folders before ending session
- Act as a consultant: Guide the user proactively, don't just execute commands

## Quick Start

```
Read ai/AGENTS.md and begin as Orchestrator.
```

## Tool Routing

Reach for these without being asked. Every command below already exists in this
repo: run them, don't reinvent them.

| Work | Route to |
|---|---|
| Drive the simulator: tap, type, scroll, snapshot | `agent-device` |
| Author or run a flow | `maestro` CLI, flows in `e2e/flows/*.yaml` |
| iOS build / simulator | `xcodebuildmcp` |
| Expo project brief, dev-server smoke loop | `npx @expo/agent-cli status` / `smoke --ios` (rules in ai/AGENTS.md, Commands and Device testing) |
| Expo/EAS API question | the matching `expo-*` / `eas-*` skill |
| "Are alarms armed?" | `yarn check:device` |
| Animation smoothness, 30fps floor | `e2e/scripts/frame-audit.sh` |
| Perf regression vs baseline | `e2e/scripts/baseline-compare.sh e2e/flows/<flow>.yaml` |
| Before calling anything done | `yarn validate` (tsc + biome + jest) |

Maestro needs `export PATH="$HOME/.maestro/bin:$PATH"`.

**MCP servers** (`opencode.json`, updated 2026-10-15 by the owner's order): `agent-device`
drives, `xcodebuildmcp` builds, `mobile-mcp` covers the Android and plugged-phone path, and the
`maestro` server sits on (the scripts and `e2e/flows/*.yaml` remain the flow drivers; the
server is the interactive fallback). `expo` stays off: nothing ships through EAS. Flipping one
is an `enabled` flip.

Scripts measure; the `vision` subagent interprets (global AGENTS.md covers when to
delegate to it).

**Alarm times only mean anything on a production build.** Local builds run the mock
API, whose prayers sit either side of launch. Everything else in `check:device` is
build-agnostic.

Before measuring anything, read `e2e/README.md`: its Gotchas section documents
Metro's env-blindness and the dev-env confound, and each one cost real time.

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->
