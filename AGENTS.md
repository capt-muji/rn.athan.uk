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
repo — run them, don't reinvent them.

| Work | Route to |
|---|---|
| Drive a device: tap, type, scroll, screenshot | `mobile-mcp` |
| Author or run a flow | `maestro mcp`, flows in `e2e/flows/*.yaml` |
| iOS build / simulator | `xcodebuildmcp` |
| Expo project brief, dev-server smoke loop | `npx @expo/agent-cli status` / `smoke --ios` (rules in ai/AGENTS.md §6) |
| Expo/EAS API question | the matching `expo-*` / `eas-*` skill |
| "Are alarms actually armed?" | `yarn check:device` |
| Animation smoothness, 30fps floor | `e2e/scripts/frame-audit.sh` |
| Perf regression vs baseline | `e2e/scripts/baseline-compare.sh e2e/flows/<flow>.yaml` |
| Before calling anything done | `yarn validate` (tsc + biome + jest) |

Maestro needs `export PATH="$HOME/.maestro/bin:$PATH"`.

Scripts measure; the `vision` subagent interprets (global AGENTS.md covers when to
delegate to it).

**Alarm times only mean anything on a production build.** Local builds run the mock
API, whose prayers sit either side of launch. Everything else in `check:device` is
build-agnostic.

Before measuring anything, read `e2e/README.md` — its Gotchas section documents
Metro's env-blindness and the dev-env confound, and each one cost real time.
