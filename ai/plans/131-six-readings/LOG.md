# Lane 131 log: expo-location, the six named unverified readings

Resume from: nothing owed at the planning stage; next action is the grill, then READY.

## Ticket 131 (2026-10-17)

Lane worktree `$HOME/athan-gitree/worktrees/lane-131` off `ca73f5a9` (2.0.984).
Scratch worktree for the probe builds: `$HOME/athan-gitree/worktrees/plan-131`
(detached at `ca73f5a9`, never committed, removed at the lane's end).

## Planning (2026-10-17)

- Row 121's DONE cell re-read in full from the queue; its UNVERIFIED list is the
  six readings, re-derived one to one. RD6 is void by row 121's adopt-nothing
  ruling (D131.1).
- /next API surface verified from `node_modules/expo-location` 58.0.17 source:
  `getPosition` options and the `Position` fields, `enableLocationServices`
  (Android-only, GMS in-app dialog claim), `RequestPermissionsAccuracyOption.FULL`
  (the iOS temporary prompt under a reduced grant), the package exports map.
- Classic side verified: `getLastKnownPositionAsync` exists with no JS platform
  guard.
- Build recipes: `$HOME/athan-gitree/BUILD.md` (mock recipe, fleettest suffix,
  aapt2 gate, TMPDIR and env discipline), the XS atlas build rows, the 3T atlas
  dialog rows, e2e/AGENTS.md traps, `shared/logger.ts` (Pino off in prod, on in
  local; devcheck reads tag `ReactNativeJS`).
- Frontier answered agent-ruled: D131.1 to D131.7, PLAN.md section 2.1.
- PLAN.md, steps 1 to 3, `scripts/probe-131.txt`, `scripts/preflight-131.sh`
  and five anchors (each counts 1) written.
- `yarn install` in the lane worktree under `commit.lock` (8.9 s, cached); hooks
  active from the first commit.

session: self (the lane runs every phase itself per D131.5; the grill and the two
review passes are dispatched workers, named below when they run)
