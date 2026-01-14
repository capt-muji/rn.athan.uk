# Claude Code Instructions

This project uses a centralized instruction file.
Please read and follow: `docs/ai/AGENTS.md`

## Critical Rules

- All safety constraints in AGENTS.md apply here
- Never execute blocked commands or create shell script workarounds
- Always match existing code patterns (consistency > cleverness)
- Use `@/` imports, never relative imports
- Use `logger` from `@/shared/logger`, never `console.log`
- Clean up empty files/folders before ending session.

## Quick Reference

```bash
yarn start     # Dev server
yarn ios       # iOS simulator
yarn android   # Android emulator
yarn reset     # Full reset
```
