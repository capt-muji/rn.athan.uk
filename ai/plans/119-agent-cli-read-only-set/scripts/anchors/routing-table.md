| Task | Tool |
| --- | --- |
| Drive the simulator or a phone | agent-device MCP |
| iOS build and simulator | xcodebuildmcp MCP |
| Code structure queries | codegraph MCP |
| Author or run a UI flow | maestro CLI, flows in `e2e/flows/` |
| Expo project status and smoke | `npx @expo/agent-cli status` / `smoke --ios` |
| Gate before done | `yarn validate` |
| Local device build | `build-prod.zsh`, `build-mock.zsh` |
| Alarm audit on a phone | `yarn check:device <serial>` |
| Frame audit, perf baseline | `e2e/scripts/frame-audit.sh`, `baseline-compare.sh` |
